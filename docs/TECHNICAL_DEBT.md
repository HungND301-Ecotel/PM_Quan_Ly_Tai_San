# Nợ kỹ thuật & phát hiện bảo mật — QL-TAISAN

> Ghi nhận hiện trạng đã xác minh thật (đọc code trực tiếp, không suy đoán) trong bước onboarding (2026-08-25). **Đây CHỈ là ghi nhận — không tự ý sửa** theo đúng yêu cầu "không thay đổi chức năng nghiệp vụ trong bước onboarding". Mọi giá trị secret nêu dưới đây đều bị che (KHÔNG in giá trị thật) theo đúng quy tắc bảo mật của factory.

## 1. NGHIÊM TRỌNG — Secret thật bị lộ trong Git (cần xử lý ngay, không phụ thuộc vào việc có làm tiếp dự án này hay không)

**Sửa lại sau khi kiểm tra kỹ hơn (2026-08-25, lúc dựng preview thật):** `backend/.gitignore` và `frontend/.gitignore` **CÓ tồn tại** và đều ignore `.env` — nhận định ban đầu "repo không có `.gitignore` nào" trong bản trước của tài liệu này là SAI (do lệnh kiểm tra ban đầu chỉ tìm ở root, không tìm sâu vào 2 thư mục con). Repo chỉ thiếu `.gitignore` ở **root** (không ảnh hưởng gì thêm — `deployment/`, `reverse_proxy/` không có file build-artifact nào cần ignore). Điều này KHÔNG thay đổi phát hiện chính: `backend/.gitignore` chặn `.env` nhưng **không chặn `application.properties`** (đúng, vì file đó phải được commit — chỉ riêng dòng `openai.api.key=...` trong đó là hardcode giá trị thật thay vì đọc qua biến môi trường như mọi secret khác cùng file). Đã xác minh các file sau **đang được Git track thật** (`git ls-files`), tức nằm trong lịch sử commit, không chỉ ở working tree:

- **`backend/src/main/resources/application.properties`** chứa **1 OpenAI API key dạng `sk-proj-...` hardcode trực tiếp** (dòng `openai.api.key=...`) — đây là secret duy nhất trong toàn bộ file không đi qua biến môi trường (mọi secret khác đều dùng `${VAR}`). **Khuyến nghị: coi như đã lộ, thu hồi/rotate ngay trên OpenAI dashboard, bất kể có tiếp tục làm dự án này hay không.**
- Cùng file này còn có (đã comment nhưng vẫn nằm trong lịch sử git, không phải đang hoạt động): 1 cặp `aws.s3.access-key`/`aws.s3.secret-key` dạng thật (`AKIA...`), và mật khẩu MySQL dev `root`/`ecotel2025`. Vì đã bị comment nên KHÔNG chắc còn hiệu lực trên AWS thật, nhưng nên xác minh/rotate nếu cặp khoá đó còn tồn tại trên tài khoản AWS.
- **`backend/src/main/resources/private_key.key`** — file tên rõ ràng là private key, được commit thẳng vào git.
- **`backend/src/main/resources/keystore.p12`** — Java keystore (chứa private key, có thể có mật khẩu bảo vệ hoặc không).
- **`backend/src/main/resources/ecotel-odoo.id.vn.ca`** và **`ecotel-odoo.id.vn.crt`** — chứng chỉ (ít nhạy cảm hơn `.key`/`.p12` vì cert công khai thường không phải bí mật, nhưng đi kèm domain thật `ecotel-odoo.id.vn` nên vẫn nên xác nhận có đúng ý đồ commit hay không).
- **`backend/backup.sql`** (350KB, `mysqldump` thật) — chứa `INSERT INTO` cho **~29 bảng nghiệp vụ có dữ liệu thật** (nhân viên, công ty, tài sản...). Cần xác nhận đây có phải dữ liệu thật của khách hàng/nội bộ hay chỉ là dữ liệu demo/test — nếu là dữ liệu thật, đây là rò rỉ dữ liệu (có thể gồm thông tin cá nhân nhân viên: họ tên, số điện thoại, email).
- File này **KHÔNG in lại giá trị secret thật** ở bất kỳ đâu, kể cả trong các file `docs/*.md` khác được tạo ở bước onboarding — đã tuân thủ đúng quy tắc factory.

**Việc cần làm (đề xuất, chưa thực hiện — cần người phụ trách dự án quyết định):**
1. Rotate ngay OpenAI API key đang lộ.
2. Xác minh cặp AWS key đã comment còn hiệu lực không, rotate nếu có.
3. Xoá 4 file `.key`/`.p12`/`.crt`/`.ca` khỏi working tree hiện tại VÀ khỏi lịch sử git (cần `git filter-repo`/BFG — thao tác phá lịch sử, cần bàn riêng với người phụ trách repo, không tự ý làm).
4. Xác nhận `backup.sql`/`db.sql`/`query.sql` có cần thiết phải nằm trong repo không — nếu chỉ là backup tay của 1 người, nên chuyển ra ngoài git.
5. (Tuỳ chọn, ưu tiên thấp) Thêm `.gitignore` ở root — `backend/`/`frontend/` đã có sẵn, chỉ thiếu 1 file dùng chung ở root; không phải nguyên nhân của phát hiện nào ở mục này.

## 2. NGHIÊM TRỌNG — CI "build-test" không hề chạy test, tự động deploy thẳng lên staging khi push `main`

`.github/workflows/build-test.yml` (trigger: mọi lần push nhánh `main`) tên là "Build and run tests for staging version" nhưng thực tế: `make test` chỉ build + push Docker image lên DockerHub (không có `mvn test`/`npm test` nào trong toàn bộ workflow), sau đó **SSH thẳng vào server staging và deploy ngay** (`start-app.sh`). Không có gate kiểm thử nào giữa "code được push" và "code chạy trên staging". Kết hợp với việc backend hoàn toàn không có test (mục 4), nghĩa là **mọi commit lên `main` đều lên thẳng staging mà không qua bất kỳ kiểm chứng tự động nào**.

Ngoài ra, `build-test.yml` có `cat ./frontend/.env` và `cat .env` (dòng 34, 46) — in nội dung 2 file `.env` (được tạo động từ GitHub Secrets ngay trước đó) ra log CI. Nội dung hiện tại của các file này (URL API, tên registry/version) không đặc biệt nhạy cảm, nhưng đây là thói quen rủi ro nếu sau này có ai thêm biến nhạy cảm hơn vào cùng file `.env` mà không để ý dòng `cat` này.

## 3. NGHIÊM TRỌNG — Hệ thống phân quyền được thiết kế đầy đủ nhưng KHÔNG được áp dụng vào bất kỳ endpoint nghiệp vụ nào

Đã xác minh bằng cách đếm thật trên toàn bộ mã nguồn (không suy đoán):

- **0/89 controller** gắn `@RequirePermission`.
- Chỉ **1/89 controller** dùng `@PreAuthorize`/tương đương.
- Chỉ **1/89 controller** dùng `@PublicApi`.

Cơ chế `PermissionFilter` mặc định **cho qua** (không chặn) khi endpoint không có annotation nào — nghĩa là toàn bộ 87 controller còn lại không hề bị kiểm tra quyền chi tiết, dù hệ thống có đủ hạ tầng (bảng `Role`/`Permission`/`RolePermission`/`UserPermission`, DTO `PermissionDto` với 5 hành động c/r/u/d/a, JWT claim `permissions`). Thêm vào đó, **token loại "local" luôn được cấp full-access vô điều kiện** (`AppTokenFilter`, comment trong code gọi là "phương án A"), bỏ qua `PermissionFilter` hoàn toàn bất kể có annotation hay không.

**Hệ quả xác minh được:** ở trạng thái code hiện tại, bất kỳ ai xác thực thành công (kể cả tự đăng ký tài khoản local nếu có endpoint tạo tài khoản không bị chặn) đều gọi được hầu như mọi API — bao gồm cả các API nhạy cảm như `DatabaseMigrationController` (đồng bộ dữ liệu từ CSDL ngoài) hay quản lý tài khoản/phân quyền.

Đi kèm: **mật khẩu tài khoản local lưu plaintext**. Cột `TaiKhoan.MatKhau` kiểu `varchar(50)`, `AdminSeeder.java` insert giá trị chuỗi thô (không hash), và `TaiKhoanDao.login()` so khớp bằng `String.equals()` — không có `BCryptPasswordEncoder`/Argon2/bất kỳ thư viện hash mật khẩu nào trong toàn bộ codebase.

## 4. Hoàn toàn chưa có test tự động

- **Backend**: thư mục `backend/src/test/` **không tồn tại** — dù `pom.xml` có khai `spring-boot-starter-test`. `mvn test` chạy được (không lỗi) nhưng luôn báo 0 test — không kiểm chứng được gì.
- **Frontend**: `package.json` **không có script `test`** — dù đã cài `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@types/jest`, nhưng không có Jest/Vitest config nào nối các thư viện này vào một lệnh chạy được.

Vì lý do này, `project.yaml` của bước onboarding **cố tình KHÔNG bật `automation.allow_apply_code`** — cơ chế đó dựa vào build/test thật để tự xác minh + tự revert khi fail, nhưng ở đây "test" không có nghĩa gì để tin cậy.

## 5. Nợ kỹ thuật cấu trúc dữ liệu / build

- **Kiến trúc data-access không nhất quán**: 86 file DAO dùng `JdbcTemplate` (SQL viết tay) song song với chỉ 6 entity dùng Spring Data JPA thật, dù `pom.xml` cấu hình đầy đủ Hibernate/JPA — 2 pattern truy cập dữ liệu khác nhau cùng tồn tại, tăng chi phí bảo trì và rủi ro không nhất quán khi sửa.
- **Phần lớn bảng ở migration gốc (`V1__init_database.sql`) không có ràng buộc khóa ngoại (FK) ở tầng DB** — toàn vẹn tham chiếu chỉ được đảm bảo ở tầng ứng dụng Java. Các bảng thêm muộn hơn (V142, V143) mới bắt đầu có `FOREIGN KEY ... ON DELETE CASCADE` — cho thấy convention đổi giữa các giai đoạn, không phải chủ đích thiết kế nhất quán.
- **`pom.xml` khai trùng dependency**: `org.apache.poi:poi-ooxml` và `poi-scratchpad` mỗi cái khai 2 lần cùng version 5.2.3 (dòng ~76-85 và ~138-147) — Maven cảnh báo thật khi build (`'dependencies.dependency...' must be unique`), không gây lỗi nhưng là dấu hiệu copy-paste không dọn.
- **`flyway-maven-plugin` trong `pom.xml`** hardcode `jdbc:mysql://localhost:3306/quanlytaisan`, user `root`, password của máy dev cá nhân — chỉ dùng khi chạy `mvn flyway:*` trực tiếp (không ảnh hưởng runtime, vì Flyway thật chạy qua `spring.flyway.*` đọc biến môi trường), nhưng vẫn là credential cá nhân committed vào git.
- **`backend/Dockerfile` build bằng JDK 21** (`maven:3.9.8-eclipse-temurin-21`) trong khi `pom.xml` khai `<java.version>17</java.version>` — build vẫn chạy được (JDK 21 tương thích ngược), nhưng không phải target version khai báo; nên xác nhận đây có phải chủ đích (muốn chạy trên 21) hay chỉ là chưa đồng bộ.
- **File không liên quan bị commit vào `backend/`**: `.dart_tool/` và `pubspec.lock` (tàn dư dự án Flutter/Dart nào đó, không liên quan gì tới backend Java hiện tại), `test_chu_ky.ipynb` (notebook Python), `start-QuanLyTaiSanBE.bat` (hardcode đường dẫn tuyệt đối máy Windows cá nhân `D:\QUANLYTAISAN\...`, `C:\Program Files\Java\jdk-21\...` — không dùng được trên máy khác).
- **`docker-compose.yml` (dev, ở gốc repo) chỉ có `reverse_proxy` + `frontend`** — không có backend/MySQL/Redis, nên không thể "chạy thử app" chỉ bằng `docker compose up` như tên file gợi ý. Factory đã thêm `deployment/preview/preview-docker-compose.yaml` (file MỚI, không sửa file gốc nào) để có 1 stack đầy đủ chạy thật cho preview — xem mục 8 dưới đây.
- **2 bug thật chỉ lộ ra khi chạy full stack** (không thấy được nếu chỉ đọc code hoặc chỉ build riêng lẻ từng service) — xem chi tiết ở mục 8.
- **Không có file `.env.example` nào** (backend lẫn frontend) trong repo — người mới không có gì để tham chiếu danh sách biến môi trường cần thiết; toàn bộ danh sách trong `docs/ARCHITECTURE_CURRENT.md` mục 5 phải suy ngược từ code.

Ngoài ra, build frontend thật (`docker build ./frontend`, 2026-08-25) thành công nhưng Vite cảnh báo **1 chunk JS chính nặng 8.6MB** (`index-*.js`, gzip ~2.75MB) — vượt xa ngưỡng khuyến nghị 500KB, chưa áp dụng code-splitting (`dynamic import()`/`manualChunks`). Không chặn build/chạy, nhưng ảnh hưởng thời gian tải trang lần đầu.

## 6. Chatbot AI — lớp chặn SQL nguy hiểm dựa trên regex, không phải whitelist

`ChatbotService` cho phép OpenAI sinh SQL rồi thực thi trực tiếp qua `JdbcTemplate`, chỉ chặn bằng regex các từ khóa nguy hiểm (`INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|GRANT|REVOKE`). Đây là blocklist, không phải whitelist cấu trúc câu lệnh — về nguyên tắc có thể có cách viết SQL hoặc chỉ dẫn prompt khiến model né được các từ khóa bị chặn trong khi vẫn sinh ra hành vi không mong muốn (dù giới hạn 1000 dòng và chỉ chạy qua tài khoản DB hiện có giảm phần nào rủi ro). Chưa xác minh được `openai.api.key`/kết nối này có giới hạn rate/cost ở đâu khác không.

## 7. Ghi chú nghiệp vụ chưa rõ / khả năng trùng lặp (không phải lỗi, cần hỏi lại đội phát triển gốc)

Xem `docs/REQUIREMENTS_AS_IS.md` mục 7 và `docs/ARCHITECTURE_CURRENT.md` phần "Ghi chú" để biết đầy đủ. Tóm tắt:

- `DefaultIdCongTyAdvice` ép cứng mọi request ghi về 1 công ty `"CT001"` dù schema thiết kế multi-tenant — chưa rõ chủ đích hay nợ kỹ thuật.
- `SuCoTaiSan` vs `SuCoThietBi` — 2 khái niệm "sự cố" song song, không liên kết nhau.
- `PermissionManagementController` chồng chéo chức năng với `RolePermissionController`/`UserPermissionController`/`UserRoleController`.
- 4 controller xử lý file khác nhau (`S3Controller`, `UploadFileController`, `TaiSanFileController`, `PdfController`) với 2 cơ chế lưu trữ song song (S3 vs local disk `uploads/`).
- Model có DB table nhưng không thấy controller riêng: `PhuLucTaiSan`, `BanGiaoPhuLuc`/`ChiTietBanGiaoPhuLuc`, `DieuDongPhuLucTaiSan`/`ChiTietDieuDongPhucLucTaiSan`.
- `WebSocketController` phần lớn là endpoint `/test/...` (công cụ debug) lẫn trong API production, không thấy giới hạn quyền truy cập riêng.
- `DeviceWebSocketHandler` (raw WebSocket) chỉ echo — chưa rõ có dùng thật hay là code thử nghiệm còn sót.
- `BanGiaoTaiSanDao` dùng cache tĩnh nạp 1 lần lúc khởi động (`static` + `@PostConstruct` + `CompletableFuture`) — cần xác nhận có cơ chế invalidate khi dữ liệu đổi hay không (rủi ro đọc dữ liệu cũ).

## 8. Preview thật — 2 bug thật phát hiện khi chạy full stack (2026-08-25)

Đã dựng preview đầy đủ (MySQL 8 rỗng + Redis + backend + frontend + reverse-proxy, build từ source thật, KHÔNG dùng dữ liệu/credential thật) qua `deployment/preview/preview-docker-compose.yaml` — xem mục "Preview" trong `CLAUDE.md` cho URL/lệnh chạy. Đã verify LIVE qua trình duyệt thật: trang đăng nhập load đúng branding (`VITE_BRAND=UB` → "CÔNG TY THAN UÔNG BÍ - TKV"), đăng nhập `admin`/`admin` thành công, dashboard load đủ layout + gọi API thật (0 dữ liệu vì DB rỗng, đúng như kỳ vọng).

**Bug #1 — circular placeholder reference, sẽ crash CẢ staging/production thật, không chỉ preview:**

`application.properties` có `JWT_SECRET_EXPIRATION=${JWT_SECRET_EXPIRATION:28800000}` — property tên `JWT_SECRET_EXPIRATION` có giá trị tự tham chiếu chính biến môi trường cùng tên kèm default. Nếu **không có** biến môi trường `JWT_SECRET_EXPIRATION` thật nào được set (đúng như trường hợp preview ban đầu), Spring không rơi về default mà coi đây là **circular reference** và crash ngay lúc khởi động:

```
PlaceholderResolutionException: Circular placeholder reference 'JWT_SECRET_EXPIRATION'
in value "${JWT_SECRET_EXPIRATION:28800000}" <-- "${JWT_SECRET_EXPIRATION}"
```

Đã xác minh: `JWT_SECRET_KEY` dùng ĐÚNG pattern giống hệt (`${JWT_SECRET_KEY:default...}`) nhưng KHÔNG bị lỗi này trong preview — vì factory đã set sẵn biến môi trường `JWT_SECRET_KEY` thật (giá trị preview-only) trong `preview-docker-compose.yaml`, nên Spring tìm thấy giá trị từ env trước khi phải tự tham chiếu lại chính nó. Điều này có nghĩa: **nếu môi trường staging/production/campha/caoson thật của app KHÔNG set biến `JWT_SECRET_EXPIRATION`** (không có gì trong `deployment/*/`, `docker-compose-build*.yaml` cho thấy nó được set), **app sẽ crash ngay khi khởi động ở mọi môi trường**, không chỉ ở đây. Cần xác nhận với người phụ trách: có phải môi trường thật đang set biến này ở đâu đó ngoài repo (secret trên server/CI) hay code đã luôn bị lỗi này và chưa ai deploy lại từ đầu gần đây để phát hiện. **Đã tự sửa (chỉ trong `preview-docker-compose.yaml`, KHÔNG sửa `application.properties`)** bằng cách set thẳng `JWT_SECRET_EXPIRATION: "28800000"` như 1 biến môi trường preview — đây là cách sửa đúng đắn ở tầng cấu hình/triển khai, không phải sửa code nghiệp vụ.

**Bug #2 — API đăng nhập trả nguyên mật khẩu plaintext về client:**

`POST /api/taikhoan/login` (đã test LIVE, response thật — không suy đoán) trả về nguyên object `TaiKhoan` bao gồm field `"matKhau":"admin"` (mật khẩu plaintext) trong JSON response, cùng với token JWT. Đây là hệ quả trực tiếp của việc lưu mật khẩu plaintext đã ghi ở mục 3 — nhưng cụ thể hơn: không chỉ lưu trữ không an toàn, mà còn **chủ động gửi mật khẩu về phía client mỗi lần đăng nhập** (DTO trả response không loại trừ field `matKhau`). Bất kỳ ai có quyền xem network traffic/console trình duyệt của một phiên đăng nhập đều thấy được mật khẩu thật của tài khoản đó.

**Vấn đề nhỏ, không chặn (đã ghi nhận, chưa sửa):**

- WebSocket (STOMP/SockJS) báo lỗi transport `websocket` thô trong console trình duyệt khi qua `reverse_proxy` preview (`ws://.../ws/{server}/{session}/websocket` fail) — SockJS thường tự fallback sang transport khác (polling/streaming) nên không chặn app hoạt động, nhưng chưa xác minh notification real-time có hoạt động đầy đủ qua reverse-proxy preview này hay không. Tương tự hạn chế đã gặp ở các project onboard khác (TK-HATU).
- `S3Service` build `S3Client`/`S3Presigner` ngay trong constructor (bean `@Service` eager) dù chưa ai gọi tính năng upload — preview dùng credential AWS giả (`preview-local-placeholder`), khởi động không lỗi (SDK không validate credential lúc tạo client), nhưng bất kỳ API nào thật sự gọi S3 sẽ lỗi cho tới khi có credential AWS thật.
- Cổng SQL Server (`DatabaseConfig.sqlServerDataSource()`, trỏ `127.0.0.1:56671` hardcode) không được cấu hình trong preview này (không tồn tại) — không chặn khởi động vì `HikariDataSource` khởi tạo kiểu no-arg + setter không eager-connect, nhưng tính năng "đồng bộ CSDL ngoài" (`DatabaseMigrationController`/`DatabaseSyncScheduler`, chạy cron mỗi phút) sẽ lỗi nếu có `DbConfig` mặc định trỏ tới CSDL không tồn tại — chưa test tính năng này trong preview.
- Tích hợp Portal/SSO (JWKS) **không được test** trong preview này — `PORTAL_JWKS_URI` trỏ 1 domain giả không tồn tại, chỉ luồng đăng nhập local được verify.

## 9. Kết quả build/test baseline (bước onboarding này)

Xem `.factory/pipeline.json` cho trạng thái từng bước và kết quả build/test thật đã chạy trong Docker.
