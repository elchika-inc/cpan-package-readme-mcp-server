import { BasePackageServer, ToolDefinition } from '@elchika-inc/package-readme-shared';
import { getPackageReadme } from './tools/get-package-readme.js';
import { getPackageInfo } from './tools/get-package-info.js';
import { searchPackages } from './tools/search-packages.js';
import {
  GetPackageReadmeParams,
  GetPackageInfoParams,
  SearchPackagesParams,
  CpanPackageReadmeMcpError,
} from './types/index.js';
import { logger } from './utils/logger.js';

const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  get_readme_from_cpan: {
    name: 'get_readme_from_cpan',
    description: 'Get package README and usage examples from CPAN',
    inputSchema: {
      type: 'object',
      properties: {
        package_name: {
          type: 'string',
          description: 'The name of the CPAN module (e.g., "Data::Dumper", "LWP::UserAgent")',
        },
        version: {
          type: 'string',
          description: 'Package version (optional, defaults to latest)',
        },
        include_examples: {
          type: 'boolean',
          description: 'Whether to include usage examples (default: true)',
          default: true,
        }
      },
      required: ['package_name'],
    },
  },
  get_package_info_from_cpan: {
    name: 'get_package_info_from_cpan',
    description: 'Get package basic information and dependencies from CPAN',
    inputSchema: {
      type: 'object',
      properties: {
        package_name: {
          type: 'string',
          description: 'The name of the CPAN module (e.g., "Data::Dumper", "LWP::UserAgent")',
        },
        include_dependencies: {
          type: 'boolean',
          description: 'Whether to include dependencies (default: true)',
          default: true,
        },
        include_dev_dependencies: {
          type: 'boolean',
          description: 'Whether to include test dependencies (default: false)',
          default: false,
        }
      },
      required: ['package_name'],
    },
  },
  search_packages_from_cpan: {
    name: 'search_packages_from_cpan',
    description: 'Search for packages in CPAN',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)',
          default: 20,
          minimum: 1,
          maximum: 100,
        }
      },
      required: ['query'],
    },
  },
} as const;

export class CpanPackageReadmeMcpServer extends BasePackageServer {
  constructor() {
    super({
      name: 'cpan-package-readme-mcp',
      version: '1.0.0',
    });
  }

  protected getToolDefinitions(): Record<string, ToolDefinition> {
    return TOOL_DEFINITIONS;
  }

  protected async handleToolCall(name: string, args: unknown): Promise<unknown> {
    try {
      switch (name) {
        case 'get_readme_from_cpan':
          return await getPackageReadme(args as GetPackageReadmeParams);
        
        case 'get_package_info_from_cpan':
          return await getPackageInfo(args as GetPackageInfoParams);
        
        case 'search_packages_from_cpan':
          return await searchPackages(args as SearchPackagesParams);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      logger.error(`Tool execution failed: ${name}`, error);
      throw error;
    }
  }



}

export default CpanPackageReadmeMcpServer;