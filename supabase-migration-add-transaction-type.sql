-- ============================================================================
-- Migration: Add transaction type (BUY/SELL) to transactions table
-- ============================================================================
-- Run this in Supabase SQL Editor to add support for sell transactions
-- ============================================================================

-- Step 1: Add type column (nullable first to allow migration)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('BUY', 'SELL'));

-- Step 2: Set all existing transactions to 'BUY' (default)
UPDATE transactions 
SET type = 'BUY' 
WHERE type IS NULL;

-- Step 3: Make type column NOT NULL with default
ALTER TABLE transactions 
ALTER COLUMN type SET NOT NULL,
ALTER COLUMN type SET DEFAULT 'BUY';

-- Step 4: Add index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Step 5: Add index for type + date (useful for filtering)
CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions(type, date);

-- ============================================================================
-- Verification Query (run after migration)
-- ============================================================================
-- SELECT 
--   type,
--   COUNT(*) as count
-- FROM transactions
-- GROUP BY type;
-- ============================================================================
SELECT 
type,
COUNT(*) as count
 FROM transactions
 GROUP BY type;