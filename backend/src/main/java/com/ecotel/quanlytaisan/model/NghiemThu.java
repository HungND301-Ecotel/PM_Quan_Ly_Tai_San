package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class NghiemThu {
    private String id;
    private String idBienBan; // ID of PhieuLinhVatTu
    private String donViQuanLy;
    private String noiDungSuaChua;
    private String ketQua;
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
    private Integer trangThai; 
    
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

