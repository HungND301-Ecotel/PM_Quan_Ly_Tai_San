package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.NghiemThuChiTietVatTu;
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
public class NghiemThuChiTietVatTuDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<NghiemThuChiTietVatTu> findByIdNghiemThu(String idNghiemThu) {
        String sql = "SELECT ctvt.*,vt.GiaTri FROM nghiemthu_chitietvattu ctvt LEFT JOIN CCDCVatTu vt ON ctvt.IdVatTu = vt.Id  WHERE IdNghiemThu = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(NghiemThuChiTietVatTu.class), idNghiemThu);
    }

    public String generateNextId() {
        return "NTCTVT_" + UUID.randomUUID().toString();
    }

    public int[] batchInsert(List<NghiemThuChiTietVatTu> list) {
        String sql = """
            INSERT INTO nghiemthu_chitietvattu (
                Id, IdNghiemThu, IdVatTu, IdChiTietVatTu, KyHieu, TenVatTu, DonViTinh, SoLuongThayThe, SoLuongThuHoi, GhiChu
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        return jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                NghiemThuChiTietVatTu e = list.get(i);
                if (e.getId() == null) e.setId(generateNextId());
                ps.setString(1, e.getId());
                ps.setString(2, e.getIdNghiemThu());
                ps.setString(3, e.getIdVatTu());
                ps.setString(4, e.getIdChiTietVatTu());
                ps.setString(5, e.getKyHieu());
                ps.setString(6, e.getTenVatTu());
                ps.setString(7, e.getDonViTinh());
                ps.setFloat(8, e.getSoLuongThayThe() != null ? e.getSoLuongThayThe() : 0);
                ps.setFloat(9, e.getSoLuongThuHoi() != null ? e.getSoLuongThuHoi() : 0);
                ps.setString(10, e.getGhiChu());
            }
            @Override
            public int getBatchSize() { return list.size(); }
        });
    }

    public int deleteByIdNghiemThu(String idNghiemThu) {
        String sql = "DELETE FROM nghiemthu_chitietvattu WHERE IdNghiemThu = ?";
        return jdbcTemplate.update(sql, idNghiemThu);
    }
}
