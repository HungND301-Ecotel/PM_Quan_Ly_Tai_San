DROP TABLE IF EXISTS `nghiemthu_maymoc_vattu`;
DROP TABLE IF EXISTS `nghiemthu_maymoc_taisan`;
DROP TABLE IF EXISTS `nghiemthu_maymoc`;
DROP TABLE IF EXISTS `nghiemthu_phuongtien_chitiet`;
DROP TABLE IF EXISTS `nghiemthu_phuongtien`;
DROP TABLE IF EXISTS `nghiemthu_chitiettaisan`;
DROP TABLE IF EXISTS `nghiemthu_chitietvattu`;
DROP TABLE IF EXISTS `nghiemthu`;

CREATE TABLE IF NOT EXISTS `nghiemthu` (
  `Id` varchar(50) NOT NULL COMMENT 'Khóa chính',
  `IdBienBan` varchar(50) DEFAULT NULL COMMENT 'ID của phiếu lĩnh vật tư',
  `DonViQuanLy` varchar(50) DEFAULT NULL COMMENT 'ID Đơn vị quản lý',
  `NoiDungSuaChua` text DEFAULT NULL COMMENT 'Nội dung sửa chữa',
  `KetQua` varchar(255) DEFAULT NULL COMMENT 'Kết quả nghiệm thu',
  
  `IdNguoiLap` varchar(50) DEFAULT NULL COMMENT 'ID người lập biên bản',
  `NguoiLapXacNhan` bit(1) DEFAULT b'0' COMMENT 'Trạng thái người lập xác nhận',
  `IdGiamDoc` varchar(50) DEFAULT NULL COMMENT 'ID giám đốc duyệt',
  `GiamDocXacNhan` bit(1) DEFAULT b'0' COMMENT 'Trạng thái giám đốc xác nhận',
  `Share` bit(1) DEFAULT b'0' COMMENT 'Trạng thái chia sẻ',
  `TrangThai` int(11) DEFAULT 0 COMMENT 'Trạng thái duyệt',
  
  `NgayTao` varchar(255) DEFAULT NULL COMMENT 'Ngày tạo',
  `NgayCapNhat` varchar(255) DEFAULT NULL COMMENT 'Ngày cập nhật',
  `NguoiTao` varchar(255) DEFAULT NULL COMMENT 'Người tạo',
  `NguoiCapNhat` varchar(255) DEFAULT NULL COMMENT 'Người cập nhật',
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu thông tin biên bản nghiệm thu';

CREATE TABLE IF NOT EXISTS `nghiemthu_chitiettaisan` (
  `Id` varchar(50) NOT NULL COMMENT 'Khóa chính',
  `IdNghiemThu` varchar(50) DEFAULT NULL COMMENT 'ID biên bản nghiệm thu',
  `IdTaiSan` varchar(50) DEFAULT NULL COMMENT 'ID tài sản/thiết bị',
  `TenTaiSan` varchar(255) DEFAULT NULL COMMENT 'Tên tài sản/thiết bị',
  `MaCongViec` varchar(255) DEFAULT NULL COMMENT 'Mã công việc',
  `NoiDung` text DEFAULT NULL COMMENT 'Nội dung thực hiện',
  `SoLuong` float DEFAULT 0 COMMENT 'Số lượng',
  `GhiChu` text DEFAULT NULL COMMENT 'Ghi chú',
  PRIMARY KEY (`Id`),
  KEY `fk_nghiemthu_taisan` (`IdNghiemThu`),
  CONSTRAINT `fk_nghiemthu_taisan` FOREIGN KEY (`IdNghiemThu`) REFERENCES `nghiemthu` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu chi tiết tài sản nghiệm thu';

CREATE TABLE IF NOT EXISTS `nghiemthu_chitietvattu` (
  `Id` varchar(50) NOT NULL COMMENT 'Khóa chính',
  `IdNghiemThu` varchar(50) DEFAULT NULL COMMENT 'ID biên bản nghiệm thu',
  `IdVatTu` varchar(50) DEFAULT NULL COMMENT 'ID vật tư',
  `IdChiTietVatTu` varchar(50) DEFAULT NULL COMMENT 'ID chi tiết vật tư liên quan',
  `KyHieu` varchar(255) DEFAULT NULL COMMENT 'Ký hiệu/Mã vật tư',
  `TenVatTu` varchar(255) DEFAULT NULL COMMENT 'Tên vật tư',
  `DonViTinh` varchar(50) DEFAULT NULL COMMENT 'Đơn vị tính',
  `SoLuongThayThe` float DEFAULT 0 COMMENT 'Số lượng thay thế',
  `SoLuongThuHoi` float DEFAULT 0 COMMENT 'Số lượng thu hồi',
  `GhiChu` text DEFAULT NULL COMMENT 'Ghi chú',
  PRIMARY KEY (`Id`),
  KEY `fk_nghiemthu_vattu` (`IdNghiemThu`),
  CONSTRAINT `fk_nghiemthu_vattu` FOREIGN KEY (`IdNghiemThu`) REFERENCES `nghiemthu` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu chi tiết vật tư nghiệm thu';
