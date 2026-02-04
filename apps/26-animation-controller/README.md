# App 26: Animation Controller

Control and inspect CSS animations and transitions using Chrome DevTools Protocol.

## Features

- List all active animations
- Pause/play individual or all animations
- Variable playback rate (slow motion, fast forward)
- Seek to specific time
- Animation timeline visualization
- Real-time event monitoring
- Type detection (CSS animation vs transition)

## CDP Domains Used

- **Animation** - Animation control and events
- **Runtime** - JavaScript evaluation
- **DOM** - Element access

## Animation Events

The controller listens for:
- `animationCreated` - New animation detected
- `animationStarted` - Animation playback begins
- `animationCanceled` - Animation canceled

## Usage

```bash
chrome --remote-debugging-port=9222
node apps/26-animation-controller/index.js
```

## API Reference

```javascript
const controller = new AnimationController(client);
await controller.enable();

// List animations
const animations = await controller.listAnimations();
// Returns: [{ id, name, type, currentTime, playbackRate, source }]

// Control individual
await controller.pauseAnimation(animId);
await controller.playAnimation(animId);
await controller.seekTo(animId, timeMs);

// Control all
await controller.pauseAll();
await controller.playAll();

// Playback rate
await controller.setPlaybackRate(animId, 0.25); // slow motion
await controller.setPlaybackRate(animId, 2.0);  // fast forward
await controller.setPlaybackRate(animId, 1.0);  // normal

// Timeline
const timeline = await controller.getAnimationTimeline();

// Cleanup
await controller.releaseAnimations();
```

## Animation Object

```javascript
{
  id: 'animation-123',
  name: 'slide',
  type: 'CSSAnimation', // or 'CSSTransition', 'WebAnimation'
  currentTime: 1500,
  playbackRate: 1.0,
  playState: 'running',
  startTime: 1000,
  source: {
    delay: 0,
    duration: 3000,
    iterations: Infinity,
    easing: 'ease-in-out'
  }
}
```

## Playback Rates

| Rate | Effect |
|------|--------|
| 0.1 | Super slow (10x slower) |
| 0.25 | Slow motion (4x slower) |
| 0.5 | Half speed |
| 1.0 | Normal speed |
| 2.0 | Double speed |
| 5.0 | Fast forward |

## Timeline Visualization

```
slide
  [████████████░░░░░░░░░░░░░░░░░░] 40.0%
rotate
  [██████░░░░░░░░░░░░░░░░░░░░░░░░] 20.0%
pulse
  [██████████████████████░░░░░░░░] 73.3%
```

## Test Animations

The demo includes built-in test animations:
- **Slide**: Translation (3s, ease-in-out, infinite alternate)
- **Rotate**: Rotation (4s, linear, infinite)
- **Pulse**: Scale + Opacity (2s, ease-in-out, infinite)
- **Transition**: Transform on hover (1s, ease-in-out)
