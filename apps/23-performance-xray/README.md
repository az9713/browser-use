# App 23: Performance X-Ray

Real-time performance monitoring overlays using Chrome DevTools Protocol.

## Features

- FPS counter overlay
- Memory usage display
- Layout shift (CLS) detection
- Long task detection
- Navigation timing breakdown
- Performance metrics dashboard

## CDP Domains Used

- **Performance** - Metrics collection
- **Runtime** - JS evaluation

## Key Metrics

| Metric | Description |
|--------|-------------|
| FPS | Frames per second |
| JS Heap | Memory usage |
| Nodes | DOM node count |
| Layout Count | Layout recalculations |
| CLS | Cumulative Layout Shift |
| Long Tasks | Tasks > 50ms |

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/23-performance-xray/index.js
```

## API Reference

```javascript
const xray = new PerformanceXRay(client);
await xray.enable();

// Visual overlays
await xray.injectFPSCounter();
await xray.injectMemoryDisplay();
await xray.removeOverlays();

// Detection
await xray.detectLayoutShifts();
await xray.detectLongTasks();

// Metrics
const metrics = await xray.getMetrics();
const timing = await xray.getNavigationTiming();

// Continuous monitoring
await xray.startMonitoring(1000);
xray.stopMonitoring();
```
