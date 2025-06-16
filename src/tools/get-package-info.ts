import { cache, createCacheKey } from '../services/cache.js';
import { metaCpanApi } from '../services/metacpan-api.js';
import { logger } from '../utils/logger.js';
import { validateModuleName, validateBoolean } from '../utils/validators.js';
import { handleApiError } from '../utils/error-handler.js';
import type { GetPackageInfoParams, PackageInfoResponse, RepositoryInfo } from '../types/index.js';

export async function getPackageInfo(params: GetPackageInfoParams): Promise<PackageInfoResponse> {
  try {
    // Validate parameters
    const packageName = validateModuleName(params.package_name);
    const includeDependencies = validateBoolean(params.include_dependencies, 'include_dependencies') ?? true;
    const includeDevDependencies = validateBoolean(params.include_dev_dependencies, 'include_dev_dependencies') ?? false;

    logger.debug(`Getting package info for ${packageName}`);

    // Check cache first
    const cacheKey = createCacheKey.moduleInfo(packageName);
    const cached = cache.get<PackageInfoResponse>(cacheKey);
    if (cached) {
      logger.debug(`Using cached info for ${packageName}`);
      return cached;
    }

    try {
      // Get module information from MetaCPAN
      const moduleInfo = await metaCpanApi.getModuleInfo(packageName);

      // Extract dependencies if requested
      let dependencies: string[] | undefined;
      let devDependencies: string[] | undefined;

      if (includeDependencies && moduleInfo.metadata?.requires) {
        dependencies = Object.keys(moduleInfo.metadata.requires).filter(dep => 
          dep !== 'perl' // Exclude perl itself
        );
      }

      if (includeDevDependencies && moduleInfo.metadata?.test_requires) {
        devDependencies = Object.keys(moduleInfo.metadata.test_requires).filter(dep => 
          dep !== 'perl' // Exclude perl itself
        );
      }

      // Create repository info
      let repository: RepositoryInfo | undefined;
      if (moduleInfo.metadata?.resources?.repository) {
        repository = {
          type: moduleInfo.metadata.resources.repository.type,
          url: moduleInfo.metadata.resources.repository.url,
          web: moduleInfo.metadata.resources.repository.web,
        };
      }

      const result: PackageInfoResponse = {
        package_name: packageName,
        latest_version: moduleInfo.version,
        description: moduleInfo.abstract,
        author: moduleInfo.author,
        license: moduleInfo.metadata?.license?.[0],
        keywords: moduleInfo.metadata?.keywords,
        dependencies,
        dev_dependencies: devDependencies,
        repository,
        distribution: moduleInfo.distribution,
        exists: true,
      };

      // Cache the result
      cache.set(cacheKey, result, 1800 * 1000); // Cache for 30 minutes

      logger.info(`Successfully retrieved info for ${packageName}`);
      return result;
    } catch (error) {
      // Return a response indicating the package doesn't exist
      logger.warn(`Package ${packageName} not found in CPAN`);
      return {
        package_name: packageName,
        latest_version: '',
        description: '',
        author: '',
        distribution: '',
        exists: false,
      };
    }
  } catch (error) {
    handleApiError(error, `get package info for ${params.package_name}`);
  }
}