# Fix for Issue #4158: Transparent Background Selection Bug

## Problem
When `editor.background` is set to a transparent value (e.g., `#00000000`), multi-line text selections display incorrectly. The visual selection highlight doesn't match the actual caret position, making it confusing for users to see what text is actually selected.

## Root Cause
The Monaco Editor uses rounded selection rendering by default. To create smooth rounded corners, it generates "inner corner" pieces that are positioned on top of the selection to mask parts of it. These corner pieces use the `monaco-editor-background` CSS class, which normally takes its color from the `editor.background` theme setting.

When the editor background is transparent, these corner pieces also become transparent. Since transparent elements don't mask anything, the selection rendering breaks down, causing the visual misalignment between the highlight and the actual selection.

## Solution
This fix adds a CSS patch during the build process that overrides the background color for the selection corner pieces (`.monaco-editor .lines-content .cslr.monaco-editor-background`) to use opaque colors:

- **Light themes (vs)**: White (`rgba(255, 255, 255, 1)`)
- **Dark themes (vs-dark)**: Dark gray (`rgba(30, 30, 30, 1)`)
- **High contrast themes**: Uses the editor background with full opacity

This ensures that the corner pieces properly mask the selection regardless of whether the editor background is transparent or opaque.

## Implementation
The fix is implemented as a Rollup/Vite plugin that patches the CSS during the build process:

- **ESM build**: `build/esm/rollup-plugin-patch-css.mjs` (applied in `build/esm/rollup.config.mjs`)
- **AMD build**: Inline plugin in `build/amd/vite.config.mjs`

## Testing
To test this fix:

1. Build the monaco-editor package:
   ```bash
   npm run build-monaco-editor
   ```

2. Create an editor instance with a transparent background:
   ```javascript
   monaco.editor.defineTheme('transparentTheme', {
     base: 'vs',
     inherit: true,
     rules: [],
     colors: {
       'editor.background': '#00000000'  // Fully transparent
     }
   });
   
   monaco.editor.create(container, {
     theme: 'transparentTheme',
     roundedSelection: true
   });
   ```

3. Select text across multiple lines and verify that the selection highlight matches the cursor position.

## Notes
- This fix only affects the visual rendering when rounded selections are enabled (which is the default).
- The corner pieces will use a fixed opaque color, which works well for most use cases.
- For very specific background scenarios (e.g., complex background images), the corner pieces may be visible, but this is better than the broken selection rendering.
- This is a build-time patch applied to `monaco-editor-core`'s CSS, maintaining compatibility with upstream updates.
