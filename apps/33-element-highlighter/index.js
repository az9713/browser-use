/**
 * App 33: Element Highlighter
 *
 * Interactive element inspector with highlighting using CDP:
 * - Visual element highlighting
 * - Show selector path
 * - Display computed styles
 * - Box model overlay
 * - Interactive selection
 * - Multi-element highlighting
 *
 * CDP Domains: Overlay, DOM, CSS
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class ElementHighlighter {
  constructor(client) {
    this.client = client;
    this.highlightedElements = new Map();
  }

  async enable() {
    await this.client.send('Overlay.enable');
    await this.client.send('DOM.enable');
    await this.client.send('CSS.enable');
    await this.client.send('Runtime.enable');
    console.log('[ElementHighlighter] Enabled');
  }

  async highlightElement(selector, config = {}) {
    const doc = await this.client.send('DOM.getDocument');
    const node = await this.client.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector
    });

    if (!node.nodeId) {
      console.log(`[ElementHighlighter] Element not found: ${selector}`);
      return null;
    }

    const highlightConfig = {
      showInfo: config.showInfo !== false,
      showStyles: config.showStyles !== false,
      showRulers: config.showRulers || false,
      showExtensionLines: config.showExtensionLines || false,
      contentColor: config.contentColor || { r: 111, g: 168, b: 220, a: 0.66 },
      paddingColor: config.paddingColor || { r: 147, g: 196, b: 125, a: 0.55 },
      borderColor: config.borderColor || { r: 255, g: 229, b: 153, a: 0.66 },
      marginColor: config.marginColor || { r: 246, g: 178, b: 107, a: 0.66 }
    };

    await this.client.send('Overlay.highlightNode', {
      highlightConfig,
      nodeId: node.nodeId
    });

    this.highlightedElements.set(selector, node.nodeId);
    console.log(`[ElementHighlighter] Highlighted: ${selector}`);

    return node.nodeId;
  }

  async highlightRect(x, y, width, height, color = { r: 255, g: 0, b: 0, a: 0.5 }) {
    await this.client.send('Overlay.highlightQuad', {
      quad: [
        x, y,
        x + width, y,
        x + width, y + height,
        x, y + height
      ],
      color
    });
    console.log(`[ElementHighlighter] Highlighted rectangle at (${x}, ${y})`);
  }

  async clearHighlight() {
    await this.client.send('Overlay.hideHighlight');
    this.highlightedElements.clear();
    console.log('[ElementHighlighter] Cleared highlights');
  }

  async getElementInfo(selector) {
    const doc = await this.client.send('DOM.getDocument');
    const node = await this.client.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector
    });

    if (!node.nodeId) {
      return null;
    }

    // Get attributes
    const attributes = await this.client.send('DOM.getAttributes', {
      nodeId: node.nodeId
    });

    // Get box model
    let boxModel = null;
    try {
      boxModel = await this.client.send('DOM.getBoxModel', {
        nodeId: node.nodeId
      });
    } catch (e) {
      // Some elements don't have box model
    }

    // Get computed styles
    const styles = await this.client.send('CSS.getComputedStyleForNode', {
      nodeId: node.nodeId
    });

    // Convert attributes array to object
    const attrs = {};
    for (let i = 0; i < attributes.attributes.length; i += 2) {
      attrs[attributes.attributes[i]] = attributes.attributes[i + 1];
    }

    return {
      nodeId: node.nodeId,
      nodeName: node.nodeName || 'unknown',
      attributes: attrs,
      boxModel,
      computedStyles: styles.computedStyle
    };
  }

  async getSelectorPath(selector) {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const element = document.querySelector('${selector}');
          if (!element) return null;

          const path = [];
          let current = element;

          while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();

            if (current.id) {
              selector += '#' + current.id;
              path.unshift(selector);
              break; // ID is unique, stop here
            } else if (current.className) {
              selector += '.' + Array.from(current.classList).join('.');
            }

            // Add nth-child if no unique identifier
            if (!current.id && current.parentElement) {
              const siblings = Array.from(current.parentElement.children);
              const index = siblings.indexOf(current) + 1;
              selector += ':nth-child(' + index + ')';
            }

            path.unshift(selector);
            current = current.parentElement;
          }

          return {
            fullPath: path.join(' > '),
            shortPath: path.slice(-3).join(' > ')
          };
        })()
      `,
      returnByValue: true
    });

    return result.result.value;
  }

  async enableInspectMode() {
    await this.client.send('Overlay.setInspectMode', {
      mode: 'searchForNode',
      highlightConfig: {
        showInfo: true,
        showStyles: true,
        contentColor: { r: 111, g: 168, b: 220, a: 0.66 },
        paddingColor: { r: 147, g: 196, b: 125, a: 0.55 },
        borderColor: { r: 255, g: 229, b: 153, a: 0.66 },
        marginColor: { r: 246, g: 178, b: 107, a: 0.66 }
      }
    });

    this.client.on('Overlay.inspectNodeRequested', (event) => {
      console.log(`[ElementHighlighter] Node inspected: ${event.backendNodeId}`);
    });

    console.log('[ElementHighlighter] Inspect mode enabled');
  }

  async disableInspectMode() {
    await this.client.send('Overlay.setInspectMode', {
      mode: 'none'
    });
    console.log('[ElementHighlighter] Inspect mode disabled');
  }

  async showGridOverlay(selector) {
    const doc = await this.client.send('DOM.getDocument');
    const node = await this.client.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector
    });

    if (!node.nodeId) {
      console.log(`[ElementHighlighter] Element not found: ${selector}`);
      return;
    }

    await this.client.send('Overlay.setShowGridOverlays', {
      gridNodeHighlightConfigs: [{
        nodeId: node.nodeId,
        gridHighlightConfig: {
          gridBorderDash: false,
          rowLineDash: true,
          columnLineDash: true,
          showGridExtensionLines: true,
          showPositiveLineNumbers: true,
          showNegativeLineNumbers: true,
          gridBorderColor: { r: 255, g: 0, b: 0, a: 1 },
          rowLineColor: { r: 128, g: 0, b: 0, a: 1 },
          columnLineColor: { r: 128, g: 0, b: 128, a: 1 },
          rowGapColor: { r: 0, g: 255, b: 0, a: 0.5 },
          columnGapColor: { r: 0, g: 0, b: 255, a: 0.5 }
        }
      }]
    });

    console.log(`[ElementHighlighter] Grid overlay shown for: ${selector}`);
  }

  async showFlexOverlay(selector) {
    const doc = await this.client.send('DOM.getDocument');
    const node = await this.client.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector
    });

    if (!node.nodeId) {
      console.log(`[ElementHighlighter] Element not found: ${selector}`);
      return;
    }

    await this.client.send('Overlay.setShowFlexOverlays', {
      flexNodeHighlightConfigs: [{
        nodeId: node.nodeId,
        flexContainerHighlightConfig: {
          containerBorder: { color: { r: 128, g: 0, b: 128, a: 1 }, pattern: 'dashed' },
          itemSeparator: { color: { r: 0, g: 0, b: 128, a: 1 }, pattern: 'dotted' }
        }
      }]
    });

    console.log(`[ElementHighlighter] Flex overlay shown for: ${selector}`);
  }

  printElementInfo(info) {
    console.log('\n  Element Info:');
    console.log(`    Tag: <${info.nodeName.toLowerCase()}>`);

    if (Object.keys(info.attributes).length > 0) {
      console.log('    Attributes:');
      Object.entries(info.attributes).forEach(([key, value]) => {
        console.log(`      ${key}="${value}"`);
      });
    }

    if (info.boxModel) {
      const { content, padding, border, margin } = info.boxModel.model;
      console.log('    Box Model:');
      console.log(`      Content: ${Math.round(content[2] - content[0])}x${Math.round(content[5] - content[1])}`);
    }

    console.log('    Key Styles:');
    const keyStyles = ['display', 'position', 'width', 'height', 'color', 'background-color', 'font-size'];
    info.computedStyles
      .filter(style => keyStyles.includes(style.name))
      .forEach(style => {
        console.log(`      ${style.name}: ${style.value}`);
      });
  }

  async highlightMultiple(selectors, colors = null) {
    const defaultColors = [
      { r: 255, g: 0, b: 0, a: 0.5 },
      { r: 0, g: 255, b: 0, a: 0.5 },
      { r: 0, g: 0, b: 255, a: 0.5 },
      { r: 255, g: 255, b: 0, a: 0.5 },
      { r: 255, g: 0, b: 255, a: 0.5 }
    ];

    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const color = colors ? colors[i] : defaultColors[i % defaultColors.length];

      await this.highlightElement(selector, {
        contentColor: color,
        showInfo: false
      });

      await sleep(100);
    }

    console.log(`[ElementHighlighter] Highlighted ${selectors.length} elements`);
  }
}

async function main() {
  console.log('=== CDP Element Highlighter Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const highlighter = new ElementHighlighter(client);

    await highlighter.enable();

    console.log('\n--- Navigating to page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(1000);

    console.log('\n--- Highlighting body element ---');
    await highlighter.highlightElement('body', {
      showInfo: true,
      showStyles: true,
      showRulers: true
    });
    await sleep(3000);

    console.log('\n--- Getting element info ---');
    const info = await highlighter.getElementInfo('h1');
    if (info) {
      highlighter.printElementInfo(info);
    }

    console.log('\n--- Getting selector path ---');
    const path = await highlighter.getSelectorPath('h1');
    if (path) {
      console.log(`  Full path: ${path.fullPath}`);
      console.log(`  Short path: ${path.shortPath}`);
    }

    console.log('\n--- Highlighting h1 ---');
    await highlighter.highlightElement('h1');
    await sleep(2000);

    console.log('\n--- Highlighting multiple paragraphs ---');
    await highlighter.clearHighlight();
    await highlighter.highlightMultiple(['p:nth-child(1)', 'p:nth-child(2)', 'p:nth-child(3)']);
    await sleep(3000);

    console.log('\n--- Highlighting custom rectangle ---');
    await highlighter.clearHighlight();
    await highlighter.highlightRect(100, 100, 300, 200, { r: 255, g: 165, b: 0, a: 0.6 });
    await sleep(2000);

    console.log('\n--- Clearing all highlights ---');
    await highlighter.clearHighlight();

    console.log('\n=== Demo Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { ElementHighlighter };
