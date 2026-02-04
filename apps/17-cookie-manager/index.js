/**
 * App 17: Cookie Manager
 *
 * Demonstrates cookie management using CDP:
 * - Get all cookies
 * - Get cookies for URL
 * - Set cookies
 * - Delete cookies
 * - Clear all browser data
 *
 * CDP Domains: Network, Storage
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class CookieManager {
  constructor(client) {
    this.client = client;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Network.enable');
    await this.client.send('Page.enable');
    console.log('[CookieManager] Network and Page domains enabled');
  }

  /**
   * Get all cookies
   * @returns {Promise<Array>}
   */
  async getAllCookies() {
    const result = await this.client.send('Network.getAllCookies');
    return result.cookies;
  }

  /**
   * Get cookies for specific URLs
   * @param {string[]} urls - URLs to get cookies for
   * @returns {Promise<Array>}
   */
  async getCookiesForUrls(urls) {
    const result = await this.client.send('Network.getCookies', { urls });
    return result.cookies;
  }

  /**
   * Get cookies for current page
   * @returns {Promise<Array>}
   */
  async getCookiesForCurrentPage() {
    const urlResult = await this.client.send('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    return this.getCookiesForUrls([urlResult.result.value]);
  }

  /**
   * Set a cookie
   * @param {object} cookie - Cookie parameters
   * @returns {Promise<boolean>} - Success status
   */
  async setCookie(cookie) {
    const result = await this.client.send('Network.setCookie', cookie);
    console.log(`[CookieManager] Set cookie: ${cookie.name}`);
    return result.success;
  }

  /**
   * Set multiple cookies
   * @param {object[]} cookies - Array of cookie objects
   */
  async setCookies(cookies) {
    await this.client.send('Network.setCookies', { cookies });
    console.log(`[CookieManager] Set ${cookies.length} cookies`);
  }

  /**
   * Delete a cookie by name and URL
   * @param {string} name - Cookie name
   * @param {string} url - Cookie URL
   */
  async deleteCookie(name, url) {
    await this.client.send('Network.deleteCookies', { name, url });
    console.log(`[CookieManager] Deleted cookie: ${name}`);
  }

  /**
   * Delete all cookies for a domain
   * @param {string} domain - Domain to clear
   */
  async deleteCookiesForDomain(domain) {
    const cookies = await this.getAllCookies();
    const domainCookies = cookies.filter(c =>
      c.domain === domain || c.domain === `.${domain}`
    );

    for (const cookie of domainCookies) {
      await this.client.send('Network.deleteCookies', {
        name: cookie.name,
        domain: cookie.domain,
        path: cookie.path
      });
    }

    console.log(`[CookieManager] Deleted ${domainCookies.length} cookies for ${domain}`);
  }

  /**
   * Clear all cookies
   */
  async clearAllCookies() {
    await this.client.send('Network.clearBrowserCookies');
    console.log('[CookieManager] Cleared all cookies');
  }

  /**
   * Clear browser cache
   */
  async clearCache() {
    await this.client.send('Network.clearBrowserCache');
    console.log('[CookieManager] Cleared browser cache');
  }

  /**
   * Clear all data for an origin
   * @param {string} origin - Origin URL (e.g., https://example.com)
   * @param {string} storageTypes - Types to clear (default: all)
   */
  async clearDataForOrigin(origin, storageTypes = 'all') {
    await this.client.send('Storage.clearDataForOrigin', {
      origin,
      storageTypes
    });
    console.log(`[CookieManager] Cleared data for ${origin}`);
  }

  /**
   * Format cookie for display
   * @param {object} cookie - Cookie object
   * @returns {string}
   */
  formatCookie(cookie) {
    const flags = [];
    if (cookie.secure) flags.push('Secure');
    if (cookie.httpOnly) flags.push('HttpOnly');
    if (cookie.sameSite) flags.push(`SameSite=${cookie.sameSite}`);

    const expiry = cookie.expires > 0 ?
      new Date(cookie.expires * 1000).toISOString() :
      'Session';

    return `${cookie.name}=${cookie.value.substring(0, 30)}${cookie.value.length > 30 ? '...' : ''}
    Domain: ${cookie.domain}
    Path: ${cookie.path}
    Expires: ${expiry}
    Flags: ${flags.join(', ') || 'None'}`;
  }

  /**
   * Export cookies to JSON
   * @returns {Promise<string>}
   */
  async exportCookies() {
    const cookies = await this.getAllCookies();
    return JSON.stringify(cookies, null, 2);
  }

  /**
   * Import cookies from JSON
   * @param {string} json - JSON cookie data
   */
  async importCookies(json) {
    const cookies = JSON.parse(json);
    await this.setCookies(cookies);
    console.log(`[CookieManager] Imported ${cookies.length} cookies`);
  }

  /**
   * Get cookie statistics
   * @returns {Promise<object>}
   */
  async getStats() {
    const cookies = await this.getAllCookies();
    const byDomain = {};

    for (const cookie of cookies) {
      byDomain[cookie.domain] = (byDomain[cookie.domain] || 0) + 1;
    }

    return {
      total: cookies.length,
      byDomain,
      secure: cookies.filter(c => c.secure).length,
      httpOnly: cookies.filter(c => c.httpOnly).length,
      session: cookies.filter(c => c.expires <= 0).length,
      persistent: cookies.filter(c => c.expires > 0).length
    };
  }
}

// Demo
async function main() {
  console.log('=== CDP Cookie Manager Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const cookieManager = new CookieManager(client);

    // Enable domains
    await cookieManager.enable();

    // Navigate to a page
    console.log('\n--- Navigating to example.com ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    // Get initial cookies
    console.log('\n--- Initial Cookies ---');
    let cookies = await cookieManager.getAllCookies();
    console.log(`  Total cookies: ${cookies.length}`);

    // Set some cookies
    console.log('\n--- Setting Cookies ---');

    await cookieManager.setCookie({
      name: 'test_cookie',
      value: 'hello_world',
      domain: 'example.com',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    });

    await cookieManager.setCookie({
      name: 'session_id',
      value: 'abc123xyz',
      domain: 'example.com',
      path: '/',
      secure: true,
      httpOnly: true
    });

    await cookieManager.setCookie({
      name: 'preferences',
      value: JSON.stringify({ theme: 'dark', lang: 'en' }),
      domain: 'example.com',
      path: '/'
    });

    // Get cookies for current page
    console.log('\n--- Cookies for Current Page ---');
    const pageCookies = await cookieManager.getCookiesForCurrentPage();
    for (const cookie of pageCookies) {
      console.log(`  ${cookie.name}: ${cookie.value.substring(0, 40)}...`);
    }

    // Get statistics
    console.log('\n--- Cookie Statistics ---');
    const stats = await cookieManager.getStats();
    console.log(`  Total: ${stats.total}`);
    console.log(`  Secure: ${stats.secure}`);
    console.log(`  HttpOnly: ${stats.httpOnly}`);
    console.log(`  Session: ${stats.session}`);
    console.log(`  Persistent: ${stats.persistent}`);

    console.log('\n  Cookies by domain:');
    for (const [domain, count] of Object.entries(stats.byDomain)) {
      console.log(`    ${domain}: ${count}`);
    }

    // Show formatted cookie
    console.log('\n--- Cookie Details ---');
    const testCookie = pageCookies.find(c => c.name === 'test_cookie');
    if (testCookie) {
      console.log(cookieManager.formatCookie(testCookie));
    }

    // Delete a specific cookie
    console.log('\n--- Deleting Cookie ---');
    await cookieManager.deleteCookie('test_cookie', 'https://example.com');

    // Export cookies
    console.log('\n--- Exporting Cookies ---');
    const exported = await cookieManager.exportCookies();
    console.log(`  Exported ${JSON.parse(exported).length} cookies`);

    // Clear cookies for domain
    console.log('\n--- Clearing Domain Cookies ---');
    await cookieManager.deleteCookiesForDomain('example.com');

    // Final count
    cookies = await cookieManager.getAllCookies();
    console.log(`\n--- Final Cookie Count: ${cookies.length} ---`);

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { CookieManager };
