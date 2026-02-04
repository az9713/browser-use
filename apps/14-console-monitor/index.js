/**
 * App 14: Console Monitor
 *
 * Demonstrates console monitoring using CDP:
 * - Capture console.log/warn/error
 * - Capture uncaught exceptions
 * - Filter by log level
 * - Format stack traces
 *
 * CDP Domains: Runtime, Log
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class ConsoleMonitor {
  constructor(client) {
    this.client = client;
    this.logs = [];
    this.exceptions = [];
    this.handlers = new Map();
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Runtime.enable');
    await this.client.send('Log.enable');
    await this.client.send('Page.enable');
    console.log('[ConsoleMonitor] Runtime, Log, and Page domains enabled');
  }

  /**
   * Start monitoring console output
   * @param {object} options - Monitor options
   */
  startMonitoring(options = {}) {
    const {
      onLog = null,
      onException = null,
      filter = null
    } = options;

    // Console API calls (console.log, console.warn, etc.)
    const consoleHandler = (params) => {
      const entry = this.parseConsoleEntry(params);

      // Apply filter
      if (filter && !filter(entry)) return;

      this.logs.push(entry);

      if (onLog) {
        onLog(entry);
      }
    };

    this.client.on('Runtime.consoleAPICalled', consoleHandler);
    this.handlers.set('console', consoleHandler);

    // Uncaught exceptions
    const exceptionHandler = (params) => {
      const entry = this.parseException(params);
      this.exceptions.push(entry);

      if (onException) {
        onException(entry);
      }
    };

    this.client.on('Runtime.exceptionThrown', exceptionHandler);
    this.handlers.set('exception', exceptionHandler);

    // Browser log entries
    const logHandler = (params) => {
      const entry = this.parseLogEntry(params.entry);

      if (filter && !filter(entry)) return;

      this.logs.push(entry);

      if (onLog) {
        onLog(entry);
      }
    };

    this.client.on('Log.entryAdded', logHandler);
    this.handlers.set('log', logHandler);

    console.log('[ConsoleMonitor] Started monitoring');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    for (const [name, handler] of this.handlers) {
      if (name === 'console') {
        this.client.off('Runtime.consoleAPICalled', handler);
      } else if (name === 'exception') {
        this.client.off('Runtime.exceptionThrown', handler);
      } else if (name === 'log') {
        this.client.off('Log.entryAdded', handler);
      }
    }
    this.handlers.clear();
    console.log('[ConsoleMonitor] Stopped monitoring');
  }

  /**
   * Parse console API call params
   * @param {object} params - Console event params
   * @returns {object}
   */
  parseConsoleEntry(params) {
    return {
      type: params.type,
      level: this.typeToLevel(params.type),
      timestamp: params.timestamp,
      args: params.args.map(arg => this.formatArg(arg)),
      message: params.args.map(arg => this.formatArg(arg)).join(' '),
      stackTrace: params.stackTrace ? this.formatStackTrace(params.stackTrace) : null,
      source: 'console'
    };
  }

  /**
   * Parse exception params
   * @param {object} params - Exception event params
   * @returns {object}
   */
  parseException(params) {
    const { exceptionDetails } = params;
    return {
      type: 'exception',
      level: 'error',
      timestamp: params.timestamp,
      message: exceptionDetails.text || exceptionDetails.exception?.description || 'Unknown error',
      lineNumber: exceptionDetails.lineNumber,
      columnNumber: exceptionDetails.columnNumber,
      url: exceptionDetails.url,
      stackTrace: exceptionDetails.stackTrace ? this.formatStackTrace(exceptionDetails.stackTrace) : null,
      source: 'exception'
    };
  }

  /**
   * Parse log entry params
   * @param {object} entry - Log entry
   * @returns {object}
   */
  parseLogEntry(entry) {
    return {
      type: entry.level,
      level: entry.level,
      timestamp: entry.timestamp,
      message: entry.text,
      url: entry.url,
      lineNumber: entry.lineNumber,
      source: entry.source,
      stackTrace: entry.stackTrace ? this.formatStackTrace(entry.stackTrace) : null
    };
  }

  /**
   * Format a remote object argument
   * @param {object} arg - Remote object
   * @returns {string}
   */
  formatArg(arg) {
    if (arg.value !== undefined) {
      return String(arg.value);
    }
    if (arg.description) {
      return arg.description;
    }
    if (arg.type === 'object' && arg.subtype === 'null') {
      return 'null';
    }
    if (arg.type === 'undefined') {
      return 'undefined';
    }
    return `[${arg.type}]`;
  }

  /**
   * Format a stack trace
   * @param {object} stackTrace - Stack trace object
   * @returns {string}
   */
  formatStackTrace(stackTrace) {
    if (!stackTrace || !stackTrace.callFrames) return null;

    return stackTrace.callFrames.map(frame => {
      const location = frame.url ? `${frame.url}:${frame.lineNumber}:${frame.columnNumber}` : 'unknown';
      const fn = frame.functionName || '(anonymous)';
      return `    at ${fn} (${location})`;
    }).join('\n');
  }

  /**
   * Convert console type to log level
   * @param {string} type - Console type
   * @returns {string}
   */
  typeToLevel(type) {
    const levels = {
      log: 'info',
      info: 'info',
      warn: 'warning',
      warning: 'warning',
      error: 'error',
      debug: 'debug',
      trace: 'debug',
      assert: 'error',
      table: 'info',
      dir: 'info',
      dirxml: 'info',
      clear: 'info',
      count: 'info',
      countReset: 'info',
      group: 'info',
      groupCollapsed: 'info',
      groupEnd: 'info',
      time: 'info',
      timeEnd: 'info',
      timeLog: 'info'
    };
    return levels[type] || 'info';
  }

  /**
   * Get all logs
   * @returns {Array}
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   * @param {string} level - Log level (error, warning, info, debug)
   * @returns {Array}
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get all exceptions
   * @returns {Array}
   */
  getExceptions() {
    return [...this.exceptions];
  }

  /**
   * Clear stored logs
   */
  clearLogs() {
    this.logs = [];
    this.exceptions = [];
    console.log('[ConsoleMonitor] Logs cleared');
  }

  /**
   * Print a log entry
   * @param {object} entry - Log entry
   */
  printEntry(entry) {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelColors = {
      error: '\x1b[31m',
      warning: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[90m'
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level] || reset;

    console.log(`${color}[${timestamp}] [${entry.level.toUpperCase()}]${reset} ${entry.message}`);

    if (entry.stackTrace) {
      console.log(entry.stackTrace);
    }
  }
}

// Demo
async function main() {
  console.log('=== CDP Console Monitor Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const monitor = new ConsoleMonitor(client);

    // Enable domains
    await monitor.enable();

    // Navigate to a page
    console.log('\n--- Navigating to example.com ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    // Start monitoring with callbacks
    console.log('\n--- Starting Monitor ---');
    monitor.startMonitoring({
      onLog: (entry) => {
        console.log(`  [LOG] [${entry.type}] ${entry.message}`);
      },
      onException: (entry) => {
        console.log(`  [EXCEPTION] ${entry.message}`);
        if (entry.stackTrace) {
          console.log(entry.stackTrace);
        }
      }
    });

    // Generate some console output
    console.log('\n--- Generating Console Output ---');

    await client.send('Runtime.evaluate', {
      expression: `
        console.log('Hello from the page!');
        console.info('This is an info message');
        console.warn('This is a warning');
        console.error('This is an error');
        console.debug('This is a debug message');
      `
    });

    await sleep(200);

    // Generate an exception
    console.log('\n--- Generating Exception ---');

    await client.send('Runtime.evaluate', {
      expression: `
        try {
          throw new Error('Test exception!');
        } catch (e) {
          console.error('Caught:', e.message);
        }
      `
    });

    await sleep(200);

    // Generate an uncaught exception
    console.log('\n--- Generating Uncaught Exception ---');

    await client.send('Runtime.evaluate', {
      expression: `
        setTimeout(() => {
          throw new Error('Uncaught exception!');
        }, 100);
      `
    });

    await sleep(300);

    // Show collected logs
    console.log('\n--- Collected Logs Summary ---');
    const logs = monitor.getLogs();
    console.log(`  Total logs: ${logs.length}`);
    console.log(`  Errors: ${monitor.getLogsByLevel('error').length}`);
    console.log(`  Warnings: ${monitor.getLogsByLevel('warning').length}`);
    console.log(`  Info: ${monitor.getLogsByLevel('info').length}`);

    const exceptions = monitor.getExceptions();
    console.log(`  Exceptions: ${exceptions.length}`);

    // Print all logs with formatting
    console.log('\n--- All Logs (Formatted) ---');
    for (const entry of logs) {
      monitor.printEntry(entry);
    }

    // Stop monitoring
    monitor.stopMonitoring();

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { ConsoleMonitor };
