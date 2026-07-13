package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.KiemTraSuCo;
import com.ecotel.quanlytaisan.model.KiemTraSuCoDTO;
import com.ecotel.quanlytaisan.model.NguoiKy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Year;
import java.util.List;
import java.util.Objects;

@Repository
public class KiemTraSuCoDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    private String buildSelectSql() {
        return """
            SELECT
                kt.Id, kt.IdCongTy, kt.CongTy, kt.TenMauBienBan, kt.IdSuCo, kt.SoPhieu, kt.NgayKiemTra, kt.ViTri,
                kt.NhanXetKetLuan, kt.BienPhapXuLy, kt.GhiChuBienBan, kt.IdNguoiLap, kt.NguoiLapXacNhan,
                kt.IdGiamDoc, kt.GiamDocXacNhan, kt.Share, kt.TrangThai,
                kt.NgayTao, kt.NgayCapNhat, kt.NguoiTao, kt.NguoiCapNhat,
                sc.SoPhieu AS soPhieuSuCo,
                nvLap.HoTen AS tenNguoiLap, nvGD.HoTen AS tenGiamDoc,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM giamdinh gd
                        WHERE gd.IdBienBan = kt.Id AND gd.LoaiBienBan = 'su_co'
                    ) THEN 1 ELSE 0 
                END as daCoSuCo
            FROM kiemtra_suco kt
                LEFT JOIN suco_thietbi sc ON kt.IdSuCo = sc.Id
                LEFT JOIN NhanVien nvLap ON kt.IdNguoiLap = nvLap.Id
                LEFT JOIN NhanVien nvGD ON kt.IdGiamDoc = nvGD.Id
            """;
    }

    public List<KiemTraSuCoDTO> findAll(String idCongTy) {
        String sql = buildSelectSql() + (idCongTy != null ? " WHERE kt.IdCongTy = ?" : "");
        if (idCongTy != null) {
            return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(KiemTraSuCoDTO.class), idCongTy);
        }
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(KiemTraSuCoDTO.class));
    }

    public KiemTraSuCo findById(String id) {
        String sql = "SELECT * FROM kiemtra_suco WHERE Id = ?";
        List<KiemTraSuCo> r = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(KiemTraSuCo.class), id);
        return r.isEmpty() ? null : r.get(0);
    }

    public KiemTraSuCoDTO findByIdDTO(String id) {
        String sql = buildSelectSql() + " WHERE kt.Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(KiemTraSuCoDTO.class), id);
        } catch (Exception e) { return null; }
    }

    public List<KiemTraSuCoDTO> findByIdSuCo(String idSuCo) {
        String sql = buildSelectSql() + " WHERE kt.IdSuCo = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(KiemTraSuCoDTO.class), idSuCo);
    }

    public String generateNextId() {
        int currentYear = Year.now().getValue();
        String seqName = "KIEMTRA_SUCO";
        String prefix = "BBKTSC-" + currentYear + "-";
        try {
            var result = jdbcTemplate.queryForMap("SELECT SeqYear, SeqValue FROM Sequence WHERE SeqName = ?", seqName);
            int seqYear = ((Number) result.get("SeqYear")).intValue();
            if (seqYear != currentYear) {
                jdbcTemplate.update("UPDATE Sequence SET SeqYear = ?, SeqValue = 1 WHERE SeqName = ?", currentYear, seqName);
                return prefix + String.format("%04d", 1);
            }
        } catch (Exception e) {
            Integer maxSeq = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(Id, 13) AS UNSIGNED)), 0) FROM kiemtra_suco WHERE Id LIKE ?",
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

    public KiemTraSuCo insert(KiemTraSuCo e) {
        if (e.getId() == null || e.getId().isEmpty()) {
            e.setId(generateNextId());
        }
        String sql = """
            INSERT INTO kiemtra_suco (
                Id, IdCongTy, CongTy, TenMauBienBan, IdSuCo, SoPhieu, NgayKiemTra, ViTri,
                NhanXetKetLuan, BienPhapXuLy, IdNguoiLap, NguoiLapXacNhan,
                IdGiamDoc, GiamDocXacNhan, Share, TrangThai,
                NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, GhiChuBienBan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        
        String now = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String ngayTao = e.getNgayTao() != null ? e.getNgayTao() : now;
        String ngayCapNhat = e.getNgayCapNhat() != null ? e.getNgayCapNhat() : now;

        int r = jdbcTemplate.update(sql,
                e.getId(), e.getIdCongTy(), e.getCongTy(), e.getTenMauBienBan(), e.getIdSuCo(), e.getSoPhieu(), e.getNgayKiemTra(), e.getViTri(),
                e.getNhanXetKetLuan(), e.getBienPhapXuLy(), e.getIdNguoiLap(), e.getNguoiLapXacNhan(),
                e.getIdGiamDoc(), e.getGiamDocXacNhan(), e.getShare(), e.getTrangThai() != null ? e.getTrangThai() : 0,
                ngayTao, ngayCapNhat, e.getNguoiTao(), e.getNguoiCapNhat(), e.getGhiChuBienBan()
        );
        if (r > 0) return findById(e.getId());
        return null;
    }

    public KiemTraSuCo update(KiemTraSuCo e) {
        String sql = """
            UPDATE kiemtra_suco SET
                CongTy = ?, TenMauBienBan = ?, IdSuCo = ?, SoPhieu = ?, NgayKiemTra = ?, ViTri = ?,
                NhanXetKetLuan = ?, BienPhapXuLy = ?, IdNguoiLap = ?, NguoiLapXacNhan = ?,
                IdGiamDoc = ?, GiamDocXacNhan = ?, Share = ?, TrangThai = ?,
                NgayCapNhat = ?, NguoiCapNhat = ?, GhiChuBienBan = ?
            WHERE Id = ?
            """;
        
        String now = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String ngayCapNhat = e.getNgayCapNhat() != null ? e.getNgayCapNhat() : now;

        int r = jdbcTemplate.update(sql,
                e.getCongTy(), e.getTenMauBienBan(), e.getIdSuCo(), e.getSoPhieu(), e.getNgayKiemTra(), e.getViTri(),
                e.getNhanXetKetLuan(), e.getBienPhapXuLy(), e.getIdNguoiLap(), e.getNguoiLapXacNhan(),
                e.getIdGiamDoc(), e.getGiamDocXacNhan(), e.getShare(), e.getTrangThai(),
                ngayCapNhat, e.getNguoiCapNhat(), e.getGhiChuBienBan(), e.getId()
        );
        if (r > 0) return findById(e.getId());
        return null;
    }

    public boolean checkAllOtherNguoiKy(String idTaiLieu) {
        List<NguoiKy> nguoiKyList = kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(idTaiLieu);
        if (nguoiKyList == null || nguoiKyList.isEmpty()) return true;
        for (NguoiKy nguoiKy : nguoiKyList) {
            if (nguoiKy.getTrangThai() != 1) return false;
        }
        return true;
    }

    public int updateTrangThaiKy(String id, String userId) {
        NguoiKy nguoiKy = kyTaiLieuDao.getNguoiKy(userId, id);
        if (nguoiKy != null) {
            nguoiKy.setTrangThai(1);
            return kyTaiLieuDao.updateTrangThai(nguoiKy.getId(), "1");
        }
        return 0;
    }

    public int updateTrangThai(String id, String userId) {
        KiemTraSuCo sc = findById(id);
        if (sc == null) return 0;
        
        int trangThai = sc.getTrangThai() != null ? sc.getTrangThai() : 0;

        int status = updateTrangThaiKy(id, userId);
        if (status == 1) {
            trangThai = 1;
        }

        if (Objects.equals(userId, sc.getIdNguoiLap())) {
            sc.setNguoiLapXacNhan(true);
            trangThai = 1;
        }

        if (Objects.equals(userId, sc.getIdGiamDoc())) {
            sc.setGiamDocXacNhan(true);
            trangThai = 1;
        }

        boolean allKy = true;
        if (sc.getIdNguoiLap() != null && !sc.getIdNguoiLap().isEmpty()) {
            allKy = allKy && Boolean.TRUE.equals(sc.getNguoiLapXacNhan());
        }
        if (sc.getIdGiamDoc() != null && !sc.getIdGiamDoc().isEmpty()) {
            allKy = allKy && Boolean.TRUE.equals(sc.getGiamDocXacNhan());
        }

        if (allKy) {
            allKy = checkAllOtherNguoiKy(id);
        }

        if (allKy) {
            trangThai = 3;
        }

        sc.setTrangThai(trangThai);
        KiemTraSuCo result = update(sc);
        
        if (result != null) {
            return trangThai;
        }
        return 0;
    }

    public int updateGhiChu(String id, String ghiChuBienBan) {
        String now = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        return jdbcTemplate.update(
                "UPDATE kiemtra_suco SET GhiChuBienBan = ?, NgayCapNhat = ? WHERE Id = ?",
                ghiChuBienBan, now, id);
    }

    public int huy(String id) {
        final int STATUS_CANCELLED = 0;
        String now = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String sql = "UPDATE kiemtra_suco SET TrangThai = ?, Share = 0, NgayCapNhat = ? WHERE Id = ?";
        int r = jdbcTemplate.update(sql, STATUS_CANCELLED, now, id);
        if (r > 0) {
            kyTaiLieuDao.delete(id);
        }
        return r;
    }

    public int delete(String id) {
        return jdbcTemplate.update("DELETE FROM kiemtra_suco WHERE Id = ?", id);
    }
}
