# App 02: Tab Orchestrator

Manage multiple browser tabs using Chrome DevTools Protocol.

## Features

- Create new tabs
- List all open tabs
- Switch between tabs (attach/detach sessions)
- Navigate within specific tabs
- Close tabs
- Multi-tab workflow orchestration

## CDP Domains Used

- **Target** - Target (tab) management
- **Browser** - Browser-level operations
- **Page** - Page navigation (per-tab)

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Target.setDiscoverTargets` | Enable target discovery |
| `Target.createTarget` | Create a new tab |
| `Target.closeTarget` | Close a tab |
| `Target.attachToTarget` | Attach to send commands to tab |
| `Target.detachFromTarget` | Detach from tab session |
| `Target.getTargets` | List all targets |

## HTTP Endpoints Used

| Endpoint | Description |
|----------|-------------|
| `/json/list` | List all targets |
| `/json/version` | Browser version info |
| `/json/new?url` | Create new tab |
| `/json/activate/id` | Activate (focus) tab |
| `/json/close/id` | Close tab |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the orchestrator
node apps/02-tab-orchestrator/index.js
```

## Example Output

```
=== CDP Tab Orchestrator Demo ===

Browser: Chrome/120.0.0.0
Protocol: 1.3

[TabOrchestrator] Connected to browser

--- Existing Tabs ---
  1. New Tab - chrome://newtab/

--- Creating New Tabs ---
[TabOrchestrator] Created new tab: 123ABC
[TabOrchestrator] Created new tab: 456DEF

--- All Tabs Now ---
  1. New Tab
     chrome://newtab/
  2. Example Domain [attached] [active]
     https://example.com/
  3. httpbin.org
     https://httpbin.org/html

--- Switching Tabs ---
[TabOrchestrator] Switched to tab: 123ABC
Active tab title: Example Domain
[TabOrchestrator] Switched to tab: 456DEF
Active tab title: httpbin.org

--- Closing Created Tabs ---
[TabOrchestrator] Closed tab: 123ABC
[TabOrchestrator] Closed tab: 456DEF

=== Demo Complete ===
```

## API Reference

### `TabOrchestrator` Class

```javascript
const orchestrator = new TabOrchestrator();

// Connect to browser
await orchestrator.connect();

// List all page tabs
const tabs = await orchestrator.listTabs();

// Create a new tab
const { targetId } = await orchestrator.createNewTab('https://example.com');

// Attach to a tab (required for page commands)
const sessionId = await orchestrator.attachToTab(targetId);

// Switch to a tab (activates + attaches)
await orchestrator.switchToTab(targetId);

// Navigate in active tab
await orchestrator.navigate('https://example.com');

// Get active tab title
const title = await orchestrator.getActiveTabTitle();

// Close a specific tab
await orchestrator.closeTabById(targetId);

// Get detailed info about all tabs
const tabsInfo = await orchestrator.getTabsInfo();
// Returns: [{ id, title, url, attached, active }]

// Close all tabs except one
await orchestrator.closeAllExcept(keepTabId);

// Disconnect
orchestrator.disconnect();
```

## Session Management

When using CDP, you need to:

1. **Connect to Browser** - Use the browser WebSocket endpoint
2. **Attach to Target** - Creates a session for page-level commands
3. **Set Session ID** - Include sessionId in subsequent commands
4. **Detach when done** - Clean up sessions

```javascript
// Attach returns sessionId
const sessionId = await browserClient.send('Target.attachToTarget', {
  targetId: 'ABC123',
  flatten: true  // Use flattened protocol
});

// Include sessionId in commands
await browserClient.send('Page.navigate', { url: '...' });
// The client automatically includes the sessionId
```

## Multi-Tab Workflows

This app demonstrates patterns for:

- Opening multiple related tabs
- Gathering data from multiple pages
- Coordinating actions across tabs
- Cleaning up temporary tabs
