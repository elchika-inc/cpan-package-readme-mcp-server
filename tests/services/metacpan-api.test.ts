import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest';
import { MetaCpanApi } from '../../src/services/metacpan-api.js';

// Mock fetch globally
const mockFetch = vi.fn() as Mock;
global.fetch = mockFetch;

describe('MetaCpanApi', () => {
  let api: MetaCpanApi;

  beforeEach(() => {
    api = new MetaCpanApi();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (vi.useRealTimers) {
      vi.useRealTimers();
    }
  });

  describe('getModuleInfo', () => {
    it('should fetch module info successfully', async () => {
      const mockResponse = {
        name: 'DBI',
        version: '1.643',
        abstract: 'Database independent interface for Perl',
        author: 'TIMB',
        pod: 'Some POD content',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getModuleInfo('DBI');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://fastapi.metacpan.org/v1/module/DBI',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'cpan-package-readme-mcp-server/1.0.0',
            'Accept': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(api.getModuleInfo('NonExistentModule')).rejects.toThrow(
        "Module 'NonExistentModule' not found"
      );
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(api.getModuleInfo('DBI')).rejects.toThrow(
        'HTTP 500: Internal Server Error'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getModuleInfo('DBI')).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(api.getModuleInfo('DBI')).rejects.toThrow();
    });
  });

  describe('searchModules', () => {
    it('should search modules successfully', async () => {
      const mockResponse = {
        hits: {
          hits: [
            {
              _source: {
                name: 'DBI',
                version: '1.643',
                abstract: 'Database independent interface for Perl',
                author: 'TIMB',
              },
            },
          ],
          total: { value: 1 },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.searchModules('database');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://fastapi.metacpan.org/v1/module/_search?q=database&size=20',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should escape special characters in query', async () => {
      const mockResponse = { hits: { hits: [], total: { value: 0 } } };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await api.searchModules('DBD::MySQL');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://fastapi.metacpan.org/v1/module/_search?q=DBD%5C%3A%5C%3AMySQL&size=20',
        expect.any(Object)
      );
    });

    it('should handle custom limit', async () => {
      const mockResponse = { hits: { hits: [], total: { value: 0 } } };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await api.searchModules('test', 50);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://fastapi.metacpan.org/v1/module/_search?q=test&size=50',
        expect.any(Object)
      );
    });
  });

  describe('getReleaseInfo', () => {
    it('should fetch release info successfully', async () => {
      const mockResponse = {
        name: 'DBI',
        version: '1.643',
        distribution: 'DBI',
        author: 'TIMB',
        date: '2023-01-01T00:00:00.000Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getReleaseInfo('DBI');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://fastapi.metacpan.org/v1/release/DBI',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle 404 errors for releases', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(api.getReleaseInfo('NonExistentRelease')).rejects.toThrow(
        "Release 'NonExistentRelease' not found"
      );
    });
  });

  describe('getModulePod', () => {
    it('should return POD from module info if available', async () => {
      const mockModuleResponse = {
        name: 'DBI',
        pod: 'This is the POD content',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockModuleResponse),
      });

      const result = await api.getModulePod('DBI');

      expect(result).toBe('This is the POD content');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should fetch POD from source if not in module info', async () => {
      const mockModuleResponse = { name: 'DBI' }; // No POD
      const mockPodResponse = { pod: 'POD from source' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockModuleResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockPodResponse),
        });

      const result = await api.getModulePod('DBI');

      expect(result).toBe('POD from source');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return null if no POD is found', async () => {
      const mockModuleResponse = { name: 'DBI' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockModuleResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });

      const result = await api.getModulePod('DBI');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.getModulePod('DBI');

      expect(result).toBeNull();
    });
  });

  describe('getModuleSource', () => {
    it('should fetch module source successfully', async () => {
      const mockSource = 'package DBI;\n\nuse strict;\n';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockSource),
      });

      const result = await api.getModuleSource('DBI');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://fastapi.metacpan.org/v1/source/DBI',
        expect.any(Object)
      );
      expect(result).toBe(mockSource);
    });

    it('should return null if source not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await api.getModuleSource('NonExistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.getModuleSource('DBI');

      expect(result).toBeNull();
    });
  });

  describe('fetchWithTimeout', () => {
    it('should include proper headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.getModuleInfo('test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'cpan-package-readme-mcp-server/1.0.0',
            'Accept': 'application/json',
          }),
          signal: expect.any(AbortSignal),
        })
      );
    });
  });
});