CREATE TABLE quyettoan (
    Id VARCHAR(255) PRIMARY KEY,
    IdDanhGia VARCHAR(255),
    TenTaiSan VARCHAR(500),
    ThuocDonVi VARCHAR(255),
    DiaDiemSuaChua VARCHAR(500),
    CapSuaChua VARCHAR(255),
    SoPhieuGiaoViec VARCHAR(255),
    NgayNghiemThu VARCHAR(50),
    SoPhieuVatTu VARCHAR(255),
    NgayLinhVatTu VARCHAR(50),
    IdNguoiLap VARCHAR(255),
    NguoiLapXacNhan TINYINT(1) DEFAULT 0,
    IdGiamDoc VARCHAR(255),
    GiamDocXacNhan TINYINT(1) DEFAULT 0,
    Share TINYINT(1) DEFAULT 0,
    TrangThai INT DEFAULT 0,
    NgayTao VARCHAR(50),
    NgayCapNhat VARCHAR(50),
    NguoiTao VARCHAR(255),
    NguoiCapNhat VARCHAR(255),
    GhiChuBienBan TEXT,
    CongTy VARCHAR(255),
    TenMauBienBan VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quyettoan_chitiet (
    Id VARCHAR(255) PRIMARY KEY,
    IdQuyetToan VARCHAR(255),
    IdVatTu VARCHAR(255),
    IdChiTietVatTu VARCHAR(255),
    TenVatTu VARCHAR(500),
    SoLuong FLOAT,
    DonGia FLOAT,
    ThanhTien FLOAT,
    GhiChu TEXT,
    CONSTRAINT fk_qtct_qt FOREIGN KEY (IdQuyetToan) REFERENCES quyettoan(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
