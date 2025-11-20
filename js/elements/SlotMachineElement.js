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
        easing: config.easing || 'easeOutExpo',
        dollarSpins: config.dollarSpins !== undefined ? config.dollarSpins : false,
        fontSize: config.fontSize || 48,
        color: config.color || '#FFFFFF',
        digitHeight: config.digitHeight || 60,
        maxDigits: config.maxDigits || 5, // Fixed number of digit positions
        ...config.config
      }
    });

    this.currentValue = 0;
    this.digitContainers = [];
    this.dollarContainer = null;
    this.activeAnimations = []; // Track active animations for cancellation
    this.initialized = false; // Track if fixed digits have been created
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'slot-machine-element flex items-start justify-end';
    container.style.fontSize = toResponsiveUnit(this.config.fontSize);
    container.style.color = this.config.color;
    container.style.fontWeight = '250';

    return container;
  }

  /**
   * Create fixed digit columns (called once)
   * Creates maxDigits positions with commas at fixed intervals
   */
  createFixedDigits() {
    if (!this.container || this.initialized) return;

    // Cancel all active animations before setup
    this.cancelAllAnimations();

    // Clear existing digits
    this.container.innerHTML = '';
    this.digitContainers = [];

    // Create fixed number of digit positions (left to right in DOM)
    // Position 0 is leftmost (ten-thousands), position 4 is rightmost (ones)
    for (let position = 0; position < this.config.maxDigits; position++) {
      const digitWrapper = document.createElement('div');
      digitWrapper.className = 'slot-digit-wrapper';
      digitWrapper.style.cssText = `
        overflow: hidden;
        height: ${this.config.digitHeight}px;
        display: inline-block;
        position: relative;
        vertical-align: middle;
      `;

      const digitColumn = document.createElement('div');
      digitColumn.className = 'slot-digit-column';
      digitColumn.style.cssText = `
        display: flex;
        flex-direction: column;
        position: relative;
        transition: none;
      `;

      // Add blank space at the top (position 0)
      const blankSpan = document.createElement('span');
      blankSpan.textContent = '';
      blankSpan.style.cssText = `
        height: ${this.config.digitHeight}px;
        line-height: ${this.config.digitHeight}px;
        display: block;
        text-align: center;
      `;
      digitColumn.appendChild(blankSpan);

      // Create all digits 0-9 (positions 1-10)
      for (let digit = 0; digit <= 9; digit++) {
        const digitSpan = document.createElement('span');
        digitSpan.textContent = digit;
        digitSpan.style.cssText = `
          height: ${this.config.digitHeight}px;
          line-height: ${this.config.digitHeight}px;
          display: block;
          text-align: center;
          overflow: hidden;
        `;
        digitColumn.appendChild(digitSpan);
      }

      digitWrapper.appendChild(digitColumn);
      this.container.appendChild(digitWrapper);

      // Store container with position index (0 = leftmost)
      this.digitContainers.push({
        wrapper: digitWrapper,
        column: digitColumn,
        position: position,
        currentDigit: null // null means showing blank
      });

      // Set initial position to blank (position 0)
      digitColumn.style.transform = `translateY(0px)`;
    }

    this.initialized = true;
  }

  /**
   * Animate to new value using fixed digit positions
   */
  animateToValue(newValue) {
    // Calculate delays for all positions
    const delays = this.calculateDelays(this.config.maxDigits);

    // Get the actual number string WITHOUT padding to get real digits (floor to remove decimals)
    const wholeNumber = Math.abs(Math.floor(newValue));
    const actualNumberStr = wholeNumber.toString();
    const actualNumberLength = actualNumberStr.length;
    const numLeadingBlanks = this.config.maxDigits - actualNumberLength;

    // Animate each fixed position
    for (let i = 0; i < this.config.maxDigits; i++) {
      const digitContainer = this.digitContainers[i];

      // Determine if this position should show a digit or blank
      const isLeadingPosition = i < numLeadingBlanks;

      let displayDigit;
      if (isLeadingPosition) {
        // Leading position: always show blank
        displayDigit = null;
      } else {
        // Non-leading position: show digit from actual number
        // Map display position to actual number position
        const digitIndex = i - numLeadingBlanks;
        displayDigit = parseInt(actualNumberStr[digitIndex]);
      }

      // Check if value changed (handle null comparison properly)
      const hasChanged = displayDigit !== digitContainer.currentDigit;

      if (hasChanged) {
        // Pass true for startFromBlank if currently showing blank (null)
        this.animateDigit(digitContainer, displayDigit, delays[i], digitContainer.currentDigit === null);
        digitContainer.currentDigit = displayDigit;
      }
    }

    this.currentValue = wholeNumber;
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
   * @param {Object} digitContainer - Container object with column reference
   * @param {number|null} targetDigit - Target digit (0-9) or null for blank
   * @param {number} delay - Animation delay in ms
   * @param {boolean} startFromBlank - Whether currently showing blank
   */
  animateDigit(digitContainer, targetDigit, delay, startFromBlank = false) {
    const column = digitContainer.column;

    // Calculate target Y position
    // Position 0 = blank space at top
    // Positions 1-10 = digits 0-9
    const targetY = targetDigit === null
      ? 0  // Show blank
      : -(targetDigit + 1) * this.config.digitHeight;  // Show digit

    // If starting from blank, ensure we're at position 0
    if (startFromBlank) {
      column.style.transform = `translateY(0px)`;
    }

    const animation = anime({
      targets: column,
      translateY: targetY,
      duration: this.config.spinSpeed,
      delay: delay,
      easing: this.config.easing,
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

    // First time: create fixed digit structure
    if (!this.initialized) {
      this.createFixedDigits();
      this.setValue(newValue);
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

    // Recreate fixed digits if digit height or maxDigits changed
    if ((newConfig.digitHeight && newConfig.digitHeight !== this.config.digitHeight) ||
        (newConfig.maxDigits && newConfig.maxDigits !== this.config.maxDigits)) {
      this.initialized = false;
      this.createFixedDigits();
      this.setValue(this.currentValue);
    }
  }

  /**
   * Set value instantly without animation
   */
  setValue(value) {
    this.currentValue = value;

    if (!this.initialized) {
      this.createFixedDigits();
    }

    // Get the actual number string WITHOUT padding
    const actualNumberStr = Math.abs(Math.floor(value)).toString();
    const actualNumberLength = actualNumberStr.length;
    const numLeadingBlanks = this.config.maxDigits - actualNumberLength;

    for (let i = 0; i < this.config.maxDigits; i++) {
      const digitContainer = this.digitContainers[i];

      // Determine if this position should show a digit or blank
      const isLeadingPosition = i < numLeadingBlanks;

      let displayDigit;
      if (isLeadingPosition) {
        // Leading position: always show blank
        displayDigit = null;
      } else {
        // Non-leading position: show digit from actual number
        const digitIndex = i - numLeadingBlanks;
        displayDigit = parseInt(actualNumberStr[digitIndex]);
      }

      digitContainer.currentDigit = displayDigit;

      // Set position directly without animation
      const targetY = displayDigit === null
        ? 0  // Show blank space
        : -(displayDigit + 1) * this.config.digitHeight;  // Show digit (offset by 1 for blank at top)

      digitContainer.column.style.transform = `translateY(${targetY}px)`;
    }
  }
}
