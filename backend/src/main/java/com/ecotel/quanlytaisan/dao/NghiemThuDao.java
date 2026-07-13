package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.NghiemThu;
import com.ecotel.quanlytaisan.model.NghiemThuDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.List;


@Repository
public class NghiemThuDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String buildSelectSql() {
        return """
            SELECT
                n.Id,
                n.IdBienBan,
                n.DonViQuanLy,
                n.NoiDungSuaChua,
                n.KetQua,
                n.IdNguoiLap,
                nvLap.HoTen AS tenNguoiLap,
                n.NguoiLapXacNhan,
                n.IdGiamDoc,
                nvGD.HoTen AS tenGiamDoc,
                n.GiamDocXacNhan,
                n.Share,
                n.TrangThai,
                n.NgayTao,
                n.NgayCapNhat,
                n.NguoiTao,
                n.NguoiCapNhat,
                pb.TenPhongBan AS tenDonViQuanLy,
                bb.SoPhieu AS soPhieuBienBan,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM danhgia_vattu dvt
                        WHERE dvt.IdNghiemThu = n.Id
                    ) THEN 1 ELSE 0 
                END as daCoPhieuDanhGia
            FROM nghiemthu n
                LEFT JOIN NhanVien nvLap ON n.IdNguoiLap = nvLap.Id
                LEFT JOIN NhanVien nvGD ON n.IdGiamDoc = nvGD.Id
                LEFT JOIN phongban pb ON n.DonViQuanLy = pb.Id
                LEFT JOIN PhieuLinhVatTu bb ON n.IdBienBan = bb.Id
            """;
    }

    public List<NghiemThuDTO> findAll() {
        return jdbcTemplate.query(buildSelectSql() + " ORDER BY n.NgayTao DESC", new BeanPropertyRowMapper<>(NghiemThuDTO.class));
    }

    public NghiemThu findById(String id) {
        String sql = "SELECT * FROM nghiemthu WHERE Id = ?";
        List<NghiemThu> r = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(NghiemThu.class), id);
        return r.isEmpty() ? null : r.get(0);
    }

    public NghiemThuDTO findByIdDTO(String id) {
        String sql = buildSelectSql() + " WHERE n.Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(NghiemThuDTO.class), id);
        } catch (Exception e) { return null; }
    }

    public List<NghiemThuDTO> findByIdBienBan(String idBienBan) {
        String sql = buildSelectSql() + " WHERE n.IdBienBan = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(NghiemThuDTO.class), idBienBan);
    }

    public String generateNextId() {
        int currentYear = Year.now().getValue();
        String seqName = "NGHIEMTHU";
        String prefix = "NGHIEMTHU-" + currentYear + "-";
        try {
            var result = jdbcTemplate.queryForMap("SELECT SeqYear, SeqValue FROM Sequence WHERE SeqName = ?", seqName);
            int seqYear = ((Number) result.get("SeqYear")).intValue();
            if (seqYear != currentYear) {
                jdbcTemplate.update("UPDATE Sequence SET SeqYear = ?, SeqValue = 1 WHERE SeqName = ?", currentYear, seqName);
                return prefix + String.format("%04d", 1);
            }
        } catch (Exception e) {
            Integer maxSeq = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(Id, 9) AS UNSIGNED)), 0) FROM nghiemthu WHERE Id LIKE ?",
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

    public NghiemThu insert(NghiemThu n) {
        if (n.getId() == null || n.getId().isEmpty()) {
            n.setId(generateNextId());
        }
        String sql = """
            INSERT INTO nghiemthu (
                Id, IdBienBan, DonViQuanLy, NoiDungSuaChua, KetQua,
                IdNguoiLap, NguoiLapXacNhan, IdGiamDoc, GiamDocXacNhan, Share, TrangThai, 
                NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        if (n.getNgayTao() == null) n.setNgayTao(now);
        n.setNgayCapNhat(now);
        jdbcTemplate.update(sql,
            n.getId(), n.getIdBienBan(), n.getDonViQuanLy(), n.getNoiDungSuaChua(), n.getKetQua(),
            n.getIdNguoiLap(), n.getNguoiLapXacNhan(),
            n.getIdGiamDoc(), n.getGiamDocXacNhan(), n.getShare(), n.getTrangThai(),
            n.getNgayTao(), n.getNgayCapNhat(), n.getNguoiTao(), n.getNguoiCapNhat()
        );
        
        return n;
    }

    public NghiemThu update(NghiemThu n) {
        String sql = """
            UPDATE nghiemthu SET
                IdBienBan = ?, DonViQuanLy = ?, NoiDungSuaChua = ?, KetQua = ?,
                IdNguoiLap = ?, NguoiLapXacNhan = ?, IdGiamDoc = ?, GiamDocXacNhan = ?,
                Share = ?, TrangThai = ?, NgayCapNhat = ?, NguoiCapNhat = ?
            WHERE Id = ?
            """;
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        n.setNgayCapNhat(now);
        jdbcTemplate.update(sql,
            n.getIdBienBan(), n.getDonViQuanLy(), n.getNoiDungSuaChua(), n.getKetQua(),
            n.getIdNguoiLap(), n.getNguoiLapXacNhan(), n.getIdGiamDoc(), n.getGiamDocXacNhan(),
            n.getShare(), n.getTrangThai(), n.getNgayCapNhat(), n.getNguoiCapNhat(), n.getId()
        );
        return n;
    }

    public void delete(String id) {
        jdbcTemplate.update("DELETE FROM nghiemthu WHERE Id = ?", id);
    }
    public int updateGhiChu(String id, String ghiChuBienBan) {
        String now = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        return jdbcTemplate.update("UPDATE nghiemthu SET GhiChuBienBan = ?, NgayCapNhat = ? WHERE Id = ?", ghiChuBienBan, now, id);
    }
}
