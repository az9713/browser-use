# App 14: Console Monitor

Monitor browser console output using Chrome DevTools Protocol.

## Features

- Capture console.log/warn/error/info/debug
- Capture uncaught exceptions
- Filter by log level
- Format stack traces
- Store and query logs
- Real-time callbacks

## CDP Domains Used

- **Runtime** - Console API and exceptions
- **Log** - Browser log entries

## Key CDP Commands/Events

| Event | Description |
|-------|-------------|
| `Runtime.consoleAPICalled` | Console method called |
| `Runtime.exceptionThrown` | Uncaught exception |
| `Log.entryAdded` | Browser log entry |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the monitor
node apps/14-console-monitor/index.js
```

## Example Output

```
=== CDP Console Monitor Demo ===

[ConsoleMonitor] Runtime, Log, and Page domains enabled

--- Starting Monitor ---
[ConsoleMonitor] Started monitoring

--- Generating Console Output ---
  [LOG] [log] Hello from the page!
  [LOG] [info] This is an info message
  [LOG] [warn] This is a warning
  [LOG] [error] This is an error

--- Generating Exception ---
  [LOG] [error] Caught: Test exception!

--- Generating Uncaught Exception ---
  [EXCEPTION] Uncaught Error: Uncaught exception!
    at setTimeout (<anonymous>:3:17)

--- Collected Logs Summary ---
  Total logs: 5
  Errors: 2
  Warnings: 1
  Info: 2
  Exceptions: 1

=== Demo Complete ===
```

## API Reference

### `ConsoleMonitor` Class

```javascript
const monitor = new ConsoleMonitor(cdpClient);

// Enable required domains
await monitor.enable();

// Start monitoring with callbacks
monitor.startMonitoring({
  // Called for each console message
  onLog: (entry) => {
    console.log(`[${entry.level}] ${entry.message}`);
  },

  // Called for uncaught exceptions
  onException: (entry) => {
    console.error(entry.message);
    console.error(entry.stackTrace);
  },

  // Optional filter function
  filter: (entry) => entry.level === 'error'
});

// Stop monitoring
monitor.stopMonitoring();

// Get all logs
const logs = monitor.getLogs();

// Get logs by level
const errors = monitor.getLogsByLevel('error');
const warnings = monitor.getLogsByLevel('warning');
const info = monitor.getLogsByLevel('info');
const debug = monitor.getLogsByLevel('debug');

// Get exceptions
const exceptions = monitor.getExceptions();

// Print formatted entry
monitor.printEntry(entry);

// Clear stored logs
monitor.clearLogs();
```

## Log Entry Structure

```javascript
{
  type: 'log',           // Console method (log, warn, error, etc.)
  level: 'info',         // Normalized level (error, warning, info, debug)
  timestamp: 1234567890, // Unix timestamp
  message: 'Hello!',     // Formatted message
  args: ['Hello!'],      // Original arguments
  stackTrace: '...',     // Formatted stack trace (if available)
  source: 'console'      // Source (console, exception, log)
}
```

## Exception Entry Structure

```javascript
{
  type: 'exception',
  level: 'error',
  timestamp: 1234567890,
  message: 'Error: Something went wrong',
  lineNumber: 42,
  columnNumber: 15,
  url: 'https://example.com/script.js',
  stackTrace: '    at myFunction (script.js:42:15)\n    at main (script.js:100:5)',
  source: 'exception'
}
```

## Log Levels

| Console Method | Level |
|----------------|-------|
| `console.log` | info |
| `console.info` | info |
| `console.warn` | warning |
| `console.error` | error |
| `console.debug` | debug |
| `console.trace` | debug |
| Uncaught exception | error |

## Filtering Examples

```javascript
// Only errors
monitor.startMonitoring({
  filter: (entry) => entry.level === 'error'
});

// Errors and warnings
monitor.startMonitoring({
  filter: (entry) => ['error', 'warning'].includes(entry.level)
});

// Messages containing specific text
monitor.startMonitoring({
  filter: (entry) => entry.message.includes('API')
});
```

## Tips

- Enable `Runtime.enable` before monitoring
- Stack traces may not be available for all entries
- Use `clearLogs()` to prevent memory growth
- Console types map to normalized levels
- Exceptions are stored separately from logs
