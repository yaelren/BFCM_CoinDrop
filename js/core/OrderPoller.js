/**
 * Order Poller
 *
 * Polls /api/orders endpoint when queue is empty.
 * - Queue-based polling: fetches only after processing previous batch
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
    this.isRunning = false;
    this.pollLoopTimeoutId = null;

    // Polling config
    this.queueCheckInterval = 1000;    // Check queue every 1 second
    this.minFetchDelay = 1000;         // Minimum 1s between fetches
    this.lastFetchTime = 0;

    // Exponential backoff config
    this.baseInterval = 1000;          // 1 second base
    this.currentInterval = 1000;
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

    console.log('📦 Starting queue-based order polling');
    this.isRunning = true;

    // Start polling loop
    this.pollLoop();
  }

  /**
   * Stop polling
   */
  stop() {
    if (!this.isRunning) return;

    console.log('Stopping order polling');
    this.isRunning = false;

    if (this.pollLoopTimeoutId) {
      clearTimeout(this.pollLoopTimeoutId);
      this.pollLoopTimeoutId = null;
    }
  }

  /**
   * Main polling loop - checks queue and fetches when empty
   */
  async pollLoop() {
    if (!this.isRunning) return;

    // Check if queue is empty
    if (this.queueManager.isEmpty()) {
      // Respect minimum delay between fetches
      const timeSinceLastFetch = Date.now() - this.lastFetchTime;
      if (timeSinceLastFetch >= this.minFetchDelay) {
        await this.fetchOrders();
      }
    }

    // Schedule next check
    const checkInterval = this.consecutiveErrors > 0
      ? this.currentInterval  // Use backoff interval on errors
      : this.queueCheckInterval;  // Normal queue checking

    this.pollLoopTimeoutId = setTimeout(() => {
      this.pollLoop();
    }, checkInterval);
  }

  /**
   * Fetch orders from API
   */
  async fetchOrders() {
    if (!this.isRunning) return;

    this.lastFetchTime = Date.now();

    try {
      const orders = await this.api.fetchOrders();

      // Success: reset error counter
      if (this.consecutiveErrors > 0) {
        console.log('✅ Order polling recovered');
        this.consecutiveErrors = 0;
        this.currentInterval = this.baseInterval;
      }

      // Filter duplicates
      const newOrders = this.queueManager.filterDuplicates(orders);

      if (newOrders.length > 0) {
        // Add to queue
        const added = this.queueManager.enqueue(newOrders);

        console.log(`📦 Fetched ${orders.length} orders, ${newOrders.length} new, ${added} added to queue`);
        console.log(`   Queue will be processed before next fetch`);
      } else if (orders.length > 0) {
        console.log(`📦 Fetched ${orders.length} orders, all duplicates (filtered)`);
      } else {
        console.log(`📦 No new orders available`);
      }

    } catch (error) {
      this.consecutiveErrors++;

      // Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (cap)
      this.currentInterval = Math.min(
        this.baseInterval * Math.pow(2, this.consecutiveErrors - 1),
        this.maxInterval
      );

      console.error(`❌ Order fetch error #${this.consecutiveErrors}, backing off to ${this.currentInterval}ms`);

      this.onError(error);

      // Alert if too many errors
      if (this.consecutiveErrors >= 5) {
        console.warn('⚠️ Multiple consecutive order polling errors - API may be unreachable');
      }
    }
  }
}
