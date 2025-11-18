/**
 * Order Poller
 *
 * Polls /api/orders endpoint every 2 seconds.
 * - Filters duplicates before queueing
 * - Exponential backoff on errors
 * - Start/stop controls
 */

export class OrderPoller {
  /**
   * @param {Object} api - API client instance
   * @param {Object} queueManager - Queue manager instance
   * @param {Function} onError - Error callback
   */
  constructor(api, queueManager, onError) {
    this.api = api;
    this.queueManager = queueManager;
    this.onError = onError;
    this.intervalId = null;
    this.isRunning = false;

    // Exponential backoff config
    this.baseInterval = 2000;          // 2 seconds
    this.currentInterval = 2000;
    this.maxInterval = 30000;          // 30 seconds max
    this.consecutiveErrors = 0;
  }

  /**
   * Start polling orders
   */
  start() {
    if (this.isRunning) {
      console.warn('Order poller already running');
      return;
    }

    console.log('📦 Starting order polling (2s interval)');
    this.isRunning = true;

    // Immediate first fetch
    this.fetchOrders();

    // Poll at current interval
    this.intervalId = setInterval(() => {
      this.fetchOrders();
    }, this.currentInterval);
  }

  /**
   * Stop polling
   */
  stop() {
    if (!this.isRunning) return;

    console.log('Stopping order polling');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Restart poller with new interval (for backoff)
   */
  restartWithInterval(interval) {
    if (!this.isRunning) return;

    // Clear old interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Start new interval
    this.intervalId = setInterval(() => {
      this.fetchOrders();
    }, interval);
  }

  /**
   * Fetch orders from API
   */
  async fetchOrders() {
    if (!this.isRunning) return;

    try {
      const orders = await this.api.fetchOrders();

      // Success: reset error counter and interval
      if (this.consecutiveErrors > 0) {
        console.log('✅ Order polling recovered');
        this.consecutiveErrors = 0;
        this.currentInterval = this.baseInterval;
        this.restartWithInterval(this.currentInterval);
      }

      // Filter duplicates
      const newOrders = this.queueManager.filterDuplicates(orders);

      if (newOrders.length > 0) {
        // Add to queue
        const added = this.queueManager.enqueue(newOrders);

        console.log(`📦 Fetched ${orders.length} orders, ${newOrders.length} new, ${added} added to queue`);
      } else if (orders.length > 0) {
        console.log(`📦 Fetched ${orders.length} orders, all duplicates (filtered)`);
      }

    } catch (error) {
      this.consecutiveErrors++;

      // Exponential backoff: 2s → 4s → 8s → 16s → 30s (cap)
      this.currentInterval = Math.min(
        this.baseInterval * Math.pow(2, this.consecutiveErrors - 1),
        this.maxInterval
      );

      console.error(`❌ Order fetch error #${this.consecutiveErrors}, backing off to ${this.currentInterval}ms`);

      this.onError(error);

      // Update interval with backoff
      this.restartWithInterval(this.currentInterval);

      // Alert if too many errors
      if (this.consecutiveErrors >= 5) {
        console.warn('⚠️ Multiple consecutive order polling errors - API may be unreachable');
      }
    }
  }
}
