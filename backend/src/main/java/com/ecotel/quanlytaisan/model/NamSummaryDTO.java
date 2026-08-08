package com.ecotel.quanlytaisan.model;

public class NamSummaryDTO {
    private Integer nam;
    private Long soLuongKeHoach;
    private Long soLuongThietBi; // optional, tính lazy chỉ cho các năm đang hiển thị

    public Integer getNam() { return nam; }
    public void setNam(Integer nam) { this.nam = nam; }
    public Long getSoLuongKeHoach() { return soLuongKeHoach; }
    public void setSoLuongKeHoach(Long soLuongKeHoach) { this.soLuongKeHoach = soLuongKeHoach; }
    public Long getSoLuongThietBi() { return soLuongThietBi; }
    public void setSoLuongThietBi(Long soLuongThietBi) { this.soLuongThietBi = soLuongThietBi; }
}
