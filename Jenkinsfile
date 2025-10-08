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
                            sh 'npm install'
                            sh "npm audit --json > ../${app}-npm-audit.json || true"
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
                            sh "docker build --no-cache -t ${DOCKER_REGISTRY}/${app}:latest ./${app}"
                            sh "docker push ${DOCKER_REGISTRY}/${app}:latest"
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
                        sh "trivy image --exit-code 0 --severity HIGH,CRITICAL ${DOCKER_REGISTRY}/${app}:latest > ${app}-trivy-report.txt || true"
                    }
                }
            }
        }

        stage('Deployment to Test Env') {
            steps {
                script {
                    // Create namespace if it doesn't exist
                    sh "kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"
                    
                    // Delete existing deployments to force redeployment with new images
                    sh "kubectl delete deployment cbs-simulator middleware dashboard -n ${K8S_NAMESPACE} --ignore-not-found=true"
                    
                    // Wait for cleanup
                    sh "sleep 10"
                    
                    // Deploy all services using the complete deployment file
                    sh "kubectl apply -f kubernetes/deploy-all.yaml"
                    
                    // Wait for deployments to be ready
                    def apps = ['cbs-simulator', 'middleware', 'dashboard']
                    apps.each { app ->
                        sh "kubectl rollout status deployment/${app} -n ${K8S_NAMESPACE} --timeout=300s"
                    }
                    
                    // Display service information
                    sh "kubectl get services -n ${K8S_NAMESPACE}"
                    sh "kubectl get pods -n ${K8S_NAMESPACE}"
                    
                    // Verify that new images are being used
                    sh "kubectl describe deployment cbs-simulator -n ${K8S_NAMESPACE} | grep Image"
                    sh "kubectl describe deployment middleware -n ${K8S_NAMESPACE} | grep Image"
                    sh "kubectl describe deployment dashboard -n ${K8S_NAMESPACE} | grep Image"
                }
            }
        }

        stage('Dynamic Security Testing (OWASP ZAP)') {
            steps {
                withCredentials([string(credentialsId: 'owasp-zap-api-key', variable: 'ZAP_API_KEY')]) {
                    sh """
                        sleep 10
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/JSON/spider/action/scan/?apikey=${ZAP_API_KEY}&url=http://${MASTER_IP}:30004" || true
                        sleep 30
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/JSON/ascan/action/scan/?apikey=${ZAP_API_KEY}&url=http://${MASTER_IP}:30004" || true
                        sleep 60
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/OTHER/core/other/htmlreport/?apikey=${ZAP_API_KEY}" -o owasp-zap-report.html || true
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
            archiveArtifacts artifacts: '*-npm-audit.json, *-trivy-report.txt, owasp-zap-report.html, sonarqube-report.txt', fingerprint: true
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
