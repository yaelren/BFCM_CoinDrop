/**
 * BaseElement - Base class for all positioned dashboard elements
 * Provides common positioning, visibility, and styling functionality
 */
export class BaseElement {
  constructor(id, config) {
    this.id = id;
    this.config = {
      type: config.type,
      x: config.x || 0,
      y: config.y || 0,
      width: config.width || 100,
      height: config.height || 100,
      visible: config.visible !== undefined ? config.visible : true,
      background: config.background || { color: '#000000', opacity: 0 },
      zIndex: config.zIndex || 1,
      ...config.config // Element-specific configuration
    };

    this.container = null;
    this.isInitialized = false;
  }

  /**
   * Create the DOM element for this component
   * Override in subclasses
   */
  createElement() {
    throw new Error('createElement() must be implemented by subclass');
  }

  /**
   * Initialize the element and append to parent
   */
  init(parentElement) {
    if (this.isInitialized) return;

    this.container = this.createElement();
    this.container.id = this.id;
    this.container.classList.add('dashboard-element');
    this.container.style.position = 'absolute';
    this.container.style.overflow = 'hidden';

    this.updateStyles();
    parentElement.appendChild(this.container);

    this.isInitialized = true;
    this.onInit();
  }

  /**
   * Called after initialization
   * Override in subclasses for post-init setup
   */
  onInit() {
    // Override in subclasses
  }

  /**
   * Update element position and size
   * Called by LayoutManager with actual pixel values
   */
  updatePosition(x, y, width, height) {
    if (!this.container) return;

    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
  }

  /**
   * Update element styles (background, visibility, z-index)
   */
  updateStyles() {
    if (!this.container) return;

    this.container.style.visibility = this.config.visible ? 'visible' : 'hidden';
    this.container.style.zIndex = this.config.zIndex;

    if (this.config.background) {
      const { color, opacity } = this.config.background;
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      this.container.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }

  /**
   * Update element data
   * Override in subclasses
   */
  updateData(data) {
    // Override in subclasses
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.updateStyles();
  }

  /**
   * Destroy element and cleanup
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.isInitialized = false;
  }
}
