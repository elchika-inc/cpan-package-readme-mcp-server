# CPAN Package README MCP Server

[![license](https://img.shields.io/npm/l/cpan-package-readme-mcp-server)](https://github.com/elchika-inc/cpan-package-readme-mcp-server/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/cpan-package-readme-mcp-server)](https://www.npmjs.com/package/cpan-package-readme-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/cpan-package-readme-mcp-server)](https://www.npmjs.com/package/cpan-package-readme-mcp-server)
[![GitHub stars](https://img.shields.io/github/stars/elchika-inc/cpan-package-readme-mcp-server)](https://github.com/elchika-inc/cpan-package-readme-mcp-server)

An MCP (Model Context Protocol) server that enables AI assistants to fetch comprehensive information about CPAN (Comprehensive Perl Archive Network) packages, including README content, package metadata, and search functionality.

## Features

- **Package README Retrieval**: Fetch formatted README content with usage examples from Perl/CPAN modules hosted on MetaCPAN
- **Package Information**: Get comprehensive package metadata including dependencies, versions, author information, and documentation
- **Package Search**: Search CPAN repository with filtering by category, author, and relevance
- **Smart Caching**: Intelligent caching system to optimize API usage and improve response times
- **MetaCPAN Integration**: Direct integration with MetaCPAN API for comprehensive package information
- **Error Handling**: Robust error handling with automatic retry logic and fallback strategies

## MCP Client Configuration

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "cpan-package-readme": {
      "command": "npx",
      "args": ["cpan-package-readme-mcp-server"]
    }
  }
}
```

## Available Tools

### get_package_readme

Retrieves comprehensive README content and usage examples for CPAN packages.

**Parameters:**
```json
{
  "package_name": "LWP::UserAgent",
  "version": "latest",
  "include_examples": true
}
```

- `package_name` (string, required): CPAN module name (e.g., "Data::Dumper", "LWP::UserAgent")
- `version` (string, optional): Specific package version or "latest" (default: "latest")
- `include_examples` (boolean, optional): Include usage examples and code snippets (default: true)

**Returns:** Formatted README content with installation instructions, usage examples, and API documentation.

### get_package_info

Fetches detailed package metadata, dependencies, and author information from MetaCPAN.

**Parameters:**
```json
{
  "package_name": "Mojolicious",
  "include_dependencies": true,
  "include_dev_dependencies": false
}
```

- `package_name` (string, required): CPAN module name
- `include_dependencies` (boolean, optional): Include runtime dependencies (default: true)
- `include_dev_dependencies` (boolean, optional): Include test/development dependencies (default: false)

**Returns:** Package metadata including version info, author details, license, download stats, and dependency information.

### search_packages

Searches CPAN repository for packages with filtering capabilities.

**Parameters:**
```json
{
  "query": "web framework",
  "limit": 20,
  "author": "SRI"
}
```

- `query` (string, required): Search terms (module name, description, keywords)
- `limit` (number, optional): Maximum number of results to return (default: 20, max: 100)
- `author` (string, optional): Filter by author/maintainer CPAN ID

**Returns:** List of matching packages with names, descriptions, authors, and popularity metrics.

## Error Handling

The server handles common error scenarios gracefully:

- **Package not found**: Returns clear error messages with similar module suggestions
- **Rate limiting**: Implements automatic retry with exponential backoff
- **Network timeouts**: Configurable timeout with retry logic
- **Invalid module names**: Validates module name format and provides guidance
- **MetaCPAN API failures**: Fallback strategies when API is unavailable

## License

MIT