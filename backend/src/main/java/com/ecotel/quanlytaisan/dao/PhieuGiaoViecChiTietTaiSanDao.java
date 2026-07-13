package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.PhieuGiaoViecChiTietTaiSan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PhieuGiaoViecChiTietTaiSanDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<PhieuGiaoViecChiTietTaiSan> findByIdPhieuGiaoViec(String idPhieuGiaoViec) {
        String sql = "SELECT ct.*, nv.HoTen as tenNguoiThucHien FROM phieugiaoviec_chitiettaisan ct LEFT JOIN NhanVien nv ON ct.NguoiThucHien = nv.Id WHERE ct.IdPhieuGiaoViec = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(PhieuGiaoViecChiTietTaiSan.class), idPhieuGiaoViec);
    }

    public void batchInsert(List<PhieuGiaoViecChiTietTaiSan> list) {
        if (list == null || list.isEmpty()) return;
        String sql = "INSERT INTO phieugiaoviec_chitiettaisan (Id, IdPhieuGiaoViec, IdSuaChuaChiTiet, IdTaiSan, TenTaiSan, MaCongViec, NoiDung, NguoiThucHien) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.batchUpdate(sql, list, 100, (ps, e) -> {
            ps.setString(1, e.getId());
            ps.setString(2, e.getIdPhieuGiaoViec());
            ps.setString(3, e.getIdSuaChuaChiTiet());
            ps.setString(4, e.getIdTaiSan());
            ps.setString(5, e.getTenTaiSan());
            ps.setString(6, e.getMaCongViec());
            ps.setString(7, e.getNoiDung());
            ps.setString(8, e.getNguoiThucHien());
        });
    }

    public int deleteByIdPhieuGiaoViec(String idPhieuGiaoViec) {
        return jdbcTemplate.update("DELETE FROM phieugiaoviec_chitiettaisan WHERE IdPhieuGiaoViec = ?", idPhieuGiaoViec);
    }
}
