package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class NghiemThuChiTietVatTu {
    private String id;
    private String idNghiemThu;
    private String idVatTu;
    private String idChiTietVatTu;
    private String kyHieu;
    private String tenVatTu;
    private String donViTinh;
    private Float soLuongThayThe;
    private Float soLuongThuHoi;
    private String ghiChu;
    private Double giaTri;
}
