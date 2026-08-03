package com.ecotel.quanlytaisan.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class LichTrinhDTO {
    private String id;
    
    @NotBlank(message = "idTaiSan là bắt buộc")
    private String idTaiSan;
    
    @NotNull(message = "Năm là bắt buộc")
    private Integer nam;
    
    @NotNull(message = "Tháng là bắt buộc")
    private Integer thang;
    
    private Integer luyKeTruoc;
    
    private String ghiChu;
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;
    
    @Valid
    private List<ChiTietLichTrinh> chiTietLichTrinhs;
}
