@echo off
REM McDonald's Task Scheduler - Vercel Deployment Script for Windows

echo 🍟 McDonald's Task Scheduler - Vercel Deployment
echo ================================================

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Login to Vercel (if not already logged in)
echo 🔐 Checking Vercel authentication...
vercel whoami || vercel login

REM Build the project locally first
echo 🔨 Building project locally...
npm run build

if %ERRORLEVEL% EQU 0 (
    echo ✅ Local build successful!
) else (
    echo ❌ Local build failed. Please fix errors before deploying.
    pause
    exit /b 1
)

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...

REM Ask user for deployment type
echo Choose deployment type:
echo 1. Preview deployment (for testing)
echo 2. Production deployment
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo 🧪 Deploying to preview...
    vercel
) else if "%choice%"=="2" (
    echo 🌟 Deploying to production...
    vercel --prod
) else (
    echo ❌ Invalid choice. Defaulting to preview deployment...
    vercel
)

echo 🎉 Deployment completed!
echo.
echo Next steps:
echo 1. Test the deployed application
echo 2. Set up custom domain (if needed)
echo 3. Configure environment variables in Vercel dashboard
echo 4. Set up monitoring and alerts
echo.
echo 🔗 Visit Vercel dashboard: https://vercel.com/dashboard

pause
