#!/bin/bash

# McDonald's Task Scheduler - Vercel Deployment Script

echo "🍟 McDonald's Task Scheduler - Vercel Deployment"
echo "================================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

# Build the project locally first
echo "🔨 Building project locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful!"
else
    echo "❌ Local build failed. Please fix errors before deploying."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."

# Ask user for deployment type
echo "Choose deployment type:"
echo "1. Preview deployment (for testing)"
echo "2. Production deployment"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "🧪 Deploying to preview..."
        vercel
        ;;
    2)
        echo "🌟 Deploying to production..."
        vercel --prod
        ;;
    *)
        echo "❌ Invalid choice. Defaulting to preview deployment..."
        vercel
        ;;
esac

echo "🎉 Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Test the deployed application"
echo "2. Set up custom domain (if needed)"
echo "3. Configure environment variables in Vercel dashboard"
echo "4. Set up monitoring and alerts"
echo ""
echo "🔗 Visit Vercel dashboard: https://vercel.com/dashboard"
