# App 25: Layout Visualizer

CSS layout system visualization using Chrome DevTools Protocol.

## Features

- CSS Grid overlay with line numbers
- Flexbox container and item visualization
- Box model highlighting (margin, border, padding, content)
- Automatic layout detection
- Direction and alignment indicators
- Layout property inspection

## CDP Domains Used

- **DOM** - Element access
- **CSS** - Style inspection
- **Overlay** - Visual highlighting
- **Runtime** - JavaScript evaluation

## Visualization Types

### Grid Overlay
- Grid line visualization
- Row and column numbering
- Template display
- Gap visualization

### Flexbox Overlay
- Container border (dashed green)
- Direction indicator (→ or ↓)
- Individual item highlighting
- Flex grow/shrink values

### Box Model
- Content (blue)
- Padding (green)
- Border (yellow)
- Margin (orange)

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/25-layout-visualizer/index.js
```

## API Reference

```javascript
const viz = new LayoutVisualizer(client);
await viz.enable();

// Find layouts
const grids = await viz.findGridContainers();
const flexes = await viz.findFlexContainers();

// Visualize
await viz.visualizeGridOverlay(selector);
await viz.visualizeFlexOverlay(selector);
await viz.highlightBoxModel(selector);

// Inspect
const boxModel = await viz.getBoxModelInfo(selector);

// Cleanup
await viz.clearOverlays();
```

## Grid Detection

Returns array of grid containers:
```javascript
{
  tag: 'div',
  selector: '.grid-container',
  gridTemplateRows: '100px 1fr 100px',
  gridTemplateColumns: '1fr 3fr 1fr',
  gap: '20px',
  width: 1200,
  height: 800
}
```

## Flexbox Detection

Returns array of flex containers:
```javascript
{
  tag: 'nav',
  selector: '.navbar',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  wrap: 'nowrap',
  children: 5
}
```

## Color Coding

- Grid: Purple (#9945FF)
- Flexbox: Green (#14F195)
- Content: Blue (rgba(111, 168, 220, 0.3))
- Padding: Green (rgba(147, 196, 125, 0.3))
- Border: Yellow (rgba(255, 229, 153, 0.3))
- Margin: Orange (rgba(246, 178, 107, 0.3))
