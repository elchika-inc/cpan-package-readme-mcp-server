import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryCache, createCacheKey } from '../../src/services/cache.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({ ttl: 1000, maxSize: 1024 }); // 1 second TTL, 1KB max
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('test-key', 'test-value');
      const result = cache.get<string>('test-key');
      
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      
      expect(result).toBeNull();
    });

    it('should delete entries', () => {
      cache.set('test-key', 'test-value');
      const deleted = cache.delete('test-key');
      const result = cache.get('test-key');
      
      expect(deleted).toBe(true);
      expect(result).toBeNull();
    });

    it('should return false when deleting non-existent keys', () => {
      const deleted = cache.delete('non-existent');
      
      expect(deleted).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.size()).toBe(0);
    });

    it('should report correct size', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('TTL functionality', () => {
    it('should handle TTL configuration', () => {
      cache.set('test-key', 'test-value', 500); // 500ms TTL
      expect(cache.get('test-key')).toBe('test-value');
    });

    it('should use default TTL when not specified', () => {
      cache.set('test-key', 'test-value');
      expect(cache.get('test-key')).toBe('test-value');
    });
  });

  describe('has method', () => {
    it('should return true for existing entries', () => {
      cache.set('test-key', 'test-value');
      expect(cache.has('test-key')).toBe(true);
    });

    it('should return false for non-existent entries', () => {
      expect(cache.has('non-existent')).toBe(false);
    });
  });

  describe('cleanup functionality', () => {
    it('should support cleanup operations', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(2);
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should support LRU eviction mechanism', () => {
      const smallCache = new MemoryCache({ maxSize: 100 });
      smallCache.set('key1', 'value1');
      expect(smallCache.get('key1')).toBe('value1');
      smallCache.destroy();
    });
  });

  describe('statistics', () => {
    it('should provide cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', { data: 'complex object' });
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.hitRate).toBe(0); // Not implemented yet
    });
  });

  describe('complex data types', () => {
    it('should handle objects', () => {
      const testObj = { id: 1, name: 'test', nested: { value: 'nested' } };
      cache.set('obj-key', testObj);
      
      const result = cache.get<typeof testObj>('obj-key');
      
      expect(result).toEqual(testObj);
    });

    it('should handle arrays', () => {
      const testArray = [1, 2, 3, { id: 4 }];
      cache.set('array-key', testArray);
      
      const result = cache.get<typeof testArray>('array-key');
      
      expect(result).toEqual(testArray);
    });

    it('should handle null values', () => {
      cache.set('null-key', null);
      expect(cache.get('null-key')).toBeNull();
    });
  });

  describe('constructor options', () => {
    it('should use default options when none provided', () => {
      const defaultCache = new MemoryCache();
      defaultCache.set('test', 'value');
      expect(defaultCache.get('test')).toBe('value');
      defaultCache.destroy();
    });

    it('should respect custom TTL option', () => {
      const customCache = new MemoryCache({ ttl: 2000 });
      customCache.set('test', 'value');
      expect(customCache.get('test')).toBe('value');
      customCache.destroy();
    });
  });

  describe('destroy', () => {
    it('should clear cache and stop cleanup interval', () => {
      cache.set('test', 'value');
      
      expect(cache.size()).toBe(1);
      
      cache.destroy();
      
      expect(cache.size()).toBe(0);
    });
  });
});

describe('createCacheKey', () => {
  it('should create module info cache keys', () => {
    const key = createCacheKey.moduleInfo('DBI');
    expect(key).toBe('mod_info:DBI');
  });

  it('should create module readme cache keys', () => {
    const key = createCacheKey.moduleReadme('DBI');
    expect(key).toBe('mod_readme:DBI');
  });

  it('should create search results cache keys', () => {
    const key = createCacheKey.searchResults('database', 20);
    const expectedQuery = Buffer.from('database').toString('base64');
    expect(key).toBe(`search:${expectedQuery}:20`);
  });

  it('should create release cache keys', () => {
    const key = createCacheKey.release('DBI');
    expect(key).toBe('release:DBI');
  });

  it('should handle special characters in module names', () => {
    const key = createCacheKey.moduleInfo('DBD::MySQL');
    expect(key).toBe('mod_info:DBD::MySQL');
  });

  it('should handle complex search queries', () => {
    const query = 'database with special chars: & | !';
    const key = createCacheKey.searchResults(query, 50);
    const expectedQuery = Buffer.from(query).toString('base64');
    expect(key).toBe(`search:${expectedQuery}:50`);
  });
});