# 🚀 Practical Portal - Deployment Guide

This guide covers deploying the Practical Portal application to production with recommended configurations for both frontend and backend.

## 📋 Pre-Deployment Checklist

### ✅ Development Prerequisites
- [ ] All features tested locally
- [ ] Database schema up to date
- [ ] Environment variables configured
- [ ] Firebase project set up
- [ ] SSL certificates ready (for custom domains)

## 🔧 Environment Setup

### 1. Environment Variables

Copy `env.example` to your respective environment files:

```bash
# For development
cp env.example .env.local

# For production
cp env.example .env.production
```

Fill in all required variables according to your environment.

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare for Deployment

1. **Update API Base URL**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com/api
   ```

2. **Build and Test**:
   ```bash
   npm run build
   npm run start
   ```

### Step 2: Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy**:
   ```bash
   vercel login
   vercel --prod
   ```

3. **Environment Variables in Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all `NEXT_PUBLIC_*` variables
   - Add domain-specific variables

### Step 3: Domain Configuration

1. **Custom Domain** (Optional):
   - Add your domain in Vercel settings
   - Update DNS records as instructed

2. **Update CORS Origins**:
   - Update backend CORS settings to include your domain

## ⚙️ Backend Deployment (Render/Railway)

### Option A: Deploy to Render

1. **Create Render Account**: https://render.com

2. **Create Web Service**:
   - Connect your GitHub repository
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Set environment: `Node.js`

3. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=10000
   DB_HOST=your_mysql_host
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=practical_portal
   JWT_SECRET=your_production_jwt_secret
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

4. **Database Setup**:
   - Use Render's managed PostgreSQL or connect external MySQL
   - Run schema setup after deployment

### Option B: Deploy to Railway

1. **Create Railway Account**: https://railway.app

2. **Deploy from GitHub**:
   - Connect repository
   - Select backend directory
   - Configure environment variables

3. **Database Configuration**:
   - Add MySQL database service
   - Connect to your backend service

### Option C: Deploy to Hostinger VPS

1. **Server Setup**:
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   
   # Install MySQL
   sudo apt update
   sudo apt install mysql-server
   ```

2. **Application Deployment**:
   ```bash
   # Clone repository
   git clone your-repo-url
   cd practical-portal/backend
   
   # Install dependencies
   npm install --production
   
   # Start with PM2
   pm2 start server.js --name "practical-portal-api"
   pm2 startup
   pm2 save
   ```

3. **Nginx Configuration**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🗄️ Database Deployment

### Option A: Cloud MySQL (Recommended)

1. **PlanetScale** (MySQL):
   ```env
   DATABASE_URL=mysql://username:password@host:port/database?ssl={"rejectUnauthorized":true}
   ```

2. **Railway MySQL**:
   - Add MySQL service to your Railway project
   - Use provided connection string

3. **AWS RDS**:
   - Create MySQL instance
   - Configure security groups
   - Use connection string

### Option B: Local Database Migration

1. **Export Local Database**:
   ```bash
   mysqldump -u root -p practical_portal > practical_portal_backup.sql
   ```

2. **Import to Production**:
   ```bash
   mysql -h your_host -u your_user -p your_database < practical_portal_backup.sql
   ```

### Database Schema Setup

Run the following after database is created:

```bash
# In backend directory
node db/setup-database.js
```

## 🔒 Security Configuration

### 1. Enable HTTPS

- **Vercel**: Automatic HTTPS
- **Custom Domain**: Use Let's Encrypt or Cloudflare

### 2. Environment Security

```env
# Use strong secrets
JWT_SECRET=your_very_long_random_string_here_minimum_32_characters
BCRYPT_ROUNDS=12

# Restrict CORS
CORS_ORIGIN=https://your-exact-domain.com

# Enable rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

### 3. Firebase Security Rules

Update Firebase Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-pictures/{allPaths=**} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.metadata.owner;
    }
  }
}
```

## 🔧 Post-Deployment Configuration

### 1. Test All Features

- [ ] User registration/login
- [ ] Profile management
- [ ] Batch creation/joining
- [ ] Submission system
- [ ] Real-time updates
- [ ] File uploads
- [ ] Theme toggle
- [ ] Settings management

### 2. Performance Optimization

1. **Enable Compression**:
   ```javascript
   // In server.js
   const compression = require('compression');
   app.use(compression());
   ```

2. **Database Indexing**:
   ```sql
   CREATE INDEX idx_user_email ON users(email);
   CREATE INDEX idx_batch_teacher ON batches(teacher_id);
   CREATE INDEX idx_submission_batch ON submissions(batch_id);
   ```

3. **CDN Setup** (Optional):
   - Use Cloudflare for static assets
   - Configure caching policies

### 3. Monitoring Setup

1. **Error Tracking**:
   ```bash
   npm install @sentry/node @sentry/nextjs
   ```

2. **Logging**:
   ```javascript
   // Use winston for structured logging
   const winston = require('winston');
   ```

3. **Health Checks**:
   ```javascript
   // Add health check endpoint
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });
   ```

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Check `CORS_ORIGIN` environment variable
   - Verify domain matches exactly

2. **Database Connection**:
   - Test connection with CLI tools
   - Check firewall/security groups
   - Verify SSL requirements

3. **File Upload Issues**:
   - Check Firebase Storage rules
   - Verify file size limits
   - Test with different file types

4. **Authentication Problems**:
   - Verify Firebase configuration
   - Check JWT secrets match
   - Test with different browsers

### Logs and Debugging

1. **Frontend Logs**:
   - Check browser console
   - Vercel function logs

2. **Backend Logs**:
   - PM2: `pm2 logs practical-portal-api`
   - Render: Check dashboard logs
   - Railway: Check deployment logs

## 📞 Support

- Check logs first
- Test in development environment
- Verify environment variables
- Check service status pages

## 🎉 Success!

Your Practical Portal should now be running in production! 

Access it at your deployed URL and verify all functionality works as expected.

---

**Remember**: Always backup your database before major updates and keep your environment variables secure!
