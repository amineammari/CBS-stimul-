# 🚀 Guide de Déploiement CBS sur Cluster Kubernetes

## 📋 Vue d'ensemble

Ce guide vous accompagne pour déployer votre système CBS (Core Banking System) sur un cluster Kubernetes avec 3 VMs.

### 🏗️ Architecture du Cluster
- **Master Node**: `192.168.72.128`
- **Worker Node 1**: `192.168.72.129`
- **Worker Node 2**: `192.168.72.130`

### 🎯 Services Déployés
1. **CBS-Simulator** (Backend) - Port interne: 4000
2. **Middleware** (API Gateway) - NodePort: 30002
3. **Dashboard** (Frontend React) - NodePort: 30001

## 🔧 Prérequis

### 1. Configuration du Cluster
```bash
# Vérifier que kubectl est configuré
kubectl cluster-info

# Vérifier les nœuds
kubectl get nodes
```

### 2. Images Docker
Les images suivantes doivent être disponibles sur Docker Hub :
- `ammariamine/cbs-simulator:latest`
- `ammariamine/middleware:latest`
- `ammariamine/dashboard:latest`

## 🚀 Déploiement

### Option 1: Déploiement Manuel

#### 1. Créer le namespace
```bash
kubectl apply -f kubernetes/namespace.yaml
```

#### 2. Déployer tous les services
```bash
kubectl apply -f kubernetes/deploy-all.yaml
```

#### 3. Vérifier le déploiement
```bash
# Vérifier les pods
kubectl get pods -n cbs-system

# Vérifier les services
kubectl get services -n cbs-system

# Vérifier les déploiements
kubectl get deployments -n cbs-system
```

### Option 2: Déploiement via Jenkins

Le pipeline Jenkins est configuré pour :
1. Build et push des images Docker
2. Déploiement automatique sur le cluster
3. Tests de sécurité avec OWASP ZAP
4. Analyse de qualité avec SonarQube

## 🌐 Accès aux Services

### Dashboard (Frontend)
- **URL**: `http://192.168.72.128:30004`
- **URL**: `http://192.168.72.129:30004`
- **URL**: `http://192.168.72.130:30004`

### Middleware API
- **URL**: `http://192.168.72.128:30003`
- **URL**: `http://192.168.72.129:30003`
- **URL**: `http://192.168.72.130:30003`

### CBS-Simulator (Interne)
- Accessible uniquement depuis le cluster via `cbs-simulator-service:4000`

## 🔍 Monitoring et Debugging

### Vérifier les logs
```bash
# Logs du dashboard
kubectl logs -f deployment/dashboard -n cbs-system

# Logs du middleware
kubectl logs -f deployment/middleware -n cbs-system

# Logs du CBS-simulator
kubectl logs -f deployment/cbs-simulator -n cbs-system
```

### Vérifier l'état des services
```bash
# Détails des pods
kubectl describe pods -n cbs-system

# Détails des services
kubectl describe services -n cbs-system
```

### Tester la connectivité
```bash
# Tester le middleware depuis un pod
kubectl run test-pod --image=busybox -it --rm --restart=Never -n cbs-system -- wget -qO- http://middleware-service:3000/health

# Tester le CBS-simulator depuis un pod
kubectl run test-pod --image=busybox -it --rm --restart=Never -n cbs-system -- wget -qO- http://cbs-simulator-service:4000/
```

## 🔄 Mise à jour des Services

### Mise à jour d'une image
```bash
# Mettre à jour l'image du middleware
kubectl set image deployment/middleware middleware=ammariamine/middleware:new-tag -n cbs-system

# Vérifier le rollout
kubectl rollout status deployment/middleware -n cbs-system
```

### Rollback en cas de problème
```bash
# Voir l'historique des déploiements
kubectl rollout history deployment/middleware -n cbs-system

# Rollback vers la version précédente
kubectl rollout undo deployment/middleware -n cbs-system
```

## 🧹 Nettoyage

### Supprimer tous les services
```bash
kubectl delete -f kubernetes/deploy-all.yaml
```

### Supprimer le namespace
```bash
kubectl delete namespace cbs-system
```

## 🚨 Dépannage

### Problèmes courants

#### 1. Pods en état Pending
```bash
# Vérifier les événements
kubectl get events -n cbs-system --sort-by='.lastTimestamp'

# Vérifier les ressources disponibles
kubectl describe nodes
```

#### 2. Services non accessibles
```bash
# Vérifier les endpoints
kubectl get endpoints -n cbs-system

# Tester la connectivité interne
kubectl exec -it <pod-name> -n cbs-system -- curl http://service-name:port
```

#### 3. Images non trouvées
```bash
# Vérifier les images
kubectl describe pod <pod-name> -n cbs-system

# Forcer le pull des images
kubectl delete pods -l app=<app-name> -n cbs-system
```

## 📊 Ressources et Limites

### Configuration actuelle
- **CBS-Simulator**: 128Mi-256Mi RAM, 100m-200m CPU
- **Middleware**: 256Mi-512Mi RAM, 150m-300m CPU  
- **Dashboard**: 128Mi-256Mi RAM, 100m-200m CPU

### Ajustement des ressources
Modifiez les sections `resources` dans les fichiers de déploiement selon vos besoins.

## 🔐 Sécurité

### Bonnes pratiques
1. Utilisez des secrets Kubernetes pour les credentials
2. Implémentez des Network Policies
3. Activez RBAC
4. Utilisez des images non-root

### Exemple de secret
```bash
kubectl create secret generic app-secrets \
  --from-literal=api-key=your-api-key \
  --from-literal=db-password=your-password \
  -n cbs-system
```

## 📞 Support

En cas de problème, vérifiez :
1. Les logs des pods
2. L'état des services
3. La connectivité réseau
4. Les ressources disponibles

---

**Note**: Ce guide assume que votre cluster Kubernetes est correctement configuré et que les images Docker sont disponibles sur Docker Hub.
