# Migration Feature - Disabled

## Status: DISABLED

The localStorage to Supabase migration feature has been **disabled by default** to prevent conflicts with browser data.

## Why Disabled?

The migration modal was checking for old localStorage data and attempting to migrate it automatically. This could cause issues when:
- Multiple users use the same browser
- Old test data exists in localStorage
- You want a clean start with Supabase

## Current Behavior

When you sign in:
- ✅ App loads data directly from Supabase
- ✅ No migration modal appears
- ✅ Clean experience for new and existing users

## If You Need Migration

If you have **old data in localStorage** that you want to migrate to Supabase:

### Option 1: Enable Migration (Recommended)

1. Open `src/App.jsx`
2. Find the section marked `// MIGRATION CHECK - DISABLED` (around line 693)
3. Uncomment the `useEffect` code
4. Find the section around line 731 and uncomment the migration modal render
5. Uncomment the import: `import MigrationModal from './components/MigrationModal';` (line 22)
6. Uncomment the state: `const [showMigration, setShowMigration] = useState(false);` (line 54)
7. Refresh your browser

The migration modal will appear if localStorage data is detected.

### Option 2: Manual Export/Import

1. **Export from localStorage:**
   - Open your app WITHOUT Supabase configured (or in incognito mode)
   - Go to Settings → Export Data → Download JSON

2. **Import to Supabase:**
   - Sign in to your Supabase-enabled app
   - Go to Settings → Import Data → Upload the JSON file

### Option 3: Start Fresh

Simply sign in and start adding your portfolio from scratch.

## For Developers

### Code Locations

The migration feature is disabled in these locations:

1. **src/App.jsx:22** - Import commented out
   ```javascript
   // import MigrationModal from './components/MigrationModal';
   ```

2. **src/App.jsx:54** - State commented out
   ```javascript
   // const [showMigration, setShowMigration] = useState(false);
   ```

3. **src/App.jsx:693-708** - Migration check disabled
   ```javascript
   // Migration check useEffect commented out
   ```

4. **src/App.jsx:731-745** - Modal render disabled
   ```javascript
   // MigrationModal render commented out
   ```

### Re-enabling Migration

To re-enable, simply uncomment all four locations mentioned above.

## Files to Keep

These migration-related files are still included but not used:
- `src/components/MigrationModal.jsx` - The migration UI component
- `MIGRATION_DISABLED.md` - This file
- `INTEGRATION_GUIDE.md` - Contains migration instructions

You can safely keep these files for future use or delete them if you're sure you don't need migration.

## Clearing Browser Data

If you want to completely remove old localStorage data:

### Option A: Clear Specific Data (Chrome/Edge)
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Expand **Local Storage**
4. Click on your domain
5. Delete keys starting with `InvestTrack_`

### Option B: Clear All Site Data
1. Go to browser settings
2. Search for "Clear browsing data"
3. Select "Cookies and other site data"
4. Choose time range and clear

## Questions?

- Need help migrating? See `INTEGRATION_GUIDE.md`
- Deployment issues? See `VERCEL_TROUBLESHOOTING.md`
- Setup questions? See `SUPABASE_SETUP.md`
