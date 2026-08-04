package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class TaiSanSapDenKySuaChuaDTO {
    private String idTaiSan;
    private String tenTaiSan;
    private String soThe;
    private Integer chuKy;              // vd: 250
    private String donViChuKy;          // vd: "GIO"
    private String idLoaiSuaChua;
    private Double gioHoatDongTong;      // tổng giờ hoạt động lũy kế tới hiện tại
    private Integer trangThaiSuaChua; 
}