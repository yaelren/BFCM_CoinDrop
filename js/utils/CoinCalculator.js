/**
 * Coin Drop Calculator
 *
 * Calculates how many $10 and $1 coins to drop based on USD amount.
 * Floors to nearest dollar (no cents).
 */

// Maximum coins to prevent performance issues
const MAX_TOTAL_COINS = 50;

/**
 * Calculate coin drops from USD amount
 * @param {number} usdAmount - Amount in USD
 * @returns {Object} Object with {tens: number, ones: number}
 *
 * @example
 * calculateCoins(27.50)  // {tens: 2, ones: 7}
 * calculateCoins(100)    // {tens: 10, ones: 0}
 * calculateCoins(5)      // {tens: 0, ones: 5}
 * calculateCoins(0)      // {tens: 0, ones: 0}
 * calculateCoins(5000)   // {tens: 45, ones: 5} (capped at 50 total)
 */
export function calculateCoins(usdAmount) {
  // Round down to nearest dollar (ignore cents)
  const dollars = Math.floor(Math.abs(usdAmount));

  // Calculate tens and ones
  let tens = Math.floor(dollars / 10);
  let ones = dollars % 10;

  // Cap total coins to prevent performance issues
  const totalCoins = tens + ones;
  if (totalCoins > MAX_TOTAL_COINS) {
    // Distribute max coins: prioritize $10 coins
    tens = Math.min(tens, Math.floor(MAX_TOTAL_COINS * 0.9));
    ones = MAX_TOTAL_COINS - tens;
    console.log(`⚠️ Coin drop capped: $${dollars} would drop ${totalCoins} coins, capped to ${MAX_TOTAL_COINS}`);
  }

  return { tens, ones };
}
