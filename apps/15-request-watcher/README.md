# App 15: Request Watcher

Monitor HTTP network requests using Chrome DevTools Protocol.

## Features

- Log all HTTP requests
- Show request/response headers
- Show timing breakdown (DNS, connect, wait)
- Filter by URL pattern
- Filter by resource type
- Get response body
- Track failed requests

## CDP Domains Used

- **Network** - HTTP monitoring

## Key CDP Commands/Events

| Event | Description |
|-------|-------------|
| `Network.requestWillBeSent` | Request about to be sent |
| `Network.responseReceived` | Response headers received |
| `Network.loadingFinished` | Request completed |
| `Network.loadingFailed` | Request failed |
| `Network.getResponseBody` | Get response content |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the watcher
node apps/15-request-watcher/index.js
```

## Example Output

```
=== CDP Request Watcher Demo ===

[RequestWatcher] Network and Page domains enabled

--- Starting Watcher ---
[RequestWatcher] Started watching

--- Navigating to example.com ---
  -> [GET] https://example.com/...
  <- [200] https://example.com/... (125ms)

--- Request Summary ---
  Total requests: 5
  By type:
    Document: 1
    Stylesheet: 2
    Script: 1
    Image: 1

--- First Request Details ---
[GET] 200 https://example.com/
  Type: Document | Size: 1.26 KB | Time: 125ms
  Timing: DNS=15ms, Connect=45ms, Wait=62ms
  Response Headers:
    content-type: text/html
    content-length: 1256

=== Demo Complete ===
```

## API Reference

### `RequestWatcher` Class

```javascript
const watcher = new RequestWatcher(cdpClient);

// Enable network domain
await watcher.enable();

// Start watching with callbacks
watcher.startWatching({
  // Called when request starts
  onRequest: (entry) => {
    console.log(`Starting: ${entry.url}`);
  },

  // Called when response headers received
  onResponse: (entry) => {
    console.log(`Status: ${entry.status}`);
  },

  // Called when request completes
  onComplete: (entry) => {
    console.log(`Done: ${entry.duration}ms`);
  },

  // Optional filters
  urlFilter: '/api/',           // Only URLs containing this
  typeFilter: 'XHR'             // Only XHR requests
});

// Stop watching
watcher.stopWatching();

// Get all requests
const requests = watcher.getRequests();

// Get by type
const documents = watcher.getRequestsByType('Document');
const scripts = watcher.getRequestsByType('Script');
const xhr = watcher.getRequestsByType('XHR');

// Get by URL
const apiCalls = watcher.getRequestsByUrl('/api/');
const images = watcher.getRequestsByUrl(/\.(png|jpg|gif)$/);

// Get failed requests
const failed = watcher.getFailedRequests();

// Get response body
const body = await watcher.getResponseBody(requestId);

// Print formatted request
watcher.printRequest(entry, true);  // verbose=true

// Clear stored requests
watcher.clearRequests();
```

## Request Entry Structure

```javascript
{
  requestId: '123.456',
  url: 'https://example.com/api/data',
  method: 'GET',
  type: 'XHR',
  headers: { ... },
  postData: '...',              // For POST requests
  startTime: 12345.678,
  status: 200,
  statusText: 'OK',
  responseHeaders: { ... },
  mimeType: 'application/json',
  timing: { ... },
  remoteIPAddress: '93.184.216.34',
  protocol: 'h2',
  endTime: 12345.803,
  encodedDataLength: 1256,
  duration: 125                 // ms
}
```

## Resource Types

| Type | Description |
|------|-------------|
| `Document` | HTML pages |
| `Stylesheet` | CSS files |
| `Script` | JavaScript files |
| `Image` | Images |
| `Font` | Web fonts |
| `XHR` | XMLHttpRequest |
| `Fetch` | Fetch API |
| `WebSocket` | WebSocket connections |
| `Other` | Other resources |

## Timing Breakdown

```javascript
{
  dns: 15,        // DNS lookup
  connect: 45,    // TCP connection
  ssl: 30,        // SSL handshake
  send: 1,        // Request sent
  wait: 62,       // Waiting for response
  receive: 5      // Receiving data
}
```

## Tips

- Enable `Network.enable` before navigation
- Response body may not be available for all requests
- Use filters to reduce noise
- Failed requests have status >= 400 or error
- Timing data shows performance breakdown
