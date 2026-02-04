# App 11: Screenshotter

Capture screenshots using Chrome DevTools Protocol.

## Features

- Viewport screenshot
- Full page screenshot (beyond viewport)
- Element screenshot with padding
- Region/clip screenshot
- JPEG/PNG/WebP formats
- Quality settings
- High DPR (Retina) capture
- Multi-breakpoint capture

## CDP Domains Used

- **Page** - Screenshot capture
- **DOM** - Element coordinates
- **Emulation** - Device metrics
- **Runtime** - JS evaluation

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Page.captureScreenshot` | Capture screenshot |
| `Page.getLayoutMetrics` | Get page dimensions |
| `Emulation.setDeviceMetricsOverride` | Set viewport/DPR |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the screenshotter
node apps/11-screenshotter/index.js
```

## Example Output

```
=== CDP Screenshotter Demo ===

[Screenshotter] Page, DOM, and Runtime domains enabled

--- Layout Metrics ---
  Content size: 1280x800
  CSS layout: 1280x720

--- Viewport Screenshot ---
[Screenshotter] Captured viewport (png, 45678 bytes)
[Screenshotter] Saved to: screenshot-viewport.png

--- Full Page Screenshot ---
[Screenshotter] Captured full page 1280x2400 (png, 123456 bytes)
[Screenshotter] Saved to: screenshot-fullpage.png

--- Element Screenshot (h1) ---
[Screenshotter] Captured element h1 (300x50)
[Screenshotter] Saved to: screenshot-element.png

=== Demo Complete ===
```

## API Reference

### `Screenshotter` Class

```javascript
const screenshotter = new Screenshotter(cdpClient);

// Enable required domains
await screenshotter.enable();

// Viewport screenshot
const viewport = await screenshotter.captureViewport({
  format: 'png'   // 'png', 'jpeg', or 'webp'
});

// Full page screenshot
const fullPage = await screenshotter.captureFullPage({
  format: 'png',
  quality: 100    // For jpeg/webp
});

// Element screenshot
const element = await screenshotter.captureElement('h1', {
  padding: 10     // Extra pixels around element
});

// Region screenshot
const region = await screenshotter.captureRegion({
  x: 100,
  y: 100,
  width: 400,
  height: 300
});

// High DPR screenshot (Retina)
const retina = await screenshotter.captureWithDPR(2);

// JPEG with quality
const jpeg = await screenshotter.captureViewport({
  format: 'jpeg',
  quality: 80
});

// Save to file
await screenshotter.saveToFile(buffer, 'screenshot.png');

// Get page metrics
const metrics = await screenshotter.getLayoutMetrics();
// { contentSize, cssLayoutViewport, cssVisualViewport }

// Capture at multiple breakpoints
const screenshots = await screenshotter.captureBreakpoints(
  [320, 768, 1024, 1920]
);
for (const [width, buffer] of screenshots) {
  await screenshotter.saveToFile(buffer, `screenshot-${width}.png`);
}
```

## Screenshot Options

### Format Options

| Format | Extension | Quality | Best For |
|--------|-----------|---------|----------|
| `png` | .png | N/A | Lossless, UI screenshots |
| `jpeg` | .jpg | 0-100 | Photos, smaller files |
| `webp` | .webp | 0-100 | Modern, best compression |

### Capture Parameters

```javascript
{
  format: 'png',           // Image format
  quality: 80,             // Quality (jpeg/webp only)
  fromSurface: true,       // Capture from surface
  captureBeyondViewport: true,  // For full page
  clip: {                  // Optional region
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    scale: 1
  }
}
```

## Full Page vs Viewport

**Viewport**: Captures visible area only
```javascript
const viewport = await screenshotter.captureViewport();
```

**Full Page**: Captures entire scrollable document
```javascript
const fullPage = await screenshotter.captureFullPage();
```

## High DPR Screenshots

For Retina/HiDPI displays:

```javascript
// 2x resolution (Retina)
const buffer = await screenshotter.captureWithDPR(2);

// 3x resolution
const buffer = await screenshotter.captureWithDPR(3);
```

## Tips

- Use PNG for UI screenshots (lossless)
- Use JPEG with quality 80-90 for photos
- Full page screenshots may be very large
- High DPR increases file size significantly
- Add padding to element screenshots for context
