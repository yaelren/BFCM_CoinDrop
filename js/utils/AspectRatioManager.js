/**
 * AspectRatioManager
 * Manages responsive background video/image switching based on viewport aspect ratio
 * Switches between ultrawide (4640:1760) and standard (16:9) aspect ratios
 */

export class AspectRatioManager {
    constructor() {
        // Design aspect ratios
        this.ULTRAWIDE_RATIO = 4640 / 1760; // ~2.636
        this.STANDARD_RATIO = 16 / 9; // ~1.778

        // Tolerance for aspect ratio matching (5% tolerance)
        this.RATIO_TOLERANCE = 0.05;

        this.currentMode = null;
        this.callbacks = [];
    }

    /**
     * Initialize the aspect ratio manager
     * @param {Function} callback - Callback function when aspect ratio changes
     */
    init(callback) {
        if (callback) {
            this.callbacks.push(callback);
        }

        // Initial check
        this.checkAspectRatio();

        // Watch for window resize
        window.addEventListener('resize', () => this.checkAspectRatio());

        // Watch for orientation changes on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.checkAspectRatio(), 100);
        });
    }

    /**
     * Check current viewport aspect ratio and update mode
     */
    checkAspectRatio() {
        const viewportRatio = window.innerWidth / window.innerHeight;
        const newMode = this.detectMode(viewportRatio);

        // Only trigger callbacks if mode changed
        if (newMode !== this.currentMode) {
            const previousMode = this.currentMode;
            this.currentMode = newMode;

            // Notify all callbacks
            this.callbacks.forEach(cb => cb(newMode, previousMode, viewportRatio));
        }
    }

    /**
     * Detect which mode to use based on viewport ratio
     * @param {number} viewportRatio - Current viewport aspect ratio
     * @returns {string} 'ultrawide' or 'standard'
     */
    detectMode(viewportRatio) {
        // Calculate how close we are to each target ratio
        const ultrawideDistance = Math.abs(viewportRatio - this.ULTRAWIDE_RATIO) / this.ULTRAWIDE_RATIO;
        const standardDistance = Math.abs(viewportRatio - this.STANDARD_RATIO) / this.STANDARD_RATIO;

        // If viewport is closer to ultrawide ratio, use ultrawide background
        if (ultrawideDistance < standardDistance && ultrawideDistance < this.RATIO_TOLERANCE) {
            return 'ultrawide';
        }

        // Otherwise use standard 16:9 background
        return 'standard';
    }

    /**
     * Get current aspect ratio mode
     * @returns {string} 'ultrawide' or 'standard'
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * Check if current mode is ultrawide
     * @returns {boolean}
     */
    isUltrawide() {
        return this.currentMode === 'ultrawide';
    }

    /**
     * Check if current mode is standard
     * @returns {boolean}
     */
    isStandard() {
        return this.currentMode === 'standard';
    }

    /**
     * Add a callback for aspect ratio changes
     * @param {Function} callback
     */
    onRatioChange(callback) {
        this.callbacks.push(callback);
    }

    /**
     * Remove a callback
     * @param {Function} callback
     */
    offRatioChange(callback) {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }

    /**
     * Get debug information
     * @returns {Object}
     */
    getDebugInfo() {
        const viewportRatio = window.innerWidth / window.innerHeight;
        return {
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            viewportRatio: viewportRatio.toFixed(3),
            currentMode: this.currentMode,
            ultrawideRatio: this.ULTRAWIDE_RATIO.toFixed(3),
            standardRatio: this.STANDARD_RATIO.toFixed(3),
            ultrawideDistance: Math.abs(viewportRatio - this.ULTRAWIDE_RATIO).toFixed(3),
            standardDistance: Math.abs(viewportRatio - this.STANDARD_RATIO).toFixed(3)
        };
    }
}

// Create singleton instance
export const aspectRatioManager = new AspectRatioManager();
