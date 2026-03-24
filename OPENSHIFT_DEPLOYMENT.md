# OpenShift Deployment Guide for MAS Vendor Page

## Overview
This guide provides step-by-step instructions for deploying the MAS Vendor Page Next.js application to OpenShift.

## Prerequisites
- OpenShift CLI (`oc`) installed
- Access to an OpenShift cluster
- Docker or Podman installed (for local testing)
- Git repository access

## Project Structure
```
frontend/
├── app/                    # Next.js app directory
├── components/            # React components
├── lib/                   # Utility functions
├── public/               # Static assets
├── Dockerfile            # Container image definition
├── .dockerignore         # Docker ignore file
├── package.json          # Node.js dependencies
└── next.config.js        # Next.js configuration
```

## Deployment Files to Create

### 1. Dockerfile
Location: `frontend/Dockerfile`

```dockerfile
# Multi-stage build for Next.js application
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. .dockerignore
Location: `frontend/.dockerignore`

```
node_modules
.next
.git
.gitignore
README.md
.env*.local
.vscode
*.log
```

### 3. OpenShift Deployment Configuration
Location: `openshift/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mas-vendor-page
  labels:
    app: mas-vendor-page
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mas-vendor-page
  template:
    metadata:
      labels:
        app: mas-vendor-page
    spec:
      containers:
      - name: mas-vendor-page
        image: image-registry.openshift-image-registry.svc:5000/your-namespace/mas-vendor-page:latest
        ports:
        - containerPort: 3000
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 4. OpenShift Service Configuration
Location: `openshift/service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mas-vendor-page
  labels:
    app: mas-vendor-page
spec:
  ports:
  - name: http
    port: 3000
    targetPort: 3000
    protocol: TCP
  selector:
    app: mas-vendor-page
  type: ClusterIP
```

### 5. OpenShift Route Configuration
Location: `openshift/route.yaml`

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: mas-vendor-page
  labels:
    app: mas-vendor-page
spec:
  to:
    kind: Service
    name: mas-vendor-page
  port:
    targetPort: http
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

### 6. BuildConfig for OpenShift
Location: `openshift/buildconfig.yaml`

```yaml
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: mas-vendor-page
  labels:
    app: mas-vendor-page
spec:
  output:
    to:
      kind: ImageStreamTag
      name: mas-vendor-page:latest
  source:
    type: Git
    git:
      uri: https://github.com/your-org/your-repo.git
      ref: main
    contextDir: frontend
  strategy:
    type: Docker
    dockerStrategy:
      dockerfilePath: Dockerfile
  triggers:
  - type: ConfigChange
  - type: ImageChange
```

### 7. ImageStream Configuration
Location: `openshift/imagestream.yaml`

```yaml
apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: mas-vendor-page
  labels:
    app: mas-vendor-page
spec:
  lookupPolicy:
    local: false
```

### 8. Health Check Endpoint
Location: `frontend/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MAS Vendor Page',
    version: '1.0.0'
  });
}
```

### 9. Update next.config.js
Add standalone output for Docker:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... rest of your config
};

module.exports = nextConfig;
```

## Deployment Steps

### Step 1: Prepare the Application

1. **Update next.config.js** to enable standalone output:
```bash
cd frontend
# Edit next.config.js and add: output: 'standalone'
```

2. **Create health check endpoint**:
```bash
mkdir -p app/api/health
# Create route.ts file with health check code
```

3. **Test build locally**:
```bash
npm run build
npm start
```

### Step 2: Create Docker Image

1. **Build the Docker image locally** (optional, for testing):
```bash
cd frontend
docker build -t mas-vendor-page:latest .
docker run -p 3000:3000 mas-vendor-page:latest
```

2. **Test the containerized application**:
```bash
curl http://localhost:3000/api/health
```

### Step 3: Deploy to OpenShift

1. **Login to OpenShift**:
```bash
oc login --token=<your-token> --server=<your-server>
```

2. **Create a new project** (if needed):
```bash
oc new-project mas-vendor-page
```

3. **Create deployment files directory**:
```bash
mkdir -p openshift
```

4. **Apply ImageStream**:
```bash
oc apply -f openshift/imagestream.yaml
```

5. **Apply BuildConfig**:
```bash
oc apply -f openshift/buildconfig.yaml
```

6. **Start the build**:
```bash
oc start-build mas-vendor-page --follow
```

7. **Apply Deployment**:
```bash
oc apply -f openshift/deployment.yaml
```

8. **Apply Service**:
```bash
oc apply -f openshift/service.yaml
```

9. **Apply Route**:
```bash
oc apply -f openshift/route.yaml
```

### Step 4: Verify Deployment

1. **Check pod status**:
```bash
oc get pods
```

2. **Check deployment status**:
```bash
oc get deployment mas-vendor-page
```

3. **Check service**:
```bash
oc get svc mas-vendor-page
```

4. **Get route URL**:
```bash
oc get route mas-vendor-page
```

5. **Test the application**:
```bash
ROUTE_URL=$(oc get route mas-vendor-page -o jsonpath='{.spec.host}')
curl https://$ROUTE_URL/api/health
```

### Step 5: View Logs

```bash
# Get pod name
POD_NAME=$(oc get pods -l app=mas-vendor-page -o jsonpath='{.items[0].metadata.name}')

# View logs
oc logs $POD_NAME

# Follow logs
oc logs -f $POD_NAME
```

## Environment Variables

The application uses localStorage for configuration, but you can also set environment variables:

```yaml
env:
- name: NEXT_PUBLIC_DEFAULT_MAS_URL
  value: "https://your-maximo-server.com"
- name: NODE_TLS_REJECT_UNAUTHORIZED
  value: "0"  # Only for development with self-signed certs
```

## Scaling

Scale the deployment:
```bash
oc scale deployment mas-vendor-page --replicas=3
```

## Updates and Rollouts

1. **Trigger new build**:
```bash
oc start-build mas-vendor-page
```

2. **Check rollout status**:
```bash
oc rollout status deployment/mas-vendor-page
```

3. **Rollback if needed**:
```bash
oc rollout undo deployment/mas-vendor-page
```

## Monitoring

1. **Check resource usage**:
```bash
oc adm top pods -l app=mas-vendor-page
```

2. **View events**:
```bash
oc get events --sort-by='.lastTimestamp'
```

## Troubleshooting

### Pod not starting
```bash
oc describe pod <pod-name>
oc logs <pod-name>
```

### Build failures
```bash
oc logs -f bc/mas-vendor-page
```

### Network issues
```bash
oc get svc
oc get route
oc describe route mas-vendor-page
```

## Security Considerations

1. **Use secrets for sensitive data**:
```bash
oc create secret generic mas-credentials \
  --from-literal=api-key=your-api-key
```

2. **Reference secrets in deployment**:
```yaml
env:
- name: MAS_API_KEY
  valueFrom:
    secretKeyRef:
      name: mas-credentials
      key: api-key
```

3. **Enable HTTPS** (already configured in route.yaml)

4. **Set resource limits** (already configured in deployment.yaml)

## Production Checklist

- [ ] Dockerfile created and tested
- [ ] Health check endpoint implemented
- [ ] next.config.js updated with standalone output
- [ ] All OpenShift YAML files created
- [ ] ImageStream created
- [ ] BuildConfig created and tested
- [ ] Deployment configured with proper resources
- [ ] Service created
- [ ] Route created with TLS
- [ ] Health checks configured
- [ ] Logging verified
- [ ] Scaling tested
- [ ] Rollback tested
- [ ] Monitoring set up
- [ ] Documentation updated

## Quick Deploy Script

Create `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "Deploying MAS Vendor Page to OpenShift..."

# Apply all configurations
oc apply -f openshift/imagestream.yaml
oc apply -f openshift/buildconfig.yaml
oc start-build mas-vendor-page --follow
oc apply -f openshift/deployment.yaml
oc apply -f openshift/service.yaml
oc apply -f openshift/route.yaml

echo "Deployment complete!"
echo "Application URL: https://$(oc get route mas-vendor-page -o jsonpath='{.spec.host}')"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Support

For issues or questions:
- Check OpenShift logs: `oc logs -f deployment/mas-vendor-page`
- Review pod events: `oc describe pod <pod-name>`
- Check build logs: `oc logs -f bc/mas-vendor-page`

---

**Note**: Replace placeholders like `your-namespace`, `your-org`, `your-repo` with actual values for your environment.