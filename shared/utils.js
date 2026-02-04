/**
 * General Utilities - Shared helper functions for CDP apps
 */

/**
 * Get element center coordinates from its box model
 * @param {object} boxModel - Box model from DOM.getBoxModel
 * @returns {{x: number, y: number}}
 */
export function getElementCenter(boxModel) {
  const { content } = boxModel.model;
  // content is [x1, y1, x2, y2, x3, y3, x4, y4] representing quad corners
  const x = (content[0] + content[2] + content[4] + content[6]) / 4;
  const y = (content[1] + content[3] + content[5] + content[7]) / 4;
  return { x, y };
}

/**
 * Get element bounding box from its box model
 * @param {object} boxModel - Box model from DOM.getBoxModel
 * @returns {{x: number, y: number, width: number, height: number}}
 */
export function getElementBounds(boxModel) {
  const { content } = boxModel.model;
  const x = Math.min(content[0], content[2], content[4], content[6]);
  const y = Math.min(content[1], content[3], content[5], content[7]);
  const maxX = Math.max(content[0], content[2], content[4], content[6]);
  const maxY = Math.max(content[1], content[3], content[5], content[7]);
  return {
    x,
    y,
    width: maxX - x,
    height: maxY - y
  };
}

/**
 * Convert key name to CDP key event parameters
 * @param {string} key - Key name (e.g., 'Enter', 'Tab', 'a', 'Ctrl')
 * @returns {object} - CDP key event parameters
 */
export function getKeyParams(key) {
  const specialKeys = {
    Enter: { key: 'Enter', code: 'Enter', keyCode: 13, text: '\r' },
    Tab: { key: 'Tab', code: 'Tab', keyCode: 9 },
    Escape: { key: 'Escape', code: 'Escape', keyCode: 27 },
    Backspace: { key: 'Backspace', code: 'Backspace', keyCode: 8 },
    Delete: { key: 'Delete', code: 'Delete', keyCode: 46 },
    ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
    ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
    ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
    ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
    Home: { key: 'Home', code: 'Home', keyCode: 36 },
    End: { key: 'End', code: 'End', keyCode: 35 },
    PageUp: { key: 'PageUp', code: 'PageUp', keyCode: 33 },
    PageDown: { key: 'PageDown', code: 'PageDown', keyCode: 34 },
    Space: { key: ' ', code: 'Space', keyCode: 32, text: ' ' },
    Control: { key: 'Control', code: 'ControlLeft', keyCode: 17 },
    Shift: { key: 'Shift', code: 'ShiftLeft', keyCode: 16 },
    Alt: { key: 'Alt', code: 'AltLeft', keyCode: 18 },
    Meta: { key: 'Meta', code: 'MetaLeft', keyCode: 91 },
    F1: { key: 'F1', code: 'F1', keyCode: 112 },
    F2: { key: 'F2', code: 'F2', keyCode: 113 },
    F3: { key: 'F3', code: 'F3', keyCode: 114 },
    F4: { key: 'F4', code: 'F4', keyCode: 115 },
    F5: { key: 'F5', code: 'F5', keyCode: 116 },
    F6: { key: 'F6', code: 'F6', keyCode: 117 },
    F7: { key: 'F7', code: 'F7', keyCode: 118 },
    F8: { key: 'F8', code: 'F8', keyCode: 119 },
    F9: { key: 'F9', code: 'F9', keyCode: 120 },
    F10: { key: 'F10', code: 'F10', keyCode: 121 },
    F11: { key: 'F11', code: 'F11', keyCode: 122 },
    F12: { key: 'F12', code: 'F12', keyCode: 123 }
  };

  if (specialKeys[key]) {
    return specialKeys[key];
  }

  // Regular character
  const code = key.length === 1 ? `Key${key.toUpperCase()}` : key;
  return {
    key,
    code,
    keyCode: key.charCodeAt(0),
    text: key
  };
}

/**
 * Parse a keyboard shortcut string (e.g., 'Ctrl+A', 'Shift+Enter')
 * @param {string} shortcut - Shortcut string
 * @returns {object} - Parsed shortcut with modifiers and key
 */
export function parseShortcut(shortcut) {
  const parts = shortcut.split('+');
  const modifiers = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false
  };

  let key = parts[parts.length - 1];

  for (let i = 0; i < parts.length - 1; i++) {
    const mod = parts[i].toLowerCase();
    if (mod === 'ctrl' || mod === 'control') modifiers.ctrl = true;
    else if (mod === 'shift') modifiers.shift = true;
    else if (mod === 'alt') modifiers.alt = true;
    else if (mod === 'meta' || mod === 'cmd' || mod === 'command') modifiers.meta = true;
  }

  return { modifiers, key };
}

/**
 * Get modifier flags for CDP input events
 * @param {object} modifiers - Modifier state
 * @returns {number} - Modifier bitmask
 */
export function getModifierFlags(modifiers) {
  let flags = 0;
  if (modifiers.alt) flags |= 1;
  if (modifiers.ctrl) flags |= 2;
  if (modifiers.meta) flags |= 4;
  if (modifiers.shift) flags |= 8;
  return flags;
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format milliseconds to human-readable duration
 * @param {number} ms - Milliseconds
 * @returns {string}
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

/**
 * Create a unique filename with timestamp
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension
 * @returns {string}
 */
export function createTimestampedFilename(prefix, extension) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Escape special characters for CSS selectors
 * @param {string} str - String to escape
 * @returns {string}
 */
export function escapeCssSelector(str) {
  return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

/**
 * Extract text content from an element (via Runtime.evaluate)
 * @param {CDPClient} client - CDP client
 * @param {number} objectId - Remote object ID
 * @returns {Promise<string>}
 */
export async function getTextContent(client, objectId) {
  const result = await client.send('Runtime.callFunctionOn', {
    objectId,
    functionDeclaration: 'function() { return this.textContent; }',
    returnByValue: true
  });
  return result.result.value || '';
}

/**
 * Generate a simple unique ID
 * @returns {string}
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce a function
 * @param {function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {function}
 */
export function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function
 * @param {function} fn - Function to throttle
 * @param {number} limit - Minimum time between calls in ms
 * @returns {function}
 */
export function throttle(fn, limit) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn(...args);
    }
  };
}

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a color is light or dark
 * @param {string} color - CSS color in hex format (#RGB or #RRGGBB)
 * @returns {boolean} - True if light, false if dark
 */
export function isLightColor(color) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/**
 * Calculate color contrast ratio (WCAG)
 * @param {string} color1 - First color in hex
 * @param {string} color2 - Second color in hex
 * @returns {number} - Contrast ratio
 */
export function getContrastRatio(color1, color2) {
  const getLuminance = (hex) => {
    const rgb = hex.replace('#', '').match(/.{2}/g).map(x => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export default {
  getElementCenter,
  getElementBounds,
  getKeyParams,
  parseShortcut,
  getModifierFlags,
  formatBytes,
  formatDuration,
  createTimestampedFilename,
  escapeCssSelector,
  getTextContent,
  generateId,
  debounce,
  throttle,
  deepClone,
  isLightColor,
  getContrastRatio
};
