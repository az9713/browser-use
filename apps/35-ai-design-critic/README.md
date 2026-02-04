# App 35: AI Design Critic

Automated design quality and accessibility analysis using Chrome DevTools Protocol.

## Features

- Color contrast analysis (WCAG compliance)
- Spacing consistency evaluation
- Typography scale assessment
- Accessibility auditing
- Layout quality checks
- Design system violations
- Automated recommendations
- Design score calculation

## CDP Domains Used

- **DOM** - Structure analysis
- **CSS** - Style evaluation
- **Runtime** - JavaScript-based analysis
- **Accessibility** - A11y tree inspection

## Analysis Categories

### 1. Color Contrast
- WCAG AA/AAA compliance
- Text/background combinations
- Interactive element contrast
- Large text exceptions

### 2. Spacing
- Consistency across elements
- Grid alignment (4px/8px)
- Spacing scale adherence
- White space distribution

### 3. Typography
- Font size scale
- Line height ratios
- Minimum readable sizes
- Type hierarchy

### 4. Accessibility
- Missing ARIA labels
- Alt text for images
- Keyboard navigation
- Screen reader support

### 5. Layout
- Responsive design patterns
- DOM depth analysis
- Fixed width containers
- Modern layout usage

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/35-ai-design-critic/index.js
```

## API Reference

```javascript
const critic = new AIDesignCritic(client);
await critic.enable();

// Run analyses
await critic.analyzeColorContrast();
await critic.analyzeSpacing();
await critic.analyzeTypography();
await critic.analyzeAccessibility();
await critic.analyzeLayout();

// Generate recommendations
const recommendations = critic.generateRecommendations();

// Get score
const { score, grade } = critic.getScore();

// Print report
critic.printReport();
```

## Issue Severities

| Severity | Penalty | Examples |
|----------|---------|----------|
| **High** | -10 points | Color contrast, missing alt text |
| **Medium** | -5 points | Spacing inconsistency, too many font sizes |
| **Low** | -1 point | Deep nesting, fixed widths |

## WCAG Contrast Requirements

| Text Type | WCAG AA | WCAG AAA |
|-----------|---------|----------|
| Normal text | 4.5:1 | 7:1 |
| Large text (18px+) | 3:1 | 4.5:1 |
| Bold large (14px+) | 3:1 | 4.5:1 |

## Report Output

```
============================================================
  DESIGN CRITIQUE REPORT
============================================================

📊 SUMMARY
────────────────────────────────────────────────────────────
  Total Issues: 23
  🔴 High:   5
  🟡 Medium: 12
  🟢 Low:    6

🔍 ISSUES BY CATEGORY
────────────────────────────────────────────────────────────
  contrast                       5 issue(s)
  spacing-inconsistency          3 issue(s)
  typography                     8 issue(s)
  accessibility                  4 issue(s)
  layout                         3 issue(s)

⚠️  TOP ISSUES
────────────────────────────────────────────────────────────

  1. CONTRAST
     Element: div#header
     Contrast Ratio: 2.5:1 (required: 4.5:1)

  2. MISSING-ALT-TEXT
     Element: img
     Message: Image missing alt text

💡 RECOMMENDATIONS
────────────────────────────────────────────────────────────

  🔴 Fix Color Contrast Issues
     5 elements have insufficient color contrast.
     ➜ Adjust text/background colors to meet WCAG AA standards.

  🟡 Establish Consistent Spacing Scale
     Multiple spacing inconsistencies detected.
     ➜ Define a spacing scale and use it consistently.

============================================================

📈 DESIGN SCORE: 75/100 (Grade: C)
```

## Recommendations

Each recommendation includes:
```javascript
{
  priority: 'high' | 'medium' | 'low',
  category: 'accessibility' | 'design-system' | 'typography' | 'layout',
  title: 'Fix Color Contrast Issues',
  description: '5 elements have insufficient color contrast...',
  action: 'Review and adjust text/background color combinations...'
}
```

## Grading Scale

| Score | Grade | Quality |
|-------|-------|---------|
| 90-100 | A | Excellent |
| 80-89 | B | Good |
| 70-79 | C | Fair |
| 60-69 | D | Poor |
| 0-59 | F | Failing |

## Use Cases

- **Design Review**: Automated quality checks
- **Accessibility Audit**: WCAG compliance
- **CI/CD Integration**: Fail builds on low scores
- **Design System**: Enforce consistency
- **Client Deliverables**: Quality assurance
- **Education**: Learn best practices
- **Regression Testing**: Maintain standards

## Best Practices

### Spacing Scale
```javascript
// Recommended 8px-based scale
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};
```

### Typography Scale
```javascript
// Recommended modular scale
const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
  '4xl': '36px'
};
```

### Line Height
```javascript
// Recommended ratios
const lineHeight = {
  tight: 1.25,    // Headings
  normal: 1.5,    // Body text
  relaxed: 1.75,  // Long-form content
  loose: 2        // Very open spacing
};
```

## Integration Examples

### CI/CD Pipeline
```javascript
const { score } = critic.getScore();

if (score < 70) {
  console.error('Design score below threshold!');
  process.exit(1);
}
```

### Custom Threshold
```javascript
const highIssues = critic.issues.filter(i => i.severity === 'high');

if (highIssues.length > 0) {
  console.error('High severity issues must be fixed!');
  highIssues.forEach(i => console.error(i));
  process.exit(1);
}
```

### Generate Report File
```javascript
import fs from 'fs';

critic.printReport();

const report = {
  timestamp: new Date().toISOString(),
  score: critic.getScore(),
  issues: critic.issues,
  recommendations: critic.recommendations
};

fs.writeFileSync('design-report.json', JSON.stringify(report, null, 2));
```

## Limitations

- **Context**: Can't understand design intent
- **Subjectivity**: Some issues are subjective
- **False Positives**: May flag intentional choices
- **Coverage**: Samples elements for performance
- **Dynamic Content**: May miss dynamically loaded content
- **Shadow DOM**: Limited shadow DOM analysis

## Extending

Add custom analysis:
```javascript
async analyzeCustomMetric() {
  const result = await this.client.send('Runtime.evaluate', {
    expression: `
      (function() {
        // Your custom analysis
        const issues = [];
        // ... analyze ...
        return issues;
      })()
    `,
    returnByValue: true
  });

  result.result.value.forEach(issue => {
    this.issues.push({
      severity: 'medium',
      category: 'custom',
      ...issue
    });
  });
}
```
