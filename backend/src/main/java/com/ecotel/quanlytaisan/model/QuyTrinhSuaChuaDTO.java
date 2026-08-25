package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class QuyTrinhSuaChuaDTO {
    private String id;
    
    // Tai San info
    private String thietBi;
    private String thietBiId;
    
    // Lệnh Sửa Chữa
    private String lenhSuaChua; // SoPhieu của Sửa chữa
    private String idSuaChua;
    private Integer trangThaiSuaChua; // 0, 1, 2, 3
    
    // Biên bản Giám định
    private String bienBanGiamDinh; // SoPhieu của Giám định
    private String idGiamDinh;
    private Integer trangThaiGiamDinh;
    
    // Phiếu Nghiệm thu
    private String phieuNghiemThu; // SoPhieu của Nghiệm thu
    private String idNghiemThu;
    private Integer trangThaiNghiemThu;
    
    // Tổng Trạng thái phiếu (nếu cần thiết, tuỳ chọn)
    private Integer trangThai;
    
    // History specific
    private String nhomTaiSan;
    private String lanBTGanNhat;
    private String loaiBT;
    private Integer statusHistory;
}
