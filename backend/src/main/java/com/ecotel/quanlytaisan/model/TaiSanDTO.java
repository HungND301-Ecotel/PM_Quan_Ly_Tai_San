package com.ecotel.quanlytaisan.model;

import lombok.Data;

import java.util.List;

@Data
public class TaiSanDTO {
    private String id;
    private String tenTaiSan;
    private Double nguyenGia;
    private Double giaTriKhauHaoBanDau;
    private Integer kyKhauHaoBanDau;
    private Double giaTriThanhLy;

    private String idMoHinhTaiSan;
    private String tenMoHinh;

    private String idNhomTaiSan;
    private String tenNhom;

    private String idDuAn;
    private String tenDuAn;

    private String idNguonVon;
    private String tenNguonKinhPhi;

    private Integer phuongPhapKhauHao;
    private Integer soKyKhauHao;
    private Integer taiKhoanTaiSan;
    private Integer taiKhoanKhauHao;
    private Integer taiKhoanChiPhi;
    private String ngayVaoSo;
    private String ngaySuDung;
    private String kyHieu;
    private String soKyHieu;
    private String congSuat;
    private String nuocSanXuat;
    private Integer namSanXuat;
    private String lyDoTang;
    private String hienTrang;
    private String tenHienTrang;
    private Integer soLuong;
    private String donViTinh;
    private String tenDonViTinh;
    private String ghiChu;
    private String idDonViBanDau;
    private String idDonViHienThoi;
    private String moTa;
    private String idCongTy;
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;
    private Boolean isActive;
    private String idTaiSanCon;
    private Boolean isTaiSanCon;
    private Boolean isHeThong;
    private String idTaiSanCha;
    private String maPhu;
    private List<TaiSanDTO> taiSanConList;
    private List<TaiSanFile> fileDinhKemList;
    private List<ChuKySuaChua> chuKySuaChuaList;

    private String idLoaiTaiSanCon;
    private String tenLoai;

    private String soThe;
    private Double nvNS;
    private Double vonVay;
    private Double vonKhac;
    private String tgKiemDinh;
    private Integer chuKyKiemDinh;
    private String trangThaiKiemDinh;
    private String ngayDangKiemTiepTheo;
    private Long thoiHanConLai;
    private String tenDonViBanDau;
    private String tenDonViHienThoi;
    private List<NguonKinhPhi> nguonKinhPhiList;
    private List<SetNguonKinhPhi>setNguonKinhPhiList;
    private Double gioHoatDong;
    private String idDonViQuanlyKiThuat;
    private String tenDonViQuanlyKiThuat;
    private String maLyLich;
    private Integer coTaiSanConDaDieuChuyen; // 1: có tài sản con đã điều chuyển, 0: không có
}
