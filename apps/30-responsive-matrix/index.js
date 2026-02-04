/**
 * App 30: Responsive Matrix
 *
 * Screenshot pages at multiple breakpoints using CDP:
 * - Capture at common device sizes
 * - Mobile, tablet, desktop viewports
 * - Portrait and landscape orientations
 * - Custom breakpoints
 * - Side-by-side comparison
 *
 * CDP Domains: Emulation, Page
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import { createTimestampedFilename } from '../../shared/utils.js';
import fs from 'fs';
import path from 'path';

class ResponsiveMatrix {
  constructor(client) {
    this.client = client;
    this.screenshots = [];
  }

  async enable() {
    await this.client.send('Page.enable');
    await this.client.send('Emulation.clearDeviceMetricsOverride');
    console.log('[ResponsiveMatrix] Enabled');
  }

  // Common device presets
  static DEVICES = {
    // Mobile
    'iPhone SE': { width: 375, height: 667, deviceScaleFactor: 2, mobile: true },
    'iPhone 12 Pro': { width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
    'iPhone 14 Pro Max': { width: 430, height: 932, deviceScaleFactor: 3, mobile: true },
    'Pixel 5': { width: 393, height: 851, deviceScaleFactor: 2.75, mobile: true },
    'Samsung Galaxy S21': { width: 360, height: 800, deviceScaleFactor: 3, mobile: true },

    // Tablet
    'iPad Mini': { width: 768, height: 1024, deviceScaleFactor: 2, mobile: true },
    'iPad Air': { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true },
    'iPad Pro 11': { width: 834, height: 1194, deviceScaleFactor: 2, mobile: true },
    'iPad Pro 12.9': { width: 1024, height: 1366, deviceScaleFactor: 2, mobile: true },

    // Desktop
    'Desktop HD': { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false },
    'Desktop FHD': { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false },
    'Desktop QHD': { width: 2560, height: 1440, deviceScaleFactor: 1, mobile: false },
    'Desktop 4K': { width: 3840, height: 2160, deviceScaleFactor: 1, mobile: false }
  };

  // Common breakpoints
  static BREAKPOINTS = {
    'xs-mobile': { width: 320, height: 568 },
    'mobile': { width: 375, height: 667 },
    'mobile-lg': { width: 414, height: 896 },
    'tablet-sm': { width: 600, height: 960 },
    'tablet': { width: 768, height: 1024 },
    'tablet-lg': { width: 1024, height: 1366 },
    'desktop-sm': { width: 1280, height: 800 },
    'desktop': { width: 1440, height: 900 },
    'desktop-lg': { width: 1920, height: 1080 },
    'desktop-xl': { width: 2560, height: 1440 }
  };

  async setViewport(width, height, deviceScaleFactor = 1, mobile = false) {
    await this.client.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile
    });

    // Also set user agent if mobile
    if (mobile) {
      await this.client.send('Emulation.setUserAgentOverride', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      });
    } else {
      await this.client.send('Emulation.setUserAgentOverride', {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
    }

    // Wait for resize
    await sleep(500);
  }

  async captureScreenshot(name = 'screenshot') {
    const result = await this.client.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });

    return {
      name,
      data: result.data,
      timestamp: Date.now()
    };
  }

  async captureAtBreakpoint(breakpoint, url = null) {
    const config = ResponsiveMatrix.BREAKPOINTS[breakpoint] ||
                   ResponsiveMatrix.DEVICES[breakpoint];

    if (!config) {
      throw new Error(`Unknown breakpoint: ${breakpoint}`);
    }

    console.log(`[ResponsiveMatrix] Capturing ${breakpoint} (${config.width}x${config.height})`);

    await this.setViewport(
      config.width,
      config.height,
      config.deviceScaleFactor || 1,
      config.mobile || false
    );

    if (url) {
      const navPromise = waitForNavigation(this.client);
      await this.client.send('Page.navigate', { url });
      await navPromise;
      await sleep(1000);
    }

    const screenshot = await this.captureScreenshot(breakpoint);
    screenshot.width = config.width;
    screenshot.height = config.height;
    screenshot.breakpoint = breakpoint;

    this.screenshots.push(screenshot);
    return screenshot;
  }

  async captureMatrix(breakpoints, url) {
    const results = [];

    for (const breakpoint of breakpoints) {
      try {
        const screenshot = await this.captureAtBreakpoint(breakpoint, breakpoints.indexOf(breakpoint) === 0 ? url : null);
        results.push(screenshot);
      } catch (error) {
        console.error(`[ResponsiveMatrix] Failed to capture ${breakpoint}:`, error.message);
      }
    }

    return results;
  }

  async captureOrientation(deviceName, url, portrait = true, landscape = true) {
    const device = ResponsiveMatrix.DEVICES[deviceName];
    if (!device) {
      throw new Error(`Unknown device: ${deviceName}`);
    }

    const results = [];

    if (portrait) {
      console.log(`[ResponsiveMatrix] ${deviceName} - Portrait`);
      await this.setViewport(device.width, device.height, device.deviceScaleFactor, device.mobile);

      if (url) {
        const navPromise = waitForNavigation(this.client);
        await this.client.send('Page.navigate', { url });
        await navPromise;
        await sleep(1000);
      }

      const screenshot = await this.captureScreenshot(`${deviceName}-portrait`);
      screenshot.device = deviceName;
      screenshot.orientation = 'portrait';
      results.push(screenshot);
    }

    if (landscape) {
      console.log(`[ResponsiveMatrix] ${deviceName} - Landscape`);
      await this.setViewport(device.height, device.width, device.deviceScaleFactor, device.mobile);
      await sleep(500);

      const screenshot = await this.captureScreenshot(`${deviceName}-landscape`);
      screenshot.device = deviceName;
      screenshot.orientation = 'landscape';
      results.push(screenshot);
    }

    return results;
  }

  async saveScreenshot(screenshot, outputDir = './screenshots') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${screenshot.name}-${screenshot.width}x${screenshot.height}.png`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, screenshot.data, 'base64');
    console.log(`[ResponsiveMatrix] Saved: ${filepath}`);

    return filepath;
  }

  async saveAllScreenshots(outputDir = './screenshots') {
    const paths = [];

    for (const screenshot of this.screenshots) {
      const filepath = await this.saveScreenshot(screenshot, outputDir);
      paths.push(filepath);
    }

    return paths;
  }

  async resetViewport() {
    await this.client.send('Emulation.clearDeviceMetricsOverride');
    await this.client.send('Emulation.setUserAgentOverride', { userAgent: '' });
    console.log('[ResponsiveMatrix] Viewport reset');
  }

  generateHTMLReport(screenshots, title = 'Responsive Screenshots') {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .screenshot { background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .screenshot h3 { margin: 0 0 10px 0; color: #555; font-size: 16px; }
    .screenshot img { width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; }
    .meta { font-size: 12px; color: #888; margin-top: 8px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="grid">
`;

    screenshots.forEach(shot => {
      html += `
    <div class="screenshot">
      <h3>${shot.name}</h3>
      <img src="data:image/png;base64,${shot.data}" alt="${shot.name}">
      <div class="meta">${shot.width}x${shot.height} • ${new Date(shot.timestamp).toLocaleString()}</div>
    </div>
`;
    });

    html += `
  </div>
</body>
</html>
`;

    return html;
  }

  async saveHTMLReport(outputPath = './screenshots/report.html') {
    const html = this.generateHTMLReport(this.screenshots);
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html);
    console.log(`[ResponsiveMatrix] Report saved: ${outputPath}`);
    return outputPath;
  }
}

async function main() {
  console.log('=== CDP Responsive Matrix Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const matrix = new ResponsiveMatrix(client);

    await matrix.enable();

    const testUrl = 'https://example.com';

    console.log('\n--- Capturing common breakpoints ---');
    const breakpoints = ['mobile', 'tablet', 'desktop', 'desktop-lg'];
    await matrix.captureMatrix(breakpoints, testUrl);

    console.log('\n--- Capturing device orientations ---');
    await matrix.captureOrientation('iPhone 12 Pro', null, true, true);
    await matrix.captureOrientation('iPad Air', null, true, true);

    console.log('\n--- Screenshot Summary ---');
    console.log(`  Total screenshots: ${matrix.screenshots.length}`);
    matrix.screenshots.forEach((shot, i) => {
      console.log(`  ${i + 1}. ${shot.name} (${shot.width}x${shot.height})`);
    });

    console.log('\n--- Saving screenshots ---');
    const outputDir = path.join(process.cwd(), 'screenshots');
    await matrix.saveAllScreenshots(outputDir);

    console.log('\n--- Generating HTML report ---');
    const reportPath = path.join(outputDir, 'responsive-report.html');
    await matrix.saveHTMLReport(reportPath);

    console.log('\n--- Resetting viewport ---');
    await matrix.resetViewport();

    console.log('\n=== Demo Complete ===');
    console.log(`\nView report: file://${reportPath}`);

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { ResponsiveMatrix };
