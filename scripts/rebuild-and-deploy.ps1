# CBS Core Banking System - Rebuild and Deploy Script (PowerShell)
# This script rebuilds the Docker images and redeploys to Kubernetes

param(
    [string]$DockerRegistry = "ammariamine",
    [string]$Namespace = "cbs-system"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

Write-Host "🔨 CBS Core Banking System - Rebuild and Deploy" -ForegroundColor $Blue
Write-Host "======================================================"

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

# Check if Docker is running
try {
    docker info | Out-Null
    Print-Status "Docker is running"
} catch {
    Print-Error "Docker is not running"
    exit 1
}

# Build and push images
Write-Host "🐳 Building and pushing Docker images..." -ForegroundColor $Blue

$services = @("cbs-simulator", "middleware", "dashboard")

foreach ($service in $services) {
    Write-Host "🔨 Building $service..." -ForegroundColor $Blue
    
    # Build the image
    docker build -t "${DockerRegistry}/${service}:latest" "./${service}"
    
    # Push the image
    Write-Host "📤 Pushing $service..." -ForegroundColor $Blue
    docker push "${DockerRegistry}/${service}:latest"
    
    Print-Status "$service image built and pushed"
}

# Delete existing deployments to force recreation
Write-Host "🗑️  Deleting existing deployments..." -ForegroundColor $Blue
kubectl delete -f kubernetes/deploy-all.yaml --ignore-not-found=true

# Wait a moment for cleanup
Start-Sleep -Seconds 5

# Deploy the updated services
Write-Host "🚀 Deploying updated services..." -ForegroundColor $Blue
kubectl apply -f kubernetes/deploy-all.yaml

# Wait for deployments to be ready
Write-Host "⏳ Waiting for deployments to be ready..." -ForegroundColor $Blue
foreach ($service in $services) {
    Write-Host "⏳ Waiting for $service..." -ForegroundColor $Blue
    try {
        kubectl rollout status deployment/$service -n $Namespace --timeout=300s
        Print-Status "$service is ready"
    } catch {
        Print-Error "$service deployment failed"
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

Print-Status "CBS rebuild and deployment completed successfully! 🎉"
