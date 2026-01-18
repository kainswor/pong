import { PixelDisplay } from './pixel-display.js';

/**
 * PlayerController - Base class for paddle control
 */
class PlayerController {
  update(paddle, ball, gameState) {
    // Returns: 'up', 'down', or null
    return null;
  }
}

/**
 * KeyboardController - Controls paddle with arrow keys
 */
class KeyboardController extends PlayerController {
  constructor() {
    super();
    this.keys = {
      ArrowUp: false,
      ArrowDown: false
    };
    
    document.addEventListener('keydown', (e) => {
      if (this.keys.hasOwnProperty(e.key)) {
        e.preventDefault();
        this.keys[e.key] = true;
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (this.keys.hasOwnProperty(e.key)) {
        e.preventDefault();
        this.keys[e.key] = false;
      }
    });
  }
  
  update(paddle, ball, gameState) {
    if (this.keys.ArrowUp) return 'up';
    if (this.keys.ArrowDown) return 'down';
    return null;
  }
}

/**
 * AIController - AI counterplayer with skill-based behavior
 */
class AIController extends PlayerController {
  constructor(skill = 0.5) {
    super();
    this.skill = skill; // 0.0-1.0, where 0.5 is normal
    this.targetY = 0;
    this.currentVelocity = 0;
    this.lastDirection = 0; // -1 down, 0 neutral, 1 up
    this.directionChangeTime = 0;
    this.reactionDelay = 0;
    this.reacting = false;
    
    // Skill-based parameters
    this.maxReactionTime = 500; // ms - increased for slower reactions
    this.minReactionTime = 150; // ms - increased so nothing is instant
    this.maxAccelRate = 0.0225; // Reduced by 25% from 0.03
    this.minAccelRate = 0.0075; // Reduced by 25% from 0.01
    this.smoothingFactor = 0.15; // Smoothing factor for velocity interpolation (0-1, lower = smoother)
  }
  
  update(paddle, ball, gameState) {
    // Update target - track ball's vertical position
    this.targetY = ball.y;
    
    // Detect direction change (ball's vertical velocity)
    const currentDir = ball.vy > 0 ? 1 : (ball.vy < 0 ? -1 : 0);
    if (currentDir !== this.lastDirection && currentDir !== 0) {
      // Direction changed - trigger reaction delay
      this.reacting = true;
      this.directionChangeTime = performance.now();
      
      // Calculate reaction delay based on skill
      // Lower skill = longer base delay
      const baseDelay = this.minReactionTime + 
                       (1.0 - this.skill) * (this.maxReactionTime - this.minReactionTime);
      // Add random variation: ±80% of base delay (more erratic)
      const randomVariation = (Math.random() - 0.5) * 1.6 * baseDelay;
      this.reactionDelay = Math.max(0, baseDelay + randomVariation);
    }
    this.lastDirection = currentDir;
    
    // Check if reaction delay has passed
    if (this.reacting) {
      const elapsed = performance.now() - this.directionChangeTime;
      if (elapsed < this.reactionDelay) {
        // Still reacting - continue current velocity (don't accelerate)
        // Apply current velocity to paddle
        paddle.y += this.currentVelocity;
        return this.getDirectionFromVelocity();
      }
      this.reacting = false;
    }
    
    // Calculate acceleration rate from skill
    // Higher skill = faster acceleration
    const accelRate = this.minAccelRate + 
                     this.skill * (this.maxAccelRate - this.minAccelRate);
    
    // Calculate desired direction based on target position
    const paddleCenterY = paddle.y + paddle.height / 2;
    const distance = this.targetY - paddleCenterY;
    const threshold = 2; // Small threshold to prevent jitter
    
    // Calculate target velocity (where we want to go)
    const maxSpeed = paddle.speed; // PADDLE_SPEED
    let targetVelocity = 0;
    if (Math.abs(distance) < threshold) {
      // Close enough - target is to stop
      targetVelocity = 0;
    } else {
      // Calculate target velocity based on distance and max speed
      const direction = distance > 0 ? 1 : -1;
      // Scale target velocity based on distance (closer = slower approach)
      const distanceFactor = Math.min(1.0, Math.abs(distance) / 20); // Normalize distance
      targetVelocity = direction * maxSpeed * distanceFactor;
    }
    
    // Smoothly interpolate current velocity towards target velocity
    // This creates smooth, natural motion
    this.currentVelocity += (targetVelocity - this.currentVelocity) * this.smoothingFactor;
    
    // Limit velocity to 95% of max paddle speed (CRITICAL - never exceed human player speed)
    const aiMaxSpeed = maxSpeed * 0.95; // 95% of human speed
    this.currentVelocity = Math.max(-aiMaxSpeed, Math.min(aiMaxSpeed, this.currentVelocity));
    
    // Update paddle position directly
    paddle.y += this.currentVelocity;
    
    // Return direction for consistency (not used by AI, but kept for interface)
    return this.getDirectionFromVelocity();
  }
  
  getDirectionFromVelocity() {
    if (Math.abs(this.currentVelocity) < 0.1) return null;
    return this.currentVelocity > 0 ? 'down' : 'up';
  }
}

/**
 * Pixel Font - 5x7 grid for digits 0-9
 */
const PIXEL_FONT = {
  0: [
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1]
  ],
  1: [
    [0,0,1,0,0],
    [0,1,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,1,1,1,0]
  ],
  2: [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1]
  ],
  3: [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,1]
  ],
  4: [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1]
  ],
  5: [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,1]
  ],
  6: [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1]
  ],
  7: [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1]
  ],
  8: [
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1]
  ],
  9: [
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,1]
  ]
};

/**
 * Pong Game
 */
class Pong {
  constructor(display) {
    this.display = display;
    this.width = display.emulatedWidth;
    this.height = display.emulatedHeight;
    
    // Game constants
    this.PADDLE_WIDTH = 2;
    this.PADDLE_HEIGHT = 14;
    this.PADDLE_SPEED = 1.8; // 90% of 2.0
    this.BALL_SPEED = 1.0;
    
    // Paddle positions
    this.PADDLE_LEFT_X = 2;
    this.PADDLE_RIGHT_X = this.width - 4;
    
    // Game state
    this.gameState = 'MENU'; // 'MENU', 'COUNTDOWN', 'PLAYING', 'PAUSED', 'GAME_OVER'
    this.countdownNumber = 3;
    this.countdownStartTime = 0;
    this.countdownScale = 1.0;
    this.prevCountdownNumber = 3;
    this.prevCountdownScale = 1.0;
    this.winner = null; // 'left' or 'right'
    this.gameOverStartTime = 0;
    this.restartArrowRotation = 0;
    this.restartArrowRotationSpeed = 0.1;
    this.pauseButtonScale = 1.0;
    this.pauseButtonScaleDirection = 1;
    
    // Saved state for pause/resume
    this.savedState = null;
    this.resumingFromPause = false; // Flag to track if we're resuming from pause
    
    // Bouncing PONG title in menu
    this.pongTitleX = Math.floor(this.width / 2);
    this.pongTitleY = Math.floor(this.height / 2);
    this.pongTitleVx = (Math.random() > 0.5 ? 1 : -1) * 0.5;
    this.pongTitleVy = (Math.random() > 0.5 ? 1 : -1) * 0.5;
    this.prevPongTitleX = this.pongTitleX;
    this.prevPongTitleY = this.pongTitleY;
    
    // Initialize game objects
    this.leftPaddle = {
      x: this.PADDLE_LEFT_X,
      y: Math.floor(this.height / 2 - this.PADDLE_HEIGHT / 2),
      width: this.PADDLE_WIDTH,
      height: this.PADDLE_HEIGHT,
      speed: this.PADDLE_SPEED
    };
    
    this.rightPaddle = {
      x: this.PADDLE_RIGHT_X,
      y: Math.floor(this.height / 2 - this.PADDLE_HEIGHT / 2),
      width: this.PADDLE_WIDTH,
      height: this.PADDLE_HEIGHT,
      speed: this.PADDLE_SPEED
    };
    
    this.ball = {
      x: Math.floor(this.width / 2),
      y: Math.floor(this.height / 2),
      vx: 0,
      vy: 0,
      radius: 1
    };
    
    this.score = {
      left: 0,
      right: 0
    };
    
    // Controllers
    this.leftController = new KeyboardController();
    this.rightController = new AIController(0.5); // Default skill: 0.5 (normal)
    
    // Track previous positions for clearing
    this.prevLeftPaddleY = this.leftPaddle.y;
    this.prevRightPaddleY = this.rightPaddle.y;
    this.prevBallX = this.ball.x;
    this.prevBallY = this.ball.y;
    
    // Button bounds for click detection
    this.startButtonBounds = null;
    this.restartButtonBounds = null;
    
    // Draw court (always-on elements)
    this.drawCourt();
    
    // Setup mouse click handler
    this.setupClickHandler();
    
    // Setup pause key handler
    this.setupPauseHandler();
  }
  
  /**
   * Draw the court (midcourt line and walls)
   * These pixels stay ON permanently
   */
  drawCourt() {
    const midX = Math.floor(this.width / 2);
    
    // Midcourt line (dashed pattern - every other pixel)
    for (let y = 0; y < this.height; y++) {
      if (y % 2 === 0) {
        this.display.setPixel(midX, y, true);
      }
    }
    
    // Top wall
    for (let x = 0; x < this.width; x++) {
      this.display.setPixel(x, 0, true);
    }
    
    // Bottom wall
    for (let x = 0; x < this.width; x++) {
      this.display.setPixel(x, this.height - 1, true);
    }
    
    // Draw initial scores
    this.updateScores();
  }
  
  /**
   * Maintain court layer - redraws court pixels every frame
   * Ensures court pixels are always ON regardless of other elements
   */
  maintainCourt() {
    const midX = Math.floor(this.width / 2);
    
    // Redraw midcourt line (dashed pattern)
    for (let y = 0; y < this.height; y++) {
      if (y % 2 === 0) {
        this.display.setPixel(midX, y, true);
      }
    }
    
    // Redraw top wall
    for (let x = 0; x < this.width; x++) {
      this.display.setPixel(x, 0, true);
    }
    
    // Redraw bottom wall
    for (let x = 0; x < this.width; x++) {
      this.display.setPixel(x, this.height - 1, true);
    }
    
    // Redraw scores
    this.updateScores();
  }
  
  /**
   * Draw a single digit at position (x, y)
   */
  drawNumber(x, y, digit, scale = 1.0) {
    const font = PIXEL_FONT[digit];
    if (!font) return;
    
    const fontWidth = 5;
    const fontHeight = 7;
    
    for (let row = 0; row < fontHeight; row++) {
      for (let col = 0; col < fontWidth; col++) {
        if (font[row][col] === 1) {
          // Apply scale - draw multiple pixels for larger scale
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = Math.floor(x + col * scale + sx);
              const py = Math.floor(y + row * scale + sy);
              if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                this.display.setPixel(px, py, true);
              }
            }
          }
        }
      }
    }
  }
  
  /**
   * Draw a score (0-5) at position
   */
  drawScore(x, y, score) {
    // Clear previous score area (5x7 pixels)
    for (let py = 0; py < 7; py++) {
      for (let px = 0; px < 5; px++) {
        const clearX = x + px;
        const clearY = y + py;
        if (clearX >= 0 && clearX < this.width && clearY >= 0 && clearY < this.height) {
          // Don't clear if it's part of the court
          if (clearX !== Math.floor(this.width / 2) && clearY !== 0 && clearY !== this.height - 1) {
            this.display.setPixel(clearX, clearY, false);
          }
        }
      }
    }
    
    // Draw new score
    this.drawNumber(x, y, score);
  }
  
  /**
   * Update score displays
   */
  updateScores() {
    // Left score (top-left)
    this.drawScore(2, 2, this.score.left);
    
    // Right score (top-right)
    this.drawScore(this.width - 7, 2, this.score.right);
  }
  
  /**
   * Clear countdown area completely
   * After clearing, restore the dotted middle line pattern (ON for even y, OFF for odd y)
   */
  clearCountdownArea() {
    const midX = Math.floor(this.width / 2);
    const clearSize = 20; // Large enough to clear any scale
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    
    // Clear all pixels in the area (including middle line pixels)
    for (let py = centerY - clearSize; py < centerY + clearSize; py++) {
      for (let px = centerX - clearSize; px < centerX + clearSize; px++) {
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          // Don't clear court elements (walls)
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, false);
          }
        }
      }
    }
    
    // Restore the dotted middle line pattern in the cleared area
    // ON for even y, OFF for odd y (explicitly set both to restore pattern)
    for (let py = centerY - clearSize; py < centerY + clearSize; py++) {
      if (py >= 0 && py < this.height) {
        if (py % 2 === 0) {
          // Even y positions should be ON
          this.display.setPixel(midX, py, true);
        } else {
          // Odd y positions should be OFF (explicitly set to false)
          this.display.setPixel(midX, py, false);
        }
      }
    }
  }
  
  /**
   * Draw countdown with zoom bounce animation
   */
  drawCountdown() {
    const currentTime = performance.now();
    const elapsed = currentTime - this.countdownStartTime;
    const countdownDuration = 750; // 750ms per number
    
    // Always clear countdown area first to ensure clean rendering
    // Clear previous countdown number's area (using previous scale for complete cleanup)
    this.clearCountdownArea();
    
    if (elapsed >= countdownDuration) {
      // Clear completely before moving to next number
      this.clearCountdownArea();
      
      // Move to next number
      this.countdownNumber--;
      this.countdownStartTime = currentTime;
      
      if (this.countdownNumber < 1) {
        // Countdown complete, ensure complete cleanup
        this.clearCountdownArea();
        this.prevCountdownNumber = 0;
        this.prevCountdownScale = 0;
        this.gameState = 'PLAYING';
        
        // Only reset ball if we're not resuming from pause
        if (!this.resumingFromPause) {
          this.resetBall();
        }
        this.resumingFromPause = false; // Reset flag
        return;
      }
    }
    
    // Calculate bounce scale (starts at 2.0, bounces to 1.0)
    const progress = elapsed / countdownDuration;
    // Bounce easing: overshoot then settle
    let scale = 1.0;
    if (progress < 0.5) {
      // First half: scale down from 2.0 to 1.0
      scale = 2.0 - (progress * 2.0);
    } else {
      // Second half: slight bounce back
      const bounce = (progress - 0.5) * 2.0;
      scale = 1.0 - (bounce * bounce * 0.2); // Slight overshoot then settle
    }
    
    // Draw number centered
    const centerX = Math.floor(this.width / 2) - Math.floor((5 * scale) / 2);
    const centerY = Math.floor(this.height / 2) - Math.floor((7 * scale) / 2);
    
    this.drawNumber(centerX, centerY, this.countdownNumber, scale);
    
    // Store current state for next frame cleanup
    this.prevCountdownNumber = this.countdownNumber;
    this.prevCountdownScale = scale;
  }
  
  /**
   * Draw a button with text
   */
  drawButton(x, y, text) {
    // Simple button: text with border
    // For simplicity, we'll just draw the text
    // Button bounds will be calculated based on text
    const textWidth = text.length * 6; // Approximate width per character
    const textHeight = 7;
    
    // Store button bounds for click detection
    const bounds = {
      x: x - 2,
      y: y - 2,
      width: textWidth + 4,
      height: textHeight + 4
    };
    
    // Draw button background (simple rectangle)
    for (let by = bounds.y; by < bounds.y + bounds.height; by++) {
      for (let bx = bounds.x; bx < bounds.x + bounds.width; bx++) {
        if (bx >= 0 && bx < this.width && by >= 0 && by < this.height) {
          if (bx !== Math.floor(this.width / 2) && by !== 0 && by !== this.height - 1) {
            this.display.setPixel(bx, by, true);
          }
        }
      }
    }
    
    // Draw text (simplified - just draw "START" or "RESTART" as numbers/letters)
    // For simplicity, we'll use a basic approach
    // Actually, let's just draw simple text using pixel patterns
    return bounds;
  }
  
  /**
   * Clear button frame area
   */
  clearButtonFrame(buttonX, buttonY, buttonSize) {
    const midX = Math.floor(this.width / 2);
    
    // Clear frame area (1 pixel border + padding)
    const padding = 1;
    for (let x = buttonX - padding; x < buttonX + buttonSize + padding; x++) {
      for (let y = buttonY - padding; y < buttonY + buttonSize + padding; y++) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          // Only clear if it's on the border (not inside button)
          const isBorder = (x < buttonX || x >= buttonX + buttonSize || 
                           y < buttonY || y >= buttonY + buttonSize);
          if (isBorder && x !== midX && y !== 0 && y !== this.height - 1) {
            this.display.setPixel(x, y, false);
          }
        }
      }
    }
  }
  
  /**
   * Draw blinking frame around button
   */
  drawButtonFrame(buttonX, buttonY, buttonSize) {
    const currentTime = performance.now();
    const blinkSpeed = 0.01;
    const blink = Math.floor((currentTime * blinkSpeed) % 2);
    
    // Always clear frame area first
    this.clearButtonFrame(buttonX, buttonY, buttonSize);
    
    if (blink === 0) {
      // Draw frame (1 pixel border)
      const midX = Math.floor(this.width / 2);
      
      // Top and bottom borders
      for (let x = buttonX; x < buttonX + buttonSize; x++) {
        if (x >= 0 && x < this.width) {
          // Top
          if (buttonY >= 0 && buttonY < this.height) {
            if (x !== midX && buttonY !== 0 && buttonY !== this.height - 1) {
              this.display.setPixel(x, buttonY, true);
            }
          }
          // Bottom
          if (buttonY + buttonSize - 1 >= 0 && buttonY + buttonSize - 1 < this.height) {
            if (x !== midX && buttonY + buttonSize - 1 !== 0 && buttonY + buttonSize - 1 !== this.height - 1) {
              this.display.setPixel(x, buttonY + buttonSize - 1, true);
            }
          }
        }
      }
      
      // Left and right borders
      for (let y = buttonY; y < buttonY + buttonSize; y++) {
        if (y >= 0 && y < this.height) {
          // Left
          if (buttonX >= 0 && buttonX < this.width) {
            if (buttonX !== midX && y !== 0 && y !== this.height - 1) {
              this.display.setPixel(buttonX, y, true);
            }
          }
          // Right
          if (buttonX + buttonSize - 1 >= 0 && buttonX + buttonSize - 1 < this.width) {
            if (buttonX + buttonSize - 1 !== midX && y !== 0 && y !== this.height - 1) {
              this.display.setPixel(buttonX + buttonSize - 1, y, true);
            }
          }
        }
      }
    }
  }
  
  /**
   * Clear start arrow area (with padding to prevent animation overlap)
   */
  clearStartArrowArea() {
    const midX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const buttonSize = 20;
    const padding = 5; // Clear area padding around button
    const leftSideCenterX = Math.floor(midX / 2);
    const buttonX = leftSideCenterX - Math.floor(buttonSize / 2);
    const buttonY = centerY - Math.floor(buttonSize / 2);
    
    // Clear button area plus padding
    for (let py = buttonY - padding; py < buttonY + buttonSize + padding; py++) {
      for (let px = buttonX - padding; px < buttonX + buttonSize + padding; px++) {
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, false);
          }
        }
      }
    }
  }
  
  /**
   * Draw VCR Play icon (triangle) for start button (20x20)
   */
  drawStartArrow() {
    const midX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const buttonSize = 20;
    
    // Center on left side of screen
    const leftSideCenterX = Math.floor(midX / 2);
    const buttonX = leftSideCenterX - Math.floor(buttonSize / 2);
    const buttonY = centerY - Math.floor(buttonSize / 2);
    
    // Clear button area before drawing
    this.clearStartArrowArea();
    
    // Draw VCR Play icon (right triangle with vertical left edge pointing right)
    const triangleLeftX = buttonX + 5; // Left vertical edge
    const triangleTopY = buttonY + 5; // Top point
    const triangleBottomY = buttonY + buttonSize - 5; // Bottom point
    const triangleRightX = buttonX + buttonSize - 5; // Right point (tip)
    const triangleCenterY = triangleTopY + Math.floor((triangleBottomY - triangleTopY) / 2);
    const triangleHeight = triangleBottomY - triangleTopY;
    
    // Draw filled right triangle
    // Triangle has vertical left edge, tapers to point on right
    for (let y = triangleTopY; y <= triangleBottomY; y++) {
      // Calculate distance from center (0 at center, max at top/bottom)
      const distFromCenter = Math.abs(y - triangleCenterY);
      // Width decreases as we move away from center
      // At center: full width, at top/bottom: narrows to point
      const maxWidth = triangleRightX - triangleLeftX;
      const width = Math.max(1, Math.floor(maxWidth * (1 - (distFromCenter / (triangleHeight / 2)))));
      
      // Draw horizontal line from left edge, width determined by position
      for (let x = triangleLeftX; x < triangleLeftX + width; x++) {
        if (x >= buttonX && x < buttonX + buttonSize && y >= buttonY && y < buttonY + buttonSize) {
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            if (x !== midX && y !== 0 && y !== this.height - 1) {
              this.display.setPixel(x, y, true);
            }
          }
        }
      }
    }
    
    // Draw blinking frame
    this.drawButtonFrame(buttonX, buttonY, buttonSize);
    
    // Store button bounds for click detection (20x20)
    this.startButtonBounds = {
      x: buttonX,
      y: buttonY,
      width: buttonSize,
      height: buttonSize
    };
  }
  
  /**
   * Clear restart arrow area (with padding to prevent animation overlap)
   */
  clearRestartArrowArea() {
    const midX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const buttonSize = 20;
    const padding = 5; // Clear area padding around button
    const rightSideCenterX = midX + Math.floor((this.width - midX) / 2);
    const buttonX = rightSideCenterX - Math.floor(buttonSize / 2);
    const buttonY = centerY - Math.floor(buttonSize / 2);
    
    // Clear button area plus padding
    for (let py = buttonY - padding; py < buttonY + buttonSize + padding; py++) {
      for (let px = buttonX - padding; px < buttonX + buttonSize + padding; px++) {
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, false);
          }
        }
      }
    }
  }
  
  /**
   * Draw curved arrow that twists clockwise for restart button (20x20)
   */
  drawRestartArrow() {
    const midX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const buttonSize = 20;
    
    // Center on right side of screen
    const rightSideCenterX = midX + Math.floor((this.width - midX) / 2);
    const buttonX = rightSideCenterX - Math.floor(buttonSize / 2);
    const buttonY = centerY - Math.floor(buttonSize / 2);
    
    // Update rotation for twisting effect
    this.restartArrowRotation += this.restartArrowRotationSpeed;
    if (this.restartArrowRotation >= Math.PI * 2) {
      this.restartArrowRotation -= Math.PI * 2;
    }
    
    // Clear previous arrow area before drawing
    this.clearRestartArrowArea();
    
    // Draw curved arrow that twists clockwise (circular arrow pattern)
    const arrowCenterX = buttonX + Math.floor(buttonSize / 2);
    const arrowCenterY = buttonY + Math.floor(buttonSize / 2);
    const radius = 6;
    
    // Draw circular arrow arc (curved arrow body)
    // Start from 0 and go around circle with twist based on rotation
    for (let angle = 0; angle < Math.PI * 1.5; angle += 0.15) {
      // Apply twist - the arrow rotates clockwise around the circle
      const twistedAngle = angle + this.restartArrowRotation;
      const x = Math.round(arrowCenterX + Math.cos(twistedAngle) * radius);
      const y = Math.round(arrowCenterY + Math.sin(twistedAngle) * radius);
      
      if (x >= buttonX && x < buttonX + buttonSize && y >= buttonY && y < buttonY + buttonSize) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          if (x !== midX && y !== 0 && y !== this.height - 1) {
            // Draw thicker line (2-3 pixels wide)
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const px = x + dx;
                const py = y + dy;
                if (px >= buttonX && px < buttonX + buttonSize && py >= buttonY && py < buttonY + buttonSize) {
                  if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                    if (px !== midX && py !== 0 && py !== this.height - 1) {
                      this.display.setPixel(px, py, true);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Draw arrow head at the end of the curve
    const headAngle = Math.PI * 1.5 + this.restartArrowRotation;
    const headX = Math.round(arrowCenterX + Math.cos(headAngle) * (radius + 2));
    const headY = Math.round(arrowCenterY + Math.sin(headAngle) * (radius + 2));
    
    // Draw arrow head pointing in direction of curve
    const headDirection = headAngle + Math.PI / 6; // Point along curve
    for (let i = 0; i < 3; i++) {
      const offsetAngle1 = headDirection + (i * Math.PI / 3);
      const offsetAngle2 = headDirection - (i * Math.PI / 3);
      const px1 = Math.round(headX + Math.cos(offsetAngle1) * i);
      const py1 = Math.round(headY + Math.sin(offsetAngle1) * i);
      const px2 = Math.round(headX + Math.cos(offsetAngle2) * i);
      const py2 = Math.round(headY + Math.sin(offsetAngle2) * i);
      
      for (const [px, py] of [[px1, py1], [px2, py2], [headX, headY]]) {
        if (px >= buttonX && px < buttonX + buttonSize && py >= buttonY && py < buttonY + buttonSize) {
          if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
            if (px !== midX && py !== 0 && py !== this.height - 1) {
              this.display.setPixel(px, py, true);
            }
          }
        }
      }
    }
    
    // Draw blinking frame
    this.drawButtonFrame(buttonX, buttonY, buttonSize);
    
    // Store button bounds for click detection (20x20)
    this.restartButtonBounds = {
      x: buttonX,
      y: buttonY,
      width: buttonSize,
      height: buttonSize
    };
  }
  
  /**
   * Clear PONG title area
   */
  clearPongTitleArea() {
    // Clear area where PONG title might be (large enough for scaled text)
    const clearSize = 50;
    const midX = Math.floor(this.width / 2);
    
    // Clear previous position
    for (let py = this.prevPongTitleY - clearSize; py < this.prevPongTitleY + clearSize; py++) {
      for (let px = this.prevPongTitleX - clearSize; px < this.prevPongTitleX + clearSize; px++) {
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, false);
          }
        }
      }
    }
  }
  
  /**
   * Draw bouncing PONG title
   */
  drawBouncingPongTitle() {
    // Clear previous position
    this.clearPongTitleArea();
    
    // Update position
    this.pongTitleX += this.pongTitleVx;
    this.pongTitleY += this.pongTitleVy;
    
    // Bounce off walls
    const titleWidth = 28; // Approximate width of "PONG" at scale 2
    const titleHeight = 14; // Approximate height at scale 2
    
    if (this.pongTitleX < titleWidth / 2) {
      this.pongTitleX = titleWidth / 2;
      this.pongTitleVx = -this.pongTitleVx;
    } else if (this.pongTitleX > this.width - titleWidth / 2) {
      this.pongTitleX = this.width - titleWidth / 2;
      this.pongTitleVx = -this.pongTitleVx;
    }
    
    if (this.pongTitleY < titleHeight / 2 + 1) { // +1 for top wall
      this.pongTitleY = titleHeight / 2 + 1;
      this.pongTitleVy = -this.pongTitleVy;
    } else if (this.pongTitleY > this.height - titleHeight / 2 - 1) { // -1 for bottom wall
      this.pongTitleY = this.height - titleHeight / 2 - 1;
      this.pongTitleVy = -this.pongTitleVy;
    }
    
    // Draw "PONG" text at position (large scale)
    const letters = ['P', 'O', 'N', 'G'];
    const charWidth = 7;
    const scale = 2.0; // Large scale for visibility
    const startX = Math.floor(this.pongTitleX - (letters.length * charWidth * scale) / 2);
    const startY = Math.floor(this.pongTitleY - (9 * scale) / 2);
    
    const letterPatterns = this.getLargeLetterPatterns();
    for (let i = 0; i < letters.length; i++) {
      const pattern = letterPatterns[letters[i]];
      if (pattern) {
        const charX = startX + (i * charWidth * scale);
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 7; col++) {
            if (pattern[row] && pattern[row][col] === 1) {
              for (let sy = 0; sy < scale; sy++) {
                for (let sx = 0; sx < scale; sx++) {
                  const px = Math.floor(charX + col * scale + sx);
                  const py = Math.floor(startY + row * scale + sy);
                  if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                    const midX = Math.floor(this.width / 2);
                    if (px !== midX && py !== 0 && py !== this.height - 1) {
                      this.display.setPixel(px, py, true);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Store current position for next frame cleanup
    this.prevPongTitleX = Math.floor(this.pongTitleX);
    this.prevPongTitleY = Math.floor(this.pongTitleY);
  }
  
  /**
   * Draw menu state
   */
  drawMenu() {
    this.drawBouncingPongTitle();
    this.drawStartArrow();
  }
  
  /**
   * Draw emoji face (pixel art)
   */
  drawEmojiFace(x, y, type, size = 7) {
    // Emoji patterns: smiley, winking, frowny
    const patterns = {
      smiley: [
        [0,1,1,1,1,1,0],
        [1,0,0,0,0,0,1],
        [1,0,1,0,1,0,1],
        [1,0,0,0,0,0,1],
        [1,0,1,0,1,0,1],
        [1,0,0,1,0,0,1],
        [0,1,1,0,1,1,0]
      ],
      winking: [
        [0,1,1,1,1,1,0],
        [1,0,0,0,0,0,1],
        [1,0,1,0,1,0,1],
        [1,0,0,0,0,0,1],
        [1,0,1,1,1,0,1],
        [1,0,0,1,0,0,1],
        [0,1,1,0,1,1,0]
      ],
      frowny: [
        [0,1,1,1,1,1,0],
        [1,0,0,0,0,0,1],
        [1,0,1,0,1,0,1],
        [1,0,0,0,0,0,1],
        [1,0,1,0,1,0,1],
        [1,1,0,0,0,1,1],
        [0,0,1,1,1,0,0]
      ],
      thumbsDown: [
        [0,0,1,1,1,0,0],
        [0,1,1,1,1,1,0],
        [0,1,1,1,1,1,0],
        [0,0,1,1,1,0,0],
        [0,0,0,1,0,0,0],
        [0,0,1,1,1,0,0],
        [0,1,1,1,1,1,0]
      ],
      xMark: [
        [1,0,0,0,0,0,1],
        [0,1,0,0,0,1,0],
        [0,0,1,0,1,0,0],
        [0,0,0,1,0,0,0],
        [0,0,1,0,1,0,0],
        [0,1,0,0,0,1,0],
        [1,0,0,0,0,0,1]
      ]
    };
    
    const pattern = patterns[type];
    if (!pattern) return;
    
    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length; col++) {
        if (pattern[row][col] === 1) {
          const px = x + col;
          const py = y + row;
          if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
            const midX = Math.floor(this.width / 2);
            if (px !== midX && py !== 0 && py !== this.height - 1) {
              this.display.setPixel(px, py, true);
            }
          }
        }
      }
    }
  }
  
  /**
   * Draw firework burst (radial pattern)
   */
  drawFirework(x, y, time, index) {
    const burstRadius = 8 + Math.sin(time * 0.01 + index) * 3;
    const numRays = 8;
    
    // Draw radial rays
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2 + (time * 0.002);
      const rayLength = burstRadius;
      
      for (let r = 0; r < rayLength; r += 0.5) {
        const px = Math.round(x + Math.cos(angle) * r);
        const py = Math.round(y + Math.sin(angle) * r);
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          const midX = Math.floor(this.width / 2);
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, true);
          }
        }
      }
    }
    
    // Draw center sparkle
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const px = x + dx;
        const py = y + dy;
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          const midX = Math.floor(this.width / 2);
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, true);
          }
        }
      }
    }
  }
  
  /**
   * Draw large pixel text for WINNER or YOU LOSE (simple bouncing text)
   */
  drawGameOverMessage() {
    const currentTime = performance.now();
    const elapsed = currentTime - this.gameOverStartTime;
    
    // Always clear message area first (but keep button areas clear)
    this.clearGameOverArea();
    
    const isWinner = this.winner === 'left';
    const message = isWinner ? 'WINNER!' : 'YOU LOSE';
    
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const charWidth = 10;
    const messageWidth = message.length * charWidth;
    
    // Bouncing animation for text (vertical bounce) - positioned higher to avoid button
    const bounceSpeed = 0.003;
    const bounceAmount = 3;
    const bounceY = Math.sin(elapsed * bounceSpeed) * bounceAmount;
    // Button is at centerY ± 10 (20px tall), text is ~13px tall, so position higher
    const baseY = centerY - 28; // Moved higher to avoid restart button
    const startY = baseY + bounceY;
    const startX = centerX - Math.floor(messageWidth / 2);
    
    const letterPatterns = this.getLargeLetterPatterns();
    
    // Draw main message text with bouncing
    let charIndex = 0;
    for (const char of message) {
      if (char === ' ') {
        charIndex++;
        continue;
      }
      
      const pattern = letterPatterns[char.toUpperCase()];
      if (pattern) {
        const charX = startX + (charIndex * charWidth);
        const charY = startY;
        const textScale = 1.4;
        
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 7; col++) {
            if (pattern[row] && pattern[row][col] === 1) {
              for (let sy = 0; sy < textScale; sy++) {
                for (let sx = 0; sx < textScale; sx++) {
                  const px = Math.floor(charX + col * textScale + sx);
                  const py = Math.floor(charY + row * textScale + sy);
                  if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                    const midX = Math.floor(this.width / 2);
                    // Keep button areas clear (right side for restart button)
                    const buttonPadding = 30;
                    const isInButtonArea = px > this.width - buttonPadding && 
                                         (py > centerY - 25 && py < centerY + 25);
                    if (px !== midX && py !== 0 && py !== this.height - 1 && !isInButtonArea) {
                      this.display.setPixel(px, py, true);
                    }
                  }
                }
              }
            }
          }
        }
      }
      charIndex++;
    }
  }
  
  /**
   * Get large letter patterns for WINNER and YOU LOSE
   * Simplified bold block letters (7x9 pixels each)
   */
  getLargeLetterPatterns() {
    // Simple block letter patterns - bold style
    return {
      'W': [
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,1,0,0,1],
        [1,0,1,0,1,0,1],
        [1,1,0,0,0,1,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1]
      ],
      'I': [
        [1,1,1,1,1,1,1],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [1,1,1,1,1,1,1]
      ],
      'N': [
        [1,0,0,0,0,0,1],
        [1,1,0,0,0,0,1],
        [1,0,1,0,0,0,1],
        [1,0,0,1,0,0,1],
        [1,0,0,0,1,0,1],
        [1,0,0,0,0,1,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1]
      ],
      'E': [
        [1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,1,1,1,1,1,1]
      ],
      'R': [
        [1,1,1,1,1,1,0],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,1,1,1,1,1,0],
        [1,0,0,0,1,0,0],
        [1,0,0,0,0,1,0],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1]
      ],
      '!': [
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0]
      ],
      'Y': [
        [1,0,0,0,0,0,1],
        [0,1,0,0,0,1,0],
        [0,0,1,0,1,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0]
      ],
      'O': [
        [0,1,1,1,1,1,0],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [0,1,1,1,1,1,0]
      ],
      'U': [
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [0,1,1,1,1,1,0]
      ],
      'L': [
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,1,1,1,1,1,1]
      ],
      'S': [
        [0,1,1,1,1,1,0],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [0,1,1,1,1,1,0],
        [0,0,0,0,0,0,1],
        [0,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [0,1,1,1,1,1,0]
      ],
      'P': [
        [1,1,1,1,1,1,0],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,1,1,1,1,1,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0]
      ],
      'G': [
        [0,1,1,1,1,1,0],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0],
        [1,0,0,1,1,1,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [0,1,1,1,1,1,0]
      ]
    };
  }
  
  /**
   * Draw game over state
   */
  drawGameOver() {
    // Draw winner/loser message
    this.drawGameOverMessage();
    
    // Draw restart arrow
    this.drawRestartArrow();
  }
  
  /**
   * Clear game over message area
   * Preserves button area on right side (restart button)
   */
  clearGameOverArea() {
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const clearWidth = 70;
    const clearHeight = 20;
    const buttonPadding = 30; // Keep right side clear for restart button
    
    for (let py = centerY - clearHeight; py < centerY + clearHeight; py++) {
      for (let px = centerX - clearWidth; px < centerX + clearWidth; px++) {
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          const midX = Math.floor(this.width / 2);
          // Don't clear restart button area (right side)
          const isInButtonArea = px > this.width - buttonPadding && 
                                 (py > centerY - 25 && py < centerY + 25);
          if (px !== midX && py !== 0 && py !== this.height - 1 && !isInButtonArea) {
            this.display.setPixel(px, py, false);
          }
        }
      }
    }
  }
  
  /**
   * Check if a click is within button bounds
   */
  checkButtonClick(pixelX, pixelY) {
    if (this.gameState === 'MENU' && this.startButtonBounds) {
      if (pixelX >= this.startButtonBounds.x && 
          pixelX < this.startButtonBounds.x + this.startButtonBounds.width &&
          pixelY >= this.startButtonBounds.y && 
          pixelY < this.startButtonBounds.y + this.startButtonBounds.height) {
        this.startNewGame();
        return true;
      }
    } else if (this.gameState === 'GAME_OVER' && this.restartButtonBounds) {
      if (pixelX >= this.restartButtonBounds.x && 
          pixelX < this.restartButtonBounds.x + this.restartButtonBounds.width &&
          pixelY >= this.restartButtonBounds.y && 
          pixelY < this.restartButtonBounds.y + this.restartButtonBounds.height) {
        // Go back to menu when restarting
        this.clearGameOverArea();
        this.clearCountdownArea();
        this.goToMenu();
        return true;
      }
    }
    return false;
  }
  
  /**
   * Clear menu elements (PONG title and start arrow)
   */
  clearMenuArea() {
    this.clearPongTitleArea();
    this.clearStartArrowArea();
  }
  
  /**
   * Go to menu screen
   */
  goToMenu() {
    // Clear all animation areas
    this.clearGameOverArea();
    this.clearCountdownArea();
    this.clearPauseArea();
    
    // Reset game state
    this.gameState = 'MENU';
    this.winner = null;
    this.gameOverStartTime = 0;
    
    // Reset PONG title position and velocity
    this.pongTitleX = Math.floor(this.width / 2);
    this.pongTitleY = Math.floor(this.height / 2);
    this.pongTitleVx = (Math.random() > 0.5 ? 1 : -1) * 0.5;
    this.pongTitleVy = (Math.random() > 0.5 ? 1 : -1) * 0.5;
  }
  
  /**
   * Start a new game
   */
  startNewGame() {
    // Clear all animation areas
    this.clearGameOverArea();
    this.clearCountdownArea();
    this.clearMenuArea();
    this.clearPauseArea();
    
    // Reset scores
    this.score.left = 0;
    this.score.right = 0;
    
    // Reset paddles
    this.leftPaddle.y = Math.floor(this.height / 2 - this.PADDLE_HEIGHT / 2);
    this.rightPaddle.y = Math.floor(this.height / 2 - this.PADDLE_HEIGHT / 2);
    
    // Reset ball (will be started after countdown)
    this.ball.x = Math.floor(this.width / 2);
    this.ball.y = Math.floor(this.height / 2);
    this.ball.vx = 0;
    this.ball.vy = 0;
    
    // Update scores display
    this.updateScores();
    
    // Start countdown
    this.gameState = 'COUNTDOWN';
    this.countdownNumber = 3;
    this.countdownStartTime = performance.now();
    this.countdownScale = 2.0;
    this.winner = null;
    this.gameOverStartTime = 0;
  }
  
  /**
   * Update countdown state
   */
  updateCountdown() {
    this.drawCountdown();
  }
  
  /**
   * Check if game should end
   */
  checkGameEnd() {
    if (this.score.left >= 5) {
      this.winner = 'left';
      this.gameState = 'GAME_OVER';
      this.gameOverStartTime = performance.now();
      // Stop ball
      this.ball.vx = 0;
      this.ball.vy = 0;
    } else if (this.score.right >= 5) {
      this.winner = 'right';
      this.gameState = 'GAME_OVER';
      this.gameOverStartTime = performance.now();
      // Stop ball
      this.ball.vx = 0;
      this.ball.vy = 0;
    }
  }
  
  /**
   * Setup pause key handler (P key)
   */
  setupPauseHandler() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P' || e.keyCode === 80) {
        e.preventDefault();
        if (this.gameState === 'PLAYING') {
          // Pause the game
          this.pauseGame();
        } else if (this.gameState === 'PAUSED') {
          // Unpause - start countdown and resume
          this.unpauseGame();
        }
      }
    });
  }
  
  /**
   * Pause the game
   */
  pauseGame() {
    // Save current game state
    this.savedState = {
      ball: {
        x: this.ball.x,
        y: this.ball.y,
        vx: this.ball.vx,
        vy: this.ball.vy
      },
      leftPaddle: {
        y: this.leftPaddle.y
      },
      rightPaddle: {
        y: this.rightPaddle.y
      },
      score: {
        left: this.score.left,
        right: this.score.right
      }
    };
    
    this.gameState = 'PAUSED';
    this.pauseButtonScale = 1.0;
    this.pauseButtonScaleDirection = 1;
  }
  
  /**
   * Clear pause button area
   */
  clearPauseArea() {
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const clearSize = 20;
    const midX = Math.floor(this.width / 2);
    
    for (let py = centerY - clearSize; py < centerY + clearSize; py++) {
      for (let px = centerX - clearSize; px < centerX + clearSize; px++) {
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, false);
          }
        }
      }
    }
  }
  
  /**
   * Unpause the game - start countdown and restore state
   */
  unpauseGame() {
    // Clear pause button area
    this.clearPauseArea();
    
    // Restore saved state
    if (this.savedState) {
      this.ball.x = this.savedState.ball.x;
      this.ball.y = this.savedState.ball.y;
      this.ball.vx = this.savedState.ball.vx;
      this.ball.vy = this.savedState.ball.vy;
      this.leftPaddle.y = this.savedState.leftPaddle.y;
      this.rightPaddle.y = this.savedState.rightPaddle.y;
      this.score.left = this.savedState.score.left;
      this.score.right = this.savedState.score.right;
      this.updateScores();
    }
    
    // Set flag to indicate we're resuming from pause
    this.resumingFromPause = true;
    
    // Start countdown
    this.gameState = 'COUNTDOWN';
    this.countdownNumber = 3;
    this.countdownStartTime = performance.now();
    this.savedState = null;
  }
  
  /**
   * Draw VCR Pause button (two vertical bars) with bounce animation
   */
  drawPauseButton() {
    const currentTime = performance.now();
    
    // Update bounce animation
    const bounceSpeed = 0.005;
    const bounceAmount = 0.3;
    this.pauseButtonScale = 1.0 + Math.sin(currentTime * bounceSpeed) * bounceAmount;
    
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const barWidth = 3;
    const barHeight = 12;
    const barSpacing = 2;
    
    // Clear pause area completely before drawing
    this.clearPauseArea();
    
    // Draw two vertical bars (pause icon)
    const scaledBarWidth = Math.floor(barWidth * this.pauseButtonScale);
    const scaledBarHeight = Math.floor(barHeight * this.pauseButtonScale);
    const totalWidth = scaledBarWidth * 2 + barSpacing;
    
    const leftBarX = centerX - Math.floor(totalWidth / 2);
    const rightBarX = leftBarX + scaledBarWidth + barSpacing;
    const barY = centerY - Math.floor(scaledBarHeight / 2);
    
    // Draw left bar
    for (let y = 0; y < scaledBarHeight; y++) {
      for (let x = 0; x < scaledBarWidth; x++) {
        const px = leftBarX + x;
        const py = barY + y;
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          const midX = Math.floor(this.width / 2);
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, true);
          }
        }
      }
    }
    
    // Draw right bar
    for (let y = 0; y < scaledBarHeight; y++) {
      for (let x = 0; x < scaledBarWidth; x++) {
        const px = rightBarX + x;
        const py = barY + y;
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          const midX = Math.floor(this.width / 2);
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, true);
          }
        }
      }
    }
  }
  
  /**
   * Setup mouse click and keyboard handlers
   */
  setupClickHandler() {
    const canvas = this.display.canvas;
    
    // Mouse click handler
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      
      // Convert to pixel coordinates
      const pixelX = Math.floor((canvasX / canvas.width) * this.width);
      const pixelY = Math.floor((canvasY / canvas.height) * this.height);
      
      this.checkButtonClick(pixelX, pixelY);
    });
    
    // Keyboard handler for Enter key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        // Trigger button action based on current state
        if (this.gameState === 'MENU') {
          this.startNewGame();
        } else if (this.gameState === 'GAME_OVER') {
          // Go back to menu when restarting
          this.clearGameOverArea();
          this.clearCountdownArea();
          this.goToMenu();
        }
      } else if ((e.key === 'w' || e.key === 'W') && this.gameState === 'MENU') {
        // Debug: show win screen
        e.preventDefault();
        this.gameState = 'GAME_OVER';
        this.winner = 'left';
        this.gameOverStartTime = performance.now();
      } else if ((e.key === 'l' || e.key === 'L') && this.gameState === 'MENU') {
        // Debug: show lose screen
        e.preventDefault();
        this.gameState = 'GAME_OVER';
        this.winner = 'right';
        this.gameOverStartTime = performance.now();
      }
    });
  }
  
  /**
   * Clear previous frame's dynamic elements
   */
  clearPreviousFrame() {
    const midX = Math.floor(this.width / 2);
    
    // Clear left paddle - always clear, even if overlapping score (score will be redrawn)
    for (let py = 0; py < this.PADDLE_HEIGHT; py++) {
      const y = this.prevLeftPaddleY + py;
      if (y >= 0 && y < this.height) {
        for (let px = 0; px < this.PADDLE_WIDTH; px++) {
          const x = this.PADDLE_LEFT_X + px;
          if (x >= 0 && x < this.width) {
            // Don't clear if it's part of the court
            if (x !== midX && y !== 0 && y !== this.height - 1) {
              this.display.setPixel(x, y, false);
            }
          }
        }
      }
    }
    
    // Clear right paddle - always clear, even if overlapping score (score will be redrawn)
    for (let py = 0; py < this.PADDLE_HEIGHT; py++) {
      const y = this.prevRightPaddleY + py;
      if (y >= 0 && y < this.height) {
        for (let px = 0; px < this.PADDLE_WIDTH; px++) {
          const x = this.PADDLE_RIGHT_X + px;
          if (x >= 0 && x < this.width) {
            // Don't clear if it's part of the court
            if (x !== midX && y !== 0 && y !== this.height - 1) {
              this.display.setPixel(x, y, false);
            }
          }
        }
      }
    }
    
    // Clear ball
    const ballX = Math.floor(this.prevBallX);
    const ballY = Math.floor(this.prevBallY);
    if (ballX >= 0 && ballX < this.width && ballY >= 0 && ballY < this.height) {
      // Always clear the ball pixel first
      this.display.setPixel(ballX, ballY, false);
      
      // Then redraw court elements if the ball was on them
      if (ballX === midX) {
        // Ball was on center line - redraw center line pixel if it should be there (dashed pattern)
        if (ballY % 2 === 0) {
          this.display.setPixel(midX, ballY, true);
        }
      } else if (ballY === 0 || ballY === this.height - 1) {
        // Ball was on wall - redraw wall pixel
        this.display.setPixel(ballX, ballY, true);
      }
    }
    
    // Redraw scores after clearing (in case paddles overlapped them)
    this.updateScores();
  }
  
  /**
   * Draw current frame's dynamic elements
   */
  drawCurrentFrame() {
    // Draw left paddle
    for (let py = 0; py < this.PADDLE_HEIGHT; py++) {
      const y = Math.floor(this.leftPaddle.y + py);
      if (y >= 0 && y < this.height) {
        for (let px = 0; px < this.PADDLE_WIDTH; px++) {
          const x = this.PADDLE_LEFT_X + px;
          if (x >= 0 && x < this.width) {
            this.display.setPixel(x, y, true);
          }
        }
      }
    }
    
    // Draw right paddle
    for (let py = 0; py < this.PADDLE_HEIGHT; py++) {
      const y = Math.floor(this.rightPaddle.y + py);
      if (y >= 0 && y < this.height) {
        for (let px = 0; px < this.PADDLE_WIDTH; px++) {
          const x = this.PADDLE_RIGHT_X + px;
          if (x >= 0 && x < this.width) {
            this.display.setPixel(x, y, true);
          }
        }
      }
    }
    
    // Draw ball
    const ballX = Math.floor(this.ball.x);
    const ballY = Math.floor(this.ball.y);
    if (ballX >= 0 && ballX < this.width && ballY >= 0 && ballY < this.height) {
      this.display.setPixel(ballX, ballY, true);
    }
  }
  
  /**
   * Update paddle position based on controller input
   */
  updatePaddle(paddle, controller) {
    // AI controllers directly modify paddle.y in their update() method
    // Human controllers return direction ('up'/'down'/'null')
    if (controller instanceof AIController) {
      // AI controller handles movement internally
      controller.update(paddle, this.ball, {
        score: this.score,
        width: this.width,
        height: this.height
      });
    } else {
      // Human controller returns direction
      const direction = controller.update(paddle, this.ball, {
        score: this.score,
        width: this.width,
        height: this.height
      });
      
      if (direction === 'up') {
        paddle.y -= paddle.speed;
      } else if (direction === 'down') {
        paddle.y += paddle.speed;
      }
    }
    
    // Constrain paddle to screen (can't move off back line) - applies to both AI and human
    if (paddle.y < 1) {
      paddle.y = 1; // 1 to account for top wall
    }
    if (paddle.y + paddle.height > this.height - 1) {
      paddle.y = this.height - 1 - paddle.height; // Account for bottom wall
    }
  }
  
  /**
   * Check collision between ball and paddle
   */
  checkPaddleCollision(paddle) {
    const ballX = this.ball.x;
    const ballY = this.ball.y;
    
    // Check if ball is within paddle's x range
    if (ballX >= paddle.x && ballX < paddle.x + paddle.width) {
      // Check if ball is within paddle's y range
      if (ballY >= paddle.y && ballY < paddle.y + paddle.height) {
        // Calculate hit position on paddle (0 to 1)
        const hitPos = (ballY - paddle.y) / paddle.height;
        
        // Reverse x velocity
        this.ball.vx = -this.ball.vx;
        
        // Adjust y velocity based on hit position
        // Hit near top = upward angle, hit near bottom = downward angle
        const angle = (hitPos - 0.5) * 2; // -1 to 1
        this.ball.vy = angle * this.BALL_SPEED * 0.8;
        
        // Ensure minimum speed
        if (Math.abs(this.ball.vx) < 0.5) {
          this.ball.vx = this.ball.vx > 0 ? 0.5 : -0.5;
        }
        
        return true;
      }
    }
    return false;
  }
  
  /**
   * Update ball position and check collisions
   */
  updateBall() {
    // Update position
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    
    // Check wall collisions (top and bottom)
    if (this.ball.y <= 1) {
      this.ball.y = 1;
      this.ball.vy = -this.ball.vy;
    }
    if (this.ball.y >= this.height - 2) {
      this.ball.y = this.height - 2;
      this.ball.vy = -this.ball.vy;
    }
    
    // Check paddle collisions
    this.checkPaddleCollision(this.leftPaddle);
    this.checkPaddleCollision(this.rightPaddle);
    
    // Check goals
    if (this.ball.x < 0) {
      // Right player scores
      this.score.right++;
      this.updateScores();
      this.resetBall();
    } else if (this.ball.x >= this.width) {
      // Left player scores
      this.score.left++;
      this.updateScores();
      this.resetBall();
    }
  }
  
  /**
   * Reset ball to center with random direction
   */
  resetBall() {
    this.ball.x = Math.floor(this.width / 2);
    this.ball.y = Math.floor(this.height / 2);
    
    // Randomize speed: ±5% from base BALL_SPEED
    const speedVariation = 1.0 + (Math.random() - 0.5) * 0.1; // ±5%
    const baseSpeed = this.BALL_SPEED * speedVariation;
    
    // Randomize direction: ±10 degrees from base angle
    // Base angle is approximately 45 degrees (when vy = 0.7 * vx)
    const baseAngle = Math.atan2(0.7, 1.0); // ~35 degrees
    const angleVariation = (Math.random() - 0.5) * (10 * Math.PI / 180); // ±10 degrees in radians
    const angle = baseAngle + angleVariation;
    
    // Randomize horizontal direction (left or right)
    const horizontalDir = Math.random() > 0.5 ? 1 : -1;
    
    // Calculate velocity components
    this.ball.vx = horizontalDir * baseSpeed * Math.cos(angle);
    this.ball.vy = baseSpeed * Math.sin(angle);
  }
  
  /**
   * Update game state (called each frame)
   */
  update() {
    // Always maintain court layer first (ensures court pixels are always ON)
    this.maintainCourt();
    
    if (this.gameState === 'MENU') {
      // Clear previous frame and redraw menu
      this.clearPreviousFrame();
      this.drawMenu();
      return;
    } else if (this.gameState === 'COUNTDOWN') {
      // Update countdown
      this.updateCountdown();
      // Don't update game objects during countdown
      return;
    } else if (this.gameState === 'PAUSED') {
      // Draw pause screen - show pause button and current game state
      this.drawPauseButton();
      // Draw current game state (paddles and ball frozen)
      this.drawCurrentFrame();
      return;
    } else if (this.gameState === 'GAME_OVER') {
      // Draw game over screen
      this.clearPreviousFrame();
      this.drawGameOver();
      // Still draw paddles and ball in final position
      this.drawCurrentFrame();
      // Message animates continuously until restart
      return;
    } else if (this.gameState === 'PLAYING') {
      // Normal game play
      // Update paddles
      this.updatePaddle(this.leftPaddle, this.leftController);
      this.updatePaddle(this.rightPaddle, this.rightController);
      
      // Update ball
      this.updateBall();
      
      // Check for game end
      this.checkGameEnd();
      
      // Clear previous frame
      this.clearPreviousFrame();
      
      // Draw current frame
      this.drawCurrentFrame();
      
      // Store current positions for next frame
      this.prevLeftPaddleY = Math.floor(this.leftPaddle.y);
      this.prevRightPaddleY = Math.floor(this.rightPaddle.y);
      this.prevBallX = this.ball.x;
      this.prevBallY = this.ball.y;
    }
  }
}

// Initialize game
const canvas = document.getElementById('display');
const display = new PixelDisplay(canvas, 160, 120, 800, 600);
const game = new Pong(display);

// Start display render loop
display.start();

// Game loop
function gameLoop() {
  game.update();
  requestAnimationFrame(gameLoop);
}

gameLoop();
