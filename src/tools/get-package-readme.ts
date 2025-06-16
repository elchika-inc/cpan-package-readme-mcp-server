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
    const moduleName = validateModuleName(params.module_name);
    const includeExamples = validateBoolean(params.include_examples, 'include_examples') ?? true;

    logger.debug(`Getting package README for ${moduleName}`);

    // Check cache first
    const cacheKey = createCacheKey.moduleReadme(moduleName);
    const cached = cache.get<PackageReadmeResponse>(cacheKey);
    if (cached) {
      logger.debug(`Using cached README for ${moduleName}`);
      return cached;
    }

    // Get module information from MetaCPAN
    const moduleInfo = await metaCpanApi.getModuleInfo(moduleName);
    
    // Get POD content for README
    let podContent = await metaCpanApi.getModulePod(moduleName);
    let readmeContent = '';
    let usageExamples: UsageExample[] = [];

    if (podContent) {
      readmeContent = readmeParser.convertPodToReadme(podContent);
      
      // Parse usage examples if requested
      if (includeExamples) {
        usageExamples = readmeParser.parseUsageExamples(podContent);
      }
    } else {
      // Create a basic README if no POD is available
      readmeContent = createBasicReadme(moduleName, moduleInfo.version, moduleInfo.abstract);
    }

    // Create installation info
    const installation: InstallationInfo = {
      cpan: `cpan ${moduleName}`,
      cpanm: `cpanm ${moduleName}`,
      cpanfile: `requires '${moduleName}';`,
    };

    // Create basic info
    const basicInfo: PackageBasicInfo = {
      name: moduleName,
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
      module_name: moduleName,
      version: moduleInfo.version,
      description: moduleInfo.abstract,
      readme_content: readmeContent,
      usage_examples: usageExamples,
      installation,
      basic_info: basicInfo,
      repository,
    };

    // Cache the result
    cache.set(cacheKey, result, 3600 * 1000); // Cache for 1 hour

    logger.info(`Successfully retrieved README for ${moduleName}`);
    return result;
  } catch (error) {
    handleApiError(error, `get package README for ${params.module_name}`);
  }
}

function createBasicReadme(moduleName: string, version: string, description: string): string {
  return `# ${moduleName}

${description}

## Installation

### Using CPAN

\`\`\`bash
cpan ${moduleName}
\`\`\`

### Using cpanm

\`\`\`bash
cpanm ${moduleName}
\`\`\`

### Using cpanfile

Add to your cpanfile:

\`\`\`perl
requires '${moduleName}';
\`\`\`

## Usage

\`\`\`perl
use ${moduleName};

# Add your usage example here
\`\`\`

## Version

Current version: ${version}

## Documentation

For detailed documentation, please refer to the module's POD documentation or visit MetaCPAN.
`;
}