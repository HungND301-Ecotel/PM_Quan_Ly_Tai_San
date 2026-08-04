package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class SuaChuaMayThang {
    private String id;
    private String idTaiSan;
    private String capSuaChua;
    private String ngayVao;
    private String ngayRa;
    private String thayTheSuaChua;
    private Double congKeHoach;
    private Double congThucHien;
    private Double tongKimLoai;
    private String hoTenKyThuat;
    private String xacNhanKetQua;
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;
    private Boolean isActive;
}