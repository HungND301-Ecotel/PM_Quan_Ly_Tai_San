-- =====================================================
-- Migration: Tạo lại các bảng cho module đánh giá chất lượng vật tư thu hồi
-- Version: 135
-- =====================================================

DROP TABLE IF EXISTS danhgia_vattu_chitiet;
DROP TABLE IF EXISTS danhgia_vattu;

-- Bảng 1: Đánh giá vật tư (biên bản chính)
CREATE TABLE danhgia_vattu (
    Id                  VARCHAR(50)  PRIMARY KEY,
    IdNghiemThu         VARCHAR(50),
    QuyetDinhSo         VARCHAR(255),
    CanCuHoSo           TEXT,
    NgayDanhGia         VARCHAR(50),
    DiaDiem             VARCHAR(255),
    
    -- Các trường hệ thống tương tự Nghiệm thu để ký duyệt
    IdNguoiLap          VARCHAR(50),
    NguoiLapXacNhan     TINYINT(1) DEFAULT 0,
    IdGiamDoc           VARCHAR(50),
    GiamDocXacNhan      TINYINT(1) DEFAULT 0,
    Share               TINYINT(1) DEFAULT 0,
    TrangThai           INT DEFAULT 0,
    NgayTao             VARCHAR(50),
    NgayCapNhat         VARCHAR(50),
    NguoiTao            VARCHAR(50),
    NguoiCapNhat        VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng 2: Chi tiết vật tư đánh giá
CREATE TABLE danhgia_vattu_chitiet (
    Id                  VARCHAR(50) PRIMARY KEY,
    IdDanhGia           VARCHAR(50),
    IdVatTu             VARCHAR(50),
    IdChiTietVatTu      VARCHAR(50),
    TenVatTu            VARCHAR(255),
    DonViTinh           VARCHAR(50),
    SoLuong             FLOAT DEFAULT 0,
    KhoiLuong           FLOAT DEFAULT 0,
    ChatLuongConLai     FLOAT DEFAULT 0,
    DonGia              FLOAT DEFAULT 0,
    GiaTriConLai        FLOAT DEFAULT 0,
    GhiChu              TEXT,
    CONSTRAINT fk_dgvtct_dgvt FOREIGN KEY (IdDanhGia) REFERENCES danhgia_vattu(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Khởi tạo sequence
INSERT INTO Sequence (SeqName, SeqYear, SeqValue)
VALUES ('DANHGIA_VATTU', YEAR(CURDATE()), 0)
ON DUPLICATE KEY UPDATE SeqValue = SeqValue;
