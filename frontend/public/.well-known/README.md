# portal-manifest.json — placeholder scaffold (2026-08-25)

File `portal-manifest.json` trong thư mục này là điểm tích hợp cho
**PORTAL-PM** (cổng SSO nội bộ) — đặc tả đầy đủ nằm ở
`projects/PORTAL-PM/docs/APP_MANIFEST_CONTRACT.md` (đọc file đó nếu cần
chi tiết field-by-field, ở đây chỉ tóm tắt).

## File này dùng để làm gì

Portal chủ động **kéo** (GET, public, không cần xác thực) file này qua:

```
GET {origin của QL-TAISAN}/.well-known/portal-manifest.json
```

để tự đăng ký danh sách module/tính năng của QL-TAISAN vào Portal, thay vì
admin Portal phải gõ tay. Vì `frontend/public/` được Vite copy nguyên vẹn
vào `dist/` khi build, file JSON tĩnh đặt ở đây sẽ tự động có mặt ở đúng
path `/.well-known/portal-manifest.json` trên mọi môi trường serve static
(nginx `try_files` trong `frontend/.nginx/nginx.conf`).

## Hiện trạng: placeholder, CHƯA có nội dung thật

Nội dung hiện tại:

```json
{"modules": []}
```

Đây là JSON hợp lệ với mảng `modules` rỗng — Portal coi đây là app đã tích
hợp nhưng chưa khai module nào (vẫn đăng ký được ở Lớp 1 — mở qua iframe,
chỉ chưa có Lớp 2 để phân quyền theo từng tính năng con). Đây KHÔNG phải
lỗi, chỉ là trạng thái "chưa cấu hình" mặc định.

## Việc cần làm sau này (đội QL-TAISAN tự điền)

Thay nội dung `modules: []` bằng danh sách module thật, mỗi phần tử:

```json
{ "code": "danh-muc/don-vi", "name": "Đơn vị", "parentCode": "danh-muc", "sortOrder": 1 }
```

| Field | Bắt buộc | Ý nghĩa |
|---|---|---|
| `code` | Có | Mã module, duy nhất trong phạm vi QL-TAISAN. Khuyến nghị dạng `nhom/con`. |
| `name` | Không | Tên hiển thị cho admin Portal khi gán quyền. Bỏ trống thì Portal tạm dùng `code`. |
| `parentCode` | Không | `code` của module cha, phải có mặt trong CHÍNH mảng `modules` cùng lần trả về. Bỏ trống = module gốc. |
| `sortOrder` | Không | Số nguyên, thứ tự hiển thị. |

Nên map trực tiếp từ menu/route thật hiện có trong `frontend/src` (13 nhóm
nghiệp vụ, xem `docs/REQUIREMENTS_AS_IS.md`) — sửa tay file JSON tĩnh này
đơn giản nhất, không bắt buộc phải đổi sang endpoint Spring Boot động (dù
đó là hướng khuyến nghị lâu dài trong tài liệu Portal nếu menu hay đổi).

Lưu ý: Portal chỉ đồng bộ khi admin bấm nút "Đồng bộ từ manifest" trong
trang Module — không có polling/lịch tự động. Sửa file này xong không cần
báo Portal, chỉ cần admin Portal bấm nút đó lần sau khi muốn cập nhật.
