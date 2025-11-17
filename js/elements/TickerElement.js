import { BaseElement } from '../core/BaseElement.js';

/**
 * TickerElement - Horizontal scrolling text ticker
 * Used for displaying store names in a continuous scroll
 */
export class TickerElement extends BaseElement {
  constructor(id, config) {
    super(id, {
      ...config,
      type: 'ticker',
      config: {
        scrollSpeed: config.scrollSpeed || 50, // pixels per second
        maxQueue: config.maxQueue || 10,
        fontSize: config.fontSize || 32,
        color: config.color || '#FFFFFF',
        separator: config.separator || '   ', // spaces between names
        ...config.config
      }
    });

    this.queue = [];
    this.tickerContent = null;
    this.animationId = null;
    this.scrollPosition = 0;
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'ticker-element';
    container.style.cssText = `
      overflow: hidden;
      white-space: nowrap;
      position: relative;
    `;

    this.tickerContent = document.createElement('div');
    this.tickerContent.className = 'ticker-content font-mono';
    this.tickerContent.style.cssText = `
      display: inline-block;
      position: absolute;
      left: 0;
      font-size: ${this.config.fontSize}px;
      color: ${this.config.color};
    `;

    container.appendChild(this.tickerContent);
    return container;
  }

  onInit() {
    this.startScrolling();
  }

  /**
   * Add a new name to the ticker queue
   */
  addName(name) {
    if (!name || typeof name !== 'string') return;

    // Add to queue
    this.queue.push(name);

    // Enforce max queue size
    if (this.queue.length > this.config.maxQueue) {
      this.queue.shift();
    }

    // Update ticker display
    this.updateTickerText();
  }

  /**
   * Update ticker text content
   */
  updateTickerText() {
    if (!this.tickerContent || this.queue.length === 0) return;

    // Create ticker text by repeating the queue to ensure continuous scroll
    const queueText = this.queue.join(this.config.separator);
    // Repeat 3 times to ensure smooth looping
    this.tickerContent.textContent = `${queueText}${this.config.separator}${queueText}${this.config.separator}${queueText}`;
  }

  /**
   * Start the scrolling animation
   */
  startScrolling() {
    if (this.animationId) return;

    let lastTime = performance.now();

    const animate = (currentTime) => {
      if (!this.tickerContent || !this.container) return;

      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Move ticker position
      this.scrollPosition += this.config.scrollSpeed * deltaTime;

      // Get the width of the content
      const contentWidth = this.tickerContent.offsetWidth / 3; // Divide by 3 because we repeat 3 times

      // Reset position when one full cycle is complete
      if (this.scrollPosition >= contentWidth) {
        this.scrollPosition = 0;
      }

      // Apply transform
      this.tickerContent.style.transform = `translateX(-${this.scrollPosition}px)`;

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Stop scrolling animation
   */
  stopScrolling() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Update data - expects array of names or single name
   */
  updateData(data) {
    if (Array.isArray(data)) {
      // Replace entire queue
      this.queue = data.slice(0, this.config.maxQueue);
      this.updateTickerText();
    } else if (typeof data === 'string') {
      // Add single name
      this.addName(data);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    super.updateConfig(newConfig);

    if (this.tickerContent) {
      this.tickerContent.style.fontSize = `${this.config.fontSize}px`;
      this.tickerContent.style.color = this.config.color;
    }

    // Update ticker text if separator changed
    if (newConfig.separator) {
      this.updateTickerText();
    }

    // Restart scrolling if speed changed
    if (newConfig.scrollSpeed) {
      // No need to restart, speed is checked each frame
    }
  }

  /**
   * Clear all names from ticker
   */
  clear() {
    this.queue = [];
    this.updateTickerText();
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopScrolling();
    super.destroy();
  }
}
