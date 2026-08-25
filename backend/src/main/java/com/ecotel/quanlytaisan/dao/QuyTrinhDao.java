package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.QuyTrinhSuaChuaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Repository
public class QuyTrinhDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<QuyTrinhSuaChuaDTO> getPagedQuyTrinh(int page, int pageSize, String idTaiSan, Integer nam) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                scct.Id AS idSuaChuaChiTiet,
                ts.TenTaiSan AS thietBi,
                ts.Id AS thietBiId,
                sc.SoPhieu AS lenhSuaChua,
                sc.Id AS idSuaChua,
                sc.TrangThai AS trangThaiSuaChua,
                gd.SoPhieu AS bienBanGiamDinh,
                gd.Id AS idGiamDinh,
                gd.TrangThai AS trangThaiGiamDinh,
                nt.SoPhieu AS phieuNghiemThu,
                nt.Id AS idNghiemThu,
                nt.TrangThai AS trangThaiNghiemThu
            FROM suachua_chitiet scct
            LEFT JOIN suachua sc ON scct.IdSuaChua = sc.Id
            LEFT JOIN taisan ts ON scct.IdTaiSan = ts.Id
            LEFT JOIN giamdinh_chitiet gdct ON gdct.IdBaoCaoKyThuatChiTiet = scct.Id
            LEFT JOIN giamdinh gd ON gdct.IdGiamDinh = gd.Id
            LEFT JOIN nghiemthu_taisan ntts ON ntts.IdChiTietGiamDinhMayMoc = gdct.Id
            LEFT JOIN nghiemthu nt ON ntts.IdBienBan = nt.Id
            WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();

        if (idTaiSan != null && !idTaiSan.isEmpty()) {
            sql.append(" AND scct.IdTaiSan = ?");
            params.add(idTaiSan);
        }

        if (nam != null) {
            sql.append(" AND sc.nam = ?");
            params.add(nam);
        }

        sql.append(" ORDER BY scct.NgayTao DESC");
        sql.append(" LIMIT ? OFFSET ?");
        params.add(pageSize);
        params.add((page - 1) * pageSize);

        return jdbcTemplate.query(sql.toString(), new BeanPropertyRowMapper<>(QuyTrinhSuaChuaDTO.class), params.toArray());
    }

    public int countQuyTrinh(String idTaiSan, Integer nam) {
        StringBuilder sql = new StringBuilder("""
            SELECT COUNT(scct.Id)
            FROM suachua_chitiet scct
            LEFT JOIN suachua sc ON scct.IdSuaChua = sc.Id
            WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();

        if (idTaiSan != null && !idTaiSan.isEmpty()) {
            sql.append(" AND scct.IdTaiSan = ?");
            params.add(idTaiSan);
        }

        if (nam != null) {
            sql.append(" AND sc.nam = ?");
            params.add(nam);
        }

        Integer count = jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
        return count != null ? count : 0;
    }

    public List<QuyTrinhSuaChuaDTO> getPagedHistory(int page, int pageSize, String search, Integer status) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                ts.Id AS thietBiId,
                ts.TenTaiSan AS thietBi,
                ts.IdNhomTaiSan AS nhomTaiSan,
                ts.TrangThaiSuaChua AS statusHistory,
                sc.ThoiGian AS lanBTGanNhat,
                sc.LoaiSuaChua AS loaiBT
            FROM taisan ts
            LEFT JOIN (
                SELECT 
                    bct1.IdTaiSan,
                    s1.ThoiGian,
                    s1.LoaiSuaChua
                FROM suachua s1
                JOIN giamdinh g1 ON s1.IdGiamDinh = g1.Id
                JOIN baocaokythuat_chitiet bct1 ON bct1.IdBaoCaoKyThuat = g1.IdBaoCaoKyThuat
                WHERE s1.Id = (
                    SELECT s2.Id
                    FROM suachua s2
                    JOIN giamdinh g2 ON s2.IdGiamDinh = g2.Id
                    JOIN baocaokythuat_chitiet bct2 ON bct2.IdBaoCaoKyThuat = g2.IdBaoCaoKyThuat
                    WHERE bct2.IdTaiSan = bct1.IdTaiSan
                    ORDER BY s2.NgayTao DESC
                    LIMIT 1
                )
            ) sc ON sc.IdTaiSan = ts.Id
            WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();

        if (search != null && !search.isEmpty()) {
            sql.append(" AND (ts.TenTaiSan LIKE ? OR ts.Id LIKE ?)");
            String searchPattern = "%" + search + "%";
            params.add(searchPattern);
            params.add(searchPattern);
        }

        if (status != null) {
            sql.append(" AND ts.TrangThaiSuaChua = ?");
            params.add(status);
        }

        sql.append(" ORDER BY ts.Id ASC LIMIT ? OFFSET ?");
        params.add(pageSize);
        params.add((page - 1) * pageSize);

        return jdbcTemplate.query(sql.toString(), new BeanPropertyRowMapper<>(QuyTrinhSuaChuaDTO.class), params.toArray());
    }

    public int countHistory(String search, Integer status) {
        StringBuilder sql = new StringBuilder("""
            SELECT COUNT(*)
            FROM taisan ts
            WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();

        if (search != null && !search.isEmpty()) {
            sql.append(" AND (ts.TenTaiSan LIKE ? OR ts.Id LIKE ?)");
            String searchPattern = "%" + search + "%";
            params.add(searchPattern);
            params.add(searchPattern);
        }

        if (status != null) {
            sql.append(" AND ts.TrangThaiSuaChua = ?");
            params.add(status);
        }

        Integer count = jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
        return count != null ? count : 0;
    }

    public List<Map<String, Object>> countHistoryByStatus(String search) {
        StringBuilder sql = new StringBuilder("""
            SELECT ts.TrangThaiSuaChua as statusHistory, COUNT(*) as count
            FROM taisan ts
            WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();

        if (search != null && !search.isEmpty()) {
            sql.append(" AND (ts.TenTaiSan LIKE ? OR ts.Id LIKE ?)");
            String searchPattern = "%" + search + "%";
            params.add(searchPattern);
            params.add(searchPattern);
        }

        sql.append(" GROUP BY ts.TrangThaiSuaChua");

        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    public List<com.ecotel.quanlytaisan.model.VatTuTieuHaoDTO> getMaterialConsumption(
            String idTaiSan, String dateFrom, String dateTo, String nhomTaiSan) {
        StringBuilder sql = new StringBuilder();
        List<Object> params = new java.util.ArrayList<>();

        boolean isMayMoc = nhomTaiSan != null && 
            (nhomTaiSan.equalsIgnoreCase("MAY_MOC") || nhomTaiSan.equalsIgnoreCase("MAYMOC") || nhomTaiSan.equalsIgnoreCase("may_moc"));

        if (isMayMoc) {
            sql.append("""
                SELECT 
                    cv.Id AS ma,
                    cv.Ten AS ten,
                    cv.DonViTinh AS donViTinh,
                    SUM(ntvt.SoLuong) AS soLuong,
                    cv.GiaTri AS giaTri
                FROM nghiemthu_maymoc_vattu ntvt
                JOIN nghiemthu_maymoc_taisan ntts ON ntvt.IdBienBanTaiSan = ntts.Id
                JOIN nghiemthu_maymoc nt ON ntts.IdBienBan = nt.Id
                LEFT JOIN CCDCVatTu cv ON ntvt.IdVatTu = cv.Id
                WHERE ntts.IdTaiSan = ?
            """);
            params.add(idTaiSan);
        } else {
            sql.append("""
                SELECT 
                    cv.Id AS ma,
                    cv.Ten AS ten,
                    cv.DonViTinh AS donViTinh,
                    SUM(ntptct.SoLuongThayTe) AS soLuong,
                    cv.GiaTri AS giaTri
                FROM nghiemthu_phuongtien_chitiet ntptct
                JOIN nghiemthu_phuongtien nt ON ntptct.IdNghiemThuPhuongTien = nt.Id
                LEFT JOIN CCDCVatTu cv ON ntptct.IdVatTu = cv.Id
                WHERE nt.IdTaiSan = ?
            """);
            params.add(idTaiSan);
        }

        if (dateFrom != null && !dateFrom.isEmpty()) {
            sql.append(" AND nt.NgayTao >= ?");
            params.add(dateFrom);
        }

        if (dateTo != null && !dateTo.isEmpty()) {
            sql.append(" AND nt.NgayTao <= ?");
            params.add(dateTo + " 23:59:59");
        }

        sql.append(" GROUP BY cv.Id, cv.Ten, cv.DonViTinh, cv.GiaTri");

        return jdbcTemplate.query(sql.toString(), 
                new BeanPropertyRowMapper<>(com.ecotel.quanlytaisan.model.VatTuTieuHaoDTO.class), 
                params.toArray());
    }

    public List<Map<String, Object>> getLichSuHoatDong(String idTaiSan, String dateFrom, String dateTo) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT ")
           .append("sc.ThoiGian AS ngayBatDau, ")
           .append("dg.NgayDanhGia AS ngayKetThuc, ")
           .append("lsc.Ten AS loaiSuaChua, ")
           .append("dg.GhiChuBienBan AS ghiChu ")
           .append("FROM suachua sc ")
           .append("JOIN LoaiSCBD lsc ON lsc.Id = sc.LoaiSuaChua ")
           .append("JOIN suachuachitiettaisan sct ON sc.Id = sct.IdSuaChua ")
           .append("LEFT JOIN PhieuGiaoViec pgv ON sc.Id = pgv.IdSuaChua ")
           .append("LEFT JOIN PhieuLinhVatTu plvt ON pgv.Id = plvt.IdPhieuGiaoViec ")
           .append("LEFT JOIN nghiemthu nt ON plvt.Id = nt.IdBienBan ")
           .append("LEFT JOIN danhgia_vattu dg ON nt.Id = dg.IdNghiemThu ")
           .append("WHERE sct.IdTaiSan = ? ");

        List<Object> params = new ArrayList<>();
        params.add(idTaiSan);

        if (dateFrom != null && !dateFrom.isEmpty()) {
            sql.append(" AND sc.ThoiGian >= ?");
            params.add(dateFrom);
        }

        if (dateTo != null && !dateTo.isEmpty()) {
            sql.append(" AND sc.ThoiGian <= ?");
            params.add(dateTo + " 23:59:59");
        }

        sql.append(" ORDER BY sc.ThoiGian DESC");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }
}
