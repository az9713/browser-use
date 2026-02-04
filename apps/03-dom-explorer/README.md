# App 03: DOM Explorer

Explore and inspect DOM elements using Chrome DevTools Protocol.

## Features

- Get document root node
- Query elements with CSS selectors
- Query all matching elements
- Get element text content
- Get element attributes
- Get outer/inner HTML
- Get element box model (dimensions/position)
- Get computed styles
- XPath queries

## CDP Domains Used

- **DOM** - DOM tree inspection
- **Runtime** - JavaScript evaluation for property access
- **Page** - Navigation

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `DOM.enable` | Enable DOM domain |
| `DOM.getDocument` | Get document root |
| `DOM.querySelector` | Find single element |
| `DOM.querySelectorAll` | Find all matching elements |
| `DOM.getOuterHTML` | Get element's outer HTML |
| `DOM.getAttributes` | Get element attributes |
| `DOM.describeNode` | Get detailed node info |
| `DOM.getBoxModel` | Get element dimensions |
| `DOM.resolveNode` | Convert nodeId to objectId |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the explorer
node apps/03-dom-explorer/index.js
```

## Example Output

```
=== CDP DOM Explorer Demo ===

[DOMExplorer] DOM, Page, and Runtime domains enabled

--- Navigating to example.com ---

--- Document Info ---
Document URL: https://example.com/
Base URL: https://example.com/

--- Query Selectors ---
<h1> text: "Example Domain"
Found 2 <p> elements
  - "This domain is for use in illustrative examples..."
  - "More information..."

--- Links on Page ---
  Link: "More information..." -> https://www.iana.org/domains/example

--- Element Details ---
Body node name: BODY
Body child count: 1
Body dimensions: 1200x800

--- Outer HTML (first div) ---
<div><h1>Example Domain</h1><p>This domain is...

--- Computed Styles (h1) ---
  font-size: 38px
  font-weight: 400
  color: rgb(0, 0, 0)
  margin: 21.44px 0px

=== Demo Complete ===
```

## API Reference

### `DOMExplorer` Class

```javascript
const explorer = new DOMExplorer(cdpClient);

// Enable required domains
await explorer.enable();

// Get document root
const doc = await explorer.getDocument();
// doc.nodeId, doc.documentURL, doc.baseURL

// Query single element
const nodeId = await explorer.querySelector('h1');

// Query all matching
const nodeIds = await explorer.querySelectorAll('p');

// Get element content
const text = await explorer.getTextContent(nodeId);
const html = await explorer.getOuterHTML(nodeId);
const inner = await explorer.getInnerHTML(nodeId);

// Get attributes
const attrs = await explorer.getAttributes(nodeId);
// { id: 'main', class: 'container', ... }

// Get box model
const box = await explorer.getBoxModel(nodeId);
// { width, height, content, padding, border, margin }

// Get computed styles
const styles = await explorer.getComputedStyles(nodeId);
// { 'font-size': '16px', 'color': 'rgb(0,0,0)', ... }

// Describe node
const info = await explorer.describeNode(nodeId);
// { nodeName, localName, childNodeCount, attributes, ... }

// XPath query
const nodes = await explorer.findByXPath('//div[@class="main"]');
```

## Node IDs vs Object IDs

CDP uses two types of identifiers:

- **nodeId** - Integer ID for DOM nodes (used by DOM domain)
- **objectId** - String ID for JS objects (used by Runtime domain)

To convert between them:
```javascript
// nodeId -> objectId
const { object } = await client.send('DOM.resolveNode', { nodeId });
const objectId = object.objectId;

// objectId -> nodeId
const { nodeId } = await client.send('DOM.requestNode', { objectId });
```

## Tips

- Always call `DOM.getDocument` first to get the root nodeId
- nodeId of 0 means "not found" from querySelector
- Use `DOM.resolveNode` + `Runtime.callFunctionOn` for complex property access
- Release objects with `Runtime.releaseObject` to prevent memory leaks
