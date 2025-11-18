/**
 * Order Queue Manager
 *
 * Manages FIFO queue of orders with duplicate prevention.
 * - Max queue size with overflow protection
 * - Duplicate filtering using order IDs
 * - Memory-efficient ID tracking with sliding window
 */

export class OrderQueueManager {
  /**
   * @param {number} maxSize - Maximum queue size (default: 500)
   */
  constructor(maxSize = 500) {
    this.queue = [];                    // FIFO array of order objects
    this.maxSize = maxSize;             // Maximum queue size
    this.lastProcessedOrderId = null;   // Last processed order ID
    this.processedOrderIds = new Set(); // Track recent IDs
    this.maxTrackedIds = 1000;          // Max IDs to keep in memory
  }

  /**
   * Filter duplicate orders from batch
   * @param {Array} orderBatch - Orders from API
   * @returns {Array} New orders only (not already processed)
   */
  filterDuplicates(orderBatch) {
    if (!Array.isArray(orderBatch)) {
      console.warn('Invalid order batch:', orderBatch);
      return [];
    }

    return orderBatch.filter(order => {
      // Validate order has ID
      if (!order.id) {
        console.warn('Order missing ID, skipping:', order);
        return false;
      }

      // Check if already processed
      if (this.processedOrderIds.has(order.id)) {
        console.log(`Duplicate order filtered: ${order.id}`);
        return false;
      }

      return true;
    });
  }

  /**
   * Mark order as processed
   * @param {string} orderId - Order ID to mark
   */
  markProcessed(orderId) {
    this.processedOrderIds.add(orderId);
    this.lastProcessedOrderId = orderId;

    // Memory management: trim if exceeds max tracked IDs
    if (this.processedOrderIds.size > this.maxTrackedIds) {
      const idsArray = Array.from(this.processedOrderIds);
      // Remove oldest 20%
      const toRemove = idsArray.slice(0, Math.floor(this.maxTrackedIds * 0.2));
      toRemove.forEach(id => this.processedOrderIds.delete(id));

      console.log(`Trimmed ${toRemove.length} old order IDs from tracking`);
    }
  }

  /**
   * Add orders to queue
   * @param {Array} orders - Orders to add
   * @returns {number} Number of orders actually added
   */
  enqueue(orders) {
    if (!Array.isArray(orders) || orders.length === 0) {
      return 0;
    }

    const available = this.maxSize - this.queue.length;

    if (available <= 0) {
      console.warn(`Queue full (${this.maxSize}), dropping ${orders.length} orders`);
      return 0;
    }

    // Add as many as fit
    const toAdd = orders.slice(0, available);
    this.queue.push(...toAdd);

    // Warn if some were dropped
    if (orders.length > available) {
      console.warn(`Queue overflow: ${orders.length - available} orders dropped`);
    }

    return toAdd.length;
  }

  /**
   * Remove and return next order from queue
   * @returns {Object|null} Next order or null if empty
   */
  dequeue() {
    return this.queue.shift() || null;
  }

  /**
   * Check if queue is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Get current queue size
   * @returns {number}
   */
  size() {
    return this.queue.length;
  }

  /**
   * Clear all orders from queue
   */
  clear() {
    this.queue = [];
    console.log('Queue cleared');
  }

  /**
   * Get queue status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      size: this.queue.length,
      maxSize: this.maxSize,
      utilization: ((this.queue.length / this.maxSize) * 100).toFixed(1) + '%',
      lastProcessedOrderId: this.lastProcessedOrderId,
      trackedIds: this.processedOrderIds.size,
      maxTrackedIds: this.maxTrackedIds
    };
  }
}
