/**
 * Online GPV Poller
 *
 * Polls /api/onlines endpoint on start and every 10 minutes.
 * - Fetches online GPV data
 * - Calls update callback with gpv value
 * - Error handling with retries
 */

export class OnlineGPVPoller {
  /**
   * @param {Object} api - API client instance
   * @param {Function} updateCallback - Called with gpv value
   * @param {Function} onError - Error callback
   */
  constructor(api, updateCallback, onError) {
    this.api = api;
    this.updateCallback = updateCallback;
    this.onError = onError;
    this.intervalId = null;
    this.isRunning = false;
    this.pollInterval = 600000;  // 10 minutes (600,000 ms)
  }

  /**
   * Start polling online GPV
   */
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Immediate first fetch
    this.fetchOnlineGPV();

    // Poll every 10 minutes
    this.intervalId = setInterval(() => {
      this.fetchOnlineGPV();
    }, this.pollInterval);
  }

  /**
   * Stop polling
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Fetch online GPV from API
   */
  async fetchOnlineGPV() {
    if (!this.isRunning) return;

    try {
      const data = await this.api.fetchOnlines();

      // Validate gpv exists
      if (data.gpv === undefined) {
        return;
      }

      console.log(`📊 Online GPV polled: $${data.gpv.toLocaleString()}`);

      // Trigger update
      this.updateCallback(data.gpv);

    } catch (error) {
      this.onError(error);
    }
  }
}
