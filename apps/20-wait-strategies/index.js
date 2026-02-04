/**
 * App 20: Wait Strategies
 *
 * Demonstrates various wait patterns using CDP:
 * - Wait for navigation complete
 * - Wait for element to appear
 * - Wait for element to disappear
 * - Wait for network idle
 * - Wait for custom JS condition
 * - Configurable timeout
 *
 * CDP Domains: Page, DOM, Network
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { sleep } from '../../shared/wait-helpers.js';

class WaitStrategies {
  constructor(client) {
    this.client = client;
    this.defaultTimeout = 30000;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Page.enable');
    await this.client.send('DOM.enable');
    await this.client.send('Network.enable');
    await this.client.send('Runtime.enable');
    console.log('[WaitStrategies] All domains enabled');
  }

  /**
   * Wait for page load event
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<void>}
   */
  async waitForLoad(timeout = this.defaultTimeout) {
    console.log('[Wait] Waiting for load event...');
    return this.waitForEvent('Page.loadEventFired', timeout);
  }

  /**
   * Wait for DOMContentLoaded event
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<void>}
   */
  async waitForDOMContentLoaded(timeout = this.defaultTimeout) {
    console.log('[Wait] Waiting for DOMContentLoaded...');
    return this.waitForEvent('Page.domContentEventFired', timeout);
  }

  /**
   * Wait for a CDP event
   * @param {string} eventName - Event name
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<object>}
   */
  waitForEvent(eventName, timeout = this.defaultTimeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.client.off(eventName, handler);
        reject(new Error(`Timeout waiting for ${eventName}`));
      }, timeout);

      const handler = (params) => {
        clearTimeout(timer);
        this.client.off(eventName, handler);
        resolve(params);
      };

      this.client.on(eventName, handler);
    });
  }

  /**
   * Wait for network to be idle
   * @param {number} idleTime - Time with no requests to consider idle
   * @param {number} timeout - Overall timeout
   * @returns {Promise<void>}
   */
  async waitForNetworkIdle(idleTime = 500, timeout = this.defaultTimeout) {
    console.log(`[Wait] Waiting for network idle (${idleTime}ms quiet)...`);

    return new Promise((resolve, reject) => {
      let pendingRequests = 0;
      let idleTimer = null;
      let timeoutTimer = null;

      const cleanup = () => {
        clearTimeout(idleTimer);
        clearTimeout(timeoutTimer);
        this.client.off('Network.requestWillBeSent', onRequest);
        this.client.off('Network.loadingFinished', onFinished);
        this.client.off('Network.loadingFailed', onFinished);
      };

      const checkIdle = () => {
        if (pendingRequests === 0) {
          idleTimer = setTimeout(() => {
            cleanup();
            console.log('[Wait] Network idle');
            resolve();
          }, idleTime);
        }
      };

      const onRequest = () => {
        clearTimeout(idleTimer);
        pendingRequests++;
      };

      const onFinished = () => {
        pendingRequests = Math.max(0, pendingRequests - 1);
        checkIdle();
      };

      timeoutTimer = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout waiting for network idle'));
      }, timeout);

      this.client.on('Network.requestWillBeSent', onRequest);
      this.client.on('Network.loadingFinished', onFinished);
      this.client.on('Network.loadingFailed', onFinished);

      checkIdle();
    });
  }

  /**
   * Wait for an element to appear
   * @param {string} selector - CSS selector
   * @param {object} options - Wait options
   * @returns {Promise<number>} - Node ID
   */
  async waitForElement(selector, options = {}) {
    const { timeout = this.defaultTimeout, pollInterval = 100, visible = false } = options;

    console.log(`[Wait] Waiting for element: ${selector}`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const { root } = await this.client.send('DOM.getDocument');
        const { nodeId } = await this.client.send('DOM.querySelector', {
          nodeId: root.nodeId,
          selector
        });

        if (nodeId !== 0) {
          if (visible) {
            // Check if element is visible
            const result = await this.client.send('Runtime.evaluate', {
              expression: `
                (function() {
                  const el = document.querySelector('${selector}');
                  if (!el) return false;
                  const rect = el.getBoundingClientRect();
                  const style = window.getComputedStyle(el);
                  return rect.width > 0 && rect.height > 0 &&
                         style.display !== 'none' &&
                         style.visibility !== 'hidden' &&
                         style.opacity !== '0';
                })()
              `,
              returnByValue: true
            });

            if (result.result.value) {
              console.log(`[Wait] Element visible: ${selector}`);
              return nodeId;
            }
          } else {
            console.log(`[Wait] Element found: ${selector}`);
            return nodeId;
          }
        }
      } catch (error) {
        // Ignore errors, keep trying
      }

      await sleep(pollInterval);
    }

    throw new Error(`Timeout waiting for element: ${selector}`);
  }

  /**
   * Wait for an element to disappear
   * @param {string} selector - CSS selector
   * @param {object} options - Wait options
   * @returns {Promise<void>}
   */
  async waitForElementToDisappear(selector, options = {}) {
    const { timeout = this.defaultTimeout, pollInterval = 100 } = options;

    console.log(`[Wait] Waiting for element to disappear: ${selector}`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const { root } = await this.client.send('DOM.getDocument');
        const { nodeId } = await this.client.send('DOM.querySelector', {
          nodeId: root.nodeId,
          selector
        });

        if (nodeId === 0) {
          console.log(`[Wait] Element gone: ${selector}`);
          return;
        }
      } catch (error) {
        // Element not found, consider it disappeared
        console.log(`[Wait] Element gone: ${selector}`);
        return;
      }

      await sleep(pollInterval);
    }

    throw new Error(`Timeout waiting for element to disappear: ${selector}`);
  }

  /**
   * Wait for a JavaScript condition to be true
   * @param {string} expression - JS expression returning truthy value
   * @param {object} options - Wait options
   * @returns {Promise<any>} - Result when truthy
   */
  async waitForCondition(expression, options = {}) {
    const { timeout = this.defaultTimeout, pollInterval = 100 } = options;

    console.log(`[Wait] Waiting for condition: ${expression.substring(0, 50)}...`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const result = await this.client.send('Runtime.evaluate', {
          expression,
          returnByValue: true,
          awaitPromise: true
        });

        if (result.result && result.result.value) {
          console.log('[Wait] Condition met');
          return result.result.value;
        }
      } catch (error) {
        // Ignore and retry
      }

      await sleep(pollInterval);
    }

    throw new Error(`Timeout waiting for condition`);
  }

  /**
   * Wait for navigation to complete
   * @param {object} options - Wait options
   * @returns {Promise<void>}
   */
  async waitForNavigation(options = {}) {
    const { timeout = this.defaultTimeout, waitUntil = 'load' } = options;

    console.log(`[Wait] Waiting for navigation (${waitUntil})...`);

    const eventMap = {
      load: 'Page.loadEventFired',
      domContentLoaded: 'Page.domContentEventFired',
      networkIdle: null
    };

    if (waitUntil === 'networkIdle') {
      return this.waitForNetworkIdle(500, timeout);
    }

    const eventName = eventMap[waitUntil];
    if (!eventName) {
      throw new Error(`Invalid waitUntil: ${waitUntil}`);
    }

    await this.waitForEvent(eventName, timeout);
    console.log(`[Wait] Navigation complete (${waitUntil})`);
  }

  /**
   * Wait for a specific URL
   * @param {string|RegExp} urlPattern - URL pattern to match
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<string>} - Matched URL
   */
  async waitForUrl(urlPattern, timeout = this.defaultTimeout) {
    console.log(`[Wait] Waiting for URL: ${urlPattern}`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await this.client.send('Runtime.evaluate', {
        expression: 'window.location.href',
        returnByValue: true
      });

      const currentUrl = result.result.value;

      if (typeof urlPattern === 'string') {
        if (currentUrl.includes(urlPattern)) {
          console.log(`[Wait] URL matched: ${currentUrl}`);
          return currentUrl;
        }
      } else if (urlPattern.test(currentUrl)) {
        console.log(`[Wait] URL matched: ${currentUrl}`);
        return currentUrl;
      }

      await sleep(100);
    }

    throw new Error(`Timeout waiting for URL: ${urlPattern}`);
  }

  /**
   * Wait for text to appear on page
   * @param {string} text - Text to find
   * @param {object} options - Wait options
   * @returns {Promise<void>}
   */
  async waitForText(text, options = {}) {
    const { timeout = this.defaultTimeout, pollInterval = 100 } = options;

    console.log(`[Wait] Waiting for text: "${text.substring(0, 30)}..."`);

    return this.waitForCondition(
      `document.body.innerText.includes('${text.replace(/'/g, "\\'")}')`,
      { timeout, pollInterval }
    );
  }

  /**
   * Combined wait: element + visible + stable
   * @param {string} selector - CSS selector
   * @param {number} stableTime - Time element must be stable
   * @param {number} timeout - Overall timeout
   * @returns {Promise<number>} - Node ID
   */
  async waitForStableElement(selector, stableTime = 500, timeout = this.defaultTimeout) {
    console.log(`[Wait] Waiting for stable element: ${selector}`);

    // First wait for element to appear
    const nodeId = await this.waitForElement(selector, { timeout, visible: true });

    // Then wait for it to be stable (no size changes)
    let lastRect = null;
    let stableStart = Date.now();

    while (Date.now() - stableStart < stableTime) {
      const result = await this.client.send('Runtime.evaluate', {
        expression: `JSON.stringify(document.querySelector('${selector}').getBoundingClientRect())`,
        returnByValue: true
      });

      const currentRect = result.result.value;

      if (lastRect !== currentRect) {
        lastRect = currentRect;
        stableStart = Date.now();
      }

      await sleep(50);
    }

    console.log(`[Wait] Element stable: ${selector}`);
    return nodeId;
  }
}

// Demo
async function main() {
  console.log('=== CDP Wait Strategies Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const waiter = new WaitStrategies(client);

    // Enable domains
    await waiter.enable();

    // Demo: Wait for navigation
    console.log('\n--- Wait for Navigation Demo ---');

    const loadPromise = waiter.waitForNavigation({ waitUntil: 'load' });
    await client.send('Page.navigate', { url: 'https://example.com' });
    await loadPromise;

    // Demo: Wait for element
    console.log('\n--- Wait for Element Demo ---');
    await waiter.waitForElement('h1');
    await waiter.waitForElement('p', { visible: true });

    // Demo: Wait for condition
    console.log('\n--- Wait for Condition Demo ---');
    await waiter.waitForCondition('document.readyState === "complete"');

    // Demo: Wait for text
    console.log('\n--- Wait for Text Demo ---');
    await waiter.waitForText('Example Domain');

    // Demo: Wait for network idle
    console.log('\n--- Wait for Network Idle Demo ---');
    const idlePromise = waiter.waitForNetworkIdle(1000);

    // Trigger some network activity
    await client.send('Runtime.evaluate', {
      expression: `fetch('https://httpbin.org/delay/1')`
    });

    try {
      await idlePromise;
    } catch (e) {
      console.log('  (Network idle timed out as expected with slow request)');
    }

    // Demo: Wait for URL
    console.log('\n--- Wait for URL Demo ---');
    const urlPromise = waiter.waitForUrl('httpbin');
    await client.send('Page.navigate', { url: 'https://httpbin.org/html' });
    await urlPromise;

    // Demo: Wait for element to disappear
    console.log('\n--- Wait for Element to Disappear Demo ---');

    // Navigate to page with element that will be removed
    await client.send('Page.navigate', {
      url: 'data:text/html,' + encodeURIComponent(`
        <div id="loading">Loading...</div>
        <script>setTimeout(() => document.getElementById('loading').remove(), 1000)</script>
      `)
    });
    await sleep(200);

    await waiter.waitForElementToDisappear('#loading');

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { WaitStrategies };
