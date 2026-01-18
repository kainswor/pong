/**
 * PixelDisplay - A retro CRT-style pixel display renderer
 * 
 * Emulates a retro pixel display with CRT fade effects.
 * Pixels have two states: ON (retro green) or OFF (black).
 */
export class PixelDisplay {
  constructor(canvas, emulatedWidth = 300, emulatedHeight = 200, displayWidth = 800, displayHeight = 600) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.emulatedWidth = emulatedWidth;
    this.emulatedHeight = emulatedHeight;
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
    
    // Set canvas size
    this.canvas.width = displayWidth;
    this.canvas.height = displayHeight;
    
    // Gap between pixels (1px as specified)
    this.gapWidth = 1;
    this.gapHeight = 1;
    
    // Calculate pixel dimensions accounting for gaps
    this.pixelWidth = (displayWidth - (emulatedWidth - 1) * this.gapWidth) / emulatedWidth;
    this.pixelHeight = (displayHeight - (emulatedHeight - 1) * this.gapHeight) / emulatedHeight;
    
    // CRT color (retro green)
    this.onColor = '#39ff14';
    this.offColor = '#000000';
    
    // Fade timing (in milliseconds)
    this.fadeInTime = 50;  // 0.05s
    this.fadeOutTime = 200; // 0.2s
    
    // Pixel state: 2D array storing { state: boolean, onTimestamp: number, offTimestamp: number }
    this.pixels = [];
    for (let y = 0; y < emulatedHeight; y++) {
      this.pixels[y] = [];
      for (let x = 0; x < emulatedWidth; x++) {
        this.pixels[y][x] = {
          state: false,
          onTimestamp: 0,
          offTimestamp: 0
        };
      }
    }
    
    this.animationFrameId = null;
    this.isRunning = false;

    // Degauss (CRT-style) effect: no stacking, 30s cooldown
    this.lastDegaussEndTime = 0;   // ms; 0 = never
    this.degaussStartTime = 0;     // 0 = not running
    this.degaussDuration = 0;      // ms for current run
    this.degaussStrength = 0;      // 0..1 for current run

    // Full-strength tuning
    this.DEGAUSS_COOLDOWN_MS = 30000;
    this.DEGAUSS_COOLDOWN_MIN_MS = 1000;   // below this: no visible
    this.DEGAUSS_DURATION_BASE_MS = 2000;
    this.DEGAUSS_AMP_PX = 12;
    this.DEGAUSS_OVERLAY_ALPHA = 0.35;
    this.DEGAUSS_DECAY_ALPHA = 2.5;
    this.DEGAUSS_FREQ_HZ = 50;
    this.DEGAUSS_WAVE_K = 2.5;
  }
  
  /**
   * Set a pixel's state (ON or OFF)
   * @param {number} x - X coordinate (0 to emulatedWidth - 1)
   * @param {number} y - Y coordinate (0 to emulatedHeight - 1)
   * @param {boolean} state - true for ON, false for OFF
   */
  setPixel(x, y, state) {
    if (x >= 0 && x < this.emulatedWidth && y >= 0 && y < this.emulatedHeight) {
      const pixel = this.pixels[y][x];
      const now = performance.now();
      if (pixel.state !== state) {
        pixel.state = state;
        if (state) {
          pixel.onTimestamp = now;
        } else {
          pixel.offTimestamp = now;
        }
      }
    }
  }
  
  /**
   * Get a pixel's current state
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} Current state of the pixel
   */
  getPixel(x, y) {
    if (x >= 0 && x < this.emulatedWidth && y >= 0 && y < this.emulatedHeight) {
      return this.pixels[y][x].state;
    }
    return false;
  }
  
  /**
   * Trigger CRT-style degauss: wobble and color distortion.
   * No stacking (ignored while running). 30s cooldown scales effect:
   * at 1s after last end: no visible; at 30s: full. Exponential curve.
   */
  degauss() {
    const now = performance.now();

    // No stacking: ignore if animation still running
    if (this.degaussStartTime !== 0 && (now - this.degaussStartTime) < this.degaussDuration) {
      return;
    }

    // Cooldown strength: elapsed since last end; treat "never" as full cooldown
    const elapsed = this.lastDegaussEndTime === 0
      ? this.DEGAUSS_COOLDOWN_MS
      : now - this.lastDegaussEndTime;
    const x = Math.max(0, Math.min(1,
      (elapsed - this.DEGAUSS_COOLDOWN_MIN_MS) /
      (this.DEGAUSS_COOLDOWN_MS - this.DEGAUSS_COOLDOWN_MIN_MS)
    ));
    const strength = Math.pow(x, 1.5);

    // No visible run: advance cooldown and return
    if (strength < 0.01) {
      this.lastDegaussEndTime = now;
      return;
    }

    this.degaussStartTime = now;
    this.degaussDuration = this.DEGAUSS_DURATION_BASE_MS * strength;
    this.degaussStrength = strength;
  }

  /**
   * Clear all pixels (set all to OFF)
   */
  clear() {
    const now = performance.now();
    for (let y = 0; y < this.emulatedHeight; y++) {
      for (let x = 0; x < this.emulatedWidth; x++) {
        this.pixels[y][x].state = false;
        this.pixels[y][x].offTimestamp = now;
      }
    }
  }
  
  /**
   * Calculate the brightness/alpha for a pixel based on its state and fade timing
   * @param {Object} pixel - Pixel object with state, onTimestamp, and offTimestamp
   * @param {number} currentTime - Current time in milliseconds
   * @returns {number} Brightness value between 0 and 1
   */
  calculateBrightness(pixel, currentTime) {
    let fadeInBrightness = 0;
    let fadeOutBrightness = 0;
    
    // Calculate fade-in brightness (if pixel is ON or recently turned ON)
    if (pixel.onTimestamp > 0) {
      const onElapsed = currentTime - pixel.onTimestamp;
      if (pixel.state) {
        // Currently ON - calculate fade-in
        if (onElapsed < this.fadeInTime) {
          fadeInBrightness = onElapsed / this.fadeInTime;
        } else {
          fadeInBrightness = 1.0; // Fully on
        }
      }
    }
    
    // Calculate fade-out brightness (if pixel is OFF or recently turned OFF)
    if (pixel.offTimestamp > 0) {
      const offElapsed = currentTime - pixel.offTimestamp;
      if (!pixel.state) {
        // Currently OFF - calculate fade-out
        if (offElapsed < this.fadeOutTime) {
          const t = offElapsed / this.fadeOutTime;
          fadeOutBrightness = Math.pow(1 - t, 6);
        } else {
          fadeOutBrightness = 0.0; // Fully off
        }
      } else {
        // Currently ON but was recently OFF - still calculate fade-out
        if (offElapsed < this.fadeOutTime) {
          const t = offElapsed / this.fadeOutTime;
          fadeOutBrightness = Math.pow(1 - t, 6);
        }
      }
    }
    
    // Return the maximum of fade-in and fade-out (never exceed 1.0)
    return Math.min(1.0, Math.max(fadeInBrightness, fadeOutBrightness));
  }
  
  /**
   * Render a single frame
   */
  render() {
    const currentTime = performance.now();

    // Degauss: end check
    if (this.degaussStartTime !== 0 && (currentTime - this.degaussStartTime) >= this.degaussDuration) {
      this.degaussStartTime = 0;
      this.lastDegaussEndTime = currentTime;
    }
    const degaussActive = this.degaussStartTime !== 0;
    let overlayAlpha = 0, t_sec = 0, decay = 0, f = 0, k = 0, A = 0;
    if (degaussActive) {
      t_sec = (currentTime - this.degaussStartTime) / 1000;
      decay = Math.exp(-this.DEGAUSS_DECAY_ALPHA * t_sec);
      overlayAlpha = decay * this.degaussStrength * this.DEGAUSS_OVERLAY_ALPHA;
      f = this.DEGAUSS_FREQ_HZ;
      k = this.DEGAUSS_WAVE_K;
      A = this.DEGAUSS_AMP_PX * this.degaussStrength;
    }

    // Clear canvas with black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

    if (!degaussActive) {
      // Neutral state: original logic only (pixels[y][x], no sampling)
      for (let y = 0; y < this.emulatedHeight; y++) {
        for (let x = 0; x < this.emulatedWidth; x++) {
          const pixel = this.pixels[y][x];
          const brightness = this.calculateBrightness(pixel, currentTime);
          if (brightness > 0) {
            const pixelX = x * (this.pixelWidth + this.gapWidth);
            const pixelY = y * (this.pixelHeight + this.gapHeight);
            const r = parseInt(this.onColor.substring(1, 3), 16);
            const g = parseInt(this.onColor.substring(3, 5), 16);
            const b = parseInt(this.onColor.substring(5, 7), 16);
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness})`;
            this.ctx.fillRect(pixelX, pixelY, this.pixelWidth, this.pixelHeight);
          }
        }
      }
    } else {
      // Degauss: fixed grid, sample from warped (x_src,y_src)
      const stepX = this.pixelWidth + this.gapWidth;
      const stepY = this.pixelHeight + this.gapHeight;
      for (let y = 0; y < this.emulatedHeight; y++) {
        for (let x = 0; x < this.emulatedWidth; x++) {
          const pixelX = x * stepX;
          const pixelY = y * stepY;
          const nx = pixelX / this.displayWidth;
          const ny = pixelY / this.displayHeight;
          const r = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2) * 2;
          const edge = 0.4 + 0.6 * Math.min(1, r);
          const dx = A * edge * decay * Math.sin(2 * Math.PI * f * t_sec + 2 * Math.PI * k * nx);
          const dy = A * edge * decay * Math.sin(2 * Math.PI * f * t_sec + Math.PI / 2 + 2 * Math.PI * k * ny);
          const x_src = (pixelX - dx) / stepX;
          const y_src = (pixelY - dy) / stepY;
          const ix = Math.max(0, Math.min(this.emulatedWidth - 1, Math.floor(x_src)));
          const iy = Math.max(0, Math.min(this.emulatedHeight - 1, Math.floor(y_src)));
          const pixel = this.pixels[iy][ix];
          const brightness = this.calculateBrightness(pixel, currentTime);
          if (brightness > 0) {
            const rC = parseInt(this.onColor.substring(1, 3), 16);
            const g = parseInt(this.onColor.substring(3, 5), 16);
            const b = parseInt(this.onColor.substring(5, 7), 16);
            this.ctx.fillStyle = `rgba(${rC}, ${g}, ${b}, ${brightness})`;
            this.ctx.fillRect(pixelX, pixelY, this.pixelWidth, this.pixelHeight);
          }
        }
      }
    }

    if (degaussActive) {
      this.ctx.fillStyle = `rgba(255, 0, 255, ${overlayAlpha})`;
      this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
    }
  }
  
  /**
   * Start the render loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    const renderLoop = () => {
      if (!this.isRunning) return;
      
      this.render();
      this.animationFrameId = requestAnimationFrame(renderLoop);
    };
    
    renderLoop();
  }
  
  /**
   * Stop the render loop
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
