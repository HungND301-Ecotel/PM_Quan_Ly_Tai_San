# QL-TAISAN — Hướng dẫn cho Claude Code

Dự án này được **đưa tay (onboard) vào AI Software Factory** ngày 2026-08-25 — source code đã có sẵn từ trước (GitHub `anhnt205/PM_Quan_Ly_Tai_San`, `git clone` giữ nguyên lịch sử), không tạo mới qua template của factory. Đọc file này trước khi làm bất kỳ việc gì trong thư mục `projects/QL-TAISAN/`.

## Đọc gì trước

1. `docs/ARCHITECTURE_CURRENT.md` — kiến trúc thật đang chạy (auth 2 loại token, phân quyền, multi-tenant, WebSocket, chatbot AI, biến môi trường đầy đủ).
2. `docs/REQUIREMENTS_AS_IS.md` — nghiệp vụ suy từ code (13 nhóm, 89 controller — chưa có tờ trình/spec chính thức, repo chỉ có `README.md` 2 dòng).
3. `docs/TECHNICAL_DEBT.md` — **đọc kỹ mục 1-3 trước khi động vào bất kỳ code nào**: secret thật bị lộ trong git (OpenAI key, private key, keystore), phân quyền được thiết kế nhưng không được áp dụng (0/89 controller), mật khẩu tài khoản local lưu plaintext.
4. `docs/CODEBASE_MAP.md` — bản đồ thư mục + công nghệ nhanh.

**Không tin `README.md` gốc** (2 dòng, không có hướng dẫn setup) — luôn ưu tiên đọc code thật hoặc 4 file trên.

## Quy tắc bắt buộc cho dự án này

1. **`automation.allow_apply_code` đang TẮT trong `project.yaml`** — 2 lý do: (a) không có test nào kiểm chứng được thật (backend 0 test case, frontend không có script test), (b) đang có phát hiện bảo mật nghiêm trọng chưa xử lý (xem mục 3 dưới). Không tự ý bật cờ này cho tới khi cả 2 điều kiện trên được giải quyết và người phụ trách xác nhận.
2. **KHÔNG BAO GIỜ in ra, log, hay commit giá trị secret thật** đã phát hiện trong bước onboarding (OpenAI API key trong `application.properties`, nội dung `private_key.key`/`keystore.p12`/`*.crt`/`*.ca`, dữ liệu trong `backend/backup.sql`). Các file này đã tồn tại từ trước trong lịch sử git — không phải do factory tạo ra, nhưng tuyệt đối không đọc/in nội dung của chúng trừ khi được yêu cầu rõ ràng và có lý do chính đáng.
3. **Hệ thống hiện KHÔNG có kiểm soát phân quyền endpoint nào hoạt động thật** — `@RequirePermission` tồn tại nhưng không gắn ở controller nào (0/89), token local luôn full-access. Nếu được yêu cầu thêm/sửa endpoint, cân nhắc nhắc người dùng về khoảng trống này thay vì mặc định là "đã có phân quyền nên an toàn".
4. **Mật khẩu tài khoản local lưu plaintext** (`TaiKhoan.MatKhau`, so sánh bằng `String.equals()`) — không tự ý coi đây là điều "đã sửa xong", đây là hiện trạng gốc chưa được xử lý.
5. **`backend/.gitignore`/`frontend/.gitignore` đã có sẵn (ignore `.env`), chỉ thiếu 1 file dùng chung ở root** — vẫn cẩn thận khi tạo file mới ở root/`deployment/`/`reverse_proxy/` (không có gitignore riêng ở đó). Thêm `.gitignore` root là 1 thay đổi cấu trúc, cần hỏi người dùng trước khi làm (theo CLAUDE.md gốc mục 8).
6. **`docker-compose.yml` gốc CHỈ chạy được `reverse_proxy` + `frontend`** — không có backend/MySQL/Redis. Xem `docs/ARCHITECTURE_CURRENT.md` mục 6 trước khi cố "chạy thử app", đừng giả định `docker compose up` là đủ.
7. **Không có `.env`/`.env.example` nào trong repo** — toàn bộ danh sách biến môi trường bắt buộc đã liệt kê ở `docs/ARCHITECTURE_CURRENT.md` mục 5. Không tự bịa giá trị; nếu cần chạy app thật, phải xin người phụ trách cung cấp (đặc biệt `MYSQL_*`, `PORTAL_JWKS_URI`, `AWS_*`, `REDIS_*`).
8. **Không đổi chức năng nghiệp vụ khi chưa được yêu cầu rõ ràng** — các phát hiện trong `TECHNICAL_DEBT.md` (vd `DefaultIdCongTyAdvice` ép cứng `CT001`, `SuCoTaiSan` vs `SuCoThietBi` trùng lặp...) là CHỈ GHI NHẬN, không tự ý sửa trừ khi người dùng yêu cầu cụ thể.
9. **Kiến trúc data-access hỗn hợp**: đa số dùng `JdbcTemplate`/DAO viết SQL tay (86 file), chỉ 6 bảng dùng JPA thật. Khi sửa 1 module, kiểm tra module đó đang theo pattern nào trước khi thêm code mới, đừng trộn lẫn pattern trong cùng 1 module.
10. **`AdminSeeder`/`PermissionSeeder`/`KhoMacDinhSeeder`/`TemplateLyLichSeeder` tự chạy mỗi lần server khởi động** (`CommandLineRunner`) — biết trước để không ngạc nhiên khi thấy tài khoản `admin` hay 20 permission module xuất hiện trên môi trường mới.

## Lệnh build/test thật (xem `project.yaml` để dùng qua factory)

```bash
# Build backend (multi-stage, image cuối chạy được app thật nếu có đủ env)
docker build -t qlts-taisan-backend-baseline ./backend

# Test backend — LUÔN báo "No tests to run" (không có file test nào), chỉ xác
# nhận code compile được, không kiểm chứng logic
docker build --target builder -t qlts-taisan-backend-builder ./backend
docker run --rm --entrypoint sh qlts-taisan-backend-builder -c "mvn test"

# Frontend: chưa có lệnh test nào để chạy (không có script "test" trong package.json)
docker build -t qlts-taisan-frontend-baseline ./frontend   # cần frontend/.env thật để bake đúng VITE_* — xem mục 7 ở trên
```

## Preview

Đã dựng và verify LIVE qua trình duyệt (2026-08-25): login, dashboard load đúng theo branding. Preview dùng MySQL/Redis local riêng (KHÔNG phải dữ liệu/credential production thật) — 136 migration Flyway tự chạy khi container khởi động lần đầu (đã verify: chạy sạch trên DB rỗng). Portal/SSO KHÔNG được test qua preview này (chỉ đăng nhập local). Chi tiết đầy đủ + 2 bug thật phát hiện được khi chạy full stack: `docs/TECHNICAL_DEBT.md` mục 8.

```bash
docker compose -f deployment/preview/preview-docker-compose.yaml up -d --build
# → http://ql-taisan.preview.localhost:8080/ (đăng nhập admin/admin — seed bởi AdminSeeder.java)
# Dừng: docker compose -f deployment/preview/preview-docker-compose.yaml down
# Dừng + xoá luôn data MySQL: thêm -v vào lệnh down
```

## Vai trò hệ thống (đã xác nhận trong code)

Không có tên vai trò hardcode — `Role`/`Permission` quản lý động qua `RoleController`/`PermissionManagementController`. 20 module quyền được seed sẵn (`PermissionSeeder.java`, mã `TAISAN`, `CCDCVT`, `BANGIAO_TAISAN`...), mỗi module có 5 hành động `c/r/u/d/a` — nhưng **chưa có controller nào thật sự kiểm tra các quyền này** (xem mục 3 ở trên).
