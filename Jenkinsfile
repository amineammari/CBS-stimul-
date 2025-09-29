pipeline {
    agent any

    environment {
        // Variables d'environnement pour Docker
        DOCKER_REGISTRY = 'ammariamine' // Votre username Docker Hub
        DOCKER_CREDENTIALS_ID = 'docker-hub-creds' // Credential pour Docker Hub (username/password)

        // Variables d'environnement pour Kubernetes
        KUBECONFIG_CREDENTIAL_ID = 'kubeconfig-credentials' // Credential de type 'Secret file' avec le contenu de ~/.kube/config
        K8S_NAMESPACE = 'default'

        // Variables pour OWASP ZAP
        ZAP_API_KEY = credentials('owasp-zap-api-key') // Le API key pour ZAP (credential de type Secret Text)
        ZAP_HOST = 'localhost' // Host où ZAP écoute (ajustez si conteneur)
        ZAP_PORT = '8081'
    }

    stages {
        stage('Checkout Code') {
            steps {
                script {
                    git branch: 'main', credentialsId: 'jenkins-github', url: 'https://github.com/amineammari/CBS-stimul-.git' // URL confirmée avec tiret final
                }
            }
        }

        stage('Code Quality Analysis (SonarQube)') {
            environment {
                SONAR_SCANNER_HOME = tool 'SonarScanner'
            }
            steps {
                script {
                    // Utilisez withSonarQubeEnv pour injecter le token et l'URL configurés globalement
                    withSonarQubeEnv('SonarQube') { // 'SonarQube' doit être le nom configuré dans Manage Jenkins > Configure System > SonarQube servers
                        sh """
                            ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
                                -Dsonar.projectKey=CBS-stimul \
                                -Dsonar.sources=.
                        """
                    }
                }
            }
            post {
                always {
                    sh 'echo "SonarQube analysis completed. See results at http://192.168.72.128:9000/dashboard?id=CBS-stimul" > sonarqube-report.txt'
                    archiveArtifacts artifacts: 'sonarqube-report.txt', fingerprint: true
                }
            }
        }

        // Les autres stages restent inchangées...

        stage('Dependency Audit (npm audit)') {
            steps {
                script {
                    dir('cbs-simulator') {
                        sh 'npm install'
                        sh 'npm audit --json > ../cbs-simulator-npm-audit.json'
                    }
                    dir('middleware') {
                        sh 'npm install'
                        sh 'npm audit --json > ../middleware-npm-audit.json'
                    }
                    dir('dashboard') {
                        sh 'npm install'
                        sh 'npm audit --json > ../dashboard-npm-audit.json'
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
                script {
                    withDockerRegistry(credentialsId: "${DOCKER_CREDENTIALS_ID}", url: 'https://index.docker.io/v1/') {
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
                    sh "docker scout cve ${DOCKER_REGISTRY}/cbs-simulator:latest --output cbs-simulator-docker-scout-report.txt"
                    sh "docker scout cve ${DOCKER_REGISTRY}/middleware:latest --output middleware-docker-scout-report.txt"
                    sh "docker scout cve ${DOCKER_REGISTRY}/dashboard:latest --output dashboard-docker-scout-report.txt"
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
                script {
                    withCredentials([file(credentialsId: "${KUBECONFIG_CREDENTIAL_ID}", variable: 'KUBECONFIG')]) {
                        sh "kubectl --kubeconfig=${KUBECONFIG} apply -f kubernetes/cbs-simulator-deployment.yaml -n ${K8S_NAMESPACE}"
                        sh "kubectl --kubeconfig=${KUBECONFIG} apply -f kubernetes/middleware-deployment.yaml -n ${K8S_NAMESPACE}"
                        sh "kubectl --kubeconfig=${KUBECONFIG} apply -f kubernetes/dashboard-deployment.yaml -n ${K8S_NAMESPACE}"
                        
                        sh "kubectl --kubeconfig=${KUBECONFIG} rollout status deployment/cbs-simulator -n ${K8S_NAMESPACE}"
                        sh "kubectl --kubeconfig=${KUBECONFIG} rollout status deployment/middleware -n ${K8S_NAMESPACE}"
                        sh "kubectl --kubeconfig=${KUBECONFIG} rollout status deployment/dashboard -n ${K8S_NAMESPACE}"
                    }
                }
            }
        }

        stage('Dynamic Security Testing (OWASP ZAP)') {
            steps {
                script {
                    sh "curl 'http://${ZAP_HOST}:${ZAP_PORT}/JSON/spider/action/scan/?apikey=${ZAP_API_KEY}&url=http://your-app-url'"
                    sleep 30
                    sh "curl 'http://${ZAP_HOST}:${ZAP_PORT}/JSON/ascan/action/scan/?apikey=${ZAP_API_KEY}&url=http://your-app-url'"
                    sleep 60
                    sh "curl 'http://${ZAP_HOST}:${ZAP_PORT}/OTHER/core/other/htmlreport/?apikey=${ZAP_API_KEY}' -o owasp-zap-report.html"
                }
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

