import { BaseElement } from '../core/BaseElement.js';

/**
 * WowVideoElement - WebM video overlay animation
 * Plays a hardware-accelerated transparent video overlay
 * Much more performant than PNG sequence canvas animation
 */
export class WowVideoElement extends BaseElement {
  constructor(id, config) {
    super(id, {
      ...config,
      type: 'wowVideo',
      config: {
        videoSrc: config.videoSrc || 'assets/WOW_animation.webm',
        playbackRate: config.playbackRate || 1.0, // Speed: 0.5 = half speed, 2.0 = double speed
        ...config.config
      }
    });

    this.video = null;
    this.isPlaying = false;
  }

  createElement() {
    // Create fixed overlay container
    const container = document.createElement('div');
    container.className = 'wow-video-overlay';

    // Create video element with transparency support
    this.video = document.createElement('video');
    this.video.src = this.config.videoSrc;
    this.video.preload = 'auto';
    this.video.playsInline = true;
    this.video.muted = true; // Required for autoplay policies

    this.video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    `;

    // Event listeners
    this.video.addEventListener('ended', () => this.onVideoEnded());
    this.video.addEventListener('loadeddata', () => {
      console.log('WowVideoElement: Video loaded and ready');
    });
    this.video.addEventListener('error', (e) => {
      console.error('WowVideoElement: Video error', e);
    });

    container.appendChild(this.video);

    return container;
  }

  onInit() {
    console.log('WowVideoElement: Initializing...');

    // Override BaseElement's positioning to make this a fixed overlay
    if (this.container) {
      this.container.style.setProperty('position', 'fixed', 'important');
      this.container.style.setProperty('top', '0', 'important');
      this.container.style.setProperty('left', '0', 'important');
      this.container.style.setProperty('width', '100vw', 'important');
      this.container.style.setProperty('height', '100vh', 'important');
      this.container.style.setProperty('pointer-events', 'none', 'important');
      this.container.style.setProperty('z-index', '9999', 'important');
    }
  }

  /**
   * Override updatePosition to prevent BaseElement from changing our fixed positioning
   */
  updatePosition() {
    // Do nothing - we want to stay fixed to viewport
  }

  /**
   * Play the video animation once
   */
  play() {
    if (this.isPlaying) {
      console.warn('WowVideoElement: Animation already playing');
      return;
    }

    console.log('🎉 Starting WOW video playback');

    this.isPlaying = true;

    // Make the container visible
    if (this.container) {
      this.container.style.visibility = 'visible';
    }

    // Set playback speed and reset to start
    this.video.playbackRate = this.config.playbackRate;
    this.video.currentTime = 0;
    const playPromise = this.video.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('WowVideoElement: Play failed', error);
        this.isPlaying = false;
      });
    }
  }

  /**
   * Called when video playback ends
   */
  onVideoEnded() {
    console.log('🎉 WOW video playback complete');
    this.stop();
  }

  /**
   * Stop video playback
   */
  stop() {
    this.isPlaying = false;

    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0;
    }

    // Hide the container
    if (this.container) {
      this.container.style.visibility = 'hidden';
    }
  }

  /**
   * Set playback speed
   * @param {number} speed - Playback rate (0.25 to 4.0)
   *   0.5 = half speed (slower)
   *   1.0 = normal speed
   *   2.0 = double speed (faster)
   */
  setPlaybackRate(speed) {
    this.config.playbackRate = Math.max(0.25, Math.min(4.0, speed));
    if (this.video) {
      this.video.playbackRate = this.config.playbackRate;
    }
    console.log(`WowVideoElement: Playback rate set to ${this.config.playbackRate}x`);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();

    if (this.video) {
      this.video.removeEventListener('ended', () => this.onVideoEnded());
      this.video.src = '';
      this.video.load();
    }

    super.destroy();
  }
}
