# OpenShift Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Image Pull Authentication Error

**Error:**
```
Failed to pull image "image-registry.openshift-image-registry.svc:5000/mas-demo/mas-vendor-page:latest": 
reading manifest latest in image-registry.openshift-image-registry.svc:5000/mas-demo/mas-vendor-page: 
authentication required
```

**Cause:** The image doesn't exist yet because the build hasn't completed successfully.

**Solution:**

#### Step 1: Check if BuildConfig exists
```bash
oc get bc mas-vendor-page -n mas-demo
```

#### Step 2: Check build status
```bash
oc get builds -n mas-demo
```

#### Step 3: If no builds exist, start one
```bash
oc start-build mas-vendor-page -n mas-demo --follow
```

#### Step 4: If build fails, check logs
```bash
# Get the build name
oc get builds -n mas-demo

# View logs (replace <build-name> with actual name like mas-vendor-page-1)
oc logs -f build/<build-name> -n mas-demo
```

#### Step 5: Common build issues

**Issue: Git repository not accessible**
- Update `buildconfig.yaml` with correct Git repository URL
- Ensure the repository is public or add Git credentials

**Issue: Dockerfile not found**
- Verify `contextDir: frontend` in buildconfig.yaml
- Ensure Dockerfile exists at `frontend/Dockerfile`

**Issue: Build timeout**
- Increase build timeout in buildconfig.yaml
- Check network connectivity

#### Step 6: Manual deployment order

Deploy in this exact order:

```bash
# 1. Create ImageStream first
oc apply -f imagestream.yaml -n mas-demo

# 2. Create BuildConfig
oc apply -f buildconfig.yaml -n mas-demo

# 3. Start build and wait for completion
oc start-build mas-vendor-page -n mas-demo --follow

# 4. Verify image was created
oc get istag mas-vendor-page:latest -n mas-demo

# 5. Now deploy the application
oc apply -f deployment.yaml -n mas-demo
oc apply -f service.yaml -n mas-demo
oc apply -f route.yaml -n mas-demo
```

### 2. Build from Local Source (Alternative)

If you can't use Git, build from local directory:

```bash
# Navigate to project root
cd /path/to/MAS-Demo-Shareable

# Create build from local source
oc new-build --name=mas-vendor-page \
  --binary=true \
  --strategy=docker \
  -n mas-demo

# Start build from local directory
oc start-build mas-vendor-page \
  --from-dir=./frontend \
  --follow \
  -n mas-demo

# Then deploy
oc apply -f openshift/deployment.yaml -n mas-demo
oc apply -f openshift/service.yaml -n mas-demo
oc apply -f openshift/route.yaml -n mas-demo
```

### 3. Using Docker Build and Push

Build locally and push to OpenShift registry:

```bash
# 1. Login to OpenShift registry
docker login -u $(oc whoami) -p $(oc whoami -t) \
  image-registry.openshift-image-registry.svc:5000

# 2. Build image locally
cd frontend
docker build -t mas-vendor-page:latest .

# 3. Tag for OpenShift registry
docker tag mas-vendor-page:latest \
  image-registry.openshift-image-registry.svc:5000/mas-demo/mas-vendor-page:latest

# 4. Push to registry
docker push image-registry.openshift-image-registry.svc:5000/mas-demo/mas-vendor-page:latest

# 5. Deploy
cd ../openshift
oc apply -f deployment.yaml -n mas-demo
oc apply -f service.yaml -n mas-demo
oc apply -f route.yaml -n mas-demo
```

### 4. Check ImageStream

```bash
# View ImageStream
oc describe imagestream mas-vendor-page -n mas-demo

# Check if image tag exists
oc get istag mas-vendor-page:latest -n mas-demo

# If ImageStream is empty, the build hasn't completed
```

### 5. Deployment Won't Start

**Check events:**
```bash
oc get events -n mas-demo --sort-by='.lastTimestamp'
```

**Check deployment status:**
```bash
oc describe deployment mas-vendor-page -n mas-demo
```

**Check pod status:**
```bash
oc get pods -l app=mas-vendor-page -n mas-demo
oc describe pod <pod-name> -n mas-demo
```

### 6. Build Configuration Issues

**Update Git repository in buildconfig.yaml:**
```yaml
source:
  type: Git
  git:
    uri: https://github.com/your-org/your-repo.git  # Update this
    ref: main
  contextDir: frontend
```

**For private repositories, create a secret:**
```bash
oc create secret generic git-credentials \
  --from-literal=username=your-username \
  --from-literal=password=your-token \
  -n mas-demo

# Update buildconfig.yaml to use the secret
```

### 7. Permission Issues

**Check service account permissions:**
```bash
oc policy add-role-to-user system:image-puller system:serviceaccount:mas-demo:default -n mas-demo
oc policy add-role-to-user system:image-builder system:serviceaccount:mas-demo:builder -n mas-demo
```

### 8. Network/Registry Issues

**Check if internal registry is accessible:**
```bash
oc get route -n openshift-image-registry
```

**Expose registry if needed:**
```bash
oc patch configs.imageregistry.operator.openshift.io/cluster \
  --patch '{"spec":{"defaultRoute":true}}' \
  --type=merge
```

### 9. Resource Quota Exceeded

**Check quotas:**
```bash
oc describe quota -n mas-demo
```

**Check resource usage:**
```bash
oc adm top pods -n mas-demo
```

**Reduce resource requests in deployment.yaml if needed:**
```yaml
resources:
  limits:
    cpu: "500m"      # Reduced from 1
    memory: "512Mi"  # Reduced from 1Gi
  requests:
    cpu: "250m"      # Reduced from 500m
    memory: "256Mi"  # Reduced from 512Mi
```

### 10. Clean Start

If all else fails, clean up and start fresh:

```bash
# Delete all resources
oc delete all -l app=mas-vendor-page -n mas-demo

# Delete ImageStream
oc delete imagestream mas-vendor-page -n mas-demo

# Delete BuildConfig
oc delete buildconfig mas-vendor-page -n mas-demo

# Start fresh
cd openshift
./deploy-mas-demo.sh
```

## Verification Checklist

Before deploying, verify:

- [ ] Logged in to OpenShift: `oc whoami`
- [ ] In correct project: `oc project mas-demo`
- [ ] Git repository URL is correct in buildconfig.yaml
- [ ] Dockerfile exists at `frontend/Dockerfile`
- [ ] next.config.js has `output: 'standalone'`
- [ ] Health check endpoint exists at `frontend/app/api/health/route.ts`

## Quick Diagnostic Commands

```bash
# Check everything
oc get all -n mas-demo

# Check builds
oc get builds -n mas-demo
oc logs -f bc/mas-vendor-page -n mas-demo

# Check images
oc get imagestream -n mas-demo
oc get istag -n mas-demo

# Check deployment
oc get deployment -n mas-demo
oc get pods -n mas-demo
oc logs -f deployment/mas-vendor-page -n mas-demo

# Check service and route
oc get svc -n mas-demo
oc get route -n mas-demo
```

## Getting Help

1. Check build logs: `oc logs -f bc/mas-vendor-page -n mas-demo`
2. Check pod logs: `oc logs -f deployment/mas-vendor-page -n mas-demo`
3. Check events: `oc get events -n mas-demo --sort-by='.lastTimestamp'`
4. Describe resources: `oc describe <resource-type> <resource-name> -n mas-demo`

## Contact

For additional support, provide:
- Output of `oc get all -n mas-demo`
- Build logs: `oc logs bc/mas-vendor-page -n mas-demo`
- Pod logs: `oc logs deployment/mas-vendor-page -n mas-demo`
- Events: `oc get events -n mas-demo`