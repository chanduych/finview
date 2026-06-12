# Smart Import Feature - Usage Guide
         2 +  
         3 +  ## Overview
         4 +  
         5 +  The new Smart Import feature automatically detects fields from unorganized CSV/Excel data, provides an interactive preview, and allows users to review, edit, and selectively 
           + import assets.
         6 +  
         7 +  ## Features
         8 +  
         9 +  ✅ **Intelligent Field Detection** - Automatically maps columns using fuzzy matching
        10 +  ✅ **Interactive Preview** - Review all assets before importing
        11 +  ✅ **Inline Editing** - Modify dates, wallets, quantities, prices
        12 +  ✅ **Accept/Reject Assets** - Choose which assets to import
        13 +  ✅ **Bulk Operations** - Accept all, reject all, assign wallet to all
        14 +  ✅ **Validation** - Real-time error detection
        15 +  ✅ **Transaction Type Support** - Handles both BUY and SELL transactions
        16 +  
        17 +  ## Integration Example
        18 +  
        19 +  ### Step 1: Add State for Preview Modal
        20 +  
        21 +  ```javascript
        22 +  // In your component (e.g., SettingsModal or App.jsx)
        23 +  import { useState } from 'react';
        24 +  import ImportPreviewModal from './components/ImportPreviewModal';
        25 +  import { handleSmartImport, convertPreviewToPortfolio } from './utils/importExport';
        26 +  
        27 +  // State
        28 +  const [showImportPreview, setShowImportPreview] = useState(false);
        29 +  const [importPreviewData, setImportPreviewData] = useState(null);
        30 +  const [isImporting, setIsImporting] = useState(false);
        31 +  ```
        32 +  
        33 +  ### Step 2: Handle File Selection
        34 +  
        35 +  ```javascript
        36 +  const handleFileImport = async (e) => {
        37 +      try {
        38 +          await handleSmartImport(e, (result) => {
        39 +              // Show preview modal with detected assets
        40 +              setImportPreviewData(result);
        41 +              setShowImportPreview(true);
        42 +          });
        43 +      } catch (error) {
        44 +          alert('Import failed: ' + error.message);
        45 +      }
        46 +  };
        47 +  ```
        48 +  
        49 +  ### Step 3: Handle Final Import
        50 +  
        51 +  ```javascript
        52 +  const handleConfirmImport = async (acceptedAssets) => {
        53 +      setIsImporting(true);
        54 +  
        55 +      try {
        56 +          // Convert preview format to portfolio format
        57 +          const { portfolio: importedPortfolio, accounts: importedAccounts } =
        58 +              convertPreviewToPortfolio(acceptedAssets);
        59 +  
        60 +          // Use your existing bulk import logic
        61 +          if (useSupabase && bulkImportPortfolio) {
        62 +              const result = await bulkImportPortfolio(importedPortfolio, importedAccounts);
        63 +              if (result.error) {
        64 +                  throw new Error(result.error.message);
        65 +              }
        66 +              alert(`✅ Successfully imported ${acceptedAssets.length} assets!`);
        67 +          } else {
        68 +              // LocalStorage mode
        69 +              setPortfolio(prev => [...prev, ...importedPortfolio]);
        70 +              setAccounts(prev => [...new Set([...prev, ...importedAccounts])]);
        71 +              alert(`✅ Successfully imported ${acceptedAssets.length} assets!`);
        72 +          }
        73 +  
        74 +          // Close modals
        75 +          setShowImportPreview(false);
        76 +          setShowSettingsModal(false);
        77 +  
        78 +      } catch (error) {
        79 +          alert('Import failed: ' + error.message);
        80 +      } finally {
        81 +          setIsImporting(false);
        82 +      }
        83 +  };
        84 +  ```
        85 +  
        86 +  ### Step 4: Render Preview Modal
        87 +  
        88 +  ```javascript
        89 +  return (
        90 +      <>
        91 +          {/* Your existing UI */}
        92 +  
        93 +          {/* File input */}
        94 +          <input
        95 +              type="file"
        96 +              accept=".csv,.xlsx,.xls"
        97 +              onChange={handleFileImport}
        98 +              className="..."
        99 +          />
       100 +  
       101 +          {/* Import Preview Modal */}
       102 +          <ImportPreviewModal
       103 +              isOpen={showImportPreview}
       104 +              onClose={() => setShowImportPreview(false)}
       105 +              previewAssets={importPreviewData?.previewAssets || []}
       106 +              stats={importPreviewData?.stats}
       107 +              accounts={accounts}
       108 +              onConfirmImport={handleConfirmImport}
       109 +              isImporting={isImporting}
       110 +          />
       111 +      </>
       112 +  );
       113 +  ```
       114 +  
       115 +  ## Supported Field Names
       116 +  
       117 +  The smart mapper recognizes these column name variations:
       118 +  
       119 +  ### Symbol (Required)
       120 +  - symbol, stock symbol, scrip code, scrip, isin, code, instrument, security, ticker, scheme code
       121 +  
       122 +  ### Name (Optional)
       123 +  - name, security name, stock name, scheme name, company name, description, scrip name
       124 +  
       125 +  ### Quantity (Required)
       126 +  - quantity, qty, shares, units, no. of shares, holdings, balance, net qty, closing balance
       127 +  
       128 +  ### Price (Required)
       129 +  - price, rate, avg price, average price, buy price, purchase price, cost, nav, ltp, last traded price
       130 +  
       131 +  ### Date (Optional)
       132 +  - date, transaction date, trade date, purchase date, buy date, settlement date, txn date
       133 +  
       134 +  ### Account/Wallet (Optional)
       135 +  - account, wallet, portfolio, folio no, client code, broker, demat account
       136 +  
       137 +  ### Type (Optional)
       138 +  - type, asset type, instrument type, category, class, product
       139 +  - Auto-detects: STOCK, MF (Mutual Fund), ETF
       140 +  
       141 +  ### Sector (Optional)
       142 +  - sector, industry, category, sub sector
       143 +  
       144 +  ### Transaction Type (Optional)
       145 +  - transaction type, txn type, buy/sell, action, operation
       146 +  - Recognizes: BUY, SELL, PURCHASE, SALE
       147 +  
       148 +  ## Example CSV Formats
       149 +  
       150 +  ### Format 1: Broker Statement
       151 +  ```csv
       152 +  Symbol,Name,Quantity,Avg Price,Date,Account
       153 +  RELIANCE,Reliance Industries,50,2500.00,2024-01-15,Zerodha
       154 +  TCS,Tata Consultancy Services,25,3800.50,2024-01-20,Zerodha
       155 +  ```
       156 +  
       157 +  ### Format 2: Mutual Fund Statement
       158 +  ```csv
       159 +  Scheme Code,Scheme Name,Units,NAV,Folio No
       160 +  119551,HDFC Equity Fund,150.5,650.25,12345678
       161 +  100123,SBI Bluechip Fund,200,85.30,87654321
       162 +  ```
       163 +  
       164 +  ### Format 3: Unorganized Export
       165 +  ```csv
       166 +  Stock,Shares,Cost,Broker,Purchase Date
       167 +  INFY,100,1500,ICICI,2023-12-01
       168 +  HDFC,50,1650.75,HDFC Sec,2024-01-10
       169 +  ```
       170 +  
       171 +  All these formats will be automatically detected and mapped!
       172 +  
       173 +  ## Preview Modal Features
       174 +  
       175 +  ### Asset Card Actions
       176 +  - ✅ **Accept/Reject** - Toggle checkbox to include/exclude
       177 +  - 📝 **Edit Fields** - Click expand to edit quantity, price, date, wallet
       178 +  - 🔄 **Transaction Type** - Toggle between BUY/SELL
       179 +  - 🏢 **Sector** - Add sector for stocks
       180 +  
       181 +  ### Toolbar Actions
       182 +  - **Accept All** - Accept all assets for import
       183 +  - **Reject All** - Reject all assets
       184 +  - **Assign Wallet to All** - Bulk assign wallet to accepted assets
       185 +  - **Filter by Wallet** - View assets by wallet
       186 +  
       187 +  ### Statistics Display
       188 +  - Total assets detected
       189 +  - Accepted count
       190 +  - Rejected count
       191 +  - Total investment value
       192 +  
       193 +  ## Error Handling
       194 +  
       195 +  The system handles:
       196 +  - Missing required fields (shows error in preview)
       197 +  - Invalid data types (validates numbers, dates)
       198 +  - Duplicate assets (merges transactions)
       199 +  - Empty files (shows error message)
       200 +  - Unsupported formats (shows error message)
       201 +  
       202 +  ## Best Practices
       203 +  
       204 +  1. **Review Before Import** - Always check the preview before confirming
       205 +  2. **Verify Wallets** - Ensure correct wallet is assigned
       206 +  3. **Check Dates** - Verify dates are correct
       207 +  4. **Validate Prices** - Ensure prices make sense
       208 +  5. **Handle Rejections** - Fix rejected assets in your source file and re-import
       209 +  
       210 +  ## Migration Path
       211 +  
       212 +  To migrate from old import to smart import:
       213 +  
       214 +  1. Keep existing `handleImport` for JSON backups (no preview needed)
       215 +  2. Use `handleSmartImport` for CSV/Excel imports (with preview)
       216 +  3. Users get better experience with ability to review and edit before importing
       217 +  
       218 +  ## Future Enhancements
       219 +  
       220 +  - [ ] Custom field mapping UI for ambiguous columns
       221 +  - [ ] Save/load mapping templates for repeated imports
       222 +  - [ ] Support for multiple transaction rows per asset
       223 +  - [ ] Dividend import from statements
       224 +  - [ ] Corporate action handling (splits, bonuses)
       225 +  - [ ] Historical price auto-fill from market data

       1. Smart Import Flow

  - JSON files: Direct import (no preview, it's a backup)
  - CSV/Excel files: Shows preview modal with intelligent field detection

  2. Import Preview Modal Features

  When you import a CSV/Excel, you'll see:
  - ✅ All detected assets in cards
  - ✅ Edit quantity, price, date, wallet for each asset
  - ✅ Accept/Reject individual assets with checkboxes
  - ✅ Bulk operations at the top:
    - "Accept All" button
    - "Reject All" button
    - "Assign wallet to all" dropdown
    - Filter by wallet dropdown
  - ✅ Live stats: Total assets, accepted count, rejected count, total value
  - ✅ Expand cards to edit fields inline
  - ✅ Toggle transaction type (BUY/SELL)

  3. How It Works Now

  1. User clicks "Import Data" in Settings
  2. Selects CSV/Excel file
  3. Preview modal opens showing all detected assets
  4. User can:
    - Review each asset
    - Edit dates/wallets/quantities
    - Reject unwanted assets
    - Assign wallets in bulk
  5. User clicks "Import X Assets"
  6. Data is imported to Supabase/LocalStorage
  7. Success message shows stats
  8. Modals close automatically
  9. Data appears immediately (no logout needed!)

  4. Fixed Issues

  - ✅ Fixed the loading state bug causing data to not show
  - ✅ Added file input reset after import
  - ✅ Proper error handling with user feedback

  Test It Now:

  1. Go to Settings → Import Data
  2. Upload a CSV with columns like: Symbol, Quantity, Price, Date
  3. You'll see the preview modal pop up!
  4. Edit/review/accept assets
  5. Click "Import X Assets"
  6. Done! Data appears immediately.

  The smart field mapper will recognize variations like "Qty" vs "Quantity" vs "Shares" automatically!
