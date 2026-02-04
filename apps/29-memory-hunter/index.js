/**
 * App 29: Memory Hunter
 *
 * Memory leak detection and heap analysis using CDP:
 * - Take heap snapshots
 * - Compare snapshots to find leaks
 * - Track object allocation
 * - Identify detached DOM nodes
 * - Memory usage timeline
 *
 * CDP Domains: HeapProfiler, Memory, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import { formatBytes } from '../../shared/utils.js';

class MemoryHunter {
  constructor(client) {
    this.client = client;
    this.snapshots = [];
  }

  async enable() {
    await this.client.send('HeapProfiler.enable');
    await this.client.send('Memory.startSampling');
    await this.client.send('Runtime.enable');
    console.log('[MemoryHunter] Enabled');
  }

  async disable() {
    await this.client.send('Memory.stopSampling');
    await this.client.send('HeapProfiler.disable');
    console.log('[MemoryHunter] Disabled');
  }

  async takeSnapshot(name = null) {
    console.log(`[MemoryHunter] Taking snapshot${name ? ` "${name}"` : ''}...`);

    const chunks = [];

    this.client.on('HeapProfiler.addHeapSnapshotChunk', (event) => {
      chunks.push(event.chunk);
    });

    await this.client.send('HeapProfiler.takeHeapSnapshot', {
      reportProgress: false,
      captureNumericValue: true
    });

    // Parse the snapshot
    const snapshotData = JSON.parse(chunks.join(''));

    const snapshot = {
      name: name || `Snapshot ${this.snapshots.length + 1}`,
      timestamp: Date.now(),
      data: snapshotData,
      stats: this.analyzeSnapshot(snapshotData)
    };

    this.snapshots.push(snapshot);
    console.log(`[MemoryHunter] Snapshot taken: ${formatBytes(snapshot.stats.totalSize)}`);

    return snapshot;
  }

  analyzeSnapshot(snapshotData) {
    const snapshot = snapshotData.snapshot || {};
    const meta = snapshot.meta || {};

    // Extract statistics
    const stats = {
      nodeCount: meta.node_count || 0,
      edgeCount: meta.edge_count || 0,
      totalSize: 0,
      typeDistribution: {}
    };

    // Parse nodes to calculate sizes and types
    const nodes = snapshotData.nodes || [];
    const nodeFieldCount = meta.node_fields?.length || 6;
    const nodeTypeOffset = meta.node_fields?.indexOf('type') || 0;
    const nodeSizeOffset = meta.node_fields?.indexOf('self_size') || 3;

    for (let i = 0; i < nodes.length; i += nodeFieldCount) {
      const typeIdx = nodes[i + nodeTypeOffset];
      const size = nodes[i + nodeSizeOffset];

      stats.totalSize += size;

      const typeName = meta.node_types?.[0]?.[typeIdx] || 'unknown';
      if (!stats.typeDistribution[typeName]) {
        stats.typeDistribution[typeName] = { count: 0, size: 0 };
      }
      stats.typeDistribution[typeName].count++;
      stats.typeDistribution[typeName].size += size;
    }

    return stats;
  }

  compareSnapshots(snapshot1, snapshot2) {
    const diff = {
      nodeCountDiff: snapshot2.stats.nodeCount - snapshot1.stats.nodeCount,
      sizeDiff: snapshot2.stats.totalSize - snapshot1.stats.totalSize,
      timeDiff: snapshot2.timestamp - snapshot1.timestamp,
      typeChanges: {}
    };

    // Compare type distributions
    const allTypes = new Set([
      ...Object.keys(snapshot1.stats.typeDistribution),
      ...Object.keys(snapshot2.stats.typeDistribution)
    ]);

    allTypes.forEach(type => {
      const before = snapshot1.stats.typeDistribution[type] || { count: 0, size: 0 };
      const after = snapshot2.stats.typeDistribution[type] || { count: 0, size: 0 };

      diff.typeChanges[type] = {
        countDiff: after.count - before.count,
        sizeDiff: after.size - before.size
      };
    });

    return diff;
  }

  async getSamplingProfile() {
    const result = await this.client.send('Memory.getSamplingProfile');
    return result.profile;
  }

  async getMemoryUsage() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          if (performance.memory) {
            return {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
          }
          return null;
        })()
      `,
      returnByValue: true
    });

    return result.result.value;
  }

  async findDetachedDOMNodes() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          // This is a simplified detection
          // In a real implementation, you'd analyze the heap snapshot
          const detached = [];

          // Check for common leak patterns
          if (window.__detachedNodes) {
            detached.push(...window.__detachedNodes);
          }

          return {
            count: detached.length,
            warning: 'Full detached DOM analysis requires heap snapshot parsing'
          };
        })()
      `,
      returnByValue: true
    });

    return result.result.value;
  }

  async collectGarbage() {
    await this.client.send('HeapProfiler.collectGarbage');
    console.log('[MemoryHunter] Garbage collection triggered');
  }

  async injectMemoryLeak() {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          // Create an intentional memory leak for testing
          if (!window.__leakyArray) {
            window.__leakyArray = [];
            window.__leakInterval = setInterval(() => {
              // Add large objects to array
              for (let i = 0; i < 1000; i++) {
                window.__leakyArray.push({
                  data: new Array(1000).fill('leak'),
                  timestamp: Date.now(),
                  id: Math.random()
                });
              }
              console.log('[Leak] Array size:', window.__leakyArray.length);
            }, 1000);
            console.log('[Leak] Memory leak started');
          }
        })()
      `
    });
    console.log('[MemoryHunter] Memory leak injected');
  }

  async stopMemoryLeak() {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          if (window.__leakInterval) {
            clearInterval(window.__leakInterval);
            delete window.__leakInterval;
            delete window.__leakyArray;
            console.log('[Leak] Memory leak stopped and cleaned');
          }
        })()
      `
    });
    console.log('[MemoryHunter] Memory leak stopped');
  }

  printSnapshotSummary(snapshot) {
    console.log(`\n  Snapshot: ${snapshot.name}`);
    console.log(`  Timestamp: ${new Date(snapshot.timestamp).toISOString()}`);
    console.log(`  Total Size: ${formatBytes(snapshot.stats.totalSize)}`);
    console.log(`  Node Count: ${snapshot.stats.nodeCount.toLocaleString()}`);
    console.log(`  Edge Count: ${snapshot.stats.edgeCount.toLocaleString()}`);
    console.log(`\n  Top Types by Size:`);

    const sortedTypes = Object.entries(snapshot.stats.typeDistribution)
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 10);

    sortedTypes.forEach(([type, data]) => {
      const percent = ((data.size / snapshot.stats.totalSize) * 100).toFixed(1);
      console.log(`    ${type.padEnd(20)} ${formatBytes(data.size).padStart(10)} (${percent}%) ${data.count.toLocaleString()} objects`);
    });
  }

  printComparison(snapshot1, snapshot2) {
    const diff = this.compareSnapshots(snapshot1, snapshot2);

    console.log(`\n  Comparing: ${snapshot1.name} → ${snapshot2.name}`);
    console.log(`  Time Delta: ${formatBytes(diff.timeDiff / 1000)}s`);
    console.log(`  Size Change: ${formatBytes(diff.sizeDiff)} (${diff.sizeDiff > 0 ? '+' : ''}${((diff.sizeDiff / snapshot1.stats.totalSize) * 100).toFixed(1)}%)`);
    console.log(`  Node Change: ${diff.nodeCountDiff > 0 ? '+' : ''}${diff.nodeCountDiff.toLocaleString()}`);

    console.log(`\n  Largest Increases:`);
    const increases = Object.entries(diff.typeChanges)
      .filter(([_, change]) => change.sizeDiff > 0)
      .sort((a, b) => b[1].sizeDiff - a[1].sizeDiff)
      .slice(0, 10);

    increases.forEach(([type, change]) => {
      console.log(`    ${type.padEnd(20)} +${formatBytes(change.sizeDiff).padStart(10)} (+${change.countDiff.toLocaleString()} objects)`);
    });
  }
}

async function main() {
  console.log('=== CDP Memory Hunter Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const hunter = new MemoryHunter(client);

    await hunter.enable();

    console.log('\n--- Navigating to page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(1000);

    console.log('\n--- Initial Memory Usage ---');
    const initialMemory = await hunter.getMemoryUsage();
    if (initialMemory) {
      console.log(`  Used: ${formatBytes(initialMemory.usedJSHeapSize)}`);
      console.log(`  Total: ${formatBytes(initialMemory.totalJSHeapSize)}`);
      console.log(`  Limit: ${formatBytes(initialMemory.jsHeapSizeLimit)}`);
    }

    console.log('\n--- Taking baseline snapshot ---');
    const baseline = await hunter.takeSnapshot('Baseline');
    hunter.printSnapshotSummary(baseline);

    console.log('\n--- Injecting memory leak ---');
    await hunter.injectMemoryLeak();
    await sleep(5000);

    console.log('\n--- Taking second snapshot ---');
    const afterLeak = await hunter.takeSnapshot('After Leak');
    hunter.printSnapshotSummary(afterLeak);

    console.log('\n--- Comparing snapshots ---');
    hunter.printComparison(baseline, afterLeak);

    console.log('\n--- Stopping leak and collecting garbage ---');
    await hunter.stopMemoryLeak();
    await hunter.collectGarbage();
    await sleep(2000);

    console.log('\n--- Taking final snapshot ---');
    const afterCleanup = await hunter.takeSnapshot('After Cleanup');
    hunter.printSnapshotSummary(afterCleanup);

    console.log('\n--- Cleanup comparison ---');
    hunter.printComparison(afterLeak, afterCleanup);

    await hunter.disable();

    console.log('\n=== Demo Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { MemoryHunter };
