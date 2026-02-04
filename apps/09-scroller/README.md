# App 09: Scroller

Control page and element scrolling using Chrome DevTools Protocol.

## Features

- Scroll by pixels
- Scroll to specific position
- Scroll to element
- Page up/down
- Smooth scrolling
- Mouse wheel simulation
- Infinite scroll handling
- Scroll within elements
- Get scroll position and dimensions

## CDP Domains Used

- **Input** - Mouse wheel events
- **Runtime** - JavaScript execution
- **DOM** - Element lookup

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Input.dispatchMouseEvent` | Send wheel events |
| `Runtime.evaluate` | Execute scroll JS |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the scroller
node apps/09-scroller/index.js
```

## Example Output

```
=== CDP Scroller Demo ===

[Scroller] DOM, Page, and Runtime domains enabled

--- Page Dimensions ---
  Viewport: 1200x800
  Document: 1200x15000
  Scrollable: 0x14200

--- Initial Position: (0, 0) ---

--- Scroll by 500 pixels ---
[Scroller] Scrolled by (0, 500)
  New position: (0, 500)

--- Smooth scroll down 300 pixels ---
[Scroller] Smooth scrolled by (0, 300)
  New position: (0, 800)

--- Scroll to element (h2) ---
[Scroller] Scrolled to element: h2

--- Scroll to bottom ---
[Scroller] Scrolled to bottom
  Position at bottom: (0, 14200)

=== Demo Complete ===
```

## API Reference

### `Scroller` Class

```javascript
const scroller = new Scroller(cdpClient);

// Enable required domains
await scroller.enable();

// Scroll by pixels
await scroller.scrollBy(0, 500);     // Down 500px
await scroller.scrollBy(0, -500);    // Up 500px
await scroller.scrollBy(100, 0);     // Right 100px

// Scroll to position
await scroller.scrollTo(0, 1000);

// Scroll to top/bottom
await scroller.scrollToTop();
await scroller.scrollToBottom();

// Scroll to element
await scroller.scrollToElement('h2');
await scroller.scrollToElement('.section', {
  behavior: 'smooth',  // 'auto' or 'smooth'
  block: 'center',     // 'start', 'center', 'end', 'nearest'
  inline: 'center'
});

// Smooth scrolling
await scroller.smoothScrollBy(0, 500);
await scroller.smoothScrollTo(0, 1000);

// Page up/down
await scroller.pageDown();
await scroller.pageUp();

// Mouse wheel scroll
await scroller.wheelScroll(100, 3);  // deltaY=100, 3 times

// Infinite scroll (for lazy loading pages)
await scroller.infiniteScroll(5, 1000);  // 5 iterations, 1s wait

// Scroll within element
await scroller.scrollWithinElement('.container', 0, 200);
await scroller.scrollElementToTop('.container');
await scroller.scrollElementToBottom('.container');

// Get information
const pos = await scroller.getScrollPosition();
// { x: 0, y: 500 }

const dims = await scroller.getPageDimensions();
// {
//   viewportWidth: 1200,
//   viewportHeight: 800,
//   documentWidth: 1200,
//   documentHeight: 15000,
//   scrollableWidth: 0,
//   scrollableHeight: 14200
// }
```

## Scroll Methods Comparison

| Method | Description | Use Case |
|--------|-------------|----------|
| `scrollBy` | Instant scroll by offset | Quick navigation |
| `smoothScrollBy` | Animated scroll | User-like behavior |
| `scrollToElement` | Scroll element into view | Navigate to content |
| `wheelScroll` | Simulate mouse wheel | Trigger scroll events |

## Infinite Scroll Pattern

For pages with lazy loading:

```javascript
// Scroll to bottom repeatedly to load more content
await scroller.infiniteScroll(10, 1500);

// Custom implementation
while (moreContentToLoad) {
  await scroller.scrollToBottom();
  await sleep(1000);  // Wait for content to load

  const newItems = await getNewItems();
  if (newItems.length === 0) break;
}
```

## Tips

- Use `smooth` behavior for more natural interaction
- Add delays after scrolling for content to load
- Check scroll position before/after to verify scroll worked
- Some sites require mouse wheel events to trigger lazy loading
- Use `scrollWithinElement` for scrollable containers
