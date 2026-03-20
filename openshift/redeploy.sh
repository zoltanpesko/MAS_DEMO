#!/bin/bash
set -e

echo "=========================================="
echo "Clean Redeploy to mas-demo"
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
    exit 1
fi

# Switch to mas-demo project
echo "Switching to mas-demo project..."
oc project mas-demo

echo ""
echo "Current resources:"
oc get all -l app=mas-vendor-page

echo ""
read -p "Clean up and redeploy? This will delete existing resources. (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

echo ""
echo "Step 1: Cleaning up existing resources..."
oc delete all -l app=mas-vendor-page 2>/dev/null || echo "No resources to delete"
oc delete imagestream mas-vendor-page 2>/dev/null || echo "No imagestream to delete"
oc delete buildconfig mas-vendor-page 2>/dev/null || echo "No buildconfig to delete"

echo ""
echo "Step 2: Creating ImageStream..."
oc apply -f imagestream.yaml

echo ""
echo "Step 3: Creating binary BuildConfig..."
oc new-build --name=mas-vendor-page \
  --binary=true \
  --strategy=docker \
  --to=mas-vendor-page:latest

echo ""
echo "Step 4: Building from local source..."
echo "Uploading frontend directory..."
oc start-build mas-vendor-page \
  --from-dir=../frontend \
  --follow

echo ""
echo "Step 5: Verifying image..."
if oc get istag mas-vendor-page:latest &> /dev/null; then
    echo "✓ Image created successfully"
    oc describe istag mas-vendor-page:latest | grep "Image Name"
else
    echo "✗ Image creation failed"
    exit 1
fi

echo ""
echo "Step 6: Deploying application..."
oc apply -f deployment.yaml
oc apply -f service.yaml
oc apply -f route.yaml

echo ""
echo "Step 7: Waiting for deployment..."
oc rollout status deployment/mas-vendor-page --timeout=5m

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""

echo "Pods:"
oc get pods -l app=mas-vendor-page

echo ""
echo "Application URL:"
ROUTE_URL=$(oc get route mas-vendor-page -o jsonpath='{.spec.host}' 2>/dev/null)
if [ -n "$ROUTE_URL" ]; then
    echo "https://$ROUTE_URL"
    echo ""
    echo "Health check:"
    echo "https://$ROUTE_URL/api/health"
else
    echo "Error: Could not retrieve route URL"
fi

echo ""
echo "=========================================="

# Made with Bob
