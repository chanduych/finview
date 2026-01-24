# Vercel Deployment Troubleshooting - Data Not Showing

## Problem
Localhost shows data correctly, but Vercel deployment shows no tables/data even though the database has data.

## Most Common Causes

### 1. Missing Environment Variables ⚠️ **MOST LIKELY ISSUE**

#### Check if environment variables are set on Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Verify these variables exist:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

#### ✅ How to Add Missing Variables:

```bash
# Option 1: Via Vercel CLI
vercel env add VITE_SUPABASE_URL production
# Paste: https://xllfgwnjkuialelzrnrn.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste your anon key from .env file
```

**OR**

Via Vercel Dashboard:
1. Go to: https://vercel.com/your-username/my-invest-tracker/settings/environment-variables
2. Click **"Add New"**
3. Add:
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://xllfgwnjkuialelzrnrn.supabase.co`
   - **Environments:** Check all (Production, Preview, Development)
4. Click **"Add New"** again
5. Add:
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Your Supabase anon key
   - **Environments:** Check all (Production, Preview, Development)

#### 🔄 After Adding Variables:

**IMPORTANT:** You MUST redeploy after adding environment variables!

```bash
vercel --prod
```

OR click **"Redeploy"** in the Vercel dashboard.

---

### 2. Check Browser Console for Errors

Open your Vercel site and check the browser console:

**Chrome/Edge:**
- Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- Go to **Console** tab

**Look for these errors:**

❌ **Error:** `VITE_SUPABASE_URL is not defined`
- **Fix:** Environment variables not set on Vercel (see #1 above)

❌ **Error:** `Invalid API key`
- **Fix:** Wrong `VITE_SUPABASE_ANON_KEY` value

❌ **Error:** `Failed to fetch` or `Network error`
- **Fix:** Check Supabase project is running (not paused)

❌ **Error:** `Row Level Security policy violation`
- **Fix:** RLS policies issue (see #4 below)

---

### 3. Verify Build Logs on Vercel

1. Go to your Vercel project dashboard
2. Click on the latest deployment
3. Click **"Building"** tab
4. Look for errors in the build logs

**Common build errors:**
- Missing dependencies
- TypeScript errors
- Build configuration issues

---

### 4. Supabase Database Issues

#### Check if RLS Policies are Applied

1. Go to Supabase Dashboard: https://app.supabase.com/project/xllfgwnjkuialelzrnrn
2. Go to **Database** → **Tables**
3. For each table (`portfolios`, `transactions`, `dividends`, `accounts`):
   - Click on the table
   - Click **"Policies"** tab
   - Verify policies exist (you should see policies like "Users can view own portfolios")

#### If Policies are Missing:

Run the `supabase-schema.sql` file again:

1. Go to **SQL Editor** in Supabase
2. Copy contents of `supabase-schema.sql` from your project
3. Paste and click **"Run"**

---

### 5. Authentication Issues

#### Check if User is Logged In

Open browser console on your Vercel site and run:

```javascript
// Check auth state
console.log(localStorage);
```

Look for keys like:
- `sb-xllfgwnjkuialelzrnrn-auth-token`

If missing, you're not logged in. Try:
1. Log out
2. Log in again
3. Check if data appears

---

### 6. Supabase URL Redirect Issue

#### Verify Supabase Redirect URLs

1. Go to: https://app.supabase.com/project/xllfgwnjkuialelzrnrn/auth/url-configuration
2. Check **"Site URL"** is set to your Vercel URL:
   ```
   https://your-app-name.vercel.app
   ```
3. Check **"Redirect URLs"** includes:
   ```
   https://your-app-name.vercel.app
   https://your-app-name.vercel.app/**
   ```

---

### 7. Vercel Function Issues (API Routes)

If your market data isn't loading:

#### Check API routes are deployed:

Visit these URLs in your browser:
- `https://your-app.vercel.app/api/nse?symbol=RELIANCE`
- `https://your-app.vercel.app/api/mf?scheme=12345`

**Expected:** JSON response
**If 404:** API functions not deployed

**Fix:**
1. Ensure `api/` folder exists in your project root
2. Redeploy:
   ```bash
   vercel --prod
   ```

---

## Quick Diagnostic Steps

Run these commands to check your setup:

### 1. Check Local Environment Variables
```bash
cat .env
```

Should show:
```
VITE_SUPABASE_URL=https://xllfgwnjkuialelzrnrn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2. Check Vercel Environment Variables
```bash
vercel env ls
```

Should show both variables for Production.

### 3. Check if Build Includes Environment Variables

After deployment, check your Vercel deployment logs:
1. Go to Vercel dashboard
2. Click deployment
3. Look for "Environment Variables" section in build logs

---

## Still Not Working?

### Enable Debug Mode

Add this to your code temporarily to see what's happening:

**src/App.jsx** (around line 67):

```javascript
const useSupabase = hasSupabaseConfig && user;
console.log('🔍 Debug Info:', {
  hasSupabaseConfig,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKeyExists: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  user: user?.email,
  useSupabase
});
```

Deploy and check browser console for this log.

---

## Most Likely Solution

**90% of "no data" issues on Vercel are due to missing environment variables.**

### Quick Fix:

1. **Add environment variables on Vercel:**
   - `VITE_SUPABASE_URL` = `https://xllfgwnjkuialelzrnrn.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (your anon key from `.env`)

2. **Redeploy:**
   ```bash
   vercel --prod
   ```

3. **Clear browser cache and reload**

4. **Sign in again**

That should fix it! 🎉

---

## Environment Variables Checklist

✅ Environment variables added to Vercel
✅ Selected all environments (Production, Preview, Development)
✅ Redeployed after adding variables
✅ Cleared browser cache
✅ Logged in with valid credentials
✅ Supabase redirect URLs include Vercel domain
✅ RLS policies exist in database

If you've checked all these and it still doesn't work, check the browser console for specific errors.
