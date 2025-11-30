pipeline {
    agent any

    environment {
        // Docker Hub
        DOCKER_REGISTRY = 'ammariamine'

        // Kubernetes
        K8S_NAMESPACE = 'cbs-system'
        KUBECONFIG = '/var/lib/jenkins/.kube/config'

        // Tool Containers
        SONAR_HOST = 'http://192.168.72.162:9000'
        ZAP_HOST = '192.168.72.162'
        ZAP_PORT = '8090'

        // Cluster Nodes
        MASTER_IP = '192.168.72.162'
        WORKER1_IP = '192.168.72.163'
        WORKER2_IP = '192.168.72.164'
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

                            sh "docker push ${DOCKER_REGISTRY}/${app}:latest"
                        }
                    }
                }
            }
        }

        /* ---------------- TRIVY via DOCKER ---------------- */
        stage('Image Security Scan (Trivy)') {
            steps {
                script {
                    def apps = ['cbs-simulator', 'middleware', 'dashboard']
                    apps.each { app ->
                        sh """
                            docker run --rm \
                                -v /var/run/docker.sock:/var/run/docker.sock \
                                aquasec/trivy image \
                                --severity HIGH,CRITICAL \
                                ${DOCKER_REGISTRY}/${app}:latest \
                                > ${app}-trivy-report.txt || true
                        """
                    }
                }
            }
        }

        /* ---------------- DEPLOYMENT ---------------- */
        stage('Deployment to Test Env') {
            steps {
                script {
                    sh "kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"
                    sh "kubectl delete deployment cbs-simulator middleware dashboard -n ${K8S_NAMESPACE} --ignore-not-found=true"
                    sh "sleep 10"
                    sh "kubectl apply -f kubernetes/deploy-all.yaml"

                    ['cbs-simulator','middleware','dashboard'].each { app ->
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
                        curl -f http://${MASTER_IP}:30003/health || true
                        curl -f http://${MASTER_IP}:30004 || true
                        curl -f http://${MASTER_IP}:30005 || true
                    """
                }
            }
        }

        /* ---------------- OWASP ZAP via DOCKER CONTAINER ---------------- */
        stage('Dynamic Security Testing (OWASP ZAP)') {
            steps {
                script {
                    echo "=== Starting OWASP ZAP Spider ==="

                    sh """
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/JSON/spider/action/scan/?url=http://${MASTER_IP}:30004" || true
                        sleep 30

                        curl "http://${ZAP_HOST}:${ZAP_PORT}/JSON/ascan/action/scan/?url=http://${MASTER_IP}:30004" || true
                        sleep 60

                        curl "http://${ZAP_HOST}:${ZAP_PORT}/OTHER/core/other/htmlreport/" -o owasp-zap-report.html || true
                    """
                }
            }
        }
    }

    /* ---------------- POST ACTIONS ---------------- */
    post {
        always {
            archiveArtifacts artifacts: '*-npm-audit.json, *-trivy-report.txt, owasp-zap-report.html', allowEmptyArchive: true
        }
        success { echo "Pipeline completed successfully!" }
        failure { echo "Pipeline failed!" }
    }
}
