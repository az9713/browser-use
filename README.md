# browser-use-toolbox

**35 ready-to-use browser automation primitives for agentic workflows.**

Build AI agents that browse the web. This toolkit provides the low-level building blocks—navigation, clicking, typing, screenshots, and more—that power computer-use and browser-agent systems like Claude's computer use, Gemini, and other AI agents.

---

## 🤖 Why browser-use-toolbox?

Modern AI agents need to interact with the web like humans do. This project provides:

- **35 standalone modules** — Each demonstrates a specific browser capability
- **Zero abstraction overhead** — Direct Chrome DevTools Protocol (CDP), no Puppeteer/Playwright
- **Agentic-ready patterns** — Designed for integration into AI agent loops
- **Copy-paste friendly** — Lift any module into your agent's toolkit

### Perfect for Building

- 🤖 **AI Browser Agents** — Give your LLM the ability to browse, click, and type
- 🔍 **Web Research Agents** — Automated data extraction and monitoring
- 🧪 **Testing Agents** — Visual regression, accessibility audits
- 📸 **Screenshot Agents** — Capture and analyze web pages
- 🔄 **Automation Workflows** — Form filling, navigation sequences

---

## ⚡ Quick Start (5 minutes)

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Install dependencies
```bash
cd browser-use-toolbox
npm install
```

### 3. Start Chrome in debug mode

**⚠️ You MUST kill all Chrome processes first, then start with special flags:**

**Windows (Git Bash):**
```bash
taskkill //F //IM chrome.exe
"/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:/temp/chrome-debug"
```

**Windows (Command Prompt):**
```cmd
taskkill /F /IM chrome.exe
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"
```

**macOS:**
```bash
pkill -f "Google Chrome"
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
```

**Linux:**
```bash
pkill chrome
google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
```

### 4. Verify Chrome is ready
Open `http://localhost:9222/json/version` in that Chrome window. You should see JSON output.

### 5. Run your first app
In a **new terminal** (keep Chrome running):
```bash
node apps/01-navigator/index.js
```

🎉 Watch Chrome navigate automatically!

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[Setup Guide](docs/SETUP.md)** | Detailed setup with troubleshooting |
| **[Quick Start Tutorials](docs/QUICK_START.md)** | 10 hands-on tutorials |
| **[User Guide](docs/USER_GUIDE.md)** | Complete guide for beginners |
| **[Developer Guide](docs/DEVELOPER_GUIDE.md)** | Technical deep-dive |
| **[CDP Reference](docs/CDP_DOMAINS.md)** | CDP commands reference |

---

## 🛠️ The 35 Primitives

Each module is a self-contained building block for agentic browser control.

### Navigation & Page Control
| Module | Agentic Use Case |
|--------|------------------|
| [01-navigator](apps/01-navigator/) | Navigate to URLs, go back/forward — *core agent navigation* |
| [02-tab-orchestrator](apps/02-tab-orchestrator/) | Multi-tab workflows — *parallel browsing agents* |

### Perception (Reading the Page)
| Module | Agentic Use Case |
|--------|------------------|
| [03-dom-explorer](apps/03-dom-explorer/) | Query elements by selector — *find interactive elements* |
| [04-accessibility-reader](apps/04-accessibility-reader/) | Read page structure — *understand page semantics* |
| [05-content-scraper](apps/05-content-scraper/) | Extract links, text, tables — *gather information* |

### Action (Interacting with Pages)
| Module | Agentic Use Case |
|--------|------------------|
| [06-clicker](apps/06-clicker/) | Click buttons and links — *take actions* |
| [07-typer](apps/07-typer/) | Type text, use keyboard — *fill inputs* |
| [08-form-filler](apps/08-form-filler/) | Complete forms — *submit data* |
| [09-scroller](apps/09-scroller/) | Scroll to reveal content — *load more items* |
| [10-drag-drop](apps/10-drag-drop/) | Drag elements — *rearrange UI* |

### Vision (Visual Capture)
| Module | Agentic Use Case |
|--------|------------------|
| [11-screenshotter](apps/11-screenshotter/) | Capture screenshots — *visual verification* |
| [12-screen-recorder](apps/12-screen-recorder/) | Record video — *audit trails* |

### Execution (JavaScript & Console)
| Module | Agentic Use Case |
|--------|------------------|
| [13-js-executor](apps/13-js-executor/) | Run JavaScript in page — *custom interactions* |
| [14-console-monitor](apps/14-console-monitor/) | Capture console output — *debug and monitor* |

### Network (HTTP Layer)
| Module | Agentic Use Case |
|--------|------------------|
| [15-request-watcher](apps/15-request-watcher/) | Monitor HTTP requests — *track API calls* |
| [16-api-mocker](apps/16-api-mocker/) | Intercept and mock APIs — *test edge cases* |

### Context (Browser State)
| Module | Agentic Use Case |
|--------|------------------|
| [17-cookie-manager](apps/17-cookie-manager/) | Manage cookies — *handle sessions* |
| [18-device-emulator](apps/18-device-emulator/) | Emulate mobile devices — *responsive testing* |
| [19-dialog-handler](apps/19-dialog-handler/) | Handle alerts/confirms — *dismiss popups* |

### Synchronization
| Module | Agentic Use Case |
|--------|------------------|
| [20-wait-strategies](apps/20-wait-strategies/) | Wait for elements/events — *reliable timing* |

### Advanced Capabilities
| Module | Agentic Use Case |
|--------|------------------|
| [21-ui-themer](apps/21-ui-themer/) | Inject CSS themes — *modify appearance* |
| [22-accessibility-auditor](apps/22-accessibility-auditor/) | Audit accessibility — *quality checks* |
| [23-performance-xray](apps/23-performance-xray/) | Measure performance — *optimization* |
| [24-reading-mode](apps/24-reading-mode/) | Extract article content — *clean text extraction* |
| [25-layout-visualizer](apps/25-layout-visualizer/) | Visualize CSS layout — *understand structure* |
| [26-animation-controller](apps/26-animation-controller/) | Control animations — *stable screenshots* |
| [27-design-tokens](apps/27-design-tokens/) | Extract design tokens — *analyze styles* |
| [28-network-waterfall](apps/28-network-waterfall/) | Visualize request timing — *performance analysis* |
| [29-memory-hunter](apps/29-memory-hunter/) | Find memory leaks — *debugging* |
| [30-responsive-matrix](apps/30-responsive-matrix/) | Multi-breakpoint screenshots — *responsive audit* |
| [31-dead-code](apps/31-dead-code/) | Find unused CSS/JS — *optimization* |
| [32-dom-time-machine](apps/32-dom-time-machine/) | Track DOM changes — *mutation monitoring* |
| [33-element-highlighter](apps/33-element-highlighter/) | Highlight elements — *visual debugging* |
| [34-page-diff](apps/34-page-diff/) | Compare page versions — *change detection* |
| [35-ai-design-critic](apps/35-ai-design-critic/) | Analyze design quality — *automated review* |

---

## 🤖 Integrating with AI Agents

Each module exports reusable classes. Example integration with an AI agent loop:

```javascript
import { Clicker } from './apps/06-clicker/index.js';
import { Typer } from './apps/07-typer/index.js';
import { Screenshotter } from './apps/11-screenshotter/index.js';
import { connectToFirstPage } from './shared/target-manager.js';

async function agentAction(action, params) {
  const { client } = await connectToFirstPage();

  switch (action) {
    case 'click':
      const clicker = new Clicker(client);
      await clicker.click(params.selector);
      break;
    case 'type':
      const typer = new Typer(client);
      await typer.type(params.text);
      break;
    case 'screenshot':
      const screenshotter = new Screenshotter(client);
      return await screenshotter.captureViewport();
  }
}

// AI agent can now call: agentAction('click', { selector: 'button.submit' })
```

---

## ❓ Troubleshooting

**"Connection refused" when running apps?**

Chrome isn't in debug mode. You must:
1. Kill ALL Chrome processes first
2. Start Chrome with both `--remote-debugging-port=9222` AND `--user-data-dir="..."`
3. Verify at `http://localhost:9222/json/version`

See [Setup Guide](docs/SETUP.md) for detailed instructions.

---

## 📖 Learn More

- [Chrome DevTools Protocol Docs](https://chromedevtools.github.io/devtools-protocol/)
- [CDP Domains Reference](docs/CDP_DOMAINS.md)

---

## License

MIT
