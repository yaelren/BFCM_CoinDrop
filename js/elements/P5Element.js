import { BaseElement } from '../core/BaseElement.js';

/**
 * P5Element - Wrapper for P5.js instance mode sketches
 * Used for Plinko game and any other P5-based visualizations
 */
export class P5Element extends BaseElement {
  constructor(id, config) {
    super(id, {
      ...config,
      type: 'p5',
      config: {
        sketchFunction: config.sketchFunction || null,
        ...config.config
      }
    });

    this.p5Instance = null;
    this.sketch = null;  // Store sketch methods (like dropCoins)
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'p5-element';
    return container;
  }

  onInit() {
    if (this.config.sketchFunction) {
      this.initP5Sketch(this.config.sketchFunction);
    }
  }

  /**
   * Initialize P5.js sketch with custom sketch function
   */
  initP5Sketch(sketchFunction) {
    const wrappedSketch = (p) => {
      // Pass container reference and config to sketch function
      const sketch = sketchFunction(p, this.container, this.config);
      
      // Store sketch for external access (e.g., dropCoins method)
      this.sketch = sketch;

      // Assign preload if exists
      if (sketch.preload) {
        p.preload = sketch.preload;
      }

      // Assign setup
      p.setup = () => {
        if (sketch.setup) {
          sketch.setup();
        }
        // Move canvas into container after setup
        if (p.canvas && p.canvas.parentElement !== this.container) {
          this.container.appendChild(p.canvas);
        }
      };

      // Assign draw
      if (sketch.draw) {
        p.draw = sketch.draw;
      }

      // Assign windowResized
      if (sketch.windowResized) {
        p.windowResized = sketch.windowResized;
      } else {
        p.windowResized = () => {
          if (this.container) {
            p.resizeCanvas(this.container.offsetWidth, this.container.offsetHeight);
          }
        };
      }
    };

    this.p5Instance = new p5(wrappedSketch);
  }

  /**
   * Update position and resize P5 canvas
   */
  updatePosition(x, y, width, height) {
    super.updatePosition(x, y, width, height);

    // Trigger resize after position update
    if (this.p5Instance && this.p5Instance.windowResized) {
      setTimeout(() => {
        this.p5Instance.windowResized();
      }, 10);
    }
  }

  /**
   * Update configuration and trigger regeneration
   */
  updateConfig(newConfig) {
    super.updateConfig(newConfig);

    // Trigger regeneration when config changes
    if (this.p5Instance && this.p5Instance.windowResized) {
      setTimeout(() => {
        this.p5Instance.windowResized();
      }, 10);
    }
  }

  /**
   * Get P5 instance for external access
   */
  getP5Instance() {
    return this.p5Instance;
  }

  /**
   * Get sketch object with custom methods (e.g., dropCoins)
   */
  getSketch() {
    return this.sketch;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.p5Instance) {
      this.p5Instance.remove();
      this.p5Instance = null;
    }
    super.destroy();
  }
}
