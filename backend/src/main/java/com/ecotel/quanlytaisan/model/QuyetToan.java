package com.ecotel.quanlytaisan.model;

import lombok.Data;
import java.util.List;

@Data
public class QuyetToan {
    private String id;
    private String idDanhGia;
    
    // Thông tin tài sản/sửa chữa
    private String tenTaiSan;
    private String thuocDonVi;
    private String tenDonVi;
    private String diaDiemSuaChua;
    private String capSuaChua;
    private String tenCapSuaChua;
    
    // Chứng từ liên quan
    private String soPhieuGiaoViec;
    private String ngayNghiemThu;
    private String soPhieuVatTu;
    private String ngayLinhVatTu;
    
    // Người lập phiếu
    private String idNguoiLap;
    private String tenNguoiLap;
    private Boolean nguoiLapXacNhan;
    
    // Giám đốc duyệt
    private String idGiamDoc;
    private String tenGiamDoc;
    private Boolean giamDocXacNhan;

    private Integer daCoQuyetToan;
    
    // Workflow & trạng thái
    private Boolean share;
    private Integer trangThai; 
    
    // Audit
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;
    
    private String ghiChuBienBan;
    private String congTy;
    private String tenMauBienBan;
    
    // Relations
    private List<QuyetToanChiTiet> danhSachChiTiet;
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
