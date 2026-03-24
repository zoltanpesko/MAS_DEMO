#!/bin/bash
set -e

echo "=========================================="
echo "Build and Deploy to mas-demo"
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
echo "Checking existing resources..."
oc get bc mas-vendor-page &> /dev/null && echo "✓ BuildConfig exists" || echo "✗ BuildConfig missing"
oc get is mas-vendor-page &> /dev/null && echo "✓ ImageStream exists" || echo "✗ ImageStream missing"

echo ""
echo "Step 1: Starting build from local source..."
echo "This will upload the frontend directory and build the Docker image..."
echo ""

oc start-build mas-vendor-page \
  --from-dir=../frontend \
  --follow

echo ""
echo "Step 2: Verifying image was created..."
if oc get istag mas-vendor-page:latest &> /dev/null; then
    echo "✓ Image created successfully"
    oc describe istag mas-vendor-page:latest | grep "Image Name:" || true
else
    echo "✗ Image creation failed"
    exit 1
fi

echo ""
echo "Step 3: Applying deployment configuration..."
oc apply -f deployment.yaml
oc apply -f service.yaml
oc apply -f route.yaml

echo ""
echo "Step 4: Waiting for deployment to be ready..."
oc rollout status deployment/mas-vendor-page --timeout=5m

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""

echo "Deployment Status:"
oc get deployment mas-vendor-page

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
    echo ""
    echo "Testing health endpoint in 10 seconds..."
    sleep 10
    curl -k -s "https://$ROUTE_URL/api/health" | python3 -m json.tool 2>/dev/null || echo "(Health endpoint will be available once pods are fully ready)"
else
    echo "Error: Could not retrieve route URL"
fi

echo ""
echo "Useful commands:"
echo "  View logs:        oc logs -f deployment/mas-vendor-page -n mas-demo"
echo "  Rebuild:          oc start-build mas-vendor-page --from-dir=../frontend --follow"
echo "  Scale:            oc scale deployment mas-vendor-page --replicas=3 -n mas-demo"
echo "  Restart:          oc rollout restart deployment/mas-vendor-page -n mas-demo"

echo ""
echo "=========================================="

# Made with Bob
