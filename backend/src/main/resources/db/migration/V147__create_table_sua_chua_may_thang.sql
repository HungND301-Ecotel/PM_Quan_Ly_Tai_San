-- Migration V144: Tạo bảng sua_chua_may_thang lưu trữ theo dõi sửa chữa máy từng tháng
CREATE TABLE IF NOT EXISTS `sua_chua_may_thang` (
    `Id` VARCHAR(50) NOT NULL PRIMARY KEY COMMENT 'ID sửa chữa (UUID)',
    `IdTaiSan` VARCHAR(50) NOT NULL COMMENT 'ID tài sản (khóa ngoại tham chiếu taisan.Id)',
    `CapSuaChua` VARCHAR(100) DEFAULT NULL COMMENT 'Cấp sửa chữa',
    `NgayVao` VARCHAR(50) DEFAULT NULL COMMENT 'Ngày vào sửa chữa',
    `NgayRa` VARCHAR(50) DEFAULT NULL COMMENT 'Ngày ra (hoàn thành sửa chữa)',
    `ThayTheSuaChua` TEXT DEFAULT NULL COMMENT 'Thay thế sửa chữa hoặc cải tiến bộ phận nào của máy',
    `CongKeHoach` DOUBLE DEFAULT NULL COMMENT 'Số công sửa chữa kế hoạch',
    `CongThucHien` DOUBLE DEFAULT NULL COMMENT 'Số công sửa chữa thực hiện',
    `TongKimLoai` DOUBLE DEFAULT NULL COMMENT 'Tổng kim loại màu phục vụ cho sửa chữa (kg)',
    `HoTenKyThuat` VARCHAR(255) DEFAULT NULL COMMENT 'Họ tên người chịu trách nhiệm sửa chữa và kiểm tra kỹ thuật',
    `XacNhanKetQua` TEXT DEFAULT NULL COMMENT 'Xác nhận kết quả sau sửa chữa',
    `NgayTao` VARCHAR(50) DEFAULT NULL COMMENT 'Thời gian tạo',
    `NgayCapNhat` VARCHAR(50) DEFAULT NULL COMMENT 'Thời gian cập nhật',
    `NguoiTao` VARCHAR(100) DEFAULT NULL COMMENT 'Người tạo',
    `NguoiCapNhat` VARCHAR(100) DEFAULT NULL COMMENT 'Người cập nhật',
    `IsActive` TINYINT(1) DEFAULT 1 COMMENT 'Trạng thái hoạt động (1: Active, 0: Inactive)',
    FOREIGN KEY (`IdTaiSan`) REFERENCES `taisan`(`Id`) ON DELETE CASCADE,
    INDEX `idx_suachua_idtaisan` (`IdTaiSan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Theo dõi sửa chữa máy từng tháng';