package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class SuCoTaiSan {
    private String id;
    private String idTaiSan;
    private String ca;
    private String ngayThangNam;
    private String hoTenVanHanh;
    private String nguyenNhan;
    private String hoTenSuaChua;
    private Double gioNgung;
    private Double tienCongSC;
    private Double tienNguyenVatLieu;
    private Double tongCong;
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;
    private Boolean isActive;
}