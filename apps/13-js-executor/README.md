# App 13: JS Executor

Execute JavaScript in the browser using Chrome DevTools Protocol.

## Features

- Evaluate JavaScript expressions
- Execute async functions
- Get/set global variables
- Inject scripts on page load
- Inject script elements
- Load external scripts
- Call page functions
- Monitor console output
- Isolated world execution

## CDP Domains Used

- **Runtime** - JavaScript execution
- **Page** - Script injection

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Runtime.evaluate` | Evaluate JS expression |
| `Runtime.callFunctionOn` | Call function on object |
| `Runtime.getProperties` | Get object properties |
| `Page.addScriptToEvaluateOnNewDocument` | Inject on load |
| `Page.createIsolatedWorld` | Create isolated context |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the executor
node apps/13-js-executor/index.js
```

## Example Output

```
=== CDP JS Executor Demo ===

[JSExecutor] Runtime and Page domains enabled

--- Simple Evaluation ---
  Page title: Example Domain
  URL: https://example.com/
  2 + 2 * 10 = 22

--- DOM Manipulation ---
  Changed h1 style
  Number of <p> elements: 2

--- Async Evaluation ---
  Async result: Resolved after 500ms!

--- Global Variables ---
  Set and retrieved: {"name":"Test","value":42}

--- Script Injection ---
[JSExecutor] Injected script: 1
  Injected script ran: true

--- Console Monitoring ---
  [Console log] Hello from CDP!
  [Console warning] This is a warning

=== Demo Complete ===
```

## API Reference

### `JSExecutor` Class

```javascript
const executor = new JSExecutor(cdpClient);

// Enable required domains
await executor.enable();

// Simple evaluation
const title = await executor.evaluate('document.title');

// With options
const result = await executor.evaluate('someExpression', {
  returnByValue: true,    // Return primitive value
  awaitPromise: false,    // Wait for promise
  timeout: 30000          // Timeout in ms
});

// Async evaluation (await promise)
const data = await executor.evaluateAsync(`
  fetch('/api/data').then(r => r.json())
`);

// Get/set global variables
await executor.setGlobalVariable('myVar', { key: 'value' });
const myVar = await executor.getGlobalVariable('myVar');

// Call a page function
const result = await executor.callPageFunction('myFunction', [arg1, arg2]);

// Inject script on every page load
const scriptId = await executor.injectOnLoad(`
  console.log('Page loaded!');
  window.injected = true;
`);

// Remove injected script
await executor.removeInjectedScript(scriptId);

// Inject script element
await executor.injectScriptElement(`
  window.myFunc = () => 'Hello!';
`);

// Load external script
await executor.injectExternalScript('https://cdn.example.com/lib.js');

// Get remote object for complex operations
const objectId = await executor.getRemoteObject('document.body');

// Call function on remote object
const html = await executor.callFunctionOn(
  objectId,
  'function() { return this.innerHTML; }'
);

// Execute in isolated world (won't affect page)
const result = await executor.evaluateInIsolatedWorld(
  'window.secret = 42; secret',
  'my-world'
);

// Get all global properties
const globals = await executor.getGlobalProperties();

// Monitor console output
executor.onConsole((msg) => {
  console.log(`[${msg.type}]`, msg.args);
});
```

## Evaluation Options

```javascript
{
  // Return value directly (for primitives/JSON)
  returnByValue: true,

  // Wait for promise to resolve
  awaitPromise: true,

  // Timeout for evaluation
  timeout: 30000,

  // Execution context (for isolated worlds)
  contextId: 123
}
```

## Script Injection Types

### On Load (Persistent)
```javascript
// Runs on every navigation
const id = await executor.injectOnLoad('console.log("Hi!")');
```

### Script Element (One-time)
```javascript
// Adds <script> tag to current page
await executor.injectScriptElement('window.x = 1');
```

### External Script
```javascript
// Loads and executes external JS
await executor.injectExternalScript('https://cdn.example.com/lib.js');
```

## Isolated Worlds

Isolated worlds are separate JavaScript contexts that:
- Don't share variables with the page
- Can access the DOM
- Useful for automation scripts

```javascript
// Page can't see this
await executor.evaluateInIsolatedWorld('window.secret = 42');
```

## Tips

- Use `returnByValue: true` for simple data
- Use `awaitPromise: true` for async code
- Inject on load for persistent modifications
- Use isolated worlds to avoid conflicts
- Console events require `Runtime.enable`
