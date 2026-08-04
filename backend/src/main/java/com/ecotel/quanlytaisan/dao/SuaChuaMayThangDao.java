package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.SuaChuaMayThang;
import com.ecotel.quanlytaisan.model.SuaChuaMayThangDTO;
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
public class SuaChuaMayThangDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public List<SuaChuaMayThangDTO> getByTaiSanId(String idTaiSan) {
        String sql = "SELECT Id, IdTaiSan, CapSuaChua, NgayVao, NgayRa, ThayTheSuaChua, " +
                     "CongKeHoach, CongThucHien, TongKimLoai, HoTenKyThuat, XacNhanKetQua, " +
                     "NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive " +
                     "FROM sua_chua_may_thang WHERE IdTaiSan = ? AND (IsActive IS NULL OR IsActive = 1) " +
                     "ORDER BY NgayVao ASC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(SuaChuaMayThangDTO.class), idTaiSan);
    }

    public SuaChuaMayThangDTO getById(String id) {
        String sql = "SELECT Id, IdTaiSan, CapSuaChua, NgayVao, NgayRa, ThayTheSuaChua, " +
                     "CongKeHoach, CongThucHien, TongKimLoai, HoTenKyThuat, XacNhanKetQua, " +
                     "NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive " +
                     "FROM sua_chua_may_thang WHERE Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(SuaChuaMayThangDTO.class), id);
        } catch (Exception e) {
            return null;
        }
    }

    public int createBatch(List<SuaChuaMayThang> list) {
        if (list == null || list.isEmpty()) return 0;
        String nowStr = LocalDateTime.now().format(DATE_FORMATTER);
        String sql = "INSERT INTO sua_chua_may_thang (Id, IdTaiSan, CapSuaChua, NgayVao, NgayRa, " +
                     "ThayTheSuaChua, CongKeHoach, CongThucHien, TongKimLoai, HoTenKyThuat, XacNhanKetQua, " +
                     "NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        int[] results = jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                SuaChuaMayThang item = list.get(i);
                if (item.getId() == null || item.getId().trim().isEmpty() || item.getId().startsWith("temp-")) {
                    item.setId(UUID.randomUUID().toString());
                }
                String ngayTao = (item.getNgayTao() != null && !item.getNgayTao().isEmpty()) ? item.getNgayTao() : nowStr;

                ps.setString(1, item.getId());
                ps.setString(2, item.getIdTaiSan());
                ps.setString(3, item.getCapSuaChua());
                ps.setString(4, item.getNgayVao());
                ps.setString(5, item.getNgayRa());
                ps.setString(6, item.getThayTheSuaChua());
                if (item.getCongKeHoach() != null) ps.setDouble(7, item.getCongKeHoach()); else ps.setNull(7, Types.DOUBLE);
                if (item.getCongThucHien() != null) ps.setDouble(8, item.getCongThucHien()); else ps.setNull(8, Types.DOUBLE);
                if (item.getTongKimLoai() != null) ps.setDouble(9, item.getTongKimLoai()); else ps.setNull(9, Types.DOUBLE);
                ps.setString(10, item.getHoTenKyThuat());
                ps.setString(11, item.getXacNhanKetQua());
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

    public int updateBatch(List<SuaChuaMayThang> list) {
        if (list == null || list.isEmpty()) return 0;
        String nowStr = LocalDateTime.now().format(DATE_FORMATTER);
        String sql = "UPDATE sua_chua_may_thang SET CapSuaChua = ?, NgayVao = ?, NgayRa = ?, " +
                     "ThayTheSuaChua = ?, CongKeHoach = ?, CongThucHien = ?, TongKimLoai = ?, " +
                     "HoTenKyThuat = ?, XacNhanKetQua = ?, NgayCapNhat = ?, NguoiCapNhat = ?, IsActive = ? " +
                     "WHERE Id = ?";
        int[] results = jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                SuaChuaMayThang item = list.get(i);
                String ngayCapNhat = (item.getNgayCapNhat() != null && !item.getNgayCapNhat().isEmpty()) ? item.getNgayCapNhat() : nowStr;

                ps.setString(1, item.getCapSuaChua());
                ps.setString(2, item.getNgayVao());
                ps.setString(3, item.getNgayRa());
                ps.setString(4, item.getThayTheSuaChua());
                if (item.getCongKeHoach() != null) ps.setDouble(5, item.getCongKeHoach()); else ps.setNull(5, Types.DOUBLE);
                if (item.getCongThucHien() != null) ps.setDouble(6, item.getCongThucHien()); else ps.setNull(6, Types.DOUBLE);
                if (item.getTongKimLoai() != null) ps.setDouble(7, item.getTongKimLoai()); else ps.setNull(7, Types.DOUBLE);
                ps.setString(8, item.getHoTenKyThuat());
                ps.setString(9, item.getXacNhanKetQua());
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
        String sql = String.format("DELETE FROM sua_chua_may_thang WHERE Id IN (%s)", inSql);
        return jdbcTemplate.update(sql, validIds.toArray());
    }
}