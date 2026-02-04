# App 28: Network Waterfall

ASCII waterfall chart visualization of network request timings using Chrome DevTools Protocol.

## Features

- Visual timeline of all network requests
- Color-coded by resource type
- Size and duration per request
- Request summary by type
- Detailed timing breakdown
- Success/failure indicators
- Priority tracking
- Real-time monitoring

## CDP Domains Used

- **Network** - Request tracking and timing
- **Performance** - Metrics collection

## Timing Phases

Each request is broken down into:

1. **Queueing** - Time in browser queue
2. **DNS** - DNS lookup time
3. **Connecting** - TCP connection establishment
4. **SSL** - TLS handshake (HTTPS only)
5. **Sending** - Request transmission
6. **Waiting** - TTFB (Time to First Byte)
7. **Receiving** - Response download

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/28-network-waterfall/index.js
```

## API Reference

```javascript
const waterfall = new NetworkWaterfall(client);
await waterfall.enable();

// Get summary statistics
const summary = waterfall.getRequestSummary();
// Returns: { total, finished, failed, byType, totalSize, avgDuration }

// Create waterfall chart
const chart = waterfall.createWaterfallChart(maxWidth);

// Print visual waterfall
waterfall.printWaterfall();

// Timing details
const breakdown = waterfall.getTimingBreakdown(request);
waterfall.printTimingBreakdown(requestId);

// Cleanup
waterfall.clearRequests();
```

## Waterfall Chart

```
┌─ Network Waterfall ─────────────────────────────────────────┐
│ █████                        ✓ [Docume] 12.45 KB 234.56ms   │
│   index.html                                                 │
│      ▓▓▓▓                    ✓ [Styles] 8.92 KB  156.32ms   │
│   main.css                                                   │
│       ▒▒▒▒▒▒                 ✓ [Script] 45.67 KB 389.12ms   │
│   app.js                                                     │
│             ░░░              ✓ [Image]  156.8 KB 89.45ms    │
│   logo.png                                                   │
└─────────────────────────────────────────────────────────────┘
```

## Resource Type Symbols

| Type | Symbol | Color |
|------|--------|-------|
| Document | █ | Blue |
| Stylesheet | ▓ | Magenta |
| Script | ▒ | Yellow |
| Image | ░ | Green |
| Font | ▬ | Cyan |
| XHR/Fetch | ▪ | Red |
| Other | ─ | White |

## Summary Output

```javascript
{
  total: 42,
  finished: 40,
  failed: 2,
  byType: {
    Document: { count: 1, size: 12750 },
    Stylesheet: { count: 3, size: 45230 },
    Script: { count: 8, size: 256340 },
    Image: { count: 15, size: 1245678 },
    Font: { count: 4, size: 98234 }
  },
  totalSize: 1658232,
  avgDuration: 234.56
}
```

## Timing Breakdown

```
Timing Breakdown:
  Queueing:   12.45ms
  DNS:        23.67ms
  Connecting: 45.23ms
  SSL:        89.12ms
  Sending:    2.34ms
  Waiting:    156.78ms
  TTFB:       234.56ms
  Receiving:  67.89ms
  Total:      398.48ms
```

## Use Cases

- **Performance Analysis**: Identify slow resources
- **Bottleneck Detection**: Find blocking requests
- **Size Optimization**: Locate large files
- **Caching Review**: Check request patterns
- **CDN Performance**: Analyze delivery times
- **API Monitoring**: Track XHR/Fetch timing
