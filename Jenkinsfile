pipeline {
    agent any

    environment {
        // Docker
        DOCKER_REGISTRY = 'ammariamine'
        DOCKER_CREDENTIALS_ID = 'docker-hub-creds'

        // Kubernetes
        KUBECONFIG_CREDENTIAL_ID = 'kubeconfig-credentials'
        K8S_NAMESPACE = 'default'

        // OWASP ZAP
        ZAP_API_KEY = credentials('owasp-zap-api-key')
        ZAP_HOST = 'localhost'
        ZAP_PORT = '8090' // Updated port
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', credentialsId: 'jenkins-github', url: 'https://github.com/amineammari/CBS-stimul-.git'
            }
        }

        stage('Code Quality Analysis (SonarQube)') {
            environment {
                SONAR_SCANNER_HOME = tool 'SonarQube'
            }
            steps {
                withSonarQubeEnv('SonarQubeLocal') {
                    sh """
                        /usr/local/bin/sonar-scanner \
                          -Dsonar.projectKey=CBS-stimul \
                          -Dsonar.sources=.
                    """
                }
            }
            post {
                always {
                    sh 'echo "SonarQube analysis completed. See results at http://192.168.72.128:9000/dashboard?id=CBS-stimul" > sonarqube-report.txt'
                    archiveArtifacts artifacts: 'sonarqube-report.txt', fingerprint: true
                }
            }
        }

        stage('Dependency Audit (npm audit)') {
            steps {
                script {
                    dir('cbs-simulator') {
                        sh 'npm install'
                        sh 'npm audit --json > ../cbs-simulator-npm-audit.json || true'
                    }
                    dir('middleware') {
                        sh 'npm install'
                        sh 'npm audit --json > ../middleware-npm-audit.json || true'
                    }
                    dir('dashboard') {
                        sh 'npm install'
                        sh 'npm audit --json > ../dashboard-npm-audit.json || true'
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: '*-npm-audit.json', fingerprint: true
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                withDockerRegistry(credentialsId: "${DOCKER_CREDENTIALS_ID}", url: 'https://index.docker.io/v1/') {
                    script {
                        sh "docker build -t ${DOCKER_REGISTRY}/cbs-simulator:latest ./cbs-simulator"
                        sh "docker push ${DOCKER_REGISTRY}/cbs-simulator:latest"

                        sh "docker build -t ${DOCKER_REGISTRY}/middleware:latest ./middleware"
                        sh "docker push ${DOCKER_REGISTRY}/middleware:latest"

                        sh "docker build -t ${DOCKER_REGISTRY}/dashboard:latest ./dashboard"
                        sh "docker push ${DOCKER_REGISTRY}/dashboard:latest"
                    }
                }
            }
        }

        stage('Image Security Scan (Docker Scout)') {
            steps {
                script {
                    sh "docker scout cves ${DOCKER_REGISTRY}/cbs-simulator:latest > cbs-simulator-docker-scout-report.txt || true"
                    sh "docker scout cves ${DOCKER_REGISTRY}/middleware:latest > middleware-docker-scout-report.txt || true"
                    sh "docker scout cves ${DOCKER_REGISTRY}/dashboard:latest > dashboard-docker-scout-report.txt || true"
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: '*-docker-scout-report.txt', fingerprint: true
                }
            }
        }

        stage('Deployment to Test Env') {
            steps {
                withCredentials([file(credentialsId: "${KUBECONFIG_CREDENTIAL_ID}", variable: 'KUBECONFIG')]) {
                    script {
                        sh "kubectl --kubeconfig=${KUBECONFIG} apply -f kubernetes/cbs-simulator-deployment.yaml -n ${K8S_NAMESPACE}"
                        sh "kubectl --kubeconfig=${KUBECONFIG} rollout status deployment/cbs-simulator -n ${K8S_NAMESPACE}"

                        sh "kubectl --kubeconfig=${KUBECONFIG} apply -f kubernetes/middleware-deployment.yaml -n ${K8S_NAMESPACE}"
                        sh "kubectl --kubeconfig=${KUBECONFIG} rollout status deployment/middleware -n ${K8S_NAMESPACE}"

                        sh "kubectl --kubeconfig=${KUBECONFIG} apply -f kubernetes/dashboard-deployment.yaml -n ${K8S_NAMESPACE}"
                        sh "kubectl --kubeconfig=${KUBECONFIG} rollout status deployment/dashboard -n ${K8S_NAMESPACE}"
                    }
                }
            }
        }

        stage('Dynamic Security Testing (OWASP ZAP)') {
            steps {
                sh "sleep 10" // Ensure ZAP daemon is up
                sh "curl 'http://${ZAP_HOST}:${ZAP_PORT}/JSON/spider/action/scan/?apikey=${ZAP_API_KEY}&url=http://your-app-url' || true"
                sh "sleep 30"
                sh "curl 'http://${ZAP_HOST}:${ZAP_PORT}/JSON/ascan/action/scan/?apikey=${ZAP_API_KEY}&url=http://your-app-url' || true"
                sh "sleep 60"
                sh "curl 'http://${ZAP_HOST}:${ZAP_PORT}/OTHER/core/other/htmlreport/?apikey=${ZAP_API_KEY}' -o owasp-zap-report.html || true"
            }
            post {
                always {
                    archiveArtifacts artifacts: 'owasp-zap-report.html', fingerprint: true
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
