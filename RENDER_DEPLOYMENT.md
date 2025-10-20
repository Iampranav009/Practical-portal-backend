# Render Deployment Guide for Practical Portal Backend

This guide will help you deploy the Practical Portal backend API to Render.

## Prerequisites

1. A GitHub repository with your backend code
2. A Render account
3. A MySQL database (using current Hostinger MySQL)

## Step 1: Deploy the Backend Service

### Option A: Using render.yaml (Recommended)

1. Go to your Render dashboard
2. Click "New +" and select "Blueprint"
3. Connect your GitHub repository
4. Select the `backend` folder as the root directory
5. Render will automatically detect and use the `render.yaml` configuration

### Option B: Manual Configuration

1. Go to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Choose the repository and branch (main)
5. Configure the service:

#### Service Configuration

- **Name**: `practical-portal-backend`
- **Environment**: `Node`
- **Build Command**: `npm ci --only=production`
- **Start Command**: `npm start`
- **Plan**: Free
- **Health Check Path**: `/health`

### Environment Variables

Add these environment variables in the Render dashboard (or use the `render.env.example` file as reference):

```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://practicalportal.vercel.app
CORS_ORIGIN=https://practicalportal.vercel.app
DATABASE_HOST=srv1741.hstgr.io
DATABASE_PORT=3306
DATABASE_USER=u344397447_classroom
DATABASE_PASSWORD=Classroom@9156332109
DATABASE_NAME=u344397447_classroom
JWT_SECRET=4f0f8f658992022c6d319408d944c8cda7895d513849adef624db3ffc5d455d7e4824592a08d85e439e26566e8bf35e63
JWT_EXPIRES_IN=7d
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDUVWzkc42EX+41\nHZomEMlhbuPiKxhyZfeH9TY+CzV1QM71LyklDp/QhSypvLy52CAhCNYP/96JcZN6\nA06h1hGWlz1qfD6XPJnuqNZAgfYU1Gfc2OPwzgoZobIxpsFZb5hEONtsMQzLeiVl\nL/IihpKHDpmz0gN5WmSKgHTb9518+mPtW60LXeFmnHoPA+LjPTpJTgp/s1aKDe+M\neXZghhILFFDY0NM/fLahm1l8XZQsitbFCUlkCcBCCYuHjxG2ofiJnRpFDwcJCGnI\nEYHMu1C5lcxV60atVWndMkHOPBaqO2uhQ5l6Y/98Hvaf7UVfBTmQJgH9EpyUknnm\nppKsLgnvAgMBAAECggEAFHEPmq7FNl6bQDcpWqDNwmOP7NDZTv93ZSS7pB16zV7/\n4vriAH9NQ3XkEYiUuA+RMvJMKXN9/nLAupkMPj2tqSHGTTTI5yZzwKuLH4q4y33n\nbIuKO5Sabv1HenWOB7OGpTVpanEOb53CxosRyeEgGisoVkzRqM0wVg/ShZr"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@classroom-5b5c6.iam.gserviceaccount.com
FIREBASE_PROJECT_ID=classroom-5b5c6
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC32EyY-0xUaKDDuyyPesqL443JX0Goh8s
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=classroom-5b5c6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=classroom-5b5c6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=classroom-5b5c6.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=143853250457
NEXT_PUBLIC_FIREBASE_APP_ID=1:143853250457:web:eeb35eb7689f6394e51508
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-NENN2MGR4Y
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=pportal.notification@gmail.com
SMTP_PASS=xvuh unfy macs ptow
DB_RETRY_ATTEMPTS=3
DB_RETRY_DELAY=2000
DEBUG_DB_TIMEOUT=false
```

## Step 2: Deploy

1. Click "Create Web Service" (for manual) or "Apply" (for Blueprint)
2. Wait for the deployment to complete
3. Note the service URL (e.g., `https://practical-portal-backend.onrender.com`)

## Step 3: Test the Deployment

1. Visit `https://your-service-url.onrender.com/health`
2. You should see a JSON response indicating the API is running
3. Test database connectivity: `https://your-service-url.onrender.com/health/db`

## Step 4: Update Frontend Configuration

Update your frontend's API base URL to point to your Render service:

```javascript
// In your frontend environment variables
NEXT_PUBLIC_API_URL=https://your-service-url.onrender.com/api
```

## Migration from Railway

If you're migrating from Railway:

1. **Update Environment Variables**: Copy all environment variables from Railway to Render
2. **Update Frontend**: Change the API URL in your frontend from Railway to Render
3. **Test Thoroughly**: Ensure all endpoints work correctly
4. **Monitor**: Keep an eye on logs and performance during the transition

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check that all database environment variables are correct
   - Ensure the database is running and accessible

2. **CORS Errors**
   - Verify that `FRONTEND_URL` is set correctly
   - Check that the frontend URL matches exactly

3. **Firebase Authentication Issues**
   - Ensure Firebase service account credentials are properly formatted
   - Check that the private key includes proper line breaks

4. **Build Failures**
   - Check the build logs in Render dashboard
   - Ensure all dependencies are in package.json

### Logs

- View logs in the Render dashboard under your service
- Check both build logs and runtime logs

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | Server port | Yes | `10000` |
| `DATABASE_HOST` | Database host | Yes | `srv1741.hstgr.io` |
| `DATABASE_USER` | Database username | Yes | `u344397447_classroom` |
| `DATABASE_PASSWORD` | Database password | Yes | `Classroom@9156332109` |
| `DATABASE_NAME` | Database name | Yes | `u344397447_classroom` |
| `JWT_SECRET` | JWT signing secret | Yes | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | Yes | `7d` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes | `classroom-5b5c6` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase private key | Yes | `-----BEGIN PRIVATE KEY-----...` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase client email | Yes | `firebase-adminsdk-...@...iam.gserviceaccount.com` |
| `FRONTEND_URL` | Frontend application URL | Yes | `https://practicalportal.vercel.app` |
| `CORS_ORIGIN` | CORS origin URL | Yes | `https://practicalportal.vercel.app` |
| `SMTP_HOST` | SMTP server host | Yes | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | Yes | `587` |
| `SMTP_USER` | SMTP username | Yes | `pportal.notification@gmail.com` |
| `SMTP_PASS` | SMTP password | Yes | `your-app-password` |
| `DB_RETRY_ATTEMPTS` | Database retry attempts | No | `3` |
| `DB_RETRY_DELAY` | Database retry delay (ms) | No | `2000` |
| `DEBUG_DB_TIMEOUT` | Debug database timeout | No | `false` |

## Security Notes

1. Never commit `.env` files to version control
2. Use strong, unique secrets for production
3. Regularly rotate API keys and secrets
4. Monitor your service for unusual activity

## Render vs Railway Comparison

### Render Advantages
✅ **Free Tier**: More generous free tier with better performance
✅ **Better Documentation**: Comprehensive guides and examples
✅ **Blueprint Support**: Infrastructure as code with render.yaml
✅ **Better Monitoring**: Built-in metrics and alerting
✅ **Automatic SSL**: SSL certificates managed automatically
✅ **Custom Domains**: Easy custom domain setup
✅ **Better Logs**: More detailed logging and debugging

### Railway Advantages
✅ **Faster Deployments**: Slightly faster build times
✅ **Better Database Integration**: Native database services
✅ **Simpler Setup**: Fewer configuration steps

## Support

If you encounter issues:
1. Check the Render documentation: https://render.com/docs
2. Review the service logs in Render dashboard
3. Verify all environment variables are set correctly
4. Test the health endpoint first: `/health`
5. Check database connectivity: `/health/db`
6. Render Community: https://community.render.com
