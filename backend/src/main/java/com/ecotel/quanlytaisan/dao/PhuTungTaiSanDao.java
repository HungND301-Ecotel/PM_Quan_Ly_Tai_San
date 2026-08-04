package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.PhuTungTaiSan;
import com.ecotel.quanlytaisan.model.PhuTungTaiSanDTO;
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
public class PhuTungTaiSanDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public List<PhuTungTaiSanDTO> getByTaiSanId(String idTaiSan) {
        String sql = "SELECT Id, IdTaiSan, Ten, DonViTinh, SoLuong, TrongLuong, NguyenLieuCheTao, " +
                     "NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive " +
                     "FROM phu_tung_tai_san WHERE IdTaiSan = ? AND (IsActive IS NULL OR IsActive = 1) ORDER BY NgayTao ASC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(PhuTungTaiSanDTO.class), idTaiSan);
    }

    public PhuTungTaiSanDTO getById(String id) {
        String sql = "SELECT Id, IdTaiSan, Ten, DonViTinh, SoLuong, TrongLuong, NguyenLieuCheTao, " +
                     "NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive " +
                     "FROM phu_tung_tai_san WHERE Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(PhuTungTaiSanDTO.class), id);
        } catch (Exception e) {
            return null;
        }
    }

    public int insert(PhuTungTaiSan obj) {
        if (obj.getId() == null || obj.getId().trim().isEmpty()) {
            obj.setId(UUID.randomUUID().toString());
        }
        if (obj.getNgayTao() == null || obj.getNgayTao().isEmpty()) {
            obj.setNgayTao(LocalDateTime.now().format(DATE_FORMATTER));
        }
        String sql = "INSERT INTO phu_tung_tai_san (Id, IdTaiSan, Ten, DonViTinh, SoLuong, TrongLuong, " +
                     "NguyenLieuCheTao, NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql,
                obj.getId(),
                obj.getIdTaiSan(),
                obj.getTen(),
                obj.getDonViTinh(),
                obj.getSoLuong(),
                obj.getTrongLuong(),
                obj.getNguyenLieuCheTao(),
                obj.getNgayTao(),
                obj.getNgayCapNhat(),
                obj.getNguoiTao(),
                obj.getNguoiCapNhat(),
                obj.getIsActive() != null ? (obj.getIsActive() ? 1 : 0) : 1);
    }

    public int update(PhuTungTaiSan obj) {
        if (obj.getNgayCapNhat() == null || obj.getNgayCapNhat().isEmpty()) {
            obj.setNgayCapNhat(LocalDateTime.now().format(DATE_FORMATTER));
        }
        String sql = "UPDATE phu_tung_tai_san SET Ten = ?, DonViTinh = ?, SoLuong = ?, TrongLuong = ?, " +
                     "NguyenLieuCheTao = ?, NgayCapNhat = ?, NguoiCapNhat = ?, IsActive = ? WHERE Id = ?";
        return jdbcTemplate.update(sql,
                obj.getTen(),
                obj.getDonViTinh(),
                obj.getSoLuong(),
                obj.getTrongLuong(),
                obj.getNguyenLieuCheTao(),
                obj.getNgayCapNhat(),
                obj.getNguoiCapNhat(),
                obj.getIsActive() != null ? (obj.getIsActive() ? 1 : 0) : 1,
                obj.getId());
    }

    public int delete(String id) {
        String sql = "DELETE FROM phu_tung_tai_san WHERE Id = ?";
        return jdbcTemplate.update(sql, id);
    }

    public int createBatch(List<PhuTungTaiSan> list) {
        if (list == null || list.isEmpty()) return 0;
        String nowStr = LocalDateTime.now().format(DATE_FORMATTER);
        String sql = "INSERT INTO phu_tung_tai_san (Id, IdTaiSan, Ten, DonViTinh, SoLuong, TrongLuong, " +
                     "NguyenLieuCheTao, NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        int[] results = jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                PhuTungTaiSan item = list.get(i);
                if (item.getId() == null || item.getId().trim().isEmpty() || item.getId().startsWith("temp-")) {
                    item.setId(UUID.randomUUID().toString());
                }
                String ngayTao = (item.getNgayTao() != null && !item.getNgayTao().isEmpty()) ? item.getNgayTao() : nowStr;

                ps.setString(1, item.getId());
                ps.setString(2, item.getIdTaiSan());
                ps.setString(3, item.getTen());
                ps.setString(4, item.getDonViTinh());

                if (item.getSoLuong() != null) ps.setDouble(5, item.getSoLuong()); else ps.setNull(5, Types.DOUBLE);
                if (item.getTrongLuong() != null) ps.setDouble(6, item.getTrongLuong()); else ps.setNull(6, Types.DOUBLE);

                ps.setString(7, item.getNguyenLieuCheTao());
                ps.setString(8, ngayTao);
                ps.setString(9, item.getNgayCapNhat());
                ps.setString(10, item.getNguoiTao());
                ps.setString(11, item.getNguoiCapNhat());
                ps.setInt(12, (item.getIsActive() != null ? (item.getIsActive() ? 1 : 0) : 1));
            }

            @Override
            public int getBatchSize() {
                return list.size();
            }
        });
        return results.length;
    }

    public int updateBatch(List<PhuTungTaiSan> list) {
        if (list == null || list.isEmpty()) return 0;
        String nowStr = LocalDateTime.now().format(DATE_FORMATTER);
        String sql = "UPDATE phu_tung_tai_san SET Ten = ?, DonViTinh = ?, SoLuong = ?, TrongLuong = ?, " +
                     "NguyenLieuCheTao = ?, NgayCapNhat = ?, NguoiCapNhat = ?, IsActive = ? WHERE Id = ?";
        int[] results = jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                PhuTungTaiSan item = list.get(i);
                String ngayCapNhat = (item.getNgayCapNhat() != null && !item.getNgayCapNhat().isEmpty()) ? item.getNgayCapNhat() : nowStr;

                ps.setString(1, item.getTen());
                ps.setString(2, item.getDonViTinh());

                if (item.getSoLuong() != null) ps.setDouble(3, item.getSoLuong()); else ps.setNull(3, Types.DOUBLE);
                if (item.getTrongLuong() != null) ps.setDouble(4, item.getTrongLuong()); else ps.setNull(4, Types.DOUBLE);

                ps.setString(5, item.getNguyenLieuCheTao());
                ps.setString(6, ngayCapNhat);
                ps.setString(7, item.getNguoiCapNhat());
                ps.setInt(8, (item.getIsActive() != null ? (item.getIsActive() ? 1 : 0) : 1));
                ps.setString(9, item.getId());
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
        // Loại bỏ các temp ID nếu có
        List<String> validIds = ids.stream().filter(id -> id != null && !id.startsWith("temp-")).toList();
        if (validIds.isEmpty()) return 0;

        String inSql = String.join(",", Collections.nCopies(validIds.size(), "?"));
        String sql = String.format("DELETE FROM phu_tung_tai_san WHERE Id IN (%s)", inSql);
        return jdbcTemplate.update(sql, validIds.toArray());
    }
}
