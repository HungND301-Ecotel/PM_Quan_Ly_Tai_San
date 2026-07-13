DROP TABLE IF EXISTS suachuachitietvattu;
DROP TABLE IF EXISTS suachuachitiettaisan;
DROP TABLE IF EXISTS suachuachitiet;
DROP TABLE IF EXISTS suachua_chitiet;
DROP TABLE IF EXISTS suachua;

CREATE TABLE suachua (
    Id VARCHAR(50) PRIMARY KEY,
    IdCongTy VARCHAR(50),
    CongTy VARCHAR(255),
    TenMauBienBan VARCHAR(255),
    IdGiamDinh VARCHAR(50),
    DonViQuanLy VARCHAR(50),
    DonViGiamSat VARCHAR(50),
    NgayBaoDuongGanNhat VARCHAR(50),
    GioHoatDong VARCHAR(50),
    LoaiSuaChua VARCHAR(50),
    TinhTrang TEXT,
    NhanCongThucHien VARCHAR(255),
    ThoiGian VARCHAR(100),
    DiaDiem VARCHAR(255),
    
    IdNguoiLap VARCHAR(50),
    NguoiLapXacNhan TINYINT(1) NOT NULL DEFAULT 0,
    IdGiamDoc VARCHAR(50),
    GiamDocXacNhan TINYINT(1) NOT NULL DEFAULT 0,
    Share TINYINT(1) NOT NULL DEFAULT 0,
    TrangThai INT DEFAULT 0,
    NgayTao VARCHAR(30),
    NgayCapNhat VARCHAR(30),
    NguoiTao VARCHAR(50),
    NguoiCapNhat VARCHAR(50),
    GhiChuBienBan TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE suachuachitiettaisan (
    Id VARCHAR(50) PRIMARY KEY,
    IdSuaChua VARCHAR(50),
    IdChiTietGiamDinh VARCHAR(50),
    IdTaiSan VARCHAR(50),
    TenTaiSan VARCHAR(255),
    CONSTRAINT fk_suachua_taisan FOREIGN KEY (IdSuaChua) REFERENCES suachua(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE suachuachitietvattu (
    Id VARCHAR(50) PRIMARY KEY,
    IdSuaChua VARCHAR(50),
    IdVatTu VARCHAR(50),
    IdChiTietVatTu VARCHAR(50),
    SoLuong FLOAT,
    GhiChu TEXT,
    CONSTRAINT fk_suachua_vattu FOREIGN KEY (IdSuaChua) REFERENCES suachua(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
