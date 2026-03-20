#!/bin/bash
set -e

echo "=========================================="
echo "Deploying MAS Vendor Page to mas-demo"
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

# Switch to mas-demo project
echo "Switching to mas-demo project..."
if ! oc project mas-demo &> /dev/null; then
    echo "Error: mas-demo project does not exist or you don't have access"
    echo "Available projects:"
    oc projects
    exit 1
fi

echo "Current project: $(oc project -q)"
echo ""

# Prompt for confirmation
read -p "Deploy to mas-demo project? (y/n) " -n 1 -r
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
echo "Note: This will build the Docker image from your Git repository"

# Start the build
BUILD_NAME=$(oc start-build mas-vendor-page -o name)
echo "Build started: $BUILD_NAME"

# Wait for build to start
echo "Waiting for build to start..."
sleep 5

# Follow the build logs with timeout handling
echo "Following build logs..."
if ! timeout 600 oc logs -f "$BUILD_NAME" 2>&1; then
    echo "Warning: Build log streaming timed out or failed"
    echo "Checking build status..."
fi

# Check final build status
echo ""
echo "Checking build status..."
BUILD_STATUS=$(oc get "$BUILD_NAME" -o jsonpath='{.status.phase}')
echo "Build status: $BUILD_STATUS"

if [ "$BUILD_STATUS" != "Complete" ]; then
    echo "Error: Build did not complete successfully"
    echo "Build details:"
    oc describe "$BUILD_NAME"
    echo ""
    echo "Recent build logs:"
    oc logs "$BUILD_NAME" --tail=50
    exit 1
fi

echo "Build completed successfully!"

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
else
    echo "Error: Could not retrieve route URL"
fi

echo ""
echo "Useful commands:"
echo "  View logs:        oc logs -f deployment/mas-vendor-page"
echo "  Scale replicas:   oc scale deployment mas-vendor-page --replicas=3"
echo "  Restart pods:     oc rollout restart deployment/mas-vendor-page"
echo "  Delete all:       oc delete all -l app=mas-vendor-page"

echo ""
echo "=========================================="

# Made with Bob
