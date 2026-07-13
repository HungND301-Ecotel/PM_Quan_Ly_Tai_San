package com.ecotel.quanlytaisan.model;

import lombok.Data;
import java.util.List;

@Data
public class DanhGiaVatTu {
    private String id;
    private String idNghiemThu;
    private String quyetDinhSo;
    private String canCuHoSo;
    private String ngayDanhGia;
    private String diaDiem;
    private String idDonViDanhGia;
    private String tenDonViDanhGia;
    private String ghiChuBienBan;
    private String congTy;
    private String tenMauBienBan;
    
    // Người lập phiếu
    private String idNguoiLap;
    private String tenNguoiLap;
    private Boolean nguoiLapXacNhan;
    
    // Giám đốc duyệt
    private String idGiamDoc;
    private String tenGiamDoc;
    private Boolean giamDocXacNhan;
    
    // Workflow & trạng thái
    private Boolean share;
    private Integer trangThai; 
    
    // Audit
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;
    
    // Relations
    private List<DanhGiaVatTuChiTiet> danhSachChiTiet;
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

