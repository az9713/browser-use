# App 08: Form Filler

Fill and submit web forms using Chrome DevTools Protocol.

## Features

- Fill text inputs
- Select dropdown options
- Check/uncheck checkboxes
- Select radio buttons
- Upload files
- Submit forms
- Fill multiple fields at once
- Get form data
- Clear forms

## CDP Domains Used

- **DOM** - Element manipulation
- **Runtime** - JavaScript evaluation
- **Page** - Navigation

## Key CDP Commands

| Command | Description |
|---------|-------------|
| `Runtime.evaluate` | Execute JS to manipulate form |
| `DOM.setFileInputFiles` | Upload files |
| `DOM.querySelector` | Find form elements |

## Usage

```bash
# Start Chrome with debugging
chrome --remote-debugging-port=9222

# Run the form filler
node apps/08-form-filler/index.js
```

## Example Output

```
=== CDP Form Filler Demo ===

[FormFiller] DOM, Page, and Runtime domains enabled

--- Navigating to form page ---

--- Filling text inputs ---
[FormFiller] Filled input input[name="custname"] with: John Doe
[FormFiller] Filled input input[name="custtel"] with: 555-123-4567
[FormFiller] Filled input input[name="custemail"] with: john@example.com

--- Selecting radio buttons ---
[FormFiller] Selected radio: input[type="radio"]

--- Form Data ---
  Current form values: { custname: 'John Doe', custtel: '555-123-4567', ... }

--- Submitting form ---
[FormFiller] Submitted form: form

=== Demo Complete ===
```

## API Reference

### `FormFiller` Class

```javascript
const filler = new FormFiller(cdpClient);

// Enable required domains
await filler.enable();

// Fill text input
await filler.fillInput('input[name="username"]', 'john_doe');

// Fill textarea
await filler.fillTextarea('textarea[name="bio"]', 'Hello!\nMultiple lines.');

// Select dropdown by value
await filler.selectOption('select[name="country"]', 'us');

// Select dropdown by visible text
await filler.selectOptionByText('select[name="country"]', 'United States');

// Check checkbox
await filler.checkCheckbox('input[name="agree"]');

// Uncheck checkbox
await filler.uncheckCheckbox('input[name="agree"]');

// Toggle checkbox
await filler.toggleCheckbox('input[name="agree"]');

// Select radio button
await filler.selectRadio('input#option1');

// Select radio by name and value
await filler.selectRadioByValue('delivery', 'express');

// Upload files
await filler.uploadFiles('input[type="file"]', [
  '/path/to/file1.pdf',
  '/path/to/file2.jpg'
]);

// Submit form
await filler.submit('form');
await filler.submit('button[type="submit"]');

// Fill multiple fields at once
await filler.fillForm({
  'input[name="first"]': 'John',
  'input[name="last"]': 'Doe',
  'input[name="email"]': 'john@example.com'
});

// Get form data
const data = await filler.getFormData('form');
// { first: 'John', last: 'Doe', email: 'john@example.com' }

// Clear form
await filler.clearForm('form');

// Focus element
await filler.focus('input[name="email"]');
```

## Event Dispatching

When filling forms, we dispatch events to trigger validation:

```javascript
// After setting value:
el.dispatchEvent(new Event('input', { bubbles: true }));
el.dispatchEvent(new Event('change', { bubbles: true }));
```

This ensures:
- React/Vue/Angular detect changes
- Form validation runs
- Dependent fields update

## File Upload

File uploads use `DOM.setFileInputFiles`:

```javascript
await client.send('DOM.setFileInputFiles', {
  nodeId: fileInputNodeId,
  files: ['/absolute/path/to/file.pdf']
});
```

Note: Paths must be absolute and accessible to Chrome.

## Tips

- Always dispatch `input` and `change` events
- Use `focus()` before typing for better compatibility
- Wait between actions for slow pages
- Check for element existence before filling
- Use `getFormData()` to verify values before submit
