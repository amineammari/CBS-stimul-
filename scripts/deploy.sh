#!/bin/bash

# CBS Core Banking System - Deployment Script
# This script deploys the CBS system to your Kubernetes cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="cbs-system"
KUBECTL_CMD="kubectl"

echo -e "${BLUE}🚀 CBS Core Banking System - Deployment Script${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

# Check cluster connectivity
echo -e "${BLUE}🔍 Checking cluster connectivity...${NC}"
if ! $KUBECTL_CMD cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi
print_status "Connected to Kubernetes cluster"

# Check if namespace exists
echo -e "${BLUE}📦 Checking namespace...${NC}"
if $KUBECTL_CMD get namespace $NAMESPACE &> /dev/null; then
    print_warning "Namespace $NAMESPACE already exists"
else
    echo -e "${BLUE}📦 Creating namespace...${NC}"
    $KUBECTL_CMD apply -f kubernetes/namespace.yaml
    print_status "Namespace $NAMESPACE created"
fi

# Deploy all services
echo -e "${BLUE}🚀 Deploying CBS services...${NC}"
$KUBECTL_CMD apply -f kubernetes/deploy-all.yaml
print_status "All services deployed"

# Wait for deployments to be ready
echo -e "${BLUE}⏳ Waiting for deployments to be ready...${NC}"
deployments=("cbs-simulator" "middleware" "dashboard")

for deployment in "${deployments[@]}"; do
    echo -e "${BLUE}⏳ Waiting for $deployment...${NC}"
    if $KUBECTL_CMD rollout status deployment/$deployment -n $NAMESPACE --timeout=300s; then
        print_status "$deployment is ready"
    else
        print_error "$deployment deployment failed"
        exit 1
    fi
done

# Display service information
echo -e "${BLUE}📊 Service Information:${NC}"
echo "========================"

echo -e "${BLUE}🔗 Services:${NC}"
$KUBECTL_CMD get services -n $NAMESPACE

echo -e "\n${BLUE}📦 Pods:${NC}"
$KUBECTL_CMD get pods -n $NAMESPACE

echo -e "\n${BLUE}🚀 Deployments:${NC}"
$KUBECTL_CMD get deployments -n $NAMESPACE

# Display access URLs
echo -e "\n${GREEN}🌐 Access URLs:${NC}"
echo "=================="
echo -e "${GREEN}Dashboard (Frontend):${NC}"
echo "  http://192.168.72.128:30004"
echo "  http://192.168.72.129:30004"
echo "  http://192.168.72.130:30004"

echo -e "\n${GREEN}Middleware API:${NC}"
echo "  http://192.168.72.128:30001"
echo "  http://192.168.72.129:30001"
echo "  http://192.168.72.130:30001"

echo -e "\n${GREEN}📋 Useful Commands:${NC}"
echo "====================="
echo "View logs: kubectl logs -f deployment/<service-name> -n $NAMESPACE"
echo "Scale service: kubectl scale deployment <service-name> --replicas=3 -n $NAMESPACE"
echo "Delete deployment: kubectl delete -f kubernetes/deploy-all.yaml"

print_status "CBS deployment completed successfully! 🎉"
