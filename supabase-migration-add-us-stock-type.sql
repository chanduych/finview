-- ============================================================================
-- Migration: Allow US_STOCK in portfolios.type
-- Run this in Supabase SQL Editor if you use the app with US Stocks.
-- ============================================================================

-- Drop the existing CHECK constraint on type (PostgreSQL names it portfolios_type_check)
ALTER TABLE portfolios
  DROP CONSTRAINT IF EXISTS portfolios_type_check;

-- Add updated constraint including US_STOCK
ALTER TABLE portfolios
  ADD CONSTRAINT portfolios_type_check
  CHECK (type IN ('STOCK', 'MF', 'ETF', 'US_STOCK'));
