// File: /Users/cedriclajoie/Project/Claude_debug/lib/sourcegraph.js

// Imports
import * as Sentry from '@sentry/node';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Debugging Guide:
 * 1. Find error in Sentry by searching for component tag "sourcegraph-client"
 * 2. Copy the timestamp from Sentry error
 * 3. Search Logflare for logs within ±5 seconds of that timestamp
 * 4. Look for matching operation/table/context values
 * 5. Trace the full request flow using the correlation ID
 * 6. Check cache hit/miss logs to understand performance
 * 7. Review "sourcegraph_analysis" logs for comprehensive analysis results
 */

/**
 * SourcegraphClient - Comprehensive Sourcegraph integration with caching and error handling
 * @class
 */
class SourcegraphClient {
  constructor() {
    const startTime = Date.now();
    const correlationId = uuidv4();

    try {
      // Log initialization start
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'sourcegraph_init_start',
        component: 'SourcegraphClient',
        config: {
          instanceUrl: process.env.SOURCEGRAPH_INSTANCE_URL ? 'configured' : 'missing',
          accessToken: process.env.SOURCEGRAPH_ACCESS_TOKEN ? 'configured' : 'missing'
        }
      });

      // Configuration
      this.baseUrl = process.env.SOURCEGRAPH_INSTANCE_URL || 'https://sourcegraph.com';
      this.accessToken = process.env.SOURCEGRAPH_ACCESS_TOKEN;
      
      // Remove trailing slash if present
      this.baseUrl = this.baseUrl.replace(/\/$/, '');

      // Validate configuration
      if (!this.accessToken) {
        throw new Error('SOURCEGRAPH_ACCESS_TOKEN is not configured. Please set it in your .env file.');
      }

      // Initialize axios instance with retry logic
      this.client = axios.create({
        baseURL: `${this.baseUrl}/.api`,
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Claude-Debug-Infrastructure/1.0.0'
        },
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });

      // Add request interceptor for logging
      this.client.interceptors.request.use(
        (config) => {
          const requestId = uuidv4();
          config.headers['X-Request-ID'] = requestId;
          
          // Log outgoing request (without sensitive data)
          console.log({
            timestamp: new Date().toISOString(),
            requestId,
            level: 'debug',
            operation: 'sourcegraph_request',
            method: config.method?.toUpperCase(),
            url: config.url,
            params: config.params
          });
          
          config.metadata = { startTime: Date.now(), requestId };
          return config;
        },
        (error) => {
          // Log request error
          console.log({
            timestamp: new Date().toISOString(),
            level: 'error',
            operation: 'sourcegraph_request_error',
            error: error.message,
            stack: error.stack
          });
          return Promise.reject(error);
        }
      );

      // Add response interceptor for logging
      this.client.interceptors.response.use(
        (response) => {
          const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
          
          // Log successful response
          console.log({
            timestamp: new Date().toISOString(),
            requestId: response.config.headers['X-Request-ID'],
            level: 'debug',
            operation: 'sourcegraph_response',
            status: response.status,
            duration,
            dataSize: JSON.stringify(response.data).length
          });
          
          return response;
        },
        async (error) => {
          const config = error.config;
          const duration = Date.now() - (config?.metadata?.startTime || Date.now());

          // Log failed response
          console.log({
            timestamp: new Date().toISOString(),
            requestId: config?.headers?.['X-Request-ID'],
            level: 'error',
            operation: 'sourcegraph_response_error',
            status: error.response?.status,
            duration,
            error: error.message,
            data: error.response?.data
          });

          // Implement retry logic with exponential backoff
          if (!config || !config.retryCount) {
            config.retryCount = 0;
          }

          if (config.retryCount < 3 && (!error.response || error.response.status >= 500)) {
            config.retryCount++;
            const delay = Math.pow(2, config.retryCount) * 1000; // Exponential backoff
            
            console.log({
              timestamp: new Date().toISOString(),
              level: 'info',
              operation: 'sourcegraph_retry',
              retryCount: config.retryCount,
              delay,
              url: config.url
            });

            await new Promise(resolve => setTimeout(resolve, delay));
            return this.client(config);
          }

          return Promise.reject(error);
        }
      );

      // Initialize cache with TTL support
      this.cache = new Map();
      this.cacheTTL = 5 * 60 * 1000; // 5 minutes
      this.cacheStats = {
        hits: 0,
        misses: 0,
        evictions: 0
      };

      // Start cache cleanup interval
      this.cacheCleanupInterval = setInterval(() => {
        this.cleanupCache();
      }, 60000); // Run every minute

      // Success: Should log successful initialization
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'sourcegraph_init_success',
        component: 'SourcegraphClient',
        duration: Date.now() - startTime,
        baseUrl: this.baseUrl
      });

    } catch (err) {
      // Failure: Logs initialization error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'sourcegraph_init_failed',
        component: 'SourcegraphClient',
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'initialization',
          correlationId
        },
        extra: {
          baseUrl: this.baseUrl,
          hasToken: !!this.accessToken,
          duration: Date.now() - startTime
        }
      });

      throw err;
    }
  }

  /**
   * Get cache key for a request
   * @private
   */
  getCacheKey(operation, params) {
    return `${operation}:${JSON.stringify(params)}`;
  }

  /**
   * Get from cache if valid
   * @private
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      this.cacheStats.hits++;
      
      // Log cache hit
      console.log({
        timestamp: new Date().toISOString(),
        level: 'debug',
        operation: 'cache_hit',
        key: key.substring(0, 100), // Truncate long keys
        stats: this.cacheStats
      });
      
      return cached.data;
    }
    
    this.cacheStats.misses++;
    
    // Log cache miss
    console.log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      operation: 'cache_miss',
      key: key.substring(0, 100),
      stats: this.cacheStats
    });
    
    return null;
  }

  /**
   * Store in cache
   * @private
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Log cache set
    console.log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      operation: 'cache_set',
      key: key.substring(0, 100),
      cacheSize: this.cache.size
    });
  }

  /**
   * Clean up expired cache entries
   * @private
   */
  cleanupCache() {
    const startTime = Date.now();
    const correlationId = uuidv4();
    let evicted = 0;

    try {
      const now = Date.now();
      
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.cacheTTL) {
          this.cache.delete(key);
          evicted++;
          this.cacheStats.evictions++;
        }
      }

      // Success: Should log cache cleanup completion
      if (evicted > 0) {
        console.log({
          timestamp: new Date().toISOString(),
          correlationId,
          level: 'info',
          operation: 'cache_cleanup_success',
          evicted,
          remainingSize: this.cache.size,
          duration: Date.now() - startTime,
          stats: this.cacheStats
        });
      }

    } catch (err) {
      // Failure: Logs cache cleanup error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'cache_cleanup_failed',
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'cache_cleanup',
          correlationId
        }
      });
    }
  }

  /**
   * Clear all cache entries
   */
  clearCache() {
    const correlationId = uuidv4();
    
    try {
      const size = this.cache.size;
      this.cache.clear();
      
      // Success: Should log cache clear
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'cache_clear_success',
        clearedEntries: size
      });
      
      return { success: true, clearedEntries: size };
      
    } catch (err) {
      // Failure: Logs cache clear error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'cache_clear_failed',
        error: err.message,
        stack: err.stack
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'cache_clear',
          correlationId
        }
      });

      throw err;
    }
  }

  /**
   * Search code using Sourcegraph query syntax
   * @param {string} query - Sourcegraph search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchCode(query, options = {}) {
    const startTime = Date.now();
    const correlationId = uuidv4();

    try {
      // Log search start
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'sourcegraph_search_start',
        query: query.substring(0, 200), // Truncate long queries
        options
      });

      // Check cache
      const cacheKey = this.getCacheKey('searchCode', { query, options });
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Prepare search parameters
      const params = {
        q: query,
        patternType: options.patternType || 'literal',
        count: options.count || 50,
        timeout: options.timeout || '10s'
      };

      // Execute search
      const response = await this.client.get('/search/stream', { params });

      if (response.status !== 200) {
        throw new Error(`Sourcegraph search failed with status ${response.status}: ${response.data}`);
      }

      // Parse streaming response
      const results = [];
      const lines = response.data.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (event.type === 'match') {
            results.push(event.data);
          }
        } catch (e) {
          // Skip invalid JSON lines
          continue;
        }
      }

      const searchResults = {
        results,
        resultCount: results.length,
        query,
        timestamp: new Date().toISOString()
      };

      // Cache results
      this.setCache(cacheKey, searchResults);

      // Success: Should log search completion with result count
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'sourcegraph_search_success',
        query: query.substring(0, 200),
        resultCount: results.length,
        duration: Date.now() - startTime
      });

      return searchResults;

    } catch (err) {
      // Failure: Logs search error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'sourcegraph_search_failed',
        query: query.substring(0, 200),
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'searchCode',
          correlationId
        },
        extra: {
          query,
          options,
          duration: Date.now() - startTime
        }
      });

      // Provide remediation steps
      if (err.message.includes('ECONNREFUSED')) {
        throw new Error(`Cannot connect to Sourcegraph at ${this.baseUrl}. Please ensure Sourcegraph is running and accessible.`);
      } else if (err.response?.status === 401) {
        throw new Error('Sourcegraph authentication failed. Please check your SOURCEGRAPH_ACCESS_TOKEN.');
      } else if (err.response?.status === 403) {
        throw new Error('Sourcegraph access forbidden. Please check your permissions.');
      }

      throw err;
    }
  }

  /**
   * Find duplicate classes, functions, or variables
   * @param {string} type - Type of symbol (class, function, variable)
   * @param {string} name - Name of the symbol
   * @returns {Promise<Object>} Duplicate findings
   */
  async findDuplicates(type, name) {
    const startTime = Date.now();
    const correlationId = uuidv4();

    try {
      // Log duplicate search start
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'find_duplicates_start',
        type,
        name
      });

      // Build appropriate query based on type
      let query;
      switch (type.toLowerCase()) {
        case 'class':
          query = `(class|interface) ${name} type:symbol`;
          break;
        case 'function':
          query = `(function|def|func) ${name} type:symbol`;
          break;
        case 'variable':
          query = `(const|let|var|val) ${name} type:symbol`;
          break;
        default:
          query = `${name} type:symbol`;
      }

      const searchResults = await this.searchCode(query, {
        patternType: 'regexp',
        count: 100
      });

      // Analyze duplicates
      const duplicates = {};
      const locations = [];

      for (const result of searchResults.results) {
        if (result.file) {
          const key = `${result.repository}:${result.file.path}`;
          if (!duplicates[key]) {
            duplicates[key] = {
              repository: result.repository,
              file: result.file.path,
              matches: []
            };
          }
          
          if (result.lineMatches) {
            duplicates[key].matches.push(...result.lineMatches);
          }
          
          locations.push({
            repo: result.repository,
            file: result.file.path,
            line: result.lineMatches?.[0]?.lineNumber
          });
        }
      }

      const analysis = {
        type,
        name,
        isDuplicate: Object.keys(duplicates).length > 1,
        duplicateCount: Object.keys(duplicates).length,
        locations,
        duplicates: Object.values(duplicates),
        timestamp: new Date().toISOString()
      };

      // Success: Should log duplicate findings
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'find_duplicates_success',
        type,
        name,
        duplicateCount: analysis.duplicateCount,
        isDuplicate: analysis.isDuplicate,
        duration: Date.now() - startTime
      });

      return analysis;

    } catch (err) {
      // Failure: Logs duplicate search error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'find_duplicates_failed',
        type,
        name,
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'findDuplicates',
          correlationId
        },
        extra: {
          type,
          name,
          duration: Date.now() - startTime
        }
      });

      throw err;
    }
  }

  /**
   * Find code patterns using regex
   * @param {string} pattern - Regex pattern to search
   * @param {string} fileFilter - File filter (e.g., "*.js", "*.py")
   * @returns {Promise<Object>} Pattern matches
   */
  async findPatterns(pattern, fileFilter = '') {
    const startTime = Date.now();
    const correlationId = uuidv4();

    try {
      // Log pattern search start
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'find_patterns_start',
        pattern: pattern.substring(0, 100),
        fileFilter
      });

      // Build query with file filter if provided
      let query = `/${pattern}/`;
      if (fileFilter) {
        query += ` file:${fileFilter}`;
      }

      const searchResults = await this.searchCode(query, {
        patternType: 'regexp',
        count: 100
      });

      // Process pattern matches
      const patterns = [];
      
      for (const result of searchResults.results) {
        if (result.file && result.lineMatches) {
          for (const match of result.lineMatches) {
            patterns.push({
              repository: result.repository,
              file: result.file.path,
              line: match.lineNumber,
              preview: match.preview,
              offsetAndLengths: match.offsetAndLengths
            });
          }
        }
      }

      const analysis = {
        pattern,
        fileFilter,
        matchCount: patterns.length,
        matches: patterns,
        timestamp: new Date().toISOString()
      };

      // Success: Should log pattern findings
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'find_patterns_success',
        pattern: pattern.substring(0, 100),
        matchCount: patterns.length,
        duration: Date.now() - startTime
      });

      return analysis;

    } catch (err) {
      // Failure: Logs pattern search error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'find_patterns_failed',
        pattern: pattern.substring(0, 100),
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'findPatterns',
          correlationId
        },
        extra: {
          pattern,
          fileFilter,
          duration: Date.now() - startTime
        }
      });

      throw err;
    }
  }

  /**
   * Find similar function implementations
   * @param {string} signature - Function signature to search for
   * @returns {Promise<Object>} Similar implementations
   */
  async findSimilarImplementations(signature) {
    const startTime = Date.now();
    const correlationId = uuidv4();

    try {
      // Log similar search start
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'find_similar_start',
        signature: signature.substring(0, 100)
      });

      // Extract function name and parameters from signature
      const functionMatch = signature.match(/(\w+)\s*\(/);
      const functionName = functionMatch ? functionMatch[1] : signature;

      // Search for similar function signatures
      const query = `${functionName} type:symbol`;
      const searchResults = await this.searchCode(query, {
        patternType: 'literal',
        count: 100
      });

      // Analyze implementations
      const implementations = [];
      
      for (const result of searchResults.results) {
        if (result.symbols) {
          for (const symbol of result.symbols) {
            if (symbol.kind === 'FUNCTION' || symbol.kind === 'METHOD') {
              implementations.push({
                repository: result.repository,
                file: result.file?.path,
                name: symbol.name,
                containerName: symbol.containerName,
                url: symbol.url,
                kind: symbol.kind
              });
            }
          }
        }
      }

      const analysis = {
        signature,
        functionName,
        implementationCount: implementations.length,
        implementations,
        timestamp: new Date().toISOString()
      };

      // Success: Should log similar implementations found
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'find_similar_success',
        signature: signature.substring(0, 100),
        implementationCount: implementations.length,
        duration: Date.now() - startTime
      });

      return analysis;

    } catch (err) {
      // Failure: Logs similar search error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'find_similar_failed',
        signature: signature.substring(0, 100),
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'findSimilarImplementations',
          correlationId
        },
        extra: {
          signature,
          duration: Date.now() - startTime
        }
      });

      throw err;
    }
  }

  /**
   * Get file content from indexed repository
   * @param {string} repo - Repository name
   * @param {string} path - File path
   * @returns {Promise<Object>} File content
   */
  async getFileContent(repo, path) {
    const startTime = Date.now();
    const correlationId = uuidv4();

    try {
      // Log file retrieval start
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'get_file_start',
        repo,
        path
      });

      // Check cache
      const cacheKey = this.getCacheKey('getFileContent', { repo, path });
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Query for specific file
      const query = `repo:${repo} file:^${path}$ type:file`;
      const searchResults = await this.searchCode(query, {
        patternType: 'literal',
        count: 1
      });

      if (searchResults.results.length === 0) {
        throw new Error(`File not found: ${repo}/${path}`);
      }

      const fileResult = searchResults.results[0];
      
      // Get raw content if available
      let content = null;
      if (fileResult.file?.content) {
        content = fileResult.file.content;
      }

      const fileData = {
        repository: repo,
        path,
        content,
        url: fileResult.file?.url,
        commit: fileResult.commit,
        timestamp: new Date().toISOString()
      };

      // Cache file content
      this.setCache(cacheKey, fileData);

      // Success: Should log file retrieval
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'get_file_success',
        repo,
        path,
        contentSize: content ? content.length : 0,
        duration: Date.now() - startTime
      });

      return fileData;

    } catch (err) {
      // Failure: Logs file retrieval error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'get_file_failed',
        repo,
        path,
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'getFileContent',
          correlationId
        },
        extra: {
          repo,
          path,
          duration: Date.now() - startTime
        }
      });

      throw err;
    }
  }

  /**
   * Check if a symbol already exists
   * @param {string} symbolName - Name of the symbol
   * @param {string} symbolType - Type of symbol (class, function, variable, etc.)
   * @returns {Promise<Object>} Symbol existence check
   */
  async checkSymbolExists(symbolName, symbolType = '') {
    const startTime = Date.now();
    const correlationId = uuidv4();

    try {
      // Log symbol check start
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'check_symbol_start',
        symbolName,
        symbolType
      });

      // Build query
      let query = `${symbolName} type:symbol`;
      if (symbolType) {
        query = `${symbolType} ${symbolName} type:symbol`;
      }

      const searchResults = await this.searchCode(query, {
        patternType: 'literal',
        count: 10
      });

      const exists = searchResults.results.length > 0;
      const locations = [];

      if (exists) {
        for (const result of searchResults.results) {
          if (result.symbols) {
            for (const symbol of result.symbols) {
              if (symbol.name === symbolName || symbol.name.includes(symbolName)) {
                locations.push({
                  repository: result.repository,
                  file: result.file?.path,
                  name: symbol.name,
                  kind: symbol.kind,
                  containerName: symbol.containerName,
                  url: symbol.url
                });
              }
            }
          }
        }
      }

      const checkResult = {
        symbolName,
        symbolType,
        exists,
        locationCount: locations.length,
        locations,
        timestamp: new Date().toISOString()
      };

      // Success: Should log symbol check result
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'check_symbol_success',
        symbolName,
        exists,
        locationCount: locations.length,
        duration: Date.now() - startTime
      });

      return checkResult;

    } catch (err) {
      // Failure: Logs symbol check error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'check_symbol_failed',
        symbolName,
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'checkSymbolExists',
          correlationId
        },
        extra: {
          symbolName,
          symbolType,
          duration: Date.now() - startTime
        }
      });

      throw err;
    }
  }

  /**
   * Find all imports of a library
   * @param {string} libraryName - Name of the library
   * @returns {Promise<Object>} Import locations
   */
  async findImports(libraryName) {
    const startTime = Date.now();
    const correlationId = uuidv4();

    try {
      // Log import search start
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'find_imports_start',
        libraryName
      });

      // Build import patterns for various languages
      const importPatterns = [
        `import.*${libraryName}`,           // JavaScript/TypeScript
        `from ${libraryName} import`,        // Python
        `require.*${libraryName}`,           // Node.js
        `use ${libraryName}`,                // Rust/PHP
        `import "${libraryName}"`,           // Go
        `#include.*${libraryName}`           // C/C++
      ];

      const query = importPatterns.map(p => `/${p}/`).join(' OR ');
      
      const searchResults = await this.searchCode(query, {
        patternType: 'regexp',
        count: 200
      });

      // Process import locations
      const imports = [];
      const byFile = {};

      for (const result of searchResults.results) {
        if (result.file && result.lineMatches) {
          const fileKey = `${result.repository}:${result.file.path}`;
          
          if (!byFile[fileKey]) {
            byFile[fileKey] = {
              repository: result.repository,
              file: result.file.path,
              imports: []
            };
          }

          for (const match of result.lineMatches) {
            byFile[fileKey].imports.push({
              line: match.lineNumber,
              preview: match.preview
            });
            
            imports.push({
              repository: result.repository,
              file: result.file.path,
              line: match.lineNumber,
              statement: match.preview
            });
          }
        }
      }

      const analysis = {
        libraryName,
        totalImports: imports.length,
        fileCount: Object.keys(byFile).length,
        imports,
        byFile: Object.values(byFile),
        timestamp: new Date().toISOString()
      };

      // Success: Should log import findings
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'find_imports_success',
        libraryName,
        totalImports: imports.length,
        fileCount: Object.keys(byFile).length,
        duration: Date.now() - startTime
      });

      return analysis;

    } catch (err) {
      // Failure: Logs import search error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'find_imports_failed',
        libraryName,
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'findImports',
          correlationId
        },
        extra: {
          libraryName,
          duration: Date.now() - startTime
        }
      });

      throw err;
    }
  }

  /**
   * Analyze repository code structure
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Repository structure analysis
   */
  async analyzeCodeStructure(repo) {
    const startTime = Date.now();
    const correlationId = uuidv4();

    try {
      // Log structure analysis start
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'analyze_structure_start',
        repo
      });

      // Search for various code elements
      const analyses = await Promise.all([
        this.searchCode(`repo:${repo} type:symbol select:symbol.class`, { count: 1000 }),
        this.searchCode(`repo:${repo} type:symbol select:symbol.function`, { count: 1000 }),
        this.searchCode(`repo:${repo} type:symbol select:symbol.interface`, { count: 1000 }),
        this.searchCode(`repo:${repo} type:file`, { count: 1000 })
      ]);

      // Process results
      const structure = {
        classes: [],
        functions: [],
        interfaces: [],
        files: [],
        statistics: {
          classCount: 0,
          functionCount: 0,
          interfaceCount: 0,
          fileCount: 0,
          languages: new Set()
        }
      };

      // Process class symbols
      if (analyses[0].results) {
        for (const result of analyses[0].results) {
          if (result.symbols) {
            for (const symbol of result.symbols) {
              if (symbol.kind === 'CLASS') {
                structure.classes.push({
                  name: symbol.name,
                  file: result.file?.path,
                  containerName: symbol.containerName
                });
                structure.statistics.classCount++;
              }
            }
          }
        }
      }

      // Process function symbols
      if (analyses[1].results) {
        for (const result of analyses[1].results) {
          if (result.symbols) {
            for (const symbol of result.symbols) {
              if (symbol.kind === 'FUNCTION' || symbol.kind === 'METHOD') {
                structure.functions.push({
                  name: symbol.name,
                  file: result.file?.path,
                  containerName: symbol.containerName
                });
                structure.statistics.functionCount++;
              }
            }
          }
        }
      }

      // Process interface symbols
      if (analyses[2].results) {
        for (const result of analyses[2].results) {
          if (result.symbols) {
            for (const symbol of result.symbols) {
              if (symbol.kind === 'INTERFACE') {
                structure.interfaces.push({
                  name: symbol.name,
                  file: result.file?.path,
                  containerName: symbol.containerName
                });
                structure.statistics.interfaceCount++;
              }
            }
          }
        }
      }

      // Process files
      if (analyses[3].results) {
        for (const result of analyses[3].results) {
          if (result.file) {
            structure.files.push({
              path: result.file.path,
              language: result.file.language
            });
            structure.statistics.fileCount++;
            if (result.file.language) {
              structure.statistics.languages.add(result.file.language);
            }
          }
        }
      }

      // Convert Set to Array for JSON serialization
      structure.statistics.languages = Array.from(structure.statistics.languages);

      const analysis = {
        repository: repo,
        structure,
        timestamp: new Date().toISOString()
      };

      // Success: Should log structure analysis completion
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'analyze_structure_success',
        repo,
        statistics: structure.statistics,
        duration: Date.now() - startTime
      });

      return analysis;

    } catch (err) {
      // Failure: Logs structure analysis error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'analyze_structure_failed',
        repo,
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'analyzeCodeStructure',
          correlationId
        },
        extra: {
          repo,
          duration: Date.now() - startTime
        }
      });

      throw err;
    }
  }

  /**
   * Perform mandatory analysis before writing code
   * @param {string} codeType - Type of code (class, function, component, etc.)
   * @param {string} codeName - Name of the code element
   * @returns {Promise<Object>} Comprehensive analysis report
   */
  async performMandatoryAnalysis(codeType, codeName) {
    const startTime = Date.now();
    const correlationId = uuidv4();

    try {
      // Log mandatory analysis start
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'mandatory_analysis_start',
        codeType,
        codeName
      });

      // Perform all mandatory checks
      const [
        duplicateCheck,
        symbolCheck,
        similarImplementations,
        patternCheck
      ] = await Promise.all([
        this.findDuplicates(codeType, codeName),
        this.checkSymbolExists(codeName, codeType),
        this.findSimilarImplementations(codeName),
        this.findPatterns(`\\b${codeName}\\b`, '')
      ]);

      // Compile analysis report
      const report = {
        correlationId,
        timestamp: new Date().toISOString(),
        codeType,
        codeName,
        checks: {
          duplicates: {
            found: duplicateCheck.isDuplicate,
            count: duplicateCheck.duplicateCount,
            locations: duplicateCheck.locations
          },
          symbolExists: {
            exists: symbolCheck.exists,
            locationCount: symbolCheck.locationCount,
            locations: symbolCheck.locations
          },
          similarImplementations: {
            found: similarImplementations.implementationCount > 0,
            count: similarImplementations.implementationCount,
            implementations: similarImplementations.implementations.slice(0, 10)
          },
          patterns: {
            found: patternCheck.matchCount > 0,
            count: patternCheck.matchCount,
            matches: patternCheck.matches.slice(0, 10)
          }
        },
        recommendations: [],
        warnings: [],
        canProceed: true
      };

      // Add recommendations and warnings
      if (duplicateCheck.isDuplicate) {
        report.warnings.push(`Found ${duplicateCheck.duplicateCount} existing implementations of ${codeName}`);
        report.recommendations.push('Consider using or extending existing implementation');
      }

      if (symbolCheck.exists) {
        report.warnings.push(`Symbol "${codeName}" already exists in ${symbolCheck.locationCount} location(s)`);
        report.recommendations.push('Consider using a different name or namespace');
      }

      if (similarImplementations.implementationCount > 5) {
        report.recommendations.push(`Found ${similarImplementations.implementationCount} similar implementations - review for patterns`);
      }

      // Determine if safe to proceed
      if (duplicateCheck.duplicateCount > 3 || symbolCheck.locationCount > 3) {
        report.canProceed = false;
        report.warnings.push('Too many duplicates found - manual review required');
      }

      // Success: Should log analysis completion
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'mandatory_analysis_success',
        codeType,
        codeName,
        canProceed: report.canProceed,
        warningCount: report.warnings.length,
        duration: Date.now() - startTime
      });

      // Log detailed analysis results for debugging
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'sourcegraph_analysis',
        report: JSON.stringify(report)
      });

      return report;

    } catch (err) {
      // Failure: Logs analysis error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'mandatory_analysis_failed',
        codeType,
        codeName,
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'performMandatoryAnalysis',
          correlationId
        },
        extra: {
          codeType,
          codeName,
          duration: Date.now() - startTime
        }
      });

      throw err;
    }
  }

  /**
   * Generate a detailed analysis report
   * @returns {Promise<Object>} Analysis report with cache stats
   */
  async generateAnalysisReport() {
    const startTime = Date.now();
    const correlationId = uuidv4();

    try {
      // Log report generation start
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'generate_report_start'
      });

      const report = {
        timestamp: new Date().toISOString(),
        correlationId,
        client: {
          baseUrl: this.baseUrl,
          hasToken: !!this.accessToken,
          isConfigured: !!(this.baseUrl && this.accessToken)
        },
        cache: {
          size: this.cache.size,
          stats: { ...this.cacheStats },
          hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
          ttl: this.cacheTTL
        },
        health: {
          status: 'unknown',
          lastCheck: null
        }
      };

      // Check health by making a simple query
      try {
        await this.searchCode('test', { count: 1, timeout: '5s' });
        report.health.status = 'healthy';
        report.health.lastCheck = new Date().toISOString();
      } catch (healthError) {
        report.health.status = 'unhealthy';
        report.health.error = healthError.message;
        report.health.lastCheck = new Date().toISOString();
      }

      // Success: Should log report generation
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'generate_report_success',
        healthStatus: report.health.status,
        cacheSize: report.cache.size,
        cacheHitRate: report.cache.hitRate.toFixed(2),
        duration: Date.now() - startTime
      });

      return report;

    } catch (err) {
      // Failure: Logs report generation error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'generate_report_failed',
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'generateAnalysisReport',
          correlationId
        },
        extra: {
          duration: Date.now() - startTime
        }
      });

      throw err;
    }
  }

  /**
   * Validate that no duplicates were found
   * @param {Object} results - Results from duplicate check
   * @returns {boolean} True if no duplicates
   */
  validateNoDuplicates(results) {
    const correlationId = uuidv4();

    try {
      const isValid = !results.isDuplicate || results.duplicateCount === 0;

      // Log validation result
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'validate_duplicates',
        isValid,
        duplicateCount: results.duplicateCount || 0
      });

      return isValid;

    } catch (err) {
      // Log validation error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'validate_duplicates_failed',
        error: err.message
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'validateNoDuplicates',
          correlationId
        }
      });

      return false;
    }
  }

  /**
   * Cleanup resources (call on shutdown)
   */
  cleanup() {
    const correlationId = uuidv4();

    try {
      // Clear cache cleanup interval
      if (this.cacheCleanupInterval) {
        clearInterval(this.cacheCleanupInterval);
      }

      // Clear cache
      this.cache.clear();

      // Log cleanup
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'sourcegraph_cleanup',
        finalStats: this.cacheStats
      });

    } catch (err) {
      // Log cleanup error
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'error',
        operation: 'sourcegraph_cleanup_failed',
        error: err.message
      });

      Sentry.captureException(err, {
        tags: {
          component: 'sourcegraph-client',
          operation: 'cleanup',
          correlationId
        }
      });
    }
  }
}

// Create singleton instance
let sourcegraphInstance = null;

/**
 * Get or create the Sourcegraph client instance
 * @returns {SourcegraphClient} The Sourcegraph client instance
 */
export function getSourcegraphClient() {
  const correlationId = uuidv4();

  try {
    if (!sourcegraphInstance) {
      // Log singleton creation
      console.log({
        timestamp: new Date().toISOString(),
        correlationId,
        level: 'info',
        operation: 'create_singleton',
        component: 'SourcegraphClient'
      });

      sourcegraphInstance = new SourcegraphClient();
    }

    return sourcegraphInstance;

  } catch (err) {
    // Log singleton creation error
    console.log({
      timestamp: new Date().toISOString(),
      correlationId,
      level: 'error',
      operation: 'create_singleton_failed',
      component: 'SourcegraphClient',
      error: err.message,
      stack: err.stack
    });

    Sentry.captureException(err, {
      tags: {
        component: 'sourcegraph-client',
        operation: 'getSourcegraphClient',
        correlationId
      }
    });

    throw err;
  }
}

// Export the class and singleton getter
export { SourcegraphClient };
export default getSourcegraphClient;

// Handle process shutdown gracefully
process.on('SIGINT', () => {
  if (sourcegraphInstance) {
    sourcegraphInstance.cleanup();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (sourcegraphInstance) {
    sourcegraphInstance.cleanup();
  }
  process.exit(0);
});

/**
 * To debug: Match Sentry error timestamp with Logflare "sourcegraph_" operation entries
 * Search for correlationId to trace full request flow
 * Monitor cache_hit/cache_miss logs for performance optimization
 * Check sourcegraph_analysis logs for comprehensive analysis results
 */