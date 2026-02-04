/**
 * App 23: Performance X-Ray
 *
 * Real-time performance monitoring using CDP:
 * - Real-time FPS counter overlay
 * - Layout shift indicator
 * - Long task detection
 * - Paint time visualization
 * - Memory usage display
 *
 * CDP Domains: Performance, Tracing, Overlay, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import { formatBytes } from '../../shared/utils.js';

class PerformanceXRay {
  constructor(client) {
    this.client = client;
    this.metrics = {};
    this.monitoring = false;
  }

  async enable() {
    await this.client.send('Performance.enable');
    await this.client.send('Page.enable');
    await this.client.send('Runtime.enable');
    console.log('[PerfXRay] Performance domains enabled');
  }

  async getMetrics() {
    const result = await this.client.send('Performance.getMetrics');
    const metrics = {};
    for (const { name, value } of result.metrics) {
      metrics[name] = value;
    }
    return metrics;
  }

  async startMonitoring(interval = 1000) {
    this.monitoring = true;
    console.log('[PerfXRay] Started monitoring...');

    while (this.monitoring) {
      const metrics = await this.getMetrics();
      this.metrics = metrics;

      const jsHeap = formatBytes(metrics.JSHeapUsedSize || 0);
      const totalHeap = formatBytes(metrics.JSHeapTotalSize || 0);
      const nodes = metrics.Nodes || 0;
      const layouts = metrics.LayoutCount || 0;
      const recalcStyles = metrics.RecalcStyleCount || 0;

      console.log(`\n[Metrics] JS Heap: ${jsHeap}/${totalHeap} | Nodes: ${nodes} | Layouts: ${layouts} | Styles: ${recalcStyles}`);

      await sleep(interval);
    }
  }

  stopMonitoring() {
    this.monitoring = false;
    console.log('[PerfXRay] Stopped monitoring');
  }

  async injectFPSCounter() {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          if (document.getElementById('cdp-fps-counter')) return;

          const div = document.createElement('div');
          div.id = 'cdp-fps-counter';
          div.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.8);color:#0f0;padding:10px;font-family:monospace;font-size:14px;z-index:999999;border-radius:5px;';

          let lastTime = performance.now();
          let frames = 0;
          let fps = 0;

          function updateFPS() {
            frames++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
              fps = Math.round(frames * 1000 / (now - lastTime));
              frames = 0;
              lastTime = now;
              div.textContent = 'FPS: ' + fps;
              div.style.color = fps >= 55 ? '#0f0' : fps >= 30 ? '#ff0' : '#f00';
            }
            requestAnimationFrame(updateFPS);
          }

          document.body.appendChild(div);
          updateFPS();
        })()
      `
    });
    console.log('[PerfXRay] FPS counter injected');
  }

  async injectMemoryDisplay() {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          if (document.getElementById('cdp-memory-display')) return;

          const div = document.createElement('div');
          div.id = 'cdp-memory-display';
          div.style.cssText = 'position:fixed;top:50px;right:10px;background:rgba(0,0,0,0.8);color:#0ff;padding:10px;font-family:monospace;font-size:12px;z-index:999999;border-radius:5px;';

          function updateMemory() {
            if (performance.memory) {
              const used = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
              const total = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
              div.textContent = 'Memory: ' + used + '/' + total + ' MB';
            } else {
              div.textContent = 'Memory: N/A';
            }
          }

          document.body.appendChild(div);
          updateMemory();
          setInterval(updateMemory, 1000);
        })()
      `
    });
    console.log('[PerfXRay] Memory display injected');
  }

  async detectLayoutShifts() {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          if (window.__cdpLayoutShiftObserver) return;

          let totalCLS = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                totalCLS += entry.value;
                console.log('[Layout Shift] CLS:', entry.value.toFixed(4), 'Total:', totalCLS.toFixed(4));
              }
            }
          });

          observer.observe({ type: 'layout-shift', buffered: true });
          window.__cdpLayoutShiftObserver = observer;
          console.log('[PerfXRay] Layout shift detection started');
        })()
      `
    });
    console.log('[PerfXRay] Layout shift detection enabled');
  }

  async detectLongTasks() {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          if (window.__cdpLongTaskObserver) return;

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              console.warn('[Long Task]', entry.duration.toFixed(0) + 'ms', entry.name);
            }
          });

          observer.observe({ type: 'longtask', buffered: true });
          window.__cdpLongTaskObserver = observer;
          console.log('[PerfXRay] Long task detection started');
        })()
      `
    });
    console.log('[PerfXRay] Long task detection enabled');
  }

  async getNavigationTiming() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const timing = performance.getEntriesByType('navigation')[0];
          if (!timing) return null;
          return {
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            ttfb: timing.responseStart - timing.requestStart,
            download: timing.responseEnd - timing.responseStart,
            domParsing: timing.domInteractive - timing.responseEnd,
            domComplete: timing.domComplete - timing.domInteractive,
            load: timing.loadEventEnd - timing.loadEventStart,
            total: timing.loadEventEnd - timing.startTime
          };
        })()
      `,
      returnByValue: true
    });
    return result.result.value;
  }

  async removeOverlays() {
    await this.client.send('Runtime.evaluate', {
      expression: `
        ['cdp-fps-counter', 'cdp-memory-display'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });
      `
    });
    console.log('[PerfXRay] Overlays removed');
  }
}

async function main() {
  console.log('=== CDP Performance X-Ray Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const xray = new PerformanceXRay(client);

    await xray.enable();

    console.log('\n--- Navigating to test page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    console.log('\n--- Injecting FPS Counter ---');
    await xray.injectFPSCounter();

    console.log('\n--- Injecting Memory Display ---');
    await xray.injectMemoryDisplay();

    console.log('\n--- Enabling Layout Shift Detection ---');
    await xray.detectLayoutShifts();

    console.log('\n--- Enabling Long Task Detection ---');
    await xray.detectLongTasks();

    console.log('\n--- Navigation Timing ---');
    const timing = await xray.getNavigationTiming();
    if (timing) {
      console.log(`  DNS: ${timing.dns.toFixed(0)}ms`);
      console.log(`  TCP: ${timing.tcp.toFixed(0)}ms`);
      console.log(`  TTFB: ${timing.ttfb.toFixed(0)}ms`);
      console.log(`  DOM Complete: ${timing.domComplete.toFixed(0)}ms`);
      console.log(`  Total: ${timing.total.toFixed(0)}ms`);
    }

    console.log('\n--- Current Metrics ---');
    const metrics = await xray.getMetrics();
    console.log(`  JS Heap: ${formatBytes(metrics.JSHeapUsedSize || 0)}`);
    console.log(`  DOM Nodes: ${metrics.Nodes || 0}`);
    console.log(`  Layout Count: ${metrics.LayoutCount || 0}`);

    await sleep(3000);

    console.log('\n--- Removing Overlays ---');
    await xray.removeOverlays();

    console.log('\n=== Demo Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { PerformanceXRay };
