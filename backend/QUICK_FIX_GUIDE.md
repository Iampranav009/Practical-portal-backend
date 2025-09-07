# Quick Fix Guide - Common Deployment Issues

## 🚨 Emergency Fixes (Server Down)

### 1. Rate Limiting Error
**Error:** `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
**Quick Fix:** 
- Server should auto-recover with new error handling
- If not, restart the service on Render

### 2. Database Timeout
**Error:** `ETIMEDOUT`, `ECONNRESET`
**Quick Fix:**
- Wait 30 seconds for auto-retry
- Check database provider status
- Server will return 503 with retry guidance

### 3. Circuit Breaker Open
**Error:** `Circuit breaker is open`
**Quick Fix:**
- Wait 30 seconds for automatic reset
- Check database connectivity
- Server will attempt reconnection

## 🔧 Common Issues & Solutions

### Database Connection Issues
```bash
# Check if database is responding
curl https://practical-portal-backend.onrender.com/health

# Expected response:
{
  "success": true,
  "database": {
    "healthy": true/false,
    "connectionStatus": {...}
  }
}
```

### API Not Responding
```bash
# Test basic connectivity
curl https://practical-portal-backend.onrender.com/

# Test API endpoint
curl https://practical-portal-backend.onrender.com/api/auth/test
```

### CORS Issues
- Check if frontend URL is in allowed origins
- Verify CORS headers in response
- Check browser console for specific CORS errors

## 📊 Monitoring Commands

### Check Server Status
```bash
# Health check
curl https://practical-portal-backend.onrender.com/health

# CORS test
curl https://practical-portal-backend.onrender.com/cors-test
```

### Check Database
```bash
# Database health
curl https://practical-portal-backend.onrender.com/health | jq '.database'
```

## 🚀 Deployment Checklist

Before deploying:
- [ ] All environment variables set
- [ ] Database connection tested
- [ ] Rate limiting configured
- [ ] CORS origins updated
- [ ] Error handling in place

After deploying:
- [ ] Health check passes
- [ ] API endpoints respond
- [ ] Database queries work
- [ ] No console errors
- [ ] Frontend can connect

## 📞 When to Escalate

**Immediate Action Needed:**
- Server returns 500 errors consistently
- Database completely unavailable for >5 minutes
- Rate limiting blocking all requests
- Memory usage >80% consistently

**Monitor Closely:**
- Occasional 503 errors (normal for free hosting)
- Database timeouts <30 seconds
- Rate limiting warnings
- Connection pool usage >50%

## 🔄 Recovery Procedures

### Full Service Restart
1. Go to Render dashboard
2. Find your service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Monitor logs during restart

### Database Reset
1. Check database provider dashboard
2. Look for connection issues
3. Consider restarting database service
4. Wait for automatic recovery

### Rate Limiting Reset
1. Check if legitimate traffic spike
2. Review rate limiting logs
3. Temporarily increase limits if needed
4. Monitor for abuse

## 📈 Performance Tips

### For Free Hosting:
- Keep connection pool small (2 connections)
- Use aggressive timeouts
- Implement proper error handling
- Monitor resource usage

### For Better Performance:
- Upgrade to paid hosting
- Use connection pooling service
- Implement caching
- Add load balancing

---

*Keep this guide handy for quick troubleshooting!*
