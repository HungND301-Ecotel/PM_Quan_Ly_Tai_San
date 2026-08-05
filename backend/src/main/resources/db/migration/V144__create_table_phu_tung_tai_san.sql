-- Migration V142: Tạo bảng phu_tung_tai_san lưu trữ bảng kê các phụ tùng chính của máy
CREATE TABLE IF NOT EXISTS `phu_tung_tai_san` (
    `Id` VARCHAR(50) NOT NULL PRIMARY KEY COMMENT 'ID phụ tùng',
    `IdTaiSan` VARCHAR(50) NOT NULL COMMENT 'ID tài sản (khóa ngoại tham chiếu taisan.Id)',
    `Ten` VARCHAR(255) DEFAULT NULL COMMENT 'Tên và quy cách phụ tùng',
    `DonViTinh` VARCHAR(50) DEFAULT NULL COMMENT 'Đơn vị tính',
    `SoLuong` DOUBLE DEFAULT NULL COMMENT 'Số lượng',
    `TrongLuong` DOUBLE DEFAULT NULL COMMENT 'Trọng lượng (kg)',
    `NguyenLieuCheTao` VARCHAR(255) DEFAULT NULL COMMENT 'Nguyên liệu chế tạo',
    `NgayTao` VARCHAR(50) DEFAULT NULL COMMENT 'Thời gian tạo',
    `NgayCapNhat` VARCHAR(50) DEFAULT NULL COMMENT 'Thời gian cập nhật',
    `NguoiTao` VARCHAR(100) DEFAULT NULL COMMENT 'Người tạo',
    `NguoiCapNhat` VARCHAR(100) DEFAULT NULL COMMENT 'Người cập nhật',
    `IsActive` TINYINT(1) DEFAULT 1 COMMENT 'Trạng thái hoạt động (1: Active, 0: Inactive)',
    FOREIGN KEY (`IdTaiSan`) REFERENCES `taisan`(`Id`) ON DELETE CASCADE,
    INDEX `idx_phu_tung_idtaisan` (`IdTaiSan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng kê các phụ tùng chính của máy';
