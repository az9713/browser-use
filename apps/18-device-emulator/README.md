# App 18: Device Emulator

Emulate different devices and conditions using Chrome DevTools Protocol.

## Features

- Set viewport size
- Emulate mobile devices (iPhone, Pixel, iPad)
- Set device pixel ratio
- Override geolocation
- Override timezone
- Set user agent
- Touch emulation
- CPU throttling
- Network conditions
- Color vision deficiency
- Dark mode preference
- Reduced motion preference

## CDP Domains Used

- **Emulation** - Device emulation
- **Network** - Network conditions

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Emulation.setDeviceMetricsOverride` | Set viewport/DPR |
| `Emulation.setUserAgentOverride` | Set user agent |
| `Emulation.setGeolocationOverride` | Set location |
| `Emulation.setTimezoneOverride` | Set timezone |
| `Emulation.setTouchEmulationEnabled` | Enable touch |
| `Emulation.setCPUThrottlingRate` | Throttle CPU |
| `Emulation.setEmulatedVisionDeficiency` | Color blindness |
| `Emulation.setEmulatedMedia` | Media features |

## Device Presets

| Device | Width | Height | DPR | Mobile |
|--------|-------|--------|-----|--------|
| iPhone 14 Pro | 393 | 852 | 3 | Yes |
| iPhone SE | 375 | 667 | 2 | Yes |
| Pixel 7 | 412 | 915 | 2.625 | Yes |
| iPad Pro | 1024 | 1366 | 2 | Yes |
| Galaxy S21 | 360 | 800 | 3 | Yes |
| Desktop HD | 1920 | 1080 | 1 | No |
| Laptop | 1366 | 768 | 1 | No |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the emulator
node apps/18-device-emulator/index.js
```

## Example Output

```
=== CDP Device Emulator Demo ===

[DeviceEmulator] Page domain enabled

--- Available Devices ---
  iPhone 14 Pro, iPhone SE, Pixel 7, iPad Pro, Galaxy S21, Desktop HD, Laptop

--- Emulating iPhone 14 Pro ---
[DeviceEmulator] Set viewport: 393x852 (DPR: 3)
[DeviceEmulator] Set user agent: Mozilla/5.0 (iPhone; CPU iPhone...
[DeviceEmulator] Emulating: iPhone 14 Pro
  Current viewport: { width: 393, height: 852, dpr: 3 }

--- Setting Geolocation (San Francisco) ---
[DeviceEmulator] Set geolocation: 37.7749, -122.4194

--- Enabling Dark Mode ---
[DeviceEmulator] Dark mode: enabled
  Prefers dark mode: true

=== Demo Complete ===
```

## API Reference

### `DeviceEmulator` Class

```javascript
const emulator = new DeviceEmulator(cdpClient);

// Enable domains
await emulator.enable();

// Emulate predefined device
await emulator.emulateDevice('iPhone 14 Pro');
await emulator.emulateDevice('Pixel 7');
await emulator.emulateDevice('iPad Pro');

// Custom viewport
await emulator.setViewport(1440, 900, {
  deviceScaleFactor: 2,
  mobile: false,
  screenOrientation: { angle: 0, type: 'portraitPrimary' }
});

// Set user agent
await emulator.setUserAgent('Mozilla/5.0...', {
  acceptLanguage: 'en-US',
  platform: 'iPhone'
});

// Override geolocation
await emulator.setGeolocation(37.7749, -122.4194, 100);
await emulator.clearGeolocation();

// Override timezone
await emulator.setTimezone('America/New_York');

// Set locale
await emulator.setLocale('en-US');

// Touch emulation
await emulator.setTouchEmulation(true, 5);

// CPU throttling (4x slower)
await emulator.setCPUThrottle(4);

// Network conditions
await emulator.setNetworkConditions({
  offline: false,
  latency: 100,                  // ms
  downloadThroughput: 1000000,   // bytes/sec
  uploadThroughput: 500000
});

// Vision deficiency
await emulator.setVisionDeficiency('deuteranopia');
// Types: none, achromatopsia, blurredVision, deuteranopia,
//        protanopia, tritanopia

// Media preferences
await emulator.setDarkMode(true);
await emulator.setReducedMotion(true);

// Clear emulation
await emulator.clearEmulation();

// Get available devices
const devices = emulator.getAvailableDevices();
```

## Screen Orientations

```javascript
{
  angle: 0,
  type: 'portraitPrimary'     // Portrait
}
{
  angle: 90,
  type: 'landscapePrimary'    // Landscape
}
```

## Network Presets

```javascript
// Slow 3G
{ latency: 400, downloadThroughput: 500000, uploadThroughput: 500000 }

// Fast 3G
{ latency: 200, downloadThroughput: 1500000, uploadThroughput: 750000 }

// Offline
{ offline: true }
```

## Tips

- Reload page after changing viewport for full effect
- Touch emulation affects pointer events
- CPU throttling affects all page JS
- Combine multiple settings for realistic testing
- Use vision deficiency for accessibility testing
