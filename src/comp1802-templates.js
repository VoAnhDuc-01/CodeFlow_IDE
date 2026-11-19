/**
 * Template groups extracted and adapted from COMP1802 (D:\my_project\project9\comp1802).
 * Covers shared course page types, CSS architecture layers, foundational exercises (CV, Aquarium),
 * and themed website domains (Tourism, Homestay, Cuisine, Festivals, Tickets, Courses, Quiz,
 * Todo, Expenses, Calendar/Appointments, Mini-Tools).
 */

export const COMP1802_ARCHETYPE_KEYWORDS = [
	{
		id: 'about',
		label: 'Giới thiệu / About (COMP1802)',
		keywords: ['about', 'story', 'our-story', 'gioi', 'thieu', 'gioithieu', 've-chung-toi'],
	},
	{
		id: 'change-password',
		label: 'Đổi mật khẩu / Change Password (COMP1802)',
		keywords: ['change-password', 'changepassword', 'password', 'doi', 'mat', 'khau', 'matkhau', 'reset-password'],
	},
	{
		id: 'feedback',
		label: 'Đánh giá & Phản hồi / Feedback (COMP1802)',
		keywords: ['feedback', 'review', 'reviews', 'rating', 'phan', 'hoi', 'danh', 'gia', 'gop-y'],
	},
	{
		id: 'manage',
		label: 'Thêm & Quản lý nội dung / Manage (COMP1802)',
		keywords: ['manage', 'add-content', 'crud', 'editor-content', 'quan', 'ly', 'them-noi-dung'],
	},
	{
		id: 'cv',
		label: 'Hồ sơ năng lực / CV Resume (COMP1802)',
		keywords: ['cv', 'resume', 'curriculum', 'so-yeu', 'ly-lich', 'ung-vien'],
	},
	{
		id: 'aquarium',
		label: 'Hoạt cảnh Thủy cung / Aquarium (COMP1802)',
		keywords: ['aquarium', 'fish', 'ocean', 'underwater', 'thuy', 'cung', 'ho-ca'],
	},
	{
		id: 'tourism',
		label: 'Du lịch & Đặt Tour / Tours (COMP1802)',
		keywords: ['tour', 'tours', 'dalat', 'travel', 'itinerary', 'trip', 'du', 'lich', 'di-cham'],
	},
	{
		id: 'homestay',
		label: 'Đặt phòng Homestay / Stays (COMP1802)',
		keywords: ['homestay', 'hotel', 'room', 'rooms', 'stay', 'stays', 'resort', 'luu', 'tru', 'dat-phong', 'hien'],
	},
	{
		id: 'cuisine',
		label: 'Ẩm thực & Thực đơn / Cuisine (COMP1802)',
		keywords: ['cuisine', 'food', 'dish', 'dishes', 'kitchen', 'restaurant', 'am', 'thuc', 'mon', 'an', 'bep'],
	},
	{
		id: 'festivals',
		label: 'Lễ hội & Văn hóa / Festivals (COMP1802)',
		keywords: ['festival', 'festivals', 'culture', 'heritage', 'le', 'hoi', 'van', 'hoa', 'mua-hoi'],
	},
	{
		id: 'tickets',
		label: 'Đặt vé Phim & Nhạc / Tickets (COMP1802)',
		keywords: ['ticket', 'tickets', 'cinema', 'concert', 'stage', 'screening', 'suat', 'chieu', 'suat-toi', 'su-kien'],
	},
	{
		id: 'courses',
		label: 'Khóa học & Lập trình / Courses (COMP1802)',
		keywords: ['course', 'courses', 'language', 'coding', 'lesson', 'lessons', 'workshop', 'khoa', 'hoc', 'ngoai-ngu', 'mo-lop', 'xuong-web'],
	},
	{
		id: 'quiz',
		label: 'Trắc nghiệm kiến thức / Quiz (COMP1802)',
		keywords: ['quiz', 'quizzes', 'exam', 'trivia', 'trac', 'nghiem', 'thu-tri', 'cau-hoi'],
	},
	{
		id: 'todo',
		label: 'Quản lý công việc / Todo Tasks (COMP1802)',
		keywords: ['todo', 'todos', 'task', 'tasks', 'checklist', 'viec', 'nho', 'cong-viec'],
	},
	{
		id: 'expenses',
		label: 'Sổ thu chi cá nhân / Expenses (COMP1802)',
		keywords: ['expense', 'expenses', 'finance', 'ledger', 'budget', 'spending', 'thu', 'chi', 'chi-tieu', 'so-chi'],
	},
	{
		id: 'calendar',
		label: 'Lịch & Đặt lịch hẹn / Calendar (COMP1802)',
		keywords: ['calendar', 'appointment', 'appointments', 'schedule', 'planner', 'booking', 'hen', 'ngay', 'lich', 'dat-lich'],
	},
	{
		id: 'mini-tools',
		label: 'Bộ công cụ tiện ích / Mini Tools (COMP1802)',
		keywords: ['mini-tools', 'minitools', 'tools', 'toolkit', 'calculator', 'countdown', 'timer', 'cong', 'cu', 'tien', 'ich', 'ban-nho'],
	},
	{
		id: 'responsive',
		label: 'Quy tắc Responsive CSS (COMP1802)',
		keywords: ['responsive', 'breakpoint', 'breakpoints', 'mobile', 'media-query', 'design-layer'],
	},
];

export function buildComp1802HtmlBodySteps(archetypeId, info) {
	switch (archetypeId) {
		case 'about':
			return [
				{
					id: 'about-header',
					title: 'Thanh điều hướng đầu trang Giới thiệu',
					zone: 'body',
					marker: /<header/i,
					lines: [
						'  <header class="site-header">',
						'    <a class="brand" href="index.html">Studio</a>',
						'    <nav aria-label="Điều hướng chính">',
						'      <a href="index.html">Trang chủ</a>',
						'      <a href="products.html">Sản phẩm</a>',
						'      <a href="about.html" aria-current="page">Giới thiệu</a>',
						'      <a href="contact.html">Liên hệ</a>',
						'    </nav>',
						'  </header>',
					],
				},
				{
					id: 'about-split',
					title: 'Bố cục Split 2 cột: Câu chuyện & Tầm nhìn',
					zone: 'main',
					marker: /class=["'][^"']*split/i,
					lines: [
						'  <main id="main" class="page-about">',
						'    <div class="split">',
						'      <div class="story-copy">',
						'        <span class="eyebrow">Câu chuyện thương hiệu</span>',
						`        <h1>${info.title} — Thiết kế tối giản, hữu dụng mỗi ngày.</h1>`,
						'        <p>Chúng tôi bắt đầu từ nhu cầu xây dựng giao diện rõ ràng, dễ tiếp cận và nhất quán trên mọi màn hình.</p>',
						'        <h2>Vì sao chọn chúng tôi?</h2>',
						'        <p>Mỗi chi tiết đều được tinh gọn để người dùng tập trung vào nội dung chính và thao tác nhanh chóng.</p>',
						'        <p class="notice">Đây là trang giới thiệu mẫu chuẩn COMP1802 với bố cục chia đôi cân đối.</p>',
						'      </div>',
						'      <div class="story-media" aria-label="Hình ảnh minh họa">',
						'        <div class="media-placeholder">Ảnh giới thiệu 16:10</div>',
						'      </div>',
						'    </div>',
						'  </main>',
					],
				},
			];

		case 'change-password':
			return [
				{
					id: 'cp-shell',
					title: 'Khung Auth 2 cột (.auth-layout) & Panel giới thiệu',
					zone: 'body',
					marker: /class=["'][^"']*auth-layout/i,
					lines: [
						'  <main id="main" class="page-change-password">',
						'    <div class="auth-layout">',
						'      <aside class="auth-art">',
						'        <div class="auth-art-box">',
						'          <h2>Bảo mật tài khoản</h2>',
						'          <p>Sử dụng mật khẩu tối thiểu 8 ký tự gồm chữ hoa, chữ thường và số.</p>',
						'        </div>',
						'      </aside>',
						'      <section class="narrow" aria-labelledby="cp-title">',
						'        <h1 id="cp-title">Đổi mật khẩu</h1>',
						'        <p class="notice">Tài khoản thử nghiệm lưu cục bộ trên trình duyệt này.</p>',
					],
				},
				{
					id: 'cp-form',
					title: 'Form nhập mật khẩu cũ, mật khẩu mới & xác nhận',
					zone: 'form',
					marker: /data-form=["']password["']|id=["']new-pass/i,
					lines: [
						'        <form data-form="password" class="password-form">',
						'          <label for="old-pass">Mật khẩu hiện tại',
						'            <input id="old-pass" name="old" type="password" autocomplete="current-password" required />',
						'          </label>',
						'          <label for="new-pass">Mật khẩu mới (ít nhất 8 ký tự)',
						'            <input id="new-pass" name="password" type="password" autocomplete="new-password" minlength="8" required />',
						'          </label>',
						'          <label for="confirm-pass">Xác nhận mật khẩu mới',
						'            <input id="confirm-pass" name="confirm" type="password" autocomplete="new-password" minlength="8" required />',
						'          </label>',
						'          <button type="submit" class="button">Cập nhật mật khẩu</button>',
						'        </form>',
						'        <p><a href="login.html">Quay lại đăng nhập</a></p>',
						'      </section>',
						'    </div>',
						'  </main>',
					],
				},
			];

		case 'feedback':
			return [
				{
					id: 'fb-wrap',
					title: 'Khung trang Đánh giá & Phản hồi',
					zone: 'body',
					marker: /class=["'][^"']*page-feedback|data-form=["']feedback["']/i,
					lines: [
						'  <main id="main" class="page-feedback">',
						'    <section class="narrow" aria-labelledby="fb-title">',
						'      <span class="eyebrow">Ý kiến người dùng</span>',
						'      <h1 id="fb-title">Gửi phản hồi cho chúng tôi</h1>',
						'      <p>Điều gì giúp trải nghiệm của bạn tốt hơn trong phiên bản tiếp theo?</p>',
						'      <form data-form="feedback" class="feedback-form">',
					],
				},
				{
					id: 'fb-fields',
					title: 'Các trường Họ tên, Mức độ hài lòng & Nội dung góp ý',
					zone: 'form',
					marker: /name=["']rating["']/i,
					lines: [
						'        <label for="fb-name">Họ và tên',
						'          <input id="fb-name" name="name" type="text" placeholder="Nguyễn Minh Anh" required />',
						'        </label>',
						'        <label for="fb-rating">Mức độ hài lòng',
						'          <select id="fb-rating" name="rating">',
						'            <option value="5">5 - Rất hài lòng</option>',
						'            <option value="4">4 - Hài lòng</option>',
						'            <option value="3">3 - Bình thường</option>',
						'            <option value="2">2 - Cần cải thiện</option>',
						'            <option value="1">1 - Chưa hài lòng</option>',
						'          </select>',
						'        </label>',
						'        <label for="fb-msg">Nội dung góp ý',
						'          <textarea id="fb-msg" name="message" minlength="10" placeholder="Chia sẻ góp ý chi tiết của bạn..." required></textarea>',
						'        </label>',
						'        <button type="submit" class="button">Lưu phản hồi</button>',
						'      </form>',
						'      <p id="status" class="message" role="status" aria-live="polite"></p>',
						'    </section>',
						'  </main>',
					],
				},
			];

		case 'manage':
			return [
				{
					id: 'manage-wrap',
					title: 'Khung trang Thêm & Quản lý nội dung',
					zone: 'body',
					marker: /data-form=["']manage["']|class=["'][^"']*page-manage/i,
					lines: [
						'  <main id="main" class="page-manage">',
						'    <section class="narrow" aria-labelledby="manage-title">',
						'      <span class="eyebrow">Quản trị nội dung</span>',
						'      <h1 id="manage-title">Thêm mục nội dung mới</h1>',
						'      <p>Thêm sản phẩm, bài viết hoặc mục dịch vụ mới vào bộ sưu tập.</p>',
						'      <form data-form="manage" class="manage-form">',
					],
				},
				{
					id: 'manage-fields',
					title: 'Trường Tên, Giá, Danh mục, Mô tả & Tải ảnh',
					zone: 'form',
					marker: /name=["']category["']/i,
					lines: [
						'        <label for="item-name">Tên mục',
						'          <input id="item-name" name="name" type="text" maxlength="100" required />',
						'        </label>',
						'        <label for="item-price">Giá / Chi phí (VNĐ)',
						'          <input id="item-price" name="price" type="number" min="0" value="0" required />',
						'        </label>',
						'        <label for="item-cat">Danh mục',
						'          <select id="item-cat" name="category">',
						'            <option>Nổi bật</option>',
						'            <option>Bộ sưu tập</option>',
						'            <option>Mới cập nhật</option>',
						'          </select>',
						'        </label>',
						'        <label for="item-desc">Mô tả chi tiết',
						'          <textarea id="item-desc" name="description" maxlength="2000" required></textarea>',
						'        </label>',
						'        <label for="item-img">Hình ảnh (JPG / PNG / WebP)',
						'          <input id="item-img" name="image" type="file" accept="image/jpeg,image/png,image/webp" />',
						'        </label>',
						'        <button type="submit" class="button">Thêm nội dung</button>',
						'      </form>',
						'    </section>',
						'  </main>',
					],
				},
			];

		case 'cv':
			return [
				{
					id: 'cv-profile',
					title: 'Phần đầu CV (.profile): Họ tên, Chức danh & Liên hệ',
					zone: 'body',
					marker: /class=["'][^"']*resume/i,
					lines: [
						'  <main class="resume">',
						'    <header class="profile">',
						'      <div class="profile-copy">',
						'        <h1>Nguyễn Minh Anh <span class="alias">/ Frontend Dev</span></h1>',
						'        <p class="role">Sinh viên Công nghệ Thông tin</p>',
						'        <p class="school-short">Đại học Sư phạm TP.HCM (HCMUE)</p>',
						'        <address class="contact" aria-label="Thông tin liên hệ">',
						'          <a href="mailto:minhanh@example.com">minhanh@example.com</a>',
						'          <a href="tel:+84901234567">0901 234 567</a>',
						'          <a href="#github">GitHub</a>',
						'          <a href="#portfolio">Portfolio</a>',
						'        </address>',
						'      </div>',
						'      <div class="portrait" aria-hidden="true">MA</div>',
						'    </header>',
					],
				},
				{
					id: 'cv-education',
					title: 'Mục Hồ sơ & Học vấn (.section)',
					zone: 'main',
					marker: /id=["']education["']/i,
					lines: [
						'    <section class="section" aria-labelledby="about">',
						'      <h2 id="about">Giới thiệu</h2>',
						'      <div class="section-body">',
						'        <p>Yêu thích thiết kế giao diện web chuẩn ngữ nghĩa, tối ưu trải nghiệm người dùng và hiệu năng trình duyệt.</p>',
						'      </div>',
						'    </section>',
						'    <section class="section" aria-labelledby="education">',
						'      <h2 id="education">Học vấn</h2>',
						'      <div class="section-body">',
						'        <article class="entry">',
						'          <div class="entry-top"><h3>Cử nhân Công nghệ Thông tin</h3><span class="date">2024–Hiện tại</span></div>',
						'          <p>Chuyên ngành Kỹ thuật Phần mềm &amp; Thiết kế Web</p>',
						'        </article>',
						'      </div>',
						'    </section>',
					],
				},
				{
					id: 'cv-projects-skills',
					title: 'Mục Dự án, Kỹ năng & Footer CV',
					zone: 'main',
					marker: /id=["']projects["']/i,
					lines: [
						'    <section class="section" aria-labelledby="projects">',
						'      <h2 id="projects">Dự án tiêu biểu</h2>',
						'      <div class="section-body">',
						'        <article class="entry">',
						'          <div class="entry-top"><h3>Bộ sưu tập 24 Website COMP1802</h3><span class="date">2026</span></div>',
						'          <p>Xây dựng bằng HTML5, CSS3 và JavaScript thuần với giao diện responsive.</p>',
						'        </article>',
						'      </div>',
						'    </section>',
						'    <section class="section" aria-labelledby="skills">',
						'      <h2 id="skills">Kỹ năng</h2>',
						'      <div class="section-body skills">',
						'        <p><strong>Ngôn ngữ:</strong> HTML5, CSS3, JavaScript, C++.</p>',
						'        <p><strong>Công cụ:</strong> Git, VS Code, Chrome DevTools.</p>',
						'      </div>',
						'    </section>',
						'    <footer class="footer">',
						'      <span>Hồ sơ cá nhân</span>',
						'      <span>Cập nhật 2026</span>',
						'    </footer>',
						'  </main>',
					],
				},
			];

		case 'aquarium':
			return [
				{
					id: 'aqua-scene',
					title: 'Khung cảnh Thủy cung (.aquarium) & Các sinh vật bơi',
					zone: 'body',
					marker: /class=["'][^"']*aquarium/i,
					lines: [
						'  <main class="aquarium" role="img" aria-label="Thủy cung hoạt cảnh với đàn cá, rùa biển và thợ lặn">',
						'    <div class="water-rays" aria-hidden="true"></div>',
						'    <div class="swimmer goldfish" aria-hidden="true">🐠 Đàn cá vàng</div>',
						'    <div class="swimmer shark" aria-hidden="true">🦈 Cá mập</div>',
						'    <div class="swimmer turtle" aria-hidden="true">🐢 Rùa biển</div>',
						'    <div class="swimmer diver diver-one" aria-hidden="true">🤿 Thợ lặn</div>',
						'    <div class="bubble-bed" aria-hidden="true">',
						'      <span></span><span></span><span></span><span></span>',
						'    </div>',
						'  </main>',
					],
				},
			];

		case 'tourism':
			return [
				{
					id: 'tour-hero',
					title: 'Header & Hero Hành trình Du lịch (.trip-hero)',
					zone: 'body',
					marker: /class=["'][^"']*trip-hero/i,
					lines: [
						'  <header><div class="nav"><a class="brand" href="#">đi chậm</a><nav aria-label="Điều hướng"><a href="#" aria-current="page">Trang chủ</a><a href="#tours">Tìm tour</a><a href="#guide">Cẩm nang</a></nav></div></header>',
						'  <main id="main" class="page-index">',
						'    <section class="trip-hero">',
						'      <div>',
						'        <span class="eyebrow">Hành trình xuyên Việt</span>',
						'        <h1>Chuyến đi tiếp theo<br>bạn định đi mấy ngày?</h1>',
						'        <p>Từ cao nguyên Đà Lạt đến biển xanh Phú Quốc. Xem lịch trình từng ngày và dự trù chi phí cho nhóm bạn.</p>',
						'        <a class="button" href="#tours">Xem tất cả lịch trình →</a>',
						'      </div>',
						'      <div class="hero-visual">Ảnh điểm đến nổi bật</div>',
						'    </section>',
					],
				},
				{
					id: 'tour-search-grid',
					title: 'Thanh tìm kiếm Tour (.trip-search) & Các chặng gợi ý',
					zone: 'main',
					marker: /class=["'][^"']*trip-search/i,
					lines: [
						'    <form class="trip-search">',
						'      <label>Bạn muốn đi đâu?<input type="search" placeholder="Đà Lạt, Hội An, Sa Pa..." /></label>',
						'      <label>Thời lượng<select><option>Tất cả</option><option>2 ngày 1 đêm</option><option>3 ngày 2 đêm</option><option>4 ngày 3 đêm</option></select></label>',
						'      <button type="submit">Tìm chuyến đi</button>',
						'    </form>',
						'    <section id="tours" class="grid">',
						'      <article class="item"><small>3 NGÀY · CAO NGUYÊN</small><h3>Đà Lạt sương sớm</h3><p>Rừng thông, hồ Tuyền Lâm và những quán cà phê dốc đồi.</p><strong class="price">2.490.000đ</strong></article>',
						'      <article class="item"><small>2 NGÀY · DI SẢN</small><h3>Phố cổ Hội An</h3><p>Đạp xe ven sông Thu Bồn, ngắm đèn lồng và ẩm thực phố Hội.</p><strong class="price">1.850.000đ</strong></article>',
						'    </section>',
						'  </main>',
					],
				},
			];

		case 'homestay':
			return [
				{
					id: 'stay-cover',
					title: 'Ảnh bìa Homestay (.stay-cover) & Giới thiệu',
					zone: 'body',
					marker: /class=["'][^"']*stay-cover/i,
					lines: [
						'  <header><div class="nav"><a class="brand" href="#">HIÊN</a><nav aria-label="Điều hướng"><a href="#" aria-current="page">Nhà Hiên</a><a href="#rooms">Chọn phòng</a><a href="contact.html">Nhắn cho Hiên</a></nav></div></header>',
						'  <main id="main" class="page-index">',
						'    <section class="stay-cover">',
						'      <div class="cover-caption">',
						'        <span class="eyebrow">Một chốn dừng chân · Đủ nắng và gió</span>',
						'        <h1>Ở lại thêm<br>một buổi sáng nữa.</h1>',
						'        <a class="button" href="#rooms">Tìm phòng trống</a>',
						'      </div>',
						'    </section>',
					],
				},
				{
					id: 'stay-rooms',
					title: 'Danh sách phòng nghỉ (.stay-rooms)',
					zone: 'main',
					marker: /class=["'][^"']*stay-rooms/i,
					lines: [
						'    <section id="rooms" class="stay-rooms">',
						'      <div class="sectionhead"><h2>Chọn không gian của bạn</h2></div>',
						'      <div class="grid">',
						'        <article class="item"><small>2 KHÁCH · GÁC XÉP</small><h3>Phòng Gác Gỗ Thông</h3><p>Cửa sổ đón nắng sáng, ban công nhìn ra vườn cây.</p><strong class="price">650.000đ / đêm</strong></article>',
						'        <article class="item"><small>4 KHÁCH · SÂN VƯỜN</small><h3>Nhà Vườn Nguyên Căn</h3><p>Có bếp nhỏ, bàn trà ngoài hiên và sân cỏ riêng.</p><strong class="price">1.450.000đ / đêm</strong></article>',
						'      </div>',
						'    </section>',
						'  </main>',
					],
				},
			];

		case 'cuisine':
			return [
				{
					id: 'cuisine-lead',
					title: 'Bố cục Tạp chí Ẩm thực (.issue-heading & .food-lead)',
					zone: 'body',
					marker: /class=["'][^"']*food-lead/i,
					lines: [
						'  <header><div class="nav"><a class="brand" href="#">Bếp Dọc Miền</a><nav aria-label="Điều hướng"><a href="#" aria-current="page">Trang nhất</a><a href="#dishes">Món ngon</a><a href="about.html">Về căn bếp</a></nav></div></header>',
						'  <main id="main" class="page-index">',
						'    <div class="issue-heading"><span>GHI CHÉP ẨM THỰC VIỆT</span><span>TỪ BẮC VÀO NAM / SỐ 01</span></div>',
						'    <section class="food-lead">',
						'      <article class="lead-story">',
						'        <h1>Qua từng hương vị vùng miền,<br>nhớ một bữa cơm nhà.</h1>',
						'        <p>Mỗi món ăn mang theo ký ức của một vùng đất. Bắt đầu hành trình với bát phở nóng thơm mùi hồi quế.</p>',
						'        <a href="#dishes">Đọc câu chuyện Phở →</a>',
						'      </article>',
						'      <article class="mini-story">',
						'        <span class="eyebrow">Hương vị miền Trung</span>',
						'        <h2>Mì Quảng:<br>ít nước dùng, đậm tầng vị.</h2>',
						'        <p>Sợi mì mềm, rau sống tươi, bánh tráng nướng giòn tan hòa quyện.</p>',
						'        <p class="food-quote">“Một món ăn,<br>nhiều ký ức.”</p>',
						'      </article>',
						'    </section>',
						'  </main>',
					],
				},
			];

		case 'festivals':
			return [
				{
					id: 'fest-almanac',
					title: 'Tiêu đề Cẩm nang Lễ hội (.almanac-title) & Menu vùng miền',
					zone: 'body',
					marker: /class=["'][^"']*almanac-title/i,
					lines: [
						'  <header><div class="nav"><a class="brand" href="#">Mùa Hội</a><nav aria-label="Điều hướng"><a href="#" aria-current="page">Trang bìa</a><a href="#index">Mục lục lễ hội</a></nav></div></header>',
						'  <main id="main" class="page-index">',
						'    <section class="almanac-title">',
						'      <div>',
						'        <span class="eyebrow">Sổ tay văn hóa Việt Nam</span>',
						'        <h1>Đi một mùa hội,<br><em>hiểu một miền quê.</em></h1>',
						'        <p>Từ câu hát quan họ đến nhịp cồng chiêng Tây Nguyên. Khám phá phong tục và không gian sinh hoạt cộng đồng.</p>',
						'      </div>',
						'      <div class="almanac-stamp"><b>06</b><span>Ghi chép<br>văn hóa</span></div>',
						'    </section>',
						'    <nav class="region-menu" aria-label="Vùng miền">',
						'      <a href="#">Miền Bắc</a><a href="#">Miền Trung</a><a href="#">Tây Nguyên</a><a href="#">Nam Bộ</a>',
						'    </nav>',
						'  </main>',
					],
				},
			];

		case 'tickets':
			return [
				{
					id: 'tickets-stage',
					title: 'Sân khấu Sự kiện (.night-stage) & Thể loại vé',
					zone: 'body',
					marker: /class=["'][^"']*night-stage/i,
					lines: [
						'  <header><div class="nav"><a class="brand" href="#">SUẤT TỐI</a><nav aria-label="Điều hướng"><a href="#" aria-current="page">Bảng tin</a><a href="#shows">Lịch chiếu &amp; Show</a></nav></div></header>',
						'  <main id="main" class="page-index">',
						'    <section class="night-stage">',
						'      <div class="stage-copy">',
						'        <span class="eyebrow">Phim · Nhạc sống · Sân khấu</span>',
						'        <h1>Xong việc rồi.<br><span>Đi xem một suất tối.</span></h1>',
						'        <p>Chọn một bộ phim độc lập hoặc đêm nhạc acoustic cuối tuần cùng bạn bè.</p>',
						'        <div class="program-types"><a href="#shows">Phim</a><a href="#shows">Âm nhạc</a><a href="#shows">Kịch nói</a></div>',
						'        <a class="button" href="#shows">Chọn lịch trình →</a>',
						'      </div>',
						'      <aside class="screening-note"><strong>Chọn ngày · Chọn số vé</strong><p>Đặt vé nhanh với chỗ ngồi ưu tiên và mã QR xác nhận tức thì.</p></aside>',
						'    </section>',
						'  </main>',
					],
				},
			];

		case 'courses':
			return [
				{
					id: 'courses-header',
					title: 'Workspace Khóa học & Thẻ học tiếp (.continue-card)',
					zone: 'body',
					marker: /class=["'][^"']*learning-summary/i,
					lines: [
						'  <header><div class="nav"><a class="brand" href="#">Mở Lớp</a><nav aria-label="Điều hướng"><a href="#" aria-current="page">Tổng quan</a><a href="#courses">Khóa học</a></nav></div></header>',
						'  <main id="main">',
						'    <section class="dashboard-greeting">',
						'      <h1>Hôm nay bạn muốn học gì?</h1>',
						'      <p>Tiếp tục bài học gần nhất hoặc bắt đầu một lộ trình mới.</p>',
						'    </section>',
						'    <section class="learning-summary">',
						'      <article class="continue-card">',
						'        <div class="course-glyph" aria-hidden="true">&lt;/&gt;</div>',
						'        <div><span class="label">BƯỚC TIẾP THEO</span><h2>HTML5 từ cơ bản</h2><p>Xây dựng cấu trúc trang web chuẩn ngữ nghĩa.</p><a class="button" href="#courses">Mở bài học →</a></div>',
						'      </article>',
						'      <article class="progress-card">',
						'        <span class="label">TIẾN ĐỘ HỌC TẬP</span>',
						'        <strong class="progress-fraction">3 / 6 bài học</strong>',
						'        <div class="progress-track" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"><span style="width:50%"></span></div>',
						'      </article>',
						'    </section>',
						'  </main>',
					],
				},
			];

		case 'quiz':
			return [
				{
					id: 'quiz-top',
					title: 'Đầu trang Trắc nghiệm (.practice-top) & Bảng điểm',
					zone: 'body',
					marker: /class=["'][^"']*practice-top/i,
					lines: [
						'  <header><div class="nav"><a class="brand" href="#">THỬ TRÍ</a><nav aria-label="Điều hướng"><a href="#" aria-current="page">Luyện tập</a><a href="#topics">Chủ đề</a></nav></div></header>',
						'  <main id="main">',
						'    <div class="practice-top">',
						'      <div><h1>Luyện tập Thiết kế Web</h1><p>Các câu hỏi ngắn kèm giải thích chi tiết sau mỗi lựa chọn.</p></div>',
						'      <div class="best-score">Điểm cao nhất<strong>6 / 6</strong></div>',
						'    </div>',
					],
				},
				{
					id: 'quiz-layout',
					title: 'Bố cục 3 cột (.practice-layout): Chủ đề + Câu hỏi + Hướng dẫn',
					zone: 'main',
					marker: /class=["'][^"']*practice-layout/i,
					lines: [
						'    <div class="practice-layout">',
						'      <aside class="topic-rail"><h2>Chủ đề</h2><ol><li>HTML Ngữ nghĩa</li><li>CSS Layout</li><li>Responsive</li><li>Accessibility</li></ol></aside>',
						'      <section class="quiz-card" aria-labelledby="q1-title">',
						'        <span class="eyebrow">Câu hỏi 1 / 6</span>',
						'        <h2 id="q1-title">Thẻ nào dùng cho thanh điều hướng chính của trang?</h2>',
						'        <div class="quiz-options">',
						'          <label class="quiz-opt"><input type="radio" name="q1" /> <span>&lt;nav&gt;</span></label>',
						'          <label class="quiz-opt"><input type="radio" name="q1" /> <span>&lt;section&gt;</span></label>',
						'          <label class="quiz-opt"><input type="radio" name="q1" /> <span>&lt;aside&gt;</span></label>',
						'        </div>',
						'        <button type="button" class="button">Kiểm tra đáp án</button>',
						'      </section>',
						'      <aside class="practice-help"><h2>Ghi chú</h2><p>Không giới hạn thời gian. Xem giải thích ngay sau khi chọn đáp án.</p></aside>',
						'    </div>',
						'  </main>',
					],
				},
			];

		case 'todo':
			return [
				{
					id: 'todo-shell',
					title: 'Không gian Quản lý công việc (.task-title & form thêm việc)',
					zone: 'body',
					marker: /class=["'][^"']*task-title/i,
					lines: [
						'  <main id="main" class="page-content">',
						'    <div class="task-title">',
						'      <div><h1>Danh sách công việc</h1><p>Tập trung vào từng việc nhỏ, hoàn thành từng bước.</p></div>',
						'      <span class="date-stamp">Hôm nay</span>',
						'    </div>',
						'    <form class="task-composer">',
						'      <input type="text" placeholder="Thêm việc cần làm mới..." aria-label="Tên công việc" required />',
						'      <select aria-label="Độ ưu tiên"><option>Ưu tiên cao</option><option>Trung bình</option><option>Thấp</option></select>',
						'      <button type="submit" class="button">Thêm việc</button>',
						'    </form>',
						'    <ul class="task-list">',
						'      <li class="row"><label><input type="checkbox" checked /> <span>Hoàn thiện bố cục HTML5</span></label><span class="eyebrow">Xong</span></li>',
						'      <li class="row"><label><input type="checkbox" /> <span>Kiểm tra responsive trên màn hình 390px</span></label><span class="eyebrow">Ưu tiên cao</span></li>',
						'    </ul>',
						'  </main>',
					],
				},
			];

		case 'expenses':
			return [
				{
					id: 'exp-shell',
					title: 'Sổ thu chi cá nhân (.finance-top, Tổng kết & Bảng giao dịch)',
					zone: 'body',
					marker: /class=["'][^"']*finance-top/i,
					lines: [
						'  <main id="main" class="page-content">',
						'    <div class="finance-top"><div><h1>Sổ thu chi cá nhân</h1><p>Ghi chép từng giao dịch và theo dõi số dư hàng tháng.</p></div><span class="finance-period">Tháng hiện tại</span></div>',
						'    <section class="grid" aria-label="Tổng quan tài chính">',
						'      <article class="panel"><h3>Tổng thu</h3><strong class="price">+12.500.000đ</strong></article>',
						'      <article class="panel"><h3>Tổng chi</h3><strong class="price">-4.320.000đ</strong></article>',
						'      <article class="panel"><h3>Số dư</h3><strong class="price">8.180.000đ</strong></article>',
						'    </section>',
						'    <form class="toolbar">',
						'      <input type="text" placeholder="Nội dung giao dịch..." required />',
						'      <input type="number" placeholder="Số tiền (VNĐ)" required />',
						'      <button type="submit" class="button">Ghi giao dịch</button>',
						'    </form>',
						'  </main>',
					],
				},
			];

		case 'calendar':
			return [
				{
					id: 'cal-shell',
					title: 'Lịch sự kiện & Đặt lịch hẹn (.planner-intro & .calendar-grid)',
					zone: 'body',
					marker: /class=["'][^"']*calendar-grid|class=["'][^"']*planner-intro/i,
					lines: [
						'  <main id="main" class="page-content">',
						'    <div class="planner-intro"><div><h1>Lịch &amp; Cuộc hẹn</h1><p>Quản lý lịch học, buổi họp nhóm và đặt khung giờ cá nhân.</p></div></div>',
						'    <section class="calendar-board">',
						'      <div class="sectionhead"><h2>Tháng 11 / 2026</h2><div class="actions"><button type="button" class="secondary">← Tháng trước</button><button type="button" class="secondary">Tháng sau →</button></div></div>',
						'      <div class="calendar-grid">',
						'        <div class="cal-day"><strong>T2</strong></div><div class="cal-day"><strong>T3</strong></div><div class="cal-day"><strong>T4</strong></div><div class="cal-day"><strong>T5</strong></div><div class="cal-day"><strong>T6</strong></div><div class="cal-day"><strong>T7</strong></div><div class="cal-day"><strong>CN</strong></div>',
						'        <button type="button" class="cal-cell">18</button><button type="button" class="cal-cell active">19 • Họp nhóm</button><button type="button" class="cal-cell">20</button><button type="button" class="cal-cell">21</button><button type="button" class="cal-cell">22</button><button type="button" class="cal-cell">23</button><button type="button" class="cal-cell">24</button>',
						'      </div>',
						'    </section>',
						'  </main>',
					],
				},
			];

		case 'mini-tools':
			return [
				{
					id: 'tools-shell',
					title: 'Bộ công cụ tiện ích (.desk-intro & .tool-grid)',
					zone: 'body',
					marker: /class=["'][^"']*desk-intro/i,
					lines: [
						'  <main id="main" class="page-content">',
						'    <div class="desk-intro"><div><h1>Một bàn làm việc. Đủ công cụ cần thiết.</h1><p>Tính toán nhanh, đếm ngược tập trung và xem lịch trong một màn hình.</p></div><small>Chạy ngay trên trình duyệt</small></div>',
						'    <section class="grid">',
						'      <article class="panel"><h2>Máy tính nhanh</h2><input type="text" placeholder="Ví dụ: (125000 * 3) + 45000" aria-label="Biểu thức tính" /><button type="button" class="button">Tính kết quả</button></article>',
						'      <article class="panel"><h2>Đồng hồ đếm ngược</h2><p class="price">25:00</p><div class="actions"><button type="button" class="button">Bắt đầu</button><button type="button" class="secondary">Đặt lại</button></div></article>',
						'    </section>',
						'  </main>',
					],
				},
			];

		case 'tourism':
		case 'homestay':
		case 'cuisine':
		case 'festivals':
		case 'tickets':
			return [
				{
					id: 'css-comp1802-editorial',
					title: 'Layout biên tập & lưới showcase (COMP1802)',
					selector: '.grid',
					marker: /\.trip-hero\s*\{|\.stay-cover\s*\{|\.food-lead\s*\{|\.night-stage\s*\{|\.almanac-title\s*\{/,
					lines: [
						':root { --paper: #faf9f6; --ink: #1f2421; --muted: #666b68; --line: #dedbd2; --accent: #2f5241; }',
						'body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.65 system-ui, sans-serif; }',
						'.trip-hero, .food-lead, .night-stage, .almanac-title { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 36px; max-width: 1180px; margin: 32px auto; padding: 0 24px; align-items: center; }',
						'.stay-cover { position: relative; min-height: 360px; display: grid; place-items: end start; padding: 32px; background: #26352e; color: #fff; }',
						'.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; max-width: 1180px; margin: 24px auto; padding: 0 24px; }',
						'.item { border: 1px solid var(--line); background: #fff; padding: 18px; }',
					],
				},
			];

		case 'courses':
		case 'quiz':
		case 'todo':
		case 'expenses':
		case 'calendar':
		case 'mini-tools':
			return [
				{
					id: 'css-comp1802-workspace',
					title: 'Layout ứng dụng & bảng công cụ (COMP1802)',
					selector: '.panel',
					marker: /\.practice-layout\s*\{|\.learning-summary\s*\{|\.calendar-grid\s*\{|\.task-title\s*\{|\.finance-top\s*\{/,
					lines: [
						':root { --paper: #f8f9fb; --ink: #17202a; --muted: #5b6777; --line: #dce2ea; --accent: #1d4ed8; }',
						'body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.6 system-ui, sans-serif; }',
						'.learning-summary, .practice-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; max-width: 1160px; margin: 24px auto; padding: 0 24px; }',
						'.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }',
						'.cal-cell { padding: 12px 8px; border: 1px solid var(--line); background: #fff; cursor: pointer; }',
						'.panel, .quiz-card, .continue-card, .progress-card { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 20px; }',
					],
				},
			];

		default:
			return null;
	}
}

export function buildComp1802CssSteps(archetypeId) {
	switch (archetypeId) {
		case 'cv':
			return [
				{
					id: 'css-cv-base',
					title: ':root & .resume (Khung CV tối giản chuẩn COMP1802)',
					selector: '.resume',
					marker: /\.resume\s*\{/,
					lines: [
						':root { color-scheme: light; --ink: #242424; --sub: #666; --line: #d7d7d7; }',
						'body { margin: 0; background: #fff; color: var(--ink); font: 15px/1.58 Arial, Helvetica, sans-serif; }',
						'.resume { max-width: 880px; margin: 0 auto; padding: 56px 28px 72px; }',
						'.profile { display: flex; justify-content: space-between; align-items: flex-start; gap: 28px; padding-bottom: 40px; }',
						'.alias { font-size: .55em; color: var(--sub); font-weight: 400; }',
						'.role { font-size: 18px; margin: 4px 0 0; }',
						'.school-short { color: var(--sub); margin: 4px 0 0; }',
						'.contact { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 14px; font-style: normal; margin-top: 16px; }',
						'.contact a { color: inherit; }',
						'.portrait { width: 112px; height: 136px; border: 1px solid var(--line); background: #f2f2f2; display: grid; place-items: center; font-weight: 700; color: #777; }',
					],
				},
				{
					id: 'css-cv-sections',
					title: '.section, .skills, .footer & @media print (Chia cột + chế độ in A4)',
					selector: '.section',
					marker: /\.section\s*\{/,
					lines: [
						'.section { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 24px; padding: 22px 0; border-top: 1px solid var(--line); }',
						'.entry-top { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }',
						'.date { color: var(--sub); font-size: 13px; }',
						'.skills p { margin: 4px 0; }',
						'.footer { display: flex; justify-content: space-between; color: var(--sub); font-size: 12px; padding-top: 18px; border-top: 1px solid var(--line); }',
						'@media (max-width: 680px) { .section { grid-template-columns: 1fr; } }',
						'@media print { @page { size: A4; margin: 15mm; } .resume { padding: 0; } }',
					],
				},
			];

		case 'aquarium':
			return [
				{
					id: 'css-aqua-stage',
					title: '.aquarium & .swimmer (Khung cảnh đại dương)',
					selector: '.aquarium',
					marker: /\.aquarium\s*\{/,
					lines: [
						'html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }',
						'.aquarium {',
						'  position: relative;',
						'  width: 100vw;',
						'  height: 100dvh;',
						'  overflow: hidden;',
						'  background: linear-gradient(180deg, #287b9a 0%, #176587 48%, #0b405f 100%);',
						'}',
						'.swimmer { position: absolute; left: 0; color: #fff; font-size: clamp(18px, 2.5vw, 32px); user-select: none; will-change: transform; }',
						'.goldfish { top: 18%; animation: move-right 18s linear infinite; }',
						'.shark { top: 42%; animation: move-right 24s linear infinite -6s; }',
						'.turtle { top: 68%; animation: move-left 22s linear infinite -4s; }',
					],
				},
				{
					id: 'css-aqua-keyframes',
					title: '@keyframes move-right & move-left',
					selector: '@keyframes move-right',
					marker: /@keyframes\s+move-right/,
					lines: [
						'@keyframes move-right {',
						'  0% { transform: translate3d(-240px, 0, 0); }',
						'  50% { transform: translate3d(50vw, 12px, 0); }',
						'  100% { transform: translate3d(calc(100vw + 240px), 0, 0); }',
						'}',
						'@keyframes move-left {',
						'  0% { transform: translate3d(calc(100vw + 240px), 0, 0) scaleX(-1); }',
						'  100% { transform: translate3d(-240px, 0, 0) scaleX(-1); }',
						'}',
					],
				},
			];

		case 'responsive':
			return [
				{
					id: 'css-comp1802-tablet',
					title: '@media (max-width: 950px) — Bố cục Tablet chuẩn COMP1802',
					selector: '@media (max-width: 950px)',
					marker: /max-width:\s*950px/,
					lines: [
						'@media (max-width: 950px) {',
						'  .nav { flex-wrap: wrap; gap: 20px; }',
						'  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }',
						'  .toolbar { grid-template-columns: 1fr 1fr; }',
						'  .toolbar input { grid-column: 1 / -1; }',
						'  .split { gap: 30px; }',
						'}',
					],
				},
				{
					id: 'css-comp1802-mobile',
					title: '@media (max-width: 650px) & prefers-reduced-motion',
					selector: '@media (max-width: 650px)',
					marker: /max-width:\s*650px/,
					lines: [
						'@media (max-width: 650px) {',
						'  main { padding: 25px 20px 55px; }',
						'  .split, .auth-layout, .grid { grid-template-columns: 1fr; }',
						'  .auth-art { display: none; }',
						'}',
						'@media (prefers-reduced-motion: reduce) {',
						'  *, *::before, *::after { animation: none !important; transition: none !important; }',
						'}',
					],
				},
			];

		case 'about':
		case 'change-password':
		case 'feedback':
		case 'manage':
			return [
				{
					id: 'css-comp1802-shared',
					title: 'Layout chia đôi .split, .auth-layout & form .narrow (COMP1802)',
					selector: '.split',
					marker: /\.split\s*\{|\.auth-layout\s*\{|\.narrow\s*\{/,
					lines: [
						':root { --paper: #ffffff; --ink: #1f2421; --muted: #666b68; --line: #dcdcd6; --accent: #22352c; }',
						'body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.65 system-ui, sans-serif; }',
						'.split { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; max-width: 1180px; margin: 40px auto; padding: 0 24px; align-items: start; }',
						'.auth-layout { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--line); max-width: 980px; margin: 32px auto; }',
						'.narrow { max-width: 560px; margin: 32px auto; padding: 24px; }',
						'.notice { border-left: 3px solid var(--accent); padding-left: 14px; color: var(--muted); font-size: 13px; }',
						'.button, button { display: inline-block; padding: 11px 20px; border: 1px solid var(--accent); background: var(--accent); color: #fff; cursor: pointer; }',
					],
				},
			];

		case 'tourism':
		case 'homestay':
		case 'cuisine':
		case 'festivals':
		case 'tickets':
			return [
				{
					id: 'css-comp1802-editorial',
					title: 'Layout biên tập & lưới showcase (COMP1802)',
					selector: '.grid',
					marker: /\.trip-hero\s*\{|\.stay-cover\s*\{|\.food-lead\s*\{|\.night-stage\s*\{|\.almanac-title\s*\{/,
					lines: [
						':root { --paper: #faf9f6; --ink: #1f2421; --muted: #666b68; --line: #dedbd2; --accent: #2f5241; }',
						'body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.65 system-ui, sans-serif; }',
						'.trip-hero, .food-lead, .night-stage, .almanac-title { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 36px; max-width: 1180px; margin: 32px auto; padding: 0 24px; align-items: center; }',
						'.stay-cover { position: relative; min-height: 360px; display: grid; place-items: end start; padding: 32px; background: #26352e; color: #fff; }',
						'.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; max-width: 1180px; margin: 24px auto; padding: 0 24px; }',
						'.item { border: 1px solid var(--line); background: #fff; padding: 18px; }',
					],
				},
			];

		case 'courses':
		case 'quiz':
		case 'todo':
		case 'expenses':
		case 'calendar':
		case 'mini-tools':
			return [
				{
					id: 'css-comp1802-workspace',
					title: 'Layout ứng dụng & bảng công cụ (COMP1802)',
					selector: '.panel',
					marker: /\.practice-layout\s*\{|\.learning-summary\s*\{|\.calendar-grid\s*\{|\.task-title\s*\{|\.finance-top\s*\{/,
					lines: [
						':root { --paper: #f8f9fb; --ink: #17202a; --muted: #5b6777; --line: #dce2ea; --accent: #1d4ed8; }',
						'body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.6 system-ui, sans-serif; }',
						'.learning-summary, .practice-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; max-width: 1160px; margin: 24px auto; padding: 0 24px; }',
						'.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }',
						'.cal-cell { padding: 12px 8px; border: 1px solid var(--line); background: #fff; cursor: pointer; }',
						'.panel, .quiz-card, .continue-card, .progress-card { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 20px; }',
					],
				},
			];

		default:
			return null;
	}
}
