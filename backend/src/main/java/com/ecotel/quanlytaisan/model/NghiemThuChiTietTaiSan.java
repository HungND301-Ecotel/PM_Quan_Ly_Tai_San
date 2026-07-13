package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class NghiemThuChiTietTaiSan {
    private String id;
    private String idNghiemThu;
    private String idTaiSan;
    private String tenTaiSan;
    private String maCongViec;
    private String noiDung;
    private Float soLuong;
    private String ghiChu;
}
