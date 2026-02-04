# App 06: Clicker

Simulate mouse clicks using Chrome DevTools Protocol.

## Features

- Click by CSS selector
- Click by coordinates
- Right-click (context menu)
- Double-click
- Click with modifiers (Ctrl, Shift, Alt)
- Hover over elements
- Mouse down/up control

## CDP Domains Used

- **Input** - Mouse event dispatch
- **DOM** - Element coordinate lookup
- **Runtime** - JavaScript evaluation

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Input.dispatchMouseEvent` | Send mouse events |
| `DOM.getBoxModel` | Get element coordinates |
| `DOM.querySelector` | Find element by selector |

## Mouse Event Types

| Type | Description |
|------|-------------|
| `mousePressed` | Mouse button pressed |
| `mouseReleased` | Mouse button released |
| `mouseMoved` | Mouse cursor moved |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the clicker
node apps/06-clicker/index.js
```

## Example Output

```
=== CDP Clicker Demo ===

[Clicker] DOM, Page, and Runtime domains enabled

--- Navigating to example.com ---

--- Clicking on link ---
[Clicker] Clicked at (640, 350) with left button
[Clicker] Clicked on: a

--- Hover demo ---
[Clicker] Hovering over: h1

--- Clicking on input field ---
[Clicker] Clicked at (200, 150) with left button
[Clicker] Clicked on: input[name="custname"]

--- Double-click demo ---
[Clicker] Double-clicked at (200, 200)

--- Right-click demo ---
[Clicker] Right-clicked at (300, 300)

=== Demo Complete ===
```

## API Reference

### `Clicker` Class

```javascript
const clicker = new Clicker(cdpClient);

// Enable required domains
await clicker.enable();

// Click by selector
await clicker.click('button.submit');

// Click at coordinates
await clicker.clickAt(100, 200);

// Double-click
await clicker.doubleClick('h1');
await clicker.doubleClickAt(100, 200);

// Right-click
await clicker.rightClick('.context-menu-target');
await clicker.rightClickAt(100, 200);

// Click with modifiers
await clicker.ctrlClick('a');      // Ctrl+Click
await clicker.shiftClick('a');     // Shift+Click
await clicker.altClick('a');       // Alt+Click

// Custom modifiers
await clicker.click('a', {
  modifiers: { ctrl: true, shift: true }
});

// Hover (move without click)
await clicker.hover('.tooltip-trigger');

// Mouse down/up (for drag operations)
await clicker.mouseDown('.draggable');
await clicker.mouseUp(200, 300);
```

## Click Event Sequence

A standard click sends these events in order:
1. `mouseMoved` - Move cursor to position
2. `mousePressed` - Button down
3. `mouseReleased` - Button up

For double-click:
1. `mouseMoved`
2. `mousePressed` (clickCount: 1)
3. `mouseReleased` (clickCount: 1)
4. `mousePressed` (clickCount: 2)
5. `mouseReleased` (clickCount: 2)

## Modifier Flags

| Modifier | Flag Value |
|----------|------------|
| Alt | 1 |
| Ctrl | 2 |
| Meta (Cmd) | 4 |
| Shift | 8 |

Combine flags with bitwise OR: `Ctrl + Shift = 2 | 8 = 10`

## Tips

- Always move mouse to position before clicking
- Add small delays between events for reliability
- Use `getBoxModel` to get exact element center
- For dynamically appearing elements, use `waitForElement` first
- Some elements require focus before interaction
