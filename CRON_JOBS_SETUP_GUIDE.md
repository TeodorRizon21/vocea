# 🕐 Complete Cron Jobs Setup Guide

This guide covers how to properly set up cron jobs for recurring payments and other scheduled tasks in different environments.

## 🎯 Table of Contents
- [Understanding Cron Jobs](#understanding-cron-jobs)
- [Vercel Setup (Recommended)](#vercel-setup-recommended)
- [GitHub Actions Setup](#github-actions-setup)
- [Alternative Solutions](#alternative-solutions)
- [Security Best Practices](#security-best-practices)
- [Monitoring & Debugging](#monitoring--debugging)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## 📚 Understanding Cron Jobs

### What are Cron Jobs?
Cron jobs are scheduled tasks that run automatically at specified times. For recurring payments, you need:
- **Reliable execution** - Runs even when no users are active
- **Proper authentication** - Secure access to your APIs
- **Error handling** - Graceful failure management
- **Logging** - Track execution and debug issues

### Cron Expression Syntax
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 7) (Sunday=0 or 7)
│ │ │ │ │
* * * * *
```

**Common Examples:**
```bash
0 9 * * *     # Every day at 9:00 AM UTC
0 */6 * * *   # Every 6 hours
0 0 1 * *     # First day of every month at midnight
0 12 * * 1    # Every Monday at noon
*/15 * * * *  # Every 15 minutes
```

---

## 🚀 Vercel Setup (Recommended)

Vercel doesn't support traditional cron jobs, but offers several alternatives:

### Option 1: Vercel Cron Jobs (Beta) ⭐ **BEST**

1. **Create `vercel.json` in your project root:**
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

2. **Update your cron endpoint to handle Vercel's authentication:**
```typescript
// app/api/cron/recurring-payments/route.ts
export async function GET(request: Request) {
  // Vercel Cron Jobs send a GET request with special headers
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Check if it's from Vercel Cron (has special header)
  const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
  
  if (!isVercelCron && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Your existing cron logic here...
  return processRecurringPayments();
}

// Keep your existing POST method for manual testing
export async function POST(request: Request) {
  // Your existing POST logic
}
```

3. **Deploy to Vercel:**
```bash
vercel --prod
```

4. **Monitor in Vercel Dashboard:**
   - Go to your project dashboard
   - Click "Functions" tab
   - View cron job execution logs

### Option 2: External Cron Service + Vercel ⭐ **RELIABLE**

**Using Cron-Job.org (Free):**

1. **Go to [cron-job.org](https://cron-job.org)**
2. **Create account and add job:**
   - URL: `https://yourdomain.com/api/cron/recurring-payments`
   - Method: POST
   - Schedule: `0 9 * * *` (9 AM daily)
   - Headers: `Authorization: Bearer YOUR_SECRET`

3. **Set up your endpoint:**
```typescript
export async function POST(request: Request) {
  // Verify the request is from your cron service
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_RECURRING_SECRET}`;
  
  if (authHeader !== expectedAuth) {
    console.log('[CRON] Unauthorized access attempt from:', request.headers.get('user-agent'));
    return new Response("Unauthorized", { status: 401 });
  }
  
  // Your cron logic here...
}
```

### Option 3: GitHub Actions + Vercel ⭐ **FREE & RELIABLE**

**Already set up for you!** Your existing workflow:
```yaml
# .github/workflows/recurring-payments.yml
name: Recurring Payments Processor
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC daily
  workflow_dispatch:      # Manual trigger

jobs:
  process-recurring-payments:
    runs-on: ubuntu-latest
    steps:
      - name: Process Recurring Payments
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_RECURRING_SECRET }}" \
            "${{ secrets.APP_URL }}/api/cron/recurring-payments"
```

---

## 🏗️ GitHub Actions Setup

Your current setup is actually **very good**! Here's how to optimize it:

### 1. **Required Secrets in GitHub:**
Go to GitHub → Your Repo → Settings → Secrets and Variables → Actions

```
CRON_RECURRING_SECRET = your_random_secret_here
APP_URL = https://yourdomain.com
```

### 2. **Enhanced Workflow (Optional):**
```yaml
name: Recurring Payments Processor

on:
  schedule:
    - cron: '0 9 * * *'    # 9 AM UTC (12 PM Romania)
    - cron: '0 21 * * *'   # 9 PM UTC (12 AM Romania) - backup run
  workflow_dispatch:
    inputs:
      force_run:
        description: 'Force run even if no subscriptions due'
        required: false
        default: 'false'

jobs:
  process-recurring-payments:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Process Recurring Payments
        id: process
        run: |
          echo "🔄 Starting recurring payments processing..."
          
          response=$(curl -L -s -w "HTTPSTATUS:%{http_code}" \
            -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_RECURRING_SECRET }}" \
            -H "Content-Type: application/json" \
            --max-time 300 \
            "${{ secrets.APP_URL }}/api/cron/recurring-payments")
          
          body=$(echo "$response" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
          status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
          
          echo "Status: $status"
          echo "Response: $body"
          
          if [ "$status" -eq 200 ]; then
            echo "✅ Success"
            echo "$body" | jq -r '.results | "📊 Processed: \(.processed), Successful: \(.successful), Failed: \(.failed)"' || echo "Response: $body"
          else
            echo "❌ Failed with status $status"
            exit 1
          fi

      - name: Notify on Failure
        if: failure()
        run: |
          echo "🚨 Cron job failed! Check the logs above."
          # Optional: Send notification to Slack/Discord/Email
```

### 3. **Testing Your GitHub Action:**
```bash
# Manual trigger from GitHub
gh workflow run "Recurring Payments Processor"

# Or from command line
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/USERNAME/REPO/actions/workflows/recurring-payments.yml/dispatches \
  -d '{"ref":"main"}'
```

---

## 🔄 Alternative Solutions

### 1. **Upstash Qstash** (Serverless Cron)
```bash
npm install @upstash/qstash
```

```typescript
import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

// Schedule recurring job
await qstash.publishJSON({
  url: "https://yourdomain.com/api/cron/recurring-payments",
  body: { action: "process" },
  headers: {
    "Authorization": `Bearer ${process.env.CRON_RECURRING_SECRET}`
  },
  cron: "0 9 * * *"
});
```

### 2. **Railway/Render Cron Jobs**
If using Railway or Render, they have built-in cron support:

```dockerfile
# Dockerfile
FROM node:18-alpine
# ... your app setup ...
RUN echo "0 9 * * * node /app/scripts/cron.js" | crontab -
CMD ["sh", "-c", "crond && npm start"]
```

### 3. **Supabase Edge Functions**
```sql
-- In Supabase, create a scheduled function
select cron.schedule('recurring-payments', '0 9 * * *', $$
  select net.http_post(
    url := 'https://yourdomain.com/api/cron/recurring-payments',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret'))
  );
$$);
```

---

## 🔐 Security Best Practices

### 1. **Strong Secret Generation**
```bash
# Generate a strong secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. **Multiple Security Layers**
```typescript
export async function POST(request: Request) {
  // Layer 1: Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_RECURRING_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // Layer 2: User-Agent validation (optional)
  const userAgent = request.headers.get('user-agent') || '';
  const allowedAgents = ['GitHub-Hookshot', 'curl', 'vercel-cron'];
  if (!allowedAgents.some(agent => userAgent.includes(agent))) {
    console.warn(`[CRON] Suspicious user-agent: ${userAgent}`);
  }
  
  // Layer 3: IP validation (if using known IPs)
  const forwardedFor = request.headers.get('x-forwarded-for');
  // Add IP validation if needed
  
  // Layer 4: Rate limiting
  // Implement rate limiting to prevent abuse
  
  return processRecurringPayments();
}
```

### 3. **Environment Variables**
```bash
# .env.local (development)
CRON_RECURRING_SECRET=your_secret_here
NETOPIA_API_KEY=your_netopia_key
NETOPIA_POS_SIGNATURE=your_pos_signature

# Production (Vercel)
# Set these in Vercel dashboard under Environment Variables
```

---

## 📊 Monitoring & Debugging

### 1. **Logging Strategy**
```typescript
export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`[CRON:${requestId}] Started at ${new Date().toISOString()}`);
  
  try {
    const result = await processRecurringPayments();
    
    console.log(`[CRON:${requestId}] Completed in ${Date.now() - startTime}ms`);
    console.log(`[CRON:${requestId}] Results:`, result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[CRON:${requestId}] Failed after ${Date.now() - startTime}ms:`, error);
    
    // Optional: Send to error tracking service
    // await sendToSentry(error, { requestId, context: 'recurring-payments' });
    
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 2. **Health Check Endpoint**
```typescript
// app/api/cron/health/route.ts
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev'
  });
}
```

### 3. **Monitoring Dashboard**
```typescript
// app/api/cron/status/route.ts
export async function GET() {
  // Get last 10 cron executions from your logs/database
  const recentRuns = await getRecentCronRuns();
  
  return NextResponse.json({
    lastRun: recentRuns[0],
    successRate: calculateSuccessRate(recentRuns),
    avgDuration: calculateAvgDuration(recentRuns),
    upcomingSubscriptions: await getUpcomingRenewals()
  });
}
```

---

## ❌ Common Mistakes to Avoid

### 1. **Timezone Confusion**
```bash
# ❌ Wrong - assuming server timezone
0 9 * * *  # Could be 9 AM in any timezone

# ✅ Correct - always use UTC and convert
0 6 * * *  # 6 AM UTC = 9 AM Romania (UTC+3)
```

### 2. **Missing Error Handling**
```typescript
// ❌ Wrong - no error handling
export async function POST() {
  const users = await prisma.user.findMany();
  // What if database is down?
}

// ✅ Correct - proper error handling
export async function POST() {
  try {
    const users = await prisma.user.findMany();
  } catch (error) {
    console.error('[CRON] Database error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
```

### 3. **No Authentication**
```typescript
// ❌ Wrong - anyone can trigger
export async function POST() {
  return processPayments();
}

// ✅ Correct - authenticated
export async function POST(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  return processPayments();
}
```

### 4. **Infinite Loops**
```typescript
// ❌ Wrong - could run forever
while (true) {
  await processPayment();
}

// ✅ Correct - with timeout
const maxRunTime = 5 * 60 * 1000; // 5 minutes
const startTime = Date.now();

while (hasMoreWork && (Date.now() - startTime) < maxRunTime) {
  await processPayment();
}
```

---

## 🎯 Recommended Setup for Your Project

Based on your current setup, here's what I recommend:

### **Primary: GitHub Actions** (Already working!)
- ✅ Your current workflow is solid
- ✅ Runs daily at 9 AM UTC
- ✅ Has manual trigger option
- ✅ Free and reliable

### **Backup: External Cron Service**
Add this as a backup using cron-job.org:
1. Create account on cron-job.org
2. Add job: `https://yourdomain.com/api/cron/recurring-payments`
3. Set to run 30 minutes after GitHub Actions (9:30 AM UTC)
4. Add header: `Authorization: Bearer YOUR_SECRET`

### **Monitoring: Simple Logging**
Your current logging is good, just add:
```typescript
// Add to your cron endpoint
console.log(`[CRON] Execution source: ${request.headers.get('user-agent')}`);
console.log(`[CRON] Total execution time: ${Date.now() - startTime}ms`);
```

---

## 🚀 Quick Setup Checklist

- [ ] Environment variables set in GitHub Secrets
- [ ] Cron endpoint has proper authentication
- [ ] GitHub Actions workflow exists and is enabled
- [ ] Test manual trigger works
- [ ] Monitoring/logging in place
- [ ] Backup cron service configured (optional)
- [ ] Error notifications set up (optional)

Your current setup is actually **really good**! The GitHub Actions approach is reliable and free. Just make sure your secrets are set correctly and test the manual trigger to verify everything works.

Need help with any specific part? 🚀