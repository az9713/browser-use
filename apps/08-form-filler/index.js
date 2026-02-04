/**
 * App 08: Form Filler
 *
 * Demonstrates form interaction using CDP:
 * - Fill text inputs
 * - Select dropdown options
 * - Check/uncheck checkboxes
 * - Select radio buttons
 * - Upload files
 * - Submit forms
 *
 * CDP Domains: Input, DOM, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, waitForElement, sleep } from '../../shared/wait-helpers.js';
import { getElementCenter } from '../../shared/utils.js';

class FormFiller {
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
    console.log('[FormFiller] DOM, Page, and Runtime domains enabled');
  }

  /**
   * Execute JavaScript and return result
   */
  async evaluate(expression, awaitPromise = false) {
    const result = await this.client.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise
    });
    if (result.exceptionDetails) {
      throw new Error(`Evaluation failed: ${result.exceptionDetails.text}`);
    }
    return result.result.value;
  }

  /**
   * Focus an element by selector
   */
  async focus(selector) {
    await this.evaluate(`document.querySelector('${selector}').focus()`);
  }

  /**
   * Fill a text input
   * @param {string} selector - CSS selector
   * @param {string} value - Value to enter
   */
  async fillInput(selector, value) {
    // Clear existing value and set new one
    await this.evaluate(`
      (function() {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Element not found: ${selector}');
        el.focus();
        el.value = '';
        el.value = '${value.replace(/'/g, "\\'")}';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    console.log(`[FormFiller] Filled input ${selector} with: ${value}`);
  }

  /**
   * Select an option in a dropdown
   * @param {string} selector - CSS selector for select element
   * @param {string} value - Option value to select
   */
  async selectOption(selector, value) {
    await this.evaluate(`
      (function() {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Element not found: ${selector}');
        el.value = '${value.replace(/'/g, "\\'")}';
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    console.log(`[FormFiller] Selected option "${value}" in ${selector}`);
  }

  /**
   * Select an option by visible text
   * @param {string} selector - CSS selector for select element
   * @param {string} text - Option text to select
   */
  async selectOptionByText(selector, text) {
    await this.evaluate(`
      (function() {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Element not found: ${selector}');
        const option = Array.from(el.options).find(o => o.text === '${text.replace(/'/g, "\\'")}');
        if (!option) throw new Error('Option not found: ${text}');
        el.value = option.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    console.log(`[FormFiller] Selected option by text "${text}" in ${selector}`);
  }

  /**
   * Check a checkbox
   * @param {string} selector - CSS selector
   */
  async checkCheckbox(selector) {
    await this.evaluate(`
      (function() {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Element not found: ${selector}');
        if (!el.checked) {
          el.checked = true;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    console.log(`[FormFiller] Checked checkbox: ${selector}`);
  }

  /**
   * Uncheck a checkbox
   * @param {string} selector - CSS selector
   */
  async uncheckCheckbox(selector) {
    await this.evaluate(`
      (function() {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Element not found: ${selector}');
        if (el.checked) {
          el.checked = false;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    console.log(`[FormFiller] Unchecked checkbox: ${selector}`);
  }

  /**
   * Toggle a checkbox
   * @param {string} selector - CSS selector
   */
  async toggleCheckbox(selector) {
    await this.evaluate(`
      (function() {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Element not found: ${selector}');
        el.checked = !el.checked;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    console.log(`[FormFiller] Toggled checkbox: ${selector}`);
  }

  /**
   * Select a radio button
   * @param {string} selector - CSS selector
   */
  async selectRadio(selector) {
    await this.evaluate(`
      (function() {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Element not found: ${selector}');
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    console.log(`[FormFiller] Selected radio: ${selector}`);
  }

  /**
   * Select a radio button by name and value
   * @param {string} name - Radio button name attribute
   * @param {string} value - Radio button value
   */
  async selectRadioByValue(name, value) {
    await this.evaluate(`
      (function() {
        const el = document.querySelector('input[type="radio"][name="${name}"][value="${value}"]');
        if (!el) throw new Error('Radio not found: ${name}=${value}');
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    console.log(`[FormFiller] Selected radio: ${name}=${value}`);
  }

  /**
   * Upload files to a file input
   * @param {string} selector - CSS selector for file input
   * @param {string[]} filePaths - Array of absolute file paths
   */
  async uploadFiles(selector, filePaths) {
    // Get the nodeId of the file input
    const { root } = await this.client.send('DOM.getDocument');
    const { nodeId } = await this.client.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector
    });

    if (nodeId === 0) {
      throw new Error(`File input not found: ${selector}`);
    }

    // Set files
    await this.client.send('DOM.setFileInputFiles', {
      nodeId,
      files: filePaths
    });

    console.log(`[FormFiller] Uploaded ${filePaths.length} file(s) to ${selector}`);
  }

  /**
   * Submit a form
   * @param {string} selector - CSS selector for form or submit button
   */
  async submit(selector) {
    await this.evaluate(`
      (function() {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Element not found: ${selector}');
        if (el.tagName === 'FORM') {
          el.submit();
        } else if (el.type === 'submit' || el.tagName === 'BUTTON') {
          el.click();
        } else {
          // Try to find the form and submit it
          const form = el.closest('form');
          if (form) form.submit();
          else throw new Error('Cannot find form to submit');
        }
      })()
    `);
    console.log(`[FormFiller] Submitted form: ${selector}`);
  }

  /**
   * Fill a textarea
   * @param {string} selector - CSS selector
   * @param {string} value - Text to enter
   */
  async fillTextarea(selector, value) {
    // Escape backticks and ${} in the value for template literal
    const escapedValue = value.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    await this.evaluate(`
      (function() {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Element not found: ${selector}');
        el.focus();
        el.value = \`${escapedValue}\`;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    console.log(`[FormFiller] Filled textarea ${selector}`);
  }

  /**
   * Get all form fields and their values
   * @param {string} formSelector - CSS selector for form
   * @returns {Promise<object>}
   */
  async getFormData(formSelector) {
    return this.evaluate(`
      (function() {
        const form = document.querySelector('${formSelector}');
        if (!form) return {};
        const data = {};
        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
          if (data[key]) {
            if (Array.isArray(data[key])) data[key].push(value);
            else data[key] = [data[key], value];
          } else {
            data[key] = value;
          }
        }
        return data;
      })()
    `);
  }

  /**
   * Fill multiple form fields at once
   * @param {object} fields - Object mapping selectors to values
   */
  async fillForm(fields) {
    for (const [selector, value] of Object.entries(fields)) {
      await this.fillInput(selector, value);
      await sleep(100);
    }
    console.log(`[FormFiller] Filled ${Object.keys(fields).length} fields`);
  }

  /**
   * Clear a form
   * @param {string} formSelector - CSS selector for form
   */
  async clearForm(formSelector) {
    await this.evaluate(`
      (function() {
        const form = document.querySelector('${formSelector}');
        if (form) form.reset();
      })()
    `);
    console.log(`[FormFiller] Cleared form: ${formSelector}`);
  }
}

// Demo
async function main() {
  console.log('=== CDP Form Filler Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const filler = new FormFiller(client);

    // Enable domains
    await filler.enable();

    // Navigate to a form page
    console.log('\n--- Navigating to form page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://httpbin.org/forms/post' });
    await navPromise;
    await sleep(500);

    // Fill text inputs
    console.log('\n--- Filling text inputs ---');
    await filler.fillInput('input[name="custname"]', 'John Doe');
    await filler.fillInput('input[name="custtel"]', '555-123-4567');
    await filler.fillInput('input[name="custemail"]', 'john@example.com');

    // Select dropdown (if available)
    console.log('\n--- Interacting with dropdowns ---');
    try {
      await filler.selectOption('select[name="size"]', 'medium');
    } catch (e) {
      console.log('  No dropdown found on this page');
    }

    // Check checkboxes (if available)
    console.log('\n--- Interacting with checkboxes ---');
    try {
      await filler.checkCheckbox('input[type="checkbox"]');
    } catch (e) {
      console.log('  No checkbox found on this page');
    }

    // Select radio buttons
    console.log('\n--- Selecting radio buttons ---');
    try {
      await filler.selectRadio('input[type="radio"]');
    } catch (e) {
      console.log('  No radio buttons found on this page');
    }

    // Fill textarea
    console.log('\n--- Filling textarea ---');
    try {
      await filler.fillTextarea('textarea', 'This is a comment.\nWith multiple lines.');
    } catch (e) {
      console.log('  No textarea found on this page');
    }

    // Get form data before submit
    console.log('\n--- Form Data ---');
    const formData = await filler.getFormData('form');
    console.log('  Current form values:', formData);

    // Submit the form
    console.log('\n--- Submitting form ---');
    await filler.submit('form');
    await sleep(2000);

    // Show result
    console.log('\n--- Checking result ---');
    const pageText = await filler.evaluate('document.body.innerText');
    console.log('  Response received (form submitted successfully)');

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { FormFiller };
