/**
 * Currency and date formatting utilities
 */

/**
 * Formats a number as Indian Rupees without decimal places
 * @param {number} val - The value to format
 * @returns {string} Formatted currency string (e.g., "₹1,23,456")
 */
export const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val || 0);

/**
 * Formats a number as Indian Rupees with 2 decimal places
 * @param {number} val - The value to format
 * @returns {string} Formatted currency string (e.g., "₹1,23,456.78")
 */
export const formatCurrencyWithDecimals = (val) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val || 0);

/**
 * Formats a number as US Dollars (for US stocks display)
 * @param {number} val - The value to format
 * @param {boolean} compact - If true, use 2 decimal places for small amounts
 * @returns {string} Formatted string (e.g., "$1,234.56")
 */
export const formatUSD = (val, compact = false) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: compact ? 2 : 0,
        maximumFractionDigits: 2
    }).format(val || 0);

/**
 * Converts INR amount to USD using current price ratio (for US stocks display).
 * @param {number} inrAmount - Amount in INR
 * @param {number} priceUSD - Current price in USD
 * @param {number} currentPriceINR - Current price in INR
 * @returns {number|null} USD amount or null if conversion not possible
 */
export const inrToUSD = (inrAmount, priceUSD, currentPriceINR) => {
    if (priceUSD == null || currentPriceINR == null || currentPriceINR <= 0) return null;
    return inrAmount * (priceUSD / currentPriceINR);
};

/**
 * Formats a date as ISO string (YYYY-MM-DD)
 * @param {Date} date - The date to format
 * @returns {string} ISO date string (e.g., "2024-01-15")
 */
export const formatDateISO = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
};

/**
 * Formats a date in Indian locale with short month and full year
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string (e.g., "Jan 2024")
 */
export const formatDateMonthYear = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

/**
 * Formats a date in Indian locale with short month and 2-digit year
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string (e.g., "Jan '24")
 */
export const formatDateShortYear = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

/**
 * Formats a date in Indian locale with day, short month and full year
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string (e.g., "15 Jan 2024")
 */
export const formatDateFull = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
