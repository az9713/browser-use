/**
 * App 13: JS Executor
 *
 * Demonstrates JavaScript execution using CDP:
 * - Execute JavaScript expression
 * - Execute with return value
 * - Execute async functions
 * - Inject script into page
 * - Call page functions with arguments
 *
 * CDP Domains: Runtime, Page
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class JSExecutor {
  constructor(client) {
    this.client = client;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Runtime.enable');
    await this.client.send('Page.enable');
    console.log('[JSExecutor] Runtime and Page domains enabled');
  }

  /**
   * Evaluate a JavaScript expression
   * @param {string} expression - JS expression to evaluate
   * @param {object} options - Evaluation options
   * @returns {Promise<any>}
   */
  async evaluate(expression, options = {}) {
    const {
      returnByValue = true,
      awaitPromise = false,
      timeout = 30000
    } = options;

    const result = await this.client.send('Runtime.evaluate', {
      expression,
      returnByValue,
      awaitPromise,
      timeout
    });

    if (result.exceptionDetails) {
      const error = result.exceptionDetails;
      throw new Error(`JS Error: ${error.text || error.exception?.description || 'Unknown error'}`);
    }

    return result.result.value;
  }

  /**
   * Evaluate an async expression
   * @param {string} expression - Async JS expression
   * @returns {Promise<any>}
   */
  async evaluateAsync(expression) {
    return this.evaluate(expression, { awaitPromise: true });
  }

  /**
   * Execute a function on a remote object
   * @param {string} objectId - Remote object ID
   * @param {string} functionDeclaration - Function to execute
   * @param {any[]} args - Function arguments
   * @returns {Promise<any>}
   */
  async callFunctionOn(objectId, functionDeclaration, args = []) {
    const result = await this.client.send('Runtime.callFunctionOn', {
      objectId,
      functionDeclaration,
      arguments: args.map(arg => ({ value: arg })),
      returnByValue: true
    });

    if (result.exceptionDetails) {
      throw new Error(`Function call failed: ${result.exceptionDetails.text}`);
    }

    return result.result.value;
  }

  /**
   * Get a remote object by expression
   * @param {string} expression - JS expression
   * @returns {Promise<string>} - Object ID
   */
  async getRemoteObject(expression) {
    const result = await this.client.send('Runtime.evaluate', {
      expression,
      returnByValue: false
    });

    if (result.exceptionDetails) {
      throw new Error(`Evaluation failed: ${result.exceptionDetails.text}`);
    }

    return result.result.objectId;
  }

  /**
   * Inject a script that runs on every page load
   * @param {string} source - JavaScript source code
   * @returns {Promise<string>} - Script identifier
   */
  async injectOnLoad(source) {
    const result = await this.client.send('Page.addScriptToEvaluateOnNewDocument', {
      source
    });
    console.log(`[JSExecutor] Injected script: ${result.identifier}`);
    return result.identifier;
  }

  /**
   * Remove an injected script
   * @param {string} identifier - Script identifier
   */
  async removeInjectedScript(identifier) {
    await this.client.send('Page.removeScriptToEvaluateOnNewDocument', {
      identifier
    });
    console.log(`[JSExecutor] Removed script: ${identifier}`);
  }

  /**
   * Inject a script element into the page
   * @param {string} source - JavaScript source code
   */
  async injectScriptElement(source) {
    await this.evaluate(`
      (function() {
        const script = document.createElement('script');
        script.textContent = ${JSON.stringify(source)};
        document.head.appendChild(script);
      })()
    `);
    console.log('[JSExecutor] Injected script element');
  }

  /**
   * Inject an external script
   * @param {string} url - Script URL
   * @returns {Promise<void>}
   */
  async injectExternalScript(url) {
    await this.evaluateAsync(`
      new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '${url}';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      })
    `);
    console.log(`[JSExecutor] Injected external script: ${url}`);
  }

  /**
   * Call a function defined on the page
   * @param {string} functionName - Global function name
   * @param {any[]} args - Function arguments
   * @returns {Promise<any>}
   */
  async callPageFunction(functionName, args = []) {
    const argsStr = args.map(a => JSON.stringify(a)).join(', ');
    return this.evaluate(`${functionName}(${argsStr})`);
  }

  /**
   * Get a global variable value
   * @param {string} name - Variable name
   * @returns {Promise<any>}
   */
  async getGlobalVariable(name) {
    return this.evaluate(`window.${name}`);
  }

  /**
   * Set a global variable
   * @param {string} name - Variable name
   * @param {any} value - Value to set
   */
  async setGlobalVariable(name, value) {
    await this.evaluate(`window.${name} = ${JSON.stringify(value)}`);
  }

  /**
   * Execute JavaScript in an isolated world
   * @param {string} expression - JS expression
   * @param {string} worldName - Isolated world name
   * @returns {Promise<any>}
   */
  async evaluateInIsolatedWorld(expression, worldName = 'cdp-isolated') {
    // Create isolated world
    const { executionContextId } = await this.client.send('Page.createIsolatedWorld', {
      frameId: (await this.client.send('Page.getFrameTree')).frameTree.frame.id,
      worldName
    });

    // Evaluate in that world
    const result = await this.client.send('Runtime.evaluate', {
      expression,
      contextId: executionContextId,
      returnByValue: true
    });

    if (result.exceptionDetails) {
      throw new Error(`Isolated world error: ${result.exceptionDetails.text}`);
    }

    return result.result.value;
  }

  /**
   * Get all global properties
   * @returns {Promise<string[]>}
   */
  async getGlobalProperties() {
    const objectId = await this.getRemoteObject('window');
    const result = await this.client.send('Runtime.getProperties', {
      objectId,
      ownProperties: true
    });

    return result.result.map(p => p.name);
  }

  /**
   * Monitor console output
   * @param {function} callback - Callback for console messages
   */
  onConsole(callback) {
    this.client.on('Runtime.consoleAPICalled', (params) => {
      const args = params.args.map(a => a.value || a.description);
      callback({
        type: params.type,
        args,
        timestamp: params.timestamp
      });
    });
  }
}

// Demo
async function main() {
  console.log('=== CDP JS Executor Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const executor = new JSExecutor(client);

    // Enable domains
    await executor.enable();

    // Navigate to a page
    console.log('\n--- Navigating to example.com ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    // Simple evaluation
    console.log('\n--- Simple Evaluation ---');
    const title = await executor.evaluate('document.title');
    console.log(`  Page title: ${title}`);

    const url = await executor.evaluate('window.location.href');
    console.log(`  URL: ${url}`);

    // Math expression
    const result = await executor.evaluate('2 + 2 * 10');
    console.log(`  2 + 2 * 10 = ${result}`);

    // DOM manipulation
    console.log('\n--- DOM Manipulation ---');
    await executor.evaluate(`
      document.querySelector('h1').style.color = 'blue';
      document.querySelector('h1').style.fontSize = '48px';
    `);
    console.log('  Changed h1 style');

    // Get element count
    const pCount = await executor.evaluate('document.querySelectorAll("p").length');
    console.log(`  Number of <p> elements: ${pCount}`);

    // Async evaluation
    console.log('\n--- Async Evaluation ---');
    const delayed = await executor.evaluateAsync(`
      new Promise(resolve => {
        setTimeout(() => resolve('Resolved after 500ms!'), 500);
      })
    `);
    console.log(`  Async result: ${delayed}`);

    // Set and get global variable
    console.log('\n--- Global Variables ---');
    await executor.setGlobalVariable('myData', { name: 'Test', value: 42 });
    const myData = await executor.getGlobalVariable('myData');
    console.log(`  Set and retrieved: ${JSON.stringify(myData)}`);

    // Inject script on load
    console.log('\n--- Script Injection ---');
    const scriptId = await executor.injectOnLoad(`
      console.log('Injected script executed!');
      window.cdpInjected = true;
    `);

    // Reload to trigger injected script
    await client.send('Page.reload');
    await sleep(1000);

    const injected = await executor.evaluate('window.cdpInjected');
    console.log(`  Injected script ran: ${injected}`);

    // Remove injected script
    await executor.removeInjectedScript(scriptId);

    // Inject script element
    console.log('\n--- Script Element Injection ---');
    await executor.injectScriptElement(`
      window.myFunction = function(name) {
        return 'Hello, ' + name + '!';
      };
    `);

    const greeting = await executor.callPageFunction('myFunction', ['World']);
    console.log(`  Called injected function: ${greeting}`);

    // Console monitoring
    console.log('\n--- Console Monitoring ---');
    executor.onConsole((msg) => {
      console.log(`  [Console ${msg.type}] ${msg.args.join(' ')}`);
    });

    await executor.evaluate(`
      console.log('Hello from CDP!');
      console.warn('This is a warning');
    `);

    await sleep(200);

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { JSExecutor };
