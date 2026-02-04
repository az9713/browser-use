# App 04: Accessibility Tree Reader

Read and analyze the accessibility tree using Chrome DevTools Protocol.

## Features

- Get full accessibility tree
- Find elements by ARIA role
- Find elements by accessible name
- Get element's accessible properties
- Build hierarchical tree structure
- Basic accessibility audit

## CDP Domains Used

- **Accessibility** - Accessibility tree inspection
- **DOM** - For node references
- **Page** - Navigation

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Accessibility.enable` | Enable accessibility domain |
| `Accessibility.getFullAXTree` | Get complete accessibility tree |
| `Accessibility.queryAXTree` | Query tree with criteria |
| `Accessibility.getPartialAXTree` | Get tree for specific node |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the reader
node apps/04-accessibility-reader/index.js
```

## Example Output

```
=== CDP Accessibility Reader Demo ===

[A11yReader] Accessibility, Page, and DOM domains enabled

--- Navigating to example page ---

--- Accessibility Tree ---
[RootWebArea] "Example Domain"
  [heading] "Example Domain"
  [paragraph]
    [StaticText] "This domain is for use..."
  [paragraph]
    [link] "More information..."

--- Find by Role: link ---
  [link] "More information..."

--- Find by Role: heading ---
  [heading] "Example Domain"

--- Interactive Elements ---
  [link] "More information..."

--- Accessibility Audit ---
  No accessibility issues found!

=== Demo Complete ===
```

## API Reference

### `AccessibilityReader` Class

```javascript
const reader = new AccessibilityReader(cdpClient);

// Enable required domains
await reader.enable();

// Get full accessibility tree
const nodes = await reader.getFullAXTree({ depth: 5 });

// Find by role
const buttons = await reader.findByRole('button');
const links = await reader.findByRole('link');

// Find by accessible name
const submitBtn = await reader.findByName('Submit');

// Get interactive elements
const interactive = await reader.getInteractiveElements();

// Parse a node for easier access
const parsed = reader.parseAXNode(node);
// { nodeId, role, name, description, value, properties }

// Build tree structure from flat nodes
const tree = reader.buildTree(nodes);

// Print tree to console
reader.printTree(tree);

// Basic accessibility audit
const issues = await reader.auditAccessibility();
// [{ type, message, nodeId }]
```

## ARIA Roles

Common roles you can query for:

| Role | Description |
|------|-------------|
| `button` | Clickable buttons |
| `link` | Hyperlinks |
| `textbox` | Text input fields |
| `checkbox` | Checkboxes |
| `radio` | Radio buttons |
| `combobox` | Dropdowns/select |
| `listbox` | List selection |
| `menu` | Menus |
| `menuitem` | Menu items |
| `heading` | Headings (h1-h6) |
| `image` | Images |
| `table` | Tables |
| `row` | Table rows |
| `cell` | Table cells |

## AX Node Structure

Each accessibility node contains:

```javascript
{
  nodeId: "123",
  role: { type: "role", value: "button" },
  name: { type: "computedString", value: "Submit" },
  description: { type: "computedString", value: "..." },
  value: { type: "string", value: "..." },
  properties: [
    { name: "focusable", value: { type: "boolean", value: true } },
    { name: "focused", value: { type: "boolean", value: false } },
    // ...
  ],
  childIds: ["124", "125"],
  parentId: "122",
  ignored: false
}
```

## Accessibility Audit Checks

The built-in audit checks for:

- Images without alt text
- Buttons without accessible names
- Links without accessible names
- Form inputs without labels

## Tips

- The accessibility tree is a simplified view of the DOM
- Some elements are "ignored" (not in the tree)
- Accessible name comes from: aria-label, aria-labelledby, label element, or content
- Use this for finding elements by their semantic meaning
