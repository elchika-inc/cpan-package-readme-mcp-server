import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleApiError,
  isNetworkError,
  isPackageNotFoundError,
  isRateLimitError,
  extractErrorMessage,
  sanitizeErrorForLogging,
} from '../../src/utils/error-handler.js';

describe('error-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('should handle 404 errors', () => {
      const error = new Error('Not found');
      (error as any).status = 404;

      expect(() => handleApiError(error, 'test operation')).toThrow('Resource not found in test operation');
    });

    it('should handle 429 rate limit errors', () => {
      const error = new Error('Too many requests');
      (error as any).statusCode = 429;

      expect(() => handleApiError(error, 'API call')).toThrow('Rate limit exceeded for API call');
    });

    it('should handle 500 server errors', () => {
      const error = new Error('Internal server error');
      (error as any).status = 500;

      expect(() => handleApiError(error, 'server request')).toThrow('Service unavailable for server request');
    });

    it('should handle 502 bad gateway errors', () => {
      const error = new Error('Bad gateway');
      (error as any).status = 502;

      expect(() => handleApiError(error, 'gateway')).toThrow('Service unavailable for gateway');
    });

    it('should handle 503 service unavailable errors', () => {
      const error = new Error('Service unavailable');
      (error as any).status = 503;

      expect(() => handleApiError(error, 'service')).toThrow('Service unavailable for service');
    });

    it('should handle 504 gateway timeout errors', () => {
      const error = new Error('Gateway timeout');
      (error as any).status = 504;

      expect(() => handleApiError(error, 'timeout')).toThrow('Service unavailable for timeout');
    });

    it('should handle other HTTP status codes', () => {
      const error = new Error('Bad request');
      (error as any).status = 400;

      expect(() => handleApiError(error, 'validation')).toThrow('API error in validation: Bad request');
    });

    it('should handle ENOTFOUND network errors', () => {
      const error = new Error('getaddrinfo ENOTFOUND example.com');

      expect(() => handleApiError(error, 'DNS lookup')).toThrow('Network error in DNS lookup');
    });

    it('should handle ECONNREFUSED network errors', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:8080');

      expect(() => handleApiError(error, 'connection')).toThrow('Network error in connection');
    });

    it('should handle ETIMEDOUT network errors', () => {
      const error = new Error('request ETIMEDOUT');

      expect(() => handleApiError(error, 'timeout')).toThrow('Network error in timeout');
    });

    it('should handle generic Error objects', () => {
      const error = new Error('Something went wrong');

      expect(() => handleApiError(error, 'generic operation')).toThrow('Error in generic operation: Something went wrong');
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';

      expect(() => handleApiError(error, 'string error')).toThrow('Unknown error in string error: String error');
    });

    it('should handle null/undefined errors', () => {
      expect(() => handleApiError(null, 'null error')).toThrow('Unknown error in null error: null');
      expect(() => handleApiError(undefined, 'undefined error')).toThrow('Unknown error in undefined error: undefined');
    });

    it('should handle object without message', () => {
      const error = { someProperty: 'value' };

      expect(() => handleApiError(error, 'object error')).toThrow('Unknown error in object error');
    });

    it('should prioritize status over statusCode', () => {
      const error = new Error('Conflict');
      (error as any).status = 404;
      (error as any).statusCode = 429;

      expect(() => handleApiError(error, 'priority test')).toThrow('Resource not found in priority test');
    });
  });

  describe('isNetworkError', () => {
    it('should identify NetworkError by name', () => {
      const error = new Error('Network failed');
      error.name = 'NetworkError';

      expect(isNetworkError(error)).toBe(true);
    });

    it('should identify network errors by ENOTFOUND', () => {
      const error = new Error('getaddrinfo ENOTFOUND example.com');

      expect(isNetworkError(error)).toBe(true);
    });

    it('should identify network errors by ECONNREFUSED', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:8080');

      expect(isNetworkError(error)).toBe(true);
    });

    it('should identify network errors by ETIMEDOUT', () => {
      const error = new Error('request ETIMEDOUT');

      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for non-network errors', () => {
      const error = new Error('Regular error');

      expect(isNetworkError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isNetworkError('string')).toBe(false);
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError({})).toBe(false);
    });
  });

  describe('isPackageNotFoundError', () => {
    it('should identify PackageNotFoundError by name', () => {
      const error = new Error('Package missing');
      error.name = 'PackageNotFoundError';

      expect(isPackageNotFoundError(error)).toBe(true);
    });

    it('should identify package not found errors by message', () => {
      const error = new Error('Package not found');

      expect(isPackageNotFoundError(error)).toBe(true);
    });

    it('should identify case variations', () => {
      const error = new Error('Module Not Found');

      expect(isPackageNotFoundError(error)).toBe(true);
    });

    it('should return false for non-package-not-found errors', () => {
      const error = new Error('Regular error');

      expect(isPackageNotFoundError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isPackageNotFoundError('string')).toBe(false);
      expect(isPackageNotFoundError(null)).toBe(false);
    });
  });

  describe('isRateLimitError', () => {
    it('should identify RateLimitError by name', () => {
      const error = new Error('Too many requests');
      error.name = 'RateLimitError';

      expect(isRateLimitError(error)).toBe(true);
    });

    it('should identify rate limit errors by message', () => {
      const error = new Error('rate limit exceeded');

      expect(isRateLimitError(error)).toBe(true);
    });

    it('should identify 429 status in message', () => {
      const error = new Error('HTTP 429 Too Many Requests');

      expect(isRateLimitError(error)).toBe(true);
    });

    it('should handle case variations', () => {
      const error = new Error('Rate Limit Exceeded');

      expect(isRateLimitError(error)).toBe(true);
    });

    it('should return false for non-rate-limit errors', () => {
      const error = new Error('Regular error');

      expect(isRateLimitError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isRateLimitError('string')).toBe(false);
      expect(isRateLimitError(null)).toBe(false);
    });
  });

  describe('extractErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('Test error message');

      expect(extractErrorMessage(error)).toBe('Test error message');
    });

    it('should return string errors as-is', () => {
      expect(extractErrorMessage('String error')).toBe('String error');
    });

    it('should extract message from objects with message property', () => {
      const error = { message: 'Object error message' };

      expect(extractErrorMessage(error)).toBe('Object error message');
    });

    it('should convert non-string message to string', () => {
      const error = { message: 123 };

      expect(extractErrorMessage(error)).toBe('123');
    });

    it('should handle null/undefined', () => {
      expect(extractErrorMessage(null)).toBe('Unknown error occurred');
      expect(extractErrorMessage(undefined)).toBe('Unknown error occurred');
    });

    it('should handle objects without message', () => {
      const error = { someProperty: 'value' };

      expect(extractErrorMessage(error)).toBe('Unknown error occurred');
    });

    it('should handle primitive values', () => {
      expect(extractErrorMessage(123)).toBe('Unknown error occurred');
      expect(extractErrorMessage(true)).toBe('Unknown error occurred');
    });
  });

  describe('sanitizeErrorForLogging', () => {
    it('should sanitize Error objects', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test';

      const sanitized = sanitizeErrorForLogging(error);

      expect(sanitized).toEqual({
        name: 'Error',
        message: 'Test error',
        stack: 'Error: Test error\n    at test',
      });
    });

    it('should include code property if present', () => {
      const error = new Error('Custom error') as any;
      error.code = 'CUSTOM_ERROR';

      const sanitized = sanitizeErrorForLogging(error);

      expect(sanitized).toEqual({
        name: 'Error',
        message: 'Custom error',
        stack: error.stack,
        code: 'CUSTOM_ERROR',
      });
    });

    it('should include statusCode property if present', () => {
      const error = new Error('HTTP error') as any;
      error.statusCode = 404;

      const sanitized = sanitizeErrorForLogging(error);

      expect(sanitized).toEqual({
        name: 'Error',
        message: 'HTTP error',
        stack: error.stack,
        statusCode: 404,
      });
    });

    it('should include both code and statusCode if present', () => {
      const error = new Error('API error') as any;
      error.code = 'API_ERROR';
      error.statusCode = 500;

      const sanitized = sanitizeErrorForLogging(error);

      expect(sanitized).toEqual({
        name: 'Error',
        message: 'API error',
        stack: error.stack,
        code: 'API_ERROR',
        statusCode: 500,
      });
    });

    it('should return non-Error objects as-is', () => {
      const error = { custom: 'error object' };

      expect(sanitizeErrorForLogging(error)).toBe(error);
    });

    it('should return primitives as-is', () => {
      expect(sanitizeErrorForLogging('string error')).toBe('string error');
      expect(sanitizeErrorForLogging(123)).toBe(123);
      expect(sanitizeErrorForLogging(null)).toBe(null);
      expect(sanitizeErrorForLogging(undefined)).toBe(undefined);
    });

    it('should handle Error objects without stack', () => {
      const error = new Error('No stack error');
      delete error.stack;

      const sanitized = sanitizeErrorForLogging(error);

      expect(sanitized).toEqual({
        name: 'Error',
        message: 'No stack error',
        stack: undefined,
      });
    });
  });

  describe('integration and edge cases', () => {
    it('should handle complex error scenarios', () => {
      const complexError = new Error('Rate limit exceeded') as any;
      complexError.status = 429;
      complexError.code = 'RATE_LIMIT_EXCEEDED';
      complexError.details = { retryAfter: 60 };

      expect(() => handleApiError(complexError, 'complex operation')).toThrow('Rate limit exceeded for complex operation');
      expect(isRateLimitError(complexError)).toBe(true);
      
      const sanitized = sanitizeErrorForLogging(complexError);
      expect(sanitized).toMatchObject({
        name: 'Error',
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
      });
    });

    it('should handle errors with circular references in sanitization', () => {
      const error = new Error('Circular error') as any;
      error.circular = error; // Create circular reference

      const sanitized = sanitizeErrorForLogging(error);
      
      expect(sanitized).toMatchObject({
        name: 'Error',
        message: 'Circular error',
      });
    });
  });
});