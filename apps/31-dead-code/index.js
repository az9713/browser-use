/**
 * App 31: Dead Code Detector
 *
 * Track unused CSS rules and JavaScript coverage using CDP:
 * - CSS rule usage tracking
 * - JavaScript code coverage
 * - Unused selector detection
 * - Function execution analysis
 * - Coverage percentage calculation
 *
 * CDP Domains: CSS, Profiler, Coverage
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import { formatBytes } from '../../shared/utils.js';

class DeadCodeDetector {
  constructor(client) {
    this.client = client;
    this.cssRules = new Map();
    this.coverage = null;
  }

  async enable() {
    await this.client.send('CSS.enable');
    await this.client.send('DOM.enable');
    await this.client.send('Profiler.enable');
    console.log('[DeadCode] Domains enabled');
  }

  async startCoverage() {
    // Start CSS coverage
    await this.client.send('CSS.startRuleUsageTracking');

    // Start JS coverage
    await this.client.send('Profiler.startPreciseCoverage', {
      callCount: true,
      detailed: true
    });

    console.log('[DeadCode] Coverage tracking started');
  }

  async stopCoverage() {
    // Get CSS coverage
    const cssResult = await this.client.send('CSS.stopRuleUsageTracking');

    // Get JS coverage
    const jsResult = await this.client.send('Profiler.takePreciseCoverage');

    await this.client.send('Profiler.stopPreciseCoverage');

    this.coverage = {
      css: this.analyzeCSSCoverage(cssResult.ruleUsage),
      js: this.analyzeJSCoverage(jsResult.result)
    };

    console.log('[DeadCode] Coverage tracking stopped');
    return this.coverage;
  }

  analyzeCSSCoverage(ruleUsage) {
    let totalRules = 0;
    let usedRules = 0;
    let unusedRules = 0;

    const byStylesheet = new Map();

    ruleUsage.forEach(rule => {
      totalRules++;

      const url = rule.styleSheetId || 'inline';

      if (!byStylesheet.has(url)) {
        byStylesheet.set(url, {
          total: 0,
          used: 0,
          unused: 0,
          rules: []
        });
      }

      const sheet = byStylesheet.get(url);
      sheet.total++;

      if (rule.used) {
        usedRules++;
        sheet.used++;
      } else {
        unusedRules++;
        sheet.unused++;
        sheet.rules.push(rule);
      }
    });

    return {
      total: totalRules,
      used: usedRules,
      unused: unusedRules,
      percentage: totalRules > 0 ? ((usedRules / totalRules) * 100).toFixed(2) : 0,
      byStylesheet: Array.from(byStylesheet.entries()).map(([url, data]) => ({
        url,
        ...data,
        percentage: data.total > 0 ? ((data.used / data.total) * 100).toFixed(2) : 0
      }))
    };
  }

  analyzeJSCoverage(coverageData) {
    let totalBytes = 0;
    let usedBytes = 0;

    const byScript = coverageData.map(script => {
      const scriptUrl = script.url || 'inline';
      let scriptUsedBytes = 0;

      script.functions.forEach(func => {
        func.ranges.forEach(range => {
          const rangeSize = range.endOffset - range.startOffset;
          totalBytes += rangeSize;

          if (range.count > 0) {
            usedBytes += rangeSize;
            scriptUsedBytes += rangeSize;
          }
        });
      });

      return {
        url: scriptUrl,
        totalBytes: script.functions.reduce((sum, func) => {
          return sum + func.ranges.reduce((s, r) => s + (r.endOffset - r.startOffset), 0);
        }, 0),
        usedBytes: scriptUsedBytes,
        percentage: scriptUsedBytes > 0 ?
          ((scriptUsedBytes / script.functions.reduce((sum, func) => {
            return sum + func.ranges.reduce((s, r) => s + (r.endOffset - r.startOffset), 0);
          }, 0)) * 100).toFixed(2) : 0,
        unusedFunctions: script.functions.filter(f =>
          f.ranges.every(r => r.count === 0)
        ).length
      };
    });

    return {
      totalBytes,
      usedBytes,
      unusedBytes: totalBytes - usedBytes,
      percentage: totalBytes > 0 ? ((usedBytes / totalBytes) * 100).toFixed(2) : 0,
      byScript: byScript.sort((a, b) => b.totalBytes - a.totalBytes)
    };
  }

  async findUnusedSelectors() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const used = new Set();
          const unused = [];

          // Get all stylesheets
          Array.from(document.styleSheets).forEach(sheet => {
            try {
              Array.from(sheet.cssRules || []).forEach(rule => {
                if (rule.selectorText) {
                  const selectors = rule.selectorText.split(',').map(s => s.trim());
                  selectors.forEach(selector => {
                    try {
                      const elements = document.querySelectorAll(selector);
                      if (elements.length > 0) {
                        used.add(selector);
                      } else {
                        unused.push({
                          selector: selector,
                          rule: rule.cssText.substring(0, 100)
                        });
                      }
                    } catch (e) {
                      // Invalid selector
                    }
                  });
                }
              });
            } catch (e) {
              // CORS or access denied
            }
          });

          return {
            used: used.size,
            unused: unused.slice(0, 50) // Limit to 50
          };
        })()
      `,
      returnByValue: true
    });

    return result.result.value;
  }

  async findUnusedImages() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const loaded = [];
          const notLoaded = [];

          document.querySelectorAll('img').forEach(img => {
            if (img.complete && img.naturalHeight > 0) {
              loaded.push({
                src: img.src,
                width: img.naturalWidth,
                height: img.naturalHeight
              });
            } else {
              notLoaded.push({
                src: img.src,
                error: !img.complete
              });
            }
          });

          return { loaded: loaded.length, notLoaded };
        })()
      `,
      returnByValue: true
    });

    return result.result.value;
  }

  async analyzeEventListeners() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const listeners = [];

          // This is simplified - full analysis would require heap snapshot
          document.querySelectorAll('*').forEach((el, i) => {
            if (i < 100) { // Limit sample
              const events = getEventListeners(el);
              if (events && Object.keys(events).length > 0) {
                listeners.push({
                  tag: el.tagName.toLowerCase(),
                  id: el.id || null,
                  events: Object.keys(events),
                  count: Object.values(events).reduce((sum, arr) => sum + arr.length, 0)
                });
              }
            }
          });

          return listeners;
        })()
      `,
      returnByValue: true
    });

    return result.result.value || [];
  }

  printCoverageSummary() {
    if (!this.coverage) {
      console.log('  No coverage data available');
      return;
    }

    console.log('\n=== CSS Coverage ===');
    console.log(`  Total Rules: ${this.coverage.css.total}`);
    console.log(`  Used Rules: ${this.coverage.css.used} (${this.coverage.css.percentage}%)`);
    console.log(`  Unused Rules: ${this.coverage.css.unused}`);

    console.log('\n  By Stylesheet:');
    this.coverage.css.byStylesheet.slice(0, 5).forEach(sheet => {
      const url = sheet.url.substring(sheet.url.lastIndexOf('/') + 1) || 'inline';
      console.log(`    ${url}: ${sheet.used}/${sheet.total} used (${sheet.percentage}%)`);
    });

    console.log('\n=== JavaScript Coverage ===');
    console.log(`  Total Bytes: ${formatBytes(this.coverage.js.totalBytes)}`);
    console.log(`  Used Bytes: ${formatBytes(this.coverage.js.usedBytes)} (${this.coverage.js.percentage}%)`);
    console.log(`  Unused Bytes: ${formatBytes(this.coverage.js.unusedBytes)}`);

    console.log('\n  By Script (top 5):');
    this.coverage.js.byScript.slice(0, 5).forEach(script => {
      const url = script.url.substring(script.url.lastIndexOf('/') + 1) || 'inline';
      console.log(`    ${url}`);
      console.log(`      Total: ${formatBytes(script.totalBytes)}`);
      console.log(`      Used: ${formatBytes(script.usedBytes)} (${script.percentage}%)`);
      console.log(`      Unused Functions: ${script.unusedFunctions}`);
    });
  }

  generateReport() {
    if (!this.coverage) return null;

    return {
      summary: {
        css: {
          coverage: parseFloat(this.coverage.css.percentage),
          wastedRules: this.coverage.css.unused
        },
        js: {
          coverage: parseFloat(this.coverage.js.percentage),
          wastedBytes: this.coverage.js.unusedBytes
        }
      },
      css: this.coverage.css,
      js: this.coverage.js
    };
  }
}

async function main() {
  console.log('=== CDP Dead Code Detector Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const detector = new DeadCodeDetector(client);

    await detector.enable();

    console.log('\n--- Starting coverage tracking ---');
    await detector.startCoverage();

    console.log('\n--- Navigating to page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(2000);

    // Interact with page to exercise code
    console.log('\n--- Simulating user interactions ---');
    await client.send('Runtime.evaluate', {
      expression: `
        // Scroll
        window.scrollTo(0, document.body.scrollHeight / 2);
        // Click some elements
        document.querySelectorAll('a').forEach((a, i) => {
          if (i < 3) a.dispatchEvent(new MouseEvent('mouseover'));
        });
      `
    });
    await sleep(2000);

    console.log('\n--- Stopping coverage tracking ---');
    await detector.stopCoverage();

    detector.printCoverageSummary();

    console.log('\n--- Finding unused selectors ---');
    const selectors = await detector.findUnusedSelectors();
    console.log(`  Used selectors: ${selectors.used}`);
    console.log(`  Unused selectors: ${selectors.unused.length}`);
    if (selectors.unused.length > 0) {
      console.log('\n  Examples:');
      selectors.unused.slice(0, 5).forEach(s => {
        console.log(`    ${s.selector}`);
      });
    }

    console.log('\n--- Analyzing images ---');
    const images = await detector.findUnusedImages();
    console.log(`  Loaded: ${images.loaded}`);
    console.log(`  Not Loaded: ${images.notLoaded.length}`);

    console.log('\n--- Generating report ---');
    const report = detector.generateReport();
    console.log(JSON.stringify(report.summary, null, 2));

    console.log('\n=== Demo Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { DeadCodeDetector };
