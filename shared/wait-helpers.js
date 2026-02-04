/**
 * Wait Helpers - Common waiting patterns for CDP operations
 *
 * Provides utilities for:
 * - Waiting for navigation
 * - Waiting for elements
 * - Waiting for network idle
 * - Waiting for custom conditions
 */

/**
 * Wait for page navigation to complete
 * @param {CDPClient} client - CDP client
 * @param {object} options - Wait options
 * @param {number} options.timeout - Timeout in ms (default: 30000)
 * @param {string} options.waitUntil - 'load' | 'domContentLoaded' | 'networkIdle' (default: 'load')
 * @returns {Promise<void>}
 */
export async function waitForNavigation(client, options = {}) {
  const { timeout = 30000, waitUntil = 'load' } = options;

  const eventMap = {
    load: 'Page.loadEventFired',
    domContentLoaded: 'Page.domContentEventFired',
    networkIdle: null // Handled specially
  };

  if (waitUntil === 'networkIdle') {
    return waitForNetworkIdle(client, { timeout });
  }

  const eventName = eventMap[waitUntil];
  if (!eventName) {
    throw new Error(`Invalid waitUntil value: ${waitUntil}`);
  }

  return client.waitForEvent(eventName, timeout);
}

/**
 * Wait for network to be idle (no pending requests)
 * @param {CDPClient} client - CDP client
 * @param {object} options - Wait options
 * @param {number} options.timeout - Timeout in ms (default: 30000)
 * @param {number} options.idleTime - Time with no requests to consider idle (default: 500)
 * @returns {Promise<void>}
 */
export async function waitForNetworkIdle(client, options = {}) {
  const { timeout = 30000, idleTime = 500 } = options;

  return new Promise((resolve, reject) => {
    let pendingRequests = 0;
    let idleTimer = null;
    let timeoutTimer = null;

    const cleanup = () => {
      clearTimeout(idleTimer);
      clearTimeout(timeoutTimer);
      client.off('Network.requestWillBeSent', onRequest);
      client.off('Network.loadingFinished', onFinished);
      client.off('Network.loadingFailed', onFinished);
    };

    const checkIdle = () => {
      if (pendingRequests === 0) {
        idleTimer = setTimeout(() => {
          cleanup();
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

    client.on('Network.requestWillBeSent', onRequest);
    client.on('Network.loadingFinished', onFinished);
    client.on('Network.loadingFailed', onFinished);

    // Start checking immediately
    checkIdle();
  });
}

/**
 * Wait for an element to appear in the DOM
 * @param {CDPClient} client - CDP client
 * @param {string} selector - CSS selector
 * @param {object} options - Wait options
 * @param {number} options.timeout - Timeout in ms (default: 30000)
 * @param {number} options.pollInterval - Polling interval in ms (default: 100)
 * @returns {Promise<number>} - Node ID of the found element
 */
export async function waitForElement(client, selector, options = {}) {
  const { timeout = 30000, pollInterval = 100 } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Get the document root
      const { root } = await client.send('DOM.getDocument');

      // Try to find the element
      const { nodeId } = await client.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector
      });

      if (nodeId !== 0) {
        return nodeId;
      }
    } catch (error) {
      // Ignore errors and retry
    }

    await sleep(pollInterval);
  }

  throw new Error(`Timeout waiting for element: ${selector}`);
}

/**
 * Wait for an element to disappear from the DOM
 * @param {CDPClient} client - CDP client
 * @param {string} selector - CSS selector
 * @param {object} options - Wait options
 * @param {number} options.timeout - Timeout in ms (default: 30000)
 * @param {number} options.pollInterval - Polling interval in ms (default: 100)
 * @returns {Promise<void>}
 */
export async function waitForElementToDisappear(client, selector, options = {}) {
  const { timeout = 30000, pollInterval = 100 } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const { root } = await client.send('DOM.getDocument');
      const { nodeId } = await client.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector
      });

      if (nodeId === 0) {
        return;
      }
    } catch (error) {
      // Element not found, consider it disappeared
      return;
    }

    await sleep(pollInterval);
  }

  throw new Error(`Timeout waiting for element to disappear: ${selector}`);
}

/**
 * Wait for a custom JavaScript condition to be true
 * @param {CDPClient} client - CDP client
 * @param {string} expression - JavaScript expression that returns truthy when condition is met
 * @param {object} options - Wait options
 * @param {number} options.timeout - Timeout in ms (default: 30000)
 * @param {number} options.pollInterval - Polling interval in ms (default: 100)
 * @returns {Promise<any>} - Result of the expression when truthy
 */
export async function waitForCondition(client, expression, options = {}) {
  const { timeout = 30000, pollInterval = 100 } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await client.send('Runtime.evaluate', {
        expression,
        returnByValue: true
      });

      if (result.result && result.result.value) {
        return result.result.value;
      }
    } catch (error) {
      // Ignore errors and retry
    }

    await sleep(pollInterval);
  }

  throw new Error(`Timeout waiting for condition: ${expression}`);
}

/**
 * Wait for a specific frame to be navigated
 * @param {CDPClient} client - CDP client
 * @param {string} frameId - Frame ID to wait for
 * @param {number} timeout - Timeout in ms (default: 30000)
 * @returns {Promise<object>} - Frame navigation details
 */
export async function waitForFrame(client, frameId, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.off('Page.frameNavigated', handler);
      reject(new Error('Timeout waiting for frame navigation'));
    }, timeout);

    const handler = (params) => {
      if (params.frame.id === frameId) {
        clearTimeout(timer);
        client.off('Page.frameNavigated', handler);
        resolve(params);
      }
    };

    client.on('Page.frameNavigated', handler);
  });
}

/**
 * Simple sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an operation with exponential backoff
 * @param {function} fn - Async function to retry
 * @param {object} options - Retry options
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 100)
 * @param {number} options.maxDelay - Max delay in ms (default: 5000)
 * @returns {Promise<any>}
 */
export async function retry(fn, options = {}) {
  const { maxRetries = 3, initialDelay = 100, maxDelay = 5000 } = options;

  let lastError;
  let delay = initialDelay;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        await sleep(delay);
        delay = Math.min(delay * 2, maxDelay);
      }
    }
  }

  throw lastError;
}

export default {
  waitForNavigation,
  waitForNetworkIdle,
  waitForElement,
  waitForElementToDisappear,
  waitForCondition,
  waitForFrame,
  sleep,
  retry
};
