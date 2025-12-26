pipeline {
    agent any

    environment {
        // Docker Hub
        DOCKER_REGISTRY = 'ammariamine'

        // Kubernetes
        K8S_NAMESPACE = 'cbs-system'
        KUBECONFIG = '/var/lib/jenkins/.kube/config'

        // Tool Containers (master IP where docker-compose runs)
        SONAR_HOST = 'http://192.168.72.130:9000'
        ZAP_HOST = '192.168.72.130'
        ZAP_PORT = '8090'

        // Cluster Nodes
        MASTER_IP = '192.168.72.130'
        WORKER1_IP = '192.168.72.131'
        WORKER2_IP = '192.168.72.132'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 2, unit: 'HOURS')
        timestamps()
    }

    stages {

        /* ---------------- GIT ---------------- */
        stage('Checkout Code') {
            steps {
                git branch: 'main', credentialsId: 'jenkins-github', url: 'https://github.com/amineammari/CBS-stimul-.git'
            }
        }

        /* ---------------- SONARQUBE IN DOCKER ---------------- */
        stage('Code Quality Analysis (SonarQube)') {
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh """
                        docker run --rm \
                          -v \$(pwd):/src \
                          sonarsource/sonar-scanner-cli \
                          -Dsonar.projectKey=CBS-stimul \
                          -Dsonar.sources=/src \
                          -Dsonar.host.url=${SONAR_HOST} \
                          -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }

        /* ---------------- NPM AUDIT ---------------- */
        stage('Dependency Audit (npm audit)') {
            steps {
                script {
                    def apps = ['cbs-simulator', 'middleware', 'dashboard']
                    apps.each { app ->
                        dir(app) {
                            echo "🔍 Running npm install + audit for ${app}..."
                            sh "npm install --legacy-peer-deps --no-fund --no-audit || true"
                            sh "npm audit --json > ../${app}-npm-audit.json || true"
                        }
                    }
                }
            }
        }

        /* ---------------- DOCKER BUILD & PUSH ---------------- */
        stage('Docker Build & Push') {
            steps {
                withDockerRegistry(credentialsId: 'docker-hub-creds', url: 'https://index.docker.io/v1/') {
                    script {
                        def apps = ['cbs-simulator', 'middleware', 'dashboard']
                        apps.each { app ->
                            echo "Building ${app} image..."
                            if (app == 'dashboard') {
                                sh """
                                    docker build \
                                      -t ${DOCKER_REGISTRY}/${app}:latest \
                                      --build-arg REACT_APP_API_URL=http://${MASTER_IP}:30003 \
                                      ./${app}
                                """
                            } else {
                                sh "docker build -t ${DOCKER_REGISTRY}/${app}:latest ./${app}"
                            }
                            echo "Pushing ${app} to registry..."
                            sh "docker push ${DOCKER_REGISTRY}/${app}:latest"
                        }
                    }
                }
            }
        }

        /* ---------------- TRIVY via DOCKER (HTML REPORT) ---------------- */
        stage('Image Security Scan (Trivy - HTML)') {
            steps {
                script {
                    def apps = ['cbs-simulator', 'middleware', 'dashboard']
                    apps.each { app ->
                        echo "📄 Generating HTML vulnerability report for ${app}..."
                        // Mount workspace into /reports so generated HTML lands in workspace
                        sh """
                            docker run --rm \
                                -v /var/run/docker.sock:/var/run/docker.sock \
                                -v \$(pwd):/reports \
                                aquasec/trivy:latest image \
                                --format template \
                                --template "@/contrib/html.tpl" \
                                -o /reports/${app}-trivy-report.html \
                                ${DOCKER_REGISTRY}/${app}:latest || true
                        """
                        // Fallback: also produce a plain text table if HTML failed (keeps pipeline robust)
                        sh """
                          if [ ! -f ${app}-trivy-report.html ]; then
                              docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v \$(pwd):/reports aquasec/trivy:latest image --format table --no-progress ${DOCKER_REGISTRY}/${app}:latest > ${app}-trivy-report.txt || true
                          fi
                        """
                    }
                }
            }
        }

        /* ---------------- DEPLOYMENT ---------------- */
        stage('Deployment to Test Env') {
            steps {
                script {
                    // Ensure namespace exists
                    sh "kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"
                    // Remove older deployments if exist
                    sh "kubectl delete deployment cbs-simulator middleware dashboard -n ${K8S_NAMESPACE} --ignore-not-found=true"
                    sleep 10
                    // Apply manifests
                    sh "kubectl apply -f kubernetes/deploy-all.yaml"

                    // Wait for rollouts
                    ['cbs-simulator','middleware','dashboard'].each { app ->
                        echo "Waiting rollout for ${app}..."
                        sh "kubectl rollout status deployment/${app} -n ${K8S_NAMESPACE} --timeout=300s"
                    }
                }
            }
        }

        /* ---------------- HEALTH CHECK ---------------- */
        stage('Verify Deployment Health') {
            steps {
                script {
                    sh """
                        echo "Checking HTTP endpoints..."
                        curl -f http://${MASTER_IP}:30003/health || echo "Middleware health check failed"
                        curl -f http://${MASTER_IP}:30004 || echo "Dashboard not reachable"
                        curl -f http://${MASTER_IP}:30005 || echo "Simulator not reachable"
                    """
                }
            }
        }

        /* ---------------- OWASP ZAP via DOCKER CONTAINER ---------------- */
        stage('Dynamic Security Testing (OWASP ZAP)') {
            steps {
                script {
                    echo "=== Starting OWASP ZAP Spider (via running zap daemon) ==="
                    sh """
                        # Spider the dashboard URL
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/JSON/spider/action/scan/?url=http://${MASTER_IP}:30004" || true
                        sleep 30

                        # Active scan (may be slow)
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/JSON/ascan/action/scan/?url=http://${MASTER_IP}:30004" || true
                        # wait longer for active scan to progress (adjust as needed)
                        sleep 90

                        # Generate HTML report from ZAP
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/OTHER/core/other/htmlreport/" -o owasp-zap-report.html || true
                    """
                }
            }
        }
    }

    /* ---------------- POST ACTIONS ---------------- */
    post {
        always {
            echo '=== Pipeline Execution Complete ==='
            archiveArtifacts artifacts: 'cbs-simulator-npm-audit.json, middleware-npm-audit.json, dashboard-npm-audit.json, *-trivy-report.html, owasp-zap-report.html', allowEmptyArchive: true, fingerprint: true

            // Optional: show summary in console
            script {
                sh """
                    echo "=== Deployed resources (namespace: ${K8S_NAMESPACE}) ==="
                    kubectl get all -n ${K8S_NAMESPACE} || true
                """
            }
        }
        success {
            echo '✓ Pipeline completed successfully!'
            echo "Dashboard: http://${MASTER_IP}:30004"
            echo "Middleware: http://${MASTER_IP}:30003"
            echo "Simulator: http://${MASTER_IP}:30005"
        }
        failure {
            echo '✗ Pipeline failed!'
            script {
                sh """
                    echo "=== Final Debug Info ==="
                    kubectl get pods -n ${K8S_NAMESPACE} -o wide || true
                    kubectl get events -n ${K8S_NAMESPACE} --sort-by='.lastTimestamp' | tail -n 50 || true
                """
            }
        }
    }
}
