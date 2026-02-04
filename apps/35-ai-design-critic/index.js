/**
 * App 35: AI Design Critic
 *
 * Analyze design quality and accessibility using CDP:
 * - Color contrast analysis (WCAG compliance)
 * - Spacing consistency
 * - Typography scale evaluation
 * - Layout assessment
 * - Accessibility issues
 * - Design system violations
 *
 * CDP Domains: DOM, CSS, Runtime, Accessibility
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import { getContrastRatio } from '../../shared/utils.js';

class AIDesignCritic {
  constructor(client) {
    this.client = client;
    this.issues = [];
    this.recommendations = [];
  }

  async enable() {
    await this.client.send('DOM.enable');
    await this.client.send('CSS.enable');
    await this.client.send('Runtime.enable');
    await this.client.send('Accessibility.enable');
    console.log('[DesignCritic] Enabled');
  }

  async analyzeColorContrast() {
    console.log('[DesignCritic] Analyzing color contrast...');

    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const issues = [];

          function rgbToHex(rgb) {
            const match = rgb.match(/\\d+/g);
            if (!match) return null;
            const r = parseInt(match[0]);
            const g = parseInt(match[1]);
            const b = parseInt(match[2]);
            return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
          }

          function getLuminance(hex) {
            const rgb = hex.replace('#', '').match(/.{2}/g).map(x => {
              const c = parseInt(x, 16) / 255;
              return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
          }

          function getContrastRatio(hex1, hex2) {
            const l1 = getLuminance(hex1);
            const l2 = getLuminance(hex2);
            const lighter = Math.max(l1, l2);
            const darker = Math.min(l1, l2);
            return (lighter + 0.05) / (darker + 0.05);
          }

          // Check text elements
          document.querySelectorAll('*').forEach((el, index) => {
            if (index > 500) return; // Limit for performance

            const style = window.getComputedStyle(el);
            const text = el.innerText?.trim();

            if (text && text.length > 0 && el.offsetParent !== null) {
              const color = rgbToHex(style.color);
              const bgColor = rgbToHex(style.backgroundColor);

              if (color && bgColor && bgColor !== '#000000' && color !== bgColor) {
                const ratio = getContrastRatio(color, bgColor);
                const fontSize = parseFloat(style.fontSize);
                const isBold = parseInt(style.fontWeight) >= 700;

                // WCAG AA requirements
                const minRatio = (fontSize >= 18 || (fontSize >= 14 && isBold)) ? 3 : 4.5;

                if (ratio < minRatio) {
                  issues.push({
                    element: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
                    color,
                    bgColor,
                    ratio: ratio.toFixed(2),
                    required: minRatio,
                    fontSize: fontSize + 'px',
                    wcagLevel: ratio >= 3 ? 'AA Large' : 'Fail'
                  });
                }
              }
            }
          });

          return issues;
        })()
      `,
      returnByValue: true
    });

    const issues = result.result.value || [];
    issues.forEach(issue => {
      this.issues.push({
        type: 'contrast',
        severity: 'high',
        ...issue
      });
    });

    return issues;
  }

  async analyzeSpacing() {
    console.log('[DesignCritic] Analyzing spacing consistency...');

    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const spacings = new Map();
          const issues = [];

          document.querySelectorAll('*').forEach((el, index) => {
            if (index > 300) return;

            const style = window.getComputedStyle(el);
            const props = ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'gap'];

            props.forEach(prop => {
              const value = parseFloat(style[prop]);
              if (!isNaN(value) && value > 0) {
                spacings.set(value, (spacings.get(value) || 0) + 1);
              }
            });
          });

          // Check for too many unique values
          const uniqueSpacings = Array.from(spacings.keys()).sort((a, b) => a - b);

          if (uniqueSpacings.length > 20) {
            issues.push({
              type: 'spacing-inconsistency',
              message: 'Too many unique spacing values',
              count: uniqueSpacings.length,
              values: uniqueSpacings.slice(0, 10).map(v => v + 'px')
            });
          }

          // Check for spacing not on 4px or 8px grid
          const offGrid = uniqueSpacings.filter(v => v % 4 !== 0 && v % 8 !== 0);
          if (offGrid.length > 0) {
            issues.push({
              type: 'spacing-off-grid',
              message: 'Spacing values not on 4px/8px grid',
              values: offGrid.slice(0, 10).map(v => v + 'px')
            });
          }

          return { issues, spacings: Array.from(spacings.entries()).map(([v, c]) => ({ value: v + 'px', count: c })) };
        })()
      `,
      returnByValue: true
    });

    const data = result.result.value;
    data.issues.forEach(issue => {
      this.issues.push({
        severity: 'medium',
        ...issue
      });
    });

    return data;
  }

  async analyzeTypography() {
    console.log('[DesignCritic] Analyzing typography...');

    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const fontSizes = new Map();
          const lineHeights = new Map();
          const issues = [];

          document.querySelectorAll('*').forEach((el, index) => {
            if (index > 300) return;

            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            const lineHeight = parseFloat(style.lineHeight);

            if (!isNaN(fontSize)) {
              fontSizes.set(fontSize, (fontSizes.get(fontSize) || 0) + 1);
            }

            if (!isNaN(lineHeight) && !isNaN(fontSize)) {
              const ratio = lineHeight / fontSize;
              if (ratio < 1.2) {
                issues.push({
                  type: 'line-height-too-tight',
                  fontSize: fontSize + 'px',
                  lineHeight: lineHeight + 'px',
                  ratio: ratio.toFixed(2)
                });
              }
            }
          });

          // Too many font sizes
          if (fontSizes.size > 12) {
            issues.push({
              type: 'too-many-font-sizes',
              count: fontSizes.size,
              message: 'Too many unique font sizes (suggest 6-8 for a type scale)'
            });
          }

          // Check for very small text
          const tooSmall = Array.from(fontSizes.keys()).filter(size => size < 12);
          if (tooSmall.length > 0) {
            issues.push({
              type: 'font-too-small',
              message: 'Text smaller than 12px detected',
              sizes: tooSmall.map(s => s + 'px')
            });
          }

          return {
            issues,
            fontSizes: Array.from(fontSizes.entries()).map(([s, c]) => ({ size: s + 'px', count: c }))
          };
        })()
      `,
      returnByValue: true
    });

    const data = result.result.value;
    data.issues.forEach(issue => {
      this.issues.push({
        severity: issue.type === 'font-too-small' ? 'high' : 'medium',
        ...issue
      });
    });

    return data;
  }

  async analyzeAccessibility() {
    console.log('[DesignCritic] Analyzing accessibility...');

    // Get full accessibility tree
    const axTree = await this.client.send('Accessibility.getFullAXTree');

    const issues = [];

    // Analyze accessibility nodes
    axTree.nodes.forEach(node => {
      // Check for missing labels
      if (node.role?.value === 'button' || node.role?.value === 'link') {
        const hasName = node.name?.value && node.name.value.length > 0;
        if (!hasName) {
          issues.push({
            type: 'missing-label',
            role: node.role.value,
            nodeId: node.nodeId
          });
        }
      }

      // Check for images without alt
      if (node.role?.value === 'img') {
        const hasAlt = node.name?.value && node.name.value.length > 0;
        if (!hasAlt) {
          issues.push({
            type: 'missing-alt-text',
            nodeId: node.nodeId
          });
        }
      }

      // Check for low contrast
      if (node.properties) {
        const contrastProp = node.properties.find(p => p.name === 'contrast');
        if (contrastProp && contrastProp.value?.value === 'low') {
          issues.push({
            type: 'low-contrast',
            nodeId: node.nodeId
          });
        }
      }
    });

    issues.forEach(issue => {
      this.issues.push({
        severity: 'high',
        category: 'accessibility',
        ...issue
      });
    });

    return issues;
  }

  async analyzeLayout() {
    console.log('[DesignCritic] Analyzing layout...');

    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const issues = [];

          // Check for fixed widths on containers
          document.querySelectorAll('div, section, main, aside').forEach(el => {
            const style = window.getComputedStyle(el);
            const width = style.width;

            if (width && width.endsWith('px') && !el.matches('img, svg, canvas')) {
              const widthValue = parseFloat(width);
              if (widthValue > 500) {
                issues.push({
                  type: 'fixed-width-container',
                  element: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
                  width: width,
                  message: 'Consider using responsive units (%, vw, etc.)'
                });
              }
            }
          });

          // Check for deeply nested elements
          document.querySelectorAll('*').forEach(el => {
            let depth = 0;
            let current = el;
            while (current.parentElement) {
              depth++;
              current = current.parentElement;
            }

            if (depth > 20) {
              issues.push({
                type: 'deep-nesting',
                element: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
                depth: depth,
                message: 'Very deep DOM nesting can impact performance'
              });
            }
          });

          return issues.slice(0, 20);
        })()
      `,
      returnByValue: true
    });

    const issues = result.result.value || [];
    issues.forEach(issue => {
      this.issues.push({
        severity: 'low',
        category: 'layout',
        ...issue
      });
    });

    return issues;
  }

  generateRecommendations() {
    console.log('[DesignCritic] Generating recommendations...');

    // Contrast recommendations
    const contrastIssues = this.issues.filter(i => i.type === 'contrast');
    if (contrastIssues.length > 0) {
      this.recommendations.push({
        priority: 'high',
        category: 'accessibility',
        title: 'Fix Color Contrast Issues',
        description: `${contrastIssues.length} elements have insufficient color contrast. This impacts readability and accessibility.`,
        action: 'Review and adjust text/background color combinations to meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).'
      });
    }

    // Spacing recommendations
    const spacingIssues = this.issues.filter(i => i.type?.includes('spacing'));
    if (spacingIssues.length > 0) {
      this.recommendations.push({
        priority: 'medium',
        category: 'design-system',
        title: 'Establish Consistent Spacing Scale',
        description: 'Multiple spacing inconsistencies detected.',
        action: 'Define a spacing scale (e.g., 4px, 8px, 12px, 16px, 24px, 32px, 48px) and use it consistently throughout the design.'
      });
    }

    // Typography recommendations
    const typographyIssues = this.issues.filter(i => i.type?.includes('font'));
    if (typographyIssues.length > 0) {
      this.recommendations.push({
        priority: 'medium',
        category: 'typography',
        title: 'Refine Typography Scale',
        description: 'Typography inconsistencies found.',
        action: 'Establish a type scale with 6-8 sizes. Ensure minimum font size of 14-16px for body text. Maintain line-height of at least 1.5 for readability.'
      });
    }

    // Accessibility recommendations
    const a11yIssues = this.issues.filter(i => i.category === 'accessibility');
    if (a11yIssues.length > 0) {
      this.recommendations.push({
        priority: 'high',
        category: 'accessibility',
        title: 'Improve Accessibility',
        description: `${a11yIssues.length} accessibility issues detected.`,
        action: 'Add ARIA labels, alt text for images, and ensure all interactive elements have accessible names.'
      });
    }

    return this.recommendations;
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('  DESIGN CRITIQUE REPORT');
    console.log('='.repeat(60));

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('─'.repeat(60));
    const bySeverity = {
      high: this.issues.filter(i => i.severity === 'high').length,
      medium: this.issues.filter(i => i.severity === 'medium').length,
      low: this.issues.filter(i => i.severity === 'low').length
    };
    console.log(`  Total Issues: ${this.issues.length}`);
    console.log(`  🔴 High:   ${bySeverity.high}`);
    console.log(`  🟡 Medium: ${bySeverity.medium}`);
    console.log(`  🟢 Low:    ${bySeverity.low}`);

    // Issues by category
    console.log('\n🔍 ISSUES BY CATEGORY');
    console.log('─'.repeat(60));

    const byCategory = {};
    this.issues.forEach(issue => {
      const cat = issue.category || issue.type || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`  ${cat.padEnd(30)} ${count} issue(s)`);
    });

    // Top issues
    console.log('\n⚠️  TOP ISSUES');
    console.log('─'.repeat(60));
    const topIssues = this.issues
      .filter(i => i.severity === 'high')
      .slice(0, 5);

    topIssues.forEach((issue, i) => {
      console.log(`\n  ${i + 1}. ${issue.type?.toUpperCase() || 'ISSUE'}`);
      if (issue.message) console.log(`     ${issue.message}`);
      if (issue.element) console.log(`     Element: ${issue.element}`);
      if (issue.ratio) console.log(`     Contrast Ratio: ${issue.ratio}:1 (required: ${issue.required}:1)`);
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('─'.repeat(60));
    this.recommendations.forEach((rec, i) => {
      const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`\n  ${icon} ${rec.title}`);
      console.log(`     ${rec.description}`);
      console.log(`     ➜ ${rec.action}`);
    });

    console.log('\n' + '='.repeat(60));
  }

  getScore() {
    const maxScore = 100;
    const highPenalty = 10;
    const mediumPenalty = 5;
    const lowPenalty = 1;

    const penalty =
      this.issues.filter(i => i.severity === 'high').length * highPenalty +
      this.issues.filter(i => i.severity === 'medium').length * mediumPenalty +
      this.issues.filter(i => i.severity === 'low').length * lowPenalty;

    const score = Math.max(0, maxScore - penalty);

    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    return { score, grade };
  }
}

async function main() {
  console.log('=== CDP AI Design Critic Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const critic = new AIDesignCritic(client);

    await critic.enable();

    console.log('\n--- Navigating to page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(2000);

    console.log('\n--- Running design analysis ---');

    await critic.analyzeColorContrast();
    await critic.analyzeSpacing();
    await critic.analyzeTypography();
    await critic.analyzeAccessibility();
    await critic.analyzeLayout();

    critic.generateRecommendations();

    critic.printReport();

    const { score, grade } = critic.getScore();
    console.log(`\n📈 DESIGN SCORE: ${score}/100 (Grade: ${grade})\n`);

    console.log('\n=== Analysis Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { AIDesignCritic };
