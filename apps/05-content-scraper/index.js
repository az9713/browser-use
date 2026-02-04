/**
 * App 05: Content Scraper
 *
 * Demonstrates content extraction using CDP:
 * - Extract all links from page
 * - Extract all images with src/alt
 * - Extract tables as JSON
 * - Extract structured article content
 * - Save extracted data to file
 *
 * CDP Domains: DOM, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import fs from 'fs/promises';
import path from 'path';

class ContentScraper {
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
    console.log('[Scraper] DOM, Page, and Runtime domains enabled');
  }

  /**
   * Execute JavaScript and return result
   * @param {string} expression - JavaScript expression
   * @returns {Promise<any>}
   */
  async evaluate(expression) {
    const result = await this.client.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });

    if (result.exceptionDetails) {
      throw new Error(`Evaluation failed: ${result.exceptionDetails.text}`);
    }

    return result.result.value;
  }

  /**
   * Extract all links from the page
   * @returns {Promise<Array>}
   */
  async extractLinks() {
    return this.evaluate(`
      Array.from(document.querySelectorAll('a[href]')).map(a => ({
        text: a.textContent.trim(),
        href: a.href,
        title: a.title || null,
        target: a.target || null
      }))
    `);
  }

  /**
   * Extract all images from the page
   * @returns {Promise<Array>}
   */
  async extractImages() {
    return this.evaluate(`
      Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt || null,
        width: img.naturalWidth,
        height: img.naturalHeight,
        loading: img.loading
      }))
    `);
  }

  /**
   * Extract tables as JSON
   * @returns {Promise<Array>}
   */
  async extractTables() {
    return this.evaluate(`
      Array.from(document.querySelectorAll('table')).map(table => {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
        const rows = Array.from(table.querySelectorAll('tbody tr, tr')).map(tr => {
          const cells = Array.from(tr.querySelectorAll('td, th')).map(cell => cell.textContent.trim());
          if (headers.length > 0 && cells.length === headers.length) {
            const row = {};
            headers.forEach((h, i) => row[h] = cells[i]);
            return row;
          }
          return cells;
        }).filter(row => row.length > 0 || Object.keys(row).length > 0);

        return {
          headers,
          rows,
          caption: table.querySelector('caption')?.textContent.trim() || null
        };
      })
    `);
  }

  /**
   * Extract article content (main content area)
   * @returns {Promise<object>}
   */
  async extractArticle() {
    return this.evaluate(`
      (function() {
        // Try to find article element
        const article = document.querySelector('article') ||
                       document.querySelector('[role="main"]') ||
                       document.querySelector('main') ||
                       document.querySelector('.content') ||
                       document.querySelector('#content') ||
                       document.body;

        // Get title
        const title = document.querySelector('h1')?.textContent.trim() ||
                     document.title;

        // Get meta description
        const metaDesc = document.querySelector('meta[name="description"]')?.content || null;

        // Get all headings
        const headings = Array.from(article.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
          level: parseInt(h.tagName[1]),
          text: h.textContent.trim()
        }));

        // Get paragraphs
        const paragraphs = Array.from(article.querySelectorAll('p')).map(p => p.textContent.trim()).filter(t => t.length > 0);

        // Get all text content
        const fullText = article.textContent.replace(/\\s+/g, ' ').trim();

        // Estimate reading time (avg 200 words per minute)
        const wordCount = fullText.split(/\\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);

        return {
          title,
          description: metaDesc,
          headings,
          paragraphs,
          wordCount,
          readingTimeMinutes: readingTime
        };
      })()
    `);
  }

  /**
   * Extract metadata from page
   * @returns {Promise<object>}
   */
  async extractMetadata() {
    return this.evaluate(`
      (function() {
        const getMeta = (name) => {
          const el = document.querySelector(\`meta[name="\${name}"], meta[property="\${name}"]\`);
          return el?.content || null;
        };

        return {
          title: document.title,
          description: getMeta('description'),
          keywords: getMeta('keywords'),
          author: getMeta('author'),
          ogTitle: getMeta('og:title'),
          ogDescription: getMeta('og:description'),
          ogImage: getMeta('og:image'),
          ogType: getMeta('og:type'),
          twitterCard: getMeta('twitter:card'),
          canonical: document.querySelector('link[rel="canonical"]')?.href || null,
          favicon: document.querySelector('link[rel="icon"], link[rel="shortcut icon"]')?.href || null,
          language: document.documentElement.lang || null
        };
      })()
    `);
  }

  /**
   * Extract forms from page
   * @returns {Promise<Array>}
   */
  async extractForms() {
    return this.evaluate(`
      Array.from(document.querySelectorAll('form')).map(form => ({
        id: form.id || null,
        name: form.name || null,
        action: form.action,
        method: form.method,
        fields: Array.from(form.querySelectorAll('input, select, textarea')).map(field => ({
          type: field.type || field.tagName.toLowerCase(),
          name: field.name || null,
          id: field.id || null,
          placeholder: field.placeholder || null,
          required: field.required,
          value: field.value || null
        }))
      }))
    `);
  }

  /**
   * Extract all text from page (clean)
   * @returns {Promise<string>}
   */
  async extractText() {
    return this.evaluate(`
      (function() {
        // Clone body to avoid modifying the page
        const clone = document.body.cloneNode(true);

        // Remove script, style, and other non-content elements
        const remove = clone.querySelectorAll('script, style, noscript, iframe, nav, header, footer, aside');
        remove.forEach(el => el.remove());

        return clone.textContent.replace(/\\s+/g, ' ').trim();
      })()
    `);
  }

  /**
   * Extract structured data (JSON-LD)
   * @returns {Promise<Array>}
   */
  async extractStructuredData() {
    return this.evaluate(`
      Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(script => {
          try {
            return JSON.parse(script.textContent);
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean)
    `);
  }

  /**
   * Save data to JSON file
   * @param {string} filename - Output filename
   * @param {object} data - Data to save
   */
  async saveToFile(filename, data) {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filename, content);
    console.log(`[Scraper] Saved to: ${filename}`);
  }
}

// Demo
async function main() {
  console.log('=== CDP Content Scraper Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const scraper = new ContentScraper(client);

    // Enable domains
    await scraper.enable();

    // Navigate to a page
    console.log('\n--- Scraping example.com ---');
    let navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    // Extract content
    console.log('\n--- Metadata ---');
    const metadata = await scraper.extractMetadata();
    console.log(`  Title: ${metadata.title}`);
    console.log(`  Language: ${metadata.language}`);
    console.log(`  Canonical: ${metadata.canonical}`);

    console.log('\n--- Links ---');
    const links = await scraper.extractLinks();
    console.log(`  Found ${links.length} links:`);
    links.forEach(link => {
      console.log(`    "${link.text}" -> ${link.href}`);
    });

    console.log('\n--- Article Content ---');
    const article = await scraper.extractArticle();
    console.log(`  Title: ${article.title}`);
    console.log(`  Word count: ${article.wordCount}`);
    console.log(`  Reading time: ${article.readingTimeMinutes} min`);
    console.log(`  Headings:`);
    article.headings.forEach(h => {
      console.log(`    H${h.level}: ${h.text}`);
    });

    // Navigate to a page with more content
    console.log('\n\n--- Scraping httpbin.org/html ---');
    navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://httpbin.org/html' });
    await navPromise;
    await sleep(500);

    const article2 = await scraper.extractArticle();
    console.log(`  Title: ${article2.title}`);
    console.log(`  Paragraphs: ${article2.paragraphs.length}`);
    console.log(`  First paragraph: "${article2.paragraphs[0]?.substring(0, 80)}..."`);

    // Navigate to a page with forms
    console.log('\n\n--- Scraping httpbin.org/forms/post ---');
    navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://httpbin.org/forms/post' });
    await navPromise;
    await sleep(500);

    console.log('\n--- Forms ---');
    const forms = await scraper.extractForms();
    console.log(`  Found ${forms.length} forms:`);
    forms.forEach((form, i) => {
      console.log(`  Form ${i + 1}:`);
      console.log(`    Action: ${form.action}`);
      console.log(`    Method: ${form.method}`);
      console.log(`    Fields: ${form.fields.length}`);
      form.fields.forEach(field => {
        console.log(`      - ${field.name} (${field.type})${field.required ? ' *required' : ''}`);
      });
    });

    // Save all scraped data
    console.log('\n--- Saving Data ---');
    const allData = {
      scrapedAt: new Date().toISOString(),
      pages: [
        { url: 'https://example.com', metadata, links, article },
        { url: 'https://httpbin.org/html', article: article2 },
        { url: 'https://httpbin.org/forms/post', forms }
      ]
    };

    // Save to current directory
    await scraper.saveToFile('scraped-data.json', allData);

    console.log('\n=== Demo Complete ===');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { ContentScraper };
