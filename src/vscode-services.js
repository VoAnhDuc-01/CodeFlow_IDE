import * as monaco from '../vendor/vscode-editor.js';
import { htmlLs, cssLs, TextDocument, emmet } from '../vendor/vscode-lang-services.js';

// Configure Monaco web worker from compiled vscode/src/vs/editor worker
globalThis.MonacoEnvironment = {
	getWorker() {
		return new Worker(new URL('../vendor/vscode-editor.worker.js', import.meta.url), { type: 'module' });
	},
};

const htmlService = htmlLs.getLanguageService();
const cssService = cssLs.getCSSLanguageService();

function toMonacoToken(scopeEntry, tokenColors) {
	const scopes = Array.isArray(scopeEntry) ? scopeEntry : [scopeEntry];
	for (const tc of tokenColors) {
		const tcScopes = Array.isArray(tc.scope) ? tc.scope : (tc.scope ? tc.scope.split(',').map(s => s.trim()) : []);
		if (scopes.some(s => tcScopes.includes(s))) {
			return tc.settings || {};
		}
	}
	return null;
}

function stripHash(hex) {
	return typeof hex === 'string' && hex.startsWith('#') ? hex.slice(1) : hex;
}

function buildMonacoThemeFromVscode(themeDef) {
	const tc = themeDef.tokenColors || [];
	const scopeMap = [
		['comment', ['comment', 'punctuation.definition.comment']],
		['string', ['string', 'string.quoted']],
		['string.html', ['string.quoted.double.html', 'string.quoted.single.html', 'string']],
		['keyword', ['keyword', 'keyword.control', 'storage.type']],
		['number', ['constant.numeric', 'constant.numeric.css']],
		['number.hex', ['constant.other.color.rgb-value.hex.css', 'constant.numeric']],
		['tag', ['entity.name.tag', 'entity.name.tag.html', 'entity.name.tag.css']],
		['delimiter.html', ['punctuation.definition.tag.begin.html', 'punctuation.definition.tag.end.html', 'punctuation.definition.tag']],
		['delimiter', ['punctuation.separator', 'punctuation.terminator', 'meta.brace']],
		['attribute.name', ['entity.other.attribute-name', 'entity.other.attribute-name.html', 'support.type.property-name.css']],
		['attribute.value', ['support.constant.property-value.css', 'string']],
		['attribute.value.html', ['string.quoted.double.html', 'string']],
		['attribute.value.number', ['constant.numeric.css', 'constant.numeric']],
		['attribute.value.unit', ['keyword.other.unit', 'keyword.other.unit.px.css', 'constant.numeric']],
		['type', ['entity.other.attribute-name.class.css', 'entity.name.type', 'support.type.property-name.css']],
		['variable', ['variable', 'variable.css', 'variable.other']],
		['metatag.html', ['meta.tag.sgml.doctype.html', 'punctuation.definition.tag']],
	];

	const rules = [];
	for (const [token, scopes] of scopeMap) {
		const settings = toMonacoToken(scopes, tc);
		if (settings && (settings.foreground || settings.fontStyle)) {
			const r = { token };
			if (settings.foreground) r.foreground = stripHash(settings.foreground);
			if (settings.fontStyle) r.fontStyle = settings.fontStyle;
			rules.push(r);
		}
	}

	const colors = {};
	const wantedColors = [
		'editor.background',
		'editor.foreground',
		'editorLineNumber.foreground',
		'editorLineNumber.activeForeground',
		'editor.selectionBackground',
		'editor.inactiveSelectionBackground',
		'editor.lineHighlightBackground',
		'editorWidget.background',
		'editorWidget.border',
		'editorSuggestWidget.background',
		'editorSuggestWidget.border',
		'editorSuggestWidget.selectedBackground',
		'editorGhostText.foreground',
	];
	for (const key of wantedColors) {
		if (themeDef.colors?.[key]) colors[key] = themeDef.colors[key];
	}
	if (!colors['editorGhostText.foreground']) {
		colors['editorGhostText.foreground'] = themeDef.base === 'vs' ? '#00000066' : '#94a3b8aa';
	}

	return {
		base: themeDef.base || 'vs-dark',
		inherit: true,
		rules,
		colors,
	};
}

function registerHtmlAndCssLanguages(langAssets) {
	// HTML language + configuration extracted from vscode/extensions/html
	monaco.languages.register({ id: 'html', extensions: ['.html', '.htm'] });
	const htmlCfg = langAssets.htmlLanguageConfiguration;
	monaco.languages.setLanguageConfiguration('html', {
		comments: htmlCfg.comments,
		brackets: htmlCfg.brackets,
		autoClosingPairs: htmlCfg.autoClosingPairs,
		surroundingPairs: htmlCfg.surroundingPairs,
		wordPattern: new RegExp(htmlCfg.wordPattern),
	});

	monaco.languages.setMonarchTokensProvider('html', {
		defaultToken: '',
		tokenPostfix: '.html',
		ignoreCase: true,
		tokenizer: {
			root: [
				[/<!DOCTYPE/, 'metatag.html', '@doctype'],
				[/<!--/, 'comment', '@comment'],
				[/(<)((?:[\w-]+:)?[\w-]+)(\s*)(\/>)/, ['delimiter.html', 'tag', '', 'delimiter.html']],
				[/(<)(script)/, ['delimiter.html', { token: 'tag', next: '@script' }]],
				[/(<)(style)/, ['delimiter.html', { token: 'tag', next: '@style' }]],
				[/(<)((?:[\w-]+:)?[\w-]+)/, ['delimiter.html', { token: 'tag', next: '@otherTag' }]],
				[/(<\/)((?:[\w-]+:)?[\w-]+)(\s*)(>)/, ['delimiter.html', 'tag', '', 'delimiter.html']],
				[/</, 'delimiter.html'],
				[/[^<]+/],
			],
			doctype: [
				[/[^>]+/, 'metatag.content.html'],
				[/>/, 'metatag.html', '@pop'],
			],
			comment: [
				[/-->/, 'comment', '@pop'],
				[/[^-]+/, 'comment'],
				[/./, 'comment'],
			],
			otherTag: [
				[/\/?>/, 'delimiter.html', '@pop'],
				[/"([^"]*)"/, 'attribute.value.html'],
				[/'([^']*)'/, 'attribute.value.html'],
				[/[\w-]+/, 'attribute.name'],
				[/=/, 'delimiter'],
				[/[ \t\r\n]+/],
			],
			script: [
				[/type/, 'attribute.name', '@scriptAfterType'],
				[/"([^"]*)"/, 'attribute.value.html'],
				[/'([^']*)'/, 'attribute.value.html'],
				[/[\w-]+/, 'attribute.name'],
				[/=/, 'delimiter'],
				[/>/, { token: 'delimiter.html', next: '@scriptEmbedded', nextEmbedded: 'text/javascript' }],
				[/[ \t\r\n]+/],
				[/(<\/)(script\s*)(>)/, ['delimiter.html', 'tag', { token: 'delimiter.html', next: '@pop' }]],
			],
			scriptAfterType: [
				[/=/, 'delimiter', '@scriptAfterTypeEquals'],
				[/>/, { token: 'delimiter.html', next: '@scriptEmbedded', nextEmbedded: 'text/javascript' }],
				[/[ \t\r\n]+/],
				[/<\/script\s*>/, { token: '@rematch', next: '@pop' }],
			],
			scriptAfterTypeEquals: [
				[/"([^"]*)"/, { token: 'attribute.value.html', switchTo: '@scriptWithCustomType.$1' }],
				[/'([^']*)'/, { token: 'attribute.value.html', switchTo: '@scriptWithCustomType.$1' }],
				[/>/, { token: 'delimiter.html', next: '@scriptEmbedded', nextEmbedded: 'text/javascript' }],
				[/[ \t\r\n]+/],
				[/<\/script\s*>/, { token: '@rematch', next: '@pop' }],
			],
			scriptWithCustomType: [
				[/>/, { token: 'delimiter.html', next: '@scriptEmbedded.$S2', nextEmbedded: '$S2' }],
				[/"([^"]*)"/, 'attribute.value.html'],
				[/'([^']*)'/, 'attribute.value.html'],
				[/[\w-]+/, 'attribute.name'],
				[/=/, 'delimiter'],
				[/[ \t\r\n]+/],
				[/<\/script\s*>/, { token: '@rematch', next: '@pop' }],
			],
			scriptEmbedded: [
				[/<\/script/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
				[/[^<]+/, ''],
			],
			style: [
				[/type/, 'attribute.name', '@styleAfterType'],
				[/"([^"]*)"/, 'attribute.value.html'],
				[/'([^']*)'/, 'attribute.value.html'],
				[/[\w-]+/, 'attribute.name'],
				[/=/, 'delimiter'],
				[/>/, { token: 'delimiter.html', next: '@styleEmbedded', nextEmbedded: 'text/css' }],
				[/[ \t\r\n]+/],
				[/(<\/)(style\s*)(>)/, ['delimiter.html', 'tag', { token: 'delimiter.html', next: '@pop' }]],
			],
			styleAfterType: [
				[/=/, 'delimiter', '@styleAfterTypeEquals'],
				[/>/, { token: 'delimiter.html', next: '@styleEmbedded', nextEmbedded: 'text/css' }],
				[/[ \t\r\n]+/],
				[/<\/style\s*>/, { token: '@rematch', next: '@pop' }],
			],
			styleAfterTypeEquals: [
				[/"([^"]*)"/, { token: 'attribute.value.html', switchTo: '@styleWithCustomType.$1' }],
				[/'([^']*)'/, { token: 'attribute.value.html', switchTo: '@styleWithCustomType.$1' }],
				[/>/, { token: 'delimiter.html', next: '@styleEmbedded', nextEmbedded: 'text/css' }],
				[/[ \t\r\n]+/],
				[/<\/style\s*>/, { token: '@rematch', next: '@pop' }],
			],
			styleWithCustomType: [
				[/>/, { token: 'delimiter.html', next: '@styleEmbedded.$S2', nextEmbedded: '$S2' }],
				[/"([^"]*)"/, 'attribute.value.html'],
				[/'([^']*)'/, 'attribute.value.html'],
				[/[\w-]+/, 'attribute.name'],
				[/=/, 'delimiter'],
				[/[ \t\r\n]+/],
				[/<\/style\s*>/, { token: '@rematch', next: '@pop' }],
			],
			styleEmbedded: [
				[/<\/style/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
				[/[^<]+/, ''],
			],
		},
	});

	// CSS language + configuration extracted from vscode/extensions/css
	monaco.languages.register({ id: 'css', extensions: ['.css', '.scss'] });
	const cssCfg = langAssets.cssLanguageConfiguration;
	monaco.languages.setLanguageConfiguration('css', {
		comments: cssCfg.comments,
		brackets: cssCfg.brackets,
		autoClosingPairs: cssCfg.autoClosingPairs,
		surroundingPairs: cssCfg.surroundingPairs,
		wordPattern: new RegExp(cssCfg.wordPattern),
	});

	monaco.languages.setMonarchTokensProvider('css', {
		defaultToken: '',
		tokenPostfix: '.css',
		tokenizer: {
			root: [
				[/\/\*/, 'comment', '@comment'],
				[/@[a-zA-Z_-][\w-]*/, 'keyword'],
				[/[.#][a-zA-Z_-][\w-]*/, 'type'],
				[/--[a-zA-Z_-][\w-]*/, 'variable'],
				[/[a-zA-Z_-][\w-]*(?=\s*:)/, 'attribute.name'],
				[/#[0-9a-fA-F]{3,8}\b/, 'number.hex'],
				[/-?\d+(\.\d+)?(px|rem|em|vh|vw|vmin|vmax|%|deg|s|ms|fr)?/, 'attribute.value.number'],
				[/"([^"\\]|\\.)*"/, 'string'],
				[/'([^'\\]|\\.)*'/, 'string'],
				[/\{/, 'delimiter', '@ruleBody'],
				[/[a-zA-Z_-][\w-]*/, 'tag'],
				[/[:;,()\[\]>+~*]/, 'delimiter'],
			],
			ruleBody: [
				[/\/\*/, 'comment', '@comment'],
				[/\}/, 'delimiter', '@pop'],
				[/--[a-zA-Z_-][\w-]*/, 'variable'],
				[/[a-zA-Z_-][\w-]*(?=\s*:)/, 'attribute.name'],
				[/#[0-9a-fA-F]{3,8}\b/, 'number.hex'],
				[/-?\d+(\.\d+)?(px|rem|em|vh|vw|vmin|vmax|%|deg|s|ms|fr)?/, 'attribute.value.number'],
				[/"([^"\\]|\\.)*"/, 'string'],
				[/'([^'\\]|\\.)*'/, 'string'],
				[/!important/, 'keyword'],
				[/[a-zA-Z_-][\w-]*/, 'attribute.value'],
				[/[:;,()]/, 'delimiter'],
			],
			comment: [
				[/\*\//, 'comment', '@pop'],
				[/./, 'comment'],
			],
		},
	});

	// Basic JavaScript registration for .js files in workspace
	monaco.languages.register({ id: 'javascript', extensions: ['.js', '.mjs'] });
	monaco.languages.setMonarchTokensProvider('javascript', {
		defaultToken: '',
		tokenPostfix: '.js',
		keywords: [
			'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
			'switch', 'case', 'break', 'continue', 'import', 'export', 'from', 'default',
			'async', 'await', 'try', 'catch', 'throw', 'new', 'class', 'extends', 'true', 'false', 'null',
		],
		tokenizer: {
			root: [
				[/\/\/.*$/, 'comment'],
				[/\/\*/, 'comment', '@comment'],
				[/"([^"\\]|\\.)*"/, 'string'],
				[/'([^'\\]|\\.)*'/, 'string'],
				[/`([^`\\]|\\.)*`/, 'string'],
				[/\d+(\.\d+)?/, 'number'],
				[/[a-zA-Z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
			],
			comment: [
				[/\*\//, 'comment', '@pop'],
				[/./, 'comment'],
			],
		},
	});
}

function toTextDoc(model) {
	return TextDocument.create(
		model.uri.toString(),
		model.getLanguageId(),
		model.getVersionId(),
		model.getValue()
	);
}

function lspRangeToMonaco(r) {
	return {
		startLineNumber: r.start.line + 1,
		startColumn: r.start.character + 1,
		endLineNumber: r.end.line + 1,
		endColumn: r.end.character + 1,
	};
}

function lspCompletionKindToMonaco(kind) {
	const map = {
		1: monaco.languages.CompletionItemKind.Text,
		2: monaco.languages.CompletionItemKind.Method,
		3: monaco.languages.CompletionItemKind.Function,
		4: monaco.languages.CompletionItemKind.Constructor,
		5: monaco.languages.CompletionItemKind.Field,
		6: monaco.languages.CompletionItemKind.Variable,
		7: monaco.languages.CompletionItemKind.Class,
		8: monaco.languages.CompletionItemKind.Interface,
		9: monaco.languages.CompletionItemKind.Module,
		10: monaco.languages.CompletionItemKind.Property,
		11: monaco.languages.CompletionItemKind.Unit,
		12: monaco.languages.CompletionItemKind.Value,
		13: monaco.languages.CompletionItemKind.Enum,
		14: monaco.languages.CompletionItemKind.Keyword,
		15: monaco.languages.CompletionItemKind.Snippet,
		16: monaco.languages.CompletionItemKind.Color,
		17: monaco.languages.CompletionItemKind.File,
		18: monaco.languages.CompletionItemKind.Reference,
	};
	return map[kind] || monaco.languages.CompletionItemKind.Property;
}

function registerVscodeLanguageProviders(langAssets) {
	// Standard HTML Completion + Emmet + snippets from vscode/extensions/html
	monaco.languages.registerCompletionItemProvider('html', {
		triggerCharacters: ['<', ' ', '=', '"', "'", '/', '.', '#', ':', '>'],
		provideCompletionItems(model, position) {
			const doc = toTextDoc(model);
			const pos = { line: position.lineNumber - 1, character: position.column - 1 };
			const htmlDoc = htmlService.parseHTMLDocument(doc);
			const list = htmlService.doComplete(doc, pos, htmlDoc);
			const emmetList = emmet.doComplete(doc, pos, 'html', {});

			const word = model.getWordUntilPosition(position);
			const defaultRange = {
				startLineNumber: position.lineNumber,
				startColumn: word.startColumn,
				endLineNumber: position.lineNumber,
				endColumn: word.endColumn,
			};

			const items = [...(list?.items || []), ...(emmetList?.items || [])].map(item => {
				const textEditRange = item.textEdit?.range ? lspRangeToMonaco(item.textEdit.range) : defaultRange;
				return {
					label: item.label,
					kind: lspCompletionKindToMonaco(item.kind),
					detail: item.detail || undefined,
					documentation: typeof item.documentation === 'string' ? item.documentation : item.documentation?.value,
					insertText: item.textEdit?.newText || item.insertText || item.label,
					insertTextRules: item.insertTextFormat === 2 ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
					range: textEditRange,
				};
			});

			// Include VS Code html.code-snippets from extensions/html/snippets
			for (const [name, snip] of Object.entries(langAssets.htmlSnippets || {})) {
				items.push({
					label: name,
					kind: monaco.languages.CompletionItemKind.Snippet,
					detail: snip.description || 'VS Code HTML Snippet',
					insertText: Array.isArray(snip.body) ? snip.body.join('\n') : String(snip.body || ''),
					insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
					range: defaultRange,
				});
			}

			return { suggestions: items };
		},
	});

	// Standard CSS Completion + Emmet
	monaco.languages.registerCompletionItemProvider('css', {
		triggerCharacters: [':', ' ', '.', '#', '@', '-', '/'],
		provideCompletionItems(model, position) {
			const doc = toTextDoc(model);
			const pos = { line: position.lineNumber - 1, character: position.column - 1 };
			const sheet = cssService.parseStylesheet(doc);
			const list = cssService.doComplete(doc, pos, sheet);
			const emmetList = emmet.doComplete(doc, pos, 'css', {});

			const word = model.getWordUntilPosition(position);
			const defaultRange = {
				startLineNumber: position.lineNumber,
				startColumn: word.startColumn,
				endLineNumber: position.lineNumber,
				endColumn: word.endColumn,
			};

			const items = [...(list?.items || []), ...(emmetList?.items || [])].map(item => ({
				label: item.label,
				kind: lspCompletionKindToMonaco(item.kind),
				detail: item.detail || undefined,
				documentation: typeof item.documentation === 'string' ? item.documentation : item.documentation?.value,
				insertText: item.textEdit?.newText || item.insertText || item.label,
				insertTextRules: item.insertTextFormat === 2 ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
				range: item.textEdit?.range ? lspRangeToMonaco(item.textEdit.range) : defaultRange,
			}));
			return { suggestions: items };
		},
	});

	// Hover providers
	monaco.languages.registerHoverProvider('html', {
		provideHover(model, position) {
			const doc = toTextDoc(model);
			const hover = htmlService.doHover(doc, { line: position.lineNumber - 1, character: position.column - 1 }, htmlService.parseHTMLDocument(doc));
			if (!hover?.contents) return null;
			const value = typeof hover.contents === 'string' ? hover.contents : (hover.contents.value || '');
			if (!value) return null;
			return {
				range: hover.range ? lspRangeToMonaco(hover.range) : undefined,
				contents: [{ value }],
			};
		},
	});

	monaco.languages.registerHoverProvider('css', {
		provideHover(model, position) {
			const doc = toTextDoc(model);
			const hover = cssService.doHover(doc, { line: position.lineNumber - 1, character: position.column - 1 }, cssService.parseStylesheet(doc));
			if (!hover?.contents) return null;
			const value = typeof hover.contents === 'string' ? hover.contents : (hover.contents.value || '');
			if (!value) return null;
			return {
				range: hover.range ? lspRangeToMonaco(hover.range) : undefined,
				contents: [{ value }],
			};
		},
	});

	// CSS Color Picker provider
	monaco.languages.registerColorProvider('css', {
		provideDocumentColors(model) {
			const doc = toTextDoc(model);
			const sheet = cssService.parseStylesheet(doc);
			return cssService.findDocumentColors(doc, sheet).map(c => ({
				color: c.color,
				range: lspRangeToMonaco(c.range),
			}));
		},
		provideColorPresentations(model, colorInfo) {
			const doc = toTextDoc(model);
			const sheet = cssService.parseStylesheet(doc);
			const range = {
				start: { line: colorInfo.range.startLineNumber - 1, character: colorInfo.range.startColumn - 1 },
				end: { line: colorInfo.range.endLineNumber - 1, character: colorInfo.range.endColumn - 1 },
			};
			return cssService.getColorPresentations(doc, sheet, colorInfo.color, range).map(p => ({
				label: p.label,
				textEdit: p.textEdit ? { range: lspRangeToMonaco(p.textEdit.range), text: p.textEdit.newText } : undefined,
			}));
		},
	});

	// Formatting providers (Shift+Alt+F)
	monaco.languages.registerDocumentFormattingEditProvider('html', {
		provideDocumentFormattingEdits(model, options) {
			const doc = toTextDoc(model);
			const edits = htmlService.format(doc, undefined, {
				tabSize: options.tabSize,
				insertSpaces: options.insertSpaces,
				wrapLineLength: 120,
			});
			return edits.map(e => ({ range: lspRangeToMonaco(e.range), text: e.newText }));
		},
	});

	monaco.languages.registerDocumentFormattingEditProvider('css', {
		provideDocumentFormattingEdits(model, options) {
			const doc = toTextDoc(model);
			const edits = cssService.format(doc, undefined, {
				tabSize: options.tabSize,
				insertSpaces: options.insertSpaces,
			});
			return edits.map(e => ({ range: lspRangeToMonaco(e.range), text: e.newText }));
		},
	});
}

export function validateModelDiagnostics(model) {
	if (!model) return [];
	const lang = model.getLanguageId();
	const doc = toTextDoc(model);
	const markers = [];

	if (lang === 'css') {
		const sheet = cssService.parseStylesheet(doc);
		const diags = cssService.doValidation(doc, sheet);
		for (const d of diags) {
			markers.push({
				severity: d.severity === 1 ? monaco.MarkerSeverity.Error : d.severity === 2 ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Info,
				message: d.message,
				startLineNumber: d.range.start.line + 1,
				startColumn: d.range.start.character + 1,
				endLineNumber: d.range.end.line + 1,
				endColumn: d.range.end.character + 1,
			});
		}
	} else if (lang === 'html') {
		// Validate embedded <style> blocks with cssLs
		const text = model.getValue();
		for (const m of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
			const cssBody = m[1];
			const startOffset = m.index + m[0].indexOf('>') + 1;
			const startPos = model.getPositionAt(startOffset);
			const pseudoDoc = TextDocument.create(`${model.uri.toString()}.inline.css`, 'css', 1, cssBody);
			const diags = cssService.doValidation(pseudoDoc, cssService.parseStylesheet(pseudoDoc));
			for (const d of diags) {
				markers.push({
					severity: d.severity === 1 ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
					message: d.message,
					startLineNumber: startPos.lineNumber + d.range.start.line,
					startColumn: (d.range.start.line === 0 ? startPos.column : 1) + d.range.start.character,
					endLineNumber: startPos.lineNumber + d.range.end.line,
					endColumn: (d.range.end.line === 0 ? startPos.column : 1) + d.range.end.character,
				});
			}
		}
	}

	monaco.editor.setModelMarkers(model, 'vscode-lang-service', markers);
	return markers;
}

export function tryHtmlAutoCloseTag(model, position) {
	if (!model || model.getLanguageId() !== 'html') return null;
	const doc = toTextDoc(model);
	const htmlDoc = htmlService.parseHTMLDocument(doc);
	const result = htmlService.doTagComplete(doc, { line: position.lineNumber - 1, character: position.column - 1 }, htmlDoc);
	return result || null;
}

export async function initializeVscodeCore() {
	const [themesResp, assetsResp] = await Promise.all([
		fetch(new URL('../generated/vscode-themes.json', import.meta.url)),
		fetch(new URL('../generated/vscode-lang-assets.json', import.meta.url)),
	]);
	const themes = await themesResp.json();
	const langAssets = await assetsResp.json();

	for (const [id, themeDef] of Object.entries(themes)) {
		monaco.editor.defineTheme(id, buildMonacoThemeFromVscode(themeDef));
	}

	registerHtmlAndCssLanguages(langAssets);
	registerVscodeLanguageProviders(langAssets);

	return { monaco, themes, langAssets };
}
