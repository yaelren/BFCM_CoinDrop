/**
 * LED Dashboard - Main Orchestrator
 * Initializes and manages all dashboard elements
 */

import { LayoutManager } from './core/LayoutManager.js';
import { CounterElement } from './elements/CounterElement.js';
import { TextElement } from './elements/TextElement.js';
import { SlotMachineElement } from './elements/SlotMachineElement.js';
import { TickerElement } from './elements/TickerElement.js';
import { MapElement } from './elements/MapElement.js';
import { P5Element } from './elements/P5Element.js';
import { createPlinkoSketch } from './sketches/plinko-sketch.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/dist/lil-gui.esm.min.js';

// Real-time processing system
import { BFCMApi } from './api.js';
import { OrderQueueManager } from './core/OrderQueueManager.js';
import { OrderPoller } from './core/OrderPoller.js';
import { TotalsPoller } from './core/TotalsPoller.js';
import { OrderProcessor } from './core/OrderProcessor.js';

// Element configurations with default positions
// TODO: Replace with your measured positions after using GUI
const ELEMENT_CONFIGS = {
  storeName: {
    type: 'ticker',
    x: 215,
    y: 196,
    width: 790,
    height: 110,
    visible: true,
    zIndex: 16,
    background: { color: '#dbe1e4', opacity: 0 },
    config: {
      scrollSpeed: 109,
      maxQueue: 78,
      fontSize: 61,
      color: '#000000',
      separator: '   ',
      textShadow: '0 0 5px rgba(1, 78, 116, 0.5), 0 0 20px rgba(1, 78, 116, 0.5)' // Dark teal glow effect
    }
  },

  location: {
    type: 'map',
    x: 134,
    y: 657,
    width: 713,
    height: 534,
    visible: true,
    zIndex: 5,
    background: { color: '#0a0a1a', opacity: 0 },
    config: {
      projection: 'calibrated',  // Using calibrated projection with 12 reference cities
      calibrationPoints: [
        { name: 'New York', lat: 40.7128, lon: -74.006, x: 0.2817, y: 0.3123 },
        { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, x: 0.1388, y: 0.3557 },
        { name: 'Chicago', lat: 41.8781, lon: -87.6298, x: 0.2449, y: 0.2892 },
        { name: 'London', lat: 51.5074, lon: -0.1278, x: 0.5003, y: 0.2574 },
        { name: 'Paris', lat: 48.8566, lon: 2.3522, x: 0.496, y: 0.3297 },
        { name: 'Rome', lat: 41.9028, lon: 12.4964, x: 0.5198, y: 0.3355 },
        { name: 'Berlin', lat: 52.52, lon: 13.405, x: 0.5328, y: 0.2834 },
        { name: 'Tokyo', lat: 35.6762, lon: 139.6503, x: 0.812, y: 0.4626 },
        { name: 'Sydney', lat: -33.8688, lon: 151.2093, x: 0.8726, y: 0.6534 },
        { name: 'Mumbai', lat: 19.076, lon: 72.8777, x: 0.6799, y: 0.4482 },
        { name: 'São Paulo', lat: -23.5505, lon: -46.6333, x: 0.325, y: 0.6245 },
        { name: 'Cairo', lat: 30.0444, lon: 31.2357, x: 0.5219, y: 0.3933 }
      ],
      dotSize: 32,
      dotFillColor: '#f4dac7',
      dotStrokeColor: '#ef7e6e',
      dotStrokeWeight: 2.5,
      dotFadeDuration: 4700,
      showLocationLabel: true,
      locationLabelDuration: 5000,
      locationLabelFontSize: 36,
      locationLabelColor: '#333333',
      locationLabelPosition: 'bottom',
      locationLabelOffset: 0,
      locationLabelMaxLength: 20  // Max characters before truncating (testing - adjust based on visual fit) (removes city if too long, then truncates country)
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
      cols: 20,
      rows: 15,
      pegSize: 11,
      particleSize: 62,
      particleSpawnRate: 9,
      maxParticles: 100,
      dropWidth: 520,
      gravity: 0.4,
      boundaryRadius: 1130,
      boundaryCenterY: -330,
      tunnelWidth: 750,
      backgroundColor: '#d6d6d6',
      backgroundOpacity: 0,
      // Peg positioning
      pegOffsetX: 0,
      pegOffsetY: -73,
      // Peg spacing (1.0 = default, <1.0 = closer together, >1.0 = further apart)
      pegSpacingX: 0.85,
      pegSpacingY: 0.85,
      // Removed pegs configuration (row: [columns])
      // Example: { 0: [5, 10], 1: [3] } removes pegs at column 5 & 10 in row 0, column 3 in row 1
      removedPegs: {
        5: [9, 10, 11, 12, 13, 14],
        7: [11, 12, 13]
      },
      // Peg selection mode (enable to click pegs to remove them)
      pegSelectionMode: false,
      // Particle physics settings
      particleRestitution: 0.45,
      particleFriction: 0.3,
      particleDensity: 1,
      particleFrictionAir: 0.01,
      coinColliderRatio: 0.8,
      // Peg physics settings
      pegRestitution: 0.8,
      pegFriction: 0,
      // Visibility settings
      showBoundaries: false,
      showPegs: true,
      showClearanceZone: false,
      // Particle drop shadow
      particleShadowBlur: 27,
      particleShadowSpread: 0,
      particleShadowColor: '#000000',
      particleShadowOpacity: 0.5,
      particleShadowOffsetX: -2,
      particleShadowOffsetY: 10
    }
  },

  totalSales: {
    type: 'counter',
    x: 1659,
    y: 315,
    width: 1022,
    height: 224,
    visible: true,
    zIndex: 5,
    background: { color: '#e3e4e5', opacity: 0 },
    config: {
      lerpSpeed: 1,
      fontSize: 133,
      color: '#000000',
      prefix: '',
      suffix: '',
      decimals: 0,
      textShadow: '0 0 5px rgba(1, 78, 116, 0.5), 0 0 20px rgba(1, 78, 116, 0.5)' // Dark teal glow effect
    }
  },

  totalOrders: {
    type: 'text',
    x: 2009,
    y: 746,
    width: 642,
    height: 106,
    visible: true,
    zIndex: 5,
    background: { color: '#e2e4e5', opacity: 0 },
    config: {
      fontSize: 72,
      color: '#000000',
      prefix: '',
      suffix: '',
      decimals: 0,
      lerpSpeed: 1,
      textShadow: '0 0 5px rgba(1, 78, 116, 0.5), 0 0 20px rgba(1, 78, 116, 0.5)' // Dark teal glow effect
    }
  },

  sale: {
    type: 'slotMachine',
    x: 3650,
    y: 1155,
    width: 461,
    height: 149,
    visible: true,
    zIndex: 8,
    background: { color: '#000000', opacity: 0 },
    config: {
      animationStyle: 3,
      spinSpeed: 2000,
      easing: 'easeOutExpo',
      dollarSpins: true,
      fontSize: 120,
      color: '#000000',
      digitHeight: 200,
      maxDigits: 5,
      digitDelay: 100,
      textShadow: '0 0 5px rgba(1, 78, 116, 0.5), 0 0 20px rgba(1, 78, 116, 0.5)' // Dark teal glow effect
    }
  },

  onlineGPV: {
    type: 'text',
    x: 3408,
    y: 1548,
    width: 542,
    height: 104,
    visible: true,
    zIndex: 5,
    background: { color: '#0092db', opacity: 0 },
    config: {
      fontSize: 72,
      color: '#000000',
      prefix: '$',
      suffix: '',
      decimals: 0,
      lerpSpeed: 1,
      textShadow: '0 0 5px rgba(1, 78, 116, 0.5), 0 0 20px rgba(1, 78, 116, 0.5)' // Dark teal glow effect
    }
  }
};

class LEDDashboard {
  constructor() {
    this.layoutManager = null;
    this.elements = {};
    this.isInitialized = false;

    // Real-time processing system
    this.api = null;
    this.queueManager = null;
    this.orderPoller = null;
    this.totalsPoller = null;
    this.processor = null;
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

      // Initialize real-time processing system
      await this.initProcessingSystem();

      // Setup GUI controls (after processor is initialized)
      this.layoutManager.setupGUI(GUI, this.processor);

      // DISABLED: Demo data simulation (using real API now)
      // this.loadDemoData();

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

    // Total Orders Text
    this.elements.totalOrders = new TextElement('totalOrders', ELEMENT_CONFIGS.totalOrders);
    this.layoutManager.registerElement(this.elements.totalOrders);

    // Sale Slot Machine
    this.elements.sale = new SlotMachineElement('sale', ELEMENT_CONFIGS.sale);
    this.layoutManager.registerElement(this.elements.sale);

    // Online GPV Text
    this.elements.onlineGPV = new TextElement('onlineGPV', ELEMENT_CONFIGS.onlineGPV);
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

    // Real world locations with city/state/country - INCLUDING LONG NAMES FOR TESTING
    const locations = [
      { lat: 40.7128, lon: -74.0060, city: 'New York', state: 'NY', country: 'United States of America' },
      { lat: 34.0522, lon: -118.2437, city: 'Los Angeles', state: 'CA', country: 'United States of America' },
      { lat: 41.8781, lon: -87.6298, city: 'Chicago', state: 'IL', country: 'United States of America' },
      { lat: 51.5074, lon: -0.1278, city: 'London', country: 'United Kingdom' },
      { lat: 48.8566, lon: 2.3522, city: 'Paris', country: 'France' },
      { lat: 41.9028, lon: 12.4964, city: 'Rome', country: 'Italy' },
      { lat: 52.5200, lon: 13.4050, city: 'Berlin', country: 'Germany' },
      { lat: 35.6762, lon: 139.6503, city: 'Tokyo', country: 'Japan' },
      { lat: -33.8688, lon: 151.2093, city: 'Sydney', country: 'Australia' },
      { lat: 19.0760, lon: 72.8777, city: 'Mumbai', country: 'India' },
      { lat: -23.5505, lon: -46.6333, city: 'São Paulo', country: 'Brazil' },
      { lat: 30.0444, lon: 31.2357, city: 'Cairo', country: 'Egypt' },
      { lat: 55.7558, lon: 37.6173, city: 'Moscow', country: 'Russian Federation' },
      { lat: 39.9042, lon: 116.4074, city: 'Beijing', country: 'People\'s Republic of China' },
      { lat: 25.2048, lon: 55.2708, city: 'Dubai', country: 'United Arab Emirates' },
      // EXTRA LONG TEST CASES
      { lat: 53.4808, lon: -2.2426, city: 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch', country: 'United Kingdom' },
      { lat: -22.9068, lon: -43.1729, city: 'Rio de Janeiro', country: 'Federative Republic of Brazil' }
    ];

    const randomLocation = locations[Math.floor(Math.random() * locations.length)];

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

    // Add location dot with city/country label
    this.elements.location.updateData(randomLocation);

    console.log(`📦 New Order: ${randomStore} - $${newOrderValue} from ${randomLocation.city}, ${randomLocation.country}`);
  }

  /**
   * Initialize real-time processing system
   * PHASE I: Logging only (no element updates)
   */
  async initProcessingSystem() {
    console.log('🔄 Initializing order processing system...');

    try {
      // Create API client
      this.api = new BFCMApi();

      // Test connection
      const connected = await this.api.testConnection();
      if (!connected) {
        console.warn('⚠️ API unavailable, processing system disabled');
        return;
      }

      console.log('✅ API connection successful');

      // Initialize counters from totals API
      await this.initializeCounters();

      // Create queue manager
      this.queueManager = new OrderQueueManager(500);

      // Create order processor (PHASE I: logging only)
      this.processor = new OrderProcessor(this.queueManager, this, {
        minDisplayTime: 3000  // 3 seconds between orders
      });

      // Create order poller (every 2 seconds)
      this.orderPoller = new OrderPoller(
        this.api,
        this.queueManager,
        (error) => console.error('Order polling error:', error)
      );

      // Create totals poller (every 10 minutes)
      this.totalsPoller = new TotalsPoller(
        this.api,
        (totals) => this.reconcileTotals(totals),  // PHASE II: reconcile counters
        (error) => console.error('Totals polling error:', error)
      );

      // Start polling and processing
      this.orderPoller.start();
      this.totalsPoller.start();
      this.processor.start();

      console.log('✅ Processing system started');
      console.log('   - Orders polling: queue-based (fetches when empty)');
      console.log('   - Totals polling: every 10 minutes');
      console.log('   - Order display time: 3 seconds');

    } catch (error) {
      console.error('❌ Failed to initialize processing system:', error);
    }
  }

  /**
   * Reconcile totals from API with local counters
   * PHASE II: Corrects any drift between local and API totals
   */
  /**
   * Initialize counters from totals API on startup
   */
  async initializeCounters() {
    try {
      console.log('🔄 Initializing counters from API...');
      const totals = await this.api.fetchTotals();
      
      // Set initial values (use setValue for instant update, no animation)
      if (this.elements.totalOrders) {
        this.elements.totalOrders.setValue(totals.orders_count.online);
      }
      
      if (this.elements.totalSales) {
        this.elements.totalSales.setValue(totals.gpv.online);
      }
      
      if (this.elements.onlineGPV) {
        this.elements.onlineGPV.setValue(totals.gpv.online);
      }
      
      console.log('✅ Counters initialized:', {
        totalOrders: totals.orders_count.online,
        totalSales: totals.gpv.online,
        onlineGPV: totals.gpv.online
      });
    } catch (error) {
      console.error('❌ Failed to initialize counters:', error);
    }
  }

  reconcileTotals(totals) {
    console.log('═════════════════════════════════════════════════════');
    console.log('📊 TOTALS API RECONCILIATION');
    console.log('═════════════════════════════════════════════════════');
    
    // Total Orders (TextElement uses currentValue, not targetValue)
    if (this.elements.totalOrders) {
      const localOrders = this.elements.totalOrders.currentValue || 0;
      const apiOrders = totals.orders_count.online;
      if (localOrders !== apiOrders) {
        console.log(`⚠️ Orders drift detected: Local=${localOrders}, API=${apiOrders}`);
        console.log(`   Correcting to ${apiOrders}...`);
        this.elements.totalOrders.updateData(apiOrders);
      } else {
        console.log(`✅ Orders in sync: ${apiOrders}`);
      }
    }
    
    // Total Sales (using online GPV as total sales)
    if (this.elements.totalSales) {
      const localSales = this.elements.totalSales.targetValue || 0;
      const apiSales = totals.gpv.online;
      if (Math.abs(localSales - apiSales) > 0.01) {  // Allow for rounding
        console.log(`⚠️ Sales drift detected: Local=$${localSales.toFixed(2)}, API=$${apiSales.toFixed(2)}`);
        console.log(`   Correcting to $${apiSales.toFixed(2)}...`);
        this.elements.totalSales.updateData(apiSales);
      } else {
        console.log(`✅ Sales in sync: $${apiSales.toFixed(2)}`);
      }
    }
    
    // Online GPV
    if (this.elements.onlineGPV) {
      const localGPV = this.elements.onlineGPV.currentValue || 0;
      const apiGPV = totals.gpv.online;
      if (Math.abs(localGPV - apiGPV) > 0.01) {  // Allow for rounding
        console.log(`⚠️ Online GPV drift detected: Local=$${localGPV.toFixed(2)}, API=$${apiGPV.toFixed(2)}`);
        console.log(`   Correcting to $${apiGPV.toFixed(2)}...`);
        this.elements.onlineGPV.updateData(apiGPV);
      } else {
        console.log(`✅ Online GPV in sync: $${apiGPV.toFixed(2)}`);
      }
    }
    
    console.log('═════════════════════════════════════════════════════');
  }

  /**
   * Update element data from API
   * This is where you'll wire up your real API calls
   *
   * Example location data format:
   * {
   *   location: {
   *     lat: 40.7128,
   *     lon: -74.0060,
   *     city: 'New York',
   *     state: 'NY',       // Optional (for US locations)
   *     country: 'USA'     // Optional but recommended
   *   }
   * }
   */
  updateFromAPI(data) {
    if (data.storeName) {
      this.elements.storeName.updateData(data.storeName);
    }

    if (data.location && data.location.lat !== undefined && data.location.lon !== undefined) {
      // Pass full location object with city/state/country for label
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
║  🗺️ MAP & LOCATION LABELS:                                   ║
║  • Dots appear at precise geographic coordinates             ║
║  • Location label shows below map: "City, State, Country"    ║
║  • Include city/country in API data for labels to display    ║
║                                                               ║
║  🔌 API INTEGRATION:                                          ║
║  • Use dashboard.updateFromAPI(data) to update elements      ║
║  • Example with location label:                              ║
║    dashboard.updateFromAPI({                                  ║
║      storeName: 'Nike Store',                                 ║
║      location: {                                              ║
║        lat: 40.7128,                                          ║
║        lon: -74.0060,                                         ║
║        city: 'New York',                                      ║
║        state: 'NY',                                           ║
║        country: 'USA'                                         ║
║      },                                                       ║
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

  // Ensure video plays (Arc browser compatibility)
  // Use setTimeout to prevent blocking dashboard initialization
  setTimeout(() => {
    const video = document.querySelector('.led-background-video');
    if (video) {
      video.play().catch(e => console.log('Video autoplay blocked:', e.message));
    }
  }, 100);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (dashboard) {
    dashboard.destroy();
  }
});

export { LEDDashboard };
