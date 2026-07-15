package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.QuyetToan;
import com.ecotel.quanlytaisan.model.QuyetToanChiTiet;
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
public class QuyetToanDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    public List<QuyetToan> findAll() {
        String sql = """
            SELECT qt.*, 
                   nvLap.HoTen as tenNguoiLap, 
                   nvGD.HoTen as tenGiamDoc,
                   pb.TenPhongBan as tenDonVi,
                   lsc.Ten as tenCapSuaChua,
                   CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM danhgia_vattu dgvt
                            WHERE qt.IdDanhGia = dgvt.Id
                        ) THEN 1 ELSE 0 
                    END as daCoQuyetToan
            FROM quyettoan qt
            LEFT JOIN NhanVien nvLap ON qt.IdNguoiLap = nvLap.Id
            LEFT JOIN NhanVien nvGD ON qt.IdGiamDoc = nvGD.Id
            LEFT JOIN PhongBan pb ON qt.ThuocDonVi = pb.Id
            LEFT JOIN LoaiSCBD lsc ON qt.CapSuaChua = lsc.Id
            ORDER BY qt.NgayTao DESC
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(QuyetToan.class));
    }

    public QuyetToan findById(String id) {
        String sql = """
            SELECT qt.*, 
                   nvLap.HoTen as tenNguoiLap, 
                   nvGD.HoTen as tenGiamDoc,
                   pb.TenPhongBan as tenDonVi,
                   lsc.Ten as tenCapSuaChua
            FROM quyettoan qt
            LEFT JOIN NhanVien nvLap ON qt.IdNguoiLap = nvLap.Id
            LEFT JOIN NhanVien nvGD ON qt.IdGiamDoc = nvGD.Id
            LEFT JOIN PhongBan pb ON qt.ThuocDonVi = pb.Id
            LEFT JOIN LoaiSCBD lsc ON qt.CapSuaChua = lsc.Id
            WHERE qt.Id = ?
            """;
        List<QuyetToan> list = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(QuyetToan.class), id);
        return list.isEmpty() ? null : list.get(0);
    }

    public List<QuyetToan> findByIdDanhGia(String idDanhGia) {
        String sql = """
            SELECT qt.*, 
                   nvLap.HoTen as tenNguoiLap, 
                   nvGD.HoTen as tenGiamDoc,
                   pb.TenPhongBan as tenDonVi,
                   lsc.Ten as tenCapSuaChua
            FROM quyettoan qt
            LEFT JOIN NhanVien nvLap ON qt.IdNguoiLap = nvLap.Id
            LEFT JOIN NhanVien nvGD ON qt.IdGiamDoc = nvGD.Id
            LEFT JOIN PhongBan pb ON qt.ThuocDonVi = pb.Id
            LEFT JOIN LoaiSCBD lsc ON qt.CapSuaChua = lsc.Id
            WHERE qt.IdDanhGia = ?
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(QuyetToan.class), idDanhGia);
    }

    public List<QuyetToanChiTiet> findDetailsByParentId(String idQuyetToan) {
        String sql = """
            SELECT ct.*
            FROM quyettoan_chitiet ct
            WHERE ct.IdQuyetToan = ?
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(QuyetToanChiTiet.class), idQuyetToan);
    }

    public String generateNextId() {
        int currentYear = Year.now().getValue();
        String seqName = "QUYETTOAN";
        String prefix = "QT-" + currentYear + "-";
        try {
            var result = jdbcTemplate.queryForMap("SELECT SeqYear, SeqValue FROM Sequence WHERE SeqName = ?", seqName);
            int seqYear = ((Number) result.get("SeqYear")).intValue();
            if (seqYear != currentYear) {
                jdbcTemplate.update("UPDATE Sequence SET SeqYear = ?, SeqValue = 1 WHERE SeqName = ?", currentYear, seqName);
                return prefix + String.format("%04d", 1);
            }
        } catch (Exception e) {
            Integer maxSeq = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(Id, 9) AS UNSIGNED)), 0) FROM quyettoan WHERE Id LIKE ?",
                    Integer.class, prefix + "%");
            int init = maxSeq == null ? 0 : maxSeq;
            jdbcTemplate.update(
                    "INSERT INTO Sequence (SeqName, SeqYear, SeqValue) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE SeqValue = GREATEST(SeqValue, ?)",
                    seqName, currentYear, init, init);
        }
        jdbcTemplate.update("UPDATE Sequence SET SeqValue = SeqValue + 1 WHERE SeqName = ? AND SeqYear = ?", seqName, currentYear);
        Integer next = jdbcTemplate.queryForObject("SELECT SeqValue FROM Sequence WHERE SeqName = ?", Integer.class, seqName);
        return prefix + String.format("%04d", next);
    }

    public QuyetToan insert(QuyetToan e) {
        if (e.getId() == null) e.setId(generateNextId());
        String sql = """
            INSERT INTO quyettoan (
                Id, IdDanhGia, TenTaiSan, ThuocDonVi, DiaDiemSuaChua, CapSuaChua,
                SoPhieuGiaoViec, NgayNghiemThu, SoPhieuVatTu, NgayLinhVatTu,
                IdNguoiLap, NguoiLapXacNhan, IdGiamDoc, GiamDocXacNhan,
                Share, TrangThai, NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat,
                GhiChuBienBan, CongTy, TenMauBienBan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        jdbcTemplate.update(sql,
                e.getId(), e.getIdDanhGia(), e.getTenTaiSan(), e.getThuocDonVi(), e.getDiaDiemSuaChua(), e.getCapSuaChua(),
                e.getSoPhieuGiaoViec(), e.getNgayNghiemThu(), e.getSoPhieuVatTu(), e.getNgayLinhVatTu(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai(), e.getNgayTao(), e.getNgayCapNhat(), e.getNguoiTao(), e.getNguoiCapNhat(),
                e.getGhiChuBienBan(), e.getCongTy(), e.getTenMauBienBan()
        );
        return e;
    }

    public QuyetToan update(QuyetToan e) {
        String sql = """
            UPDATE quyettoan SET
                IdDanhGia = ?, TenTaiSan = ?, ThuocDonVi = ?, DiaDiemSuaChua = ?, CapSuaChua = ?,
                SoPhieuGiaoViec = ?, NgayNghiemThu = ?, SoPhieuVatTu = ?, NgayLinhVatTu = ?,
                IdNguoiLap = ?, NguoiLapXacNhan = ?, IdGiamDoc = ?, GiamDocXacNhan = ?,
                Share = ?, TrangThai = ?, NgayCapNhat = ?, NguoiCapNhat = ?,
                GhiChuBienBan = ?, CongTy = ?, TenMauBienBan = ?
            WHERE Id = ?
            """;
        jdbcTemplate.update(sql,
                e.getIdDanhGia(), e.getTenTaiSan(), e.getThuocDonVi(), e.getDiaDiemSuaChua(), e.getCapSuaChua(),
                e.getSoPhieuGiaoViec(), e.getNgayNghiemThu(), e.getSoPhieuVatTu(), e.getNgayLinhVatTu(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai(), e.getNgayCapNhat(), e.getNguoiCapNhat(),
                e.getGhiChuBienBan(), e.getCongTy(), e.getTenMauBienBan(),
                e.getId()
        );
        return e;
    }

    public void insertDetails(List<QuyetToanChiTiet> list, String parentId) {
        String sql = "INSERT INTO quyettoan_chitiet (Id, IdQuyetToan, IdVatTu, IdChiTietVatTu, TenVatTu, SoLuong, DonGia, ThanhTien, GhiChu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                QuyetToanChiTiet item = list.get(i);
                ps.setString(1, UUID.randomUUID().toString());
                ps.setString(2, parentId);
                ps.setString(3, item.getIdVatTu());
                ps.setString(4, item.getIdChiTietVatTu());
                ps.setString(5, item.getTenVatTu());
                ps.setObject(6, item.getSoLuong());
                ps.setObject(7, item.getDonGia());
                ps.setObject(8, item.getThanhTien());
                ps.setString(9, item.getGhiChu());
            }
            @Override
            public int getBatchSize() { return list.size(); }
        });
    }

    public void deleteDetailsByParentId(String parentId) {
        jdbcTemplate.update("DELETE FROM quyettoan_chitiet WHERE IdQuyetToan = ?", parentId);
    }

    public int updateTrangThai(String id, Integer trangThai) {
        return jdbcTemplate.update("UPDATE quyettoan SET TrangThai = ? WHERE Id = ?", trangThai, id);
    }

    public int huy(String id) {
        final int STATUS_CANCELLED = 0;
        int r = jdbcTemplate.update(
                "UPDATE quyettoan SET TrangThai = ?, Share = 0, NgayCapNhat = ? WHERE Id = ?",
                STATUS_CANCELLED, LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), id);
        if (r > 0) {
            kyTaiLieuDao.delete(id);
        }
        return r;
    }

    public int delete(String id) {
        deleteDetailsByParentId(id);
        return jdbcTemplate.update("DELETE FROM quyettoan WHERE Id = ?", id);
    }
    
    public int updateGhiChu(String id, String ghiChuBienBan) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        return jdbcTemplate.update("UPDATE quyettoan SET GhiChuBienBan = ?, NgayCapNhat = ? WHERE Id = ?", ghiChuBienBan, now, id);
    }
}
