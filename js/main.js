// BFCM Dashboard Main Application
// Handles UI updates, polling, and data formatting

class Dashboard {
    constructor() {
        this.pollingIntervals = {
            totals: null,
            orders: null
        };
        this.pollingFrequency = {
            totals: 3000,  // 3 seconds
            orders: 2000   // 2 seconds
        };
        this.isRunning = false;
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        console.log('🚀 Initializing BFCM Dashboard...');

        // Test API connection first
        const connected = await api.testConnection();

        if (!connected) {
            this.showError('Unable to connect to API. Please check VPN connection.');
            return;
        }

        // Initial data fetch
        await this.updateTotals();
        await this.updateOrders();

        // Start polling
        this.startPolling();

        this.isRunning = true;
        this.updateStatus('Connected', true);

        console.log('✅ Dashboard initialized successfully');
    }

    /**
     * Start polling for data updates
     */
    startPolling() {
        // Poll totals every 3 seconds
        this.pollingIntervals.totals = setInterval(async () => {
            await this.updateTotals();
        }, this.pollingFrequency.totals);

        // Poll orders every 2 seconds
        this.pollingIntervals.orders = setInterval(async () => {
            await this.updateOrders();
        }, this.pollingFrequency.orders);

        console.log('🔄 Polling started');
    }

    /**
     * Stop all polling
     */
    stopPolling() {
        if (this.pollingIntervals.totals) {
            clearInterval(this.pollingIntervals.totals);
        }
        if (this.pollingIntervals.orders) {
            clearInterval(this.pollingIntervals.orders);
        }
        this.isRunning = false;
        console.log('⏸️ Polling stopped');
    }

    /**
     * Toggle auto-polling on/off
     */
    togglePolling() {
        const toggleSwitch = document.getElementById('toggleSwitch');
        const toggleStatus = document.getElementById('toggleStatus');

        if (this.isRunning) {
            // Turn OFF auto-polling
            this.stopPolling();
            toggleSwitch.classList.remove('active');
            toggleStatus.textContent = 'OFF';
            toggleStatus.style.color = '#999';
            console.log('⏸️ Auto-polling disabled - use Refresh button for updates');
        } else {
            // Turn ON auto-polling
            this.startPolling();
            toggleSwitch.classList.add('active');
            toggleStatus.textContent = 'ON';
            toggleStatus.style.color = '#4CAF50';
            console.log('▶️ Auto-polling enabled - data updates every 2-3 seconds');
        }
    }

    /**
     * Manual refresh - updates all data immediately
     */
    async manualRefresh() {
        const button = document.getElementById('refreshButton');

        // Disable button during refresh
        button.classList.add('refreshing');
        button.textContent = '⏳ Refreshing...';
        button.disabled = true;

        console.log('🔄 Manual refresh triggered');

        try {
            // Update both totals and orders
            await Promise.all([
                this.updateTotals(),
                this.updateOrders()
            ]);

            console.log('✅ Manual refresh complete');
        } catch (error) {
            console.error('❌ Manual refresh failed:', error);
        } finally {
            // Re-enable button
            setTimeout(() => {
                button.classList.remove('refreshing');
                button.textContent = '🔄 Refresh Now';
                button.disabled = false;
            }, 500); // Small delay to show the refresh happened
        }
    }

    /**
     * Update totals data
     */
    async updateTotals() {
        try {
            const data = await api.fetchTotals();

            // Update UI
            document.getElementById('totalOrders').textContent = this.formatNumber(data.orders_count);
            document.getElementById('totalGMV').textContent = this.formatCurrency(data.gpv);
            document.getElementById('avgOrder').textContent = this.formatCurrency(data.aov);

            this.updateStatus('Connected', true);
        } catch (error) {
            console.error('Failed to update totals:', error);
            this.updateStatus('Connection Error', false);
        }
    }

    /**
     * Update orders data
     */
    async updateOrders() {
        try {
            const orders = await api.fetchOrders();

            // Display only the most recent 20 orders
            const recentOrders = orders.slice(0, 20);

            const ordersHTML = recentOrders.map((order, index) => {
                const timeAgo = this.getTimeAgo(new Date(order.date));
                const location = this.formatLocation(order.location);
                const amount = this.formatCurrencyWithCode(order.amount, order.currency);

                return `
                    <div class="order-item">
                        <strong>${location}</strong>: ${amount} <span style="color: #999;">(${timeAgo})</span>
                    </div>
                `;
            }).join('');

            document.getElementById('ordersList').innerHTML = ordersHTML;
            this.updateStatus('Connected', true);
        } catch (error) {
            console.error('Failed to update orders:', error);
            this.updateStatus('Connection Error', false);
        }
    }

    /**
     * Format number with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    }

    /**
     * Format currency in USD
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Format currency with specific currency code
     * @param {string|number} amount - Amount to format
     * @param {string} currencyCode - Currency code (USD, EUR, GBP, etc.)
     * @returns {string} Formatted currency
     */
    formatCurrencyWithCode(amount, currencyCode) {
        const numAmount = parseFloat(amount);

        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numAmount);
        } catch (error) {
            // Fallback if currency code is invalid
            return `${currencyCode} ${numAmount.toFixed(2)}`;
        }
    }

    /**
     * Format location from location object
     * @param {Object} location - Location object
     * @returns {string} Formatted location string
     */
    formatLocation(location) {
        const parts = [];

        if (location.city) parts.push(location.city);
        if (location.subdivision) parts.push(location.subdivision);
        if (location.country) parts.push(location.country);

        return parts.join(', ') || 'Unknown Location';
    }

    /**
     * Get relative time string (e.g., "2s ago", "1m ago")
     * @param {Date} date - Date to compare
     * @returns {string} Relative time string
     */
    getTimeAgo(date) {
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 10) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        return `${Math.floor(hours / 24)}d ago`;
    }

    /**
     * Update connection status display
     * @param {string} message - Status message
     * @param {boolean} connected - Connection state
     */
    updateStatus(message, connected) {
        const statusEl = document.getElementById('status');
        const timestamp = new Date().toLocaleTimeString();

        statusEl.textContent = `${message} | Last Update: ${timestamp}`;
        statusEl.className = 'status ' + (connected ? 'connected' : 'error');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        console.error('❌', message);

        const ordersListEl = document.getElementById('ordersList');
        ordersListEl.innerHTML = `
            <div style="color: #f44336; font-size: 28px; text-align: center; margin-top: 100px;">
                ⚠️ ${message}
            </div>
        `;

        this.updateStatus('Error', false);
    }
}

// Initialize dashboard when DOM is ready
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    dashboard.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (dashboard) {
        dashboard.stopPolling();
    }
});
