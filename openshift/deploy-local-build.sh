#!/bin/bash
set -e

echo "=========================================="
echo "Building and Deploying from Local Source"
echo "=========================================="
echo ""

# Check if oc is installed
if ! command -v oc &> /dev/null; then
    echo "Error: OpenShift CLI (oc) is not installed"
    exit 1
fi

# Check if logged in
if ! oc whoami &> /dev/null; then
    echo "Error: Not logged in to OpenShift"
    echo "Please login using: oc login --token=<your-token> --server=<your-server>"
    exit 1
fi

# Switch to mas-demo project
echo "Switching to mas-demo project..."
if ! oc project mas-demo &> /dev/null; then
    echo "Error: mas-demo project does not exist or you don't have access"
    exit 1
fi

echo "Current project: $(oc project -q)"
echo ""

# Check if we're in the right directory
if [ ! -d "../frontend" ]; then
    echo "Error: frontend directory not found"
    echo "Please run this script from the openshift directory"
    exit 1
fi

if [ ! -f "../frontend/Dockerfile" ]; then
    echo "Error: Dockerfile not found at ../frontend/Dockerfile"
    exit 1
fi

echo "Step 1: Creating ImageStream..."
oc apply -f imagestream.yaml

echo ""
echo "Step 2: Checking if BuildConfig exists..."
if oc get bc mas-vendor-page &> /dev/null; then
    echo "BuildConfig exists, deleting it to create binary build..."
    oc delete bc mas-vendor-page
fi

echo ""
echo "Step 3: Creating binary BuildConfig..."
oc new-build --name=mas-vendor-page \
  --binary=true \
  --strategy=docker \
  --to=mas-vendor-page:latest

echo ""
echo "Step 4: Starting build from local source..."
echo "This will upload the frontend directory and build the Docker image..."
oc start-build mas-vendor-page \
  --from-dir=../frontend \
  --follow

echo ""
echo "Step 5: Verifying image was created..."
if oc get istag mas-vendor-page:latest &> /dev/null; then
    echo "✓ Image created successfully"
else
    echo "✗ Image creation failed"
    exit 1
fi

echo ""
echo "Step 6: Creating Deployment..."
oc apply -f deployment.yaml

echo ""
echo "Step 7: Creating Service..."
oc apply -f service.yaml

echo ""
echo "Step 8: Creating Route..."
oc apply -f route.yaml

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""

# Wait for deployment to be ready
echo "Waiting for deployment to be ready..."
oc rollout status deployment/mas-vendor-page --timeout=5m

echo ""
echo "Deployment Status:"
oc get deployment mas-vendor-page

echo ""
echo "Pods:"
oc get pods -l app=mas-vendor-page

echo ""
echo "Application URL:"
ROUTE_URL=$(oc get route mas-vendor-page -o jsonpath='{.spec.host}' 2>/dev/null || echo "Route not found")
if [ "$ROUTE_URL" != "Route not found" ]; then
    echo "https://$ROUTE_URL"
    echo ""
    echo "Health check:"
    echo "https://$ROUTE_URL/api/health"
    echo ""
    echo "Testing health endpoint..."
    sleep 5
    curl -k -s "https://$ROUTE_URL/api/health" | jq . || echo "Health check endpoint not responding yet"
else
    echo "Error: Could not retrieve route URL"
fi

echo ""
echo "Useful commands:"
echo "  View logs:        oc logs -f deployment/mas-vendor-page"
echo "  Rebuild:          oc start-build mas-vendor-page --from-dir=../frontend --follow"
echo "  Scale replicas:   oc scale deployment mas-vendor-page --replicas=3"
echo "  Restart pods:     oc rollout restart deployment/mas-vendor-page"
echo "  Delete all:       oc delete all -l app=mas-vendor-page"

echo ""
echo "=========================================="

# Made with Bob
