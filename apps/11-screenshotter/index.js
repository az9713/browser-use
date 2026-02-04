/**
 * App 11: Screenshotter
 *
 * Demonstrates screenshot capture using CDP:
 * - Full viewport screenshot
 * - Full page screenshot (with scroll stitching)
 * - Element-specific screenshot (clip region)
 * - Screenshot with device pixel ratio
 * - Save as PNG/JPEG with quality options
 *
 * CDP Domains: Page
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import fs from 'fs/promises';
import path from 'path';

class Screenshotter {
  constructor(client) {
    this.client = client;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Page.enable');
    await this.client.send('DOM.enable');
    await this.client.send('Runtime.enable');
    console.log('[Screenshotter] Page, DOM, and Runtime domains enabled');
  }

  /**
   * Capture viewport screenshot
   * @param {object} options - Screenshot options
   * @returns {Promise<Buffer>}
   */
  async captureViewport(options = {}) {
    const {
      format = 'png',
      quality = 100,
      fromSurface = true
    } = options;

    const params = {
      format,
      fromSurface
    };

    if (format === 'jpeg' || format === 'webp') {
      params.quality = quality;
    }

    const result = await this.client.send('Page.captureScreenshot', params);
    const buffer = Buffer.from(result.data, 'base64');

    console.log(`[Screenshotter] Captured viewport (${format}, ${buffer.length} bytes)`);
    return buffer;
  }

  /**
   * Capture full page screenshot
   * @param {object} options - Screenshot options
   * @returns {Promise<Buffer>}
   */
  async captureFullPage(options = {}) {
    const {
      format = 'png',
      quality = 100
    } = options;

    // Get page dimensions
    const metrics = await this.client.send('Page.getLayoutMetrics');
    const { width, height } = metrics.contentSize;

    // Set clip to full page
    const params = {
      format,
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width,
        height,
        scale: 1
      }
    };

    if (format === 'jpeg' || format === 'webp') {
      params.quality = quality;
    }

    const result = await this.client.send('Page.captureScreenshot', params);
    const buffer = Buffer.from(result.data, 'base64');

    console.log(`[Screenshotter] Captured full page ${width}x${height} (${format}, ${buffer.length} bytes)`);
    return buffer;
  }

  /**
   * Capture a specific element
   * @param {string} selector - CSS selector
   * @param {object} options - Screenshot options
   * @returns {Promise<Buffer>}
   */
  async captureElement(selector, options = {}) {
    const {
      format = 'png',
      quality = 100,
      padding = 0
    } = options;

    // Get element bounding box
    const { root } = await this.client.send('DOM.getDocument');
    const { nodeId } = await this.client.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector
    });

    if (nodeId === 0) {
      throw new Error(`Element not found: ${selector}`);
    }

    const boxModel = await this.client.send('DOM.getBoxModel', { nodeId });
    const { content } = boxModel.model;

    // Get bounding box from quad
    const x = Math.min(content[0], content[2], content[4], content[6]) - padding;
    const y = Math.min(content[1], content[3], content[5], content[7]) - padding;
    const maxX = Math.max(content[0], content[2], content[4], content[6]) + padding;
    const maxY = Math.max(content[1], content[3], content[5], content[7]) + padding;
    const width = maxX - x;
    const height = maxY - y;

    const params = {
      format,
      clip: {
        x: Math.max(0, x),
        y: Math.max(0, y),
        width,
        height,
        scale: 1
      }
    };

    if (format === 'jpeg' || format === 'webp') {
      params.quality = quality;
    }

    const result = await this.client.send('Page.captureScreenshot', params);
    const buffer = Buffer.from(result.data, 'base64');

    console.log(`[Screenshotter] Captured element ${selector} (${width}x${height})`);
    return buffer;
  }

  /**
   * Capture screenshot with specific clip region
   * @param {object} clip - Clip region { x, y, width, height }
   * @param {object} options - Screenshot options
   * @returns {Promise<Buffer>}
   */
  async captureRegion(clip, options = {}) {
    const {
      format = 'png',
      quality = 100
    } = options;

    const params = {
      format,
      clip: {
        ...clip,
        scale: 1
      }
    };

    if (format === 'jpeg' || format === 'webp') {
      params.quality = quality;
    }

    const result = await this.client.send('Page.captureScreenshot', params);
    const buffer = Buffer.from(result.data, 'base64');

    console.log(`[Screenshotter] Captured region (${clip.width}x${clip.height})`);
    return buffer;
  }

  /**
   * Capture screenshot with device pixel ratio scaling
   * @param {number} deviceScaleFactor - Device pixel ratio (1, 2, 3)
   * @param {object} options - Screenshot options
   * @returns {Promise<Buffer>}
   */
  async captureWithDPR(deviceScaleFactor, options = {}) {
    const {
      format = 'png',
      quality = 100
    } = options;

    // Get current metrics
    const result = await this.client.send('Runtime.evaluate', {
      expression: `({ width: window.innerWidth, height: window.innerHeight })`,
      returnByValue: true
    });
    const { width, height } = result.result.value;

    // Set device metrics with new DPR
    await this.client.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: false
    });

    // Capture
    const params = {
      format
    };

    if (format === 'jpeg' || format === 'webp') {
      params.quality = quality;
    }

    const screenshot = await this.client.send('Page.captureScreenshot', params);

    // Reset device metrics
    await this.client.send('Emulation.clearDeviceMetricsOverride');

    const buffer = Buffer.from(screenshot.data, 'base64');
    console.log(`[Screenshotter] Captured with DPR ${deviceScaleFactor} (${buffer.length} bytes)`);

    return buffer;
  }

  /**
   * Save screenshot to file
   * @param {Buffer} buffer - Screenshot buffer
   * @param {string} filePath - Output file path
   */
  async saveToFile(buffer, filePath) {
    await fs.writeFile(filePath, buffer);
    console.log(`[Screenshotter] Saved to: ${filePath}`);
  }

  /**
   * Get page layout metrics
   * @returns {Promise<object>}
   */
  async getLayoutMetrics() {
    return this.client.send('Page.getLayoutMetrics');
  }

  /**
   * Capture multiple screenshots at different breakpoints
   * @param {number[]} widths - Array of viewport widths
   * @param {object} options - Screenshot options
   * @returns {Promise<Map>}
   */
  async captureBreakpoints(widths, options = {}) {
    const screenshots = new Map();

    // Get current height
    const result = await this.client.send('Runtime.evaluate', {
      expression: 'window.innerHeight',
      returnByValue: true
    });
    const height = result.result.value;

    for (const width of widths) {
      // Set viewport
      await this.client.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768
      });

      await sleep(300); // Wait for layout

      // Capture
      const buffer = await this.captureViewport(options);
      screenshots.set(width, buffer);

      console.log(`[Screenshotter] Captured at ${width}px width`);
    }

    // Reset
    await this.client.send('Emulation.clearDeviceMetricsOverride');

    return screenshots;
  }
}

// Demo
async function main() {
  console.log('=== CDP Screenshotter Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const screenshotter = new Screenshotter(client);

    // Enable domains
    await screenshotter.enable();

    // Navigate to a page
    console.log('\n--- Navigating to example.com ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    // Get layout metrics
    console.log('\n--- Layout Metrics ---');
    const metrics = await screenshotter.getLayoutMetrics();
    console.log(`  Content size: ${metrics.contentSize.width}x${metrics.contentSize.height}`);
    console.log(`  CSS layout: ${metrics.cssLayoutViewport.clientWidth}x${metrics.cssLayoutViewport.clientHeight}`);

    // Viewport screenshot
    console.log('\n--- Viewport Screenshot ---');
    const viewport = await screenshotter.captureViewport({ format: 'png' });
    await screenshotter.saveToFile(viewport, 'screenshot-viewport.png');

    // Full page screenshot
    console.log('\n--- Full Page Screenshot ---');
    const fullPage = await screenshotter.captureFullPage({ format: 'png' });
    await screenshotter.saveToFile(fullPage, 'screenshot-fullpage.png');

    // Element screenshot
    console.log('\n--- Element Screenshot (h1) ---');
    try {
      const element = await screenshotter.captureElement('h1', { padding: 10 });
      await screenshotter.saveToFile(element, 'screenshot-element.png');
    } catch (e) {
      console.log('  Could not capture element:', e.message);
    }

    // Region screenshot
    console.log('\n--- Region Screenshot ---');
    const region = await screenshotter.captureRegion({
      x: 50,
      y: 50,
      width: 300,
      height: 200
    });
    await screenshotter.saveToFile(region, 'screenshot-region.png');

    // JPEG with quality
    console.log('\n--- JPEG Screenshot (quality: 80) ---');
    const jpeg = await screenshotter.captureViewport({
      format: 'jpeg',
      quality: 80
    });
    await screenshotter.saveToFile(jpeg, 'screenshot-quality.jpg');

    // High DPR screenshot
    console.log('\n--- High DPR Screenshot (2x) ---');
    const highDpr = await screenshotter.captureWithDPR(2, { format: 'png' });
    await screenshotter.saveToFile(highDpr, 'screenshot-2x.png');

    // Breakpoint screenshots
    console.log('\n--- Breakpoint Screenshots ---');
    const breakpoints = await screenshotter.captureBreakpoints([320, 768, 1024]);
    for (const [width, buffer] of breakpoints) {
      await screenshotter.saveToFile(buffer, `screenshot-${width}px.png`);
    }

    console.log('\n=== Demo Complete ===');
    console.log('\nScreenshots saved:');
    console.log('  - screenshot-viewport.png');
    console.log('  - screenshot-fullpage.png');
    console.log('  - screenshot-element.png');
    console.log('  - screenshot-region.png');
    console.log('  - screenshot-quality.jpg');
    console.log('  - screenshot-2x.png');
    console.log('  - screenshot-320px.png');
    console.log('  - screenshot-768px.png');
    console.log('  - screenshot-1024px.png');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { Screenshotter };
