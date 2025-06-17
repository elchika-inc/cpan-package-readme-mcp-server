# CPAN Package README MCP Server

[![npm version](https://img.shields.io/npm/v/cpan-package-readme-mcp-server)](https://www.npmjs.com/package/cpan-package-readme-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/cpan-package-readme-mcp-server)](https://www.npmjs.com/package/cpan-package-readme-mcp-server)
[![GitHub stars](https://img.shields.io/github/stars/naoto24kawa/cpan-package-readme-mcp-server)](https://github.com/naoto24kawa/cpan-package-readme-mcp-server)
[![GitHub issues](https://img.shields.io/github/issues/naoto24kawa/cpan-package-readme-mcp-server)](https://github.com/naoto24kawa/cpan-package-readme-mcp-server/issues)
[![license](https://img.shields.io/npm/l/cpan-package-readme-mcp-server)](https://github.com/naoto24kawa/cpan-package-readme-mcp-server/blob/main/LICENSE)

A Model Context Protocol (MCP) server that provides CPAN (Comprehensive Perl Archive Network) package information, including README content, package metadata, and search capabilities.

## Features

- **Package README**: Fetch README and documentation for CPAN modules
- **Package Information**: Get metadata, dependencies, and version info
- **Search Packages**: Search CPAN repository for modules
- **Comprehensive Documentation**: Access detailed package information and usage examples

## Installation

```bash
npm install cpan-package-readme-mcp-server
```

## Usage

### As an MCP Server

Add to your MCP client configuration:

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

### Available Tools

#### `get_readme_from_cpan`

Get package README and usage examples from CPAN.

**Parameters:**
- `package_name` (required): The CPAN module name (e.g., "Data::Dumper", "LWP::UserAgent")
- `version` (optional): Package version (defaults to latest)
- `include_examples` (optional): Whether to include usage examples (default: true)

**Example:**
```json
{
  "package_name": "LWP::UserAgent",
  "include_examples": true
}
```

#### `get_package_info_from_cpan`

Get package basic information and dependencies from CPAN.

**Parameters:**
- `package_name` (required): The CPAN module name
- `include_dependencies` (optional): Whether to include dependencies (default: true)
- `include_dev_dependencies` (optional): Whether to include test dependencies (default: false)

**Example:**
```json
{
  "package_name": "Mojolicious",
  "include_dependencies": true,
  "include_dev_dependencies": false
}
```

#### `search_packages_from_cpan`

Search for packages in CPAN.

**Parameters:**
- `query` (required): The search query
- `limit` (optional): Maximum number of results (default: 20, max: 100)

**Example:**
```json
{
  "query": "web framework",
  "limit": 10
}
```

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

## Configuration

The server uses MetaCPAN API to fetch package information. No additional configuration is required for basic usage.

## Error Handling

The server handles various error conditions:
- Package not found
- Invalid module names
- Network connectivity issues
- Rate limiting
- Invalid parameters

## Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for server implementation
- Built-in HTTP client for MetaCPAN API requests

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.