# Migration Guide: Railway to Render

This guide will help you migrate your Practical Portal backend from Railway to Render.

## Pre-Migration Checklist

- [ ] Backup your current Railway deployment
- [ ] Note down all environment variables from Railway
- [ ] Ensure your code is pushed to GitHub
- [ ] Test your current Railway deployment to ensure it's working

## Migration Steps

### Step 1: Create Render Account and Service

1. **Sign up for Render**: Go to [render.com](https://render.com) and create an account
2. **Connect GitHub**: Link your GitHub repository to Render
3. **Create Web Service**: 
   - Click "New +" → "Web Service"
   - Select your repository
   - Choose the `backend` folder as root directory
   - Or use the Blueprint option with `render.yaml`

### Step 2: Configure Environment Variables

Copy all environment variables from your Railway dashboard to Render:

#### Required Variables
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
```

#### Firebase Configuration
```
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
```

#### Email Configuration
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=pportal.notification@gmail.com
SMTP_PASS=xvuh unfy macs ptow
```

#### Database Optimization
```
DB_RETRY_ATTEMPTS=3
DB_RETRY_DELAY=2000
DEBUG_DB_TIMEOUT=false
```

### Step 3: Deploy to Render

1. **Deploy**: Click "Create Web Service" in Render
2. **Monitor**: Watch the build logs for any issues
3. **Test**: Once deployed, test the health endpoints:
   - `https://your-render-url.onrender.com/health`
   - `https://your-render-url.onrender.com/health/db`

### Step 4: Update Frontend Configuration

Update your frontend to use the new Render URL:

1. **Update Environment Variables**: Change the API URL in your frontend
2. **Update CORS**: Ensure CORS settings allow the new Render domain
3. **Test**: Verify all frontend-backend communication works

### Step 5: DNS and Domain Updates

If you have a custom domain:
1. **Update DNS**: Point your domain to the new Render service
2. **SSL**: Render will automatically provision SSL certificates
3. **Test**: Verify the custom domain works correctly

### Step 6: Final Testing

- [ ] Health check endpoints work
- [ ] Database connectivity is working
- [ ] Authentication flows work
- [ ] File uploads work
- [ ] Email notifications work
- [ ] All API endpoints respond correctly
- [ ] Frontend can communicate with backend

### Step 7: Cleanup Railway

Once everything is working on Render:
1. **Monitor**: Keep Railway running for 24-48 hours as backup
2. **Verify**: Ensure Render is stable and performing well
3. **Cleanup**: Delete the Railway service and project
4. **Update Documentation**: Update any documentation with new URLs

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

2. **Database Connection Issues**
   - Verify database credentials are correct
   - Check if database allows connections from Render IPs
   - Test database connectivity from Render logs

3. **Environment Variable Issues**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify special characters are properly escaped

4. **CORS Issues**
   - Update CORS_ORIGIN to match your frontend URL
   - Check if frontend URL is correctly configured

### Rollback Plan

If issues occur:
1. **Keep Railway**: Don't delete Railway until Render is fully tested
2. **Quick Switch**: Update frontend to point back to Railway
3. **Debug**: Fix issues on Render while Railway serves traffic
4. **Re-deploy**: Once fixed, switch back to Render

## Performance Comparison

| Feature | Railway | Render |
|---------|---------|--------|
| Free Tier | Limited | More generous |
| Build Time | Faster | Slightly slower |
| Cold Starts | Minimal | Some cold starts |
| Monitoring | Basic | Better |
| Logs | Good | Excellent |
| SSL | Automatic | Automatic |
| Custom Domains | Yes | Yes |

## Support

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Migration Issues**: Check logs and environment variables first

## Post-Migration

After successful migration:
1. **Monitor Performance**: Keep an eye on response times and error rates
2. **Update Team**: Inform team members of the new deployment URL
3. **Update CI/CD**: Update any automated deployment scripts
4. **Backup Strategy**: Ensure you have proper backup procedures in place
