/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Rollup plugin to patch CSS files for bug fixes
 * 
 * This plugin applies post-processing patches to CSS files from monaco-editor-core
 * to fix bugs that can't be addressed in this wrapper repository directly.
 * 
 * @returns {import('rollup').Plugin}
 */
export function patchCssPlugin() {
	return {
		name: 'patch-css',
		
		generateBundle(options, bundle) {
			// Patch editor.css to fix the transparent background issue with selection rendering
			for (const fileName in bundle) {
				const file = bundle[fileName];
				
				// Fix for issue #4158: Visual highlighting issue for selected text when background has opacity
				// See: https://github.com/microsoft/monaco-editor/issues/4158
				//
				// Problem: When editor.background is transparent (e.g., #00000000), multi-line text
				// selections display incorrectly. The rounded selection rendering uses "inner corner"
				// pieces with the monaco-editor-background class to mask parts of the selection and
				// create rounded corners. When the editor background is transparent, these corner
				// pieces are also transparent, so they fail to mask the selection properly, causing
				// the visual highlight to not match the actual caret position.
				//
				// Solution: Override the background color for these corner pieces to use an opaque
				// color appropriate for the theme (white for light themes, dark for dark themes).
				// This ensures the corner pieces properly mask the selection regardless of whether
				// the editor background is transparent or opaque.
				if (file.type === 'asset' && fileName.replace(/\\/g, '/').endsWith('vs/editor/browser/widget/codeEditor/editor.css')) {
					let content = file.source.toString();
					
					const originalRule = '.monaco-editor-background {\n\tbackground-color: var(--vscode-editor-background);\n}';
					const patchedRule = `.monaco-editor-background {
	background-color: var(--vscode-editor-background);
}
/* Fix for issue #4158: Ensure selection corner pieces work with transparent backgrounds */
.monaco-editor .lines-content .cslr.monaco-editor-background {
	background-color: rgba(255, 255, 255, 1);
}
/* For dark themes */
.monaco-editor.vs-dark .lines-content .cslr.monaco-editor-background {
	background-color: rgba(30, 30, 30, 1);
}
/* For high contrast themes */
.monaco-editor.hc-black .lines-content .cslr.monaco-editor-background,
.monaco-editor.hc-light .lines-content .cslr.monaco-editor-background {
	background-color: var(--vscode-editor-background);
	opacity: 1;
}`;
					
					const newContent = content.replace(originalRule, patchedRule);
					
					// Verify the replacement was successful
					if (newContent === content) {
						console.warn(`WARNING: CSS patch for issue #4158 was not applied - original rule not found in ${fileName}`);
						console.warn('This may indicate that monaco-editor-core has changed. The transparent background selection bug may not be fixed.');
					} else if (newContent.split(patchedRule).length - 1 > 1) {
						console.warn(`WARNING: Multiple replacements occurred for CSS patch in ${fileName}`);
					}
					
					file.source = newContent;
				}
			}
		}
	};
}
