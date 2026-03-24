# OpenShift Deployment Files

This directory contains all the necessary configuration files to deploy the MAS Vendor Page application to OpenShift.

## Files Overview

- **deployment.yaml** - Kubernetes Deployment configuration with 2 replicas, health checks, and resource limits
- **service.yaml** - Kubernetes Service to expose the application internally
- **route.yaml** - OpenShift Route for external HTTPS access
- **imagestream.yaml** - OpenShift ImageStream to manage container images
- **buildconfig.yaml** - OpenShift BuildConfig for building the Docker image from source
- **deploy.sh** - Automated deployment script

## Prerequisites

1. **OpenShift CLI (oc)** installed
   ```bash
   # Download from: https://docs.openshift.com/container-platform/latest/cli_reference/openshift_cli/getting-started-cli.html
   ```

2. **Access to an OpenShift cluster**
   ```bash
   oc login --token=<your-token> --server=<your-server>
   ```

3. **Git repository** with your code (update `buildconfig.yaml` with your repo URL)

## Quick Deployment

### Option 1: Using the deployment script (Recommended)

```bash
cd openshift
./deploy.sh
```

The script will:
1. Create the ImageStream
2. Create the BuildConfig
3. Start the build process
4. Deploy the application
5. Create the Service
6. Create the Route
7. Display the application URL

### Option 2: Manual deployment

```bash
# 1. Login to OpenShift
oc login --token=<your-token> --server=<your-server>

# 2. Create or switch to your project
oc new-project mas-vendor-page
# or
oc project mas-vendor-page

# 3. Apply all configurations
cd openshift
oc apply -f imagestream.yaml
oc apply -f buildconfig.yaml
oc start-build mas-vendor-page --follow
oc apply -f deployment.yaml
oc apply -f service.yaml
oc apply -f route.yaml

# 4. Get the application URL
oc get route mas-vendor-page
```

## Configuration

### Update Git Repository

Edit `buildconfig.yaml` and update the Git repository URL:

```yaml
source:
  type: Git
  git:
    uri: https://github.com/your-org/your-repo.git  # Update this
    ref: main
  contextDir: frontend
```

### Update Namespace

Edit `deployment.yaml` and update the image reference:

```yaml
image: image-registry.openshift-image-registry.svc:5000/your-namespace/mas-vendor-page:latest
```

Replace `your-namespace` with your actual OpenShift project name.

### Adjust Resources

Edit `deployment.yaml` to adjust CPU and memory limits:

```yaml
resources:
  limits:
    cpu: "1"
    memory: "1Gi"
  requests:
    cpu: "500m"
    memory: "512Mi"
```

### Scale Replicas

Edit `deployment.yaml` to change the number of replicas:

```yaml
spec:
  replicas: 2  # Change this number
```

Or scale dynamically:

```bash
oc scale deployment mas-vendor-page --replicas=3
```

## Monitoring

### Check Deployment Status

```bash
# View all resources
oc get all

# Check deployment status
oc get deployment mas-vendor-page
oc rollout status deployment/mas-vendor-page

# Check pods
oc get pods -l app=mas-vendor-page

# Check service
oc get svc mas-vendor-page

# Check route
oc get route mas-vendor-page
```

### View Logs

```bash
# View logs from all pods
oc logs -f deployment/mas-vendor-page

# View logs from a specific pod
oc logs -f <pod-name>

# View build logs
oc logs -f bc/mas-vendor-page
```

### Health Checks

The application includes a health check endpoint:

```bash
# Get the route URL
ROUTE_URL=$(oc get route mas-vendor-page -o jsonpath='{.spec.host}')

# Test health endpoint
curl https://$ROUTE_URL/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "MAS Vendor Page",
  "version": "1.0.0",
  "uptime": 123.456
}
```

## Troubleshooting

### Build Failures

```bash
# View build logs
oc logs -f bc/mas-vendor-page

# Start a new build
oc start-build mas-vendor-page --follow

# Cancel a build
oc cancel-build mas-vendor-page-1
```

### Pod Not Starting

```bash
# Describe the pod to see events
oc describe pod <pod-name>

# Check pod logs
oc logs <pod-name>

# Check deployment events
oc describe deployment mas-vendor-page
```

### Image Pull Errors

```bash
# Check ImageStream
oc describe imagestream mas-vendor-page

# Check if image exists
oc get istag mas-vendor-page:latest
```

### Route Not Working

```bash
# Check route configuration
oc describe route mas-vendor-page

# Test internal service
oc port-forward svc/mas-vendor-page 3000:3000
# Then access http://localhost:3000
```

## Updates and Rollbacks

### Trigger New Build

```bash
# Start a new build from source
oc start-build mas-vendor-page --follow

# Build will automatically trigger deployment
```

### Manual Deployment Update

```bash
# Apply updated deployment configuration
oc apply -f deployment.yaml

# Check rollout status
oc rollout status deployment/mas-vendor-page
```

### Rollback

```bash
# View rollout history
oc rollout history deployment/mas-vendor-page

# Rollback to previous version
oc rollout undo deployment/mas-vendor-page

# Rollback to specific revision
oc rollout undo deployment/mas-vendor-page --to-revision=2
```

## Resource Management

### View Resource Usage

```bash
# View pod resource usage
oc adm top pods -l app=mas-vendor-page

# View node resource usage
oc adm top nodes
```

### Set Resource Quotas

Create a ResourceQuota:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: mas-vendor-page-quota
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 2Gi
    limits.cpu: "4"
    limits.memory: 4Gi
```

Apply it:
```bash
oc apply -f resource-quota.yaml
```

## Security

### Using Secrets

Create a secret for sensitive data:

```bash
oc create secret generic mas-credentials \
  --from-literal=api-key=your-api-key \
  --from-literal=api-secret=your-api-secret
```

Reference in deployment:

```yaml
env:
- name: MAS_API_KEY
  valueFrom:
    secretKeyRef:
      name: mas-credentials
      key: api-key
```

### Using ConfigMaps

Create a ConfigMap:

```bash
oc create configmap mas-config \
  --from-literal=environment=production \
  --from-literal=log-level=info
```

Reference in deployment:

```yaml
env:
- name: ENVIRONMENT
  valueFrom:
    configMapKeyRef:
      name: mas-config
      key: environment
```

## Cleanup

### Delete All Resources

```bash
# Delete all resources
oc delete all -l app=mas-vendor-page

# Delete specific resources
oc delete deployment mas-vendor-page
oc delete service mas-vendor-page
oc delete route mas-vendor-page
oc delete buildconfig mas-vendor-page
oc delete imagestream mas-vendor-page
```

### Delete Project

```bash
oc delete project mas-vendor-page
```

## Additional Resources

- [OpenShift Documentation](https://docs.openshift.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## Support

For issues or questions:
1. Check the logs: `oc logs -f deployment/mas-vendor-page`
2. Check pod events: `oc describe pod <pod-name>`
3. Check build logs: `oc logs -f bc/mas-vendor-page`
4. Review the main deployment guide: `../OPENSHIFT_DEPLOYMENT.md`