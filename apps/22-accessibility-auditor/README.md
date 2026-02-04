# App 22: Accessibility Auditor

Audit web pages for accessibility issues using Chrome DevTools Protocol.

## Features

- Missing alt text detection
- Form label checking
- Heading structure validation
- Link text quality
- Color contrast checking
- Keyboard accessibility
- ARIA usage validation
- Visual issue highlighting
- Detailed reports with fix suggestions

## CDP Domains Used

- **Accessibility** - A11y tree
- **DOM** - Element inspection
- **CSS** - Style analysis
- **Overlay** - Visual highlighting
- **Runtime** - JS evaluation

## Checks Performed

| Category | Checks |
|----------|--------|
| Images | Missing alt, empty alt |
| Forms | Missing labels |
| Structure | Heading order, empty headings |
| Links | Empty links, generic text |
| Color | Low contrast |
| Keyboard | Click handlers without tabindex |
| ARIA | Redundant roles |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the auditor
node apps/22-accessibility-auditor/index.js
```

## Example Output

```
=== Accessibility Audit Report ===

Total Issues: 5
  Errors: 2
  Warnings: 3

By Impact:
  critical: 2
  moderate: 2
  minor: 1

By Category:
  images: 1
  forms: 1
  structure: 2
  links: 1

Issues:

[ERROR] Image missing alt attribute
  Category: images | Impact: critical
  Selector: img[src="logo.png"]
  Fix: Add alt="" for decorative images or descriptive alt text

[ERROR] Form input is missing a label
  Category: forms | Impact: critical
  Selector: #email
  Fix: Add a <label for="id"> element or aria-label attribute

[WARN] Link has generic text: "click here"
  Category: links | Impact: moderate
  Selector: a[href="/more"]
  Fix: Use descriptive link text that explains the destination
```

## API Reference

### `AccessibilityAuditor` Class

```javascript
const auditor = new AccessibilityAuditor(cdpClient);

// Enable domains
await auditor.enable();

// Run full audit
const issues = await auditor.audit();

// Individual checks
await auditor.checkMissingAltText();
await auditor.checkFormLabels();
await auditor.checkHeadingStructure();
await auditor.checkLinkText();
await auditor.checkColorContrast();
await auditor.checkKeyboardAccessibility();
await auditor.checkARIAUsage();

// Highlight issues on page
await auditor.highlightIssues();          // All issues
await auditor.highlightIssues('images');  // By category

// Generate report
const report = auditor.generateReport();
// {
//   totalIssues, errors, warnings,
//   byCategory: { images: 2, forms: 1 },
//   byImpact: { critical: 2, moderate: 1 },
//   issues: [...]
// }

// Print report to console
auditor.printReport();
```

## Issue Object Structure

```javascript
{
  type: 'error',           // 'error' | 'warning'
  category: 'images',      // Category of issue
  rule: 'img-alt',         // Specific rule
  message: 'Image missing alt attribute',
  selector: 'img[src="x"]',// CSS selector
  impact: 'critical',      // critical/serious/moderate/minor
  fix: 'Add alt="" for...' // How to fix
}
```

## Impact Levels

| Level | Description |
|-------|-------------|
| critical | Blocks access for users with disabilities |
| serious | Significant barrier to access |
| moderate | Some difficulty for users |
| minor | Best practice improvement |

## WCAG Guidelines Checked

- 1.1.1 Non-text Content (images)
- 1.3.1 Info and Relationships (labels)
- 1.4.3 Contrast (color)
- 2.1.1 Keyboard (focus)
- 2.4.4 Link Purpose (links)
- 4.1.2 Name, Role, Value (ARIA)

## Tips

- Run on multiple pages for comprehensive audit
- Address critical issues first
- Use semantic HTML to reduce issues
- Test with actual assistive technology
- Highlight helps visualize problem areas
