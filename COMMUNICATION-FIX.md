# CBS Core Banking System - Communication Fix

## Problem Analysis
The dashboard was showing "Erreur lors du chargement des données du dashboard" because the components couldn't communicate properly within the Kubernetes cluster. The main issues were:

1. **Dashboard was using external NodePort URL** instead of internal service URL
2. **Missing ClusterIP services** for internal communication
3. **Incorrect service configurations** causing network connectivity issues

## Communication Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Dashboard    │    │   Middleware    │    │ CBS Simulator   │
│   (Port 80)     │    │   (Port 3000)   │    │   (Port 4000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ dashboard-      │    │ middleware-     │    │ cbs-simulator-  │
│ service:80      │    │ service:3000    │    │ service:4000    │
│ (ClusterIP)     │    │ (ClusterIP)     │    │ (ClusterIP)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ dashboard-      │    │ middleware-     │    │ cbs-simulator-  │
│ nodeport:30004  │    │ nodeport:30003  │    │ nodeport:30005  │
│ (NodePort)      │    │ (NodePort)      │    │ (NodePort)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Changes Made

### 1. Fixed Dashboard Configuration
**Before:**
```yaml
env:
- name: REACT_APP_API_URL
  value: "http://192.168.72.128:30003"  # External NodePort
```

**After:**
```yaml
env:
- name: REACT_APP_API_URL
  value: "http://middleware-service:3000"  # Internal ClusterIP
```

### 2. Added ClusterIP Services
Each component now has both ClusterIP (for internal communication) and NodePort (for external access) services:

- **CBS Simulator**: `cbs-simulator-service:4000` (ClusterIP) + `cbs-simulator-nodeport:30005` (NodePort)
- **Middleware**: `middleware-service:3000` (ClusterIP) + `middleware-nodeport:30003` (NodePort)  
- **Dashboard**: `dashboard-service:80` (NodePort only, accessed externally)

### 3. Fixed Service Communication
**Dashboard → Middleware:**
- Dashboard uses `http://middleware-service:3000` (internal)
- Middleware responds on port 3000

**Middleware → CBS Simulator:**
- Middleware uses `http://cbs-simulator-service:4000` (internal)
- CBS Simulator responds on port 4000

## Network Configuration Summary

| Component | Internal Service | External Access | Port |
|-----------|------------------|-----------------|------|
| CBS Simulator | `cbs-simulator-service:4000` | `192.168.72.128:30005` | 4000 |
| Middleware | `middleware-service:3000` | `192.168.72.128:30003` | 3000 |
| Dashboard | N/A | `192.168.72.128:30004` | 80 |

## Deployment Instructions

### Step 1: Deploy the System
```bash
# Deploy all components
kubectl apply -f kubernetes/deploy-all.yaml

# Or deploy individually
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/cbs-simulator-deployment.yaml
kubectl apply -f kubernetes/middleware-deployment.yaml
kubectl apply -f kubernetes/dashboard-deployment.yaml
```

### Step 2: Verify Deployment
```bash
# Check pod status
kubectl get pods -n cbs-system

# Check service status
kubectl get services -n cbs-system

# Check endpoints
kubectl get endpoints -n cbs-system
```

### Step 3: Test Connectivity
```powershell
# Run the connectivity test
.\scripts\test-connectivity.ps1

# Run the verification script
.\scripts\verify-deployment.ps1
```

## Expected Results

After applying these fixes, the dashboard should:

1. ✅ **Load without errors** - No more "Erreur lors du chargement des données du dashboard"
2. ✅ **Show service status as "OK"** - Instead of "Inconnu"
3. ✅ **Display actual metrics** - Instead of zeros
4. ✅ **Show real-time performance data** - Chart should populate
5. ✅ **Allow navigation between tabs** - All functionality should work

## Troubleshooting

### If Dashboard Still Shows Errors:

1. **Check Pod Status:**
   ```bash
   kubectl get pods -n cbs-system
   kubectl describe pods -n cbs-system
   ```

2. **Check Service Endpoints:**
   ```bash
   kubectl get endpoints -n cbs-system
   kubectl describe service middleware-service -n cbs-system
   ```

3. **Check Pod Logs:**
   ```bash
   kubectl logs -n cbs-system -l app=dashboard
   kubectl logs -n cbs-system -l app=middleware
   kubectl logs -n cbs-system -l app=cbs-simulator
   ```

4. **Test Internal Communication:**
   ```bash
   # Test middleware -> CBS simulator
   kubectl exec -n cbs-system deployment/middleware -- curl http://cbs-simulator-service:4000/health
   
   # Test dashboard -> middleware (if dashboard pod has curl)
   kubectl exec -n cbs-system deployment/dashboard -- curl http://middleware-service:3000/health
   ```

### Common Issues and Solutions:

1. **Pods not starting:**
   - Check image availability: `kubectl describe pod <pod-name> -n cbs-system`
   - Verify image pull policy and registry access

2. **Services not connecting:**
   - Check service selectors match pod labels
   - Verify port configurations

3. **Network policies blocking traffic:**
   - Check if any NetworkPolicy resources exist
   - Verify namespace isolation settings

## Health Check URLs

- **Dashboard**: http://192.168.72.128:30004/
- **Middleware Health**: http://192.168.72.128:30003/health
- **CBS Simulator Health**: http://192.168.72.128:30005/health

## API Endpoints

- **Middleware Metrics**: http://192.168.72.128:30003/metrics
- **CBS Customers**: http://192.168.72.128:30005/cbs/customers
- **CBS Accounts**: http://192.168.72.128:30005/cbs/accounts

## Verification Commands

```bash
# Quick health check
curl http://192.168.72.128:30005/health
curl http://192.168.72.128:30003/health
curl http://192.168.72.128:30004/

# Test data flow
curl http://192.168.72.128:30003/customers/C001
curl http://192.168.72.128:30003/metrics
```

This configuration ensures that all components can communicate properly within the Kubernetes cluster, resolving the dashboard error and enabling full functionality.
