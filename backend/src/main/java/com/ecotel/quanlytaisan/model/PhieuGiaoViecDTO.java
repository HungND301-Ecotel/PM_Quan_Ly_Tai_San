package com.ecotel.quanlytaisan.model;

import lombok.Data;
import java.util.List;

@Data
public class PhieuGiaoViecDTO extends PhieuGiaoViec {
    private String ghiChuBienBan;
    private String congTy;
    private String tenMauBienBan;
    private String tenNguoiLap;
    private String tenGiamDoc;
    private String tenDonViQuanLy;
    private Integer daCoPhieuLinhVatTu;

    private List<PhieuGiaoViecChiTietTaiSan> danhSachTaiSan;
    private List<PhieuGiaoViecChiTietVatTu> danhSachVatTu;

    // Workflow signature details
    private List<KyTaiLieu> chuKyList;
    private List<NguoiKy> nguoiKyList;
}

