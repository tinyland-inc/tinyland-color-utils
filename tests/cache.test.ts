import { describe, it, expect, beforeEach } from 'vitest';
import {
  ColorCache,
  parseCache,
  conversionCache,
  luminanceCache,
  contrastCache,
  clearAllCaches,
  getAllCacheStats,
} from '../src/index';

beforeEach(() => {
  clearAllCaches();
});

// ---------------------------------------------------------------------------
// ColorCache class
// ---------------------------------------------------------------------------
describe('ColorCache', () => {
  it('should store and retrieve values', () => {
    const cache = new ColorCache<string, number>(10);
    cache.set('key1', 42);
    expect(cache.get('key1')).toBe(42);
  });

  it('should return undefined for missing keys', () => {
    const cache = new ColorCache<string, number>(10);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('should report correct size', () => {
    const cache = new ColorCache<string, number>(10);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.size).toBe(3);
  });

  it('should evict oldest entry when full', () => {
    const cache = new ColorCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4); // should evict 'a'
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('d')).toBe(4);
    expect(cache.size).toBe(3);
  });

  it('should move accessed item to most-recently-used position', () => {
    const cache = new ColorCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    // Access 'a' to make it most recent
    cache.get('a');
    // Now insert 'd', which should evict 'b' (the oldest after access)
    cache.set('d', 4);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('should update existing key in-place', () => {
    const cache = new ColorCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('a', 10);
    expect(cache.get('a')).toBe(10);
    expect(cache.size).toBe(2);
  });

  it('should clear all entries', () => {
    const cache = new ColorCache<string, number>(10);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });

  it('should report has correctly', () => {
    const cache = new ColorCache<string, number>(10);
    cache.set('exists', 1);
    expect(cache.has('exists')).toBe(true);
    expect(cache.has('missing')).toBe(false);
  });

  it('should provide correct stats', () => {
    const cache = new ColorCache<string, number>(100);
    cache.set('a', 1);
    cache.set('b', 2);
    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBe(100);
    expect(stats.utilizationPercent).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Singleton caches
// ---------------------------------------------------------------------------
describe('singleton caches', () => {
  it('parseCache should work', () => {
    parseCache.set('test', { r: 255, g: 0, b: 0 });
    expect(parseCache.get('test')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('conversionCache should work', () => {
    conversionCache.set('test', { r: 0, g: 255, b: 0 });
    expect(conversionCache.get('test')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('luminanceCache should work', () => {
    luminanceCache.set('128,128,128', 0.2159);
    expect(luminanceCache.get('128,128,128')).toBeCloseTo(0.2159);
  });

  it('contrastCache should work', () => {
    contrastCache.set('255,255,255|0,0,0', 21);
    expect(contrastCache.get('255,255,255|0,0,0')).toBe(21);
  });
});

// ---------------------------------------------------------------------------
// clearAllCaches
// ---------------------------------------------------------------------------
describe('clearAllCaches', () => {
  it('should clear all singleton caches', () => {
    parseCache.set('a', { r: 0, g: 0, b: 0 });
    conversionCache.set('b', { r: 0, g: 0, b: 0 });
    luminanceCache.set('c', 0.5);
    contrastCache.set('d', 10);

    clearAllCaches();

    expect(parseCache.size).toBe(0);
    expect(conversionCache.size).toBe(0);
    expect(luminanceCache.size).toBe(0);
    expect(contrastCache.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getAllCacheStats
// ---------------------------------------------------------------------------
describe('getAllCacheStats', () => {
  it('should return stats for all caches', () => {
    parseCache.set('a', { r: 0, g: 0, b: 0 });
    luminanceCache.set('b', 0.5);

    const stats = getAllCacheStats();

    expect(stats.parseCache.size).toBe(1);
    expect(stats.luminanceCache.size).toBe(1);
    expect(stats.conversionCache.size).toBe(0);
    expect(stats.contrastCache.size).toBe(0);

    expect(stats.parseCache.maxSize).toBe(1000);
    expect(stats.conversionCache.maxSize).toBe(500);
    expect(stats.luminanceCache.maxSize).toBe(500);
    expect(stats.contrastCache.maxSize).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// LRU eviction ordering
// ---------------------------------------------------------------------------
describe('LRU eviction ordering', () => {
  it('should maintain correct eviction order across many operations', () => {
    const cache = new ColorCache<number, number>(5);
    // Fill cache
    for (let i = 0; i < 5; i++) {
      cache.set(i, i * 10);
    }
    expect(cache.size).toBe(5);

    // Access item 0 and 1 to make them recent
    cache.get(0);
    cache.get(1);

    // Add new items, should evict 2, 3, 4 in order
    cache.set(10, 100);
    expect(cache.has(2)).toBe(false); // 2 was oldest untouched
    expect(cache.has(0)).toBe(true);
    expect(cache.has(1)).toBe(true);

    cache.set(11, 110);
    expect(cache.has(3)).toBe(false); // 3 was next oldest

    cache.set(12, 120);
    expect(cache.has(4)).toBe(false); // 4 was next oldest

    // 0 and 1 should still be there
    expect(cache.get(0)).toBe(0);
    expect(cache.get(1)).toBe(10);
  });
});
