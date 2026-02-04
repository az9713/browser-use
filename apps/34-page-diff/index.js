/**
 * App 34: Page Diff
 *
 * Serialize and compare page states using CDP:
 * - Capture full page state (DOM, styles, attributes)
 * - Compare two states
 * - Detect changes (added, removed, modified)
 * - Visual diff reporting
 * - Before/after snapshots
 *
 * CDP Domains: DOM, CSS, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import crypto from 'crypto';

class PageDiff {
  constructor(client) {
    this.client = client;
    this.snapshots = [];
  }

  async enable() {
    await this.client.send('DOM.enable');
    await this.client.send('CSS.enable');
    await this.client.send('Runtime.enable');
    console.log('[PageDiff] Enabled');
  }

  async captureState(name = null) {
    console.log(`[PageDiff] Capturing state${name ? ` "${name}"` : ''}...`);

    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          function serializeElement(el, depth = 0) {
            if (depth > 20) return null; // Prevent infinite recursion

            const data = {
              tag: el.tagName?.toLowerCase() || el.nodeName.toLowerCase(),
              type: el.nodeType,
              attributes: {},
              children: [],
              text: null
            };

            // Attributes
            if (el.attributes) {
              for (let attr of el.attributes) {
                data.attributes[attr.name] = attr.value;
              }
            }

            // Text content for text nodes
            if (el.nodeType === 3) {
              data.text = el.textContent?.trim() || '';
            }

            // Computed style for elements (key properties only)
            if (el.nodeType === 1) {
              const style = window.getComputedStyle(el);
              data.styles = {
                display: style.display,
                position: style.position,
                width: style.width,
                height: style.height,
                color: style.color,
                backgroundColor: style.backgroundColor,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight
              };
            }

            // Children
            if (el.childNodes) {
              for (let child of el.childNodes) {
                const serialized = serializeElement(child, depth + 1);
                if (serialized) {
                  data.children.push(serialized);
                }
              }
            }

            return data;
          }

          return {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
            dom: serializeElement(document.documentElement)
          };
        })()
      `,
      returnByValue: true
    });

    const state = result.result.value;
    state.name = name || `State ${this.snapshots.length + 1}`;
    state.hash = this.hashState(state);

    this.snapshots.push(state);
    console.log(`[PageDiff] State captured: ${state.name} (hash: ${state.hash.substring(0, 8)})`);

    return state;
  }

  hashState(state) {
    const str = JSON.stringify(state.dom);
    return crypto.createHash('md5').update(str).digest('hex');
  }

  compareStates(state1, state2) {
    console.log(`[PageDiff] Comparing "${state1.name}" vs "${state2.name}"`);

    const changes = {
      url: {
        before: state1.url,
        after: state2.url,
        changed: state1.url !== state2.url
      },
      title: {
        before: state1.title,
        after: state2.title,
        changed: state1.title !== state2.title
      },
      dom: this.compareDOMTrees(state1.dom, state2.dom),
      summary: {
        added: 0,
        removed: 0,
        modified: 0,
        unchanged: 0
      }
    };

    // Calculate summary
    const countChanges = (diff) => {
      if (diff.status === 'added') changes.summary.added++;
      else if (diff.status === 'removed') changes.summary.removed++;
      else if (diff.status === 'modified') changes.summary.modified++;
      else if (diff.status === 'unchanged') changes.summary.unchanged++;

      if (diff.children) {
        diff.children.forEach(countChanges);
      }
    };

    countChanges(changes.dom);

    return changes;
  }

  compareDOMTrees(tree1, tree2) {
    if (!tree1 && !tree2) {
      return { status: 'unchanged' };
    }

    if (!tree1) {
      return {
        status: 'added',
        element: this.summarizeElement(tree2)
      };
    }

    if (!tree2) {
      return {
        status: 'removed',
        element: this.summarizeElement(tree1)
      };
    }

    // Compare nodes
    const diff = {
      element: this.summarizeElement(tree1),
      status: 'unchanged',
      changes: [],
      children: []
    };

    // Check tag
    if (tree1.tag !== tree2.tag) {
      diff.status = 'modified';
      diff.changes.push({
        type: 'tag',
        before: tree1.tag,
        after: tree2.tag
      });
    }

    // Check text
    if (tree1.text !== tree2.text) {
      diff.status = 'modified';
      diff.changes.push({
        type: 'text',
        before: tree1.text,
        after: tree2.text
      });
    }

    // Check attributes
    const allAttrs = new Set([
      ...Object.keys(tree1.attributes || {}),
      ...Object.keys(tree2.attributes || {})
    ]);

    allAttrs.forEach(attr => {
      const val1 = tree1.attributes?.[attr];
      const val2 = tree2.attributes?.[attr];

      if (val1 !== val2) {
        diff.status = 'modified';
        diff.changes.push({
          type: 'attribute',
          name: attr,
          before: val1,
          after: val2
        });
      }
    });

    // Check styles
    if (tree1.styles && tree2.styles) {
      const allStyles = new Set([
        ...Object.keys(tree1.styles),
        ...Object.keys(tree2.styles)
      ]);

      allStyles.forEach(prop => {
        const val1 = tree1.styles[prop];
        const val2 = tree2.styles[prop];

        if (val1 !== val2) {
          diff.status = 'modified';
          diff.changes.push({
            type: 'style',
            property: prop,
            before: val1,
            after: val2
          });
        }
      });
    }

    // Compare children
    const maxChildren = Math.max(
      tree1.children?.length || 0,
      tree2.children?.length || 0
    );

    for (let i = 0; i < maxChildren; i++) {
      const child1 = tree1.children?.[i];
      const child2 = tree2.children?.[i];
      const childDiff = this.compareDOMTrees(child1, child2);

      if (childDiff.status !== 'unchanged') {
        diff.children.push(childDiff);
        if (diff.status === 'unchanged') {
          diff.status = 'modified';
        }
      }
    }

    return diff;
  }

  summarizeElement(element) {
    if (!element) return null;

    let summary = element.tag;

    if (element.attributes?.id) {
      summary += `#${element.attributes.id}`;
    }

    if (element.attributes?.class) {
      summary += `.${element.attributes.class.split(' ').join('.')}`;
    }

    return summary;
  }

  printDiff(changes, indent = 0) {
    const prefix = '  '.repeat(indent);

    if (changes.url.changed) {
      console.log(`\n${prefix}URL Changed:`);
      console.log(`${prefix}  - ${changes.url.before}`);
      console.log(`${prefix}  + ${changes.url.after}`);
    }

    if (changes.title.changed) {
      console.log(`\n${prefix}Title Changed:`);
      console.log(`${prefix}  - ${changes.title.before}`);
      console.log(`${prefix}  + ${changes.title.after}`);
    }

    console.log(`\n${prefix}Summary:`);
    console.log(`${prefix}  Added: ${changes.summary.added}`);
    console.log(`${prefix}  Removed: ${changes.summary.removed}`);
    console.log(`${prefix}  Modified: ${changes.summary.modified}`);
    console.log(`${prefix}  Unchanged: ${changes.summary.unchanged}`);
  }

  printElementDiff(diff, indent = 0, maxDepth = 3) {
    if (indent > maxDepth) return;

    const prefix = '  '.repeat(indent);
    const symbol = {
      'added': '+',
      'removed': '-',
      'modified': '~',
      'unchanged': ' '
    }[diff.status];

    console.log(`${prefix}${symbol} ${diff.element || 'node'}`);

    if (diff.changes && diff.changes.length > 0) {
      diff.changes.forEach(change => {
        if (change.type === 'attribute') {
          console.log(`${prefix}  attr ${change.name}: "${change.before}" → "${change.after}"`);
        } else if (change.type === 'style') {
          console.log(`${prefix}  style ${change.property}: "${change.before}" → "${change.after}"`);
        } else if (change.type === 'text') {
          console.log(`${prefix}  text: "${change.before}" → "${change.after}"`);
        }
      });
    }

    if (diff.children && diff.children.length > 0 && indent < maxDepth) {
      diff.children.forEach(child => {
        this.printElementDiff(child, indent + 1, maxDepth);
      });
    }
  }

  exportDiff(changes) {
    return {
      timestamp: Date.now(),
      before: changes.dom.element,
      after: changes.dom.element,
      summary: changes.summary,
      changes: this.flattenChanges(changes.dom)
    };
  }

  flattenChanges(diff, path = []) {
    const changes = [];

    if (diff.status !== 'unchanged') {
      changes.push({
        path: path.join(' > '),
        element: diff.element,
        status: diff.status,
        changes: diff.changes || []
      });
    }

    if (diff.children) {
      diff.children.forEach((child, i) => {
        const childPath = [...path, child.element || `child-${i}`];
        changes.push(...this.flattenChanges(child, childPath));
      });
    }

    return changes;
  }
}

async function main() {
  console.log('=== CDP Page Diff Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const differ = new PageDiff(client);

    await differ.enable();

    console.log('\n--- Navigating to page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(1000);

    console.log('\n--- Capturing initial state ---');
    const before = await differ.captureState('Before');

    console.log('\n--- Making changes to the page ---');
    await client.send('Runtime.evaluate', {
      expression: `
        // Change title
        document.title = 'Modified Page';

        // Change text
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = 'Changed Heading';

        // Add element
        const div = document.createElement('div');
        div.id = 'new-element';
        div.className = 'test-class';
        div.textContent = 'New content';
        document.body.appendChild(div);

        // Modify attribute
        const p = document.querySelector('p');
        if (p) p.setAttribute('data-modified', 'true');

        // Change style
        document.body.style.backgroundColor = '#f0f0f0';
      `
    });
    await sleep(1000);

    console.log('\n--- Capturing modified state ---');
    const after = await differ.captureState('After');

    console.log('\n--- Comparing states ---');
    const changes = differ.compareStates(before, after);

    differ.printDiff(changes);

    console.log('\n--- DOM Changes (top level) ---');
    differ.printElementDiff(changes.dom, 0, 2);

    console.log('\n--- Exporting diff ---');
    const exported = differ.exportDiff(changes);
    console.log(`  Total changes: ${exported.changes.length}`);
    console.log('\n  Sample changes:');
    exported.changes.slice(0, 5).forEach(change => {
      console.log(`    ${change.status.padEnd(8)} ${change.element}`);
      if (change.changes.length > 0) {
        console.log(`             ${change.changes.length} change(s)`);
      }
    });

    console.log('\n=== Demo Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { PageDiff };
