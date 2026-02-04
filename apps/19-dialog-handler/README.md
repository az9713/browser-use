# App 19: Dialog Handler

Handle JavaScript dialogs using Chrome DevTools Protocol.

## Features

- Detect alert/confirm/prompt dialogs
- Accept or dismiss dialogs
- Provide input for prompts
- Handle beforeunload dialogs
- Auto-handle configuration
- Wait for dialogs
- Dialog history

## CDP Domains Used

- **Page** - Dialog events and handling
- **Runtime** - Triggering dialogs

## Key CDP Commands/Events

| Command/Event | Description |
|---------------|-------------|
| `Page.javascriptDialogOpening` | Dialog opened |
| `Page.javascriptDialogClosed` | Dialog closed |
| `Page.handleJavaScriptDialog` | Accept/dismiss dialog |

## Dialog Types

| Type | Description | Has Input |
|------|-------------|-----------|
| `alert` | Information message | No |
| `confirm` | Yes/No question | No |
| `prompt` | Text input request | Yes |
| `beforeunload` | Leave page confirmation | No |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the handler
node apps/19-dialog-handler/index.js
```

## Example Output

```
=== CDP Dialog Handler Demo ===

[DialogHandler] Page and Runtime domains enabled

--- Setting up dialog listener ---

--- Testing Alert (manual handling) ---
  [Event] Dialog opened: alert - "Test alert message"
  Dialog type: alert
  Message: Test alert message
[DialogHandler] Accepted dialog

--- Testing Confirm (auto-accept) ---
[DialogHandler] Auto-handle configured
[DialogHandler] Auto-handling confirm: "Do you confirm?"
[DialogHandler] Accepted dialog
  Confirm result: true

--- Testing Prompt (auto-input) ---
[DialogHandler] Auto-handling prompt: "Enter your name:"
[DialogHandler] Accepted dialog
  Prompt result: Claude

--- Dialog History ---
  Total dialogs handled: 4

=== Demo Complete ===
```

## API Reference

### `DialogHandler` Class

```javascript
const handler = new DialogHandler(cdpClient);

// Enable domains
await handler.enable();

// Listen for dialogs
handler.onDialog((dialog) => {
  console.log(`${dialog.type}: ${dialog.message}`);
  // dialog: { type, message, url, defaultPrompt, timestamp }
});

// Manual handling
await handler.acceptDialog();
await handler.acceptDialog('prompt input');
await handler.dismissDialog();

// General handle method
await handler.handleDialog(true, 'prompt text');  // accept
await handler.handleDialog(false);                 // dismiss

// Auto-handle configuration
handler.setupAutoHandle({
  alert: 'accept',           // 'accept' | 'dismiss'
  confirm: 'accept',         // 'accept' | 'dismiss'
  prompt: {                  // null to dismiss
    action: 'accept',
    text: 'default text'
  },
  beforeunload: 'accept'     // 'accept' | 'dismiss'
});

// Wait for dialog
const dialog = await handler.waitForDialog(5000);
// Throws on timeout

// Trigger dialogs (for testing)
await handler.triggerAlert('Hello!');
const confirmed = await handler.triggerConfirm('Continue?');
const input = await handler.triggerPrompt('Name?', 'default');

// History
const history = handler.getHistory();
handler.clearHistory();
```

## Dialog Event Structure

```javascript
{
  type: 'confirm',
  message: 'Are you sure?',
  url: 'https://example.com/',
  defaultPrompt: '',           // Only for prompt dialogs
  timestamp: 1704067200000
}
```

## Auto-Handle Examples

```javascript
// Accept everything
handler.setupAutoHandle({
  alert: 'accept',
  confirm: 'accept',
  prompt: { action: 'accept', text: 'OK' },
  beforeunload: 'accept'
});

// Dismiss confirms, accept alerts
handler.setupAutoHandle({
  alert: 'accept',
  confirm: 'dismiss'
});

// Custom prompt responses
handler.setupAutoHandle({
  prompt: { action: 'accept', text: 'Custom Value' }
});
```

## Pattern: Wait Then Handle

```javascript
// Start waiting before triggering
const dialogPromise = handler.waitForDialog();

// Trigger the action that shows dialog
await clickButton('.delete-btn');

// Wait for and handle the dialog
const dialog = await dialogPromise;
console.log(`Got ${dialog.type}: ${dialog.message}`);
await handler.acceptDialog();
```

## Tips

- Set up listeners before triggering dialogs
- Auto-handle is useful for consistent behavior
- beforeunload dialogs prevent navigation
- Prompt dialogs have a defaultPrompt property
- Use history to verify dialogs were shown
