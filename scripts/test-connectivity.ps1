# CBS Core Banking System - Network Connectivity Test Script
# This script tests communication between all components in the cluster

param(
    [string]$MasterIP = "192.168.72.128",
    [string]$Worker1IP = "192.168.72.129", 
    [string]$Worker2IP = "192.168.72.130"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "CBS System - Network Connectivity Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Function to test HTTP endpoint
function Test-HttpEndpoint {
    param(
        [string]$Url,
        [string]$Description,
        [int]$TimeoutSeconds = 10
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec $TimeoutSeconds -ErrorAction Stop
        Write-Host "✓ SUCCESS: $Description" -ForegroundColor Green
        if ($response) {
            Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
        }
        return $true
    } catch {
        Write-Host "✗ FAILED: $Description" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test pod-to-pod communication
function Test-PodCommunication {
    param(
        [string]$PodName,
        [string]$Namespace,
        [string]$TargetUrl,
        [string]$Description
    )
    
    Write-Host "Testing pod communication: $Description" -ForegroundColor Yellow
    Write-Host "From pod: $PodName" -ForegroundColor Gray
    Write-Host "To: $TargetUrl" -ForegroundColor Gray
    
    try {
        $result = kubectl exec -n $Namespace $PodName -- curl -s -w "%{http_code}" -o /dev/null $TargetUrl 2>$null
        if ($LASTEXITCODE -eq 0 -and $result -eq "200") {
            Write-Host "✓ SUCCESS: $Description" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ FAILED: $Description (HTTP $result)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ FAILED: $Description" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check if kubectl is available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

# Check cluster connectivity
Write-Host "`n1. Checking cluster connectivity..." -ForegroundColor Cyan
try {
    $clusterInfo = kubectl cluster-info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connected to cluster" -ForegroundColor Green
    } else {
        Write-Error "Cannot connect to Kubernetes cluster"
        exit 1
    }
} catch {
    Write-Error "Failed to connect to cluster: $_"
    exit 1
}

# Check namespace
Write-Host "`n2. Checking namespace..." -ForegroundColor Cyan
$namespaceExists = kubectl get namespace cbs-system 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Namespace 'cbs-system' exists" -ForegroundColor Green
} else {
    Write-Host "✗ Namespace 'cbs-system' does not exist" -ForegroundColor Red
    Write-Host "Creating namespace..." -ForegroundColor Yellow
    kubectl apply -f kubernetes/namespace.yaml
}

# Check pod status
Write-Host "`n3. Checking pod status..." -ForegroundColor Cyan
$pods = kubectl get pods -n cbs-system -o json | ConvertFrom-Json
$runningPods = $pods.items | Where-Object { $_.status.phase -eq "Running" }
$totalPods = $pods.items.Count

Write-Host "Total pods: $totalPods" -ForegroundColor Gray
Write-Host "Running pods: $($runningPods.Count)" -ForegroundColor Gray

if ($runningPods.Count -eq $totalPods -and $totalPods -gt 0) {
    Write-Host "✓ All pods are running" -ForegroundColor Green
} else {
    Write-Host "✗ Some pods are not running" -ForegroundColor Red
    kubectl get pods -n cbs-system
}

# Check service status
Write-Host "`n4. Checking service status..." -ForegroundColor Cyan
$services = kubectl get services -n cbs-system -o json | ConvertFrom-Json
Write-Host "Services found: $($services.items.Count)" -ForegroundColor Gray

foreach ($service in $services.items) {
    Write-Host "  - $($service.metadata.name): $($service.spec.type)" -ForegroundColor Gray
}

# Test external access
Write-Host "`n5. Testing external access..." -ForegroundColor Cyan

# Test CBS Simulator external access
Test-HttpEndpoint -Url "http://$MasterIP:30005/health" -Description "CBS Simulator External Access"

# Test Middleware external access  
Test-HttpEndpoint -Url "http://$MasterIP:30003/health" -Description "Middleware External Access"

# Test Dashboard external access
Test-HttpEndpoint -Url "http://$MasterIP:30004/" -Description "Dashboard External Access"

# Test internal pod-to-pod communication
Write-Host "`n6. Testing internal pod-to-pod communication..." -ForegroundColor Cyan

# Get pod names
$cbsPods = kubectl get pods -n cbs-system -l app=cbs-simulator -o jsonpath='{.items[*].metadata.name}' 2>$null
$middlewarePods = kubectl get pods -n cbs-system -l app=middleware -o jsonpath='{.items[*].metadata.name}' 2>$null
$dashboardPods = kubectl get pods -n cbs-system -l app=dashboard -o jsonpath='{.items[*].metadata.name}' 2>$null

if ($cbsPods -and $middlewarePods) {
    $cbsPod = $cbsPods.Split(' ')[0]
    $middlewarePod = $middlewarePods.Split(' ')[0]
    
    # Test middleware -> CBS simulator communication
    Test-PodCommunication -PodName $middlewarePod -Namespace "cbs-system" -TargetUrl "http://cbs-simulator-service:4000/health" -Description "Middleware to CBS Simulator"
}

if ($dashboardPods -and $middlewarePods) {
    $dashboardPod = $dashboardPods.Split(' ')[0]
    $middlewarePod = $middlewarePods.Split(' ')[0]
    
    # Test dashboard -> middleware communication
    Test-PodCommunication -PodName $dashboardPod -Namespace "cbs-system" -TargetUrl "http://middleware-service:3000/health" -Description "Dashboard to Middleware"
}

# Test API endpoints
Write-Host "`n7. Testing API endpoints..." -ForegroundColor Cyan

# Test CBS Simulator API
Test-HttpEndpoint -Url "http://$MasterIP:30005/cbs/customers" -Description "CBS Simulator - List Customers"
Test-HttpEndpoint -Url "http://$MasterIP:30005/cbs/accounts" -Description "CBS Simulator - List Accounts"

# Test Middleware API
Test-HttpEndpoint -Url "http://$MasterIP:30003/metrics" -Description "Middleware - Metrics"
Test-HttpEndpoint -Url "http://$MasterIP:30003/customers/C001" -Description "Middleware - Get Customer"

# Test Dashboard API calls
Write-Host "`n8. Testing Dashboard API integration..." -ForegroundColor Cyan

# Test if dashboard can fetch data from middleware
try {
    $metricsResponse = Invoke-RestMethod -Uri "http://$MasterIP:30003/metrics" -TimeoutSec 10
    $healthResponse = Invoke-RestMethod -Uri "http://$MasterIP:30003/health" -TimeoutSec 10
    
    Write-Host "✓ Middleware API is responding with data:" -ForegroundColor Green
    Write-Host "  Health Status: $($healthResponse.status)" -ForegroundColor Gray
    Write-Host "  Uptime: $($healthResponse.uptime) seconds" -ForegroundColor Gray
    Write-Host "  Memory Usage: $($metricsResponse.memory.heapUsed) bytes" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Dashboard API integration test failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Connectivity Test Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "`nAccess URLs:" -ForegroundColor Yellow
Write-Host "Dashboard: http://$MasterIP:30004" -ForegroundColor Green
Write-Host "Middleware API: http://$MasterIP:30003" -ForegroundColor Green
Write-Host "CBS Simulator: http://$MasterIP:30005" -ForegroundColor Green

Write-Host "`nInternal Service URLs:" -ForegroundColor Yellow
Write-Host "Dashboard -> Middleware: http://middleware-service:3000" -ForegroundColor Green
Write-Host "Middleware -> CBS Simulator: http://cbs-simulator-service:4000" -ForegroundColor Green

Write-Host "`nIf all tests passed, the dashboard should now work correctly!" -ForegroundColor Green
Write-Host "If tests failed, check the pod logs and service configurations." -ForegroundColor Yellow
