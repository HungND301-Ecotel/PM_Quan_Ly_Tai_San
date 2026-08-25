# Context Package — QL-TAISAN

File này là "bộ nhớ ngoài" của dự án — đọc trước khi làm việc tiếp, theo CLAUDE.md gốc mục 9.

## 1. Tóm tắt dự án

- **Project ID:** QL-TAISAN
- **Tên:** Phần mềm quản lý tài sản, thiết bị cơ điện
- **Nguồn gốc:** Source code có sẵn trên GitHub (`anhnt205/PM_Quan_Ly_Tai_San`), đưa vào factory bằng onboarding **2026-08-25** — KHÔNG tạo mới từ template.
- **Mục tiêu:** Quản lý vòng đời tài sản cố định + CCDC/vật tư (điều động, bàn giao, sửa chữa/bảo trì, giám định/nghiệm thu, sự cố, khấu hao, ký số, báo cáo, chatbot AI) cho doanh nghiệp nhiều chi nhánh (Cẩm Phả/Cao Sơn/Uông Bí).

## 2. Trạng thái hiện tại

Vừa hoàn thành **bước onboarding read-only** (2026-08-25): clone giữ nguyên lịch sử git, phân tích toàn bộ codebase (89 controller, 95 service, 173 model, 136 migration, ~35 trang frontend), tạo đủ bộ tài liệu factory bắt buộc, build+test baseline THẬT trong Docker. **Chưa sửa bất kỳ dòng code nghiệp vụ nào.**

Pipeline: REQUIREMENT/PROVISION/ARCHITECTURE/BUILD/TEST = PASSED. CODE/PREVIEW/GIT_PUSH/APPROVAL = PENDING (xem `.factory/pipeline.json` để biết vì sao từng bước).

Nhánh git: `feature/factory-onboarding` (tạo cục bộ từ `main`, chưa push lên origin). `main` KHÔNG bị đụng vào.

## 3. Quyết định quan trọng đã chốt

- **`automation.allow_apply_code` để TẮT** trong `project.yaml` — vì (a) không có test nào kiểm chứng thật (0 test case backend, 0 script test frontend), (b) có phát hiện bảo mật nghiêm trọng đang mở (mục 4 dưới). KHÔNG tự ý bật cho tới khi cả 2 điều kiện được xử lý và người phụ trách xác nhận.
- **Không tự sửa bất kỳ phát hiện nào** trong `docs/TECHNICAL_DEBT.md` — đúng yêu cầu "không thay đổi chức năng nghiệp vụ trong bước onboarding" của người dùng. Mọi mục trong đó là GHI NHẬN, chờ người phụ trách quyết định ưu tiên.
- **Không push nhánh `feature/factory-onboarding` lên origin** — chờ xác nhận từ người dùng trước (repo GitHub thật của họ).
- **Không thêm `.gitignore`** dù repo hoàn toàn không có — đây là thay đổi cấu trúc, cần hỏi trước.
- **Đã hỏi người dùng (2026-08-25) và xác nhận: QL-TAISAN là project ĐỘC LẬP, KHÔNG liên quan/không thay thế `ASSET-MANAGEMENT`** (project cũ có row DB trong control-api nhưng không có thư mục source trên máy này — xem `docs/PROJECT_STATE.md` mục 2 của factory gốc). Giữ nguyên `project_id: QL-TAISAN`, không đụng gì tới `ASSET-MANAGEMENT`.
- **Đã hỏi người dùng (2026-08-25) và xác nhận: CHƯA push nhánh `feature/factory-onboarding` lên GitHub** — giữ cục bộ, chờ yêu cầu sau.

## 4. Vấn đề đã biết / rủi ro — ƯU TIÊN ĐỌC TRƯỚC KHI LÀM BẤT KỲ VIỆC GÌ

**Bảo mật nghiêm trọng (xem đầy đủ `docs/TECHNICAL_DEBT.md` mục 1-3):**
1. `backend/src/main/resources/application.properties` (đã commit vào git) chứa **1 OpenAI API key thật hardcode** — cần rotate ngay trên OpenAI dashboard, không phụ thuộc việc có làm tiếp dự án hay không. Cũng có AWS key/secret đã comment (nên xác minh còn hiệu lực không).
2. 4 file bị commit vào git: `private_key.key`, `keystore.p12`, `ecotel-odoo.id.vn.crt`, `ecotel-odoo.id.vn.ca` (chứng thư ký số) — chưa xử lý (cần `git filter-repo`/BFG để xoá khỏi lịch sử, là thao tác phá lịch sử, cần bàn với người phụ trách repo trước).
3. `backend/backup.sql` (350KB, mysqldump thật) chứa dữ liệu thật ~29 bảng — cần xác nhận có phải dữ liệu nhạy cảm không.
4. **Hệ thống phân quyền được thiết kế đầy đủ nhưng KHÔNG được áp dụng: đã đếm thật 0/89 controller gắn `@RequirePermission`.** Token đăng nhập local luôn full-access. → Hiện tại bất kỳ user xác thực nào cũng gọi được hầu hết API.
5. Mật khẩu tài khoản local (`TaiKhoan.MatKhau`) lưu **plaintext**, so sánh bằng `String.equals()` — không hash.
6. CI (`build-test.yml`) không hề chạy test thật — chỉ build rồi SSH deploy thẳng lên staging khi push `main`.

**Không tự ý coi các mục trên là "đã sửa"** nếu chưa thấy commit thật sửa chúng — kiểm tra lại `git log`/code thật trước khi giả định.

**Hạn chế khi build/chạy:**
- `docker-compose.yml` gốc của repo CHỈ chạy được `reverse_proxy` + `frontend` — thiếu backend/MySQL/Redis. Không có 1 file compose nào trong repo chạy full stack local từ source (chỉ có bản deploy kéo image đã build sẵn từ DockerHub).
- Không có `.env`/`.env.example` nào — danh sách biến môi trường đầy đủ ở `docs/ARCHITECTURE_CURRENT.md` mục 5.
- Backend cần Redis sống để luồng đăng nhập qua Portal (OTC exchange) hoạt động; không cần Redis nếu chỉ đăng nhập local.
- Đã xác nhận: dự án `PORTAL-PM` (cùng nằm trong `projects/` của factory này) chính là hệ Portal/Kong mà QL-TAISAN có thể tích hợp SSO — đang chạy sống trên máy này lúc onboarding (container `portal-pm-local-*`), có thể dùng làm nguồn `PORTAL_JWKS_URI` thật nếu sau này cần test tích hợp SSO.

## 5. Bước tiếp theo (chưa làm, ngoài phạm vi "onboarding read-only")

1. Người phụ trách xem xét `docs/TECHNICAL_DEBT.md`, quyết định ưu tiên xử lý (đặc biệt mục 1-3 — bảo mật).
2. Rotate OpenAI API key + xác minh AWS key đã lộ (việc này KHÔNG phụ thuộc vào các bước còn lại của factory, nên làm ngay).
3. Nếu muốn chạy preview thật: cần chuẩn bị MySQL + (tuỳ chọn) Redis/Kong/Portal, tạo `.env` theo danh sách ở `docs/ARCHITECTURE_CURRENT.md` mục 5 — chưa làm trong bước này.
4. Nếu muốn push nhánh onboarding lên GitHub: xác nhận với người dùng trước (remote là repo thật của họ).
5. Cân nhắc thêm test baseline thật (ít nhất vài test cho luồng login/permission) trước khi bật `automation.allow_apply_code`.

## 6. Liên kết tài liệu

- `Requirement.md` (trỏ sang `docs/REQUIREMENTS_AS_IS.md`)
- `docs/ARCHITECTURE_CURRENT.md`, `docs/CODEBASE_MAP.md`, `docs/REQUIREMENTS_AS_IS.md`, `docs/TECHNICAL_DEBT.md`
- `.factory/pipeline.json` (trạng thái pipeline chi tiết)
