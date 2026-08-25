# Context Package — QL-TAISAN

File này là "bộ nhớ ngoài" của dự án — đọc trước khi làm việc tiếp, theo CLAUDE.md gốc mục 9.

## 1. Tóm tắt dự án

- **Project ID:** QL-TAISAN
- **Tên:** Phần mềm quản lý tài sản, thiết bị cơ điện
- **Nguồn gốc:** Source code có sẵn trên GitHub (`anhnt205/PM_Quan_Ly_Tai_San`), đưa vào factory bằng onboarding **2026-08-25** — KHÔNG tạo mới từ template.
- **Mục tiêu:** Quản lý vòng đời tài sản cố định + CCDC/vật tư (điều động, bàn giao, sửa chữa/bảo trì, giám định/nghiệm thu, sự cố, khấu hao, ký số, báo cáo, chatbot AI) cho doanh nghiệp nhiều chi nhánh (Cẩm Phả/Cao Sơn/Uông Bí).

## 2. Trạng thái hiện tại

Đã hoàn thành **onboarding read-only** (2026-08-25): clone giữ nguyên lịch sử git, phân tích toàn bộ codebase, tạo đủ bộ tài liệu factory bắt buộc, build baseline THẬT trong Docker. Sau đó (cùng ngày, theo yêu cầu người dùng "đưa lên Control-UI, chạy build và preview") đã: đăng ký project vào `control-api` thật (`POST /api/projects` + `PATCH` từng step qua HTTP, KHÔNG qua MCP vì `software-factory` MCP server không kết nối trong phiên này), và **dựng + verify LIVE preview đầy đủ qua trình duyệt thật** — xem mục "Preview" trong `CLAUDE.md` và `docs/TECHNICAL_DEBT.md` mục 8. **Vẫn chưa sửa bất kỳ dòng code nghiệp vụ nào** — 2 bug phát hiện qua preview chỉ được sửa ở tầng cấu hình `deployment/preview/preview-docker-compose.yaml` (biến môi trường), không đụng source.

Pipeline (khớp cả local `.factory/pipeline.json` lẫn DB `control-api` thật, đã đồng bộ qua PATCH): REQUIREMENT/PROVISION/ARCHITECTURE/BUILD/PREVIEW = PASSED, TEST = SKIPPED (không có test thật để chạy, không phải lỗi), CODE/GIT_PUSH/APPROVAL = PENDING.

Nhánh git: `feature/factory-onboarding` (tạo cục bộ từ `main`, chưa push lên origin — người dùng đã xác nhận giữ cục bộ, xem mục 3). `main` KHÔNG bị đụng vào.

**Preview đang chạy thật** trên máy này: `http://ql-taisan.preview.localhost:8080/` (containers `ql-taisan-preview-*`, 5 service: mysql/redis/backend/frontend/reverseproxy). Đăng nhập demo: `admin`/`admin`. Dừng bằng `docker compose -f deployment/preview/preview-docker-compose.yaml down` (trong thư mục `projects/QL-TAISAN`) — thêm `-v` nếu muốn xoá luôn data MySQL preview.

## 3. Quyết định quan trọng đã chốt

- **`automation.allow_apply_code` để TẮT** trong `project.yaml` — vì (a) không có test nào kiểm chứng thật (0 test case backend, 0 script test frontend), (b) có phát hiện bảo mật nghiêm trọng đang mở (mục 4 dưới). KHÔNG tự ý bật cho tới khi cả 2 điều kiện được xử lý và người phụ trách xác nhận.
- **Không tự sửa bất kỳ phát hiện nào** trong `docs/TECHNICAL_DEBT.md` — đúng yêu cầu "không thay đổi chức năng nghiệp vụ trong bước onboarding" của người dùng. Mọi mục trong đó là GHI NHẬN, chờ người phụ trách quyết định ưu tiên.
- **Không push nhánh `feature/factory-onboarding` lên origin** — chờ xác nhận từ người dùng trước (repo GitHub thật của họ).
- **Không thêm `.gitignore` ở root** (đính chính: `backend/`/`frontend/` đã CÓ `.gitignore` riêng từ trước — nhận định "repo hoàn toàn không có" trong lần ghi đầu là sai, đã sửa trong docs) — đây là thay đổi cấu trúc, cần hỏi trước.
- **Đã hỏi người dùng (2026-08-25) và xác nhận: QL-TAISAN là project ĐỘC LẬP, KHÔNG liên quan/không thay thế `ASSET-MANAGEMENT`** (project cũ có row DB trong control-api nhưng không có thư mục source trên máy này — xem `docs/PROJECT_STATE.md` mục 2 của factory gốc). Giữ nguyên `project_id: QL-TAISAN`, không đụng gì tới `ASSET-MANAGEMENT`.
- **Đã hỏi người dùng (2026-08-25) và xác nhận: CHƯA push nhánh `feature/factory-onboarding` lên GitHub** — giữ cục bộ, chờ yêu cầu sau.

## 4. Vấn đề đã biết / rủi ro — ƯU TIÊN ĐỌC TRƯỚC KHI LÀM BẤT KỲ VIỆC GÌ

**Bảo mật nghiêm trọng (xem đầy đủ `docs/TECHNICAL_DEBT.md` mục 1-3):**
1. `backend/src/main/resources/application.properties` (đã commit vào git) chứa **1 OpenAI API key thật hardcode** — cần rotate ngay trên OpenAI dashboard, không phụ thuộc việc có làm tiếp dự án hay không. Cũng có AWS key/secret đã comment (nên xác minh còn hiệu lực không).
2. 4 file bị commit vào git: `private_key.key`, `keystore.p12`, `ecotel-odoo.id.vn.crt`, `ecotel-odoo.id.vn.ca` (chứng thư ký số) — chưa xử lý (cần `git filter-repo`/BFG để xoá khỏi lịch sử, là thao tác phá lịch sử, cần bàn với người phụ trách repo trước).
3. `backend/backup.sql` (350KB, mysqldump thật) chứa dữ liệu thật ~29 bảng — cần xác nhận có phải dữ liệu nhạy cảm không.
4. **Hệ thống phân quyền được thiết kế đầy đủ nhưng KHÔNG được áp dụng: đã đếm thật 0/89 controller gắn `@RequirePermission`.** Token đăng nhập local luôn full-access. → Hiện tại bất kỳ user xác thực nào cũng gọi được hầu hết API.
5. Mật khẩu tài khoản local (`TaiKhoan.MatKhau`) lưu **plaintext**, so sánh bằng `String.equals()` — không hash. **Đã verify LIVE (2026-08-25) qua preview: API `POST /api/taikhoan/login` còn trả nguyên mật khẩu plaintext về client trong response JSON** (field `matKhau`).
6. CI (`build-test.yml`) không hề chạy test thật — chỉ build rồi SSH deploy thẳng lên staging khi push `main`.
7. **`JWT_SECRET_EXPIRATION` bị circular placeholder reference — app CRASH khi khởi động nếu biến môi trường này không được set** (kể cả staging/production thật, không chỉ preview). Xem `docs/TECHNICAL_DEBT.md` mục 8 để biết cách preview đã né lỗi này (set thẳng env var, không sửa `application.properties`).

**Không tự ý coi các mục trên là "đã sửa"** nếu chưa thấy commit thật sửa chúng — kiểm tra lại `git log`/code thật trước khi giả định.

**Hạn chế khi build/chạy:**
- `docker-compose.yml` gốc của repo CHỈ chạy được `reverse_proxy` + `frontend` — thiếu backend/MySQL/Redis. Factory đã thêm `deployment/preview/preview-docker-compose.yaml` (file MỚI, không sửa gì có sẵn) để có full stack chạy local — xem mục 2.
- Preview hiện tại **KHÔNG tích hợp Portal/SSO** (`PORTAL_JWKS_URI` trỏ placeholder giả, chỉ đăng nhập local được test). Dự án `PORTAL-PM` (cùng `projects/` của factory này) là hệ Portal/Kong thật QL-TAISAN có thể tích hợp — đang chạy sống trên máy này (`portal-pm-local-*`), JWKS thật ở `http://portal-service:1188/api/.well-known/jwks.json` (theo `projects/PORTAL-PM/docs/CODEBASE_MAP.md`) — nếu sau này cần test tích hợp SSO thật, cần nối network + trỏ đúng URI này, chưa làm.
- Không có `.env`/`.env.example` nào trong repo gốc (frontend/backend đều không) — danh sách biến môi trường đầy đủ ở `docs/ARCHITECTURE_CURRENT.md` mục 5. Preview tự tạo `frontend/.env` cục bộ (KHÔNG commit — `frontend/.gitignore` đã ignore `.env`).

## 5. Bước tiếp theo (chưa làm, ngoài phạm vi đã hoàn thành)

1. Người phụ trách xem xét `docs/TECHNICAL_DEBT.md`, quyết định ưu tiên xử lý (đặc biệt mục 1-3 — bảo mật, và mục 8 — 2 bug mới phát hiện qua preview).
2. Rotate OpenAI API key + xác minh AWS key đã lộ (KHÔNG phụ thuộc các bước còn lại, nên làm ngay).
3. Xác nhận với người phụ trách gốc: `JWT_SECRET_EXPIRATION` có đang được set ở đâu đó trên staging/production thật không, hay app thật cũng đang crash/chưa deploy lại gần đây (mục 4.7).
4. Nếu muốn push nhánh onboarding lên GitHub: xác nhận với người dùng trước (remote là repo thật của họ) — đã hỏi 1 lần (2026-08-25), câu trả lời lúc đó là "chưa", có thể đã đổi ý sau này.
5. Cân nhắc thêm test baseline thật (ít nhất vài test cho luồng login/permission) trước khi bật `automation.allow_apply_code`.
6. Nếu muốn dừng preview đang chạy: `docker compose -f deployment/preview/preview-docker-compose.yaml down` (trong `projects/QL-TAISAN`).

## 6. Liên kết tài liệu

- `Requirement.md` (trỏ sang `docs/REQUIREMENTS_AS_IS.md`)
- `docs/ARCHITECTURE_CURRENT.md`, `docs/CODEBASE_MAP.md`, `docs/REQUIREMENTS_AS_IS.md`, `docs/TECHNICAL_DEBT.md`
- `.factory/pipeline.json` (trạng thái pipeline chi tiết)
