import { describe, it, expect } from 'vitest';
import {
  validateModuleName,
  validateSearchQuery,
  validateLimit,
  validateBoolean,
  isValidUrl,
  sanitizeString,
  normalizeModuleName,
} from '../../src/utils/validators.js';
import { CpanPackageReadmeMcpError } from '../../src/types/index.js';

describe('validators', () => {
  describe('validateModuleName', () => {
    it('should accept valid module names', () => {
      const validNames = [
        'DBI',
        'DBD::MySQL',
        'File::Spec',
        'Test::More',
        'Module_Name',
        'Module-Name',
        'Some::Really::Deep::Module::Name',
        'Mod123',
        'Test_Case',
        'HTTP-Tiny',
      ];

      validNames.forEach(name => {
        expect(validateModuleName(name)).toBe(name);
      });
    });

    it('should trim whitespace from module names', () => {
      expect(validateModuleName('  DBI  ')).toBe('DBI');
      expect(validateModuleName('\t\nDBD::MySQL\r\n ')).toBe('DBD::MySQL');
    });

    it('should reject non-string input', () => {
      expect(() => validateModuleName(123)).toThrow(CpanPackageReadmeMcpError);
      expect(() => validateModuleName(null)).toThrow('Module name must be a string');
      expect(() => validateModuleName(undefined)).toThrow('Module name must be a string');
      expect(() => validateModuleName({})).toThrow('Module name must be a string');
      expect(() => validateModuleName([])).toThrow('Module name must be a string');
    });

    it('should reject empty module names', () => {
      expect(() => validateModuleName('')).toThrow('Module name cannot be empty');
      expect(() => validateModuleName('   ')).toThrow('Module name cannot be empty');
      expect(() => validateModuleName('\t\n')).toThrow('Module name cannot be empty');
    });

    it('should reject module names with spaces and suggest alternatives', () => {
      expect(() => validateModuleName('My Module')).toThrow('contains spaces');
      expect(() => validateModuleName('My Module')).toThrow('My-Module');
      expect(() => validateModuleName('Test Case Module')).toThrow('Test-Case-Module');
    });

    it('should reject module names with slashes and suggest alternatives', () => {
      expect(() => validateModuleName('DBI/MySQL')).toThrow('contains slashes');
      expect(() => validateModuleName('DBI/MySQL')).toThrow('DBI::MySQL');
      expect(() => validateModuleName('File/Path/Utils')).toThrow('File::Path::Utils');
    });

    it('should reject module names with dots and suggest alternatives', () => {
      expect(() => validateModuleName('DBI.MySQL')).toThrow('contains dots');
      expect(() => validateModuleName('DBI.MySQL')).toThrow('DBI::MySQL');
      expect(() => validateModuleName('File.Spec.Utils')).toThrow('File::Spec::Utils');
    });

    it('should reject module names starting with numbers', () => {
      expect(() => validateModuleName('123Module')).toThrow('must start with a letter');
      expect(() => validateModuleName('9Test')).toThrow('invalid characters');
    });

    it('should reject module names with invalid characters', () => {
      expect(() => validateModuleName('Module@Name')).toThrow('Invalid characters found: @');
      expect(() => validateModuleName('Module#Name$')).toThrow('Invalid characters found: #, $');
      expect(() => validateModuleName('Module%Name^')).toThrow('Invalid characters found: %, ^');
    });

    it('should reject module names with triple colons', () => {
      expect(() => validateModuleName('DBI:::MySQL')).toThrow('triple colons');
      expect(() => validateModuleName('DBI:::MySQL')).toThrow('DBI::MySQL');
    });

    it('should reject module names starting or ending with ::', () => {
      expect(() => validateModuleName('::DBI')).toThrow('starts or ends with \'::\'');
      expect(() => validateModuleName('DBI::')).toThrow('starts or ends with \'::\'');
      expect(() => validateModuleName('::DBI::MySQL::')).toThrow('starts or ends with \'::\'');
    });

    it('should reject excessively long module names', () => {
      const longName = 'A'.repeat(101);
      expect(() => validateModuleName(longName)).toThrow('too long');
      expect(() => validateModuleName(longName)).toThrow('101 characters');
    });

    it('should provide helpful error messages', () => {
      try {
        validateModuleName('invalid name');
      } catch (error) {
        expect(error).toBeInstanceOf(CpanPackageReadmeMcpError);
        expect((error as CpanPackageReadmeMcpError).code).toBe('INVALID_MODULE_NAME');
        expect((error as CpanPackageReadmeMcpError).message).toContain('invalid-name');
      }
    });
  });

  describe('validateSearchQuery', () => {
    it('should accept valid search queries', () => {
      const validQueries = [
        'database',
        'web framework',
        'DBI',
        'test automation',
        'HTTP client',
        'XML parser',
        'JSON::XS',
        'search query with special chars: @#$%',
      ];

      validQueries.forEach(query => {
        expect(validateSearchQuery(query)).toBe(query.trim());
      });
    });

    it('should trim whitespace from queries', () => {
      expect(validateSearchQuery('  database  ')).toBe('database');
      expect(validateSearchQuery('\t\nweb framework\r\n ')).toBe('web framework');
    });

    it('should reject non-string input', () => {
      expect(() => validateSearchQuery(123)).toThrow('Search query must be a string');
      expect(() => validateSearchQuery(null)).toThrow('Search query must be a string');
      expect(() => validateSearchQuery(undefined)).toThrow('Search query must be a string');
      expect(() => validateSearchQuery({})).toThrow('Search query must be a string');
    });

    it('should reject empty queries', () => {
      expect(() => validateSearchQuery('')).toThrow('Search query cannot be empty');
      expect(() => validateSearchQuery('   ')).toThrow('Search query cannot be empty');
      expect(() => validateSearchQuery('\t\n')).toThrow('Search query cannot be empty');
    });

    it('should reject queries that are too long', () => {
      const longQuery = 'a'.repeat(201);
      expect(() => validateSearchQuery(longQuery)).toThrow('too long');
      expect(() => validateSearchQuery(longQuery)).toThrow('maximum 200 characters');
    });

    it('should provide correct error codes', () => {
      try {
        validateSearchQuery('');
      } catch (error) {
        expect(error).toBeInstanceOf(CpanPackageReadmeMcpError);
        expect((error as CpanPackageReadmeMcpError).code).toBe('INVALID_SEARCH_QUERY');
      }
    });
  });

  describe('validateLimit', () => {
    it('should return default limit for undefined/null', () => {
      expect(validateLimit(undefined)).toBe(20);
      expect(validateLimit(null)).toBe(20);
    });

    it('should accept valid limits', () => {
      expect(validateLimit(1)).toBe(1);
      expect(validateLimit(10)).toBe(10);
      expect(validateLimit(50)).toBe(50);
      expect(validateLimit(100)).toBe(100);
    });

    it('should reject non-number input', () => {
      expect(() => validateLimit('10')).toThrow('Limit must be a number');
      expect(() => validateLimit({})).toThrow('Limit must be a number');
      expect(() => validateLimit([])).toThrow('Limit must be a number');
    });

    it('should reject non-integer numbers', () => {
      expect(() => validateLimit(10.5)).toThrow('Limit must be an integer');
      expect(() => validateLimit(3.14)).toThrow('Limit must be an integer');
      expect(() => validateLimit(NaN)).toThrow('Limit must be an integer');
      expect(() => validateLimit(Infinity)).toThrow('Limit must be an integer');
    });

    it('should reject limits less than 1', () => {
      expect(() => validateLimit(0)).toThrow('Limit must be at least 1');
      expect(() => validateLimit(-1)).toThrow('Limit must be at least 1');
      expect(() => validateLimit(-10)).toThrow('Limit must be at least 1');
    });

    it('should reject limits greater than 100', () => {
      expect(() => validateLimit(101)).toThrow('Limit cannot exceed 100');
      expect(() => validateLimit(200)).toThrow('Limit cannot exceed 100');
      expect(() => validateLimit(1000)).toThrow('Limit cannot exceed 100');
    });

    it('should provide correct error codes', () => {
      try {
        validateLimit('invalid');
      } catch (error) {
        expect(error).toBeInstanceOf(CpanPackageReadmeMcpError);
        expect((error as CpanPackageReadmeMcpError).code).toBe('INVALID_LIMIT');
      }
    });
  });

  describe('validateBoolean', () => {
    it('should return undefined for undefined/null', () => {
      expect(validateBoolean(undefined, 'test')).toBeUndefined();
      expect(validateBoolean(null, 'test')).toBeUndefined();
    });

    it('should accept boolean values', () => {
      expect(validateBoolean(true, 'test')).toBe(true);
      expect(validateBoolean(false, 'test')).toBe(false);
    });

    it('should reject non-boolean values', () => {
      expect(() => validateBoolean('true', 'includeExamples')).toThrow('includeExamples must be a boolean');
      expect(() => validateBoolean(1, 'flag')).toThrow('flag must be a boolean');
      expect(() => validateBoolean(0, 'enabled')).toThrow('enabled must be a boolean');
      expect(() => validateBoolean({}, 'option')).toThrow('option must be a boolean');
    });

    it('should include field name in error message', () => {
      try {
        validateBoolean('not a boolean', 'myField');
      } catch (error) {
        expect((error as Error).message).toContain('myField');
      }
    });

    it('should provide correct error codes', () => {
      try {
        validateBoolean('invalid', 'test');
      } catch (error) {
        expect(error).toBeInstanceOf(CpanPackageReadmeMcpError);
        expect((error as CpanPackageReadmeMcpError).code).toBe('INVALID_PARAMETER');
      }
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path',
        'https://example.com:8080',
        'https://subdomain.example.com',
        'https://example.com/path?query=value',
        'https://example.com/path#anchor',
        'ftp://example.com',
        'file:///path/to/file',
      ];

      validUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not a url',
        'example.com',
        'http://',
        'https://',
        '',
        '   ',
        'http://[invalid',
      ];

      invalidUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(false);
      });
    });
  });

  describe('sanitizeString', () => {
    it('should return empty string for non-string input', () => {
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString({})).toBe('');
      expect(sanitizeString([])).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\t\nhello\r\n ')).toBe('hello');
    });

    it('should remove control characters', () => {
      expect(sanitizeString('hello\x00world')).toBe('helloworld');
      expect(sanitizeString('test\x01\x02\x03')).toBe('test');
      expect(sanitizeString('line1\x0Aline2')).toBe('line1line2'); // \x0A is newline
      expect(sanitizeString('text\x7F')).toBe('text'); // DEL character
    });

    it('should preserve normal characters', () => {
      expect(sanitizeString('Hello World!')).toBe('Hello World!');
      expect(sanitizeString('Special chars: @#$%^&*()')).toBe('Special chars: @#$%^&*()');
      expect(sanitizeString('Unicode: 日本語')).toBe('Unicode: 日本語');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });
  });

  describe('normalizeModuleName', () => {
    it('should convert :: to - for distribution names', () => {
      expect(normalizeModuleName('DBI')).toBe('DBI');
      expect(normalizeModuleName('DBD::MySQL')).toBe('DBD-MySQL');
      expect(normalizeModuleName('File::Spec::Unix')).toBe('File-Spec-Unix');
      expect(normalizeModuleName('Some::Really::Deep::Module')).toBe('Some-Really-Deep-Module');
    });

    it('should handle module names without ::', () => {
      expect(normalizeModuleName('SimpleModule')).toBe('SimpleModule');
      expect(normalizeModuleName('Module_Name')).toBe('Module_Name');
      expect(normalizeModuleName('Module-Name')).toBe('Module-Name');
    });

    it('should handle empty strings', () => {
      expect(normalizeModuleName('')).toBe('');
    });

    it('should handle edge cases', () => {
      expect(normalizeModuleName('::')).toBe('-');
      expect(normalizeModuleName('::Module::')).toBe('-Module-');
      expect(normalizeModuleName('Multiple::::Colons')).toBe('Multiple--Colons');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle various input types gracefully', () => {
      // Test with symbols
      expect(() => validateModuleName(Symbol('test'))).toThrow();
      
      // Test with functions
      expect(() => validateSearchQuery(() => {})).toThrow();
      
      // Test with dates
      expect(() => validateLimit(new Date())).toThrow();
    });

    it('should maintain error code consistency', () => {
      const errorTests = [
        { fn: () => validateModuleName(123), code: 'INVALID_MODULE_NAME' },
        { fn: () => validateSearchQuery(123), code: 'INVALID_SEARCH_QUERY' },
        { fn: () => validateLimit('invalid'), code: 'INVALID_LIMIT' },
        { fn: () => validateBoolean('invalid', 'test'), code: 'INVALID_PARAMETER' },
      ];

      errorTests.forEach(({ fn, code }) => {
        try {
          fn();
          fail('Expected error to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(CpanPackageReadmeMcpError);
          expect((error as CpanPackageReadmeMcpError).code).toBe(code);
        }
      });
    });
  });
});