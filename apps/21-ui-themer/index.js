/**
 * App 21: UI Themer
 *
 * Demonstrates theme injection using CDP:
 * - Inject dark mode theme into any site
 * - Inject high contrast accessibility theme
 * - Inject custom brand colors
 * - Persist theme across navigation
 * - Toggle theme on/off
 *
 * CDP Domains: CSS, DOM, Runtime, Page
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

// Theme presets
const THEMES = {
  dark: `
    :root {
      --bg-primary: #1a1a2e;
      --bg-secondary: #16213e;
      --text-primary: #eee;
      --text-secondary: #aaa;
      --accent: #e94560;
    }
    html, body {
      background-color: var(--bg-primary) !important;
      color: var(--text-primary) !important;
    }
    * {
      background-color: inherit;
      color: inherit;
      border-color: var(--text-secondary) !important;
    }
    a { color: var(--accent) !important; }
    img { opacity: 0.9; }
  `,

  highContrast: `
    :root {
      --bg: #000;
      --text: #fff;
      --link: #ff0;
    }
    html, body {
      background: var(--bg) !important;
      color: var(--text) !important;
    }
    * {
      background: var(--bg) !important;
      color: var(--text) !important;
      border: 1px solid var(--text) !important;
    }
    a, a * { color: var(--link) !important; text-decoration: underline !important; }
    img { filter: contrast(1.5) !important; }
    button, input, select {
      background: var(--bg) !important;
      border: 2px solid var(--text) !important;
    }
  `,

  sepia: `
    html {
      filter: sepia(0.5) !important;
    }
    body {
      background-color: #f4ecd8 !important;
    }
  `,

  inverted: `
    html {
      filter: invert(1) hue-rotate(180deg) !important;
    }
    img, video {
      filter: invert(1) hue-rotate(180deg) !important;
    }
  `,

  readability: `
    body {
      max-width: 800px !important;
      margin: 0 auto !important;
      padding: 20px !important;
      font-family: Georgia, serif !important;
      font-size: 18px !important;
      line-height: 1.8 !important;
      background: #fffff8 !important;
      color: #333 !important;
    }
    * {
      max-width: 100% !important;
    }
    nav, aside, footer, .ad, .sidebar, .menu, [class*="banner"] {
      display: none !important;
    }
  `
};

class UIThemer {
  constructor(client) {
    this.client = client;
    this.activeTheme = null;
    this.styleNodeId = null;
    this.persistentScriptId = null;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Page.enable');
    await this.client.send('DOM.enable');
    await this.client.send('CSS.enable');
    await this.client.send('Runtime.enable');
    console.log('[UIThemer] All domains enabled');
  }

  /**
   * Apply a theme by name
   * @param {string} themeName - Theme name from THEMES
   */
  async applyTheme(themeName) {
    const css = THEMES[themeName];
    if (!css) {
      throw new Error(`Unknown theme: ${themeName}. Available: ${Object.keys(THEMES).join(', ')}`);
    }

    await this.injectCSS(css);
    this.activeTheme = themeName;
    console.log(`[UIThemer] Applied theme: ${themeName}`);
  }

  /**
   * Apply custom CSS
   * @param {string} css - CSS to inject
   */
  async injectCSS(css) {
    // Remove existing theme if any
    await this.removeTheme();

    // Inject via JavaScript
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const style = document.createElement('style');
          style.id = 'cdp-theme-injected';
          style.textContent = ${JSON.stringify(css)};
          document.head.appendChild(style);
          return true;
        })()
      `,
      returnByValue: true
    });

    console.log('[UIThemer] CSS injected');
  }

  /**
   * Remove the current theme
   */
  async removeTheme() {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const existing = document.getElementById('cdp-theme-injected');
          if (existing) existing.remove();
          return true;
        })()
      `,
      returnByValue: true
    });

    this.activeTheme = null;
    console.log('[UIThemer] Theme removed');
  }

  /**
   * Toggle theme on/off
   * @param {string} themeName - Theme to toggle
   */
  async toggleTheme(themeName) {
    if (this.activeTheme === themeName) {
      await this.removeTheme();
    } else {
      await this.applyTheme(themeName);
    }
  }

  /**
   * Set up persistent theme across navigation
   * @param {string} themeName - Theme to persist
   */
  async setPersistentTheme(themeName) {
    const css = THEMES[themeName];
    if (!css) {
      throw new Error(`Unknown theme: ${themeName}`);
    }

    // Remove any existing persistent script
    if (this.persistentScriptId) {
      await this.removePersistentTheme();
    }

    // Add script that runs on every page load
    const result = await this.client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        (function() {
          const style = document.createElement('style');
          style.id = 'cdp-theme-injected';
          style.textContent = ${JSON.stringify(css)};
          if (document.head) {
            document.head.appendChild(style);
          } else {
            document.addEventListener('DOMContentLoaded', () => {
              document.head.appendChild(style);
            });
          }
        })();
      `
    });

    this.persistentScriptId = result.identifier;
    this.activeTheme = themeName;
    console.log(`[UIThemer] Persistent theme set: ${themeName}`);
  }

  /**
   * Remove persistent theme
   */
  async removePersistentTheme() {
    if (this.persistentScriptId) {
      await this.client.send('Page.removeScriptToEvaluateOnNewDocument', {
        identifier: this.persistentScriptId
      });
      this.persistentScriptId = null;
      console.log('[UIThemer] Persistent theme removed');
    }
  }

  /**
   * Apply custom brand colors
   * @param {object} colors - Brand colors
   */
  async applyBrandColors(colors) {
    const {
      primary = '#007bff',
      secondary = '#6c757d',
      background = '#ffffff',
      text = '#212529',
      accent = '#28a745'
    } = colors;

    const css = `
      :root {
        --brand-primary: ${primary};
        --brand-secondary: ${secondary};
        --brand-bg: ${background};
        --brand-text: ${text};
        --brand-accent: ${accent};
      }
      body {
        background-color: var(--brand-bg) !important;
        color: var(--brand-text) !important;
      }
      a { color: var(--brand-primary) !important; }
      button, .btn {
        background-color: var(--brand-primary) !important;
        color: white !important;
      }
      h1, h2, h3 { color: var(--brand-secondary) !important; }
    `;

    await this.injectCSS(css);
    console.log('[UIThemer] Brand colors applied');
  }

  /**
   * Get available themes
   * @returns {string[]}
   */
  getAvailableThemes() {
    return Object.keys(THEMES);
  }

  /**
   * Get current theme
   * @returns {string|null}
   */
  getCurrentTheme() {
    return this.activeTheme;
  }

  /**
   * Create a custom theme
   * @param {object} options - Theme options
   * @returns {string} - Generated CSS
   */
  createCustomTheme(options) {
    const {
      backgroundColor = '#1a1a1a',
      textColor = '#ffffff',
      linkColor = '#4da6ff',
      fontFamily = 'inherit',
      fontSize = 'inherit'
    } = options;

    return `
      html, body {
        background-color: ${backgroundColor} !important;
        color: ${textColor} !important;
        font-family: ${fontFamily} !important;
        font-size: ${fontSize} !important;
      }
      * {
        background-color: inherit;
        color: inherit;
      }
      a { color: ${linkColor} !important; }
    `;
  }
}

// Demo
async function main() {
  console.log('=== CDP UI Themer Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const themer = new UIThemer(client);

    // Enable domains
    await themer.enable();

    // Show available themes
    console.log('--- Available Themes ---');
    console.log('  ' + themer.getAvailableThemes().join(', '));

    // Navigate to a page
    console.log('\n--- Navigating to example.com ---');
    let navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    // Apply dark theme
    console.log('\n--- Applying Dark Theme ---');
    await themer.applyTheme('dark');
    await sleep(1500);

    // Apply high contrast theme
    console.log('\n--- Applying High Contrast Theme ---');
    await themer.applyTheme('highContrast');
    await sleep(1500);

    // Apply sepia theme
    console.log('\n--- Applying Sepia Theme ---');
    await themer.applyTheme('sepia');
    await sleep(1500);

    // Apply inverted theme
    console.log('\n--- Applying Inverted Theme ---');
    await themer.applyTheme('inverted');
    await sleep(1500);

    // Apply readability theme
    console.log('\n--- Applying Readability Theme ---');
    await themer.applyTheme('readability');
    await sleep(1500);

    // Custom brand colors
    console.log('\n--- Applying Brand Colors ---');
    await themer.applyBrandColors({
      primary: '#6b46c1',
      secondary: '#805ad5',
      background: '#f8f5ff',
      text: '#2d3748',
      accent: '#38b2ac'
    });
    await sleep(1500);

    // Set persistent theme
    console.log('\n--- Setting Persistent Dark Theme ---');
    await themer.setPersistentTheme('dark');

    // Navigate to another page (theme persists)
    console.log('\n--- Navigating to httpbin.org (theme persists) ---');
    navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://httpbin.org/html' });
    await navPromise;
    await sleep(1500);

    // Remove theme
    console.log('\n--- Removing Theme ---');
    await themer.removeTheme();
    await themer.removePersistentTheme();

    console.log(`\nCurrent theme: ${themer.getCurrentTheme() || 'none'}`);

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { UIThemer, THEMES };
