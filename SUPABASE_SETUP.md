# Supabase Backend Setup Guide

This guide will walk you through setting up Supabase as the backend for your Investment Tracker application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Creating a Supabase Project](#creating-a-supabase-project)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Authentication Setup](#authentication-setup)
6. [Migrating Existing Data](#migrating-existing-data)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- Your existing Investment Tracker application

## Creating a Supabase Project

1. **Sign in to Supabase**
   - Go to https://app.supabase.com
   - Sign in or create a new account

2. **Create a New Project**
   - Click "New Project"
   - Choose your organization
   - Enter a project name (e.g., "investment-tracker")
   - Create a strong database password (save this!)
   - Select a region close to your users
   - Click "Create new project"
   - Wait 2-3 minutes for the project to be provisioned

3. **Get Your API Credentials**
   - Go to Project Settings (gear icon in sidebar)
   - Click on "API" in the settings menu
   - Copy your:
     - `Project URL` (looks like: https://xxxxx.supabase.co)
     - `anon/public` key (this is your public API key)

## Database Setup

1. **Open SQL Editor**
   - In your Supabase project dashboard
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Run the Schema Script**
   - Open the `supabase-schema.sql` file in your project
   - Copy all contents
   - Paste into the SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter
   - You should see "Success. No rows returned"

3. **Verify Tables Created**
   - Click "Table Editor" in the left sidebar
   - You should see 5 tables:
     - `accounts`
     - `portfolios`
     - `transactions`
     - `dividends`
     - `market_prices`

## Environment Configuration

1. **Create Environment File**
   ```bash
   # In your project root directory
   cp .env.example .env
   ```

2. **Add Your Supabase Credentials**
   Open `.env` and add:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

## Authentication Setup

Supabase Auth is configured automatically! Here's what's enabled:

### Email/Password Authentication (Default)

1. **Enable Email Provider** (should be enabled by default)
   - Go to Authentication > Providers
   - Ensure "Email" is enabled
   - Configure email templates if desired

2. **Configure Email Templates** (Optional)
   - Go to Authentication > Email Templates
   - Customize signup confirmation, password reset, etc.

3. **Disable Email Confirmation** (for development)
   - Go to Authentication > Settings
   - Scroll to "Email Auth"
   - Toggle "Enable email confirmations" OFF (for easier testing)
   - **Important:** Re-enable this for production!

### Additional Providers (Optional)

You can enable OAuth providers like Google, GitHub, etc.:

1. Go to Authentication > Providers
2. Click on a provider (e.g., Google)
3. Follow the setup instructions
4. Update your login components to include OAuth buttons

## Migrating Existing Data

If you have existing data in localStorage:

### Automatic Migration (Recommended)

1. **Start the Application**
   - Run `npm run dev`
   - Sign up or sign in

2. **Migration Modal**
   - After login, you'll see a migration modal
   - Click "Migrate Now"
   - Wait for the process to complete
   - Your data is now in Supabase!

### Manual Migration (Alternative)

If automatic migration fails:

1. **Export Your Data**
   - Before implementing Supabase, use the app's export feature
   - Save your portfolio data as JSON

2. **Import After Setup**
   - Sign in to your Supabase-backed app
   - Use the import feature
   - Select your exported JSON file

## Testing

### Test Authentication

1. **Sign Up**
   - Open your app
   - Click "Sign Up"
   - Enter email and password
   - Verify you can create an account

2. **Sign In**
   - Sign out
   - Sign in with your credentials
   - Verify successful login

3. **Sign Out**
   - Click your profile/settings
   - Sign out
   - Verify you're redirected to login

### Test Data Operations

1. **Create an Account**
   - Add a new wallet/account
   - Verify it appears in your list

2. **Add an Asset**
   - Add a stock/MF/ETF
   - Verify it's saved

3. **Add a Transaction**
   - Add a transaction to your asset
   - Verify calculations update

4. **Multi-Device Sync**
   - Sign in on another device/browser
   - Verify your data syncs
   - Make changes on one device
   - Check if changes appear on the other

## Troubleshooting

### Common Issues

#### "Failed to fetch" or Connection Errors

**Solution:**
- Verify your `.env` file has correct credentials
- Check if Supabase project is running (go to dashboard)
- Ensure you're not behind a firewall blocking Supabase
- Restart your development server

#### Row Level Security (RLS) Errors

**Solution:**
- Ensure you ran the entire `supabase-schema.sql` script
- Check RLS policies in Table Editor > Select table > Click "RLS"
- Verify policies are enabled

#### "User not authenticated" Errors

**Solution:**
- Sign out and sign in again
- Clear browser cache/cookies
- Check browser console for auth errors
- Verify Supabase session is valid

#### Migration Fails

**Solution:**
- Check browser console for errors
- Verify localStorage has data: Open DevTools > Application > Local Storage
- Ensure accounts exist before migrating portfolios
- Try manual export/import instead

#### Data Not Syncing

**Solution:**
- Check network tab in DevTools for failed requests
- Verify RLS policies are correct
- Check if you're signed in correctly
- Try refreshing the page

### Database Issues

#### Reset Database

If you need to start fresh:

1. Go to Database > Tables
2. Delete all data from tables (keep tables)
3. Or drop and recreate tables using SQL Editor

#### View Database Logs

1. Go to Database > Logs
2. Check for any errors or warnings

### Getting Help

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **GitHub Issues:** Create an issue in your project repo

## Security Considerations

### Production Checklist

Before deploying to production:

- [ ] Enable email confirmations
- [ ] Set up custom email templates
- [ ] Configure proper RLS policies
- [ ] Set up database backups
- [ ] Enable database connection pooling (if needed)
- [ ] Review and limit API rate limits
- [ ] Set up monitoring and alerts
- [ ] Configure CORS if needed
- [ ] Use environment variables properly
- [ ] Never commit `.env` file to git

### Row Level Security (RLS)

All tables have RLS enabled. Users can only:
- View their own data
- Insert their own data
- Update their own data
- Delete their own data

Market prices are public (read-only for all users).

## Advanced Configuration

### Real-time Subscriptions

Real-time updates are enabled by default. To customize:

Edit `src/hooks/useSupabasePortfolio.js`:
```javascript
// Disable real-time
// Comment out the useEffect that sets up subscriptions

// Customize subscription events
subscribeToPortfolios(user.id, (payload) => {
  // Handle only specific events
  if (payload.eventType === 'INSERT') {
    // Handle new portfolio
  }
});
```

### Performance Optimization

For large portfolios:

1. **Pagination:** Implement pagination for transactions
2. **Indexes:** Add indexes to frequently queried fields
3. **Caching:** Use React Query for client-side caching
4. **Lazy Loading:** Load data on-demand

### Backup Strategy

1. **Automatic Backups**
   - Go to Database > Backups
   - Enable Point-in-Time Recovery (paid plans)

2. **Manual Exports**
   - Use the app's export feature regularly
   - Store backups securely

## Next Steps

1. Test all features thoroughly
2. Enable production security features
3. Set up monitoring and analytics
4. Configure email templates
5. Add additional OAuth providers if desired
6. Set up automated backups

---

## Support

If you encounter issues not covered here:

1. Check Supabase documentation
2. Review browser console errors
3. Check Supabase dashboard logs
4. Ask in Supabase Discord
5. Create a GitHub issue

**Happy tracking!** 📈
