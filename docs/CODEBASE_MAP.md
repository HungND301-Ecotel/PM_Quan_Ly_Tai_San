# Codebase Map — QL-TAISAN

> Bản đồ thư mục + công nghệ của source code **đã có sẵn** trước khi đưa vào factory (repo GitHub `anhnt205/PM_Quan_Ly_Tai_San`, đưa vào factory bằng onboarding 2026-08-25 — không tạo mới từ template). Tài liệu này chỉ mô tả hiện trạng, không đề xuất thay đổi cấu trúc.

## 1. Tổng quan công nghệ

| Thành phần | Công nghệ thật (xác nhận từ code) |
|---|---|
| Backend | Java 17 (`pom.xml: <java.version>17</java.version>`), build bằng JDK 21 (`backend/Dockerfile: maven:3.9.8-eclipse-temurin-21`), Spring Boot 3.5.4, chủ yếu JDBC thuần (`JdbcTemplate`) qua tầng `dao/` (86 file) — JPA/Hibernate có cấu hình (`spring-boot-starter-data-jpa`) nhưng chỉ dùng ở 6 file `repository/`, là thiểu số |
| Database chính | MySQL 8 qua `mysql-connector-java` 8.0.33, migration bằng Flyway (136 file `V*.sql`, `V1__init_database.sql` → `V146__set_default_config.sql`) |
| Database phụ | SQL Server — cấu hình datasource riêng thứ 2 (`DatabaseConfig.java`, `spring.sqlserver.datasource.*`), chỉ dùng cho tính năng "đồng bộ dữ liệu từ CSDL ngoài" (`DatabaseMigrationController`/`DatabaseMigrationService`/`DatabaseSyncScheduler`), không phải datasource vận hành chính |
| Cache/session | Redis (`spring-boot-starter-data-redis`) — bắt buộc cho luồng đăng nhập qua portal (mã OTC lưu ở Redis, xem `docs/ARCHITECTURE_CURRENT.md` mục 4) |
| Auth | Spring Security OAuth2 Resource Server, JWT 2 loại (local HS512 + portal RSA/JWKS) — xem mục 4 |
| Realtime | WebSocket (STOMP + SockJS, `WebSocketConfig.java`), endpoint `/ws`, broker `/topic` + `/queue` |
| Frontend | React 19.2 + TypeScript, Vite 7 (`vite.config.mts`), MUI 7 (Material UI, không dùng Ant Design), Redux Toolkit + redux-persist, React Query (`@tanstack/react-query`), Formik + Yup |
| Export/tài liệu | Apache POI (Excel), PDFBox + iText7 + jsPDF (PDF), xlsx/xlsx-js-style (Excel phía frontend) |
| Tích hợp ngoài | AWS S3 (upload file, `software.amazon.awssdk:s3`), OpenAI API (chatbot, gọi qua OkHttp — xem `ChatbotController`) |
| Reverse proxy | nginx riêng (`reverse_proxy/`), 4 biến thể conf theo môi trường triển khai (`nginx_test.conf`, `nginx_staging.conf`, `nginx_campha.conf`, `nginx_caoson.conf`) |
| Container hoá | Docker Compose nhiều file theo mục đích (dev / build-push từng môi trường) — xem `docs/ARCHITECTURE_CURRENT.md` mục 6 cho chi tiết vì KHÔNG có 1 file compose nào chạy full stack (backend+MySQL+Redis) tại chỗ |
| CI/CD | GitHub Actions (`.github/workflows/`) — build + SSH deploy thẳng lên VPS, KHÔNG chạy test tự động thật (xem TECHNICAL_DEBT mục 2) |

## 2. Cấu trúc thư mục gốc

```
QL-TAISAN/
├── backend/                       # Spring Boot API (Java 17/21)
├── frontend/                      # React + TS SPA (Vite)
├── reverse_proxy/                 # nginx gateway, 4 file conf theo môi trường
├── deployment/                    # docker-compose + start-app.sh cho staging/campha/caoson/test
│   ├── campha/  caoson/  staging/  test/
├── .github/workflows/             # build-test.yml (push main → SSH deploy staging), deploy-campha.yml, deploy-caoson.yml, deploy-uongbi.yml
├── docker-compose.yml             # dev: CHỈ reverse_proxy + frontend (không có backend/db!) — xem ARCHITECTURE mục 6
├── docker-compose-build.yaml / -campha.yaml / -caoson.yaml / -build-test.yaml   # build + push image lên DockerHub (registry ecoteldev), theo từng bản build
├── Makefile                       # wrapper cho các lệnh compose ở trên (make up/test/campha/caoson/staging/release)
└── README.md                      # 2 dòng, không có hướng dẫn setup thật
```

**Không có `.gitignore` ở bất kỳ cấp nào trong repo** — xem TECHNICAL_DEBT mục 1.

## 3. Backend — chi tiết

`backend/src/main/java/com/ecotel/quanlytaisan/`, kiến trúc layered nhưng KHÔNG đồng nhất giữa các module (xem mục dưới):

| Package | Số file | Vai trò |
|---|---|---|
| `controller/` | 89 | REST endpoint, `@RestController` |
| `service/` | 95 | Business logic |
| `dao/` | 86 | Truy vấn SQL thuần qua `JdbcTemplate` (pattern chính của dự án) |
| `repository/` | 6 | JPA `@Repository` (thiểu số, không phải pattern chính dù có cấu hình Hibernate đầy đủ) |
| `model/` | 173 | Entity/DTO — nằm chung 1 package phẳng, không tách `entity/` vs `dto/` |
| `mapper/` | 2 | MapStruct — khai báo dependency đầy đủ trong `pom.xml` nhưng gần như không dùng |
| `security/` | 7 | `SecurityConfig`, `AppTokenFilter`, `PermissionFilter`, `DelegatingJwtDecoder`, `AppUserDetails`, `OtcStore`, `TokenType` |
| `permissions/` | 3 | `AuthenticatedUser`, `PermissionContext`, `PermissionDto` (model quyền C/R/U/D/A) |
| `annotation/` | 2 | `@RequirePermission`, `@PublicApi` — **hầu như không được gắn vào controller nào**, xem TECHNICAL_DEBT mục 3 |
| `config/` | 6 | `DatabaseConfig` (2 datasource MySQL+SQLServer), `WebConfig`, `WebSocketConfig`, `PermissionInterceptor`, `DefaultIdCongTyAdvice` (tự gán `IdCongTy` mặc định — multi-tenant theo công ty), `GlobalExceptionHandler` |
| `websocket/` | 2 | Gửi realtime khi tạo/ký/duyệt biên bản điều chuyển, bàn giao |
| `seed/` | 4 | `AdminSeeder` (seed tài khoản admin — **mật khẩu plaintext**, xem TECHNICAL_DEBT mục 1), `PermissionSeeder`, `KhoMacDinhSeeder`, `TemplateLyLichSeeder` — chạy mỗi lần app khởi động (`CommandLineRunner`) |
| `scheduler/` | 1 | `DatabaseSyncScheduler` — cron mỗi phút, kiểm tra `DbConfig` mặc định để đồng bộ dữ liệu từ CSDL ngoài |
| `enums/`, `utils/`, `exception/` | 3+4+1 | Hằng số nghiệp vụ (`TypeFunc`/`TypeAction` cho socket message), tiện ích, xử lý lỗi tập trung |

**Không có `backend/src/test/`** — thư mục test hoàn toàn không tồn tại, mặc dù `spring-boot-starter-test` có khai trong `pom.xml`. Xem TECHNICAL_DEBT mục 4.

File ở gốc `backend/` (không phải chuẩn Maven, do người viết thêm tay):
- `backup.sql` (350KB, mysqldump thật — chứa `INSERT INTO` cho ~29 bảng), `db.sql` (schema khởi tạo tay, có trước khi có Flyway), `query.sql`, `create_version_table.sql` — xem TECHNICAL_DEBT mục 1 về rủi ro dữ liệu thật bị commit.
- `postman_collections/` — bộ sưu tập Postman để test API tay.
- `file_example/`, `test_chu_ky.ipynb` (notebook Python để test ký số?), `pubspec.lock` (tàn dư dự án Flutter/Dart nào đó — có luôn cả `.dart_tool/` bị commit, không liên quan gì tới backend Java hiện tại).
- `start-QuanLyTaiSanBE.bat` — chạy `.jar` đã build sẵn trực tiếp trên máy Windows cá nhân của người viết (đường dẫn tuyệt đối `D:\QUANLYTAISAN\...`, `C:\Program Files\Java\jdk-21\...`) — không dùng được trên máy khác.

## 4. Frontend — chi tiết

- **Entry**: `frontend/src/main.tsx` (Vite chuẩn). Router: `react-router-dom` 7, danh sách route tập trung tại `frontend/src/utils/routes.ts` (~45 route, đặt tên theo path tiếng Việt không dấu, vd `/dieu_dong_tai_san`).
- **State**: Redux Toolkit + `redux-persist` (persist qua localStorage), kết hợp React Query cho data-fetching/cache server state.
- **`src/pages/`**: ~35 thư mục, mỗi thư mục là 1 module nghiệp vụ (Asset*, Tool*, Maintenance*, Transfer/Handover Approval & Record, Report, Account, Dashboard...) — xem `docs/REQUIREMENTS_AS_IS.md` để có mô tả nghiệp vụ từng nhóm.
- **`src/components/SignDocument/`** — component ký số/ký tài liệu riêng (khớp với `KyTaiLieuController` phía backend và các file cert `.crt`/`.p12`/`.key` — xem TECHNICAL_DEBT mục 1).
- **`src/config/api.config.ts`**: axios instance trung tâm, đọc `import.meta.env.VITE_BASE_API`.
- **`src/services/socketService.ts`**: đọc `import.meta.env.VITE_SOCKET_API` — kết nối STOMP/WebSocket tới backend.
- **`src/config/brandConfig.ts`**: đọc `import.meta.env.VITE_BRAND` — build đa thương hiệu/đa khách hàng (`campha`, `caoson`, `UB`...) từ CÙNG 1 codebase, chọn brand lúc build qua biến môi trường (khớp với các file `docker-compose-build-*.yaml` và `nginx_campha.conf`/`nginx_caoson.conf` riêng theo khách hàng).
- **`src/pages/Auth/Login.tsx`** + code đọc `import.meta.env.VITE_PORTAL_URL` — hỗ trợ điều hướng sang portal để đăng nhập SSO (khớp luồng OTC exchange phía backend).
- **`.nginx/nginx.conf`** không tồn tại trong `frontend/` — routing `/api` thật nằm ở `reverse_proxy/` (container riêng ở gốc repo), giống pattern nhiều dự án khác đã onboard vào factory này.

**Không có script `test` nào trong `package.json`** dù có cài `@testing-library/react`, `@testing-library/jest-dom`, `@types/jest` — cài nhưng chưa từng nối dây (không có Jest/Vitest config). Xem TECHNICAL_DEBT mục 4.

## 5. Database — Flyway migrations

136 file `V1__init_database.sql` → `V146__set_default_config.sql` tại `backend/src/main/resources/db/migration/`. Một số cụm đáng chú ý (đọc từ tên file, xem thêm `docs/REQUIREMENTS_AS_IS.md` cho quan hệ entity):

- `V1__init_database.sql` — schema khởi tạo qua Flyway (khác với `backend/db.sql` cũ hơn, có trước Flyway).
- Cụm điều chuyển/bàn giao tài sản & CCDC-vật tư: nhiều file `V2`–`V9` (`lichsudieuchuyentaisan`, `dabangiao_chitietdieudongtaisan`...).
- Cụm sửa chữa/bảo trì: rất nhiều file rải suốt từ `V5` đến `V146` (`kehoachsuachua`, `suachua`, `ketquasuachua`, `chu_ky_sua_chua`, `cap_sua_chua`, `dinh_muc_sua_chua`...) — đây là module có nhiều lần refactor/đổi cấu trúc nhất (nhiều file `alter`/`rename`/`drop`/`recreate` cho cùng nhóm bảng, vd `V70__dropTable_kehoachsuachua,suachua,ketquasuachua.sql` rồi `V71__recreate_...sql`, `V72__fix_table_kehoachsuachua.sql`).
- Cụm giám định/nghiệm thu (máy móc + phương tiện tách riêng 2 luồng): `V82`–`V120` (`giamdinh`, `nghiemthu`, `bienphap_maymoc`, `bienphap_phuongtien`...).
- Cụm sự cố thiết bị: `V51`, `V76`, `V85`, `V137`, `V143`.
- Cụm lý lịch/hồ sơ tài sản: `V108`, `V110`, `V114` (lịch trình), `V126`.
- Cụm cấu hình đồng bộ CSDL ngoài: `V52__create_dbconfig.sql`, `V53`, `V57`, `V60`.
- `V123__drop_db.sql` — tên file gây hiểu lầm, đã đọc nội dung thật: chỉ `DROP TABLE IF EXISTS` cho 5 bảng con của cụm sửa chữa cũ (dọn rác sau đợt `V70`–`V72` recreate ở trên), KHÔNG drop cả database.

## 6. File cấu hình factory mới tạo (bước onboarding này)

- `project.yaml`, `CLAUDE.md` (gốc dự án)
- `.factory/pipeline.json`
- `docs/CODEBASE_MAP.md` (chính file này), `docs/ARCHITECTURE_CURRENT.md`, `docs/REQUIREMENTS_AS_IS.md`, `docs/TECHNICAL_DEBT.md`

Không có file source code nào bị xoá/sửa/ghi đè trong bước này. Repo được `git clone` giữ nguyên toàn bộ lịch sử (không `git init` lại); mọi thay đổi của bước onboarding nằm trên nhánh `feature/factory-onboarding`, không đụng `main`.
