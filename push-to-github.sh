#!/bin/bash

echo "=========================================="
echo "Push to GitHub"
echo "=========================================="
echo ""

# Check if there are changes to push
if git diff-index --quiet HEAD --; then
    echo "No changes to push"
    exit 0
fi

echo "Changes to push:"
git status --short

echo ""
echo "Pushing to GitHub..."
echo ""

# Try to push
git push origin main 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Successfully pushed to GitHub!"
    echo ""
    echo "Repository: https://github.com/zoltanpesko/MAS_DEMO"
    echo ""
    echo "Now you can deploy from GitHub:"
    echo "  cd openshift"
    echo "  ./deploy-mas-demo.sh"
else
    echo ""
    echo "✗ Push failed. Please push manually:"
    echo ""
    echo "1. Go to GitHub: https://github.com/zoltanpesko/MAS_DEMO"
    echo "2. Navigate to frontend/Dockerfile"
    echo "3. Click 'Edit this file' (pencil icon)"
    echo "4. Change line 2 from:"
    echo "   FROM node:18-alpine AS base"
    echo "   to:"
    echo "   FROM registry.access.redhat.com/ubi9/nodejs-18:latest AS base"
    echo "5. Commit the change"
    echo ""
    echo "Then deploy:"
    echo "  cd openshift"
    echo "  ./deploy-mas-demo.sh"
fi

echo ""
echo "=========================================="

# Made with Bob
