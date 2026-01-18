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
 * AIController - Placeholder for AI or human control
 */
class AIController extends PlayerController {
  update(paddle, ball, gameState) {
    // Placeholder: stationary for now
    // Can be extended to follow ball or accept user input
    return null;
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
    this.PADDLE_SPEED = 2.0;
    this.BALL_SPEED = 1.0;
    
    // Paddle positions
    this.PADDLE_LEFT_X = 2;
    this.PADDLE_RIGHT_X = this.width - 4;
    
    // Game state
    this.gameState = 'MENU'; // 'MENU', 'COUNTDOWN', 'PLAYING', 'GAME_OVER'
    this.countdownNumber = 3;
    this.countdownStartTime = 0;
    this.countdownScale = 1.0;
    this.winner = null; // 'left' or 'right'
    this.gameOverStartTime = 0;
    this.restartArrowRotation = 0;
    this.restartArrowRotationSpeed = 0.1;
    
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
    this.rightController = new AIController();
    
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
   */
  clearCountdownArea() {
    const midX = Math.floor(this.width / 2);
    const clearSize = 20; // Large enough to clear any scale
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    
    for (let py = centerY - clearSize; py < centerY + clearSize; py++) {
      for (let px = centerX - clearSize; px < centerX + clearSize; px++) {
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          // Don't clear court elements
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, false);
          }
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
    this.clearCountdownArea();
    
    if (elapsed >= countdownDuration) {
      // Clear completely before moving to next number
      this.clearCountdownArea();
      
      // Move to next number
      this.countdownNumber--;
      this.countdownStartTime = currentTime;
      
      if (this.countdownNumber < 1) {
        // Countdown complete, clear and start playing
        this.clearCountdownArea();
        this.gameState = 'PLAYING';
        this.resetBall();
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
   * Draw blinking frame around button
   */
  drawButtonFrame(buttonX, buttonY, buttonSize) {
    const currentTime = performance.now();
    const blinkSpeed = 0.01;
    const blink = Math.floor((currentTime * blinkSpeed) % 2);
    
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
    
    // Clear button area
    for (let py = buttonY; py < buttonY + buttonSize; py++) {
      for (let px = buttonX; px < buttonX + buttonSize; px++) {
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, false);
          }
        }
      }
    }
    
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
    
    // Clear previous arrow area
    for (let py = buttonY; py < buttonY + buttonSize; py++) {
      for (let px = buttonX; px < buttonX + buttonSize; px++) {
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          if (px !== midX && py !== 0 && py !== this.height - 1) {
            this.display.setPixel(px, py, false);
          }
        }
      }
    }
    
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
   * Draw menu state
   */
  drawMenu() {
    this.drawStartArrow();
  }
  
  /**
   * Draw large pixel text for WINNER or YOU LOSE (continuously animated)
   */
  drawGameOverMessage() {
    const currentTime = performance.now();
    const elapsed = currentTime - this.gameOverStartTime;
    
    // Continuous animation - pulse/flash effect
    const pulseSpeed = 0.005; // Animation speed
    const pulse = Math.sin(elapsed * pulseSpeed);
    const scale = 1.0 + (pulse * 0.2); // Pulse between 1.0 and 1.2
    
    // Flash effect - alternate between full and dim
    const flashCycle = Math.floor(elapsed / 200) % 2; // Flash every 200ms
    const shouldShow = flashCycle === 0;
    
    if (!shouldShow) {
      // Clear message area during flash off
      this.clearGameOverArea();
      return;
    }
    
    const isWinner = this.winner === 'left';
    const message = isWinner ? 'WINNER!' : 'YOU LOSE';
    
    // Large pixel font (7x9 per character, simplified)
    // WINNER! = 7 chars * 7 = 49 pixels wide
    // YOU LOSE = 8 chars * 7 = 56 pixels wide
    
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    
    // Calculate message width and starting position
    const charWidth = 7;
    const messageWidth = message.length * charWidth;
    const startX = centerX - Math.floor(messageWidth / 2);
    const startY = centerY - 5;
    
    // Simple large block letters (each letter is 7x9)
    // For simplicity, we'll draw bold block letters
    const letterPatterns = this.getLargeLetterPatterns();
    
    // Clear message area first
    this.clearGameOverArea();
    
    let charIndex = 0;
    for (const char of message) {
      if (char === ' ') {
        charIndex++;
        continue;
      }
      
      const pattern = letterPatterns[char.toUpperCase()];
      if (pattern) {
        // Apply scale for pulse effect
        const scaledCharWidth = Math.floor(charWidth * scale);
        const scaledCharHeight = Math.floor(9 * scale);
        const charX = startX + (charIndex * charWidth) - Math.floor((scaledCharWidth - charWidth) / 2);
        const charY = startY - Math.floor((scaledCharHeight - 9) / 2);
        
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 7; col++) {
            if (pattern[row] && pattern[row][col] === 1) {
              // Scale the pixel
              for (let sy = 0; sy < scale; sy++) {
                for (let sx = 0; sx < scale; sx++) {
                  const px = Math.floor(charX + col * scale + sx);
                  const py = Math.floor(charY + row * scale + sy);
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
   */
  clearGameOverArea() {
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const clearWidth = 60;
    const clearHeight = 15;
    
    for (let py = centerY - clearHeight; py < centerY + clearHeight; py++) {
      for (let px = centerX - clearWidth; px < centerX + clearWidth; px++) {
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          const midX = Math.floor(this.width / 2);
          if (px !== midX && py !== 0 && py !== this.height - 1) {
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
        // Clear everything before starting new game
        this.clearGameOverArea();
        this.clearCountdownArea();
        this.startNewGame();
        return true;
      }
    }
    return false;
  }
  
  /**
   * Start a new game
   */
  startNewGame() {
    // Clear all animation areas
    this.clearGameOverArea();
    this.clearCountdownArea();
    
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
          // Clear everything before starting new game
          this.clearGameOverArea();
          this.clearCountdownArea();
          this.startNewGame();
        }
      }
    });
  }
  
  /**
   * Clear previous frame's dynamic elements
   */
  clearPreviousFrame() {
    const midX = Math.floor(this.width / 2);
    const scoreLeftX = 2;
    const scoreRightX = this.width - 7;
    const scoreY = 2;
    const scoreHeight = 7;
    
    // Clear left paddle
    for (let py = 0; py < this.PADDLE_HEIGHT; py++) {
      const y = this.prevLeftPaddleY + py;
      if (y >= 0 && y < this.height) {
        for (let px = 0; px < this.PADDLE_WIDTH; px++) {
          const x = this.PADDLE_LEFT_X + px;
          if (x >= 0 && x < this.width) {
            // Don't clear if it's part of the court or score area
            const isCourt = (x === midX || y === 0 || y === this.height - 1);
            const isScoreArea = (x >= scoreLeftX && x < scoreLeftX + 5 && 
                                 y >= scoreY && y < scoreY + scoreHeight) ||
                                (x >= scoreRightX && x < scoreRightX + 5 && 
                                 y >= scoreY && y < scoreY + scoreHeight);
            if (!isCourt && !isScoreArea) {
              this.display.setPixel(x, y, false);
            }
          }
        }
      }
    }
    
    // Clear right paddle
    for (let py = 0; py < this.PADDLE_HEIGHT; py++) {
      const y = this.prevRightPaddleY + py;
      if (y >= 0 && y < this.height) {
        for (let px = 0; px < this.PADDLE_WIDTH; px++) {
          const x = this.PADDLE_RIGHT_X + px;
          if (x >= 0 && x < this.width) {
            // Don't clear if it's part of the court or score area
            const isCourt = (x === midX || y === 0 || y === this.height - 1);
            const isScoreArea = (x >= scoreLeftX && x < scoreLeftX + 5 && 
                                 y >= scoreY && y < scoreY + scoreHeight) ||
                                (x >= scoreRightX && x < scoreRightX + 5 && 
                                 y >= scoreY && y < scoreY + scoreHeight);
            if (!isCourt && !isScoreArea) {
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
      // Don't clear if it's part of the court or score area
      const isCourt = (ballX === midX || ballY === 0 || ballY === this.height - 1);
      const isScoreArea = (ballX >= scoreLeftX && ballX < scoreLeftX + 5 && 
                           ballY >= scoreY && ballY < scoreY + scoreHeight) ||
                          (ballX >= scoreRightX && ballX < scoreRightX + 5 && 
                           ballY >= scoreY && ballY < scoreY + scoreHeight);
      if (!isCourt && !isScoreArea) {
        this.display.setPixel(ballX, ballY, false);
      }
    }
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
    
    // Constrain paddle to screen (can't move off back line)
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
    this.ball.vx = (Math.random() > 0.5 ? 1 : -1) * this.BALL_SPEED;
    this.ball.vy = (Math.random() > 0.5 ? 1 : -1) * this.BALL_SPEED * 0.7;
  }
  
  /**
   * Update game state (called each frame)
   */
  update() {
    if (this.gameState === 'MENU') {
      // Clear and redraw menu
      this.clearPreviousFrame();
      this.drawMenu();
      return;
    } else if (this.gameState === 'COUNTDOWN') {
      // Update countdown
      this.updateCountdown();
      // Don't update game objects during countdown
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
