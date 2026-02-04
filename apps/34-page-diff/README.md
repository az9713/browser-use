# App 34: Page Diff

Serialize and compare page states to detect changes using Chrome DevTools Protocol.

## Features

- Full page state serialization
- DOM structure comparison
- Attribute change detection
- Style change tracking
- Text content comparison
- Before/after snapshots
- Change categorization (added, removed, modified)
- Visual diff reporting
- Export capability

## CDP Domains Used

- **DOM** - Structure access
- **CSS** - Computed styles
- **Runtime** - State serialization

## Change Types

1. **Added**: New elements or attributes
2. **Removed**: Deleted elements or attributes
3. **Modified**: Changed content, attributes, or styles
4. **Unchanged**: No changes detected

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/34-page-diff/index.js
```

## API Reference

```javascript
const differ = new PageDiff(client);
await differ.enable();

// Capture states
const before = await differ.captureState('Before');
// ... make changes ...
const after = await differ.captureState('After');

// Compare
const changes = differ.compareStates(before, after);

// Output
differ.printDiff(changes);
differ.printElementDiff(changes.dom, indent, maxDepth);

// Export
const exported = differ.exportDiff(changes);
```

## State Object

```javascript
{
  name: 'Before',
  url: 'https://example.com',
  title: 'Example Domain',
  timestamp: 1699564321234,
  hash: 'a1b2c3d4...',
  dom: {
    tag: 'html',
    type: 1,
    attributes: { lang: 'en' },
    styles: { display: 'block', ... },
    children: [...]
  }
}
```

## Comparison Output

```javascript
{
  url: {
    before: 'https://example.com',
    after: 'https://example.com',
    changed: false
  },
  title: {
    before: 'Example',
    after: 'Modified Example',
    changed: true
  },
  dom: {
    element: 'html',
    status: 'modified',
    changes: [
      {
        type: 'attribute',
        name: 'class',
        before: 'old',
        after: 'new'
      }
    ],
    children: [...]
  },
  summary: {
    added: 5,
    removed: 2,
    modified: 12,
    unchanged: 145
  }
}
```

## Diff Symbols

```
  (space) - Unchanged
+ (plus)  - Added
- (minus) - Removed
~ (tilde) - Modified
```

## Example Output

```
URL Changed:
  - https://example.com/old
  + https://example.com/new

Title Changed:
  - Old Title
  + New Title

Summary:
  Added: 3
  Removed: 1
  Modified: 8
  Unchanged: 127

DOM Changes:
  ~ html
    ~ body
      ~ div#app.container
        attr class: "container" → "container active"
        style backgroundColor: "white" → "lightgray"
      + div#new-element.test-class
      - div#old-element
```

## Use Cases

- **Testing**: Verify DOM changes
- **Debugging**: Track unexpected modifications
- **Monitoring**: Detect page tampering
- **A/B Testing**: Compare variants
- **Documentation**: Record state changes
- **Regression Testing**: Ensure consistency
- **Migration**: Validate transformations

## Advanced Usage

### Track Specific Changes
```javascript
const before = await differ.captureState('Before');

// User interaction
await performAction();

const after = await differ.captureState('After');
const changes = differ.compareStates(before, after);

// Check if specific element changed
const bodyChanges = changes.dom.children.find(
  c => c.element === 'body'
);
```

### Multiple Comparisons
```javascript
const states = [];

// Capture at different points
states.push(await differ.captureState('Initial'));
await action1();
states.push(await differ.captureState('After Action 1'));
await action2();
states.push(await differ.captureState('After Action 2'));

// Compare sequential states
for (let i = 0; i < states.length - 1; i++) {
  const diff = differ.compareStates(states[i], states[i + 1]);
  console.log(`${states[i].name} → ${states[i + 1].name}`);
  differ.printDiff(diff);
}
```

### Filter Changes
```javascript
const changes = differ.compareStates(before, after);
const flattened = differ.flattenChanges(changes.dom);

// Only style changes
const styleChanges = flattened.filter(c =>
  c.changes.some(ch => ch.type === 'style')
);

// Only added elements
const additions = flattened.filter(c => c.status === 'added');

// Changes in specific subtree
const navChanges = flattened.filter(c =>
  c.path.startsWith('html > body > nav')
);
```

### Export for Analysis
```javascript
const exported = differ.exportDiff(changes);

// Save to file
import fs from 'fs';
fs.writeFileSync(
  'diff-report.json',
  JSON.stringify(exported, null, 2)
);

// Generate HTML report
const html = generateHTMLReport(exported);
fs.writeFileSync('diff-report.html', html);
```

## Limitations

- **Performance**: Serializing large DOMs is slow
- **Depth**: Limited recursion depth (20 levels)
- **Styles**: Only captures key computed styles
- **Shadow DOM**: Not included by default
- **iframes**: Not traversed
- **Dynamic Content**: Timestamps may cause false positives

## Performance Tips

1. **Limit Depth**: Set maxDepth in printElementDiff
2. **Sample**: Capture only relevant subtrees
3. **Debounce**: Wait for changes to settle
4. **Filter**: Focus on specific element types
5. **Hash First**: Check if states differ before detailed comparison

## Serialization Details

### Included
- Element tags
- Attributes (all)
- Text content
- Computed styles (selected properties)
- DOM structure

### Excluded
- Event listeners
- JavaScript state
- Canvas/WebGL content
- Shadow DOM (unless explicitly traversed)
- iframe contents
- Binary data (images rendered, but not data)

## Comparison Algorithm

1. **Hash Check**: Quick equality check
2. **Tree Traversal**: Recursive comparison
3. **Node Matching**: Tag, attributes, content
4. **Style Comparison**: Key computed properties
5. **Child Matching**: Position-based
6. **Change Categorization**: Added/removed/modified
7. **Summary Generation**: Aggregate statistics
