# App 20: Wait Strategies

Various waiting patterns for browser automation using Chrome DevTools Protocol.

## Features

- Wait for page load
- Wait for DOMContentLoaded
- Wait for network idle
- Wait for element to appear
- Wait for element to disappear
- Wait for element visibility
- Wait for JavaScript condition
- Wait for URL pattern
- Wait for text content
- Wait for stable element

## CDP Domains Used

- **Page** - Navigation events
- **DOM** - Element detection
- **Network** - Request monitoring
- **Runtime** - JS evaluation

## Key CDP Events

| Event | Description |
|-------|-------------|
| `Page.loadEventFired` | Page load complete |
| `Page.domContentEventFired` | DOM ready |
| `Network.requestWillBeSent` | Request started |
| `Network.loadingFinished` | Request completed |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the demo
node apps/20-wait-strategies/index.js
```

## Example Output

```
=== CDP Wait Strategies Demo ===

[WaitStrategies] All domains enabled

--- Wait for Navigation Demo ---
[Wait] Waiting for navigation (load)...
[Wait] Navigation complete (load)

--- Wait for Element Demo ---
[Wait] Waiting for element: h1
[Wait] Element found: h1
[Wait] Waiting for element: p
[Wait] Element visible: p

--- Wait for Network Idle Demo ---
[Wait] Waiting for network idle (1000ms quiet)...
[Wait] Network idle

--- Wait for Element to Disappear Demo ---
[Wait] Waiting for element to disappear: #loading
[Wait] Element gone: #loading

=== Demo Complete ===
```

## API Reference

### `WaitStrategies` Class

```javascript
const waiter = new WaitStrategies(cdpClient);

// Enable required domains
await waiter.enable();

// Wait for page load
await waiter.waitForLoad(30000);

// Wait for DOMContentLoaded
await waiter.waitForDOMContentLoaded(30000);

// Wait for navigation
await waiter.waitForNavigation({
  waitUntil: 'load',          // 'load' | 'domContentLoaded' | 'networkIdle'
  timeout: 30000
});

// Wait for network idle
await waiter.waitForNetworkIdle(
  500,    // Idle time (no requests for this long)
  30000   // Overall timeout
);

// Wait for element
const nodeId = await waiter.waitForElement('button.submit', {
  timeout: 30000,
  pollInterval: 100,
  visible: true               // Wait for visibility too
});

// Wait for element to disappear
await waiter.waitForElementToDisappear('#loading', {
  timeout: 30000,
  pollInterval: 100
});

// Wait for JavaScript condition
const result = await waiter.waitForCondition(
  'window.myApp.isReady === true',
  { timeout: 30000, pollInterval: 100 }
);

// Wait for URL
const url = await waiter.waitForUrl('/dashboard', 30000);
const url2 = await waiter.waitForUrl(/\/user\/\d+/, 30000);

// Wait for text
await waiter.waitForText('Welcome back!', { timeout: 30000 });

// Wait for stable element (no layout changes)
const nodeId = await waiter.waitForStableElement(
  '.animated-panel',
  500,    // Stable time
  30000   // Timeout
);

// Wait for any CDP event
await waiter.waitForEvent('Page.frameNavigated', 30000);
```

## Wait Strategies Comparison

| Strategy | Use Case |
|----------|----------|
| `waitForLoad` | Page fully loaded with resources |
| `waitForDOMContentLoaded` | DOM ready, images may still load |
| `waitForNetworkIdle` | All AJAX/fetch complete |
| `waitForElement` | Dynamic content appears |
| `waitForElementToDisappear` | Loading spinners, modals |
| `waitForCondition` | Custom app state |
| `waitForUrl` | SPA navigation |
| `waitForText` | Content verification |
| `waitForStableElement` | Animations complete |

## Combining Waits

```javascript
// Navigate and wait for specific content
await client.send('Page.navigate', { url });
await waiter.waitForNavigation({ waitUntil: 'domContentLoaded' });
await waiter.waitForNetworkIdle(500);
await waiter.waitForElement('.main-content', { visible: true });
```

## Error Handling

```javascript
try {
  await waiter.waitForElement('.slow-element', { timeout: 5000 });
} catch (error) {
  if (error.message.includes('Timeout')) {
    console.log('Element did not appear in time');
  }
}
```

## Tips

- Use `networkIdle` for pages with lots of AJAX
- Combine multiple waits for reliability
- Set appropriate timeouts for your use case
- Use `visible: true` when element might be hidden
- Poll intervals affect CPU usage vs responsiveness
