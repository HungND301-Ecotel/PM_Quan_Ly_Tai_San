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
                bcct.Id,
                ts.TenTaiSan AS thietBi,
                bcct.IdTaiSan AS thietBiId,
                ts.IdNhomTaiSan AS nhomTaiSan,
                CONCAT(LPAD(bc.Thang, 2, '0'), '/', bc.Nam) AS lanBTGanNhat,
                CASE 
                    WHEN bc.Thang = 1 THEN khct.CapSuaChuaThang1
                    WHEN bc.Thang = 2 THEN khct.CapSuaChuaThang2
                    WHEN bc.Thang = 3 THEN khct.CapSuaChuaThang3
                    WHEN bc.Thang = 4 THEN khct.CapSuaChuaThang4
                    WHEN bc.Thang = 5 THEN khct.CapSuaChuaThang5
                    WHEN bc.Thang = 6 THEN khct.CapSuaChuaThang6
                    WHEN bc.Thang = 7 THEN khct.CapSuaChuaThang7
                    WHEN bc.Thang = 8 THEN khct.CapSuaChuaThang8
                    WHEN bc.Thang = 9 THEN khct.CapSuaChuaThang9
                    WHEN bc.Thang = 10 THEN khct.CapSuaChuaThang10
                    WHEN bc.Thang = 11 THEN khct.CapSuaChuaThang11
                    WHEN bc.Thang = 12 THEN khct.CapSuaChuaThang12
                    ELSE ''
                END AS loaiBT,
                nt.Id AS idNghiemThu,
                CASE WHEN dg.Id IS NOT NULL THEN 1 ELSE 0 END as statusHistory
            FROM baocaokythuat_chitiet bcct
            LEFT JOIN baocaokythuat bc ON bcct.IdBaoCaoKyThuat = bc.Id
            LEFT JOIN taisan ts ON bcct.IdTaiSan = ts.Id
            LEFT JOIN kehoachsuachua_chitiet_taisan khct ON bcct.IdKeHoachChiTiet = khct.Id
            LEFT JOIN giamdinh gd ON gd.IdBaoCaoKyThuat = bc.Id
            LEFT JOIN suachua sc ON sc.IdGiamDinh = gd.Id
            LEFT JOIN PhieuGiaoViec pgv ON pgv.IdSuaChua = sc.Id
            LEFT JOIN PhieuLinhVatTu plvt ON plvt.IdPhieuGiaoViec = pgv.Id
            LEFT JOIN nghiemthu nt ON nt.IdBienBan = plvt.Id
            LEFT JOIN danhgia_vattu dg ON dg.IdNghiemThu = nt.Id
            WHERE bcct.Id = (
                SELECT b_sub.Id 
                FROM baocaokythuat_chitiet b_sub
                INNER JOIN baocaokythuat bc_sub ON b_sub.IdBaoCaoKyThuat = bc_sub.Id
                WHERE b_sub.IdTaiSan = bcct.IdTaiSan
                ORDER BY bc_sub.Nam DESC, bc_sub.Thang DESC, b_sub.NgayTao DESC
                LIMIT 1
            )
        """);

        List<Object> params = new ArrayList<>();

        if (search != null && !search.isEmpty()) {
            sql.append(" AND (ts.TenTaiSan LIKE ? OR ts.Id LIKE ?)");
            String searchPattern = "%" + search + "%";
            params.add(searchPattern);
            params.add(searchPattern);
        }

        if (status != null) {
            sql.append(" AND (CASE WHEN dg.Id IS NOT NULL THEN 1 ELSE 0 END) = ?");
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
            FROM baocaokythuat_chitiet bcct
            LEFT JOIN baocaokythuat bc ON bcct.IdBaoCaoKyThuat = bc.Id
            LEFT JOIN taisan ts ON bcct.IdTaiSan = ts.Id
            LEFT JOIN giamdinh gd ON gd.IdBaoCaoKyThuat = bc.Id
            LEFT JOIN suachua sc ON sc.IdGiamDinh = gd.Id
            LEFT JOIN PhieuGiaoViec pgv ON pgv.IdSuaChua = sc.Id
            LEFT JOIN PhieuLinhVatTu plvt ON plvt.IdPhieuGiaoViec = pgv.Id
            LEFT JOIN nghiemthu nt ON nt.IdBienBan = plvt.Id
            LEFT JOIN danhgia_vattu dg ON dg.IdNghiemThu = nt.Id
            WHERE bcct.Id = (
                SELECT b_sub.Id 
                FROM baocaokythuat_chitiet b_sub
                INNER JOIN baocaokythuat bc_sub ON b_sub.IdBaoCaoKyThuat = bc_sub.Id
                WHERE b_sub.IdTaiSan = bcct.IdTaiSan
                ORDER BY bc_sub.Nam DESC, bc_sub.Thang DESC, b_sub.NgayTao DESC
                LIMIT 1
            )
        """);

        List<Object> params = new ArrayList<>();

        if (search != null && !search.isEmpty()) {
            sql.append(" AND (ts.TenTaiSan LIKE ? OR ts.Id LIKE ?)");
            String searchPattern = "%" + search + "%";
            params.add(searchPattern);
            params.add(searchPattern);
        }

        if (status != null) {
            sql.append(" AND (CASE WHEN dg.Id IS NOT NULL THEN 1 ELSE 0 END) = ?");
            params.add(status);
        }

        Integer count = jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
        return count != null ? count : 0;
    }

    public List<Map<String, Object>> countHistoryByStatus(String search) {
        StringBuilder sql = new StringBuilder("""
            SELECT (CASE WHEN dg.Id IS NOT NULL THEN 1 ELSE 0 END) as statusHistory, COUNT(*) as count
            FROM baocaokythuat_chitiet bcct
            LEFT JOIN baocaokythuat bc ON bcct.IdBaoCaoKyThuat = bc.Id
            LEFT JOIN taisan ts ON bcct.IdTaiSan = ts.Id
            LEFT JOIN giamdinh gd ON gd.IdBaoCaoKyThuat = bc.Id
            LEFT JOIN suachua sc ON sc.IdGiamDinh = gd.Id
            LEFT JOIN PhieuGiaoViec pgv ON pgv.IdSuaChua = sc.Id
            LEFT JOIN PhieuLinhVatTu plvt ON plvt.IdPhieuGiaoViec = pgv.Id
            LEFT JOIN nghiemthu nt ON nt.IdBienBan = plvt.Id
            LEFT JOIN danhgia_vattu dg ON dg.IdNghiemThu = nt.Id
            WHERE bcct.Id = (
                SELECT b_sub.Id 
                FROM baocaokythuat_chitiet b_sub
                INNER JOIN baocaokythuat bc_sub ON b_sub.IdBaoCaoKyThuat = bc_sub.Id
                WHERE b_sub.IdTaiSan = bcct.IdTaiSan
                ORDER BY bc_sub.Nam DESC, bc_sub.Thang DESC, b_sub.NgayTao DESC
                LIMIT 1
            )
        """);

        List<Object> params = new ArrayList<>();

        if (search != null && !search.isEmpty()) {
            sql.append(" AND (ts.TenTaiSan LIKE ? OR ts.Id LIKE ?)");
            String searchPattern = "%" + search + "%";
            params.add(searchPattern);
            params.add(searchPattern);
        }

        sql.append(" GROUP BY (CASE WHEN dg.Id IS NOT NULL THEN 1 ELSE 0 END)");

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
