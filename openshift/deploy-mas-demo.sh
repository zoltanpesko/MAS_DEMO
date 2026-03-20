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

# Check if resources already exist
EXISTING_RESOURCES=$(oc get deployment,service,route,bc,builds,is -l app=mas-vendor-page 2>/dev/null | grep -v "No resources found" || echo "")

if [ -n "$EXISTING_RESOURCES" ]; then
    echo "=========================================="
    echo "Existing deployment found!"
    echo "=========================================="
    echo ""
    echo "Current resources:"
    oc get deployment,service,route,bc,builds,is -l app=mas-vendor-page 2>&1 | grep -v "Warning:"
    echo ""
    read -p "Delete existing deployment and redeploy? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Cleaning up existing deployment..."
        echo "Deleting all resources with label app=mas-vendor-page..."
        
        # Delete in specific order to avoid issues
        echo "  - Deleting route..."
        oc delete route mas-vendor-page 2>/dev/null || echo "    No route to delete"
        
        echo "  - Deleting service..."
        oc delete service mas-vendor-page 2>/dev/null || echo "    No service to delete"
        
        echo "  - Deleting deployment..."
        oc delete deployment mas-vendor-page 2>/dev/null || echo "    No deployment to delete"
        
        echo "  - Deleting build pods..."
        oc delete pods -l openshift.io/build.name --force --grace-period=0 2>/dev/null || echo "    No build pods to delete"
        
        echo "  - Deleting builds..."
        oc delete builds -l buildconfig=mas-vendor-page --all 2>/dev/null || echo "    No builds to delete"
        
        echo "  - Deleting buildconfig..."
        oc delete bc mas-vendor-page 2>/dev/null || echo "    No buildconfig to delete"
        
        echo "  - Deleting imagestream..."
        oc delete is mas-vendor-page 2>/dev/null || echo "    No imagestream to delete"
        
        echo ""
        echo "Waiting for resources to be fully removed..."
        sleep 5
        
        echo "✓ Cleanup complete!"
        echo ""
    else
        echo "Deployment cancelled"
        exit 0
    fi
else
    # Prompt for confirmation for new deployment
    read -p "Deploy to mas-demo project? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
fi

echo ""
echo "=========================================="
echo "Starting Fresh Deployment"
echo "=========================================="
echo ""
echo "Step 1: Creating ImageStream..."
oc apply -f imagestream.yaml

echo ""
echo "Step 2: Creating BuildConfig..."
oc apply -f buildconfig.yaml

echo ""
echo "Step 3: Checking for existing builds..."
echo ""

# Wait a moment for BuildConfig to potentially auto-trigger a build
sleep 2

# Check for any running build pods first (most accurate)
RUNNING_POD=$(oc get pods -l buildconfig=mas-vendor-page --field-selector=status.phase=Running -o name 2>/dev/null | head -1)

if [ -n "$RUNNING_POD" ]; then
    # Extract build name from pod name (remove "pod/" prefix and "-build" suffix)
    BUILD_NUMBER=$(echo "$RUNNING_POD" | sed 's|pod/||' | sed 's|-build$||')
    BUILD_NAME="build.build.openshift.io/$BUILD_NUMBER"
    echo "Found running build pod: $RUNNING_POD"
    echo "Using existing build: $BUILD_NAME"
    echo ""
else
    # Check if there's already a pending/new build
    EXISTING_BUILD=$(oc get builds -l buildconfig=mas-vendor-page --field-selector=status.phase!=Complete,status.phase!=Failed,status.phase!=Cancelled -o name 2>/dev/null | head -1)
    
    if [ -n "$EXISTING_BUILD" ]; then
        echo "Found existing build: $EXISTING_BUILD"
        BUILD_NAME="$EXISTING_BUILD"
        BUILD_STATUS=$(oc get "$BUILD_NAME" -o jsonpath='{.status.phase}' 2>/dev/null)
        echo "Build status: $BUILD_STATUS"
        echo "Using existing build instead of starting new one"
        echo ""
    else
        echo "No running builds found, starting new build..."
        BUILD_NAME=$(oc start-build mas-vendor-page -o name)
        echo "Build started: $BUILD_NAME"
        echo ""
    fi
fi

# Wait a moment for the build pod to be created
sleep 3

# Spinner characters for progress indication
SPINNER_CHARS="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"

# Extract build number from BUILD_NAME (e.g., build.build.openshift.io/mas-vendor-page-1 -> mas-vendor-page-1)
BUILD_NUMBER=$(echo "$BUILD_NAME" | sed 's|build.build.openshift.io/||')
BUILD_POD_NAME="${BUILD_NUMBER}-build"

# Check if build is already complete
BUILD_STATUS=$(oc get "$BUILD_NAME" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")

if [ "$BUILD_STATUS" = "Complete" ]; then
    echo "✓ Build already completed successfully!"
    echo ""
else
    # Wait for build pod to be created and start
    echo "⏳ Waiting for build pod to start..."
    MAX_WAIT=60
    WAITED=0
    SPIN_IDX=0
    
    while [ $WAITED -lt $MAX_WAIT ]; do
        # Check pod status first (more accurate than build resource status)
        POD_STATUS=$(oc get pod "$BUILD_POD_NAME" -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
        BUILD_PHASE=$(oc get "$BUILD_NAME" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
        
        # Show actual pod status which is more accurate
        if [ "$POD_STATUS" = "Running" ]; then
            echo ""
            echo "✓ Build pod is running: $BUILD_POD_NAME"
            break
        elif [ "$POD_STATUS" = "Succeeded" ] || [ "$BUILD_PHASE" = "Complete" ]; then
            echo ""
            echo "✓ Build already completed!"
            break
        elif [ "$POD_STATUS" = "Failed" ] || [ "$BUILD_PHASE" = "Failed" ]; then
            echo ""
            echo "✗ Build failed!"
            break
        fi
        
        SPINNER_CHAR=$(echo "$SPINNER_CHARS" | cut -c$((SPIN_IDX + 1)))
        printf "\r$SPINNER_CHAR Waiting for build pod... (${WAITED}s)"
        sleep 2
        WAITED=$((WAITED + 2))
        SPIN_IDX=$(( (SPIN_IDX + 1) % 10 ))
    done

    # Get final status
    BUILD_PHASE=$(oc get "$BUILD_NAME" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
    POD_STATUS=$(oc get pod "$BUILD_POD_NAME" -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
    
    echo ""
    echo "Current status:"
    echo "  Build: $BUILD_PHASE"
    echo "  Pod: $POD_STATUS"
    echo ""

    if [ "$BUILD_PHASE" = "Failed" ] || [ "$POD_STATUS" = "Failed" ]; then
        echo "✗ Error: Build failed"
        echo ""
        echo "Build details:"
        oc describe "$BUILD_NAME"
        echo ""
        echo "Pod details:"
        oc describe pod "$BUILD_POD_NAME" 2>/dev/null || echo "Pod not found"
        exit 1
    fi

    # Follow the build logs
    echo "=========================================="
    echo "📦 Building Docker image (3-5 minutes)..."
    echo "=========================================="
    echo ""

    # Try to follow logs, but don't fail if it times out
    oc logs -f "$BUILD_NAME" 2>&1 || {
        echo ""
        echo "Note: Log streaming ended or timed out"
        echo "Checking build status..."
    }

    # Wait a bit and check final status
    echo ""
    echo "⏳ Waiting for build to complete..."
    sleep 10

    # Poll for build completion with status updates
    MAX_BUILD_TIME=600  # 10 minutes
    BUILD_TIME=0
    SPIN_IDX=0
    
    while [ $BUILD_TIME -lt $MAX_BUILD_TIME ]; do
        BUILD_STATUS=$(oc get "$BUILD_NAME" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
        
        if [ "$BUILD_STATUS" = "Complete" ]; then
            echo ""
            echo "✓ Build completed successfully!"
            break
        elif [ "$BUILD_STATUS" = "Failed" ] || [ "$BUILD_STATUS" = "Error" ] || [ "$BUILD_STATUS" = "Cancelled" ]; then
            echo ""
            echo "✗ Build failed with status: $BUILD_STATUS"
            echo ""
            echo "Build details:"
            oc describe "$BUILD_NAME"
            echo ""
            echo "Recent build logs:"
            oc logs "$BUILD_NAME" --tail=100
            exit 1
        else
            SPINNER_CHAR=$(echo "$SPINNER_CHARS" | cut -c$((SPIN_IDX + 1)))
            printf "\r$SPINNER_CHAR Build status: $BUILD_STATUS (${BUILD_TIME}s)"
            sleep 5
            BUILD_TIME=$((BUILD_TIME + 5))
            SPIN_IDX=$(( (SPIN_IDX + 1) % 10 ))
        fi
    done

    # Final status check
    BUILD_STATUS=$(oc get "$BUILD_NAME" -o jsonpath='{.status.phase}')
    if [ "$BUILD_STATUS" != "Complete" ]; then
        echo ""
        echo "✗ Error: Build did not complete within timeout"
        echo "Current status: $BUILD_STATUS"
        echo ""
        echo "Build details:"
        oc describe "$BUILD_NAME"
        echo ""
        echo "You can continue monitoring with: oc logs -f $BUILD_NAME"
        exit 1
    fi

    echo ""
    echo "=========================================="
    echo "✓ Build completed successfully!"
    echo "=========================================="
fi

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
echo "=========================================="
echo "DEPLOYMENT SUMMARY"
echo "=========================================="
echo ""

# Get route URL
ROUTE_URL=$(oc get route mas-vendor-page -o jsonpath='{.spec.host}' 2>/dev/null || echo "")

if [ -n "$ROUTE_URL" ]; then
    echo "✓ Application URL:"
    echo "  https://$ROUTE_URL"
    echo ""
    echo "✓ Health Check:"
    echo "  https://$ROUTE_URL/api/health"
    echo ""
    echo "✓ API Endpoints:"
    echo "  Assets:         https://$ROUTE_URL/assets"
    echo "  Scripts:        https://$ROUTE_URL/scripts"
    echo "  Relationships:  https://$ROUTE_URL/relationships"
else
    echo "✗ Error: Could not retrieve route URL"
fi

echo ""
echo "Route Details:"
oc get route mas-vendor-page

echo ""
echo "=========================================="
echo "USEFUL COMMANDS"
echo "=========================================="
echo ""
echo "View logs:"
echo "  oc logs -f deployment/mas-vendor-page"
echo ""
echo "Scale replicas:"
echo "  oc scale deployment mas-vendor-page --replicas=3"
echo ""
echo "Restart pods:"
echo "  oc rollout restart deployment/mas-vendor-page"
echo ""
echo "Delete all resources:"
echo "  oc delete all,route -l app=mas-vendor-page"
echo ""
echo "Trigger new build:"
echo "  oc start-build mas-vendor-page --follow"

echo ""
echo "=========================================="

# Made with Bob
