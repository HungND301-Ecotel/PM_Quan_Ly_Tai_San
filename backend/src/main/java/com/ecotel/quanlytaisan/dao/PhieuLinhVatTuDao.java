package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.PhieuLinhVatTu;
import com.ecotel.quanlytaisan.model.PhieuLinhVatTuDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Repository
public class PhieuLinhVatTuDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    private String buildSelectSql() {
        return """
            SELECT
                p.Id,
                p.IdPhieuGiaoViec,
                p.SoPhieu,
                p.SoQuyetDinh,
                p.DonViDeNghi,
                p.MucDichSuDung,
                p.GhiChu,
                p.IdNguoiLap,
                nvLap.HoTen AS tenNguoiLap,
                p.NguoiLapXacNhan,
                p.IdGiamDoc,
                nvGD.HoTen AS tenGiamDoc,
                p.GiamDocXacNhan,
                p.Share,
                p.TrangThai,
                p.NgayTao,
                p.NgayCapNhat,
                p.NguoiTao,
                p.NguoiCapNhat,
                pb.TenPhongBan AS tenDonViDeNghi,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM nghiemthu nt
                        WHERE nt.IdBienBan = p.Id
                    ) THEN 1 ELSE 0 
                END as daCoNghiemThu
            FROM PhieuLinhVatTu p
                LEFT JOIN NhanVien nvLap ON p.IdNguoiLap = nvLap.Id
                LEFT JOIN NhanVien nvGD ON p.IdGiamDoc = nvGD.Id
                LEFT JOIN phongban pb ON p.DonViDeNghi = pb.Id
            """;
    }

    public List<PhieuLinhVatTuDTO> findAll() {
        return jdbcTemplate.query(buildSelectSql() + " ORDER BY p.NgayTao DESC", new BeanPropertyRowMapper<>(PhieuLinhVatTuDTO.class));
    }

    public PhieuLinhVatTu findById(String id) {
        String sql = "SELECT * FROM PhieuLinhVatTu WHERE Id = ?";
        List<PhieuLinhVatTu> r = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(PhieuLinhVatTu.class), id);
        return r.isEmpty() ? null : r.get(0);
    }

    public PhieuLinhVatTuDTO findByIdDTO(String id) {
        String sql = buildSelectSql() + " WHERE p.Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(PhieuLinhVatTuDTO.class), id);
        } catch (Exception e) { return null; }
    }

    public List<PhieuLinhVatTuDTO> findByIdPhieuGiaoViec(String idPhieuGiaoViec) {
        String sql = buildSelectSql() + " WHERE p.IdPhieuGiaoViec = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(PhieuLinhVatTuDTO.class), idPhieuGiaoViec);
    }

    public String generateNextId() {
        int currentYear = Year.now().getValue();
        String seqName = "PHIEULINHVATTU";
        String prefix = "PLVT-" + currentYear + "-";
        try {
            var result = jdbcTemplate.queryForMap("SELECT SeqYear, SeqValue FROM Sequence WHERE SeqName = ?", seqName);
            int seqYear = ((Number) result.get("SeqYear")).intValue();
            if (seqYear != currentYear) {
                jdbcTemplate.update("UPDATE Sequence SET SeqYear = ?, SeqValue = 1 WHERE SeqName = ?", currentYear, seqName);
                return prefix + String.format("%04d", 1);
            }
        } catch (Exception e) {
            Integer maxSeq = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(Id, 11) AS UNSIGNED)), 0) FROM PhieuLinhVatTu WHERE Id LIKE ?",
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

    public PhieuLinhVatTu insert(PhieuLinhVatTu p) {
        if (p.getId() == null || p.getId().isEmpty()) {
            p.setId(generateNextId());
        }
        String sql = """
            INSERT INTO PhieuLinhVatTu (
                Id, IdPhieuGiaoViec, SoPhieu, SoQuyetDinh, DonViDeNghi, 
                MucDichSuDung, GhiChu, IdNguoiLap, NguoiLapXacNhan, 
                IdGiamDoc, GiamDocXacNhan, Share, TrangThai, 
                NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        if (p.getNgayTao() == null) p.setNgayTao(now);
        p.setNgayCapNhat(now);
        jdbcTemplate.update(sql,
            p.getId(), p.getIdPhieuGiaoViec(), p.getSoPhieu(), p.getSoQuyetDinh(), p.getDonViDeNghi(),
            p.getMucDichSuDung(), p.getGhiChu(), p.getIdNguoiLap(), p.getNguoiLapXacNhan(),
            p.getIdGiamDoc(), p.getGiamDocXacNhan(), p.getShare(), p.getTrangThai(),
            p.getNgayTao(), p.getNgayCapNhat(), p.getNguoiTao(), p.getNguoiCapNhat()
        );
        
        return p;
    }

    public PhieuLinhVatTu update(PhieuLinhVatTu p) {
        String sql = """
            UPDATE PhieuLinhVatTu SET
                IdPhieuGiaoViec = ?, SoPhieu = ?, SoQuyetDinh = ?, DonViDeNghi = ?, 
                MucDichSuDung = ?, GhiChu = ?, IdNguoiLap = ?, NguoiLapXacNhan = ?, 
                IdGiamDoc = ?, GiamDocXacNhan = ?, Share = ?, TrangThai = ?, 
                NgayCapNhat = ?, NguoiCapNhat = ?
            WHERE Id = ?
            """;
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        p.setNgayCapNhat(now);
        jdbcTemplate.update(sql,
            p.getIdPhieuGiaoViec(), p.getSoPhieu(), p.getSoQuyetDinh(), p.getDonViDeNghi(),
            p.getMucDichSuDung(), p.getGhiChu(), p.getIdNguoiLap(), p.getNguoiLapXacNhan(),
            p.getIdGiamDoc(), p.getGiamDocXacNhan(), p.getShare(), p.getTrangThai(),
            p.getNgayCapNhat(), p.getNguoiCapNhat(), p.getId()
        );
        return p;
    }

    public void delete(String id) {
        jdbcTemplate.update("DELETE FROM PhieuLinhVatTu WHERE Id = ?", id);
    }
    public int updateGhiChu(String id, String ghiChuBienBan) {
        String now = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        return jdbcTemplate.update("UPDATE PhieuLinhVatTu SET GhiChuBienBan = ?, NgayCapNhat = ? WHERE Id = ?", ghiChuBienBan, now, id);
    }
}
