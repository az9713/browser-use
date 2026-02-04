/**
 * App 02: Tab Orchestrator
 *
 * Demonstrates multi-tab management using CDP:
 * - Create new tabs
 * - List all tabs
 * - Switch between tabs (attach/detach sessions)
 * - Close tabs
 * - Multi-tab workflow demo
 *
 * CDP Domains: Target, Browser
 */

import { createClient } from '../../shared/cdp-client.js';
import {
  listTargets,
  createTab,
  closeTab,
  activateTab,
  getBrowserWSEndpoint,
  getVersion
} from '../../shared/target-manager.js';
import { sleep } from '../../shared/wait-helpers.js';

class TabOrchestrator {
  constructor() {
    this.browserClient = null;
    this.tabClients = new Map(); // targetId -> { client, sessionId }
    this.activeTabId = null;
  }

  /**
   * Connect to browser-level WebSocket
   */
  async connect() {
    const wsEndpoint = await getBrowserWSEndpoint();
    this.browserClient = await createClient(wsEndpoint);
    await this.browserClient.send('Target.setDiscoverTargets', { discover: true });
    console.log('[TabOrchestrator] Connected to browser');
  }

  /**
   * List all page tabs
   * @returns {Promise<Array>}
   */
  async listTabs() {
    const targets = await listTargets();
    return targets.filter(t => t.type === 'page');
  }

  /**
   * Create a new tab
   * @param {string} url - Initial URL
   * @returns {Promise<object>} - New tab info
   */
  async createNewTab(url = 'about:blank') {
    const result = await this.browserClient.send('Target.createTarget', { url });
    console.log(`[TabOrchestrator] Created new tab: ${result.targetId}`);
    return result;
  }

  /**
   * Attach to a tab to send page-level commands
   * @param {string} targetId - Target ID
   * @returns {Promise<string>} - Session ID
   */
  async attachToTab(targetId) {
    if (this.tabClients.has(targetId)) {
      console.log(`[TabOrchestrator] Already attached to: ${targetId}`);
      return this.tabClients.get(targetId).sessionId;
    }

    const result = await this.browserClient.send('Target.attachToTarget', {
      targetId,
      flatten: true
    });

    const sessionId = result.sessionId;
    this.browserClient.setSessionId(sessionId);

    // Enable Page domain for this session
    await this.browserClient.send('Page.enable');

    this.tabClients.set(targetId, { sessionId });
    this.activeTabId = targetId;

    console.log(`[TabOrchestrator] Attached to tab: ${targetId} (session: ${sessionId})`);
    return sessionId;
  }

  /**
   * Detach from a tab
   * @param {string} targetId - Target ID
   */
  async detachFromTab(targetId) {
    const tabInfo = this.tabClients.get(targetId);
    if (!tabInfo) {
      console.log(`[TabOrchestrator] Not attached to: ${targetId}`);
      return;
    }

    await this.browserClient.send('Target.detachFromTarget', {
      sessionId: tabInfo.sessionId
    });

    this.tabClients.delete(targetId);

    if (this.activeTabId === targetId) {
      this.activeTabId = null;
      this.browserClient.clearSessionId();
    }

    console.log(`[TabOrchestrator] Detached from tab: ${targetId}`);
  }

  /**
   * Switch to a different tab
   * @param {string} targetId - Target ID to switch to
   */
  async switchToTab(targetId) {
    // Activate the tab in the browser UI
    await activateTab(targetId);

    // Attach if not already attached
    await this.attachToTab(targetId);

    console.log(`[TabOrchestrator] Switched to tab: ${targetId}`);
  }

  /**
   * Close a tab
   * @param {string} targetId - Target ID to close
   */
  async closeTabById(targetId) {
    // Detach first if attached
    if (this.tabClients.has(targetId)) {
      await this.detachFromTab(targetId);
    }

    await this.browserClient.send('Target.closeTarget', { targetId });
    console.log(`[TabOrchestrator] Closed tab: ${targetId}`);
  }

  /**
   * Navigate the active tab to a URL
   * @param {string} url - URL to navigate to
   */
  async navigate(url) {
    if (!this.activeTabId) {
      throw new Error('No active tab');
    }

    await this.browserClient.send('Page.navigate', { url });
    console.log(`[TabOrchestrator] Navigated to: ${url}`);
  }

  /**
   * Get the title of the active tab
   * @returns {Promise<string>}
   */
  async getActiveTabTitle() {
    if (!this.activeTabId) {
      throw new Error('No active tab');
    }

    const result = await this.browserClient.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    return result.result.value;
  }

  /**
   * Get info about all tabs
   * @returns {Promise<Array>}
   */
  async getTabsInfo() {
    const tabs = await this.listTabs();
    return tabs.map(t => ({
      id: t.id,
      title: t.title,
      url: t.url,
      attached: this.tabClients.has(t.id),
      active: t.id === this.activeTabId
    }));
  }

  /**
   * Close all tabs except one
   * @param {string} keepTabId - Tab ID to keep
   */
  async closeAllExcept(keepTabId) {
    const tabs = await this.listTabs();

    for (const tab of tabs) {
      if (tab.id !== keepTabId) {
        await this.closeTabById(tab.id);
      }
    }

    console.log(`[TabOrchestrator] Closed all tabs except: ${keepTabId}`);
  }

  /**
   * Disconnect from browser
   */
  disconnect() {
    if (this.browserClient) {
      this.browserClient.close();
      this.browserClient = null;
    }
    this.tabClients.clear();
    this.activeTabId = null;
    console.log('[TabOrchestrator] Disconnected');
  }
}

// Demo
async function main() {
  console.log('=== CDP Tab Orchestrator Demo ===\n');

  const orchestrator = new TabOrchestrator();

  try {
    // Get browser version
    const version = await getVersion();
    console.log(`Browser: ${version.Browser}`);
    console.log(`Protocol: ${version['Protocol-Version']}\n`);

    // Connect to browser
    await orchestrator.connect();

    // List existing tabs
    console.log('--- Existing Tabs ---');
    let tabs = await orchestrator.getTabsInfo();
    tabs.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.title || 'Untitled'} - ${t.url}`);
    });

    // Create new tabs
    console.log('\n--- Creating New Tabs ---');
    const tab1 = await orchestrator.createNewTab('https://example.com');
    await sleep(1000);
    const tab2 = await orchestrator.createNewTab('https://httpbin.org/html');
    await sleep(1000);

    // List tabs again
    console.log('\n--- All Tabs Now ---');
    tabs = await orchestrator.getTabsInfo();
    tabs.forEach((t, i) => {
      const status = t.attached ? ' [attached]' : '';
      const active = t.active ? ' [active]' : '';
      console.log(`  ${i + 1}. ${t.title || 'Untitled'}${status}${active}`);
      console.log(`     ${t.url}`);
    });

    // Switch between tabs
    console.log('\n--- Switching Tabs ---');
    await orchestrator.switchToTab(tab1.targetId);
    await sleep(500);
    let title = await orchestrator.getActiveTabTitle();
    console.log(`Active tab title: ${title}`);

    await orchestrator.switchToTab(tab2.targetId);
    await sleep(500);
    title = await orchestrator.getActiveTabTitle();
    console.log(`Active tab title: ${title}`);

    // Navigate in active tab
    console.log('\n--- Navigating Active Tab ---');
    await orchestrator.navigate('https://httpbin.org/get');
    await sleep(1500);
    title = await orchestrator.getActiveTabTitle();
    console.log(`New title: ${title}`);

    // Close the tabs we created
    console.log('\n--- Closing Created Tabs ---');
    await orchestrator.closeTabById(tab1.targetId);
    await orchestrator.closeTabById(tab2.targetId);

    // Final tab list
    console.log('\n--- Remaining Tabs ---');
    tabs = await orchestrator.getTabsInfo();
    tabs.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.title || 'Untitled'} - ${t.url}`);
    });

    console.log('\n=== Demo Complete ===');

    // Disconnect
    orchestrator.disconnect();

  } catch (error) {
    console.error('Error:', error.message);
    orchestrator.disconnect();
    process.exit(1);
  }
}

main();

export { TabOrchestrator };
