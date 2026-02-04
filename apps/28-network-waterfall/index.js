/**
 * App 28: Network Waterfall
 *
 * ASCII waterfall chart of network request timings using CDP:
 * - Visual timeline of all requests
 * - Timing breakdown (DNS, TCP, TLS, Request, Response)
 * - Color-coded by resource type
 * - Size and duration statistics
 * - Request priority indication
 *
 * CDP Domains: Network, Performance
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import { formatBytes, formatDuration } from '../../shared/utils.js';

class NetworkWaterfall {
  constructor(client) {
    this.client = client;
    this.requests = new Map();
    this.startTime = null;
  }

  async enable() {
    await this.client.send('Network.enable');
    await this.client.send('Performance.enable');

    this.client.on('Network.requestWillBeSent', (event) => {
      if (!this.startTime) {
        this.startTime = event.wallTime * 1000;
      }

      this.requests.set(event.requestId, {
        id: event.requestId,
        url: event.request.url,
        method: event.request.method,
        type: event.type || 'Other',
        priority: event.request.initialPriority,
        startTime: event.wallTime * 1000,
        timing: null,
        response: null,
        finished: false
      });
    });

    this.client.on('Network.responseReceived', (event) => {
      const request = this.requests.get(event.requestId);
      if (request) {
        request.response = {
          status: event.response.status,
          mimeType: event.response.mimeType,
          encodedDataLength: event.response.encodedDataLength,
          timing: event.response.timing
        };
        request.timing = event.response.timing;
      }
    });

    this.client.on('Network.loadingFinished', (event) => {
      const request = this.requests.get(event.requestId);
      if (request) {
        request.finished = true;
        request.endTime = event.timestamp * 1000;
        request.encodedDataLength = event.encodedDataLength;
      }
    });

    this.client.on('Network.loadingFailed', (event) => {
      const request = this.requests.get(event.requestId);
      if (request) {
        request.failed = true;
        request.errorText = event.errorText;
      }
    });

    console.log('[NetworkWaterfall] Enabled and listening');
  }

  getRequestSummary() {
    const requests = Array.from(this.requests.values());
    const finished = requests.filter(r => r.finished);

    const byType = {};
    let totalSize = 0;
    let totalDuration = 0;

    finished.forEach(req => {
      const type = req.type || 'Other';
      if (!byType[type]) {
        byType[type] = { count: 0, size: 0 };
      }
      byType[type].count++;
      byType[type].size += req.encodedDataLength || 0;
      totalSize += req.encodedDataLength || 0;

      if (req.endTime && req.startTime) {
        totalDuration += (req.endTime - req.startTime);
      }
    });

    return {
      total: requests.length,
      finished: finished.length,
      failed: requests.filter(r => r.failed).length,
      byType,
      totalSize,
      avgDuration: finished.length > 0 ? totalDuration / finished.length : 0
    };
  }

  getTimingBreakdown(request) {
    if (!request.timing) return null;

    const timing = request.timing;
    const breakdown = {
      queueing: timing.dnsStart > 0 ? timing.dnsStart : 0,
      dns: timing.dnsEnd > timing.dnsStart ? timing.dnsEnd - timing.dnsStart : 0,
      connecting: timing.connectEnd > timing.connectStart ? timing.connectEnd - timing.connectStart : 0,
      ssl: timing.sslEnd > timing.sslStart ? timing.sslEnd - timing.sslStart : 0,
      sending: timing.sendEnd - timing.sendStart,
      waiting: timing.receiveHeadersEnd - timing.sendEnd,
      receiving: request.endTime && request.startTime ?
        (request.endTime - request.startTime) - timing.receiveHeadersEnd : 0
    };

    return breakdown;
  }

  createWaterfallChart(maxWidth = 60) {
    const requests = Array.from(this.requests.values())
      .filter(r => r.finished && r.startTime && r.endTime)
      .sort((a, b) => a.startTime - b.startTime);

    if (requests.length === 0) return [];

    const minTime = Math.min(...requests.map(r => r.startTime));
    const maxTime = Math.max(...requests.map(r => r.endTime));
    const timeRange = maxTime - minTime;

    const chart = requests.map(req => {
      const relStart = ((req.startTime - minTime) / timeRange) * maxWidth;
      const duration = req.endTime - req.startTime;
      const barWidth = Math.max(1, Math.floor((duration / timeRange) * maxWidth));

      const padding = ' '.repeat(Math.floor(relStart));
      const bar = this.getBarChar(req.type).repeat(barWidth);

      const url = new URL(req.url);
      const fileName = url.pathname.split('/').pop() || url.hostname;
      const displayName = fileName.substring(0, 30);

      return {
        name: displayName,
        type: req.type,
        bar: padding + bar,
        duration: duration,
        size: req.encodedDataLength || 0,
        status: req.response?.status || 0
      };
    });

    return chart;
  }

  getBarChar(type) {
    const chars = {
      Document: '█',
      Stylesheet: '▓',
      Script: '▒',
      Image: '░',
      Font: '▬',
      XHR: '▪',
      Fetch: '▪',
      Other: '─'
    };
    return chars[type] || '─';
  }

  getTypeColor(type) {
    const colors = {
      Document: '\x1b[34m',    // Blue
      Stylesheet: '\x1b[35m',  // Magenta
      Script: '\x1b[33m',      // Yellow
      Image: '\x1b[32m',       // Green
      Font: '\x1b[36m',        // Cyan
      XHR: '\x1b[31m',         // Red
      Fetch: '\x1b[31m',       // Red
      Other: '\x1b[37m'        // White
    };
    return colors[type] || '\x1b[37m';
  }

  printWaterfall() {
    const chart = this.createWaterfallChart(60);
    const reset = '\x1b[0m';

    console.log('\n┌─ Network Waterfall ─────────────────────────────────────────┐');

    chart.forEach((item, i) => {
      const color = this.getTypeColor(item.type);
      const typeTag = `[${item.type.substring(0, 6).padEnd(6)}]`;
      const statusTag = item.status >= 200 && item.status < 300 ? '✓' : '✗';
      const sizeTag = formatBytes(item.size).padEnd(8);
      const durationTag = formatDuration(item.duration).padEnd(8);

      console.log(`│ ${color}${item.bar}${reset} ${statusTag} ${typeTag} ${sizeTag} ${durationTag} │`);
      console.log(`│   ${item.name.padEnd(58)} │`);
    });

    console.log('└─────────────────────────────────────────────────────────────┘');
  }

  printTimingBreakdown(requestId) {
    const request = this.requests.get(requestId);
    if (!request) return;

    const breakdown = this.getTimingBreakdown(request);
    if (!breakdown) {
      console.log('  No timing data available');
      return;
    }

    console.log('\n  Timing Breakdown:');
    console.log(`    Queueing:   ${breakdown.queueing.toFixed(2)}ms`);
    console.log(`    DNS:        ${breakdown.dns.toFixed(2)}ms`);
    console.log(`    Connecting: ${breakdown.connecting.toFixed(2)}ms`);
    console.log(`    SSL:        ${breakdown.ssl.toFixed(2)}ms`);
    console.log(`    Sending:    ${breakdown.sending.toFixed(2)}ms`);
    console.log(`    Waiting:    ${breakdown.waiting.toFixed(2)}ms`);
    console.log(`    Receiving:  ${breakdown.receiving.toFixed(2)}ms`);

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    console.log(`    Total:      ${total.toFixed(2)}ms`);
  }

  clearRequests() {
    this.requests.clear();
    this.startTime = null;
  }
}

async function main() {
  console.log('=== CDP Network Waterfall Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const waterfall = new NetworkWaterfall(client);

    await waterfall.enable();

    console.log('\n--- Navigating to page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://news.ycombinator.com' });
    await navPromise;
    await sleep(2000);

    console.log('\n--- Request Summary ---');
    const summary = waterfall.getRequestSummary();
    console.log(`  Total Requests: ${summary.total}`);
    console.log(`  Finished: ${summary.finished}`);
    console.log(`  Failed: ${summary.failed}`);
    console.log(`  Total Size: ${formatBytes(summary.totalSize)}`);
    console.log(`  Avg Duration: ${formatDuration(summary.avgDuration)}`);

    console.log('\n--- By Resource Type ---');
    Object.entries(summary.byType).forEach(([type, data]) => {
      console.log(`  ${type.padEnd(12)} ${data.count.toString().padStart(3)} requests  ${formatBytes(data.size).padStart(10)}`);
    });

    waterfall.printWaterfall();

    // Show timing breakdown for first request
    const firstRequest = Array.from(waterfall.requests.values())[0];
    if (firstRequest) {
      console.log(`\n--- Timing Details: ${firstRequest.url.substring(0, 50)}... ---`);
      waterfall.printTimingBreakdown(firstRequest.id);
    }

    console.log('\n=== Demo Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { NetworkWaterfall };
