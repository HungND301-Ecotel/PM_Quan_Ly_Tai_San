-- Migration V141: Thêm trường tài sản phát sinh trên bảng TaiSan
ALTER TABLE TaiSan
    ADD COLUMN IsTaiSanPhatSinh TINYINT(1) NOT NULL DEFAULT 0 AFTER IdTaiSanCha;
