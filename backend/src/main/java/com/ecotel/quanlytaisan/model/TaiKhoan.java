package com.ecotel.quanlytaisan.model;

import lombok.Data;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;


@Data
public class TaiKhoan {
    private String id;
    private String tenDangNhap;
    private String matKhau;
    private String hoTen;
    private String phongBanId;
    private String tenPhongBan;
    private String chucVuId;
    private String email;
    private String soDienThoai;
    private String hinhAnh;
    private String nguoiTao;
    private String nguoiCapNhat;
    private String idCongTy;
    private Integer rule;
    private Boolean isActive;
    private String ngayTao;
    private String ngayCapNhat;
    private String chuKy;
    private String username;
    public static TaiKhoan mapToTaiKhoan(String[] row) {
        TaiKhoan tk = new TaiKhoan();
        tk.setId(row[0]);
        tk.setTenDangNhap(row[1]);
        tk.setMatKhau(row[2]);
        tk.setHoTen(row[3]);
        tk.setEmail(row[4]);
        tk.setSoDienThoai(row[5]);
        tk.setHinhAnh(row[6]);
        tk.setNguoiTao(row[7]);
        tk.setNguoiCapNhat(row[8]);
        tk.setIdCongTy(row[9]);
        tk.setRule(row[10] != null && !row[10].isEmpty() ? Integer.parseInt(row[10]) : null);
        tk.setIsActive(row[11] != null ? Boolean.parseBoolean(row[11]) : null);
        tk.setNgayTao(row[12] != null && !row[12].isEmpty() ? String.valueOf(row[12]) : null);
        tk.setNgayCapNhat(row[13] != null && !row[13].isEmpty() ? String.valueOf(row[13]) : null);
        tk.setChuKy(row[14]);
        tk.setUsername(row[15]);
        return tk;
    }
    public static TaiKhoan mapToTaiKhoan(Row row) {
        TaiKhoan tk = new TaiKhoan();
        tk.setId(getCellStringValue(row.getCell(0)));
        tk.setTenDangNhap(getCellStringValue(row.getCell(1)));
        tk.setMatKhau(getCellStringValue(row.getCell(2)));
        tk.setHoTen(getCellStringValue(row.getCell(3)));
        tk.setEmail(getCellStringValue(row.getCell(4)));
        tk.setSoDienThoai(getCellStringValue(row.getCell(5)));
        tk.setHinhAnh(getCellStringValue(row.getCell(6)));
        tk.setNguoiTao(getCellStringValue(row.getCell(7)));
        tk.setNguoiCapNhat(getCellStringValue(row.getCell(8)));
        tk.setIdCongTy(getCellStringValue(row.getCell(9)));
        tk.setRule((int) row.getCell(10).getNumericCellValue());
        tk.setIsActive(row.getCell(11).getBooleanCellValue());
        tk.setNgayTao(row.getCell(12) != null ? String.valueOf(row.getCell(12).getLocalDateTimeCellValue()) : null);
        tk.setNgayCapNhat(row.getCell(13) != null ? String.valueOf(row.getCell(13).getLocalDateTimeCellValue()) : null);
        tk.setChuKy(getCellStringValue(row.getCell(14)));
        tk.setUsername(getCellStringValue(row.getCell(15)));
        return tk;
    }

    // Helper để đọc cell string an toàn
    public static String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC: return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            default: return null;
        }
    }

} 