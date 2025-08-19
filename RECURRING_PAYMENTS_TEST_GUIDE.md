# 🧪 Recurring Payments Testing Guide

This guide will help you test your Netopia recurring payments system step by step.

## 🚀 Quick Test Commands

### 1. Start Your Development Server
```bash
npm run dev
```

### 2. Run the Test Script
```bash
node scripts/test-recurring-payments.js
```

### 3. Check Database State
```bash
curl http://localhost:3000/api/test/recurring-check
```

## 📋 Step-by-Step Testing Process

### Phase 1: Environment Setup ✅

1. **Verify Environment Variables**
   ```bash
   # Check these are set in your .env.local
   echo $NETOPIA_API_KEY
   echo $NETOPIA_POS_SIGNATURE
   echo $CRON_RECURRING_SECRET
   ```

2. **Test Database Connection**
   ```bash
   curl http://localhost:3000/api/test/recurring-check
   ```
   Expected: JSON response with database state

### Phase 2: Create Test Data 🎯

**Option A: Create Test Subscription (Fake Token)**
```bash
# Create a subscription that expires in 1 day with fake token
curl -X POST http://localhost:3000/api/test/create-test-subscription \
  -H "Content-Type: application/json" \
  -d '{"daysUntilExpiry": 1, "planName": "Bronze"}'
```

**Option B: Real Payment Flow (Recommended)**
1. Go to your website's subscription page
2. Select a plan with "Enable Auto-Renewal" checked
3. Complete a real Netopia payment in sandbox mode
4. Verify the token was saved by checking `/api/test/recurring-check`

### Phase 3: Test the Cron Job 🤖

1. **Manual Cron Test**
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_CRON_RECURRING_SECRET" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/cron/recurring-payments
   ```

2. **Using Test Script**
   ```bash
   node scripts/test-recurring-payments.js
   ```

3. **Check Results**
   ```bash
   curl http://localhost:3000/api/test/recurring-check
   ```

### Phase 4: Production Testing 🏭

1. **GitHub Actions (Automatic)**
   - The workflow runs daily at 9:00 AM UTC
   - Check Actions tab in GitHub for results
   - Manual trigger: GitHub → Actions → "Recurring Payments Processor" → Run workflow

2. **Manual Production Test**
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $CRON_RECURRING_SECRET" \
     -H "Content-Type: application/json" \
     https://your-domain.com/api/cron/recurring-payments
   ```

## 🔍 What to Look For

### ✅ Success Indicators

**Cron Job Logs:**
```
[RECURRING_CRON] Found valid recurring token for user clerkId
[RECURRING_CRON] Using EXACT payment data from User profile
[RECURRING_CRON] ✅ Successfully renewed subscription for email
```

**Database Changes:**
- New Order created with `isRecurring: true`
- Subscription `endDate` extended by 30 days
- Order status = 'COMPLETED' (if auto-paid) or 'PENDING' (if needs user action)

### ❌ Common Issues

**"No recurring token found"**
- User hasn't completed a payment with auto-renewal enabled
- Check `/api/test/recurring-check` to see users with tokens

**"Unauthorized" (401)**
- `CRON_RECURRING_SECRET` environment variable missing or incorrect
- Check your `.env.local` file

**"Plan not found"**
- User's `planType` doesn't match any plan in database
- Check Plans table in your database

**Netopia API Errors**
- Token expired or invalid
- Wrong API credentials
- Sandbox vs Production environment mismatch

## 🛠️ Debug Tools

### 1. Database State Check
```bash
curl http://localhost:3000/api/test/recurring-check | jq
```

### 2. Create Test Subscription
```javascript
// In your browser console on a logged-in page
fetch('/api/test/create-test-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ daysUntilExpiry: 1, planName: 'Bronze' })
}).then(r => r.json()).then(console.log)
```

### 3. View Cron Logs
Check your server logs or Vercel/hosting platform logs for detailed cron execution information.

## 📊 Test Scenarios

### Scenario 1: Happy Path
1. User pays with auto-renewal ✅
2. Token saved to User table ✅
3. Subscription created ✅
4. Cron finds expiring subscription ✅
5. Creates recurring payment ✅
6. Extends subscription ✅

### Scenario 2: Token Expired
1. User has expired token
2. Cron skips renewal
3. Subscription marked as expired
4. User gets notification (if implemented)

### Scenario 3: Payment Fails
1. Cron attempts renewal
2. Netopia returns error
3. Order marked as FAILED
4. Subscription marked as expired
5. User notified of failure

## 🚨 Emergency Commands

### Stop All Recurring Payments
```sql
UPDATE User SET autoRenewEnabled = false WHERE autoRenewEnabled = true;
```

### Check Failed Payments
```bash
curl http://localhost:3000/api/test/recurring-check | jq '.details.recentRecurringOrders[] | select(.status == "FAILED")'
```

### Manual Subscription Extension (Emergency)
```sql
UPDATE Subscription 
SET endDate = DATE_ADD(endDate, INTERVAL 30 DAY), status = 'active' 
WHERE userId = 'USER_ID_HERE' AND status IN ('expired', 'payment_failed');
```

---

## 📞 Need Help?

If you encounter issues:

1. Check the logs in your console/hosting platform
2. Verify all environment variables are set
3. Test with the debug endpoints first
4. Use sandbox mode for testing
5. Check Netopia dashboard for payment status

Remember: Always test in sandbox mode first! 🏖️