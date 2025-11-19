/**
 * Currency Converter - Fixed Rate Table
 *
 * Converts various currencies to USD using fixed exchange rates.
 * Rates should be updated quarterly or when major currency events occur.
 *
 * Last updated: 2025-11-19
 * Coverage: 170+ world currencies (ISO 4217)
 */

// Track unknown currencies encountered during session
const UNKNOWN_CURRENCIES = new Set();

// Fixed exchange rates (1 USD = X currency)
// Rates updated: November 2025
const FIXED_RATES = {
  // Major Currencies
  'USD': 1.00,          // US Dollar
  'EUR': 0.864241,      // Euro
  'GBP': 0.762282,      // British Pound Sterling
  'JPY': 156.036144,    // Japanese Yen
  'CHF': 0.802578,      // Swiss Franc

  // Americas
  'CAD': 1.400225,      // Canadian Dollar
  'MXN': 18.328913,     // Mexican Peso
  'BRL': 5.323115,      // Brazilian Real
  'ARS': 1400.656905,   // Argentine Peso
  'CLP': 932.621610,    // Chilean Peso
  'COP': 3719.117386,   // Colombian Peso
  'PEN': 3.80,          // Peruvian Sol
  'UYU': 43.50,         // Uruguayan Peso
  'PYG': 7800.00,       // Paraguayan Guarani
  'BOB': 6.91,          // Bolivian Boliviano
  'VES': 237.75,        // Venezuelan Bolivar
  'CRC': 510.00,        // Costa Rican Colon
  'PAB': 1.00,          // Panamanian Balboa
  'GTQ': 7.75,          // Guatemalan Quetzal
  'HNL': 25.00,         // Honduran Lempira
  'NIO': 36.80,         // Nicaraguan Cordoba
  'DOP': 60.00,         // Dominican Peso
  'HTG': 132.00,        // Haitian Gourde
  'JMD': 155.00,        // Jamaican Dollar
  'BBD': 2.00,          // Barbadian Dollar
  'BSD': 1.00,          // Bahamian Dollar
  'BZD': 2.00,          // Belize Dollar
  'TTD': 6.780121,      // Trinidad and Tobago Dollar
  'XCD': 2.70,          // East Caribbean Dollar
  'AWG': 1.79,          // Aruban Florin
  'ANG': 1.79,          // Netherlands Antillean Guilder
  'SRD': 35.50,         // Surinamese Dollar
  'GYD': 209.00,        // Guyanese Dollar

  // Asia-Pacific
  'CNY': 7.110956,      // Chinese Yuan
  'INR': 88.584794,     // Indian Rupee
  'AUD': 1.542218,      // Australian Dollar
  'NZD': 1.776836,      // New Zealand Dollar
  'SGD': 1.304496,      // Singapore Dollar
  'HKD': 7.787282,      // Hong Kong Dollar
  'KRW': 1468.533789,   // South Korean Won
  'TWD': 31.257939,     // Taiwan Dollar
  'THB': 32.427122,     // Thai Baht
  'MYR': 4.149768,      // Malaysian Ringgit
  'IDR': 16716.937781,  // Indonesian Rupiah
  'PHP': 58.914750,     // Philippine Peso
  'VND': 24000.00,      // Vietnamese Dong
  'PKR': 282.362722,    // Pakistani Rupee
  'BDT': 120.00,        // Bangladeshi Taka
  'LKR': 308.018439,    // Sri Lankan Rupee
  'NPR': 141.802109,    // Nepalese Rupee
  'MMK': 2100.00,       // Myanmar Kyat
  'KHR': 4050.00,       // Cambodian Riel
  'LAK': 22000.00,      // Lao Kip
  'BND': 1.304496,      // Brunei Dollar
  'MOP': 8.03,          // Macanese Pataca
  'KZT': 518.579686,    // Kazakhstani Tenge
  'UZS': 12800.00,      // Uzbekistani Som
  'KGS': 85.00,         // Kyrgyzstani Som
  'TJS': 10.65,         // Tajikistani Somoni
  'TMT': 3.50,          // Turkmenistani Manat
  'AFN': 70.00,         // Afghan Afghani
  'MNT': 3400.00,       // Mongolian Tugrik
  'BTN': 84.00,         // Bhutanese Ngultrum
  'MVR': 15.40,         // Maldivian Rufiyaa
  'FJD': 2.27,          // Fijian Dollar
  'PGK': 4.00,          // Papua New Guinean Kina
  'SBD': 8.50,          // Solomon Islands Dollar
  'VUV': 120.00,        // Vanuatu Vatu
  'WST': 2.75,          // Samoan Tala
  'TOP': 2.37,          // Tongan Pa'anga
  'XPF': 103.00,        // CFP Franc

  // Europe
  'NOK': 10.124125,     // Norwegian Krone
  'SEK': 9.497476,      // Swedish Krona
  'DKK': 6.455243,      // Danish Krone
  'ISK': 126.874389,    // Icelandic Krona
  'PLN': 3.666073,      // Polish Zloty
  'CZK': 20.904886,     // Czech Koruna
  'HUF': 331.494468,    // Hungarian Forint
  'RON': 4.397957,      // Romanian Leu
  'BGN': 1.690309,      // Bulgarian Lev
  'HRK': 6.50,          // Croatian Kuna
  'RSD': 108.00,        // Serbian Dinar
  'TRY': 42.349529,     // Turkish Lira
  'UAH': 41.50,         // Ukrainian Hryvnia
  'BYN': 3.28,          // Belarusian Ruble
  'RUB': 80.758470,     // Russian Ruble
  'GEL': 2.70,          // Georgian Lari
  'AMD': 387.00,        // Armenian Dram
  'AZN': 1.70,          // Azerbaijani Manat
  'BAM': 1.69,          // Bosnia-Herzegovina Convertible Mark
  'MKD': 53.50,         // Macedonian Denar
  'ALL': 91.00,         // Albanian Lek
  'MDL': 17.80,         // Moldovan Leu

  // Middle East
  'ILS': 3.263593,      // Israeli Shekel
  'AED': 3.672500,      // UAE Dirham
  'SAR': 3.750000,      // Saudi Riyal
  'QAR': 3.640000,      // Qatari Riyal
  'KWD': 0.307182,      // Kuwaiti Dinar
  'BHD': 0.376000,      // Bahraini Dinar
  'OMR': 0.384871,      // Omani Rial
  'JOD': 0.709,         // Jordanian Dinar
  'LBP': 89500.00,      // Lebanese Pound
  'SYP': 13000.00,      // Syrian Pound
  'IQD': 1310.00,       // Iraqi Dinar
  'IRR': 42078.703032,  // Iranian Rial
  'YER': 250.00,        // Yemeni Rial

  // Africa
  'ZAR': 17.167813,     // South African Rand
  'EGP': 49.00,         // Egyptian Pound
  'NGN': 1650.00,       // Nigerian Naira
  'KES': 129.00,        // Kenyan Shilling
  'GHS': 16.00,         // Ghanaian Cedi
  'TZS': 2600.00,       // Tanzanian Shilling
  'UGX': 3700.00,       // Ugandan Shilling
  'MAD': 9.80,          // Moroccan Dirham
  'DZD': 134.00,        // Algerian Dinar
  'TND': 3.10,          // Tunisian Dinar
  'LYD': 5.456492,      // Libyan Dinar
  'ETB': 125.00,        // Ethiopian Birr
  'ZMW': 27.50,         // Zambian Kwacha
  'BWP': 13.544680,     // Botswana Pula
  'MUR': 45.917498,     // Mauritian Rupee
  'MGA': 4600.00,       // Malagasy Ariary
  'MZN': 64.00,         // Mozambican Metical
  'AOA': 925.00,        // Angolan Kwanza
  'XOF': 600.00,        // West African CFA Franc
  'XAF': 600.00,        // Central African CFA Franc
  'RWF': 1380.00,       // Rwandan Franc
  'BIF': 2900.00,       // Burundian Franc
  'DJF': 177.00,        // Djiboutian Franc
  'GMD': 71.00,         // Gambian Dalasi
  'GNF': 8600.00,       // Guinean Franc
  'SCR': 13.50,         // Seychellois Rupee
  'SOS': 571.00,        // Somali Shilling
  'SSP': 130.00,        // South Sudanese Pound
  'SDG': 600.00,        // Sudanese Pound
  'SLL': 22000.00,      // Sierra Leonean Leone
  'SLE': 22.00,         // Sierra Leonean Leone (new)
  'STN': 22.50,         // Sao Tome and Principe Dobra
  'SZL': 18.00,         // Swazi Lilangeni
  'LSL': 18.00,         // Lesotho Loti
  'NAD': 18.00,         // Namibian Dollar
  'MWK': 1730.00,       // Malawian Kwacha
  'ZWL': 322.00,        // Zimbabwean Dollar
  'CVE': 95.50,         // Cape Verdean Escudo
  'KMF': 425.00,        // Comorian Franc
  'MRU': 39.80,         // Mauritanian Ouguiya
  'CDF': 2850.00,       // Congolese Franc
  'LRD': 195.00,        // Liberian Dollar
  'ERN': 15.00,         // Eritrean Nakfa

  // Other
  'BMD': 1.00,          // Bermudian Dollar
  'KYD': 0.83,          // Cayman Islands Dollar
  'FKP': 0.76,          // Falkland Islands Pound
  'GIP': 0.76,          // Gibraltar Pound
  'SHP': 0.76,          // Saint Helena Pound
  'JEP': 0.76,          // Jersey Pound
  'GGP': 0.76,          // Guernsey Pound
  'IMP': 0.76           // Isle of Man Pound
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
