// Independent history stack management for each bottom tab with native browser integration
const TAB_KEYS = {
  HOME: 'home',
  WALLET: 'wallet',
  CONVERT: 'convert',
  TRANSACTIONS: 'transactions',
  PROFILE: 'profile',
};

class TabHistoryManager {
  constructor() {
    this.stacks = {};
    Object.values(TAB_KEYS).forEach(key => {
      this.stacks[key] = [];
    });
    this.currentTab = TAB_KEYS.HOME;
    this.tabStates = {};
    this.browserHistoryLength = window.history.length;
    this.initBrowserIntegration();
  }

  initBrowserIntegration() {
    // Listen for native browser back/forward button presses
    window.addEventListener('popstate', (event) => {
      if (event.state?.tab) {
        this.currentTab = event.state.tab;
        if (event.state?.path) {
          this.syncStackWithBrowser(event.state.tab, event.state.path);
        }
      }
    });
  }

  syncStackWithBrowser(tabKey, path) {
    // Ensure internal stack matches browser history state
    const stack = this.stacks[tabKey] || [];
    const lastEntry = stack[stack.length - 1];
    
    // Only push if path differs from last entry to prevent duplicates
    if (!lastEntry || lastEntry.path !== path) {
      this.stacks[tabKey].push({ path, state: {}, timestamp: Date.now() });
    }
  }

  setCurrentTab(tabKey) {
    this.currentTab = tabKey;
    // Update browser history state to reflect current tab
    window.history.replaceState(
      { tab: tabKey, path: window.location.pathname },
      '',
      window.location.pathname
    );
  }

  getCurrentTab() {
    return this.currentTab;
  }

  pushPath(tabKey, path, state = {}) {
    if (!this.stacks[tabKey]) this.stacks[tabKey] = [];
    
    const entry = { path, state, timestamp: Date.now() };
    this.stacks[tabKey].push(entry);
    
    // Push to browser history to keep it in sync
    window.history.pushState(
      { tab: tabKey, path, ...state },
      '',
      path
    );
    
    this.browserHistoryLength = window.history.length;
    if (!this.tabStates[tabKey]) this.tabStates[tabKey] = {};
    this.tabStates[tabKey].lastPath = path;
  }

  popPath(tabKey) {
    if (!this.stacks[tabKey] || this.stacks[tabKey].length === 0) return null;
    
    const entry = this.stacks[tabKey].pop();
    
    // Sync with browser by going back if we have history
    if (this.stacks[tabKey].length > 0) {
      window.history.back();
    }
    
    return entry;
  }

  getStack(tabKey) {
    return this.stacks[tabKey] || [];
  }

  getTabState(tabKey) {
    return this.tabStates[tabKey] || {};
  }

  setTabState(tabKey, state) {
    this.tabStates[tabKey] = { ...this.getTabState(tabKey), ...state };
  }

  clearStack(tabKey) {
    this.stacks[tabKey] = [];
  }

  clearAllStacks() {
    Object.keys(this.stacks).forEach(key => {
      this.stacks[key] = [];
    });
  }

  // Verify internal state matches browser history length
  isInSync() {
    return this.browserHistoryLength === window.history.length;
  }

  // Force resync if mismatch detected
  forceSyncWithBrowser() {
    this.browserHistoryLength = window.history.length;
    this.setCurrentTab(this.currentTab);
  }
}

export const tabHistoryManager = new TabHistoryManager();
export { TAB_KEYS };