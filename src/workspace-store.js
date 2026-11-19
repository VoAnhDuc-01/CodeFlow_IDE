/**
 * Unified Workspace Store supporting 3 modes seamlessly:
 * 1. 'server'  -> Local Node server API (./api/workspace/*)
 * 2. 'fsa'     -> Browser File System Access API (window.showDirectoryPicker) on HTTPS/GitHub Pages
 * 3. 'browser' -> Static localStorage workspace (default on GitHub Pages / static hosts)
 */

const STORAGE_KEY = 'codeflow-static-workspace-v1';
const TEXT_EXTENSIONS = new Set(['.html', '.htm', '.css', '.scss', '.js', '.mjs', '.json', '.md', '.txt', '.svg']);

export function getStarterFilesMap() {
	return {
		'index.html': `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trang Chủ — Demo IDE</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header class="site-header">
    <a class="brand" href="#">CodeFlow IDE</a>
    <nav class="nav-links" aria-label="Điều hướng chính">
      <a href="#features">Tính năng</a>
      <a href="login.html">Đăng nhập</a>
    </nav>
  </header>

  <main class="hero">
    <span class="hero-badge">Powered by VS Code Core</span>
    <h1>Gợi ý code liên tục theo tên file HTML & CSS</h1>
    <p>Thử tạo file mới tên <code>pricing.html</code>, <code>dashboard.html</code>, <code>navbar.css</code> hoặc xóa bớt dòng bên dưới và nhấn <strong>Tab</strong> để xem gợi ý liên tục.</p>
    <div class="hero-actions">
      <a class="btn-primary" href="login.html">Mở trang Login</a>
    </div>
  </main>
</body>
</html>
`,
		'style.css': `:root {
  --bg: #0b1020;
  --surface: #121a2f;
  --text: #e6edf7;
  --muted: #94a3b8;
  --accent: #38bdf8;
  --border: rgba(148, 163, 184, 0.22);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: radial-gradient(circle at top, #172554 0%, var(--bg) 55%);
  color: var(--text);
  min-height: 100vh;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border);
}

.brand {
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.25rem;
}

.nav-links a {
  color: var(--muted);
  text-decoration: none;
}

.hero {
  max-width: 780px;
  margin: 4rem auto;
  padding: 0 1.5rem;
  text-align: center;
}

.hero-badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.14);
  color: var(--accent);
  font-size: 0.85rem;
  font-weight: 600;
}

.hero h1 {
  font-size: clamp(2rem, 4vw, 3.1rem);
  line-height: 1.15;
  margin: 1rem 0;
}

.hero p {
  color: var(--muted);
  line-height: 1.6;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.4rem;
  border-radius: 0.65rem;
  background: var(--accent);
  color: #082f49;
  font-weight: 700;
  text-decoration: none;
  margin-top: 1rem;
}
`,
		'login.html': `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đăng nhập</title>
  <link rel="stylesheet" href="login.css" />
</head>
<body>
  <main class="login-page">
    <section class="login-card">
      <header class="login-header">
        <h1>Chào mừng trở lại</h1>
        <p>Đặt con trỏ ở dòng dưới rồi gõ hoặc nhấn Tab để nhận gợi ý tiếp theo cho login.html</p>
      </header>
      <form class="login-form">
        
      </form>
    </section>
  </main>
</body>
</html>
`,
		'login.css': `/* Đặt con trỏ bên dưới để nhận gợi ý CSS tự động từ các class trong login.html */\n\n`,
	};
}

function getExt(name) {
	const idx = name.lastIndexOf('.');
	return idx > 0 ? name.slice(idx).toLowerCase() : '';
}

export function buildTreeFromMap(filesMap) {
	const rootNodes = [];
	const dirIndex = new Map();

	const ensureDir = parts => {
		let currentList = rootNodes;
		let prefix = '';
		for (const part of parts) {
			prefix = prefix ? `${prefix}/${part}` : part;
			let dirNode = dirIndex.get(prefix);
			if (!dirNode) {
				dirNode = { name: part, path: prefix, type: 'directory', children: [] };
				dirIndex.set(prefix, dirNode);
				currentList.push(dirNode);
			}
			currentList = dirNode.children;
		}
		return currentList;
	};

	for (const [rawPath, content] of Object.entries(filesMap)) {
		const clean = rawPath.replace(/^\/+/, '');
		if (!clean) continue;
		const parts = clean.split('/');
		const name = parts.pop();
		const targetList = parts.length ? ensureDir(parts) : rootNodes;
		targetList.push({
			name,
			path: clean,
			type: 'file',
			ext: getExt(name),
			content: typeof content === 'string' ? content : '',
		});
	}

	const sortTree = nodes => {
		nodes.sort((a, b) => {
			if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
			return a.name.localeCompare(b.name);
		});
		for (const n of nodes) {
			if (n.type === 'directory') sortTree(n.children);
		}
	};
	sortTree(rootNodes);
	return rootNodes;
}

function readBrowserMap(storage = globalThis.localStorage) {
	try {
		const raw = storage?.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === 'object') return parsed;
		}
	} catch {}
	const starter = getStarterFilesMap();
	writeBrowserMap(starter, storage);
	return starter;
}

function writeBrowserMap(filesMap, storage = globalThis.localStorage) {
	try {
		storage?.setItem(STORAGE_KEY, JSON.stringify(filesMap));
	} catch {}
}

async function readDirectoryHandleTree(dirHandle, baseRel = '') {
	const nodes = [];
	for await (const [name, handle] of dirHandle.entries()) {
		if (name === 'node_modules' || name === '.git') continue;
		const rel = baseRel ? `${baseRel}/${name}` : name;
		if (handle.kind === 'directory') {
			nodes.push({
				name,
				path: rel,
				type: 'directory',
				children: await readDirectoryHandleTree(handle, rel),
			});
		} else if (handle.kind === 'file') {
			const ext = getExt(name);
			const node = { name, path: rel, type: 'file', ext };
			if (TEXT_EXTENSIONS.has(ext)) {
				const file = await handle.getFile();
				if (file.size <= 512 * 1024) {
					node.content = await file.text();
				}
			}
			nodes.push(node);
		}
	}
	nodes.sort((a, b) => {
		if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
	return nodes;
}

async function getParentDirHandle(rootHandle, relPath, create = false) {
	const parts = relPath.replace(/^\/+/, '').split('/').filter(Boolean);
	const fileName = parts.pop();
	let dir = rootHandle;
	for (const part of parts) {
		dir = await dir.getDirectoryHandle(part, { create });
	}
	return { dir, fileName };
}

export function createWorkspaceStore({ storage = globalThis.localStorage, probeServer = false } = {}) {
	let backend = 'browser'; // 'server' | 'fsa' | 'browser'
	let dirHandle = null;

	return {
		getBackend() {
			return backend;
		},

		async init() {
			const metaMode = globalThis.document?.querySelector('meta[name="codeflow-backend"]')?.content;
			if (metaMode === 'server' || probeServer) {
				try {
					const resp = await fetch('./api/workspace/tree', {
						headers: { Accept: 'application/json' },
					});
					const ct = resp.headers.get('content-type') || '';
					if (resp.ok && ct.includes('application/json')) {
						const data = await resp.json();
						if (data && Array.isArray(data.tree)) {
							backend = 'server';
							return { mode: 'server', root: data.root, tree: data.tree };
						}
					}
				} catch {}
			}

			backend = 'browser';
			const filesMap = readBrowserMap(storage);
			return {
				mode: 'browser',
				root: 'Bộ nhớ trình duyệt (Static / GitHub Pages)',
				tree: buildTreeFromMap(filesMap),
			};
		},

		async getTree() {
			if (backend === 'server') {
				const resp = await fetch('./api/workspace/tree');
				const data = await resp.json();
				return { mode: 'server', root: data.root, tree: data.tree };
			}
			if (backend === 'fsa' && dirHandle) {
				const tree = await readDirectoryHandleTree(dirHandle);
				return { mode: 'fsa', root: `Thư mục: ${dirHandle.name}`, tree };
			}
			const filesMap = readBrowserMap(storage);
			return {
				mode: 'browser',
				root: 'Bộ nhớ trình duyệt (Static / GitHub Pages)',
				tree: buildTreeFromMap(filesMap),
			};
		},

		async saveFile(relPath, content = '') {
			const clean = String(relPath || '').replace(/^\/+/, '');
			if (!clean) return false;
			if (backend === 'server') {
				const resp = await fetch('./api/workspace/file', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ path: clean, content }),
				});
				return resp.ok;
			}
			if (backend === 'fsa' && dirHandle) {
				const { dir, fileName } = await getParentDirHandle(dirHandle, clean, true);
				const fileHandle = await dir.getFileHandle(fileName, { create: true });
				const writable = await fileHandle.createWritable();
				await writable.write(content);
				await writable.close();
				return true;
			}
			const filesMap = readBrowserMap(storage);
			filesMap[clean] = content;
			writeBrowserMap(filesMap, storage);
			return true;
		},

		async renameFile(oldPath, newPath) {
			const cleanOld = String(oldPath || '').replace(/^\/+/, '');
			const cleanNew = String(newPath || '').replace(/^\/+/, '');
			if (!cleanOld || !cleanNew) return false;
			if (backend === 'server') {
				const resp = await fetch('./api/workspace/rename', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ oldPath: cleanOld, newPath: cleanNew }),
				});
				return resp.ok;
			}
			if (backend === 'fsa' && dirHandle) {
				const { dir: oldDir, fileName: oldName } = await getParentDirHandle(dirHandle, cleanOld, false);
				const oldHandle = await oldDir.getFileHandle(oldName);
				const text = await (await oldHandle.getFile()).text();
				await this.saveFile(cleanNew, text);
				await oldDir.removeEntry(oldName);
				return true;
			}
			const filesMap = readBrowserMap(storage);
			if (!(cleanOld in filesMap)) return false;
			filesMap[cleanNew] = filesMap[cleanOld];
			delete filesMap[cleanOld];
			writeBrowserMap(filesMap, storage);
			return true;
		},

		async deleteFile(relPath) {
			const clean = String(relPath || '').replace(/^\/+/, '');
			if (!clean) return false;
			if (backend === 'server') {
				const resp = await fetch(`./api/workspace/file?path=${encodeURIComponent(clean)}`, { method: 'DELETE' });
				return resp.ok;
			}
			if (backend === 'fsa' && dirHandle) {
				const { dir, fileName } = await getParentDirHandle(dirHandle, clean, false);
				await dir.removeEntry(fileName, { recursive: true });
				return true;
			}
			const filesMap = readBrowserMap(storage);
			delete filesMap[clean];
			for (const key of Object.keys(filesMap)) {
				if (key.startsWith(`${clean}/`)) delete filesMap[key];
			}
			writeBrowserMap(filesMap, storage);
			return true;
		},

		async setServerRoot(nextRoot) {
			const resp = await fetch('./api/workspace/root', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ root: nextRoot }),
			});
			const data = await resp.json();
			if (!resp.ok) throw new Error(data.error || 'Không thể mở thư mục');
			return { mode: 'server', root: data.root, tree: data.tree };
		},

		async pickLocalDirectory() {
			if (!('showDirectoryPicker' in globalThis)) {
				throw new Error('Trình duyệt hiện tại chưa hỗ trợ mở thư mục trực tiếp (hãy dùng Chrome/Edge hoặc lưu tự động trong trình duyệt).');
			}
			dirHandle = await globalThis.showDirectoryPicker({ mode: 'readwrite' });
			backend = 'fsa';
			return this.getTree();
		},

		resetBrowserWorkspace() {
			backend = 'browser';
			dirHandle = null;
			const starter = getStarterFilesMap();
			writeBrowserMap(starter, storage);
			return {
				mode: 'browser',
				root: 'Bộ nhớ trình duyệt (Static / GitHub Pages)',
				tree: buildTreeFromMap(starter),
			};
		},
	};
}
