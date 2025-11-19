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
    this.activeAnimations = []; // Track active animations for cancellation
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'slot-machine-element flex items-center justify-center';
    container.style.fontSize = toResponsiveUnit(this.config.fontSize);
    container.style.color = this.config.color;
    container.style.fontWeight = '400';

    return container;
  }

  /**
   * Create digit columns for the current value
   */
  createDigits(value) {
    if (!this.container) return;

    // Cancel all active animations before destroying DOM
    this.cancelAllAnimations();

    // Clear existing digits
    this.container.innerHTML = '';
    this.digitContainers = [];

    // Truncate decimal point (floor to whole number) and add commas
    const valueStr = Math.abs(Math.floor(value)).toLocaleString('en-US');
    const isNegative = value < 0;

    // Dollar sign removed - no longer displaying currency symbol
    this.dollarContainer = null;

    // Add negative sign if needed
    if (isNegative) {
      const negativeSign = document.createElement('div');
      negativeSign.className = 'slot-digit-static';
      negativeSign.textContent = '-';
      this.container.appendChild(negativeSign);
    }

    // Create digit containers
    for (let i = 0; i < valueStr.length; i++) {
      const char = valueStr[i];
      
      // Handle commas as static elements
      if (char === ',') {
        const commaEl = document.createElement('div');
        commaEl.className = 'slot-digit-static';
        commaEl.textContent = ',';
        commaEl.style.marginLeft = '0.05em';
        commaEl.style.marginRight = '0.05em';
        this.container.appendChild(commaEl);
        continue;
      }
      
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
        currentDigit: parseInt(char)
      });

      // Set initial position
      digitColumn.style.transform = `translateY(-${parseInt(char) * this.config.digitHeight}px)`;
    }
  }

  /**
   * Animate to new value
   */
  animateToValue(newValue) {
    // Truncate decimal point (floor to whole numbers) and add commas
    const newValueStr = Math.abs(Math.floor(newValue)).toLocaleString('en-US');
    const oldValueStr = Math.abs(Math.floor(this.currentValue)).toLocaleString('en-US');

    // If digit count changed, recreate digits
    if (newValueStr.length !== oldValueStr.length) {
      this.currentValue = newValue; // Update current value BEFORE recreating
      this.createDigits(newValue);
      return;
    }

    // Dollar sign animation removed - no currency symbol to animate

    // Animate each digit based on style
    // Filter out commas to get only digit positions
    const digitsOnly = newValueStr.replace(/,/g, '');
    const delays = this.calculateDelays(digitsOnly.length);

    let digitIndex = 0;
    this.digitContainers.forEach((digitContainer) => {
      const targetDigit = parseInt(digitsOnly[digitIndex]);
      const currentDigit = digitContainer.currentDigit;

      if (targetDigit !== currentDigit) {
        this.animateDigit(digitContainer, targetDigit, delays[digitIndex]);
        digitContainer.currentDigit = targetDigit;
      }
      digitIndex++;
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

    const animation = anime({
      targets: column,
      translateY: targetY,
      duration: this.config.spinSpeed,
      delay: delay,
      easing: 'easeOutElastic(1, .6)',
      complete: () => {
        // Remove from active animations when complete
        const index = this.activeAnimations.indexOf(animation);
        if (index > -1) {
          this.activeAnimations.splice(index, 1);
        }
      }
    });

    // Track animation for cancellation
    this.activeAnimations.push(animation);
  }

  /**
   * Animate dollar sign
   */
  animateDollarSign() {
    if (!this.dollarContainer) return;

    // Spin effect
    const animation = anime({
      targets: this.dollarContainer,
      rotateY: [0, 360],
      duration: this.config.spinSpeed * 0.7,
      easing: 'easeOutCubic',
      complete: () => {
        // Remove from active animations when complete
        const index = this.activeAnimations.indexOf(animation);
        if (index > -1) {
          this.activeAnimations.splice(index, 1);
        }
      }
    });

    // Track animation for cancellation
    this.activeAnimations.push(animation);
  }

  /**
   * Cancel all active animations
   */
  cancelAllAnimations() {
    if (this.activeAnimations.length === 0) return;

    // Remove all animations using anime.js remove method
    this.activeAnimations.forEach(animation => {
      if (animation && animation.pause) {
        animation.pause();
      }
    });

    // Clear animation array
    this.activeAnimations = [];
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
