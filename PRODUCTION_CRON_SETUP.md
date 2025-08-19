# 🚀 Production Cron Job Setup Guide

## Overview
Your recurring payment system uses GitHub Actions to automatically call your API endpoint every day. This is a **serverless cron job** approach that's perfect for Vercel/Netlify deployments.

## 🔧 Required Setup for Production

### 1. **GitHub Repository Secrets**
Go to: **GitHub → Your Repository → Settings → Secrets and Variables → Actions**

Add these secrets:
```
CRON_RECURRING_SECRET = 8bb2965171aa10ffb7005a499844d3626dd01108ece9e5e46a11518dbbc98f0e
APP_URL = https://your-production-domain.com
```

### 2. **Vercel Environment Variables**
In your Vercel dashboard, add:
```
CRON_RECURRING_SECRET = 8bb2965171aa10ffb7005a499844d3626dd01108ece9e5e46a11518dbbc98f0e
```

## 📅 How It Works

### **Automatic Schedule:**
- **Every day at 9 AM UTC** (12 PM Romanian time)
- GitHub Actions calls: `POST https://your-domain.com/api/cron/recurring-payments`
- Your API finds subscriptions expiring in 3 days
- Processes automatic renewals using saved tokens
- Extends subscriptions by 30 days

### **Manual Trigger:**
- Go to: **GitHub → Actions → Recurring Payments Processor**
- Click "Run workflow" to test immediately

## 🧪 Testing Before Production

### Test the workflow manually:
1. **Push your code** to GitHub
2. **Set up the secrets** in GitHub Actions
3. **Go to Actions tab** → "Recurring Payments Processor"
4. **Click "Run workflow"** → "Run workflow"
5. **Check the logs** to see if it works

### Expected output:
```
🔄 Processing recurring payments...
Status Code: 200
Response Body: {"success":true,"message":"Recurring payments processing completed","results":{"processed":2,"successful":2,"failed":0,"errors":[]}}
✅ Recurring payments processed successfully
📊 Results: Processed: 2, Successful: 2, Failed: 0
```

## 🚨 Monitoring & Alerts

### **Check if it's working:**
- Go to **GitHub → Actions** to see recent runs
- Green checkmark = Success ✅
- Red X = Failed ❌

### **Get email notifications:**
GitHub will automatically email you if the workflow fails.

### **Manual monitoring:**
You can check your app's debug endpoint:
```bash
curl https://your-domain.com/api/test/recurring-check
```

## 🔄 Alternative: Vercel Cron (Optional)

If you prefer Vercel's native cron jobs:

1. **Add to `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/recurring-payments",
      "schedule": "0 9 * * *"
    }
  ]
}
```

2. **Enable Vercel Cron** (Pro plan required)
3. **Add authentication** to your endpoint

## 📊 Production Monitoring

### **Success Metrics:**
- Daily runs should show "processed: X, successful: X, failed: 0"
- Users get subscription extensions automatically
- No payment failures or expired subscriptions

### **Troubleshooting:**
- **401 Unauthorized**: Check `CRON_RECURRING_SECRET` matches
- **500 Error**: Check your database connection and Netopia API keys
- **No subscriptions processed**: Normal if no subscriptions are expiring soon

## ✅ You're Ready!

Your system is **production-ready**:
- ✅ Secure authentication with secrets
- ✅ Error handling and logging
- ✅ Automatic subscription extensions
- ✅ Email notifications for failures
- ✅ Manual testing capability

Just add the secrets to GitHub Actions and push to production!