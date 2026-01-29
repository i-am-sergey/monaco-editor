/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Rollup plugin to patch CSS files for bug fixes
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
				if (file.type === 'asset' && fileName.endsWith('vs/editor/browser/widget/codeEditor/editor.css')) {
					let content = file.source.toString();
					
					// The issue: When editor.background is transparent, the "inner corner" pieces used
					// for rounded selections are also transparent, so they don't properly mask the selection.
					// The fix: Make the corner pieces use a semi-transparent white/dark color that works
					// with most backgrounds, ensuring they properly mask the selection underneath.
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
					
					content = content.replace(originalRule, patchedRule);
					file.source = content;
				}
			}
		}
	};
}
