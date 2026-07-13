package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class PhieuLinhVatTuChiTietVatTu {
    private String id;
    private String idBienBan;
    private String idVatTu;
    private String idChiTietVatTu;
    private Float soLuongDeNghi;
    private Float soLuongDuyet;
    private Float soLuongThuCu;
    
    // For joining details in DTO if needed
    private String tenVatTu;
    private String maVatTu;
    private String donViTinh;
    private String kyHieu;
}
