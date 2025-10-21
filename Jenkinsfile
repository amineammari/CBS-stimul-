pipeline {
    agent any

    environment {
        // Docker
        DOCKER_REGISTRY = 'ammariamine'

        // Kubernetes
        K8S_NAMESPACE = 'cbs-system'
        KUBECONFIG = '/var/lib/jenkins/.kube/config'

        // OWASP ZAP
        ZAP_HOST = '192.168.72.128'
        ZAP_PORT = '8090'
        
        // Cluster IPs
        MASTER_IP = '192.168.72.128'
        WORKER1_IP = '192.168.72.129'
        WORKER2_IP = '192.168.72.130'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 2, unit: 'HOURS')
        timestamps()
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', credentialsId: 'jenkins-github', url: 'https://github.com/amineammari/CBS-stimul-.git'
            }
        }

        stage('Code Quality Analysis (SonarQube)') {
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh """
                        /usr/local/bin/sonar-scanner \
                          -Dsonar.projectKey=CBS-stimul \
                          -Dsonar.sources=. \
                          -Dsonar.login=$SONAR_TOKEN
                    """
                }
            }
        }

        stage('Dependency Audit (npm audit)') {
            steps {
                script {
                    def apps = ['cbs-simulator', 'middleware', 'dashboard']
                    apps.each { app ->
                        dir(app) {
                            echo "🔍 Running npm audit for ${app}..."
                            sh 'npm install --no-audit --no-fund'
                            sh "npm audit --json > ../${app}-npm-audit.json || true"
                            sh "npm audit --audit-level=high || true"
                        }
                    }
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                withDockerRegistry(credentialsId: 'docker-hub-creds', url: 'https://index.docker.io/v1/') {
                    script {
                        def apps = ['cbs-simulator', 'middleware', 'dashboard']
                        apps.each { app ->
                            echo "Building ${app}..."
                            if (app == 'dashboard') {
                                // Pass REACT_APP_API_URL as build-arg for React (use NodePort for external access)
                                sh """
                                    docker build --no-cache \
                                        -t ${DOCKER_REGISTRY}/${app}:latest \
                                        --build-arg REACT_APP_API_URL=http://${MASTER_IP}:30003 \
                                        ./${app}
                                """
                            } else {
                                sh """
                                    docker build --no-cache \
                                        -t ${DOCKER_REGISTRY}/${app}:latest \
                                        ./${app}
                                """
                            }
                            echo "Testing ${app} image locally..."
                            sh "docker run --rm -d --name test-${app} -p 8080:80 ${DOCKER_REGISTRY}/${app}:latest || true"
                            sh "sleep 5"
                            sh "curl -f http://localhost:8080 || echo 'Health check failed'"
                            sh "docker stop test-${app} || true"
                            sh "docker rm test-${app} || true"
                            echo "Pushing ${app}..."
                            sh "docker push ${DOCKER_REGISTRY}/${app}:latest"
                            echo "✓ ${app} built and pushed successfully"
                        }
                    }
                }
            }
        }


        stage('Image Security Scan (Trivy)') {
            steps {
                script {
                    def apps = ['cbs-simulator', 'middleware', 'dashboard']
                    apps.each { app ->
                        echo "🔍 Scanning ${app} for vulnerabilities..."
                        sh "trivy image --exit-code 0 --severity HIGH,CRITICAL ${DOCKER_REGISTRY}/${app}:latest > ${app}-trivy-report.txt || true"
                    }
                }
            }
        }

        stage('Deployment to Test Env') {
            steps {
                script {
                    try {
                        echo "=== Creating/Verifying Namespace ==="
                        sh "kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"
                        
                        echo "=== Deleting Existing Deployments ==="
                        sh "kubectl delete deployment cbs-simulator middleware dashboard -n ${K8S_NAMESPACE} --ignore-not-found=true"
                        
                        echo "=== Waiting for Pod Termination ==="
                        sh "sleep 15"
                        
                        echo "=== Applying New Deployments ==="
                        sh "kubectl apply -f kubernetes/deploy-all.yaml"
                        
                        echo "=== Waiting for Deployments to be Ready ==="
                        def apps = ['cbs-simulator', 'middleware', 'dashboard']
                        apps.each { app ->
                            echo "Checking rollout status for: ${app}"
                            timeout(time: 6, unit: 'MINUTES') {
                                sh "kubectl rollout status deployment/${app} -n ${K8S_NAMESPACE} --timeout=300s"
                            }
                            echo "✓ ${app} deployment successful"
                        }
                        
                        echo "=== Deployment Summary ==="
                        sh """
                            echo "Services:"
                            kubectl get services -n ${K8S_NAMESPACE}
                            echo ""
                            echo "Pods:"
                            kubectl get pods -n ${K8S_NAMESPACE} -o wide
                            echo ""
                            echo "Images in use:"
                            kubectl get deployments -n ${K8S_NAMESPACE} -o jsonpath='{range .items[*]}{.metadata.name}{": "}{.spec.template.spec.containers[0].image}{"\\n"}{end}'
                        """
                    } catch (Exception e) {
                        echo "=== DEPLOYMENT FAILED - Gathering Debug Information ==="
                        sh """
                            echo "=== All Resources in Namespace ==="
                            kubectl get all -n ${K8S_NAMESPACE} || true
                            echo ""
                            echo "=== Deployment Details ==="
                            kubectl describe deployments -n ${K8S_NAMESPACE} || true
                            echo ""
                            echo "=== Pod Details ==="
                            kubectl describe pods -n ${K8S_NAMESPACE} || true
                            echo ""
                            echo "=== Recent Events ==="
                            kubectl get events -n ${K8S_NAMESPACE} --sort-by='.lastTimestamp' --field-selector type!=Normal || true
                            echo ""
                            echo "=== Pod Logs ==="
                            for pod in \$(kubectl get pods -n ${K8S_NAMESPACE} -o jsonpath='{.items[*].metadata.name}'); do
                                echo "--- Logs for \$pod ---"
                                kubectl logs \$pod -n ${K8S_NAMESPACE} --tail=100 --all-containers=true || true
                                echo ""
                            done
                            echo ""
                            echo "=== Node Status ==="
                            kubectl top nodes || true
                            kubectl describe nodes || true
                        """
                        error("Deployment failed: ${e.message}")
                    }
                }
            }
        }

        stage('Verify Deployment Health') {
            steps {
                script {
                    echo "=== Verifying Application Health ==="
                    sh """
                        sleep 15
                        RUNNING_PODS=\$(kubectl get pods -n ${K8S_NAMESPACE} --field-selector=status.phase=Running --no-headers | wc -l)
                        TOTAL_PODS=\$(kubectl get pods -n ${K8S_NAMESPACE} --no-headers | wc -l)
                        echo "Running Pods: \$RUNNING_PODS / \$TOTAL_PODS"
                        if [ "\$RUNNING_PODS" -eq 0 ]; then
                            echo "ERROR: No pods are running!"
                            exit 1
                        fi
                        echo ""
                        echo "Testing service endpoints..."
                        curl -f -s -o /dev/null -w "Dashboard (port 30004): HTTP %{http_code}\\n" http://${MASTER_IP}:30004 || echo "Dashboard: Not accessible"
                        curl -f -s -o /dev/null -w "Middleware (port 30003): HTTP %{http_code}\\n" http://${MASTER_IP}:30003 || echo "Middleware: Not accessible"
                        curl -f -s -o /dev/null -w "Middleware Health: HTTP %{http_code}\\n" http://${MASTER_IP}:30003/health || echo "Middleware /health: Not accessible"
                        curl -f -s -o /dev/null -w "Simulator (port 30005): HTTP %{http_code}\\n" http://${MASTER_IP}:30005 || echo "Simulator: Not accessible"
                    """
                }
            }
        }

        stage('Dynamic Security Testing (OWASP ZAP)') {
            steps {
                script {
                    try {
                        withCredentials([string(credentialsId: 'owasp-zap-api-key', variable: 'ZAP_API_KEY')]) {
                            echo "=== Starting OWASP ZAP Security Scan ==="
                            sh "sleep 10"
                            echo "Initiating spider scan..."
                            sh "curl 'http://${ZAP_HOST}:${ZAP_PORT}/JSON/spider/action/scan/?apikey=${ZAP_API_KEY}&url=http://${WORKER1_IP}:30004' || true"
                            sh "sleep 30"
                            echo "Initiating active scan..."
                            sh "curl 'http://${ZAP_HOST}:${ZAP_PORT}/JSON/ascan/action/scan/?apikey=${ZAP_API_KEY}&url=http://${WORKER1_IP}:30004' || true"
                            sh "sleep 60"
                            echo "Generating report..."
                            sh "curl 'http://${ZAP_HOST}:${ZAP_PORT}/OTHER/core/other/htmlreport/?apikey=${ZAP_API_KEY}' -o owasp-zap-report.html || true"
                        }
                    } catch (Exception e) {
                        echo "OWASP ZAP scan failed: ${e.message}"
                        echo "Continuing pipeline execution..."
                    }
                }
            }
        }
    }

    post {
        always {
            echo '=== Pipeline Execution Complete ==='
            script {
                archiveArtifacts artifacts: '*-npm-audit.json, *-trivy-report.txt, owasp-zap-report.html', allowEmptyArchive: true, fingerprint: true
                sh """
                    echo "Final Deployment Status:"
                    kubectl get all -n ${K8S_NAMESPACE} || true
                """
            }
        }
        success {
            echo '✓ Pipeline completed successfully!'
            echo '=== Access URLs ==='
            echo "Dashboard: http://${MASTER_IP}:30004"
            echo "Middleware: http://${MASTER_IP}:30003"
            echo "Simulator: http://${MASTER_IP}:30005"
        }
        failure {
            echo '✗ Pipeline failed!'
            script {
                sh """
                    echo "=== Final Debug Information ==="
                    kubectl get pods -n ${K8S_NAMESPACE} -o wide || true
                    kubectl get events -n ${K8S_NAMESPACE} --sort-by='.lastTimestamp' | tail -20 || true
                """
            }
        }
        unstable {
            echo '⚠ Pipeline completed with warnings'
        }
    }
}
