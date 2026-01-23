# Supabase Integration Guide

This guide explains how to integrate Supabase backend into your existing Investment Tracker application.

## Overview

Your application currently uses `localStorage` for data persistence. We've created a parallel implementation using Supabase that provides:

- ✅ Cloud-based data storage
- ✅ User authentication
- ✅ Multi-device synchronization
- ✅ Real-time updates
- ✅ Data backup and recovery
- ✅ Scalability

## Implementation Status

### Completed Components

1. **Supabase Configuration** (`src/config/supabase.js`)
   - Supabase client initialization
   - Table name constants

2. **Database Schema** (`supabase-schema.sql`)
   - Complete SQL schema for all tables
   - Row Level Security (RLS) policies
   - Indexes for performance
   - Triggers for automatic timestamps

3. **Authentication System**
   - Auth Context (`src/contexts/AuthContext.jsx`)
   - Login Form (`src/components/Auth/LoginForm.jsx`)
   - Signup Form (`src/components/Auth/SignupForm.jsx`)
   - Auth Page (`src/components/Auth/AuthPage.jsx`)

4. **Data Service Layer** (`src/services/supabaseService.js`)
   - Complete CRUD operations for all entities
   - Real-time subscription support
   - Bulk operations for migration

5. **Supabase-Aware Hook** (`src/hooks/useSupabasePortfolio.js`)
   - Drop-in replacement for `usePortfolio`
   - Real-time data synchronization
   - Optimistic updates

6. **Migration Tool** (`src/components/MigrationModal.jsx`)
   - Automatic localStorage → Supabase migration
   - Progress tracking
   - Error handling

## How to Enable Supabase

### Option 1: Complete Replacement (Recommended)

Update your `App.jsx` to use Supabase:

```jsx
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import MigrationModal from './components/MigrationModal';
import { useSupabasePortfolio } from './hooks/useSupabasePortfolio';
// ... other imports

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [showMigration, setShowMigration] = React.useState(false);

  // Replace usePortfolio with useSupabasePortfolio
  const {
    portfolio,
    accounts,
    // ... all other props
  } = useSupabasePortfolio();

  React.useEffect(() => {
    // Check if migration is needed
    if (user && !authLoading) {
      const migrated = localStorage.getItem('my_invest_tracker_migrated');
      const hasLocalData = localStorage.getItem('my_invest_tracker_portfolio');

      if (!migrated && hasLocalData) {
        setShowMigration(true);
      }
    }
  }, [user, authLoading]);

  // Show auth page if not authenticated
  if (!user) {
    return <AuthPage />;
  }

  // Show migration modal if needed
  if (showMigration) {
    return (
      <MigrationModal
        isOpen={showMigration}
        onClose={() => setShowMigration(false)}
        onComplete={() => {
          setShowMigration(false);
          // Reload the page to refresh data
          window.location.reload();
        }}
      />
    );
  }

  // Rest of your existing App component code...
  return (
    <>
      {/* Your existing JSX */}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
```

### Option 2: Toggle Between localStorage and Supabase

Create a feature flag to switch between implementations:

```jsx
// src/config/features.js
export const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';

// In App.jsx
import { USE_SUPABASE } from './config/features';
import { usePortfolio } from './hooks/usePortfolio';
import { useSupabasePortfolio } from './hooks/useSupabasePortfolio';

const portfolioHook = USE_SUPABASE ? useSupabasePortfolio : usePortfolio;
const {
  portfolio,
  accounts,
  // ... rest
} = portfolioHook();
```

Then in your `.env`:
```env
VITE_USE_SUPABASE=true
```

## Integration Steps

### Step 1: Setup Supabase

Follow the instructions in `SUPABASE_SETUP.md`:

1. Create Supabase project
2. Run database schema
3. Configure environment variables
4. Enable authentication

### Step 2: Install Dependencies

Dependencies are already installed:
- `@supabase/supabase-js` ✓

### Step 3: Update Your App

Choose one of the integration options above and update `src/App.jsx`.

### Step 4: Update Main Entry Point

Update `src/main.jsx` to wrap your app with AuthProvider:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
```

### Step 5: Test Authentication

1. Start your app: `npm run dev`
2. You should see the login page
3. Sign up with a test account
4. Verify you can access the app

### Step 6: Migrate Data (if applicable)

If you have existing data:

1. The migration modal will appear automatically
2. Click "Migrate Now"
3. Wait for completion
4. Your data is now in Supabase!

## API Compatibility

The `useSupabasePortfolio` hook is designed to be API-compatible with `usePortfolio`:

### Same Interface

```javascript
const {
  portfolio,        // Array of portfolio items
  accounts,         // Array of account names
  marketPrices,     // Market price data
  selectedView,     // Current view filter
  expandedGroups,   // Expanded asset type groups
  addAsset,         // Function to add asset
  updateAsset,      // Function to update asset
  deleteAsset,      // Function to delete asset
  addAccount,       // Function to add account
  deleteAccount,    // Function to delete account
  // ... etc
} = useSupabasePortfolio();
```

### Additional Features

```javascript
const {
  loading,          // Loading state
  error,            // Error state
  refreshData,      // Manual refresh function
  accountsData,     // Full account objects (with IDs)
  // ... existing props
} = useSupabasePortfolio();
```

## Component Updates Needed

### Minimal Changes Required

Most components work without changes! However, you might want to add:

1. **Loading States**
```jsx
if (loading) {
  return <LoadingSpinner />;
}
```

2. **Error Handling**
```jsx
if (error) {
  return <ErrorMessage error={error} />;
}
```

3. **Account Deletion**
Update to use account IDs instead of names:
```jsx
// Before
deleteAccount(accountName);

// After
const account = accountsData.find(a => a.name === accountName);
if (account) {
  deleteAccount(account.id);
}
```

## Authentication Flow

### User States

1. **Not Authenticated** → Show `AuthPage`
2. **Authenticated + Has Local Data** → Show `MigrationModal`
3. **Authenticated + Migrated** → Show `App`

### Adding Sign Out

Add a sign out button to your Header or Settings:

```jsx
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { signOut, user } = useAuth();

  return (
    <header>
      {/* ... existing header content */}
      <button onClick={signOut}>
        Sign Out
      </button>
      <div>
        {user?.email}
      </div>
    </header>
  );
};
```

## Real-time Updates

Real-time sync is automatically enabled! Changes made on one device will appear on others within seconds.

### How It Works

1. User makes a change on Device A
2. Data is saved to Supabase
3. Supabase broadcasts the change
4. Device B receives the update
5. Device B refreshes its data

### Customizing Real-time Behavior

Edit `src/hooks/useSupabasePortfolio.js`:

```javascript
// Disable real-time
// Remove or comment out the useEffect that calls subscribeToPortfolios

// Custom handling
useEffect(() => {
  if (!user) return;

  const channel = subscribeToPortfolios(user.id, (payload) => {
    console.log('Change detected:', payload);

    // Only refresh for specific events
    if (payload.eventType === 'INSERT') {
      loadData();
    }
  });

  return () => unsubscribe(channel);
}, [user]);
```

## Performance Considerations

### Loading States

Always show loading indicators:

```jsx
const { loading } = useSupabasePortfolio();

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}
```

### Optimistic Updates

The hook automatically reloads data after mutations. For better UX, implement optimistic updates:

```javascript
const handleDelete = async (assetId) => {
  // Optimistically update UI
  setPortfolio(prev => prev.filter(p => p.id !== assetId));

  // Make API call
  const { error } = await deleteAsset(assetId);

  // Rollback on error
  if (error) {
    await refreshData();
    showError(error);
  }
};
```

### Caching

Market prices are cached in Supabase for 5 minutes. You can still use localStorage for additional caching:

```javascript
// Cache market prices locally
useEffect(() => {
  localStorage.setItem('my_invest_tracker_market_prices', JSON.stringify(marketPrices));
}, [marketPrices]);
```

## Troubleshooting Integration

### "Cannot read property 'name' of undefined"

**Issue:** Account object structure changed
**Solution:** Update code to handle both formats:

```javascript
const accountName = typeof account === 'string' ? account : account.name;
```

### "RLS policy violation"

**Issue:** Row Level Security blocking access
**Solution:**
1. Ensure you're signed in
2. Check RLS policies in Supabase dashboard
3. Verify user_id matches in database

### Data Not Syncing

**Issue:** Real-time not working
**Solution:**
1. Check network tab for WebSocket connection
2. Verify Supabase project is active
3. Check browser console for errors

## Rollback Plan

If you need to rollback to localStorage:

1. **Set Feature Flag**
```env
VITE_USE_SUPABASE=false
```

2. **Or Revert App.jsx**
```jsx
// Change back to
import { usePortfolio } from './hooks/usePortfolio';

// Instead of
import { useSupabasePortfolio } from './hooks/useSupabasePortfolio';
```

3. **Your localStorage data is still there!**
   - No data loss
   - Instant rollback

## Testing Checklist

Before deploying to production:

- [ ] Authentication works (sign up, sign in, sign out)
- [ ] Data migration completes successfully
- [ ] Can create/read/update/delete portfolios
- [ ] Can create/read/update/delete transactions
- [ ] Can create/read/delete dividends
- [ ] Can create/delete accounts
- [ ] Multi-device sync works
- [ ] Loading states display correctly
- [ ] Error messages display correctly
- [ ] Market data refreshes properly
- [ ] Export/import still works
- [ ] Mobile view works correctly

## Next Steps

1. Complete Supabase setup (see `SUPABASE_SETUP.md`)
2. Choose integration option (complete replacement or toggle)
3. Update `App.jsx` with chosen approach
4. Test thoroughly
5. Deploy to production
6. Monitor for issues

## Support

For integration help:
- Check `SUPABASE_SETUP.md` for backend setup
- Review code comments in implemented files
- Check Supabase documentation
- Create GitHub issue for bugs

---

**Ready to integrate?** Start with `SUPABASE_SETUP.md`! 🚀
