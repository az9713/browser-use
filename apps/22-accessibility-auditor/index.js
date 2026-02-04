/**
 * App 22: Accessibility Auditor
 *
 * Demonstrates accessibility auditing using CDP:
 * - Scan page for a11y issues
 * - Missing alt text detection
 * - Low color contrast detection
 * - Missing form labels
 * - Visual overlay highlighting issues
 * - Generate fix suggestions
 *
 * CDP Domains: Accessibility, DOM, Overlay, CSS
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import { getContrastRatio } from '../../shared/utils.js';

class AccessibilityAuditor {
  constructor(client) {
    this.client = client;
    this.issues = [];
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Accessibility.enable');
    await this.client.send('DOM.enable');
    await this.client.send('CSS.enable');
    await this.client.send('Overlay.enable');
    await this.client.send('Page.enable');
    await this.client.send('Runtime.enable');
    console.log('[A11yAuditor] All domains enabled');
  }

  /**
   * Run full accessibility audit
   * @returns {Promise<Array>} - Array of issues found
   */
  async audit() {
    this.issues = [];
    console.log('[A11yAuditor] Starting audit...');

    await this.checkMissingAltText();
    await this.checkFormLabels();
    await this.checkHeadingStructure();
    await this.checkLinkText();
    await this.checkColorContrast();
    await this.checkKeyboardAccessibility();
    await this.checkARIAUsage();

    console.log(`[A11yAuditor] Audit complete. Found ${this.issues.length} issues.`);
    return this.issues;
  }

  /**
   * Check for images without alt text
   */
  async checkMissingAltText() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          hasAlt: img.hasAttribute('alt'),
          selector: img.id ? '#' + img.id : 'img[src="' + img.src.split('/').pop() + '"]'
        }))
      `,
      returnByValue: true
    });

    for (const img of result.result.value) {
      if (!img.hasAlt) {
        this.issues.push({
          type: 'error',
          category: 'images',
          rule: 'img-alt',
          message: 'Image missing alt attribute',
          selector: img.selector,
          impact: 'critical',
          fix: `Add alt="" for decorative images or descriptive alt text for meaningful images`
        });
      } else if (img.alt === '' && !this.isDecorativeImage(img.src)) {
        this.issues.push({
          type: 'warning',
          category: 'images',
          rule: 'img-alt-empty',
          message: 'Image has empty alt text',
          selector: img.selector,
          impact: 'moderate',
          fix: 'Verify this is a decorative image, otherwise add descriptive alt text'
        });
      }
    }
  }

  isDecorativeImage(src) {
    const decorativePatterns = ['spacer', 'pixel', 'blank', 'transparent'];
    return decorativePatterns.some(p => src.toLowerCase().includes(p));
  }

  /**
   * Check for form inputs without labels
   */
  async checkFormLabels() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('input, select, textarea'))
          .filter(el => !['hidden', 'submit', 'button', 'image'].includes(el.type))
          .map(el => {
            const id = el.id;
            const hasLabel = id && document.querySelector('label[for="' + id + '"]');
            const hasAriaLabel = el.hasAttribute('aria-label');
            const hasAriaLabelledby = el.hasAttribute('aria-labelledby');
            const hasTitle = el.hasAttribute('title');
            const isLabelled = hasLabel || hasAriaLabel || hasAriaLabelledby || hasTitle;

            return {
              type: el.type || el.tagName.toLowerCase(),
              id: el.id,
              name: el.name,
              isLabelled,
              selector: el.id ? '#' + el.id : el.name ? '[name="' + el.name + '"]' : el.tagName.toLowerCase()
            };
          })
      `,
      returnByValue: true
    });

    for (const input of result.result.value) {
      if (!input.isLabelled) {
        this.issues.push({
          type: 'error',
          category: 'forms',
          rule: 'label',
          message: `Form ${input.type} is missing a label`,
          selector: input.selector,
          impact: 'critical',
          fix: 'Add a <label for="id"> element or aria-label attribute'
        });
      }
    }
  }

  /**
   * Check heading structure
   */
  async checkHeadingStructure() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map((h, i, arr) => ({
            level: parseInt(h.tagName[1]),
            text: h.textContent.trim().substring(0, 50),
            prevLevel: i > 0 ? parseInt(arr[i-1].tagName[1]) : 0,
            isEmpty: !h.textContent.trim()
          }))
      `,
      returnByValue: true
    });

    const headings = result.result.value;

    // Check for missing h1
    const hasH1 = headings.some(h => h.level === 1);
    if (!hasH1 && headings.length > 0) {
      this.issues.push({
        type: 'error',
        category: 'structure',
        rule: 'heading-order',
        message: 'Page is missing an h1 heading',
        impact: 'serious',
        fix: 'Add an h1 heading as the main title of the page'
      });
    }

    // Check for skipped heading levels
    for (const h of headings) {
      if (h.level > h.prevLevel + 1 && h.prevLevel !== 0) {
        this.issues.push({
          type: 'warning',
          category: 'structure',
          rule: 'heading-order',
          message: `Heading level skipped from h${h.prevLevel} to h${h.level}`,
          selector: `h${h.level}`,
          impact: 'moderate',
          fix: `Use h${h.prevLevel + 1} instead of h${h.level}`
        });
      }

      if (h.isEmpty) {
        this.issues.push({
          type: 'error',
          category: 'structure',
          rule: 'empty-heading',
          message: `Empty h${h.level} heading`,
          selector: `h${h.level}:empty`,
          impact: 'serious',
          fix: 'Add text content to the heading or remove it'
        });
      }
    }
  }

  /**
   * Check link text
   */
  async checkLinkText() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('a'))
          .map(a => ({
            text: a.textContent.trim(),
            href: a.href,
            hasAriaLabel: a.hasAttribute('aria-label'),
            ariaLabel: a.getAttribute('aria-label'),
            selector: a.href ? 'a[href="' + a.href.split('?')[0] + '"]' : 'a'
          }))
      `,
      returnByValue: true
    });

    const genericTexts = ['click here', 'read more', 'learn more', 'here', 'more', 'link'];

    for (const link of result.result.value) {
      const text = (link.ariaLabel || link.text).toLowerCase();

      if (!text && !link.hasAriaLabel) {
        this.issues.push({
          type: 'error',
          category: 'links',
          rule: 'link-name',
          message: 'Link has no accessible name',
          selector: link.selector,
          impact: 'critical',
          fix: 'Add link text or aria-label'
        });
      } else if (genericTexts.includes(text)) {
        this.issues.push({
          type: 'warning',
          category: 'links',
          rule: 'link-name',
          message: `Link has generic text: "${text}"`,
          selector: link.selector,
          impact: 'moderate',
          fix: 'Use descriptive link text that explains the destination'
        });
      }
    }
  }

  /**
   * Check color contrast (simplified check)
   */
  async checkColorContrast() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('p, span, div, a, h1, h2, h3, h4, h5, h6, li'))
          .slice(0, 50) // Limit to first 50 elements
          .map(el => {
            const style = window.getComputedStyle(el);
            return {
              text: el.textContent.trim().substring(0, 20),
              color: style.color,
              background: style.backgroundColor,
              fontSize: parseFloat(style.fontSize),
              fontWeight: style.fontWeight,
              selector: el.tagName.toLowerCase()
            };
          })
          .filter(el => el.text.length > 0)
      `,
      returnByValue: true
    });

    // Note: Full contrast checking would require converting RGB to relative luminance
    // This is a simplified version
    for (const el of result.result.value) {
      if (el.color === el.background && el.color !== 'rgba(0, 0, 0, 0)') {
        this.issues.push({
          type: 'error',
          category: 'color',
          rule: 'color-contrast',
          message: 'Text color matches background color',
          selector: el.selector,
          impact: 'critical',
          fix: 'Ensure text color contrasts sufficiently with background'
        });
      }
    }
  }

  /**
   * Check keyboard accessibility
   */
  async checkKeyboardAccessibility() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('[onclick], [onmousedown], [onmouseup]'))
          .filter(el => !['a', 'button', 'input', 'select', 'textarea'].includes(el.tagName.toLowerCase()))
          .map(el => ({
            tag: el.tagName.toLowerCase(),
            hasTabindex: el.hasAttribute('tabindex'),
            hasRole: el.hasAttribute('role'),
            selector: el.className ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase()
          }))
      `,
      returnByValue: true
    });

    for (const el of result.result.value) {
      if (!el.hasTabindex) {
        this.issues.push({
          type: 'warning',
          category: 'keyboard',
          rule: 'click-events',
          message: `${el.tag} with click handler may not be keyboard accessible`,
          selector: el.selector,
          impact: 'serious',
          fix: 'Add tabindex="0" and keyboard event handlers, or use a button element'
        });
      }
    }
  }

  /**
   * Check ARIA usage
   */
  async checkARIAUsage() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('[role]'))
          .map(el => ({
            role: el.getAttribute('role'),
            tag: el.tagName.toLowerCase(),
            selector: '[role="' + el.getAttribute('role') + '"]'
          }))
      `,
      returnByValue: true
    });

    const redundantRoles = {
      'a': 'link',
      'button': 'button',
      'h1': 'heading',
      'ul': 'list',
      'nav': 'navigation'
    };

    for (const el of result.result.value) {
      if (redundantRoles[el.tag] === el.role) {
        this.issues.push({
          type: 'warning',
          category: 'aria',
          rule: 'redundant-role',
          message: `Redundant role="${el.role}" on <${el.tag}>`,
          selector: el.selector,
          impact: 'minor',
          fix: `Remove role="${el.role}" as it's implicit for <${el.tag}>`
        });
      }
    }
  }

  /**
   * Highlight issues on page
   * @param {string} category - Category to highlight (optional)
   */
  async highlightIssues(category = null) {
    const issuesToHighlight = category ?
      this.issues.filter(i => i.category === category) :
      this.issues;

    for (const issue of issuesToHighlight) {
      if (!issue.selector) continue;

      try {
        const { root } = await this.client.send('DOM.getDocument');
        const { nodeId } = await this.client.send('DOM.querySelector', {
          nodeId: root.nodeId,
          selector: issue.selector
        });

        if (nodeId !== 0) {
          const color = issue.type === 'error' ?
            { r: 255, g: 0, b: 0, a: 0.5 } :
            { r: 255, g: 165, b: 0, a: 0.5 };

          await this.client.send('Overlay.highlightNode', {
            highlightConfig: {
              contentColor: color,
              borderColor: { r: 255, g: 0, b: 0, a: 1 }
            },
            nodeId
          });

          await sleep(500);
        }
      } catch (e) {
        // Skip elements that can't be highlighted
      }
    }
  }

  /**
   * Generate report
   * @returns {object}
   */
  generateReport() {
    const byCategory = {};
    const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };

    for (const issue of this.issues) {
      byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
      byImpact[issue.impact] = (byImpact[issue.impact] || 0) + 1;
    }

    return {
      totalIssues: this.issues.length,
      errors: this.issues.filter(i => i.type === 'error').length,
      warnings: this.issues.filter(i => i.type === 'warning').length,
      byCategory,
      byImpact,
      issues: this.issues
    };
  }

  /**
   * Print report to console
   */
  printReport() {
    const report = this.generateReport();

    console.log('\n=== Accessibility Audit Report ===\n');
    console.log(`Total Issues: ${report.totalIssues}`);
    console.log(`  Errors: ${report.errors}`);
    console.log(`  Warnings: ${report.warnings}`);

    console.log('\nBy Impact:');
    for (const [impact, count] of Object.entries(report.byImpact)) {
      if (count > 0) console.log(`  ${impact}: ${count}`);
    }

    console.log('\nBy Category:');
    for (const [category, count] of Object.entries(report.byCategory)) {
      console.log(`  ${category}: ${count}`);
    }

    console.log('\nIssues:');
    for (const issue of this.issues) {
      const icon = issue.type === 'error' ? '[ERROR]' : '[WARN]';
      console.log(`\n${icon} ${issue.message}`);
      console.log(`  Category: ${issue.category} | Impact: ${issue.impact}`);
      if (issue.selector) console.log(`  Selector: ${issue.selector}`);
      console.log(`  Fix: ${issue.fix}`);
    }
  }
}

// Demo
async function main() {
  console.log('=== CDP Accessibility Auditor Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const auditor = new AccessibilityAuditor(client);

    // Enable domains
    await auditor.enable();

    // Navigate to a page to audit
    console.log('\n--- Navigating to test page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    // Run audit
    console.log('\n--- Running Accessibility Audit ---');
    const issues = await auditor.audit();

    // Print report
    auditor.printReport();

    // Highlight issues on page
    if (issues.length > 0) {
      console.log('\n--- Highlighting Issues on Page ---');
      await auditor.highlightIssues();
      await sleep(2000);

      // Clear highlights
      await client.send('Overlay.hideHighlight');
    }

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { AccessibilityAuditor };
