# Supabase Quick Start Guide

Get your Investment Tracker running with Supabase in 10 minutes!

## Prerequisites

- Supabase account (free tier works!)
- Node.js installed
- 10 minutes

## Step 1: Create Supabase Project (3 min)

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - Name: `investment-tracker`
   - Database Password: (create a strong password)
   - Region: (choose closest to you)
4. Click "Create new project"
5. ☕ Wait 2-3 minutes

## Step 2: Setup Database (2 min)

1. In Supabase dashboard, click **SQL Editor**
2. Click **New Query**
3. Open `supabase-schema.sql` from your project
4. Copy ALL contents and paste into SQL Editor
5. Click **Run** (Cmd/Ctrl + Enter)
6. Should see "Success. No rows returned"

## Step 3: Get API Keys (1 min)

1. Click **Project Settings** (gear icon)
2. Click **API**
3. Copy these two values:
   - `Project URL`
   - `anon public` key

## Step 4: Configure Environment (1 min)

1. In your project root, create `.env` file:
```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Save the file

## Step 5: Update Your App (3 min)

### Option A: Complete Replacement (Recommended)

Replace your `src/App.jsx` with this structure:

```jsx
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import MigrationModal from './components/MigrationModal';
import { useSupabasePortfolio } from './hooks/useSupabasePortfolio';
// ... keep all your existing imports

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [showMigration, setShowMigration] = useState(false);

  // Replace this line:
  // const { portfolio, accounts, ... } = usePortfolio();

  // With this:
  const {
    portfolio,
    accounts,
    marketPrices,
    selectedView,
    expandedGroups,
    loading,
    error,
    addAsset,
    updateAsset,
    deleteAsset,
    addAccount,
    deleteAccount,
    setMarketPrices,
    setSelectedView,
    setExpandedGroups,
    setPortfolio,
    setAccounts
  } = useSupabasePortfolio();

  // Check for migration on mount
  useEffect(() => {
    if (user && !authLoading) {
      const migrated = localStorage.getItem('my_invest_tracker_migrated');
      const hasLocalData = localStorage.getItem('my_invest_tracker_portfolio');
      if (!migrated && hasLocalData) {
        setShowMigration(true);
      }
    }
  }, [user, authLoading]);

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Show loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show migration modal
  if (showMigration) {
    return (
      <MigrationModal
        isOpen={showMigration}
        onClose={() => setShowMigration(false)}
        onComplete={() => {
          setShowMigration(false);
          window.location.reload();
        }}
      />
    );
  }

  // Keep ALL your existing component code below
  // Just wrap the return with the checks above

  return (
    <>
      {/* ALL YOUR EXISTING JSX CODE */}
    </>
  );
};

// Wrap with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
```

### Option B: Side-by-Side (Testing)

Add to your `.env`:
```env
VITE_USE_SUPABASE=false
```

Change to `true` when ready to test Supabase.

## Step 6: Start Your App

```bash
npm run dev
```

## Step 7: Test It!

1. **Sign Up**
   - You should see a login page
   - Click "Sign up"
   - Enter email and password
   - Create account

2. **Migrate Data** (if you have existing data)
   - Migration modal appears automatically
   - Click "Migrate Now"
   - Wait for completion

3. **Add Data**
   - Create a wallet
   - Add a stock
   - Verify it saves

4. **Test Sync**
   - Open app in another browser/device
   - Sign in with same account
   - Verify data syncs

## Common Issues

### "Failed to fetch"
- Check your `.env` file has correct values
- Restart dev server: `npm run dev`

### "User not authenticated"
- Sign out and sign in again
- Clear browser cache

### Tables don't exist
- Re-run the SQL script in Supabase SQL Editor
- Check "Table Editor" to verify tables exist

### Can't sign up
- Go to Supabase > Authentication > Settings
- Disable "Email Confirmations" (for testing)

## Disable Email Confirmation (Development Only)

For easier testing:

1. Supabase Dashboard
2. Authentication > Settings
3. Find "Email Auth"
4. Toggle OFF "Enable email confirmations"
5. **Re-enable for production!**

## Verification Checklist

- [ ] Supabase project created
- [ ] Database schema executed successfully
- [ ] `.env` file configured with correct keys
- [ ] App runs without errors
- [ ] Can sign up and sign in
- [ ] Can create and view data
- [ ] Data persists after refresh

## Production Checklist

Before deploying:

- [ ] Enable email confirmations
- [ ] Use strong database password
- [ ] Set up proper environment variables in hosting
- [ ] Test on production domain
- [ ] Enable RLS policies (already done if you ran schema)
- [ ] Set up backups

## What's Next?

- Read `SUPABASE_SETUP.md` for detailed configuration
- Read `INTEGRATION_GUIDE.md` for advanced integration
- Customize authentication UI
- Add additional features
- Deploy to production

## Getting Help

- **Setup Issues:** Check `SUPABASE_SETUP.md`
- **Integration Issues:** Check `INTEGRATION_GUIDE.md`
- **Supabase Docs:** https://supabase.com/docs
- **Community:** https://discord.supabase.com

---

## TL;DR - 30 Second Version

```bash
# 1. Create Supabase project at app.supabase.com
# 2. Run supabase-schema.sql in SQL Editor
# 3. Copy API credentials
# 4. Create .env file with credentials
# 5. Update App.jsx to use AuthProvider and useSupabasePortfolio
# 6. npm run dev
# 7. Sign up and migrate data
# 8. Done! 🎉
```

**That's it!** Your Investment Tracker now has cloud backup, authentication, and multi-device sync! 🚀
