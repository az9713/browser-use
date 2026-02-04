/**
 * App 18: Device Emulator
 *
 * Demonstrates device emulation using CDP:
 * - Set viewport size
 * - Emulate mobile devices (iPhone, Pixel, etc.)
 * - Set device pixel ratio
 * - Override geolocation
 * - Override timezone
 * - Set user agent
 *
 * CDP Domains: Emulation
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

// Common device presets
const DEVICES = {
  'iPhone 14 Pro': {
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    mobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  },
  'iPhone SE': {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  },
  'Pixel 7': {
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    mobile: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  },
  'iPad Pro': {
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2,
    mobile: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  },
  'Galaxy S21': {
    width: 360,
    height: 800,
    deviceScaleFactor: 3,
    mobile: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  },
  'Desktop HD': {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  'Laptop': {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

class DeviceEmulator {
  constructor(client) {
    this.client = client;
    this.currentDevice = null;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Page.enable');
    console.log('[DeviceEmulator] Page domain enabled');
  }

  /**
   * Set viewport size
   * @param {number} width - Viewport width
   * @param {number} height - Viewport height
   * @param {object} options - Additional options
   */
  async setViewport(width, height, options = {}) {
    const {
      deviceScaleFactor = 1,
      mobile = false,
      screenOrientation = null
    } = options;

    const params = {
      width,
      height,
      deviceScaleFactor,
      mobile
    };

    if (screenOrientation) {
      params.screenOrientation = screenOrientation;
    }

    await this.client.send('Emulation.setDeviceMetricsOverride', params);
    console.log(`[DeviceEmulator] Set viewport: ${width}x${height} (DPR: ${deviceScaleFactor})`);
  }

  /**
   * Emulate a predefined device
   * @param {string} deviceName - Device name from DEVICES
   */
  async emulateDevice(deviceName) {
    const device = DEVICES[deviceName];
    if (!device) {
      throw new Error(`Unknown device: ${deviceName}. Available: ${Object.keys(DEVICES).join(', ')}`);
    }

    await this.setViewport(device.width, device.height, {
      deviceScaleFactor: device.deviceScaleFactor,
      mobile: device.mobile
    });

    await this.setUserAgent(device.userAgent);

    this.currentDevice = deviceName;
    console.log(`[DeviceEmulator] Emulating: ${deviceName}`);
  }

  /**
   * Clear device emulation
   */
  async clearEmulation() {
    await this.client.send('Emulation.clearDeviceMetricsOverride');
    this.currentDevice = null;
    console.log('[DeviceEmulator] Cleared device emulation');
  }

  /**
   * Set user agent string
   * @param {string} userAgent - User agent string
   * @param {object} options - Additional options
   */
  async setUserAgent(userAgent, options = {}) {
    const {
      acceptLanguage = null,
      platform = null
    } = options;

    const params = { userAgent };
    if (acceptLanguage) params.acceptLanguage = acceptLanguage;
    if (platform) params.platform = platform;

    await this.client.send('Emulation.setUserAgentOverride', params);
    console.log(`[DeviceEmulator] Set user agent: ${userAgent.substring(0, 50)}...`);
  }

  /**
   * Override geolocation
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} accuracy - Accuracy in meters
   */
  async setGeolocation(latitude, longitude, accuracy = 100) {
    await this.client.send('Emulation.setGeolocationOverride', {
      latitude,
      longitude,
      accuracy
    });
    console.log(`[DeviceEmulator] Set geolocation: ${latitude}, ${longitude}`);
  }

  /**
   * Clear geolocation override
   */
  async clearGeolocation() {
    await this.client.send('Emulation.clearGeolocationOverride');
    console.log('[DeviceEmulator] Cleared geolocation');
  }

  /**
   * Override timezone
   * @param {string} timezoneId - Timezone ID (e.g., 'America/New_York')
   */
  async setTimezone(timezoneId) {
    await this.client.send('Emulation.setTimezoneOverride', { timezoneId });
    console.log(`[DeviceEmulator] Set timezone: ${timezoneId}`);
  }

  /**
   * Set locale (affects navigator.language)
   * @param {string} locale - Locale string (e.g., 'en-US')
   */
  async setLocale(locale) {
    await this.client.send('Emulation.setLocaleOverride', { locale });
    console.log(`[DeviceEmulator] Set locale: ${locale}`);
  }

  /**
   * Emulate touch events
   * @param {boolean} enabled - Enable touch
   * @param {number} maxTouchPoints - Max touch points
   */
  async setTouchEmulation(enabled, maxTouchPoints = 1) {
    await this.client.send('Emulation.setTouchEmulationEnabled', {
      enabled,
      maxTouchPoints
    });
    console.log(`[DeviceEmulator] Touch emulation: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set CPU throttling
   * @param {number} rate - Slowdown factor (1 = no throttle)
   */
  async setCPUThrottle(rate) {
    await this.client.send('Emulation.setCPUThrottlingRate', { rate });
    console.log(`[DeviceEmulator] CPU throttle: ${rate}x slowdown`);
  }

  /**
   * Set network conditions
   * @param {object} conditions - Network conditions
   */
  async setNetworkConditions(conditions) {
    const {
      offline = false,
      latency = 0,
      downloadThroughput = -1,
      uploadThroughput = -1
    } = conditions;

    await this.client.send('Network.enable');
    await this.client.send('Network.emulateNetworkConditions', {
      offline,
      latency,
      downloadThroughput,
      uploadThroughput
    });
    console.log(`[DeviceEmulator] Network: offline=${offline}, latency=${latency}ms`);
  }

  /**
   * Emulate color vision deficiency
   * @param {string} type - Type of deficiency
   */
  async setVisionDeficiency(type) {
    // Types: none, achromatopsia, blurredVision, deuteranopia,
    // protanopia, tritanopia
    await this.client.send('Emulation.setEmulatedVisionDeficiency', { type });
    console.log(`[DeviceEmulator] Vision deficiency: ${type}`);
  }

  /**
   * Set dark mode preference
   * @param {boolean} enabled - Enable dark mode
   */
  async setDarkMode(enabled) {
    const features = enabled ?
      [{ name: 'prefers-color-scheme', value: 'dark' }] :
      [{ name: 'prefers-color-scheme', value: 'light' }];

    await this.client.send('Emulation.setEmulatedMedia', {
      features
    });
    console.log(`[DeviceEmulator] Dark mode: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set reduced motion preference
   * @param {boolean} enabled - Enable reduced motion
   */
  async setReducedMotion(enabled) {
    await this.client.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-motion', value: enabled ? 'reduce' : 'no-preference' }
      ]
    });
    console.log(`[DeviceEmulator] Reduced motion: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get list of available device presets
   * @returns {string[]}
   */
  getAvailableDevices() {
    return Object.keys(DEVICES);
  }
}

// Demo
async function main() {
  console.log('=== CDP Device Emulator Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const emulator = new DeviceEmulator(client);

    // Enable domains
    await emulator.enable();

    // Navigate to a responsive page
    console.log('\n--- Navigating to test page ---');
    let navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    // Show available devices
    console.log('\n--- Available Devices ---');
    console.log('  ' + emulator.getAvailableDevices().join(', '));

    // Emulate iPhone
    console.log('\n--- Emulating iPhone 14 Pro ---');
    await emulator.emulateDevice('iPhone 14 Pro');
    await sleep(500);

    // Check viewport via JS
    const dimensions = await client.send('Runtime.evaluate', {
      expression: `({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio,
        userAgent: navigator.userAgent.substring(0, 50)
      })`,
      returnByValue: true
    });
    console.log('  Current viewport:', dimensions.result.value);

    // Emulate different device
    console.log('\n--- Emulating iPad Pro ---');
    await emulator.emulateDevice('iPad Pro');
    await sleep(500);

    // Set custom viewport
    console.log('\n--- Custom Viewport (1440x900) ---');
    await emulator.setViewport(1440, 900, { deviceScaleFactor: 2 });
    await sleep(500);

    // Set geolocation
    console.log('\n--- Setting Geolocation (San Francisco) ---');
    await emulator.setGeolocation(37.7749, -122.4194);

    // Set timezone
    console.log('\n--- Setting Timezone ---');
    await emulator.setTimezone('America/Los_Angeles');

    // Check timezone via JS
    const tz = await client.send('Runtime.evaluate', {
      expression: 'Intl.DateTimeFormat().resolvedOptions().timeZone',
      returnByValue: true
    });
    console.log('  Current timezone:', tz.result.value);

    // Enable dark mode
    console.log('\n--- Enabling Dark Mode ---');
    await emulator.setDarkMode(true);

    // Check dark mode preference
    const darkMode = await client.send('Runtime.evaluate', {
      expression: 'window.matchMedia("(prefers-color-scheme: dark)").matches',
      returnByValue: true
    });
    console.log('  Prefers dark mode:', darkMode.result.value);

    // Enable reduced motion
    console.log('\n--- Enabling Reduced Motion ---');
    await emulator.setReducedMotion(true);

    // Set touch emulation
    console.log('\n--- Enabling Touch Emulation ---');
    await emulator.setTouchEmulation(true, 5);

    // Vision deficiency
    console.log('\n--- Emulating Vision Deficiency ---');
    await emulator.setVisionDeficiency('deuteranopia');
    await sleep(500);
    await emulator.setVisionDeficiency('none');

    // Clear all emulation
    console.log('\n--- Clearing Emulation ---');
    await emulator.clearEmulation();
    await emulator.clearGeolocation();

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { DeviceEmulator, DEVICES };
