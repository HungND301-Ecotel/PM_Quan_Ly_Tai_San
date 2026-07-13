package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class PhieuGiaoViecChiTietVatTu {
    private String id;
    private String idPhieuGiaoViec;
    private String idVatTu;
    private String idChiTietVatTu;
    private Float soLuong;
    private String ghiChu;

    private String tenVatTu;
    private String donViTinh;
    private String kyHieu;
}
