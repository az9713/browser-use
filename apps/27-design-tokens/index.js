/**
 * App 27: Design Tokens Extractor
 *
 * Extract design system tokens from any page using CDP:
 * - Color palette (with usage frequency)
 * - Typography scale (fonts, sizes, weights)
 * - Spacing system (margins, paddings)
 * - Border radii
 * - Shadow styles
 * - Breakpoints
 *
 * CDP Domains: CSS, DOM, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import { getContrastRatio } from '../../shared/utils.js';

class DesignTokens {
  constructor(client) {
    this.client = client;
  }

  async enable() {
    await this.client.send('CSS.enable');
    await this.client.send('DOM.enable');
    await this.client.send('Runtime.enable');
    console.log('[DesignTokens] Domains enabled');
  }

  async extractColors() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const colors = new Map();
          const colorRegex = /#([0-9a-f]{3}|[0-9a-f]{6})\\b|rgb\\([^)]+\\)|rgba\\([^)]+\\)/gi;

          // Extract from computed styles
          document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const props = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'];

            props.forEach(prop => {
              const value = style[prop];
              if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
                const normalized = value.toLowerCase();
                colors.set(normalized, (colors.get(normalized) || 0) + 1);
              }
            });
          });

          // Convert to hex and sort by frequency
          const colorArray = Array.from(colors.entries()).map(([color, count]) => {
            // Convert RGB to hex if needed
            let hex = color;
            const rgbMatch = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
            if (rgbMatch) {
              const r = parseInt(rgbMatch[1]);
              const g = parseInt(rgbMatch[2]);
              const b = parseInt(rgbMatch[3]);
              hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
            }
            return { color: hex, rgb: color, count };
          });

          return colorArray.sort((a, b) => b.count - a.count);
        })()
      `,
      returnByValue: true
    });

    return result.result.value || [];
  }

  async extractTypography() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const fonts = new Set();
          const sizes = new Map();
          const weights = new Map();
          const lineHeights = new Map();

          document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);

            // Font families
            const family = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
            fonts.add(family);

            // Font sizes
            const size = parseFloat(style.fontSize);
            if (!isNaN(size)) {
              sizes.set(size, (sizes.get(size) || 0) + 1);
            }

            // Font weights
            const weight = style.fontWeight;
            weights.set(weight, (weights.get(weight) || 0) + 1);

            // Line heights
            const lh = parseFloat(style.lineHeight);
            if (!isNaN(lh)) {
              lineHeights.set(lh, (lineHeights.get(lh) || 0) + 1);
            }
          });

          return {
            families: Array.from(fonts),
            sizes: Array.from(sizes.entries())
              .map(([size, count]) => ({ size: size + 'px', count }))
              .sort((a, b) => parseFloat(a.size) - parseFloat(b.size)),
            weights: Array.from(weights.entries())
              .map(([weight, count]) => ({ weight, count }))
              .sort((a, b) => parseInt(a.weight) - parseInt(b.weight)),
            lineHeights: Array.from(lineHeights.entries())
              .map(([height, count]) => ({ height: height + 'px', count }))
              .sort((a, b) => parseFloat(a.height) - parseFloat(b.height))
          };
        })()
      `,
      returnByValue: true
    });

    return result.result.value;
  }

  async extractSpacing() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const spacings = new Map();

          document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const props = [
              'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
              'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
              'gap', 'rowGap', 'columnGap'
            ];

            props.forEach(prop => {
              const value = parseFloat(style[prop]);
              if (!isNaN(value) && value > 0) {
                spacings.set(value, (spacings.get(value) || 0) + 1);
              }
            });
          });

          return Array.from(spacings.entries())
            .map(([value, count]) => ({ value: value + 'px', count }))
            .sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
        })()
      `,
      returnByValue: true
    });

    return result.result.value || [];
  }

  async extractBorderRadii() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const radii = new Map();

          document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const br = parseFloat(style.borderRadius);

            if (!isNaN(br) && br > 0) {
              radii.set(br, (radii.get(br) || 0) + 1);
            }
          });

          return Array.from(radii.entries())
            .map(([value, count]) => ({ value: value + 'px', count }))
            .sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
        })()
      `,
      returnByValue: true
    });

    return result.result.value || [];
  }

  async extractShadows() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const shadows = new Map();

          document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const boxShadow = style.boxShadow;

            if (boxShadow && boxShadow !== 'none') {
              shadows.set(boxShadow, (shadows.get(boxShadow) || 0) + 1);
            }
          });

          return Array.from(shadows.entries())
            .map(([shadow, count]) => ({ shadow, count }))
            .sort((a, b) => b.count - a.count);
        })()
      `,
      returnByValue: true
    });

    return result.result.value || [];
  }

  async extractBreakpoints() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const breakpoints = new Set();

          // Parse all stylesheets
          Array.from(document.styleSheets).forEach(sheet => {
            try {
              Array.from(sheet.cssRules || []).forEach(rule => {
                if (rule.media) {
                  const mediaText = rule.media.mediaText;
                  // Extract width values
                  const matches = mediaText.matchAll(/(min|max)-width:\\s*(\\d+)px/g);
                  for (const match of matches) {
                    breakpoints.add(parseInt(match[2]));
                  }
                }
              });
            } catch (e) {
              // CORS or access denied
            }
          });

          return Array.from(breakpoints).sort((a, b) => a - b);
        })()
      `,
      returnByValue: true
    });

    return result.result.value || [];
  }

  async generateTokensJSON() {
    const [colors, typography, spacing, radii, shadows, breakpoints] = await Promise.all([
      this.extractColors(),
      this.extractTypography(),
      this.extractSpacing(),
      this.extractBorderRadii(),
      this.extractShadows(),
      this.extractBreakpoints()
    ]);

    // Build design tokens object
    const tokens = {
      colors: {
        primary: colors.slice(0, 10).map((c, i) => ({
          name: `color-${i + 1}`,
          value: c.color,
          usage: c.count
        }))
      },
      typography: {
        fontFamily: typography.families.map((f, i) => ({
          name: `font-${i + 1}`,
          value: f
        })),
        fontSize: typography.sizes.slice(0, 15).map((s, i) => ({
          name: `text-${i + 1}`,
          value: s.size,
          usage: s.count
        })),
        fontWeight: typography.weights.map(w => ({
          name: `weight-${w.weight}`,
          value: w.weight,
          usage: w.count
        }))
      },
      spacing: spacing.slice(0, 20).map((s, i) => ({
        name: `space-${i + 1}`,
        value: s.value,
        usage: s.count
      })),
      borderRadius: radii.map((r, i) => ({
        name: `radius-${i + 1}`,
        value: r.value,
        usage: r.count
      })),
      shadows: shadows.slice(0, 10).map((s, i) => ({
        name: `shadow-${i + 1}`,
        value: s.shadow,
        usage: s.count
      })),
      breakpoints: breakpoints.map((bp, i) => ({
        name: `breakpoint-${i + 1}`,
        value: `${bp}px`
      }))
    };

    return tokens;
  }

  formatTokensAsCSS(tokens) {
    let css = ':root {\n';

    // Colors
    tokens.colors.primary.forEach(color => {
      css += `  --${color.name}: ${color.value};\n`;
    });

    css += '\n';

    // Typography
    tokens.typography.fontFamily.forEach(font => {
      css += `  --${font.name}: ${font.value};\n`;
    });

    css += '\n';

    tokens.typography.fontSize.forEach(size => {
      css += `  --${size.name}: ${size.value};\n`;
    });

    css += '\n';

    // Spacing
    tokens.spacing.forEach(space => {
      css += `  --${space.name}: ${space.value};\n`;
    });

    css += '\n';

    // Border radius
    tokens.borderRadius.forEach(radius => {
      css += `  --${radius.name}: ${radius.value};\n`;
    });

    css += '}\n';

    return css;
  }
}

async function main() {
  console.log('=== CDP Design Tokens Extractor Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const extractor = new DesignTokens(client);

    await extractor.enable();

    console.log('\n--- Navigating to page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://github.com' });
    await navPromise;
    await sleep(2000);

    console.log('\n--- Extracting Colors ---');
    const colors = await extractor.extractColors();
    console.log(`  Found ${colors.length} unique colors`);
    colors.slice(0, 10).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.color} (used ${c.count} times)`);
    });

    console.log('\n--- Extracting Typography ---');
    const typography = await extractor.extractTypography();
    console.log(`  Font Families: ${typography.families.join(', ')}`);
    console.log(`  Font Sizes (top 10):`);
    typography.sizes.slice(0, 10).forEach(s => {
      console.log(`    ${s.size} (${s.count} uses)`);
    });
    console.log(`  Font Weights:`);
    typography.weights.forEach(w => {
      console.log(`    ${w.weight} (${w.count} uses)`);
    });

    console.log('\n--- Extracting Spacing ---');
    const spacing = await extractor.extractSpacing();
    console.log(`  Found ${spacing.length} unique spacing values`);
    spacing.slice(0, 15).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.value} (${s.count} uses)`);
    });

    console.log('\n--- Extracting Border Radii ---');
    const radii = await extractor.extractBorderRadii();
    console.log(`  Found ${radii.length} unique border radii`);
    radii.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.value} (${r.count} uses)`);
    });

    console.log('\n--- Extracting Shadows ---');
    const shadows = await extractor.extractShadows();
    console.log(`  Found ${shadows.length} unique shadows`);
    shadows.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.shadow.substring(0, 50)}... (${s.count} uses)`);
    });

    console.log('\n--- Extracting Breakpoints ---');
    const breakpoints = await extractor.extractBreakpoints();
    console.log(`  Found ${breakpoints.length} breakpoints`);
    breakpoints.forEach(bp => {
      console.log(`  - ${bp}px`);
    });

    console.log('\n--- Generating Design Tokens JSON ---');
    const tokens = await extractor.generateTokensJSON();
    console.log(JSON.stringify(tokens, null, 2).substring(0, 500) + '...');

    console.log('\n--- Generating CSS Variables ---');
    const css = extractor.formatTokensAsCSS(tokens);
    console.log(css.substring(0, 400) + '...');

    console.log('\n=== Demo Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { DesignTokens };
