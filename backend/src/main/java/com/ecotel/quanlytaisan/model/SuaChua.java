package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class SuaChua {
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