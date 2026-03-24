#!/bin/bash
set -e

echo "=========================================="
echo "Deploying MAS Vendor Page to OpenShift"
echo "=========================================="
echo ""

# Check if oc is installed
if ! command -v oc &> /dev/null; then
    echo "Error: OpenShift CLI (oc) is not installed"
    echo "Please install it from: https://docs.openshift.com/container-platform/latest/cli_reference/openshift_cli/getting-started-cli.html"
    exit 1
fi

# Check if logged in
if ! oc whoami &> /dev/null; then
    echo "Error: Not logged in to OpenShift"
    echo "Please login using: oc login --token=<your-token> --server=<your-server>"
    exit 1
fi

echo "Current project: $(oc project -q)"
echo ""

# Prompt for confirmation
read -p "Deploy to this project? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Step 1: Creating ImageStream..."
oc apply -f imagestream.yaml

echo ""
echo "Step 2: Creating BuildConfig..."
oc apply -f buildconfig.yaml

echo ""
echo "Step 3: Starting build..."
oc start-build mas-vendor-page --follow

echo ""
echo "Step 4: Creating Deployment..."
oc apply -f deployment.yaml

echo ""
echo "Step 5: Creating Service..."
oc apply -f service.yaml

echo ""
echo "Step 6: Creating Route..."
oc apply -f route.yaml

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""

# Wait for deployment to be ready
echo "Waiting for deployment to be ready..."
oc rollout status deployment/mas-vendor-page

echo ""
echo "Application URL:"
ROUTE_URL=$(oc get route mas-vendor-page -o jsonpath='{.spec.host}')
echo "https://$ROUTE_URL"

echo ""
echo "Health check:"
echo "https://$ROUTE_URL/api/health"

echo ""
echo "To view logs:"
echo "  oc logs -f deployment/mas-vendor-page"

echo ""
echo "To scale the deployment:"
echo "  oc scale deployment mas-vendor-page --replicas=3"

echo ""
echo "=========================================="

# Made with Bob
