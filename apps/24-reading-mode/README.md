# App 24: Reading Mode

Article extraction and clean reading experience using Chrome DevTools Protocol.

## Features

- Automatic article content detection
- Remove ads, sidebars, and clutter
- Clean typography with adjustable settings
- Dark/light theme toggle
- Reading time estimation
- Metadata extraction
- Responsive reading width

## CDP Domains Used

- **DOM** - Content manipulation
- **CSS** - Style management
- **Runtime** - JavaScript evaluation

## Content Detection

The app uses multiple heuristics to find article content:

1. Common semantic elements (article, main)
2. Common CSS classes (.post-content, .article-content)
3. Content density analysis (paragraphs + word count)
4. Automatic scoring system

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/24-reading-mode/index.js
```

## API Reference

```javascript
const reader = new ReadingMode(client);
await reader.enable();

// Extract article info
const info = await reader.extractArticleContent();
// { selector, paragraphs, words, score }

// Apply reader mode
await reader.applyReaderMode('light'); // or 'dark'

// Typography adjustments
await reader.adjustTypography(fontSize, lineHeight);

// Utilities
const time = await reader.estimateReadingTime();
const meta = await reader.extractMetadata();
await reader.removeClutter();
await reader.restoreOriginal();
```

## Themes

| Theme | Background | Text | Links |
|-------|-----------|------|-------|
| Light | #f5f5dc | #333 | #0066cc |
| Dark | #1a1a1a | #e0e0e0 | #6ab0f3 |

## Typography Settings

- Font: Georgia, Times New Roman (serif)
- Default size: 18px
- Default line height: 1.8
- Max width: 700px
- Justified text alignment
