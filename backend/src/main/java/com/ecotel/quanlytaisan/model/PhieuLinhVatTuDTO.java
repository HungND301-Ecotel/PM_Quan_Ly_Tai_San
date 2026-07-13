package com.ecotel.quanlytaisan.model;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class PhieuLinhVatTuDTO extends PhieuLinhVatTu {
    private String ghiChuBienBan;
    private String congTy;
    private String tenMauBienBan;

    private List<PhieuLinhVatTuChiTietTaiSan> danhSachTaiSan;
    private List<PhieuLinhVatTuChiTietVatTu> danhSachVatTu;
    
    private List<KyTaiLieu> chuKyList;
    private List<NguoiKy> nguoiKyList;

    // Additional read-only fields from joins
    private String tenDonViDeNghi;
    private String tenNguoiLap;
    private String tenGiamDoc;
}

