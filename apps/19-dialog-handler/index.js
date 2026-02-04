/**
 * App 19: Dialog Handler
 *
 * Demonstrates JavaScript dialog handling using CDP:
 * - Detect alert/confirm/prompt dialogs
 * - Accept or dismiss dialogs
 * - Provide input for prompts
 * - Handle beforeunload dialogs
 *
 * CDP Domains: Page
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class DialogHandler {
  constructor(client) {
    this.client = client;
    this.dialogHistory = [];
    this.autoHandleConfig = null;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Page.enable');
    await this.client.send('Runtime.enable');
    console.log('[DialogHandler] Page and Runtime domains enabled');
  }

  /**
   * Set up dialog event listener
   * @param {function} callback - Called when dialog opens
   */
  onDialog(callback) {
    this.client.on('Page.javascriptDialogOpening', (params) => {
      const dialog = {
        type: params.type,
        message: params.message,
        url: params.url,
        defaultPrompt: params.defaultPrompt,
        timestamp: Date.now()
      };

      this.dialogHistory.push(dialog);

      if (callback) {
        callback(dialog);
      }
    });
  }

  /**
   * Handle a dialog (accept or dismiss)
   * @param {boolean} accept - Whether to accept the dialog
   * @param {string} promptText - Text for prompt dialogs
   */
  async handleDialog(accept, promptText = '') {
    await this.client.send('Page.handleJavaScriptDialog', {
      accept,
      promptText
    });

    console.log(`[DialogHandler] ${accept ? 'Accepted' : 'Dismissed'} dialog`);
  }

  /**
   * Accept the current dialog
   * @param {string} promptText - Text for prompt dialogs
   */
  async acceptDialog(promptText = '') {
    await this.handleDialog(true, promptText);
  }

  /**
   * Dismiss the current dialog
   */
  async dismissDialog() {
    await this.handleDialog(false);
  }

  /**
   * Set up automatic dialog handling
   * @param {object} config - Auto-handle configuration
   */
  setupAutoHandle(config = {}) {
    const {
      alert = 'accept',      // 'accept' | 'dismiss'
      confirm = 'accept',    // 'accept' | 'dismiss'
      prompt = null,         // { action: 'accept'|'dismiss', text: 'default' }
      beforeunload = 'accept'
    } = config;

    this.autoHandleConfig = { alert, confirm, prompt, beforeunload };

    this.client.on('Page.javascriptDialogOpening', async (params) => {
      const { type, message, defaultPrompt } = params;

      console.log(`[DialogHandler] Auto-handling ${type}: "${message}"`);

      let accept = true;
      let promptText = '';

      switch (type) {
        case 'alert':
          accept = this.autoHandleConfig.alert === 'accept';
          break;
        case 'confirm':
          accept = this.autoHandleConfig.confirm === 'accept';
          break;
        case 'prompt':
          if (this.autoHandleConfig.prompt) {
            accept = this.autoHandleConfig.prompt.action === 'accept';
            promptText = this.autoHandleConfig.prompt.text || defaultPrompt || '';
          } else {
            accept = false;
          }
          break;
        case 'beforeunload':
          accept = this.autoHandleConfig.beforeunload === 'accept';
          break;
      }

      await this.handleDialog(accept, promptText);
    });

    console.log('[DialogHandler] Auto-handle configured');
  }

  /**
   * Wait for a dialog to appear
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<object>} - Dialog info
   */
  waitForDialog(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.client.off('Page.javascriptDialogOpening', handler);
        reject(new Error('Timeout waiting for dialog'));
      }, timeout);

      const handler = (params) => {
        clearTimeout(timer);
        this.client.off('Page.javascriptDialogOpening', handler);
        resolve({
          type: params.type,
          message: params.message,
          url: params.url,
          defaultPrompt: params.defaultPrompt
        });
      };

      this.client.on('Page.javascriptDialogOpening', handler);
    });
  }

  /**
   * Trigger an alert dialog
   * @param {string} message - Alert message
   */
  async triggerAlert(message) {
    await this.client.send('Runtime.evaluate', {
      expression: `alert('${message.replace(/'/g, "\\'")}')`
    });
  }

  /**
   * Trigger a confirm dialog
   * @param {string} message - Confirm message
   * @returns {Promise<boolean>} - User's choice
   */
  async triggerConfirm(message) {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `confirm('${message.replace(/'/g, "\\'")}')`,
      awaitPromise: false,
      returnByValue: true
    });
    return result.result.value;
  }

  /**
   * Trigger a prompt dialog
   * @param {string} message - Prompt message
   * @param {string} defaultValue - Default value
   * @returns {Promise<string|null>} - User's input
   */
  async triggerPrompt(message, defaultValue = '') {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `prompt('${message.replace(/'/g, "\\'")}', '${defaultValue.replace(/'/g, "\\'")}')`,
      awaitPromise: false,
      returnByValue: true
    });
    return result.result.value;
  }

  /**
   * Get dialog history
   * @returns {Array}
   */
  getHistory() {
    return [...this.dialogHistory];
  }

  /**
   * Clear dialog history
   */
  clearHistory() {
    this.dialogHistory = [];
    console.log('[DialogHandler] History cleared');
  }
}

// Demo
async function main() {
  console.log('=== CDP Dialog Handler Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const handler = new DialogHandler(client);

    // Enable domains
    await handler.enable();

    // Navigate to a test page
    console.log('\n--- Navigating to test page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', {
      url: 'data:text/html,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head><title>Dialog Test</title></head>
        <body>
          <h1>Dialog Handler Test</h1>
          <button id="alertBtn" onclick="alert('Hello from alert!')">Alert</button>
          <button id="confirmBtn" onclick="result.textContent = confirm('Do you confirm?')">Confirm</button>
          <button id="promptBtn" onclick="result.textContent = prompt('Enter your name:', 'World')">Prompt</button>
          <p>Result: <span id="result"></span></p>
        </body>
        </html>
      `)
    });
    await navPromise;
    await sleep(500);

    // Set up dialog listener
    console.log('\n--- Setting up dialog listener ---');
    handler.onDialog((dialog) => {
      console.log(`  [Event] Dialog opened: ${dialog.type} - "${dialog.message}"`);
    });

    // Test alert - manual handling
    console.log('\n--- Testing Alert (manual handling) ---');

    // Start waiting for dialog, then trigger it
    const alertPromise = handler.waitForDialog();
    await handler.triggerAlert('Test alert message');
    const alertDialog = await alertPromise;
    console.log(`  Dialog type: ${alertDialog.type}`);
    console.log(`  Message: ${alertDialog.message}`);
    await handler.acceptDialog();

    await sleep(300);

    // Test confirm with auto-accept
    console.log('\n--- Testing Confirm (auto-accept) ---');
    handler.setupAutoHandle({
      confirm: 'accept'
    });

    // Trigger via button click simulation
    await client.send('Runtime.evaluate', {
      expression: 'document.getElementById("confirmBtn").click()'
    });
    await sleep(300);

    let result = await client.send('Runtime.evaluate', {
      expression: 'document.getElementById("result").textContent',
      returnByValue: true
    });
    console.log(`  Confirm result: ${result.result.value}`);

    // Test confirm with auto-dismiss
    console.log('\n--- Testing Confirm (auto-dismiss) ---');
    handler.setupAutoHandle({
      confirm: 'dismiss'
    });

    await client.send('Runtime.evaluate', {
      expression: 'document.getElementById("confirmBtn").click()'
    });
    await sleep(300);

    result = await client.send('Runtime.evaluate', {
      expression: 'document.getElementById("result").textContent',
      returnByValue: true
    });
    console.log(`  Confirm result: ${result.result.value}`);

    // Test prompt with auto-input
    console.log('\n--- Testing Prompt (auto-input) ---');
    handler.setupAutoHandle({
      prompt: { action: 'accept', text: 'Claude' }
    });

    await client.send('Runtime.evaluate', {
      expression: 'document.getElementById("promptBtn").click()'
    });
    await sleep(300);

    result = await client.send('Runtime.evaluate', {
      expression: 'document.getElementById("result").textContent',
      returnByValue: true
    });
    console.log(`  Prompt result: ${result.result.value}`);

    // Show dialog history
    console.log('\n--- Dialog History ---');
    const history = handler.getHistory();
    console.log(`  Total dialogs handled: ${history.length}`);
    for (const dialog of history) {
      console.log(`    [${dialog.type}] ${dialog.message}`);
    }

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { DialogHandler };
