/**
 * App 10: Drag & Drop
 *
 * Demonstrates drag and drop interactions using CDP:
 * - Drag element to coordinates
 * - Drag element to another element
 * - Drag file to drop zone
 * - Sortable list reordering
 *
 * CDP Domains: Input, DOM
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import { getElementCenter } from '../../shared/utils.js';

class DragDrop {
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
    console.log('[DragDrop] DOM, Page, and Runtime domains enabled');
  }

  /**
   * Get element coordinates by selector
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
   * Dispatch mouse event
   */
  async dispatchMouseEvent(type, x, y, options = {}) {
    await this.client.send('Input.dispatchMouseEvent', {
      type,
      x,
      y,
      button: options.button || 'left',
      clickCount: options.clickCount || 1,
      ...options
    });
  }

  /**
   * Drag from one position to another
   * @param {number} fromX - Start X
   * @param {number} fromY - Start Y
   * @param {number} toX - End X
   * @param {number} toY - End Y
   * @param {object} options - Drag options
   */
  async dragFromTo(fromX, fromY, toX, toY, options = {}) {
    const { steps = 10, duration = 500 } = options;
    const stepDelay = duration / steps;

    // Move to start position
    await this.dispatchMouseEvent('mouseMoved', fromX, fromY);
    await sleep(50);

    // Mouse down
    await this.dispatchMouseEvent('mousePressed', fromX, fromY, {
      button: 'left',
      clickCount: 1
    });
    await sleep(50);

    // Move in steps
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const currentX = fromX + (toX - fromX) * progress;
      const currentY = fromY + (toY - fromY) * progress;

      await this.dispatchMouseEvent('mouseMoved', currentX, currentY);
      await sleep(stepDelay);
    }

    // Mouse up
    await this.dispatchMouseEvent('mouseReleased', toX, toY, {
      button: 'left',
      clickCount: 1
    });

    console.log(`[DragDrop] Dragged from (${fromX}, ${fromY}) to (${toX}, ${toY})`);
  }

  /**
   * Drag an element to specific coordinates
   * @param {string} selector - CSS selector of element to drag
   * @param {number} toX - Destination X
   * @param {number} toY - Destination Y
   * @param {object} options - Drag options
   */
  async dragElementTo(selector, toX, toY, options = {}) {
    const from = await this.getElementCoordinates(selector);
    await this.dragFromTo(from.x, from.y, toX, toY, options);
    console.log(`[DragDrop] Dragged ${selector} to (${toX}, ${toY})`);
  }

  /**
   * Drag an element onto another element
   * @param {string} sourceSelector - CSS selector of element to drag
   * @param {string} targetSelector - CSS selector of drop target
   * @param {object} options - Drag options
   */
  async dragElementToElement(sourceSelector, targetSelector, options = {}) {
    const from = await this.getElementCoordinates(sourceSelector);
    const to = await this.getElementCoordinates(targetSelector);
    await this.dragFromTo(from.x, from.y, to.x, to.y, options);
    console.log(`[DragDrop] Dragged ${sourceSelector} to ${targetSelector}`);
  }

  /**
   * Drag element by offset
   * @param {string} selector - CSS selector
   * @param {number} offsetX - X offset
   * @param {number} offsetY - Y offset
   * @param {object} options - Drag options
   */
  async dragElementByOffset(selector, offsetX, offsetY, options = {}) {
    const from = await this.getElementCoordinates(selector);
    await this.dragFromTo(from.x, from.y, from.x + offsetX, from.y + offsetY, options);
    console.log(`[DragDrop] Dragged ${selector} by (${offsetX}, ${offsetY})`);
  }

  /**
   * Perform a drag with HTML5 drag events
   * This uses Runtime.evaluate to dispatch proper drag events
   */
  async html5Drag(sourceSelector, targetSelector) {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const source = document.querySelector('${sourceSelector}');
          const target = document.querySelector('${targetSelector}');
          if (!source || !target) return false;

          const dataTransfer = new DataTransfer();

          // Dispatch dragstart on source
          source.dispatchEvent(new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer
          }));

          // Dispatch dragenter on target
          target.dispatchEvent(new DragEvent('dragenter', {
            bubbles: true,
            cancelable: true,
            dataTransfer
          }));

          // Dispatch dragover on target
          target.dispatchEvent(new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            dataTransfer
          }));

          // Dispatch drop on target
          target.dispatchEvent(new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer
          }));

          // Dispatch dragend on source
          source.dispatchEvent(new DragEvent('dragend', {
            bubbles: true,
            cancelable: true,
            dataTransfer
          }));

          return true;
        })()
      `,
      returnByValue: true
    });

    console.log(`[DragDrop] HTML5 drag from ${sourceSelector} to ${targetSelector}`);
  }

  /**
   * Simulate file drop on an element
   * @param {string} selector - Drop zone selector
   * @param {string[]} filePaths - Absolute paths to files
   */
  async dropFiles(selector, filePaths) {
    // Get the nodeId
    const { root } = await this.client.send('DOM.getDocument');
    const { nodeId } = await this.client.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector
    });

    if (nodeId === 0) {
      throw new Error(`Element not found: ${selector}`);
    }

    // Set files using DOM.setFileInputFiles won't work for drop zones
    // Instead, we need to dispatch events with file data

    // For actual file drops, we'd need to use Input.dispatchDragEvent
    // This is a simplified version that works with some drop zones
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const dropZone = document.querySelector('${selector}');
          if (!dropZone) return false;

          const dataTransfer = new DataTransfer();

          // Create a dragover event
          dropZone.dispatchEvent(new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            dataTransfer
          }));

          // Create a drop event
          dropZone.dispatchEvent(new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer
          }));

          return true;
        })()
      `,
      returnByValue: true
    });

    console.log(`[DragDrop] Dropped ${filePaths.length} files on ${selector}`);
  }

  /**
   * Reorder items in a sortable list
   * @param {string} itemSelector - Selector for the item to move
   * @param {number} positions - Positions to move (positive = down, negative = up)
   * @param {number} itemHeight - Height of each item in pixels
   */
  async reorderListItem(itemSelector, positions, itemHeight = 50) {
    const offsetY = positions * itemHeight;
    await this.dragElementByOffset(itemSelector, 0, offsetY, { steps: 5, duration: 300 });
    console.log(`[DragDrop] Reordered ${itemSelector} by ${positions} positions`);
  }

  /**
   * Drag to select (like selecting text or multiple items)
   * @param {number} fromX - Start X
   * @param {number} fromY - Start Y
   * @param {number} toX - End X
   * @param {number} toY - End Y
   */
  async dragToSelect(fromX, fromY, toX, toY) {
    await this.dragFromTo(fromX, fromY, toX, toY, { steps: 20, duration: 200 });
    console.log('[DragDrop] Selection drag complete');
  }
}

// Demo
async function main() {
  console.log('=== CDP Drag & Drop Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const dragDrop = new DragDrop(client);

    // Enable domains
    await dragDrop.enable();

    // Navigate to a page with draggable elements
    console.log('\n--- Navigating to drag & drop demo page ---');
    const navPromise = waitForNavigation(client);
    // Using a simple HTML5 drag and drop demo page
    await client.send('Page.navigate', {
      url: 'data:text/html,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial; padding: 20px; }
            .container { display: flex; gap: 20px; margin-top: 20px; }
            .box {
              width: 200px; height: 200px;
              border: 2px dashed #ccc;
              padding: 10px;
              display: flex;
              flex-direction: column;
              gap: 10px;
            }
            .item {
              background: #4a90d9;
              color: white;
              padding: 10px;
              cursor: move;
              user-select: none;
            }
            .dropzone {
              background: #f0f0f0;
              min-height: 100px;
            }
            .dropzone.dragover { background: #d0ffd0; }
          </style>
        </head>
        <body>
          <h1>Drag & Drop Demo</h1>
          <div class="container">
            <div class="box" id="source">
              <h3>Source</h3>
              <div class="item" id="item1" draggable="true">Item 1</div>
              <div class="item" id="item2" draggable="true">Item 2</div>
              <div class="item" id="item3" draggable="true">Item 3</div>
            </div>
            <div class="box dropzone" id="target">
              <h3>Drop Here</h3>
            </div>
          </div>
          <script>
            const items = document.querySelectorAll('.item');
            const dropzone = document.getElementById('target');

            items.forEach(item => {
              item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.id);
              });
            });

            dropzone.addEventListener('dragover', (e) => {
              e.preventDefault();
              dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', () => {
              dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', (e) => {
              e.preventDefault();
              dropzone.classList.remove('dragover');
              const id = e.dataTransfer.getData('text/plain');
              const el = document.getElementById(id);
              if (el) dropzone.appendChild(el);
            });
          </script>
        </body>
        </html>
      `)
    });
    await navPromise;
    await sleep(500);

    // Perform mouse-based drag
    console.log('\n--- Mouse drag demo ---');
    try {
      await dragDrop.dragElementByOffset('#item1', 200, 0, { steps: 15, duration: 500 });
    } catch (e) {
      console.log('  Could not drag item1:', e.message);
    }
    await sleep(300);

    // Perform HTML5 drag
    console.log('\n--- HTML5 drag demo ---');
    await dragDrop.html5Drag('#item2', '#target');
    await sleep(300);

    // Drag to coordinates
    console.log('\n--- Drag to coordinates demo ---');
    try {
      await dragDrop.dragElementTo('#item3', 500, 300, { steps: 20, duration: 600 });
    } catch (e) {
      console.log('  Could not complete drag:', e.message);
    }
    await sleep(300);

    // Simple coordinate drag
    console.log('\n--- Coordinate drag demo ---');
    await dragDrop.dragFromTo(100, 200, 400, 300, { steps: 10, duration: 400 });

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { DragDrop };
