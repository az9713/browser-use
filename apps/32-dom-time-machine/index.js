/**
 * App 32: DOM Time Machine
 *
 * Record DOM mutations and play back timeline using CDP:
 * - Record all DOM mutations
 * - Attribute changes
 * - Node additions/removals
 * - Timeline playback
 * - Step through changes
 * - Export/import recordings
 *
 * CDP Domains: DOM, Runtime
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class DOMTimeMachine {
  constructor(client) {
    this.client = client;
    this.recording = false;
    this.mutations = [];
    this.startTime = null;
  }

  async enable() {
    await this.client.send('DOM.enable');
    await this.client.send('Runtime.enable');
    console.log('[DOMTimeMachine] Enabled');
  }

  async startRecording() {
    this.recording = true;
    this.mutations = [];
    this.startTime = Date.now();

    // Inject MutationObserver
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          if (window.__domTimeMachineObserver) {
            window.__domTimeMachineObserver.disconnect();
          }

          window.__domTimeMachineMutations = [];
          const startTime = Date.now();

          const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
              const record = {
                type: mutation.type,
                timestamp: Date.now() - startTime,
                target: {
                  nodeName: mutation.target.nodeName,
                  nodeType: mutation.target.nodeType,
                  id: mutation.target.id || null,
                  className: mutation.target.className || null
                }
              };

              if (mutation.type === 'attributes') {
                record.attributeName = mutation.attributeName;
                record.oldValue = mutation.oldValue;
                record.newValue = mutation.target.getAttribute(mutation.attributeName);
              } else if (mutation.type === 'characterData') {
                record.oldValue = mutation.oldValue;
                record.newValue = mutation.target.textContent;
              } else if (mutation.type === 'childList') {
                record.addedNodes = Array.from(mutation.addedNodes).map(node => ({
                  nodeName: node.nodeName,
                  nodeType: node.nodeType,
                  id: node.id || null,
                  className: node.className || null
                }));
                record.removedNodes = Array.from(mutation.removedNodes).map(node => ({
                  nodeName: node.nodeName,
                  nodeType: node.nodeType,
                  id: node.id || null,
                  className: node.className || null
                }));
              }

              window.__domTimeMachineMutations.push(record);
            });
          });

          observer.observe(document.body, {
            attributes: true,
            attributeOldValue: true,
            characterData: true,
            characterDataOldValue: true,
            childList: true,
            subtree: true
          });

          window.__domTimeMachineObserver = observer;
          console.log('[TimeMachine] Recording started');
        })()
      `
    });

    console.log('[DOMTimeMachine] Recording started');
  }

  async stopRecording() {
    this.recording = false;

    // Retrieve mutations
    const result = await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          if (window.__domTimeMachineObserver) {
            window.__domTimeMachineObserver.disconnect();
          }
          const mutations = window.__domTimeMachineMutations || [];
          delete window.__domTimeMachineMutations;
          delete window.__domTimeMachineObserver;
          return mutations;
        })()
      `,
      returnByValue: true
    });

    this.mutations = result.result.value || [];
    console.log(`[DOMTimeMachine] Recording stopped. Captured ${this.mutations.length} mutations`);

    return this.mutations;
  }

  async playback(speed = 1.0) {
    if (this.mutations.length === 0) {
      console.log('[DOMTimeMachine] No mutations to playback');
      return;
    }

    console.log(`[DOMTimeMachine] Playing back ${this.mutations.length} mutations at ${speed}x speed`);

    for (let i = 0; i < this.mutations.length; i++) {
      const mutation = this.mutations[i];
      const nextMutation = this.mutations[i + 1];

      this.printMutation(i, mutation);

      // Wait for next mutation
      if (nextMutation) {
        const delay = (nextMutation.timestamp - mutation.timestamp) / speed;
        await sleep(delay);
      }
    }

    console.log('[DOMTimeMachine] Playback complete');
  }

  async stepForward(currentStep) {
    if (currentStep >= this.mutations.length - 1) {
      console.log('[DOMTimeMachine] Already at end');
      return currentStep;
    }

    const nextStep = currentStep + 1;
    const mutation = this.mutations[nextStep];

    console.log(`\n[Step ${nextStep + 1}/${this.mutations.length}]`);
    this.printMutation(nextStep, mutation);

    return nextStep;
  }

  async stepBackward(currentStep) {
    if (currentStep <= 0) {
      console.log('[DOMTimeMachine] Already at start');
      return currentStep;
    }

    const prevStep = currentStep - 1;
    const mutation = this.mutations[prevStep];

    console.log(`\n[Step ${prevStep + 1}/${this.mutations.length}]`);
    this.printMutation(prevStep, mutation);

    return prevStep;
  }

  printMutation(index, mutation) {
    const timeStr = `${mutation.timestamp}ms`;
    const targetStr = this.formatTarget(mutation.target);

    if (mutation.type === 'attributes') {
      console.log(`  [${index + 1}] ${timeStr} - Attribute changed on ${targetStr}`);
      console.log(`       ${mutation.attributeName}: "${mutation.oldValue}" → "${mutation.newValue}"`);
    } else if (mutation.type === 'characterData') {
      console.log(`  [${index + 1}] ${timeStr} - Text changed on ${targetStr}`);
      console.log(`       "${mutation.oldValue}" → "${mutation.newValue}"`);
    } else if (mutation.type === 'childList') {
      if (mutation.addedNodes.length > 0) {
        console.log(`  [${index + 1}] ${timeStr} - Nodes added to ${targetStr}`);
        mutation.addedNodes.forEach(node => {
          console.log(`       + ${this.formatTarget(node)}`);
        });
      }
      if (mutation.removedNodes.length > 0) {
        console.log(`  [${index + 1}] ${timeStr} - Nodes removed from ${targetStr}`);
        mutation.removedNodes.forEach(node => {
          console.log(`       - ${this.formatTarget(node)}`);
        });
      }
    }
  }

  formatTarget(target) {
    let str = target.nodeName.toLowerCase();
    if (target.id) str += `#${target.id}`;
    if (target.className) str += `.${target.className.split(' ').join('.')}`;
    return str;
  }

  getTimeline() {
    const timeline = this.mutations.map((mutation, i) => ({
      index: i,
      time: `${mutation.timestamp}ms`,
      type: mutation.type,
      target: this.formatTarget(mutation.target),
      summary: this.getMutationSummary(mutation)
    }));

    return timeline;
  }

  getMutationSummary(mutation) {
    if (mutation.type === 'attributes') {
      return `${mutation.attributeName} changed`;
    } else if (mutation.type === 'characterData') {
      return 'text changed';
    } else if (mutation.type === 'childList') {
      const added = mutation.addedNodes?.length || 0;
      const removed = mutation.removedNodes?.length || 0;
      return `+${added} -${removed} nodes`;
    }
    return 'unknown';
  }

  getStatistics() {
    const stats = {
      total: this.mutations.length,
      byType: {
        attributes: 0,
        characterData: 0,
        childList: 0
      },
      duration: this.mutations.length > 0 ?
        this.mutations[this.mutations.length - 1].timestamp : 0,
      averageInterval: 0
    };

    this.mutations.forEach(m => {
      if (stats.byType[m.type] !== undefined) {
        stats.byType[m.type]++;
      }
    });

    if (this.mutations.length > 1) {
      stats.averageInterval = stats.duration / (this.mutations.length - 1);
    }

    return stats;
  }

  exportRecording() {
    return {
      version: '1.0',
      startTime: this.startTime,
      duration: this.mutations.length > 0 ?
        this.mutations[this.mutations.length - 1].timestamp : 0,
      mutationCount: this.mutations.length,
      mutations: this.mutations
    };
  }

  importRecording(data) {
    this.startTime = data.startTime;
    this.mutations = data.mutations;
    console.log(`[DOMTimeMachine] Imported ${this.mutations.length} mutations`);
  }

  printTimeline(maxEntries = 20) {
    const timeline = this.getTimeline();
    const entries = timeline.slice(0, maxEntries);

    console.log('\n  Timeline:');
    entries.forEach(entry => {
      console.log(`    ${entry.time.padStart(8)} | ${entry.type.padEnd(13)} | ${entry.target.padEnd(20)} | ${entry.summary}`);
    });

    if (timeline.length > maxEntries) {
      console.log(`    ... and ${timeline.length - maxEntries} more`);
    }
  }
}

async function main() {
  console.log('=== CDP DOM Time Machine Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const timeMachine = new DOMTimeMachine(client);

    await timeMachine.enable();

    console.log('\n--- Navigating to page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(1000);

    console.log('\n--- Starting recording ---');
    await timeMachine.startRecording();

    console.log('\n--- Making DOM changes ---');

    // Make various DOM changes
    await client.send('Runtime.evaluate', {
      expression: `
        // Add element
        const div = document.createElement('div');
        div.id = 'test-element';
        div.className = 'test-class';
        div.textContent = 'Hello, Time Machine!';
        document.body.appendChild(div);
      `
    });
    await sleep(500);

    await client.send('Runtime.evaluate', {
      expression: `
        // Modify attribute
        const div = document.getElementById('test-element');
        div.setAttribute('data-test', 'value1');
      `
    });
    await sleep(500);

    await client.send('Runtime.evaluate', {
      expression: `
        // Change text
        const div = document.getElementById('test-element');
        div.textContent = 'Modified text!';
      `
    });
    await sleep(500);

    await client.send('Runtime.evaluate', {
      expression: `
        // Add child
        const div = document.getElementById('test-element');
        const span = document.createElement('span');
        span.textContent = 'Child element';
        div.appendChild(span);
      `
    });
    await sleep(500);

    await client.send('Runtime.evaluate', {
      expression: `
        // Remove element
        const div = document.getElementById('test-element');
        div.remove();
      `
    });
    await sleep(500);

    console.log('\n--- Stopping recording ---');
    await timeMachine.stopRecording();

    console.log('\n--- Statistics ---');
    const stats = timeMachine.getStatistics();
    console.log(`  Total Mutations: ${stats.total}`);
    console.log(`  Duration: ${stats.duration}ms`);
    console.log(`  Avg Interval: ${stats.averageInterval.toFixed(2)}ms`);
    console.log(`  By Type:`);
    console.log(`    Attributes: ${stats.byType.attributes}`);
    console.log(`    Text: ${stats.byType.characterData}`);
    console.log(`    Children: ${stats.byType.childList}`);

    timeMachine.printTimeline();

    console.log('\n--- Playing back mutations ---');
    await timeMachine.playback(2.0);

    console.log('\n--- Exporting recording ---');
    const exported = timeMachine.exportRecording();
    console.log(`  Exported ${exported.mutationCount} mutations`);
    console.log(`  Recording duration: ${exported.duration}ms`);

    console.log('\n=== Demo Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { DOMTimeMachine };
