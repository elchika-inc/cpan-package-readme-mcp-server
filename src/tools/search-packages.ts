import { cache, createCacheKey } from '../services/cache.js';
import { metaCpanApi } from '../services/metacpan-api.js';
import { logger } from '../utils/logger.js';
import { validateSearchQuery, validateLimit } from '../utils/validators.js';
import { handleApiError } from '../utils/error-handler.js';
import type { SearchPackagesParams, SearchPackagesResponse, CpanPackageSearchResult } from '../types/index.js';

export async function searchPackages(params: SearchPackagesParams): Promise<SearchPackagesResponse> {
  try {
    // Validate parameters
    const query = validateSearchQuery(params.query);
    const limit = validateLimit(params.limit);

    logger.debug(`Searching packages with query: "${query}", limit: ${limit}`);

    // Check cache first
    const cacheKey = createCacheKey.searchResults(query, limit);
    const cached = cache.get<SearchPackagesResponse>(cacheKey);
    if (cached) {
      logger.debug(`Using cached search results for: ${query}`);
      return cached;
    }

    // Search modules using MetaCPAN API
    const searchResponse = await metaCpanApi.searchModules(query, limit);

    // Transform the results to our format
    const packages: CpanPackageSearchResult[] = searchResponse.hits.hits.map(hit => ({
      name: hit._source.name,
      version: hit._source.version,
      description: hit._source.abstract,
      author: hit._source.author,
      distribution: hit._source.distribution,
      release_date: hit._source.date,
      abstract: hit._source.abstract,
    }));

    const result: SearchPackagesResponse = {
      query,
      total: searchResponse.hits.total.value,
      packages,
    };

    // Cache the result
    cache.set(cacheKey, result, 900 * 1000); // Cache for 15 minutes

    logger.info(`Found ${packages.length} packages for query: "${query}"`);
    return result;
  } catch (error) {
    handleApiError(error, `search packages with query "${params.query}"`);
  }
}