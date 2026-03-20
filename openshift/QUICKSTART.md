# Quick Start Guide - Deploy to mas-demo

## ⚡ Fastest Way to Deploy (Recommended)

Since this project is not in a Git repository, use the **local build** method:

```bash
# 1. Login to OpenShift
oc login --token=<your-token> --server=<your-server>

# 2. Run the local build deployment script
cd openshift
./deploy-local-build.sh
```

This script will:
- ✅ Upload your local `frontend` directory to OpenShift
- ✅ Build the Docker image in OpenShift
- ✅ Deploy the application to mas-demo project
- ✅ Create the service and route
- ✅ Display the application URL

## 📋 What the Script Does

1. **Creates ImageStream** - Manages container images
2. **Creates Binary BuildConfig** - Builds from local source (not Git)
3. **Uploads & Builds** - Uploads frontend directory and builds Docker image
4. **Deploys** - Creates deployment with 2 replicas
5. **Exposes** - Creates service and HTTPS route

## 🔄 Rebuilding After Changes

After making code changes, rebuild and redeploy:

```bash
cd openshift
oc start-build mas-vendor-page --from-dir=../frontend --follow
```

The deployment will automatically update with the new image.

## 🌐 Access Your Application

After deployment completes, get the URL:

```bash
oc get route mas-vendor-page -n mas-demo
```

Or visit:
```
https://<route-url>
```

Health check:
```
https://<route-url>/api/health
```

## 📊 Monitor Deployment

```bash
# View pods
oc get pods -l app=mas-vendor-page -n mas-demo

# View logs
oc logs -f deployment/mas-vendor-page -n mas-demo

# Check deployment status
oc get deployment mas-vendor-page -n mas-demo
```

## 🔧 Common Commands

```bash
# Scale replicas
oc scale deployment mas-vendor-page --replicas=3 -n mas-demo

# Restart deployment
oc rollout restart deployment/mas-vendor-page -n mas-demo

# View all resources
oc get all -l app=mas-vendor-page -n mas-demo

# Delete everything
oc delete all -l app=mas-vendor-page -n mas-demo
```

## ❌ Troubleshooting

If deployment fails, see `TROUBLESHOOTING.md` for detailed solutions.

Quick checks:
```bash
# Check build logs
oc logs -f bc/mas-vendor-page -n mas-demo

# Check pod events
oc get events -n mas-demo --sort-by='.lastTimestamp'

# Describe deployment
oc describe deployment mas-vendor-page -n mas-demo
```

## 🔐 Using Git Repository (Alternative)

If you want to use Git instead of local builds:

### Step 1: Initialize Git repository
```bash
cd /Users/zoltanpesko/Desktop/MAS\ Vendor\ page/MAS-Demo-Shareable
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Push to GitHub
```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

### Step 3: Create Git secret in OpenShift
```bash
oc create secret generic git-credentials \
  --from-literal=username=your-github-username \
  --from-literal=password=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 \
  --type=kubernetes.io/basic-auth \
  -n mas-demo

oc annotate secret git-credentials \
  'build.openshift.io/source-secret-match-uri-1=https://github.com/*' \
  -n mas-demo
```

### Step 4: Update buildconfig.yaml
```yaml
source:
  type: Git
  git:
    uri: https://github.com/your-username/your-repo.git
    ref: main
  contextDir: frontend
  sourceSecret:
    name: git-credentials
```

### Step 5: Deploy with Git
```bash
cd openshift
./deploy-mas-demo.sh
```

## 📝 Notes

- **Local build** is recommended for development and testing
- **Git build** is recommended for production and CI/CD
- The application runs on port 3000 internally
- HTTPS is automatically configured via OpenShift route
- Health checks are configured at `/api/health`

## 🎯 Next Steps

After successful deployment:

1. Test the application at the route URL
2. Check health endpoint: `https://<route-url>/api/health`
3. Configure your Maximo connection in the UI
4. Test Assets, Scripts, and Relationships pages

## 📚 Additional Resources

- `README.md` - Detailed OpenShift deployment guide
- `TROUBLESHOOTING.md` - Common issues and solutions
- `../OPENSHIFT_DEPLOYMENT.md` - Complete deployment documentation