# Vercel Deployment Guide for McDonald's Task Scheduler

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Create a Vercel account at https://vercel.com
3. Connect your GitHub repository to Vercel

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository: `jithinjissac/mcd-task-scheduler`
4. Configure environment variables (see below)
5. Click "Deploy"

### Option 2: Deploy via CLI
```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 3: Auto-deployment via GitHub
1. Connect repository to Vercel
2. Every push to `main` branch will auto-deploy to production
3. Pull requests will create preview deployments

## Environment Variables to Set in Vercel Dashboard

Go to Project Settings > Environment Variables and add:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_WS_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_APP_NAME=McDonald's Task Scheduler
```

## File Storage Considerations

Since Vercel is serverless, file storage is ephemeral. For production:

### Option A: Use External Database
- Add database URL to environment variables
- Modify API routes to use database instead of file system

### Option B: Use Cloud Storage
- AWS S3, Google Cloud Storage, or similar
- Store schedule/assignment data in cloud storage

### Option C: Use Vercel KV (Redis)
- Enable Vercel KV in your project
- Use for real-time data and caching

## Real-time Features

The app includes:
- Polling-based real-time updates (replaces WebSocket)
- Connected user count tracking
- Automatic data synchronization

## Post-Deployment Steps

1. Test all features on the deployed URL
2. Update any hardcoded localhost URLs
3. Test on mobile devices
4. Monitor performance in Vercel dashboard

## Domains

- Production: `https://your-app-name.vercel.app`
- Custom domain: Configure in Vercel dashboard under "Domains"

## Monitoring

- View logs in Vercel dashboard under "Functions"
- Monitor performance under "Analytics"
- Set up alerts for errors

## Troubleshooting

### Build Issues
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Ensure TypeScript types are correct

### Runtime Issues
- Check function logs in Vercel dashboard
- Verify environment variables are set
- Test API routes individually

### Performance Issues
- Use Vercel Analytics
- Optimize images and assets
- Consider edge functions for better performance
