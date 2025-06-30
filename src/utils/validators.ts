import { CpanPackageReadmeMcpError } from '../types/index.js';

export function validateModuleName(moduleName: unknown): string {
  if (typeof moduleName !== 'string') {
    throw new CpanPackageReadmeMcpError(
      'Module name must be a string',
      'INVALID_MODULE_NAME'
    );
  }

  const trimmedName = moduleName.trim();
  
  if (trimmedName.length === 0) {
    throw new CpanPackageReadmeMcpError(
      'Module name cannot be empty. Please provide a valid CPAN module name like "DBI" or "DBD::MySQL".',
      'INVALID_MODULE_NAME'
    );
  }

  // Check for common invalid patterns and provide helpful suggestions
  if (trimmedName.includes(' ')) {
    throw new CpanPackageReadmeMcpError(
      `Module name "${trimmedName}" contains spaces. CPAN module names should not contain spaces. Did you mean "${trimmedName.replace(/\s+/g, '-')}"?`,
      'INVALID_MODULE_NAME'
    );
  }

  if (trimmedName.includes('/')) {
    throw new CpanPackageReadmeMcpError(
      `Module name "${trimmedName}" contains slashes. CPAN module names use '::' as namespace separators. Did you mean "${trimmedName.replace(/\//g, '::')}"?`,
      'INVALID_MODULE_NAME'
    );
  }

  if (trimmedName.includes('.')) {
    throw new CpanPackageReadmeMcpError(
      `Module name "${trimmedName}" contains dots. CPAN module names use '::' as namespace separators. Did you mean "${trimmedName.replace(/\./g, '::')}"?`,
      'INVALID_MODULE_NAME'
    );
  }

  // Check for common typos or patterns before general validation
  if (trimmedName.includes(':::')) {
    throw new CpanPackageReadmeMcpError(
      `Module name "${trimmedName}" contains triple colons. Did you mean "${trimmedName.replace(/:::/g, '::')}"?`,
      'INVALID_MODULE_NAME'
    );
  }

  if (trimmedName.startsWith('::') || trimmedName.endsWith('::')) {
    throw new CpanPackageReadmeMcpError(
      `Module name "${trimmedName}" starts or ends with '::'. Module names should not begin or end with namespace separators. Example: "DBI::mysql" not "::DBI::mysql::".`,
      'INVALID_MODULE_NAME'
    );
  }

  // CPAN module names: letters, numbers, colons, underscores, hyphens
  // Must start with a letter, can contain :: for namespaces
  const validNameRegex = /^[a-zA-Z][a-zA-Z0-9:_-]*$/;
  if (!validNameRegex.test(trimmedName)) {
    let suggestion = '';
    
    // Check if it starts with a number
    if (/^[0-9]/.test(trimmedName)) {
      suggestion = ' Module names must start with a letter.';
    } else {
      // Extract invalid characters for feedback
      const invalidCharsMatch = trimmedName.match(/[^a-zA-Z0-9:_-]/g);
      if (invalidCharsMatch) {
        const invalidChars = Array.from(new Set(invalidCharsMatch));
        suggestion = ` Invalid characters found: ${invalidChars.join(', ')}. `;
      }
    }
    
    throw new CpanPackageReadmeMcpError(
      `Module name "${trimmedName}" contains invalid characters.${suggestion} Valid CPAN module names must start with a letter and contain only letters, numbers, colons (::), underscores (_), and hyphens (-). Examples: "DBI", "DBD::MySQL", "File::Spec".`,
      'INVALID_MODULE_NAME'
    );
  }

  // Check for excessively long names
  if (trimmedName.length > 100) {
    throw new CpanPackageReadmeMcpError(
      `Module name "${trimmedName}" is too long (${trimmedName.length} characters). CPAN module names should be reasonably short and descriptive.`,
      'INVALID_MODULE_NAME'
    );
  }

  return trimmedName;
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