package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.BaoCaoKyThuat;
import com.ecotel.quanlytaisan.model.BaoCaoKyThuatDTO;
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
public class BaoCaoKyThuatDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    private static List<BaoCaoKyThuatDTO> cache = new java.util.ArrayList<>();

    @PostConstruct
    public void init() {
        CompletableFuture.runAsync(this::refreshCache);
    }

    private String buildSelectSql() {
        return """
            SELECT
                bc.Id,
                bc.IdCongTy,
                bc.CongTy,
                bc.TenMauBienBan,
                bc.IdKeHoach,
                bc.Thang,
                bc.Nam,
                bc.DonViBaoCao,
                bc.DonViNhan,
                pbBC.TenPhongBan as tenDonViBaoCao,
                pbN.TenPhongBan as tenDonViNhan,
                bc.TenTaiSan,
                bc.NgayBaoDuongGanNhat,
                bc.TinhTrang,
                bc.NoiDungSuaChua,
                bc.GhiChu,
                bc.GhiChuBienBan,
                bc.IdNguoiLap,
                nvLap.HoTen AS tenNguoiLap,
                bc.NguoiLapXacNhan,
                bc.IdGiamDoc,
                nvGD.HoTen AS tenGiamDoc,
                bc.GiamDocXacNhan,
                bc.Share,
                bc.TrangThai,
                bc.NgayTao,
                bc.NgayCapNhat,
                bc.NguoiTao,
                bc.NguoiCapNhat,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM giamdinh gd
                        WHERE gd.IdBaoCaoKyThuat = bc.id
                    ) THEN 1 ELSE 0 
                END as daCoGiamDinh
            FROM baocaokythuat bc
                LEFT JOIN NhanVien nvLap ON bc.IdNguoiLap = nvLap.Id
                LEFT JOIN NhanVien nvGD ON bc.IdGiamDoc = nvGD.Id
                LEFT JOIN PhongBan pbBC ON bc.DonViBaoCao = pbBC.Id
                LEFT JOIN PhongBan pbN ON bc.DonViNhan = pbN.Id
            """;
    }

    private void refreshCache() {
        try {
            cache = jdbcTemplate.query(buildSelectSql(), new BeanPropertyRowMapper<>(BaoCaoKyThuatDTO.class));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<BaoCaoKyThuatDTO> findAll(String idCongTy) {
        refreshCache();
        if (idCongTy == null) return new java.util.ArrayList<>(cache);
        return cache.stream()
                .filter(d -> idCongTy.equalsIgnoreCase(d.getIdCongTy()))
                .collect(Collectors.toList());
    }

    public BaoCaoKyThuat findById(String id) {
        String sql = "SELECT * FROM baocaokythuat WHERE Id = ?";
        List<BaoCaoKyThuat> r = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(BaoCaoKyThuat.class), id);
        return r.isEmpty() ? null : r.get(0);
    }

    public BaoCaoKyThuatDTO findByIdDTO(String id) {
        String sql = buildSelectSql() + " WHERE bc.Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(BaoCaoKyThuatDTO.class), id);
        } catch (Exception e) { return null; }
    }

    public List<BaoCaoKyThuatDTO> findByIdKeHoach(String idKeHoach) {
        refreshCache();
        return cache.stream()
                .filter(d -> idKeHoach != null && idKeHoach.equalsIgnoreCase(d.getIdKeHoach()))
                .collect(Collectors.toList());
    }

    public String generateNextId() {
        int currentYear = Year.now().getValue();
        String seqName = "BAOCAOKYTHUAT";
        String prefix = "BCKT-" + currentYear + "-";
        try {
            var result = jdbcTemplate.queryForMap("SELECT SeqYear, SeqValue FROM Sequence WHERE SeqName = ?", seqName);
            int seqYear = ((Number) result.get("SeqYear")).intValue();
            if (seqYear != currentYear) {
                jdbcTemplate.update("UPDATE Sequence SET SeqYear = ?, SeqValue = 1 WHERE SeqName = ?", currentYear, seqName);
                return prefix + String.format("%04d", 1);
            }
        } catch (Exception e) {
            Integer maxSeq = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(Id, 11) AS UNSIGNED)), 0) FROM baocaokythuat WHERE Id LIKE ?",
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

    public BaoCaoKyThuat insert(BaoCaoKyThuat e) {
        e.setId(generateNextId());
        String sql = """
            INSERT INTO baocaokythuat (
                Id, IdCongTy, CongTy, TenMauBienBan, IdKeHoach, Thang, Nam,
                DonViBaoCao, DonViNhan, TenTaiSan, NgayBaoDuongGanNhat, TinhTrang, NoiDungSuaChua, GhiChu,
                IdNguoiLap, NguoiLapXacNhan, IdGiamDoc, GiamDocXacNhan,
                Share, TrangThai, NgayTao, NgayCapNhat, NguoiTao, NguoiCapNhat, GhiChuBienBan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        int r = jdbcTemplate.update(sql,
                e.getId(), e.getIdCongTy(), e.getCongTy(), e.getTenMauBienBan(), e.getIdKeHoach(), e.getThang(), e.getNam(),
                e.getDonViBaoCao(), e.getDonViNhan(), e.getTenTaiSan(), e.getNgayBaoDuongGanNhat(), e.getTinhTrang(), e.getNoiDungSuaChua(), e.getGhiChu(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai() != null ? e.getTrangThai() : 0, 
                e.getNgayTao(), e.getNgayCapNhat(), e.getNguoiTao(), e.getNguoiCapNhat(), e.getGhiChuBienBan()
        );
        if (r > 0) { CompletableFuture.runAsync(this::refreshCache); return findById(e.getId()); }
        return null;
    }

    public BaoCaoKyThuat update(BaoCaoKyThuat e) {
        String sql = """
            UPDATE baocaokythuat SET
                CongTy = ?, TenMauBienBan = ?, IdKeHoach = ?, Thang = ?, Nam = ?,
                DonViBaoCao = ?, DonViNhan = ?, TenTaiSan = ?, NgayBaoDuongGanNhat = ?, TinhTrang = ?, NoiDungSuaChua = ?, GhiChu = ?,
                IdNguoiLap = ?, NguoiLapXacNhan = ?, IdGiamDoc = ?, GiamDocXacNhan = ?,
                Share = ?, TrangThai = ?, NgayCapNhat = ?, NguoiCapNhat = ?, GhiChuBienBan = ?
            WHERE Id = ?
            """;
        int r = jdbcTemplate.update(sql,
                e.getCongTy(), e.getTenMauBienBan(), e.getIdKeHoach(), e.getThang(), e.getNam(),
                e.getDonViBaoCao(), e.getDonViNhan(), e.getTenTaiSan(), e.getNgayBaoDuongGanNhat(), e.getTinhTrang(), e.getNoiDungSuaChua(), e.getGhiChu(),
                e.getIdNguoiLap(), e.getNguoiLapXacNhan(), e.getIdGiamDoc(), e.getGiamDocXacNhan(),
                e.getShare(), e.getTrangThai(), e.getNgayCapNhat(), e.getNguoiCapNhat(), e.getGhiChuBienBan(),
                e.getId()
        );
        if (r > 0) { CompletableFuture.runAsync(this::refreshCache); return findById(e.getId()); }
        return null;
    }

    public int updateTrangThai(String id, Integer trangThai) {
        int r = jdbcTemplate.update("UPDATE baocaokythuat SET TrangThai = ? WHERE Id = ?", trangThai, id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }

    public int updateGhiChu(String id, String ghiChuBienBan) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        int r = jdbcTemplate.update("UPDATE baocaokythuat SET GhiChuBienBan = ?, NgayCapNhat = ? WHERE Id = ?",
                ghiChuBienBan, now, id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }

    public int huy(String id) {
        final int STATUS_CANCELLED = 0;
        int r = jdbcTemplate.update(
                "UPDATE baocaokythuat SET TrangThai = ?, Share = 0, NgayCapNhat = ? WHERE Id = ?",
                STATUS_CANCELLED, LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), id);
        if (r > 0) {
            kyTaiLieuDao.delete(id);
            CompletableFuture.runAsync(this::refreshCache);
        }
        return r;
    }

    public int delete(String id) {
        int r = jdbcTemplate.update("DELETE FROM baocaokythuat WHERE Id = ?", id);
        if (r > 0) CompletableFuture.runAsync(this::refreshCache);
        return r;
    }

    public void batchDelete(List<String> ids) {
        jdbcTemplate.batchUpdate("DELETE FROM baocaokythuat WHERE Id = ?", ids, 50, (ps, id) -> ps.setString(1, id));
        CompletableFuture.runAsync(this::refreshCache);
    }
}
