import { BaseElement } from '../core/BaseElement.js';

/**
 * SlotMachineElement - Displays numbers with slot machine animation
 * Supports 3 animation styles: All Together, Sequential, Random
 * Used for Sale and Online GPV
 */
import { toResponsiveUnit } from '../utils/ResponsiveScale.js';

export class SlotMachineElement extends BaseElement {
  constructor(id, config) {
    super(id, {
      ...config,
      type: 'slotMachine',
      config: {
        animationStyle: config.animationStyle || 1, // 1=all, 2=sequential, 3=random
        spinSpeed: config.spinSpeed || 800,
        dollarSpins: config.dollarSpins !== undefined ? config.dollarSpins : false,
        fontSize: config.fontSize || 48,
        color: config.color || '#FFFFFF',
        digitHeight: config.digitHeight || 60,
        ...config.config
      }
    });

    this.currentValue = 0;
    this.digitContainers = [];
    this.dollarContainer = null;
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'slot-machine-element flex items-center justify-center font-mono font-bold';
    container.style.fontSize = toResponsiveUnit(this.config.fontSize);
    container.style.color = this.config.color;

    return container;
  }

  /**
   * Create digit columns for the current value
   */
  createDigits(value) {
    if (!this.container) return;

    // Clear existing digits
    this.container.innerHTML = '';
    this.digitContainers = [];

    const valueStr = Math.abs(Math.floor(value)).toString();
    const isNegative = value < 0;

    // Add dollar sign if needed
    this.dollarContainer = document.createElement('div');
    this.dollarContainer.className = 'slot-digit-static';
    this.dollarContainer.textContent = '$';
    this.dollarContainer.style.marginRight = '0.1em';
    this.container.appendChild(this.dollarContainer);

    // Add negative sign if needed
    if (isNegative) {
      const negativeSign = document.createElement('div');
      negativeSign.className = 'slot-digit-static';
      negativeSign.textContent = '-';
      this.container.appendChild(negativeSign);
    }

    // Create digit containers
    for (let i = 0; i < valueStr.length; i++) {
      const digitWrapper = document.createElement('div');
      digitWrapper.className = 'slot-digit-wrapper';
      digitWrapper.style.cssText = `
        overflow: hidden;
        height: ${this.config.digitHeight}px;
        display: inline-block;
        position: relative;
      `;

      const digitColumn = document.createElement('div');
      digitColumn.className = 'slot-digit-column';
      digitColumn.style.cssText = `
        display: flex;
        flex-direction: column;
        position: relative;
        transition: none;
      `;

      // Create all digits 0-9
      for (let digit = 0; digit <= 9; digit++) {
        const digitSpan = document.createElement('span');
        digitSpan.textContent = digit;
        digitSpan.style.cssText = `
          height: ${this.config.digitHeight}px;
          display: flex;
          align-items: center;
          justify-content: center;
        `;
        digitColumn.appendChild(digitSpan);
      }

      digitWrapper.appendChild(digitColumn);
      this.container.appendChild(digitWrapper);

      this.digitContainers.push({
        wrapper: digitWrapper,
        column: digitColumn,
        currentDigit: parseInt(valueStr[i])
      });

      // Set initial position
      digitColumn.style.transform = `translateY(-${parseInt(valueStr[i]) * this.config.digitHeight}px)`;
    }
  }

  /**
   * Animate to new value
   */
  animateToValue(newValue) {
    const newValueStr = Math.abs(Math.floor(newValue)).toString();
    const oldValueStr = Math.abs(Math.floor(this.currentValue)).toString();

    // If digit count changed, recreate digits
    if (newValueStr.length !== oldValueStr.length) {
      this.createDigits(newValue);
      return;
    }

    // Animate dollar sign if enabled
    if (this.config.dollarSpins && this.dollarContainer) {
      this.animateDollarSign();
    }

    // Animate each digit based on style
    const delays = this.calculateDelays(newValueStr.length);

    this.digitContainers.forEach((digitContainer, index) => {
      const targetDigit = parseInt(newValueStr[index]);
      const currentDigit = digitContainer.currentDigit;

      if (targetDigit !== currentDigit) {
        this.animateDigit(digitContainer, targetDigit, delays[index]);
        digitContainer.currentDigit = targetDigit;
      }
    });

    this.currentValue = newValue;
  }

  /**
   * Calculate delays for each digit based on animation style
   */
  calculateDelays(digitCount) {
    const delays = [];

    switch (this.config.animationStyle) {
      case 1: // All together
        for (let i = 0; i < digitCount; i++) {
          delays.push(0);
        }
        break;

      case 2: // Sequential (right to left)
        for (let i = 0; i < digitCount; i++) {
          delays.push((digitCount - 1 - i) * 100);
        }
        break;

      case 3: // Random
        for (let i = 0; i < digitCount; i++) {
          delays.push(Math.random() * 300);
        }
        break;

      default:
        delays.push(...Array(digitCount).fill(0));
    }

    return delays;
  }

  /**
   * Animate a single digit
   */
  animateDigit(digitContainer, targetDigit, delay) {
    const column = digitContainer.column;
    const targetY = -targetDigit * this.config.digitHeight;

    anime({
      targets: column,
      translateY: targetY,
      duration: this.config.spinSpeed,
      delay: delay,
      easing: 'easeOutElastic(1, .6)'
    });
  }

  /**
   * Animate dollar sign
   */
  animateDollarSign() {
    if (!this.dollarContainer) return;

    // Spin effect
    anime({
      targets: this.dollarContainer,
      rotateY: [0, 360],
      duration: this.config.spinSpeed * 0.7,
      easing: 'easeOutCubic'
    });
  }

  /**
   * Update data with new value
   */
  updateData(newValue) {
    if (typeof newValue !== 'number') {
      console.warn(`SlotMachineElement ${this.id}: Invalid value type`, newValue);
      return;
    }

    // First time: set without animation
    if (this.digitContainers.length === 0) {
      this.currentValue = newValue;
      this.createDigits(newValue);
    } else {
      this.animateToValue(newValue);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    super.updateConfig(newConfig);

    if (this.container) {
      this.container.style.fontSize = toResponsiveUnit(this.config.fontSize);
      this.container.style.color = this.config.color;
    }

    // Recreate digits if digit height changed
    if (newConfig.digitHeight && newConfig.digitHeight !== this.config.digitHeight) {
      this.createDigits(this.currentValue);
    }
  }

  /**
   * Set value instantly without animation
   */
  setValue(value) {
    this.currentValue = value;
    this.createDigits(value);
  }
}
