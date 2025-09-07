# Render Deployment Guide for Practical Portal Backend

This guide will help you deploy the Practical Portal backend API to Render.

## Prerequisites

1. A GitHub repository with your backend code
2. A Render account
3. A MySQL database (can be created on Render or use external service)

## Step 1: Create a MySQL Database on Render

1. Go to your Render dashboard
2. Click "New +" and select "PostgreSQL" (or MySQL if available)
3. Choose "Free" plan
4. Name your database (e.g., `practical-portal-db`)
5. Note down the connection details

## Step 2: Deploy the Backend Service

1. Go to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Choose the repository and branch (main)
5. Configure the service:

### Service Configuration

- **Name**: `practical-portal-backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

### Environment Variables

Add these environment variables in the Render dashboard:

```
NODE_ENV=production
PORT=10000
DB_HOST=your-database-host-from-render
DB_USER=your-database-user-from-render
DB_PASSWORD=your-database-password-from-render
DB_NAME=your-database-name-from-render
JWT_SECRET=your-super-secure-jwt-secret-key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nyour-firebase-private-key\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=your-firebase-client-email@your-project.iam.gserviceaccount.com
EMAIL_SERVICE_API_KEY=your-email-service-api-key
FRONTEND_URL=https://your-frontend-app.vercel.app
CORS_ORIGIN=https://your-frontend-app.vercel.app
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## Step 3: Deploy

1. Click "Create Web Service"
2. Wait for the deployment to complete
3. Note the service URL (e.g., `https://practical-portal-backend.onrender.com`)

## Step 4: Test the Deployment

1. Visit `https://your-service-url.onrender.com/health`
2. You should see a JSON response indicating the API is running

## Step 5: Update Frontend Configuration

Update your frontend's API base URL to point to your Render service:

```javascript
// In your frontend environment variables
NEXT_PUBLIC_API_URL=https://your-service-url.onrender.com/api
```

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

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | Yes |
| `PORT` | Server port | Yes |
| `DB_HOST` | Database host | Yes |
| `DB_USER` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `DB_NAME` | Database name | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Yes |
| `EMAIL_SERVICE_API_KEY` | Email service API key | No |
| `FRONTEND_URL` | Frontend application URL | Yes |
| `CORS_ORIGIN` | CORS origin URL | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | No |
| `CLOUDINARY_API_KEY` | Cloudinary API key | No |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | No |

## Security Notes

1. Never commit `.env` files to version control
2. Use strong, unique secrets for production
3. Regularly rotate API keys and secrets
4. Monitor your service for unusual activity

## Support

If you encounter issues:
1. Check the Render documentation
2. Review the service logs
3. Verify all environment variables are set correctly
4. Test the health endpoint first
