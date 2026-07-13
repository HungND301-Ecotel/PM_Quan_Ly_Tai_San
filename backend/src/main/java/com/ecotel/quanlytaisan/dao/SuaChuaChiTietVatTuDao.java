package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.SuaChuaChiTietVatTu;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SuaChuaChiTietVatTuDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<SuaChuaChiTietVatTu> findByIdSuaChua(String idSuaChua) {
        String sql = "SELECT scctvt.*, COALESCE(NULLIF(scctvt.TenVatTu, ''), vt.Ten) as TenVatTu, vt.DonViTinh FROM suachuachitietvattu scctvt LEFT JOIN CCDCVatTu vt ON scctvt.IdVatTu = vt.Id WHERE IdSuaChua = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(SuaChuaChiTietVatTu.class), idSuaChua);
    }

    public SuaChuaChiTietVatTu insert(SuaChuaChiTietVatTu e) {
        String sql = "INSERT INTO suachuachitietvattu (Id, IdSuaChua, IdVatTu, IdChiTietVatTu, SoLuong, GhiChu, TenVatTu, KyHieu) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        int r = jdbcTemplate.update(sql, e.getId(), e.getIdSuaChua(), e.getIdVatTu(), e.getIdChiTietVatTu(), e.getSoLuong(), e.getGhiChu(), e.getTenVatTu(), e.getKyHieu());
        return r > 0 ? e : null;
    }

    public void batchInsert(List<SuaChuaChiTietVatTu> list) {
        String sql = "INSERT INTO suachuachitietvattu (Id, IdSuaChua, IdVatTu, IdChiTietVatTu, SoLuong, GhiChu, TenVatTu, KyHieu) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.batchUpdate(sql, new org.springframework.jdbc.core.BatchPreparedStatementSetter() {
            @Override
            public void setValues(java.sql.PreparedStatement ps, int i) throws java.sql.SQLException {
                SuaChuaChiTietVatTu e = list.get(i);
                ps.setString(1, e.getId());
                ps.setString(2, e.getIdSuaChua());
                ps.setString(3, e.getIdVatTu());
                ps.setString(4, e.getIdChiTietVatTu());
                if (e.getSoLuong() != null) ps.setFloat(5, e.getSoLuong()); else ps.setNull(5, java.sql.Types.FLOAT);
                ps.setString(6, e.getGhiChu());
                ps.setString(7, e.getTenVatTu());
                ps.setString(8, e.getKyHieu());
            }
            @Override
            public int getBatchSize() {
                return list.size();
            }
        });
    }

    public int deleteByIdSuaChua(String idSuaChua) {
        String sql = "DELETE FROM suachuachitietvattu WHERE IdSuaChua = ?";
        return jdbcTemplate.update(sql, idSuaChua);
    }
}
