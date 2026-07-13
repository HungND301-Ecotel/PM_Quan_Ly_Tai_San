package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class GiamDinhChiTiet {
    private String id;
    private String idGiamDinh;
    private String idBaoCaoKyThuatChiTiet;
    private String idTaiSan;
    private String tenTaiSan;
    private String donViTinh;
    private Integer soLuong;
    private String tinhTrang;
    private Integer thayMoi;
    private Integer suaChua;
    private String ghiChu;
    private String noiDungCongViec;
}
