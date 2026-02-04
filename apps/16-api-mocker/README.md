# App 16: API Mocker

Intercept and mock HTTP requests using Chrome DevTools Protocol.

## Features

- Intercept requests by URL pattern
- Return mock JSON responses
- Modify response headers
- Simulate network errors
- Add artificial latency
- Pattern matching with wildcards

## CDP Domains Used

- **Fetch** - Request interception

## Key CDP Commands/Events

| Command/Event | Description |
|---------------|-------------|
| `Fetch.enable` | Start intercepting |
| `Fetch.disable` | Stop intercepting |
| `Fetch.requestPaused` | Request intercepted |
| `Fetch.fulfillRequest` | Return mock response |
| `Fetch.failRequest` | Simulate error |
| `Fetch.continueRequest` | Pass through |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the mocker
node apps/16-api-mocker/index.js
```

## Example Output

```
=== CDP API Mocker Demo ===

[APIMocker] Page domain enabled

--- Setting up mocks ---
[APIMocker] Added mock for: /api/users
[APIMocker] Added mock for: /api/config
[APIMocker] Added mock for: /api/error
[APIMocker] Added mock for: /api/slow

[APIMocker] Started intercepting

--- Testing mocked API ---
[APIMocker] Mocking: http://localhost/api/users
  API Response:
{
  "users": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ]
}

--- Interception Stats ---
  Intercepted requests: 2
  Active mocks: 4

=== Demo Complete ===
```

## API Reference

### `APIMocker` Class

```javascript
const mocker = new APIMocker(cdpClient);

// Enable domains
await mocker.enable();

// Start intercepting
await mocker.startIntercepting({
  patterns: [
    { urlPattern: '*api*' },
    { urlPattern: '*.json', resourceType: 'Fetch' }
  ]
});

// Stop intercepting
await mocker.stopIntercepting();

// Add a basic mock
mocker.mock('/api/users', {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  body: { users: [] }
});

// Mock JSON response (convenience method)
mocker.mockJSON('/api/users', {
  users: [{ id: 1, name: 'Alice' }]
}, {
  status: 200,
  headers: { 'X-Custom': 'value' },
  latency: 100
});

// Mock an error
mocker.mockError('/api/fail', 'Failed');

// Mock a slow response
mocker.mockSlow('/api/slow', 3000, {
  status: 200,
  body: 'Finally!'
});

// Remove a mock
mocker.removeMock('/api/users');

// Clear all mocks
mocker.clearMocks();

// Get stats
const stats = mocker.getStats();
// { interceptedCount: 10, mockCount: 3 }
```

## Mock Response Structure

```javascript
{
  status: 200,                    // HTTP status code
  headers: {                      // Response headers
    'Content-Type': 'application/json',
    'X-Custom-Header': 'value'
  },
  body: { ... },                  // Response body (string or object)
  latency: 1000,                  // Delay in ms (optional)
  error: 'Failed'                 // Error type (instead of response)
}
```

## Error Types

| Error | Description |
|-------|-------------|
| `Failed` | Generic failure |
| `Aborted` | Request aborted |
| `TimedOut` | Request timed out |
| `AccessDenied` | Access denied |
| `ConnectionClosed` | Connection closed |
| `ConnectionReset` | Connection reset |
| `ConnectionRefused` | Connection refused |
| `ConnectionAborted` | Connection aborted |
| `ConnectionFailed` | Connection failed |
| `NameNotResolved` | DNS lookup failed |
| `InternetDisconnected` | No internet |
| `AddressUnreachable` | Address unreachable |

## Pattern Matching

```javascript
// Simple string match (contains)
mocker.mock('/api/', { ... });

// Wildcard match
mocker.mock('*api*users*', { ... });

// RegExp match
mocker.mock(/\/api\/users\/\d+/, { ... });
```

## Tips

- Enable Fetch.enable before navigation
- Patterns support * wildcards
- Non-matched requests pass through
- Use latency to simulate slow networks
- Error mocking helps test error handling
