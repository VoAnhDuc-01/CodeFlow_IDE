import { initializeVscodeCore, validateModelDiagnostics, tryHtmlAutoCloseTag } from './vscode-services.js';
import { computeContinuousSuggestion, buildCssRuleForSymbol, analyzeFileName, findPartnerFile } from './filename-suggester.js';
import { createWorkspaceStore } from './workspace-store.js';

const workspaceStore = createWorkspaceStore();

const STORAGE_KEYS = {
	theme: 'codeflow-vsc-theme',
	mode: 'codeflow-suggest-mode',
	editorConfig: 'codeflow-editor-config',
};

const MODE_LABELS = {
	smart: 'Thông minh',
	line: 'Từng dòng',
	block: 'Theo khối',
	off: 'Tắt',
};

const state = {
	monaco: null,
	themes: {},
	langAssets: null,
	editor: null,
	workspaceRoot: '',
	files: [], // flat list: [{ path, name, content, dirty, model }]
	tree: [],
	openTabs: [],
	activePath: null,
	viewStates: new Map(),
	suggestMode: localStorage.getItem(STORAGE_KEYS.mode) || 'smart',
	altIndex: 0,
	lastSuggestionResult: null,
	editorConfig: loadEditorConfig(),
	previewVisible: true,
	inlineChangeEmitter: null,
	suppressAutoSave: false,
};

function loadEditorConfig() {
	try {
		const raw = localStorage.getItem(STORAGE_KEYS.editorConfig);
		return raw
			? JSON.parse(raw)
			: { autoCloseTags: true, wordWrap: true, fontSize: 13.5, tabSize: 2 };
	} catch {
		return { autoCloseTags: true, wordWrap: true, fontSize: 13.5, tabSize: 2 };
	}
}

function announceStatus(msg) {
	const el = document.getElementById('live-status');
	if (el) el.textContent = msg;
}

function getLangFromPath(filePath) {
	const lower = String(filePath || '').toLowerCase();
	if (lower.endsWith('.css') || lower.endsWith('.scss')) return 'css';
	if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'javascript';
	return 'html';
}

function flattenFiles(nodes, out = []) {
	for (const node of nodes || []) {
		if (node.type === 'file') {
			out.push({
				path: node.path,
				name: node.name,
				ext: node.ext,
				content: typeof node.content === 'string' ? node.content : '',
				dirty: false,
				model: null,
			});
		} else if (node.type === 'directory' && node.children) {
			flattenFiles(node.children, out);
		}
	}
	return out;
}

function getFileEntry(filePath) {
	return state.files.find(f => f.path === filePath) || null;
}

function getOrCreateModel(entry) {
	if (!entry.model) {
		const uri = state.monaco.Uri.parse(`inmemory://workspace/${entry.path}`);
		const existing = state.monaco.editor.getModel(uri);
		entry.model = existing || state.monaco.editor.createModel(entry.content || '', getLangFromPath(entry.path), uri);
	}
	return entry.model;
}

function getWorkspaceFileSnapshots() {
	return state.files.map(f => ({
		path: f.path,
		name: f.name,
		content: f.model ? f.model.getValue() : f.content,
	}));
}

/* ============================================================================
 * Theme Sync (VS Code theme-defaults + <meta name="color-scheme">)
 * ==========================================================================*/
function applyVscodeTheme(themeId) {
	const theme = state.themes[themeId] || state.themes['dark-modern'];
	if (!theme) return;
	const isLight = theme.base === 'vs';
	const c = theme.colors || {};
	const rootStyle = document.documentElement.style;

	rootStyle.setProperty('--vsc-bg', c['editor.background'] || (isLight ? '#ffffff' : '#1f1f1f'));
	rootStyle.setProperty('--vsc-sidebar', c['sideBar.background'] || (isLight ? '#f8f8f8' : '#181818'));
	rootStyle.setProperty('--vsc-topbar', c['editorGroupHeader.tabsBackground'] || (isLight ? '#f3f3f3' : '#181818'));
	rootStyle.setProperty('--vsc-surface', c['editorWidget.background'] || (isLight ? '#f3f3f3' : '#202020'));
	rootStyle.setProperty('--vsc-surface-hover', isLight ? '#e8e8e8' : '#2a2d2e');
	rootStyle.setProperty('--vsc-border', c['sideBar.border'] || c['panel.border'] || (isLight ? '#e5e5e5' : '#2b2b2b'));
	rootStyle.setProperty('--vsc-text', c['editor.foreground'] || (isLight ? '#3b3b3b' : '#cccccc'));
	rootStyle.setProperty('--vsc-text-strong', isLight ? '#111111' : '#ffffff');
	rootStyle.setProperty('--vsc-muted', c['descriptionForeground'] || (isLight ? '#616161' : '#9d9d9d'));
	rootStyle.setProperty('--vsc-accent', c['button.background'] || (isLight ? '#005fb8' : '#0078d4'));
	rootStyle.setProperty('--vsc-accent-hover', c['button.hoverBackground'] || (isLight ? '#0258a8' : '#026ec1'));
	rootStyle.setProperty('--vsc-accent-fg', c['button.foreground'] || '#ffffff');
	rootStyle.setProperty('--vsc-tab-active', c['tab.activeBackground'] || (isLight ? '#ffffff' : '#1f1f1f'));
	rootStyle.setProperty('--vsc-tab-inactive', c['tab.inactiveBackground'] || (isLight ? '#f8f8f8' : '#181818'));
	rootStyle.setProperty('--vsc-status-bg', c['statusBar.background'] || (isLight ? '#f8f8f8' : '#181818'));
	rootStyle.setProperty('--vsc-status-fg', c['statusBar.foreground'] || (isLight ? '#3b3b3b' : '#cccccc'));
	rootStyle.setProperty('--vsc-badge-bg', isLight ? 'rgba(0, 95, 184, 0.12)' : 'rgba(0, 120, 212, 0.22)');
	rootStyle.setProperty('--vsc-badge-fg', isLight ? '#005fb8' : '#6cb6ff');
	rootStyle.setProperty('--scrollbar-thumb', isLight ? '#9e9e9e' : '#5a5a5a');
	rootStyle.setProperty('--scrollbar-track', isLight ? '#f0f0f0' : '#1b1b1b');

	const meta = document.querySelector('meta[name="color-scheme"]');
	const scheme = isLight ? 'light' : 'dark';
	if (meta) meta.content = scheme;
	try {
		localStorage.setItem('color-scheme', scheme);
		localStorage.setItem(STORAGE_KEYS.theme, themeId);
	} catch {}

	state.monaco?.editor.setTheme(themeId);
	const themeSelect = document.getElementById('theme-select');
	if (themeSelect) themeSelect.value = themeId;
}

/* ============================================================================
 * File Tree, Tabs, Save & Workspace API
 * ==========================================================================*/
async function loadWorkspace(initial = false) {
	const data = initial ? await workspaceStore.init() : await workspaceStore.getTree();
	applyWorkspaceData(data);
}

function applyWorkspaceData(data) {
	state.workspaceRoot = data.root;
	state.tree = data.tree;

	// Preserve existing Monaco models when refreshing
	const prevModels = new Map(state.files.map(f => [f.path, f]));
	state.files = flattenFiles(data.tree);
	for (const f of state.files) {
		const prev = prevModels.get(f.path);
		if (prev?.model) {
			f.model = prev.model;
			f.dirty = prev.dirty;
		}
	}

	const pathLabel = document.getElementById('workspace-path-label');
	if (pathLabel) {
		pathLabel.textContent = state.workspaceRoot;
		pathLabel.title = state.workspaceRoot;
	}

	renderFileTree();
	if (!state.activePath && state.files.length) {
		const preferred = state.files.find(f => f.path === 'login.html') || state.files[0];
		openFile(preferred.path);
	}
}

function renderFileTree() {
	const container = document.getElementById('file-tree');
	if (!container) return;
	container.textContent = '';

	const renderNodes = (nodes, depth = 0) => {
		for (const node of nodes) {
			if (node.type === 'directory') {
				const dirLabel = document.createElement('div');
				dirLabel.className = 'file-row';
				dirLabel.style.paddingInlineStart = `${0.7 + depth * 0.7}rem`;
				const btn = document.createElement('span');
				btn.className = 'file-row-btn';
				btn.textContent = `📁 ${node.name}`;
				dirLabel.append(btn);
				container.append(dirLabel);
				renderNodes(node.children || [], depth + 1);
				continue;
			}

			const entry = getFileEntry(node.path);
			const row = document.createElement('div');
			row.className = `file-row${state.activePath === node.path ? ' active' : ''}`;

			const openBtn = document.createElement('button');
			openBtn.type = 'button';
			openBtn.className = 'file-row-btn';
			openBtn.style.paddingInlineStart = `${0.7 + depth * 0.7}rem`;

			const badge = document.createElement('span');
			const ext = (node.ext || '').replace('.', '');
			badge.className = `file-badge ${ext}`;
			badge.textContent = ext === 'css' ? '#' : ext === 'html' ? '<>' : 'JS';

			const nameSpan = document.createElement('span');
			nameSpan.className = 'file-row-name';
			nameSpan.textContent = entry?.dirty ? `${node.name} •` : node.name;

			openBtn.append(badge, nameSpan);
			openBtn.addEventListener('click', () => openFile(node.path));

			const ops = document.createElement('div');
			ops.className = 'file-row-ops';

			const renameBtn = document.createElement('button');
			renameBtn.type = 'button';
			renameBtn.className = 'row-op-btn';
			renameBtn.title = `Đổi tên ${node.name}`;
			renameBtn.setAttribute('aria-label', `Đổi tên ${node.name}`);
			renameBtn.textContent = '✎';
			renameBtn.addEventListener('click', () => promptRenameFile(node.path));

			const delBtn = document.createElement('button');
			delBtn.type = 'button';
			delBtn.className = 'row-op-btn';
			delBtn.title = `Xóa ${node.name}`;
			delBtn.setAttribute('aria-label', `Xóa ${node.name}`);
			delBtn.textContent = '🗑';
			delBtn.addEventListener('click', () => deleteWorkspaceFile(node.path));

			ops.append(renameBtn, delBtn);
			row.append(openBtn, ops);
			container.append(row);
		}
	};

	renderNodes(state.tree);
}

function renderTabs() {
	const bar = document.getElementById('tabs-bar');
	if (!bar) return;
	bar.textContent = '';

	for (const filePath of state.openTabs) {
		const entry = getFileEntry(filePath);
		if (!entry) continue;

		const item = document.createElement('div');
		item.className = `tab-item${state.activePath === filePath ? ' active' : ''}`;

		const tabBtn = document.createElement('button');
		tabBtn.type = 'button';
		tabBtn.className = 'tab-btn';
		tabBtn.setAttribute('role', 'tab');
		tabBtn.setAttribute('aria-selected', state.activePath === filePath ? 'true' : 'false');

		const badge = document.createElement('span');
		const lang = getLangFromPath(filePath);
		badge.className = `file-badge ${lang}`;
		badge.textContent = lang === 'css' ? '#' : lang === 'html' ? '<>' : 'JS';

		const label = document.createElement('span');
		label.textContent = entry.dirty ? `${entry.name} •` : entry.name;

		tabBtn.append(badge, label);
		tabBtn.addEventListener('click', () => openFile(filePath));

		const closeBtn = document.createElement('button');
		closeBtn.type = 'button';
		closeBtn.className = 'tab-close';
		closeBtn.setAttribute('aria-label', `Đóng tab ${entry.name}`);
		closeBtn.textContent = '×';
		closeBtn.addEventListener('click', () => closeTab(filePath));

		item.append(tabBtn, closeBtn);
		bar.append(item);
	}
}

function closeTab(filePath) {
	state.openTabs = state.openTabs.filter(p => p !== filePath);
	if (state.activePath === filePath) {
		const next = state.openTabs[state.openTabs.length - 1] || null;
		state.activePath = next;
		if (next) openFile(next);
		else {
			state.editor?.setModel(null);
			renderTabs();
			renderFileTree();
		}
	} else {
		renderTabs();
	}
}

function updateCursorStatus() {
	const posEl = document.getElementById('status-cursor');
	const pos = state.editor?.getPosition();
	if (posEl && pos) {
		posEl.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
	}
}

function openFile(filePath) {
	const entry = getFileEntry(filePath);
	if (!entry) return;
	if (state.activePath && state.editor?.getModel()) {
		state.viewStates.set(state.activePath, state.editor.saveViewState());
	}
	if (!state.openTabs.includes(filePath)) {
		state.openTabs.push(filePath);
	}
	state.activePath = filePath;
	state.altIndex = 0;

	const model = getOrCreateModel(entry);
	state.editor.setModel(model);

	const savedView = state.viewStates.get(filePath);
	if (savedView) {
		state.editor.restoreViewState(savedView);
	} else {
		// Place cursor on an initial ready-to-type blank line if starter file has one
		const lineCount = model.getLineCount();
		const val = model.getValue();
		if (/^\s*\/\*/.test(val) && lineCount > 1 && model.getLineContent(lineCount).trim() === '') {
			state.editor.setPosition({ lineNumber: lineCount, column: 1 });
		} else {
			for (let ln = 1; ln <= lineCount; ln++) {
				const text = model.getLineContent(ln);
				if (text.trim() === '' && text.length > 0) {
					state.editor.setPosition({ lineNumber: ln, column: text.length + 1 });
					break;
				}
			}
		}
	}
	state.editor.focus();
	updateCursorStatus();

	renderTabs();
	renderFileTree();
	refreshDiagnostics();
	refreshContinuousInsights();
	schedulePreviewUpdate(true);
	triggerInlineGhostText();
}

async function saveFile(filePath = state.activePath) {
	if (!filePath) return;
	const entry = getFileEntry(filePath);
	if (!entry) return;
	const content = entry.model ? entry.model.getValue() : entry.content;
	entry.content = content;
	const ok = await workspaceStore.saveFile(filePath, content);
	if (ok) {
		entry.dirty = false;
		renderTabs();
		renderFileTree();
		announceStatus(`Đã lưu ${entry.name}`);
	}
}

async function createAndOpenFile(filePath, initialContent = '') {
	const clean = String(filePath || '').trim().replace(/^\/+/, '');
	if (!clean) return;
	if (!getFileEntry(clean)) {
		await workspaceStore.saveFile(clean, initialContent);
		await loadWorkspace();
	}
	openFile(clean);
	announceStatus(`Đã mở tệp ${clean}`);
}

async function deleteWorkspaceFile(filePath) {
	await workspaceStore.deleteFile(filePath);
	const entry = getFileEntry(filePath);
	if (entry?.model) entry.model.dispose();
	state.openTabs = state.openTabs.filter(p => p !== filePath);
	if (state.activePath === filePath) {
		state.activePath = null;
	}
	await loadWorkspace();
	if (!state.activePath && state.openTabs.length) {
		openFile(state.openTabs[state.openTabs.length - 1]);
	}
	announceStatus(`Đã xóa ${filePath}`);
}

/* ============================================================================
 * Native <dialog> helper + closedby fallback
 * ==========================================================================*/
function installDialogLightDismissFallback(dialog) {
	dialog.querySelectorAll('[data-dialog-close]').forEach(btn => {
		btn.addEventListener('click', () => dialog.close('cancel'));
	});
	if ('closedBy' in HTMLDialogElement.prototype) return;
	dialog.addEventListener('click', event => {
		if (event.target !== dialog) return;
		const rect = dialog.getBoundingClientRect();
		const inside =
			rect.top <= event.clientY &&
			event.clientY <= rect.top + rect.height &&
			rect.left <= event.clientX &&
			event.clientX <= rect.left + rect.width;
		if (!inside) dialog.close('cancel');
	});
}

function openInputDialog({ title, desc, label, defaultValue, placeholder }) {
	const dialog = document.getElementById('file-dialog');
	const titleEl = document.getElementById('file-dialog-title');
	const descEl = document.getElementById('file-dialog-desc');
	const labelEl = document.querySelector('label[for="file-dialog-input"]');
	const input = document.getElementById('file-dialog-input');

	titleEl.textContent = title;
	descEl.textContent = desc;
	labelEl.textContent = label;
	input.value = defaultValue || '';
	input.placeholder = placeholder || '';

	return new Promise(resolve => {
		const onClose = () => {
			dialog.removeEventListener('close', onClose);
			if (dialog.returnValue === 'confirm') resolve(input.value.trim());
			else resolve(null);
		};
		dialog.addEventListener('close', onClose);
		dialog.showModal();
		input.focus();
		input.select();
	});
}

async function promptNewFile(ext) {
	const name = await openInputDialog({
		title: ext === '.css' ? 'Tạo tệp CSS mới' : 'Tạo tệp HTML mới',
		desc: 'Tên tệp sẽ quyết định ngay nội dung gợi ý liên tục (VD: login.html, pricing.html, navbar.css, button.css, ban-hang.html...).',
		label: 'Tên tệp',
		defaultValue: ext === '.css' ? 'navbar.css' : 'pricing.html',
		placeholder: ext === '.css' ? 'ten-component.css' : 'ten-trang.html',
	});
	if (!name) return;
	const finalName = /\.[a-z0-9]+$/i.test(name) ? name : `${name}${ext}`;
	await createAndOpenFile(finalName, '');
}

async function promptRenameFile(oldPath) {
	const newPath = await openInputDialog({
		title: 'Đổi tên tệp (đổi cả ngữ cảnh gợi ý)',
		desc: `Đổi tên ${oldPath} sang tên mới để IDE tự động gợi ý code theo tên tệp mới.`,
		label: 'Tên tệp mới',
		defaultValue: oldPath,
		placeholder: oldPath,
	});
	if (!newPath || newPath === oldPath) return;
	const ok = await workspaceStore.renameFile(oldPath, newPath);
	if (!ok) return;

	const oldEntry = getFileEntry(oldPath);
	const savedText = oldEntry?.model ? oldEntry.model.getValue() : (oldEntry?.content || '');
	if (oldEntry?.model) oldEntry.model.dispose();

	state.openTabs = state.openTabs.map(p => (p === oldPath ? newPath : p));
	if (state.activePath === oldPath) state.activePath = newPath;

	await loadWorkspace();
	const renamed = getFileEntry(newPath);
	if (renamed) renamed.content = savedText;
	openFile(newPath);
	announceStatus(`Đã đổi tên thành ${newPath}`);
}

async function promptChangeWorkspaceRoot() {
	if (workspaceStore.getBackend() === 'server') {
		const nextRoot = await openInputDialog({
			title: 'Mở thư mục dự án trên máy',
			desc: 'Nhập đường dẫn tuyệt đối tới thư mục chứa các file HTML/CSS của bạn.',
			label: 'Đường dẫn thư mục',
			defaultValue: state.workspaceRoot,
			placeholder: 'D:\\du-an-web',
		});
		if (!nextRoot || nextRoot === state.workspaceRoot) return;
		try {
			const data = await workspaceStore.setServerRoot(nextRoot);
			resetEditorModels();
			applyWorkspaceData(data);
			announceStatus(`Đã chuyển thư mục làm việc sang ${data.root}`);
		} catch (err) {
			announceStatus(err.message || 'Không thể mở thư mục');
		}
		return;
	}

	try {
		const data = await workspaceStore.pickLocalDirectory();
		resetEditorModels();
		applyWorkspaceData(data);
		announceStatus(`Đã mở thư mục ${data.root}`);
	} catch (err) {
		if (err?.name !== 'AbortError') {
			announceStatus(err?.message || 'Không thể mở thư mục trên trình duyệt này');
		}
	}
}

function resetEditorModels() {
	for (const f of state.files) f.model?.dispose();
	state.files = [];
	state.openTabs = [];
	state.activePath = null;
	state.viewStates.clear();
}

/* ============================================================================
 * Continuous Filename-Based Suggestion Engine
 * ==========================================================================*/
function computeSuggestionAtCursor() {
	if (!state.activePath || !state.editor) return null;
	const model = state.editor.getModel();
	const pos = state.editor.getPosition();
	if (!model || !pos) return null;

	return computeContinuousSuggestion({
		filePath: state.activePath,
		language: model.getLanguageId(),
		content: model.getValue(),
		lineNumber: pos.lineNumber,
		column: pos.column,
		allFiles: getWorkspaceFileSnapshots(),
		mode: state.suggestMode,
		altIndex: state.altIndex,
	});
}

let ghostTriggerTimer = null;
function triggerInlineGhostText() {
	clearTimeout(ghostTriggerTimer);
	if (state.suggestMode === 'off' || !state.editor || !state.inlineChangeEmitter) return;
	ghostTriggerTimer = setTimeout(() => {
		if (!state.editor?.getModel()) return;
		state.inlineChangeEmitter.fire();
	}, 90);
}

function insertTextAtCursor(text, { moveBelowTopComment = false } = {}) {
	if (!state.editor || !text) return;
	const model = state.editor.getModel();
	let pos = state.editor.getPosition();
	if (!model || !pos) return;

	if (moveBelowTopComment && pos.lineNumber === 1 && pos.column === 1 && /^\s*\/\*/.test(model.getLineContent(1))) {
		const lastLine = model.getLineCount();
		const lastCol = model.getLineMaxColumn(lastLine);
		pos = new state.monaco.Position(lastLine, lastCol);
		if (model.getLineContent(lastLine).trim() !== '') {
			text = `\n\n${text.replace(/^\n+/, '')}`;
		}
	}

	const range = new state.monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column);
	state.editor.executeEdits('codeflow-insert', [{ range, text, forceMoveMarkers: true }]);
	state.editor.focus();
	updateCursorStatus();
	triggerInlineGhostText();
}

function acceptPrimarySuggestion() {
	if (!state.editor) return;
	const res = computeSuggestionAtCursor();
	if (res?.primary?.insertText) {
		insertTextAtCursor(res.primary.insertText, { moveBelowTopComment: true });
		announceStatus(`Đã chèn gợi ý: ${res.primary.label || 'code'}`);
	}
}

function refreshContinuousInsights() {
	const result = computeSuggestionAtCursor();
	state.lastSuggestionResult = result;
	if (!result) return;

	const { intent, linkedPartner } = result;
	const topChip = document.getElementById('topbar-intent-chip');
	const ribbonSummary = document.getElementById('ribbon-summary');
	const partnerBtn = document.getElementById('btn-open-partner');
	const statusPartner = document.getElementById('status-partner');
	const statusLang = document.getElementById('status-language');

	if (topChip) topChip.textContent = `${intent.fileName} → ${intent.archetype.label}`;
	if (ribbonSummary) {
		ribbonSummary.textContent = `Tên file "${intent.fileName}" → Ngữ cảnh: ${intent.archetype.label}`;
	}
	if (statusLang) statusLang.textContent = intent.language.toUpperCase();

	const model = state.editor?.getModel();
	const explicitLinkHref = model && intent.language === 'html'
		? model.getValue().match(/<link[^>]+href=["']([^"']+\.css)["']/i)?.[1]?.split('/').pop()
		: null;
	const expectedPartnerName =
		linkedPartner ||
		explicitLinkHref ||
		(intent.language === 'css' ? `${intent.rawName}.html` : `${intent.rawName}.css`);

	if (partnerBtn) {
		partnerBtn.hidden = false;
		partnerBtn.textContent = linkedPartner ? `🔗 Mở ${linkedPartner}` : `+ Tạo ${expectedPartnerName}`;
		partnerBtn.dataset.partnerPath = expectedPartnerName;
	}
	if (statusPartner) {
		statusPartner.textContent = `Liên kết: ${linkedPartner || 'chưa có (' + expectedPartnerName + ')'}`;
	}

	renderSuggestionStream();
}

function renderSuggestionStream() {
	const container = document.getElementById('suggestion-stream');
	if (!container) return;
	container.textContent = '';

	const res = state.lastSuggestionResult;
	if (!res) {
		const empty = document.createElement('p');
		empty.className = 'dialog-desc';
		empty.textContent = 'Mở một tệp HTML hoặc CSS để bắt đầu nhận gợi ý liên tục theo tên file.';
		container.append(empty);
		return;
	}

	// 1. Un-styled HTML classes waiting for CSS (when editing .css)
	if (res.intent.language === 'css' && res.unstyledHtmlClasses.length > 0) {
		const card = document.createElement('section');
		card.className = 'stream-card';

		const head = document.createElement('div');
		head.className = 'stream-card-head';
		const title = document.createElement('span');
		title.textContent = `Class từ ${res.linkedPartner || 'HTML'} chưa có CSS (${res.unstyledHtmlClasses.length})`;
		head.append(title);

		const chips = document.createElement('div');
		chips.className = 'unstyled-chips';
		for (const cls of res.unstyledHtmlClasses.slice(0, 14)) {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'class-chip-btn';
			btn.textContent = `.${cls}`;
			btn.title = `Chèn rule CSS cho .${cls}`;
			btn.addEventListener('click', () => {
				const ruleText = `${buildCssRuleForSymbol(cls, false).join('\n')}\n\n`;
				insertTextAtCursor(ruleText, { moveBelowTopComment: true });
			});
			chips.append(btn);
		}
		card.append(head, chips);
		container.append(card);
	}

	// 2. Upcoming Continuous Steps Queue
	if (res.upcomingSteps.length === 0) {
		const doneCard = document.createElement('section');
		doneCard.className = 'stream-card';
		const head = document.createElement('div');
		head.className = 'stream-card-head';
		head.textContent = `Đã hoàn thiện các bước gợi ý cho ${res.intent.fileName}`;
		const p = document.createElement('p');
		p.className = 'dialog-desc';
		p.textContent = 'Bạn có thể thêm class/thẻ mới hoặc đổi tên file để nhận luồng gợi ý mới.';
		doneCard.append(head, p);
		container.append(doneCard);
		return;
	}

	for (const step of res.upcomingSteps) {
		const card = document.createElement('section');
		card.className = 'stream-card';

		const head = document.createElement('div');
		head.className = 'stream-card-head';

		const title = document.createElement('span');
		title.textContent = step.title;

		const insertBtn = document.createElement('button');
		insertBtn.type = 'button';
		insertBtn.className = 'mini-btn';
		insertBtn.textContent = 'Chèn bước này';
		insertBtn.addEventListener('click', () => {
			const model = state.editor?.getModel();
			const pos = state.editor?.getPosition();
			const prefix = model && pos ? model.getLineContent(pos.lineNumber).slice(0, pos.column - 1).trim() : '';
			const text = prefix ? `\n${step.preview}\n` : `${step.preview}\n`;
			insertTextAtCursor(text, { moveBelowTopComment: true });
		});

		head.append(title, insertBtn);

		const pre = document.createElement('pre');
		pre.className = 'stream-code';
		pre.textContent = step.preview;

		card.append(head, pre);
		container.append(card);
	}
}

/* ============================================================================
 * Live Sandboxed Preview (HTML + Live In-Memory CSS Linking)
 * ==========================================================================*/
let previewTimer = null;
function schedulePreviewUpdate(immediate = false) {
	clearTimeout(previewTimer);
	previewTimer = setTimeout(updatePreview, immediate ? 20 : 140);
}

function buildPreviewHtml() {
	const snapshots = getWorkspaceFileSnapshots();
	let activeHtmlFile = snapshots.find(f => f.path === state.activePath && getLangFromPath(f.path) === 'html');

	if (!activeHtmlFile && state.activePath) {
		const partner = findPartnerFile(state.activePath, snapshots);
		if (partner && getLangFromPath(partner.path) === 'html') {
			activeHtmlFile = partner;
		}
	}
	if (!activeHtmlFile) {
		activeHtmlFile = snapshots.find(f => getLangFromPath(f.path) === 'html');
	}
	if (!activeHtmlFile) {
		return '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;color:#334155"><h2>Chưa có file HTML để xem trước</h2><p>Tạo hoặc mở một file <code>.html</code>.</p></body></html>';
	}

	let html = activeHtmlFile.content || '';
	const cssByBase = new Map();
	for (const f of snapshots) {
		if (getLangFromPath(f.path) === 'css') {
			cssByBase.set(f.name.toLowerCase(), f.content);
			cssByBase.set(f.path.toLowerCase(), f.content);
		}
	}

	// Inline linked workspace CSS files so live unsaved CSS edits show instantaneously inside sandboxed iframe
	html = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi, (full, href) => {
		const cleanHref = href.split('?')[0].replace(/^\.\//, '').toLowerCase();
		const baseName = cleanHref.split('/').pop();
		const cssContent = cssByBase.get(cleanHref) ?? cssByBase.get(baseName);
		if (cssContent === undefined) return full;
		const safeCss = cssContent.replace(/<\/style/gi, '<\\/style');
		return `<style data-source="${baseName}">\n${safeCss}\n</style>`;
	});

	return html;
}

function updatePreview() {
	if (!state.previewVisible) return;
	const frame = document.getElementById('preview-frame');
	if (!frame) return;
	frame.srcdoc = buildPreviewHtml();
}

function refreshDiagnostics() {
	const model = state.editor?.getModel();
	if (!model) return;
	const markers = validateModelDiagnostics(model);
	const errors = markers.filter(m => m.severity >= 8).length;
	const warnings = markers.filter(m => m.severity === 4).length;
	const el = document.getElementById('status-problems');
	if (el) el.textContent = `${errors} lỗi • ${warnings} cảnh báo`;
}

/* ============================================================================
 * Toolbar Keyboard Fallback (when native focusgroup is unsupported)
 * ==========================================================================*/
function initToolbarFallback() {
	const toolbar = document.querySelector('[role="toolbar"]');
	if (!toolbar || 'focusGroup' in HTMLElement.prototype) return;
	const items = Array.from(toolbar.querySelectorAll('button, select'));
	if (!items.length) return;
	items.forEach((el, idx) => {
		el.tabIndex = idx === 0 ? 0 : -1;
	});
	toolbar.addEventListener('focusin', event => {
		if (items.includes(event.target)) {
			items.forEach(el => {
				el.tabIndex = el === event.target ? 0 : -1;
			});
		}
	});
	toolbar.addEventListener('keydown', event => {
		const idx = items.indexOf(document.activeElement);
		if (idx === -1) return;
		const rtl = getComputedStyle(toolbar).direction === 'rtl';
		let next = -1;
		if (event.key === 'ArrowRight') next = (idx + (rtl ? -1 : 1) + items.length) % items.length;
		else if (event.key === 'ArrowLeft') next = (idx + (rtl ? 1 : -1) + items.length) % items.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = items.length - 1;
		if (next !== -1) {
			event.preventDefault();
			items[next].focus();
		}
	});
}

/* ============================================================================
 * Bootstrap IDE
 * ==========================================================================*/
async function bootstrap() {
	initToolbarFallback();
	installDialogLightDismissFallback(document.getElementById('file-dialog'));
	installDialogLightDismissFallback(document.getElementById('settings-dialog'));

	const { monaco, themes, langAssets } = await initializeVscodeCore();
	state.monaco = monaco;
	state.themes = themes;
	state.langAssets = langAssets;

	const sourceBadge = document.getElementById('vscode-source-badge');
	if (sourceBadge && langAssets?.sourceVscodeVersion) {
		sourceBadge.textContent = `VS Code ${langAssets.sourceVscodeVersion} Core`;
	}

	const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark-modern';
	applyVscodeTheme(savedTheme);

	window.addEventListener('storage', event => {
		if (event.key === STORAGE_KEYS.theme && event.newValue) {
			applyVscodeTheme(event.newValue);
		}
	});

	state.inlineChangeEmitter = new monaco.Emitter();

	// Register Continuous Filename-Based Inline Completions (Ghost Text)
	monaco.languages.registerInlineCompletionsProvider(['html', 'css'], {
		displayName: 'CodeFlow Filename Continuous Suggester',
		onDidChangeInlineCompletions: state.inlineChangeEmitter.event,
		provideInlineCompletions(model, position) {
			if (state.suggestMode === 'off') return { items: [] };
			const entry = state.files.find(f => f.model === model);
			const filePath = entry?.path || state.activePath || 'index.html';

			const res = computeContinuousSuggestion({
				filePath,
				language: model.getLanguageId(),
				content: model.getValue(),
				lineNumber: position.lineNumber,
				column: position.column,
				allFiles: getWorkspaceFileSnapshots(),
				mode: state.suggestMode,
				altIndex: state.altIndex,
			});

			const items = [];
			const range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column);

			for (const cand of res.alternatives) {
				items.push({ insertText: cand.insertText, range });
			}
			// Rotate primary picked alternative first
			if (res.primary && items.length > 1) {
				const idx = items.findIndex(it => it.insertText === res.primary.insertText);
				if (idx > 0) {
					const [picked] = items.splice(idx, 1);
					items.unshift(picked);
				}
			}

			return { items };
		},
		disposeInlineCompletions() {},
		freeInlineCompletions() {},
	});

	// Filename-prioritized IntelliSense items
	monaco.languages.registerCompletionItemProvider(['html', 'css'], {
		triggerCharacters: ['.', '#', '<', ' ', ':'],
		provideCompletionItems(model, position) {
			const entry = state.files.find(f => f.model === model);
			const filePath = entry?.path || state.activePath || 'index.html';
			const res = computeContinuousSuggestion({
				filePath,
				language: model.getLanguageId(),
				content: model.getValue(),
				lineNumber: position.lineNumber,
				column: position.column,
				allFiles: getWorkspaceFileSnapshots(),
				mode: 'block',
			});
			const range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column);
			const suggestions = res.upcomingSteps.slice(0, 4).map((step, idx) => ({
				label: `★ ${step.title}`,
				kind: monaco.languages.CompletionItemKind.Snippet,
				detail: `Gợi ý theo tên file (${res.intent.fileName})`,
				documentation: step.preview,
				insertText: step.preview,
				sortText: `000${idx}`,
				range,
			}));
			return { suggestions };
		},
	});

	const container = document.getElementById('editor-container');
	state.editor = monaco.editor.create(container, {
		value: '',
		language: 'html',
		theme: savedTheme,
		automaticLayout: true,
		fontSize: Number(state.editorConfig.fontSize) || 13.5,
		tabSize: Number(state.editorConfig.tabSize) || 2,
		insertSpaces: true,
		wordWrap: state.editorConfig.wordWrap === false ? 'off' : 'on',
		minimap: { enabled: false },
		inlineSuggest: { enabled: true, showToolbar: 'always' },
		quickSuggestions: { other: true, comments: false, strings: true },
		suggestOnTriggerCharacters: true,
		autoClosingBrackets: 'always',
		autoClosingQuotes: 'always',
		formatOnPaste: true,
		smoothScrolling: true,
	});

	// Keybindings: Ctrl+S save, Alt+] cycle suggestion
	state.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
		saveFile();
	});
	state.editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.BracketRight, () => {
		state.altIndex += 1;
		refreshContinuousInsights();
		triggerInlineGhostText();
	});

	// Continuous editor listeners
	let saveTimer = null;
	state.editor.onDidChangeModelContent(event => {
		const entry = getFileEntry(state.activePath);
		if (entry) {
			entry.content = state.editor.getModel().getValue();
			entry.dirty = true;
			renderTabs();
			renderFileTree();
		}

		// HTML auto-close tag when typing '>'
		if (state.editorConfig.autoCloseTags !== false && event.changes.length === 1 && event.changes[0].text === '>') {
			const pos = state.editor.getPosition();
			const closing = tryHtmlAutoCloseTag(state.editor.getModel(), pos);
			if (closing) {
				const snippetText = closing.replace(/\$0/g, '');
				const cursorOffset = closing.indexOf('$0');
				state.editor.executeEdits('html-autoclose', [{
					range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
					text: snippetText,
				}]);
				if (cursorOffset !== -1) {
					state.editor.setPosition({ lineNumber: pos.lineNumber, column: pos.column + cursorOffset });
				}
			}
		}

		refreshDiagnostics();
		refreshContinuousInsights();
		schedulePreviewUpdate();

		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			if (!state.suppressAutoSave) saveFile();
		}, 1200);
	});

	state.editor.onDidChangeCursorPosition(e => {
		const posEl = document.getElementById('status-cursor');
		if (posEl) posEl.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
		refreshContinuousInsights();
		triggerInlineGhostText();
	});

	// Wire UI controls
	const modeSelect = document.getElementById('suggest-mode-select');
	modeSelect.value = state.suggestMode;
	const syncEngineStatus = () => {
		const eng = document.getElementById('status-engine');
		if (eng) eng.textContent = `Gợi ý liên tục: ${MODE_LABELS[state.suggestMode] || state.suggestMode}`;
	};
	syncEngineStatus();
	modeSelect.addEventListener('change', () => {
		state.suggestMode = modeSelect.value;
		localStorage.setItem(STORAGE_KEYS.mode, state.suggestMode);
		syncEngineStatus();
		refreshContinuousInsights();
		triggerInlineGhostText();
	});

	const themeSelect = document.getElementById('theme-select');
	themeSelect.addEventListener('change', () => applyVscodeTheme(themeSelect.value));

	document.getElementById('btn-accept-next').addEventListener('click', acceptPrimarySuggestion);
	document.getElementById('btn-cycle-alt').addEventListener('click', () => {
		state.altIndex += 1;
		refreshContinuousInsights();
		triggerInlineGhostText();
	});
	document.getElementById('btn-format').addEventListener('click', () => {
		state.editor?.getAction('editor.action.formatDocument')?.run();
		announceStatus('Đã định dạng code');
	});
	document.getElementById('btn-save').addEventListener('click', () => saveFile());

	const togglePreviewBtn = document.getElementById('btn-toggle-preview');
	togglePreviewBtn.addEventListener('click', () => {
		state.previewVisible = !state.previewVisible;
		togglePreviewBtn.setAttribute('aria-pressed', String(state.previewVisible));
		document.querySelector('.ide-main').classList.toggle('preview-hidden', !state.previewVisible);
		if (state.previewVisible) schedulePreviewUpdate(true);
	});

	document.getElementById('btn-new-html').addEventListener('click', () => promptNewFile('.html'));
	document.getElementById('btn-new-css').addEventListener('click', () => promptNewFile('.css'));
	document.getElementById('btn-change-root').addEventListener('click', promptChangeWorkspaceRoot);

	document.querySelectorAll('.tpl-chip[data-newfile]').forEach(btn => {
		btn.addEventListener('click', () => createAndOpenFile(btn.dataset.newfile, ''));
	});

	document.getElementById('btn-open-partner').addEventListener('click', event => {
		const target = event.currentTarget.dataset.partnerPath;
		if (target) createAndOpenFile(target, '');
	});

	const previewDesktopBtn = document.getElementById('btn-preview-desktop');
	const previewMobileBtn = document.getElementById('btn-preview-mobile');
	const previewStage = document.getElementById('preview-stage');
	previewDesktopBtn.addEventListener('click', () => {
		previewDesktopBtn.setAttribute('aria-pressed', 'true');
		previewMobileBtn.setAttribute('aria-pressed', 'false');
		previewStage.classList.remove('mobile-mode');
	});
	previewMobileBtn.addEventListener('click', () => {
		previewDesktopBtn.setAttribute('aria-pressed', 'false');
		previewMobileBtn.setAttribute('aria-pressed', 'true');
		previewStage.classList.add('mobile-mode');
	});
	document.getElementById('btn-preview-refresh').addEventListener('click', () => updatePreview());
	document.getElementById('btn-refresh-suggest').addEventListener('click', () => {
		refreshContinuousInsights();
		triggerInlineGhostText();
		announceStatus('Đã làm mới gợi ý');
	});

	// Suggestion & Editor Settings dialog
	const settingsDialog = document.getElementById('settings-dialog');
	const resetBrowserWsBtn = document.getElementById('btn-reset-browser-ws');
	resetBrowserWsBtn.addEventListener('click', () => {
		const data = workspaceStore.resetBrowserWorkspace();
		resetEditorModels();
		applyWorkspaceData(data);
		settingsDialog.close('cancel');
		announceStatus('Đã khôi phục tệp mẫu trong trình duyệt');
	});
	document.getElementById('btn-open-settings').addEventListener('click', () => {
		document.getElementById('cfg-auto-close').checked = state.editorConfig.autoCloseTags !== false;
		document.getElementById('cfg-word-wrap').checked = state.editorConfig.wordWrap !== false;
		document.getElementById('cfg-font-size').value = String(state.editorConfig.fontSize || 13.5);
		document.getElementById('cfg-tab-size').value = String(state.editorConfig.tabSize || 2);
		resetBrowserWsBtn.hidden = workspaceStore.getBackend() === 'server';
		settingsDialog.showModal();
	});
	settingsDialog.addEventListener('close', () => {
		if (settingsDialog.returnValue === 'save') {
			const fontSize = Math.min(22, Math.max(11, Number(document.getElementById('cfg-font-size').value) || 13.5));
			const tabSize = Number(document.getElementById('cfg-tab-size').value) === 4 ? 4 : 2;
			state.editorConfig = {
				autoCloseTags: document.getElementById('cfg-auto-close').checked,
				wordWrap: document.getElementById('cfg-word-wrap').checked,
				fontSize,
				tabSize,
			};
			localStorage.setItem(STORAGE_KEYS.editorConfig, JSON.stringify(state.editorConfig));
			state.editor?.updateOptions({
				fontSize,
				wordWrap: state.editorConfig.wordWrap ? 'on' : 'off',
			});
			state.editor?.getModel()?.updateOptions({ tabSize });
			announceStatus('Đã lưu cài đặt gợi ý');
		}
	});

	await loadWorkspace(true);
}

bootstrap().catch(err => {
	console.error('Failed to bootstrap IDE:', err);
	const summary = document.getElementById('ribbon-summary');
	if (summary) summary.textContent = `Lỗi khởi tạo IDE: ${err.message}`;
});
