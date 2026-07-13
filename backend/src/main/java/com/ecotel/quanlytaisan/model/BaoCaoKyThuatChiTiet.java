package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class BaoCaoKyThuatChiTiet {
    private String id;
    private String idBaoCaoKyThuat;
    private String idTaiSan;
    private String idKeHoachChiTiet;
    
    // Audit
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;

    // View fields
    private String tenTaiSan;
    private String donViTinh;
    private String nhomTaiSan;
}
