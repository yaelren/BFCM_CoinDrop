import { BaseElement } from '../core/BaseElement.js';

/**
 * TextElement - Displays static or updating text with centered alignment
 * Used for simple text displays like order counts
 */
import { toResponsiveUnit } from '../utils/ResponsiveScale.js';

export class TextElement extends BaseElement {
  constructor(id, config) {
    super(id, {
      ...config,
      type: 'text',
      config: {
        fontSize: config.fontSize || 48,
        color: config.color || '#000000',
        prefix: config.prefix || '',
        suffix: config.suffix || '',
        decimals: config.decimals || 0,
        textShadow: config.textShadow || null, // Optional text glow effect
        ...config.config
      }
    });

    this.currentValue = 0;
    this.displayElement = null;
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'text-element flex items-center justify-center';

    this.displayElement = document.createElement('div');
    this.displayElement.className = 'text-display';
    this.updateDisplayStyles();

    container.appendChild(this.displayElement);
    return container;
  }

  onInit() {
    this.updateDisplay();
  }

  /**
   * Update display text styles
   */
  updateDisplayStyles() {
    if (!this.displayElement) return;

    this.displayElement.style.fontSize = toResponsiveUnit(this.config.fontSize);
    this.displayElement.style.color = this.config.color;
    this.displayElement.style.textAlign = 'center';
    this.displayElement.style.width = '100%';
    this.displayElement.style.fontWeight = '300';

    // Apply text glow effect if configured
    if (this.config.textShadow) {
      this.displayElement.style.textShadow = this.config.textShadow;
    }
  }

  /**
   * Format number with commas and decimals
   */
  formatNumber(value) {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: this.config.decimals,
      maximumFractionDigits: this.config.decimals
    }).format(value);

    return `${this.config.prefix}${formatted}${this.config.suffix}`;
  }

  /**
   * Update display text
   */
  updateDisplay() {
    if (this.displayElement) {
      this.displayElement.textContent = this.formatNumber(this.currentValue);
    }
  }

  /**
   * Update text value (instant, no animation)
   */
  updateData(newValue) {
    if (typeof newValue !== 'number') {
      // console.warn(`TextElement ${this.id}: Invalid value type`, newValue);
      return;
    }

    this.currentValue = newValue;
    this.updateDisplay();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    super.updateConfig(newConfig);
    this.updateDisplayStyles();
    this.updateDisplay();
  }

  /**
   * Set value instantly
   */
  setValue(value) {
    this.currentValue = value;
    this.updateDisplay();
  }
}
