package com.ecotel.quanlytaisan.model;

import lombok.Data;

@Data
public class PhieuLinhVatTuChiTietTaiSan {
    private String id;
    private String idBienBan;
    private String idTaiSan;
    
    // For joining details in DTO if needed
    private String tenTaiSan;
    private String maTaiSan;
}
