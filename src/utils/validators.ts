import { CpanPackageReadmeMcpError } from '../types/index.js';

export function validateModuleName(moduleName: unknown): string {
  if (typeof moduleName !== 'string') {
    throw new CpanPackageReadmeMcpError(
      'Module name must be a string',
      'INVALID_MODULE_NAME'
    );
  }

  if (moduleName.trim().length === 0) {
    throw new CpanPackageReadmeMcpError(
      'Module name cannot be empty',
      'INVALID_MODULE_NAME'
    );
  }

  // CPAN module names can contain letters, numbers, colons, and hyphens
  const validNameRegex = /^[a-zA-Z][a-zA-Z0-9:_-]*$/;
  if (!validNameRegex.test(moduleName)) {
    throw new CpanPackageReadmeMcpError(
      'Module name contains invalid characters. Must start with a letter and contain only letters, numbers, colons, hyphens, and underscores',
      'INVALID_MODULE_NAME'
    );
  }

  return moduleName.trim();
}

export function validateSearchQuery(query: unknown): string {
  if (typeof query !== 'string') {
    throw new CpanPackageReadmeMcpError(
      'Search query must be a string',
      'INVALID_SEARCH_QUERY'
    );
  }

  if (query.trim().length === 0) {
    throw new CpanPackageReadmeMcpError(
      'Search query cannot be empty',
      'INVALID_SEARCH_QUERY'
    );
  }

  if (query.length > 200) {
    throw new CpanPackageReadmeMcpError(
      'Search query is too long (maximum 200 characters)',
      'INVALID_SEARCH_QUERY'
    );
  }

  return query.trim();
}

export function validateLimit(limit: unknown): number {
  if (limit === undefined || limit === null) {
    return 20; // Default limit
  }

  if (typeof limit !== 'number') {
    throw new CpanPackageReadmeMcpError(
      'Limit must be a number',
      'INVALID_LIMIT'
    );
  }

  if (!Number.isInteger(limit)) {
    throw new CpanPackageReadmeMcpError(
      'Limit must be an integer',
      'INVALID_LIMIT'
    );
  }

  if (limit < 1) {
    throw new CpanPackageReadmeMcpError(
      'Limit must be at least 1',
      'INVALID_LIMIT'
    );
  }

  if (limit > 100) {
    throw new CpanPackageReadmeMcpError(
      'Limit cannot exceed 100',
      'INVALID_LIMIT'
    );
  }

  return limit;
}

export function validateBoolean(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new CpanPackageReadmeMcpError(
      `${fieldName} must be a boolean`,
      'INVALID_PARAMETER'
    );
  }

  return value;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') {
    return '';
  }
  
  // eslint-disable-next-line no-control-regex
  return str.trim().replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

export function normalizeModuleName(moduleName: string): string {
  // Convert :: to - for distribution names if needed
  return moduleName.replace(/::/g, '-');
}