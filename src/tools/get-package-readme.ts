import { cache, createCacheKey } from '../services/cache.js';
import { metaCpanApi } from '../services/metacpan-api.js';
import { readmeParser } from '../services/readme-parser.js';
import { logger } from '../utils/logger.js';
import { validateModuleName, validateBoolean } from '../utils/validators.js';
import { handleApiError } from '../utils/error-handler.js';
import type { GetPackageReadmeParams, PackageReadmeResponse, UsageExample, InstallationInfo, PackageBasicInfo, RepositoryInfo } from '../types/index.js';

export async function getPackageReadme(params: GetPackageReadmeParams): Promise<PackageReadmeResponse> {
  try {
    // Validate parameters
    const packageName = validateModuleName(params.package_name);
    const version = params.version || 'latest';
    const includeExamples = validateBoolean(params.include_examples, 'include_examples') ?? true;

    logger.debug(`Getting package README for ${packageName}`);

    // Check cache first
    const cacheKey = createCacheKey.moduleReadme(packageName);
    const cached = cache.get<PackageReadmeResponse>(cacheKey);
    if (cached) {
      logger.debug(`Using cached README for ${packageName}`);
      return cached;
    }

    // Get module information from MetaCPAN directly
    let moduleInfo;
    try {
      logger.debug(`Getting module info for: ${packageName}`);
      moduleInfo = await metaCpanApi.getModuleInfo(packageName);
    } catch (error) {
      // If module not found, return a response indicating non-existence
      logger.debug(`Module not found: ${packageName}`);
      return {
        package_name: packageName,
        version: version,
        description: '',
        readme_content: '',
        usage_examples: [],
        installation: {
          cpan: `cpan ${packageName}`,
          cpanm: `cpanm ${packageName}`,
          cpanfile: `requires '${packageName}';`,
        },
        basic_info: {
          name: packageName,
          version: version,
          description: '',
          author: '',
        },
        exists: false,
      };
    }
    
    logger.debug(`Module info retrieved for: ${packageName}`);
    
    // Use module info to get the actual version if not specified
    const actualVersion = version === 'latest' ? moduleInfo.version : version;
    
    // Get POD content for README using the module info
    logger.debug(`Getting POD content for: ${packageName}`);
    const podContent = await metaCpanApi.getModulePod(packageName);
    let readmeContent = '';
    let usageExamples: UsageExample[] = [];

    if (podContent) {
      logger.debug(`Converting POD to README for: ${packageName}`);
      readmeContent = readmeParser.convertPodToReadme(podContent);
      
      // Parse usage examples if requested
      if (includeExamples) {
        usageExamples = readmeParser.parseUsageExamples(podContent);
      }
    } else {
      // Create a basic README if no POD is available
      logger.debug(`Creating basic README for: ${packageName} (no POD available)`);
      readmeContent = createBasicReadme(packageName, moduleInfo.version, moduleInfo.abstract);
    }

    // Create installation info
    const installation: InstallationInfo = {
      cpan: `cpan ${packageName}`,
      cpanm: `cpanm ${packageName}`,
      cpanfile: `requires '${packageName}';`,
    };

    // Create basic info
    const basicInfo: PackageBasicInfo = {
      name: packageName,
      version: moduleInfo.version,
      description: moduleInfo.abstract,
      author: moduleInfo.author,
      license: moduleInfo.metadata?.license?.[0],
      keywords: moduleInfo.metadata?.keywords,
    };

    // Create repository info
    let repository: RepositoryInfo | undefined;
    if (moduleInfo.metadata?.resources?.repository) {
      repository = {
        type: moduleInfo.metadata.resources.repository.type,
        url: moduleInfo.metadata.resources.repository.url,
        web: moduleInfo.metadata.resources.repository.web,
      };
    }

    const result: PackageReadmeResponse = {
      package_name: packageName,
      version: actualVersion,
      description: moduleInfo.abstract,
      readme_content: readmeContent,
      usage_examples: usageExamples,
      installation,
      basic_info: basicInfo,
      repository,
      exists: true,
    };

    // Cache the result
    cache.set(cacheKey, result, 3600 * 1000); // Cache for 1 hour

    logger.info(`Successfully retrieved README for ${packageName}`);
    return result;
  } catch (error) {
    handleApiError(error, `get package README for ${params.package_name}`);
  }
}

function createBasicReadme(packageName: string, version: string, description: string): string {
  return `# ${packageName}

${description}

## Installation

### Using CPAN

\`\`\`bash
cpan ${packageName}
\`\`\`

### Using cpanm

\`\`\`bash
cpanm ${packageName}
\`\`\`

### Using cpanfile

Add to your cpanfile:

\`\`\`perl
requires '${packageName}';
\`\`\`

## Usage

\`\`\`perl
use ${packageName};

# Add your usage example here
\`\`\`

## Version

Current version: ${version}

## Documentation

For detailed documentation, please refer to the module's POD documentation or visit MetaCPAN.
`;
}