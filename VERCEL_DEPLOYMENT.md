# Deploy to Vercel - Complete Guide

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your Supabase credentials ready
3. Git repository (GitHub, GitLab, or Bitbucket)

---

## Method 1: Deploy via Vercel CLI (Fastest)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### Step 3: Deploy

From your project directory:

```bash
vercel
```

**First deployment prompts:**
- "Set up and deploy?" → **Yes**
- "Which scope?" → Select your account
- "Link to existing project?" → **No**
- "What's your project's name?" → `my-invest-tracker` (or custom name)
- "In which directory is your code located?" → `./`
- "Want to override settings?" → **No**

The CLI will:
1. Build your project
2. Deploy to a preview URL
3. Give you a URL like `https://my-invest-tracker-xxx.vercel.app`

### Step 4: Add Environment Variables

```bash
vercel env add VITE_SUPABASE_URL
```
Paste your Supabase URL when prompted.

```bash
vercel env add VITE_SUPABASE_ANON_KEY
```
Paste your Supabase Anon Key when prompted.

Select **Production**, **Preview**, and **Development** for both.

### Step 5: Redeploy with Environment Variables

```bash
vercel --prod
```

Your app is now live! 🎉

---

## Method 2: Deploy via Vercel Dashboard (Recommended for Teams)

### Step 1: Push to Git

If you haven't already:

```bash
git init
git add .
git commit -m "Initial commit for Vercel deployment"
```

Push to GitHub/GitLab/Bitbucket:

```bash
git remote add origin https://github.com/YOUR_USERNAME/my-invest-tracker.git
git branch -M main
git push -u origin main
```

### Step 2: Import Project to Vercel

1. Go to https://vercel.com/new
2. Click **"Import Project"**
3. Select your Git provider (GitHub/GitLab/Bitbucket)
4. Find and select your `my-invest-tracker` repository
5. Click **"Import"**

### Step 3: Configure Project

Vercel will auto-detect your Vite configuration.

**Build Settings:**
- Framework Preset: **Vite**
- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Install Command: `npm install` (auto-detected)

### Step 4: Add Environment Variables

Before deploying, click **"Environment Variables"**:

Add these variables:

| Name | Value |
|------|-------|
|

**Important:** Make sure to select **Production**, **Preview**, and **Development** for each variable.

### Step 5: Deploy

Click **"Deploy"**

Vercel will:
1. Clone your repository
2. Install dependencies
3. Build your project
4. Deploy to a production URL

⏱️ Deployment takes 1-3 minutes.

Once done, you'll get a URL like:
```
https://my-invest-tracker.vercel.app
```

---

## Step 6: Configure Supabase for Production

### Update Supabase Redirect URLs

1. Go to your Supabase Dashboard: https://app.supabase.com/project/xllfgwnjkuialelzrnrn/auth/url-configuration

2. Add your Vercel URL to **"Site URL"**:
   ```
   https://my-invest-tracker.vercel.app
   ```

3. Add to **"Redirect URLs"**:
   ```
   https://my-invest-tracker.vercel.app
   https://my-invest-tracker.vercel.app/**
   ```

4. Click **"Save"**

This ensures Google OAuth and password reset links work correctly.

---

## Automatic Deployments

Once connected to Git, Vercel will automatically:
- Deploy every push to `main` branch → Production
- Deploy every pull request → Preview URL
- Deploy every commit to other branches → Preview URL

---

## Custom Domain (Optional)

### Add Your Own Domain

1. Go to your project dashboard on Vercel
2. Click **"Settings"** → **"Domains"**
3. Enter your domain (e.g., `myinvestments.com`)
4. Follow the DNS configuration instructions
5. Vercel will automatically handle SSL certificates

---

## Troubleshooting

### Issue: White Screen After Deployment

**Solution:** Check browser console for errors. Usually means environment variables are missing.

```bash
# Check if env vars are set
vercel env ls
```

### Issue: Google OAuth Redirect Error

**Solution:** Make sure you added your Vercel URL to Supabase redirect URLs (Step 6 above).

### Issue: 404 on Page Refresh

**Solution:** The `vercel.json` file handles this with SPA routing. Make sure it's committed to your repo.

### Issue: Build Fails

**Check your build locally:**
```bash
npm run build
```

If it works locally, check Vercel build logs for specific errors.

---

## Environment Variables Reference

Your `.env` file (local development):
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

These must be added to Vercel as environment variables (Steps 4 above).

---

## Monitoring and Analytics

### View Deployment Logs

1. Go to your project on Vercel
2. Click on a deployment
3. Click **"Building"** or **"Runtime Logs"** to see logs

### Enable Analytics (Optional)

1. Go to **"Analytics"** tab in your project
2. Vercel provides free basic analytics
3. Upgrade for more detailed insights

---

## Production Checklist

Before going live, ensure:

- [ ] Environment variables added to Vercel
- [ ] Supabase redirect URLs updated with Vercel domain
- [ ] Email confirmation configured in Supabase (see DISABLE_EMAIL_CONFIRMATION.md)
- [ ] Test signup, login, and Google OAuth on production URL
- [ ] Test portfolio data sync across devices
- [ ] Configure custom domain (optional)
- [ ] Enable HTTPS (automatic with Vercel)

---

## Quick Commands Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs [deployment-url]

# List environment variables
vercel env ls

# Pull env vars to local
vercel env pull

# Remove a deployment
vercel remove [deployment-name]
```

---

## Cost

Vercel offers:
- **Free Tier:** 100GB bandwidth, unlimited deployments
- Perfect for personal projects and small apps
- Your Investment Tracker will likely stay within free tier limits

---

## Next Steps

After deployment:
1. Test all features on production URL
2. Share the app with others
3. Monitor usage via Vercel dashboard
4. Set up custom domain if needed
5. Enable email confirmation in Supabase for production security

---

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Supabase Docs: https://supabase.com/docs

Your Investment Tracker is now live and accessible worldwide! 🚀
