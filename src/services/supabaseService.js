import { supabase, TABLES } from '../config/supabase';

// ============================================================================
// ACCOUNTS SERVICE
// ============================================================================

/**
 * Get all accounts for the current user
 */
export const getAccounts = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTS)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return { data: null, error };
  }
};

/**
 * Create a new account
 */
export const createAccount = async (name) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(TABLES.ACCOUNTS)
      .insert([{ name, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating account:', error);
    return { data: null, error };
  }
};

/**
 * Delete an account (will cascade delete all related portfolios)
 */
export const deleteAccount = async (accountId) => {
  try {
    const { error } = await supabase
      .from(TABLES.ACCOUNTS)
      .delete()
      .eq('id', accountId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { error };
  }
};

// ============================================================================
// PORTFOLIOS SERVICE
// ============================================================================

/**
 * Get all portfolios for the current user with their transactions and dividends
 */
export const getPortfolios = async () => {
  try {
    const { data: portfolios, error: portfoliosError } = await supabase
      .from(TABLES.PORTFOLIOS)
      .select(`
        *,
        account:accounts(id, name),
        transactions(*),
        dividends(*)
      `)
      .order('created_at', { ascending: true });

    if (portfoliosError) throw portfoliosError;

    // Transform data to match app format
    const transformedData = portfolios.map(p => ({
      id: p.id,
      symbol: p.symbol,
      name: p.name,
      type: p.type,
      account: p.account.name,
      accountId: p.account.id,
      sector: p.sector,
      transactions: p.transactions.map(t => ({
        id: t.id,
        quantity: parseFloat(t.quantity),
        price: parseFloat(t.price),
        date: t.date
      })),
      dividends: p.dividends.map(d => ({
        id: d.id,
        amount: parseFloat(d.amount),
        date: d.date
      }))
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return { data: null, error };
  }
};

/**
 * Create a new portfolio
 */
export const createPortfolio = async (portfolioData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get account ID from account name
    const { data: account } = await supabase
      .from(TABLES.ACCOUNTS)
      .select('id')
      .eq('name', portfolioData.account)
      .single();

    if (!account) throw new Error('Account not found');

    const { data, error } = await supabase
      .from(TABLES.PORTFOLIOS)
      .insert([{
        user_id: user.id,
        account_id: account.id,
        symbol: portfolioData.symbol,
        name: portfolioData.name,
        type: portfolioData.type,
        sector: portfolioData.sector || null
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return { data: null, error };
  }
};

/**
 * Update a portfolio
 */
export const updatePortfolio = async (portfolioId, updates) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PORTFOLIOS)
      .update(updates)
      .eq('id', portfolioId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return { data: null, error };
  }
};

/**
 * Delete a portfolio (will cascade delete all transactions and dividends)
 */
export const deletePortfolio = async (portfolioId) => {
  try {
    const { error } = await supabase
      .from(TABLES.PORTFOLIOS)
      .delete()
      .eq('id', portfolioId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return { error };
  }
};

// ============================================================================
// TRANSACTIONS SERVICE
// ============================================================================

/**
 * Create a new transaction
 */
export const createTransaction = async (portfolioId, transactionData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .insert([{
        portfolio_id: portfolioId,
        user_id: user.id,
        quantity: transactionData.quantity,
        price: transactionData.price,
        date: transactionData.date
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { data: null, error };
  }
};

/**
 * Update a transaction
 */
export const updateTransaction = async (transactionId, updates) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { data: null, error };
  }
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (transactionId) => {
  try {
    const { error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .delete()
      .eq('id', transactionId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { error };
  }
};

// ============================================================================
// DIVIDENDS SERVICE
// ============================================================================

/**
 * Create a new dividend
 */
export const createDividend = async (portfolioId, dividendData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from(TABLES.DIVIDENDS)
      .insert([{
        portfolio_id: portfolioId,
        user_id: user.id,
        amount: dividendData.amount,
        date: dividendData.date
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating dividend:', error);
    return { data: null, error };
  }
};

/**
 * Delete a dividend
 */
export const deleteDividend = async (dividendId) => {
  try {
    const { error } = await supabase
      .from(TABLES.DIVIDENDS)
      .delete()
      .eq('id', dividendId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting dividend:', error);
    return { error };
  }
};

// ============================================================================
// MARKET PRICES SERVICE
// ============================================================================

/**
 * Get market price for a symbol (cached)
 */
export const getMarketPrice = async (symbol) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MARKET_PRICES)
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors

    // Check if data is stale (older than 5 minutes)
    if (data) {
      const timestamp = new Date(data.timestamp).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (now - timestamp < fiveMinutes) {
        return { data, error: null };
      }
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error fetching market price:', error);
    return { data: null, error };
  }
};

/**
 * Update or insert market price
 */
export const upsertMarketPrice = async (symbol, priceData) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MARKET_PRICES)
      .upsert([{
        symbol,
        price: priceData.price,
        change_percent: priceData.changePercent,
        timestamp: new Date().toISOString()
      }], { onConflict: 'symbol' })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error upserting market price:', error);
    return { data: null, error };
  }
};

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to portfolio changes
 */
export const subscribeToPortfolios = (userId, callback) => {
  const channel = supabase
    .channel('portfolios-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.PORTFOLIOS,
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return channel;
};

/**
 * Subscribe to transaction changes
 */
export const subscribeToTransactions = (userId, callback) => {
  const channel = supabase
    .channel('transactions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.TRANSACTIONS,
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return channel;
};

/**
 * Unsubscribe from a channel
 */
export const unsubscribe = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

// ============================================================================
// BULK OPERATIONS (FOR MIGRATION)
// ============================================================================

/**
 * Bulk create portfolios with transactions and dividends
 * Used for migrating data from localStorage
 */
export const bulkCreatePortfolios = async (portfoliosData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const results = [];

    for (const portfolio of portfoliosData) {
      // Get account ID
      const { data: account } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('id')
        .eq('name', portfolio.account)
        .single();

      if (!account) {
        console.warn(`Account not found: ${portfolio.account}`);
        continue;
      }

      // Create portfolio
      const { data: newPortfolio, error: portfolioError } = await supabase
        .from(TABLES.PORTFOLIOS)
        .insert([{
          user_id: user.id,
          account_id: account.id,
          symbol: portfolio.symbol,
          name: portfolio.name,
          type: portfolio.type,
          sector: portfolio.sector || null
        }])
        .select()
        .single();

      if (portfolioError) {
        console.error(`Error creating portfolio ${portfolio.symbol}:`, portfolioError);
        continue;
      }

      // Create transactions
      if (portfolio.transactions && portfolio.transactions.length > 0) {
        const transactions = portfolio.transactions.map(t => ({
          portfolio_id: newPortfolio.id,
          user_id: user.id,
          quantity: t.quantity,
          price: t.price,
          date: t.date
        }));

        const { error: txError } = await supabase
          .from(TABLES.TRANSACTIONS)
          .insert(transactions);

        if (txError) {
          console.error(`Error creating transactions for ${portfolio.symbol}:`, txError);
        }
      }

      // Create dividends
      if (portfolio.dividends && portfolio.dividends.length > 0) {
        const dividends = portfolio.dividends.map(d => ({
          portfolio_id: newPortfolio.id,
          user_id: user.id,
          amount: d.amount,
          date: d.date
        }));

        const { error: divError } = await supabase
          .from(TABLES.DIVIDENDS)
          .insert(dividends);

        if (divError) {
          console.error(`Error creating dividends for ${portfolio.symbol}:`, divError);
        }
      }

      results.push(newPortfolio);
    }

    return { data: results, error: null };
  } catch (error) {
    console.error('Error bulk creating portfolios:', error);
    return { data: null, error };
  }
};
