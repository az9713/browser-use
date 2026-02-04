# App 17: Cookie Manager

Manage browser cookies using Chrome DevTools Protocol.

## Features

- Get all cookies
- Get cookies for specific URLs
- Set cookies with all attributes
- Delete individual cookies
- Delete cookies by domain
- Clear all cookies
- Clear browser cache
- Export/import cookies as JSON
- Cookie statistics

## CDP Domains Used

- **Network** - Cookie operations
- **Storage** - Data clearing

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Network.getAllCookies` | Get all browser cookies |
| `Network.getCookies` | Get cookies for URLs |
| `Network.setCookie` | Set a cookie |
| `Network.setCookies` | Set multiple cookies |
| `Network.deleteCookies` | Delete cookies |
| `Network.clearBrowserCookies` | Clear all cookies |
| `Network.clearBrowserCache` | Clear cache |
| `Storage.clearDataForOrigin` | Clear origin data |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the manager
node apps/17-cookie-manager/index.js
```

## Example Output

```
=== CDP Cookie Manager Demo ===

[CookieManager] Network and Page domains enabled

--- Setting Cookies ---
[CookieManager] Set cookie: test_cookie
[CookieManager] Set cookie: session_id
[CookieManager] Set cookie: preferences

--- Cookies for Current Page ---
  test_cookie: hello_world
  session_id: abc123xyz
  preferences: {"theme":"dark","lang":"en"}

--- Cookie Statistics ---
  Total: 3
  Secure: 1
  HttpOnly: 1
  Session: 2
  Persistent: 1

--- Cookie Details ---
test_cookie=hello_world
    Domain: example.com
    Path: /
    Expires: 2024-01-01T12:00:00.000Z
    Flags: None

=== Demo Complete ===
```

## API Reference

### `CookieManager` Class

```javascript
const manager = new CookieManager(cdpClient);

// Enable domains
await manager.enable();

// Get all cookies
const allCookies = await manager.getAllCookies();

// Get cookies for URLs
const cookies = await manager.getCookiesForUrls([
  'https://example.com',
  'https://api.example.com'
]);

// Get cookies for current page
const pageCookies = await manager.getCookiesForCurrentPage();

// Set a cookie
await manager.setCookie({
  name: 'session',
  value: 'abc123',
  domain: 'example.com',
  path: '/',
  expires: Date.now() / 1000 + 86400,  // 24 hours
  secure: true,
  httpOnly: true,
  sameSite: 'Strict'
});

// Set multiple cookies
await manager.setCookies([
  { name: 'a', value: '1', domain: 'example.com' },
  { name: 'b', value: '2', domain: 'example.com' }
]);

// Delete a cookie
await manager.deleteCookie('session', 'https://example.com');

// Delete all cookies for domain
await manager.deleteCookiesForDomain('example.com');

// Clear all cookies
await manager.clearAllCookies();

// Clear cache
await manager.clearCache();

// Clear all data for origin
await manager.clearDataForOrigin('https://example.com');

// Export cookies
const json = await manager.exportCookies();

// Import cookies
await manager.importCookies(json);

// Get statistics
const stats = await manager.getStats();
// { total, byDomain, secure, httpOnly, session, persistent }

// Format cookie for display
const formatted = manager.formatCookie(cookie);
```

## Cookie Object Structure

```javascript
{
  name: 'session',
  value: 'abc123',
  domain: '.example.com',
  path: '/',
  expires: 1704067200,        // Unix timestamp (0 = session)
  size: 15,
  httpOnly: true,
  secure: true,
  session: false,
  sameSite: 'Strict',         // None, Lax, Strict
  priority: 'Medium',
  sameParty: false,
  sourceScheme: 'Secure',
  sourcePort: 443
}
```

## Cookie Attributes

| Attribute | Description |
|-----------|-------------|
| `name` | Cookie name |
| `value` | Cookie value |
| `domain` | Domain (with leading dot for subdomains) |
| `path` | Path scope |
| `expires` | Expiration (Unix timestamp, 0=session) |
| `secure` | HTTPS only |
| `httpOnly` | Not accessible via JS |
| `sameSite` | Cross-site request policy |

## Storage Types for clearDataForOrigin

```
'appcache', 'cookies', 'file_systems', 'indexeddb',
'local_storage', 'shader_cache', 'websql', 'service_workers',
'cache_storage', 'all'
```

## Tips

- Use `expires: 0` for session cookies
- Domain with leading dot includes subdomains
- HttpOnly cookies aren't visible to JS
- Export cookies for backup/restore
- Clear cache along with cookies for full reset
