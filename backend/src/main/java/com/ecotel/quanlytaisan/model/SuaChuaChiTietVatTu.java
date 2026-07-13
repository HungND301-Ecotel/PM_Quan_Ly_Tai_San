package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class SuaChuaChiTietVatTu {
    private String id;
    private String idSuaChua;
    private String idVatTu;
    private String idChiTietVatTu;
    private Float soLuong;
    private String ghiChu;

    private String tenVatTu;
    private String donViTinh;
    private String kyHieu;
}
