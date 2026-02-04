# App 31: Dead Code Detector

Track unused CSS rules and JavaScript code coverage using Chrome DevTools Protocol.

## Features

- CSS rule usage tracking
- JavaScript code coverage analysis
- Unused selector detection
- Unused function identification
- Coverage percentage calculation
- Per-file breakdown
- Event listener analysis
- Image load tracking

## CDP Domains Used

- **CSS** - Rule usage tracking
- **Profiler** - Precise code coverage
- **DOM** - Element analysis
- **Runtime** - JavaScript evaluation

## Coverage Types

### CSS Coverage
- Tracks every CSS rule
- Identifies used vs unused rules
- Per-stylesheet breakdown
- Selector matching analysis

### JavaScript Coverage
- Function-level tracking
- Byte-level precision
- Execution count
- Unused function detection

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/31-dead-code/index.js
```

## API Reference

```javascript
const detector = new DeadCodeDetector(client);
await detector.enable();

// Start tracking
await detector.startCoverage();

// ... navigate and interact ...

// Stop and analyze
const coverage = await detector.stopCoverage();

// Additional analysis
const selectors = await detector.findUnusedSelectors();
const images = await detector.findUnusedImages();
const listeners = await detector.analyzeEventListeners();

// Reports
detector.printCoverageSummary();
const report = detector.generateReport();
```

## Coverage Output

### CSS Coverage
```javascript
{
  total: 245,
  used: 187,
  unused: 58,
  percentage: '76.33',
  byStylesheet: [
    {
      url: 'main.css',
      total: 150,
      used: 120,
      unused: 30,
      percentage: '80.00',
      rules: [/* unused rules */]
    }
  ]
}
```

### JavaScript Coverage
```javascript
{
  totalBytes: 245678,
  usedBytes: 156234,
  unusedBytes: 89444,
  percentage: '63.58',
  byScript: [
    {
      url: 'app.js',
      totalBytes: 123456,
      usedBytes: 78901,
      percentage: '63.90',
      unusedFunctions: 12
    }
  ]
}
```

## Summary Report

```json
{
  "summary": {
    "css": {
      "coverage": 76.33,
      "wastedRules": 58
    },
    "js": {
      "coverage": 63.58,
      "wastedBytes": 89444
    }
  }
}
```

## Use Cases

- **Bundle Optimization**: Identify unused code to remove
- **Performance**: Reduce payload size
- **Refactoring**: Find dead code paths
- **Testing**: Ensure code is exercised
- **Code Splitting**: Determine what to defer
- **Audit**: Review codebase efficiency

## Best Practices

### 1. Exercise All Paths
```javascript
await detector.startCoverage();

// Navigate to different pages
await navigateTo('/home');
await navigateTo('/about');
await navigateTo('/contact');

// Interact with UI
await clickButton('#menu');
await fillForm('#search');

await detector.stopCoverage();
```

### 2. Test Multiple Scenarios
```javascript
// Logged out
await detector.startCoverage();
await testAsGuest();
const guestCoverage = await detector.stopCoverage();

// Logged in
await detector.startCoverage();
await testAsUser();
const userCoverage = await detector.stopCoverage();
```

### 3. Compare Over Time
```javascript
const baseline = await detector.stopCoverage();
// ... make changes ...
const after = await detector.stopCoverage();

const improvement = after.js.percentage - baseline.js.percentage;
console.log(`Coverage improved by ${improvement}%`);
```

## Unused Selector Detection

```javascript
{
  used: 145,
  unused: [
    {
      selector: '.old-button',
      rule: '.old-button { background: blue; ... }'
    },
    {
      selector: '#legacy-nav',
      rule: '#legacy-nav { display: flex; ... }'
    }
  ]
}
```

## Coverage Visualization

```
CSS Coverage: ████████████████████░░░░░░░░ 76.33%
JS Coverage:  ████████████████░░░░░░░░░░░░ 63.58%

Potential Savings:
  CSS: 58 unused rules
  JS:  87.34 KB unused code
```

## Integration Examples

### CI/CD Pipeline
```javascript
const coverage = await detector.stopCoverage();

if (coverage.js.percentage < 70) {
  throw new Error('JS coverage below threshold!');
}

if (coverage.css.percentage < 75) {
  console.warn('CSS coverage below target');
}
```

### Performance Budget
```javascript
const MAX_UNUSED_KB = 100;

const unusedKB = coverage.js.unusedBytes / 1024;
if (unusedKB > MAX_UNUSED_KB) {
  throw new Error(`Too much unused code: ${unusedKB.toFixed(2)} KB`);
}
```

## Limitations

- **Dynamic Code**: May not detect dynamically loaded code
- **Conditional Features**: Feature flags might appear unused
- **Error Handlers**: Error paths may not execute in tests
- **A/B Tests**: Alternative code paths won't be exercised
- **CORS**: Can't analyze cross-origin stylesheets
