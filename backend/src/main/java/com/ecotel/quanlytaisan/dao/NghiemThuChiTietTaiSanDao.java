package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.NghiemThuChiTietTaiSan;
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
public class NghiemThuChiTietTaiSanDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<NghiemThuChiTietTaiSan> findByIdNghiemThu(String idNghiemThu) {
        String sql = "SELECT * FROM nghiemthu_chitiettaisan WHERE IdNghiemThu = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(NghiemThuChiTietTaiSan.class), idNghiemThu);
    }

    public String generateNextId() {
        return "NTCTTS_" + UUID.randomUUID().toString();
    }

    public int[] batchInsert(List<NghiemThuChiTietTaiSan> list) {
        String sql = """
            INSERT INTO nghiemthu_chitiettaisan (
                Id, IdNghiemThu, IdTaiSan, TenTaiSan, MaCongViec, NoiDung, SoLuong, GhiChu
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;
        return jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                NghiemThuChiTietTaiSan e = list.get(i);
                if (e.getId() == null) e.setId(generateNextId());
                ps.setString(1, e.getId());
                ps.setString(2, e.getIdNghiemThu());
                ps.setString(3, e.getIdTaiSan());
                ps.setString(4, e.getTenTaiSan());
                ps.setString(5, e.getMaCongViec());
                ps.setString(6, e.getNoiDung());
                ps.setFloat(7, e.getSoLuong() != null ? e.getSoLuong() : 0);
                ps.setString(8, e.getGhiChu());
            }
            @Override
            public int getBatchSize() { return list.size(); }
        });
    }

    public int deleteByIdNghiemThu(String idNghiemThu) {
        String sql = "DELETE FROM nghiemthu_chitiettaisan WHERE IdNghiemThu = ?";
        return jdbcTemplate.update(sql, idNghiemThu);
    }
}
