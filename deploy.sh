#!/bin/bash

# ======================================
# Practical Portal - Deployment Script
# ======================================
# This script helps prepare your project for Vercel deployment

echo "🚀 Preparing Practical Portal for Vercel deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Check for environment variables
echo "🔍 Checking environment configuration..."

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Warning: No .env.local file found in frontend/"
    echo "   Please create one based on frontend/vercel-env.example"
fi

# Build frontend to check for errors
echo "🔨 Building frontend..."
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed. Please fix errors before deploying."
    exit 1
fi

cd ..

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - ready for Vercel deployment"
    echo "✅ Git repository initialized"
    echo "   Next: Add your GitHub remote and push your code"
else
    echo "✅ Git repository already initialized"
fi

echo ""
echo "🎉 Project is ready for Vercel deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Go to https://vercel.com and import your repository"
echo "3. Set the root directory to 'frontend'"
echo "4. Add environment variables from frontend/vercel-env.example"
echo "5. Deploy your backend separately (Render, Railway, etc.)"
echo ""
echo "📖 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions"
