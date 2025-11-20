/**
 * Order Processor
 *
 * Main processing loop for orders.
 * - Sequential processing (one order at a time)
 * - Configurable delay between orders
 * - Phase I: LOGGING ONLY (no element updates)
 * - Phase II: Will add element updates
 */

import { convertToUSD } from '../utils/CurrencyConverter.js';
import { calculateCoins } from '../utils/CoinCalculator.js';

export class OrderProcessor {
  /**
   * @param {Object} queueManager - Queue manager instance
   * @param {Object} dashboard - LED Dashboard instance
   * @param {Object} config - Configuration object
   */
  constructor(queueManager, dashboard, config = {}) {
    this.queueManager = queueManager;
    this.dashboard = dashboard;
    this.config = {
      minDisplayTime: config.minDisplayTime || 3000,  // Default 3 seconds between orders
      saleToPlinkDelay: config.saleToPlinkDelay || 200,  // Delay from sale to plinko
      plinkoToCountersDelay: config.plinkoToCountersDelay || 300  // Delay before counters update
    };

    this.isProcessing = false;
    this.processingTimeoutId = null;
    this.state = {
      totalProcessed: 0,
      currentOrder: null,
      lastProcessedTime: null,
      errorCount: 0
    };
  }

  /**
   * Start processing loop
   */
  start() {
    if (this.isProcessing) {
      console.warn('Processor already running');
      return;
    }

    console.log('🎯 Starting order processor');
    this.isProcessing = true;
    this.processNext();
  }

  /**
   * Stop processing loop
   */
  stop() {
    console.log('Stopping order processor');
    this.isProcessing = false;

    if (this.processingTimeoutId) {
      clearTimeout(this.processingTimeoutId);
      this.processingTimeoutId = null;
    }
  }

  /**
   * Process next order in queue
   */
  async processNext() {
    // Check if should continue
    if (!this.isProcessing) {
      return;
    }

    // Check if queue empty
    if (this.queueManager.isEmpty()) {
      // Queue empty - wait 1 second and check again
      this.processingTimeoutId = setTimeout(() => {
        this.processNext();
      }, 1000);
      return;
    }

    // Dequeue next order
    const order = this.queueManager.dequeue();
    this.state.currentOrder = order;

    console.log(`🎯 Processing order ${order.id} (queue: ${this.queueManager.size()} remaining)`);

    try {
      // Process order
      await this.processOrder(order);

      // Mark as processed
      this.queueManager.markProcessed(order.id);

      // Update stats
      this.state.totalProcessed++;
      this.state.lastProcessedTime = new Date();

    } catch (error) {
      console.error('❌ Order processing failed:', error, order);
      this.state.errorCount++;
      // Continue anyway (don't halt entire pipeline)
    }

    this.state.currentOrder = null;

    // Wait configured delay before next order
    this.processingTimeoutId = setTimeout(() => {
      this.processNext();
    }, this.config.minDisplayTime);
  }

  /**
   * Process single order
   * PHASE II: Element updates + coin drops
   */
  async processOrder(order) {
    // 1. Parse amount (convert string to number)
    const amount = parseFloat(order.amount);
    if (isNaN(amount)) {
      console.error('Invalid amount:', order.amount);
      return;
    }

    // 2. Convert currency to USD
    const usdAmount = convertToUSD(amount, order.currency);

    // Skip orders with $0 value
    if (usdAmount === 0) {
      console.log(`⏭️  Skipping order ${order.id}: $0 USD value`);
      return;
    }

    // 3. Calculate coin drops
    const { tens, ones } = calculateCoins(usdAmount);

    // 4. Extract data
    const location = `${order.location.city || 'Unknown'}, ${order.location.country || 'Unknown'}`;
    const businessName = order.metadata?.business_name || 'N/A';    console.log(`🔍 Extracted business name: "${businessName}"`);
    console.log(`🔍 Order metadata:`, order.metadata);

    // Log processing details with emphasis on amount and coins
    console.log('═════════════════════════════════════════════════════');
    console.log(`🎯 ORDER: ${order.id}`);
    console.log(`   ${businessName} (${location})`);
    console.log(`   %c${order.currency} ${order.amount} → $${usdAmount} USD`, 'font-weight: bold; font-size: 14px; color: #4CAF50');
    console.log(`   %cCoins: ${tens}×$10 + ${ones}×$1 = ${tens + ones} TOTAL`, 'font-weight: bold; font-size: 14px; color: #FF9800');
    console.log('═════════════════════════════════════════════════════');

    // PHASE II: Update elements in sequence
    // 1. Sale element (with animation)
    await this.updateSale(usdAmount);
    
    // 2. Wait for sale animation to start, then trigger Plinko
    await this.delay(this.config.saleToPlinkDelay);
    this.dropCoins(tens, ones);
    
    // 3. Update other elements (location, store name)
    await this.updateLocation(order);
    await this.updateStoreName(businessName);
    
    // 4. Finally update counters (total sales and orders)
    await this.delay(this.config.plinkoToCountersDelay);
    await this.updateCounters(usdAmount);
  }

  /**
   * Helper to create delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update sale element with USD amount
   */
  async updateSale(usdAmount) {
    if (!this.dashboard.elements.sale) return;
    this.dashboard.elements.sale.updateData(usdAmount);
  }

  /**
   * Update location element with map data
   */
  async updateLocation(order) {
    if (!this.dashboard.elements.location) return;
    
    // Map element needs full location object with lat/lon
    if (order.location && order.location.lat && order.location.lon) {
      this.dashboard.elements.location.updateData(order.location);
    }
  }

  /**
   * Update store name element
   */
  /**
   * Update store name element
   */
  /**
   * Update store name element
   */
  async updateStoreName(businessName) {
    if (!this.dashboard.elements.storeName) return;
    // Skip adding store name if it's N/A
    if (businessName === 'N/A') return;
    this.dashboard.elements.storeName.addName(businessName);
  }

  /**
   * Update counter elements (totalOrders, totalSales)
   * Note: onlineGPV is updated from totals API only, not from individual orders
   */
  async updateCounters(usdAmount) {
    // Increment total orders (TextElement uses currentValue, not targetValue)
    if (this.dashboard.elements.totalOrders) {
      const current = this.dashboard.elements.totalOrders.currentValue || 0;
      this.dashboard.elements.totalOrders.updateData(current + 1);
    }

    // Increment total sales
    if (this.dashboard.elements.totalSales) {
      const current = this.dashboard.elements.totalSales.targetValue || 0;
      this.dashboard.elements.totalSales.updateData(current + usdAmount);
    }

    // onlineGPV is NOT updated here - it's updated from totals API reconciliation only
  }

  /**
   * Drop coins into Plinko
   */
  dropCoins(tens, ones) {
    const plinkoElement = this.dashboard.elements.plinko;
    if (!plinkoElement) {
      console.warn('Plinko element not found');
      return;
    }

    const sketch = plinkoElement.getSketch();
    if (!sketch || !sketch.dropCoins) {
      console.warn('Plinko dropCoins method not available');
      return;
    }

    sketch.dropCoins(tens, ones);
  }

  /**
   * Get configuration (for GUI controls)
   * @returns {Object} Configuration object
   */
  getConfig() {
    return this.config;
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }

  /**
   * Get processing status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueSize: this.queueManager.size(),
      totalProcessed: this.state.totalProcessed,
      lastProcessedTime: this.state.lastProcessedTime,
      errorCount: this.state.errorCount,
      currentOrder: this.state.currentOrder?.id || null
    };
  }
}
