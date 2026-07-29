package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class TaiSanCon {
    // Khóa chính - dùng MaPhu làm Id (idTaiSanCon.idTaiSanCha)
    private String id;
    private String idTaiSanCon;
    private String idTaiSanCha;
    private Boolean isActive;
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;

    // Fields từ JOIN TaiSan (khi query kèm thông tin tài sản con)
    private String tenTaiSan;
    private String hienTrang;
    private String donViTinh;
    private String soLuong;
    private String ghiChu;
    private String tenDonViTinh;
    private String tenHienTrang;
    private String ghiChuTaiSan;

    // Dùng để đánh dấu xóa phía frontend (không lưu DB)
    private Boolean isDeleted;
}
