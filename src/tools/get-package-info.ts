import { cache, createCacheKey } from '../services/cache.js';
import { metaCpanApi } from '../services/metacpan-api.js';
import { logger } from '../utils/logger.js';
import { validateModuleName, validateBoolean } from '../utils/validators.js';
import { handleApiError } from '../utils/error-handler.js';
import type { GetPackageInfoParams, PackageInfoResponse, RepositoryInfo } from '../types/index.js';

export async function getPackageInfo(params: GetPackageInfoParams): Promise<PackageInfoResponse> {
  try {
    // Validate parameters
    const moduleName = validateModuleName(params.module_name);
    const includeDependencies = validateBoolean(params.include_dependencies, 'include_dependencies') ?? true;
    const includeTestDependencies = validateBoolean(params.include_test_dependencies, 'include_test_dependencies') ?? false;

    logger.debug(`Getting package info for ${moduleName}`);

    // Check cache first
    const cacheKey = createCacheKey.moduleInfo(moduleName);
    const cached = cache.get<PackageInfoResponse>(cacheKey);
    if (cached) {
      logger.debug(`Using cached info for ${moduleName}`);
      return cached;
    }

    // Get module information from MetaCPAN
    const moduleInfo = await metaCpanApi.getModuleInfo(moduleName);

    // Extract dependencies if requested
    let dependencies: string[] | undefined;
    let testDependencies: string[] | undefined;

    if (includeDependencies && moduleInfo.metadata?.requires) {
      dependencies = Object.keys(moduleInfo.metadata.requires).filter(dep => 
        dep !== 'perl' // Exclude perl itself
      );
    }

    if (includeTestDependencies && moduleInfo.metadata?.test_requires) {
      testDependencies = Object.keys(moduleInfo.metadata.test_requires).filter(dep => 
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
      module_name: moduleName,
      latest_version: moduleInfo.version,
      description: moduleInfo.abstract,
      author: moduleInfo.author,
      license: moduleInfo.metadata?.license?.[0],
      keywords: moduleInfo.metadata?.keywords,
      dependencies,
      test_dependencies: testDependencies,
      repository,
      distribution: moduleInfo.distribution,
    };

    // Cache the result
    cache.set(cacheKey, result, 1800 * 1000); // Cache for 30 minutes

    logger.info(`Successfully retrieved info for ${moduleName}`);
    return result;
  } catch (error) {
    handleApiError(error, `get package info for ${params.module_name}`);
  }
}