# Vercel Deployment Guide

## 🚀 Deploying Practical Portal Frontend to Vercel

This guide will help you deploy your Next.js frontend to Vercel with proper configuration.

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Environment Variables**: Firebase and API configuration ready

### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `Iampranav009/Practical-portal-frontend`
4. Select the `frontend` folder as the root directory

### Step 2: Configure Environment Variables

In Vercel dashboard, go to Project Settings → Environment Variables and add:

#### Required Environment Variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com/api

# App Configuration
NEXT_PUBLIC_APP_NAME=Practical Portal
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production
```

### Step 3: Build Configuration

Vercel will automatically detect Next.js and use these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install`

### Step 4: Deploy

1. Click "Deploy" in Vercel dashboard
2. Wait for the build to complete (usually 2-3 minutes)
3. Your app will be available at `https://your-app-name.vercel.app`

### Step 5: Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel

### Environment-Specific Deployments

#### Production Environment:
- **Branch**: `main`
- **Environment Variables**: Production values
- **Domain**: Your custom domain or Vercel subdomain

#### Preview Environment:
- **Branch**: `develop` or feature branches
- **Environment Variables**: Staging values
- **Domain**: Auto-generated preview URLs

### Configuration Files

#### `vercel.json`
- Defines deployment settings
- Configures headers and redirects
- Sets up API rewrites

#### `next.config.ts`
- Optimizes for Vercel deployment
- Configures image optimization
- Sets up webpack optimizations

### Troubleshooting

#### Common Issues:

1. **Build Failures**:
   - Check environment variables are set
   - Verify all dependencies are in `package.json`
   - Check build logs in Vercel dashboard

2. **API Connection Issues**:
   - Update `NEXT_PUBLIC_API_BASE_URL` to your backend URL
   - Check CORS configuration on backend
   - Verify backend is deployed and accessible

3. **Firebase Issues**:
   - Verify Firebase project configuration
   - Check Firebase console for authentication settings
   - Ensure all Firebase environment variables are correct

4. **Image Loading Issues**:
   - Update `next.config.ts` with correct domains
   - Check image URLs and formats
   - Verify image optimization settings

### Performance Optimization

#### Automatic Optimizations:
- ✅ Static site generation where possible
- ✅ Image optimization and WebP conversion
- ✅ Code splitting and lazy loading
- ✅ CDN distribution worldwide
- ✅ Automatic HTTPS

#### Manual Optimizations:
- Bundle size monitoring
- Core Web Vitals tracking
- Performance budgets
- Lighthouse CI integration

### Monitoring and Analytics

1. **Vercel Analytics**: Built-in performance monitoring
2. **Real User Monitoring**: Track actual user experience
3. **Function Logs**: Monitor API calls and errors
4. **Speed Insights**: Core Web Vitals tracking

### Security Features

- ✅ Automatic HTTPS
- ✅ Security headers (configured in `vercel.json`)
- ✅ DDoS protection
- ✅ Bot protection
- ✅ Edge security

### Backup and Recovery

- ✅ Automatic backups with Git
- ✅ Rollback to previous deployments
- ✅ Environment variable backup
- ✅ Database backup (if using Vercel Postgres)

### Cost Optimization

- ✅ Free tier: 100GB bandwidth, 1000 builds/month
- ✅ Pro tier: $20/month for unlimited bandwidth
- ✅ Pay-per-use for additional resources
- ✅ Automatic scaling

### Support

- **Documentation**: [Vercel Docs](https://vercel.com/docs)
- **Community**: [Vercel Discord](https://vercel.com/discord)
- **Support**: Available in Vercel dashboard

---

## 🎉 Deployment Complete!

Your Practical Portal frontend is now live on Vercel with:
- ⚡ Lightning-fast performance
- 🔒 Enterprise-grade security
- 🌍 Global CDN distribution
- 📊 Built-in analytics
- 🔄 Automatic deployments from Git

**Next Steps:**
1. Test all functionality on the live site
2. Configure your backend API URL
3. Set up monitoring and alerts
4. Consider custom domain setup
