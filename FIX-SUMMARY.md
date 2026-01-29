# Summary: Fix for Monaco Editor Issue #4158

## Issue Fixed
Fixed visual highlighting issue for selected text when editor background has transparency/opacity set.
See: https://github.com/microsoft/monaco-editor/issues/4158

## Problem Description
When `editor.background` is set to a transparent value (e.g., `#00000000`), multi-line text selection highlighting does not match the actual caret position. This creates a confusing user experience where users cannot visually see what text is actually selected.

## Root Cause
The Monaco Editor uses rounded selection rendering by default. To create rounded corners, the rendering logic generates "inner corner" pieces that mask parts of the selection. These pieces use the `monaco-editor-background` CSS class, which inherits its color from the `editor.background` theme setting.

When the editor background is transparent:
1. The corner pieces also become transparent
2. Transparent elements cannot mask the selection
3. The selection rendering breaks, causing visual misalignment

## Solution Implemented
Added a build-time CSS patch that overrides the background color for selection corner pieces (`.monaco-editor .lines-content .cslr.monaco-editor-background`) with opaque colors appropriate for each theme:

- **Light themes (vs)**: `rgba(255, 255, 255, 1)` (opaque white)
- **Dark themes (vs-dark)**: `rgba(30, 30, 30, 1)` (opaque dark gray)
- **High contrast themes**: Uses editor background with forced opacity of 1

## Implementation Details

### Files Modified
1. **build/esm/rollup-plugin-patch-css.mjs** (new file)
   - Rollup plugin to patch CSS during ESM build
   - Includes cross-platform path handling
   - Validates that patch is applied successfully
   - Warns if monaco-editor-core structure changes

2. **build/esm/rollup.config.mjs**
   - Integrated CSS patch plugin into build process

3. **build/amd/vite.config.mjs**
   - Added equivalent CSS patch for AMD build
   - Same validation and cross-platform support

4. **docs/fix-4158-transparent-background.md** (new file)
   - Comprehensive documentation of the issue and fix
   - Testing instructions
   - Implementation notes

### Build Process
The CSS patch is applied automatically during the build process:
- When building ESM version: `npm run build-monaco-editor` runs rollup with the patch plugin
- When building AMD version: Vite applies the equivalent patch
- Warnings are logged if the patch cannot be applied (indicating upstream changes)

## Testing Performed
- ✅ Verified CSS patch is applied correctly in ESM build
- ✅ Confirmed generated CSS contains fix for all theme variants
- ✅ Code review completed - all feedback addressed
- ✅ CodeQL security scan passed (no vulnerabilities)
- ✅ Cross-platform path handling verified
- ✅ Patch validation logic verified

## Impact Assessment
- **Scope**: Minimal - only affects visual rendering of selection corners
- **Risk**: Low - CSS-only change, no JavaScript logic modified
- **Compatibility**: Maintains full compatibility with monaco-editor-core
- **Side effects**: Corner pieces will use fixed opaque colors, which works well for most backgrounds

## Notes for Future Maintenance
1. This is a workaround that patches CSS from monaco-editor-core at build time
2. If monaco-editor-core changes the structure of `editor.css`, the build will warn
3. The fix should be upstreamed to monaco-editor-core/VS Code for a permanent solution
4. When upgrading monaco-editor-core, verify the patch still applies correctly

## Security Summary
No security vulnerabilities introduced or detected:
- No new dependencies added
- No runtime code execution changes
- Only CSS styling modifications
- CodeQL scan passed with no issues

## Completion Status
✅ Implementation complete
✅ Code review passed
✅ Security checks passed
✅ Documentation complete
✅ Ready for merge
