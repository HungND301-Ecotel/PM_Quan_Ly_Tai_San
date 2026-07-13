package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.BienPhapPhuongTien;
import com.ecotel.quanlytaisan.model.BienPhapPhuongTienDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import javax.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Repository
public class BienPhapPhuongTienDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    private static List<BienPhapPhuongTienDTO> cache = new ArrayList<>();

    @PostConstruct
    public void init() {
        CompletableFuture.runAsync(this::refreshCache);
    }

    private String buildSelectSql() {
        return """
            SELECT
                bp.Id, bp.IdCongTy, bp.CongTy, bp.TenMauBienBan, bp.SoBienBan, bp.IdTaiSan,
                bp.MucDich, bp.YeuCau, bp.TinhTrangHienTai, bp.NoiDungThucHien,
                bp.TienDoTuNgay, bp.TienDoDenNgay, bp.BienPhapAnToan, bp.IdGiamDinhPhuongTien,
                bp.DonViQuanLy, bp.GhiChuBienBan,
                bp.IdNguoiLap, bp.NguoiLapXacNhan, bp.IdGiamDoc, bp.GiamDocXacNhan,
                bp.Share, bp.TrangThai,
                bp.NgayTao, bp.NgayCapNhat, bp.NguoiTao, bp.NguoiCapNhat,
                nvLap.HoTen  AS tenNguoiLap,
                nvGD.HoTen   AS tenGiamDoc,
                ts.TenTaiSan AS tenTaiSan,
                gdpt.SoPhieu AS soPhieuSuCo,
                (SELECT COUNT(*) FROM nghiemthu_phuongtien nt WHERE nt.IdBienPhapPhuongTien = bp.Id) AS daCoNghiemThu
            FROM bienphap_phuongtien bp
                LEFT JOIN NhanVien nvLap   ON nvLap.Id  = bp.IdNguoiLap
                LEFT JOIN NhanVien nvGD    ON nvGD.Id   = bp.IdGiamDoc
                LEFT JOIN taisan   ts      ON ts.Id     = bp.IdTaiSan
                LEFT JOIN giamdinh gdpt ON gdpt.Id  = bp.IdGiamDinhPhuongTien
            """;
    }

    public void refreshCache() {
        try {
            cache = jdbcTemplate.query(buildSelectSql(), new BeanPropertyRowMapper<>(BienPhapPhuongTienDTO.class));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<BienPhapPhuongTienDTO> findAll(String idCongTy) {
        refreshCache();
        if (idCongTy == null) return new ArrayList<>(cache);
        return cache.stream()
                .filter(d -> idCongTy.equalsIgnoreCase(d.getIdCongTy()))
                .collect(Collectors.toList());
    }

    public BienPhapPhuongTien findById(String id) {
        String sql = "SELECT * FROM bienphap_phuongtien WHERE Id = ?";
        List<BienPhapPhuongTien> r = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(BienPhapPhuongTien.class), id);
        return r.isEmpty() ? null : r.get(0);
    }

    public BienPhapPhuongTienDTO findByIdDTO(String id) {
        String sql = buildSelectSql() + " WHERE bp.Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(BienPhapPhuongTienDTO.class), id);
        } catch (Exception e) { return null; }
    }

    public List<BienPhapPhuongTienDTO> findByIdTaiSan(String idTaiSan) {
        return findAll(null).stream()
                .filter(d -> idTaiSan != null && idTaiSan.equalsIgnoreCase(d.getIdTaiSan()))
                .collect(Collectors.toList());
    }

    public List<BienPhapPhuongTienDTO> findByIdGiamDinhPhuongTien(String idGiamDinhPhuongTien) {
        return findAll(null).stream()
                .filter(d -> idGiamDinhPhuongTien != null && idGiamDinhPhuongTien.equalsIgnoreCase(d.getIdGiamDinhPhuongTien()))
                .collect(Collectors.toList());
    }

    // ─── ID generator ──────────────────────────────────────────────────────────

    public String generateNextId() {
        int    currentYear = Year.now().getValue();
        String seqName     = "BIENPHAP_PHUONGTIEN";
        String prefix      = "BP-PT-" + currentYear + "-";
        try {
            var result  = jdbcTemplate.queryForMap("SELECT SeqYear, SeqValue FROM Sequence WHERE SeqName = ?", seqName);
            int seqYear = ((Number) result.get("SeqYear")).intValue();
            if (seqYear != currentYear) {
                jdbcTemplate.update("UPDATE Sequence SET SeqYear = ?, SeqValue = 1 WHERE SeqName = ?", currentYear, seqName);
                return prefix + String.format("%04d", 1);
            }
        } catch (Exception e) {
            Integer maxSeq = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(Id, 11) AS UNSIGNED)), 0) FROM bienphap_phuongtien WHERE Id LIKE ?",
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

    // ─── CRUD ──────────────────────────────────────────────────────────────────

    public BienPhapPhuongTien insert(BienPhapPhuongTien e) {
        e.setId(generateNextId());
        String sql = """
            INSERT INTO bienphap_phuongtien (
                Id, IdCongTy, CongTy, TenMauBienBan, SoBienBan, IdTaiSan,
                MucDich, YeuCau, TinhTrangHienTai, NoiDungThucHien,
                TienDoTuNgay, TienDoDenNgay, BienPhapAnToan, IdGiamDinhPhuongTien,
                DonViQuanLy,
                IdNguoiLap, NguoiLapXacNhan, IdGiamDoc, GiamDocXacNhan,
                Share, TrangThai, NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, GhiChuBienBan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        int r = jdbcTemplate.update(sql,
                e.getId(), e.getIdCongTy(), e.getCongTy(), e.getTenMauBienBan(), e.getSoBienBan(), e.getIdTaiSan(),
                e.getMucDich(), e.getYeuCau(), e.getTinhTrangHienTai(), e.getNoiDungThucHien(),
                e.getTienDoTuNgay(), e.getTienDoDenNgay(), e.getBienPhapAnToan(), e.getIdGiamDinhPhuongTien(),
                e.getDonViQuanLy(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai() != null ? e.getTrangThai() : 0,
                e.getNgayTao(), e.getNgayCapNhat(), e.getNguoiTao(), e.getNguoiCapNhat(), e.getGhiChuBienBan()
        );
        if (r > 0) { CompletableFuture.runAsync(this::refreshCache); return findById(e.getId()); }
        return null;
    }

    public BienPhapPhuongTien update(BienPhapPhuongTien e) {
        String sql = """
            UPDATE bienphap_phuongtien SET
                CongTy = ?, TenMauBienBan = ?, SoBienBan = ?, IdTaiSan = ?,
                MucDich = ?, YeuCau = ?, TinhTrangHienTai = ?, NoiDungThucHien = ?,
                TienDoTuNgay = ?, TienDoDenNgay = ?, BienPhapAnToan = ?, IdGiamDinhPhuongTien = ?,
                DonViQuanLy = ?,
                IdNguoiLap = ?, NguoiLapXacNhan = ?, IdGiamDoc = ?, GiamDocXacNhan = ?,
                Share = ?, TrangThai = ?, NgayCapNhat = ?, NguoiCapNhat = ?, GhiChuBienBan = ?
            WHERE Id = ?
            """;
        int r = jdbcTemplate.update(sql,
                e.getCongTy(), e.getTenMauBienBan(), e.getSoBienBan(), e.getIdTaiSan(),
                e.getMucDich(), e.getYeuCau(), e.getTinhTrangHienTai(), e.getNoiDungThucHien(),
                e.getTienDoTuNgay(), e.getTienDoDenNgay(), e.getBienPhapAnToan(), e.getIdGiamDinhPhuongTien(),
                e.getDonViQuanLy(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai(), e.getNgayCapNhat(), e.getNguoiCapNhat(), e.getGhiChuBienBan(),
                e.getId()
        );
        if (r > 0) { CompletableFuture.runAsync(this::refreshCache); return findById(e.getId()); }
        return null;
    }

    public int updateTrangThai(String id, Integer trangThai) {
        int r = jdbcTemplate.update("UPDATE bienphap_phuongtien SET TrangThai = ? WHERE Id = ?", trangThai, id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }

    public int updateGhiChu(String id, String ghiChuBienBan) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        int r = jdbcTemplate.update(
                "UPDATE bienphap_phuongtien SET GhiChuBienBan = ?, NgayCapNhat = ? WHERE Id = ?",
                ghiChuBienBan, now, id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }

    public int huy(String id) {
        final int STATUS_CANCELLED = 0;
        int r = jdbcTemplate.update(
                "UPDATE bienphap_phuongtien SET TrangThai = ?, Share = 0, NgayCapNhat = ? WHERE Id = ?",
                STATUS_CANCELLED, LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), id);
        if (r > 0) {
            kyTaiLieuDao.delete(id);
            CompletableFuture.runAsync(this::refreshCache);
        }
        return r;
    }

    public int delete(String id) {
        int r = jdbcTemplate.update("DELETE FROM bienphap_phuongtien WHERE Id = ?", id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }
}
