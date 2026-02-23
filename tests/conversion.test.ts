import { describe, it, expect, beforeEach } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToOklch,
  rgbToOklab,
  oklchToRgb,
  oklabToRgb,
  oklchToOklab,
  oklabToOklch,
  oklchStringToRgbValues,
  alphaBlend,
  clearAllCaches,
} from '../src/index';
import type { RGB, HSL, OKLCH, OKLAB } from '../src/index';

beforeEach(() => {
  clearAllCaches();
});




describe('hexToRgb', () => {
  it('should convert white hex to RGB', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('should convert black hex to RGB', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it('should convert red hex to RGB', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('should handle hex with alpha channel', () => {
    const result = hexToRgb('#ff000080');
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
    expect(result.a).toBeCloseTo(128 / 255, 2);
  });

  it('should throw for invalid hex', () => {
    expect(() => hexToRgb('xyz')).toThrow();
  });
});

describe('rgbToHex', () => {
  it('should convert white RGB to hex', () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
  });

  it('should convert black RGB to hex', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('should clamp out-of-range values', () => {
    expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#ff0080');
  });

  it('should include alpha when less than 1', () => {
    const hex = rgbToHex({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(hex).toMatch(/^#ff0000[0-9a-f]{2}$/);
  });
});




describe('rgbToHsl', () => {
  it('should convert red to HSL', () => {
    const result = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(result.h).toBeCloseTo(0);
    expect(result.s).toBeCloseTo(100);
    expect(result.l).toBeCloseTo(50);
  });

  it('should convert green to HSL', () => {
    const result = rgbToHsl({ r: 0, g: 255, b: 0 });
    expect(result.h).toBeCloseTo(120);
    expect(result.s).toBeCloseTo(100);
    expect(result.l).toBeCloseTo(50);
  });

  it('should convert blue to HSL', () => {
    const result = rgbToHsl({ r: 0, g: 0, b: 255 });
    expect(result.h).toBeCloseTo(240);
    expect(result.s).toBeCloseTo(100);
    expect(result.l).toBeCloseTo(50);
  });

  it('should convert gray to achromatic HSL', () => {
    const result = rgbToHsl({ r: 128, g: 128, b: 128 });
    expect(result.h).toBe(0);
    expect(result.s).toBe(0);
    expect(result.l).toBeCloseTo(50.2, 0);
  });
});

describe('hslToRgb', () => {
  it('should convert red HSL to RGB', () => {
    const result = hslToRgb({ h: 0, s: 100, l: 50 });
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });

  it('should handle achromatic (grayscale)', () => {
    const result = hslToRgb({ h: 0, s: 0, l: 50 });
    expect(result.r).toBe(128);
    expect(result.g).toBe(128);
    expect(result.b).toBe(128);
  });

  it('should preserve alpha', () => {
    const result = hslToRgb({ h: 0, s: 100, l: 50, a: 0.5 });
    expect(result.a).toBe(0.5);
  });
});




describe('RGB <-> HSL round-trip', () => {
  fcTest.prop(
    [fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 })],
  )('round-trips through HSL and back to RGB within tolerance', (r, g, b) => {
    const original: RGB = { r, g, b };
    const hsl = rgbToHsl(original);
    const roundTripped = hslToRgb(hsl);
    
    expect(roundTripped.r).toBeGreaterThanOrEqual(r - 1);
    expect(roundTripped.r).toBeLessThanOrEqual(r + 1);
    expect(roundTripped.g).toBeGreaterThanOrEqual(g - 1);
    expect(roundTripped.g).toBeLessThanOrEqual(g + 1);
    expect(roundTripped.b).toBeGreaterThanOrEqual(b - 1);
    expect(roundTripped.b).toBeLessThanOrEqual(b + 1);
  });
});




describe('oklchToRgb', () => {
  it('should convert black OKLCH to RGB', () => {
    const result = oklchToRgb(0, 0, 0);
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });

  it('should convert white OKLCH to RGB', () => {
    const result = oklchToRgb(1, 0, 0);
    expect(result.r).toBe(255);
    expect(result.g).toBe(255);
    expect(result.b).toBe(255);
  });

  it('should produce valid RGB values', () => {
    const result = oklchToRgb(0.5, 0.15, 27);
    expect(result.r).toBeGreaterThanOrEqual(0);
    expect(result.r).toBeLessThanOrEqual(255);
    expect(result.g).toBeGreaterThanOrEqual(0);
    expect(result.g).toBeLessThanOrEqual(255);
    expect(result.b).toBeGreaterThanOrEqual(0);
    expect(result.b).toBeLessThanOrEqual(255);
  });
});

describe('oklabToRgb', () => {
  it('should convert black OKLAB to RGB', () => {
    const result = oklabToRgb(0, 0, 0);
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });

  it('should convert white OKLAB to RGB', () => {
    const result = oklabToRgb(1, 0, 0);
    expect(result.r).toBe(255);
    expect(result.g).toBe(255);
    expect(result.b).toBe(255);
  });
});

describe('rgbToOklch', () => {
  it('should convert red RGB to OKLCH', () => {
    const result = rgbToOklch({ r: 255, g: 0, b: 0 });
    expect(result.l).toBeGreaterThan(0);
    expect(result.l).toBeLessThan(1);
    expect(result.c).toBeGreaterThan(0);
    expect(result.h).toBeGreaterThanOrEqual(0);
    expect(result.h).toBeLessThanOrEqual(360);
  });

  it('should convert black RGB to OKLCH with zero chroma', () => {
    const result = rgbToOklch({ r: 0, g: 0, b: 0 });
    expect(result.l).toBeCloseTo(0, 1);
    expect(result.c).toBeCloseTo(0, 1);
  });
});

describe('rgbToOklab', () => {
  it('should convert white RGB to OKLAB with l near 1', () => {
    const result = rgbToOklab({ r: 255, g: 255, b: 255 });
    expect(result.l).toBeCloseTo(1, 1);
    expect(result.a).toBeCloseTo(0, 1);
    expect(result.b).toBeCloseTo(0, 1);
  });
});




describe('oklchToOklab / oklabToOklch', () => {
  it('should round-trip oklch through oklab', () => {
    const original: OKLCH = { l: 0.5, c: 0.15, h: 120 };
    const oklab = oklchToOklab(original);
    const roundTripped = oklabToOklch(oklab);
    expect(roundTripped.l).toBeCloseTo(original.l, 5);
    expect(roundTripped.c).toBeCloseTo(original.c, 5);
    expect(roundTripped.h).toBeCloseTo(original.h, 3);
  });

  fcTest.prop(
    [
      fc.float({ min: 0, max: 1, noNaN: true }),
      fc.float({ min: 0, max: Math.fround(0.4), noNaN: true }),
      fc.float({ min: Math.fround(0.01), max: Math.fround(359.99), noNaN: true }),
    ],
  )('round-trips oklch through oklab for arbitrary values', (l, c, h) => {
    
    if (c < 0.0001) return;
    const original: OKLCH = { l, c, h };
    const oklab = oklchToOklab(original);
    const roundTripped = oklabToOklch(oklab);
    expect(roundTripped.l).toBeCloseTo(l, 4);
    expect(roundTripped.c).toBeCloseTo(c, 4);
    expect(roundTripped.h).toBeCloseTo(h, 2);
  });
});




describe('oklchStringToRgbValues', () => {
  it('should convert oklch string to space-separated RGB', () => {
    const result = oklchStringToRgbValues('oklch(0.5 0.19 27)');
    const parts = result.split(' ').map(Number);
    expect(parts).toHaveLength(3);
    parts.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(255);
    });
  });

  it('should return "0 0 0" for invalid input', () => {
    expect(oklchStringToRgbValues('invalid')).toBe('0 0 0');
  });
});




describe('alphaBlend', () => {
  it('should blend fully opaque foreground over background', () => {
    const result = alphaBlend({ r: 255, g: 0, b: 0, a: 1 }, { r: 0, g: 255, b: 0 });
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });

  it('should blend fully transparent foreground over background', () => {
    const result = alphaBlend({ r: 255, g: 0, b: 0, a: 0 }, { r: 0, g: 255, b: 0 });
    expect(result.r).toBe(0);
    expect(result.g).toBe(255);
    expect(result.b).toBe(0);
  });

  it('should blend 50% alpha correctly', () => {
    const result = alphaBlend({ r: 255, g: 0, b: 0, a: 0.5 }, { r: 0, g: 0, b: 255 });
    expect(result.r).toBe(128);
    expect(result.g).toBe(0);
    expect(result.b).toBe(128);
  });

  it('should have alpha=1 in result', () => {
    const result = alphaBlend({ r: 100, g: 100, b: 100, a: 0.5 }, { r: 200, g: 200, b: 200 });
    expect(result.a).toBe(1);
  });
});




describe('hex round-trip', () => {
  fcTest.prop(
    [fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 })],
  )('rgbToHex -> hexToRgb round-trips', (r, g, b) => {
    const hex = rgbToHex({ r, g, b });
    const result = hexToRgb(hex);
    expect(result.r).toBe(r);
    expect(result.g).toBe(g);
    expect(result.b).toBe(b);
  });
});
