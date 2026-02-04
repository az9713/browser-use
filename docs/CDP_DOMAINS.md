# CDP Domains Quick Reference

This document provides a quick reference of all Chrome DevTools Protocol domains used across the 35 showcase applications.

## Domains Overview

| Domain | Description | Key Use Cases |
|--------|-------------|---------------|
| **Accessibility** | Accessibility tree | A11y auditing, element lookup by role |
| **Animation** | CSS animations | Pause, play, control animations |
| **Browser** | Browser management | Get version, window control |
| **CSS** | Stylesheet manipulation | Get/set styles, coverage tracking |
| **DOM** | DOM tree | Query elements, get attributes |
| **Emulation** | Device simulation | Mobile emulation, geolocation |
| **Fetch** | Request interception | Mock APIs, modify responses |
| **HeapProfiler** | Memory profiling | Find memory leaks |
| **Input** | User input | Mouse clicks, keyboard events |
| **Log** | Browser logs | Capture log entries |
| **Network** | HTTP traffic | Monitor requests, cookies |
| **Overlay** | Visual overlays | Highlight elements, show info |
| **Page** | Page lifecycle | Navigate, screenshot, events |
| **Performance** | Performance metrics | FPS, memory, timing |
| **Profiler** | JS profiling | Code coverage |
| **Runtime** | JS execution | Evaluate code, console |
| **Storage** | Browser storage | Clear data, cookies |
| **Target** | Browser targets | Manage tabs, attach |
| **Tracing** | Performance tracing | Detailed timing data |

## Domain Usage by App

### Navigation & Page Control
| App | Domains |
|-----|---------|
| 01-navigator | Page, Target, Network |
| 02-tab-orchestrator | Target, Browser, Page |

### Finding & Reading Content
| App | Domains |
|-----|---------|
| 03-dom-explorer | DOM, Runtime, Page |
| 04-accessibility-reader | Accessibility, DOM, Page |
| 05-content-scraper | DOM, Runtime, Page |

### Interacting with Pages
| App | Domains |
|-----|---------|
| 06-clicker | Input, DOM, Runtime |
| 07-typer | Input, Page, DOM |
| 08-form-filler | Input, DOM, Runtime |
| 09-scroller | Input, Runtime |
| 10-drag-drop | Input, DOM |

### Visual Capture
| App | Domains |
|-----|---------|
| 11-screenshotter | Page, DOM, Emulation |
| 12-screen-recorder | Page |

### JavaScript & Console
| App | Domains |
|-----|---------|
| 13-js-executor | Runtime, Page |
| 14-console-monitor | Runtime, Log |

### Network & Requests
| App | Domains |
|-----|---------|
| 15-request-watcher | Network, Page |
| 16-api-mocker | Fetch, Page |

### Browser Context
| App | Domains |
|-----|---------|
| 17-cookie-manager | Network, Storage |
| 18-device-emulator | Emulation, Network |
| 19-dialog-handler | Page, Runtime |

### Waiting & Synchronization
| App | Domains |
|-----|---------|
| 20-wait-strategies | Page, DOM, Network, Runtime |

### CDP Superpowers
| App | Domains |
|-----|---------|
| 21-ui-themer | CSS, DOM, Runtime, Page |
| 22-accessibility-auditor | Accessibility, DOM, CSS, Overlay |
| 23-performance-xray | Performance, Runtime, Overlay |
| 24-reading-mode | DOM, Runtime, CSS |
| 25-layout-visualizer | CSS, DOM, Overlay |
| 26-animation-controller | Animation, Runtime |
| 27-design-tokens | CSS, DOM |
| 28-network-waterfall | Network |
| 29-memory-hunter | HeapProfiler, Runtime |
| 30-responsive-matrix | Emulation, Page |
| 31-dead-code | CSS, Profiler |
| 32-dom-time-machine | DOM, Runtime |
| 33-element-highlighter | Overlay, DOM, CSS |
| 34-page-diff | DOM, CSS, Page |
| 35-ai-design-critic | CSS, DOM, Accessibility |

## Common Commands Reference

### Page Domain
```javascript
// Navigation
Page.navigate({ url })
Page.reload({ ignoreCache })
Page.stopLoading()
Page.getNavigationHistory()
Page.navigateToHistoryEntry({ entryId })

// Screenshots
Page.captureScreenshot({ format, quality, clip })
Page.getLayoutMetrics()

// Scripts
Page.addScriptToEvaluateOnNewDocument({ source })
Page.removeScriptToEvaluateOnNewDocument({ identifier })

// Events
Page.loadEventFired
Page.domContentEventFired
Page.frameNavigated
Page.javascriptDialogOpening
```

### DOM Domain
```javascript
// Document
DOM.getDocument({ depth })
DOM.querySelector({ nodeId, selector })
DOM.querySelectorAll({ nodeId, selector })

// Content
DOM.getOuterHTML({ nodeId })
DOM.getAttributes({ nodeId })
DOM.getBoxModel({ nodeId })

// Manipulation
DOM.setFileInputFiles({ nodeId, files })
DOM.resolveNode({ nodeId }) // -> objectId
```

### Runtime Domain
```javascript
// Evaluation
Runtime.evaluate({ expression, returnByValue, awaitPromise })
Runtime.callFunctionOn({ objectId, functionDeclaration })

// Objects
Runtime.getProperties({ objectId })
Runtime.releaseObject({ objectId })

// Events
Runtime.consoleAPICalled
Runtime.exceptionThrown
```

### Network Domain
```javascript
// Control
Network.enable()
Network.setCacheDisabled({ cacheDisabled })

// Cookies
Network.getAllCookies()
Network.setCookie({ name, value, domain })
Network.deleteCookies({ name, url })
Network.clearBrowserCookies()

// Events
Network.requestWillBeSent
Network.responseReceived
Network.loadingFinished
Network.loadingFailed
```

### Input Domain
```javascript
// Mouse
Input.dispatchMouseEvent({
  type,       // 'mousePressed', 'mouseReleased', 'mouseMoved', 'mouseWheel'
  x, y,
  button,     // 'left', 'right', 'middle'
  clickCount,
  modifiers
})

// Keyboard
Input.dispatchKeyEvent({
  type,       // 'keyDown', 'keyUp', 'char'
  key, code,
  modifiers
})
Input.insertText({ text })
```

### Emulation Domain
```javascript
// Device
Emulation.setDeviceMetricsOverride({
  width, height,
  deviceScaleFactor,
  mobile
})
Emulation.clearDeviceMetricsOverride()

// User Agent
Emulation.setUserAgentOverride({ userAgent })

// Location
Emulation.setGeolocationOverride({ latitude, longitude })
Emulation.setTimezoneOverride({ timezoneId })

// Media
Emulation.setEmulatedMedia({ features })
```

### CSS Domain
```javascript
// Styles
CSS.getMatchedStylesForNode({ nodeId })
CSS.getComputedStyleForNode({ nodeId })
CSS.getInlineStylesForNode({ nodeId })

// Coverage
CSS.startRuleUsageTracking()
CSS.stopRuleUsageTracking()
```

### Fetch Domain
```javascript
// Interception
Fetch.enable({ patterns })
Fetch.disable()

// Handling
Fetch.fulfillRequest({ requestId, responseCode, body })
Fetch.failRequest({ requestId, errorReason })
Fetch.continueRequest({ requestId })

// Events
Fetch.requestPaused
```

### Accessibility Domain
```javascript
Accessibility.enable()
Accessibility.getFullAXTree({ depth })
Accessibility.queryAXTree({ nodeId, role, accessibleName })
Accessibility.getPartialAXTree({ nodeId })
```

### Performance Domain
```javascript
Performance.enable()
Performance.getMetrics()
Performance.disable()
```

### Overlay Domain
```javascript
// Highlighting
Overlay.highlightNode({ nodeId, highlightConfig })
Overlay.hideHighlight()

// Grid/Flex
Overlay.setShowGridOverlays({ gridNodeHighlightConfigs })
Overlay.setShowFlexOverlays({ flexNodeHighlightConfigs })

// Inspect
Overlay.setInspectMode({ mode, highlightConfig })
```

## HTTP Endpoints

Chrome also exposes HTTP endpoints for target management:

| Endpoint | Description |
|----------|-------------|
| `GET /json/list` | List all targets |
| `GET /json/version` | Browser version info |
| `GET /json/new?url` | Create new tab |
| `GET /json/activate/{id}` | Activate tab |
| `GET /json/close/{id}` | Close tab |

## Resources

- [Official CDP Documentation](https://chromedevtools.github.io/devtools-protocol/)
- [CDP Viewer](https://vanilla.aslushnikov.com/)
- [Puppeteer (high-level CDP wrapper)](https://pptr.dev/)
