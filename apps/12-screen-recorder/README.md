# App 12: Screen Recorder

Record browser sessions as video using Chrome DevTools Protocol.

## Features

- Start/stop video recording
- Capture frames via screencast
- Save frames as images
- Assemble into video (ffmpeg)
- Create animated GIFs
- Configurable quality and FPS

## CDP Domains Used

- **Page** - Screencast capture

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Page.startScreencast` | Start capturing frames |
| `Page.stopScreencast` | Stop capturing |
| `Page.screencastFrame` | Frame received event |
| `Page.screencastFrameAck` | Acknowledge frame |

## Prerequisites

For video/GIF creation, install ffmpeg:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows (with Chocolatey)
choco install ffmpeg
```

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the recorder
node apps/12-screen-recorder/index.js
```

## Example Output

```
=== CDP Screen Recorder Demo ===

[ScreenRecorder] Page domain enabled

--- Starting Recording ---
[ScreenRecorder] Started recording (800x600)

--- Performing actions ---

--- Stopping Recording ---
[ScreenRecorder] Stopped recording (45 frames)
  Captured 45 frames
  Duration: 4.52s

--- Saving Frames ---
[ScreenRecorder] Saved 45 frames to recording-frames

--- Creating Video ---
[ScreenRecorder] Creating video with ffmpeg...
[ScreenRecorder] Video saved to: recording.mp4

--- Creating GIF ---
[ScreenRecorder] Creating GIF with ffmpeg...
[ScreenRecorder] GIF saved to: recording.gif

=== Demo Complete ===
```

## API Reference

### `ScreenRecorder` Class

```javascript
const recorder = new ScreenRecorder(cdpClient);

// Enable required domains
await recorder.enable();

// Start recording
await recorder.startRecording({
  format: 'png',        // Frame format
  quality: 80,          // Quality 0-100
  maxWidth: 1280,       // Max frame width
  maxHeight: 720,       // Max frame height
  everyNthFrame: 1      // Capture every Nth frame
});

// Perform actions...
await sleep(3000);

// Stop recording
const stats = await recorder.stopRecording();
// { frameCount: 45, duration: 3.0 }

// Save frames as images
const files = await recorder.saveFrames('output-dir');

// Create video (requires ffmpeg)
await recorder.createVideo('output-dir', 'recording.mp4', {
  fps: 10,              // Output framerate
  codec: 'libx264',     // Video codec
  crf: 23               // Quality (lower = better)
});

// Create GIF (requires ffmpeg)
await recorder.createGif('output-dir', 'recording.gif', {
  fps: 5,
  width: 640
});

// Get specific frame
const frame = recorder.getFrame(0);  // Returns Buffer

// Get duration
const duration = recorder.getDuration();

// Clear frames from memory
recorder.clearFrames();
```

## Screencast Parameters

```javascript
{
  format: 'png',        // 'jpeg' or 'png'
  quality: 80,          // 0-100 (jpeg only)
  maxWidth: 1280,       // Max width
  maxHeight: 720,       // Max height
  everyNthFrame: 1      // Skip frames (1 = all)
}
```

## Frame Data

Each captured frame contains:

```javascript
{
  data: 'base64...',           // Base64 image data
  metadata: {
    timestamp: 12345.678,      // Frame timestamp
    deviceWidth: 1280,
    deviceHeight: 720,
    scrollOffsetX: 0,
    scrollOffsetY: 100
  },
  sessionId: 12345
}
```

## ffmpeg Commands Used

### Video Creation
```bash
ffmpeg -y \
  -framerate 10 \
  -i frame-%05d.png \
  -c:v libx264 \
  -crf 23 \
  -pix_fmt yuv420p \
  output.mp4
```

### GIF Creation
```bash
ffmpeg -y \
  -framerate 5 \
  -i frame-%05d.png \
  -vf "scale=640:-1:flags=lanczos" \
  output.gif
```

## Tips

- Lower `everyNthFrame` for smoother video (more frames)
- Higher `quality` increases file size
- Use `maxWidth/maxHeight` to reduce memory usage
- GIFs work great for short demos
- Clear frames after saving to free memory
- Frame timestamps help calculate actual FPS
