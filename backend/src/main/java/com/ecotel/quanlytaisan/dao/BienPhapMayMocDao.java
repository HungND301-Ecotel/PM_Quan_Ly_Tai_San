package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.BienPhapMayMoc;
import com.ecotel.quanlytaisan.model.BienPhapMayMocDTO;
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
public class BienPhapMayMocDao {

    public static final int STATUS_CANCELLED = 0;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    private static List<BienPhapMayMocDTO> cache = new ArrayList<>();

    @PostConstruct
    public void init() {
        CompletableFuture.runAsync(this::refreshCache);
    }

    private String buildSelectSql() {
        return """
            SELECT
                bp.Id, bp.IdCongTy, bp.CongTy, bp.TenMauBienBan, bp.IdGiamDinhMayMoc,
                bp.SoPhieu, bp.SoDeNghi,
                bp.DonViSuaChua, bp.DonViPhoiHop, bp.HinhThuc,
                bp.ThoiGianBatDau, bp.ThoiGianKetThuc, bp.ThoiGianNgay,
                bp.GhiChu, bp.GhiChuBienBan, bp.TenFile, bp.DuongDanFile,
                bp.IdNguoiLap, bp.NguoiLapXacNhan,
                bp.IdGiamDoc,  bp.GiamDocXacNhan,
                bp.Share, bp.TrangThai,
                bp.NgayTao, bp.NgayCapNhat, bp.NguoiTao, bp.NguoiCapNhat,
                nvLap.HoTen AS tenNguoiLap,
                nvGD.HoTen  AS tenGiamDoc,
                gd.SoPhieu  AS soPhieuGiamDinhMayMoc,
                (SELECT COUNT(*) FROM nghiemthu_maymoc nt WHERE nt.IdBienPhapMayMoc = bp.Id) AS daCoNghiemThu
            FROM bienphap_maymoc bp
                LEFT JOIN NhanVien nvLap        ON nvLap.Id = bp.IdNguoiLap
                LEFT JOIN NhanVien nvGD         ON nvGD.Id  = bp.IdGiamDoc
                LEFT JOIN giamdinh gd    ON gd.Id    = bp.IdGiamDinhMayMoc
            """;
    }

    public void refreshCache() {
        try {
            cache = jdbcTemplate.query(buildSelectSql(),
                    new BeanPropertyRowMapper<>(BienPhapMayMocDTO.class));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<BienPhapMayMocDTO> findAll(String idCongTy) {
        refreshCache();
        if (idCongTy == null) return new ArrayList<>(cache);
        return cache.stream()
                .filter(d -> idCongTy.equalsIgnoreCase(d.getIdCongTy()))
                .collect(Collectors.toList());
    }
    public List<BienPhapMayMocDTO> findByIdGiamDinhMayMoc(String idGiamDinhMayMoc) {
        refreshCache();
        if (idGiamDinhMayMoc == null) return new ArrayList<>();
        return cache.stream()
                .filter(d -> idGiamDinhMayMoc.equalsIgnoreCase(d.getIdGiamDinhMayMoc()))
                .collect(Collectors.toList());
    }

    public BienPhapMayMoc findById(String id) {
        String sql = "SELECT * FROM bienphap_maymoc WHERE Id = ?";
        List<BienPhapMayMoc> r = jdbcTemplate.query(sql,
                new BeanPropertyRowMapper<>(BienPhapMayMoc.class), id);
        return r.isEmpty() ? null : r.get(0);
    }

    public BienPhapMayMocDTO findByIdDTO(String id) {
        String sql = buildSelectSql() + " WHERE bp.Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql,
                    new BeanPropertyRowMapper<>(BienPhapMayMocDTO.class), id);
        } catch (Exception e) { return null; }
    }

    // ─── ID generator ────────────────────────────────────────────────────────

    public String generateNextId() {
        int    currentYear = Year.now().getValue();
        String seqName     = "BIENPHAP_MAYMOC";
        String prefix      = "BP-MM-" + currentYear + "-";
        try {
            var result  = jdbcTemplate.queryForMap(
                    "SELECT SeqYear, SeqValue FROM Sequence WHERE SeqName = ?", seqName);
            int seqYear = ((Number) result.get("SeqYear")).intValue();
            if (seqYear != currentYear) {
                jdbcTemplate.update(
                        "UPDATE Sequence SET SeqYear = ?, SeqValue = 1 WHERE SeqName = ?",
                        currentYear, seqName);
                return prefix + String.format("%04d", 1);
            }
        } catch (Exception e) {
            Integer maxSeq = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(Id, 11) AS UNSIGNED)), 0) FROM bienphap_maymoc WHERE Id LIKE ?",
                    Integer.class, prefix + "%");
            int init = maxSeq == null ? 0 : maxSeq;
            jdbcTemplate.update(
                    "INSERT INTO Sequence (SeqName, SeqYear, SeqValue) VALUES (?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE SeqValue = GREATEST(SeqValue, ?)",
                    seqName, currentYear, init, init);
        }
        jdbcTemplate.update(
                "UPDATE Sequence SET SeqValue = SeqValue + 1 WHERE SeqName = ? AND SeqYear = ?",
                seqName, currentYear);
        Integer next = jdbcTemplate.queryForObject(
                "SELECT SeqValue FROM Sequence WHERE SeqName = ?", Integer.class, seqName);
        return prefix + String.format("%04d", next);
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────

    public BienPhapMayMoc insert(BienPhapMayMoc e) {
        e.setId(generateNextId());
        String sql = """
            INSERT INTO bienphap_maymoc (
                Id, IdCongTy, CongTy, TenMauBienBan, IdGiamDinhMayMoc,
                SoPhieu, SoDeNghi,
                DonViSuaChua, DonViPhoiHop, HinhThuc,
                ThoiGianBatDau, ThoiGianKetThuc, ThoiGianNgay,
                GhiChu, TenFile, DuongDanFile,
                IdNguoiLap, NguoiLapXacNhan, IdGiamDoc, GiamDocXacNhan,
                Share, TrangThai,
                NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, GhiChuBienBan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        int r = jdbcTemplate.update(sql,
                e.getId(), e.getIdCongTy(), e.getCongTy(), e.getTenMauBienBan(), e.getIdGiamDinhMayMoc(),
                e.getSoPhieu(), e.getSoDeNghi(),
                e.getDonViSuaChua(), e.getDonViPhoiHop(), e.getHinhThuc(),
                e.getThoiGianBatDau(), e.getThoiGianKetThuc(), e.getThoiGianNgay(),
                e.getGhiChu(), e.getTenFile(), e.getDuongDanFile(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(),
                e.getIdGiamDoc(),  e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai() != null ? e.getTrangThai() : 0,
                e.getNgayTao(), e.getNgayCapNhat(), e.getNguoiTao(), e.getNguoiCapNhat(), e.getGhiChuBienBan()
        );
        if (r > 0) { CompletableFuture.runAsync(this::refreshCache); return findById(e.getId()); }
        return null;
    }

    public BienPhapMayMoc update(BienPhapMayMoc e) {
        String sql = """
            UPDATE bienphap_maymoc SET
                CongTy = ?, TenMauBienBan = ?,
                IdGiamDinhMayMoc = ?,
                SoPhieu = ?, SoDeNghi = ?,
                DonViSuaChua = ?, DonViPhoiHop = ?, HinhThuc = ?,
                ThoiGianBatDau = ?, ThoiGianKetThuc = ?, ThoiGianNgay = ?,
                GhiChu = ?, TenFile = ?, DuongDanFile = ?,
                IdNguoiLap = ?, NguoiLapXacNhan = ?,
                IdGiamDoc = ?,  GiamDocXacNhan = ?,
                Share = ?, TrangThai = ?,
                NgayCapNhat = ?, NguoiCapNhat = ?, GhiChuBienBan = ?
            WHERE Id = ?
            """;
        int r = jdbcTemplate.update(sql,
                e.getCongTy(), e.getTenMauBienBan(),
                e.getIdGiamDinhMayMoc(),
                e.getSoPhieu(), e.getSoDeNghi(),
                e.getDonViSuaChua(), e.getDonViPhoiHop(), e.getHinhThuc(),
                e.getThoiGianBatDau(), e.getThoiGianKetThuc(), e.getThoiGianNgay(),
                e.getGhiChu(), e.getTenFile(), e.getDuongDanFile(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(),
                e.getIdGiamDoc(),  e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai(),
                e.getNgayCapNhat(), e.getNguoiCapNhat(), e.getGhiChuBienBan(),
                e.getId()
        );
        if (r > 0) { CompletableFuture.runAsync(this::refreshCache); return findById(e.getId()); }
        return null;
    }

    public int updateTrangThai(String id, Integer trangThai) {
        int r = jdbcTemplate.update(
                "UPDATE bienphap_maymoc SET TrangThai = ? WHERE Id = ?", trangThai, id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }

    public int updateGhiChu(String id, String ghiChuBienBan) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        int r = jdbcTemplate.update(
                "UPDATE bienphap_maymoc SET GhiChuBienBan = ?, NgayCapNhat = ? WHERE Id = ?",
                ghiChuBienBan, now, id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }

    public int huy(String id) {
        int r = jdbcTemplate.update(
                "UPDATE bienphap_maymoc SET TrangThai = ?, Share = 0, NgayCapNhat = ? WHERE Id = ?",
                STATUS_CANCELLED, LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), id);
        if (r > 0) {
            kyTaiLieuDao.delete(id);
            CompletableFuture.runAsync(this::refreshCache);
        }
        return r;
    }

    public int delete(String id) {
        int r = jdbcTemplate.update("DELETE FROM bienphap_maymoc WHERE Id = ?", id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }
}
