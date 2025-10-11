#!/bin/bash

# CBS Core Banking System - Rebuild and Deploy Script
# This script rebuilds the Docker images and redeploys to Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="ammariamine"
NAMESPACE="cbs-system"

echo -e "${BLUE}🔨 CBS Core Banking System - Rebuild and Deploy${NC}"
echo "======================================================"

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

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running"
    exit 1
fi

# Build and push images
echo -e "${BLUE}🐳 Building and pushing Docker images...${NC}"

services=("cbs-simulator" "middleware" "dashboard")

for service in "${services[@]}"; do
    echo -e "${BLUE}🔨 Building $service...${NC}"
    
    # Build the image
    docker build -t ${DOCKER_REGISTRY}/${service}:latest ./${service}
    
    # Push the image
    echo -e "${BLUE}📤 Pushing $service...${NC}"
    docker push ${DOCKER_REGISTRY}/${service}:latest
    
    print_status "$service image built and pushed"
done

# Delete existing deployments to force recreation
echo -e "${BLUE}🗑️  Deleting existing deployments...${NC}"
kubectl delete -f kubernetes/deploy-all.yaml --ignore-not-found=true

# Wait a moment for cleanup
sleep 5

# Deploy the updated services
echo -e "${BLUE}🚀 Deploying updated services...${NC}"
kubectl apply -f kubernetes/deploy-all.yaml

# Wait for deployments to be ready
echo -e "${BLUE}⏳ Waiting for deployments to be ready...${NC}"
for service in "${services[@]}"; do
    echo -e "${BLUE}⏳ Waiting for $service...${NC}"
    if kubectl rollout status deployment/$service -n $NAMESPACE --timeout=300s; then
        print_status "$service is ready"
    else
        print_error "$service deployment failed"
        exit 1
    fi
done

# Display service information
echo -e "${BLUE}📊 Service Information:${NC}"
echo "========================"

echo -e "${BLUE}🔗 Services:${NC}"
kubectl get services -n $NAMESPACE

echo -e "\n${BLUE}📦 Pods:${NC}"
kubectl get pods -n $NAMESPACE

echo -e "\n${BLUE}🚀 Deployments:${NC}"
kubectl get deployments -n $NAMESPACE

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

print_status "CBS rebuild and deployment completed successfully! 🎉"
