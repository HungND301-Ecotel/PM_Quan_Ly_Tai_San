package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class DanhGiaVatTuChiTiet {
    private String id;
    private String idDanhGia;
    private String idVatTu;
    private String idChiTietVatTu;
    private String tenVatTu;
    private String donViTinh;
    private Float soLuong;
    private Float khoiLuong;
    private Float chatLuongConLai;
    private Float donGia;
    private Float giaTriConLai;
    private String ghiChu;
}
