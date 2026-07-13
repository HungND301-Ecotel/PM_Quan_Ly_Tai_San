package com.ecotel.quanlytaisan.model;

import lombok.Data;
import org.apache.poi.ss.usermodel.Row;

import static com.ecotel.quanlytaisan.utils.ParserHelper.getCellStringValue;
import static com.ecotel.quanlytaisan.utils.ParserHelper.parseInteger;

@Data
public class ChiTietTaiSan {
    private String id;
    private String idTaiSan;
    private String ngayVaoSo;
    private String ngaySuDung;
    private String soKyHieu;
    private String congSuat;
    private String nuocSanXuat;
    private Integer namSanXuat;
    private  int soLuong;
    private double giaTri;    
    private String tenTaiSan;
    private String donViTinh;
    
    public static ChiTietTaiSan mapToChiTietTaiSan(String[] row) {
        ChiTietTaiSan ts = new ChiTietTaiSan();
        ts.setId(row[0]);
        ts.setIdTaiSan(row[1]);
        ts.setNgayVaoSo(row[2]);
        ts.setNgaySuDung(row[3]);
        ts.setSoKyHieu(row[4]);
        ts.setCongSuat(row[5]);
        ts.setNuocSanXuat(row[6]);
        ts.setNamSanXuat(row[7] != null && !row[7].isEmpty() ? Integer.parseInt(row[7]) : 0);
        ts.setSoLuong(row[8] != null && !row[8].isEmpty() ? Integer.parseInt(row[8]) : 0);
        return ts;
    }
    public static ChiTietTaiSan mapToChiTietTaiSan(Row row) {
        ChiTietTaiSan ts = new ChiTietTaiSan();
        ts.setId(getCellStringValue(row.getCell(0)));
        ts.setIdTaiSan(getCellStringValue(row.getCell(1)));
        ts.setNgayVaoSo(getCellStringValue(row.getCell(2)));
        ts.setNgaySuDung(getCellStringValue(row.getCell(3)));
        ts.setSoKyHieu(getCellStringValue(row.getCell(4)));
        ts.setCongSuat(getCellStringValue(row.getCell(5)));
        ts.setNuocSanXuat(getCellStringValue(row.getCell(6)));
        ts.setNamSanXuat(parseInteger(String.valueOf(row.getCell(7))));
        ts.setSoLuong(parseInteger(String.valueOf(row.getCell(8))));
        return ts;
    }

}
