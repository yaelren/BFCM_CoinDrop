/**
 * LayoutManager - Manages positioning and scaling of all dashboard elements
 * Coordinates reference resolution (4640x1760) to actual screen size
 */
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
  setupGUI(GUI) {
    // Clean up existing GUIs
    if (this.positionGUI) this.positionGUI.destroy();
    if (this.controlsGUI) this.controlsGUI.destroy();

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

    // Create folder for each element
    this.elements.forEach(element => {
      const config = element.getConfig();
      const folder = this.controlsGUI.addFolder(element.id);
      this.guiFolders.set(element.id, folder);

      // Element-specific controls
      this.addElementSpecificControls(folder, element, config);
    });
  }

  /**
   * Add element-specific GUI controls
   * Override this or extend per element type
   */
  addElementSpecificControls(folder, element, config) {
    const type = config.type;

    switch (type) {
      case 'ticker':
        // Text styling
        const tickerTextFolder = folder.addFolder('Text Styling');
        if (config.fontSize !== undefined) {
          tickerTextFolder.add(config, 'fontSize', 12, 200, 1)
            .name('Font Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.color) {
          tickerTextFolder.addColor(config, 'color')
            .name('Text Color')
            .onChange(() => element.updateConfig(config));
        }

        // Animation
        const tickerAnimFolder = folder.addFolder('Animation');
        if (config.scrollSpeed !== undefined) {
          tickerAnimFolder.add(config, 'scrollSpeed', 1, 200, 1)
            .name('Scroll Speed')
            .onChange(() => element.updateConfig(config));
        }
        if (config.maxQueue !== undefined) {
          tickerAnimFolder.add(config, 'maxQueue', 5, 100, 1)
            .name('Max Queue Size')
            .onChange(() => element.updateConfig(config));
        }
        break;

      case 'counter':
        // Text styling
        const counterTextFolder = folder.addFolder('Text Styling');
        if (config.fontSize !== undefined) {
          counterTextFolder.add(config, 'fontSize', 12, 200, 1)
            .name('Font Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.color) {
          counterTextFolder.addColor(config, 'color')
            .name('Text Color')
            .onChange(() => element.updateConfig(config));
        }

        // Animation
        const counterAnimFolder = folder.addFolder('Animation');
        if (config.lerpSpeed !== undefined) {
          counterAnimFolder.add(config, 'lerpSpeed', 0.1, 5, 0.1)
            .name('Animation Speed')
            .onChange(() => element.updateConfig(config));
        }
        break;

      case 'slotMachine':
        // Text styling
        const slotTextFolder = folder.addFolder('Text Styling');
        if (config.fontSize !== undefined) {
          slotTextFolder.add(config, 'fontSize', 12, 200, 1)
            .name('Font Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.color) {
          slotTextFolder.addColor(config, 'color')
            .name('Text Color')
            .onChange(() => element.updateConfig(config));
        }

        // Animation
        const slotAnimFolder = folder.addFolder('Animation');
        if (config.animationStyle !== undefined) {
          slotAnimFolder.add(config, 'animationStyle', { 'All Together': 1, 'Sequential': 2, 'Random': 3 })
            .name('Animation Style')
            .onChange(() => element.updateConfig(config));
        }
        if (config.spinSpeed !== undefined) {
          slotAnimFolder.add(config, 'spinSpeed', 200, 2000, 50)
            .name('Spin Duration (ms)')
            .onChange(() => element.updateConfig(config));
        }
        if (config.dollarSpins !== undefined) {
          slotAnimFolder.add(config, 'dollarSpins')
            .name('$ Symbol Spins')
            .onChange(() => element.updateConfig(config));
        }
        break;

      case 'map':
        // Visual settings
        const mapVisualFolder = folder.addFolder('Visual Settings');
        if (config.dotSize !== undefined) {
          mapVisualFolder.add(config, 'dotSize', 5, 50, 1)
            .name('Dot Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.dotColor) {
          mapVisualFolder.addColor(config, 'dotColor')
            .name('Dot Color')
            .onChange(() => element.updateConfig(config));
        }

        // Animation
        const mapAnimFolder = folder.addFolder('Animation');
        if (config.dotFadeDuration !== undefined) {
          mapAnimFolder.add(config, 'dotFadeDuration', 0, 10000, 100)
            .name('Dot Fade (ms, 0=stay)')
            .onChange(() => element.updateConfig(config));
        }
        break;

      case 'p5':
        // Grid Layout
        const gridFolder = folder.addFolder('Grid Layout');
        if (config.cols !== undefined) {
          gridFolder.add(config, 'cols', 3, 20, 1)
            .name('Columns')
            .onChange(() => element.updateConfig(config));
        }
        if (config.rows !== undefined) {
          gridFolder.add(config, 'rows', 3, 20, 1)
            .name('Rows')
            .onChange(() => element.updateConfig(config));
        }

        // Visual Settings
        const plinkoVisualFolder = folder.addFolder('Visual Settings');

        // Add visibility toggles
        if (config.showBoundaries === undefined) config.showBoundaries = true;
        plinkoVisualFolder.add(config, 'showBoundaries')
          .name('Show Boundaries')
          .onChange(() => element.updateConfig(config));

        if (config.showPegs === undefined) config.showPegs = true;
        plinkoVisualFolder.add(config, 'showPegs')
          .name('Show Pegs')
          .onChange(() => element.updateConfig(config));

        if (config.pegSize !== undefined) {
          plinkoVisualFolder.add(config, 'pegSize', 2, 20, 1)
            .name('Peg Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleSize !== undefined) {
          plinkoVisualFolder.add(config, 'particleSize', 10, 200, 1)
            .name('Particle Size')
            .onChange(() => element.updateConfig(config));
        }
        if (config.backgroundColor !== undefined) {
          plinkoVisualFolder.addColor(config, 'backgroundColor')
            .name('Background Color')
            .onChange(() => element.updateConfig(config));
        }
        if (config.backgroundOpacity !== undefined) {
          plinkoVisualFolder.add(config, 'backgroundOpacity', 0, 1, 0.05)
            .name('Background Opacity')
            .onChange(() => element.updateConfig(config));
        }

        // Spawn Settings
        const spawnFolder = folder.addFolder('Spawn Settings');
        if (config.particleSpawnRate !== undefined) {
          spawnFolder.add(config, 'particleSpawnRate', 1, 60, 1)
            .name('Spawn Rate (frames)')
            .onChange(() => element.updateConfig(config));
        }
        if (config.maxParticles !== undefined) {
          spawnFolder.add(config, 'maxParticles', 10, 200, 1)
            .name('Max Particles')
            .onChange(() => element.updateConfig(config));
        }
        if (config.dropWidth !== undefined) {
          spawnFolder.add(config, 'dropWidth', 50, 500, 10)
            .name('Drop Width')
            .onChange(() => element.updateConfig(config));
        }

        // Physics Settings
        const physicsFolder = folder.addFolder('Physics Settings');
        if (config.gravity !== undefined) {
          physicsFolder.add(config, 'gravity', 0, 2, 0.05)
            .name('Gravity')
            .onChange(() => element.updateConfig(config));
        }

        // Boundary Settings
        const boundaryFolder = folder.addFolder('Boundary Settings');
        if (config.boundaryRadius !== undefined) {
          boundaryFolder.add(config, 'boundaryRadius', 0, 800, 10)
            .name('Boundary Radius')
            .onChange(() => element.updateConfig(config));
        }
        if (config.boundaryCenterY !== undefined) {
          boundaryFolder.add(config, 'boundaryCenterY', -300, 300, 10)
            .name('Boundary Center Y')
            .onChange(() => element.updateConfig(config));
        }
        if (config.tunnelWidth !== undefined) {
          boundaryFolder.add(config, 'tunnelWidth', 50, 500, 10)
            .name('Tunnel Width')
            .onChange(() => element.updateConfig(config));
        }

        // Particle Physics
        const particlePhysicsFolder = folder.addFolder('Particle Physics');
        if (config.particleRestitution !== undefined) {
          particlePhysicsFolder.add(config, 'particleRestitution', 0, 5, 0.05)
            .name('Bounciness')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleFriction !== undefined) {
          particlePhysicsFolder.add(config, 'particleFriction', 0, 1, 0.05)
            .name('Friction')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleDensity !== undefined) {
          particlePhysicsFolder.add(config, 'particleDensity', 0.1, 5, 0.1)
            .name('Density')
            .onChange(() => element.updateConfig(config));
        }
        if (config.particleFrictionAir !== undefined) {
          particlePhysicsFolder.add(config, 'particleFrictionAir', 0, 0.1, 0.001)
            .name('Air Resistance')
            .onChange(() => element.updateConfig(config));
        }

        // Peg Physics
        const pegPhysicsFolder = folder.addFolder('Peg Physics');
        if (config.pegRestitution !== undefined) {
          pegPhysicsFolder.add(config, 'pegRestitution', 0, 1, 0.05)
            .name('Bounciness')
            .onChange(() => element.updateConfig(config));
        }
        if (config.pegFriction !== undefined) {
          pegPhysicsFolder.add(config, 'pegFriction', 0, 1, 0.05)
            .name('Friction')
            .onChange(() => element.updateConfig(config));
        }
        break;
    }
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
            font-family: monospace;
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
