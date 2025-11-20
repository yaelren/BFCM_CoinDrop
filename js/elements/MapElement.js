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
        dotColor: config.dotColor || '#FF0080', // Legacy - backward compatibility
        dotFillColor: config.dotFillColor || config.dotColor || '#FF0080',
        dotStrokeColor: config.dotStrokeColor || config.dotColor || '#FF0080',
        dotStrokeWeight: config.dotStrokeWeight || 2,
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

    // Calibration mode state
    this.calibrationMode = false;
    this.calibrationPoints = [];
    this.calibrationCities = [
      { name: 'New York', lat: 40.7128, lon: -74.0060, region: 'USA' },
      { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, region: 'USA' },
      { name: 'Chicago', lat: 41.8781, lon: -87.6298, region: 'USA' },
      { name: 'London', lat: 51.5074, lon: -0.1278, region: 'Europe' },
      { name: 'Paris', lat: 48.8566, lon: 2.3522, region: 'Europe' },
      { name: 'Rome', lat: 41.9028, lon: 12.4964, region: 'Europe' },
      { name: 'Berlin', lat: 52.5200, lon: 13.4050, region: 'Europe' },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503, region: 'Asia' },
      { name: 'Sydney', lat: -33.8688, lon: 151.2093, region: 'Australia' },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777, region: 'Asia' },
      { name: 'São Paulo', lat: -23.5505, lon: -46.6333, region: 'S.America' },
      { name: 'Cairo', lat: 30.0444, lon: 31.2357, region: 'Africa' }
    ];
    this.selectedCalibrationCity = null;
    this.calibrationMarkers = [];
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
        }

        // Draw calibration markers if in calibration mode
        if (this.calibrationMode) {
          this.calibrationMarkers.forEach(marker => {
            // Convert relative position to current canvas size
            const markerX = marker.x * p.width;
            const markerY = marker.y * p.height;

            // Draw red crosshair marker
            p.stroke(255, 0, 80);
            p.strokeWeight(3);
            p.noFill();
            p.ellipse(markerX, markerY, 20, 20);

            // Draw crosshair lines
            p.line(markerX - 15, markerY, markerX + 15, markerY);
            p.line(markerX, markerY - 15, markerX, markerY + 15);

            // Draw label
            p.noStroke();
            p.fill(0, 0, 0, 180);
            p.rect(markerX - 40, markerY - 30, 80, 16);
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(10);
            p.text(marker.name, markerX, markerY - 22);
          });

          // Show instruction if city is selected
          if (this.selectedCalibrationCity) {
            p.fill(255, 0, 80, 200);
            p.noStroke();
            p.rect(10, 10, p.width - 20, 40);
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
            p.text(`Click on the map where ${this.selectedCalibrationCity.name} is located`, p.width / 2, 30);
          }
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

          // Parse fill color
          const fillHex = this.config.dotFillColor.replace('#', '');
          const fillR = parseInt(fillHex.substr(0, 2), 16);
          const fillG = parseInt(fillHex.substr(2, 2), 16);
          const fillB = parseInt(fillHex.substr(4, 2), 16);

          // Parse stroke color
          const strokeHex = this.config.dotStrokeColor.replace('#', '');
          const strokeR = parseInt(strokeHex.substr(0, 2), 16);
          const strokeG = parseInt(strokeHex.substr(2, 2), 16);
          const strokeB = parseInt(strokeHex.substr(4, 2), 16);

          // Responsive dot size
          const scaleFactor = this.getScaleFactor();
          const responsiveDotSize = this.config.dotSize * scaleFactor;

          // Pulse effect
          const pulseSize = responsiveDotSize + Math.sin(currentTime * 0.005 + dot.timestamp * 0.01) * 2 * scaleFactor;

          // Draw filled dot with stroke
          p.fill(fillR, fillG, fillB, dot.alpha);
          p.stroke(strokeR, strokeG, strokeB, dot.alpha);
          p.strokeWeight(this.config.dotStrokeWeight * scaleFactor);
          p.ellipse(dot.x, dot.y, pulseSize, pulseSize);

          // Outer ring (using stroke color)
          p.noFill();
          p.stroke(strokeR, strokeG, strokeB, dot.alpha * 0.5);
          p.strokeWeight(2 * scaleFactor);
          p.ellipse(dot.x, dot.y, pulseSize * 1.5, pulseSize * 1.5);
        }
      };

      p.windowResized = () => {
        if (this.container) {
          p.resizeCanvas(this.container.offsetWidth, this.container.offsetHeight);
        }
      };

      // Mouse click handler for calibration mode
      p.mousePressed = () => {
        if (!this.calibrationMode || !this.selectedCalibrationCity) return;

        // Check if click is within canvas bounds
        if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;

        // Calculate RELATIVE position (0-1 range) - resolution independent!
        const relativeX = p.mouseX / p.width;
        const relativeY = p.mouseY / p.height;

        // Remove existing point for this city if it exists
        const existingIndex = this.calibrationPoints.findIndex(pt => pt.name === this.selectedCalibrationCity.name);
        if (existingIndex !== -1) {
          this.calibrationPoints.splice(existingIndex, 1);
          // Also remove the marker
          const markerIndex = this.calibrationMarkers.findIndex(m => m.name === this.selectedCalibrationCity.name);
          if (markerIndex !== -1) {
            this.calibrationMarkers.splice(markerIndex, 1);
          }
        }

        // Add new calibration point with RELATIVE coordinates
        const point = {
          name: this.selectedCalibrationCity.name,
          lat: this.selectedCalibrationCity.lat,
          lon: this.selectedCalibrationCity.lon,
          x: Math.round(relativeX * 10000) / 10000,  // 4 decimal precision
          y: Math.round(relativeY * 10000) / 10000
        };
        this.calibrationPoints.push(point);

        // Store marker position for visual feedback (also relative for resize)
        this.calibrationMarkers.push({
          name: point.name,
          x: relativeX,
          y: relativeY
        });

        console.log(`✓ Calibrated ${point.name} at relative coords (${point.x}, ${point.y})`);
        console.log(`  Total calibration points: ${this.calibrationPoints.length}`);

        // Auto-deselect city
        this.selectedCalibrationCity = null;

        // Generate config if we have 2+ points
        if (this.calibrationPoints.length >= 2) {
          this.generateCalibrationConfig();
        }
      };
    };

    this.p5Instance = new p5(mapSketch);
  }

  /**
   * Calculate calibration parameters from calibration points
   * Now uses RELATIVE coordinates (0-1) for resolution independence
   */
  calculateCalibration() {
    if (!this.config.calibrationPoints || this.config.calibrationPoints.length < 2) {
      return;
    }

    const points = this.config.calibrationPoints;
    const p1 = points[0];
    const p2 = points[1];

    // Calculate linear transformation parameters using RELATIVE coordinates
    // x and y are now in 0-1 range, so they work at any resolution
    const lonScale = (p2.x - p1.x) / (p2.lon - p1.lon);
    const latScale = (p2.y - p1.y) / (p2.lat - p1.lat);
    const lonOffset = p1.x - p1.lon * lonScale;
    const latOffset = p1.y - p1.lat * latScale;

    // Store the calibration with relative coordinates
    this.calibration = {
      lonScale,
      latScale,
      lonOffset,
      latOffset
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
   * Uses calibration points with RELATIVE coordinates (0-1)
   * Works at any resolution without needing image dimensions
   */
  latLongToCalibratedXY(lat, lon) {
    if (!this.calibration) {
      return this.latLongToEquirectangularXY(lat, lon, this.container.offsetWidth, this.container.offsetHeight);
    }

    // Calculate RELATIVE position (0-1 range)
    const relativeX = lon * this.calibration.lonScale + this.calibration.lonOffset;
    const relativeY = lat * this.calibration.latScale + this.calibration.latOffset;

    // Scale to current container size
    const containerWidth = this.container.offsetWidth;
    const containerHeight = this.container.offsetHeight;

    const x = relativeX * containerWidth;
    const y = relativeY * containerHeight;

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
   * Get responsive scale factor based on container size
   */
  getScaleFactor() {
    const containerWidth = this.container ? this.container.offsetWidth : 713;
    return containerWidth / 713; // 713 is reference width from config
  }

  /**
   * Update location label styling based on config and container size
   */
  updateLocationLabelStyle() {
    if (!this.locationLabel) return;

    const scaleFactor = this.getScaleFactor();
    const responsiveFontSize = Math.round(this.config.locationLabelFontSize * scaleFactor);
    const responsiveOffset = Math.round(this.config.locationLabelOffset * scaleFactor);

    const position = this.config.locationLabelPosition === 'top' ? 'top' : 'bottom';

    this.locationLabel.style.cssText = `
      position: absolute;
      ${position}: ${responsiveOffset}px;
      left: 50%;
      transform: translateX(-50%);
      padding: 0;
      background: transparent;
      color: ${this.config.locationLabelColor};
      font-size: ${responsiveFontSize}px;
      font-weight: 300;
      font-family: 'PPSupplyMono', monospace;
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
   * Enable/disable calibration mode
   */
  setCalibrationMode(enabled) {
    this.calibrationMode = enabled;

    if (enabled) {
      console.log('\n🗺️ MAP CALIBRATION MODE ENABLED');
      console.log('═══════════════════════════════════════════════════');
      console.log('1. Select a city from the GUI dropdown');
      console.log('2. Click on the map where that city is located');
      console.log('3. Repeat for at least 2 cities (more = better)');
      console.log('4. Copy the generated config from console');
      console.log('═══════════════════════════════════════════════════\n');
    } else {
      console.log('🗺️ Calibration mode disabled');
      this.resetCalibration();
    }
  }

  /**
   * Select a city for calibration
   */
  selectCalibrationCity(cityName) {
    this.selectedCalibrationCity = this.calibrationCities.find(c => c.name === cityName);
    if (this.selectedCalibrationCity) {
      console.log(`📍 Selected: ${cityName} - Click on the map where this city is located`);
    }
  }

  /**
   * Reset calibration points
   */
  resetCalibration() {
    this.calibrationPoints = [];
    this.calibrationMarkers = [];
    this.selectedCalibrationCity = null;
    console.log('🔄 Calibration points reset');
  }

  /**
   * Generate calibration config code
   */
  generateCalibrationConfig() {
    if (this.calibrationPoints.length < 2) {
      console.warn('⚠️ Need at least 2 calibration points');
      return;
    }

    const pointsCode = this.calibrationPoints.map(p =>
      `      { name: '${p.name}', lat: ${p.lat}, lon: ${p.lon}, x: ${p.x}, y: ${p.y} }`
    ).join(',\n');

    const config = `
╔═══════════════════════════════════════════════════════════════╗
║           GENERATED MAP CALIBRATION CONFIG                    ║
╠═══════════════════════════════════════════════════════════════╣

📋 Copy the calibrationPoints array below and paste it into
   led-dashboard.js → ELEMENT_CONFIGS → location → config

calibrationPoints: [
${pointsCode}
]

✅ Calibrated with ${this.calibrationPoints.length} cities
📍 Cities: ${this.calibrationPoints.map(p => p.name).join(', ')}

ℹ️  Coordinates are RELATIVE (0-1 range) - resolution independent!
   They will scale correctly when you resize the canvas.

═══════════════════════════════════════════════════════════════`;

    console.log(config);
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
