package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.PhieuGiaoViec;
import com.ecotel.quanlytaisan.model.PhieuGiaoViecDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Repository
public class PhieuGiaoViecDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    private String buildSelectSql() {
        return """
            SELECT
                p.Id,
                p.IdSuaChua,
                p.SoPhieu,
                p.DonViQuanLy,
                p.CaBatDau,
                p.NgayBatDau,
                p.CaDuKien,
                p.NgayDuKien,
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
                pb.TenPhongBan AS tenDonViQuanLy,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM PhieuLinhVatTu plv
                        WHERE plv.IdPhieuGiaoViec = p.Id
                    ) THEN 1 ELSE 0 
                END as daCoPhieuLinhVatTu
            FROM phieugiaoviec p
                LEFT JOIN NhanVien nvLap ON p.IdNguoiLap = nvLap.Id
                LEFT JOIN NhanVien nvGD ON p.IdGiamDoc = nvGD.Id
                LEFT JOIN phongban pb ON p.DonViQuanLy = pb.Id
            """;
    }

    public List<PhieuGiaoViecDTO> findAll() {
        return jdbcTemplate.query(buildSelectSql() + " ORDER BY p.NgayTao DESC", new BeanPropertyRowMapper<>(PhieuGiaoViecDTO.class));
    }

    public PhieuGiaoViec findById(String id) {
        String sql = "SELECT * FROM phieugiaoviec WHERE Id = ?";
        List<PhieuGiaoViec> r = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(PhieuGiaoViec.class), id);
        return r.isEmpty() ? null : r.get(0);
    }

    public PhieuGiaoViecDTO findByIdDTO(String id) {
        String sql = buildSelectSql() + " WHERE p.Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(PhieuGiaoViecDTO.class), id);
        } catch (Exception e) { return null; }
    }

    public List<PhieuGiaoViecDTO> findByIdSuaChua(String idSuaChua) {
        String sql = buildSelectSql() + " WHERE p.IdSuaChua = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(PhieuGiaoViecDTO.class), idSuaChua);
    }

    public String generateNextId() {
        int currentYear = Year.now().getValue();
        String seqName = "PHIEUGIAOVIEC";
        String prefix = "PGV-" + currentYear + "-";
        try {
            var result = jdbcTemplate.queryForMap("SELECT SeqYear, SeqValue FROM Sequence WHERE SeqName = ?", seqName);
            int seqYear = ((Number) result.get("SeqYear")).intValue();
            if (seqYear != currentYear) {
                jdbcTemplate.update("UPDATE Sequence SET SeqYear = ?, SeqValue = 1 WHERE SeqName = ?", currentYear, seqName);
                return prefix + String.format("%04d", 1);
            }
        } catch (Exception e) {
            Integer maxSeq = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(Id, 10) AS UNSIGNED)), 0) FROM phieugiaoviec WHERE Id LIKE ?",
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

    public PhieuGiaoViec insert(PhieuGiaoViec e) {
        e.setId(generateNextId());
        String sql = """
            INSERT INTO phieugiaoviec (
                Id, IdSuaChua, SoPhieu, DonViQuanLy, CaBatDau, NgayBatDau, CaDuKien, NgayDuKien,
                IdNguoiLap, NguoiLapXacNhan, IdGiamDoc, GiamDocXacNhan,
                Share, TrangThai, NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        int r = jdbcTemplate.update(sql,
                e.getId(), e.getIdSuaChua(), e.getSoPhieu(), e.getDonViQuanLy(), e.getCaBatDau(), e.getNgayBatDau(), e.getCaDuKien(), e.getNgayDuKien(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai() != null ? e.getTrangThai() : 0, 
                e.getNgayTao(), e.getNgayCapNhat(), e.getNguoiTao(), e.getNguoiCapNhat()
        );
        if (r > 0) return findById(e.getId());
        return null;
    }

    public PhieuGiaoViec update(PhieuGiaoViec e) {
        String sql = """
            UPDATE phieugiaoviec SET
                IdSuaChua = ?, SoPhieu = ?, DonViQuanLy = ?, CaBatDau = ?, NgayBatDau = ?, CaDuKien = ?, NgayDuKien = ?,
                IdNguoiLap = ?, NguoiLapXacNhan = ?, IdGiamDoc = ?, GiamDocXacNhan = ?,
                Share = ?, TrangThai = ?, NgayCapNhat = ?, NguoiCapNhat = ?
            WHERE Id = ?
            """;
        int r = jdbcTemplate.update(sql,
                e.getIdSuaChua(), e.getSoPhieu(), e.getDonViQuanLy(), e.getCaBatDau(), e.getNgayBatDau(), e.getCaDuKien(), e.getNgayDuKien(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai(), e.getNgayCapNhat(), e.getNguoiCapNhat(),
                e.getId()
        );
        if (r > 0) return findById(e.getId());
        return null;
    }

    public int updateTrangThai(String id, Integer trangThai) {
        return jdbcTemplate.update("UPDATE phieugiaoviec SET TrangThai = ? WHERE Id = ?", trangThai, id);
    }

    public int huyPhieu(String id) {
        final int STATUS_CANCELLED = 0;
        int r = jdbcTemplate.update(
                "UPDATE phieugiaoviec SET TrangThai = ?, Share = 0, NgayCapNhat = ? WHERE Id = ?",
                STATUS_CANCELLED, LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), id);
        if (r > 0) {
            kyTaiLieuDao.delete(id);
        }
        return r;
    }

    public int delete(String id) {
        return jdbcTemplate.update("DELETE FROM phieugiaoviec WHERE Id = ?", id);
    }

    public void batchDelete(List<String> ids) {
        jdbcTemplate.batchUpdate("DELETE FROM phieugiaoviec WHERE Id = ?", ids, 50, (ps, id) -> ps.setString(1, id));
    }
    public int updateGhiChu(String id, String ghiChuBienBan) {
        String now = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        return jdbcTemplate.update("UPDATE phieugiaoviec SET GhiChuBienBan = ?, NgayCapNhat = ? WHERE Id = ?", ghiChuBienBan, now, id);
    }
}
