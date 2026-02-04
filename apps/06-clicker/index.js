/**
 * App 06: Clicker
 *
 * Demonstrates mouse click interactions using CDP:
 * - Click by selector (resolve to coordinates)
 * - Click by coordinates
 * - Right-click (context menu)
 * - Double-click
 * - Click with modifiers (Ctrl, Shift, Alt)
 *
 * CDP Domains: Input, DOM, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, waitForElement, sleep } from '../../shared/wait-helpers.js';
import { getElementCenter, getModifierFlags } from '../../shared/utils.js';

class Clicker {
  constructor(client) {
    this.client = client;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('DOM.enable');
    await this.client.send('Page.enable');
    await this.client.send('Runtime.enable');
    console.log('[Clicker] DOM, Page, and Runtime domains enabled');
  }

  /**
   * Get element coordinates by selector
   * @param {string} selector - CSS selector
   * @returns {Promise<{x: number, y: number}>}
   */
  async getElementCoordinates(selector) {
    const { root } = await this.client.send('DOM.getDocument');
    const { nodeId } = await this.client.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector
    });

    if (nodeId === 0) {
      throw new Error(`Element not found: ${selector}`);
    }

    const boxModel = await this.client.send('DOM.getBoxModel', { nodeId });
    return getElementCenter(boxModel);
  }

  /**
   * Dispatch a mouse event
   * @param {string} type - Event type (mousePressed, mouseReleased, mouseMoved)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {object} options - Additional options
   */
  async dispatchMouseEvent(type, x, y, options = {}) {
    const {
      button = 'left',
      clickCount = 1,
      modifiers = 0
    } = options;

    await this.client.send('Input.dispatchMouseEvent', {
      type,
      x,
      y,
      button,
      clickCount,
      modifiers
    });
  }

  /**
   * Click at specific coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {object} options - Click options
   */
  async clickAt(x, y, options = {}) {
    const { button = 'left', modifiers = {} } = options;
    const modifierFlags = getModifierFlags(modifiers);

    // Move to position
    await this.dispatchMouseEvent('mouseMoved', x, y);
    await sleep(10);

    // Press
    await this.dispatchMouseEvent('mousePressed', x, y, {
      button,
      clickCount: 1,
      modifiers: modifierFlags
    });

    // Release
    await this.dispatchMouseEvent('mouseReleased', x, y, {
      button,
      clickCount: 1,
      modifiers: modifierFlags
    });

    console.log(`[Clicker] Clicked at (${x}, ${y}) with ${button} button`);
  }

  /**
   * Click on an element by selector
   * @param {string} selector - CSS selector
   * @param {object} options - Click options
   */
  async click(selector, options = {}) {
    const coords = await this.getElementCoordinates(selector);
    await this.clickAt(coords.x, coords.y, options);
    console.log(`[Clicker] Clicked on: ${selector}`);
  }

  /**
   * Double-click at coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  async doubleClickAt(x, y) {
    // Move to position
    await this.dispatchMouseEvent('mouseMoved', x, y);
    await sleep(10);

    // First click
    await this.dispatchMouseEvent('mousePressed', x, y, { clickCount: 1 });
    await this.dispatchMouseEvent('mouseReleased', x, y, { clickCount: 1 });

    await sleep(50);

    // Second click
    await this.dispatchMouseEvent('mousePressed', x, y, { clickCount: 2 });
    await this.dispatchMouseEvent('mouseReleased', x, y, { clickCount: 2 });

    console.log(`[Clicker] Double-clicked at (${x}, ${y})`);
  }

  /**
   * Double-click on an element
   * @param {string} selector - CSS selector
   */
  async doubleClick(selector) {
    const coords = await this.getElementCoordinates(selector);
    await this.doubleClickAt(coords.x, coords.y);
    console.log(`[Clicker] Double-clicked on: ${selector}`);
  }

  /**
   * Right-click at coordinates (context menu)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  async rightClickAt(x, y) {
    await this.clickAt(x, y, { button: 'right' });
    console.log(`[Clicker] Right-clicked at (${x}, ${y})`);
  }

  /**
   * Right-click on an element
   * @param {string} selector - CSS selector
   */
  async rightClick(selector) {
    const coords = await this.getElementCoordinates(selector);
    await this.rightClickAt(coords.x, coords.y);
    console.log(`[Clicker] Right-clicked on: ${selector}`);
  }

  /**
   * Click with Ctrl key held
   * @param {string} selector - CSS selector
   */
  async ctrlClick(selector) {
    await this.click(selector, { modifiers: { ctrl: true } });
  }

  /**
   * Click with Shift key held
   * @param {string} selector - CSS selector
   */
  async shiftClick(selector) {
    await this.click(selector, { modifiers: { shift: true } });
  }

  /**
   * Click with Alt key held
   * @param {string} selector - CSS selector
   */
  async altClick(selector) {
    await this.click(selector, { modifiers: { alt: true } });
  }

  /**
   * Hover over an element (mouse move without click)
   * @param {string} selector - CSS selector
   */
  async hover(selector) {
    const coords = await this.getElementCoordinates(selector);
    await this.dispatchMouseEvent('mouseMoved', coords.x, coords.y);
    console.log(`[Clicker] Hovering over: ${selector}`);
  }

  /**
   * Mouse down (without release)
   * @param {string} selector - CSS selector
   */
  async mouseDown(selector) {
    const coords = await this.getElementCoordinates(selector);
    await this.dispatchMouseEvent('mouseMoved', coords.x, coords.y);
    await this.dispatchMouseEvent('mousePressed', coords.x, coords.y, { clickCount: 1 });
    console.log(`[Clicker] Mouse down on: ${selector}`);
  }

  /**
   * Mouse up
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  async mouseUp(x, y) {
    await this.dispatchMouseEvent('mouseReleased', x, y, { clickCount: 1 });
    console.log(`[Clicker] Mouse up at (${x}, ${y})`);
  }
}

// Demo
async function main() {
  console.log('=== CDP Clicker Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const clicker = new Clicker(client);

    // Enable domains
    await clicker.enable();

    // Navigate to a page with clickable elements
    console.log('\n--- Navigating to example.com ---');
    let navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    // Click on a link
    console.log('\n--- Clicking on link ---');
    await clicker.click('a');

    // Wait for navigation
    await sleep(1000);

    // Go back
    console.log('\n--- Going back ---');
    await client.send('Page.navigate', { url: 'https://example.com' });
    await sleep(1000);

    // Hover demo
    console.log('\n--- Hover demo ---');
    await clicker.hover('h1');
    await sleep(500);

    // Navigate to a page with a form
    console.log('\n--- Navigating to form page ---');
    navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://httpbin.org/forms/post' });
    await navPromise;
    await sleep(500);

    // Click on input field
    console.log('\n--- Clicking on input field ---');
    try {
      await clicker.click('input[name="custname"]');
    } catch (e) {
      console.log('  Input field not found, trying alternative selector');
      await clicker.click('input[type="text"]');
    }

    // Click on submit button
    console.log('\n--- Clicking on submit button ---');
    try {
      await clicker.click('button[type="submit"]');
    } catch (e) {
      console.log('  button[type="submit"] not found, trying button');
      try {
        await clicker.click('button');
      } catch (e2) {
        console.log('  button not found, trying input[type="submit"]');
        await clicker.click('input[type="submit"]');
      }
    }

    await sleep(500);

    // Demonstrate clicking by coordinates
    console.log('\n--- Click by coordinates demo ---');
    await clicker.clickAt(100, 100);

    // Demonstrate double-click
    console.log('\n--- Double-click demo ---');
    await clicker.doubleClickAt(200, 200);

    // Demonstrate right-click
    console.log('\n--- Right-click demo ---');
    await clicker.rightClickAt(300, 300);

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { Clicker };
