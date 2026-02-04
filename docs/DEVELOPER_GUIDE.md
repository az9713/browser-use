# Developer Guide

A comprehensive guide for developers who want to understand, modify, and extend the browser-use-toolbox project.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Prerequisites](#2-prerequisites)
3. [Environment Setup](#3-environment-setup)
4. [Understanding Chrome DevTools Protocol](#4-understanding-chrome-devtools-protocol)
5. [Project Architecture](#5-project-architecture)
6. [Core Components Deep Dive](#6-core-components-deep-dive)
7. [Creating Your First App](#7-creating-your-first-app)
8. [Common Patterns and Best Practices](#8-common-patterns-and-best-practices)
9. [Debugging and Troubleshooting](#9-debugging-and-troubleshooting)
10. [Extending the Project](#10-extending-the-project)

---

## 1. Introduction

### What is This Project?

This project is a collection of 35 Node.js applications that demonstrate how to control Google Chrome programmatically using the Chrome DevTools Protocol (CDP). Think of it as a learning toolkit for browser automation.

### What is Chrome DevTools Protocol (CDP)?

When you open Chrome's Developer Tools (F12), you're using CDP internally. This protocol allows external programs to:
- Navigate web pages
- Click buttons and fill forms
- Take screenshots
- Monitor network requests
- Execute JavaScript
- And much more

### Why Raw CDP Instead of Puppeteer?

Puppeteer is a popular library that wraps CDP, making it easier to use. However:
- **Learning**: Using raw CDP teaches you what's really happening
- **Control**: You have full access to all CDP features
- **Understanding**: When Puppeteer doesn't work, you'll know how to fix it
- **Agentic AI**: AI agents need direct protocol access for maximum flexibility

---

## 2. Prerequisites

### Required Knowledge

You should be familiar with:

1. **JavaScript/Node.js basics**
   - Variables, functions, arrays, objects
   - `async`/`await` and Promises
   - ES6 module syntax (`import`/`export`)

2. **Basic command line usage**
   - Navigating directories
   - Running commands

3. **Web fundamentals**
   - HTML elements and CSS selectors
   - How browsers load pages
   - Basic understanding of HTTP

### What You'll Learn

Even if you're new to these topics, this guide will teach you:
- How browsers communicate with external programs
- WebSocket communication
- Event-driven programming
- DOM manipulation from outside the browser

---

## 3. Environment Setup

### Step 3.1: Install Node.js

Node.js is a JavaScript runtime that lets you run JavaScript outside a browser.

**Windows:**
1. Go to https://nodejs.org
2. Download the LTS (Long Term Support) version
3. Run the installer, accept all defaults
4. Open Command Prompt and verify: `node --version` (should show v18 or higher)

**macOS:**
```bash
# Using Homebrew (install from https://brew.sh if needed)
brew install node
node --version
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

### Step 3.2: Install Google Chrome

Download from https://www.google.com/chrome/ if not already installed.

### Step 3.3: Clone or Download This Project

```bash
# If you have git:
git clone <repository-url>
cd browser-use-toolbox

# Or download and extract the ZIP file, then:
cd browser-use-toolbox
```

### Step 3.4: Install Project Dependencies

```bash
npm install
```

This reads `package.json` and installs the `ws` (WebSocket) library.

### Step 3.5: Start Chrome with Debugging Enabled

**This is crucial!** Chrome must be started with special flags to accept CDP connections.

#### Step A: Kill ALL Chrome processes first

If Chrome is already running, new instances join the existing process and **ignore** command-line flags. You must close Chrome completely.

**Windows:**
```bash
taskkill /F /IM chrome.exe
```

**macOS:**
```bash
pkill -f "Google Chrome"
```

**Linux:**
```bash
pkill chrome
```

#### Step B: Start Chrome with debug flags

**Windows (Git Bash):**
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:/temp/chrome-debug"
```

**Windows (Command Prompt):**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"
```

**Windows (PowerShell):**
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"
```

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
```

**Linux:**
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
```

**Why `--user-data-dir`?** Recent Chrome versions require a separate profile directory for security when using remote debugging.

**Verification:** Open http://localhost:9222/json/version in that Chrome window. You should see JSON output like:
```json
{
  "Browser": "Chrome/120.0.0.0",
  "Protocol-Version": "1.3",
  "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
}
```

### Step 3.6: Run Your First App

```bash
node apps/01-navigator/index.js
```

You should see output like:
```
=== CDP Navigator Demo ===

[CDP] Connected
[Navigator] Page and Network domains enabled

--- Navigation Demo ---
[Navigator] Navigating to: https://example.com
[Lifecycle] DOMContentLoaded at 12345.678
[Lifecycle] Main frame navigated to: https://example.com
[Lifecycle] Load complete at 12345.789
[Navigator] Navigation complete (load)

Current URL: https://example.com
Page Title: Example Domain
```

---

## 4. Understanding Chrome DevTools Protocol

### How CDP Communication Works

```
┌──────────────┐     WebSocket      ┌──────────────┐
│              │ ◄────────────────► │              │
│   Your App   │                    │    Chrome    │
│  (Node.js)   │   JSON messages    │   Browser    │
│              │ ◄────────────────► │              │
└──────────────┘                    └──────────────┘
        │                                   │
        │  1. Connect to ws://...           │
        │  2. Send command                  │
        │  3. Receive response              │
        │  4. Receive events                │
        └───────────────────────────────────┘
```

### Commands vs Events

**Commands** are requests you send to Chrome:
```javascript
// You send:
{ "id": 1, "method": "Page.navigate", "params": { "url": "https://example.com" } }

// Chrome responds:
{ "id": 1, "result": { "frameId": "ABC123" } }
```

**Events** are notifications Chrome sends to you:
```javascript
// Chrome sends (no id, has method):
{ "method": "Page.loadEventFired", "params": { "timestamp": 12345.678 } }
```

### CDP Domains

CDP organizes commands and events into "domains". Think of domains as categories:

| Domain | What It Does | Example Commands |
|--------|-------------|------------------|
| Page | Page lifecycle | `navigate`, `reload`, `captureScreenshot` |
| DOM | Document structure | `getDocument`, `querySelector` |
| Runtime | JavaScript execution | `evaluate`, `callFunctionOn` |
| Input | User input simulation | `dispatchMouseEvent`, `dispatchKeyEvent` |
| Network | HTTP traffic | `enable`, `setCookie` |
| Emulation | Device simulation | `setDeviceMetricsOverride` |

### Enabling Domains

Before using most domains, you must "enable" them:
```javascript
await client.send('Page.enable');   // Start receiving Page events
await client.send('Network.enable'); // Start receiving Network events
```

---

## 5. Project Architecture

### Directory Structure

```
browser-use-toolbox/
├── package.json              # Project configuration
├── CLAUDE.md                 # AI assistant guidance
├── README.md                 # Project overview
│
├── shared/                   # Reusable utilities
│   ├── cdp-client.js         # Core WebSocket client
│   ├── target-manager.js     # Browser tab management
│   ├── wait-helpers.js       # Wait patterns
│   └── utils.js              # Helper functions
│
├── apps/                     # 35 standalone applications
│   ├── 01-navigator/
│   │   ├── index.js          # Main application code
│   │   └── README.md         # App documentation
│   ├── 02-tab-orchestrator/
│   │   ├── index.js
│   │   └── README.md
│   └── ... (apps 03-35)
│
└── docs/                     # Documentation
    ├── CDP_DOMAINS.md        # CDP reference
    ├── DEVELOPER_GUIDE.md    # This file
    ├── USER_GUIDE.md         # User documentation
    └── QUICK_START.md        # Tutorial with 10 examples
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Your App                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    index.js                          │    │
│  │                                                       │    │
│  │  1. Import shared utilities                           │    │
│  │  2. Connect to Chrome                                 │    │
│  │  3. Enable CDP domains                                │    │
│  │  4. Send commands, receive events                     │    │
│  │  5. Close connection                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              shared/target-manager.js                │    │
│  │                                                       │    │
│  │  - Lists available browser tabs                       │    │
│  │  - Connects to a specific tab                         │    │
│  │  - Creates new tabs                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                shared/cdp-client.js                   │    │
│  │                                                       │    │
│  │  - Opens WebSocket connection                         │    │
│  │  - Sends commands with unique IDs                     │    │
│  │  - Routes responses to waiting Promises               │    │
│  │  - Routes events to registered listeners              │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼ WebSocket
               ┌───────────────────────┐
               │    Chrome Browser     │
               │   (port 9222)         │
               └───────────────────────┘
```

---

## 6. Core Components Deep Dive

### 6.1 CDPClient (shared/cdp-client.js)

This is the heart of the project. Let's understand each method:

```javascript
import WebSocket from 'ws';

export class CDPClient {
  constructor() {
    this.ws = null;           // WebSocket connection
    this.messageId = 0;       // Auto-incrementing ID for commands
    this.callbacks = new Map(); // Pending command callbacks
    this.eventListeners = new Map(); // Event subscribers
    this.sessionId = null;    // For multi-target scenarios
  }
```

**Why `messageId`?**
Each command needs a unique ID so we can match responses to requests:
```
Send: { id: 1, method: "Page.navigate", ... }
Receive: { id: 1, result: { frameId: "..." } }  ← This matches id: 1
```

**The `connect` method:**
```javascript
async connect(wsUrl) {
  return new Promise((resolve, reject) => {
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => resolve());     // Connected!
    this.ws.on('message', (data) => {        // Received data
      this._handleMessage(JSON.parse(data.toString()));
    });
    this.ws.on('error', (error) => reject(error));
  });
}
```

**The `send` method (sending commands):**
```javascript
async send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++this.messageId;  // Get unique ID

    const message = { id, method, params };

    // Store callback to be called when response arrives
    this.callbacks.set(id, { resolve, reject });

    // Send the command
    this.ws.send(JSON.stringify(message));
  });
}
```

**The `_handleMessage` method (receiving data):**
```javascript
_handleMessage(message) {
  // Is this a command response? (has 'id')
  if (message.id !== undefined) {
    const callback = this.callbacks.get(message.id);
    if (callback) {
      this.callbacks.delete(message.id);
      if (message.error) {
        callback.reject(new Error(message.error.message));
      } else {
        callback.resolve(message.result || {});
      }
    }
    return;
  }

  // Is this an event? (has 'method', no 'id')
  if (message.method) {
    const listeners = this.eventListeners.get(message.method);
    if (listeners) {
      for (const listener of listeners) {
        listener(message.params || {});
      }
    }
  }
}
```

### 6.2 Target Manager (shared/target-manager.js)

This module helps you find and connect to browser tabs.

**Key Concept: Targets**
In CDP terminology, a "target" is something you can connect to:
- Page (a browser tab)
- Service Worker
- Browser itself

**Listing targets:**
```javascript
export async function listTargets(host = 'localhost', port = 9222) {
  // HTTP GET to http://localhost:9222/json/list
  // Returns array of targets like:
  // [
  //   {
  //     "id": "ABC123",
  //     "type": "page",
  //     "title": "Example Domain",
  //     "url": "https://example.com",
  //     "webSocketDebuggerUrl": "ws://localhost:9222/devtools/page/ABC123"
  //   }
  // ]
}
```

**Connecting to a target:**
```javascript
export async function connectToFirstPage(host, port) {
  // 1. List all targets
  // 2. Find first one where type === 'page'
  // 3. Connect via its webSocketDebuggerUrl
  // 4. Return { client, target }
}
```

### 6.3 Wait Helpers (shared/wait-helpers.js)

Web pages are asynchronous - things don't happen instantly. These helpers let you wait for things:

**waitForNavigation:**
```javascript
export async function waitForNavigation(client, options = {}) {
  const { waitUntil = 'load' } = options;

  // Wait for 'Page.loadEventFired' event
  return client.waitForEvent('Page.loadEventFired');
}
```

**waitForElement:**
```javascript
export async function waitForElement(client, selector, options = {}) {
  const { timeout = 30000, pollInterval = 100 } = options;

  while (/* not timed out */) {
    // Try to find element
    const { nodeId } = await client.send('DOM.querySelector', { ... });

    if (nodeId !== 0) {
      return nodeId;  // Found it!
    }

    await sleep(pollInterval);  // Wait and try again
  }

  throw new Error(`Timeout waiting for: ${selector}`);
}
```

---

## 7. Creating Your First App

Let's build a simple app step by step.

### Step 7.1: Create the App Folder

```bash
mkdir apps/36-my-first-app
```

### Step 7.2: Create index.js

```javascript
/**
 * App 36: My First App
 *
 * A simple demonstration of:
 * - Connecting to Chrome
 * - Navigating to a page
 * - Getting the page title
 */

// Step 1: Import the utilities we need
import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

// Step 2: Create the main function
async function main() {
  console.log('=== My First CDP App ===\n');

  try {
    // Step 3: Connect to Chrome
    console.log('Connecting to Chrome...');
    const { client, target } = await connectToFirstPage();
    console.log(`Connected to: ${target.title}`);

    // Step 4: Enable the domains we need
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    console.log('Domains enabled');

    // Step 5: Navigate to a website
    console.log('\nNavigating to example.com...');
    const navPromise = waitForNavigation(client);  // Start waiting
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;  // Wait for load
    console.log('Navigation complete');

    // Step 6: Get the page title
    const result = await client.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    console.log(`Page title: ${result.result.value}`);

    // Step 7: Get all links on the page
    const linksResult = await client.send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('a'))
          .map(a => ({ text: a.textContent.trim(), href: a.href }))
      `,
      returnByValue: true
    });
    console.log('\nLinks found:');
    for (const link of linksResult.result.value) {
      console.log(`  - "${link.text}" → ${link.href}`);
    }

    // Step 8: Clean up
    console.log('\nClosing connection...');
    client.close();

    console.log('\n=== Done ===');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Step 9: Run it!
main();
```

### Step 7.3: Run Your App

```bash
node apps/36-my-first-app/index.js
```

Expected output:
```
=== My First CDP App ===

Connecting to Chrome...
Connected to: New Tab
Domains enabled

Navigating to example.com...
Navigation complete
Page title: Example Domain

Links found:
  - "More information..." → https://www.iana.org/domains/example

Closing connection...

=== Done ===
```

### Step 7.4: Create README.md

```markdown
# App 36: My First App

A simple demonstration of basic CDP operations.

## Features

- Connect to Chrome browser
- Navigate to a URL
- Execute JavaScript to get page data
- Extract information from the page

## CDP Domains Used

- **Page**: Navigation
- **Runtime**: JavaScript execution

## CDP Commands

- `Page.enable` - Enable page events
- `Page.navigate` - Navigate to URL
- `Runtime.enable` - Enable runtime
- `Runtime.evaluate` - Execute JavaScript

## Usage

```bash
node apps/36-my-first-app/index.js
```
```

---

## 8. Common Patterns and Best Practices

### Pattern 1: Always Enable Domains First

```javascript
// Good
await client.send('Page.enable');
await client.send('Page.navigate', { url: '...' });

// Bad - might miss events
await client.send('Page.navigate', { url: '...' });
await client.send('Page.enable');  // Too late!
```

### Pattern 2: Set Up Event Listeners Before Actions

```javascript
// Good
client.on('Page.loadEventFired', () => console.log('Loaded!'));
await client.send('Page.navigate', { url: '...' });

// Bad - event fires before listener is set
await client.send('Page.navigate', { url: '...' });
client.on('Page.loadEventFired', () => console.log('Loaded!')); // Missed it!
```

### Pattern 3: Handle Missing Elements Gracefully

```javascript
const { nodeId } = await client.send('DOM.querySelector', {
  nodeId: root.nodeId,
  selector: 'button.submit'
});

if (nodeId === 0) {
  console.log('Element not found');
  return;  // or throw, or retry
}

// nodeId is valid, continue...
```

### Pattern 4: Use the Class Pattern for Reusability

```javascript
class MyApp {
  constructor(client) {
    this.client = client;
  }

  async enable() { /* ... */ }
  async doSomething() { /* ... */ }
}

// Usage
const app = new MyApp(client);
await app.enable();
await app.doSomething();

// Export for other apps to use
export { MyApp };
```

### Pattern 5: Clean Up Resources

```javascript
async function main() {
  const { client } = await connectToFirstPage();

  try {
    // Do your work...
  } finally {
    client.close();  // Always close, even on error
  }
}
```

---

## 9. Debugging and Troubleshooting

### Problem: "Connection refused"

**Symptom:** `Error: connect ECONNREFUSED 127.0.0.1:9222`

**Solution:** Chrome isn't running with debugging enabled.
```bash
# Start Chrome with debugging port
chrome --remote-debugging-port=9222
```

### Problem: "No page found"

**Symptom:** `Error: Target has no webSocketDebuggerUrl`

**Solution:**
1. Open a new tab in Chrome
2. Or use `createTab()` from target-manager

### Problem: "Element not found"

**Symptom:** `nodeId === 0`

**Possible causes:**
1. Page hasn't loaded yet - add `await waitForNavigation(client)`
2. Selector is wrong - check in Chrome DevTools
3. Element is in an iframe - need to switch to iframe context

### Problem: "CDP Error: ..."

**Symptom:** Error messages from Chrome

**Common errors:**
- `"Cannot find context with specified id"` - Page navigated, context is stale
- `"Could not find node with given id"` - Element was removed from DOM
- `"Protocol error"` - Command parameters are wrong

### Debugging Tips

1. **Add logging:**
```javascript
console.log('Before navigate');
await client.send('Page.navigate', { url });
console.log('After navigate');
```

2. **Log all events:**
```javascript
client.on('Page.loadEventFired', (p) => console.log('Load:', p));
client.on('Page.frameNavigated', (p) => console.log('Frame:', p));
```

3. **Check Chrome DevTools:**
   - Go to `chrome://inspect`
   - Click "inspect" on a page to see what's happening

---

## 10. Extending the Project

### Adding a New CDP Domain

1. Check the [CDP documentation](https://chromedevtools.github.io/devtools-protocol/)
2. Enable the domain: `await client.send('DomainName.enable')`
3. Use commands: `await client.send('DomainName.commandName', params)`
4. Listen to events: `client.on('DomainName.eventName', handler)`

### Creating a Shared Utility

If you build something reusable:

1. Add it to `shared/your-utility.js`
2. Export functions or classes
3. Import in apps: `import { yourFunction } from '../../shared/your-utility.js'`

### Combining Multiple Apps

Apps are designed to be imported:

```javascript
import { Navigator } from '../01-navigator/index.js';
import { Screenshotter } from '../11-screenshotter/index.js';

async function combinedWorkflow() {
  const { client } = await connectToFirstPage();

  const nav = new Navigator(client);
  const screenshot = new Screenshotter(client);

  await nav.enable();
  await screenshot.enable();

  await nav.navigate('https://example.com');
  const image = await screenshot.captureViewport();
  // ...
}
```

---

## Summary

You now have the knowledge to:

1. ✅ Set up your development environment
2. ✅ Understand how CDP works
3. ✅ Navigate the project structure
4. ✅ Understand the core components
5. ✅ Create new apps
6. ✅ Follow best practices
7. ✅ Debug common issues
8. ✅ Extend the project

**Next Steps:**
- Read the [User Guide](USER_GUIDE.md) for practical examples
- Try the [Quick Start Guide](QUICK_START.md) with 10 hands-on tutorials
- Explore individual app READMEs for specific features
- Check [CDP_DOMAINS.md](CDP_DOMAINS.md) for command references
