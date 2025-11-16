// BFCM LED Screen Dashboard
// Optimized for large display screens with auto-scrolling and animations

class LEDDashboard {
    constructor() {
        this.pollingIntervals = {
            totals: null,
            orders: null
        };
        this.pollingFrequency = {
            totals: 3000,  // 3 seconds
            orders: 2000   // 2 seconds
        };
        this.ordersQueue = [];
        this.maxDisplayOrders = 10;
        this.scrollPosition = 0;
    }

    /**
     * Initialize the LED dashboard
     */
    async init() {
        console.log('🚀 Initializing LED Dashboard...');

        // Test API connection
        const connected = await api.testConnection();

        if (!connected) {
            this.showError('Unable to connect to API');
            return;
        }

        // Initial data fetch
        await this.updateTotals();
        await this.updateOrders();

        // Start polling
        this.startPolling();

        this.updateLastUpdate();
        setInterval(() => this.updateLastUpdate(), 1000);

        console.log('✅ LED Dashboard initialized');
    }

    /**
     * Start polling for data updates
     */
    startPolling() {
        this.pollingIntervals.totals = setInterval(async () => {
            await this.updateTotals();
        }, this.pollingFrequency.totals);

        this.pollingIntervals.orders = setInterval(async () => {
            await this.updateOrders();
        }, this.pollingFrequency.orders);

        console.log('🔄 LED Polling started');
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
        console.log('⏸️ LED Polling stopped');
    }

    /**
     * Update totals with animation
     */
    async updateTotals() {
        try {
            const data = await api.fetchTotals();

            this.animateValue('ledTotalOrders', data.orders_count, true);
            this.animateValue('ledTotalGMV', data.gpv, false, true);
            this.animateValue('ledAvgOrder', data.aov, false, true);

        } catch (error) {
            console.error('Failed to update LED totals:', error);
        }
    }

    /**
     * Animate counter values
     * @param {string} elementId - Element ID to update
     * @param {number} endValue - Target value
     * @param {boolean} isNumber - Format as number (true) or currency (false)
     * @param {boolean} isCurrency - Format as currency
     */
    animateValue(elementId, endValue, isNumber = false, isCurrency = false) {
        const element = document.getElementById(elementId);
        const currentText = element.textContent.replace(/[^0-9.]/g, '');
        const startValue = parseFloat(currentText) || 0;
        const duration = 500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = startValue + (endValue - startValue) * progress;

            if (isNumber) {
                element.textContent = this.formatNumber(Math.round(currentValue));
            } else if (isCurrency) {
                element.textContent = this.formatCurrency(currentValue);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Update orders with ticker animation
     */
    async updateOrders() {
        try {
            const orders = await api.fetchOrders();

            // Keep only the most recent orders for display
            this.ordersQueue = orders.slice(0, this.maxDisplayOrders);
            this.renderOrders();

        } catch (error) {
            console.error('Failed to update LED orders:', error);
        }
    }

    /**
     * Render orders in ticker format
     */
    renderOrders() {
        const ticker = document.getElementById('ledOrdersTicker');

        const ordersHTML = this.ordersQueue.map((order) => {
            const timeAgo = this.getTimeAgo(new Date(order.date));
            const location = this.formatLocation(order.location);
            const amount = this.formatCurrencyWithCode(order.amount, order.currency);

            // Extract metadata
            const metadata = order.metadata || {};
            const businessName = metadata.business_name || 'Unknown Business';
            const businessConfig = metadata.business_config || 'UNKNOWN';
            const itemsCount = order.items?.length || 0;

            return `
                <div class="led-order-item">
                    <div class="order-number">#${order.order_id || 'N/A'}</div>
                    <div class="order-store">
                        <div>${businessName}</div>
                        <div class="order-items">${itemsCount} item${itemsCount !== 1 ? 's' : ''} • ${location}</div>
                    </div>
                    <div class="order-total">${amount}</div>
                </div>
            `;
        }).join('');

        ticker.innerHTML = ordersHTML;
    }

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    }

    /**
     * Format currency in USD
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Format currency with specific currency code
     */
    formatCurrencyWithCode(amount, currencyCode) {
        const numAmount = parseFloat(amount);

        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(numAmount);
        } catch (error) {
            return `${currencyCode} ${Math.round(numAmount)}`;
        }
    }

    /**
     * Format location from location object
     */
    formatLocation(location) {
        const parts = [];

        if (location.city) parts.push(location.city);
        if (location.country) parts.push(location.country);

        return parts.join(', ') || 'Unknown';
    }

    /**
     * Get relative time string
     */
    getTimeAgo(date) {
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 10) return 'JUST NOW';
        if (seconds < 60) return `${seconds}S AGO`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}M AGO`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}H AGO`;

        return `${Math.floor(hours / 24)}D AGO`;
    }

    /**
     * Update last update timestamp
     */
    updateLastUpdate() {
        const element = document.getElementById('ledLastUpdate');
        const now = new Date();
        element.textContent = `LAST UPDATE: ${now.toLocaleTimeString()}`;
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('❌', message);
        const ticker = document.getElementById('ledOrdersTicker');
        ticker.innerHTML = `
            <div class="loading" style="color: #ff0080;">
                ⚠️ ${message}
            </div>
        `;
    }
}

// Initialize LED dashboard when DOM is ready
let ledDashboard;

document.addEventListener('DOMContentLoaded', () => {
    ledDashboard = new LEDDashboard();
    ledDashboard.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (ledDashboard) {
        ledDashboard.stopPolling();
    }
});
