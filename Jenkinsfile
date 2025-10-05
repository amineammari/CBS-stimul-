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
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        /usr/local/bin/sonar-scanner \
                          -Dsonar.projectKey=CBS-stimul \
                          -Dsonar.sources=. \
                          -Dsonar.login=$SONAR_TOKEN
                    '''
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
                    def apps = ['cbs-simulator', 'middleware', 'dashboard']
                    for (app in apps) {
                        dir(app) {
                            sh 'npm install'
                            sh "npm audit --json > ../${app}-npm-audit.json || true"
                        }
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
                        def apps = ['cbs-simulator', 'middleware', 'dashboard']
                        for (app in apps) {
                            sh "docker build -t ${DOCKER_REGISTRY}/${app}:latest ./${app}"
                            sh "docker push ${DOCKER_REGISTRY}/${app}:latest"
                        }
                    }
                }
            }
        }

        stage('Image Security Scan (Docker Scout)') {
            steps {
                script {
                    def apps = ['cbs-simulator', 'middleware', 'dashboard']
                    for (app in apps) {
                        sh "docker scout cves ${DOCKER_REGISTRY}/${app}:latest > ${app}-docker-scout-report.txt || true"
                    }
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
                        def apps = ['cbs-simulator', 'middleware', 'dashboard']
                        for (app in apps) {
                            sh "kubectl --kubeconfig=${KUBECONFIG} apply -f kubernetes/${app}-deployment.yaml -n ${K8S_NAMESPACE}"
                            sh "kubectl --kubeconfig=${KUBECONFIG} rollout status deployment/${app} -n ${K8S_NAMESPACE}"
                        }
                    }
                }
            }
        }

        stage('Dynamic Security Testing (OWASP ZAP)') {
            steps {
                withCredentials([string(credentialsId: 'owasp-zap-api-key', variable: 'ZAP_API_KEY')]) {
                    sh '''
                        sleep 10
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/JSON/spider/action/scan/?apikey=${ZAP_API_KEY}&url=http://your-app-url" || true
                        sleep 30
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/JSON/ascan/action/scan/?apikey=${ZAP_API_KEY}&url=http://your-app-url" || true
                        sleep 60
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/OTHER/core/other/htmlreport/?apikey=${ZAP_API_KEY}" -o owasp-zap-report.html || true
                    '''
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
