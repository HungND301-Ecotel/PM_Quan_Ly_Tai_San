package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.PhieuGiaoViecChiTietVatTu;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PhieuGiaoViecChiTietVatTuDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<PhieuGiaoViecChiTietVatTu> findByIdPhieuGiaoViec(String idPhieuGiaoViec) {
        String sql = "SELECT v.*, COALESCE(NULLIF(v.KyHieu, ''), c.KyHieu) as kyHieu, COALESCE(NULLIF(v.TenVatTu, ''), c.Ten) as tenVatTu, c.DonViTinh as donViTinh FROM phieugiaoviec_chitietvattu v LEFT JOIN ccdcvattu c ON v.IdVatTu = c.Id WHERE v.IdPhieuGiaoViec = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(PhieuGiaoViecChiTietVatTu.class), idPhieuGiaoViec);
    }

    public void batchInsert(List<PhieuGiaoViecChiTietVatTu> list) {
        if (list == null || list.isEmpty()) return;
        String sql = "INSERT INTO phieugiaoviec_chitietvattu (Id, IdPhieuGiaoViec, IdVatTu, IdChiTietVatTu, SoLuong, GhiChu, TenVatTu, KyHieu) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.batchUpdate(sql, list, 100, (ps, e) -> {
            ps.setString(1, e.getId());
            ps.setString(2, e.getIdPhieuGiaoViec());
            ps.setString(3, e.getIdVatTu());
            ps.setString(4, e.getIdChiTietVatTu());
            ps.setObject(5, e.getSoLuong());
            ps.setString(6, e.getGhiChu());
            ps.setString(7, e.getTenVatTu());
            ps.setString(8, e.getKyHieu());
        });
    }

    public int deleteByIdPhieuGiaoViec(String idPhieuGiaoViec) {
        return jdbcTemplate.update("DELETE FROM phieugiaoviec_chitietvattu WHERE IdPhieuGiaoViec = ?", idPhieuGiaoViec);
    }
}
