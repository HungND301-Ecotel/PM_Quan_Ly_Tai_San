package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class KeHoachSuaChuaChiTietTaiSan {
    private String id;
    private String idKeHoachSuaChua;
    private String idTaiSan;
    private Integer soLuong;
    private String ghiChu;
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;
    private Boolean isActive;
    private String idDonViBaoTri;

    // Các trường hiển thị thêm (từ join)
    private String tenTaiSan;
    private String idNhomTaiSan;
    private String idLoaiTaiSan;
    private String donViTinh;

    // 12 trường cấp sửa chữa theo từng tháng (lưu ID của CapSuaChua)
    private String capSuaChuaThang1;
    private String capSuaChuaThang2;
    private String capSuaChuaThang3;
    private String capSuaChuaThang4;
    private String capSuaChuaThang5;
    private String capSuaChuaThang6;
    private String capSuaChuaThang7;
    private String capSuaChuaThang8;
    private String capSuaChuaThang9;
    private String capSuaChuaThang10;
    private String capSuaChuaThang11;
    private String capSuaChuaThang12;

    // Các trường transient phục vụ query động
    private String capSuaChua;
    private Integer daCoBienBan;
}
