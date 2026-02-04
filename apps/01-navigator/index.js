/**
 * App 01: Navigator
 *
 * Demonstrates page navigation using CDP:
 * - Navigate to URL with various wait strategies
 * - Handle redirects
 * - Back/forward navigation
 * - Page lifecycle events
 * - Get current URL and title
 *
 * CDP Domains: Page, Target
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class Navigator {
  constructor(client) {
    this.client = client;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Page.enable');
    await this.client.send('Network.enable');
    console.log('[Navigator] Page and Network domains enabled');
  }

  /**
   * Navigate to a URL
   * @param {string} url - URL to navigate to
   * @param {object} options - Navigation options
   * @returns {Promise<object>} - Navigation result
   */
  async navigate(url, options = {}) {
    const { waitUntil = 'load', timeout = 30000 } = options;

    console.log(`[Navigator] Navigating to: ${url}`);

    // Start navigation and wait for completion
    const navigationPromise = waitForNavigation(this.client, { waitUntil, timeout });

    const result = await this.client.send('Page.navigate', { url });

    if (result.errorText) {
      throw new Error(`Navigation failed: ${result.errorText}`);
    }

    await navigationPromise;
    console.log(`[Navigator] Navigation complete (${waitUntil})`);

    return result;
  }

  /**
   * Reload the current page
   * @param {object} options - Reload options
   */
  async reload(options = {}) {
    const { ignoreCache = false, waitUntil = 'load', timeout = 30000 } = options;

    console.log(`[Navigator] Reloading page (ignoreCache: ${ignoreCache})`);

    const navigationPromise = waitForNavigation(this.client, { waitUntil, timeout });

    await this.client.send('Page.reload', { ignoreCache });

    await navigationPromise;
    console.log('[Navigator] Reload complete');
  }

  /**
   * Go back in browser history
   */
  async goBack() {
    const history = await this.getNavigationHistory();

    if (history.currentIndex > 0) {
      const entry = history.entries[history.currentIndex - 1];
      console.log(`[Navigator] Going back to: ${entry.url}`);

      const navigationPromise = waitForNavigation(this.client, { waitUntil: 'load' });
      await this.client.send('Page.navigateToHistoryEntry', { entryId: entry.id });
      await navigationPromise;
    } else {
      console.log('[Navigator] Cannot go back - already at first entry');
    }
  }

  /**
   * Go forward in browser history
   */
  async goForward() {
    const history = await this.getNavigationHistory();

    if (history.currentIndex < history.entries.length - 1) {
      const entry = history.entries[history.currentIndex + 1];
      console.log(`[Navigator] Going forward to: ${entry.url}`);

      const navigationPromise = waitForNavigation(this.client, { waitUntil: 'load' });
      await this.client.send('Page.navigateToHistoryEntry', { entryId: entry.id });
      await navigationPromise;
    } else {
      console.log('[Navigator] Cannot go forward - already at last entry');
    }
  }

  /**
   * Get navigation history
   * @returns {Promise<object>} - History with entries and currentIndex
   */
  async getNavigationHistory() {
    return this.client.send('Page.getNavigationHistory');
  }

  /**
   * Get current page URL
   * @returns {Promise<string>}
   */
  async getCurrentUrl() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    return result.result.value;
  }

  /**
   * Get current page title
   * @returns {Promise<string>}
   */
  async getTitle() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    return result.result.value;
  }

  /**
   * Stop loading the current page
   */
  async stopLoading() {
    await this.client.send('Page.stopLoading');
    console.log('[Navigator] Page loading stopped');
  }

  /**
   * Set up page lifecycle event listeners
   */
  setupLifecycleListeners() {
    this.client.on('Page.domContentEventFired', (params) => {
      console.log(`[Lifecycle] DOMContentLoaded at ${params.timestamp}`);
    });

    this.client.on('Page.loadEventFired', (params) => {
      console.log(`[Lifecycle] Load complete at ${params.timestamp}`);
    });

    this.client.on('Page.frameNavigated', (params) => {
      if (params.frame.parentId === undefined) {
        console.log(`[Lifecycle] Main frame navigated to: ${params.frame.url}`);
      }
    });

    this.client.on('Page.navigatedWithinDocument', (params) => {
      console.log(`[Lifecycle] Same-document navigation to: ${params.url}`);
    });
  }
}

// Demo
async function main() {
  console.log('=== CDP Navigator Demo ===\n');

  try {
    // Connect to browser
    const { client, target } = await connectToFirstPage();
    const navigator = new Navigator(client);

    // Enable domains
    await navigator.enable();

    // Set up lifecycle listeners
    navigator.setupLifecycleListeners();

    // Navigate to a website
    console.log('\n--- Navigation Demo ---');
    await navigator.navigate('https://example.com');

    // Get page info
    const url = await navigator.getCurrentUrl();
    const title = await navigator.getTitle();
    console.log(`\nCurrent URL: ${url}`);
    console.log(`Page Title: ${title}`);

    // Navigate to another page
    await sleep(1000);
    await navigator.navigate('https://httpbin.org/html');

    // Show history
    const history = await navigator.getNavigationHistory();
    console.log('\n--- Navigation History ---');
    history.entries.forEach((entry, i) => {
      const current = i === history.currentIndex ? ' <-- current' : '';
      console.log(`  ${i + 1}. ${entry.title || entry.url}${current}`);
    });

    // Go back
    await sleep(1000);
    console.log('\n--- Going Back ---');
    await navigator.goBack();

    const newUrl = await navigator.getCurrentUrl();
    console.log(`Now at: ${newUrl}`);

    // Go forward
    await sleep(1000);
    console.log('\n--- Going Forward ---');
    await navigator.goForward();

    const finalUrl = await navigator.getCurrentUrl();
    console.log(`Now at: ${finalUrl}`);

    // Reload with cache bypass
    await sleep(1000);
    console.log('\n--- Reloading (bypass cache) ---');
    await navigator.reload({ ignoreCache: true });

    console.log('\n=== Demo Complete ===');

    // Close connection
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { Navigator };
