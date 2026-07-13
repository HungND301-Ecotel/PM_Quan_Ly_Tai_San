package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class PhieuGiaoViecChiTietTaiSan {
    private String id;
    private String idPhieuGiaoViec;
    private String idSuaChuaChiTiet;
    private String idTaiSan;
    private String tenTaiSan;
    private String maCongViec;
    private String noiDung;
    private String nguoiThucHien;
    private String tenNguoiThucHien;
}
