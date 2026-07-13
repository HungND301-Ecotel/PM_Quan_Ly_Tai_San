package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.BaoCaoKyThuatChiTiet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class BaoCaoKyThuatChiTietDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<BaoCaoKyThuatChiTiet> findByIdBaoCao(String idBaoCao) {
        String sql = """
            SELECT 
                ct.Id, ct.IdBaoCaoKyThuat, ct.IdTaiSan, ct.IdKeHoachChiTiet,
                ct.NgayTao, ct.NgayCapNhat, ct.NguoiTao, ct.NguoiCapNhat,
                ts.TenTaiSan, ts.DonViTinh, nts.TenNhom AS NhomTaiSan
            FROM baocaokythuat_chitiet ct
            LEFT JOIN TaiSan ts ON ct.IdTaiSan = ts.Id
            LEFT JOIN NhomTaiSan nts ON ts.IdNhomTaiSan = nts.Id
            WHERE ct.IdBaoCaoKyThuat = ?
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(BaoCaoKyThuatChiTiet.class), idBaoCao);
    }

    public void batchInsert(List<BaoCaoKyThuatChiTiet> details) {
        String sql = """
            INSERT INTO baocaokythuat_chitiet (
                Id, IdBaoCaoKyThuat, IdTaiSan, IdKeHoachChiTiet,
                NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;
        jdbcTemplate.batchUpdate(sql, details, 50, (ps, detail) -> {
            ps.setString(1, detail.getId());
            ps.setString(2, detail.getIdBaoCaoKyThuat());
            ps.setString(3, detail.getIdTaiSan());
            ps.setString(4, detail.getIdKeHoachChiTiet());
            ps.setString(5, detail.getNgayTao());
            ps.setString(6, detail.getNgayCapNhat());
            ps.setString(7, detail.getNguoiTao());
            ps.setString(8, detail.getNguoiCapNhat());
        });
    }

    public void deleteByIdBaoCao(String idBaoCao) {
        jdbcTemplate.update("DELETE FROM baocaokythuat_chitiet WHERE IdBaoCaoKyThuat = ?", idBaoCao);
    }

    public String generateNextId() {
        return java.util.UUID.randomUUID().toString();
    }
}
