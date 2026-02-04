/**
 * App 03: DOM Explorer
 *
 * Demonstrates DOM inspection using CDP:
 * - Get document root
 * - Query selector / querySelectorAll
 * - Get element text content
 * - Get element attributes
 * - Get outer/inner HTML
 *
 * CDP Domains: DOM, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation } from '../../shared/wait-helpers.js';

class DOMExplorer {
  constructor(client) {
    this.client = client;
    this.documentNode = null;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('DOM.enable');
    await this.client.send('Page.enable');
    await this.client.send('Runtime.enable');
    console.log('[DOMExplorer] DOM, Page, and Runtime domains enabled');
  }

  /**
   * Get the document root node
   * @returns {Promise<object>}
   */
  async getDocument() {
    const result = await this.client.send('DOM.getDocument', { depth: -1 });
    this.documentNode = result.root;
    return result.root;
  }

  /**
   * Query for a single element
   * @param {string} selector - CSS selector
   * @param {number} nodeId - Parent node ID (optional, defaults to document)
   * @returns {Promise<number|null>} - Node ID or null
   */
  async querySelector(selector, nodeId = null) {
    if (!nodeId) {
      const doc = await this.getDocument();
      nodeId = doc.nodeId;
    }

    const result = await this.client.send('DOM.querySelector', {
      nodeId,
      selector
    });

    return result.nodeId !== 0 ? result.nodeId : null;
  }

  /**
   * Query for all matching elements
   * @param {string} selector - CSS selector
   * @param {number} nodeId - Parent node ID (optional)
   * @returns {Promise<number[]>} - Array of node IDs
   */
  async querySelectorAll(selector, nodeId = null) {
    if (!nodeId) {
      const doc = await this.getDocument();
      nodeId = doc.nodeId;
    }

    const result = await this.client.send('DOM.querySelectorAll', {
      nodeId,
      selector
    });

    return result.nodeIds;
  }

  /**
   * Get outer HTML of an element
   * @param {number} nodeId - Node ID
   * @returns {Promise<string>}
   */
  async getOuterHTML(nodeId) {
    const result = await this.client.send('DOM.getOuterHTML', { nodeId });
    return result.outerHTML;
  }

  /**
   * Get attributes of an element
   * @param {number} nodeId - Node ID
   * @returns {Promise<object>} - Attributes as key-value pairs
   */
  async getAttributes(nodeId) {
    const result = await this.client.send('DOM.getAttributes', { nodeId });
    const attributes = {};

    // Attributes come as [name, value, name, value, ...]
    for (let i = 0; i < result.attributes.length; i += 2) {
      attributes[result.attributes[i]] = result.attributes[i + 1];
    }

    return attributes;
  }

  /**
   * Get text content of an element
   * @param {number} nodeId - Node ID
   * @returns {Promise<string>}
   */
  async getTextContent(nodeId) {
    // Resolve to a remote object
    const { object } = await this.client.send('DOM.resolveNode', { nodeId });

    // Get textContent property
    const result = await this.client.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { return this.textContent; }',
      returnByValue: true
    });

    // Release the object
    await this.client.send('Runtime.releaseObject', { objectId: object.objectId });

    return result.result.value || '';
  }

  /**
   * Get inner HTML of an element
   * @param {number} nodeId - Node ID
   * @returns {Promise<string>}
   */
  async getInnerHTML(nodeId) {
    const { object } = await this.client.send('DOM.resolveNode', { nodeId });

    const result = await this.client.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { return this.innerHTML; }',
      returnByValue: true
    });

    await this.client.send('Runtime.releaseObject', { objectId: object.objectId });

    return result.result.value || '';
  }

  /**
   * Describe a node with detailed info
   * @param {number} nodeId - Node ID
   * @returns {Promise<object>}
   */
  async describeNode(nodeId) {
    const result = await this.client.send('DOM.describeNode', {
      nodeId,
      depth: 1
    });
    return result.node;
  }

  /**
   * Get box model (dimensions and position) of an element
   * @param {number} nodeId - Node ID
   * @returns {Promise<object>}
   */
  async getBoxModel(nodeId) {
    const result = await this.client.send('DOM.getBoxModel', { nodeId });
    return result.model;
  }

  /**
   * Find element by XPath
   * @param {string} xpath - XPath expression
   * @returns {Promise<number[]>} - Array of node IDs
   */
  async findByXPath(xpath) {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const result = [];
          const iterator = document.evaluate('${xpath}', document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
          let node = iterator.iterateNext();
          while (node) {
            result.push(node);
            node = iterator.iterateNext();
          }
          return result;
        })()
      `,
      returnByValue: false
    });

    // Get node IDs from the result
    const nodes = [];
    if (result.result.objectId) {
      const props = await this.client.send('Runtime.getProperties', {
        objectId: result.result.objectId
      });

      for (const prop of props.result) {
        if (prop.value && prop.value.objectId && !isNaN(prop.name)) {
          const nodeResult = await this.client.send('DOM.requestNode', {
            objectId: prop.value.objectId
          });
          nodes.push(nodeResult.nodeId);
        }
      }
    }

    return nodes;
  }

  /**
   * Get computed styles for an element
   * @param {number} nodeId - Node ID
   * @returns {Promise<object>}
   */
  async getComputedStyles(nodeId) {
    const { object } = await this.client.send('DOM.resolveNode', { nodeId });

    const result = await this.client.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const styles = window.getComputedStyle(this);
        const result = {};
        for (let i = 0; i < styles.length; i++) {
          const prop = styles[i];
          result[prop] = styles.getPropertyValue(prop);
        }
        return result;
      }`,
      returnByValue: true
    });

    await this.client.send('Runtime.releaseObject', { objectId: object.objectId });

    return result.result.value;
  }
}

// Demo
async function main() {
  console.log('=== CDP DOM Explorer Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const explorer = new DOMExplorer(client);

    // Enable domains
    await explorer.enable();

    // Navigate to a page
    console.log('\n--- Navigating to example.com ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;

    // Get document
    console.log('\n--- Document Info ---');
    const doc = await explorer.getDocument();
    console.log(`Document URL: ${doc.documentURL}`);
    console.log(`Base URL: ${doc.baseURL}`);

    // Query selectors
    console.log('\n--- Query Selectors ---');

    const h1NodeId = await explorer.querySelector('h1');
    if (h1NodeId) {
      const h1Text = await explorer.getTextContent(h1NodeId);
      console.log(`<h1> text: "${h1Text.trim()}"`);
    }

    const pNodeIds = await explorer.querySelectorAll('p');
    console.log(`Found ${pNodeIds.length} <p> elements`);

    for (const nodeId of pNodeIds) {
      const text = await explorer.getTextContent(nodeId);
      console.log(`  - "${text.trim().substring(0, 50)}..."`);
    }

    // Get links
    console.log('\n--- Links on Page ---');
    const linkIds = await explorer.querySelectorAll('a');

    for (const nodeId of linkIds) {
      const attrs = await explorer.getAttributes(nodeId);
      const text = await explorer.getTextContent(nodeId);
      console.log(`  Link: "${text.trim()}" -> ${attrs.href}`);
    }

    // Get element details
    console.log('\n--- Element Details ---');
    const bodyId = await explorer.querySelector('body');

    if (bodyId) {
      const bodyDesc = await explorer.describeNode(bodyId);
      console.log(`Body node name: ${bodyDesc.nodeName}`);
      console.log(`Body child count: ${bodyDesc.childNodeCount}`);

      const boxModel = await explorer.getBoxModel(bodyId);
      console.log(`Body dimensions: ${boxModel.width}x${boxModel.height}`);
    }

    // Get outer HTML sample
    console.log('\n--- Outer HTML (first div) ---');
    const divId = await explorer.querySelector('div');
    if (divId) {
      const html = await explorer.getOuterHTML(divId);
      console.log(html.substring(0, 200) + '...');
    }

    // Get some computed styles
    console.log('\n--- Computed Styles (h1) ---');
    if (h1NodeId) {
      const styles = await explorer.getComputedStyles(h1NodeId);
      console.log(`  font-size: ${styles['font-size']}`);
      console.log(`  font-weight: ${styles['font-weight']}`);
      console.log(`  color: ${styles['color']}`);
      console.log(`  margin: ${styles['margin']}`);
    }

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { DOMExplorer };
