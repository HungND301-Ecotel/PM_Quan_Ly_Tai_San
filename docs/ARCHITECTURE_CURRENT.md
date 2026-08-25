# Kiến trúc hiện trạng — QL-TAISAN

> Mô tả kiến trúc **thật đang chạy** (suy từ code thật, không phải thiết kế lý tưởng), viết trong bước onboarding (2026-08-25). Không đề xuất thay đổi.

## 1. Sơ đồ tổng quan

```
Browser (SPA React)
   │
   ▼
nginx reverse_proxy (port 8888 nội bộ, port host tuỳ deployment/*)
   ├── "/"                     → frontend (static build, Vite)
   ├── "/auth", "/.well-known", "/taisan"  → Kong gateway (luồng đăng nhập/token portal — cùng-origin, tránh CORS)
   ├── "/api/"                 → backend (Spring Boot, port nội bộ 8386)
   ├── "/ws/"                  → backend (WebSocket/STOMP, cần Upgrade header)
   └── "/swagger-ui/", "/v3/api-docs/" → backend

backend (Spring Boot)
   ├── MySQL 8       — datasource CHÍNH (JDBC thuần qua JdbcTemplate + Flyway)
   ├── SQL Server     — datasource PHỤ, chỉ dùng cho "đồng bộ dữ liệu từ CSDL ngoài" (DatabaseMigrationController/Scheduler)
   ├── Redis          — bắt buộc cho luồng OTC (one-time code) khi đăng nhập qua portal
   ├── AWS S3         — lưu file đính kèm (ảnh, biên bản...)
   └── OpenAI API     — chatbot nghiệp vụ (ChatbotController)

Hệ sinh thái ngoài repo này (không nằm trong QL-TAISAN, đã xác nhận tồn tại tại
projects/PORTAL-PM trong cùng factory này):
   Kong API Gateway + Portal service (SSO, phát hành token RSA, JWKS endpoint,
   quản lý quyền theo module dạng {c,r,u,d,a})
```

**Quan hệ với dự án `PORTAL-PM`** (đã onboard sẵn trong `projects/PORTAL-PM` của factory này): QL-TAISAN có thể chạy độc lập (đăng nhập local, JWT tự ký) **hoặc** tích hợp với hệ sinh thái Portal/Kong dùng chung cho nhiều app (đăng nhập qua SSO, JWT do Portal ký bằng RSA, verify qua JWKS). Đây là kiến trúc multi-app dùng chung 1 cổng đăng nhập — QL-TAISAN không tự vận hành Kong/Portal, chỉ là 1 "resource server" trong hệ đó khi được cấu hình `portal.jwks-uri` trỏ đúng nơi.

## 2. Xác thực (Authentication) — 2 loại token song song

`SecurityConfig.java` cấu hình **2 filter chain** (Spring Security `@Order`):

- **Chain 1** (`@Order(1)`) — public: `/api/taikhoan/login`, `/api/taikhoan/exchange-code`, `/swagger-ui/**`, `/v3/api-docs/**`, `/ws/**`. Không qua `oauth2ResourceServer`, `permitAll()`.
- **Chain 2** (`@Order(2)`) — mọi request còn lại: bắt buộc `authenticated()`, verify JWT qua `DelegatingJwtDecoder`.

`DelegatingJwtDecoder` thử giải mã theo thứ tự:

1. **Token local (HS512)** — do chính `TaiKhoanService`/`TaiKhoanDao.login()` tự sinh khi đăng nhập bằng `tenDangNhap`/`matKhau` lưu trong bảng `TaiKhoan` của chính app. Ký bằng `JWT_SECRET_KEY` (HMAC).
2. **Token portal (RSA/JWKS)** — do Portal service (ngoài repo) phát hành, verify bằng public key lấy qua `portal.jwks-uri`. Có claim `permissions` dạng `Map<moduleCode, {c,r,u,d,a}>`, `companyId`, `app`.

Không giải mã được ở cả 2 → 401.

**Luồng SSO qua OTC (one-time code)** (`OtcStore.java` + `TaiKhoanController.exchange-code`): Portal ghi `otc:<code> → appToken|refreshToken` vào Redis (TTL ngắn, không rõ do phía Portal set). Frontend QL-TAISAN nhận `code` (thường qua query param sau khi Portal redirect), gọi `POST /api/taikhoan/exchange-code` (public, không cần Bearer) để đổi lấy token thật — `consume()` dùng `GETDEL` nên chỉ đổi được 1 lần (chống replay). **Nếu Redis không chạy hoặc không kết nối được, luồng đăng nhập qua Portal sẽ hỏng hoàn toàn** — đây là dependency bắt buộc, không phải tuỳ chọn.

## 3. Phân quyền (Authorization) — ĐÃ XÁC MINH: gần như không hoạt động trong thực tế

Hệ thống có thiết kế phân quyền chi tiết theo module (`resource:action`, action ∈ `{c,r,u,d,a}` — create/read/update/delete/approve) qua annotation `@RequirePermission(resource=..., action=...)` và filter `PermissionFilter`. Nhưng khi kiểm tra thật:

- **`AppTokenFilter`**: nếu token là loại **local** (không có claim `permissions`) → gán `permissions = null` → được coi là **FULL ACCESS**, bỏ qua mọi kiểm tra (bình luận trong code gọi đây là "phương án A").
- **`PermissionFilter`**: nếu token là loại **portal** nhưng endpoint **không có** `@RequirePermission`/`@PublicApi` → cũng bỏ qua kiểm tra, cho đi tiếp (`resource == null → chain.doFilter()`).
- **Đã đếm thật trên toàn bộ 89 controller: 0 controller nào gắn `@RequirePermission`.** Chỉ 1 controller dùng `@PreAuthorize`/tương đương, chỉ 1 controller dùng `@PublicApi`.

**Kết luận xác minh được:** ở trạng thái code hiện tại, **bất kỳ user nào xác thực thành công** (kể cả bằng token local tự đăng ký) **đều gọi được mọi endpoint** (trừ 1 controller có `@PreAuthorize`) — tầng phân quyền chi tiết theo module đã được xây (DB, DTO, filter, annotation) nhưng **chưa được áp dụng vào một controller nghiệp vụ nào**. Đây là phát hiện bảo mật quan trọng nhất của bước onboarding này — xem `docs/TECHNICAL_DEBT.md` mục 3.

Ngoài ra: mật khẩu tài khoản local lưu **plaintext** trong cột `TaiKhoan.MatKhau` (`varchar(50)`) và so sánh bằng `String.equals()` (`TaiKhoanDao.java`, hàm `login()`) — không hash (không BCrypt/Argon2 ở đâu trong codebase). Xem TECHNICAL_DEBT mục 1.

## 4. Đa công ty / đa thương hiệu (multi-tenant)

- **`DefaultIdCongTyAdvice.java`** (Spring `@ControllerAdvice` hoặc tương tự) — tự gán `IdCongTy` mặc định, gợi ý cơ chế multi-tenant theo công ty (bảng `CongTy`, cột `IdCongTy` rải trong nhiều bảng nghiệp vụ và trong JWT claim `companyId`).
- **Đa thương hiệu ở tầng build, không phải runtime**: `frontend` đọc `VITE_BRAND` lúc build (Vite bake tại build-time), có các file build riêng cho từng khách hàng/site (`docker-compose-build-campha.yaml`, `-caoson.yaml`, nginx conf riêng `nginx_campha.conf`/`nginx_caoson.conf`) — mỗi "chi nhánh" (Cẩm Phả, Cao Sơn, Uông Bí — theo tên nhánh git `dev/campha`, `dev/uongbi`) có vẻ là 1 lần build+deploy riêng, không phải 1 app đa tenant chọn brand lúc runtime.

## 5. Biến môi trường thật (đọc trực tiếp từ code, KHÔNG có file `.env.example` nào trong repo)

### Backend (`application.properties`)

| Biến | Bắt buộc? | Ghi chú |
|---|---|---|
| `MYSQL_URL`, `MYSQL_USERNAME`, `MYSQL_PASSWORD` | Bắt buộc | Không có giá trị mặc định (dòng cấu hình cũ bị comment) |
| `JWT_SECRET_KEY` | Có giá trị mặc định hardcode trong file (`ecotel2025_quanlytaisan_secret_key_...`) | Xem TECHNICAL_DEBT mục 1 — mặc định lộ trong git |
| `JWT_SECRET_EXPIRATION` | Có mặc định `28800000` (8 giờ) | |
| `PORTAL_JWKS_URI` | Bắt buộc nếu muốn đăng nhập qua Portal | Không có mặc định — thiếu thì bean `portalJwtDecoder` có thể fail khởi động hoặc luôn fallback lỗi |
| `AWS_REGION`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_S3_BUCKET_NAME` | Bắt buộc cho tính năng upload file (S3) | Không có mặc định |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Bắt buộc cho luồng OTC/Portal login | |
| `openai.api.key` | **Hardcode thẳng trong `application.properties`, KHÔNG qua biến môi trường** | Đây là secret thật đang lộ trong git — xem TECHNICAL_DEBT mục 1, đã xử lý riêng, KHÔNG lặp lại giá trị ở đây |
| `spring.sqlserver.datasource.*` | Hardcode cứng (`127.0.0.1:56671`, user `sa`, password `1`) | Rõ ràng là cấu hình dev cá nhân, không phải biến môi trường hoá |
| `server.port` | Hardcode `8386` | |

### Frontend (đọc lúc build qua Vite, `import.meta.env.*`)

`VITE_BASE_API`, `VITE_SOCKET_API`, `VITE_KONG_API` (3 biến CI tự tạo `.env` từ GitHub Secrets — xem `.github/workflows/build-test.yml`), `VITE_BRAND`, `VITE_PORTAL_URL`. Không có file `.env`/`.env.example` nào trong repo — máy khác muốn build phải tự tạo `frontend/.env`.

## 6. Docker Compose — KHÔNG có 1 file nào chạy full stack tại chỗ

Đây là điểm khác biệt quan trọng cần biết trước khi cố "chạy thử app":

| File | Service có trong file | Dùng để |
|---|---|---|
| `docker-compose.yml` (gốc) | `qlts_reverse_proxy_service`, `qlts_frontend_service` | Dev — **KHÔNG có backend, KHÔNG có MySQL/Redis** |
| `docker-compose-build.yaml` / `-campha.yaml` / `-caoson.yaml` / `-build-test.yaml` | reverse-proxy + frontend + backend (build local, KHÔNG push) hoặc build+push DockerHub | Build image, KHÔNG chạy MySQL/Redis/Kong |
| `deployment/{test,staging,campha,caoson}/*-docker-compose.yaml` | reverse-proxy + frontend + backend + **MySQL** (image build sẵn kéo từ `${REGISTRY}/*:${VERSION}` trên DockerHub, không build từ context local) | Deploy thật lên VPS qua SSH (CI) — vẫn thiếu Redis, Kong, Portal |

→ Để chạy được toàn bộ tính năng (kể cả đăng nhập qua Portal) tại máy dev, cần tự thêm Redis + trỏ tới 1 Kong/Portal đang chạy (vd từ `projects/PORTAL-PM`) — không có sẵn trong repo gốc. Đăng nhập **local** (không qua Portal) có thể chạy được chỉ với MySQL, không cần Redis/Kong/Portal (Redis chỉ bắt buộc cho luồng OTC).

**Cập nhật (2026-08-25) — factory đã thêm 1 file compose MỚI cho preview cục bộ:** `deployment/preview/preview-docker-compose.yaml` (+ `reverse_proxy/nginx_preview.conf`), build từ source thật, đủ MySQL+Redis+backend+frontend+reverse-proxy, KHÔNG sửa file nào có sẵn. Đã verify LIVE: 136 migration Flyway chạy sạch trên DB rỗng, đăng nhập local qua UI thành công, dashboard load đúng. Portal/SSO KHÔNG được test qua preview này (`PORTAL_JWKS_URI` trỏ placeholder giả). Xem `docs/TECHNICAL_DEBT.md` mục 8 cho 2 bug thật phát hiện được chỉ khi chạy full stack (không thấy nếu chỉ đọc code).

## 7. CI/CD thật (`.github/workflows/`)

- **`build-test.yml`** — trigger khi push `main`. Tên là "Build and run tests" nhưng **không chạy `mvn test` hay `npm test` nào** — chỉ chạy `make test` (thực chất là build+push Docker image tag `test` lên DockerHub), rồi **SSH thẳng vào server staging và deploy ngay** (`start-app.sh`). Không có bước kiểm thử tự động thật nào chặn giữa build và deploy. Xem TECHNICAL_DEBT mục 2.
- **`deploy-campha.yml`, `deploy-caoson.yml`, `deploy-uongbi.yml`** — tương tự, build + SSH deploy riêng theo từng chi nhánh/khách hàng.
- Toàn bộ deploy dùng `appleboy/ssh-action` + `appleboy/scp-action`, secret quản lý qua GitHub Secrets (`STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`, `DOCKER_HUB_*`...) — không lộ trong code, nằm đúng chỗ (GitHub Secrets), không phải vấn đề của bước audit này.

## 8. Thời gian thực (WebSocket)

STOMP qua SockJS, endpoint `/ws`, broker đơn giản `/topic` + `/queue` (`WebSocketConfig.java`). Dùng để đẩy sự kiện real-time khi tạo/ký/trình duyệt/hủy biên bản điều chuyển & bàn giao tài sản/CCDC-vật tư (`enums/TypeFunc.java`, `TypeAction.java` định nghĩa rõ 5 nhóm chức năng × 3 loại hành động cho message).
