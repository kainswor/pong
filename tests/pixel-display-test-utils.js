/**
 * Test utilities for PixelDisplay: mock canvas and display factory.
 */
import { PixelDisplay } from '../src/pixel-display.js';

/**
 * Create a mock canvas suitable for headless Node.
 * getContext('2d') returns { fillStyle, fillRect }; width/height are writable.
 */
export function createMockCanvas() {
  return {
    getContext(id) {
      if (id === '2d') {
        return { fillStyle: '', fillRect() {} };
      }
      return null;
    },
    width: 0,
    height: 0
  };
}

/**
 * Create a PixelDisplay for tests. Uses mock canvas by default.
 * @param {Object} overrides - Optional: { canvas, emulatedWidth, emulatedHeight, displayWidth, displayHeight }
 */
export function createDisplayForTest(overrides = {}) {
  const canvas = overrides.canvas ?? createMockCanvas();
  const emulatedWidth = overrides.emulatedWidth ?? 160;
  const emulatedHeight = overrides.emulatedHeight ?? 120;
  const displayWidth = overrides.displayWidth ?? 800;
  const displayHeight = overrides.displayHeight ?? 600;
  return new PixelDisplay(canvas, emulatedWidth, emulatedHeight, displayWidth, displayHeight);
}
