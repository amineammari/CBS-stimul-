# CBS Core Banking System - Deployment Script (PowerShell)
# This script deploys the CBS system to your Kubernetes cluster

param(
    [string]$Namespace = "cbs-system"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

Write-Host "🚀 CBS Core Banking System - Deployment Script" -ForegroundColor $Blue
Write-Host "=================================================="

# Function to print status
function Print-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

# Check if kubectl is available
try {
    kubectl version --client | Out-Null
    Print-Status "kubectl is available"
} catch {
    Print-Error "kubectl is not installed or not in PATH"
    exit 1
}

# Check cluster connectivity
Write-Host "🔍 Checking cluster connectivity..." -ForegroundColor $Blue
try {
    kubectl cluster-info | Out-Null
    Print-Status "Connected to Kubernetes cluster"
} catch {
    Print-Error "Cannot connect to Kubernetes cluster"
    exit 1
}

# Check if namespace exists
Write-Host "📦 Checking namespace..." -ForegroundColor $Blue
$namespaceExists = kubectl get namespace $Namespace 2>$null
if ($namespaceExists) {
    Print-Warning "Namespace $Namespace already exists"
} else {
    Write-Host "📦 Creating namespace..." -ForegroundColor $Blue
    kubectl apply -f kubernetes/namespace.yaml
    Print-Status "Namespace $Namespace created"
}

# Deploy all services
Write-Host "🚀 Deploying CBS services..." -ForegroundColor $Blue
kubectl apply -f kubernetes/deploy-all.yaml
Print-Status "All services deployed"

# Wait for deployments to be ready
Write-Host "⏳ Waiting for deployments to be ready..." -ForegroundColor $Blue
$deployments = @("cbs-simulator", "middleware", "dashboard")

foreach ($deployment in $deployments) {
    Write-Host "⏳ Waiting for $deployment..." -ForegroundColor $Blue
    try {
        kubectl rollout status deployment/$deployment -n $Namespace --timeout=300s
        Print-Status "$deployment is ready"
    } catch {
        Print-Error "$deployment deployment failed"
        exit 1
    }
}

# Display service information
Write-Host "📊 Service Information:" -ForegroundColor $Blue
Write-Host "========================"

Write-Host "🔗 Services:" -ForegroundColor $Blue
kubectl get services -n $Namespace

Write-Host "`n📦 Pods:" -ForegroundColor $Blue
kubectl get pods -n $Namespace

Write-Host "`n🚀 Deployments:" -ForegroundColor $Blue
kubectl get deployments -n $Namespace

# Display access URLs
Write-Host "`n🌐 Access URLs:" -ForegroundColor $Green
Write-Host "=================="
Write-Host "Dashboard (Frontend):" -ForegroundColor $Green
Write-Host "  http://192.168.72.128:30004"
Write-Host "  http://192.168.72.129:30004"
Write-Host "  http://192.168.72.130:30004"

Write-Host "`nMiddleware API:" -ForegroundColor $Green
Write-Host "  http://192.168.72.128:30001"
Write-Host "  http://192.168.72.129:30001"
Write-Host "  http://192.168.72.130:30001"

Write-Host "`n📋 Useful Commands:" -ForegroundColor $Green
Write-Host "====================="
Write-Host "View logs: kubectl logs -f deployment/<service-name> -n $Namespace"
Write-Host "Scale service: kubectl scale deployment <service-name> --replicas=3 -n $Namespace"
Write-Host "Delete deployment: kubectl delete -f kubernetes/deploy-all.yaml"

Print-Status "CBS deployment completed successfully! 🎉"
