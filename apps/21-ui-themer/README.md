# App 21: UI Themer

Inject custom themes into any website using Chrome DevTools Protocol.

## Features

- Dark mode theme
- High contrast accessibility theme
- Sepia/warm theme
- Inverted colors theme
- Readability mode
- Custom brand colors
- Persistent themes across navigation
- Toggle themes on/off

## CDP Domains Used

- **CSS** - Style manipulation
- **DOM** - Element access
- **Runtime** - JavaScript injection
- **Page** - Script persistence

## Theme Presets

| Theme | Description |
|-------|-------------|
| `dark` | Dark background with light text |
| `highContrast` | Black/white/yellow for accessibility |
| `sepia` | Warm, paper-like appearance |
| `inverted` | Inverts all colors |
| `readability` | Clean reading experience |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the themer
node apps/21-ui-themer/index.js
```

## Example Output

```
=== CDP UI Themer Demo ===

[UIThemer] All domains enabled

--- Available Themes ---
  dark, highContrast, sepia, inverted, readability

--- Applying Dark Theme ---
[UIThemer] CSS injected
[UIThemer] Applied theme: dark

--- Applying High Contrast Theme ---
[UIThemer] Theme removed
[UIThemer] CSS injected
[UIThemer] Applied theme: highContrast

--- Setting Persistent Dark Theme ---
[UIThemer] Persistent theme set: dark

--- Navigating to httpbin.org (theme persists) ---
(Theme automatically applied to new page)

=== Demo Complete ===
```

## API Reference

### `UIThemer` Class

```javascript
const themer = new UIThemer(cdpClient);

// Enable domains
await themer.enable();

// Apply preset theme
await themer.applyTheme('dark');
await themer.applyTheme('highContrast');
await themer.applyTheme('sepia');
await themer.applyTheme('inverted');
await themer.applyTheme('readability');

// Toggle theme on/off
await themer.toggleTheme('dark');

// Remove current theme
await themer.removeTheme();

// Inject custom CSS
await themer.injectCSS(`
  body { background: pink !important; }
`);

// Apply brand colors
await themer.applyBrandColors({
  primary: '#007bff',
  secondary: '#6c757d',
  background: '#ffffff',
  text: '#212529',
  accent: '#28a745'
});

// Persistent theme (survives navigation)
await themer.setPersistentTheme('dark');
await themer.removePersistentTheme();

// Get info
const themes = themer.getAvailableThemes();
const current = themer.getCurrentTheme();

// Create custom theme
const css = themer.createCustomTheme({
  backgroundColor: '#1a1a1a',
  textColor: '#ffffff',
  linkColor: '#4da6ff',
  fontFamily: 'Georgia, serif',
  fontSize: '18px'
});
await themer.injectCSS(css);
```

## Theme CSS Examples

### Dark Theme
```css
html, body {
  background-color: #1a1a2e !important;
  color: #eee !important;
}
a { color: #e94560 !important; }
```

### High Contrast
```css
html, body {
  background: #000 !important;
  color: #fff !important;
}
a { color: #ff0 !important; }
* { border: 1px solid #fff !important; }
```

### Readability
```css
body {
  max-width: 800px !important;
  margin: 0 auto !important;
  font-family: Georgia, serif !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
}
nav, aside, .ad { display: none !important; }
```

## Persistence

Regular themes only affect the current page. Use `setPersistentTheme()` to apply themes that survive navigation:

```javascript
// Theme persists across page loads
await themer.setPersistentTheme('dark');

// Navigate - theme is automatically reapplied
await page.navigate('https://other-site.com');

// Remove when done
await themer.removePersistentTheme();
```

## Tips

- Use `!important` to override existing styles
- Test themes on multiple sites
- High contrast helps with accessibility
- Persistent themes use `Page.addScriptToEvaluateOnNewDocument`
- Remove themes before closing to restore original appearance
