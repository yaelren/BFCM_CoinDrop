/**
/**
 * LayoutManager - Manages positioning and scaling of all dashboard elements
 * Coordinates reference resolution (4640x1760) to actual screen size
 */
import { toResponsiveUnit } from '../utils/ResponsiveScale.js';

export class LayoutManager {
  constructor(containerSelector, referenceWidth = 4640, referenceHeight = 1760) {
    this.container = document.querySelector(containerSelector);
    this.referenceWidth = referenceWidth;
    this.referenceHeight = referenceHeight;
    this.elements = new Map();
    this.positionGUI = null;
    this.controlsGUI = null;
    this.guiFolders = new Map();

    if (!this.container) {
      throw new Error(`Container "${containerSelector}" not found`);
    }

    // Bind resize handler
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Register an element with the layout manager
   */
  registerElement(element) {
    this.elements.set(element.id, element);
    element.init(this.container);
    this.updateElementPosition(element);
  }

  /**
   * Unregister an element
   */
  unregisterElement(elementId) {
    const element = this.elements.get(elementId);
    if (element) {
      element.destroy();
      this.elements.delete(elementId);
    }
  }

  /**
   * Get actual container dimensions
   */
  getContainerDimensions() {
    const rect = this.container.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * Convert reference coordinates to actual screen coordinates
   */
  convertCoordinates(refX, refY, refWidth, refHeight) {
    const container = this.getContainerDimensions();

    return {
      x: (refX / this.referenceWidth) * container.width,
      y: (refY / this.referenceHeight) * container.height,
      width: (refWidth / this.referenceWidth) * container.width,
      height: (refHeight / this.referenceHeight) * container.height
    };
  }

  /**
   * Update position of a single element
   */
  updateElementPosition(element) {
    const config = element.getConfig();
    const actual = this.convertCoordinates(
      config.x,
      config.y,
      config.width,
      config.height
    );

    element.updatePosition(actual.x, actual.y, actual.width, actual.height);
  }

  /**
   * Update positions of all elements
   */
  updateAllPositions() {
    this.elements.forEach(element => {
      this.updateElementPosition(element);
    });
  }

  /**
   * Handle window resize
   */
  handleResize() {
    this.updateAllPositions();
  }

  /**
   * Setup lil-gui controls for all elements
   */
  setupGUI(GUI, orderProcessor = null) {
    // Clean up existing GUIs
    if (this.positionGUI) this.positionGUI.destroy();
    if (this.controlsGUI) this.controlsGUI.destroy();

    // Store reference for animation timing
    this.orderProcessor = orderProcessor;

    // GUI 1: Position Controls
    this.setupPositionGUI(GUI);

    // GUI 2: Element Controls
    this.setupControlsGUI(GUI);
  }

  /**
   * Setup Position/Layout GUI
   */
  setupPositionGUI(GUI) {
    this.positionGUI = new GUI({ title: '📐 Position Controls' });

    // Position GUI on the left side
    this.positionGUI.domElement.style.left = '10px';

    // Create folder for each element
    this.elements.forEach(element => {
      const config = element.getConfig();
      const folder = this.positionGUI.addFolder(element.id);

      // Position controls
      folder.add(config, 'x', 0, this.referenceWidth, 1)
        .name('X Position')
        .onChange(() => {
          element.updateConfig(config);
          this.updateElementPosition(element);
        });

      folder.add(config, 'y', 0, this.referenceHeight, 1)
        .name('Y Position')
        .onChange(() => {
          element.updateConfig(config);
          this.updateElementPosition(element);
        });

      folder.add(config, 'width', 10, this.referenceWidth, 1)
        .name('Width')
        .onChange(() => {
          element.updateConfig(config);
          this.updateElementPosition(element);
        });

      folder.add(config, 'height', 10, this.referenceHeight, 1)
        .name('Height')
        .onChange(() => {
          element.updateConfig(config);
          this.updateElementPosition(element);
        });

      folder.add(config, 'zIndex', 1, 20, 1)
        .name('Z-Index')
        .onChange(() => {
          element.updateConfig(config);
        });

      if (config.background) {
        folder.add(config.background, 'opacity', 0, 1, 0.05)
          .name('Background Opacity')
          .onChange(() => {
            element.updateConfig(config);
          });

        folder.addColor(config.background, 'color')
          .name('Background Color')
          .onChange(() => {
            element.updateConfig(config);
          });
      }
    });

    // Global controls
    this.positionGUI.add({ logPositions: () => this.logAllPositions() }, 'logPositions')
      .name('📋 Log All Positions');

    this.positionGUI.add({ debugMode: false }, 'debugMode')
      .name('🐛 Debug Mode')
      .onChange((value) => this.toggleDebugMode(value));
  }

  /**
   * Setup Element Controls GUI
   */
  setupControlsGUI(GUI) {
    this.controlsGUI = new GUI({ title: '🎨 Element Controls' });

    // Position GUI on the right side
    this.controlsGUI.domElement.style.left = 'auto';
    this.controlsGUI.domElement.style.right = '10px';

    // Animation Timing Controls (if order processor provided)
    if (this.orderProcessor) {
      const timingFolder = this.controlsGUI.addFolder('⏱️ Animation Timing');
      const processorConfig = this.orderProcessor.getConfig();

      timingFolder.add(processorConfig, 'minDisplayTime', 1000, 10000, 100)
        .name('Time Between Orders (ms)')
        .onChange(() => this.orderProcessor.updateConfig(processorConfig));

      timingFolder.add(processorConfig, 'saleToPlinkDelay', 0, 2000, 50)
        .name('Sale → Plinko Delay (ms)')
        .onChange(() => this.orderProcessor.updateConfig(processorConfig));

      timingFolder.add(processorConfig, 'plinkoToCountersDelay', 0, 2000, 50)
        .name('Plinko → Counters Delay (ms)')
        .onChange(() => this.orderProcessor.updateConfig(processorConfig));

      timingFolder.open();
    }

    // Create folder for each element
    this.elements.forEach(element => {
      const config = element.getConfig();
      const folder = this.controlsGUI.addFolder(element.id);
      this.guiFolders.set(element.id, folder);

      // Element-specific controls
      this.addElementSpecificControls(folder, element, config);
    });

    // Global controls
    this.controlsGUI.add({ logAllConfigs: () => this.logAllConfigs() }, 'logAllConfigs')
      .name('📋 Log All Configs');
  }

  /**
   * Add element-specific GUI controls
   * Override this or extend per element type
   */
  addElementSpecificControls(folder, element, config) {
    const type = config.type;

    switch (type) {
      case 'ticker':
        if (config.fontSize !== undefined) {
          folder.add(config, 'fontSize', 12, 200, 1)
            .name('Font Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.color) {
          folder.addColor(config, 'color')
            .name('Text Color')
            .onChange(() => element.updateConfig(config));
        }
        if (config.scrollSpeed !== undefined) {
          folder.add(config, 'scrollSpeed', 1, 200, 1)
            .name('Scroll Speed')
            .onChange(() => element.updateConfig(config));
        }
        if (config.maxQueue !== undefined) {
          folder.add(config, 'maxQueue', 5, 100, 1)
            .name('Max Queue Size')
            .onChange(() => element.updateConfig(config));
        }
        break;

      case 'counter':
        if (config.fontSize !== undefined) {
          folder.add(config, 'fontSize', 12, 200, 1)
            .name('Font Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.color) {
          folder.addColor(config, 'color')
            .name('Text Color')
            .onChange(() => element.updateConfig(config));
        }
        if (config.lerpSpeed !== undefined) {
          folder.add(config, 'lerpSpeed', 0.1, 5, 0.1)
            .name('Animation Speed')
            .onChange(() => element.updateConfig(config));
        }
        break;

      case 'text':
        if (config.fontSize !== undefined) {
          folder.add(config, 'fontSize', 12, 200, 1)
            .name('Font Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.color) {
          folder.addColor(config, 'color')
            .name('Text Color')
            .onChange(() => element.updateConfig(config));
        }
        if (config.lerpSpeed !== undefined) {
          folder.add(config, 'lerpSpeed', 0.1, 5, 0.1)
            .name('Animation Speed')
            .onChange(() => element.updateConfig(config));
        }
        break;

      case 'slotMachine':
        if (config.fontSize !== undefined) {
          folder.add(config, 'fontSize', 12, 200, 1)
            .name('Font Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.color) {
          folder.addColor(config, 'color')
            .name('Text Color')
            .onChange(() => element.updateConfig(config));
        }
        if (config.animationStyle !== undefined) {
          folder.add(config, 'animationStyle', { 'All Together': 1, 'Sequential': 2, 'Random': 3 })
            .name('Animation Style')
            .onChange(() => element.updateConfig(config));
        }
        if (config.spinSpeed !== undefined) {
          folder.add(config, 'spinSpeed', 200, 3000, 50)
            .name('Spin Duration (ms)')
            .onChange(() => element.updateConfig(config));
        }
        if (config.digitDelay !== undefined) {
          folder.add(config, 'digitDelay', 0, 500, 10)
            .name('Delay Between Digits (ms)')
            .onChange(() => element.updateConfig(config));
        }
        if (config.easing !== undefined) {
          folder.add(config, 'easing', {
            'Linear': 'linear',
            'Ease Out Expo': 'easeOutExpo',
            'Ease Out Cubic': 'easeOutCubic',
            'Ease Out Quad': 'easeOutQuad',
            'Ease Out Quart': 'easeOutQuart',
            'Ease Out Quint': 'easeOutQuint',
            'Ease Out Sine': 'easeOutSine',
            'Ease Out Back': 'easeOutBack',
            'Ease Out Elastic': 'easeOutElastic(1, .6)',
            'Ease Out Bounce': 'easeOutBounce',
            'Ease In Out Expo': 'easeInOutExpo',
            'Ease In Out Cubic': 'easeInOutCubic'
          })
            .name('Easing')
            .onChange(() => element.updateConfig(config));
        }
        if (config.dollarSpins !== undefined) {
          folder.add(config, 'dollarSpins')
            .name('$ Symbol Spins')
            .onChange(() => element.updateConfig(config));
        }
        break;

      case 'map':
        if (config.dotSize !== undefined) {
          folder.add(config, 'dotSize', 5, 50, 1)
            .name('Dot Size')
            .onChange(() => element.updateConfig(config));
        }
        
        // Dot Colors
        if (config.dotFillColor) {
          folder.addColor(config, 'dotFillColor')
            .name('Dot Fill Color')
            .onChange(() => element.updateConfig(config));
        }
        if (config.dotStrokeColor) {
          folder.addColor(config, 'dotStrokeColor')
            .name('Dot Stroke Color')
            .onChange(() => element.updateConfig(config));
        }
        if (config.dotStrokeWeight !== undefined) {
          folder.add(config, 'dotStrokeWeight', 0, 10, 0.5)
            .name('Dot Stroke Weight')
            .onChange(() => element.updateConfig(config));
        }
        
        // Legacy dotColor support (hidden, for backward compatibility)
        if (config.dotColor && !config.dotFillColor && !config.dotStrokeColor) {
          folder.addColor(config, 'dotColor')
            .name('Dot Color (Legacy)')
            .onChange(() => element.updateConfig(config));
        }
        
        if (config.dotFadeDuration !== undefined) {
          folder.add(config, 'dotFadeDuration', 0, 10000, 100)
            .name('Dot Fade (ms, 0=stay)')
            .onChange(() => element.updateConfig(config));
        }

        // Map Calibration Controls
        const calibrationFolder = folder.addFolder('🎯 Map Calibration');

        const calibrationState = {
          calibrationMode: false,
          selectedCity: 'Chicago'
        };

        calibrationFolder.add(calibrationState, 'calibrationMode')
          .name('Enable Calibration Mode')
          .onChange((enabled) => {
            element.setCalibrationMode(enabled);
          });

        // Create city selection dropdown with all available cities
        const cityChoices = {};
        element.calibrationCities.forEach(city => {
          cityChoices[`${city.name} (${city.region})`] = city.name;
        });

        calibrationFolder.add(calibrationState, 'selectedCity', cityChoices)
          .name('Select City to Calibrate')
          .onChange((cityName) => {
            element.selectCalibrationCity(cityName);
          });

        calibrationFolder.add({
          reset: () => element.resetCalibration()
        }, 'reset')
          .name('🔄 Reset All Points');

        calibrationFolder.add({
          generate: () => element.generateCalibrationConfig()
        }, 'generate')
          .name('📋 Generate Config');

        // Location Label Controls
        const labelFolder = folder.addFolder('Location Label');

        if (config.showLocationLabel !== undefined) {
          labelFolder.add(config, 'showLocationLabel')
            .name('Show Label')
            .onChange(() => element.updateConfig(config));
        }
        if (config.locationLabelFontSize !== undefined) {
          labelFolder.add(config, 'locationLabelFontSize', 12, 100, 1)
            .name('Font Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.locationLabelColor) {
          labelFolder.addColor(config, 'locationLabelColor')
            .name('Text Color')
            .onChange(() => element.updateConfig(config));
        }
        if (config.locationLabelPosition !== undefined) {
          labelFolder.add(config, 'locationLabelPosition', { Bottom: 'bottom', Top: 'top' })
            .name('Position')
            .onChange(() => element.updateConfig(config));
        }
        if (config.locationLabelOffset !== undefined) {
          labelFolder.add(config, 'locationLabelOffset', 0, 50, 1)
            .name('Offset (px)')
            .onChange(() => element.updateConfig(config));
        }
        if (config.locationLabelDuration !== undefined) {
          labelFolder.add(config, 'locationLabelDuration', 0, 10000, 100)
            .name('Duration (ms, 0=stay)')
            .onChange(() => element.updateConfig(config));
        }
        break;

      case 'p5':
        // Grid
        if (config.cols !== undefined) {
          folder.add(config, 'cols', 3, 20, 1)
            .name('Columns')
            .onChange(() => element.updateConfig(config));
        }
        if (config.rows !== undefined) {
          folder.add(config, 'rows', 3, 20, 1)
            .name('Rows')
            .onChange(() => element.updateConfig(config));
        }

        // Visibility
        if (config.showBoundaries === undefined) config.showBoundaries = true;
        folder.add(config, 'showBoundaries')
          .name('Show Boundaries')
          .onChange(() => element.updateConfig(config));

        if (config.showPegs === undefined) config.showPegs = true;
        folder.add(config, 'showPegs')
          .name('Show Pegs')
          .onChange(() => element.updateConfig(config));

        // Sizes
        if (config.pegSize !== undefined) {
          folder.add(config, 'pegSize', 2, 20, 1)
            .name('Peg Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleSize !== undefined) {
          folder.add(config, 'particleSize', 10, 200, 1)
            .name('Particle Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.coinColliderRatio !== undefined) {
          folder.add(config, 'coinColliderRatio', 0.1, 1.0, 0.05)
            .name('Coin Collider Ratio')
            .onChange(() => element.updateConfig(config));
        }

        // Background
        if (config.backgroundColor !== undefined) {
          folder.addColor(config, 'backgroundColor')
            .name('Background Color')
            .onChange(() => element.updateConfig(config));
        }
        if (config.backgroundOpacity !== undefined) {
          folder.add(config, 'backgroundOpacity', 0, 1, 0.05)
            .name('Background Opacity')
            .onChange(() => element.updateConfig(config));
        }

        // Spawn
        if (config.particleSpawnRate !== undefined) {
          folder.add(config, 'particleSpawnRate', 1, 60, 1)
            .name('Spawn Rate (frames)')
            .onChange(() => element.updateConfig(config));
        }
        if (config.maxParticles !== undefined) {
          folder.add(config, 'maxParticles', 10, 200, 1)
            .name('Max Particles')
            .onChange(() => element.updateConfig(config));
        }
        if (config.dropWidth !== undefined) {
          folder.add(config, 'dropWidth', 50, 1500, 10)
            .name('Drop Width')
            .onChange(() => element.updateConfig(config));
        }

        // Physics
        if (config.gravity !== undefined) {
          folder.add(config, 'gravity', 0, 2, 0.05)
            .name('Gravity')
            .onChange(() => element.updateConfig(config));
        }

        // Boundary
        if (config.boundaryRadius !== undefined) {
          folder.add(config, 'boundaryRadius', 0, 2000, 10)
            .name('Boundary Radius')
            .onChange(() => element.updateConfig(config));
        }
        if (config.boundaryCenterY !== undefined) {
          folder.add(config, 'boundaryCenterY', -500, 500, 10)
            .name('Boundary Center Y')
            .onChange(() => element.updateConfig(config));
        }
        if (config.tunnelWidth !== undefined) {
          folder.add(config, 'tunnelWidth', 50, 1500, 10)
            .name('Tunnel Width')
            .onChange(() => element.updateConfig(config));
        }

        // Particle Physics
        if (config.particleRestitution !== undefined) {
          folder.add(config, 'particleRestitution', 0, 5, 0.05)
            .name('Particle Bounciness')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleFriction !== undefined) {
          folder.add(config, 'particleFriction', 0, 1, 0.05)
            .name('Particle Friction')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleDensity !== undefined) {
          folder.add(config, 'particleDensity', 0.1, 5, 0.1)
            .name('Particle Density')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleFrictionAir !== undefined) {
          folder.add(config, 'particleFrictionAir', 0, 0.1, 0.001)
            .name('Air Resistance')
            .onChange(() => element.updateConfig(config));
        }

        // Peg Physics
        if (config.pegRestitution !== undefined) {
          folder.add(config, 'pegRestitution', 0, 1, 0.05)
            .name('Peg Bounciness')
            .onChange(() => element.updateConfig(config));
        }
        if (config.pegFriction !== undefined) {
          folder.add(config, 'pegFriction', 0, 1, 0.05)
            .name('Peg Friction')
            .onChange(() => element.updateConfig(config));
        }

        // Particle Drop Shadow
        const shadowFolder = folder.addFolder('Particle Shadow');

        if (config.particleShadowBlur !== undefined) {
          shadowFolder.add(config, 'particleShadowBlur', 0, 300, 1)
            .name('Blur / Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleShadowColor !== undefined) {
          shadowFolder.addColor(config, 'particleShadowColor')
            .name('Color')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleShadowOpacity !== undefined) {
          shadowFolder.add(config, 'particleShadowOpacity', 0, 1, 0.01)
            .name('Opacity')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleShadowOffsetX !== undefined) {
          shadowFolder.add(config, 'particleShadowOffsetX', -100, 100, 1)
            .name('Offset X')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleShadowOffsetY !== undefined) {
          shadowFolder.add(config, 'particleShadowOffsetY', -100, 100, 1)
            .name('Offset Y')
            .onChange(() => element.updateConfig(config));
        }
        break;
    }
  }

  /**
   * Log all element configurations (element-specific settings only)
   */
  logAllConfigs() {
    console.log('\n=== LED Dashboard Element Configurations ===\n');

    const configs = {};
    this.elements.forEach(element => {
      const config = element.getConfig();
      configs[element.id] = { ...config };
    });

    console.log(JSON.stringify(configs, null, 2));
    console.log('\n=== Copy and paste above ===\n');
  }

  /**
   * Log all element positions to console for hardcoding
   */
  logAllPositions() {
    console.log('=== LED Dashboard Element Positions ===');
    console.log(`Reference Resolution: ${this.referenceWidth}x${this.referenceHeight}\n`);

    const positions = {};
    this.elements.forEach(element => {
      const config = element.getConfig();
      positions[element.id] = {
        type: config.type,
        x: config.x,
        y: config.y,
        width: config.width,
        height: config.height,
        visible: config.visible,
        zIndex: config.zIndex,
        background: config.background,
        config: { ...config }
      };

      // Remove redundant keys from config
      delete positions[element.id].config.type;
      delete positions[element.id].config.x;
      delete positions[element.id].config.y;
      delete positions[element.id].config.width;
      delete positions[element.id].config.height;
      delete positions[element.id].config.visible;
      delete positions[element.id].config.zIndex;
      delete positions[element.id].config.background;
    });

    console.log(JSON.stringify(positions, null, 2));
    console.log('\n=== Copy and paste above into your config ===');
  }

  /**
   * Toggle debug mode (show element boundaries)
   */
  toggleDebugMode(enabled) {
    this.elements.forEach(element => {
      if (element.container) {
        if (enabled) {
          element.container.style.outline = '2px solid red';
          // Add label
          const label = document.createElement('div');
          label.className = 'debug-label';
          label.textContent = element.id;
          label.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            background: red;
            color: white;
            padding: 2px 5px;
            font-size: 10px;
            font-family: 'PPSupplyMono', monospace;
            z-index: 9999;
            pointer-events: none;
          `;
          element.container.appendChild(label);
        } else {
          element.container.style.outline = '';
          const label = element.container.querySelector('.debug-label');
          if (label) label.remove();
        }
      }
    });
  }

  /**
   * Get element by ID
   */
  getElement(elementId) {
    return this.elements.get(elementId);
  }

  /**
   * Cleanup
   */
  destroy() {
    window.removeEventListener('resize', this.handleResize);
    this.elements.forEach(element => element.destroy());
    this.elements.clear();
    if (this.positionGUI) {
      this.positionGUI.destroy();
    }
    if (this.controlsGUI) {
      this.controlsGUI.destroy();
    }
  }
}
