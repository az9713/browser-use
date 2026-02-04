# Setup Guide

**Get Chrome ready for CDP in 3 simple steps.** This guide eliminates all guesswork.

---

## Why This Setup is Needed

Chrome has a "remote debugging" mode that allows external programs to control it. However:

1. **Chrome must be completely closed first** - If Chrome is already running, it ignores the debug flag
2. **A separate profile folder is required** - Recent Chrome versions require `--user-data-dir` for security

---

## Step 1: Install Prerequisites

### Node.js

Download and install from: https://nodejs.org (choose LTS version)

Verify installation:
```bash
node --version
```
You should see `v18.x.x` or higher.

### Google Chrome

Download from: https://google.com/chrome (if not already installed)

---

## Step 2: Install Project Dependencies

Open a terminal in the project folder and run:

```bash
cd browser-use
npm install
```

---

## Step 3: Start Chrome in Debug Mode

### ⚠️ CRITICAL: You MUST Kill All Chrome Processes First

**Why?** If any Chrome process is running, your new Chrome window will join that existing process and **ignore** the debug flag. This is the #1 cause of "connection refused" errors.

---

### Windows Setup

**Open Git Bash, Command Prompt, or PowerShell and run these commands:**

#### Step 3a: Kill all Chrome processes

```bash
# Git Bash / MINGW64:
taskkill //F //IM chrome.exe

# Command Prompt or PowerShell:
taskkill /F /IM chrome.exe
```

**Expected output:**
```
SUCCESS: The process "chrome.exe" with PID 1234 has been terminated.
SUCCESS: The process "chrome.exe" with PID 5678 has been terminated.
...
```

If you see `ERROR: The process "chrome.exe" not found.` - that's fine! It means Chrome wasn't running.

#### Step 3b: Start Chrome with debug port

**Git Bash / MINGW64:**
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:/temp/chrome-debug"
```

**Command Prompt:**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"
```

**PowerShell:**
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"
```

---

### macOS Setup

**Open Terminal and run:**

```bash
# Step 3a: Kill all Chrome processes
pkill -f "Google Chrome"

# Step 3b: Start Chrome with debug port
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
```

---

### Linux Setup

**Open Terminal and run:**

```bash
# Step 3a: Kill all Chrome processes
pkill chrome

# Step 3b: Start Chrome with debug port
google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
```

---

## Step 4: Verify Setup

In the Chrome window that just opened, go to:

```
http://localhost:9222/json/version
```

### ✅ Success looks like this:

```json
{
  "Browser": "Chrome/120.0.6099.109",
  "Protocol-Version": "1.3",
  "User-Agent": "Mozilla/5.0...",
  "V8-Version": "12.0.267.8",
  "WebKit-Version": "537.36...",
  "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
}
```

### ❌ If you see "This site can't be reached":

1. You didn't kill all Chrome processes first → Go back to Step 3a
2. Chrome was running in background/system tray → Check Task Manager, end all Chrome processes
3. Wrong command syntax → Copy-paste exactly as shown above

---

## Step 5: Run Your First App

Open a **new terminal window** (keep Chrome running!) and run:

```bash
cd browser-use
node apps/01-navigator/index.js
```

Watch Chrome navigate automatically!

---

## Quick Reference Card

**Every time you want to use CDP:**

```bash
# 1. Kill Chrome
taskkill //F //IM chrome.exe                    # Windows Git Bash
taskkill /F /IM chrome.exe                      # Windows CMD/PowerShell
pkill -f "Google Chrome"                         # macOS
pkill chrome                                     # Linux

# 2. Start Chrome with debug port
# Windows Git Bash:
"/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:/temp/chrome-debug"

# macOS:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"

# Linux:
google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"

# 3. Verify: http://localhost:9222/json/version

# 4. Run apps in a separate terminal
node apps/01-navigator/index.js
```

---

## Create a Shortcut (Windows - Recommended)

To avoid typing these commands every time:

1. Right-click Desktop → **New** → **Shortcut**
2. Paste this as the location:
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"
   ```
3. Click **Next**
4. Name it: `Chrome Debug Mode`
5. Click **Finish**

**Before using the shortcut:** Always close all Chrome windows first (or run `taskkill /F /IM chrome.exe`).

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Connection refused" | Chrome not in debug mode | Kill all Chrome, restart with debug flag |
| "Connection refused" | Chrome was already running | Kill ALL Chrome processes first |
| "user-data-dir required" | Missing flag | Add `--user-data-dir="..."` to command |
| "chrome.exe not found" | Wrong path | Check Chrome installation path |
| App hangs | No Chrome tabs open | Open at least one tab in Chrome |

---

## FAQ

**Q: Do I need to kill Chrome every time?**

A: Yes, if Chrome is already running normally. The debug flag only works when Chrome starts fresh.

**Q: Can I use my regular Chrome profile?**

A: No, the `--user-data-dir` flag creates a separate profile. Your bookmarks and extensions won't be there, but your regular Chrome profile stays untouched.

**Q: Why a separate profile?**

A: Security. Chrome requires this to prevent malicious programs from secretly controlling your browser with your real credentials.

**Q: Can I run regular Chrome at the same time?**

A: Yes! The debug Chrome uses a different profile folder, so it's completely separate from your regular Chrome.
