# App 10: Drag & Drop

Simulate drag and drop interactions using Chrome DevTools Protocol.

## Features

- Drag from coordinates to coordinates
- Drag element to specific position
- Drag element onto another element
- HTML5 drag event simulation
- File drop simulation
- Sortable list reordering
- Selection drag

## CDP Domains Used

- **Input** - Mouse events
- **DOM** - Element coordinates
- **Runtime** - JavaScript for HTML5 events

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Input.dispatchMouseEvent` | Mouse move, press, release |
| `DOM.getBoxModel` | Get element coordinates |
| `Runtime.evaluate` | Dispatch drag events |

## Drag Event Sequence

A standard drag operation:
1. `mouseMoved` to start position
2. `mousePressed` (button down)
3. Multiple `mouseMoved` events (smooth drag)
4. `mouseReleased` (button up)

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run drag & drop
node apps/10-drag-drop/index.js
```

## Example Output

```
=== CDP Drag & Drop Demo ===

[DragDrop] DOM, Page, and Runtime domains enabled

--- Mouse drag demo ---
[DragDrop] Dragged from (150, 200) to (350, 200)
[DragDrop] Dragged #item1 by (200, 0)

--- HTML5 drag demo ---
[DragDrop] HTML5 drag from #item2 to #target

--- Drag to coordinates demo ---
[DragDrop] Dragged from (150, 280) to (500, 300)
[DragDrop] Dragged #item3 to (500, 300)

=== Demo Complete ===
```

## API Reference

### `DragDrop` Class

```javascript
const dragDrop = new DragDrop(cdpClient);

// Enable required domains
await dragDrop.enable();

// Drag from coordinates to coordinates
await dragDrop.dragFromTo(100, 200, 400, 300, {
  steps: 10,      // Number of intermediate moves
  duration: 500   // Total duration in ms
});

// Drag element to coordinates
await dragDrop.dragElementTo('#draggable', 500, 400);

// Drag element onto another element
await dragDrop.dragElementToElement('#draggable', '#dropzone');

// Drag element by offset
await dragDrop.dragElementByOffset('#draggable', 100, 50);

// HTML5 drag events (for complex drag UIs)
await dragDrop.html5Drag('#source', '#target');

// Simulate file drop
await dragDrop.dropFiles('#dropzone', ['/path/to/file.pdf']);

// Reorder sortable list
await dragDrop.reorderListItem('#item1', 2, 50);  // Move down 2 positions

// Drag to select (like text selection)
await dragDrop.dragToSelect(100, 200, 400, 250);
```

## HTML5 vs Mouse Drag

**Mouse Drag** (using `Input.dispatchMouseEvent`):
- Works for position-based drag
- Simple element repositioning
- Sliders, resize handles

**HTML5 Drag** (using DragEvent):
- Works with `draggable="true"` elements
- Supports data transfer
- Required for complex drag & drop UIs

## Smooth Dragging

For natural-looking drags, use steps:

```javascript
// Quick drag (10 steps, 500ms)
await dragDrop.dragFromTo(x1, y1, x2, y2, {
  steps: 10,
  duration: 500
});

// Slow, precise drag (30 steps, 1500ms)
await dragDrop.dragFromTo(x1, y1, x2, y2, {
  steps: 30,
  duration: 1500
});
```

## Tips

- Use more steps for smoother animation
- Add delays between operations for reliability
- HTML5 drag requires proper event attributes
- Some sites need both mouse and HTML5 events
- For file drops, consider using file input instead
