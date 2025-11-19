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
    x: 134,
    y: 192,
    width: 884,
    height: 120,
    visible: true,
    zIndex: 16,
    background: { color: '#dbe1e4', opacity: 0 },
    config: {
      scrollSpeed: 63,
      maxQueue: 10,
      fontSize: 32,
      color: '#333333',
      separator: '   '
    }
  },

  location: {
    type: 'map',
    x: 134,
    y: 657,
    width: 713,
    height: 469,
    visible: true,
    zIndex: 5,
    background: { color: '#0a0a1a', opacity: 0 },
    config: {
      mapImage: 'assets/world-map.png',
      projection: 'calibrated',
      calibrationPoints: [
        { name: 'Chicago', lat: 41.8781, lon: -87.6298, x: 388.5, y: 250.5 },
        { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, x: 252.5, y: 285.5 },
        { name: 'London', lat: 51.5074, lon: -0.1278, x: 676.5, y: 221.5 },
        { name: 'Rome', lat: 41.9028, lon: 12.4964, x: 715.5, y: 259.5 },
        { name: 'Tokyo', lat: 35.6762, lon: 139.6503, x: 1138.5, y: 405.5 },
        { name: 'Cairo', lat: 30.0444, lon: 31.2357, x: 766.5, y: 313.5 },
        { name: 'São Paulo', lat: -23.5505, lon: -46.6333, x: 501.5, y: 538.5 },
        { name: 'Mumbai', lat: 19.0760, lon: 72.8777, x: 937.5, y: 356.5 }
      ],
      dotSize: 27,
      dotColor: '#FF0080',
      dotFadeDuration: 8000,
      showLocationLabel: true,
      locationLabelDuration: 5000,
      locationLabelFontSize: 32,
      locationLabelColor: '#333333',
      locationLabelPosition: 'bottom',
      locationLabelOffset: 10
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
      rows: 10,
      pegSize: 20,
      particleSize: 45,
      particleSpawnRate: 9,
      maxParticles: 100,
      dropWidth: 500,
      gravity: 0.2,
      boundaryRadius: 1090,
      boundaryCenterY: -330,
      tunnelWidth: 750,
      backgroundColor: '#d6d6d6',
      backgroundOpacity: 0,
      // Particle physics settings
      particleRestitution: 0.45,
      particleFriction: 0.55,
      particleDensity: 1,
      particleFrictionAir: 0.01,
      // Peg physics settings
      pegRestitution: 0.8,
      pegFriction: 0,
      // Visibility settings
      showBoundaries: true,
      showPegs: true,
      showClearanceZone: false
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
    background: { color: '#e3e4e5', opacity: 0 },
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
    background: { color: '#e2e4e5', opacity: 0 },
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
    background: { color: '#dbe1e4', opacity: 0 },
    config: {
      animationStyle: 3,
      spinSpeed: 2000,
      dollarSpins: true,
      fontSize: 48,
      color: '#4f4f4f',
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
    background: { color: '#dbe1e4', opacity: 0 },
    config: {
      animationStyle: 1,
      spinSpeed: 800,
      dollarSpins: false,
      fontSize: 48,
      color: '#545454',
      digitHeight: 60
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

      // Setup GUI controls
      this.layoutManager.setupGUI(GUI);

      // Initialize real-time processing system
      await this.initProcessingSystem();

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

    // Real world locations with city/state/country
    const locations = [
      { lat: 40.7128, lon: -74.0060, city: 'New York', state: 'NY', country: 'USA' },
      { lat: 34.0522, lon: -118.2437, city: 'Los Angeles', state: 'CA', country: 'USA' },
      { lat: 41.8781, lon: -87.6298, city: 'Chicago', state: 'IL', country: 'USA' },
      { lat: 51.5074, lon: -0.1278, city: 'London', country: 'UK' },
      { lat: 48.8566, lon: 2.3522, city: 'Paris', country: 'France' },
      { lat: 41.9028, lon: 12.4964, city: 'Rome', country: 'Italy' },
      { lat: 52.5200, lon: 13.4050, city: 'Berlin', country: 'Germany' },
      { lat: 35.6762, lon: 139.6503, city: 'Tokyo', country: 'Japan' },
      { lat: -33.8688, lon: 151.2093, city: 'Sydney', country: 'Australia' },
      { lat: 19.0760, lon: 72.8777, city: 'Mumbai', country: 'India' },
      { lat: -23.5505, lon: -46.6333, city: 'São Paulo', country: 'Brazil' },
      { lat: 30.0444, lon: 31.2357, city: 'Cairo', country: 'Egypt' },
      { lat: 55.7558, lon: 37.6173, city: 'Moscow', country: 'Russia' },
      { lat: 39.9042, lon: 116.4074, city: 'Beijing', country: 'China' },
      { lat: 25.2048, lon: 55.2708, city: 'Dubai', country: 'UAE' }
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
    
    // Total Orders
    if (this.elements.totalOrders) {
      const localOrders = this.elements.totalOrders.targetValue || 0;
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
      const localGPV = this.elements.onlineGPV.targetValue || 0;
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
