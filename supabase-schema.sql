-- ============================================================================
-- Investment Tracker Database Schema for Supabase
-- ============================================================================
-- This file contains all the SQL commands needed to set up your database
-- Run these commands in the Supabase SQL Editor
-- ============================================================================

-- Enable Row Level Security (RLS) by default
-- This ensures users can only access their own data

-- ============================================================================
-- 1. ACCOUNTS TABLE
-- ============================================================================
-- Stores user wallet/account information
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, name)
);

-- Enable RLS on accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY "Users can view their own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- ============================================================================
-- 2. PORTFOLIOS TABLE
-- ============================================================================
-- Stores portfolio assets (stocks, mutual funds, ETFs)
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT,
  type TEXT NOT NULL CHECK (type IN ('STOCK', 'MF', 'ETF')),
  sector TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, account_id, symbol, type)
);

-- Enable RLS on portfolios
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolios
CREATE POLICY "Users can view their own portfolios" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolios" ON portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" ON portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" ON portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_account_id ON portfolios(account_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_symbol ON portfolios(symbol);
CREATE INDEX IF NOT EXISTS idx_portfolios_type ON portfolios(type);

-- ============================================================================
-- 3. TRANSACTIONS TABLE
-- ============================================================================
-- Stores buy/sell transactions for portfolio assets
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- ============================================================================
-- 4. DIVIDENDS TABLE
-- ============================================================================
-- Stores dividend information for portfolio assets
CREATE TABLE IF NOT EXISTS dividends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on dividends
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dividends
CREATE POLICY "Users can view their own dividends" ON dividends
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dividends" ON dividends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dividends" ON dividends
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dividends" ON dividends
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_dividends_portfolio_id ON dividends(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_dividends_user_id ON dividends(user_id);
CREATE INDEX IF NOT EXISTS idx_dividends_date ON dividends(date);

-- ============================================================================
-- 5. MARKET PRICES TABLE (OPTIONAL - FOR CACHING)
-- ============================================================================
-- Stores cached market price data to reduce API calls
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL,
  price NUMERIC,
  change_percent NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Market prices are public (no RLS needed)
-- Anyone can read, but only service can write
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market prices" ON market_prices
  FOR SELECT TO authenticated, anon USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_market_prices_symbol ON market_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_market_prices_timestamp ON market_prices(timestamp);

-- ============================================================================
-- 6. FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dividends_updated_at BEFORE UPDATE ON dividends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_prices_updated_at BEFORE UPDATE ON market_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. VIEWS (OPTIONAL)
-- ============================================================================

-- View to get portfolio summary with transaction counts
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT
  p.id,
  p.user_id,
  p.account_id,
  p.symbol,
  p.name,
  p.type,
  p.sector,
  COUNT(DISTINCT t.id) as transaction_count,
  COUNT(DISTINCT d.id) as dividend_count,
  COALESCE(SUM(t.quantity), 0) as total_quantity,
  COALESCE(SUM(t.quantity * t.price), 0) as total_invested,
  COALESCE(SUM(d.amount), 0) as total_dividends,
  p.created_at,
  p.updated_at
FROM portfolios p
LEFT JOIN transactions t ON p.id = t.portfolio_id
LEFT JOIN dividends d ON p.id = d.portfolio_id
GROUP BY p.id, p.user_id, p.account_id, p.symbol, p.name, p.type, p.sector, p.created_at, p.updated_at;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- After running this script:
-- 1. Copy your Supabase URL and anon key
-- 2. Create a .env file in your project root
-- 3. Add: VITE_SUPABASE_URL=your_url and VITE_SUPABASE_ANON_KEY=your_key
-- 4. Start using the Supabase client in your application
-- ============================================================================
