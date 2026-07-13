package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.PhieuLinhVatTuChiTietTaiSan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

@Repository
public class PhieuLinhVatTuChiTietTaiSanDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<PhieuLinhVatTuChiTietTaiSan> findByIdBienBan(String idBienBan) {
        String sql = """
            SELECT c.*, t.TenTaiSan
            FROM PhieuLinhVatTu_ChiTietTaiSan c
            LEFT JOIN TaiSan t ON c.IdTaiSan = t.Id
            WHERE c.IdBienBan = ?
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(PhieuLinhVatTuChiTietTaiSan.class), idBienBan);
    }

    public void batchInsert(List<PhieuLinhVatTuChiTietTaiSan> chiTietList) {
        String sql = "INSERT INTO PhieuLinhVatTu_ChiTietTaiSan (Id, IdBienBan, IdTaiSan) VALUES (?, ?, ?)";
        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                PhieuLinhVatTuChiTietTaiSan chiTiet = chiTietList.get(i);
                ps.setString(1, chiTiet.getId() != null ? chiTiet.getId() : UUID.randomUUID().toString());
                ps.setString(2, chiTiet.getIdBienBan());
                ps.setString(3, chiTiet.getIdTaiSan());
            }

            @Override
            public int getBatchSize() {
                return chiTietList.size();
            }
        });
    }

    public void deleteByIdBienBan(String idBienBan) {
        jdbcTemplate.update("DELETE FROM PhieuLinhVatTu_ChiTietTaiSan WHERE IdBienBan = ?", idBienBan);
    }
}
