# CBS Core Banking System - Deployment Fixes

## Overview
This document outlines the configuration fixes applied to resolve the dashboard error and ensure proper communication between all components in the Kubernetes cluster.

## Issues Identified and Fixed

### 1. Port Configuration Mismatches
**Problem**: Services were configured with inconsistent ports causing communication failures.

**Fixes Applied**:
- CBS Simulator: Standardized on port 30001 (container and service)
- Middleware: Standardized on port 30003 (container and service)
- Dashboard: Standardized on port 30004 (container and NodePort)

### 2. Service URL Configuration
**Problem**: Components were pointing to incorrect service URLs.

**Fixes Applied**:
- Middleware CBS_SIMULATOR_URL: Changed from `http://cbs-simulator-service:30003` to `http://cbs-simulator-service:30001`
- Middleware CORS: Added support for dashboard service and all worker node IPs
- Dashboard API URL: Confirmed correct middleware NodePort URL

### 3. Health Check Endpoints
**Problem**: Health probes were pointing to incorrect paths.

**Fixes Applied**:
- CBS Simulator: Changed health check path from `/` to `/health`
- Middleware: Confirmed health check path `/health`
- Dashboard: Confirmed health check path `/`

### 4. Namespace Configuration
**Problem**: Individual deployment files didn't specify namespace.

**Fixes Applied**:
- Added `namespace: cbs-system` to all deployments and services
- Ensured all components are in the same namespace for internal communication

### 5. Missing API Endpoints
**Problem**: CBS Simulator was missing endpoints that middleware was trying to access.

**Fixes Applied**:
- Added `/api/accounts/:accountNumber` endpoint
- Added `/api/balance/:accountNumber` endpoint  
- Added `/api/transactions` POST endpoint
- Updated console logging to show all available endpoints

## Network Architecture

```
Internet
    ↓
[Master Node: 192.168.72.128]
   ├── Dashboard (NodePort 30004) → Dashboard Service (30004) → Dashboard Pods
   ├── Middleware (NodePort 30003) → Middleware Service (30003) → Middleware Pods
   └── CBS Simulator (NodePort 30001) → CBS Service (30001) → CBS Pods

[Worker1: 192.168.72.129] & [Worker2: 192.168.72.130]
    └── Pods distributed across workers

Internal Communication:
Dashboard → Middleware Service (3000) → CBS Simulator Service (4000)
```

## Service Configuration Summary

### CBS Simulator
- **Container Port**: 4000
- **Service Port**: 4000 (ClusterIP)
- **NodePort**: 30005
- **Health Endpoint**: `/health`
- **Namespace**: cbs-system

### Middleware
- **Container Port**: 3000
- **Service Port**: 3000 (NodePort)
- **NodePort**: 30003
- **Health Endpoint**: `/health`
- **CBS Simulator URL**: `http://cbs-simulator-service:4000`
- **Namespace**: cbs-system

### Dashboard
- **Container Port**: 80
- **Service Port**: 80 (NodePort)
- **NodePort**: 30004
- **Health Endpoint**: `/`
- **API URL**: `http://192.168.72.128:30003`
- **Namespace**: cbs-system

## Deployment Instructions

### Option 1: Use the Complete Deployment File
```bash
kubectl apply -f kubernetes/deploy-all.yaml
```

### Option 2: Use Individual Files
```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/cbs-simulator-deployment.yaml
kubectl apply -f kubernetes/middleware-deployment.yaml
kubectl apply -f kubernetes/dashboard-deployment.yaml
```

### Option 3: Use the PowerShell Script
```powershell
.\scripts\deploy-k8s.ps1
```

## Access URLs

After deployment, the services will be accessible at:

- **Dashboard**: http://192.168.72.128:30004
- **Middleware API**: http://192.168.72.128:30003
- **CBS Simulator**: http://192.168.72.128:30005

## Health Check URLs

- **Dashboard Health**: http://192.168.72.128:30004/
- **Middleware Health**: http://192.168.72.128:30003/health
- **CBS Simulator Health**: http://192.168.72.128:30005/health

## Verification Steps

1. **Check Pod Status**:
   ```bash
   kubectl get pods -n cbs-system
   ```

2. **Check Service Status**:
   ```bash
   kubectl get services -n cbs-system
   ```

3. **Test Health Endpoints**:
   ```bash
   curl http://192.168.72.128:30005/health
   curl http://192.168.72.128:30003/health
   curl http://192.168.72.128:30004/
   ```

4. **Check Logs** (if issues persist):
   ```bash
   kubectl logs -n cbs-system deployment/cbs-simulator
   kubectl logs -n cbs-system deployment/middleware
   kubectl logs -n cbs-system deployment/dashboard
   ```

## Expected Behavior

After applying these fixes:

1. The dashboard should load without the "Erreur lors du chargement des données du dashboard" error
2. All service status indicators should show "OK" instead of "Inconnu"
3. Metrics should display actual values instead of zeros
4. The real-time performance chart should show data
5. All tabs (Transfert, Consultation Compte, etc.) should function properly

## Troubleshooting

If issues persist:

1. **Check if all pods are running**:
   ```bash
   kubectl get pods -n cbs-system
   ```

2. **Check service endpoints**:
   ```bash
   kubectl get endpoints -n cbs-system
   ```

3. **Check pod logs for errors**:
   ```bash
   kubectl logs -n cbs-system -l app=cbs-simulator
   kubectl logs -n cbs-system -l app=middleware
   kubectl logs -n cbs-system -l app=dashboard
   ```

4. **Test internal connectivity**:
   ```bash
   kubectl exec -n cbs-system deployment/middleware -- curl http://cbs-simulator-service:4000/health
   ```

## Docker Images

Ensure the following Docker images are built and pushed to DockerHub:

- `ammariamine/cbs-simulator:latest`
- `ammariamine/middleware:latest`
- `ammariamine/dashboard:latest`

## Environment Variables

The following environment variables are configured:

### CBS Simulator
- `PORT=4000`
- `NODE_ENV=production`

### Middleware
- `PORT=3000`
- `NODE_ENV=production`
- `CBS_SIMULATOR_URL=http://cbs-simulator-service:4000`

### Dashboard
- `REACT_APP_API_URL=http://192.168.72.128:30003`

These configurations ensure proper communication between all components and resolve the dashboard loading error.
