# App 07: Typer

Simulate keyboard input using Chrome DevTools Protocol.

## Features

- Type text character by character
- Type with realistic human-like delays
- Press special keys (Enter, Tab, Escape, Backspace)
- Keyboard shortcuts (Ctrl+A, Ctrl+C, Ctrl+V)
- Insert text instantly
- Clear input fields
- Arrow key navigation

## CDP Domains Used

- **Input** - Keyboard event dispatch
- **Page** - Page navigation
- **DOM** - Element focus

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Input.dispatchKeyEvent` | Send key events |
| `Input.insertText` | Insert text directly |

## Key Event Types

| Type | Description |
|------|-------------|
| `keyDown` | Key pressed |
| `keyUp` | Key released |
| `char` | Character input |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the typer
node apps/07-typer/index.js
```

## Example Output

```
=== CDP Typer Demo ===

[Typer] Page and DOM domains enabled

--- Focusing first input ---

--- Typing demo ---
[Typer] Typing: "John Doe"
[Typer] Pressed Tab
[Typer] Typing: "555-1234"

--- Clear and retype demo ---
[Typer] Pressed shortcut: Ctrl+A
[Typer] Pressed Backspace 1 time(s)
[Typer] Cleared field
[Typer] Typing: "jane@example.com"

--- Insert text demo ---
[Typer] Inserted: "This is inserted all at once!"

--- Keyboard shortcuts demo ---
[Typer] Pressed shortcut: Ctrl+A
[Typer] Pressed shortcut: Ctrl+C

=== Demo Complete ===
```

## API Reference

### `Typer` Class

```javascript
const typer = new Typer(cdpClient);

// Enable required domains
await typer.enable();

// Type text (character by character)
await typer.type('Hello World');

// Type with custom delay between keys
await typer.type('Slow typing', { delay: 200 });

// Type with human-like variable delays
await typer.typeHumanLike('Feels more natural...');

// Insert text instantly (no key events)
await typer.insertText('Instant text');

// Press special keys
await typer.pressEnter();
await typer.pressTab();
await typer.pressEscape();
await typer.pressBackspace();
await typer.pressBackspace(5);  // Press 5 times
await typer.pressDelete();

// Arrow keys
await typer.pressArrow('up');
await typer.pressArrow('down', 3);  // Press 3 times
await typer.pressArrow('left');
await typer.pressArrow('right');

// Home/End
await typer.pressHome();
await typer.pressEnd();

// Keyboard shortcuts
await typer.pressShortcut('Ctrl+A');
await typer.pressShortcut('Ctrl+Shift+V');

// Common shortcuts
await typer.selectAll();  // Ctrl+A
await typer.copy();       // Ctrl+C
await typer.cut();        // Ctrl+X
await typer.paste();      // Ctrl+V
await typer.undo();       // Ctrl+Z

// Clear input field
await typer.clearField();  // Ctrl+A then Backspace

// Press any key
await typer.pressKey('Enter');
await typer.pressKey('a');
await typer.pressKey('F5');
```

## Key Event Parameters

Each key event includes:

```javascript
{
  type: 'keyDown',           // Event type
  key: 'a',                  // Key identifier
  code: 'KeyA',              // Physical key code
  windowsVirtualKeyCode: 65, // Windows key code
  nativeVirtualKeyCode: 65,  // Native key code
  modifiers: 0               // Modifier flags
}
```

## Special Key Codes

| Key | Code | keyCode |
|-----|------|---------|
| Enter | Enter | 13 |
| Tab | Tab | 9 |
| Escape | Escape | 27 |
| Backspace | Backspace | 8 |
| Delete | Delete | 46 |
| Arrow Up | ArrowUp | 38 |
| Arrow Down | ArrowDown | 40 |
| Arrow Left | ArrowLeft | 37 |
| Arrow Right | ArrowRight | 39 |
| Home | Home | 36 |
| End | End | 35 |
| Space | Space | 32 |

## Tips

- Focus the element before typing (use Runtime.evaluate or click)
- `insertText` is faster but doesn't trigger key events
- Use delays for better reliability with slow pages
- Human-like typing adds variable delays for realism
- Some apps require both keyDown and char events
