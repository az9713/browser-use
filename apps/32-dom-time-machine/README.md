# App 32: DOM Time Machine

Record and playback DOM mutations with timeline navigation using Chrome DevTools Protocol.

## Features

- Record all DOM mutations
- Attribute change tracking
- Text content changes
- Node additions/removals
- Timeline playback
- Step-by-step navigation
- Export/import recordings
- Statistics and analysis

## CDP Domains Used

- **DOM** - DOM access
- **Runtime** - MutationObserver injection

## Mutation Types

1. **Attributes**: Class, ID, data attributes, etc.
2. **Character Data**: Text content changes
3. **Child List**: Nodes added or removed

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/32-dom-time-machine/index.js
```

## API Reference

```javascript
const timeMachine = new DOMTimeMachine(client);
await timeMachine.enable();

// Recording
await timeMachine.startRecording();
// ... DOM changes happen ...
const mutations = await timeMachine.stopRecording();

// Playback
await timeMachine.playback(speed); // speed: 0.5x, 1.0x, 2.0x, etc.

// Step through
let step = 0;
step = await timeMachine.stepForward(step);
step = await timeMachine.stepBackward(step);

// Analysis
const timeline = timeMachine.getTimeline();
const stats = timeMachine.getStatistics();
timeMachine.printTimeline(maxEntries);

// Export/Import
const recording = timeMachine.exportRecording();
timeMachine.importRecording(recording);
```

## Mutation Record

```javascript
{
  type: 'attributes',
  timestamp: 1234,
  target: {
    nodeName: 'DIV',
    nodeType: 1,
    id: 'my-div',
    className: 'container active'
  },
  attributeName: 'class',
  oldValue: 'container',
  newValue: 'container active'
}
```

## Timeline Output

```
Timeline:
     0ms | attributes    | div#test.test-class  | data-test changed
   500ms | characterData | div#test.test-class  | text changed
  1000ms | childList     | div#test.test-class  | +1 -0 nodes
  1500ms | childList     | body                 | +0 -1 nodes
```

## Statistics

```javascript
{
  total: 15,
  byType: {
    attributes: 5,
    characterData: 3,
    childList: 7
  },
  duration: 3500,
  averageInterval: 250
}
```

## Export Format

```json
{
  "version": "1.0",
  "startTime": 1699564321234,
  "duration": 3500,
  "mutationCount": 15,
  "mutations": [
    {
      "type": "attributes",
      "timestamp": 0,
      "target": { /* ... */ },
      "attributeName": "class",
      "oldValue": "old",
      "newValue": "new"
    }
  ]
}
```

## Use Cases

- **Debugging**: Understand what changed and when
- **Testing**: Verify DOM mutations in correct order
- **Performance**: Identify excessive DOM changes
- **Education**: Visualize how frameworks modify DOM
- **Regression**: Compare mutation patterns
- **Optimization**: Find unnecessary updates

## Playback Modes

### Full Speed (1.0x)
```javascript
await timeMachine.playback(1.0);
// Plays back in real-time
```

### Slow Motion (0.5x)
```javascript
await timeMachine.playback(0.5);
// Half speed for detailed analysis
```

### Fast Forward (2.0x)
```javascript
await timeMachine.playback(2.0);
// Double speed for quick review
```

### Step-by-Step
```javascript
let step = 0;
while (step < mutations.length - 1) {
  step = await timeMachine.stepForward(step);
  await getUserInput(); // Wait for user
}
```

## Recording Best Practices

### 1. Record Specific Actions
```javascript
await timeMachine.startRecording();

// Perform specific action
await clickButton('#submit');
await waitForAnimation();

await timeMachine.stopRecording();
```

### 2. Filter Noise
```javascript
// Only record significant changes
const mutations = await timeMachine.stopRecording();
const filtered = mutations.filter(m => {
  // Skip style changes from animations
  if (m.attributeName === 'style') return false;
  return true;
});
```

### 3. Compare Before/After
```javascript
// Baseline
await timeMachine.startRecording();
await performAction();
const baseline = await timeMachine.stopRecording();

// After optimization
await timeMachine.startRecording();
await performOptimizedAction();
const optimized = await timeMachine.stopRecording();

console.log(`Reduced mutations: ${baseline.length} → ${optimized.length}`);
```

## Advanced Analysis

### Find Specific Changes
```javascript
const timeline = timeMachine.getTimeline();

// Find all class changes
const classChanges = timeline.filter(m =>
  m.type === 'attributes' &&
  m.mutation.attributeName === 'class'
);

// Find nodes added to specific element
const additions = timeline.filter(m =>
  m.type === 'childList' &&
  m.target.includes('#container') &&
  m.mutation.addedNodes.length > 0
);
```

### Detect Patterns
```javascript
const stats = timeMachine.getStatistics();

if (stats.byType.attributes > stats.total * 0.7) {
  console.warn('High number of attribute changes - check animations');
}

if (stats.averageInterval < 16) {
  console.warn('Mutations happening faster than 60fps - possible thrashing');
}
```

## Limitations

- **Performance**: Recording everything has overhead
- **Memory**: Large numbers of mutations consume memory
- **Scope**: Only observes document.body subtree
- **Detail**: Doesn't capture shadow DOM by default
- **Timing**: Timestamps are approximate
