pipeline {
    agent any

    environment {
        // Docker
        DOCKER_REGISTRY = 'ammariamine'

        // Kubernetes
        K8S_NAMESPACE = 'default'
        KUBECONFIG = '/var/lib/jenkins/.kube/config' // Use admin kubeconfig directly

        // OWASP ZAP
        ZAP_HOST = 'localhost'
        ZAP_PORT = '8090'
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
                    apps.each { app ->
                        sh "docker scout cves ${DOCKER_REGISTRY}/${app}:latest > ${app}-docker-scout-report.txt || true"
                    }
                }
            }
        }

        stage('Deployment to Test Env') {
            steps {
                script {
                    def apps = ['cbs-simulator', 'middleware', 'dashboard']
                    apps.each { app ->
                        sh "kubectl apply -f kubernetes/${app}-deployment.yaml -n ${K8S_NAMESPACE}"
                        sh "kubectl rollout status deployment/${app} -n ${K8S_NAMESPACE}"
                    }
                }
            }
        }

        stage('Dynamic Security Testing (OWASP ZAP)') {
            steps {
                withCredentials([string(credentialsId: 'owasp-zap-api-key', variable: 'ZAP_API_KEY')]) {
                    sh """
                        sleep 10
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/JSON/spider/action/scan/?apikey=${ZAP_API_KEY}&url=http://your-app-url" || true
                        sleep 30
                        curl "http://${ZAP_HOST}:${ZAP_PORT}/JSON/ascan/action/scan/?apikey=${ZAP_API_KEY}&url=http://your-app-url" || true
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
            archiveArtifacts artifacts: '*-npm-audit.json, *-docker-scout-report.txt, owasp-zap-report.html, sonarqube-report.txt', fingerprint: true
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
