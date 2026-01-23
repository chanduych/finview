/**
 * Import and Export utilities for portfolio data
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Exports portfolio data in various formats (JSON, CSV, or Excel)
 *
 * @param {string} format - Export format: 'json', 'csv', or 'excel'
 * @param {Object} data - Data to export
 * @param {Array} data.portfolio - Portfolio array (for JSON format)
 * @param {Array} data.accounts - Accounts array (for JSON format)
 * @param {Object} data.marketPrices - Market prices object (for JSON format)
 * @param {Array} data.processedPortfolio - Processed portfolio with calculated values (for CSV/Excel)
 */
export const handleExport = (format = 'json', data) => {
    const { portfolio, accounts, marketPrices, processedPortfolio } = data;

    if (format === 'json') {
        const exportData = {
            portfolio,
            accounts,
            marketPrices,
            version: '2.0',
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Portfolio_Backup.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else if (format === 'csv') {
        const rows = [['Symbol', 'Name', 'Type', 'Account', 'Sector', 'Quantity', 'Avg Price', 'Current Price', 'Invested', 'Current Value', 'P&L', 'P&L %', 'XIRR %']];
        processedPortfolio.forEach(p => {
            rows.push([
                p.symbol,
                p.name || p.symbol,
                p.type,
                p.account,
                p.sector || '',
                p.totalQty.toFixed(2),
                p.avgPrice.toFixed(2),
                p.currentPrice.toFixed(2),
                p.investedValue.toFixed(2),
                p.currentValue.toFixed(2),
                p.absReturn.toFixed(2),
                p.absReturnPercent.toFixed(2),
                p.xirr ? p.xirr.toFixed(2) : 'N/A'
            ]);
        });
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Portfolio_Export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else if (format === 'excel') {
        const wsData = [['Symbol', 'Name', 'Type', 'Account', 'Sector', 'Quantity', 'Avg Price', 'Current Price', 'Invested', 'Current Value', 'P&L', 'P&L %', 'XIRR %', 'STCG', 'LTCG', 'Dividends']];
        processedPortfolio.forEach(p => {
            wsData.push([
                p.symbol,
                p.name || p.symbol,
                p.type,
                p.account,
                p.sector || '',
                p.totalQty,
                p.avgPrice,
                p.currentPrice,
                p.investedValue,
                p.currentValue,
                p.absReturn,
                p.absReturnPercent,
                p.xirr || 0,
                p.capitalGains?.stcg || 0,
                p.capitalGains?.ltcg || 0,
                p.totalDividends || 0
            ]);
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Portfolio');
        XLSX.writeFile(wb, `Portfolio_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
};

/**
 * Generates a year-wise summary of investments and dividends
 *
 * @param {Array} portfolio - Portfolio array with transactions and dividends
 * @returns {Array} Array of yearly summaries sorted by year (descending)
 */
export const getYearWiseSummary = (portfolio) => {
    const summary = {};
    portfolio.forEach(asset => {
        asset.transactions.forEach(tx => {
            const year = new Date(tx.date).getFullYear();
            if (!summary[year]) {
                summary[year] = { invested: 0, dividends: 0, transactions: 0 };
            }
            summary[year].invested += tx.quantity * tx.price;
            summary[year].transactions += 1;
        });
        if (asset.dividends) {
            asset.dividends.forEach(div => {
                const year = new Date(div.date).getFullYear();
                if (!summary[year]) {
                    summary[year] = { invested: 0, dividends: 0, transactions: 0 };
                }
                summary[year].dividends += div.amount;
            });
        }
    });
    return Object.entries(summary).map(([year, data]) => ({
        year: parseInt(year),
        ...data
    })).sort((a, b) => b.year - a.year);
};

/**
 * Imports portfolio data from JSON, CSV, or Excel files
 *
 * @param {Event} e - File input change event
 * @param {Object} callbacks - Callback functions for state updates
 * @param {Function} callbacks.setPortfolio - Function to update portfolio state
 * @param {Function} callbacks.setAccounts - Function to update accounts state
 * @param {Function} callbacks.setMarketPrices - Function to update market prices state
 * @param {Function} callbacks.setShowSettingsModal - Function to close settings modal
 * @param {Array} callbacks.accounts - Current accounts array
 * @param {Function} callbacks.bulkImportPortfolio - Optional: Function to bulk import to Supabase
 * @param {boolean} callbacks.useSupabase - Optional: Whether Supabase is enabled
 */
export const handleImport = (e, callbacks) => {
    const { setPortfolio, setAccounts, setMarketPrices, setShowSettingsModal, accounts, bulkImportPortfolio, useSupabase } = callbacks;
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    if (fileExtension === 'json') {
        // JSON Import (Full Backup)
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                if (data.portfolio && data.accounts) {
                    // If Supabase is enabled, use bulk import to save to database
                    if (useSupabase && bulkImportPortfolio) {
                        const result = await bulkImportPortfolio(data.portfolio, data.accounts);
                        if (result.error) {
                            alert('Error importing to database: ' + result.error.message);
                        } else {
                            if (data.marketPrices) setMarketPrices(data.marketPrices);
                            setShowSettingsModal(false);

                            // Show detailed import stats
                            const stats = result.stats;
                            const message = `✅ Import Completed!\n\n` +
                                `📁 Accounts Created: ${stats.accountsCreated}\n` +
                                `📊 New Portfolios: ${stats.portfoliosCreated}\n` +
                                `➕ Transactions Added: ${stats.transactionsAdded}\n` +
                                `⏭️ Transactions Skipped (duplicates): ${stats.transactionsSkipped}\n` +
                                `💰 Dividends Added: ${stats.dividendsAdded}\n` +
                                `⏭️ Dividends Skipped (duplicates): ${stats.dividendsSkipped}`;

                            alert(message);
                        }
                    } else {
                        // LocalStorage mode - just update state
                        setPortfolio(data.portfolio);
                        setAccounts(data.accounts);
                        if (data.marketPrices) setMarketPrices(data.marketPrices);
                        setShowSettingsModal(false);
                        alert('Portfolio imported successfully!');
                    }
                } else {
                    alert('Invalid JSON format. Missing portfolio or accounts data.');
                }
            } catch (err) {
                alert('Error reading JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    } else if (fileExtension === 'csv') {
        // CSV Import (Zerodha Console or Generic Portfolio CSV)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const csvData = results.data;
                    if (csvData.length === 0) {
                        alert('CSV file is empty.');
                        return;
                    }

                    // Check if it's Zerodha Console format
                    const isZerodhaFormat = csvData[0].hasOwnProperty('Symbol') ||
                                           csvData[0].hasOwnProperty('symbol') ||
                                           csvData[0].hasOwnProperty('Instrument') ||
                                           csvData[0].hasOwnProperty('instrument');

                    if (isZerodhaFormat) {
                        // Zerodha Console Export Format
                        const importedPortfolio = [];
                        const importedAccounts = new Set();

                        csvData.forEach((row, idx) => {
                            const symbol = (row.Symbol || row.symbol || '').trim().toUpperCase();
                            const instrument = (row.Instrument || row.instrument || '').trim();
                            const qty = parseFloat(row.Quantity || row.quantity || row['Txn Qty'] || 0);
                            const price = parseFloat(row.Price || row.price || row['Avg Price'] || 0);
                            const date = row.Date || row.date || row['Txn Date'] || new Date().toISOString().split('T')[0];
                            const account = (row.Account || row.account || 'Imported').trim();

                            if (!symbol || qty === 0 || price === 0) return;

                            importedAccounts.add(account);

                            // Determine asset type
                            let type = 'STOCK';
                            if (instrument.toLowerCase().includes('mf') || instrument.toLowerCase().includes('mutual')) {
                                type = 'MF';
                            } else if (instrument.toLowerCase().includes('etf')) {
                                type = 'ETF';
                            } else if (/^\d+$/.test(symbol)) {
                                type = 'MF';
                            }

                            const transaction = {
                                id: Date.now() + idx,
                                price: price,
                                quantity: qty,
                                date: date
                            };

                            const existingAsset = importedPortfolio.find(
                                p => p.symbol === symbol && p.account === account
                            );

                            if (existingAsset) {
                                existingAsset.transactions.push(transaction);
                            } else {
                                importedPortfolio.push({
                                    id: `${symbol}_${account}_${Date.now()}_${idx}`,
                                    symbol: symbol,
                                    name: row.Name || row.name || symbol,
                                    type: type,
                                    account: account,
                                    sector: row.Sector || row.sector || '',
                                    transactions: [transaction],
                                    dividends: []
                                });
                            }
                        });

                        // If Supabase is enabled, use bulk import to save to database
                        if (useSupabase && bulkImportPortfolio) {
                            const accountsArray = Array.from(importedAccounts);
                            bulkImportPortfolio(importedPortfolio, accountsArray).then(result => {
                                if (result.error) {
                                    alert('Error importing to database: ' + result.error.message);
                                } else {
                                    setShowSettingsModal(false);

                                    // Show detailed import stats
                                    const stats = result.stats;
                                    const message = `✅ Import Completed (Zerodha CSV)!\n\n` +
                                        `📁 Accounts Created: ${stats.accountsCreated}\n` +
                                        `📊 New Portfolios: ${stats.portfoliosCreated}\n` +
                                        `➕ Transactions Added: ${stats.transactionsAdded}\n` +
                                        `⏭️ Transactions Skipped (duplicates): ${stats.transactionsSkipped}`;

                                    alert(message);
                                }
                            });
                        } else {
                            // LocalStorage mode - just update state
                            setPortfolio(importedPortfolio);
                            setAccounts([...new Set([...accounts, ...Array.from(importedAccounts)])]);
                            setShowSettingsModal(false);
                            alert(`Successfully imported ${importedPortfolio.length} assets from Zerodha CSV!`);
                        }
                    } else {
                        // Generic Portfolio CSV (from our export)
                        const importedPortfolio = [];
                        const importedAccounts = new Set();

                        csvData.forEach((row, idx) => {
                            const symbol = (row.Symbol || '').trim().toUpperCase();
                            const type = (row.Type || 'STOCK').toUpperCase();
                            const account = (row.Account || 'Imported').trim();
                            const qty = parseFloat(row.Quantity || 0);
                            const avgPrice = parseFloat(row['Avg Price'] || 0);

                            if (!symbol || qty === 0) return;

                            importedAccounts.add(account);

                            importedPortfolio.push({
                                id: `${symbol}_${account}_${Date.now()}_${idx}`,
                                symbol: symbol,
                                name: row.Name || symbol,
                                type: type,
                                account: account,
                                sector: row.Sector || '',
                                transactions: [{
                                    id: Date.now() + idx,
                                    price: avgPrice,
                                    quantity: qty,
                                    date: new Date().toISOString().split('T')[0]
                                }],
                                dividends: []
                            });
                        });

                        // If Supabase is enabled, use bulk import to save to database
                        if (useSupabase && bulkImportPortfolio) {
                            const accountsArray = Array.from(importedAccounts);
                            bulkImportPortfolio(importedPortfolio, accountsArray).then(result => {
                                if (result.error) {
                                    alert('Error importing to database: ' + result.error.message);
                                } else {
                                    setShowSettingsModal(false);

                                    // Show detailed import stats
                                    const stats = result.stats;
                                    const message = `✅ Import Completed (CSV)!\n\n` +
                                        `📁 Accounts Created: ${stats.accountsCreated}\n` +
                                        `📊 New Portfolios: ${stats.portfoliosCreated}\n` +
                                        `➕ Transactions Added: ${stats.transactionsAdded}\n` +
                                        `⏭️ Transactions Skipped (duplicates): ${stats.transactionsSkipped}`;

                                    alert(message);
                                }
                            });
                        } else {
                            // LocalStorage mode - just update state
                            setPortfolio(importedPortfolio);
                            setAccounts([...new Set([...accounts, ...Array.from(importedAccounts)])]);
                            setShowSettingsModal(false);
                            alert(`Successfully imported ${importedPortfolio.length} assets from CSV!`);
                        }
                    }
                } catch (err) {
                    alert('Error parsing CSV: ' + err.message);
                }
            },
            error: (error) => {
                alert('Error reading CSV file: ' + error.message);
            }
        });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Excel Import
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                if (jsonData.length === 0) {
                    alert('Excel file is empty.');
                    return;
                }

                const importedPortfolio = [];
                const importedAccounts = new Set();

                jsonData.forEach((row, idx) => {
                    const symbol = (row.Symbol || '').trim().toUpperCase();
                    const type = (row.Type || 'STOCK').toUpperCase();
                    const account = (row.Account || 'Imported').trim();
                    const qty = parseFloat(row.Quantity || 0);
                    const avgPrice = parseFloat(row['Avg Price'] || 0);

                    if (!symbol || qty === 0) return;

                    importedAccounts.add(account);

                    importedPortfolio.push({
                        id: `${symbol}_${account}_${Date.now()}_${idx}`,
                        symbol: symbol,
                        name: row.Name || symbol,
                        type: type,
                        account: account,
                        sector: row.Sector || '',
                        transactions: [{
                            id: Date.now() + idx,
                            price: avgPrice,
                            quantity: qty,
                            date: new Date().toISOString().split('T')[0]
                        }],
                        dividends: []
                    });
                });

                // If Supabase is enabled, use bulk import to save to database
                if (useSupabase && bulkImportPortfolio) {
                    const accountsArray = Array.from(importedAccounts);
                    bulkImportPortfolio(importedPortfolio, accountsArray).then(result => {
                        if (result.error) {
                            alert('Error importing to database: ' + result.error.message);
                        } else {
                            setShowSettingsModal(false);

                            // Show detailed import stats
                            const stats = result.stats;
                            const message = `✅ Import Completed (Excel)!\n\n` +
                                `📁 Accounts Created: ${stats.accountsCreated}\n` +
                                `📊 New Portfolios: ${stats.portfoliosCreated}\n` +
                                `➕ Transactions Added: ${stats.transactionsAdded}\n` +
                                `⏭️ Transactions Skipped (duplicates): ${stats.transactionsSkipped}`;

                            alert(message);
                        }
                    });
                } else {
                    // LocalStorage mode - just update state
                    setPortfolio(importedPortfolio);
                    setAccounts([...new Set([...accounts, ...Array.from(importedAccounts)])]);
                    setShowSettingsModal(false);
                    alert(`Successfully imported ${importedPortfolio.length} assets from Excel!`);
                }
            } catch (err) {
                alert('Error reading Excel file: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Unsupported file format. Please use JSON, CSV, or Excel (.xlsx) files.');
    }
};
