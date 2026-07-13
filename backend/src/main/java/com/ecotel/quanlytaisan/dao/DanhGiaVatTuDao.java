package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.DanhGiaVatTu;
import com.ecotel.quanlytaisan.model.DanhGiaVatTuChiTiet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Repository
public class DanhGiaVatTuDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    public List<DanhGiaVatTu> findAll() {
        String sql = """
            SELECT dvt.*, 
                   nvLap.HoTen as tenNguoiLap, 
                   nvGD.HoTen as tenGiamDoc,
                   pb.TenPhongBan as tenDonViDanhGia
            FROM danhgia_vattu dvt
            LEFT JOIN NhanVien nvLap ON dvt.IdNguoiLap = nvLap.Id
            LEFT JOIN NhanVien nvGD ON dvt.IdGiamDoc = nvGD.Id
            LEFT JOIN PhongBan pb ON dvt.IdDonViDanhGia = pb.Id
            ORDER BY dvt.NgayTao DESC
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(DanhGiaVatTu.class));
    }

    public DanhGiaVatTu findById(String id) {
        String sql = """
            SELECT dvt.*, 
                   nvLap.HoTen as tenNguoiLap, 
                   nvGD.HoTen as tenGiamDoc,
                   pb.TenPhongBan as tenDonViDanhGia
            FROM danhgia_vattu dvt
            LEFT JOIN NhanVien nvLap ON dvt.IdNguoiLap = nvLap.Id
            LEFT JOIN NhanVien nvGD ON dvt.IdGiamDoc = nvGD.Id
            LEFT JOIN PhongBan pb ON dvt.IdDonViDanhGia = pb.Id
            WHERE dvt.Id = ?
            """;
        List<DanhGiaVatTu> list = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(DanhGiaVatTu.class), id);
        return list.isEmpty() ? null : list.get(0);
    }

    public List<DanhGiaVatTu> findByIdNghiemThu(String idNghiemThu) {
        String sql = """
            SELECT dvt.*, 
                   nvLap.HoTen as tenNguoiLap, 
                   nvGD.HoTen as tenGiamDoc,
                   pb.TenPhongBan as tenDonViDanhGia
            FROM danhgia_vattu dvt
            LEFT JOIN NhanVien nvLap ON dvt.IdNguoiLap = nvLap.Id
            LEFT JOIN NhanVien nvGD ON dvt.IdGiamDoc = nvGD.Id
            LEFT JOIN PhongBan pb ON dvt.IdDonViDanhGia = pb.Id
            WHERE dvt.IdNghiemThu = ?
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(DanhGiaVatTu.class), idNghiemThu);
    }

    public List<DanhGiaVatTuChiTiet> findDetailsByParentId(String idDanhGia) {
        String sql = """
            SELECT ct.*
            FROM danhgia_vattu_chitiet ct
            WHERE ct.IdDanhGia = ?
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(DanhGiaVatTuChiTiet.class), idDanhGia);
    }

    public String generateNextId() {
        int currentYear = Year.now().getValue();
        String seqName = "DANHGIA_VATTU";
        String prefix = "DGVT-" + currentYear + "-";
        try {
            jdbcTemplate.update("UPDATE Sequence SET SeqValue = SeqValue + 1 WHERE SeqName = ? AND SeqYear = ?", seqName, currentYear);
            Integer next = jdbcTemplate.queryForObject("SELECT SeqValue FROM Sequence WHERE SeqName = ?", Integer.class, seqName);
            return prefix + String.format("%04d", next);
        } catch (Exception e) {
            return "DGVT-" + UUID.randomUUID().toString().substring(0, 8);
        }
    }

    public DanhGiaVatTu insert(DanhGiaVatTu e) {
        if (e.getId() == null) e.setId(generateNextId());
        String sql = """
            INSERT INTO danhgia_vattu (
                Id, IdNghiemThu, QuyetDinhSo, CanCuHoSo, NgayDanhGia, DiaDiem, IdDonViDanhGia,
                IdNguoiLap, NguoiLapXacNhan, IdGiamDoc, GiamDocXacNhan,
                Share, TrangThai, NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        jdbcTemplate.update(sql,
                e.getId(), e.getIdNghiemThu(), e.getQuyetDinhSo(), e.getCanCuHoSo(), e.getNgayDanhGia(), e.getDiaDiem(), e.getIdDonViDanhGia(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai(), e.getNgayTao(), e.getNgayCapNhat(), e.getNguoiTao(), e.getNguoiCapNhat()
        );
        return e;
    }

    public DanhGiaVatTu update(DanhGiaVatTu e) {
        String sql = """
            UPDATE danhgia_vattu SET
                IdNghiemThu = ?, QuyetDinhSo = ?, CanCuHoSo = ?, NgayDanhGia = ?, DiaDiem = ?, IdDonViDanhGia = ?,
                IdNguoiLap = ?, NguoiLapXacNhan = ?, IdGiamDoc = ?, GiamDocXacNhan = ?,
                Share = ?, TrangThai = ?, NgayCapNhat = ?, NguoiCapNhat = ?
            WHERE Id = ?
            """;
        jdbcTemplate.update(sql,
                e.getIdNghiemThu(), e.getQuyetDinhSo(), e.getCanCuHoSo(), e.getNgayDanhGia(), e.getDiaDiem(), e.getIdDonViDanhGia(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai(), e.getNgayCapNhat(), e.getNguoiCapNhat(),
                e.getId()
        );
        return e;
    }

    public void insertDetails(List<DanhGiaVatTuChiTiet> list, String parentId) {
        String sql = "INSERT INTO danhgia_vattu_chitiet (Id, IdDanhGia, IdVatTu, IdChiTietVatTu, TenVatTu, DonViTinh, SoLuong, KhoiLuong, ChatLuongConLai, DonGia, GiaTriConLai, GhiChu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                DanhGiaVatTuChiTiet item = list.get(i);
                ps.setString(1, UUID.randomUUID().toString());
                ps.setString(2, parentId);
                ps.setString(3, item.getIdVatTu());
                ps.setString(4, item.getIdChiTietVatTu());
                ps.setString(5, item.getTenVatTu());
                ps.setString(6, item.getDonViTinh());
                ps.setObject(7, item.getSoLuong());
                ps.setObject(8, item.getKhoiLuong());
                ps.setObject(9, item.getChatLuongConLai());
                ps.setObject(10, item.getDonGia());
                ps.setObject(11, item.getGiaTriConLai());
                ps.setString(12, item.getGhiChu());
            }
            @Override
            public int getBatchSize() { return list.size(); }
        });
    }

    public void deleteDetailsByParentId(String parentId) {
        jdbcTemplate.update("DELETE FROM danhgia_vattu_chitiet WHERE IdDanhGia = ?", parentId);
    }

    public int updateTrangThai(String id, Integer trangThai) {
        return jdbcTemplate.update("UPDATE danhgia_vattu SET TrangThai = ? WHERE Id = ?", trangThai, id);
    }

    public int huy(String id) {
        final int STATUS_CANCELLED = 0;
        int r = jdbcTemplate.update(
                "UPDATE danhgia_vattu SET TrangThai = ?, Share = 0, NgayCapNhat = ? WHERE Id = ?",
                STATUS_CANCELLED, LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), id);
        if (r > 0) {
            kyTaiLieuDao.delete(id);
        }
        return r;
    }

    public int delete(String id) {
        deleteDetailsByParentId(id);
        return jdbcTemplate.update("DELETE FROM danhgia_vattu WHERE Id = ?", id);
    }
    public int updateGhiChu(String id, String ghiChuBienBan) {
        String now = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        return jdbcTemplate.update("UPDATE danhgia_vattu SET GhiChuBienBan = ?, NgayCapNhat = ? WHERE Id = ?", ghiChuBienBan, now, id);
    }
}
