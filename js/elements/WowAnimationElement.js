import { BaseElement } from '../core/BaseElement.js';

/**
 * WowAnimationElement - PNG sequence overlay animation
 * Plays a responsive WOW animation overlay on top of all content
 */
export class WowAnimationElement extends BaseElement {
  constructor(id, config) {
    super(id, {
      ...config,
      type: 'wowAnimation',
      config: {
        frameCount: config.frameCount || 180,
        frameRate: config.frameRate || 30, // frames per second
        basePath: config.basePath || 'assets/WOW/WOW_',
        fileExtension: config.fileExtension || '.png',
        ...config.config
      }
    });

    this.frames = [];
    this.currentFrame = 0;
    this.isPlaying = false;
    this.isLoaded = false;
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.config.frameRate; // milliseconds per frame

    this.canvas = null;
    this.ctx = null;

    // Cache scaling calculations
    this.cachedScale = null;
    this.cachedDrawParams = null;
  }

  createElement() {
    // Create fixed overlay container
    // Note: BaseElement will wrap this in a positioned container,
    // but we override it to be fixed in onInit
    const container = document.createElement('div');
    container.className = 'wow-animation-overlay';

    // Create responsive canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
    `;

    // GPU-optimized context with performance hints
    this.ctx = this.canvas.getContext('2d', {
      alpha: true,  // Need transparency for overlay
      desynchronized: true,  // Reduce latency for animations
      willReadFrequently: false  // We're writing, not reading
    });

    // Disable image smoothing for faster rendering
    this.ctx.imageSmoothingEnabled = false;

    container.appendChild(this.canvas);

    // Set canvas resolution to match viewport
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    return container;
  }

  onInit() {
    // console.log('WowAnimationElement: Initializing...');
    // console.log('Container:', this.container);
    // console.log('Canvas element:', this.canvas);
    
    // Override BaseElement's positioning to make this a fixed overlay
    // Use setProperty with 'important' priority
    if (this.container) {
      this.container.style.setProperty('position', 'fixed', 'important');
      this.container.style.setProperty('top', '0', 'important');
      this.container.style.setProperty('left', '0', 'important');
      this.container.style.setProperty('width', '100vw', 'important');
      this.container.style.setProperty('height', '100vh', 'important');
      this.container.style.setProperty('pointer-events', 'none', 'important');
    }
    
    this.preloadFrames();
  }

  /**
   * Override updatePosition to prevent BaseElement from changing our fixed positioning
   */
  updatePosition() {
    // Do nothing - we want to stay fixed to viewport
  }

  /**
   * Resize canvas to match viewport while maintaining aspect ratio
   */
  resizeCanvas() {
    if (!this.canvas) return;

    // Limit DPR to max 2 for performance (reduces pixel count significantly)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Use viewport dimensions for fixed overlay
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;

    this.ctx.scale(dpr, dpr);

    // Invalidate cached draw parameters on resize
    this.cachedDrawParams = null;
  }

  /**
   * Preload all PNG frames
   */
  async preloadFrames() {
    // console.log(`WowAnimationElement: Preloading ${this.config.frameCount} frames from ${this.config.basePath}...`);

    const loadPromises = [];

    for (let i = 0; i < this.config.frameCount; i++) {
      const frameNumber = String(i).padStart(5, '0');
      const framePath = `${this.config.basePath}${frameNumber}${this.config.fileExtension}`;

      const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.frames[i] = img;
          resolve();
        };
        img.onerror = () => {
          // console.warn(`Failed to load frame: ${framePath}`);
          reject();
        };
        img.src = framePath;
      });

      loadPromises.push(promise);
    }

    try {
      await Promise.all(loadPromises);
      this.isLoaded = true;
      // console.log('WowAnimationElement: All frames loaded successfully');
    } catch (error) {
      // console.error('WowAnimationElement: Error loading frames', error);
    }
  }

  /**
   * Play the animation once
   */
  play() {
    if (!this.isLoaded) {
      // console.warn('WowAnimationElement: Frames not loaded yet');
      return;
    }

    if (this.isPlaying) {
      // console.warn('WowAnimationElement: Animation already playing');
      return;
    }

    // console.log('🎉 Starting WOW animation playback');

    this.isPlaying = true;
    this.currentFrame = 0;
    
    // Make the BaseElement container visible
    if (this.container) {
      this.container.style.visibility = 'visible';
    }
    
    this.lastFrameTime = performance.now();
    this.animate(performance.now());
  }

  /**
   * Animation loop
   */
  animate(currentTime) {
    if (!this.isPlaying) return;

    const elapsed = currentTime - this.lastFrameTime;

    // Check if enough time has passed for next frame
    if (elapsed >= this.frameInterval) {
      this.drawFrame(this.currentFrame);
      this.currentFrame++;
      this.lastFrameTime = currentTime;

      // Check if animation is complete
      if (this.currentFrame >= this.config.frameCount) {
        this.stop();
        return;
      }
    }

    // Continue animation
    this.animationFrameId = requestAnimationFrame((time) => this.animate(time));
  }

  /**
   * Draw a specific frame to canvas
   */
  drawFrame(frameIndex) {
    if (!this.ctx || !this.frames[frameIndex]) return;

    const img = this.frames[frameIndex];

    // Cache draw parameters (only recalculate on resize or first frame)
    if (!this.cachedDrawParams) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvasWidth = this.canvas.width / dpr;
      const canvasHeight = this.canvas.height / dpr;

      // Calculate scaling to COVER canvas while maintaining aspect ratio
      const scale = Math.max(
        canvasWidth / img.width,
        canvasHeight / img.height
      );

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Center the image
      const x = (canvasWidth - scaledWidth) / 2;
      const y = (canvasHeight - scaledHeight) / 2;

      this.cachedDrawParams = {
        canvasWidth,
        canvasHeight,
        x,
        y,
        scaledWidth,
        scaledHeight
      };
    }

    const { canvasWidth, canvasHeight, x, y, scaledWidth, scaledHeight } = this.cachedDrawParams;

    // Clear canvas with transparency
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw image with cached parameters
    this.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
  }

  /**
   * Stop animation
   */
  stop() {
    // console.log('🎉 WOW animation playback complete');
    
    this.isPlaying = false;
    this.currentFrame = 0;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Hide the BaseElement container
    if (this.container) {
      this.container.style.visibility = 'hidden';
    }

    // Clear canvas
    if (this.ctx && this.cachedDrawParams) {
      const { canvasWidth, canvasHeight } = this.cachedDrawParams;
      this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    window.removeEventListener('resize', () => this.resizeCanvas());
    super.destroy();
  }
}
