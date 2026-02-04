# Quick Start Guide: 10 Hands-On Tutorials

Learn browser automation primitives for agentic workflows. Each tutorial teaches a specific capability that can be integrated into AI agents and computer-use systems.

These 10 tutorials take you from beginner to proficient, building skills progressively.

---

## Before You Begin

### Prerequisites Checklist

- [ ] Node.js installed (`node --version` shows v18+)
- [ ] Google Chrome installed
- [ ] Project dependencies installed (`npm install`)
- [ ] Chrome running with debug port (`chrome --remote-debugging-port=9222`)

### How to Start Chrome with Debugging

**IMPORTANT:** Close ALL Chrome windows first!

On Windows, kill all Chrome processes first:
```bash
taskkill //F //IM chrome.exe
```

**Windows (Git Bash / MINGW64):**
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:/temp/chrome-debug"
```

**Windows (Command Prompt - cmd.exe):**
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

**Verify:** Go to `http://localhost:9222/json/version` - you should see JSON output.

---

## Tutorial 1: Your First Navigation

**Goal:** Navigate to a website and get the page title.

**Skills learned:**
- Connecting to Chrome
- Sending navigation commands
- Getting page information

### Step 1: Ensure Chrome is Running with Debug Port

Check http://localhost:9222/json/version in your browser. You should see JSON output.

### Step 2: Run the Navigator App

```bash
node apps/01-navigator/index.js
```

### Step 3: Observe What Happens

**In Chrome:** Watch as the browser automatically navigates to example.com, then to httpbin.org, then goes back and forward.

**In Terminal:** You'll see output like:

```
=== CDP Navigator Demo ===

[CDP] Connected
[Navigator] Page and Network domains enabled

--- Navigation Demo ---
[Navigator] Navigating to: https://example.com
[Lifecycle] DOMContentLoaded at 1234.567
[Navigator] Navigation complete (load)

Current URL: https://example.com
Page Title: Example Domain
```

### What Just Happened?

1. The program connected to Chrome via WebSocket
2. It sent a `Page.navigate` command with the URL
3. Chrome navigated and sent back events
4. The program asked for the page title using JavaScript evaluation

### Try It Yourself

Edit `apps/01-navigator/index.js` and change `https://example.com` to your favorite website, then run again!

---

## Tutorial 2: Taking Screenshots

**Goal:** Capture screenshots of web pages in different ways.

**Skills learned:**
- Viewport screenshots
- Full-page screenshots
- Element-specific screenshots
- Saving images to disk

**Prerequisite:** Chrome must be running in debug mode (see "Before You Begin" section above).

### What This App Does

The screenshotter app will:
1. Navigate to **https://example.com**
2. Take multiple types of screenshots
3. Save them as image files in your current directory

### Step 1: Run the Screenshotter App

```bash
node apps/11-screenshotter/index.js
```

### Step 2: Watch the Terminal Output

You'll see progress messages:
```
=== CDP Screenshotter Demo ===

--- Navigating to example.com ---
--- Layout Metrics ---
  Content size: 1256x537
--- Viewport Screenshot ---
[Screenshotter] Captured viewport (png, 12345 bytes)
[Screenshotter] Saved to: screenshot-viewport.png
...
```

### Step 3: Check Your Directory

After running, you'll have new files in your project folder:

```
screenshot-viewport.png    # What's visible on screen
screenshot-fullpage.png    # The entire page scrolled
screenshot-element.png     # Just the h1 heading
screenshot-region.png      # A specific area (50,50 to 350,250)
screenshot-quality.jpg     # JPEG format (smaller file)
screenshot-2x.png          # High resolution (2x pixel density)
screenshot-320px.png       # Mobile width simulation
screenshot-768px.png       # Tablet width simulation
screenshot-1024px.png      # Desktop width simulation
```

### Step 4: View the Screenshots

Open any of these files to see what was captured. Compare `screenshot-320px.png` vs `screenshot-1024px.png` to see responsive differences.

### The Key Command

The magic happens with:
```javascript
const result = await client.send('Page.captureScreenshot', {
  format: 'png'
});
// result.data contains the image as base64
```

### Practical Uses

- **Visual regression testing:** Take screenshots before and after changes
- **Documentation:** Automatically capture UI for documentation
- **Monitoring:** Regular screenshots to detect visual issues

---

## Tutorial 3: Clicking Buttons

**Goal:** Programmatically click elements on a web page.

**Skills learned:**
- Finding elements by selector
- Getting element coordinates
- Simulating mouse clicks

**Prerequisite:** Chrome must be running in debug mode (see "Before You Begin" section above).

### What This App Does

The clicker app will:
1. Navigate to **https://example.com**
2. Click on the "More information..." link
3. Navigate to a form page and click various elements

### Step 1: Run the Clicker App

```bash
node apps/06-clicker/index.js
```

### Step 2: Watch the Browser

The app will:
1. Go to example.com
2. Click on the "More information..." link
3. Go to a form page
4. Click on input fields and buttons

### How Clicking Works

**Step A:** Find the element and get its position
```javascript
// Get document root
const { root } = await client.send('DOM.getDocument');

// Find element by CSS selector
const { nodeId } = await client.send('DOM.querySelector', {
  nodeId: root.nodeId,
  selector: 'a'  // Find first link
});

// Get element's box model (position and size)
const boxModel = await client.send('DOM.getBoxModel', { nodeId });
```

**Step B:** Calculate center point
```javascript
const x = (boxModel.model.content[0] + boxModel.model.content[2]) / 2;
const y = (boxModel.model.content[1] + boxModel.model.content[5]) / 2;
```

**Step C:** Send mouse events
```javascript
// Move mouse
await client.send('Input.dispatchMouseEvent', {
  type: 'mouseMoved', x, y
});

// Press button
await client.send('Input.dispatchMouseEvent', {
  type: 'mousePressed', x, y, button: 'left', clickCount: 1
});

// Release button
await client.send('Input.dispatchMouseEvent', {
  type: 'mouseReleased', x, y, button: 'left', clickCount: 1
});
```

### Practical Uses

- **Automated testing:** Click through user flows
- **Web scraping:** Click "Load more" buttons
- **Form submission:** Click submit buttons

---

## Tutorial 4: Typing Text

**Goal:** Type text into input fields like a human would.

**Skills learned:**
- Focusing input elements
- Simulating keyboard events
- Typing with realistic delays

**Prerequisite:** Chrome must be running in debug mode (see "Before You Begin" section above).

### What This App Does

The typer app will:
1. Navigate to **https://httpbin.org/forms/post** (a test form page)
2. Click on input fields and type text
3. Demonstrate special keys and keyboard shortcuts

### Step 1: Run the Typer App

```bash
node apps/07-typer/index.js
```

### Step 2: Watch the Typing

The app will:
1. Navigate to a form page
2. Click on input fields
3. Type text character by character
4. Use special keys (Enter, Tab)

### How Typing Works

**Method 1: Character by character**
```javascript
for (const char of "Hello World") {
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: char
  });
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: char
  });
  await sleep(50);  // Small delay between keys
}
```

**Method 2: Insert text directly (faster)**
```javascript
await client.send('Input.insertText', {
  text: 'Hello World'
});
```

### Special Keys

```javascript
// Press Enter
await client.send('Input.dispatchKeyEvent', {
  type: 'keyDown', key: 'Enter', code: 'Enter'
});

// Press Tab
await client.send('Input.dispatchKeyEvent', {
  type: 'keyDown', key: 'Tab', code: 'Tab'
});

// Keyboard shortcuts (Ctrl+A)
await client.send('Input.dispatchKeyEvent', {
  type: 'keyDown', key: 'a', modifiers: 2  // 2 = Ctrl
});
```

---

## Tutorial 5: Extracting Data from Pages

**Goal:** Scrape content from web pages.

**Skills learned:**
- Running JavaScript in the browser
- Extracting structured data
- Working with results

**Prerequisite:** Chrome must be running in debug mode (see "Before You Begin" section above).

### What This App Does

The content scraper will:
1. Navigate to **https://example.com**
2. Extract all links, images, and metadata
3. Display the structured data in the terminal

### Step 1: Run the Content Scraper

```bash
node apps/05-content-scraper/index.js
```

### Step 2: See the Extracted Data

The app extracts and displays:
- All links (text and URL)
- All images (src and alt text)
- Page metadata

### How Scraping Works

**Execute JavaScript to gather data:**
```javascript
const result = await client.send('Runtime.evaluate', {
  expression: `
    // This JavaScript runs IN the browser
    Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent.trim(),
      href: a.href
    }))
  `,
  returnByValue: true  // Return the actual data, not a reference
});

// result.result.value contains the array of links
console.log(result.result.value);
// [{ text: "Click here", href: "https://..." }, ...]
```

**Extract Tables:**
```javascript
const tableData = await client.send('Runtime.evaluate', {
  expression: `
    const table = document.querySelector('table');
    const rows = Array.from(table.querySelectorAll('tr'));
    rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      return cells.map(cell => cell.textContent.trim());
    });
  `,
  returnByValue: true
});
```

### Practical Uses

- **Price monitoring:** Extract prices from e-commerce sites
- **News aggregation:** Gather headlines from news sites
- **Data collection:** Extract structured data for analysis

---

## Tutorial 6: Monitoring Network Requests

**Goal:** See all HTTP requests a web page makes.

**Skills learned:**
- Enabling network monitoring
- Handling network events
- Understanding request/response flow

**Prerequisite:** Chrome must be running in debug mode (see "Before You Begin" section above).

### What This App Does

The request watcher will:
1. Enable network monitoring
2. Navigate to **https://example.com**
3. Log every HTTP request and response

### Step 1: Run the Request Watcher

```bash
node apps/15-request-watcher/index.js
```

### Step 2: Observe the Output

You'll see every request:
```
[Network] Request: GET https://example.com/
[Network] Response: 200 OK (1234 bytes)
[Network] Request: GET https://example.com/style.css
[Network] Response: 200 OK (567 bytes)
...
```

### How Network Monitoring Works

**Enable the Network domain:**
```javascript
await client.send('Network.enable');
```

**Listen for events:**
```javascript
client.on('Network.requestWillBeSent', (params) => {
  console.log(`Request: ${params.request.method} ${params.request.url}`);
});

client.on('Network.responseReceived', (params) => {
  console.log(`Response: ${params.response.status} (${params.response.headers['content-length']} bytes)`);
});
```

### Practical Uses

- **Debugging:** Find failing API calls
- **Performance:** Identify slow requests
- **Security:** Detect unexpected external calls

---

## Tutorial 7: Handling Cookies

**Goal:** Read, write, and delete browser cookies.

**Skills learned:**
- Getting all cookies
- Setting cookies
- Deleting cookies

**Prerequisite:** Chrome must be running in debug mode (see "Before You Begin" section above).

### What This App Does

The cookie manager will:
1. Navigate to **https://example.com**
2. List existing cookies
3. Create, read, and delete test cookies

### Step 1: Run the Cookie Manager

```bash
node apps/17-cookie-manager/index.js
```

### Step 2: See Cookie Operations

The app demonstrates:
- Listing all cookies for a domain
- Adding new cookies
- Deleting specific cookies
- Clearing all cookies

### How Cookie Management Works

**Get all cookies:**
```javascript
const { cookies } = await client.send('Network.getAllCookies');
cookies.forEach(cookie => {
  console.log(`${cookie.name}: ${cookie.value}`);
});
```

**Set a cookie:**
```javascript
await client.send('Network.setCookie', {
  name: 'my_cookie',
  value: 'my_value',
  domain: 'example.com',
  path: '/'
});
```

**Delete a cookie:**
```javascript
await client.send('Network.deleteCookies', {
  name: 'my_cookie',
  domain: 'example.com'
});
```

### Practical Uses

- **Testing:** Test with different user sessions
- **Automation:** Maintain login state
- **Debugging:** Inspect session data

---

## Tutorial 8: Emulating Mobile Devices

**Goal:** Test how websites look on mobile devices.

**Skills learned:**
- Setting viewport dimensions
- Changing device pixel ratio
- Setting user agent strings

**Prerequisite:** Chrome must be running in debug mode (see "Before You Begin" section above).

### What This App Does

The device emulator will:
1. Navigate to **https://example.com**
2. Simulate different mobile devices (iPhone, iPad, Pixel)
3. Take screenshots at each device size

### Step 1: Run the Device Emulator

```bash
node apps/18-device-emulator/index.js
```

### Step 2: Watch the Browser Change

The browser will:
1. Switch to iPhone dimensions
2. Then to iPad dimensions
3. Then to a Pixel phone
4. Each time taking a screenshot

### How Device Emulation Works

**Set device metrics:**
```javascript
await client.send('Emulation.setDeviceMetricsOverride', {
  width: 375,              // iPhone width
  height: 812,             // iPhone height
  deviceScaleFactor: 3,    // Retina display
  mobile: true             // Enable mobile mode
});
```

**Set user agent:**
```javascript
await client.send('Emulation.setUserAgentOverride', {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)...'
});
```

**Common device presets:**
```javascript
const devices = {
  'iPhone 12': { width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
  'iPad': { width: 768, height: 1024, deviceScaleFactor: 2, mobile: true },
  'Pixel 5': { width: 393, height: 851, deviceScaleFactor: 2.75, mobile: true }
};
```

### Practical Uses

- **Responsive testing:** Verify mobile layouts
- **Bug reproduction:** Test mobile-specific issues
- **Screenshots:** Capture mobile versions for documentation

---

## Tutorial 9: Waiting for Things

**Goal:** Master different strategies for waiting for page events.

**Skills learned:**
- Waiting for navigation
- Waiting for elements
- Waiting for network idle
- Custom wait conditions

**Prerequisite:** Chrome must be running in debug mode (see "Before You Begin" section above).

### What This App Does

The wait strategies app will:
1. Navigate to **https://example.com**
2. Demonstrate different waiting techniques
3. Show how to wait for elements, navigation, and custom conditions

### Step 1: Run the Wait Strategies App

```bash
node apps/20-wait-strategies/index.js
```

### Step 2: Understand Different Waits

**Wait for page load:**
```javascript
// Start waiting BEFORE navigation
const loadPromise = client.waitForEvent('Page.loadEventFired');

// Navigate
await client.send('Page.navigate', { url: 'https://example.com' });

// Wait for load event
await loadPromise;
```

**Wait for element:**
```javascript
async function waitForElement(selector, timeout = 30000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const { root } = await client.send('DOM.getDocument');
    const { nodeId } = await client.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector
    });

    if (nodeId !== 0) {
      return nodeId;  // Found!
    }

    await sleep(100);  // Wait and try again
  }

  throw new Error(`Timeout waiting for ${selector}`);
}
```

**Wait for network idle:**
```javascript
// Wait until no network requests for 500ms
async function waitForNetworkIdle() {
  let pending = 0;

  client.on('Network.requestWillBeSent', () => pending++);
  client.on('Network.loadingFinished', () => pending--);
  client.on('Network.loadingFailed', () => pending--);

  // Wait until pending stays at 0 for 500ms
  while (true) {
    if (pending === 0) {
      await sleep(500);
      if (pending === 0) return;  // Still zero, we're idle!
    }
    await sleep(100);
  }
}
```

**Wait for custom condition:**
```javascript
async function waitForCondition(jsExpression, timeout = 30000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const result = await client.send('Runtime.evaluate', {
      expression: jsExpression,
      returnByValue: true
    });

    if (result.result.value) {
      return result.result.value;
    }

    await sleep(100);
  }

  throw new Error('Condition not met');
}

// Usage: wait for a global variable to be set
await waitForCondition('window.dataLoaded === true');
```

---

## Tutorial 10: Building a Complete Workflow

**Goal:** Combine multiple skills into a real automation task.

**Skills learned:**
- Chaining multiple operations
- Error handling
- Creating reusable automation scripts

**Prerequisite:** Chrome must be running in debug mode (see "Before You Begin" section above).

### What This Workflow Does

You'll create a script that:
1. Connects to Chrome and navigates to **https://example.com**
2. Takes a "before" screenshot
3. Extracts page data (title, link count)
4. Clicks the "More information..." link
5. Waits for navigation to complete
6. Takes an "after" screenshot
7. Reports the new URL and title

### The Scenario

We'll build a script that:
1. Opens a website
2. Takes a "before" screenshot
3. Clicks a button
4. Waits for changes
5. Takes an "after" screenshot
6. Extracts some data

### Step 1: Create a New File

Create `apps/my-workflow/index.js`:

```javascript
/**
 * My Complete Workflow
 * Demonstrates combining multiple CDP operations
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, waitForElement, sleep } from '../../shared/wait-helpers.js';
import fs from 'fs/promises';

async function main() {
  console.log('=== Complete Workflow Demo ===\n');

  try {
    // Step 1: Connect
    console.log('Step 1: Connecting to Chrome...');
    const { client } = await connectToFirstPage();

    // Enable domains
    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');
    console.log('  Connected and domains enabled\n');

    // Step 2: Navigate
    console.log('Step 2: Navigating to example.com...');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    console.log('  Navigation complete\n');

    // Step 3: Take "before" screenshot
    console.log('Step 3: Taking "before" screenshot...');
    const before = await client.send('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile('workflow-before.png', Buffer.from(before.data, 'base64'));
    console.log('  Saved workflow-before.png\n');

    // Step 4: Get page information
    console.log('Step 4: Extracting page data...');
    const titleResult = await client.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    console.log(`  Page title: ${titleResult.result.value}`);

    const linksResult = await client.send('Runtime.evaluate', {
      expression: `document.querySelectorAll('a').length`,
      returnByValue: true
    });
    console.log(`  Number of links: ${linksResult.result.value}\n`);

    // Step 5: Click on the link
    console.log('Step 5: Clicking on link...');

    // Get link coordinates
    const { root } = await client.send('DOM.getDocument');
    const { nodeId } = await client.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: 'a'
    });

    if (nodeId !== 0) {
      const boxModel = await client.send('DOM.getBoxModel', { nodeId });
      const content = boxModel.model.content;
      const x = (content[0] + content[2]) / 2;
      const y = (content[1] + content[5]) / 2;

      // Click
      await client.send('Input.dispatchMouseEvent', {
        type: 'mousePressed', x, y, button: 'left', clickCount: 1
      });
      await client.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased', x, y, button: 'left', clickCount: 1
      });

      console.log('  Clicked link\n');

      // Wait for navigation
      await sleep(2000);
    }

    // Step 6: Take "after" screenshot
    console.log('Step 6: Taking "after" screenshot...');
    const after = await client.send('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile('workflow-after.png', Buffer.from(after.data, 'base64'));
    console.log('  Saved workflow-after.png\n');

    // Step 7: Get new page data
    console.log('Step 7: Getting new page data...');
    const newUrl = await client.send('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    console.log(`  New URL: ${newUrl.result.value}`);

    const newTitle = await client.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    console.log(`  New title: ${newTitle.result.value}\n`);

    // Clean up
    console.log('Step 8: Closing connection...');
    client.close();

    console.log('\n=== Workflow Complete ===');
    console.log('\nFiles created:');
    console.log('  - workflow-before.png');
    console.log('  - workflow-after.png');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
```

### Step 2: Run Your Workflow

```bash
node apps/my-workflow/index.js
```

### Step 3: Check the Results

You now have:
- `workflow-before.png` - Screenshot before clicking
- `workflow-after.png` - Screenshot after clicking
- Console output showing extracted data

---

## Summary: What You've Learned

| Tutorial | Skills Acquired |
|----------|-----------------|
| 1. Navigation | Connecting, navigating, getting page info |
| 2. Screenshots | Capturing images in various formats |
| 3. Clicking | Finding elements, simulating mouse clicks |
| 4. Typing | Keyboard input, special keys, shortcuts |
| 5. Scraping | Running JavaScript, extracting data |
| 6. Network | Monitoring HTTP requests and responses |
| 7. Cookies | Reading, writing, deleting cookies |
| 8. Emulation | Mobile device simulation |
| 9. Waiting | Different strategies for synchronization |
| 10. Workflows | Combining skills into complete automations |

---

## Next Steps

### Explore More Apps

Each of the 35 apps has its own README with detailed explanations. Try:
- `apps/16-api-mocker/` - Mock API responses
- `apps/21-ui-themer/` - Inject custom CSS
- `apps/22-accessibility-auditor/` - Check accessibility

### Read the Developer Guide

For deeper technical understanding, read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md).

### Build Your Own Automation

You now have all the building blocks. Try automating something useful for your work or studies!

### Learn More About CDP

- Official docs: https://chromedevtools.github.io/devtools-protocol/
- Quick reference: See `docs/CDP_DOMAINS.md`
