// BFCM Dashboard API Module
// Handles all API communication with Wix BFCM Dashboard

// Use local proxy to bypass CORS restrictions
// Start proxy with: node proxy-server.js
const API_BASE_URL = 'http://localhost:3000';

// Direct API URL (will fail due to CORS in browser)
// const API_BASE_URL = 'https://wix-bo.com/_api/bfcm-dashboard-serverless/_functions';

class BFCMApi {
    constructor() {
        this.isConnected = false;
        this.lastUpdate = null;
        this.errorCount = 0;
        this.maxRetries = 3;
    }

    /**
     * Fetch totals data (orders_count, gpv, aov)
     * @returns {Promise<Object>} Totals data
     */
    async fetchTotals() {
        try {
            const response = await fetch(`${API_BASE_URL}/totals`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.isConnected = true;
            this.lastUpdate = new Date();
            this.errorCount = 0;

            console.log('✅ Totals fetched:', data);
            return data;
        } catch (error) {
            this.handleError('fetchTotals', error);
            throw error;
        }
    }

    /**
     * Fetch recent orders
     * @returns {Promise<Array>} Array of order objects
     */
    async fetchOrders() {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.isConnected = true;
            this.lastUpdate = new Date();
            this.errorCount = 0;

            console.log(`✅ Orders fetched: ${data.length} orders`);
            return data;
        } catch (error) {
            this.handleError('fetchOrders', error);
            throw error;
        }
    }

    /**
     * Fetch stores data
     * @returns {Promise<Array>} Array of store objects
     */
    async fetchStores() {
        try {
            const response = await fetch(`${API_BASE_URL}/stores`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Stores fetched: ${data.length} stores`);
            return data;
        } catch (error) {
            this.handleError('fetchStores', error);
            throw error;
        }
    }

    /**
     * Fetch products data
     * @returns {Promise<Array>} Array of product objects
     */
    async fetchProducts() {
        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Products fetched: ${data.length} products`);
            return data;
        } catch (error) {
            this.handleError('fetchProducts', error);
            throw error;
        }
    }

    /**
     * Test API connection with ping endpoint
     * @returns {Promise<boolean>} True if connection successful
     */
    async testConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/ping`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.isConnected = true;
            console.log('✅ API Connection successful');
            return true;
        } catch (error) {
            this.isConnected = false;
            console.error('❌ API Connection failed:', error);
            return false;
        }
    }

    /**
     * Handle API errors
     * @param {string} endpoint - The endpoint that failed
     * @param {Error} error - The error object
     */
    handleError(endpoint, error) {
        this.errorCount++;
        this.isConnected = false;

        console.error(`❌ API Error [${endpoint}]:`, error.message);

        if (this.errorCount >= this.maxRetries) {
            console.error(`⚠️ Max retries (${this.maxRetries}) reached for ${endpoint}`);
        }
    }

    /**
     * Get connection status
     * @returns {Object} Status object with connection details
     */
    getStatus() {
        return {
            connected: this.isConnected,
            lastUpdate: this.lastUpdate,
            errorCount: this.errorCount
        };
    }
}

// Create global API instance
const api = new BFCMApi();
