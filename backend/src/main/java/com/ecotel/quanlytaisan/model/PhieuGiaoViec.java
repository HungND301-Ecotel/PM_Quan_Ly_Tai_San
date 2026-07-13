package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class PhieuGiaoViec {
    private String id;
    private String idSuaChua;
    private String soPhieu;
    private String donViQuanLy;
    private Integer caBatDau;
    private String ngayBatDau;
    private Integer caDuKien;
    private String ngayDuKien;
    private String ghiChuBienBan;
    private String congTy;
    private String tenMauBienBan;

    // Người lập phiếu
    private String idNguoiLap;
    private Boolean nguoiLapXacNhan;
    
    // Giám đốc duyệt
    private String idGiamDoc;
    private Boolean giamDocXacNhan;
    
    // Workflow & trạng thái
    private Boolean share;
    private Integer trangThai; // 0:nháp, 1:đang chờ ký/đã duyệt 1 phần, 2:hủy, 3:hoàn thành
    
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

