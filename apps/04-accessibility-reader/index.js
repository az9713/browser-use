/**
 * App 04: Accessibility Tree Reader
 *
 * Demonstrates accessibility tree inspection using CDP:
 * - Get full accessibility tree
 * - Find elements by role (button, link, textbox)
 * - Find elements by accessible name
 * - Get element's accessible properties
 *
 * CDP Domains: Accessibility
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class AccessibilityReader {
  constructor(client) {
    this.client = client;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Accessibility.enable');
    await this.client.send('Page.enable');
    await this.client.send('DOM.enable');
    console.log('[A11yReader] Accessibility, Page, and DOM domains enabled');
  }

  /**
   * Get the full accessibility tree
   * @param {object} options - Options
   * @returns {Promise<object>}
   */
  async getFullAXTree(options = {}) {
    const { depth = -1 } = options;
    const result = await this.client.send('Accessibility.getFullAXTree', { depth });
    return result.nodes;
  }

  /**
   * Query accessibility tree for specific criteria
   * @param {object} criteria - Query criteria
   * @returns {Promise<Array>}
   */
  async queryAXTree(criteria) {
    // Get document node first
    const { root } = await this.client.send('DOM.getDocument');

    const result = await this.client.send('Accessibility.queryAXTree', {
      nodeId: root.nodeId,
      ...criteria
    });

    return result.nodes;
  }

  /**
   * Find elements by role
   * @param {string} role - ARIA role (button, link, textbox, etc.)
   * @returns {Promise<Array>}
   */
  async findByRole(role) {
    return this.queryAXTree({ role });
  }

  /**
   * Find elements by accessible name
   * @param {string} name - Accessible name
   * @returns {Promise<Array>}
   */
  async findByName(name) {
    return this.queryAXTree({ accessibleName: name });
  }

  /**
   * Get accessibility node for a DOM node
   * @param {number} nodeId - DOM node ID
   * @returns {Promise<object>}
   */
  async getAXNodeForDOM(nodeId) {
    const result = await this.client.send('Accessibility.getPartialAXTree', {
      nodeId,
      fetchRelatives: true
    });
    return result.nodes;
  }

  /**
   * Parse an AX node's properties into a readable format
   * @param {object} node - AX node
   * @returns {object}
   */
  parseAXNode(node) {
    const parsed = {
      nodeId: node.nodeId,
      role: node.role?.value || 'unknown',
      name: node.name?.value || '',
      description: node.description?.value || '',
      value: node.value?.value || '',
      ignored: node.ignored || false
    };

    // Extract properties
    if (node.properties) {
      parsed.properties = {};
      for (const prop of node.properties) {
        parsed.properties[prop.name] = prop.value?.value;
      }
    }

    return parsed;
  }

  /**
   * Build a tree structure from flat AX nodes
   * @param {Array} nodes - Flat array of AX nodes
   * @returns {object}
   */
  buildTree(nodes) {
    const nodeMap = new Map();
    let root = null;

    // First pass: create map
    for (const node of nodes) {
      nodeMap.set(node.nodeId, {
        ...this.parseAXNode(node),
        children: []
      });
    }

    // Second pass: build tree
    for (const node of nodes) {
      const parsed = nodeMap.get(node.nodeId);
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId).children.push(parsed);
      } else if (!node.parentId) {
        root = parsed;
      }
    }

    return root || nodeMap.values().next().value;
  }

  /**
   * Print the accessibility tree
   * @param {object} node - Tree node
   * @param {number} indent - Indentation level
   */
  printTree(node, indent = 0) {
    if (!node || node.ignored) return;

    const prefix = '  '.repeat(indent);
    const role = node.role;
    const name = node.name ? ` "${node.name}"` : '';

    console.log(`${prefix}[${role}]${name}`);

    for (const child of node.children || []) {
      this.printTree(child, indent + 1);
    }
  }

  /**
   * Get all interactive elements
   * @returns {Promise<Array>}
   */
  async getInteractiveElements() {
    const interactiveRoles = [
      'button',
      'link',
      'textbox',
      'checkbox',
      'radio',
      'combobox',
      'listbox',
      'menu',
      'menuitem',
      'slider',
      'spinbutton',
      'switch',
      'tab'
    ];

    const results = [];

    for (const role of interactiveRoles) {
      const nodes = await this.findByRole(role);
      for (const node of nodes) {
        results.push(this.parseAXNode(node));
      }
    }

    return results;
  }

  /**
   * Audit page for common accessibility issues
   * @returns {Promise<Array>}
   */
  async auditAccessibility() {
    const issues = [];
    const tree = await this.getFullAXTree();

    for (const node of tree) {
      const parsed = this.parseAXNode(node);

      // Check for images without names
      if (parsed.role === 'image' && !parsed.name) {
        issues.push({
          type: 'missing-alt',
          message: 'Image without accessible name',
          nodeId: parsed.nodeId
        });
      }

      // Check for buttons without names
      if (parsed.role === 'button' && !parsed.name) {
        issues.push({
          type: 'missing-label',
          message: 'Button without accessible name',
          nodeId: parsed.nodeId
        });
      }

      // Check for links without names
      if (parsed.role === 'link' && !parsed.name) {
        issues.push({
          type: 'missing-label',
          message: 'Link without accessible name',
          nodeId: parsed.nodeId
        });
      }

      // Check for form inputs without labels
      if (['textbox', 'checkbox', 'radio', 'combobox'].includes(parsed.role) && !parsed.name) {
        issues.push({
          type: 'missing-label',
          message: `${parsed.role} without accessible name`,
          nodeId: parsed.nodeId
        });
      }
    }

    return issues;
  }
}

// Demo
async function main() {
  console.log('=== CDP Accessibility Reader Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const reader = new AccessibilityReader(client);

    // Enable domains
    await reader.enable();

    // Navigate to a page with various elements
    console.log('\n--- Navigating to example page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    // Get and print accessibility tree
    console.log('\n--- Accessibility Tree ---');
    const nodes = await reader.getFullAXTree({ depth: 5 });
    const tree = reader.buildTree(nodes);
    reader.printTree(tree);

    // Find specific elements
    console.log('\n--- Find by Role: link ---');
    const links = await reader.findByRole('link');
    for (const link of links) {
      const parsed = reader.parseAXNode(link);
      console.log(`  [link] "${parsed.name}"`);
    }

    console.log('\n--- Find by Role: heading ---');
    const headings = await reader.findByRole('heading');
    for (const heading of headings) {
      const parsed = reader.parseAXNode(heading);
      console.log(`  [heading] "${parsed.name}"`);
    }

    // Get interactive elements
    console.log('\n--- Interactive Elements ---');
    const interactive = await reader.getInteractiveElements();
    if (interactive.length === 0) {
      console.log('  No interactive elements found');
    } else {
      for (const elem of interactive) {
        console.log(`  [${elem.role}] "${elem.name}"`);
      }
    }

    // Accessibility audit
    console.log('\n--- Accessibility Audit ---');
    const issues = await reader.auditAccessibility();
    if (issues.length === 0) {
      console.log('  No accessibility issues found!');
    } else {
      for (const issue of issues) {
        console.log(`  [${issue.type}] ${issue.message}`);
      }
    }

    // Navigate to a more complex page
    console.log('\n--- Testing on httpbin.org/forms/post ---');
    const navPromise2 = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://httpbin.org/forms/post' });
    await navPromise2;
    await sleep(500);

    console.log('\n--- Interactive Elements on Form Page ---');
    const formInteractive = await reader.getInteractiveElements();
    for (const elem of formInteractive) {
      const value = elem.value ? ` = "${elem.value}"` : '';
      console.log(`  [${elem.role}] "${elem.name}"${value}`);
    }

    // Audit form page
    console.log('\n--- Form Page Accessibility Audit ---');
    const formIssues = await reader.auditAccessibility();
    if (formIssues.length === 0) {
      console.log('  No accessibility issues found!');
    } else {
      console.log(`  Found ${formIssues.length} issues:`);
      for (const issue of formIssues.slice(0, 10)) {
        console.log(`    [${issue.type}] ${issue.message}`);
      }
      if (formIssues.length > 10) {
        console.log(`    ... and ${formIssues.length - 10} more`);
      }
    }

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { AccessibilityReader };
