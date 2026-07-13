package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.SuaChuaChiTietTaiSan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SuaChuaChiTietTaiSanDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<SuaChuaChiTietTaiSan> findByIdSuaChua(String idSuaChua) {
        String sql = "SELECT * FROM suachuachitiettaisan WHERE IdSuaChua = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(SuaChuaChiTietTaiSan.class), idSuaChua);
    }

    public SuaChuaChiTietTaiSan insert(SuaChuaChiTietTaiSan e) {
        String sql = "INSERT INTO suachuachitiettaisan (Id, IdSuaChua, IdChiTietGiamDinh, IdTaiSan, TenTaiSan) VALUES (?, ?, ?, ?, ?)";
        int r = jdbcTemplate.update(sql, e.getId(), e.getIdSuaChua(), e.getIdChiTietGiamDinh(), e.getIdTaiSan(), e.getTenTaiSan());
        return r > 0 ? e : null;
    }

    public void batchInsert(List<SuaChuaChiTietTaiSan> list) {
        String sql = "INSERT INTO suachuachitiettaisan (Id, IdSuaChua, IdChiTietGiamDinh, IdTaiSan, TenTaiSan) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.batchUpdate(sql, new org.springframework.jdbc.core.BatchPreparedStatementSetter() {
            @Override
            public void setValues(java.sql.PreparedStatement ps, int i) throws java.sql.SQLException {
                SuaChuaChiTietTaiSan e = list.get(i);
                ps.setString(1, e.getId());
                ps.setString(2, e.getIdSuaChua());
                ps.setString(3, e.getIdChiTietGiamDinh());
                ps.setString(4, e.getIdTaiSan());
                ps.setString(5, e.getTenTaiSan());
            }
            @Override
            public int getBatchSize() {
                return list.size();
            }
        });
    }

    public int deleteByIdSuaChua(String idSuaChua) {
        String sql = "DELETE FROM suachuachitiettaisan WHERE IdSuaChua = ?";
        return jdbcTemplate.update(sql, idSuaChua);
    }
}
