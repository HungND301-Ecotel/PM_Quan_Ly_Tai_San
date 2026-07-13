package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.ChiTietTaiSan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ChiTietTaiSanDao {
    @Autowired
    private JdbcTemplate jdbcTemplate;


    private final RowMapper<ChiTietTaiSan> rowMapper = (rs, rowNum) -> {
        ChiTietTaiSan ts = new ChiTietTaiSan();
        ts.setId(rs.getString("Id"));
        ts.setIdTaiSan(rs.getString("IdTaiSan"));
        ts.setNgayVaoSo(rs.getString("NgayVaoSo"));
        ts.setNgaySuDung(rs.getString("NgaySuDung"));
        ts.setSoKyHieu(rs.getString("SoKyHieu"));
        ts.setCongSuat(rs.getString("CongSuat"));
        ts.setNuocSanXuat(rs.getString("NuocSanXuat"));
        ts.setNamSanXuat(rs.getInt("NamSanXuat"));
        ts.setSoLuong(rs.getInt("SoLuong"));
        try {
            ts.setTenTaiSan(rs.getString("TenTaiSan"));
            ts.setGiaTri(rs.getDouble("GiaTri"));
            ts.setDonViTinh(rs.getString("DonViTinh"));
        } catch (Exception ignored) {}
        return ts;
    };

    public List<ChiTietTaiSan> findAll(String idTaiSan) {
        StringBuilder sql = new StringBuilder(
                "SELECT ct.*, c.Ten as TenTaiSan, c.DonViTinh, c.GiaTri " +
                "FROM ChiTietTaiSan ct " +
                "JOIN CCDCVatTu c ON ct.IdTaiSan = c.Id " +
                "WHERE 1=1 "
        );
        
        if (idTaiSan != null && !idTaiSan.trim().isEmpty()) {
            sql.append(" AND ct.IdTaiSan = ? ");
            return jdbcTemplate.query(sql.toString(), rowMapper, idTaiSan);
        }
        
        return jdbcTemplate.query(sql.toString(), rowMapper);
    }

    public List<ChiTietTaiSan> findAllByTaiSanIds(List<String> taiSanIds) {
        if (taiSanIds == null || taiSanIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        String inSql = String.join(",", java.util.Collections.nCopies(taiSanIds.size(), "?"));
        String sql = String.format(
                "SELECT ct.*, c.Ten as TenTaiSan, c.DonViTinh " +
                "FROM ChiTietTaiSan ct " +
                "JOIN CCDCVatTu c ON ct.IdTaiSan = c.Id " +
                "WHERE ct.IdTaiSan IN (%s)", inSql);
        return jdbcTemplate.query(sql, rowMapper, taiSanIds.toArray());
    }

    public ChiTietTaiSan findById(String id) {
        String sql = "SELECT * FROM ChiTietTaiSan WHERE Id = ?";
        return jdbcTemplate.queryForObject(sql, rowMapper, id);
    }

    public int insert(ChiTietTaiSan ts) {
        // Kiểm tra id không null và không empty
        if (ts.getId() == null || ts.getId().trim().isEmpty()) {
            throw new IllegalArgumentException("Id không được null hoặc rỗng");
        }

        // Kiểm tra xem record có tồn tại không
        String checkSql = "SELECT COUNT(*) FROM ChiTietTaiSan WHERE Id = ?";
        int count = jdbcTemplate.queryForObject(checkSql, Integer.class, ts.getId());

        if (count > 0) {
            // Nếu tồn tại thì update
            return update(ts);
        } else {
            // Nếu chưa tồn tại thì insert
            String sql = "INSERT INTO ChiTietTaiSan " +
                    "(Id, IdTaiSan, NgayVaoSo, NgaySuDung, SoKyHieu, CongSuat, NuocSanXuat, NamSanXuat, SoLuong) " +
                    "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)";
            return jdbcTemplate.update(sql,
                    ts.getId(), ts.getIdTaiSan(), ts.getNgayVaoSo(), ts.getNgaySuDung(),
                    ts.getSoKyHieu(), ts.getCongSuat(), ts.getNuocSanXuat(), ts.getNamSanXuat(), ts.getSoLuong());
        }
    }


    public int update(ChiTietTaiSan ts) {
        String sql = "UPDATE ChiTietTaiSan SET IdTaiSan=?, NgayVaoSo=?, NgaySuDung=?, SoKyHieu=?, CongSuat=?, NuocSanXuat=?, NamSanXuat=?, SoLuong=? WHERE Id=?";
        return jdbcTemplate.update(sql,
                ts.getIdTaiSan(), ts.getNgayVaoSo(), ts.getNgaySuDung(),
                ts.getSoKyHieu(), ts.getCongSuat(), ts.getNuocSanXuat(), ts.getNamSanXuat(), ts.getSoLuong(),
                ts.getId());
    }

    public int delete(String id) {
        String sql = "DELETE FROM ChiTietTaiSan WHERE Id=?";
        return jdbcTemplate.update(sql, id);
    }
}
