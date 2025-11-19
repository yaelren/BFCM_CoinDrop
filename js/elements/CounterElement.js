import { BaseElement } from '../core/BaseElement.js';

/**
 * CounterElement - Displays a number with smooth lerp animation
 * Used for Total Sales and Total Orders
 */
import { toResponsiveUnit } from '../utils/ResponsiveScale.js';

export class CounterElement extends BaseElement {
  constructor(id, config) {
    super(id, {
      ...config,
      type: 'counter',
      config: {
        lerpSpeed: config.lerpSpeed || 1.0,
        fontSize: config.fontSize || 48,
        color: config.color || '#FFFFFF',
        prefix: config.prefix || '',
        suffix: config.suffix || '',
        decimals: config.decimals || 0,
        ...config.config
      }
    });

    this.currentValue = 0;
    this.targetValue = 0;
    this.displayElement = null;
    this.animationObj = { value: 0 };
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'counter-element flex items-center justify-center';

    this.displayElement = document.createElement('div');
    this.displayElement.className = 'counter-display';
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
    this.displayElement.style.fontWeight = '400';
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
      this.displayElement.textContent = this.formatNumber(this.animationObj.value);
    }
  }

  /**
   * Update counter value with animation
   */
  updateData(newValue) {
    if (typeof newValue !== 'number') {
      console.warn(`CounterElement ${this.id}: Invalid value type`, newValue);
      return;
    }

    this.targetValue = newValue;

    // Use Anime.js for smooth lerp animation
    anime({
      targets: this.animationObj,
      value: this.targetValue,
      duration: this.config.lerpSpeed * 1000,
      easing: 'easeOutCubic',
      update: () => {
        this.updateDisplay();
      }
    });
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
   * Set value instantly without animation
   */
  setValue(value) {
    this.currentValue = value;
    this.targetValue = value;
    this.animationObj.value = value;
    this.updateDisplay();
  }
}
