# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**browser-use-toolbox** — 35 standalone Node.js modules providing browser automation primitives for agentic workflows and computer-use systems.

This toolkit is designed for building AI agents that interact with the web. Each module demonstrates a specific browser capability (clicking, typing, screenshots, etc.) that can be integrated into agent loops.

**Key Technologies:**
- Node.js 18+ with ES modules
- WebSocket (`ws` package) for CDP communication
- Chrome DevTools Protocol (CDP)

## Quick Start Commands

```bash
# Install dependencies
npm install

# CRITICAL: Start Chrome in debug mode
# You MUST kill all Chrome processes first, then use --user-data-dir flag

# Windows (Git Bash):
taskkill //F //IM chrome.exe
"/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:/temp/chrome-debug"

# Windows (Command Prompt):
taskkill /F /IM chrome.exe
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"

# macOS:
pkill -f "Google Chrome"
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"

# Linux:
pkill chrome
google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"

# Verify: http://localhost:9222/json/version should show JSON

# Run any app (in a separate terminal)
node apps/01-navigator/index.js
```

## Why Kill Chrome First?

If Chrome is already running, new instances join the existing process and **ignore** command-line flags like `--remote-debugging-port`. The `--user-data-dir` flag is required by recent Chrome versions for security.

## Project Structure

```
browser-use-toolbox/
├── package.json           # Root package (ES modules, "ws" dependency)
├── shared/                # Core utilities used by all apps
│   ├── cdp-client.js      # WebSocket CDP client
│   ├── target-manager.js  # Target discovery/connection
│   ├── wait-helpers.js    # Wait patterns
│   └── utils.js           # Helper functions
├── apps/                  # 35 standalone modules (01-35)
└── docs/                  # Documentation
    ├── SETUP.md           # Detailed setup guide
    ├── QUICK_START.md     # 10 tutorials
    ├── USER_GUIDE.md      # Complete user guide
    ├── DEVELOPER_GUIDE.md # Technical deep-dive
    └── CDP_DOMAINS.md     # CDP reference
```

## Architecture Pattern

All modules follow this pattern:
```javascript
import { connectToFirstPage } from '../../shared/target-manager.js';

class ModuleName {
  constructor(client) { this.client = client; }
  async enable() {
    await this.client.send('Domain.enable');
  }
}

async function main() {
  const { client } = await connectToFirstPage();
  const module = new ModuleName(client);
  await module.enable();
  // ... use module
  client.close();
}

main();
export { ModuleName };  // Export for agent integration
```

## Agentic Integration

Each module exports reusable classes for integration into AI agent loops:

```javascript
import { Clicker } from './apps/06-clicker/index.js';
import { Typer } from './apps/07-typer/index.js';
import { Screenshotter } from './apps/11-screenshotter/index.js';

// Agent can compose these primitives to perform complex web tasks
```

## Common CDP Domains

| Domain | Purpose | Key Commands |
|--------|---------|--------------|
| Page | Navigation, screenshots | `Page.navigate`, `Page.captureScreenshot` |
| DOM | Element queries | `DOM.getDocument`, `DOM.querySelector` |
| Runtime | JS execution | `Runtime.evaluate` |
| Input | Mouse/keyboard | `Input.dispatchMouseEvent`, `Input.dispatchKeyEvent` |
| Network | HTTP monitoring | `Network.enable`, events |
| Fetch | Request interception | `Fetch.enable`, `Fetch.fulfillRequest` |

## Development Guidelines

- **Dependencies**: Only `ws` for WebSocket; no Puppeteer/Playwright
- **ES Modules**: Uses `import/export`, `"type": "module"` in package.json
- **Error Handling**: Check for `nodeId === 0` (element not found)
- **Timeouts**: Default 30000ms; configurable via options
- **Exports**: Each module should export its main class for agent integration

## Adding New Modules

1. Create folder: `apps/XX-module-name/`
2. Create `index.js` following the pattern above
3. Export the main class for reuse
4. Create `README.md` documenting CDP domains used
5. Import shared utilities from `../../shared/`
