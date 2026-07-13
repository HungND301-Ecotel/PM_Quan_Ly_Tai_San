package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.GiamDinhChiTiet;
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
public class GiamDinhChiTietDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<GiamDinhChiTiet> findAll() {
        String sql = "SELECT * FROM giamdinh_chitiet";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(GiamDinhChiTiet.class));
    }

    public GiamDinhChiTiet findById(String id) {
        String sql = "SELECT * FROM giamdinh_chitiet WHERE Id = ?";
        List<GiamDinhChiTiet> list = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(GiamDinhChiTiet.class), id);
        return list.isEmpty() ? null : list.get(0);
    }

    public List<GiamDinhChiTiet> findByIdGiamDinh(String idGiamDinh) {
        String sql = "SELECT * FROM giamdinh_chitiet WHERE IdGiamDinh = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(GiamDinhChiTiet.class), idGiamDinh);
    }

    public String generateNextId() {
        return "GDCT_" + UUID.randomUUID().toString();
    }

    public int insert(GiamDinhChiTiet e) {
        if (e.getId() == null) e.setId(generateNextId());
        String sql = """
            INSERT INTO giamdinh_chitiet (
                Id, IdGiamDinh, IdBaoCaoKyThuatChiTiet, IdTaiSan, TenTaiSan, DonViTinh, SoLuong, TinhTrang, ThayMoi, SuaChua, GhiChu, NoiDungCongViec
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        return jdbcTemplate.update(sql,
                e.getId(), e.getIdGiamDinh(), e.getIdBaoCaoKyThuatChiTiet(), e.getIdTaiSan(), e.getTenTaiSan(), e.getDonViTinh(),
                e.getSoLuong() != null ? e.getSoLuong() : 0,
                e.getTinhTrang(),
                e.getThayMoi() != null ? e.getThayMoi() : 0,
                e.getSuaChua() != null ? e.getSuaChua() : 0,
                e.getGhiChu(), e.getNoiDungCongViec()
        );
    }

    public int[] batchInsert(List<GiamDinhChiTiet> list) {
        String sql = """
            INSERT INTO giamdinh_chitiet (
                Id, IdGiamDinh, IdBaoCaoKyThuatChiTiet, IdTaiSan, TenTaiSan, DonViTinh, SoLuong, TinhTrang, ThayMoi, SuaChua, GhiChu, NoiDungCongViec
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        return jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                GiamDinhChiTiet e = list.get(i);
                if (e.getId() == null) e.setId(generateNextId());
                ps.setString(1, e.getId());
                ps.setString(2, e.getIdGiamDinh());
                ps.setString(3, e.getIdBaoCaoKyThuatChiTiet());
                ps.setString(4, e.getIdTaiSan());
                ps.setString(5, e.getTenTaiSan());
                ps.setString(6, e.getDonViTinh());
                ps.setInt(7, e.getSoLuong() != null ? e.getSoLuong() : 0);
                ps.setString(8, e.getTinhTrang());
                ps.setInt(9, e.getThayMoi() != null ? e.getThayMoi() : 0);
                ps.setInt(10, e.getSuaChua() != null ? e.getSuaChua() : 0);
                ps.setString(11, e.getGhiChu());
                ps.setString(12, e.getNoiDungCongViec());
            }
            @Override
            public int getBatchSize() { return list.size(); }
        });
    }

    public int deleteByIdGiamDinh(String idGiamDinh) {
        String sql = "DELETE FROM giamdinh_chitiet WHERE IdGiamDinh = ?";
        return jdbcTemplate.update(sql, idGiamDinh);
    }
}
