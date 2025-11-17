import { BaseElement } from '../core/BaseElement.js';

/**
 * MapElement - P5.js-based map visualization with animated dots
 * Shows order locations on a 2D map (3D globe optional for future)
 */
export class MapElement extends BaseElement {
  constructor(id, config) {
    super(id, {
      ...config,
      type: 'map',
      config: {
        mapImage: config.mapImage || null, // User will provide map image path
        dotSize: config.dotSize || 10,
        dotColor: config.dotColor || '#FF0080',
        dotFadeDuration: config.dotFadeDuration || 3000, // 0 = never fade
        mode3D: config.mode3D || false, // Future: 3D globe
        rotationSpeed: config.rotationSpeed || 0.5, // For 3D mode
        ...config.config
      }
    });

    this.p5Instance = null;
    this.dots = []; // Array of {x, y, alpha, timestamp}
    this.mapImg = null;
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'map-element';
    return container;
  }

  onInit() {
    this.initP5Sketch();
  }

  /**
   * Initialize P5.js sketch
   */
  initP5Sketch() {
    const mapSketch = (p) => {
      // Preload map image if provided
      p.preload = () => {
        if (this.config.mapImage) {
          this.mapImg = p.loadImage(this.config.mapImage);
        }
      };

      p.setup = () => {
        const canvas = p.createCanvas(this.container.offsetWidth, this.container.offsetHeight);
        canvas.parent(this.container);
      };

      p.draw = () => {
        p.clear();

        // Draw map image if available
        if (this.mapImg) {
          p.image(this.mapImg, 0, 0, p.width, p.height);
        } else {
          // Placeholder background
          p.background(20, 30, 50);
        }

        // Draw and update dots
        const currentTime = Date.now();
        for (let i = this.dots.length - 1; i >= 0; i--) {
          const dot = this.dots[i];

          // Calculate fade if duration is set
          if (this.config.dotFadeDuration > 0) {
            const elapsed = currentTime - dot.timestamp;
            if (elapsed > this.config.dotFadeDuration) {
              this.dots.splice(i, 1);
              continue;
            }
            dot.alpha = p.map(elapsed, 0, this.config.dotFadeDuration, 255, 0);
          }

          // Draw dot
          p.noStroke();
          const hex = this.config.dotColor.replace('#', '');
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          p.fill(r, g, b, dot.alpha);

          // Pulse effect
          const pulseSize = this.config.dotSize + Math.sin(currentTime * 0.005 + dot.timestamp * 0.01) * 2;
          p.ellipse(dot.x, dot.y, pulseSize, pulseSize);

          // Outer ring
          p.noFill();
          p.stroke(r, g, b, dot.alpha * 0.5);
          p.strokeWeight(2);
          p.ellipse(dot.x, dot.y, pulseSize * 1.5, pulseSize * 1.5);
        }
      };

      p.windowResized = () => {
        if (this.container) {
          p.resizeCanvas(this.container.offsetWidth, this.container.offsetHeight);
        }
      };
    };

    this.p5Instance = new p5(mapSketch);
  }

  /**
   * Convert lat/long to x/y coordinates on the map
   * Assumes map is Mercator projection covering full world (-180 to 180, -85 to 85)
   */
  latLongToXY(lat, lon) {
    if (!this.container) return { x: 0, y: 0 };

    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;

    // Mercator projection
    const x = (lon + 180) / 360 * width;
    const latRad = lat * Math.PI / 180;
    const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
    const y = (height / 2) - (width * mercN / (2 * Math.PI));

    return { x, y };
  }

  /**
   * Add a new dot at the given lat/long coordinates
   */
  addDot(lat, lon) {
    const { x, y } = this.latLongToXY(lat, lon);

    this.dots.push({
      x,
      y,
      alpha: 255,
      timestamp: Date.now()
    });
  }

  /**
   * Update data - expects {lat, lon} or array of {lat, lon}
   */
  updateData(data) {
    if (Array.isArray(data)) {
      data.forEach(location => {
        if (location.lat !== undefined && location.lon !== undefined) {
          this.addDot(location.lat, location.lon);
        }
      });
    } else if (data.lat !== undefined && data.lon !== undefined) {
      this.addDot(data.lat, data.lon);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    super.updateConfig(newConfig);

    // If map image changed, reload
    if (newConfig.mapImage && this.p5Instance) {
      this.mapImg = this.p5Instance.loadImage(newConfig.mapImage);
    }
  }

  /**
   * Clear all dots
   */
  clearDots() {
    this.dots = [];
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
