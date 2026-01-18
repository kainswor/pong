/**
 * PixelDisplay unit tests. Uses toASCII for Expected/Result assertions.
 */
import { describe, it, expect } from 'vitest';
import { createDisplayForTest } from './pixel-display-test-utils.js';
import { PIXEL_FONT } from '../src/sprites.js';

describe('PixelDisplay', () => {
  describe('2.1 clear, setPixel, getPixel', () => {
    it('clear() then toASCII(0,0,10,10) is 10x10 dots', () => {
      const d = createDisplayForTest({ emulatedWidth: 10, emulatedHeight: 10 });
      d.clear();
      const result = d.toASCII(0, 0, 10, 10);
      const expected = Array(10).fill('..........').join('\n');
      expect(result).toBe(expected);
    });

    it('setPixel(2,3,true) then getPixel(2,3)===true and toASCII(2,3,1,1)==="#"', () => {
      const d = createDisplayForTest({ emulatedWidth: 10, emulatedHeight: 10 });
      d.clear();
      d.setPixel(2, 3, true);
      expect(d.getPixel(2, 3)).toBe(true);
      expect(d.toASCII(2, 3, 1, 1)).toBe('#');
    });

    it('setPixel out of bounds: no throw; getPixel returns false', () => {
      const d = createDisplayForTest({ emulatedWidth: 10, emulatedHeight: 10 });
      d.setPixel(-1, 0, true);
      d.setPixel(0, -1, true);
      d.setPixel(10, 0, true);
      d.setPixel(0, 10, true);
      expect(d.getPixel(-1, 0)).toBe(false);
      expect(d.getPixel(0, -1)).toBe(false);
      expect(d.getPixel(10, 0)).toBe(false);
      expect(d.getPixel(0, 10)).toBe(false);
    });
  });

  describe('2.2 pattern drawing (drawPattern)', () => {
    it('digit 5 at (0,0) scale 1: drawPattern(PIXEL_FONT[5],0,0,1), toASCII(0,0,5,7) matches', () => {
      const d = createDisplayForTest({ emulatedWidth: 20, emulatedHeight: 20 });
      d.clear();
      d.drawPattern(PIXEL_FONT[5], 0, 0, 1);
      const result = d.toASCII(0, 0, 5, 7);
      const expected = '#####\n#....\n#....\n#####\n....#\n....#\n#####';
      expect(result).toBe(expected);
    });
  });

  describe('2.3 clearRect', () => {
    it('5x5 block on, clearRect(1,1,3,3) no preserve: center clear, corners stay #', () => {
      const d = createDisplayForTest({ emulatedWidth: 10, emulatedHeight: 10 });
      d.clear();
      for (let py = 0; py < 5; py++) for (let px = 0; px < 5; px++) d.setPixel(px, py, true);
      d.clearRect(1, 1, 3, 3);
      const center = d.toASCII(1, 1, 3, 3);
      expect(center).toBe('...\n...\n...');
      expect(d.getPixel(0, 0)).toBe(true);
      expect(d.getPixel(4, 0)).toBe(true);
      expect(d.getPixel(0, 4)).toBe(true);
      expect(d.getPixel(4, 4)).toBe(true);
    });
  });

  describe('2.4 time-dependent (CRT fade, degauss) with setTime', () => {
    it('fade-in: setTime(0), setPixel(0,0,true), setTime(52) -> brightness 1.0', () => {
      const d = createDisplayForTest({ emulatedWidth: 5, emulatedHeight: 5 });
      d.setTime(1);  // onTimestamp>0 required by calculateBrightness
      d.setPixel(0, 0, true);
      d.setTime(52);
      const b = d.calculateBrightness(d.pixels[0][0], 52);
      expect(b).toBe(1);
    });

    it('fade-out: setPixel(0,0,true), setTime(100), setPixel(0,0,false), setTime(150) brightness<1, setTime(350) brightness 0', () => {
      const d = createDisplayForTest({ emulatedWidth: 5, emulatedHeight: 5 });
      d.setTime(50);
      d.setPixel(0, 0, true);
      d.setTime(100);
      d.setPixel(0, 0, false);
      d.setTime(150);
      const bMid = d.calculateBrightness(d.pixels[0][0], 150);
      expect(bMid).toBeLessThan(1);
      d.setTime(350);
      const bEnd = d.calculateBrightness(d.pixels[0][0], 350);
      expect(bEnd).toBe(0);
    });

    it('degauss: setTime(1), degauss(), setTime(100) active; setTime(2500), render(), inactive', () => {
      const d = createDisplayForTest({ emulatedWidth: 20, emulatedHeight: 20 });
      d.setTime(1);  // degaussStartTime=1 so we can assert !==0 for "active"
      d.degauss();
      d.setTime(100);
      expect(d.degaussStartTime).not.toBe(0);
      d.setTime(2500);
      d.render();
      expect(d.degaussStartTime).toBe(0);
    });
  });
});
