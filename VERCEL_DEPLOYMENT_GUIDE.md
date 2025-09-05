# Vercel Deployment Guide for McDonald's Task Scheduler

## Overview
This guide explains how to deploy both the Next.js frontend and backend functionality to Vercel using Next.js API routes.

## Deployment Options

### Option 1: Next.js API Routes (Recommended) ✅

**Advantages:**
- Single deployment on Vercel
- No external server needed
- Automatic scaling
- Built-in caching
- Serverless functions

**How it works:**
- Backend logic moved to `src/app/api/` folder
- Uses Next.js API routes instead of Express server
- Data stored in Vercel's filesystem (temporary) or external database

### Option 2: Separate Server Deployment (Advanced)

**For real-time features (Socket.IO), you'd need:**
- Deploy Next.js frontend to Vercel
- Deploy Node.js server to Railway, Render, or Digital Ocean
- Configure CORS and environment variables

## Quick Deployment Steps

### 1. Prepare for Deployment

```bash
# Install dependencies
npm install

# Build the project locally to test
npm run build
npm run start
```

### 2. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Option B: Using GitHub Integration**
1. Push your code to GitHub (already done ✅)
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Connect your GitHub repository
5. Configure build settings (auto-detected for Next.js)
6. Deploy!

### 3. Environment Variables (if needed)

Set these in Vercel dashboard:
```
NODE_ENV=production
```

### 4. Domain Configuration

Vercel provides:
- Free `.vercel.app` subdomain
- Custom domain support
- Automatic HTTPS

## File Structure for Vercel

```
src/app/api/
├── assignments/
│   └── [date]/
│       └── route.ts          # GET/POST /api/assignments/[date]
├── schedules/
│   └── [date]/
│       └── route.ts          # GET/POST /api/schedules/[date]
└── dayparts/
    └── [date]/
        └── route.ts          # GET/POST /api/dayparts/[date]
```

## Current Implementation

✅ **Completed:**
- Next.js API routes created
- File-based data storage
- Vercel configuration updated
- API service ready for deployment

## Data Persistence

**Current Setup:**
- Data stored in `/data` folder
- Files: assignments, schedules, dayparts
- JSON format for easy reading/writing

**For Production:**
Consider upgrading to:
- Vercel Postgres
- PlanetScale
- Supabase
- MongoDB Atlas

## Testing the API Routes

After deployment, your API will be available at:
```
https://your-app.vercel.app/api/assignments/2025-09-05
https://your-app.vercel.app/api/schedules/2025-09-05
https://your-app.vercel.app/api/dayparts/2025-09-05
```

## Migration from Current Server

To switch to Next.js API routes:

1. Replace `apiService.ts` with `apiService_nextjs.ts`
2. Update imports in components
3. Remove Socket.IO dependencies
4. Deploy to Vercel

## Performance Considerations

- **Cold starts:** First request may be slower
- **Execution time:** Max 30 seconds per function
- **Memory:** 1024MB limit
- **Bandwidth:** Generous limits

## Monitoring

Vercel provides:
- Real-time logs
- Performance analytics
- Error tracking
- Usage metrics

## Support

- Vercel docs: https://vercel.com/docs
- Next.js API routes: https://nextjs.org/docs/api-routes/introduction
- GitHub repository: Your current repo ✅
