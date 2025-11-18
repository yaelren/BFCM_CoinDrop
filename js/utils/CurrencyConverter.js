/**
 * Currency Converter - Fixed Rate Table
 *
 * Converts various currencies to USD using fixed exchange rates.
 * Rates should be updated quarterly or when major currency events occur.
 *
 * Last updated: 2024-11-18
 */

// Track unknown currencies encountered during session
const UNKNOWN_CURRENCIES = new Set();

// Fixed exchange rates (1 USD = X currency)
const FIXED_RATES = {
  'USD': 1.00,      // US Dollar
  'EUR': 0.85,      // Euro
  'GBP': 0.73,      // British Pound
  'CAD': 1.25,      // Canadian Dollar
  'AUD': 1.35,      // Australian Dollar
  'JPY': 110.00,    // Japanese Yen
  'CNY': 6.50,      // Chinese Yuan
  'INR': 74.00,     // Indian Rupee
  'BRL': 5.00,      // Brazilian Real
  'MXN': 20.00,     // Mexican Peso
  'CHF': 0.92,      // Swiss Franc
  'SEK': 9.00,      // Swedish Krona
  'NZD': 1.42,      // New Zealand Dollar
  'SGD': 1.35,      // Singapore Dollar
  'HKD': 7.80,      // Hong Kong Dollar
  'NOK': 9.50,      // Norwegian Krone
  'KRW': 1150.00,   // South Korean Won
  'TRY': 13.50,     // Turkish Lira
  'RUB': 75.00,     // Russian Ruble
  'ZAR': 15.00,     // South African Rand
  'PLN': 3.90,      // Polish Zloty
  'THB': 33.00,     // Thai Baht
  'IDR': 14000.00,  // Indonesian Rupiah
  'MYR': 4.20,      // Malaysian Ringgit
  'PHP': 50.00,     // Philippine Peso
  'DKK': 6.30,      // Danish Krone
  'CZK': 22.00,     // Czech Koruna
  'HUF': 300.00,    // Hungarian Forint
  'ILS': 3.50,      // Israeli Shekel
  'CLP': 800.00,    // Chilean Peso
  'AED': 3.67,      // UAE Dirham
  'ARS': 1000.00    // Argentine Peso
};

/**
 * Convert amount from foreign currency to USD
 * @param {number} amount - Amount in foreign currency
 * @param {string} currency - Currency code (e.g., 'GBP', 'EUR')
 * @returns {number} Amount in USD (rounded to 2 decimals)
 */
export function convertToUSD(amount, currency) {
  // Normalize currency code
  const currencyCode = currency.toUpperCase().trim();

  // Already USD
  if (currencyCode === 'USD') {
    return Math.round(amount * 100) / 100;
  }

  // Get exchange rate
  const rate = FIXED_RATES[currencyCode];

  if (!rate) {
    // Unknown currency - log LOUD warning
    if (!UNKNOWN_CURRENCIES.has(currencyCode)) {
      // First time seeing this currency
      UNKNOWN_CURRENCIES.add(currencyCode);

      console.warn('═══════════════════════════════════════════════════');
      console.warn('⚠️  NEW UNKNOWN CURRENCY DETECTED');
      console.warn('═══════════════════════════════════════════════════');
      console.warn(`Currency Code: "${currencyCode}"`);
      console.warn(`Order Amount: ${amount} ${currencyCode}`);
      console.warn(`Current Action: Using 1:1 USD conversion (${amount} ${currencyCode} = $${amount} USD)`);
      console.warn(`Required Action: Add "${currencyCode}" to FIXED_RATES in js/utils/CurrencyConverter.js`);
      console.warn('═══════════════════════════════════════════════════');
    } else {
      // Already seen before - brief warning
      console.warn(`⚠️ Unknown currency "${currencyCode}" encountered (amount: ${amount})`);
    }

    // Fallback: treat as 1:1 with USD
    return Math.round(amount * 100) / 100;
  }

  // Convert: amount in foreign currency / rate = USD
  // Example: 20 GBP / 0.73 = 27.40 USD
  const usdAmount = amount / rate;

  // Round to 2 decimal places
  return Math.round(usdAmount * 100) / 100;
}

/**
 * Get list of unknown currencies encountered in this session
 * @returns {string[]} Array of unknown currency codes
 */
export function getUnknownCurrencies() {
  return Array.from(UNKNOWN_CURRENCIES);
}

/**
 * Get list of all supported currencies
 * @returns {string[]} Array of currency codes
 */
export function getSupportedCurrencies() {
  return Object.keys(FIXED_RATES);
}

/**
 * Check if a currency is supported
 * @param {string} currency - Currency code
 * @returns {boolean} True if supported
 */
export function isCurrencySupported(currency) {
  const currencyCode = currency.toUpperCase().trim();
  return FIXED_RATES.hasOwnProperty(currencyCode);
}
