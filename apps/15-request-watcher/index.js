/**
 * App 15: Request Watcher
 *
 * Demonstrates network monitoring using CDP:
 * - Log all HTTP requests
 * - Show request/response headers
 * - Show timing breakdown
 * - Filter by URL pattern
 * - Filter by resource type
 *
 * CDP Domains: Network
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import { formatBytes, formatDuration } from '../../shared/utils.js';

class RequestWatcher {
  constructor(client) {
    this.client = client;
    this.requests = new Map();
    this.handlers = [];
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Network.enable');
    await this.client.send('Page.enable');
    console.log('[RequestWatcher] Network and Page domains enabled');
  }

  /**
   * Start watching network requests
   * @param {object} options - Watch options
   */
  startWatching(options = {}) {
    const {
      onRequest = null,
      onResponse = null,
      onComplete = null,
      urlFilter = null,
      typeFilter = null
    } = options;

    // Request will be sent
    const requestHandler = (params) => {
      const { requestId, request, timestamp, type } = params;

      // Apply filters
      if (urlFilter && !request.url.includes(urlFilter)) return;
      if (typeFilter && type !== typeFilter) return;

      const entry = {
        requestId,
        url: request.url,
        method: request.method,
        type,
        headers: request.headers,
        postData: request.postData,
        startTime: timestamp,
        status: 'pending'
      };

      this.requests.set(requestId, entry);

      if (onRequest) {
        onRequest(entry);
      }
    };

    this.client.on('Network.requestWillBeSent', requestHandler);
    this.handlers.push({ event: 'Network.requestWillBeSent', handler: requestHandler });

    // Response received
    const responseHandler = (params) => {
      const { requestId, response, timestamp } = params;
      const entry = this.requests.get(requestId);

      if (!entry) return;

      entry.status = response.status;
      entry.statusText = response.statusText;
      entry.responseHeaders = response.headers;
      entry.mimeType = response.mimeType;
      entry.responseTime = timestamp;
      entry.timing = response.timing;
      entry.remoteIPAddress = response.remoteIPAddress;
      entry.protocol = response.protocol;

      if (onResponse) {
        onResponse(entry);
      }
    };

    this.client.on('Network.responseReceived', responseHandler);
    this.handlers.push({ event: 'Network.responseReceived', handler: responseHandler });

    // Loading finished
    const finishedHandler = (params) => {
      const { requestId, timestamp, encodedDataLength } = params;
      const entry = this.requests.get(requestId);

      if (!entry) return;

      entry.endTime = timestamp;
      entry.encodedDataLength = encodedDataLength;
      entry.duration = (timestamp - entry.startTime) * 1000; // Convert to ms

      if (onComplete) {
        onComplete(entry);
      }
    };

    this.client.on('Network.loadingFinished', finishedHandler);
    this.handlers.push({ event: 'Network.loadingFinished', handler: finishedHandler });

    // Loading failed
    const failedHandler = (params) => {
      const { requestId, timestamp, errorText } = params;
      const entry = this.requests.get(requestId);

      if (!entry) return;

      entry.endTime = timestamp;
      entry.error = errorText;
      entry.status = 'failed';
      entry.duration = (timestamp - entry.startTime) * 1000;

      if (onComplete) {
        onComplete(entry);
      }
    };

    this.client.on('Network.loadingFailed', failedHandler);
    this.handlers.push({ event: 'Network.loadingFailed', handler: failedHandler });

    console.log('[RequestWatcher] Started watching');
  }

  /**
   * Stop watching
   */
  stopWatching() {
    for (const { event, handler } of this.handlers) {
      this.client.off(event, handler);
    }
    this.handlers = [];
    console.log('[RequestWatcher] Stopped watching');
  }

  /**
   * Get response body for a request
   * @param {string} requestId - Request ID
   * @returns {Promise<string>}
   */
  async getResponseBody(requestId) {
    try {
      const result = await this.client.send('Network.getResponseBody', { requestId });
      return result.base64Encoded ?
        Buffer.from(result.body, 'base64').toString() :
        result.body;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get all requests
   * @returns {Array}
   */
  getRequests() {
    return Array.from(this.requests.values());
  }

  /**
   * Get requests by type
   * @param {string} type - Resource type
   * @returns {Array}
   */
  getRequestsByType(type) {
    return this.getRequests().filter(r => r.type === type);
  }

  /**
   * Get requests by URL pattern
   * @param {string|RegExp} pattern - URL pattern
   * @returns {Array}
   */
  getRequestsByUrl(pattern) {
    return this.getRequests().filter(r => {
      if (typeof pattern === 'string') {
        return r.url.includes(pattern);
      }
      return pattern.test(r.url);
    });
  }

  /**
   * Get failed requests
   * @returns {Array}
   */
  getFailedRequests() {
    return this.getRequests().filter(r => r.status === 'failed' || r.status >= 400);
  }

  /**
   * Clear stored requests
   */
  clearRequests() {
    this.requests.clear();
    console.log('[RequestWatcher] Requests cleared');
  }

  /**
   * Format timing breakdown
   * @param {object} timing - Timing object from response
   * @returns {object}
   */
  formatTiming(timing) {
    if (!timing) return null;

    return {
      dns: timing.dnsEnd - timing.dnsStart,
      connect: timing.connectEnd - timing.connectStart,
      ssl: timing.sslEnd - timing.sslStart,
      send: timing.sendEnd - timing.sendStart,
      wait: timing.receiveHeadersEnd - timing.sendEnd,
      receive: 'see encodedDataLength'
    };
  }

  /**
   * Print a request entry
   * @param {object} entry - Request entry
   * @param {boolean} verbose - Show headers
   */
  printRequest(entry, verbose = false) {
    const status = entry.status === 'pending' ? '...' :
                   entry.status === 'failed' ? `ERR: ${entry.error}` :
                   entry.status;

    const size = entry.encodedDataLength ? formatBytes(entry.encodedDataLength) : '-';
    const time = entry.duration ? formatDuration(entry.duration) : '-';

    console.log(`[${entry.method}] ${status} ${entry.url.substring(0, 80)}`);
    console.log(`  Type: ${entry.type} | Size: ${size} | Time: ${time}`);

    if (verbose && entry.responseHeaders) {
      console.log('  Response Headers:');
      for (const [key, value] of Object.entries(entry.responseHeaders)) {
        console.log(`    ${key}: ${value}`);
      }
    }

    if (entry.timing) {
      const t = this.formatTiming(entry.timing);
      console.log(`  Timing: DNS=${t.dns.toFixed(0)}ms, Connect=${t.connect.toFixed(0)}ms, Wait=${t.wait.toFixed(0)}ms`);
    }
  }
}

// Demo
async function main() {
  console.log('=== CDP Request Watcher Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const watcher = new RequestWatcher(client);

    // Enable domains
    await watcher.enable();

    // Start watching
    console.log('\n--- Starting Watcher ---');
    watcher.startWatching({
      onRequest: (entry) => {
        console.log(`  -> [${entry.method}] ${entry.url.substring(0, 60)}...`);
      },
      onComplete: (entry) => {
        const status = entry.status === 'failed' ? 'FAILED' : entry.status;
        console.log(`  <- [${status}] ${entry.url.substring(0, 60)}... (${formatDuration(entry.duration)})`);
      }
    });

    // Navigate to a page
    console.log('\n--- Navigating to example.com ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(1000);

    // Navigate to another page with more resources
    console.log('\n--- Navigating to httpbin.org ---');
    const navPromise2 = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://httpbin.org/html' });
    await navPromise2;
    await sleep(1000);

    // Show summary
    console.log('\n--- Request Summary ---');
    const requests = watcher.getRequests();
    console.log(`  Total requests: ${requests.length}`);

    // Group by type
    const byType = {};
    for (const r of requests) {
      byType[r.type] = (byType[r.type] || 0) + 1;
    }
    console.log('  By type:');
    for (const [type, count] of Object.entries(byType)) {
      console.log(`    ${type}: ${count}`);
    }

    // Show failed requests
    const failed = watcher.getFailedRequests();
    if (failed.length > 0) {
      console.log(`\n  Failed requests: ${failed.length}`);
      for (const r of failed) {
        console.log(`    [${r.status}] ${r.url}`);
      }
    }

    // Show detailed view of first request
    console.log('\n--- First Request Details ---');
    if (requests.length > 0) {
      watcher.printRequest(requests[0], true);
    }

    // Try to get response body
    console.log('\n--- Response Body Sample ---');
    if (requests.length > 0) {
      const body = await watcher.getResponseBody(requests[0].requestId);
      if (body) {
        console.log(`  First 200 chars: ${body.substring(0, 200)}...`);
      } else {
        console.log('  (Body not available)');
      }
    }

    // Stop watching
    watcher.stopWatching();

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { RequestWatcher };
