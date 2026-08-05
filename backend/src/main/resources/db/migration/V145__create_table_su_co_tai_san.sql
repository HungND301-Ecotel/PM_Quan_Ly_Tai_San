-- Migration V143: Tạo bảng su_co_tai_san lưu trữ theo dõi tình hình sự cố xảy ra hàng tháng
CREATE TABLE IF NOT EXISTS `su_co_tai_san` (
    `Id` VARCHAR(50) NOT NULL PRIMARY KEY COMMENT 'ID sự cố (UUID)',
    `IdTaiSan` VARCHAR(50) NOT NULL COMMENT 'ID tài sản (khóa ngoại tham chiếu taisan.Id)',
    `Ca` VARCHAR(20) DEFAULT NULL COMMENT 'Ca (1, 2, 3...)',
    `NgayThangNam` VARCHAR(50) DEFAULT NULL COMMENT 'Ngày/tháng/năm xảy ra sự cố',
    `HoTenVanHanh` VARCHAR(255) DEFAULT NULL COMMENT 'Họ tên người vận hành ca máy xảy ra sự cố',
    `NguyenNhan` TEXT DEFAULT NULL COMMENT 'Nguyên nhân sự cố, tình trạng và cách giải quyết hư hỏng',
    `HoTenSuaChua` VARCHAR(255) DEFAULT NULL COMMENT 'Họ tên người sửa chữa',
    `GioNgung` DOUBLE DEFAULT NULL COMMENT 'Giờ ngừng máy (h)',
    `TienCongSC` DOUBLE DEFAULT NULL COMMENT 'Tiền công sửa chữa (đ)',
    `TienNguyenVatLieu` DOUBLE DEFAULT NULL COMMENT 'Tiền nguyên vật liệu (đ)',
    `TongCong` DOUBLE DEFAULT NULL COMMENT 'Tổng cộng thiệt hại (đ)',
    `NgayTao` VARCHAR(50) DEFAULT NULL COMMENT 'Thời gian tạo',
    `NgayCapNhat` VARCHAR(50) DEFAULT NULL COMMENT 'Thời gian cập nhật',
    `NguoiTao` VARCHAR(100) DEFAULT NULL COMMENT 'Người tạo',
    `NguoiCapNhat` VARCHAR(100) DEFAULT NULL COMMENT 'Người cập nhật',
    `IsActive` TINYINT(1) DEFAULT 1 COMMENT 'Trạng thái hoạt động (1: Active, 0: Inactive)',
    FOREIGN KEY (`IdTaiSan`) REFERENCES `taisan`(`Id`) ON DELETE CASCADE,
    INDEX `idx_su_co_idtaisan` (`IdTaiSan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Theo dõi tình hình sự cố xảy ra hàng tháng';
