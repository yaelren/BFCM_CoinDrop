/**
 * Totals Poller
 *
 * Polls /api/totals endpoint every 10 minutes.
 * - Parses nested structure
 * - Calls reconciliation callback with totals
 * - Error handling with retries
 */

export class TotalsPoller {
  /**
   * @param {Object} api - API client instance
   * @param {Function} reconciliationCallback - Called with totals data
   * @param {Function} onError - Error callback
   */
  constructor(api, reconciliationCallback, onError) {
    this.api = api;
    this.reconciliationCallback = reconciliationCallback;
    this.onError = onError;
    this.intervalId = null;
    this.isRunning = false;
    this.pollInterval = 600000;  // 10 minutes (600,000 ms)
  }

  /**
   * Start polling totals
   */
  start() {
    if (this.isRunning) {
      // console.warn('Totals poller already running');
      return;
    }

    // console.log('📊 Starting totals polling (10min interval)');
    this.isRunning = true;

    // Immediate first fetch
    this.fetchTotals();

    // Poll every 10 minutes
    this.intervalId = setInterval(() => {
      this.fetchTotals();
    }, this.pollInterval);
  }

  /**
   * Stop polling
   */
  stop() {
    if (!this.isRunning) return;

    // console.log('Stopping totals polling');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Fetch totals from API
   */
  async fetchTotals() {
    if (!this.isRunning) return;

    try {
      const totals = await this.api.fetchTotals();

      // Validate structure
      if (!totals.orders_count || !totals.gpv) {
        // console.error('Invalid totals structure:', totals);
        return;
      }

      // Log received totals
      // console.log('📊 Totals API response:', {
      //   totalOrders: totals.orders_count.total,
      //   onlineOrders: totals.orders_count.online,
      //   totalGPV: `$${totals.gpv.total.toFixed(2)}`,
      //   onlineGPV: `$${totals.gpv.online.toFixed(2)}`,
      //   aov: `$${totals.aov.total.toFixed(2)}`
      // });

      // Trigger reconciliation
      this.reconciliationCallback(totals);

    } catch (error) {
      // console.error('❌ Totals fetch failed:', error);
      this.onError(error);
    }
  }
}
