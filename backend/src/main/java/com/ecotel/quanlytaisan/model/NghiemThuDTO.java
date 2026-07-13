package com.ecotel.quanlytaisan.model;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class NghiemThuDTO extends NghiemThu {
    private String ghiChuBienBan;
    private String congTy;
    private String tenMauBienBan;

    private List<NghiemThuChiTietTaiSan> danhSachTaiSan;
    private List<NghiemThuChiTietVatTu> danhSachVatTu;
    
    private List<KyTaiLieu> chuKyList;
    private List<NguoiKy> nguoiKyList;

    // Additional read-only fields from joins
    private String tenDonViQuanLy;
    private String tenNguoiLap;
    private String tenGiamDoc;
    private String soPhieuBienBan; // Map from PhieuLinhVatTu or BienBan
    private Integer daCoPhieuDanhGia;
}

