/**
 * Target Manager - Utilities for managing Chrome targets and sessions
 *
 * Handles:
 * - Listing available targets via /json/list
 * - Attaching to page targets
 * - Creating new tabs
 * - Closing targets
 */

import http from 'http';
import { createClient } from './cdp-client.js';

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 9222;

/**
 * Fetch data from Chrome debugging endpoint
 * @param {string} path - API path
 * @param {string} host - Chrome host
 * @param {number} port - Chrome debugging port
 * @returns {Promise<any>}
 */
function fetchJson(path, host = DEFAULT_HOST, port = DEFAULT_PORT) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${host}:${port}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${path}`));
        }
      });
    });
    req.on('error', reject);
  });
}

/**
 * List all available targets
 * @param {string} host - Chrome host
 * @param {number} port - Chrome debugging port
 * @returns {Promise<Array>} - Array of target objects
 */
export async function listTargets(host = DEFAULT_HOST, port = DEFAULT_PORT) {
  return fetchJson('/json/list', host, port);
}

/**
 * Get Chrome version info
 * @param {string} host - Chrome host
 * @param {number} port - Chrome debugging port
 * @returns {Promise<object>}
 */
export async function getVersion(host = DEFAULT_HOST, port = DEFAULT_PORT) {
  return fetchJson('/json/version', host, port);
}

/**
 * Create a new tab
 * @param {string} url - Initial URL (optional)
 * @param {string} host - Chrome host
 * @param {number} port - Chrome debugging port
 * @returns {Promise<object>} - New target info
 */
export async function createTab(url = 'about:blank', host = DEFAULT_HOST, port = DEFAULT_PORT) {
  const encodedUrl = encodeURIComponent(url);
  return fetchJson(`/json/new?${encodedUrl}`, host, port);
}

/**
 * Close a tab by target ID
 * @param {string} targetId - Target ID to close
 * @param {string} host - Chrome host
 * @param {number} port - Chrome debugging port
 * @returns {Promise<string>}
 */
export async function closeTab(targetId, host = DEFAULT_HOST, port = DEFAULT_PORT) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${host}:${port}/json/close/${targetId}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });
}

/**
 * Activate (focus) a tab
 * @param {string} targetId - Target ID to activate
 * @param {string} host - Chrome host
 * @param {number} port - Chrome debugging port
 * @returns {Promise<string>}
 */
export async function activateTab(targetId, host = DEFAULT_HOST, port = DEFAULT_PORT) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${host}:${port}/json/activate/${targetId}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });
}

/**
 * Find a page target by URL pattern
 * @param {string|RegExp} pattern - URL pattern to match
 * @param {string} host - Chrome host
 * @param {number} port - Chrome debugging port
 * @returns {Promise<object|null>}
 */
export async function findTarget(pattern, host = DEFAULT_HOST, port = DEFAULT_PORT) {
  const targets = await listTargets(host, port);
  return targets.find(t => {
    if (t.type !== 'page') return false;
    if (typeof pattern === 'string') {
      return t.url.includes(pattern);
    }
    return pattern.test(t.url);
  }) || null;
}

/**
 * Get the first available page target
 * @param {string} host - Chrome host
 * @param {number} port - Chrome debugging port
 * @returns {Promise<object|null>}
 */
export async function getFirstPage(host = DEFAULT_HOST, port = DEFAULT_PORT) {
  const targets = await listTargets(host, port);
  return targets.find(t => t.type === 'page') || null;
}

/**
 * Connect to a target by its WebSocket debugger URL
 * @param {object} target - Target object with webSocketDebuggerUrl
 * @returns {Promise<CDPClient>}
 */
export async function connectToTarget(target) {
  if (!target.webSocketDebuggerUrl) {
    throw new Error('Target has no webSocketDebuggerUrl');
  }
  return createClient(target.webSocketDebuggerUrl);
}

/**
 * Connect to the first available page, or create one if none exist
 * @param {string} host - Chrome host
 * @param {number} port - Chrome debugging port
 * @returns {Promise<{client: CDPClient, target: object}>}
 */
export async function connectToFirstPage(host = DEFAULT_HOST, port = DEFAULT_PORT) {
  let target = await getFirstPage(host, port);

  if (!target) {
    console.log('[Target] No page found, creating new tab...');
    target = await createTab('about:blank', host, port);
  }

  const client = await connectToTarget(target);
  return { client, target };
}

/**
 * Get browser WebSocket endpoint for browser-level commands
 * @param {string} host - Chrome host
 * @param {number} port - Chrome debugging port
 * @returns {Promise<string>}
 */
export async function getBrowserWSEndpoint(host = DEFAULT_HOST, port = DEFAULT_PORT) {
  const version = await getVersion(host, port);
  return version.webSocketDebuggerUrl;
}

export default {
  listTargets,
  getVersion,
  createTab,
  closeTab,
  activateTab,
  findTarget,
  getFirstPage,
  connectToTarget,
  connectToFirstPage,
  getBrowserWSEndpoint
};
