/**
 * App 09: Scroller
 *
 * Demonstrates page scrolling using CDP:
 * - Scroll by pixels
 * - Scroll to element
 * - Scroll to bottom (infinite scroll handling)
 * - Horizontal scrolling
 * - Smooth vs instant scrolling
 *
 * CDP Domains: Input, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class Scroller {
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
    console.log('[Scroller] DOM, Page, and Runtime domains enabled');
  }

  /**
   * Execute JavaScript
   */
  async evaluate(expression) {
    const result = await this.client.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return result.result.value;
  }

  /**
   * Dispatch mouse wheel event
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} deltaX - Horizontal scroll amount
   * @param {number} deltaY - Vertical scroll amount
   */
  async dispatchWheelEvent(x, y, deltaX, deltaY) {
    await this.client.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x,
      y,
      deltaX,
      deltaY
    });
  }

  /**
   * Scroll by pixel amount
   * @param {number} deltaX - Horizontal pixels (negative = left, positive = right)
   * @param {number} deltaY - Vertical pixels (negative = up, positive = down)
   */
  async scrollBy(deltaX, deltaY) {
    await this.evaluate(`window.scrollBy(${deltaX}, ${deltaY})`);
    console.log(`[Scroller] Scrolled by (${deltaX}, ${deltaY})`);
  }

  /**
   * Scroll to specific position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  async scrollTo(x, y) {
    await this.evaluate(`window.scrollTo(${x}, ${y})`);
    console.log(`[Scroller] Scrolled to (${x}, ${y})`);
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop() {
    await this.scrollTo(0, 0);
    console.log('[Scroller] Scrolled to top');
  }

  /**
   * Scroll to bottom of page
   */
  async scrollToBottom() {
    await this.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    console.log('[Scroller] Scrolled to bottom');
  }

  /**
   * Scroll an element into view
   * @param {string} selector - CSS selector
   * @param {object} options - scrollIntoView options
   */
  async scrollToElement(selector, options = {}) {
    const { behavior = 'auto', block = 'center', inline = 'center' } = options;
    await this.evaluate(`
      document.querySelector('${selector}')?.scrollIntoView({
        behavior: '${behavior}',
        block: '${block}',
        inline: '${inline}'
      })
    `);
    console.log(`[Scroller] Scrolled to element: ${selector}`);
  }

  /**
   * Smooth scroll by pixel amount
   * @param {number} deltaX - Horizontal pixels
   * @param {number} deltaY - Vertical pixels
   */
  async smoothScrollBy(deltaX, deltaY) {
    await this.evaluate(`
      window.scrollBy({
        left: ${deltaX},
        top: ${deltaY},
        behavior: 'smooth'
      })
    `);
    console.log(`[Scroller] Smooth scrolled by (${deltaX}, ${deltaY})`);
  }

  /**
   * Smooth scroll to position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  async smoothScrollTo(x, y) {
    await this.evaluate(`
      window.scrollTo({
        left: ${x},
        top: ${y},
        behavior: 'smooth'
      })
    `);
    console.log(`[Scroller] Smooth scrolled to (${x}, ${y})`);
  }

  /**
   * Get current scroll position
   * @returns {Promise<{x: number, y: number}>}
   */
  async getScrollPosition() {
    return this.evaluate(`({ x: window.scrollX, y: window.scrollY })`);
  }

  /**
   * Get page dimensions
   * @returns {Promise<object>}
   */
  async getPageDimensions() {
    return this.evaluate(`({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      scrollableWidth: document.documentElement.scrollWidth - window.innerWidth,
      scrollableHeight: document.documentElement.scrollHeight - window.innerHeight
    })`);
  }

  /**
   * Scroll down by one viewport height
   */
  async pageDown() {
    const { viewportHeight } = await this.getPageDimensions();
    await this.scrollBy(0, viewportHeight);
    console.log('[Scroller] Paged down');
  }

  /**
   * Scroll up by one viewport height
   */
  async pageUp() {
    const { viewportHeight } = await this.getPageDimensions();
    await this.scrollBy(0, -viewportHeight);
    console.log('[Scroller] Paged up');
  }

  /**
   * Scroll using mouse wheel events
   * @param {number} deltaY - Scroll amount (positive = down, negative = up)
   * @param {number} steps - Number of wheel events
   */
  async wheelScroll(deltaY, steps = 1) {
    const { viewportWidth, viewportHeight } = await this.getPageDimensions();
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    for (let i = 0; i < steps; i++) {
      await this.dispatchWheelEvent(centerX, centerY, 0, deltaY);
      await sleep(50);
    }

    console.log(`[Scroller] Wheel scrolled ${steps} times (deltaY: ${deltaY})`);
  }

  /**
   * Scroll to load more content (for infinite scroll pages)
   * @param {number} scrolls - Number of scroll actions
   * @param {number} waitTime - Time to wait between scrolls for content to load
   */
  async infiniteScroll(scrolls = 5, waitTime = 1000) {
    console.log(`[Scroller] Starting infinite scroll (${scrolls} iterations)`);

    for (let i = 0; i < scrolls; i++) {
      const beforeHeight = await this.evaluate('document.body.scrollHeight');

      await this.scrollToBottom();
      await sleep(waitTime);

      const afterHeight = await this.evaluate('document.body.scrollHeight');

      if (afterHeight > beforeHeight) {
        console.log(`  Iteration ${i + 1}: New content loaded (height: ${beforeHeight} -> ${afterHeight})`);
      } else {
        console.log(`  Iteration ${i + 1}: No new content (reached end or loading)`);
      }
    }

    console.log('[Scroller] Infinite scroll complete');
  }

  /**
   * Scroll within an element (e.g., a scrollable div)
   * @param {string} selector - CSS selector for scrollable container
   * @param {number} deltaX - Horizontal pixels
   * @param {number} deltaY - Vertical pixels
   */
  async scrollWithinElement(selector, deltaX, deltaY) {
    await this.evaluate(`
      const el = document.querySelector('${selector}');
      if (el) {
        el.scrollBy(${deltaX}, ${deltaY});
      }
    `);
    console.log(`[Scroller] Scrolled within ${selector} by (${deltaX}, ${deltaY})`);
  }

  /**
   * Scroll element to top
   * @param {string} selector - CSS selector
   */
  async scrollElementToTop(selector) {
    await this.evaluate(`
      const el = document.querySelector('${selector}');
      if (el) el.scrollTop = 0;
    `);
    console.log(`[Scroller] Scrolled ${selector} to top`);
  }

  /**
   * Scroll element to bottom
   * @param {string} selector - CSS selector
   */
  async scrollElementToBottom(selector) {
    await this.evaluate(`
      const el = document.querySelector('${selector}');
      if (el) el.scrollTop = el.scrollHeight;
    `);
    console.log(`[Scroller] Scrolled ${selector} to bottom`);
  }
}

// Demo
async function main() {
  console.log('=== CDP Scroller Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const scroller = new Scroller(client);

    // Enable domains
    await scroller.enable();

    // Navigate to a long page
    console.log('\n--- Navigating to a long page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://en.wikipedia.org/wiki/Web_scraping' });
    await navPromise;
    await sleep(500);

    // Get page dimensions
    console.log('\n--- Page Dimensions ---');
    const dims = await scroller.getPageDimensions();
    console.log(`  Viewport: ${dims.viewportWidth}x${dims.viewportHeight}`);
    console.log(`  Document: ${dims.documentWidth}x${dims.documentHeight}`);
    console.log(`  Scrollable: ${dims.scrollableWidth}x${dims.scrollableHeight}`);

    // Get initial position
    let pos = await scroller.getScrollPosition();
    console.log(`\n--- Initial Position: (${pos.x}, ${pos.y}) ---`);

    // Scroll by pixels
    console.log('\n--- Scroll by 500 pixels ---');
    await scroller.scrollBy(0, 500);
    await sleep(300);
    pos = await scroller.getScrollPosition();
    console.log(`  New position: (${pos.x}, ${pos.y})`);

    // Smooth scroll
    console.log('\n--- Smooth scroll down 300 pixels ---');
    await scroller.smoothScrollBy(0, 300);
    await sleep(500);
    pos = await scroller.getScrollPosition();
    console.log(`  New position: (${pos.x}, ${pos.y})`);

    // Scroll to element
    console.log('\n--- Scroll to element (h2) ---');
    await scroller.scrollToElement('h2', { behavior: 'smooth', block: 'start' });
    await sleep(500);

    // Page down/up
    console.log('\n--- Page down ---');
    await scroller.pageDown();
    await sleep(300);

    console.log('\n--- Page up ---');
    await scroller.pageUp();
    await sleep(300);

    // Scroll to bottom
    console.log('\n--- Scroll to bottom ---');
    await scroller.scrollToBottom();
    await sleep(300);
    pos = await scroller.getScrollPosition();
    console.log(`  Position at bottom: (${pos.x}, ${pos.y})`);

    // Scroll to top
    console.log('\n--- Scroll to top ---');
    await scroller.scrollToTop();
    await sleep(300);
    pos = await scroller.getScrollPosition();
    console.log(`  Position at top: (${pos.x}, ${pos.y})`);

    // Mouse wheel scroll
    console.log('\n--- Mouse wheel scroll ---');
    await scroller.wheelScroll(100, 3);
    await sleep(300);

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { Scroller };
