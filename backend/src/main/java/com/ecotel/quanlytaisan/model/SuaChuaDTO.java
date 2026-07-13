package com.ecotel.quanlytaisan.model;

import lombok.Data;
import java.util.List;

@Data
public class SuaChuaDTO {
    private String id;
    private String idCongTy;
    private String congTy;
    private String tenMauBienBan;
    
    // New fields
    private String idGiamDinh;
    private String donViQuanLy;
    private String donViGiamSat;
    private String gioHoatDong;
    private String loaiSuaChua;
    private String tinhTrang;
    private String nhanCongThucHien;
    private String thoiGian;
    private String diaDiem;
    private String ngayBaoDuongGanNhat;

    private String ghiChuBienBan;

    private Integer daCoPhieuGiaoViec;
    
    // Người lập phiếu
    private String idNguoiLap;
    private Boolean nguoiLapXacNhan;
    
    // Giám đốc duyệt
    private String idGiamDoc;
    private Boolean giamDocXacNhan;
    
    // Workflow & trạng thái
    private Boolean share;
    private Integer trangThai; // 0:nháp, 1:duyệt, 2:hủy, 3:hoàn thành
    
    // Audit
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;

    // Join fields
    private String tenNguoiLap;
    private String tenGiamDoc;
    private String tenDonViQuanLy;
    private String tenDonViGiamSat;
    private String tenLoaiSuaChua;
    private String soPhieuGiamDinh;

    // Danh sách chi tiết
    private List<SuaChuaChiTietTaiSan> danhSachTaiSan;
    private List<SuaChuaChiTietVatTu> danhSachVatTu;
    
    // Workflow tracking
    private List<KyTaiLieu> chuKyList;
    private List<NguoiKy> nguoiKyList;

    public Boolean getNguoiLapXacNhan() {
        return nguoiLapXacNhan != null ? nguoiLapXacNhan : false;
    }

    public Boolean getGiamDocXacNhan() {
        return giamDocXacNhan != null ? giamDocXacNhan : false;
    }

    public Boolean getShare() {
        return share != null ? share : false;
    }
}