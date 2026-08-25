# Nghiệp vụ hiện trạng (As-Is) — QL-TAISAN

> Suy ra từ code thật (89 controller, ~95 service, 173 model, 136 migration Flyway), **không phải** từ tờ trình/spec chính thức — repo không có tài liệu nghiệp vụ nào ngoài `README.md` 2 dòng. Viết trong bước onboarding (2026-08-25), không đề xuất thay đổi nghiệp vụ.

## 0. Tóm tắt 1 câu

Phần mềm quản lý tài sản cố định và công cụ-dụng cụ/vật tư (CCDC-vật tư) cho doanh nghiệp khai thác than/khoáng sản nhiều chi nhánh (tên nhánh git: Cẩm Phả, Cao Sơn, Uông Bí), bao phủ toàn vòng đời tài sản: nhập → điều động/bàn giao giữa các đơn vị → sửa chữa/bảo trì theo kế hoạch → giám định/nghiệm thu định kỳ → xử lý sự cố → khấu hao → báo cáo, có tích hợp ký số, chatbot hỏi-đáp dữ liệu bằng AI, và khả năng đăng nhập độc lập hoặc qua 1 cổng SSO dùng chung với các app khác (`PORTAL-PM`, đã có trong factory này).

**Lưu ý kiến trúc quan trọng phát hiện khi phân tích:** phần lớn truy cập dữ liệu là JDBC thuần qua `JdbcTemplate` (86 file DAO viết SQL tay), **không phải JPA entity** như giả định ban đầu — chỉ 6 bảng (`Role`, `NhomTaiSan`, `MauBienBanSuaChua`, `LyLichTemplate`, `LyLich`, `LichTrinh`/`ChiTietLichTrinh`) dùng Spring Data JPA thật.

## 1. Vai trò / phân quyền (theo thiết kế — xem TECHNICAL_DEBT mục 3 về khoảng cách với thực tế)

Mô hình RBAC: `Role` — `Permission` (module) — `RolePermission`/`UserRole`/`UserPermission` (gán trực tiếp cho user, ngoài role). 20 module quyền được seed sẵn mỗi lần backend khởi động (`PermissionSeeder.java`), mỗi module có 5 hành động khả dụng `create/read/update/delete/approve` (c/r/u/d/a):

`TAISAN`, `CCDCVT`, `BANGIAO_TAISAN`, `BANGIAO_CCDC`, `DIEUDONG_TAISAN`, `DIEUDONG_CCDC`, `NHANVIEN`, `PHONGBAN`, `CONGTY`, `DUAN`, `LOAITAISAN`, `LOAICCDC`, `KHAUHAO`, `BAOCAO`, `CONFIG`, `TAIKHOAN`, `PERMISSION`, `NHOMTAISAN`, `MOHINHTAISAN`, `NGUONVON`.

Tên vai trò cụ thể (vd "Quản trị viên", "Kế toán"...) **không hardcode ở đâu trong code** — được tạo động qua `RoleController`/`PermissionManagementController`, không có seed data mẫu ngoài 1 tài khoản `admin` (xem `docs/ARCHITECTURE_CURRENT.md` mục 3 và `docs/TECHNICAL_DEBT.md` mục 1 về việc tài khoản này lưu mật khẩu **plaintext**).

**2 cách đăng nhập** (chi tiết ở `docs/ARCHITECTURE_CURRENT.md` mục 2-3):
- **Local**: tài khoản riêng của app (`TaiKhoan`), JWT tự ký (HS512) → **được cấp full-access, bỏ qua toàn bộ hệ thống phân quyền module ở trên**.
- **Portal (SSO)**: JWT do hệ thống Portal ngoài (dự án `PORTAL-PM`) ký, có claim `permissions` chi tiết theo module → **về lý thuyết** bị kiểm tra qua `@RequirePermission`, nhưng **đã xác minh 0/89 controller có gắn annotation này** → trong thực tế cũng gần như full-access.

## 2. Bản đồ nghiệp vụ theo nhóm (13 nhóm, 89 controller)

> Nội dung dưới đây được xác minh bằng cách đọc trực tiếp controller + service (không chỉ suy từ tên file) cho các nhóm lớn.

### 2.1. Quản lý tài sản cố định (gốc)

`TaiSanController`, `ChiTietTaiSanController`, `LoaiTaiSanController`, `LoaiTaiSanConController`, `NhomTaiSanController`, `MoHinhTaiSanController`, `TaiSanFileController`, `HienTrangKyThuatController`, `LyDoTangController`, `KhauHaoController`, `PhuTungTaiSanController`

Lõi dữ liệu tài sản cố định: CRUD/tìm kiếm phân trang (filter theo nhóm/loại/đơn vị/trạng thái kiểm định/trạng thái sửa chữa/tài sản phát sinh), phân loại (`LoaiTaiSan`/`LoaiTaiSanCon`, `NhomTaiSan`, `MoHinhTaiSan` – mô hình khấu hao), lý do tăng tài sản, hiện trạng kỹ thuật, khấu hao, file đính kèm riêng theo tài sản, và bảng kê phụ tùng chính của máy (thêm ở migration V142, có FK CASCADE thật tới `TaiSan`).

### 2.2. Quản lý CCDC/Vật tư

`CCDCVatTuController`, `LoaiCCDCConController`, `NhomCCDCController`, `DonViTinhController`, `KhoController`

Nhánh song song với tài sản cố định nhưng cho công cụ dụng cụ/vật tư (giá trị thấp hơn, không khấu hao theo tài khoản kế toán như `TaiSan`). Có phân loại riêng, đơn vị tính dùng chung, khái niệm Kho — cả `TaiSan` và `CCDCVatTu` đều có `IdKho`.

### 2.3. Điều chuyển / Bàn giao (nhóm nghiệp vụ lớn nhất)

`DieuDongTaiSanController`, `ChiTietDieuDongTaiSanController`, `LichSuDieuChuyenTaiSanController`, `BanGiaoTaiSanController`, `ChiTietBanGiaoTaiSanController`, `DieuDongCCDCVatTuController`, `ChiTietDieuDongCCDCVatTuController`, `LichSuDieuChuyenCCDCVatTuController`, `BanGiaoCCDCVatTuController`, `ChiTietBanGiaoCCDCVatTuController`, `ChiTietDonViSoHuuController`

Mỗi loại tài sản (TaiSan/CCDCVatTu) có 2 loại chứng từ nối tiếp phản ánh quy trình 2 bước thực tế: **Điều động** (quyết định/lệnh — đơn vị giao/nhận, trình duyệt cấp phòng → giám đốc) rồi đến **Bàn giao** (biên bản thực tế, đại diện 2 bên xác nhận, giám đốc ký). Mỗi loại có bảng chi tiết dòng riêng + bảng lịch sử tổng hợp. `ChiTietDonViSoHuu` cho phép 1 CCDC/tài sản con phân bổ số lượng cho nhiều đơn vị sở hữu cùng lúc.

### 2.4. Sửa chữa / Bảo trì / Kế hoạch sửa chữa

`KeHoachSuaChuaController`, `KeHoachSuaChuaChiTietTaiSanController`, `SuaChuaController`, `SuaChuaChiTietController`, `SuaChuaMayThangController`, `CapSuaChuaController`, `DinhMucSuaChuaController`, `LoaiKeHoachSCBDController`, `LoaiSCBDController`, `ChuKySuaChuaController`, `MauBienBanSuaChuaController`, `QuyTrinhController`

`KeHoachSuaChua` (kế hoạch theo năm, workflow Nháp → Chờ duyệt → Đã duyệt/Hủy) có chi tiết theo tài sản. `SuaChua`/`SuaChuaChiTiet` là hồ sơ sửa chữa thực hiện thực tế. `SuaChuaMayThangController` là biến thể chuyên biệt cho máy thăng/thang máy. `CapSuaChua`/`DinhMucSuaChua`/`LoaiKeHoachSCBD`/`LoaiSCBD` là danh mục cấp bậc & định mức dùng chung. `ChuKySuaChuaController` quản lý chữ ký gắn với hồ sơ sửa chữa (khác `KyTaiLieuController` ở mục 2.9 — chưa rõ ranh giới, xem mục 4). `QuyTrinhController` trả lịch sử hoạt động tổng hợp của 1 tài sản (gộp nhiều nguồn: sửa chữa, sự cố, điều chuyển). **Đây là module có nhiều lần refactor cấu trúc DB nhất** (rất nhiều migration `alter`/`drop`/`recreate` cho cùng nhóm bảng trải dài từ V5 đến V146).

### 2.5. Giám định / Nghiệm thu / Biện pháp an toàn

`GiamDinhMayMocController`, `GiamDinhMayMocChiTietController`, `GiamDinhPhuongTienController`, `NghiemThuController`, `NghiemThuPhuongTienController`, `NghiemThuTaiSanController`, `DanhGiaVatTuController`, `BienPhapMayMocController`, `BienPhapPhuongTienController`

Kiểm định kỹ thuật định kỳ, tách riêng theo 2 loại đối tượng — **máy móc** và **phương tiện** — mỗi loại có cả giám định, nghiệm thu, lẫn biện pháp an toàn vận hành. `NghiemThuTaiSanController`/`DanhGiaVatTuController` là biến thể không phân theo máy móc/phương tiện.

### 2.6. Sự cố thiết bị (2 khái niệm song song, không liên kết nhau)

`SuCoTaiSanController`, `SuCoThietBiController`, `SuCoThietBiChiTietController`, `KiemTraSuCoController`

- `SuCoTaiSan` (V143): **nhật ký sự cố hàng tháng** đơn giản, 1-n trực tiếp với `TaiSan` (ca trực, người vận hành, giờ ngừng máy, chi phí), không có workflow duyệt.
- `SuCoThietBi` (+ `SuCoThietBiChiTiet`): **phiếu sự cố có quy trình phê duyệt đầy đủ** (mức độ Nhẹ→Nghiêm trọng, Nháp/Đã duyệt/Hủy/Hoàn thành, liên kết `IdKeHoach` sang kế hoạch sửa chữa), nhưng chỉ tham chiếu tài sản bằng text (`tenHeThongThietBi`), không có FK cứng.
- `KiemTraSuCoController` là bước theo dõi xử lý tiếp theo.

### 2.7. Lý lịch / Hồ sơ tài sản

`LyLichController`, `LyLichTemplateController` — sinh "lý lịch" (hồ sơ tổng hợp vòng đời) theo mẫu, hỗ trợ tạo hàng loạt. Đây là 2 trong 6 module dùng JPA thật.

### 2.8. Danh mục dùng chung / Cấu hình hệ thống

`DanhMucController`, `NguonKinhPhiController`, `NguonVonController`, `SetNguonKinhPhiController`, `GioHoatDongController`, `HuongDanController`, `LichTrinhController`, `ConfigController`, `DbConfigController`, `VersionController`, `MiniController`, `DatabaseMigrationController`

`DanhMucController` gộp trả nhiều danh mục trong 1 lần gọi cho frontend. `NguonVon`/`NguonKinhPhi` quản lý nguồn vốn/kinh phí gán cho tài sản. `GioHoatDong` theo dõi giờ hoạt động thiết bị theo năm. `Config`/`DbConfig`/`Version` là cấu hình hệ thống và kết nối CSDL ngoài. `MiniController` là API dropdown dùng chung. `DatabaseMigrationController`/scheduler đồng bộ dữ liệu vật tư/tài sản từ 1 CSDL ngoài (SQL Server) cấu hình qua `DbConfig` — **endpoint này không có kiểm tra quyền nào** (xem TECHNICAL_DEBT mục 3).

### 2.9. Tổ chức

`CongTyController`, `PhongBanController`, `ChucVuController`, `NhanVienController`, `DuAnController`, `NhomDonViController` — cấu trúc nhiều cấp: Công ty → Phòng ban (tự tham chiếu phòng cấp trên, cờ `IsKho`) → Nhân viên (có chức vụ, cờ quản lý). `DuAn` (dự án) được tài sản tham chiếu.

### 2.10. Phân quyền / Tài khoản

`RoleController`, `PermissionController`, `RolePermissionController`, `UserPermissionController`, `UserRoleController`, `PermissionManagementController`, `TaiKhoanController` — xem mục 1.

### 2.11. Báo cáo / Dashboard

`BaoCaoController`, `DashboardController`, `MaintenanceCountController` — báo cáo điều động, kiểm kê tài sản/CCDC theo đơn vị, mẫu báo cáo nhà nước "S22-DN"; dashboard số liệu tổng quan (tỷ lệ hiện trạng, tài sản sắp hết hạn khấu hao); widget đếm nhanh số phiếu theo điều kiện.

### 2.12. Chữ ký số / Ký tài liệu

`KyTaiLieuController` — quản lý vị trí + dữ liệu chữ ký số overlay lên tài liệu (tọa độ X/Y, scale, width), pattern "xóa hết chữ ký cũ rồi ghi lại danh sách mới", kèm bắn WebSocket khi có thay đổi. Khớp với các file chứng thư `.crt`/`.p12`/`.key` committed trong `backend/src/main/resources/` — xem TECHNICAL_DEBT mục 1.

### 2.13. Tích hợp ngoài / Hạ tầng file

`S3Controller`, `ChatbotController`, `WebSocketController`, `PdfController`, `UploadFileController`, `BatchShareController` — xem mục 3-4 dưới đây cho Chatbot/WebSocket; `PdfController` ghép nhiều PDF thành 1 (biên bản + phụ lục trước khi ký); `BatchShareController` cập nhật hàng loạt cột `Share` (chia sẻ phiếu cho người ký xem) qua whitelist bảng.

## 3. Chatbot AI (text-to-SQL)

`ChatbotController` (`/api/chatbot/query`) → `ChatbotService`: nhận câu hỏi tiếng Việt tự nhiên → gọi OpenAI Chat Completions (system prompt kèm schema DB rút gọn) để sinh câu SQL → lọc an toàn bằng regex chặn từ khóa `INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|GRANT|REVOKE` (chỉ cho SELECT qua) → chạy qua `JdbcTemplate` (giới hạn 1000 dòng) → trả kết quả dạng bảng. Về bản chất là 1 trợ lý hỏi-đáp/BI cho phép hỏi bằng tiếng Việt và nhận dữ liệu trực tiếp từ CSDL tài sản. Lớp chặn SQL nguy hiểm dựa trên regex (không phải whitelist) — xem TECHNICAL_DEBT mục 6 về giới hạn của cách tiếp cận này.

## 4. Realtime (WebSocket)

2 cơ chế độc lập:
1. **STOMP/SockJS** (`/ws`, broker `/topic`+`/queue`) — dùng thật trong nghiệp vụ: báo real-time khi tạo/sửa/xóa/ký tài liệu, bàn giao, điều chuyển tài sản/CCDC. `WebSocketController` có gần 10 endpoint nhưng đa số dạng `/test/...` (công cụ debug thủ công, không phải API sản phẩm).
2. **Raw WebSocket riêng** (`DeviceWebSocketHandler`) — hiện chỉ echo message kèm timestamp, tên gợi ý dự định tích hợp thiết bị IoT/chấm công nhưng chưa thấy logic nghiệp vụ thật.

## 5. Đa công ty (multi-tenant) — có thiết kế nhưng bị khóa cứng 1 công ty

`DefaultIdCongTyAdvice` (áp dụng toàn bộ controller) tự động ép **mọi request body có field `IdCongTy`** về giá trị cố định `"CT001"` trước khi vào service — bất kể client gửi gì. Schema và `CongTyController` cho thấy multi-tenant được thiết kế từ đầu (nhiều công ty), nhưng thao tác ghi hiện tại luôn quy về 1 công ty duy nhất. Đọc dữ liệu (GET) vẫn nhận tham số `idcongty` tùy biến (không qua advice này). Chưa xác định được đây là chủ đích (hệ thống hiện chỉ vận hành cho 1 công ty) hay nợ kỹ thuật — cần hỏi lại đội phát triển gốc trước khi coi đây là hành vi cần giữ nguyên.

## 6. Đa thương hiệu / đa chi nhánh (ở tầng build, không phải runtime)

Có sẵn quy trình build+deploy riêng cho từng chi nhánh/khách hàng: Cẩm Phả (`campha`), Cao Sơn (`caoson`), Uông Bí (nhánh `dev/uongbi`, workflow `deploy-uongbi.yml`) — mỗi chi nhánh build 1 image riêng (`VITE_BRAND` bake lúc build, nginx conf riêng), không phải 1 app chọn brand lúc chạy.

## 7. Ghi nhận best-effort — không đầy đủ 100%

Tài liệu này bao phủ 89/89 controller theo nhóm, nhưng KHÔNG đọc toàn bộ chi tiết logic của từng service/DAO (95 + 86 file) — với hệ thống quy mô này, việc đọc từng dòng là không khả thi trong 1 lần onboarding. Các điểm chưa rõ/nghi trùng lặp được liệt kê ở `docs/TECHNICAL_DEBT.md` mục 7.
