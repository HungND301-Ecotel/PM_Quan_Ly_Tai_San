-- ============================================================
-- V127: Tạo bảng Báo Cáo Kỹ Thuật và Báo Cáo Chi Tiết
-- ============================================================

CREATE TABLE IF NOT EXISTS baocaokythuat (
    Id                      VARCHAR(50)     NOT NULL                            COMMENT 'Khóa chính, tự sinh pattern BCKT-YYYY-NNNN',
    IdCongTy                VARCHAR(50)     NOT NULL                            COMMENT 'ID công ty',
    CongTy                  VARCHAR(255)    NULL                                COMMENT 'Tên công ty',
    TenMauBienBan           VARCHAR(255)    NULL                                COMMENT 'Tên mẫu biên bản',
    IdKeHoach               VARCHAR(50)     NULL                                COMMENT 'ID kế hoạch',
    Thang                   INT             NULL                                COMMENT 'Tháng',
    Nam                     INT             NULL                                COMMENT 'Năm',
    DonViBaoCao             VARCHAR(50)     NULL                                COMMENT 'Id đơn vị báo cáo',
    DonViNhan               VARCHAR(50)     NULL                                COMMENT 'Id đơn vị nhận',
    TenTaiSan               VARCHAR(255)    NULL                                COMMENT 'Tên tài sản',
    NgayBaoDuongGanNhat     VARCHAR(30)     NULL                                COMMENT 'Ngày bảo dưỡng gần nhất',
    TinhTrang               VARCHAR(255)    NULL                                COMMENT 'Tình trạng',
    NoiDungSuaChua          TEXT            NULL                                COMMENT 'Nội dung sửa chữa',
    GhiChu                  TEXT            NULL                                COMMENT 'Ghi chú',
    GhiChuBienBan           TEXT            NULL                                COMMENT 'Ghi chú biên bản',

    -- Ký duyệt
    IdNguoiLap              VARCHAR(50)     NULL                                COMMENT 'ID nhân viên lập',
    NguoiLapXacNhan         TINYINT(1)      NOT NULL DEFAULT 0                  COMMENT 'Người lập đã xác nhận: 0=Chưa | 1=Đã xác nhận',
    IdGiamDoc               VARCHAR(50)     NULL                                COMMENT 'ID nhân viên giám đốc duyệt',
    GiamDocXacNhan          TINYINT(1)      NOT NULL DEFAULT 0                  COMMENT 'Giám đốc đã duyệt: 0=Chưa | 1=Đã duyệt',

    Share                   TINYINT(1)      NOT NULL DEFAULT 0                  COMMENT 'Chia sẻ phiếu: 0=Không | 1=Có',
    TrangThai               TINYINT         NOT NULL DEFAULT 0                  COMMENT 'Trạng thái: 0=Nháp | 1=Đã duyệt | 2=Hủy | 3=Hoàn thành',

    -- Audit
    NgayTao                 VARCHAR(30)     NULL                                COMMENT 'Ngày tạo',
    NgayCapNhat             VARCHAR(30)     NULL                                COMMENT 'Ngày cập nhật',
    NguoiTao                VARCHAR(50)     NULL                                COMMENT 'Người tạo',
    NguoiCapNhat            VARCHAR(50)     NULL                                COMMENT 'Người cập nhật',

    PRIMARY KEY (Id),
    INDEX idx_baocaokythuat_idcongty (IdCongTy),
    INDEX idx_baocaokythuat_idkehoach (IdKeHoach),
    INDEX idx_baocaokythuat_trangthai (TrangThai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Báo cáo kỹ thuật';


CREATE TABLE IF NOT EXISTS baocaokythuat_chitiet (
    Id                      VARCHAR(50)     NOT NULL                            COMMENT 'Khóa chính UUID',
    IdBaoCaoKyThuat         VARCHAR(50)     NOT NULL                            COMMENT 'ID Báo cáo kỹ thuật (FK)',
    IdTaiSan                VARCHAR(50)     NULL                                COMMENT 'ID Tài sản',
    IdKeHoachChiTiet        VARCHAR(50)     NULL                                COMMENT 'ID Kế hoạch chi tiết tài sản',

    NgayTao                 VARCHAR(30)     NULL                                COMMENT 'Ngày tạo',
    NgayCapNhat             VARCHAR(30)     NULL                                COMMENT 'Ngày cập nhật',
    NguoiTao                VARCHAR(50)     NULL                                COMMENT 'Người tạo',
    NguoiCapNhat            VARCHAR(50)     NULL                                COMMENT 'Người cập nhật',

    PRIMARY KEY (Id),
    INDEX idx_bcktct_idbaocao (IdBaoCaoKyThuat),
    INDEX idx_bcktct_idtaisan (IdTaiSan),
    CONSTRAINT fk_bcktct_baocao FOREIGN KEY (IdBaoCaoKyThuat) REFERENCES baocaokythuat(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết báo cáo kỹ thuật';

INSERT IGNORE INTO Sequence (SeqName, SeqYear, SeqValue) VALUES ('BAOCAOKYTHUAT', YEAR(NOW()), 0);
