# App 01: Navigator

Navigate pages using Chrome DevTools Protocol.

## Features

- Navigate to URL with configurable wait strategies
- Handle page redirects
- Back/forward history navigation
- Page lifecycle events (DOMContentLoaded, load, frameNavigated)
- Get current URL and title
- Stop loading / reload with cache bypass

## CDP Domains Used

- **Page** - Page navigation and lifecycle
- **Network** - For network idle detection
- **Runtime** - For evaluating page state

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Page.enable` | Enable page domain events |
| `Page.navigate` | Navigate to URL |
| `Page.reload` | Reload current page |
| `Page.stopLoading` | Stop page loading |
| `Page.getNavigationHistory` | Get history entries |
| `Page.navigateToHistoryEntry` | Navigate to history entry |

## Events Monitored

| Event | Description |
|-------|-------------|
| `Page.domContentEventFired` | DOM content loaded |
| `Page.loadEventFired` | Page fully loaded |
| `Page.frameNavigated` | Frame navigation complete |
| `Page.navigatedWithinDocument` | Same-document navigation (hash change, pushState) |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the navigator
node apps/01-navigator/index.js
```

## Example Output

```
=== CDP Navigator Demo ===

[CDP] Connected
[Navigator] Page and Network domains enabled

--- Navigation Demo ---
[Navigator] Navigating to: https://example.com
[Lifecycle] Main frame navigated to: https://example.com/
[Lifecycle] DOMContentLoaded at 12345.678
[Lifecycle] Load complete at 12345.789
[Navigator] Navigation complete (load)

Current URL: https://example.com/
Page Title: Example Domain

--- Navigation History ---
  1. Example Domain <-- current

--- Going Back ---
[Navigator] Cannot go back - already at first entry

=== Demo Complete ===
```

## API Reference

### `Navigator` Class

```javascript
const navigator = new Navigator(cdpClient);

// Enable required domains
await navigator.enable();

// Navigate to URL
await navigator.navigate('https://example.com', {
  waitUntil: 'load',     // 'load' | 'domContentLoaded' | 'networkIdle'
  timeout: 30000
});

// Reload page
await navigator.reload({
  ignoreCache: true,
  waitUntil: 'load'
});

// History navigation
await navigator.goBack();
await navigator.goForward();

// Get page info
const url = await navigator.getCurrentUrl();
const title = await navigator.getTitle();

// Get full history
const history = await navigator.getNavigationHistory();
```

## Wait Strategies

| Strategy | Description |
|----------|-------------|
| `load` | Wait for window.onload event |
| `domContentLoaded` | Wait for DOMContentLoaded event |
| `networkIdle` | Wait for no network activity for 500ms |
