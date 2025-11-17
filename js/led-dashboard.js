/**
 * LED Dashboard - Main Orchestrator
 * Initializes and manages all dashboard elements
 */

import { LayoutManager } from './core/LayoutManager.js';
import { CounterElement } from './elements/CounterElement.js';
import { SlotMachineElement } from './elements/SlotMachineElement.js';
import { TickerElement } from './elements/TickerElement.js';
import { MapElement } from './elements/MapElement.js';
import { P5Element } from './elements/P5Element.js';
import { createPlinkoSketch } from './sketches/plinko-sketch.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/dist/lil-gui.esm.min.js';

// Element configurations with default positions
// TODO: Replace with your measured positions after using GUI
const ELEMENT_CONFIGS = {
  storeName: {
    type: 'ticker',
    x: 134,
    y: 192,
    width: 884,
    height: 120,
    visible: true,
    zIndex: 16,
    background: { color: '#dbe1e4', opacity: 1 },
    config: {
      scrollSpeed: 63,
      maxQueue: 10,
      fontSize: 32,
      color: '#FFFFFF',
      separator: '   '
    }
  },

  location: {
    type: 'map',
    x: 134,
    y: 678,
    width: 713,
    height: 534,
    visible: true,
    zIndex: 5,
    background: { color: '#0a0a1a', opacity: 0.5 },
    config: {
      mapImage: null,
      dotSize: 27,
      dotColor: '#FF0080',
      dotFadeDuration: 3000,
      mode3D: false,
      rotationSpeed: 0.5
    }
  },

  plinko: {
    type: 'p5',
    x: 0,
    y: 0,
    width: 4640,
    height: 1760,
    visible: true,
    zIndex: 10,
    background: { color: '#000000', opacity: 0 },
    config: {
      sketchFunction: createPlinkoSketch,
      // Plinko game settings
      cols: 9,
      rows: 9,
      pegSize: 6,
      particleSize: 51,
      particleSpawnRate: 9,
      maxParticles: 100,
      dropWidth: 170,
      gravity: 0.2,
      boundaryRadius: 400,
      boundaryCenterY: -110,
      tunnelWidth: 240,
      backgroundColor: '#d6d6d6',
      backgroundOpacity: 0,
      // Particle physics settings
      particleRestitution: 0.1,
      particleFriction: 0.55,
      particleDensity: 1,
      particleFrictionAir: 0.01,
      // Peg physics settings
      pegRestitution: 0.8,
      pegFriction: 0
    }
  },

  totalSales: {
    type: 'counter',
    x: 1700,
    y: 305,
    width: 1224,
    height: 224,
    visible: true,
    zIndex: 5,
    background: { color: '#e3e4e5', opacity: 1 },
    config: {
      lerpSpeed: 1,
      fontSize: 66,
      color: '#404040',
      prefix: '$',
      suffix: '',
      decimals: 0
    }
  },

  totalOrders: {
    type: 'counter',
    x: 2043,
    y: 708,
    width: 693,
    height: 134,
    visible: true,
    zIndex: 5,
    background: { color: '#e2e4e5', opacity: 1 },
    config: {
      lerpSpeed: 1,
      fontSize: 33,
      color: '#545454',
      prefix: '',
      suffix: '',
      decimals: 0
    }
  },

  sale: {
    type: 'slotMachine',
    x: 3621,
    y: 1175,
    width: 770,
    height: 149,
    visible: true,
    zIndex: 5,
    background: { color: '#dbe1e4', opacity: 1 },
    config: {
      animationStyle: 3,
      spinSpeed: 2000,
      dollarSpins: false,
      fontSize: 48,
      color: '#00ff88',
      digitHeight: 60
    }
  },

  onlineGPV: {
    type: 'slotMachine',
    x: 3442,
    y: 1531,
    width: 770,
    height: 104,
    visible: true,
    zIndex: 5,
    background: { color: '#dbe1e4', opacity: 1 },
    config: {
      animationStyle: 1,
      spinSpeed: 800,
      dollarSpins: false,
      fontSize: 48,
      color: '#ff0080',
      digitHeight: 60
    }
  }
};

class LEDDashboard {
  constructor() {
    this.layoutManager = null;
    this.elements = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the dashboard
   */
  async init() {
    console.log('🚀 Initializing LED Dashboard...');

    try {
      // Create layout manager
      this.layoutManager = new LayoutManager('#led-dashboard', 4640, 1760);

      // Create and register all elements
      this.createElements();

      // Setup GUI controls
      this.layoutManager.setupGUI(GUI);

      // Start with some demo data
      this.loadDemoData();

      this.isInitialized = true;
      console.log('✅ LED Dashboard initialized successfully');

      // Instructions for user
      this.showInstructions();
    } catch (error) {
      console.error('❌ Failed to initialize LED Dashboard:', error);
    }
  }

  /**
   * Create all dashboard elements
   */
  createElements() {
    // Store Name Ticker
    this.elements.storeName = new TickerElement('storeName', ELEMENT_CONFIGS.storeName);
    this.layoutManager.registerElement(this.elements.storeName);

    // Location Map
    this.elements.location = new MapElement('location', ELEMENT_CONFIGS.location);
    this.layoutManager.registerElement(this.elements.location);

    // Plinko Game
    this.elements.plinko = new P5Element('plinko', ELEMENT_CONFIGS.plinko);
    this.layoutManager.registerElement(this.elements.plinko);

    // Total Sales Counter
    this.elements.totalSales = new CounterElement('totalSales', ELEMENT_CONFIGS.totalSales);
    this.layoutManager.registerElement(this.elements.totalSales);

    // Total Orders Counter
    this.elements.totalOrders = new CounterElement('totalOrders', ELEMENT_CONFIGS.totalOrders);
    this.layoutManager.registerElement(this.elements.totalOrders);

    // Sale Slot Machine
    this.elements.sale = new SlotMachineElement('sale', ELEMENT_CONFIGS.sale);
    this.layoutManager.registerElement(this.elements.sale);

    // Online GPV Slot Machine
    this.elements.onlineGPV = new SlotMachineElement('onlineGPV', ELEMENT_CONFIGS.onlineGPV);
    this.layoutManager.registerElement(this.elements.onlineGPV);
  }

  /**
   * Load demo data for testing
   */
  loadDemoData() {
    // Demo store names
    this.elements.storeName.updateData(['Nike Store', 'Apple Store', 'Amazon', 'Best Buy', 'Target']);

    // Demo counters
    this.elements.totalSales.setValue(125000);
    this.elements.totalOrders.setValue(1234);

    // Demo slot machines
    this.elements.sale.setValue(2500);
    this.elements.onlineGPV.setValue(45000);

    // Simulate new data every 3 seconds
    setInterval(() => {
      this.simulateNewOrder();
    }, 3000);
  }

  /**
   * Simulate a new order for testing
   */
  simulateNewOrder() {
    const stores = ['Nike Store', 'Apple Store', 'Amazon', 'Best Buy', 'Target', 'Walmart', 'Costco'];
    const randomStore = stores[Math.floor(Math.random() * stores.length)];

    // Add store name to ticker
    this.elements.storeName.addName(randomStore);

    // Update counters
    const currentSales = this.elements.totalSales.targetValue || 0;
    const currentOrders = this.elements.totalOrders.targetValue || 0;
    const newOrderValue = Math.floor(Math.random() * 5000) + 500;

    this.elements.totalSales.updateData(currentSales + newOrderValue);
    this.elements.totalOrders.updateData(currentOrders + 1);

    // Update slot machines
    this.elements.sale.updateData(newOrderValue);
    // Online GPV shows latest order value (not cumulative)
    this.elements.onlineGPV.updateData(newOrderValue);

    // Add random location dot
    const randomLat = (Math.random() * 170) - 85; // -85 to 85
    const randomLon = (Math.random() * 360) - 180; // -180 to 180
    this.elements.location.addDot(randomLat, randomLon);

    console.log(`📦 New Order: ${randomStore} - $${newOrderValue}`);
  }

  /**
   * Update element data from API
   * This is where you'll wire up your real API calls
   */
  updateFromAPI(data) {
    if (data.storeName) {
      this.elements.storeName.updateData(data.storeName);
    }

    if (data.location && data.location.lat && data.location.lon) {
      this.elements.location.updateData(data.location);
    }

    if (data.totalSales !== undefined) {
      this.elements.totalSales.updateData(data.totalSales);
    }

    if (data.totalOrders !== undefined) {
      this.elements.totalOrders.updateData(data.totalOrders);
    }

    if (data.sale !== undefined) {
      this.elements.sale.updateData(data.sale);
    }

    if (data.onlineGPV !== undefined) {
      this.elements.onlineGPV.updateData(data.onlineGPV);
    }
  }

  /**
   * Show usage instructions in console
   */
  showInstructions() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║            LED Dashboard - Usage Instructions                 ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  📍 POSITIONING:                                              ║
║  • Use the GUI controls to adjust element positions          ║
║  • Click "📋 Log All Positions" to copy configurations       ║
║  • Paste into ELEMENT_CONFIGS in led-dashboard.js            ║
║                                                               ║
║  🐛 DEBUG MODE:                                               ║
║  • Toggle "Debug Mode" to see element boundaries             ║
║                                                               ║
║  🔌 API INTEGRATION:                                          ║
║  • Use dashboard.updateFromAPI(data) to update elements      ║
║  • Example:                                                   ║
║    dashboard.updateFromAPI({                                  ║
║      storeName: 'Nike Store',                                 ║
║      location: { lat: 40.7128, lon: -74.0060 },              ║
║      totalSales: 125000,                                      ║
║      sale: 2500                                               ║
║    });                                                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.layoutManager) {
      this.layoutManager.destroy();
    }
    this.elements = {};
    this.isInitialized = false;
  }
}

// Initialize dashboard when DOM is ready
let dashboard;

document.addEventListener('DOMContentLoaded', async () => {
  dashboard = new LEDDashboard();
  await dashboard.init();

  // Expose to window for debugging
  window.dashboard = dashboard;
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (dashboard) {
    dashboard.destroy();
  }
});

export { LEDDashboard };
