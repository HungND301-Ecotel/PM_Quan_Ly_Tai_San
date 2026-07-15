package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class QuyetToanChiTiet {
    private String id;
    private String idQuyetToan;
    private String idVatTu;
    private String idChiTietVatTu;
    private String tenVatTu;
    private Float soLuong;
    private Float donGia;
    private Float thanhTien;
    private String ghiChu;
}
