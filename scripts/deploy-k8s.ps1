# CBS Core Banking System - Kubernetes Deployment Script
# This script deploys the CBS system to a Kubernetes cluster

param(
    [string]$MasterIP = "192.168.72.128",
    [string]$Worker1IP = "192.168.72.129", 
    [string]$Worker2IP = "192.168.72.130",
    [switch]$Force = $false
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "CBS Core Banking System - K8s Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if kubectl is available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

# Check cluster connectivity
Write-Host "Checking cluster connectivity..." -ForegroundColor Yellow
try {
    $clusterInfo = kubectl cluster-info 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    }
    Write-Host "✓ Connected to cluster" -ForegroundColor Green
} catch {
    Write-Error "Failed to connect to cluster: $_"
    exit 1
}

# Create namespace if it doesn't exist
Write-Host "Creating namespace..." -ForegroundColor Yellow
kubectl apply -f kubernetes/namespace.yaml
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Namespace created/updated" -ForegroundColor Green
} else {
    Write-Error "Failed to create namespace"
    exit 1
}

# Deploy CBS Simulator
Write-Host "Deploying CBS Simulator..." -ForegroundColor Yellow
kubectl apply -f kubernetes/cbs-simulator-deployment.yaml
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ CBS Simulator deployed" -ForegroundColor Green
} else {
    Write-Error "Failed to deploy CBS Simulator"
    exit 1
}

# Wait for CBS Simulator to be ready
Write-Host "Waiting for CBS Simulator to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/cbs-simulator -n cbs-system
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ CBS Simulator is ready" -ForegroundColor Green
} else {
    Write-Warning "CBS Simulator may not be fully ready yet"
}

# Deploy Middleware
Write-Host "Deploying Middleware..." -ForegroundColor Yellow
kubectl apply -f kubernetes/middleware-deployment.yaml
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Middleware deployed" -ForegroundColor Green
} else {
    Write-Error "Failed to deploy Middleware"
    exit 1
}

# Wait for Middleware to be ready
Write-Host "Waiting for Middleware to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/middleware -n cbs-system
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Middleware is ready" -ForegroundColor Green
} else {
    Write-Warning "Middleware may not be fully ready yet"
}

# Deploy Dashboard
Write-Host "Deploying Dashboard..." -ForegroundColor Yellow
kubectl apply -f kubernetes/dashboard-deployment.yaml
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dashboard deployed" -ForegroundColor Green
} else {
    Write-Error "Failed to deploy Dashboard"
    exit 1
}

# Wait for Dashboard to be ready
Write-Host "Waiting for Dashboard to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/dashboard -n cbs-system
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dashboard is ready" -ForegroundColor Green
} else {
    Write-Warning "Dashboard may not be fully ready yet"
}

# Display service information
Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "`nServices:" -ForegroundColor Yellow
kubectl get services -n cbs-system

Write-Host "`nPods:" -ForegroundColor Yellow
kubectl get pods -n cbs-system

Write-Host "`nAccess URLs:" -ForegroundColor Yellow
Write-Host "Dashboard: http://$MasterIP:30004" -ForegroundColor Green
Write-Host "Middleware API: http://$MasterIP:30003" -ForegroundColor Green
Write-Host "CBS Simulator: http://$MasterIP:30001" -ForegroundColor Green

Write-Host "`nHealth Check URLs:" -ForegroundColor Yellow
Write-Host "Dashboard Health: http://$MasterIP:30004/" -ForegroundColor Green
Write-Host "Middleware Health: http://$MasterIP:30003/health" -ForegroundColor Green
Write-Host "CBS Simulator Health: http://$MasterIP:30001/health" -ForegroundColor Green

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# Optional: Test the deployment
$testDeployment = Read-Host "`nWould you like to test the deployment? (y/N)"
if ($testDeployment -eq "y" -or $testDeployment -eq "Y") {
    Write-Host "`nTesting deployment..." -ForegroundColor Yellow
    
    # Test CBS Simulator
    try {
    $cbsResponse = Invoke-RestMethod -Uri "http://$MasterIP:30001/health" -TimeoutSec 10
        Write-Host "✓ CBS Simulator is responding" -ForegroundColor Green
    } catch {
        Write-Warning "✗ CBS Simulator health check failed: $_"
    }
    
    # Test Middleware
    try {
        $middlewareResponse = Invoke-RestMethod -Uri "http://$MasterIP:30003/health" -TimeoutSec 10
        Write-Host "✓ Middleware is responding" -ForegroundColor Green
    } catch {
        Write-Warning "✗ Middleware health check failed: $_"
    }
    
    # Test Dashboard
    try {
        $dashboardResponse = Invoke-WebRequest -Uri "http://$MasterIP:30004/" -TimeoutSec 10
        if ($dashboardResponse.StatusCode -eq 200) {
            Write-Host "✓ Dashboard is responding" -ForegroundColor Green
        }
    } catch {
        Write-Warning "✗ Dashboard health check failed: $_"
    }
}
