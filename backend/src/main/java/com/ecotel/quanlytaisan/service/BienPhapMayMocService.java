package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.BienPhapMayMocDao;
import com.ecotel.quanlytaisan.dao.KyTaiLieuDao;
import com.ecotel.quanlytaisan.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class BienPhapMayMocService {

    @Autowired private BienPhapMayMocDao bienPhapDao;
    @Autowired private KyTaiLieuDao      kyTaiLieuDao;
    @Autowired private S3Service         s3Service;

    // ─── Queries ─────────────────────────────────────────────────────────────

    public List<BienPhapMayMocDTO> findAll(String idCongTy) {
        List<BienPhapMayMocDTO> list = bienPhapDao.findAll(idCongTy);
        list.forEach(this::enrich);
        return list;
    }
    public List<BienPhapMayMocDTO> findByIdGiamDinhMayMoc(String idGiamDinhMayMoc) {
        List<BienPhapMayMocDTO> list = bienPhapDao.findByIdGiamDinhMayMoc(idGiamDinhMayMoc);
        list.forEach(this::enrich);
        return list;
    }

    public BienPhapMayMocDTO findByIdDTO(String id) {
        BienPhapMayMocDTO dto = bienPhapDao.findByIdDTO(id);
        if (dto != null) enrich(dto);
        return dto;
    }

    private void enrich(BienPhapMayMocDTO dto) {
        dto.setChuKyList(kyTaiLieuDao.findById(dto.getId()));
        dto.setNguoiKyList(kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(dto.getId()));
    }

    // ─── Mutations ───────────────────────────────────────────────────────────

    @Transactional
    public BienPhapMayMoc insert(BienPhapMayMoc entity) {
        BienPhapMayMoc saved = bienPhapDao.insert(entity);
        if (saved != null && entity.getNguoiKyList() != null && !entity.getNguoiKyList().isEmpty()) {
            entity.getNguoiKyList().forEach(nk -> nk.setIdTaiLieu(saved.getId()));
            kyTaiLieuDao.updateNguoiKy(saved.getId(), entity.getNguoiKyList());
        }
        return saved;
    }

    @Transactional
    public BienPhapMayMoc update(BienPhapMayMoc entity) {
        BienPhapMayMoc oldObj = bienPhapDao.findById(entity.getId());
        List<String> keysToDelete = new ArrayList<>();
        if (oldObj != null) {
            if (oldObj.getDuongDanFile() != null && !oldObj.getDuongDanFile().isEmpty()
                    && !oldObj.getDuongDanFile().equals(entity.getDuongDanFile())) {
                keysToDelete.add(oldObj.getDuongDanFile());
            }
        }

        BienPhapMayMoc saved = bienPhapDao.update(entity);
        if (saved != null) {
            kyTaiLieuDao.delete(saved.getId());
            if (entity.getNguoiKyList() != null) {
                entity.getNguoiKyList().forEach(nk -> nk.setIdTaiLieu(saved.getId()));
                kyTaiLieuDao.updateNguoiKy(saved.getId(), entity.getNguoiKyList());
            } else {
                kyTaiLieuDao.deleteAllNguoiKy(saved.getId());
            }
            if (!keysToDelete.isEmpty()) {
                TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            for (String key : keysToDelete) {
                                try {
                                    s3Service.deleteFile(key);
                                } catch (Exception e) {
                                    // ignore
                                }
                            }
                        }
                    }
                );
            }
        }
        return saved;
    }

    public int updateGhiChu(String id, String ghiChuBienBan) {
        return bienPhapDao.updateGhiChu(id, ghiChuBienBan);
    }

    @Transactional
    public int updateTrangThai(String id, String userId) {
        BienPhapMayMoc bp = bienPhapDao.findById(id);
        if (bp == null) return 0;

        int trangThai = bp.getTrangThai() != null ? bp.getTrangThai() : 0;

        // Cập nhật ký trong NguoiKy
        NguoiKy nk = kyTaiLieuDao.getNguoiKy(userId, id);
        if (nk != null) kyTaiLieuDao.updateTrangThai(nk.getId(), "1");

        if (Objects.equals(userId, bp.getIdNguoiLap())) { bp.setNguoiLapXacNhan(true); trangThai = 1; }
        if (Objects.equals(userId, bp.getIdGiamDoc()))  { bp.setGiamDocXacNhan(true);  trangThai = 1; }

        // Kiểm tra tất cả đã ký chưa
        boolean allKy = true;
        if (bp.getIdNguoiLap() != null && !bp.getIdNguoiLap().isEmpty())
            allKy = allKy && Boolean.TRUE.equals(bp.getNguoiLapXacNhan());
        if (bp.getIdGiamDoc() != null && !bp.getIdGiamDoc().isEmpty())
            allKy = allKy && Boolean.TRUE.equals(bp.getGiamDocXacNhan());
        if (allKy) {
            List<NguoiKy> nkList = kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(id);
            if (nkList != null && !nkList.isEmpty())
                allKy = nkList.stream().allMatch(n -> n.getTrangThai() == 1);
        }
        if (allKy) trangThai = 3;

        bp.setTrangThai(trangThai);
        BienPhapMayMoc result = bienPhapDao.update(bp);
        return result != null ? result.getTrangThai() : 0;
    }

    @Transactional
    public int huy(String id) { return bienPhapDao.huy(id); }

    @Transactional
    public void bulkUpdate(List<BienPhapMayMoc> list) {
        list.forEach(bienPhapDao::update);
    }

    @Transactional
    public int delete(String id) {
        BienPhapMayMoc oldObj = bienPhapDao.findById(id);
        List<String> keysToDelete = new ArrayList<>();
        if (oldObj != null) {
            if (oldObj.getDuongDanFile() != null && !oldObj.getDuongDanFile().isEmpty()) {
                keysToDelete.add(oldObj.getDuongDanFile());
            }
        }

        kyTaiLieuDao.deleteAllNguoiKy(id);
        kyTaiLieuDao.delete(id);
        int rows = bienPhapDao.delete(id);

        if (rows > 0 && !keysToDelete.isEmpty()) {
            TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        for (String key : keysToDelete) {
                            try {
                                s3Service.deleteFile(key);
                            } catch (Exception e) {
                                // ignore
                            }
                        }
                    }
                }
            );
        }
        return rows;
    }

    // ─── Phân trang ──────────────────────────────────────────────────────────

    public PageResponse<BienPhapMayMocDTO> findAllPaged(
            String idCongTy, int page, int size,
            String sortBy, String sortDir, String search,
            Integer trangThai, String userid, Boolean isSign,
            String dateFrom, String dateTo, String idTaiSan) {

        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        List<BienPhapMayMocDTO> source = bienPhapDao.findAll(idCongTy);

        if (userid != null && !userid.isBlank()) {
            boolean shouldFilter = !"admin".equalsIgnoreCase(userid) || (isSign != null && isSign);
            if (shouldFilter) {
                List<BienPhapMayMocDTO> filtered = new ArrayList<>();
                for (BienPhapMayMocDTO item : source) {
                    if (isSign != null && isSign) {
                        if (isNeedToSign(item, userid)) filtered.add(item);
                    } else {
                        if (isUserTurnToSign(item, userid)) filtered.add(item);
                    }
                }
                source = filtered;
            }
        }

        Map<String, Long> trangThaiCounts = source.stream()
                .filter(i -> i.getTrangThai() != null)
                .collect(Collectors.groupingBy(i -> i.getTrangThai().toString(), Collectors.counting()));

        if (trangThai != null)
            source = source.stream().filter(i -> trangThai.equals(i.getTrangThai())).collect(Collectors.toList());

        if (dateFrom != null && !dateFrom.isEmpty())
            source = source.stream()
                    .filter(i -> i.getNgayTao() != null && i.getNgayTao().compareTo(dateFrom) >= 0)
                    .collect(Collectors.toList());

        if (dateTo != null && !dateTo.isEmpty()) {
            String end = dateTo + " 23:59:59";
            source = source.stream()
                    .filter(i -> i.getNgayTao() != null && i.getNgayTao().compareTo(end) <= 0)
                    .collect(Collectors.toList());
        }

        // if (idTaiSan != null && !idTaiSan.trim().isEmpty()) {
        //     List<BienPhapMayMocDTO> filtered = new ArrayList<>();
        //     for (BienPhapMayMocDTO item : source) {
        //         if (item.getIdGiamDinhMayMoc() != null && !item.getIdGiamDinhMayMoc().isEmpty()) {
        //             List<GiamDinhMayMocChiTiet> details = giamDinhMayMocChiTietDao.findByIdGiamDinh(item.getIdGiamDinhMayMoc());
        //             boolean match = details.stream().anyMatch(d -> idTaiSan.equalsIgnoreCase(d.getIdTaiSan()));
        //             if (match) {
        //                 filtered.add(item);
        //             }
        //         }
        //     }
        //     source = filtered;
        // }

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            source = source.stream()
                    .filter(i -> (i.getSoPhieu()       != null && i.getSoPhieu().toLowerCase().contains(q))
                            || (i.getSoDeNghi()        != null && i.getSoDeNghi().toLowerCase().contains(q))
                            || (i.getDonViSuaChua()    != null && i.getDonViSuaChua().toLowerCase().contains(q))
                            || (i.getDonViPhoiHop()    != null && i.getDonViPhoiHop().toLowerCase().contains(q))
                            || (i.getHinhThuc()        != null && i.getHinhThuc().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        source.sort(getComparator(sortBy, sortDir));

        long total = source.size();
        int from = Math.min(page * size, source.size());
        int to   = Math.min(from + size, source.size());
        List<BienPhapMayMocDTO> items = new ArrayList<>(source.subList(from, to));
        items.forEach(this::enrich);

        PageResponse<BienPhapMayMocDTO> resp = new PageResponse<>(items, total, page, size);
        resp.setTrangThaiCounts(trangThaiCounts);
        return resp;
    }

    // ─── Signing helpers ─────────────────────────────────────────────────────

    public boolean isNeedToSign(BienPhapMayMocDTO item, String userId) {
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

    public boolean isUserTurnToSign(BienPhapMayMocDTO item, String userId) {
        if (userId != null && userId.equals(item.getNguoiTao())) return true;
        if (!Boolean.TRUE.equals(item.getShare())) return false;

        // Bước 1: Người lập
        if (item.getIdNguoiLap() != null && !item.getIdNguoiLap().isEmpty()) {
            if (!Boolean.TRUE.equals(item.getNguoiLapXacNhan()))
                return userId != null && userId.equals(item.getIdNguoiLap());
            if (userId != null && userId.equals(item.getIdNguoiLap())) return true;
        }

        // Bước 2: NguoiKy list & Giám đốc
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
        if (Boolean.TRUE.equals(item.getGiamDocXacNhan())
                && userId != null && userId.equals(item.getIdGiamDoc()))
            return true;

        return false;
    }

    public int getPermissionSigning(BienPhapMayMocDTO item, String tenDangNhap) {
        List<Map<String, Object>> flow = new ArrayList<>();

        if (item.getIdNguoiLap() != null && !item.getIdNguoiLap().isEmpty()) {
            Map<String, Object> s = new HashMap<>();
            s.put("id", item.getIdNguoiLap());
            s.put("signed", Boolean.TRUE.equals(item.getNguoiLapXacNhan()));
            s.put("label", "Người lập: " + item.getTenNguoiLap());
            flow.add(s);
        }

        List<NguoiKy> kyList = kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId());
        if (kyList != null) {
            for (int i = 0; i < kyList.size(); i++) {
                NguoiKy nk = kyList.get(i);
                if (nk.getIdNguoiKy() != null && !nk.getIdNguoiKy().isEmpty()) {
                    Map<String, Object> s = new HashMap<>();
                    s.put("id", nk.getIdNguoiKy());
                    s.put("signed", nk.getTrangThai() == 1);
                    s.put("label", "Người ký " + (i + 1) + ": " + nk.getTenNguoiKy());
                    flow.add(s);
                }
            }
        }

        if (item.getIdGiamDoc() != null && !item.getIdGiamDoc().isEmpty()) {
            Map<String, Object> s = new HashMap<>();
            s.put("id", item.getIdGiamDoc());
            s.put("signed", Boolean.TRUE.equals(item.getGiamDocXacNhan()));
            s.put("label", "Giám đốc duyệt: " + item.getTenGiamDoc());
            flow.add(s);
        }

        flow = flow.stream()
                .filter(s -> s.get("id") != null && !((String) s.get("id")).isEmpty())
                .collect(Collectors.toList());

        int idx = -1;
        for (int i = 0; i < flow.size(); i++)
            if (Objects.equals(flow.get(i).get("id"), tenDangNhap)) { idx = i; break; }
        if (idx == -1) return 2;

        Object signedObj = flow.get(idx).get("signed");
        boolean signed = signedObj instanceof Boolean && (Boolean) signedObj;
        if (Objects.equals(item.getNguoiTao(), tenDangNhap) && signedObj != null)
            return signed ? 4 : 5;
        if (signed) return 3;
        boolean prevNotSigned = flow.subList(0, idx).stream()
                .anyMatch(s -> Boolean.FALSE.equals(s.get("signed")));
        return prevNotSigned ? 1 : 0;
    }

    // ─── Comparator ──────────────────────────────────────────────────────────

    private Comparator<BienPhapMayMocDTO> getComparator(String sortBy, String sortDir) {
        boolean asc = "asc".equalsIgnoreCase(sortDir);
        Comparator<BienPhapMayMocDTO> comp;
        switch (sortBy != null ? sortBy.toLowerCase() : "") {
            case "sophieu":
                comp = Comparator.comparing(i -> i.getSoPhieu() != null ? i.getSoPhieu() : "",
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)); break;
            case "trangthai":
                comp = Comparator.comparing(i -> i.getTrangThai() != null ? i.getTrangThai() : 0,
                        Comparator.nullsLast(Integer::compareTo)); break;
            default:
                Map<Integer, Integer> pm = new HashMap<>(); pm.put(0,1); pm.put(1,2); pm.put(3,3); pm.put(2,4);
                return Comparator.<BienPhapMayMocDTO>comparingInt(i -> pm.getOrDefault(i.getTrangThai(), 5))
                        .thenComparing(i -> i.getNgayTao() != null ? i.getNgayTao() : "",
                                Comparator.nullsLast(Comparator.reverseOrder()));
        }
        return asc ? comp : comp.reversed();
    }
}
