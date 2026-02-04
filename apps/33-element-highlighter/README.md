# App 33: Element Highlighter

Interactive element inspection with visual highlighting using Chrome DevTools Protocol.

## Features

- Visual element highlighting
- Box model overlay (content, padding, border, margin)
- Computed style inspection
- Selector path generation
- Multi-element highlighting
- Grid/Flexbox overlays
- Interactive inspect mode
- Custom color schemes

## CDP Domains Used

- **Overlay** - Visual highlighting
- **DOM** - Element access
- **CSS** - Style computation
- **Runtime** - JavaScript evaluation

## Highlight Colors

### Default Box Model
- **Content**: Blue (rgba(111, 168, 220, 0.66))
- **Padding**: Green (rgba(147, 196, 125, 0.55))
- **Border**: Yellow (rgba(255, 229, 153, 0.66))
- **Margin**: Orange (rgba(246, 178, 107, 0.66))

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/33-element-highlighter/index.js
```

## API Reference

```javascript
const highlighter = new ElementHighlighter(client);
await highlighter.enable();

// Highlight element
await highlighter.highlightElement(selector, config);

// Get element details
const info = await highlighter.getElementInfo(selector);
highlighter.printElementInfo(info);

// Selector path
const path = await highlighter.getSelectorPath(selector);
// Returns: { fullPath, shortPath }

// Multiple elements
await highlighter.highlightMultiple([sel1, sel2, sel3], colors);

// Custom rectangle
await highlighter.highlightRect(x, y, width, height, color);

// Layout overlays
await highlighter.showGridOverlay(selector);
await highlighter.showFlexOverlay(selector);

// Interactive mode
await highlighter.enableInspectMode();
await highlighter.disableInspectMode();

// Clear
await highlighter.clearHighlight();
```

## Highlight Configuration

```javascript
const config = {
  showInfo: true,           // Show element info tooltip
  showStyles: true,         // Show computed styles
  showRulers: true,         // Show measurement rulers
  showExtensionLines: true, // Show extension lines
  contentColor: { r: 111, g: 168, b: 220, a: 0.66 },
  paddingColor: { r: 147, g: 196, b: 125, a: 0.55 },
  borderColor: { r: 255, g: 229, b: 153, a: 0.66 },
  marginColor: { r: 246, g: 178, b: 107, a: 0.66 }
};

await highlighter.highlightElement('div', config);
```

## Element Info

```javascript
{
  nodeId: 123,
  nodeName: 'DIV',
  attributes: {
    id: 'container',
    class: 'main-content active',
    'data-test': 'value'
  },
  boxModel: {
    content: [x1, y1, x2, y2, x3, y3, x4, y4],
    padding: [...],
    border: [...],
    margin: [...]
  },
  computedStyles: [
    { name: 'display', value: 'flex' },
    { name: 'width', value: '300px' },
    { name: 'color', value: 'rgb(0, 0, 0)' }
  ]
}
```

## Selector Path

```javascript
{
  fullPath: 'html > body > div#app > main.content > section.hero > h1.title:nth-child(1)',
  shortPath: 'section.hero > h1.title:nth-child(1)'
}
```

## Grid Overlay

```javascript
await highlighter.showGridOverlay('.grid-container');

// Configuration:
// - Grid border: Red solid
// - Row lines: Dark red dashed
// - Column lines: Purple dashed
// - Row gaps: Green semi-transparent
// - Column gaps: Blue semi-transparent
// - Line numbers: Shown
```

## Flexbox Overlay

```javascript
await highlighter.showFlexOverlay('.flex-container');

// Configuration:
// - Container border: Purple dashed
// - Item separators: Blue dotted
```

## Interactive Inspect Mode

```javascript
// Enable inspect mode
await highlighter.enableInspectMode();

// User can now hover over elements
// Click to select

// Listen for selections
client.on('Overlay.inspectNodeRequested', (event) => {
  console.log('Selected node:', event.backendNodeId);
});

// Disable when done
await highlighter.disableInspectMode();
```

## Multi-Element Highlighting

```javascript
const selectors = [
  '.card:nth-child(1)',
  '.card:nth-child(2)',
  '.card:nth-child(3)'
];

const colors = [
  { r: 255, g: 0, b: 0, a: 0.5 },   // Red
  { r: 0, g: 255, b: 0, a: 0.5 },   // Green
  { r: 0, g: 0, b: 255, a: 0.5 }    // Blue
];

await highlighter.highlightMultiple(selectors, colors);
```

## Custom Rectangle Highlighting

```javascript
// Highlight specific region
await highlighter.highlightRect(
  100,  // x
  100,  // y
  300,  // width
  200,  // height
  { r: 255, g: 165, b: 0, a: 0.6 } // Orange
);
```

## Use Cases

- **Debugging**: Visualize layout issues
- **Education**: Teach box model concepts
- **Testing**: Verify element positioning
- **Design Review**: Check spacing and alignment
- **Accessibility**: Highlight focus areas
- **Development**: Interactive element inspection

## Examples

### Find All Buttons
```javascript
const buttons = ['button', 'input[type="button"]', '.btn'];
await highlighter.highlightMultiple(buttons);
```

### Inspect Navigation
```javascript
const info = await highlighter.getElementInfo('nav');
highlighter.printElementInfo(info);

const path = await highlighter.getSelectorPath('nav');
console.log(path.fullPath);
```

### Debug Grid Layout
```javascript
await highlighter.showGridOverlay('.grid');
await sleep(5000);
await highlighter.clearHighlight();
```

### Compare Elements
```javascript
const colors = [
  { r: 255, g: 0, b: 0, a: 0.3 },
  { r: 0, g: 0, b: 255, a: 0.3 }
];

await highlighter.highlightMultiple([
  '.old-layout',
  '.new-layout'
], colors);
```

## Tips

1. **Use showInfo** to see element dimensions and styles
2. **Enable rulers** for precise measurements
3. **Grid/Flex overlays** help visualize complex layouts
4. **Interactive mode** is great for exploration
5. **Color coding** helps distinguish multiple elements
6. **Selector paths** are useful for automated testing
