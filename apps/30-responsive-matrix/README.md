# App 30: Responsive Matrix

Capture screenshots at multiple breakpoints and devices using Chrome DevTools Protocol.

## Features

- Screenshot at common breakpoints
- Device preset library (iPhone, iPad, desktop)
- Portrait and landscape orientations
- Custom viewport sizes
- Batch capture mode
- HTML comparison report
- Mobile user agent emulation
- Device pixel ratio support

## CDP Domains Used

- **Page** - Screenshot capture
- **Emulation** - Viewport and device emulation

## Device Presets

### Mobile
- iPhone SE (375x667)
- iPhone 12 Pro (390x844)
- iPhone 14 Pro Max (430x932)
- Pixel 5 (393x851)
- Samsung Galaxy S21 (360x800)

### Tablet
- iPad Mini (768x1024)
- iPad Air (820x1180)
- iPad Pro 11" (834x1194)
- iPad Pro 12.9" (1024x1366)

### Desktop
- HD (1366x768)
- Full HD (1920x1080)
- QHD (2560x1440)
- 4K (3840x2160)

## Breakpoints

| Name | Width | Height | Common Use |
|------|-------|--------|------------|
| xs-mobile | 320px | 568px | Small phones |
| mobile | 375px | 667px | Standard phones |
| mobile-lg | 414px | 896px | Large phones |
| tablet-sm | 600px | 960px | Small tablets |
| tablet | 768px | 1024px | Standard tablets |
| tablet-lg | 1024px | 1366px | Large tablets |
| desktop-sm | 1280px | 800px | Small desktop |
| desktop | 1440px | 900px | Standard desktop |
| desktop-lg | 1920px | 1080px | Large desktop |
| desktop-xl | 2560px | 1440px | Ultra-wide |

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/30-responsive-matrix/index.js
```

## API Reference

```javascript
const matrix = new ResponsiveMatrix(client);
await matrix.enable();

// Single breakpoint
await matrix.captureAtBreakpoint('mobile', url);

// Multiple breakpoints
const breakpoints = ['mobile', 'tablet', 'desktop'];
await matrix.captureMatrix(breakpoints, url);

// Device orientations
await matrix.captureOrientation('iPhone 12 Pro', url, portrait, landscape);

// Custom viewport
await matrix.setViewport(width, height, deviceScaleFactor, mobile);
const screenshot = await matrix.captureScreenshot('custom');

// Save
await matrix.saveScreenshot(screenshot, outputDir);
await matrix.saveAllScreenshots(outputDir);
await matrix.saveHTMLReport(path);

// Cleanup
await matrix.resetViewport();
```

## Screenshot Object

```javascript
{
  name: 'mobile',
  data: 'base64-encoded-png-data',
  timestamp: 1699564321234,
  width: 375,
  height: 667,
  breakpoint: 'mobile',
  device: 'iPhone 12 Pro',
  orientation: 'portrait'
}
```

## HTML Report

The generated report includes:
- Grid layout of all screenshots
- Viewport dimensions
- Timestamps
- Side-by-side comparison
- Responsive design

Example:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Responsive Screenshots</title>
</head>
<body>
  <div class="grid">
    <div class="screenshot">
      <h3>mobile</h3>
      <img src="data:image/png;base64,..." />
      <div class="meta">375x667</div>
    </div>
    <!-- ... -->
  </div>
</body>
</html>
```

## Use Cases

- **Responsive Testing**: Verify layout across devices
- **Visual Regression**: Compare design changes
- **Client Demos**: Show responsive behavior
- **Documentation**: Screenshot design system
- **QA Automation**: Automated visual testing
- **Bug Reports**: Capture reproduction at specific sizes

## Advanced Usage

### Custom Breakpoint Matrix
```javascript
const customBreakpoints = ['mobile', 'tablet', 'desktop'];
await matrix.captureMatrix(customBreakpoints, url);
```

### Multiple Devices
```javascript
const devices = ['iPhone 12 Pro', 'iPad Air', 'Desktop FHD'];
for (const device of devices) {
  await matrix.captureAtBreakpoint(device, url);
}
```

### Both Orientations
```javascript
await matrix.captureOrientation('iPad Pro 11', url, true, true);
// Captures both portrait and landscape
```

## Output Structure

```
screenshots/
├── mobile-375x667.png
├── tablet-768x1024.png
├── desktop-1920x1080.png
├── iPhone-12-Pro-portrait-390x844.png
├── iPhone-12-Pro-landscape-844x390.png
└── responsive-report.html
```
