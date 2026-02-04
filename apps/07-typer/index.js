/**
 * App 07: Typer
 *
 * Demonstrates keyboard input simulation using CDP:
 * - Type text character by character
 * - Type with realistic delays
 * - Press special keys (Enter, Tab, Escape, Backspace)
 * - Keyboard shortcuts (Ctrl+A, Ctrl+C, Ctrl+V)
 * - Clear input fields
 *
 * CDP Domains: Input
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, waitForElement, sleep } from '../../shared/wait-helpers.js';
import { getKeyParams, parseShortcut, getModifierFlags } from '../../shared/utils.js';

class Typer {
  constructor(client) {
    this.client = client;
    this.defaultDelay = 50; // ms between keystrokes
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Page.enable');
    await this.client.send('DOM.enable');
    console.log('[Typer] Page and DOM domains enabled');
  }

  /**
   * Dispatch a key event
   * @param {string} type - Event type (keyDown, keyUp, char)
   * @param {object} params - Key event parameters
   */
  async dispatchKeyEvent(type, params) {
    await this.client.send('Input.dispatchKeyEvent', {
      type,
      ...params
    });
  }

  /**
   * Press a single key (down and up)
   * @param {string} key - Key name (e.g., 'Enter', 'Tab', 'a')
   * @param {object} modifiers - Modifier keys
   */
  async pressKey(key, modifiers = {}) {
    const keyParams = getKeyParams(key);
    const modifierFlags = getModifierFlags(modifiers);

    // Key down
    await this.dispatchKeyEvent('keyDown', {
      key: keyParams.key,
      code: keyParams.code,
      windowsVirtualKeyCode: keyParams.keyCode,
      nativeVirtualKeyCode: keyParams.keyCode,
      modifiers: modifierFlags
    });

    // Char event for printable characters
    if (keyParams.text && key.length === 1) {
      await this.dispatchKeyEvent('char', {
        text: keyParams.text,
        modifiers: modifierFlags
      });
    }

    // Key up
    await this.dispatchKeyEvent('keyUp', {
      key: keyParams.key,
      code: keyParams.code,
      windowsVirtualKeyCode: keyParams.keyCode,
      nativeVirtualKeyCode: keyParams.keyCode,
      modifiers: modifierFlags
    });
  }

  /**
   * Type text character by character
   * @param {string} text - Text to type
   * @param {object} options - Typing options
   */
  async type(text, options = {}) {
    const { delay = this.defaultDelay } = options;

    console.log(`[Typer] Typing: "${text}"`);

    for (const char of text) {
      await this.pressKey(char);
      if (delay > 0) {
        await sleep(delay);
      }
    }
  }

  /**
   * Type text using insertText (faster, no key events)
   * @param {string} text - Text to insert
   */
  async insertText(text) {
    await this.client.send('Input.insertText', { text });
    console.log(`[Typer] Inserted: "${text}"`);
  }

  /**
   * Press Enter key
   */
  async pressEnter() {
    await this.pressKey('Enter');
    console.log('[Typer] Pressed Enter');
  }

  /**
   * Press Tab key
   */
  async pressTab() {
    await this.pressKey('Tab');
    console.log('[Typer] Pressed Tab');
  }

  /**
   * Press Escape key
   */
  async pressEscape() {
    await this.pressKey('Escape');
    console.log('[Typer] Pressed Escape');
  }

  /**
   * Press Backspace key
   * @param {number} times - Number of times to press
   */
  async pressBackspace(times = 1) {
    for (let i = 0; i < times; i++) {
      await this.pressKey('Backspace');
      await sleep(20);
    }
    console.log(`[Typer] Pressed Backspace ${times} time(s)`);
  }

  /**
   * Press Delete key
   * @param {number} times - Number of times to press
   */
  async pressDelete(times = 1) {
    for (let i = 0; i < times; i++) {
      await this.pressKey('Delete');
      await sleep(20);
    }
    console.log(`[Typer] Pressed Delete ${times} time(s)`);
  }

  /**
   * Press a keyboard shortcut
   * @param {string} shortcut - Shortcut string (e.g., 'Ctrl+A', 'Ctrl+Shift+V')
   */
  async pressShortcut(shortcut) {
    const { modifiers, key } = parseShortcut(shortcut);
    await this.pressKey(key, modifiers);
    console.log(`[Typer] Pressed shortcut: ${shortcut}`);
  }

  /**
   * Select all (Ctrl+A)
   */
  async selectAll() {
    await this.pressShortcut('Ctrl+A');
  }

  /**
   * Copy (Ctrl+C)
   */
  async copy() {
    await this.pressShortcut('Ctrl+C');
  }

  /**
   * Paste (Ctrl+V)
   */
  async paste() {
    await this.pressShortcut('Ctrl+V');
  }

  /**
   * Cut (Ctrl+X)
   */
  async cut() {
    await this.pressShortcut('Ctrl+X');
  }

  /**
   * Undo (Ctrl+Z)
   */
  async undo() {
    await this.pressShortcut('Ctrl+Z');
  }

  /**
   * Clear an input field
   */
  async clearField() {
    await this.selectAll();
    await sleep(50);
    await this.pressBackspace();
    console.log('[Typer] Cleared field');
  }

  /**
   * Type with realistic human-like delays
   * @param {string} text - Text to type
   */
  async typeHumanLike(text) {
    console.log(`[Typer] Typing (human-like): "${text}"`);

    for (const char of text) {
      await this.pressKey(char);

      // Variable delay based on character
      let delay;
      if (char === ' ') {
        delay = 80 + Math.random() * 120; // Longer pause at spaces
      } else if ('.!?,'.includes(char)) {
        delay = 150 + Math.random() * 200; // Longer pause at punctuation
      } else {
        delay = 30 + Math.random() * 80; // Normal characters
      }

      await sleep(delay);
    }
  }

  /**
   * Press arrow key
   * @param {string} direction - 'up', 'down', 'left', 'right'
   * @param {number} times - Number of times to press
   */
  async pressArrow(direction, times = 1) {
    const keyName = `Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
    for (let i = 0; i < times; i++) {
      await this.pressKey(keyName);
      await sleep(20);
    }
    console.log(`[Typer] Pressed ${keyName} ${times} time(s)`);
  }

  /**
   * Press Home key
   */
  async pressHome() {
    await this.pressKey('Home');
    console.log('[Typer] Pressed Home');
  }

  /**
   * Press End key
   */
  async pressEnd() {
    await this.pressKey('End');
    console.log('[Typer] Pressed End');
  }
}

// Demo
async function main() {
  console.log('=== CDP Typer Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const typer = new Typer(client);

    // Enable domains
    await typer.enable();

    // Navigate to a page with input fields
    console.log('\n--- Navigating to form page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://httpbin.org/forms/post' });
    await navPromise;
    await sleep(500);

    // Focus on the first input (using Runtime.evaluate)
    console.log('\n--- Focusing first input ---');
    await client.send('Runtime.evaluate', {
      expression: 'document.querySelector("input").focus()'
    });
    await sleep(200);

    // Type in the input
    console.log('\n--- Typing demo ---');
    await typer.type('John Doe');

    // Tab to next field
    await sleep(300);
    await typer.pressTab();
    await sleep(200);

    // Type phone number
    await typer.type('555-1234');

    // Tab to next field
    await typer.pressTab();
    await sleep(200);

    // Type email
    await typer.type('john@example.com');

    // Demo: clear and retype
    console.log('\n--- Clear and retype demo ---');
    await typer.clearField();
    await sleep(200);
    await typer.type('jane@example.com');

    // Demo: insert text (faster method)
    console.log('\n--- Insert text demo ---');
    await typer.pressTab();
    await sleep(200);
    await typer.insertText('This is inserted all at once!');

    // Demo: special keys
    console.log('\n--- Special keys demo ---');
    await typer.pressArrow('left', 5);
    await typer.pressHome();
    await typer.pressEnd();

    // Demo: keyboard shortcuts
    console.log('\n--- Keyboard shortcuts demo ---');
    await typer.selectAll();
    await sleep(200);
    await typer.copy();

    // Demo: human-like typing
    console.log('\n--- Human-like typing demo ---');
    await client.send('Runtime.evaluate', {
      expression: 'document.querySelector("textarea") && document.querySelector("textarea").focus()'
    });
    await sleep(200);
    await typer.typeHumanLike('Hello, this is typed with variable delays!');

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { Typer };
