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

        // Projection configuration
        projection: config.projection || 'equirectangular', // 'equirectangular', 'mercator', 'calibrated'
        bounds: config.bounds || { minLat: -85, maxLat: 85, minLon: -180, maxLon: 180 },

        // Calibration points for precise alignment: [{name, lat, lon, x, y}]
        // Use 2+ known cities to auto-calibrate coordinate transformation
        calibrationPoints: config.calibrationPoints || null,

        // Location label configuration
        showLocationLabel: config.showLocationLabel !== undefined ? config.showLocationLabel : true,
        locationLabelDuration: config.locationLabelDuration || 5000, // How long to show location
        locationLabelFontSize: config.locationLabelFontSize || 32,
        locationLabelColor: config.locationLabelColor || '#333333',
        locationLabelPosition: config.locationLabelPosition || 'bottom', // 'bottom' or 'top'
        locationLabelOffset: config.locationLabelOffset || 10, // Distance from edge

        ...config.config
      }
    });

    this.p5Instance = null;
    this.dots = []; // Array of {x, y, alpha, timestamp, location}
    this.mapImg = null;
    this.locationLabel = null;
    this.currentLocation = null;
    this.locationLabelTimeout = null;

    // Calibration transformation parameters (calculated from calibration points)
    this.calibration = null;
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'map-element';
    container.style.position = 'relative';

    // Create location label if enabled
    if (this.config.showLocationLabel) {
      this.locationLabel = document.createElement('div');
      this.locationLabel.className = 'map-location-label';
      this.updateLocationLabelStyle();
      container.appendChild(this.locationLabel);
    }

    return container;
  }

  onInit() {
    this.calculateCalibration();
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
   * Calculate calibration parameters from calibration points
   * Note: Calibration points are from the full-size image and need to be scaled to container
   */
  calculateCalibration() {
    if (!this.config.calibrationPoints || this.config.calibrationPoints.length < 2) {
      return;
    }

    const points = this.config.calibrationPoints;
    const p1 = points[0];
    const p2 = points[1];

    // Calculate linear transformation parameters (these are in image space)
    const lonScale = (p2.x - p1.x) / (p2.lon - p1.lon);
    const latScale = (p2.y - p1.y) / (p2.lat - p1.lat);
    const lonOffset = p1.x - p1.lon * lonScale;
    const latOffset = p1.y - p1.lat * latScale;

    // Store the calibration in image space
    // Will be scaled to container in latLongToCalibratedXY
    this.calibration = {
      lonScale,
      latScale,
      lonOffset,
      latOffset,
      // Actual map image dimensions (1920x1488)
      imageWidth: 1920,
      imageHeight: 1488
    };
  }

  /**
   * Convert lat/long to x/y coordinates on the map
   * Uses configured projection method for accurate positioning
   */
  latLongToXY(lat, lon) {
    if (!this.container) return { x: 0, y: 0 };

    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;

    // Use calibration if available
    if (this.config.projection === 'calibrated' && this.calibration) {
      return this.latLongToCalibratedXY(lat, lon);
    }

    // Use specified projection
    switch (this.config.projection) {
      case 'mercator':
        return this.latLongToMercatorXY(lat, lon, width, height);
      case 'equirectangular':
      default:
        return this.latLongToEquirectangularXY(lat, lon, width, height);
    }
  }

  /**
   * Equirectangular projection (simple linear mapping)
   * Best for most world maps - simple and accurate for standard map images
   */
  latLongToEquirectangularXY(lat, lon, width, height) {
    const { minLat, maxLat, minLon, maxLon } = this.config.bounds;

    const x = ((lon - minLon) / (maxLon - minLon)) * width;
    const y = ((maxLat - lat) / (maxLat - minLat)) * height;

    return { x, y };
  }

  /**
   * Mercator projection
   * Better for navigation maps but requires correct bounds
   */
  latLongToMercatorXY(lat, lon, width, height) {
    const { minLon, maxLon } = this.config.bounds;

    const x = ((lon - minLon) / (maxLon - minLon)) * width;

    const latRad = lat * Math.PI / 180;
    const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
    const y = (height / 2) - (width * mercN / (2 * Math.PI));

    return { x, y };
  }

  /**
   * Calibration-based projection
   * Uses calibration points for perfect accuracy with any map
   * Scales from image coordinates to container coordinates
   */
  latLongToCalibratedXY(lat, lon) {
    if (!this.calibration) {
      return this.latLongToEquirectangularXY(lat, lon, this.container.offsetWidth, this.container.offsetHeight);
    }

    // Calculate position in image space
    const imageX = lon * this.calibration.lonScale + this.calibration.lonOffset;
    const imageY = lat * this.calibration.latScale + this.calibration.latOffset;

    // Scale from image space to container space
    const containerWidth = this.container.offsetWidth;
    const containerHeight = this.container.offsetHeight;

    const scaleX = containerWidth / this.calibration.imageWidth;
    const scaleY = containerHeight / this.calibration.imageHeight;

    const x = imageX * scaleX;
    const y = imageY * scaleY;

    return { x, y };
  }

  /**
   * Add a new dot at the given lat/long coordinates with optional location metadata
   */
  addDot(lat, lon, locationData = null) {
    const { x, y } = this.latLongToXY(lat, lon);

    const dot = {
      x,
      y,
      alpha: 255,
      timestamp: Date.now(),
      location: locationData || { lat, lon }
    };

    this.dots.push(dot);

    // Update location label if enabled
    if (locationData && this.config.showLocationLabel) {
      this.updateLocationLabel(locationData);
    }
  }

  /**
   * Update location label styling based on config and container size
   */
  updateLocationLabelStyle() {
    if (!this.locationLabel) return;

    // Calculate responsive font size based on container width
    const containerWidth = this.container ? this.container.offsetWidth : 713;
    const scaleFactor = containerWidth / 713; // 713 is reference width from config
    const responsiveFontSize = Math.round(this.config.locationLabelFontSize * scaleFactor);

    const position = this.config.locationLabelPosition === 'top' ? 'top' : 'bottom';
    const offset = this.config.locationLabelOffset;

    this.locationLabel.style.cssText = `
      position: absolute;
      ${position}: ${offset}px;
      left: 50%;
      transform: translateX(-50%);
      padding: 0;
      background: transparent;
      color: ${this.config.locationLabelColor};
      font-size: ${responsiveFontSize}px;
      font-weight: 400;
      font-family: inherit;
      opacity: ${this.locationLabel.style.opacity || '0'};
      transition: opacity 0.3s ease;
      pointer-events: none;
      white-space: nowrap;
      z-index: 10;
    `;
  }

  /**
   * Update the location label with new location data
   */
  updateLocationLabel(locationData) {
    if (!this.locationLabel) return;

    // Format location string
    let locationText = '';
    if (locationData.city && locationData.country) {
      if (locationData.state) {
        locationText = `${locationData.city}, ${locationData.state}, ${locationData.country}`;
      } else {
        locationText = `${locationData.city}, ${locationData.country}`;
      }
    } else if (locationData.country) {
      locationText = locationData.country;
    } else if (locationData.displayName) {
      locationText = locationData.displayName;
    } else {
      locationText = `${locationData.lat.toFixed(2)}°, ${locationData.lon.toFixed(2)}°`;
    }

    this.locationLabel.textContent = locationText;
    this.locationLabel.style.opacity = '1';

    // Clear previous timeout
    if (this.locationLabelTimeout) {
      clearTimeout(this.locationLabelTimeout);
    }

    // Auto-hide after duration
    if (this.config.locationLabelDuration > 0) {
      this.locationLabelTimeout = setTimeout(() => {
        this.locationLabel.style.opacity = '0';
      }, this.config.locationLabelDuration);
    }
  }

  /**
   * Update data - expects {lat, lon, city?, state?, country?} or array of such objects
   */
  updateData(data) {
    if (Array.isArray(data)) {
      data.forEach(location => {
        if (location.lat !== undefined && location.lon !== undefined) {
          this.addDot(location.lat, location.lon, location);
        }
      });
    } else if (data.lat !== undefined && data.lon !== undefined) {
      this.addDot(data.lat, data.lon, data);
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

    // Update label styling if config changed
    this.updateLocationLabelStyle();
  }

  /**
   * Update position - called when container size changes
   */
  updatePosition(x, y, width, height) {
    super.updatePosition(x, y, width, height);

    // Recalculate responsive label styling
    this.updateLocationLabelStyle();
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
