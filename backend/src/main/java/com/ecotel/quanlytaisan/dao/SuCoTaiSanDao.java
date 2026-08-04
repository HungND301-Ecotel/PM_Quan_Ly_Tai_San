package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.SuCoTaiSan;
import com.ecotel.quanlytaisan.model.SuCoTaiSanDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Repository
public class SuCoTaiSanDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public List<SuCoTaiSanDTO> getByTaiSanId(String idTaiSan) {
        String sql = "SELECT Id, IdTaiSan, Ca, NgayThangNam, HoTenVanHanh, NguyenNhan, HoTenSuaChua, " +
                     "GioNgung, TienCongSC, TienNguyenVatLieu, TongCong, " +
                     "NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive " +
                     "FROM su_co_tai_san WHERE IdTaiSan = ? AND (IsActive IS NULL OR IsActive = 1) ORDER BY NgayThangNam ASC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(SuCoTaiSanDTO.class), idTaiSan);
    }

    public SuCoTaiSanDTO getById(String id) {
        String sql = "SELECT Id, IdTaiSan, Ca, NgayThangNam, HoTenVanHanh, NguyenNhan, HoTenSuaChua, " +
                     "GioNgung, TienCongSC, TienNguyenVatLieu, TongCong, " +
                     "NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive " +
                     "FROM su_co_tai_san WHERE Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(SuCoTaiSanDTO.class), id);
        } catch (Exception e) {
            return null;
        }
    }

    public int createBatch(List<SuCoTaiSan> list) {
        if (list == null || list.isEmpty()) return 0;
        String nowStr = LocalDateTime.now().format(DATE_FORMATTER);
        String sql = "INSERT INTO su_co_tai_san (Id, IdTaiSan, Ca, NgayThangNam, HoTenVanHanh, NguyenNhan, " +
                     "HoTenSuaChua, GioNgung, TienCongSC, TienNguyenVatLieu, TongCong, " +
                     "NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        int[] results = jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                SuCoTaiSan item = list.get(i);
                if (item.getId() == null || item.getId().trim().isEmpty() || item.getId().startsWith("temp-")) {
                    item.setId(UUID.randomUUID().toString());
                }
                String ngayTao = (item.getNgayTao() != null && !item.getNgayTao().isEmpty()) ? item.getNgayTao() : nowStr;

                ps.setString(1, item.getId());
                ps.setString(2, item.getIdTaiSan());
                ps.setString(3, item.getCa());
                ps.setString(4, item.getNgayThangNam());
                ps.setString(5, item.getHoTenVanHanh());
                ps.setString(6, item.getNguyenNhan());
                ps.setString(7, item.getHoTenSuaChua());
                if (item.getGioNgung() != null) ps.setDouble(8, item.getGioNgung()); else ps.setNull(8, Types.DOUBLE);
                if (item.getTienCongSC() != null) ps.setDouble(9, item.getTienCongSC()); else ps.setNull(9, Types.DOUBLE);
                if (item.getTienNguyenVatLieu() != null) ps.setDouble(10, item.getTienNguyenVatLieu()); else ps.setNull(10, Types.DOUBLE);
                if (item.getTongCong() != null) ps.setDouble(11, item.getTongCong()); else ps.setNull(11, Types.DOUBLE);
                ps.setString(12, ngayTao);
                ps.setString(13, item.getNgayCapNhat());
                ps.setString(14, item.getNguoiTao());
                ps.setString(15, item.getNguoiCapNhat());
                ps.setInt(16, (item.getIsActive() != null ? (item.getIsActive() ? 1 : 0) : 1));
            }

            @Override
            public int getBatchSize() {
                return list.size();
            }
        });
        return results.length;
    }

    public int updateBatch(List<SuCoTaiSan> list) {
        if (list == null || list.isEmpty()) return 0;
        String nowStr = LocalDateTime.now().format(DATE_FORMATTER);
        String sql = "UPDATE su_co_tai_san SET Ca = ?, NgayThangNam = ?, HoTenVanHanh = ?, NguyenNhan = ?, " +
                     "HoTenSuaChua = ?, GioNgung = ?, TienCongSC = ?, TienNguyenVatLieu = ?, TongCong = ?, " +
                     "NgayCapNhat = ?, NguoiCapNhat = ?, IsActive = ? WHERE Id = ?";
        int[] results = jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                SuCoTaiSan item = list.get(i);
                String ngayCapNhat = (item.getNgayCapNhat() != null && !item.getNgayCapNhat().isEmpty()) ? item.getNgayCapNhat() : nowStr;

                ps.setString(1, item.getCa());
                ps.setString(2, item.getNgayThangNam());
                ps.setString(3, item.getHoTenVanHanh());
                ps.setString(4, item.getNguyenNhan());
                ps.setString(5, item.getHoTenSuaChua());
                if (item.getGioNgung() != null) ps.setDouble(6, item.getGioNgung()); else ps.setNull(6, Types.DOUBLE);
                if (item.getTienCongSC() != null) ps.setDouble(7, item.getTienCongSC()); else ps.setNull(7, Types.DOUBLE);
                if (item.getTienNguyenVatLieu() != null) ps.setDouble(8, item.getTienNguyenVatLieu()); else ps.setNull(8, Types.DOUBLE);
                if (item.getTongCong() != null) ps.setDouble(9, item.getTongCong()); else ps.setNull(9, Types.DOUBLE);
                ps.setString(10, ngayCapNhat);
                ps.setString(11, item.getNguoiCapNhat());
                ps.setInt(12, (item.getIsActive() != null ? (item.getIsActive() ? 1 : 0) : 1));
                ps.setString(13, item.getId());
            }

            @Override
            public int getBatchSize() {
                return list.size();
            }
        });
        return results.length;
    }

    public int deleteBatch(List<String> ids) {
        if (ids == null || ids.isEmpty()) return 0;
        List<String> validIds = ids.stream().filter(id -> id != null && !id.startsWith("temp-")).toList();
        if (validIds.isEmpty()) return 0;

        String inSql = String.join(",", Collections.nCopies(validIds.size(), "?"));
        String sql = String.format("DELETE FROM su_co_tai_san WHERE Id IN (%s)", inSql);
        return jdbcTemplate.update(sql, validIds.toArray());
    }
}
