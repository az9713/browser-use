/**
 * App 16: API Mocker
 *
 * Demonstrates request interception using CDP:
 * - Intercept requests by URL pattern
 * - Return mock responses
 * - Modify response headers
 * - Simulate network errors
 * - Add artificial latency
 *
 * CDP Domains: Fetch
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class APIMocker {
  constructor(client) {
    this.client = client;
    this.mocks = new Map();
    this.interceptedCount = 0;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Page.enable');
    console.log('[APIMocker] Page domain enabled');
  }

  /**
   * Start intercepting requests
   * @param {object} options - Interception options
   */
  async startIntercepting(options = {}) {
    const {
      patterns = [{ urlPattern: '*' }],
      resourceTypes = null
    } = options;

    // Build pattern list
    const patternList = patterns.map(p => {
      const pattern = { urlPattern: p.urlPattern || p };
      if (p.resourceType) pattern.resourceType = p.resourceType;
      return pattern;
    });

    await this.client.send('Fetch.enable', {
      patterns: patternList,
      handleAuthRequests: false
    });

    // Handle paused requests
    this.client.on('Fetch.requestPaused', async (params) => {
      await this.handleRequest(params);
    });

    console.log('[APIMocker] Started intercepting');
  }

  /**
   * Stop intercepting
   */
  async stopIntercepting() {
    await this.client.send('Fetch.disable');
    console.log('[APIMocker] Stopped intercepting');
  }

  /**
   * Handle an intercepted request
   * @param {object} params - Request params
   */
  async handleRequest(params) {
    const { requestId, request } = params;
    this.interceptedCount++;

    // Check for matching mock
    for (const [pattern, mock] of this.mocks) {
      if (this.matchesPattern(request.url, pattern)) {
        console.log(`[APIMocker] Mocking: ${request.url.substring(0, 60)}...`);

        // Add latency if specified
        if (mock.latency) {
          await sleep(mock.latency);
        }

        // Simulate error if specified
        if (mock.error) {
          await this.client.send('Fetch.failRequest', {
            requestId,
            errorReason: mock.error
          });
          return;
        }

        // Return mock response
        const responseHeaders = [];
        const headers = mock.headers || { 'Content-Type': 'application/json' };

        for (const [name, value] of Object.entries(headers)) {
          responseHeaders.push({ name, value });
        }

        let body = mock.body;
        if (typeof body === 'object') {
          body = JSON.stringify(body);
        }

        await this.client.send('Fetch.fulfillRequest', {
          requestId,
          responseCode: mock.status || 200,
          responseHeaders,
          body: Buffer.from(body || '').toString('base64')
        });
        return;
      }
    }

    // Continue with original request
    await this.client.send('Fetch.continueRequest', { requestId });
  }

  /**
   * Check if URL matches pattern
   * @param {string} url - Request URL
   * @param {string|RegExp} pattern - Pattern to match
   * @returns {boolean}
   */
  matchesPattern(url, pattern) {
    if (typeof pattern === 'string') {
      // Simple wildcard matching
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(url);
      }
      return url.includes(pattern);
    }
    return pattern.test(url);
  }

  /**
   * Add a mock response
   * @param {string|RegExp} pattern - URL pattern to match
   * @param {object} response - Mock response
   */
  mock(pattern, response) {
    this.mocks.set(pattern, response);
    console.log(`[APIMocker] Added mock for: ${pattern}`);
  }

  /**
   * Remove a mock
   * @param {string|RegExp} pattern - Pattern to remove
   */
  removeMock(pattern) {
    this.mocks.delete(pattern);
    console.log(`[APIMocker] Removed mock for: ${pattern}`);
  }

  /**
   * Clear all mocks
   */
  clearMocks() {
    this.mocks.clear();
    console.log('[APIMocker] Cleared all mocks');
  }

  /**
   * Mock a JSON API response
   * @param {string} pattern - URL pattern
   * @param {object} data - JSON data to return
   * @param {object} options - Additional options
   */
  mockJSON(pattern, data, options = {}) {
    this.mock(pattern, {
      status: options.status || 200,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data,
      latency: options.latency
    });
  }

  /**
   * Mock a network error
   * @param {string} pattern - URL pattern
   * @param {string} error - Error type
   */
  mockError(pattern, error = 'Failed') {
    // Valid error reasons: Failed, Aborted, TimedOut, AccessDenied,
    // ConnectionClosed, ConnectionReset, ConnectionRefused, etc.
    this.mock(pattern, { error });
  }

  /**
   * Mock a slow response
   * @param {string} pattern - URL pattern
   * @param {number} latency - Delay in milliseconds
   * @param {object} response - Response to return after delay
   */
  mockSlow(pattern, latency, response) {
    this.mock(pattern, {
      ...response,
      latency
    });
  }

  /**
   * Get interception stats
   * @returns {object}
   */
  getStats() {
    return {
      interceptedCount: this.interceptedCount,
      mockCount: this.mocks.size
    };
  }
}

// Demo
async function main() {
  console.log('=== CDP API Mocker Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const mocker = new APIMocker(client);

    // Enable domains
    await mocker.enable();

    // Navigate to a test page first
    console.log('\n--- Navigating to test page ---');
    let navPromise = waitForNavigation(client);
    await client.send('Page.navigate', {
      url: 'data:text/html,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head><title>API Mocker Test</title></head>
        <body>
          <h1>API Mocker Test Page</h1>
          <div id="result"></div>
          <script>
            async function testAPI() {
              const resultDiv = document.getElementById('result');
              try {
                const res = await fetch('/api/users');
                const data = await res.json();
                resultDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
              } catch (e) {
                resultDiv.innerHTML = 'Error: ' + e.message;
              }
            }
          </script>
        </body>
        </html>
      `)
    });
    await navPromise;
    await sleep(300);

    // Set up mocks
    console.log('\n--- Setting up mocks ---');

    // Mock a JSON API
    mocker.mockJSON('/api/users', {
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' }
      ],
      total: 2
    });

    // Mock with custom headers
    mocker.mock('/api/config', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'test-value'
      },
      body: { debug: true, version: '1.0.0' }
    });

    // Mock an error
    mocker.mockError('/api/error', 'Failed');

    // Mock a slow response
    mocker.mockSlow('/api/slow', 2000, {
      status: 200,
      body: JSON.stringify({ message: 'Finally loaded!' }),
      headers: { 'Content-Type': 'application/json' }
    });

    // Start intercepting
    await mocker.startIntercepting({
      patterns: [
        { urlPattern: '*api*' }
      ]
    });

    // Test the mock
    console.log('\n--- Testing mocked API ---');
    await client.send('Runtime.evaluate', {
      expression: 'testAPI()',
      awaitPromise: true
    });
    await sleep(500);

    // Check the result
    const result = await client.send('Runtime.evaluate', {
      expression: 'document.getElementById("result").innerText',
      returnByValue: true
    });
    console.log('  API Response:');
    console.log(result.result.value);

    // Test another mocked endpoint
    console.log('\n--- Testing config endpoint ---');
    const configResult = await client.send('Runtime.evaluate', {
      expression: `
        fetch('/api/config')
          .then(r => r.json())
          .then(data => JSON.stringify(data))
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('  Config Response:', configResult.result.value);

    // Show stats
    console.log('\n--- Interception Stats ---');
    const stats = mocker.getStats();
    console.log(`  Intercepted requests: ${stats.interceptedCount}`);
    console.log(`  Active mocks: ${stats.mockCount}`);

    // Stop intercepting
    await mocker.stopIntercepting();

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { APIMocker };
