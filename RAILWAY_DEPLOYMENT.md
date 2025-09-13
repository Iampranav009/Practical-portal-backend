# Railway Deployment Guide

This guide will help you deploy your Practical Portal backend to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Database**: Railway MySQL or external database

## Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `practical-portal` repository
5. Select the `backend` folder as the root directory

## Step 2: Add Database

### Option A: Railway MySQL (Recommended)
1. In your Railway project, click "New"
2. Select "Database" → "MySQL"
3. Railway will automatically create a MySQL database
4. Note the connection details from the database service

### Option B: External Database
If using external database (like Hostinger), you'll need to configure the connection manually.

## Step 3: Configure Environment Variables

In your Railway project dashboard, go to "Variables" tab and add:

```bash
# Required Environment Variables
NODE_ENV=production
PORT=10000

# Frontend URL Configuration
FRONTEND_URL=https://practicalportal.vercel.app
CORS_ORIGIN=https://practicalportal.vercel.app/

# Database Configuration (Current Hostinger MySQL)
DATABASE_HOST=srv1741.hstgr.io
DATABASE_PORT=3306
DATABASE_USER=u344397447_classroom
DATABASE_PASSWORD=Classroom@9156332109
DATABASE_NAME=u344397447_classroom

# JWT Configuration - CRITICAL SECURITY
JWT_SECRET=4f0f8f658992022c6d319408d944c8cda7895d513849adef624db3ffc5d455d7e4824592a08d85e439e26566e8bf35e63
JWT_EXPIRES_IN=7d

# Firebase Admin Configuration (Server-side)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDUVWzkc42EX+41\nHZomEMlhbuPiKxhyZfeH9TY+CzV1QM71LyklDp/QhSypvLy52CAhCNYP/96JcZN6\nA06h1hGWlz1qfD6XPJnuqNZAgfYU1Gfc2OPwzgoZobIxpsFZb5hEONtsMQzLeiVl\nL/IihpKHDpmz0gN5WmSKgHTb9518+mPtW60LXeFmnHoPA+LjPTpJTgp/s1aKDe+M\neXZghhILFFDY0NM/fLahm1l8XZQsitbFCUlkCcBCCYuHjxG2ofiJnRpFDwcJCGnI\nEYHMu1C5lcxV60atVWndMkHOPBaqO2uhQ5l6Y/98Hvaf7UVfBTmQJgH9EpyUknnm\nppKsLgnvAgMBAAECggEAFHEPmq7FNl6bQDcpWqDNwmOP7NDZTv93ZSS7pB16zV7/\n4vriAH9NQ3XkEYiUuA+RMvJMKXN9/nLAupkMPj2tqSHGTTTI5yZzwKuLH4q4y33n\nbIuKO5Sabv1HenWOB7OGpTVpanEOb53CxosRyeEgGisoVkzRqM0wVg/ShZr"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@classroom-5b5c6.iam.gserviceaccount.com
FIREBASE_PROJECT_ID=classroom-5b5c6

# Firebase Client Configuration (for frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC32EyY-0xUaKDDuyyPesqL443JX0Goh8s
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=classroom-5b5c6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=classroom-5b5c6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=classroom-5b5c6.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=143853250457
NEXT_PUBLIC_FIREBASE_APP_ID=1:143853250457:web:eeb35eb7689f6394e51508
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-NENN2MGR4Y

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=pportal.notification@gmail.com
SMTP_PASS=xvuh unfy macs ptow

# Railway Specific (Auto-set by Railway)
RAILWAY_ENVIRONMENT=true
RAILWAY_STATIC_URL=your-railway-app-url
RAILWAY_PUBLIC_DOMAIN=your-railway-public-domain

# Database Optimization
DB_RETRY_ATTEMPTS=3
DB_RETRY_DELAY=2000
DEBUG_DB_TIMEOUT=false
```

## Step 4: Deploy

1. Railway will automatically detect your Node.js app
2. It will use the configuration from `railway.json` and `nixpacks.toml`
3. The deployment will start automatically
4. Monitor the build logs for any issues

## Step 5: Verify Deployment

1. **Health Check**: Visit `https://your-app.railway.app/health`
2. **Database Health**: Visit `https://your-app.railway.app/health/db`
3. **API Base**: Visit `https://your-app.railway.app/api`

## Step 6: Update Frontend

Update your frontend to use the new Railway URL:
- Replace `https://portal-backend-4v4w.onrender.com` with your Railway URL
- Update CORS settings if needed

## Railway Advantages over Render

✅ **Better Database Performance**: Railway's MySQL is more reliable
✅ **Faster Deployments**: Railway has faster build times
✅ **Better Monitoring**: Built-in metrics and logs
✅ **Automatic SSL**: SSL certificates are automatically managed
✅ **Better Scaling**: Easier to scale up resources
✅ **No Cold Starts**: Better performance for API calls

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check environment variables are set correctly
   - Verify database credentials
   - Check if database service is running

2. **Build Failed**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

3. **App Crashes on Start**
   - Check environment variables
   - Verify port configuration
   - Check application logs

### Useful Commands

```bash
# Check Railway CLI (if installed)
railway status

# View logs
railway logs

# Connect to database
railway connect mysql
```

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | Server port | Yes | `10000` |
| `DATABASE_HOST` | Database host | Yes | `mysql.railway.internal` |
| `DATABASE_USER` | Database username | Yes | `root` |
| `DATABASE_PASSWORD` | Database password | Yes | `password123` |
| `DATABASE_NAME` | Database name | Yes | `railway` |
| `JWT_SECRET` | JWT signing secret | Yes | `your-secret-key` |
| `FRONTEND_URL` | Frontend URL for CORS | Yes | `https://your-app.vercel.app` |

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app
