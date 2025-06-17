import { logger } from '../utils/logger.js';
import { handleApiError } from '../utils/error-handler.js';
import type { MetaCpanModuleResponse, MetaCpanSearchResponse, MetaCpanReleaseResponse } from '../types/index.js';

const METACPAN_BASE_URL = 'https://fastapi.metacpan.org/v1';
const REQUEST_TIMEOUT = 10000; // 10 seconds

export class MetaCpanApi {
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'cpan-package-readme-mcp-server/1.0.0',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  async getModuleInfo(moduleName: string): Promise<MetaCpanModuleResponse> {
    try {
      const moduleUrl = `${METACPAN_BASE_URL}/module/${encodeURIComponent(moduleName)}`;
      
      logger.debug(`Fetching module info: ${moduleUrl}`);

      const response = await this.fetchWithTimeout(moduleUrl);

      if (response.status === 404) {
        throw new Error(`Module '${moduleName}' not found`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as MetaCpanModuleResponse;
      logger.debug(`Fetched module info for: ${moduleName}`);

      return data;
    } catch (error) {
      handleApiError(error, `MetaCPAN module info for ${moduleName}`);
    }
  }

  async searchModules(query: string, limit: number = 20): Promise<MetaCpanSearchResponse> {
    try {
      const searchUrl = new URL(`${METACPAN_BASE_URL}/module/_search`);
      // Escape special characters in the query for ElasticSearch
      const escapedQuery = query.replace(/:/g, '\\:');
      searchUrl.searchParams.set('q', escapedQuery);
      searchUrl.searchParams.set('size', limit.toString());

      logger.debug(`Searching modules: ${searchUrl.toString()}`);

      const response = await this.fetchWithTimeout(searchUrl.toString());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as MetaCpanSearchResponse;
      logger.debug(`Found ${data.hits?.hits?.length || 0} modules for query: ${query}`);

      return data;
    } catch (error) {
      handleApiError(error, 'MetaCPAN search');
    }
  }

  async getReleaseInfo(distributionName: string): Promise<MetaCpanReleaseResponse> {
    try {
      const releaseUrl = `${METACPAN_BASE_URL}/release/${encodeURIComponent(distributionName)}`;
      
      logger.debug(`Fetching release info: ${releaseUrl}`);

      const response = await this.fetchWithTimeout(releaseUrl);

      if (response.status === 404) {
        throw new Error(`Release '${distributionName}' not found`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as MetaCpanReleaseResponse;
      logger.debug(`Fetched release info for: ${distributionName}`);

      return data;
    } catch (error) {
      handleApiError(error, `MetaCPAN release info for ${distributionName}`);
    }
  }

  async getModulePod(moduleName: string): Promise<string | null> {
    try {
      const moduleInfo = await this.getModuleInfo(moduleName);
      
      if (moduleInfo.pod) {
        return moduleInfo.pod;
      }

      // If no POD in the module response, try to get it from the source
      const sourceUrl = `${METACPAN_BASE_URL}/pod/${encodeURIComponent(moduleName)}`;
      
      logger.debug(`Fetching POD from source: ${sourceUrl}`);

      const response = await this.fetchWithTimeout(sourceUrl);

      if (response.status === 404) {
        logger.debug(`POD not found for module: ${moduleName}`);
        return null;
      }

      if (!response.ok) {
        logger.warn(`Failed to fetch POD for ${moduleName}: HTTP ${response.status}`);
        return null;
      }

      const podData = await response.json() as { pod?: string };
      return podData.pod || null;
    } catch (error) {
      logger.debug(`Failed to get POD for ${moduleName}:`, error);
      return null;
    }
  }

  async getModuleSource(moduleName: string): Promise<string | null> {
    try {
      const sourceUrl = `${METACPAN_BASE_URL}/source/${encodeURIComponent(moduleName)}`;
      
      logger.debug(`Fetching module source: ${sourceUrl}`);

      const response = await this.fetchWithTimeout(sourceUrl);

      if (response.status === 404) {
        logger.debug(`Source not found for module: ${moduleName}`);
        return null;
      }

      if (!response.ok) {
        logger.warn(`Failed to fetch source for ${moduleName}: HTTP ${response.status}`);
        return null;
      }

      const sourceData = await response.text();
      return sourceData;
    } catch (error) {
      logger.debug(`Failed to get source for ${moduleName}:`, error);
      return null;
    }
  }
}

export const metaCpanApi = new MetaCpanApi();