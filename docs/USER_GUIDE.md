# User Guide

A complete guide for users new to browser automation and agentic workflows.

**browser-use** provides 35 ready-to-use modules for controlling Chrome programmatically — the building blocks for AI agents, automation scripts, and computer-use systems.

---

## Table of Contents

1. [What is This Project?](#1-what-is-this-project)
2. [Who is This For?](#2-who-is-this-for)
3. [Key Concepts Explained Simply](#3-key-concepts-explained-simply)
4. [Step-by-Step Setup](#4-step-by-step-setup)
5. [Running Your First Application](#5-running-your-first-application)
6. [Understanding the Output](#6-understanding-the-output)
7. [The 35 Applications Explained](#7-the-35-applications-explained)
8. [Common Tasks and How to Do Them](#8-common-tasks-and-how-to-do-them)
9. [Troubleshooting Common Problems](#9-troubleshooting-common-problems)
10. [Glossary of Terms](#10-glossary-of-terms)

---

## 1. What is This Project?

### The Simple Explanation

Imagine you could write a program that controls your web browser - clicking buttons, filling forms, taking screenshots - all automatically. That's exactly what this project does.

This project contains **35 ready-to-use programs** that demonstrate different ways to control Google Chrome from the command line.

### Real-World Uses

- **Testing websites**: Automatically check if your website works correctly
- **Data collection**: Extract information from web pages
- **Automation**: Automate repetitive tasks like filling forms
- **Screenshots**: Capture web pages as images
- **AI Agents**: Let AI control a browser to accomplish tasks

### What You'll Be Able to Do

After learning this project, you'll be able to:
- Navigate to any website programmatically
- Click buttons and fill forms automatically
- Take screenshots of web pages
- Monitor network requests
- Extract data from web pages
- And much more!

---

## 2. Who is This For?

### Perfect For You If:

- ✅ You know basic programming (any language: C, C++, Java, Python)
- ✅ You want to learn browser automation
- ✅ You're curious about how tools like Selenium/Puppeteer work internally
- ✅ You're building AI agents that need to browse the web
- ✅ You want to automate repetitive web tasks

### What You Don't Need to Know (We'll Teach You):

- ❌ JavaScript (we'll explain what you need)
- ❌ Node.js (we'll show you step by step)
- ❌ How browsers work internally (we'll explain)
- ❌ WebSockets (we'll cover the basics)

---

## 3. Key Concepts Explained Simply

### What is Node.js?

**If you know C/C++/Java:** Node.js is like a runtime for JavaScript, similar to how the JVM runs Java. It lets you run JavaScript outside a web browser.

**Simple analogy:** Just as you need Python installed to run `.py` files, you need Node.js installed to run `.js` files.

### What is Chrome DevTools Protocol (CDP)?

**Simple explanation:** When you press F12 in Chrome to open Developer Tools, Chrome uses an internal communication system called CDP. This project uses that same system to control Chrome from external programs.

**Analogy:** CDP is like a remote control for Chrome. Just as a TV remote sends signals to control your TV, CDP sends commands to control Chrome.

### What is a WebSocket?

**Simple explanation:** It's a way for two programs to have a continuous conversation. Unlike regular web requests (ask once, get answer once), WebSocket keeps the line open for back-and-forth communication.

**Analogy:**
- HTTP (regular web) = Sending letters back and forth
- WebSocket = Having a phone call (continuous connection)

### What is the DOM?

**DOM = Document Object Model**

**Simple explanation:** When a browser loads a web page, it creates a structured representation of all the elements (buttons, text, images). This structure is called the DOM.

**Analogy:** If a web page is a house, the DOM is the blueprint showing where every room, door, and window is located.

### What is a CSS Selector?

**Simple explanation:** A way to identify specific elements on a web page.

**Examples:**
- `button` - selects all buttons
- `#login` - selects the element with id="login"
- `.menu` - selects all elements with class="menu"
- `input[type="text"]` - selects text input fields

---

## 4. Step-by-Step Setup

### Step 4.1: Check Your Computer

**Operating System:** Windows 10/11, macOS, or Linux

**What you need to install:**
1. Node.js (the JavaScript runtime)
2. Google Chrome (the browser we'll control)

### Step 4.2: Install Node.js

#### Windows:

1. Open your web browser
2. Go to: https://nodejs.org
3. Click the green button that says "LTS" (Long Term Support)
4. Once downloaded, double-click the installer file
5. Click "Next" through all screens (keep default options)
6. Click "Install"
7. Wait for installation to complete
8. Click "Finish"

**Verify installation:**
1. Press `Windows + R` to open Run dialog
2. Type `cmd` and press Enter
3. Type `node --version` and press Enter
4. You should see something like `v18.17.0` or higher

#### macOS:

**Option A: Download from website**
1. Go to https://nodejs.org
2. Download the macOS installer
3. Open the downloaded file
4. Follow the installation steps

**Option B: Using Terminal (if you have Homebrew)**
```bash
brew install node
```

**Verify installation:**
1. Open Terminal (Applications → Utilities → Terminal)
2. Type `node --version` and press Enter
3. You should see a version number

#### Linux (Ubuntu/Debian):

Open Terminal and run:
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify
node --version
```

### Step 4.3: Install Google Chrome

If Chrome isn't installed:
1. Go to https://www.google.com/chrome
2. Click "Download Chrome"
3. Run the installer
4. Follow the installation steps

### Step 4.4: Download This Project

**Option A: Using Git (if installed)**
```bash
git clone <repository-url>
cd browser-use
```

**Option B: Download ZIP**
1. Download the project as a ZIP file
2. Extract to a folder of your choice
3. Open a terminal/command prompt and navigate to that folder:

```bash
cd browser-use
```

### Step 4.5: Install Project Dependencies

In your terminal, make sure you're in the project folder, then run:

```bash
npm install
```

**What this does:** Reads the `package.json` file and downloads required libraries (in this case, the WebSocket library).

**Expected output:**
```
added 1 package, and audited 2 packages in 2s
found 0 vulnerabilities
```

### Step 4.6: Start Chrome with Debugging Mode

**IMPORTANT:** This step must be done every time before running the applications.

Chrome needs to be started with a special setting that allows external programs to control it.

#### Windows:

**IMPORTANT:** You must close ALL Chrome processes first!

**Step 1: Kill all Chrome processes**

Open any terminal and run:
```bash
taskkill //F //IM chrome.exe
```

**Step 2: Start Chrome with debugging**

**Git Bash / MINGW64:**
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:/temp/chrome-debug"
```

**Command Prompt (cmd.exe):**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"
```

**PowerShell:**
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"
```

**Method: Create a Shortcut (Recommended for repeated use)**
1. Right-click on Desktop → New → Shortcut
2. For location, enter:
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"
   ```
3. Click Next
4. Name it "Chrome Debug Mode"
5. Click Finish
6. Now you can double-click this shortcut anytime

**Note:** The `--user-data-dir` flag creates a separate Chrome profile for debugging. This is required by recent Chrome versions.

#### macOS:

1. Close all Chrome windows completely
2. Open Terminal
3. Run:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

#### Linux:

1. Close all Chrome windows
2. Open Terminal
3. Run:
```bash
google-chrome --remote-debugging-port=9222
```

### Step 4.7: Verify Chrome is Ready

1. With Chrome running in debug mode, open a new tab
2. Go to: http://localhost:9222/json/version
3. You should see text that looks like:
```json
{
  "Browser": "Chrome/120.0.0.0",
  "Protocol-Version": "1.3",
  "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
}
```

If you see this, you're ready!

---

## 5. Running Your First Application

### The Navigator App (App 01)

Let's run the simplest application first.

**Step 1:** Make sure Chrome is running in debug mode (see Step 4.6)

**Step 2:** Open a new terminal window (keep Chrome running)

**Step 3:** Navigate to the project folder:
```bash
cd browser-use
```

**Step 4:** Run the navigator app:
```bash
node apps/01-navigator/index.js
```

**Step 5:** Watch what happens!
- Your Chrome browser will navigate to example.com
- Then to httpbin.org
- Then back and forward in history
- The terminal will show what's happening

---

## 6. Understanding the Output

When you run the navigator app, you'll see output like this:

```
=== CDP Navigator Demo ===

[CDP] Connected
```
**Meaning:** The program connected to Chrome successfully.

```
[Navigator] Page and Network domains enabled
```
**Meaning:** The program enabled the features it needs (Page navigation, Network monitoring).

```
--- Navigation Demo ---
[Navigator] Navigating to: https://example.com
[Lifecycle] DOMContentLoaded at 12345.678
[Lifecycle] Main frame navigated to: https://example.com
[Lifecycle] Load complete at 12345.789
[Navigator] Navigation complete (load)
```
**Meaning:**
- The program told Chrome to go to example.com
- DOMContentLoaded: The page structure is ready
- Load complete: Everything (images, scripts) finished loading

```
Current URL: https://example.com
Page Title: Example Domain
```
**Meaning:** The program asked Chrome for the current URL and page title.

```
=== Demo Complete ===
```
**Meaning:** The program finished successfully and disconnected.

---

## 7. The 35 Applications Explained

### Category 1: Navigation & Page Control

| App | Name | What It Does |
|-----|------|--------------|
| 01 | Navigator | Goes to websites, goes back/forward in history |
| 02 | Tab Orchestrator | Opens, closes, and switches between browser tabs |

### Category 2: Finding & Reading Content

| App | Name | What It Does |
|-----|------|--------------|
| 03 | DOM Explorer | Finds elements on pages using CSS selectors |
| 04 | Accessibility Reader | Reads the page like a screen reader would |
| 05 | Content Scraper | Extracts data (links, images, tables) from pages |

### Category 3: Interacting with Pages

| App | Name | What It Does |
|-----|------|--------------|
| 06 | Clicker | Clicks on buttons, links, and other elements |
| 07 | Typer | Types text into input fields |
| 08 | Form Filler | Fills out complete forms automatically |
| 09 | Scroller | Scrolls pages up, down, to specific elements |
| 10 | Drag & Drop | Drags elements from one place to another |

### Category 4: Visual Capture

| App | Name | What It Does |
|-----|------|--------------|
| 11 | Screenshotter | Takes screenshots (full page, viewport, element) |
| 12 | Screen Recorder | Records the browser as a video |

### Category 5: JavaScript & Console

| App | Name | What It Does |
|-----|------|--------------|
| 13 | JS Executor | Runs JavaScript code in the browser |
| 14 | Console Monitor | Captures console.log messages from websites |

### Category 6: Network & Requests

| App | Name | What It Does |
|-----|------|--------------|
| 15 | Request Watcher | Shows all network requests a page makes |
| 16 | API Mocker | Intercepts and fakes API responses |

### Category 7: Browser Context

| App | Name | What It Does |
|-----|------|--------------|
| 17 | Cookie Manager | Reads, writes, and deletes cookies |
| 18 | Device Emulator | Pretends to be a mobile device |
| 19 | Dialog Handler | Handles alert() and confirm() popups |

### Category 8: Waiting & Synchronization

| App | Name | What It Does |
|-----|------|--------------|
| 20 | Wait Strategies | Different ways to wait for things to load |

### Category 9: CDP Superpowers (Advanced)

| App | Name | What It Does |
|-----|------|--------------|
| 21 | UI Themer | Injects dark mode into any website |
| 22 | Accessibility Auditor | Checks websites for accessibility issues |
| 23 | Performance X-Ray | Shows real-time performance metrics |
| 24 | Reading Mode | Removes clutter for clean reading |
| 25 | Layout Visualizer | Shows CSS Grid and Flexbox layouts |
| 26 | Animation Controller | Pauses and controls CSS animations |
| 27 | Design Token Extractor | Extracts colors, fonts from websites |
| 28 | Network Waterfall | Visualizes request timing |
| 29 | Memory Leak Hunter | Finds memory leaks in websites |
| 30 | Responsive Matrix | Screenshots at multiple screen sizes |
| 31 | Dead Code Finder | Finds unused CSS and JavaScript |
| 32 | DOM Time Machine | Records DOM changes over time |
| 33 | Element Highlighter | Interactive element inspector |
| 34 | Page Clone & Diff | Compares two versions of a page |
| 35 | AI Design Critic | Analyzes design quality |

---

## 8. Common Tasks and How to Do Them

### Task: Take a Screenshot of a Website

```bash
node apps/11-screenshotter/index.js
```

This will:
1. Navigate to example.com
2. Take multiple types of screenshots
3. Save them as PNG files in the current directory

**Files created:**
- `screenshot-viewport.png` - What you see on screen
- `screenshot-fullpage.png` - The entire page
- `screenshot-element.png` - Just the h1 heading
- And more...

### Task: Fill Out a Form Automatically

```bash
node apps/08-form-filler/index.js
```

This demonstrates:
- Typing in text fields
- Selecting dropdown options
- Checking checkboxes
- Submitting the form

### Task: Monitor All Network Requests

```bash
node apps/15-request-watcher/index.js
```

This shows:
- Every HTTP request the page makes
- URLs, timing, response sizes
- Helpful for debugging websites

### Task: Extract All Links from a Page

```bash
node apps/05-content-scraper/index.js
```

This extracts:
- All links with their text and URLs
- All images with their sources
- Tables as structured data

---

## 9. Troubleshooting Common Problems

### Problem: "Cannot connect" or "Connection refused"

**What you see:**
```
Error: connect ECONNREFUSED 127.0.0.1:9222
```

**What it means:** Chrome isn't running with debugging enabled.

**Solution:**
1. Close ALL Chrome windows (check system tray too)
2. Start Chrome with the special command:
   ```
   chrome --remote-debugging-port=9222
   ```
3. Try running the app again

### Problem: "No page found"

**What you see:**
```
Error: No page target found
```

**What it means:** Chrome has no tabs open.

**Solution:**
Open a new tab in Chrome (any website is fine), then try again.

### Problem: "node is not recognized"

**What you see:**
```
'node' is not recognized as an internal or external command
```

**What it means:** Node.js isn't installed or isn't in your system PATH.

**Solution:**
1. Download and install Node.js from https://nodejs.org
2. Close and reopen your terminal
3. Try `node --version` to verify

### Problem: "Cannot find module 'ws'"

**What you see:**
```
Error: Cannot find module 'ws'
```

**What it means:** Dependencies aren't installed.

**Solution:**
```bash
cd browser-use
npm install
```

### Problem: Screenshots are black or empty

**What it means:** The page might not be visible or loaded.

**Solution:**
1. Make sure Chrome window isn't minimized
2. Wait longer for the page to load
3. Check if the website is accessible

---

## 10. Glossary of Terms

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface - a way for programs to communicate |
| **Async/Await** | JavaScript way to handle operations that take time |
| **Browser** | Program for viewing websites (Chrome, Firefox, Safari) |
| **CDP** | Chrome DevTools Protocol - the "remote control" for Chrome |
| **CLI** | Command Line Interface - text-based way to run programs |
| **CSS** | Cascading Style Sheets - code that styles web pages |
| **CSS Selector** | Pattern to find elements (e.g., `#id`, `.class`, `button`) |
| **DOM** | Document Object Model - structured representation of a web page |
| **Event** | Notification that something happened (e.g., "page loaded") |
| **HTML** | HyperText Markup Language - code that structures web pages |
| **HTTP** | Protocol for transferring web pages |
| **JavaScript** | Programming language that runs in browsers and Node.js |
| **JSON** | JavaScript Object Notation - data format like `{"key": "value"}` |
| **Node.js** | Runtime that lets you run JavaScript outside a browser |
| **npm** | Node Package Manager - tool to install JavaScript libraries |
| **Port** | Number identifying a communication endpoint (9222 for CDP) |
| **Promise** | JavaScript object representing future completion of an operation |
| **Selector** | Pattern to identify HTML elements |
| **Terminal** | Text interface for running commands (Command Prompt on Windows) |
| **URL** | Web address (e.g., https://example.com) |
| **WebSocket** | Technology for continuous two-way communication |

---

## What's Next?

Now that you understand the basics, try the [Quick Start Guide](QUICK_START.md) which has 10 hands-on tutorials that build your skills progressively.

For deeper technical understanding, read the [Developer Guide](DEVELOPER_GUIDE.md).
