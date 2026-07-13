-- =====================================================
-- Migration: Tạo các bảng cho module giám định thống nhất (GiamDinh)
-- Version: 128
-- =====================================================

DROP TABLE IF EXISTS giamdinh_maymoc_vattu;
DROP TABLE IF EXISTS giamdinh_maymoc_chitiet;
DROP TABLE IF EXISTS giamdinh_maymoc;
DROP TABLE IF EXISTS giamdinh_phuongtien_chitiet;
DROP TABLE IF EXISTS giamdinh_phuongtien;

CREATE TABLE IF NOT EXISTS giamdinh (
    Id                      VARCHAR(50)     NOT NULL PRIMARY KEY,
    IdCongTy                VARCHAR(50)     NOT NULL,
    CongTy                  VARCHAR(255)    NULL,
    TenMauBienBan           VARCHAR(255)    NULL,
    IdBaoCaoKyThuat         VARCHAR(50)     NULL,
    NgayGiamDinh            VARCHAR(50)     NULL,
    DonViGiamDinh           VARCHAR(255)    NULL,
    NoiDung                 TEXT            NULL,
    GhiChuBienBan           TEXT            NULL,
    IdNguoiLap              VARCHAR(50)     NULL,
    NguoiLapXacNhan         TINYINT(1)      NOT NULL DEFAULT 0,
    IdGiamDoc               VARCHAR(50)     NULL,
    GiamDocXacNhan          TINYINT(1)      NOT NULL DEFAULT 0,
    Share                   TINYINT(1)      NOT NULL DEFAULT 0,
    TrangThai               TINYINT         NOT NULL DEFAULT 0,
    NgayTao                 VARCHAR(30)     NULL,
    NgayCapNhat             VARCHAR(30)     NULL,
    NguoiTao                VARCHAR(50)     NULL,
    NguoiCapNhat            VARCHAR(50)     NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS giamdinh_chitiet (
    Id                      VARCHAR(50)     NOT NULL PRIMARY KEY,
    IdGiamDinh              VARCHAR(50)     NOT NULL,
    IdBaoCaoKyThuatChiTiet  VARCHAR(50)     NULL,
    IdTaiSan                VARCHAR(50)     NULL,
    TenTaiSan               VARCHAR(255)    NULL,
    DonViTinh               VARCHAR(50)     NULL,
    SoLuong                 INT             NOT NULL DEFAULT 0,
    TinhTrang               TEXT            NULL,
    ThayMoi                 INT             NOT NULL DEFAULT 0,
    SuaChua                 INT             NOT NULL DEFAULT 0,
    GhiChu                  TEXT            NULL,
    CONSTRAINT fk_gdct_giamdinh FOREIGN KEY (IdGiamDinh) REFERENCES giamdinh(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO Sequence (SeqName, SeqYear, SeqValue) VALUES ('GIAMDINH', YEAR(NOW()), 0);
