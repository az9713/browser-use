/**
 * CDP Client - Core WebSocket client for Chrome DevTools Protocol
 *
 * Handles:
 * - WebSocket connection to Chrome
 * - Command sending with auto-incrementing IDs
 * - Response handling via promises
 * - Event subscription/unsubscription
 * - Session management for multi-target scenarios
 */

import WebSocket from 'ws';

export class CDPClient {
  constructor() {
    this.ws = null;
    this.messageId = 0;
    this.callbacks = new Map();
    this.eventListeners = new Map();
    this.sessionId = null;
  }

  /**
   * Connect to Chrome DevTools Protocol
   * @param {string} wsUrl - WebSocket URL (e.g., from /json/list endpoint)
   * @returns {Promise<void>}
   */
  async connect(wsUrl) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        console.log('[CDP] Connected');
        resolve();
      });

      this.ws.on('message', (data) => {
        this._handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error('[CDP] WebSocket error:', error.message);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('[CDP] Connection closed');
      });
    });
  }

  /**
   * Send a CDP command and wait for response
   * @param {string} method - CDP method (e.g., 'Page.navigate')
   * @param {object} params - Command parameters
   * @returns {Promise<object>} - Command result
   */
  async send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;

      const message = {
        id,
        method,
        params
      };

      // Include sessionId if we're attached to a target
      if (this.sessionId) {
        message.sessionId = this.sessionId;
      }

      this.callbacks.set(id, { resolve, reject });

      this.ws.send(JSON.stringify(message));
    });
  }

  /**
   * Subscribe to CDP events
   * @param {string} eventName - Event name (e.g., 'Page.loadEventFired')
   * @param {function} callback - Event handler
   */
  on(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName).add(callback);
  }

  /**
   * Unsubscribe from CDP events
   * @param {string} eventName - Event name
   * @param {function} callback - Event handler to remove
   */
  off(eventName, callback) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Wait for a specific event to occur
   * @param {string} eventName - Event name to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<object>} - Event parameters
   */
  waitForEvent(eventName, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(eventName, handler);
        reject(new Error(`Timeout waiting for event: ${eventName}`));
      }, timeout);

      const handler = (params) => {
        clearTimeout(timer);
        this.off(eventName, handler);
        resolve(params);
      };

      this.on(eventName, handler);
    });
  }

  /**
   * Set the session ID for target-specific commands
   * @param {string} sessionId - Session ID from Target.attachToTarget
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  /**
   * Clear the current session ID
   */
  clearSessionId() {
    this.sessionId = null;
  }

  /**
   * Close the WebSocket connection
   */
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @private
   */
  _handleMessage(message) {
    // Handle command responses
    if (message.id !== undefined) {
      const callback = this.callbacks.get(message.id);
      if (callback) {
        this.callbacks.delete(message.id);
        if (message.error) {
          callback.reject(new Error(`CDP Error: ${message.error.message}`));
        } else {
          callback.resolve(message.result || {});
        }
      }
      return;
    }

    // Handle events
    if (message.method) {
      const listeners = this.eventListeners.get(message.method);
      if (listeners) {
        for (const listener of listeners) {
          try {
            listener(message.params || {});
          } catch (error) {
            console.error(`[CDP] Error in event handler for ${message.method}:`, error);
          }
        }
      }
    }
  }
}

/**
 * Create a connected CDP client
 * @param {string} wsUrl - WebSocket URL
 * @returns {Promise<CDPClient>}
 */
export async function createClient(wsUrl) {
  const client = new CDPClient();
  await client.connect(wsUrl);
  return client;
}

export default CDPClient;
