/**
 * Smart Import Mapper - Intelligently detects and maps fields from various data sources
 * Handles messy, unorganized data with fuzzy matching and auto-detection
 */

/**
 * Field mapping configuration with fuzzy matching patterns
 */
export const FIELD_MAPPINGS = {
    symbol: {
        required: true,
        patterns: [
            /^symbol$/i,              // Exact "Symbol" - highest priority
            /^stock.*symbol$/i,
            /^trading.*symbol$/i,
            /^scrip.*code$/i,
            /^scrip$/i,
            /^code$/i,
            /^ticker$/i,
            /^scheme.*code$/i
            // NOTE: Removed /^isin$/i, /^instrument$/i, /^security$/i
            // These are now separate optional fields
        ],
        validate: (value) => value && value.toString().trim().length > 0,
        transform: (value) => value.toString().trim().toUpperCase()
    },
    isin: {
        required: false,
        patterns: [
            /^isin$/i,
            /^isin.*code$/i,
            /^isin.*number$/i
        ],
        transform: (value) => value?.toString().trim().toUpperCase() || ''
    },
    instrument: {
        required: false,
        patterns: [
            /^instrument$/i,
            /^instrument.*type$/i,
            /^security$/i,
            /^security.*type$/i
        ],
        transform: (value) => value?.toString().trim() || ''
    },
    name: {
        required: false,
        patterns: [
            /^name$/i,
            /^security.*name$/i,
            /^stock.*name$/i,
            /^scheme.*name$/i,
            /^company.*name$/i,
            /^description$/i,
            /^scrip.*name$/i
        ],
        transform: (value) => value?.toString().trim() || ''
    },
    quantity: {
        required: true,
        patterns: [
            /^quantity$/i,
            /^qty$/i,
            /^shares$/i,
            /^units$/i,
            /^no\.?\s*of\s*shares$/i,
            /^holdings$/i,
            /^balance$/i,
            /^net.*qty$/i,
            /^closing.*balance$/i,
            /^quantity.*available$/i,  // Zerodha: "Quantity Available"
            /^available.*qty$/i
        ],
        validate: (value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0,
        transform: (value) => parseFloat(value)
    },
    price: {
        required: true,
        patterns: [
            /^price$/i,
            /^rate$/i,
            /^avg.*price$/i,
            /^average.*price$/i,
            /^buy.*price$/i,
            /^purchase.*price$/i,
            /^cost$/i,
            /^nav$/i,
            /^ltp$/i,
            /^last.*traded.*price$/i,
            /^avg\.?\s*price$/i  // Zerodha: "Average Price" or "Avg. Price"
        ],
        validate: (value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0,
        transform: (value) => parseFloat(value)
    },
    date: {
        required: false,
        patterns: [
            /^date$/i,
            /^transaction.*date$/i,
            /^trade.*date$/i,
            /^purchase.*date$/i,
            /^buy.*date$/i,
            /^settlement.*date$/i,
            /^txn.*date$/i
        ],
        validate: (value) => {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime());
        },
        transform: (value) => {
            if (!value) return new Date().toISOString().split('T')[0];
            const date = new Date(value);
            return date.toISOString().split('T')[0];
        }
    },
    account: {
        required: false,
        patterns: [
            /^account$/i,
            /^wallet$/i,
            /^portfolio$/i,
            /^folio.*no$/i,
            /^client.*code$/i,
            /^broker$/i,
            /^demat.*account$/i
        ],
        transform: (value) => value?.toString().trim() || 'Imported'
    },
    type: {
        required: false,
        patterns: [
            /^type$/i,
            /^asset.*type$/i,
            /^instrument.*type$/i,
            /^category$/i,
            /^class$/i,
            /^product$/i
        ],
        validate: (value) => {
            if (!value) return false;
            const normalized = value.toString().toUpperCase();
            return ['STOCK', 'MF', 'ETF', 'EQUITY', 'MUTUAL FUND', 'FUND'].some(t =>
                normalized.includes(t)
            );
        },
        transform: (value) => {
            if (!value) return null;
            const normalized = value.toString().toUpperCase();
            if (normalized.includes('MF') || normalized.includes('MUTUAL') || normalized.includes('FUND')) {
                return 'MF';
            }
            if (normalized.includes('ETF')) {
                return 'ETF';
            }
            return 'STOCK';
        }
    },
    sector: {
        required: false,
        patterns: [
            /^sector$/i,
            /^industry$/i,
            /^category$/i,
            /^sub.*sector$/i
        ],
        transform: (value) => value?.toString().trim() || ''
    },
    transactionType: {
        required: false,
        patterns: [
            /^transaction.*type$/i,
            /^txn.*type$/i,
            /^type$/i,
            /^buy.*sell$/i,
            /^action$/i,
            /^operation$/i
        ],
        validate: (value) => {
            if (!value) return false;
            const normalized = value.toString().toUpperCase();
            return normalized.includes('BUY') || normalized.includes('SELL') ||
                   normalized.includes('PURCHASE') || normalized.includes('SALE');
        },
        transform: (value) => {
            if (!value) return 'BUY';
            const normalized = value.toString().toUpperCase();
            return normalized.includes('SELL') || normalized.includes('SALE') ? 'SELL' : 'BUY';
        }
    }
};

/**
 * Auto-detect field mappings from CSV headers
 */
export function autoDetectFields(headers) {
    const mappings = {};
    const unmappedColumns = [];

    console.log('🔍 Auto-detecting fields from headers:', headers);

    headers.forEach((header, index) => {
        const normalizedHeader = header.trim();
        let matched = false;

        for (const [fieldName, config] of Object.entries(FIELD_MAPPINGS)) {
            for (const pattern of config.patterns) {
                if (pattern.test(normalizedHeader)) {
                    mappings[fieldName] = {
                        columnIndex: index,
                        columnName: normalizedHeader,
                        required: config.required
                    };
                    matched = true;
                    console.log(`✅ Matched "${normalizedHeader}" → ${fieldName}`);
                    break;
                }
            }
            if (matched) break;
        }

        if (!matched) {
            unmappedColumns.push({ index, name: normalizedHeader });
            console.log(`❌ No match for "${normalizedHeader}"`);
        }
    });

    console.log('📊 Final mappings:', mappings);
    console.log('📊 Unmapped columns:', unmappedColumns);

    return { mappings, unmappedColumns };
}

/**
 * Validate detected mappings
 */
export function validateMappings(mappings) {
    const errors = [];
    const warnings = [];

    const requiredFields = Object.entries(FIELD_MAPPINGS)
        .filter(([_, config]) => config.required)
        .map(([name, _]) => name);

    for (const field of requiredFields) {
        if (!mappings[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    console.log('🔍 Validation result:', { isValid: errors.length === 0, errors, warnings });

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Transform raw row data into standardized format
 */
export function transformRow(row, mappings) {
    const transformed = {};
    const rowArray = Array.isArray(row) ? row : Object.values(row);

    for (const [fieldName, mapping] of Object.entries(mappings)) {
        const config = FIELD_MAPPINGS[fieldName];
        const rawValue = rowArray[mapping.columnIndex];

        if (!rawValue && config.required) {
            throw new Error(`Missing required field: ${fieldName}`);
        }

        if (rawValue) {
            if (config.validate && !config.validate(rawValue)) {
                if (config.required) {
                    throw new Error(`Invalid value for ${fieldName}: ${rawValue}`);
                }
                continue;
            }
            transformed[fieldName] = config.transform ? config.transform(rawValue) : rawValue;
        }
    }

    return transformed;
}

/**
 * Detect asset type from symbol
 */
export function detectAssetType(symbol, rowData = {}) {
    if (rowData.type) return rowData.type;
    if (/^\d+$/.test(symbol)) return 'MF';
    if (symbol.includes('ETF')) return 'ETF';

    const combinedText = [rowData.instrument, rowData.name].filter(Boolean).join(' ').toUpperCase();
    if (combinedText.includes('MUTUAL') || combinedText.includes('FUND')) return 'MF';
    if (combinedText.includes('ETF')) return 'ETF';

    return 'STOCK';
}

/**
 * Smart import - returns data for preview UI
 */
export function smartImport(csvData) {
    try {
        if (!csvData || csvData.length === 0) {
            throw new Error('CSV data is empty');
        }

        const headers = Array.isArray(csvData[0]) ? csvData[0] : Object.keys(csvData[0]);
        const { mappings, unmappedColumns } = autoDetectFields(headers);
        const validation = validateMappings(mappings);

        if (!validation.isValid) {
            return {
                success: false,
                needsMapping: true,
                errors: validation.errors,
                warnings: validation.warnings,
                mappings,
                unmappedColumns,
                preview: csvData.slice(0, 10),
                headers
            };
        }

        const dataRows = Array.isArray(csvData[0]) ? csvData.slice(1) : csvData;
        const previewAssets = [];
        const rowErrors = [];

        dataRows.forEach((row, idx) => {
            try {
                const transformed = transformRow(row, mappings);
                const type = detectAssetType(transformed.symbol, transformed);

                previewAssets.push({
                    id: `preview_${idx}`,
                    originalRow: idx,
                    symbol: transformed.symbol,
                    name: transformed.name || transformed.symbol,
                    type,
                    quantity: transformed.quantity,
                    price: transformed.price,
                    date: transformed.date || new Date().toISOString().split('T')[0],
                    account: transformed.account || 'Imported',
                    sector: transformed.sector || '',
                    transactionType: transformed.transactionType || 'BUY',
                    accepted: true, // Default to accepted
                    errors: []
                });
            } catch (error) {
                rowErrors.push({
                    row: idx + 1,
                    error: error.message,
                    data: row
                });
            }
        });

        return {
            success: true,
            needsPreview: true,
            previewAssets,
            stats: {
                totalRows: dataRows.length,
                successfulRows: previewAssets.length,
                failedRows: rowErrors.length
            },
            warnings: validation.warnings,
            rowErrors,
            mappings,
            unmappedColumns
        };

    } catch (error) {
        return {
            success: false,
            errors: [error.message]
        };
    }
}
