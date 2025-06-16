export interface UsageExample {
  title: string;
  description?: string | undefined;
  code: string;
  language: string; // 'perl', 'bash', etc.
}

export interface InstallationInfo {
  cpan: string;      // "cpan Module::Name"
  cpanm: string;     // "cpanm Module::Name"
  cpanfile?: string; // "requires 'Module::Name';"
}

export interface AuthorInfo {
  name: string;
  email?: string;
  pauseid?: string;
}

export interface RepositoryInfo {
  type: string;
  url: string;
  web?: string | undefined;
}

export interface PackageBasicInfo {
  name: string;
  version: string;
  description: string;
  author: string | AuthorInfo;
  license?: string | undefined;
  keywords?: string[] | undefined;
}

export interface CpanPackageSearchResult {
  name: string;
  version: string;
  description: string;
  author: string;
  distribution: string;
  release_date: string;
  abstract?: string;
}

// Tool Parameters
export interface GetPackageReadmeParams {
  package_name: string;    // Package name (required)
  version?: string;        // Package version (optional, defaults to latest)
  include_examples?: boolean; // Whether to include examples (optional, default: true)
}

export interface GetPackageInfoParams {
  package_name: string;
  include_dependencies?: boolean; // Whether to include dependencies (default: true)
  include_dev_dependencies?: boolean; // Whether to include dev/test dependencies (default: false)
}

export interface SearchPackagesParams {
  query: string;          // Search query
  limit?: number;         // Max results (default: 20)
}

// Tool Responses
export interface PackageReadmeResponse {
  package_name: string;
  version: string;
  description: string;
  readme_content: string;
  usage_examples: UsageExample[];
  installation: InstallationInfo;
  basic_info: PackageBasicInfo;
  repository?: RepositoryInfo | undefined;
  exists: boolean;
}

export interface PackageInfoResponse {
  package_name: string;
  latest_version: string;
  description: string;
  author: string;
  license?: string | undefined;
  keywords?: string[] | undefined;
  dependencies?: string[] | undefined;
  dev_dependencies?: string[] | undefined;
  repository?: RepositoryInfo | undefined;
  distribution: string;
  exists: boolean;
}

export interface SearchPackagesResponse {
  query: string;
  total: number;
  packages: CpanPackageSearchResult[];
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

// MetaCPAN API Types
export interface MetaCpanModuleResponse {
  name: string;
  version: string;
  abstract: string;
  author: string;
  authorized: boolean;
  date: string;
  deprecated: boolean;
  distribution: string;
  download_url: string;
  license?: string[];
  maturity: string;
  metadata: {
    name: string;
    version: string;
    abstract: string;
    author: string[];
    license: string[];
    generated_by: string;
    'meta-spec': {
      version: string;
      url: string;
    };
    resources?: {
      bugtracker?: {
        web: string;
      };
      homepage?: string;
      license?: string[];
      repository?: {
        type: string;
        url: string;
        web?: string;
      };
    };
    requires?: {
      [module: string]: string;
    };
    build_requires?: {
      [module: string]: string;
    };
    test_requires?: {
      [module: string]: string;
    };
    keywords?: string[];
  };
  pod?: string;
  pod_lines?: [number, number][];
  release: string;
  stat: {
    mode: number;
    size: number;
    mtime: number;
  };
  status: string;
  tests?: {
    fail: number;
    na: number;
    pass: number;
    unknown: number;
  };
}

export interface MetaCpanSearchResponse {
  hits: {
    hits: {
      _source: {
        name: string;
        version: string;
        abstract: string;
        author: string;
        distribution: string;
        date: string;
        deprecated: boolean;
        maturity: string;
        authorized: boolean;
      };
      _score: number;
    }[];
    total: {
      value: number;
      relation: string;
    };
  };
}

export interface MetaCpanReleaseResponse {
  name: string;
  version: string;
  author: string;
  abstract: string;
  date: string;
  download_url: string;
  license: string[];
  maturity: string;
  metadata: {
    abstract: string;
    author: string[];
    license: string[];
    name: string;
    version: string;
    resources?: {
      bugtracker?: {
        web: string;
      };
      homepage?: string;
      repository?: {
        type: string;
        url: string;
        web?: string;
      };
    };
    requires?: {
      [module: string]: string;
    };
    build_requires?: {
      [module: string]: string;
    };
    test_requires?: {
      [module: string]: string;
    };
    keywords?: string[];
  };
  stat: {
    size: number;
    mtime: number;
  };
  tests?: {
    fail: number;
    na: number;
    pass: number;
    unknown: number;
  };
}

// Error Types
export class CpanPackageReadmeMcpError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CpanPackageReadmeMcpError';
  }
}

export class PackageNotFoundError extends CpanPackageReadmeMcpError {
  constructor(moduleName: string) {
    super(`Module '${moduleName}' not found`, 'PACKAGE_NOT_FOUND', 404);
  }
}

export class RateLimitError extends CpanPackageReadmeMcpError {
  constructor(service: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${service}`, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
  }
}

export class NetworkError extends CpanPackageReadmeMcpError {
  constructor(message: string, originalError?: Error) {
    super(`Network error: ${message}`, 'NETWORK_ERROR', undefined, originalError);
  }
}