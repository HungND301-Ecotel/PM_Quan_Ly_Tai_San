package com.ecotel.quanlytaisan.model;

public class PhuTungTaiSan {
    private String id;
    private String idTaiSan;
    private String ten;
    private String donViTinh;
    private Double soLuong;
    private Double trongLuong;
    private String nguyenLieuCheTao;
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;
    private Boolean isActive;

    public PhuTungTaiSan() {}

    public PhuTungTaiSan(String id, String idTaiSan, String ten, String donViTinh, Double soLuong, Double trongLuong, String nguyenLieuCheTao, String ngayTao, String ngayCapNhat, String nguoiTao, String nguoiCapNhat, Boolean isActive) {
        this.id = id;
        this.idTaiSan = idTaiSan;
        this.ten = ten;
        this.donViTinh = donViTinh;
        this.soLuong = soLuong;
        this.trongLuong = trongLuong;
        this.nguyenLieuCheTao = nguyenLieuCheTao;
        this.ngayTao = ngayTao;
        this.ngayCapNhat = ngayCapNhat;
        this.nguoiTao = nguoiTao;
        this.nguoiCapNhat = nguoiCapNhat;
        this.isActive = isActive;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getIdTaiSan() {
        return idTaiSan;
    }

    public void setIdTaiSan(String idTaiSan) {
        this.idTaiSan = idTaiSan;
    }

    public String getTen() {
        return ten;
    }

    public void setTen(String ten) {
        this.ten = ten;
    }

    public String getDonViTinh() {
        return donViTinh;
    }

    public void setDonViTinh(String donViTinh) {
        this.donViTinh = donViTinh;
    }

    public Double getSoLuong() {
        return soLuong;
    }

    public void setSoLuong(Double soLuong) {
        this.soLuong = soLuong;
    }

    public Double getTrongLuong() {
        return trongLuong;
    }

    public void setTrongLuong(Double trongLuong) {
        this.trongLuong = trongLuong;
    }

    public String getNguyenLieuCheTao() {
        return nguyenLieuCheTao;
    }

    public void setNguyenLieuCheTao(String nguyenLieuCheTao) {
        this.nguyenLieuCheTao = nguyenLieuCheTao;
    }

    public String getNgayTao() {
        return ngayTao;
    }

    public void setNgayTao(String ngayTao) {
        this.ngayTao = ngayTao;
    }

    public String getNgayCapNhat() {
        return ngayCapNhat;
    }

    public void setNgayCapNhat(String ngayCapNhat) {
        this.ngayCapNhat = ngayCapNhat;
    }

    public String getNguoiTao() {
        return nguoiTao;
    }

    public void setNguoiTao(String nguoiTao) {
        this.nguoiTao = nguoiTao;
    }

    public String getNguoiCapNhat() {
        return nguoiCapNhat;
    }

    public void setNguoiCapNhat(String nguoiCapNhat) {
        this.nguoiCapNhat = nguoiCapNhat;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
