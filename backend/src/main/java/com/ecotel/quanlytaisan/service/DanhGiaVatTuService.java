package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.DanhGiaVatTuDao;
import com.ecotel.quanlytaisan.dao.KyTaiLieuDao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import com.ecotel.quanlytaisan.model.*;

@Service
public class DanhGiaVatTuService {

    @Autowired
    private DanhGiaVatTuDao dao;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    public List<DanhGiaVatTu> findAll() {
        List<DanhGiaVatTu> list = dao.findAll();
        for (DanhGiaVatTu item : list) {
            enrichData(item);
        }
        return list;
    }

    public DanhGiaVatTu findById(String id) {
        DanhGiaVatTu item = dao.findById(id);
        if (item != null) enrichData(item);
        return item;
    }

    public List<DanhGiaVatTu> findByIdNghiemThu(String idNghiemThu) {
        List<DanhGiaVatTu> list = dao.findByIdNghiemThu(idNghiemThu);
        if (list != null) {
            for (DanhGiaVatTu item : list) {
                enrichData(item);
            }
        }
        return list;
    }

    private void enrichData(DanhGiaVatTu item) {
        item.setDanhSachChiTiet(dao.findDetailsByParentId(item.getId()));
        item.setNguoiKyList(kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId()));
    }

    @Transactional
    public DanhGiaVatTu insert(DanhGiaVatTu entity) {
        DanhGiaVatTu result = dao.insert(entity);
        if (result != null) {
            if (entity.getDanhSachChiTiet() != null && !entity.getDanhSachChiTiet().isEmpty()) {
                dao.insertDetails(entity.getDanhSachChiTiet(), result.getId());
            }
            if (entity.getNguoiKyList() != null) {
                entity.getNguoiKyList().forEach(nk -> nk.setIdTaiLieu(result.getId()));
                kyTaiLieuDao.updateNguoiKy(result.getId(), entity.getNguoiKyList());
            }
        }
        return result;
    }

    @Transactional
    public DanhGiaVatTu update(DanhGiaVatTu entity) {
        DanhGiaVatTu result = dao.update(entity);
        if (result != null) {
            dao.deleteDetailsByParentId(entity.getId());
            if (entity.getDanhSachChiTiet() != null && !entity.getDanhSachChiTiet().isEmpty()) {
                dao.insertDetails(entity.getDanhSachChiTiet(), entity.getId());
            }
            if (entity.getNguoiKyList() != null) {
                entity.getNguoiKyList().forEach(nk -> nk.setIdTaiLieu(entity.getId()));
                kyTaiLieuDao.updateNguoiKy(entity.getId(), entity.getNguoiKyList());
            }
        }
        return result;
    }

    @Transactional
    public void batchUpdate(List<DanhGiaVatTu> entities) {
        for (DanhGiaVatTu entity : entities) {
            update(entity);
        }
    }

    @Transactional
    public int updateTrangThai(String id, String userId) {
        DanhGiaVatTu item = dao.findById(id);
        if (item == null) return 0;

        int trangThai = item.getTrangThai() != null ? item.getTrangThai() : 0;

        // Cập nhật trạng thái ký trong bảng NguoiKy
        NguoiKy nk = kyTaiLieuDao.getNguoiKy(userId, id);
        if (nk != null) kyTaiLieuDao.updateTrangThai(nk.getId(), "1");

        // Xác nhận Người lập
        if (Objects.equals(userId, item.getIdNguoiLap())) {
            item.setNguoiLapXacNhan(true);
            trangThai = 1;
        }

        // Xác nhận Giám đốc
        if (Objects.equals(userId, item.getIdGiamDoc())) {
            item.setGiamDocXacNhan(true);
            trangThai = 1;
        }

        // 4. Kiểm tra tất cả đã ký chưa
        boolean allKy = true;
        if (item.getIdNguoiLap() != null && !item.getIdNguoiLap().isEmpty()) {
            allKy = allKy && Boolean.TRUE.equals(item.getNguoiLapXacNhan());
        }
        if (item.getIdGiamDoc() != null && !item.getIdGiamDoc().isEmpty()) {
            allKy = allKy && Boolean.TRUE.equals(item.getGiamDocXacNhan());
        }
        if (allKy) {
            List<NguoiKy> nkList = kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(id);
            if (nkList != null && !nkList.isEmpty()) {
                for (NguoiKy n : nkList) {
                    if (n.getTrangThai() != 1) { allKy = false; break; }
                }
            }
        }

        if (allKy) trangThai = 3;
        item.setTrangThai(trangThai);
        dao.update(item);
        return trangThai;
    }

    @Transactional
    public int huy(String id) {
        return dao.huy(id);
    }

    @Transactional
    public int delete(String id) {
        dao.deleteDetailsByParentId(id);
        kyTaiLieuDao.deleteAllNguoiKy(id);
        kyTaiLieuDao.delete(id);
        return dao.delete(id);
    }

    public PageResponse<DanhGiaVatTu> findAllPaged(int page, int size, String sortBy, String sortDir,
            String search, Integer trangThai, String userid, Boolean isSign, String dateFrom, String dateTo, String idTaiSan) {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        List<DanhGiaVatTu> sourceList = dao.findAll();

        if (idTaiSan != null && !idTaiSan.trim().isEmpty()) {
            List<String> validIds = jdbcTemplate.queryForList(
                "SELECT id FROM danhgia_vattu WHERE idNghiemThu IN (SELECT idNghiemThu FROM nghiemthu_chitiettaisan WHERE idTaiSan = ?)", 
                String.class, idTaiSan);
            sourceList = sourceList.stream()
                    .filter(i -> validIds.contains(i.getId()))
                    .collect(Collectors.toList());
        }

        // Lọc theo lượt ký (Turn to sign)
        if (userid != null && !userid.trim().isEmpty()) {
            boolean shouldFilter = !"admin".equalsIgnoreCase(userid) || (isSign != null && isSign);
            if (shouldFilter) {
                List<DanhGiaVatTu> filtered = new ArrayList<>();
                for (DanhGiaVatTu item : sourceList) {
                    if (isSign != null && isSign) {
                        if (isNeedToSign(item, userid)) {
                            filtered.add(item);
                        }
                    } else {
                        if (isUserTurnToSign(item, userid)) {
                            filtered.add(item);
                        }
                    }
                }
                sourceList = filtered;
            }
        }

        // Đếm theo trạng thái
        Map<String, Long> trangThaiCounts = new HashMap<>();
        for (DanhGiaVatTu item : sourceList) {
            if (item.getTrangThai() != null) {
                String key = item.getTrangThai().toString();
                trangThaiCounts.put(key, trangThaiCounts.getOrDefault(key, 0L) + 1);
            }
        }

        // Lọc theo trạng thái
        if (trangThai != null) {
            sourceList = sourceList.stream()
            .filter(i -> trangThai.equals(i.getTrangThai()))
                    .collect(Collectors.toList());
        }

        // Lọc theo ngày
        
        if (idTaiSan != null && !idTaiSan.trim().isEmpty()) {
            List<String> validIds = jdbcTemplate.queryForList(
                "SELECT id FROM danhgia_vattu WHERE idNghiemThu IN (SELECT idNghiemThu FROM nghiemthu_chitiettaisan WHERE idTaiSan = ?)", 
                String.class, idTaiSan);
            sourceList = sourceList.stream()
                    .filter(i -> validIds.contains(i.getId()))
                    .collect(Collectors.toList());
        }
if (dateFrom != null && !dateFrom.isEmpty()) {
            sourceList = sourceList.stream()
                    .filter(i -> i.getNgayTao() != null && i.getNgayTao().compareTo(dateFrom) >= 0)
                    .collect(Collectors.toList());
        }
        if (dateTo != null && !dateTo.isEmpty()) {
            String dateToEndInclusive = dateTo + " 23:59:59";
            sourceList = sourceList.stream()
                    .filter(i -> i.getNgayTao() != null && i.getNgayTao().compareTo(dateToEndInclusive) <= 0)
                    .collect(Collectors.toList());
        }

        if (idTaiSan != null && !idTaiSan.trim().isEmpty()) {
            List<String> validIds = jdbcTemplate.queryForList(
                "SELECT id FROM danhgia_vattu WHERE idNghiemThu IN (SELECT idNghiemThu FROM nghiemthu_chitiettaisan WHERE idTaiSan = ?)", 
                String.class, idTaiSan);
            sourceList = sourceList.stream()
                    .filter(i -> validIds.contains(i.getId()))
                    .collect(Collectors.toList());
        }

        // Tìm kiếm
        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase();
            sourceList = sourceList.stream()
                    .filter(i -> (i.getQuyetDinhSo() != null && i.getQuyetDinhSo().toLowerCase().contains(q))
                            || (i.getDiaDiem() != null && i.getDiaDiem().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        sourceList.sort(getComparator(sortBy, sortDir));

        long total = sourceList.size();
        int from = Math.min(page * size, sourceList.size());
        int to = Math.min(from + size, sourceList.size());
        List<DanhGiaVatTu> items = new ArrayList<>(sourceList.subList(from, to));

        for (DanhGiaVatTu item : items) {
            enrichData(item);
        }

        PageResponse<DanhGiaVatTu> response = new PageResponse<>(items, total, page, size);
        response.setTrangThaiCounts(trangThaiCounts);
        return response;
    }

    public boolean isNeedToSign(DanhGiaVatTu item, String userId) {
        if (userId == null || userId.isEmpty()) return false;
        
        // ===== Trạng thái nháp/hoàn thành/hủy bỏ (trangThai 2, 3 bỏ qua) =====
        if (item.getTrangThai() != null && (item.getTrangThai() == 2 || item.getTrangThai() == 3)) {
            return false;
        }

        // ===== Kiểm tra điều kiện share / người tạo ký trước khi share =====
        if (!Boolean.TRUE.equals(item.getShare())) {
            // Nếu chưa share, chỉ cho phép ký nếu userId là người tạo trùng với người ký đầu tiên và người đó chưa ký.
            boolean isCreatorAndFirstSigner = false;

            // 1. Kiểm tra người lập (người ký đầu tiên)
            if (item.getIdNguoiLap() != null && !item.getIdNguoiLap().isEmpty()) {
                if (userId.equalsIgnoreCase(item.getNguoiTao()) && userId.equalsIgnoreCase(item.getIdNguoiLap())) {
                    if (!Boolean.TRUE.equals(item.getNguoiLapXacNhan())) {
                        isCreatorAndFirstSigner = true;
                    }
                }
            } else {
                // 2. Nếu không có người lập, kiểm tra người ký đầu tiên trong danh sách NguoiKy
                List<NguoiKy> kyList = kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId());
                if (kyList != null && !kyList.isEmpty()) {
                    kyList.sort((a, b) -> {
                        String idA = a.getId() != null ? a.getId() : "";
                        String idB = b.getId() != null ? b.getId() : "";
                        return idA.compareTo(idB);
                    });
                    
                    NguoiKy firstUnsigned = null;
                    for (NguoiKy nk : kyList) {
                        if (nk.getTrangThai() != 1) {
                            firstUnsigned = nk;
                            break;
                        }
                    }
                    if (firstUnsigned != null) {
                        if (userId.equalsIgnoreCase(item.getNguoiTao()) && userId.equalsIgnoreCase(firstUnsigned.getIdNguoiKy())) {
                            isCreatorAndFirstSigner = true;
                        }
                    }
                }
            }

            if (!isCreatorAndFirstSigner) {
                return false;
            }
        }

        // Bước 1: Người lập
        if (item.getIdNguoiLap() != null && !item.getIdNguoiLap().isEmpty()) {
            if (!Boolean.TRUE.equals(item.getNguoiLapXacNhan()))
                return userId.equalsIgnoreCase(item.getIdNguoiLap());
        }

        // Bước 2: NguoiKy list & Giám đốc
        boolean lapDone = item.getIdNguoiLap() == null || item.getIdNguoiLap().isEmpty()
                || Boolean.TRUE.equals(item.getNguoiLapXacNhan());
        if (lapDone) {
            List<NguoiKy> kyList = kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId());
            if (kyList != null && !kyList.isEmpty()) {
                kyList.sort((a, b) -> {
                    String idA = a.getId() != null ? a.getId() : "";
                    String idB = b.getId() != null ? b.getId() : "";
                    return idA.compareTo(idB);
                });

                NguoiKy firstUnsigned = null;
                boolean allSigned = true;
                for (NguoiKy nk : kyList) {
                    if (nk.getTrangThai() != 1) {
                        allSigned = false;
                        if (firstUnsigned == null) firstUnsigned = nk;
                    }
                }
                if (firstUnsigned != null) return userId.equalsIgnoreCase(firstUnsigned.getIdNguoiKy());
                if (allSigned && !Boolean.TRUE.equals(item.getGiamDocXacNhan()))
                    return userId.equalsIgnoreCase(item.getIdGiamDoc());
            } else {
                if (!Boolean.TRUE.equals(item.getGiamDocXacNhan()))
                    return userId.equalsIgnoreCase(item.getIdGiamDoc());
            }
        }
        return false;
    }
    public boolean isUserTurnToSign(DanhGiaVatTu item, String userId) {
        if (userId != null && userId.equals(item.getNguoiTao())) return true;
        if (!Boolean.TRUE.equals(item.getShare())) return false;

        // Nếu chưa ký (Người lập)
        if (item.getIdNguoiLap() != null && !item.getIdNguoiLap().isEmpty()) {
            if (!Boolean.TRUE.equals(item.getNguoiLapXacNhan()))
                return userId != null && userId.equals(item.getIdNguoiLap());
            if (userId != null && userId.equals(item.getIdNguoiLap())) return true;
        }

        // Nếu người lập đã xong, đến các người ký khác
        boolean lapDone = item.getIdNguoiLap() == null || item.getIdNguoiLap().isEmpty()
                || Boolean.TRUE.equals(item.getNguoiLapXacNhan());
        
        if (lapDone) {
            List<NguoiKy> kyList = kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId());
            if (kyList != null && !kyList.isEmpty()) {
                NguoiKy firstUnsigned = null;
                boolean allSigned = true, userSigned = false, userInList = false;
                for (NguoiKy nk : kyList) {
                    if (nk.getTrangThai() != 1) { allSigned = false; if (firstUnsigned == null) firstUnsigned = nk; }
                    if (userId != null && userId.equals(nk.getIdNguoiKy())) {
                        userInList = true;
                        if (nk.getTrangThai() == 1) userSigned = true;
                    }
                }
                if (userSigned) return true;
                if (firstUnsigned != null && userInList && userId != null && userId.equals(firstUnsigned.getIdNguoiKy())) return true;
                if (allSigned && !Boolean.TRUE.equals(item.getGiamDocXacNhan()))
                    return userId != null && userId.equals(item.getIdGiamDoc());
            } else {
                if (!Boolean.TRUE.equals(item.getGiamDocXacNhan()))
                    return userId != null && userId.equals(item.getIdGiamDoc());
            }
        }
        return false;
    }

    private Comparator<DanhGiaVatTu> getComparator(String sortBy, String sortDir) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            Map<Integer, Integer> pm = new HashMap<>();
            pm.put(0, 1); pm.put(1, 2); pm.put(3, 3); pm.put(2, 4);
            return Comparator.<DanhGiaVatTu>comparingInt(i -> pm.getOrDefault(i.getTrangThai(), 5))
                    .thenComparing(i -> i.getNgayTao() != null ? i.getNgayTao() : "",
                            Comparator.nullsLast(Comparator.reverseOrder()));
        }
        boolean asc = "asc".equalsIgnoreCase(sortDir);
        Comparator<DanhGiaVatTu> comp;
        switch (sortBy.trim().toLowerCase()) {
            case "quyetdinhso":
                comp = Comparator.comparing(i -> i.getQuyetDinhSo() != null ? i.getQuyetDinhSo() : "",
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)); break;
            case "trangthai":
                comp = Comparator.comparing(i -> i.getTrangThai() != null ? i.getTrangThai() : 0,
                        Comparator.nullsLast(Integer::compareTo)); break;
            case "ngaytao": default:
                comp = Comparator.comparing(i -> i.getNgayTao() != null ? i.getNgayTao() : "",
                        Comparator.nullsLast(String::compareTo)); break;
        }
        return asc ? comp : comp.reversed();
    }
    public int updateGhiChu(String id, String ghiChuBienBan) {
        return dao.updateGhiChu(id, ghiChuBienBan);
    }
}
