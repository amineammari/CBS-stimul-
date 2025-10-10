# CBS Core Banking System - Deployment Verification Script
# This script verifies that the deployment is working correctly

param(
    [string]$MasterIP = "192.168.72.128"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "CBS System - Deployment Verification" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Function to check if a URL is accessible
function Test-Url {
    param([string]$Url, [string]$Description)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ $Description" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ $Description (Status: $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ $Description (Error: $($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Function to check if a REST API endpoint returns data
function Test-ApiEndpoint {
    param([string]$Url, [string]$Description)
    
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec 10
        if ($response) {
            Write-Host "✓ $Description" -ForegroundColor Green
            Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "✗ $Description (No data returned)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ $Description (Error: $($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n1. Checking basic connectivity..." -ForegroundColor Yellow

# Test basic connectivity
$cbsHealth = Test-Url -Url "http://$MasterIP:30005/health" -Description "CBS Simulator Health Check"
$middlewareHealth = Test-Url -Url "http://$MasterIP:30003/health" -Description "Middleware Health Check"
$dashboardAccess = Test-Url -Url "http://$MasterIP:30004/" -Description "Dashboard Access"

Write-Host "`n2. Testing API endpoints..." -ForegroundColor Yellow

# Test API endpoints
$cbsCustomers = Test-ApiEndpoint -Url "http://$MasterIP:30005/cbs/customers" -Description "CBS Simulator - List Customers"
$cbsAccounts = Test-ApiEndpoint -Url "http://$MasterIP:30005/cbs/accounts" -Description "CBS Simulator - List Accounts"
$middlewareMetrics = Test-ApiEndpoint -Url "http://$MasterIP:30003/metrics" -Description "Middleware - Metrics"
$middlewareCustomer = Test-ApiEndpoint -Url "http://$MasterIP:30003/customers/C001" -Description "Middleware - Get Customer C001"

Write-Host "`n3. Testing data flow..." -ForegroundColor Yellow

# Test the complete data flow
try {
    # Test if middleware can get data from CBS simulator
    $customerData = Invoke-RestMethod -Uri "http://$MasterIP:30003/customers/C001" -TimeoutSec 10
    if ($customerData -and $customerData.id -eq "C001") {
        Write-Host "✓ Data flow: Middleware -> CBS Simulator working" -ForegroundColor Green
        Write-Host "  Customer: $($customerData.prenom) $($customerData.nom)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Data flow: Middleware -> CBS Simulator not working" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Data flow: Middleware -> CBS Simulator failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test if dashboard can get metrics from middleware
try {
    $metricsData = Invoke-RestMethod -Uri "http://$MasterIP:30003/metrics" -TimeoutSec 10
    if ($metricsData -and $metricsData.uptime -ge 0) {
        Write-Host "✓ Data flow: Dashboard -> Middleware working" -ForegroundColor Green
        Write-Host "  Uptime: $($metricsData.uptime) seconds" -ForegroundColor Gray
        Write-Host "  Memory: $($metricsData.memory.heapUsed) bytes" -ForegroundColor Gray
    } else {
        Write-Host "✗ Data flow: Dashboard -> Middleware not working" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Data flow: Dashboard -> Middleware failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Checking Kubernetes resources..." -ForegroundColor Yellow

# Check if kubectl is available
if (Get-Command kubectl -ErrorAction SilentlyContinue) {
    Write-Host "Checking pods..." -ForegroundColor Gray
    kubectl get pods -n cbs-system
    
    Write-Host "`nChecking services..." -ForegroundColor Gray
    kubectl get services -n cbs-system
    
    Write-Host "`nChecking endpoints..." -ForegroundColor Gray
    kubectl get endpoints -n cbs-system
} else {
    Write-Host "kubectl not available, skipping Kubernetes resource checks" -ForegroundColor Yellow
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$allTests = @($cbsHealth, $middlewareHealth, $dashboardAccess, $cbsCustomers, $cbsAccounts, $middlewareMetrics, $middlewareCustomer)
$passedTests = ($allTests | Where-Object { $_ -eq $true }).Count
$totalTests = $allTests.Count

Write-Host "`nTests passed: $passedTests/$totalTests" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" })

if ($passedTests -eq $totalTests) {
    Write-Host "`n🎉 All tests passed! The CBS system is working correctly." -ForegroundColor Green
    Write-Host "The dashboard should now display proper data instead of errors." -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed. Please check the deployment and try again." -ForegroundColor Yellow
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Pods not running: Check 'kubectl get pods -n cbs-system'" -ForegroundColor Gray
    Write-Host "  - Services not ready: Check 'kubectl get services -n cbs-system'" -ForegroundColor Gray
    Write-Host "  - Network issues: Check 'kubectl get endpoints -n cbs-system'" -ForegroundColor Gray
}

Write-Host "`nAccess URLs:" -ForegroundColor Yellow
Write-Host "Dashboard: http://$MasterIP:30004" -ForegroundColor Green
Write-Host "Middleware API: http://$MasterIP:30003" -ForegroundColor Green
Write-Host "CBS Simulator: http://$MasterIP:30005" -ForegroundColor Green
