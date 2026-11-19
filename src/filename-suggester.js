/**
 * Continuous Filename-Driven HTML & CSS Code Suggestion Engine.
 *
 * Analyzes the active file's name (English & Vietnamese tokens, compound slugs, camelCase),
 * inspects cursor context + already-written code, and links `.html` <-> `.css` files in the
 * workspace so suggestions keep flowing line-by-line or block-by-block as you code.
 */

const STOP_WORDS = new Set([
	'page', 'view', 'component', 'comp', 'section', 'part', 'module', 'template',
	'layout', 'screen', 'ui', 'web', 'html', 'css', 'scss', 'file', 'new', 'test', 'demo',
	'trang', 'mau', 'giao', 'dien', 'phan', 'khu', 'vuc',
]);

/**
 * Strip accents (including Vietnamese đ/Đ) and tokenize a file path into semantic words.
 */
export function analyzeFileName(filePath = 'index.html', languageOverride) {
	const cleanPath = String(filePath || 'untitled.html').replace(/\\/g, '/');
	const base = cleanPath.split('/').pop() || 'untitled.html';
	const dotIdx = base.lastIndexOf('.');
	const ext = dotIdx > 0 ? base.slice(dotIdx + 1).toLowerCase() : '';
	const rawName = dotIdx > 0 ? base.slice(0, dotIdx) : base;

	const normalized = rawName
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.toLowerCase();

	const tokens = normalized
		.split(/[^a-z0-9]+/)
		.filter(Boolean);

	const meaningTokens = tokens.filter(t => !STOP_WORDS.has(t));
	const effectiveTokens = meaningTokens.length ? meaningTokens : tokens;
	const slug = (effectiveTokens.join('-') || 'custom-view').replace(/^-+|-+$/g, '');
	const title = (tokens.length ? tokens : ['Custom', 'Page'])
		.map(w => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');

	const language = languageOverride || (ext === 'css' || ext === 'scss' ? 'css' : ext === 'js' || ext === 'mjs' ? 'javascript' : 'html');
	const archetype = matchArchetype(tokens, normalized);

	return {
		filePath: cleanPath,
		fileName: base,
		rawName,
		ext,
		language,
		tokens,
		meaningTokens: effectiveTokens,
		slug,
		title,
		archetype,
	};
}

const ARCHETYPE_KEYWORDS = [
	{ id: 'login', label: 'Đăng nhập / Auth', keywords: ['login', 'signin', 'sign-in', 'auth', 'authenticate', 'dang', 'nhap', 'dangnhap', 'sso'] },
	{ id: 'register', label: 'Đăng ký / Sign Up', keywords: ['register', 'signup', 'sign-up', 'create-account', 'dangky', 'ky', 'onboarding'] },
	{ id: 'navbar', label: 'Thanh điều hướng / Navbar', keywords: ['nav', 'navbar', 'header', 'topbar', 'menu', 'navigation', 'dieu', 'huong'] },
	{ id: 'footer', label: 'Chân trang / Footer', keywords: ['footer', 'bottom', 'chan', 'sitemap'] },
	{ id: 'pricing', label: 'Bảng giá / Pricing', keywords: ['pricing', 'price', 'plan', 'plans', 'tier', 'subscription', 'bang', 'gia', 'goi'] },
	{ id: 'dashboard', label: 'Bảng điều khiển / Dashboard', keywords: ['dashboard', 'admin', 'analytics', 'panel', 'metrics', 'overview', 'quan', 'tri', 'thong', 'ke'] },
	{ id: 'product', label: 'Thẻ sản phẩm / Product', keywords: ['product', 'products', 'shop', 'store', 'catalog', 'item', 'card', 'cards', 'san', 'pham', 'the'] },
	{ id: 'cart', label: 'Giỏ hàng & Thanh toán / Cart', keywords: ['cart', 'checkout', 'payment', 'basket', 'order', 'gio', 'hang', 'thanh', 'toan'] },
	{ id: 'profile', label: 'Hồ sơ người dùng / Profile', keywords: ['profile', 'account', 'user', 'member', 'avatar', 'bio', 'ho', 'so', 'tai', 'khoan'] },
	{ id: 'contact', label: 'Liên hệ / Contact', keywords: ['contact', 'support', 'feedback', 'help', 'lien', 'he', 'ho', 'tro'] },
	{ id: 'modal', label: 'Hộp thoại / Modal Dialog', keywords: ['modal', 'dialog', 'popup', 'drawer', 'overlay', 'hop', 'thoai'] },
	{ id: 'faq', label: 'Hỏi đáp / FAQ Accordion', keywords: ['faq', 'accordion', 'questions', 'hoi', 'dap', 'collapse'] },
	{ id: 'table', label: 'Bảng dữ liệu / Data Table', keywords: ['table', 'datatable', 'grid-list', 'users', 'orders', 'danh', 'sach'] },
	{ id: 'button', label: 'Hệ thống nút bấm / Buttons', keywords: ['button', 'buttons', 'btn', 'cta', 'nut'] },
	{ id: 'sidebar', label: 'Thanh bên / Sidebar', keywords: ['sidebar', 'sidenav', 'aside', 'rail', 'thanh', 'ben'] },
	{ id: 'gallery', label: 'Thư viện ảnh / Portfolio', keywords: ['gallery', 'portfolio', 'showcase', 'photo', 'photos', 'grid', 'thu', 'vien', 'anh', 'du', 'an'] },
	{ id: 'blog', label: 'Bài viết / Blog Article', keywords: ['blog', 'article', 'post', 'news', 'story', 'bai', 'viet', 'tin', 'tuc'] },
	{ id: '404', label: 'Trang lỗi 404 / Error', keywords: ['404', 'notfound', 'not-found', 'error', '403', '500', 'loi'] },
	{ id: 'toast', label: 'Thông báo / Toast & Alert', keywords: ['toast', 'alert', 'notification', 'banner', 'thong', 'bao'] },
	{ id: 'skeleton', label: 'Hiệu ứng tải / Skeleton & Loader', keywords: ['skeleton', 'loader', 'loading', 'spinner', 'shimmer'] },
	{ id: 'variables', label: 'Biến thiết kế & Theme / Design Tokens', keywords: ['variable', 'variables', 'token', 'tokens', 'theme', 'reset', 'base', 'global', 'style', 'styles', 'colors', 'palette', 'main', 'app'] },
	{ id: 'animations', label: 'Hoạt ảnh / CSS Animations', keywords: ['animation', 'animations', 'animate', 'keyframe', 'keyframes', 'motion', 'transition', 'hieu', 'ung'] },
	{ id: 'chat', label: 'Khung trò chuyện / Chat UI', keywords: ['chat', 'message', 'messages', 'inbox', 'conversation', 'tin', 'nhan'] },
	{ id: 'hero', label: 'Trang chủ & Hero / Landing', keywords: ['hero', 'landing', 'home', 'index', 'welcome', 'trang', 'chu'] },
];

const SECONDARY_LAYOUT_KEYWORDS = new Set(['card', 'cards', 'grid', 'panel', 'table', 'list', 'box', 'row', 'page']);

function matchArchetype(tokens, normalized) {
	// Combined Vietnamese bigram helper
	const tokenSet = new Set(tokens);
	const pairs = new Set();
	for (let i = 0; i < tokens.length - 1; i++) {
		pairs.add(`${tokens[i]}-${tokens[i + 1]}`);
		pairs.add(`${tokens[i]}${tokens[i + 1]}`);
	}

	let best = { id: 'custom', label: 'Custom Semantic Component', score: 0 };
	for (const entry of ARCHETYPE_KEYWORDS) {
		let score = 0;
		for (const kw of entry.keywords) {
			const isSecondary = SECONDARY_LAYOUT_KEYWORDS.has(kw);
			if (tokenSet.has(kw)) {
				score += isSecondary ? 5 : 12;
			} else if (pairs.has(kw)) {
				score += 16;
			} else if (!isSecondary && normalized.includes(kw) && kw.length >= 4) {
				score += 4;
			}
		}
		if (score > best.score) {
			best = { id: entry.id, label: entry.label, score };
		}
	}
	return best;
}

/**
 * Find the natural partner file in workspace:
 * - For `login.css` -> `login.html` (or HTML linking `login.css`, or `index.html`)
 * - For `login.html` -> `login.css` (or `style.css` / `styles.css`)
 */
export function findPartnerFile(filePath, allFiles = []) {
	const info = analyzeFileName(filePath);
	const targetExt = info.language === 'css' ? '.html' : '.css';
	const candidates = allFiles.filter(f => f.path !== info.filePath && f.path.toLowerCase().endsWith(targetExt));
	if (!candidates.length) return null;

	const sameBase = candidates.find(f => analyzeFileName(f.path).rawName.toLowerCase() === info.rawName.toLowerCase());
	if (sameBase) return sameBase;

	if (info.language === 'css') {
		const linkingHtml = candidates.find(f =>
			typeof f.content === 'string' && new RegExp(`href=["'][^"']*${escapeRegExp(info.fileName)}["']`, 'i').test(f.content)
		);
		if (linkingHtml) return linkingHtml;
		return candidates.find(f => /index\.html$/i.test(f.path)) || candidates[0];
	} else {
		// Check if current HTML links any workspace CSS file
		const current = allFiles.find(f => f.path === info.filePath);
		if (current?.content) {
			const m = current.content.match(/<link[^>]+href=["']([^"']+\.css)["']/i);
			if (m) {
				const linkedName = m[1].split('/').pop()?.toLowerCase();
				const matched = candidates.find(f => f.path.toLowerCase().endsWith(`/${linkedName}`) || f.path.toLowerCase() === linkedName);
				return matched || null;
			}
		}
		if (info.rawName.toLowerCase() === 'index') {
			return candidates.find(f => /(^|\/)style(s)?\.css$/i.test(f.path)) || null;
		}
		return null;
	}
}

export function extractHtmlSymbols(htmlContent = '') {
	const classes = [];
	const classSeen = new Set();
	for (const m of htmlContent.matchAll(/\bclass\s*=\s*["']([^"']+)["']/gi)) {
		for (const cls of m[1].split(/\s+/)) {
			const clean = cls.trim();
			if (clean && !classSeen.has(clean)) {
				classSeen.add(clean);
				classes.push(clean);
			}
		}
	}
	const ids = [];
	const idSeen = new Set();
	for (const m of htmlContent.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)) {
		const clean = m[1].trim();
		if (clean && !idSeen.has(clean)) {
			idSeen.add(clean);
			ids.push(clean);
		}
	}
	return { classes, ids };
}

export function extractDefinedCssSelectors(cssContent = '') {
	const defined = new Set();
	for (const m of cssContent.matchAll(/([.#][a-zA-Z_-][\w-]*)/g)) {
		defined.add(m[1]);
	}
	return defined;
}

function escapeRegExp(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function preferredCssHref(info, allFiles) {
	const sameCss = allFiles.find(f => analyzeFileName(f.path).rawName.toLowerCase() === info.rawName.toLowerCase() && f.path.endsWith('.css'));
	if (sameCss) return sameCss.path.split('/').pop();
	return `${info.rawName}.css`;
}

function htmlHeadSteps(info, cssHref) {
	return [
		{
			id: 'html-doctype-open',
			title: `Khởi tạo tài liệu HTML5 (${info.fileName})`,
			zone: 'root',
			marker: /<!doctype\s+html/i,
			lines: [
				'<!DOCTYPE html>',
				'<html lang="vi">',
				'<head>',
			],
		},
		{
			id: 'html-meta-charset',
			title: 'Khai báo meta charset & viewport chuẩn responsive',
			zone: 'head',
			marker: /<meta[^>]+charset/i,
			lines: [
				'  <meta charset="UTF-8" />',
				'  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
			],
		},
		{
			id: 'html-title-link',
			title: `Tiêu đề "${info.title}" & liên kết ${cssHref}`,
			zone: 'head',
			marker: /<title>/i,
			lines: [
				`  <title>${info.title}</title>`,
				`  <link rel="stylesheet" href="${cssHref}" />`,
				'</head>',
				'<body>',
			],
		},
	];
}

function htmlCloseStep() {
	return {
		id: 'html-close',
		title: 'Đóng thẻ </body> và </html>',
		zone: 'root',
		marker: /<\/body>/i,
		lines: [
			'</body>',
			'</html>',
		],
	};
}

/**
 * Build rich ordered HTML blueprint steps specifically tailored to the filename archetype.
 */
function buildHtmlBlueprint(info, allFiles) {
	const cssHref = preferredCssHref(info, allFiles);
	const head = htmlHeadSteps(info, cssHref);
	const tail = [htmlCloseStep()];
	const s = info.slug;

	const bodyByArchetype = {
		login: [
			{
				id: 'login-wrapper',
				title: 'Khung trang & thẻ Login Card',
				zone: 'body',
				marker: /class=["'][^"']*login-card/i,
				lines: [
					'  <main class="login-page">',
					'    <section class="login-card" aria-labelledby="login-title">',
				],
			},
			{
				id: 'login-header',
				title: 'Tiêu đề & mô tả đăng nhập',
				zone: 'main',
				marker: /<h1[^>]*>/i,
				lines: [
					'      <header class="login-header">',
					'        <span class="login-badge">Tài khoản</span>',
					'        <h1 id="login-title">Đăng nhập hệ thống</h1>',
					'        <p>Nhập email và mật khẩu để tiếp tục làm việc.</p>',
					'      </header>',
					'      <form class="login-form" action="#" method="post">',
				],
			},
			{
				id: 'login-email',
				title: 'Trường nhập Email (autocomplete="email")',
				zone: 'form',
				marker: /type=["']email["']|id=["']email["']/i,
				lines: [
					'        <div class="field-group">',
					'          <label for="email">Email</label>',
					'          <input id="email" name="email" type="email" autocomplete="email" placeholder="ban@example.com" required />',
					'        </div>',
				],
			},
			{
				id: 'login-password',
				title: 'Trường nhập Mật khẩu & ghi nhớ',
				zone: 'form',
				marker: /type=["']password["']|id=["']password["']/i,
				lines: [
					'        <div class="field-group">',
					'          <div class="field-row">',
					'            <label for="password">Mật khẩu</label>',
					'            <a class="forgot-link" href="#forgot">Quên mật khẩu?</a>',
					'          </div>',
					'          <input id="password" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required />',
					'        </div>',
					'        <label class="remember-check">',
					'          <input type="checkbox" name="remember" />',
					'          <span>Ghi nhớ đăng nhập</span>',
					'        </label>',
				],
			},
			{
				id: 'login-submit',
				title: 'Nút Đăng nhập & liên kết đăng ký',
				zone: 'form',
				marker: /type=["']submit["']|class=["'][^"']*btn-login/i,
				lines: [
					'        <button type="submit" class="btn-primary btn-login">Đăng nhập</button>',
					'      </form>',
					'      <footer class="login-footer">',
					'        <p>Chưa có tài khoản? <a href="register.html">Đăng ký ngay</a></p>',
					'      </footer>',
					'    </section>',
					'  </main>',
				],
			},
		],

		register: [
			{
				id: 'register-shell',
				title: 'Khung trang Đăng ký tài khoản',
				zone: 'body',
				marker: /class=["'][^"']*register-card/i,
				lines: [
					'  <main class="register-page">',
					'    <section class="register-card" aria-labelledby="reg-title">',
					'      <header class="register-header">',
					'        <h1 id="reg-title">Tạo tài khoản mới</h1>',
					'        <p>Miễn phí và chỉ mất chưa tới 1 phút.</p>',
					'      </header>',
					'      <form class="register-form" action="#" method="post">',
				],
			},
			{
				id: 'register-name',
				title: 'Trường Họ và tên',
				zone: 'form',
				marker: /id=["']fullname["']|autocomplete=["']name["']/i,
				lines: [
					'        <div class="field-group">',
					'          <label for="fullname">Họ và tên</label>',
					'          <input id="fullname" name="fullname" type="text" autocomplete="name" placeholder="Nguyễn Văn A" required />',
					'        </div>',
				],
			},
			{
				id: 'register-email',
				title: 'Trường Email đăng ký',
				zone: 'form',
				marker: /type=["']email["']/i,
				lines: [
					'        <div class="field-group">',
					'          <label for="reg-email">Email</label>',
					'          <input id="reg-email" name="email" type="email" autocomplete="email" placeholder="ban@example.com" required />',
					'        </div>',
				],
			},
			{
				id: 'register-passwords',
				title: 'Mật khẩu & Xác nhận mật khẩu',
				zone: 'form',
				marker: /autocomplete=["']new-password["']/i,
				lines: [
					'        <div class="field-grid">',
					'          <div class="field-group">',
					'            <label for="new-password">Mật khẩu</label>',
					'            <input id="new-password" name="password" type="password" autocomplete="new-password" minlength="8" required />',
					'          </div>',
					'          <div class="field-group">',
					'            <label for="confirm-password">Xác nhận</label>',
					'            <input id="confirm-password" name="confirm" type="password" autocomplete="new-password" minlength="8" required />',
					'          </div>',
					'        </div>',
				],
			},
			{
				id: 'register-submit',
				title: 'Điều khoản & Nút tạo tài khoản',
				zone: 'form',
				marker: /type=["']submit["']/i,
				lines: [
					'        <label class="terms-check">',
					'          <input type="checkbox" required />',
					'          <span>Tôi đồng ý với điều khoản sử dụng</span>',
					'        </label>',
					'        <button type="submit" class="btn-primary">Đăng ký tài khoản</button>',
					'      </form>',
					'    </section>',
					'  </main>',
				],
			},
		],

		navbar: [
			{
				id: 'nav-header',
				title: 'Header & Logo thương hiệu',
				zone: 'body',
				marker: /class=["'][^"']*navbar/i,
				lines: [
					'  <header class="navbar">',
					'    <div class="navbar-inner">',
					'      <a class="navbar-brand" href="#">',
					'        <span class="brand-dot" aria-hidden="true"></span>',
					'        <span>BrandStudio</span>',
					'      </a>',
				],
			},
			{
				id: 'nav-links',
				title: 'Danh sách liên kết điều hướng (<nav>)',
				zone: 'body',
				marker: /<nav[^>]*>/i,
				lines: [
					'      <nav class="navbar-menu" aria-label="Điều hướng chính">',
					'        <ul class="nav-list">',
					'          <li><a href="#features" aria-current="page">Tính năng</a></li>',
					'          <li><a href="#pricing">Bảng giá</a></li>',
					'          <li><a href="#docs">Tài liệu</a></li>',
					'          <li><a href="#contact">Liên hệ</a></li>',
					'        </ul>',
					'      </nav>',
				],
			},
			{
				id: 'nav-actions',
				title: 'Cụm nút CTA & Mobile Toggle',
				zone: 'body',
				marker: /class=["'][^"']*navbar-actions/i,
				lines: [
					'      <div class="navbar-actions">',
					'        <a class="btn-ghost" href="login.html">Đăng nhập</a>',
					'        <a class="btn-primary" href="register.html">Bắt đầu ngay</a>',
					'        <button type="button" class="nav-toggle" aria-label="Mở menu" aria-expanded="false">☰</button>',
					'      </div>',
					'    </div>',
					'  </header>',
				],
			},
		],

		pricing: [
			{
				id: 'pricing-header',
				title: 'Tiêu đề section Bảng giá',
				zone: 'body',
				marker: /class=["'][^"']*pricing-section/i,
				lines: [
					'  <main class="pricing-section">',
					'    <header class="pricing-header">',
					'      <span class="pricing-eyebrow">Bảng giá minh bạch</span>',
					'      <h1>Chọn gói phù hợp với đội ngũ của bạn</h1>',
					'      <p>Nâng cấp hoặc hủy bất kỳ lúc nào, không phí ẩn.</p>',
					'    </header>',
					'    <div class="pricing-grid">',
				],
			},
			{
				id: 'pricing-starter',
				title: 'Thẻ gói Cơ bản (Starter)',
				zone: 'main',
				marker: /Starter|Cơ bản/i,
				lines: [
					'      <article class="pricing-card">',
					'        <h2>Starter</h2>',
					'        <p class="price"><strong>0đ</strong><span>/tháng</span></p>',
					'        <ul class="feature-list">',
					'          <li>3 dự án HTML/CSS</li>',
					'          <li>Live Preview tức thì</li>',
					'          <li>Gợi ý code theo tên file</li>',
					'        </ul>',
					'        <a class="btn-secondary" href="#start">Dùng miễn phí</a>',
					'      </article>',
				],
			},
			{
				id: 'pricing-pro',
				title: 'Thẻ gói Phổ biến (Pro)',
				zone: 'main',
				marker: /pricing-card--featured|Pro/i,
				lines: [
					'      <article class="pricing-card pricing-card--featured">',
					'        <span class="popular-badge">Phổ biến nhất</span>',
					'        <h2>Pro</h2>',
					'        <p class="price"><strong>199k</strong><span>/tháng</span></p>',
					'        <ul class="feature-list">',
					'          <li>Không giới hạn dự án</li>',
					'          <li>Liên kết chéo HTML ↔ CSS tự động</li>',
					'          <li>Gợi ý cấu trúc & CSS theo tên file</li>',
					'        </ul>',
					'        <a class="btn-primary" href="#pro">Chọn gói Pro</a>',
					'      </article>',
				],
			},
			{
				id: 'pricing-enterprise',
				title: 'Thẻ gói Doanh nghiệp & đóng lưới',
				zone: 'main',
				marker: /Enterprise/i,
				lines: [
					'      <article class="pricing-card">',
					'        <h2>Enterprise</h2>',
					'        <p class="price"><strong>499k</strong><span>/tháng</span></p>',
					'        <ul class="feature-list">',
					'          <li>Design tokens dùng chung cho team</li>',
					'          <li>Kiểm tra chuẩn Accessibility WCAG</li>',
					'          <li>Hỗ trợ kỹ thuật ưu tiên 24/7</li>',
					'        </ul>',
					'        <a class="btn-secondary" href="contact.html">Liên hệ tư vấn</a>',
					'      </article>',
					'    </div>',
					'  </main>',
				],
			},
		],

		dashboard: [
			{
				id: 'dash-shell',
				title: 'Khung Dashboard & Sidebar điều hướng',
				zone: 'body',
				marker: /class=["'][^"']*dashboard-layout/i,
				lines: [
					'  <div class="dashboard-layout">',
					'    <aside class="dash-sidebar" aria-label="Menu quản trị">',
					'      <div class="dash-brand">AdminPulse</div>',
					'      <nav class="dash-nav">',
					'        <a class="active" href="#">Tổng quan</a>',
					'        <a href="#">Đơn hàng</a>',
					'        <a href="#">Khách hàng</a>',
					'        <a href="#">Cài đặt</a>',
					'      </nav>',
					'    </aside>',
					'    <div class="dash-main">',
				],
			},
			{
				id: 'dash-topbar',
				title: 'Thanh Topbar tìm kiếm & người dùng',
				zone: 'main',
				marker: /class=["'][^"']*dash-topbar/i,
				lines: [
					'      <header class="dash-topbar">',
					'        <h1>Tổng quan hiệu suất</h1>',
					'        <search>',
					'          <input class="dash-search" type="search" placeholder="Tìm nhanh..." aria-label="Tìm kiếm" />',
					'        </search>',
					'      </header>',
				],
			},
			{
				id: 'dash-kpis',
				title: 'Lưới thẻ chỉ số KPI (Stats Grid)',
				zone: 'main',
				marker: /class=["'][^"']*kpi-grid/i,
				lines: [
					'      <section class="kpi-grid" aria-label="Chỉ số chính">',
					'        <article class="kpi-card"><span>Doanh thu</span><strong>128.4M</strong><small class="trend up">+14.2%</small></article>',
					'        <article class="kpi-card"><span>Người dùng mới</span><strong>2,480</strong><small class="trend up">+8.6%</small></article>',
					'        <article class="kpi-card"><span>Tỷ lệ chuyển đổi</span><strong>4.32%</strong><small class="trend up">+0.9%</small></article>',
					'      </section>',
				],
			},
			{
				id: 'dash-table',
				title: 'Bảng hoạt động gần đây & đóng layout',
				zone: 'main',
				marker: /class=["'][^"']*dash-table/i,
				lines: [
					'      <section class="dash-panel">',
					'        <h2>Giao dịch gần đây</h2>',
					'        <table class="dash-table">',
					'          <thead><tr><th>Mã</th><th>Khách hàng</th><th>Trạng thái</th><th>Giá trị</th></tr></thead>',
					'          <tbody>',
					'            <tr><td>#ORD-1024</td><td>Minh Anh</td><td><span class="status-pill ok">Hoàn tất</span></td><td>1.250.000đ</td></tr>',
					'            <tr><td>#ORD-1025</td><td>Quốc Bảo</td><td><span class="status-pill wait">Đang xử lý</span></td><td>680.000đ</td></tr>',
					'          </tbody>',
					'        </table>',
					'      </section>',
					'    </div>',
					'  </div>',
				],
			},
		],

		product: [
			{
				id: 'prod-section',
				title: 'Lưới danh sách sản phẩm',
				zone: 'body',
				marker: /class=["'][^"']*product-grid/i,
				lines: [
					'  <main class="product-section">',
					'    <header class="section-header">',
					`      <h1>${info.title}</h1>`,
					'      <p>Thiết kế tinh gọn, hiển thị sắc nét trên mọi màn hình.</p>',
					'    </header>',
					'    <section class="product-grid">',
				],
			},
			{
				id: 'prod-card-1',
				title: 'Thẻ sản phẩm #1 (Badge, Giá, Nút mua)',
				zone: 'main',
				marker: /class=["'][^"']*product-card/i,
				lines: [
					'      <article class="product-card">',
					'        <div class="product-media"><span class="product-badge">Mới</span></div>',
					'        <div class="product-body">',
					'          <h2 class="product-title">Bàn phím cơ Wireless 75%</h2>',
					'          <p class="product-desc">Switch êm, pin 200 giờ, kết nối đa thiết bị.</p>',
					'          <div class="product-footer">',
					'            <strong class="product-price">1.890.000đ</strong>',
					'            <button type="button" class="btn-primary">Thêm vào giỏ</button>',
					'          </div>',
					'        </div>',
					'      </article>',
				],
			},
			{
				id: 'prod-card-2',
				title: 'Thẻ sản phẩm #2 & đóng lưới',
				zone: 'main',
				marker: /product-card.*product-card/s,
				lines: [
					'      <article class="product-card">',
					'        <div class="product-media"><span class="product-badge sale">-20%</span></div>',
					'        <div class="product-body">',
					'          <h2 class="product-title">Chuột công thái học Pro</h2>',
					'          <p class="product-desc">Cảm biến chính xác, thiết kế nhẹ 58g.</p>',
					'          <div class="product-footer">',
					'            <strong class="product-price">1.150.000đ</strong>',
					'            <button type="button" class="btn-primary">Thêm vào giỏ</button>',
					'          </div>',
					'        </div>',
					'      </article>',
					'    </section>',
					'  </main>',
				],
			},
		],

		cart: [
			{
				id: 'cart-shell',
				title: 'Khung Giỏ hàng & Thanh toán 2 cột',
				zone: 'body',
				marker: /class=["'][^"']*checkout-layout/i,
				lines: [
					'  <main class="checkout-layout">',
					'    <section class="cart-items" aria-labelledby="cart-title">',
					'      <h1 id="cart-title">Giỏ hàng của bạn</h1>',
					'      <article class="cart-row">',
					'        <div class="cart-thumb"></div>',
					'        <div class="cart-info"><h2>Tai nghe Studio ANC</h2><p>Màu: Đen nhám • Số lượng: 1</p></div>',
					'        <strong class="cart-price">2.490.000đ</strong>',
					'      </article>',
					'    </section>',
				],
			},
			{
				id: 'cart-summary',
				title: 'Tóm tắt đơn hàng & nút thanh toán',
				zone: 'main',
				marker: /class=["'][^"']*order-summary/i,
				lines: [
					'    <aside class="order-summary">',
					'      <h2>Tóm tắt đơn hàng</h2>',
					'      <dl class="summary-lines">',
					'        <div><dt>Tạm tính</dt><dd>2.490.000đ</dd></div>',
					'        <div><dt>Vận chuyển</dt><dd>Miễn phí</dd></div>',
					'        <div class="total"><dt>Tổng cộng</dt><dd>2.490.000đ</dd></div>',
					'      </dl>',
					'      <button type="button" class="btn-primary btn-checkout">Thanh toán ngay</button>',
					'    </aside>',
					'  </main>',
				],
			},
		],

		footer: [
			{
				id: 'footer-main',
				title: 'Footer nhiều cột + Form nhận tin',
				zone: 'body',
				marker: /<footer/i,
				lines: [
					'  <footer class="site-footer">',
					'    <div class="footer-grid">',
					'      <div class="footer-brand">',
					'        <strong>CodeFlow Studio</strong>',
					'        <p>Xây dựng giao diện web hiện đại nhanh gấp 3 lần.</p>',
					'      </div>',
					'      <nav class="footer-col" aria-label="Sản phẩm">',
					'        <h3>Sản phẩm</h3>',
					'        <a href="#">Tính năng</a>',
					'        <a href="#">Bảng giá</a>',
					'        <a href="#">Mẫu giao diện</a>',
					'      </nav>',
					'      <form class="footer-newsletter">',
					'        <h3>Nhận bản tin</h3>',
					'        <div class="newsletter-row">',
					'          <input type="email" placeholder="email@domain.com" aria-label="Email nhận tin" required />',
					'          <button type="submit" class="btn-primary">Đăng ký</button>',
					'        </div>',
					'      </form>',
					'    </div>',
					'    <p class="footer-copy">© 2026 CodeFlow Studio. Bảo lưu mọi quyền.</p>',
					'  </footer>',
				],
			},
		],

		contact: [
			{
				id: 'contact-shell',
				title: 'Khu vực Liên hệ 2 cột (Thông tin + Form)',
				zone: 'body',
				marker: /class=["'][^"']*contact-section/i,
				lines: [
					'  <main class="contact-section">',
					'    <div class="contact-info">',
					'      <h1>Liên hệ với chúng tôi</h1>',
					'      <p>Đội ngũ kỹ thuật phản hồi trong vòng 2 giờ làm việc.</p>',
					'      <ul class="contact-meta">',
					'        <li>Email: hello@example.com</li>',
					'        <li>Hotline: 1900 1234</li>',
					'      </ul>',
					'    </div>',
					'    <form class="contact-form" action="#" method="post">',
					'      <label for="c-name">Họ tên</label>',
					'      <input id="c-name" type="text" autocomplete="name" required />',
					'      <label for="c-email">Email</label>',
					'      <input id="c-email" type="email" autocomplete="email" required />',
					'      <label for="c-msg">Nội dung</label>',
					'      <textarea id="c-msg" rows="4" required></textarea>',
					'      <button type="submit" class="btn-primary">Gửi tin nhắn</button>',
					'    </form>',
					'  </main>',
				],
			},
		],

		modal: [
			{
				id: 'modal-native',
				title: 'Native Accessible Modal (<dialog closedby="any">)',
				zone: 'body',
				marker: /<dialog/i,
				lines: [
					'  <div class="modal-demo">',
					'    <button type="button" class="btn-primary" id="open-modal-btn">Mở hộp thoại</button>',
					'  </div>',
					'  <dialog id="app-modal" class="app-modal" closedby="any" aria-labelledby="modal-title">',
					'    <form method="dialog" class="modal-card">',
					'      <header class="modal-header">',
					'        <h2 id="modal-title">Xác nhận thao tác</h2>',
					'        <button type="submit" class="modal-close" aria-label="Đóng">✕</button>',
					'      </header>',
					'      <p class="modal-body">Bạn có chắc chắn muốn lưu các thay đổi hiện tại không?</p>',
					'      <footer class="modal-actions">',
					'        <button type="submit" value="cancel" class="btn-secondary">Hủy</button>',
					'        <button type="submit" value="confirm" class="btn-primary">Xác nhận</button>',
					'      </footer>',
					'    </form>',
					'  </dialog>',
				],
			},
		],

		faq: [
			{
				id: 'faq-accordion',
				title: 'Accordion Hỏi đáp dùng <details name="faq">',
				zone: 'body',
				marker: /<details/i,
				lines: [
					'  <main class="faq-section">',
					'    <header class="faq-header">',
					'      <h1>Câu hỏi thường gặp</h1>',
					'      <p>Giải đáp nhanh về cách hoạt động của hệ thống.</p>',
					'    </header>',
					'    <section class="faq-list" aria-label="Danh sách câu hỏi">',
					'      <details name="faq" open>',
					'        <summary>Gợi ý code theo tên file hoạt động như thế nào?</summary>',
					'        <p>IDE tự phân tích tên file HTML/CSS và ngữ cảnh dòng đang gõ để đề xuất ghost text liên tục.</p>',
					'      </details>',
					'      <details name="faq">',
					'        <summary>IDE gợi ý code cho những loại file nào?</summary>',
					'        <p>IDE tự động gợi ý liên tục cho mọi file HTML và CSS dựa trên tên file và ngữ cảnh đang viết.</p>',
					'      </details>',
					'    </section>',
					'  </main>',
				],
			},
		],

		profile: [
			{
				id: 'profile-card',
				title: 'Thẻ Hồ sơ cá nhân & chỉ số hoạt động',
				zone: 'body',
				marker: /class=["'][^"']*profile-card/i,
				lines: [
					'  <main class="profile-page">',
					'    <article class="profile-card">',
					'      <div class="profile-cover"></div>',
					'      <div class="profile-body">',
					'        <div class="profile-avatar" aria-hidden="true">MA</div>',
					'        <h1>Minh Anh Nguyễn</h1>',
					'        <p class="profile-role">Frontend Architect • UI Systems</p>',
					'        <div class="profile-stats">',
					'          <div><strong>48</strong><span>Dự án</span></div>',
					'          <div><strong>1.2k</strong><span>Lượt thích</span></div>',
					'          <div><strong>99%</strong><span>Hoàn thành</span></div>',
					'        </div>',
					'        <div class="profile-actions">',
					'          <button type="button" class="btn-primary">Theo dõi</button>',
					'          <button type="button" class="btn-secondary">Nhắn tin</button>',
					'        </div>',
					'      </div>',
					'    </article>',
					'  </main>',
				],
			},
		],

		'404': [
			{
				id: 'error-404',
				title: 'Trang báo lỗi 404 & nút quay về trang chủ',
				zone: 'body',
				marker: /404|error-page/i,
				lines: [
					'  <main class="error-page">',
					'    <span class="error-code">404</span>',
					'    <h1>Không tìm thấy trang bạn yêu cầu</h1>',
					'    <p>Liên kết có thể đã thay đổi hoặc không còn tồn tại.</p>',
					'    <div class="error-actions">',
					'      <a class="btn-primary" href="index.html">Về trang chủ</a>',
					'      <a class="btn-secondary" href="contact.html">Báo lỗi</a>',
					'    </div>',
					'  </main>',
				],
			},
		],

		hero: [
			{
				id: 'hero-header',
				title: 'Thanh điều hướng đầu trang',
				zone: 'body',
				marker: /<header/i,
				lines: [
					'  <header class="site-header">',
					'    <a class="brand" href="#">Aurora UI</a>',
					'    <nav class="nav-links" aria-label="Điều hướng chính">',
					'      <a href="#features">Tính năng</a>',
					'      <a href="pricing.html">Bảng giá</a>',
					'      <a href="login.html">Đăng nhập</a>',
					'    </nav>',
					'  </header>',
				],
			},
			{
				id: 'hero-main',
				title: 'Hero Banner trung tâm & CTA',
				zone: 'main',
				marker: /class=["'][^"']*hero/i,
				lines: [
					'  <main class="hero">',
					'    <span class="hero-badge">HTML & CSS thế hệ mới</span>',
					`    <h1>${info.title}</h1>`,
					'    <p>Xây dựng giao diện nhanh chóng với gợi ý ngữ nghĩa thông minh và thiết kế responsive chuẩn chỉnh.</p>',
					'    <div class="hero-actions">',
					'      <a class="btn-primary" href="#start">Bắt đầu ngay</a>',
					'      <a class="btn-secondary" href="#demo">Xem demo</a>',
					'    </div>',
					'  </main>',
				],
			},
		],
	};

	const chosenBody = bodyByArchetype[info.archetype.id] || [
		{
			id: `custom-${s}-header`,
			title: `Phần đầu trang ${info.title}`,
			zone: 'body',
			marker: new RegExp(`class=["'][^"']*${escapeRegExp(s)}`, 'i'),
			lines: [
				`  <main class="${s}-page">`,
				`    <header class="${s}-header">`,
				`      <span class="${s}-badge">${info.rawName}</span>`,
				`      <h1>${info.title}</h1>`,
				`      <p>Bố cục gợi ý tự động theo tên file <code>${info.fileName}</code>.</p>`,
				'    </header>',
			],
		},
		{
			id: `custom-${s}-grid`,
			title: `Lưới nội dung .${s}-grid & thẻ .${s}-card`,
			zone: 'main',
			marker: new RegExp(`${escapeRegExp(s)}-grid|${escapeRegExp(s)}-card`, 'i'),
			lines: [
				`    <section class="${s}-grid">`,
				`      <article class="${s}-card">`,
				`        <h2>Thành phần chính</h2>`,
				`        <p>Chỉnh sửa nội dung hoặc nhấn Tab để hoàn thiện cấu trúc cho ${info.fileName}.</p>`,
				`        <button type="button" class="${s}-btn">Thao tác</button>`,
				'      </article>',
				`      <article class="${s}-card">`,
				`        <h2>Thông tin bổ sung</h2>`,
				'        <p>Các class mới thêm sẽ tự động được gợi ý CSS ở file style tương ứng.</p>',
				`        <button type="button" class="${s}-btn-outline">Chi tiết</button>`,
				'      </article>',
				'    </section>',
				'  </main>',
			],
		},
	];

	return [...head, ...chosenBody, ...tail];
}

/**
 * Build CSS blueprint steps tailored to the filename archetype.
 */
function buildCssBlueprint(info) {
	const s = info.slug;
	const tokensStep = {
		id: 'css-tokens',
		title: 'Khai báo Design Tokens (:root) & base layout',
		selector: ':root',
		marker: /:root\s*\{/,
		lines: [
			':root {',
			'  --bg: #0b1120;',
			'  --surface: #111827;',
			'  --surface-2: #1e293b;',
			'  --text: #f1f5f9;',
			'  --muted: #94a3b8;',
			'  --accent: #38bdf8;',
			'  --accent-contrast: #082f49;',
			'  --border: rgba(148, 163, 184, 0.22);',
			'  --radius: 14px;',
			'}',
			'',
			'*, *::before, *::after {',
			'  box-sizing: border-box;',
			'}',
			'',
			'body {',
			'  margin: 0;',
			'  min-height: 100vh;',
			'  font-family: system-ui, -apple-system, sans-serif;',
			'  background: var(--bg);',
			'  color: var(--text);',
			'  line-height: 1.5;',
			'}',
		],
	};

	const byArchetype = {
		login: [
			tokensStep,
			{
				id: 'css-login-page',
				title: '.login-page (căn giữa toàn màn hình)',
				selector: '.login-page',
				marker: /\.login-page\s*\{/,
				lines: [
					'.login-page {',
					'  min-height: 100vh;',
					'  display: grid;',
					'  place-items: center;',
					'  padding: 1.5rem;',
					'  background: radial-gradient(circle at top, #172554, var(--bg) 60%);',
					'}',
				],
			},
			{
				id: 'css-login-card',
				title: '.login-card (thẻ kính nổi hiện đại)',
				selector: '.login-card',
				marker: /\.login-card\s*\{/,
				lines: [
					'.login-card {',
					'  width: min(100%, 420px);',
					'  padding: 2rem;',
					'  border-radius: var(--radius);',
					'  background: var(--surface);',
					'  border: 1px solid var(--border);',
					'  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);',
					'}',
				],
			},
			{
				id: 'css-login-form',
				title: '.login-form & .field-group',
				selector: '.login-form',
				marker: /\.login-form\s*\{/,
				lines: [
					'.login-form {',
					'  display: grid;',
					'  gap: 1rem;',
					'  margin-top: 1.25rem;',
					'}',
					'',
					'.field-group {',
					'  display: grid;',
					'  gap: 0.4rem;',
					'}',
					'',
					'.field-group input {',
					'  width: 100%;',
					'  padding: 0.7rem 0.9rem;',
					'  border-radius: 0.6rem;',
					'  border: 1px solid var(--border);',
					'  background: var(--bg);',
					'  color: var(--text);',
					'  font: inherit;',
					'}',
					'',
					'.field-group input:focus-visible {',
					'  outline: 2px solid var(--accent);',
					'  outline-offset: 2px;',
					'}',
				],
			},
			{
				id: 'css-login-btn',
				title: '.btn-primary (nút đăng nhập + hiệu ứng hover)',
				selector: '.btn-primary',
				marker: /\.btn-primary\s*\{/,
				lines: [
					'.btn-primary {',
					'  width: 100%;',
					'  padding: 0.8rem 1.2rem;',
					'  border: 0;',
					'  border-radius: 0.65rem;',
					'  background: var(--accent);',
					'  color: var(--accent-contrast);',
					'  font: inherit;',
					'  font-weight: 700;',
					'  cursor: pointer;',
					'  transition: transform 0.15s ease, filter 0.15s ease;',
					'}',
					'',
					'.btn-primary:hover {',
					'  filter: brightness(1.08);',
					'  transform: translateY(-1px);',
					'}',
				],
			},
		],

		navbar: [
			tokensStep,
			{
				id: 'css-navbar',
				title: '.navbar (sticky backdrop blur)',
				selector: '.navbar',
				marker: /\.navbar\s*\{/,
				lines: [
					'.navbar {',
					'  position: sticky;',
					'  top: 0;',
					'  z-index: 20;',
					'  background: rgba(11, 17, 32, 0.85);',
					'  backdrop-filter: blur(12px);',
					'  border-bottom: 1px solid var(--border);',
					'}',
					'',
					'.navbar-inner {',
					'  max-width: 1120px;',
					'  margin: 0 auto;',
					'  padding: 0.85rem 1.5rem;',
					'  display: flex;',
					'  align-items: center;',
					'  justify-content: space-between;',
					'  gap: 1.5rem;',
					'}',
				],
			},
			{
				id: 'css-nav-list',
				title: '.nav-list & liên kết trạng thái hover',
				selector: '.nav-list',
				marker: /\.nav-list\s*\{/,
				lines: [
					'.nav-list {',
					'  display: flex;',
					'  list-style: none;',
					'  margin: 0;',
					'  padding: 0;',
					'  gap: 1.25rem;',
					'}',
					'',
					'.nav-list a {',
					'  color: var(--muted);',
					'  text-decoration: none;',
					'  font-weight: 500;',
					'}',
					'',
					'.nav-list a:hover, .nav-list a[aria-current="page"] {',
					'  color: var(--text);',
					'}',
				],
			},
		],

		button: [
			{
				id: 'css-btn-base',
				title: '.btn nền tảng & accessibility focus-visible',
				selector: '.btn',
				marker: /\.btn\s*\{/,
				lines: [
					'.btn {',
					'  display: inline-flex;',
					'  align-items: center;',
					'  justify-content: center;',
					'  gap: 0.5rem;',
					'  min-height: 40px;',
					'  padding: 0.65rem 1.25rem;',
					'  border-radius: 0.65rem;',
					'  border: 1px solid transparent;',
					'  font: inherit;',
					'  font-weight: 600;',
					'  cursor: pointer;',
					'  transition: transform 0.15s ease, background-color 0.15s ease;',
					'}',
					'',
					'.btn:focus-visible {',
					'  outline: 2px solid #38bdf8;',
					'  outline-offset: 2px;',
					'}',
				],
			},
			{
				id: 'css-btn-variants',
				title: '.btn-primary, .btn-secondary & :disabled',
				selector: '.btn-primary',
				marker: /\.btn-primary\s*\{/,
				lines: [
					'.btn-primary {',
					'  background: #38bdf8;',
					'  color: #082f49;',
					'}',
					'',
					'.btn-primary:hover:not(:disabled) {',
					'  background: #7dd3fc;',
					'}',
					'',
					'.btn-secondary {',
					'  background: transparent;',
					'  border-color: rgba(148, 163, 184, 0.35);',
					'  color: #e2e8f0;',
					'}',
					'',
					'.btn:disabled {',
					'  opacity: 0.5;',
					'  cursor: not-allowed;',
					'}',
				],
			},
		],

		variables: [
			{
				id: 'css-vars-system',
				title: ':root Design Tokens (Màu sắc, Font, Khoảng cách, Bo góc)',
				selector: ':root',
				marker: /:root\s*\{/,
				lines: [
					':root {',
					'  color-scheme: light dark;',
					'  --bg: light-dark(#f8fafc, #0b1120);',
					'  --surface: light-dark(#ffffff, #111827);',
					'  --text: light-dark(#0f172a, #f1f5f9);',
					'  --muted: light-dark(#475569, #94a3b8);',
					'  --accent: light-dark(#0284c7, #38bdf8);',
					'  --border: light-dark(#e2e8f0, rgba(148, 163, 184, 0.22));',
					'  --space-sm: 0.5rem;',
					'  --space-md: 1rem;',
					'  --space-lg: 2rem;',
					'  --radius-md: 0.75rem;',
					'}',
				],
			},
			{
				id: 'css-vars-base',
				title: 'Base typography & focus ring defaults',
				selector: 'body',
				marker: /body\s*\{/,
				lines: [
					'body {',
					'  margin: 0;',
					'  background: var(--bg);',
					'  color: var(--text);',
					'  font-family: system-ui, -apple-system, sans-serif;',
					'  line-height: 1.6;',
					'}',
					'',
					':focus-visible {',
					'  outline: 2px solid var(--accent);',
					'  outline-offset: 2px;',
					'}',
				],
			},
		],

		animations: [
			{
				id: 'css-keyframes',
				title: '@keyframes fade-up & pulse-glow',
				selector: '@keyframes fade-up',
				marker: /@keyframes\s+/i,
				lines: [
					'@keyframes fade-up {',
					'  from {',
					'    opacity: 0;',
					'    transform: translateY(12px);',
					'  }',
					'  to {',
					'    opacity: 1;',
					'    transform: translateY(0);',
					'  }',
					'}',
					'',
					'.animate-fade-up {',
					'  animation: fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;',
					'}',
				],
			},
			{
				id: 'css-reduced-motion',
				title: '@media (prefers-reduced-motion: reduce)',
				selector: '@media (prefers-reduced-motion: reduce)',
				marker: /prefers-reduced-motion/i,
				lines: [
					'@media (prefers-reduced-motion: reduce) {',
					'  *, *::before, *::after {',
					'    animation-duration: 0.01ms !important;',
					'    transition-duration: 0.01ms !important;',
					'  }',
					'}',
				],
			},
		],
	};

	if (byArchetype[info.archetype.id]) {
		return byArchetype[info.archetype.id];
	}

	return [
		tokensStep,
		{
			id: `css-${s}-layout`,
			title: `.${s}-page & .${s}-header`,
			selector: `.${s}-page`,
			marker: new RegExp(`\\.${escapeRegExp(s)}-page\\s*\\{`),
			lines: [
				`.${s}-page {`,
				'  max-width: 1120px;',
				'  margin: 0 auto;',
				'  padding: 2.5rem 1.5rem;',
				'}',
				'',
				`.${s}-header {`,
				'  margin-bottom: 2rem;',
				'}',
			],
		},
		{
			id: `css-${s}-grid-card`,
			title: `.${s}-grid & .${s}-card (Responsive Grid + Card)`,
			selector: `.${s}-grid`,
			marker: new RegExp(`\\.${escapeRegExp(s)}-grid\\s*\\{`),
			lines: [
				`.${s}-grid {`,
				'  display: grid;',
				'  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));',
				'  gap: 1.25rem;',
				'}',
				'',
				`.${s}-card {`,
				'  padding: 1.5rem;',
				'  border-radius: var(--radius);',
				'  background: var(--surface);',
				'  border: 1px solid var(--border);',
				'}',
			],
		},
	];
}

/**
 * Synthesize an idiomatic CSS rule block for a class or ID extracted from a linked HTML file!
 */
export function buildCssRuleForSymbol(symbol, isId = false) {
	const prefix = isId ? '#' : '.';
	const sel = `${prefix}${symbol}`;
	const props = getPropertiesForSelectorRole(symbol);
	return [
		`${sel} {`,
		...props.map(p => `  ${p}`),
		'}',
	];
}

export function getPropertiesForSelectorRole(selectorRaw = '') {
	const s = selectorRaw.toLowerCase();
	if (s === ':root') {
		return [
			'--bg: #0b1120;',
			'--surface: #111827;',
			'--text: #f1f5f9;',
			'--accent: #38bdf8;',
			'--border: rgba(148, 163, 184, 0.22);',
		];
	}
	if (s === 'body') {
		return [
			'margin: 0;',
			'min-height: 100vh;',
			'font-family: system-ui, -apple-system, sans-serif;',
			'background: var(--bg, #0b1120);',
			'color: var(--text, #f1f5f9);',
		];
	}
	if (/(btn|button|cta|submit)/.test(s)) {
		return [
			'display: inline-flex;',
			'align-items: center;',
			'justify-content: center;',
			'gap: 0.5rem;',
			'padding: 0.7rem 1.25rem;',
			'border: 0;',
			'border-radius: 0.65rem;',
			'background: var(--accent, #38bdf8);',
			'color: #082f49;',
			'font-weight: 700;',
			'cursor: pointer;',
		];
	}
	if (/(card|panel|modal|box|summary)/.test(s)) {
		return [
			'padding: 1.5rem;',
			'border-radius: 14px;',
			'background: var(--surface, #111827);',
			'color: var(--text, #f1f5f9);',
			'border: 1px solid var(--border, rgba(148, 163, 184, 0.22));',
			'box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);',
		];
	}
	if (/(grid|pricing-grid|kpi-grid)/.test(s)) {
		return [
			'display: grid;',
			'grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));',
			'gap: 1.25rem;',
		];
	}
	if (/(nav|header|topbar|row|actions|footer-row|field-row)/.test(s)) {
		return [
			'display: flex;',
			'align-items: center;',
			'justify-content: space-between;',
			'gap: 1rem;',
		];
	}
	if (/(form|field-group|stack|list)/.test(s)) {
		return [
			'display: grid;',
			'gap: 0.85rem;',
		];
	}
	if (/(input|search|textarea|select)/.test(s)) {
		return [
			'width: 100%;',
			'padding: 0.65rem 0.9rem;',
			'border-radius: 0.6rem;',
			'border: 1px solid var(--border, rgba(148, 163, 184, 0.25));',
			'background: var(--bg, #0b1120);',
			'color: var(--text, #f1f5f9);',
			'font: inherit;',
		];
	}
	if (/(badge|pill|tag|eyebrow)/.test(s)) {
		return [
			'display: inline-block;',
			'padding: 0.25rem 0.7rem;',
			'border-radius: 999px;',
			'background: rgba(56, 189, 248, 0.14);',
			'color: var(--accent, #38bdf8);',
			'font-size: 0.8rem;',
			'font-weight: 600;',
		];
	}
	if (/(page|section|container|layout)/.test(s)) {
		return [
			'max-width: 1120px;',
			'margin: 0 auto;',
			'padding: 2rem 1.5rem;',
		];
	}
	if (/(link|forgot)/.test(s)) {
		return [
			'color: var(--accent, #38bdf8);',
			'text-decoration: none;',
			'font-size: 0.875rem;',
			'font-weight: 500;',
		];
	}
	if (/(footer)/.test(s)) {
		return [
			'margin-top: 2rem;',
			'padding-top: 1.25rem;',
			'border-top: 1px solid var(--border, rgba(148, 163, 184, 0.22));',
			'color: var(--muted, #94a3b8);',
		];
	}
	return [
		'display: flex;',
		'flex-direction: column;',
		'gap: 0.75rem;',
	];
}

function getCssContext(textBefore) {
	let depth = 0;
	let lastOpenIdx = -1;
	let inComment = false;
	for (let i = 0; i < textBefore.length; i++) {
		const ch = textBefore[i];
		const next = textBefore[i + 1];
		if (inComment) {
			if (ch === '*' && next === '/') {
				inComment = false;
				i++;
			}
			continue;
		}
		if (ch === '/' && next === '*') {
			inComment = true;
			i++;
			continue;
		}
		if (ch === '{') {
			depth++;
			lastOpenIdx = i;
		} else if (ch === '}') {
			depth = Math.max(0, depth - 1);
		}
	}
	if (depth === 0 || lastOpenIdx === -1) {
		return { insideRule: false, selector: '', existingProps: new Set() };
	}
	const headerSlice = textBefore.slice(Math.max(0, lastOpenIdx - 200), lastOpenIdx);
	const selector = headerSlice.split(/[};]/).pop()?.trim() || '';
	const blockBody = textBefore.slice(lastOpenIdx + 1);
	const existingProps = new Set();
	for (const m of blockBody.matchAll(/^\s*([a-z-]+)\s*:/gm)) {
		existingProps.add(m[1].toLowerCase());
	}
	return { insideRule: true, selector, existingProps };
}

function getHtmlContext(textBefore) {
	const inHead = /<head\b/i.test(textBefore) && !/<\/head>/i.test(textBefore);
	const inForm = /<form\b/i.test(textBefore) && !/<\/form>/i.test(textBefore);
	const inMain = /<main\b/i.test(textBefore) && !/<\/main>/i.test(textBefore);
	const inBody = /<body\b/i.test(textBefore) && !/<\/body>/i.test(textBefore);
	return { inHead, inForm, inMain, inBody };
}

function alignLinesToCurrentIndent(lines, linePrefix) {
	const currentIndentMatch = linePrefix.match(/^(\s*)/);
	const currentIndent = currentIndentMatch ? currentIndentMatch[1] : '';
	if (!lines.length) return '';
	// Strip the base indent of the first line, then apply currentIndent to subsequent lines
	const firstIndentMatch = lines[0].match(/^(\s*)/);
	const baseLen = firstIndentMatch ? firstIndentMatch[1].length : 0;
	const trimmedBeforeCursor = linePrefix.trimStart();

	const reindented = lines.map((line, idx) => {
		const stripped = line.slice(Math.min(baseLen, line.match(/^(\s*)/)[1].length));
		if (idx === 0) return stripped;
		return currentIndent + stripped;
	});

	const joined = reindented.join('\n');
	if (!trimmedBeforeCursor) {
		// Current line only has whitespace -> prepend missing indent if cursor is at column 1
		if (currentIndent.length === 0 && baseLen > 0) {
			return lines.join('\n');
		}
		return joined;
	}
	if (joined.toLowerCase().startsWith(trimmedBeforeCursor.toLowerCase())) {
		return joined.slice(trimmedBeforeCursor.length);
	}
	return null;
}

function filterRedundantClosings(lines, textAfter) {
	if (!textAfter) return lines;
	const closingTags = ['</form>', '</section>', '</main>', '</header>', '</div>', '</body>', '</html>', '</head>'];
	const afterLower = textAfter.toLowerCase();
	const out = [];
	for (const line of lines) {
		const t = line.trim().toLowerCase();
		if (closingTags.includes(t) && afterLower.includes(t)) {
			// Stop before emitting closing tags that already exist after the cursor
			break;
		}
		out.push(line);
	}
	return out;
}

/**
 * Main continuous suggestion entrypoint.
 * Returns primary ghost-text completion, alternatives, and the full next-steps stream for UI display.
 */
export function computeContinuousSuggestion({
	filePath = 'index.html',
	language,
	content = '',
	lineNumber = 1,
	column = 1,
	allFiles = [],
	mode = 'smart', // 'line' | 'block' | 'smart'
	altIndex = 0,
}) {
	const info = analyzeFileName(filePath, language);
	const partner = findPartnerFile(info.filePath, allFiles);
	const lines = content.split(/\r?\n/);
	const lineIdx = Math.max(0, Math.min(lines.length - 1, lineNumber - 1));
	const currentLine = lines[lineIdx] || '';
	const linePrefix = currentLine.slice(0, Math.max(0, column - 1));
	const lineSuffix = currentLine.slice(Math.max(0, column - 1));
	const textBefore = [...lines.slice(0, lineIdx), linePrefix].join('\n');
	const textAfter = [lineSuffix, ...lines.slice(lineIdx + 1)].join('\n');
	const trimmedPrefix = linePrefix.trim();

	let unstyledHtmlClasses = [];
	let upcomingSteps = [];
	const candidates = [];

	if (info.language === 'css') {
		const blueprint = buildCssBlueprint(info);
		const defined = extractDefinedCssSelectors(content);

		// Extract unstyled classes from linked HTML partner
		let htmlSymbols = { classes: [], ids: [] };
		if (partner?.content) {
			htmlSymbols = extractHtmlSymbols(partner.content);
			unstyledHtmlClasses = htmlSymbols.classes.filter(c => !defined.has(`.${c}`));
		}

		// Build dynamic HTML-linked CSS steps ahead of generic blueprint steps
		const linkedSteps = unstyledHtmlClasses.map(cls => ({
			id: `linked-cls-${cls}`,
			title: `Style class .${cls} (từ ${partner?.path || 'HTML'})`,
			selector: `.${cls}`,
			marker: new RegExp(`\\.${escapeRegExp(cls)}\\s*\\{`),
			lines: buildCssRuleForSymbol(cls, false),
		}));

		const allSteps = [...linkedSteps, ...blueprint.filter(st => !st.marker.test(content))];
		upcomingSteps = allSteps.slice(0, 6).map(st => ({
			id: st.id,
			title: st.title,
			preview: st.lines.join('\n'),
		}));

		const cssCtx = getCssContext(textBefore);

		if (cssCtx.insideRule) {
			const roleProps = getPropertiesForSelectorRole(cssCtx.selector);
			const missingProps = roleProps.filter(line => {
				const propName = line.split(':')[0].trim().toLowerCase();
				return !cssCtx.existingProps.has(propName);
			});

			if (trimmedPrefix) {
				// Partial property completion inside { ... }
				for (const propLine of missingProps) {
					if (propLine.toLowerCase().startsWith(trimmedPrefix.toLowerCase())) {
						candidates.push({
							label: `Gợi ý thuộc tính cho ${cssCtx.selector}`,
							insertText: propLine.slice(trimmedPrefix.length),
						});
					}
				}
			} else if (missingProps.length > 0) {
				const slice = mode === 'line' ? [missingProps[0]] : missingProps.slice(0, 4);
				const indent = linePrefix.length ? '' : '  ';
				const text = slice.map((p, i) => (i === 0 ? indent + p : (linePrefix.match(/^(\s*)/)[1] || '  ') + p)).join('\n');
				candidates.push({
					label: `Thuộc tính tiếp theo cho ${cssCtx.selector}`,
					insertText: text,
				});
				if (missingProps.length > 1 && mode !== 'line') {
					candidates.push({
						label: `1 dòng: ${missingProps[0]}`,
						insertText: indent + missingProps[0],
					});
				}
			} else if (!/^\s*\}/.test(lineSuffix)) {
				candidates.push({
					label: `Đóng block ${cssCtx.selector}`,
					insertText: '}',
				});
			}
		} else {
			// Top-level CSS: match partial selector or suggest next unstyled rule
			const isAfterCssClose = /\}\s*$/.test(trimmedPrefix) && lineSuffix.trim() === '';
			if (trimmedPrefix && !isAfterCssClose) {
				for (const step of allSteps) {
					const first = step.lines[0] || '';
					if (first.toLowerCase().startsWith(trimmedPrefix.toLowerCase())) {
						const blockLines = mode === 'line' ? [first] : step.lines;
						const aligned = alignLinesToCurrentIndent(blockLines, linePrefix);
						if (aligned) {
							candidates.push({
								label: step.title,
								insertText: aligned,
							});
						}
					}
				}
			} else {
				const currentIndent = (linePrefix.match(/^(\s*)/) || ['', ''])[1];
				for (const step of allSteps.slice(0, 4)) {
					const blockLines = mode === 'line' ? [step.lines[0]] : step.lines;
					if (isAfterCssClose) {
						const joined = alignLinesToCurrentIndent(blockLines, currentIndent);
						if (joined) {
							candidates.push({
								label: step.title,
								insertText: `\n\n${currentIndent}${joined}`,
							});
						}
					} else {
						const aligned = alignLinesToCurrentIndent(blockLines, linePrefix);
						if (aligned) {
							candidates.push({
								label: step.title,
								insertText: aligned,
							});
						}
					}
				}
			}
		}
	} else {
		// HTML continuous filename engine
		const blueprint = buildHtmlBlueprint(info, allFiles);
		const htmlCtx = getHtmlContext(textBefore);

		// Compute remaining steps not yet written in the document
		const remaining = blueprint.filter(st => !st.marker.test(content));

		// Prioritize steps matching the current enclosing tag zone
		const prioritized = [...remaining].sort((a, b) => {
			const scoreZone = z => {
				if (htmlCtx.inHead && z === 'head') return 0;
				if (htmlCtx.inForm && z === 'form') return 0;
				if (htmlCtx.inMain && z === 'main') return 0;
				if (htmlCtx.inBody && z === 'body') return 0;
				return 1;
			};
			return scoreZone(a.zone) - scoreZone(b.zone);
		});

		upcomingSteps = prioritized.slice(0, 6).map(st => ({
			id: st.id,
			title: st.title,
			preview: st.lines.join('\n'),
		}));

		const isAfterClosedTag = /(<\/[a-z0-9-]+>|\/>)\s*$/i.test(trimmedPrefix) && lineSuffix.trim() === '';
		const cursorBeforeBodyOrDoc = /<body\b/i.test(textAfter) && !htmlCtx.inHead && !htmlCtx.inBody;

		if (cursorBeforeBodyOrDoc) {
			// Cursor is above <!DOCTYPE>/<body>; don't dump body/form blocks at line 1 before <!DOCTYPE>
			upcomingSteps = prioritized.slice(0, 6).map(st => ({
				id: st.id,
				title: st.title,
				preview: st.lines.join('\n'),
			}));
		} else if (trimmedPrefix && !isAfterClosedTag) {
			// Match partial text against lines inside remaining blueprint steps
			for (const step of prioritized) {
				for (let i = 0; i < step.lines.length; i++) {
					const candidateLine = step.lines[i].trimStart();
					if (candidateLine.toLowerCase().startsWith(trimmedPrefix.toLowerCase())) {
						const rawSlice = mode === 'line' ? [step.lines[i]] : step.lines.slice(i);
						const slice = filterRedundantClosings(rawSlice, textAfter);
						const aligned = alignLinesToCurrentIndent(slice, linePrefix);
						if (aligned) {
							candidates.push({
								label: step.title,
								insertText: aligned,
							});
							break;
						}
					}
				}
			}
			// Class attribute completion from partner CSS file
			if (/class=["'][^"']*$/i.test(linePrefix) && partner?.content) {
				const cssClasses = [];
				for (const m of partner.content.matchAll(/\.([a-zA-Z_-][\w-]*)/g)) {
					if (!cssClasses.includes(m[1])) cssClasses.push(m[1]);
				}
				const typedClass = linePrefix.match(/class=["']([^"']*)$/i)?.[1]?.split(/\s+/).pop() || '';
				for (const cls of cssClasses) {
					if (cls.startsWith(typedClass)) {
						candidates.push({
							label: `Class từ ${partner.path}: .${cls}`,
							insertText: cls.slice(typedClass.length),
						});
					}
				}
			}
		} else if (prioritized.length > 0) {
			const currentIndent = (linePrefix.match(/^(\s*)/) || ['', ''])[1];
			for (const step of prioritized.slice(0, 4)) {
				let rawLines = step.lines;
				if (step.zone === 'head' || step.zone === 'root') {
					rawLines = step.lines.filter(l => {
						const t = l.trim();
						return t.length > 0 && !content.includes(t);
					});
				} else {
					// Skip only leading singleton container tags already written before cursor (e.g. <form ...>, <main ...>)
					let startIdx = 0;
					while (startIdx < rawLines.length) {
						const t = rawLines[startIdx].trim();
						if (/^<(main|form|section|header|nav|footer)\b/i.test(t) && textBefore.includes(t)) {
							startIdx++;
						} else {
							break;
						}
					}
					rawLines = rawLines.slice(startIdx);
				}
				const linesToUse = filterRedundantClosings(rawLines, textAfter);
				if (!linesToUse.length) continue;
				const slice = mode === 'line' ? [linesToUse[0]] : linesToUse;
				if (isAfterClosedTag) {
					const blockOnNewLine = alignLinesToCurrentIndent(slice, currentIndent);
					if (blockOnNewLine) {
						candidates.push({
							label: step.title,
							insertText: `\n${currentIndent}${blockOnNewLine}`,
						});
					}
				} else {
					const aligned = alignLinesToCurrentIndent(slice, linePrefix);
					if (aligned) {
						candidates.push({
							label: step.title,
							insertText: aligned,
						});
					}
				}
			}
		}
	}

	const uniqueCandidates = [];
	const seenText = new Set();
	for (const c of candidates) {
		if (c.insertText && !seenText.has(c.insertText)) {
			seenText.add(c.insertText);
			uniqueCandidates.push(c);
		}
	}

	const picked = uniqueCandidates.length
		? uniqueCandidates[((altIndex % uniqueCandidates.length) + uniqueCandidates.length) % uniqueCandidates.length]
		: null;

	return {
		intent: info,
		linkedPartner: partner ? partner.path : null,
		unstyledHtmlClasses,
		upcomingSteps,
		primary: picked,
		alternatives: uniqueCandidates,
	};
}
