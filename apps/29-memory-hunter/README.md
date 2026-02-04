# App 29: Memory Hunter

Memory leak detection and heap analysis using Chrome DevTools Protocol.

## Features

- Heap snapshot capture
- Snapshot comparison
- Memory leak detection
- Object type distribution
- Size and count tracking
- Garbage collection triggering
- Detached DOM node detection
- Memory timeline tracking

## CDP Domains Used

- **HeapProfiler** - Snapshot capture and analysis
- **Memory** - Sampling and profiling
- **Runtime** - Memory API access

## Snapshot Analysis

Each snapshot includes:
- Total heap size
- Node count
- Edge count
- Type distribution (objects, strings, arrays, etc.)
- Size per type
- Timestamp

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/29-memory-hunter/index.js
```

## API Reference

```javascript
const hunter = new MemoryHunter(client);
await hunter.enable();

// Take snapshots
const snapshot = await hunter.takeSnapshot('name');
hunter.printSnapshotSummary(snapshot);

// Compare snapshots
const diff = hunter.compareSnapshots(snap1, snap2);
hunter.printComparison(snap1, snap2);

// Memory utilities
const memory = await hunter.getMemoryUsage();
const detached = await hunter.findDetachedDOMNodes();
await hunter.collectGarbage();

// Cleanup
await hunter.disable();
```

## Snapshot Object

```javascript
{
  name: 'Baseline',
  timestamp: 1699564321234,
  data: { /* raw heap snapshot */ },
  stats: {
    nodeCount: 45678,
    edgeCount: 123456,
    totalSize: 12345678,
    typeDistribution: {
      'object': { count: 12345, size: 5678901 },
      'string': { count: 23456, size: 3456789 },
      'array': { count: 3456, size: 1234567 }
    }
  }
}
```

## Comparison Output

```
Comparing: Baseline → After Leak
Time Delta: 5.0s
Size Change: +4.52 MB (+36.7%)
Node Change: +12,345

Largest Increases:
  array               +2.34 MB   (+1,000 objects)
  object              +1.89 MB   (+5,234 objects)
  string              +289.45 KB (+3,456 objects)
```

## Type Distribution

Common heap object types:

| Type | Description |
|------|-------------|
| object | Plain JavaScript objects |
| array | Arrays |
| string | String primitives |
| closure | Function closures |
| regexp | Regular expressions |
| number | Boxed numbers |
| code | Compiled code |
| system | V8 internal objects |

## Memory Metrics

```javascript
{
  usedJSHeapSize: 12345678,    // Bytes used
  totalJSHeapSize: 23456789,   // Bytes allocated
  jsHeapSizeLimit: 2172649472  // Max heap size (2GB)
}
```

## Leak Detection Patterns

### Growing Arrays
```javascript
// Leak
const leaky = [];
setInterval(() => leaky.push(new Array(1000)), 100);
```

### Event Listeners
```javascript
// Leak
element.addEventListener('click', handler);
element.remove(); // Handler still attached
```

### Detached DOM
```javascript
// Leak
const div = document.createElement('div');
window.cache = div; // Reference prevents GC
```

### Closures
```javascript
// Leak
function createLeak() {
  const huge = new Array(1000000);
  return () => huge.length; // Closes over huge
}
```

## Use Cases

- **Performance Testing**: Identify memory issues
- **Leak Detection**: Find growing memory usage
- **Optimization**: Analyze object allocations
- **Regression Testing**: Compare before/after
- **Profiling**: Understand memory patterns
- **Debugging**: Track down memory bugs

## Best Practices

1. **Take multiple snapshots** over time
2. **Force GC** before comparison
3. **Look for consistent growth** not one-time allocations
4. **Focus on retained size** not shallow size
5. **Check detached DOM** nodes regularly
6. **Profile under load** to find real leaks
