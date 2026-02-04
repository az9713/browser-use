# App 27: Design Tokens Extractor

Extract design system tokens from any webpage using Chrome DevTools Protocol.

## Features

- Color palette extraction with usage frequency
- Typography scale (fonts, sizes, weights, line heights)
- Spacing system analysis
- Border radius patterns
- Box shadow catalog
- Responsive breakpoints
- JSON export format
- CSS custom properties generation

## CDP Domains Used

- **CSS** - Stylesheet parsing
- **DOM** - Element traversal
- **Runtime** - Computed style analysis

## Extracted Tokens

### Colors
- Background colors
- Text colors
- Border colors
- SVG fill/stroke colors
- Frequency analysis
- Automatic deduplication

### Typography
- Font families
- Font sizes
- Font weights
- Line heights
- Usage statistics

### Spacing
- Margins (all directions)
- Paddings (all directions)
- Gap values (grid/flex)
- Sorted by value

### Border Radius
- All unique border-radius values
- Usage frequency

### Shadows
- Box shadows with full definitions
- Popularity ranking

### Breakpoints
- Media query width values
- Sorted ascending

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/27-design-tokens/index.js
```

## API Reference

```javascript
const extractor = new DesignTokens(client);
await extractor.enable();

// Extract individual categories
const colors = await extractor.extractColors();
const typography = await extractor.extractTypography();
const spacing = await extractor.extractSpacing();
const radii = await extractor.extractBorderRadii();
const shadows = await extractor.extractShadows();
const breakpoints = await extractor.extractBreakpoints();

// Generate complete token set
const tokens = await extractor.generateTokensJSON();

// Export as CSS variables
const css = extractor.formatTokensAsCSS(tokens);
```

## Output Formats

### JSON Structure

```json
{
  "colors": {
    "primary": [
      { "name": "color-1", "value": "#0969da", "usage": 45 },
      { "name": "color-2", "value": "#ffffff", "usage": 38 }
    ]
  },
  "typography": {
    "fontFamily": [
      { "name": "font-1", "value": "Inter" }
    ],
    "fontSize": [
      { "name": "text-1", "value": "14px", "usage": 120 }
    ],
    "fontWeight": [
      { "name": "weight-400", "value": "400", "usage": 85 }
    ]
  },
  "spacing": [
    { "name": "space-1", "value": "8px", "usage": 67 }
  ],
  "borderRadius": [
    { "name": "radius-1", "value": "6px", "usage": 42 }
  ],
  "shadows": [
    { "name": "shadow-1", "value": "0 1px 3px rgba(0,0,0,0.12)", "usage": 15 }
  ],
  "breakpoints": [
    { "name": "breakpoint-1", "value": "768px" }
  ]
}
```

### CSS Variables

```css
:root {
  --color-1: #0969da;
  --color-2: #ffffff;

  --font-1: Inter;
  --font-2: -apple-system;

  --text-1: 14px;
  --text-2: 16px;

  --space-1: 8px;
  --space-2: 16px;

  --radius-1: 6px;
  --radius-2: 12px;
}
```

## Use Cases

- **Reverse Engineering**: Extract tokens from existing sites
- **Design System Audit**: Analyze consistency
- **Theme Migration**: Convert to design tokens
- **Documentation**: Auto-generate design specs
- **Refactoring**: Identify consolidation opportunities
