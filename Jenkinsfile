pipeline {
agent any
environment {
// Variables d'environnement pour SonarQube
SONAR_SCANNER_HOME = tool 'SonarScanner'
SONAR_HOST_URL = 'http://localhost:9000' // Assurez-vous que SonarQube est accessible depuis Jenkins (utilisez le nom du conteneur ou l'IP si nécessaire, ex: http://sonarqube:9000 si lié par network)
SONAR_LOGIN = credentials('sonarqube-token') // Le token SonarQube (credential de type Secret Text)
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
git branch: 'main', credentialsId: 'jenkins-github', url: 'https://github.com/amineammari/CBS-stimul-.git' // URL corrigée avec le tiret final, confirmée comme valide
}
}
}
stage('Code Quality Analysis (SonarQube)') {
steps {
script {
// Suppression de withSonarQubeEnv pour éviter l'erreur de configuration manquante
// Les params sont passés directement à sonar-scanner
sh """
${SONAR_SCANNER_HOME}/bin/sonar-scanner 
-Dsonar.projectKey=CBS-stimul 
-Dsonar.sources=. 
-Dsonar.host.url=${SONAR_HOST_URL} 
-Dsonar.login=${SONAR_LOGIN}
"""
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
// Assumez Node.js et npm installés sur la VM (sudo apt install -y nodejs npm)
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
// Assumez Docker Scout activé (docker scout quickview pour vérifier)
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
// Exemple avec curl pour appeler l'API ZAP (assumez ZAP démarré avec API activée)
// Remplacez http://your-app-url par l'URL de votre app (ex: http://localhost:3000 pour dashboard)
// Pour un scan basique : spider puis active scan
sh "curl 'http://${ZAP_HOST}:${ZAP_PORT}/JSON/spider/action/scan/?apikey=${ZAP_API_KEY}&url=http://your-app-url'"
sleep 30 // Attendre que le spider finisse (ajustez ou poll status)
sh "curl 'http://${ZAP_HOST}:${ZAP_PORT}/JSON/ascan/action/scan/?apikey=${ZAP_API_KEY}&url=http://your-app-url'"
sleep 60 // Attendre le scan (ajustez)
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