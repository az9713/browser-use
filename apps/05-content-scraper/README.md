# App 05: Content Scraper

Extract structured content from web pages using Chrome DevTools Protocol.

## Features

- Extract all links with text and attributes
- Extract all images with src/alt/dimensions
- Extract tables as JSON data
- Extract article content with reading time
- Extract page metadata (meta tags, Open Graph)
- Extract forms with all fields
- Extract structured data (JSON-LD)
- Save extracted data to JSON files

## CDP Domains Used

- **DOM** - DOM tree access
- **Runtime** - JavaScript evaluation
- **Page** - Navigation

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Runtime.evaluate` | Execute JS to extract content |
| `DOM.enable` | Enable DOM events |
| `Page.navigate` | Navigate to target page |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the scraper
node apps/05-content-scraper/index.js
```

## Example Output

```
=== CDP Content Scraper Demo ===

[Scraper] DOM, Page, and Runtime domains enabled

--- Scraping example.com ---

--- Metadata ---
  Title: Example Domain
  Language: en
  Canonical: https://example.com/

--- Links ---
  Found 1 links:
    "More information..." -> https://www.iana.org/domains/example

--- Article Content ---
  Title: Example Domain
  Word count: 58
  Reading time: 1 min
  Headings:
    H1: Example Domain

--- Forms ---
  Found 1 forms:
  Form 1:
    Action: https://httpbin.org/post
    Method: post
    Fields: 4
      - custname (text) *required
      - custtel (tel)
      - custemail (email)
      - delivery (radio)

--- Saving Data ---
[Scraper] Saved to: scraped-data.json

=== Demo Complete ===
```

## API Reference

### `ContentScraper` Class

```javascript
const scraper = new ContentScraper(cdpClient);

// Enable required domains
await scraper.enable();

// Extract links
const links = await scraper.extractLinks();
// [{ text, href, title, target }]

// Extract images
const images = await scraper.extractImages();
// [{ src, alt, width, height, loading }]

// Extract tables as JSON
const tables = await scraper.extractTables();
// [{ headers, rows, caption }]

// Extract article content
const article = await scraper.extractArticle();
// { title, description, headings, paragraphs, wordCount, readingTimeMinutes }

// Extract page metadata
const meta = await scraper.extractMetadata();
// { title, description, keywords, author, ogTitle, ogImage, ... }

// Extract forms
const forms = await scraper.extractForms();
// [{ id, name, action, method, fields }]

// Extract clean text
const text = await scraper.extractText();

// Extract JSON-LD structured data
const structured = await scraper.extractStructuredData();

// Save to file
await scraper.saveToFile('data.json', { links, images, article });

// Execute custom JavaScript
const result = await scraper.evaluate('document.querySelectorAll("div").length');
```

## Extraction Examples

### Extract Specific Content

```javascript
// Custom extraction with evaluate()
const prices = await scraper.evaluate(`
  Array.from(document.querySelectorAll('.price'))
    .map(el => ({
      product: el.closest('.product').querySelector('.name').textContent,
      price: parseFloat(el.textContent.replace('$', ''))
    }))
`);
```

### Extract with Selectors

```javascript
// Get all product cards
const products = await scraper.evaluate(`
  Array.from(document.querySelectorAll('.product-card')).map(card => ({
    name: card.querySelector('.title')?.textContent,
    price: card.querySelector('.price')?.textContent,
    image: card.querySelector('img')?.src,
    link: card.querySelector('a')?.href
  }))
`);
```

## Data Structures

### Link Object
```javascript
{
  text: "Click here",
  href: "https://example.com/page",
  title: "Page title",
  target: "_blank"
}
```

### Image Object
```javascript
{
  src: "https://example.com/image.jpg",
  alt: "Description",
  width: 800,
  height: 600,
  loading: "lazy"
}
```

### Table Object
```javascript
{
  headers: ["Name", "Age", "City"],
  rows: [
    { Name: "John", Age: "30", City: "NYC" },
    { Name: "Jane", Age: "25", City: "LA" }
  ],
  caption: "User Data"
}
```

### Article Object
```javascript
{
  title: "Article Title",
  description: "Meta description",
  headings: [
    { level: 1, text: "Main Heading" },
    { level: 2, text: "Subheading" }
  ],
  paragraphs: ["First paragraph...", "Second..."],
  wordCount: 1500,
  readingTimeMinutes: 8
}
```

## Tips

- Use `returnByValue: true` for simple data extraction
- Clone elements before modifying (for clean text extraction)
- Handle missing elements with optional chaining (?.)
- Filter out empty results
- Consider rate limiting for multiple pages
