import { describe, it, expect, beforeEach } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import {
  parseColor,
  parseHex,
  parseRgb,
  parseHsl,
  parseOklchString,
  parseOklabString,
  parseOklchToRgb,
  parseOklabToRgb,
  clearAllCaches,
} from '../src/index';

beforeEach(() => {
  clearAllCaches();
});

// ---------------------------------------------------------------------------
// parseHex
// ---------------------------------------------------------------------------
describe('parseHex', () => {
  it('should parse 6-digit hex', () => {
    const result = parseHex('#ff0000');
    expect(result).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('should parse 6-digit hex without hash', () => {
    const result = parseHex('00ff00');
    expect(result).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });

  it('should parse 3-digit hex', () => {
    const result = parseHex('#fff');
    expect(result).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('should parse 3-digit hex color', () => {
    const result = parseHex('#abc');
    expect(result).toEqual({ r: 170, g: 187, b: 204, a: 1 });
  });

  it('should parse 8-digit hex with alpha', () => {
    const result = parseHex('#ff000080');
    expect(result).not.toBeNull();
    expect(result!.r).toBe(255);
    expect(result!.g).toBe(0);
    expect(result!.b).toBe(0);
    expect(result!.a).toBeCloseTo(128 / 255, 2);
  });

  it('should return null for invalid hex length', () => {
    // parseHex doesn't validate hex chars (returns NaN values for non-hex),
    // but does reject invalid lengths
    expect(parseHex('#12')).toBeNull();
    expect(parseHex('')).toBeNull();
    expect(parseHex('#1')).toBeNull();
    expect(parseHex('#12345')).toBeNull();
  });

  it('should handle black and white', () => {
    expect(parseHex('#000000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(parseHex('#ffffff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });
});

// ---------------------------------------------------------------------------
// parseRgb
// ---------------------------------------------------------------------------
describe('parseRgb', () => {
  it('should parse legacy comma-separated rgb', () => {
    const result = parseRgb('rgb(255, 128, 0)');
    expect(result).toEqual({ r: 255, g: 128, b: 0, a: 1 });
  });

  it('should parse legacy rgba with alpha', () => {
    const result = parseRgb('rgba(255, 128, 0, 0.5)');
    expect(result).toEqual({ r: 255, g: 128, b: 0, a: 0.5 });
  });

  it('should parse modern space-separated rgb', () => {
    const result = parseRgb('rgb(255 128 0)');
    expect(result).toEqual({ r: 255, g: 128, b: 0, a: 1 });
  });

  it('should parse modern rgb with slash alpha', () => {
    const result = parseRgb('rgb(255 128 0 / 0.5)');
    expect(result).toEqual({ r: 255, g: 128, b: 0, a: 0.5 });
  });

  it('should parse modern rgb with percentage alpha', () => {
    const result = parseRgb('rgb(255 128 0 / 50%)');
    expect(result).toEqual({ r: 255, g: 128, b: 0, a: 0.5 });
  });

  it('should return null for invalid rgb', () => {
    expect(parseRgb('rgb()')).toBeNull();
    expect(parseRgb('not-a-color')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseHsl
// ---------------------------------------------------------------------------
describe('parseHsl', () => {
  it('should parse hsl and convert to rgb', () => {
    const result = parseHsl('hsl(0, 100%, 50%)');
    expect(result).not.toBeNull();
    expect(result!.r).toBe(255);
    expect(result!.g).toBe(0);
    expect(result!.b).toBe(0);
  });

  it('should parse hsla with alpha', () => {
    const result = parseHsl('hsla(120, 100%, 50%, 0.5)');
    expect(result).not.toBeNull();
    expect(result!.g).toBe(255);
    expect(result!.a).toBe(0.5);
  });

  it('should handle achromatic (grayscale)', () => {
    const result = parseHsl('hsl(0, 0%, 50%)');
    expect(result).not.toBeNull();
    expect(result!.r).toBe(128);
    expect(result!.g).toBe(128);
    expect(result!.b).toBe(128);
  });

  it('should return null for invalid hsl', () => {
    expect(parseHsl('hsl()')).toBeNull();
    expect(parseHsl('not-a-color')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseOklchString
// ---------------------------------------------------------------------------
describe('parseOklchString', () => {
  it('should parse basic oklch', () => {
    const result = parseOklchString('oklch(0.5 0.19 27)');
    expect(result).not.toBeNull();
    expect(result!.l).toBeCloseTo(0.5);
    expect(result!.c).toBeCloseTo(0.19);
    expect(result!.h).toBeCloseTo(27);
    expect(result!.alpha).toBe(1);
  });

  it('should parse oklch with percentage lightness', () => {
    const result = parseOklchString('oklch(50% 0.19 27)');
    expect(result).not.toBeNull();
    expect(result!.l).toBeCloseTo(0.5);
  });

  it('should parse oklch with deg suffix', () => {
    const result = parseOklchString('oklch(0.5 0.19 27deg)');
    expect(result).not.toBeNull();
    expect(result!.h).toBeCloseTo(27);
  });

  it('should parse oklch with alpha', () => {
    const result = parseOklchString('oklch(0.5 0.19 27 / 0.5)');
    expect(result).not.toBeNull();
    expect(result!.alpha).toBeCloseTo(0.5);
  });

  it('should parse oklch with percentage alpha', () => {
    const result = parseOklchString('oklch(0.5 0.19 27 / 50%)');
    expect(result).not.toBeNull();
    expect(result!.alpha).toBeCloseTo(0.5);
  });

  it('should parse oklch with grad hue unit', () => {
    const result = parseOklchString('oklch(0.5 0.19 200grad)');
    expect(result).not.toBeNull();
    expect(result!.h).toBeCloseTo(180);
  });

  it('should parse oklch with rad hue unit', () => {
    const result = parseOklchString('oklch(0.5 0.19 3.14159rad)');
    expect(result).not.toBeNull();
    expect(result!.h).toBeCloseTo(180, 0);
  });

  it('should parse oklch with turn hue unit', () => {
    const result = parseOklchString('oklch(0.5 0.19 0.5turn)');
    expect(result).not.toBeNull();
    expect(result!.h).toBeCloseTo(180);
  });

  it('should return null for invalid oklch', () => {
    expect(parseOklchString('oklch()')).toBeNull();
    expect(parseOklchString('rgb(255,0,0)')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseOklabString
// ---------------------------------------------------------------------------
describe('parseOklabString', () => {
  it('should parse basic oklab', () => {
    const result = parseOklabString('oklab(0.5 0.1 -0.05)');
    expect(result).not.toBeNull();
    expect(result!.l).toBeCloseTo(0.5);
    expect(result!.a).toBeCloseTo(0.1);
    expect(result!.b).toBeCloseTo(-0.05);
    expect(result!.alpha).toBe(1);
  });

  it('should parse oklab with percentage lightness', () => {
    const result = parseOklabString('oklab(50% 0.1 -0.05)');
    expect(result).not.toBeNull();
    expect(result!.l).toBeCloseTo(0.5);
  });

  it('should parse oklab with alpha', () => {
    const result = parseOklabString('oklab(0.5 0.1 -0.05 / 0.8)');
    expect(result).not.toBeNull();
    expect(result!.alpha).toBeCloseTo(0.8);
  });

  it('should return null for invalid oklab', () => {
    expect(parseOklabString('oklab()')).toBeNull();
    expect(parseOklabString('hsl(0, 0%, 0%)')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseOklchToRgb / parseOklabToRgb
// ---------------------------------------------------------------------------
describe('parseOklchToRgb', () => {
  it('should convert oklch string to RGB', () => {
    const result = parseOklchToRgb('oklch(0.5 0.19 27)');
    expect(result).not.toBeNull();
    expect(result!.r).toBeGreaterThanOrEqual(0);
    expect(result!.r).toBeLessThanOrEqual(255);
    expect(result!.g).toBeGreaterThanOrEqual(0);
    expect(result!.g).toBeLessThanOrEqual(255);
    expect(result!.b).toBeGreaterThanOrEqual(0);
    expect(result!.b).toBeLessThanOrEqual(255);
  });

  it('should return null for invalid input', () => {
    expect(parseOklchToRgb('invalid')).toBeNull();
  });
});

describe('parseOklabToRgb', () => {
  it('should convert oklab string to RGB', () => {
    const result = parseOklabToRgb('oklab(0.5 0.1 -0.05)');
    expect(result).not.toBeNull();
    expect(result!.r).toBeGreaterThanOrEqual(0);
    expect(result!.r).toBeLessThanOrEqual(255);
  });

  it('should return null for invalid input', () => {
    expect(parseOklabToRgb('invalid')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseColor (unified parser)
// ---------------------------------------------------------------------------
describe('parseColor', () => {
  it('should parse hex colors', () => {
    const result = parseColor('#ff0000');
    expect(result).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('should parse rgb colors', () => {
    const result = parseColor('rgb(0, 255, 0)');
    expect(result).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });

  it('should parse hsl colors', () => {
    const result = parseColor('hsl(240, 100%, 50%)');
    expect(result).not.toBeNull();
    expect(result!.b).toBe(255);
  });

  it('should parse oklch colors', () => {
    const result = parseColor('oklch(0.5 0.19 27)');
    expect(result).not.toBeNull();
  });

  it('should parse oklab colors', () => {
    const result = parseColor('oklab(0.5 0.1 -0.05)');
    expect(result).not.toBeNull();
  });

  it('should parse named colors', () => {
    expect(parseColor('red')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('black')).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor('white')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('should return null for empty string', () => {
    expect(parseColor('')).toBeNull();
  });

  it('should return null for unknown color', () => {
    expect(parseColor('notacolor')).toBeNull();
  });

  it('should handle transparent', () => {
    const result = parseColor('transparent');
    expect(result).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it('should return cached results on second call', () => {
    const first = parseColor('#abcdef');
    const second = parseColor('#abcdef');
    expect(first).toEqual(second);
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------
describe('property-based parsing', () => {
  fcTest.prop(
    [fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 })],
  )('parseRgb round-trips rgb(r, g, b) strings', (r, g, b) => {
    const str = `rgb(${r}, ${g}, ${b})`;
    const result = parseRgb(str);
    expect(result).not.toBeNull();
    expect(result!.r).toBe(r);
    expect(result!.g).toBe(g);
    expect(result!.b).toBe(b);
  });

  fcTest.prop(
    [
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
    ],
  )('parseHex round-trips 6-digit hex', (r, g, b) => {
    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    const result = parseHex(hex);
    expect(result).not.toBeNull();
    expect(result!.r).toBe(r);
    expect(result!.g).toBe(g);
    expect(result!.b).toBe(b);
  });

  fcTest.prop(
    [
      fc.float({ min: 0, max: 1, noNaN: true }),
      fc.float({ min: 0, max: Math.fround(0.4), noNaN: true }),
      fc.float({ min: 0, max: 360, noNaN: true }),
    ],
  )('parseOklchString parses valid oklch values', (l, c, h) => {
    const str = `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(4)})`;
    const result = parseOklchString(str);
    expect(result).not.toBeNull();
    expect(result!.l).toBeCloseTo(l, 3);
    expect(result!.c).toBeCloseTo(c, 3);
    expect(result!.h).toBeCloseTo(h, 3);
  });
});
