package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class PhieuLinhVatTu {
    private String id;
    private String idPhieuGiaoViec;
    private String soPhieu;
    private String soQuyetDinh;
    private String donViDeNghi;
    private String mucDichSuDung;
    private String ghiChu;
    private String ghiChuBienBan;
    private String congTy;
    private String tenMauBienBan;

    private Integer daCoNghiemThu;

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

