/**
 * App 24: Reading Mode
 *
 * Article extraction and reader mode using CDP:
 * - Detect article content (heuristics-based)
 * - Remove ads, sidebars, navigation
 * - Apply clean typography
 * - Adjust reading width and spacing
 * - Dark/light mode toggle
 *
 * CDP Domains: DOM, CSS, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class ReadingMode {
  constructor(client) {
    this.client = client;
    this.originalStyles = null;
  }

  async enable() {
    await this.client.send('DOM.enable');
    await this.client.send('CSS.enable');
    await this.client.send('Runtime.enable');
    console.log('[ReadingMode] Domains enabled');
  }

  async extractArticleContent() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          // Heuristics to find main article content
          const candidates = [];

          // Common article selectors
          const selectors = [
            'article',
            '[role="main"]',
            'main',
            '.post-content',
            '.article-content',
            '.entry-content',
            '#content',
            '.content'
          ];

          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const text = el.innerText || '';
              const paragraphs = el.querySelectorAll('p').length;
              const wordCount = text.split(/\\s+/).length;

              // Score based on content density
              if (paragraphs >= 3 && wordCount >= 100) {
                candidates.push({
                  element: el,
                  score: paragraphs * 10 + wordCount,
                  selector: selector,
                  paragraphs,
                  words: wordCount
                });
              }
            });
          }

          // If no matches, try to find the element with most text
          if (candidates.length === 0) {
            const all = document.querySelectorAll('div, section, article');
            all.forEach(el => {
              const text = el.innerText || '';
              const paragraphs = el.querySelectorAll('p').length;
              const wordCount = text.split(/\\s+/).length;

              if (paragraphs >= 2 && wordCount >= 50) {
                candidates.push({
                  element: el,
                  score: paragraphs * 5 + wordCount,
                  paragraphs,
                  words: wordCount
                });
              }
            });
          }

          if (candidates.length === 0) return null;

          // Sort by score
          candidates.sort((a, b) => b.score - a.score);
          const best = candidates[0];

          // Mark the element
          best.element.setAttribute('data-cdp-article', 'true');

          return {
            selector: best.selector || 'detected',
            paragraphs: best.paragraphs,
            words: best.words,
            score: best.score
          };
        })()
      `,
      returnByValue: true
    });

    return result.result.value;
  }

  async applyReaderMode(theme = 'light') {
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#1a1a1a' : '#f5f5dc';
    const textColor = isDark ? '#e0e0e0' : '#333';
    const linkColor = isDark ? '#6ab0f3' : '#0066cc';

    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          // Hide everything except article
          document.body.style.margin = '0';
          document.body.style.padding = '0';
          document.body.style.background = '${bgColor}';

          const article = document.querySelector('[data-cdp-article]');
          if (!article) {
            console.error('No article content found');
            return;
          }

          // Hide everything else
          const allElements = document.querySelectorAll('body > *');
          allElements.forEach(el => {
            if (!el.contains(article)) {
              el.style.display = 'none';
            }
          });

          // Create reader container
          if (!document.getElementById('cdp-reader-container')) {
            const container = document.createElement('div');
            container.id = 'cdp-reader-container';
            container.style.cssText = \`
              max-width: 700px;
              margin: 0 auto;
              padding: 60px 20px;
              background: ${bgColor};
              color: ${textColor};
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 18px;
              line-height: 1.8;
            \`;

            // Extract article and move to container
            const articleClone = article.cloneNode(true);
            container.appendChild(articleClone);

            // Clear and rebuild body
            document.body.innerHTML = '';
            document.body.appendChild(container);

            // Style article content
            const style = document.createElement('style');
            style.textContent = \`
              #cdp-reader-container h1 { font-size: 2.5em; margin: 0.5em 0; }
              #cdp-reader-container h2 { font-size: 2em; margin: 1em 0 0.5em; }
              #cdp-reader-container h3 { font-size: 1.5em; margin: 1em 0 0.5em; }
              #cdp-reader-container p { margin: 1em 0; text-align: justify; }
              #cdp-reader-container img { max-width: 100%; height: auto; display: block; margin: 2em auto; }
              #cdp-reader-container a { color: ${linkColor}; text-decoration: none; }
              #cdp-reader-container a:hover { text-decoration: underline; }
              #cdp-reader-container blockquote {
                border-left: 4px solid ${textColor};
                margin: 1.5em 0;
                padding: 0.5em 1em;
                font-style: italic;
              }
              #cdp-reader-container code {
                background: ${isDark ? '#2a2a2a' : '#eee'};
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
              }
              #cdp-reader-container pre {
                background: ${isDark ? '#2a2a2a' : '#eee'};
                padding: 1em;
                overflow-x: auto;
                border-radius: 5px;
              }
            \`;
            document.head.appendChild(style);
          }
        })()
      `
    });
    console.log(`[ReadingMode] Applied ${theme} theme`);
  }

  async removeClutter() {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          // Remove common clutter elements
          const clutterSelectors = [
            'header',
            'footer',
            'nav',
            'aside',
            '.sidebar',
            '.advertisement',
            '.ad',
            '.ads',
            '.social-share',
            '.comments',
            '.related-posts',
            '#comments',
            '[class*="banner"]',
            '[id*="banner"]',
            '[class*="popup"]',
            '[id*="popup"]',
            'iframe[src*="ads"]',
            'script',
            'style'
          ];

          let removed = 0;
          clutterSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
              // Don't remove if it's inside the article
              if (!el.hasAttribute('data-cdp-article')) {
                el.remove();
                removed++;
              }
            });
          });

          return removed;
        })()
      `,
      returnByValue: true
    });
  }

  async adjustTypography(fontSize = 18, lineHeight = 1.8) {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const container = document.getElementById('cdp-reader-container');
          if (container) {
            container.style.fontSize = '${fontSize}px';
            container.style.lineHeight = '${lineHeight}';
          }
        })()
      `
    });
    console.log(`[ReadingMode] Typography adjusted: ${fontSize}px, ${lineHeight} line-height`);
  }

  async estimateReadingTime() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const article = document.querySelector('[data-cdp-article]') ||
                         document.getElementById('cdp-reader-container');
          if (!article) return null;

          const text = article.innerText || '';
          const words = text.split(/\\s+/).length;
          const avgWordsPerMinute = 200;
          const minutes = Math.ceil(words / avgWordsPerMinute);

          return { words, minutes };
        })()
      `,
      returnByValue: true
    });
    return result.result.value;
  }

  async extractMetadata() {
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const getMeta = (name) => {
            const el = document.querySelector(\`meta[name="\${name}"], meta[property="\${name}"]\`);
            return el ? el.content : null;
          };

          return {
            title: document.title,
            author: getMeta('author') || getMeta('article:author'),
            description: getMeta('description') || getMeta('og:description'),
            publishDate: getMeta('article:published_time'),
            image: getMeta('og:image')
          };
        })()
      `,
      returnByValue: true
    });
    return result.result.value;
  }

  async restoreOriginal() {
    await this.client.send('Page.reload');
    console.log('[ReadingMode] Restored original page');
  }
}

async function main() {
  console.log('=== CDP Reading Mode Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const reader = new ReadingMode(client);

    await reader.enable();

    console.log('\n--- Navigating to article ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://en.wikipedia.org/wiki/Chrome_DevTools_Protocol' });
    await navPromise;
    await sleep(1000);

    console.log('\n--- Extracting article metadata ---');
    const metadata = await reader.extractMetadata();
    console.log(`  Title: ${metadata.title}`);
    console.log(`  Author: ${metadata.author || 'N/A'}`);
    console.log(`  Description: ${metadata.description?.substring(0, 100)}...`);

    console.log('\n--- Detecting article content ---');
    const articleInfo = await reader.extractArticleContent();
    if (articleInfo) {
      console.log(`  Selector: ${articleInfo.selector}`);
      console.log(`  Paragraphs: ${articleInfo.paragraphs}`);
      console.log(`  Words: ${articleInfo.words}`);
      console.log(`  Score: ${articleInfo.score}`);
    }

    console.log('\n--- Estimating reading time ---');
    const readTime = await reader.estimateReadingTime();
    if (readTime) {
      console.log(`  Words: ${readTime.words}`);
      console.log(`  Estimated time: ${readTime.minutes} minute(s)`);
    }

    console.log('\n--- Applying reader mode (light theme) ---');
    await reader.applyReaderMode('light');
    await sleep(3000);

    console.log('\n--- Switching to dark theme ---');
    await reader.applyReaderMode('dark');
    await sleep(3000);

    console.log('\n--- Adjusting typography ---');
    await reader.adjustTypography(20, 2.0);
    await sleep(2000);

    console.log('\n=== Demo Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { ReadingMode };
