package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.GiamDinh;
import com.ecotel.quanlytaisan.model.GiamDinhDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import javax.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Repository
public class GiamDinhDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    private static List<GiamDinhDTO> cache = new java.util.ArrayList<>();

    @PostConstruct
    public void init() {
        CompletableFuture.runAsync(this::refreshCache);
    }

    private String buildSelectSql() {
        return """
            SELECT
                gd.Id, gd.IdCongTy, gd.CongTy, gd.TenMauBienBan, gd.IdBaoCaoKyThuat, gd.NgayGiamDinh,
                gd.DonViGiamDinh, gd.NoiDung, gd.GhiChuBienBan,
                gd.IdNguoiLap, gd.NguoiLapXacNhan, gd.IdGiamDoc, gd.GiamDocXacNhan,
                gd.Share, gd.TrangThai, gd.NgayTao, gd.NgayCapNhat, gd.NguoiTao, gd.NguoiCapNhat,
                nvLap.HoTen AS tenNguoiLap,
                nvGD.HoTen AS tenGiamDoc,
                pb.TenPhongBan AS tenDonViGiamDinh,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM suachua sc
                        WHERE sc.IdGiamDinh = gd.id
                    ) THEN 1 ELSE 0 
                END as daCoLenhSuaChua
            FROM giamdinh gd
                LEFT JOIN NhanVien nvLap ON gd.IdNguoiLap = nvLap.Id
                LEFT JOIN NhanVien nvGD ON gd.IdGiamDoc = nvGD.Id
                LEFT JOIN PhongBan pb ON gd.DonViGiamDinh = pb.Id
            """;
    }

    public void refreshCache() {
        try {
            cache = jdbcTemplate.query(buildSelectSql(), new BeanPropertyRowMapper<>(GiamDinhDTO.class));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<GiamDinhDTO> findAll(String idCongTy) {
        refreshCache();
        if (idCongTy == null) return new java.util.ArrayList<>(cache);
        return cache.stream()
                .filter(d -> idCongTy.equalsIgnoreCase(d.getIdCongTy()))
                .collect(Collectors.toList());
    }

    public GiamDinh findById(String id) {
        String sql = "SELECT * FROM giamdinh WHERE Id = ?";
        List<GiamDinh> r = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(GiamDinh.class), id);
        return r.isEmpty() ? null : r.get(0);
    }

    public GiamDinhDTO findByIdDTO(String id) {
        String sql = buildSelectSql() + " WHERE gd.Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(GiamDinhDTO.class), id);
        } catch (Exception e) { return null; }
    }

    public List<GiamDinhDTO> findByIdBaoCaoKyThuat(String idBaoCaoKyThuat) {
        refreshCache();
        return cache.stream()
                .filter(d -> idBaoCaoKyThuat.equals(d.getIdBaoCaoKyThuat()))
                .collect(Collectors.toList());
    }

    public String generateNextId() {
        int currentYear = Year.now().getValue();
        String seqName = "GIAMDINH";
        String prefix = "GIAMDINH-" + currentYear + "-";
        try {
            var result = jdbcTemplate.queryForMap("SELECT SeqYear, SeqValue FROM Sequence WHERE SeqName = ?", seqName);
            int seqYear = ((Number) result.get("SeqYear")).intValue();
            if (seqYear != currentYear) {
                jdbcTemplate.update("UPDATE Sequence SET SeqYear = ?, SeqValue = 1 WHERE SeqName = ?", currentYear, seqName);
                return prefix + String.format("%04d", 1);
            }
        } catch (Exception e) {
            Integer maxSeq = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(Id, 15) AS UNSIGNED)), 0) FROM giamdinh WHERE Id LIKE ?",
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

    public GiamDinh insert(GiamDinh e) {
        e.setId(generateNextId());
        String sql = """
            INSERT INTO giamdinh (
                Id, IdCongTy, CongTy, TenMauBienBan, IdBaoCaoKyThuat, NgayGiamDinh,
                DonViGiamDinh, NoiDung,
                IdNguoiLap, NguoiLapXacNhan, IdGiamDoc, GiamDocXacNhan,
                Share, TrangThai, NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, GhiChuBienBan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        int r = jdbcTemplate.update(sql,
                e.getId(), e.getIdCongTy(), e.getCongTy(), e.getTenMauBienBan(), e.getIdBaoCaoKyThuat(), e.getNgayGiamDinh(),
                e.getDonViGiamDinh(), e.getNoiDung(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai() != null ? e.getTrangThai() : 0, 
                e.getNgayTao(), e.getNgayCapNhat(), e.getNguoiTao(), e.getNguoiCapNhat(), e.getGhiChuBienBan()
        );
        if (r > 0) { CompletableFuture.runAsync(this::refreshCache); return findById(e.getId()); }
        return null;
    }

    public GiamDinh update(GiamDinh e) {
        String sql = """
            UPDATE giamdinh SET
                CongTy = ?, TenMauBienBan = ?, IdBaoCaoKyThuat = ?, NgayGiamDinh = ?,
                DonViGiamDinh = ?, NoiDung = ?,
                IdNguoiLap = ?, NguoiLapXacNhan = ?, IdGiamDoc = ?, GiamDocXacNhan = ?,
                Share = ?, TrangThai = ?, NgayCapNhat = ?, NguoiCapNhat = ?, GhiChuBienBan = ?
            WHERE Id = ?
            """;
        int r = jdbcTemplate.update(sql,
                e.getCongTy(), e.getTenMauBienBan(), e.getIdBaoCaoKyThuat(), e.getNgayGiamDinh(),
                e.getDonViGiamDinh(), e.getNoiDung(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai(), e.getNgayCapNhat(), e.getNguoiCapNhat(), e.getGhiChuBienBan(),
                e.getId()
        );
        if (r > 0) { CompletableFuture.runAsync(this::refreshCache); return findById(e.getId()); }
        return null;
    }

    public int updateTrangThai(String id, Integer trangThai) {
        int r = jdbcTemplate.update("UPDATE giamdinh SET TrangThai = ? WHERE Id = ?", trangThai, id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }

    public int updateGhiChu(String id, String ghiChuBienBan) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        int r = jdbcTemplate.update(
                "UPDATE giamdinh SET GhiChuBienBan = ?, NgayCapNhat = ? WHERE Id = ?",
                ghiChuBienBan, now, id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }

    public int huy(String id) {
        final int STATUS_CANCELLED = 0;
        int r = jdbcTemplate.update(
                "UPDATE giamdinh SET TrangThai = ?, Share = 0, NgayCapNhat = ? WHERE Id = ?",
                STATUS_CANCELLED, LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), id);
        if (r > 0) {
            kyTaiLieuDao.delete(id);
            CompletableFuture.runAsync(this::refreshCache);
        }
        return r;
    }

    public int delete(String id) {
        int r = jdbcTemplate.update("DELETE FROM giamdinh WHERE Id = ?", id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }

    public void batchDelete(List<String> ids) {
        jdbcTemplate.batchUpdate("DELETE FROM giamdinh WHERE Id = ?", ids, 50, (ps, id) -> ps.setString(1, id));
        CompletableFuture.runAsync(this::refreshCache);
    }
}
