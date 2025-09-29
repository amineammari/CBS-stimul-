pipeline {
    agent any

    tools {
        nodejs 'NodeJS' // Assurez-vous d'avoir configuré un outil NodeJS dans Jenkins Global Tool Configuration
    }

    environment {
        // Variables d'environnement pour SonarQube
        SONAR_SCANNER_HOME = tool 'SonarScanner'
        SONAR_HOST_URL = 'http://localhost:9000' // Modifié en localhost car SonarQube est un conteneur Docker local ; ajustez si nécessaire (par ex., via docker network ou port mapping)
        SONAR_LOGIN = credentials('sonarqube-token') // Correspond au credential dans la capture d'écran

        // Variables d'environnement pour Docker
        DOCKER_REGISTRY = 'ammariamine' // Simplifié pour Docker Hub ; préfixe 'docker.io/' non nécessaire pour le registry
        DOCKER_CREDENTIALS_ID = 'docker-hub-creds' // Correspond au credential dans la capture d'écran (note : c'est 'docker-hub-creds', pas 'docker-hub-credentials' comme dans le code original)

        // Variables d'environnement pour Kubernetes
        KUBECONFIG_CREDENTIAL_ID = 'kubeconfig-credentials' // Décommentez et configurez ce credential dans Jenkins (fichier kubeconfig uploadé comme credential de type 'Secret file')
        K8S_NAMESPACE = 'default'

        // Variables pour OWASP ZAP
        ZAP_API_KEY = credentials('owasp-zap-api-key') // Correspond au credential dans la capture d'écran
        ZAP_HOST = 'localhost' // Assurez-vous que le conteneur ZAP est mappé sur ce port et accessible depuis Jenkins
        ZAP_PORT = '8081'
    }

    stages {
        stage('Checkout Code') {
            steps {
                script {
                    git branch: 'main', credentialsId: 'jenkins-github', url: 'https://github.com/amineammari/CBS-stimul-.git' // URL corrigée (supposition basée sur le nom ; veuillez confirmer l'URL exacte)
                }
            }
        }

        stage('Code Quality Analysis (SonarQube)') {
            steps {
                script {
                    // Pour un projet Node.js multi-modules, analysez chaque module séparément ou configurez un sonar-project.properties pour multi-modules
                    // Ici, analyse globale ; ajoutez -Dsonar.language=js si nécessaire, mais Sonar détecte automatiquement
                    withSonarQubeEnv(credentialsId: 'sonarqube-token', installationName: 'SonarQube') {
                        sh """
                            ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
                                -Dsonar.projectKey=CBS-stimul \
                                -Dsonar.sources=. \
                                -Dsonar.host.url=${SONAR_HOST_URL} \
                                -Dsonar.login=${SONAR_LOGIN}
                        """
                    }
                }
            }
            post {
                always {
                    sh 'echo "SonarQube analysis completed. See results at ${SONAR_HOST_URL}/dashboard?id=CBS-stimul" > sonarqube-report.txt'
                    archiveArtifacts artifacts: 'sonarqube-report.txt', fingerprint: true
                }
            }
        }

        stage('Dependency Audit (npm audit)') {
            steps {
                script {
                    // Utilisez l'outil NodeJS pour garantir que npm est disponible
                    // Assumez que les répertoires existent ; npm install est nécessaire pour générer package-lock.json si absent
                    dir('cbs-simulator') {
                        nodejs(nodeJSInstallationName: 'NodeJS') {
                            sh 'npm install'
                            sh 'npm audit --json > ../cbs-simulator-npm-audit.json'
                        }
                    }
                    dir('middleware') {
                        nodejs(nodeJSInstallationName: 'NodeJS') {
                            sh 'npm install'
                            sh 'npm audit --json > ../middleware-npm-audit.json'
                        }
                    }
                    dir('dashboard') {
                        nodejs(nodeJSInstallationName: 'NodeJS') {
                            sh 'npm install'
                            sh 'npm audit --json > ../dashboard-npm-audit.json'
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
                script {
                    // Utilisez withDockerRegistry pour gérer le login/push de manière sécurisée
                    withDockerRegistry(credentialsId: "${DOCKER_CREDENTIALS_ID}", url: 'https://index.docker.io/v1/') {
                        // Construire et push pour chaque image ; assumez que les Dockerfiles existent dans les répertoires respectifs
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
                    // Commandes réelles pour Docker Scout (assumez que 'docker scout' est disponible dans le CLI Docker sur l'agent Jenkins)
                    // Si Docker Scout est un conteneur séparé, utilisez 'docker run' pour l'exécuter
                    // Exemple : scan pour CVE et sortie en texte ; ajustez pour SARIF ou autre format si needed
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
                    // Déployer d'abord dans un namespace de test pour permettre le scan DAST
                    withCredentials([file(credentialsId: "${KUBECONFIG_CREDENTIAL_ID}", variable: 'KUBECONFIG')]) {
                        sh "kubectl --kubeconfig=${KUBECONFIG} apply -f kubernetes/cbs-simulator-deployment.yaml -n ${K8S_NAMESPACE}"
                        sh "kubectl --kubeconfig=${KUBECONFIG} apply -f kubernetes/middleware-deployment.yaml -n ${K8S_NAMESPACE}"
                        sh "kubectl --kubeconfig=${KUBECONFIG} apply -f kubernetes/dashboard-deployment.yaml -n ${K8S_NAMESPACE}"
                        
                        // Attendre que les déploiements soient prêts (ajoutez un timeout ou un meilleur wait si nécessaire)
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
                    // Assumez que ZAP est en mode API (démarré avec -config api.disablekey=false -config api.key=${ZAP_API_KEY})
                    // et que l'app est accessible via une URL locale (ex: via NodePort ou port-forward)
                    // Vous devez port-forward les services K8s ou utiliser des ingresses pour exposer les URLs
                    // Exemple simplifié : utilisez zap-cli (installez-le via pip dans l'agent si nécessaire)
                    // Remplacez 'http://your-app-url' par l'URL réelle de l'app déployée (ex: http://localhost:3000 pour dashboard)
                    sh 'zap-cli --zap-url http://${ZAP_HOST}:${ZAP_PORT} --api-key ${ZAP_API_KEY} quick-scan --self-contained --start-options "-config api.disablekey=false" http://your-app-url'
                    sh 'zap-cli --zap-url http://${ZAP_HOST}:${ZAP_PORT} --api-key ${ZAP_API_KEY} report -o owasp-zap-report.html -f html'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'owasp-zap-report.html', fingerprint: true
                }
            }
        }
    }
    // fake commentaire pour test

    post {
        always {
            echo 'Pipeline finished.'
        }
        failure {
            echo 'Pipeline failed.'
            // Ajoutez emailext ou slackSend pour notifications si plugins configurés
        }
    }
}
