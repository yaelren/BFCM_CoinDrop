/**
 * Animated Background Manager
 * Handles PNG sequence animation for the dashboard background
 */

class BackgroundAnimation {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { 
            alpha: false,
            desynchronized: true // Better performance
        });
        
        // Configuration
        this.frameFolder = options.frameFolder || 'assets/Animated_Bord/';
        this.framePrefix = options.framePrefix || 'Animated_Bord_';
        this.frameExt = options.frameExt || '.png';
        this.totalFrames = options.totalFrames || 360;
        this.fps = options.fps || 30;
        this.loop = options.loop !== false;
        
        // Performance optimizations
        this.frameStep = options.frameStep || 2; // Skip frames (2 = use every other frame)
        this.preloadBatchSize = options.preloadBatchSize || 10; // Load frames in batches
        this.useReducedFrames = this.totalFrames > 100; // Auto-optimize for large sequences
        
        // State
        this.currentFrame = 0;
        this.frames = [];
        this.loadedFrames = new Set();
        this.isPlaying = false;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / this.fps;
        this.animationFrameId = null;
        
        // Performance tracking
        this.frameCount = 0;
        this.fpsDisplay = 0;
        this.lastFpsUpdate = 0;
        
        this.init();
    }
    
    init() {
        // Setup canvas with better performance
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.objectFit = 'contain';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.imageRendering = 'auto'; // Better quality
        
        // Insert canvas as first child
        this.container.insertBefore(this.canvas, this.container.firstChild);
        
        // Set canvas resolution
        this.resizeCanvas();
        
        // Debounced resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resizeCanvas(), 150);
        });
        
        // Start progressive loading
        this.progressiveLoad();
    }
    
    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        // Use device pixel ratio for crisp rendering but cap it for performance
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
    }
    
    progressiveLoad() {
        const framesToLoad = [];
        
        // Determine which frames to actually load based on frameStep
        for (let i = 0; i < this.totalFrames; i += this.frameStep) {
            framesToLoad.push(i);
        }
        
        // console.log(`Loading ${framesToLoad.length} frames (every ${this.frameStep} frame${this.frameStep > 1 ? 's' : ''})...`);
        
        // Load in batches for better performance
        let currentBatch = 0;
        const loadBatch = () => {
            const start = currentBatch * this.preloadBatchSize;
            const end = Math.min(start + this.preloadBatchSize, framesToLoad.length);
            
            if (start >= framesToLoad.length) {
                // console.log(`Background animation ready: ${this.loadedFrames.size} frames loaded`);
                this.play();
                return;
            }
            
            let batchLoaded = 0;
            const batchSize = end - start;
            
            for (let i = start; i < end; i++) {
                const frameIndex = framesToLoad[i];
                const img = new Image();
                const frameNumber = String(frameIndex).padStart(5, '0');
                img.src = `${this.frameFolder}${this.framePrefix}${frameNumber}${this.frameExt}`;
                
                img.onload = () => {
                    this.loadedFrames.add(frameIndex);
                    batchLoaded++;
                    
                    // Start playing after first batch loads
                    if (currentBatch === 0 && batchLoaded === batchSize) {
                        // console.log('First batch loaded, starting animation...');
                        this.play();
                    }
                    
                    if (batchLoaded === batchSize) {
                        currentBatch++;
                        setTimeout(loadBatch, 50); // Small delay between batches
                    }
                };
                
                img.onerror = () => {
                    // console.warn(`Failed to load frame ${frameIndex}`);
                    batchLoaded++;
                    if (batchLoaded === batchSize) {
                        currentBatch++;
                        setTimeout(loadBatch, 50);
                    }
                };
                
                this.frames[frameIndex] = img;
            }
        };
        
        loadBatch();
    }
    
    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.lastFpsUpdate = performance.now();
        this.frameCount = 0;
        this.animate(this.lastFrameTime);
    }
    
    pause() {
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    stop() {
        this.pause();
        this.currentFrame = 0;
        this.render();
    }
    
    animate = (currentTime) => {
        if (!this.isPlaying) return;
        
        this.animationFrameId = requestAnimationFrame(this.animate);
        
        const deltaTime = currentTime - this.lastFrameTime;
        
        if (deltaTime >= this.frameInterval) {
            this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
            
            this.render();
            
            // Update FPS counter
            this.frameCount++;
            if (currentTime - this.lastFpsUpdate >= 1000) {
                this.fpsDisplay = this.frameCount;
                this.frameCount = 0;
                this.lastFpsUpdate = currentTime;
            }
            
            // Advance frame with step
            this.currentFrame += this.frameStep;
            if (this.currentFrame >= this.totalFrames) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.pause();
                }
            }
        }
    }
    
    render() {
        // Find nearest loaded frame
        let frameToRender = this.currentFrame;
        
        // If exact frame isn't loaded, find nearest loaded frame
        if (!this.loadedFrames.has(frameToRender)) {
            // Search backward first (smoother)
            for (let i = 0; i < this.frameStep * 2; i++) {
                const candidate = frameToRender - i;
                if (candidate >= 0 && this.loadedFrames.has(candidate)) {
                    frameToRender = candidate;
                    break;
                }
            }
        }
        
        const frame = this.frames[frameToRender];
        if (!frame || !frame.complete) return;
        
        // Get actual canvas display size (not scaled size)
        const displayWidth = this.canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
        const displayHeight = this.canvas.height / (Math.min(window.devicePixelRatio || 1, 2));
        
        // Clear canvas
        this.ctx.clearRect(0, 0, displayWidth, displayHeight);
        
        // Calculate aspect ratio scaling
        const imgAspect = frame.width / frame.height;
        const canvasAspect = displayWidth / displayHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (canvasAspect > imgAspect) {
            drawWidth = displayWidth;
            drawHeight = drawWidth / imgAspect;
            drawX = 0;
            drawY = (displayHeight - drawHeight) / 2;
        } else {
            drawHeight = displayHeight;
            drawWidth = drawHeight * imgAspect;
            drawX = (displayWidth - drawWidth) / 2;
            drawY = 0;
        }
        
        // Draw the frame
        this.ctx.drawImage(frame, drawX, drawY, drawWidth, drawHeight);
    }
    
    setFPS(fps) {
        this.fps = fps;
        this.frameInterval = 1000 / this.fps;
    }
    
    setFrameStep(step) {
        this.frameStep = Math.max(1, Math.floor(step));
        // console.log(`Frame step set to ${this.frameStep} (using every ${this.frameStep}${this.frameStep === 1 ? 'st' : this.frameStep === 2 ? 'nd' : 'th'} frame)`);
    }
    
    jumpToFrame(frameNumber) {
        if (frameNumber >= 0 && frameNumber < this.totalFrames) {
            this.currentFrame = frameNumber;
            this.render();
        }
    }
    
    getFPS() {
        return this.fpsDisplay;
    }
    
    getStats() {
        return {
            actualFPS: this.fpsDisplay,
            targetFPS: this.fps,
            currentFrame: this.currentFrame,
            totalFrames: this.totalFrames,
            loadedFrames: this.loadedFrames.size,
            frameStep: this.frameStep,
            isPlaying: this.isPlaying
        };
    }
}

// Export for use in other scripts
window.BackgroundAnimation = BackgroundAnimation;
