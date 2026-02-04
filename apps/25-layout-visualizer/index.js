/**
 * App 25: Layout Visualizer
 *
 * Visualize CSS layout systems using CDP:
 * - CSS Grid overlay with line numbers
 * - Flexbox container/item visualization
 * - Box model display (margin, border, padding, content)
 * - Layout flow indicators
 * - Position type highlighting
 *
 * CDP Domains: DOM, CSS, Overlay, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class LayoutVisualizer {
  constructor(client) {
    this.client = client;
  }

  async enable() {
    await this.client.send('DOM.enable');
    await this.client.send('CSS.enable');
    await this.client.send('Overlay.enable');
    await this.client.send('Runtime.enable');
    console.log('[LayoutViz] Domains enabled');
  }

  async highlightBoxModel(selector) {
    const doc = await this.client.send('DOM.getDocument');
    const node = await this.client.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector
    });

    if (!node.nodeId) {
      console.log(`[LayoutViz] Element not found: ${selector}`);
      return null;
    }

    const boxModel = await this.client.send('DOM.getBoxModel', {
      nodeId: node.nodeId
    });

    // Highlight with color overlay
    await this.client.send('Overlay.highlightNode', {
      highlightConfig: {
        showInfo: true,
        showStyles: true,
        showRulers: true,
        showExtensionLines: true,
        contentColor: { r: 111, g: 168, b: 220, a: 0.3 },
        paddingColor: { r: 147, g: 196, b: 125, a: 0.3 },
        borderColor: { r: 255, g: 229, b: 153, a: 0.3 },
        marginColor: { r: 246, g: 178, b: 107, a: 0.3 }
      },
      nodeId: node.nodeId
    });

    return boxModel;
  }

  async findGridContainers() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const grids = [];
          document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.display === 'grid' || style.display === 'inline-grid') {
              const rect = el.getBoundingClientRect();
              grids.push({
                tag: el.tagName.toLowerCase(),
                id: el.id,
                className: el.className,
                selector: el.id ? '#' + el.id : el.className ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase(),
                gridTemplateRows: style.gridTemplateRows,
                gridTemplateColumns: style.gridTemplateColumns,
                gap: style.gap,
                width: rect.width,
                height: rect.height
              });
            }
          });
          return grids;
        })()
      `,
      returnByValue: true
    });

    return result.result.value || [];
  }

  async findFlexContainers() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const flexboxes = [];
          document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.display === 'flex' || style.display === 'inline-flex') {
              const rect = el.getBoundingClientRect();
              const children = Array.from(el.children);
              flexboxes.push({
                tag: el.tagName.toLowerCase(),
                id: el.id,
                className: el.className,
                selector: el.id ? '#' + el.id : el.className ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase(),
                flexDirection: style.flexDirection,
                justifyContent: style.justifyContent,
                alignItems: style.alignItems,
                gap: style.gap,
                wrap: style.flexWrap,
                children: children.length,
                width: rect.width,
                height: rect.height
              });
            }
          });
          return flexboxes;
        })()
      `,
      returnByValue: true
    });

    return result.result.value || [];
  }

  async visualizeGridOverlay(selector) {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const grid = document.querySelector('${selector}');
          if (!grid) return;

          // Remove existing overlay
          document.querySelectorAll('.cdp-grid-overlay').forEach(el => el.remove());

          const overlay = document.createElement('div');
          overlay.className = 'cdp-grid-overlay';
          overlay.style.cssText = \`
            position: absolute;
            pointer-events: none;
            z-index: 999999;
            border: 2px solid #9945FF;
          \`;

          const rect = grid.getBoundingClientRect();
          overlay.style.top = (rect.top + window.scrollY) + 'px';
          overlay.style.left = (rect.left + window.scrollX) + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';

          // Draw grid lines
          const style = window.getComputedStyle(grid);
          const rows = style.gridTemplateRows.split(' ');
          const cols = style.gridTemplateColumns.split(' ');

          let html = '';

          // Horizontal lines (rows)
          let yPos = 0;
          rows.forEach((row, i) => {
            const height = parseFloat(row);
            if (!isNaN(height)) {
              html += \`<div style="position:absolute;left:0;top:\${yPos}px;width:100%;height:1px;background:#9945FF;"></div>\`;
              html += \`<div style="position:absolute;left:5px;top:\${yPos + 5}px;color:#9945FF;font-size:10px;background:rgba(255,255,255,0.8);padding:2px;">Row \${i + 1}</div>\`;
              yPos += height;
            }
          });

          // Vertical lines (columns)
          let xPos = 0;
          cols.forEach((col, i) => {
            const width = parseFloat(col);
            if (!isNaN(width)) {
              html += \`<div style="position:absolute;left:\${xPos}px;top:0;width:1px;height:100%;background:#9945FF;"></div>\`;
              html += \`<div style="position:absolute;left:\${xPos + 5}px;top:5px;color:#9945FF;font-size:10px;background:rgba(255,255,255,0.8);padding:2px;writing-mode:vertical-lr;">Col \${i + 1}</div>\`;
              xPos += width;
            }
          });

          overlay.innerHTML = html;
          document.body.appendChild(overlay);
        })()
      `
    });
    console.log(`[LayoutViz] Grid overlay applied to ${selector}`);
  }

  async visualizeFlexOverlay(selector) {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const flex = document.querySelector('${selector}');
          if (!flex) return;

          // Remove existing overlay
          document.querySelectorAll('.cdp-flex-overlay').forEach(el => el.remove());

          const style = window.getComputedStyle(flex);
          const rect = flex.getBoundingClientRect();
          const isRow = style.flexDirection.startsWith('row');

          // Container overlay
          const overlay = document.createElement('div');
          overlay.className = 'cdp-flex-overlay';
          overlay.style.cssText = \`
            position: absolute;
            pointer-events: none;
            z-index: 999999;
            border: 2px dashed #14F195;
            top: \${rect.top + window.scrollY}px;
            left: \${rect.left + window.scrollX}px;
            width: \${rect.width}px;
            height: \${rect.height}px;
          \`;

          // Direction indicator
          const arrow = isRow ? '→' : '↓';
          overlay.innerHTML = \`
            <div style="position:absolute;top:5px;left:5px;background:#14F195;color:#000;padding:4px 8px;font-size:11px;font-family:monospace;border-radius:3px;">
              FLEX \${arrow} \${style.flexDirection}
            </div>
          \`;

          document.body.appendChild(overlay);

          // Highlight flex items
          Array.from(flex.children).forEach((child, i) => {
            const childRect = child.getBoundingClientRect();
            const itemOverlay = document.createElement('div');
            itemOverlay.className = 'cdp-flex-overlay';
            itemOverlay.style.cssText = \`
              position: absolute;
              pointer-events: none;
              z-index: 999998;
              border: 1px solid #14F195;
              background: rgba(20, 241, 149, 0.1);
              top: \${childRect.top + window.scrollY}px;
              left: \${childRect.left + window.scrollX}px;
              width: \${childRect.width}px;
              height: \${childRect.height}px;
            \`;

            const childStyle = window.getComputedStyle(child);
            itemOverlay.innerHTML = \`
              <div style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.7);color:#14F195;padding:2px 4px;font-size:9px;font-family:monospace;border-radius:2px;">
                Item \${i + 1} | grow:\${childStyle.flexGrow} shrink:\${childStyle.flexShrink}
              </div>
            \`;

            document.body.appendChild(itemOverlay);
          });
        })()
      `
    });
    console.log(`[LayoutViz] Flex overlay applied to ${selector}`);
  }

  async getBoxModelInfo(selector) {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const el = document.querySelector('${selector}');
          if (!el) return null;

          const style = window.getComputedStyle(el);
          return {
            margin: {
              top: style.marginTop,
              right: style.marginRight,
              bottom: style.marginBottom,
              left: style.marginLeft
            },
            border: {
              top: style.borderTopWidth,
              right: style.borderRightWidth,
              bottom: style.borderBottomWidth,
              left: style.borderLeftWidth
            },
            padding: {
              top: style.paddingTop,
              right: style.paddingRight,
              bottom: style.paddingBottom,
              left: style.paddingLeft
            },
            content: {
              width: style.width,
              height: style.height
            },
            position: style.position,
            display: style.display,
            boxSizing: style.boxSizing
          };
        })()
      `,
      returnByValue: true
    });

    return result.result.value;
  }

  async clearOverlays() {
    await this.client.send('Overlay.hideHighlight');
    await this.client.send('Runtime.evaluate', {
      expression: `
        document.querySelectorAll('.cdp-grid-overlay, .cdp-flex-overlay').forEach(el => el.remove());
      `
    });
    console.log('[LayoutViz] Overlays cleared');
  }
}

async function main() {
  console.log('=== CDP Layout Visualizer Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const viz = new LayoutVisualizer(client);

    await viz.enable();

    console.log('\n--- Navigating to demo page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://css-tricks.com' });
    await navPromise;
    await sleep(2000);

    console.log('\n--- Finding Grid Containers ---');
    const grids = await viz.findGridContainers();
    console.log(`  Found ${grids.length} grid container(s)`);
    grids.slice(0, 3).forEach((grid, i) => {
      console.log(`  ${i + 1}. ${grid.selector}`);
      console.log(`     Columns: ${grid.gridTemplateColumns}`);
      console.log(`     Rows: ${grid.gridTemplateRows}`);
      console.log(`     Gap: ${grid.gap}`);
    });

    console.log('\n--- Finding Flex Containers ---');
    const flexboxes = await viz.findFlexContainers();
    console.log(`  Found ${flexboxes.length} flex container(s)`);
    flexboxes.slice(0, 3).forEach((flex, i) => {
      console.log(`  ${i + 1}. ${flex.selector}`);
      console.log(`     Direction: ${flex.flexDirection}`);
      console.log(`     Justify: ${flex.justifyContent}`);
      console.log(`     Align: ${flex.alignItems}`);
      console.log(`     Children: ${flex.children}`);
    });

    if (grids.length > 0) {
      console.log('\n--- Visualizing Grid Layout ---');
      await viz.visualizeGridOverlay(grids[0].selector);
      await sleep(3000);
      await viz.clearOverlays();
    }

    if (flexboxes.length > 0) {
      console.log('\n--- Visualizing Flex Layout ---');
      await viz.visualizeFlexOverlay(flexboxes[0].selector);
      await sleep(3000);
    }

    console.log('\n--- Box Model Analysis ---');
    const boxInfo = await viz.getBoxModelInfo('body');
    if (boxInfo) {
      console.log('  Body Element:');
      console.log(`    Display: ${boxInfo.display}`);
      console.log(`    Position: ${boxInfo.position}`);
      console.log(`    Box Sizing: ${boxInfo.boxSizing}`);
      console.log(`    Padding: ${boxInfo.padding.top} ${boxInfo.padding.right} ${boxInfo.padding.bottom} ${boxInfo.padding.left}`);
    }

    await sleep(2000);

    console.log('\n--- Clearing overlays ---');
    await viz.clearOverlays();

    console.log('\n=== Demo Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { LayoutVisualizer };
