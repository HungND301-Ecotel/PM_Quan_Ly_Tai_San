package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.PhieuLinhVatTuChiTietVatTu;
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
public class PhieuLinhVatTuChiTietVatTuDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<PhieuLinhVatTuChiTietVatTu> findByIdBienBan(String idBienBan) {
        String sql = """
            SELECT c.*, COALESCE(NULLIF(c.TenVatTu, ''), v.Ten) as TenVatTu, COALESCE(NULLIF(c.KyHieu, ''), v.KyHieu) as KyHieu, v.DonViTinh
            FROM PhieuLinhVatTu_ChiTietVatTu c
            LEFT JOIN CCDCVatTu v ON c.IdVatTu = v.Id
            WHERE c.IdBienBan = ?
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(PhieuLinhVatTuChiTietVatTu.class), idBienBan);
    }

    public void batchInsert(List<PhieuLinhVatTuChiTietVatTu> chiTietList) {
        String sql = "INSERT INTO PhieuLinhVatTu_ChiTietVatTu (Id, IdBienBan, IdVatTu, IdChiTietVatTu, SoLuongDeNghi, SoLuongDuyet, SoLuongThuCu, TenVatTu, KyHieu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                PhieuLinhVatTuChiTietVatTu chiTiet = chiTietList.get(i);
                ps.setString(1, chiTiet.getId() != null ? chiTiet.getId() : UUID.randomUUID().toString());
                ps.setString(2, chiTiet.getIdBienBan());
                ps.setString(3, chiTiet.getIdVatTu());
                ps.setString(4, chiTiet.getIdChiTietVatTu());
                ps.setObject(5, chiTiet.getSoLuongDeNghi());
                ps.setObject(6, chiTiet.getSoLuongDuyet());
                ps.setObject(7, chiTiet.getSoLuongThuCu());
                ps.setString(8, chiTiet.getTenVatTu());
                ps.setString(9, chiTiet.getKyHieu());
            }

            @Override
            public int getBatchSize() {
                return chiTietList.size();
            }
        });
    }

    public void deleteByIdBienBan(String idBienBan) {
        jdbcTemplate.update("DELETE FROM PhieuLinhVatTu_ChiTietVatTu WHERE IdBienBan = ?", idBienBan);
    }
}
