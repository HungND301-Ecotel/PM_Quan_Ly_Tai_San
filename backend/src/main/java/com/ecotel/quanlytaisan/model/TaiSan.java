package com.ecotel.quanlytaisan.model;

import lombok.Data;
import static com.ecotel.quanlytaisan.utils.ParserHelper.*;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.poi.ss.usermodel.Row;

@Data
public class TaiSan {
    private String id;
    private String idLoaiTaiSan;
    private String tenTaiSan;
    private Float nguyenGia;
    private Float giaTriKhauHaoBanDau;
    private Integer kyKhauHaoBanDau;
    private Float giaTriThanhLy;
    private String idMoHinhTaiSan;
    private Integer phuongPhapKhauHao;
    private Integer soKyKhauHao;
    private Integer taiKhoanTaiSan;
    private Integer taiKhoanKhauHao;
    private Integer taiKhoanChiPhi;
    private String idNhomTaiSan;
    private String ngayVaoSo;
    private String ngaySuDung;
    private String idDuDan;
    private String idNguonVon;
    private String kyHieu;
    private String soKyHieu;
    private String congSuat;
    private String nuocSanXuat;
    private Integer namSanXuat;
    private String lyDoTang;
    private String hienTrang;
    private Integer soLuong;
    private String donViTinh;
    private String ghiChu;
    private String idDonViBanDau;
    private String idDonViHienThoi;
    private String idDonViQuanlyKiThuat;
    private String moTa;
    private String idCongTy;
    private String ngayTao;
    private String ngayCapNhat;
    private String nguoiTao;
    private String nguoiCapNhat;
    private Boolean isActive;
    private Boolean isTaiSanCon;
    private Boolean isHeThong;
    private String idLoaiTaiSanCon;
    private String idTaiSanCha;
    private Integer trangThaiSuaChua;
    private List<String> listIdTaiSanCon;
    private List<TaiSanCon> taiSanConList;
    private String soThe;
    private Float nvNS;
    private Float vonVay;
    private Float vonKhac;
    private String tgKiemDinh;
    private Integer chuKyKiemDinh;
    private List<TaiSanFile> fileDinhKemList;
    private List<ChuKySuaChua> chuKySuaChuaList;

    public static TaiSan mapToTaiSan(String[] line) {
        TaiSan ts = new TaiSan();
        int i = 0;

        ts.setId(line[i++]);
        ts.setIdLoaiTaiSan(line[i++]);
        ts.setTenTaiSan(line[i++]);
        ts.setNguyenGia(parseFloat(line[i++]));
        ts.setGiaTriKhauHaoBanDau(parseFloat(line[i++]));
        ts.setKyKhauHaoBanDau(parseInteger(line[i++]));
        ts.setGiaTriThanhLy(parseFloat(line[i++]));
        ts.setIdMoHinhTaiSan(line[i++]);
        ts.setPhuongPhapKhauHao(parseInteger(line[i++]));
        ts.setSoKyKhauHao(parseInteger(line[i++]));
        ts.setTaiKhoanTaiSan(parseInteger(line[i++]));
        ts.setTaiKhoanKhauHao(parseInteger(line[i++]));
        ts.setTaiKhoanChiPhi(parseInteger(line[i++]));
        ts.setIdNhomTaiSan(line[i++]);
        ts.setNgayVaoSo((line[i++]));
        ts.setNgaySuDung((line[i++]));
        ts.setIdDuDan(line[i++]);
        ts.setIdNguonVon(line[i++]);
        ts.setKyHieu(line[i++]);
        ts.setSoKyHieu(line[i++]);
        ts.setCongSuat(line[i++]);
        ts.setNuocSanXuat(line[i++]);
        ts.setNamSanXuat(parseInteger(line[i++]));
        ts.setLyDoTang(line[i++]);
        ts.setHienTrang(line[i++]);
        ts.setSoLuong(parseInteger(line[i++]));
        ts.setDonViTinh(line[i++]);
        ts.setGhiChu(line[i++]);
        ts.setIdDonViBanDau(line[i++]);
        ts.setIdDonViHienThoi(line[i++]);
        ts.setMoTa(line[i++]);
        ts.setIdCongTy(line[i++]);
        ts.setNgayTao((line[i++]));
        ts.setNgayCapNhat((line[i++]));
        ts.setNguoiTao(line[i++]);
        ts.setNguoiCapNhat(line[i++]);
        ts.setIsActive(parseBoolean(line[i++]));
        ts.setIsTaiSanCon(parseBoolean(line[i++]));
        ts.setIdLoaiTaiSanCon(line[i++]);
        ts.setSoThe(line[i++]);
        ts.setNvNS(parseFloat(line[i++]));
        ts.setVonVay(parseFloat(line[i++]));
        ts.setVonKhac(parseFloat(line[i++]));
        if (line.length > i) {
            ts.setIdDonViQuanlyKiThuat(line[i++]);
        }

        return ts;
    }

    // ---------------- Mapping Excel ----------------
    public static TaiSan mapToTaiSan(Row row) {
        TaiSan ts = new TaiSan();
        int i = 0;

        ts.setId(getCellString(row.getCell(i++)));
        ts.setIdLoaiTaiSan(getCellString(row.getCell(i++)));
        ts.setTenTaiSan(getCellString(row.getCell(i++)));
        ts.setNguyenGia(getCellFloat(row.getCell(i++)));
        ts.setGiaTriKhauHaoBanDau(getCellFloat(row.getCell(i++)));
        ts.setKyKhauHaoBanDau(getCellInteger(row.getCell(i++)));
        ts.setGiaTriThanhLy(getCellFloat(row.getCell(i++)));
        ts.setIdMoHinhTaiSan(getCellString(row.getCell(i++)));
        ts.setPhuongPhapKhauHao(getCellInteger(row.getCell(i++)));
        ts.setSoKyKhauHao(getCellInteger(row.getCell(i++)));
        ts.setTaiKhoanTaiSan(getCellInteger(row.getCell(i++)));
        ts.setTaiKhoanKhauHao(getCellInteger(row.getCell(i++)));
        ts.setTaiKhoanChiPhi(getCellInteger(row.getCell(i++)));
        ts.setIdNhomTaiSan(getCellString(row.getCell(i++)));
        ts.setNgayVaoSo(getCellStringValue(row.getCell(i++)));
        ts.setNgaySuDung(getCellStringValue(row.getCell(i++)));
        ts.setIdDuDan(getCellString(row.getCell(i++)));
        ts.setIdNguonVon(getCellString(row.getCell(i++)));
        ts.setKyHieu(getCellString(row.getCell(i++)));
        ts.setSoKyHieu(getCellString(row.getCell(i++)));
        ts.setCongSuat(getCellString(row.getCell(i++)));
        ts.setNuocSanXuat(getCellString(row.getCell(i++)));
        ts.setNamSanXuat(getCellInteger(row.getCell(i++)));
        ts.setLyDoTang(getCellString(row.getCell(i++)));
        ts.setHienTrang(getCellString(row.getCell(i++)));
        ts.setSoLuong(getCellInteger(row.getCell(i++)));
        ts.setDonViTinh(getCellString(row.getCell(i++)));
        ts.setGhiChu(getCellString(row.getCell(i++)));
        ts.setIdDonViBanDau(getCellString(row.getCell(i++)));
        ts.setIdDonViHienThoi(getCellString(row.getCell(i++)));
        ts.setMoTa(getCellString(row.getCell(i++)));
        ts.setIdCongTy(getCellString(row.getCell(i++)));
        ts.setNgayTao(getCellStringValue(row.getCell(i++)));
        ts.setNgayCapNhat(getCellStringValue(row.getCell(i++)));
        ts.setNguoiTao(getCellString(row.getCell(i++)));
        ts.setNguoiCapNhat(getCellString(row.getCell(i++)));
        ts.setIsActive(getCellBoolean(row.getCell(i++)));
        ts.setIsTaiSanCon(getCellBoolean(row.getCell(i++)));
        ts.setIdLoaiTaiSanCon(getCellString(row.getCell(i++)));
        ts.setSoThe(getCellString(row.getCell(i++)));
        ts.setNvNS(getCellFloat(row.getCell(i++)));
        ts.setVonVay(getCellFloat(row.getCell(i++)));
        ts.setVonKhac(getCellFloat(row.getCell(i++)));
        ts.setIdDonViQuanlyKiThuat(getCellString(row.getCell(i++)));

        return ts;
    }

}