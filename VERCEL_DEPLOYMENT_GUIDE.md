# 🚀 Vercel Deployment Guide

This guide will help you deploy the Practical Portal Frontend to Vercel.

## ✅ Pre-deployment Checklist

- [x] Code pushed to GitHub repository
- [x] Build command working (`npm run build`)
- [x] Vercel configuration optimized
- [x] Environment variables documented
- [x] README.md updated

## 🔗 GitHub Repository

**Repository**: [https://github.com/Iampranav009/Practical-portal-frontend](https://github.com/Iampranav009/Practical-portal-frontend)

## 🚀 Deployment Steps

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import the repository: `Iampranav009/Practical-portal-frontend`

### Step 2: Configure Project Settings

Vercel will auto-detect Next.js and use these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (frontend folder)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 3: Environment Variables

Add these environment variables in Vercel dashboard:

#### Required Variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_BASE_URL=your_backend_api_url
```

#### Optional Variables:
```env
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Practical Portal
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Step 4: Deploy

1. Click "Deploy" button
2. Wait for build to complete (2-3 minutes)
3. Your app will be live at: `https://practical-portal-frontend.vercel.app`

## 🔧 Vercel Configuration

The project includes optimized Vercel settings in `vercel.json`:

```json
{
  "version": 2,
  "name": "practical-portal-frontend",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "functions": {
    "src/app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🌐 Custom Domain (Optional)

To add a custom domain:

1. Go to Project Settings → Domains
2. Add your domain (e.g., `practical-portal.com`)
3. Update DNS records as instructed
4. SSL certificate will be automatically provisioned

## 📊 Performance Optimizations

The deployment includes:

- **Automatic CDN** distribution
- **Image optimization** with Next.js Image component
- **Code splitting** for optimal loading
- **Compression** enabled
- **Security headers** configured
- **Edge functions** support

## 🔄 Automatic Deployments

- **Production**: Deploys on push to `main` branch
- **Preview**: Deploys on pull requests
- **Manual**: Deploy from any branch

## 🐛 Troubleshooting

### Build Failures
- Check environment variables are set correctly
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Runtime Errors
- Verify Firebase configuration
- Check API endpoints are accessible
- Review browser console for errors

### Performance Issues
- Enable Vercel Analytics
- Check Core Web Vitals
- Optimize images and assets

## 📈 Monitoring

### Vercel Analytics
- Enable in Project Settings
- Monitor performance metrics
- Track user behavior

### Error Tracking
- Built-in error reporting
- Real-time error notifications
- Performance monitoring

## 🔐 Security

The deployment includes:
- **HTTPS** by default
- **Security headers** (CSP, X-Frame-Options, etc.)
- **Environment variable** protection
- **DDoS protection**

## 📱 Mobile Optimization

- **Responsive design** for all devices
- **Touch-friendly** interface
- **Progressive Web App** capabilities
- **Fast loading** on mobile networks

## 🎯 Next Steps After Deployment

1. **Test all functionality** on the live site
2. **Set up monitoring** and analytics
3. **Configure custom domain** (if needed)
4. **Set up CI/CD** for automatic deployments
5. **Monitor performance** and optimize

## 📞 Support

If you encounter issues:

1. Check Vercel documentation
2. Review build logs
3. Test locally with production environment variables
4. Contact support if needed

---

**🎉 Your Practical Portal Frontend is now live on Vercel!**

**Live URL**: [https://practical-portal-frontend.vercel.app](https://practical-portal-frontend.vercel.app)
