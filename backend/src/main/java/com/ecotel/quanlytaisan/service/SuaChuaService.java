package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.SuaChuaChiTietTaiSanDao;
import com.ecotel.quanlytaisan.dao.SuaChuaChiTietVatTuDao;
import com.ecotel.quanlytaisan.dao.SuaChuaDao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ecotel.quanlytaisan.dao.KyTaiLieuDao;
import com.ecotel.quanlytaisan.model.*;
import org.springframework.beans.BeanUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SuaChuaService {

    @Autowired
    private SuaChuaDao suaChuaDao;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private SuaChuaChiTietTaiSanDao suaChuaChiTietTaiSanDao;

    @Autowired
    private SuaChuaChiTietVatTuDao suaChuaChiTietVatTuDao;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    @Autowired
    private TaiSanService taiSanService;

    public List<SuaChuaDTO> findAll(String idCongTy) {
        return suaChuaDao.findAll(idCongTy);
    }

    public PageResponse<SuaChuaDTO> findAllPaged(
            String idCongTy, int page, int size,
            String sortBy, String sortDir, String search,
            Integer trangThai, String userid, Boolean isSign,
            String dateFrom, String dateTo, String idTaiSan
    ) {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        List<SuaChuaDTO> sourceList = suaChuaDao.findAll(idCongTy);

        // Turn-based filter (chỉ hiển thị phiếu đến lượt user ký)
        if (userid != null && !userid.trim().isEmpty()) {
            boolean shouldFilter = !"admin".equalsIgnoreCase(userid) || (isSign != null && isSign);
            if (shouldFilter) {
                List<SuaChuaDTO> filtered = new ArrayList<>();
                for (SuaChuaDTO item : sourceList) {
                    if (isSign != null && isSign) {
                        if (isNeedToSign(item, userid)) filtered.add(item);
                    } else {
                        if (isUserTurnToSign(item, userid)) filtered.add(item);
                    }
                }
                sourceList = filtered;
            }
        }

        // Đếm theo trạng thái
        Map<String, Long> trangThaiCounts = new HashMap<>();
        for (SuaChuaDTO item : sourceList) {
            if (item.getTrangThai() != null) {
                String key = item.getTrangThai().toString();
                trangThaiCounts.put(key, trangThaiCounts.getOrDefault(key, 0L) + 1);
            }
        }

        // Filters
        if (trangThai != null)
            sourceList = sourceList.stream()
                    .filter(i -> trangThai.equals(i.getTrangThai()))
                    .collect(Collectors.toList());
        
        
        if (idTaiSan != null && !idTaiSan.trim().isEmpty()) {
            List<String> validIds = jdbcTemplate.queryForList(
                "SELECT idSuaChua FROM suachuachitiettaisan WHERE idTaiSan = ?", 
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
            String dateToEnd = dateTo + " 23:59:59";
            sourceList = sourceList.stream()
                    .filter(i -> i.getNgayTao() != null && i.getNgayTao().compareTo(dateToEnd) <= 0)
                    .collect(Collectors.toList());
        }

        if (idTaiSan != null && !idTaiSan.trim().isEmpty()) {
            List<String> validIds = jdbcTemplate.queryForList(
                "SELECT idSuaChua FROM suachuachitiettaisan WHERE idTaiSan = ?", 
                String.class, idTaiSan);
            sourceList = sourceList.stream()
                    .filter(i -> validIds.contains(i.getId()))
                    .collect(Collectors.toList());
        }
        
        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase();
            sourceList = sourceList.stream()
                    .filter(i -> (i.getIdGiamDinh() != null && i.getIdGiamDinh().toLowerCase().contains(q))
                            || (i.getSoPhieuGiamDinh() != null && i.getSoPhieuGiamDinh().toLowerCase().contains(q))
                            || (i.getGhiChuBienBan() != null && i.getGhiChuBienBan().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        sourceList.sort(getComparator(sortBy, sortDir));

        long total = sourceList.size();
        int from = Math.min(page * size, sourceList.size());
        int to   = Math.min(from + size, sourceList.size());
        List<SuaChuaDTO> items = new ArrayList<>(sourceList.subList(from, to));

        // Enrich
        for (SuaChuaDTO item : items) {
            item.setChuKyList(kyTaiLieuDao.findById(item.getId()));
            item.setNguoiKyList(kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId()));
            item.setDanhSachTaiSan(suaChuaChiTietTaiSanDao.findByIdSuaChua(item.getId()));
            item.setDanhSachVatTu(suaChuaChiTietVatTuDao.findByIdSuaChua(item.getId()));
        }

        PageResponse<SuaChuaDTO> response = new PageResponse<>(items, total, page, size);
        response.setTrangThaiCounts(trangThaiCounts);
        return response;
    }

    public boolean isNeedToSign(SuaChuaDTO item, String userId) {
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

    public boolean isUserTurnToSign(SuaChuaDTO item, String userId) {
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

    private Comparator<SuaChuaDTO> getComparator(String sortBy, String sortDir) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            Map<Integer, Integer> pm = new HashMap<>();
            pm.put(0, 1); pm.put(1, 2); pm.put(3, 3); pm.put(2, 4);
            return Comparator.<SuaChuaDTO>comparingInt(i -> pm.getOrDefault(i.getTrangThai(), 5))
                    .thenComparing(i -> i.getNgayTao() != null ? i.getNgayTao() : "",
                            Comparator.nullsLast(Comparator.reverseOrder()));
        }
        boolean asc = "asc".equalsIgnoreCase(sortDir);
        Comparator<SuaChuaDTO> comp;
        switch (sortBy.trim().toLowerCase()) {
            case "idgiamdinh":
                comp = Comparator.comparing(i -> i.getIdGiamDinh() != null ? i.getIdGiamDinh() : "",
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

    public SuaChuaDTO findByIdDTO(String id) {
        SuaChuaDTO dto = suaChuaDao.findByIdDTO(id);
        if (dto != null) {
            dto.setDanhSachTaiSan(suaChuaChiTietTaiSanDao.findByIdSuaChua(id));
            dto.setDanhSachVatTu(suaChuaChiTietVatTuDao.findByIdSuaChua(id));
        }
        return dto;
    }

    public List<SuaChuaDTO> findByIdGiamDinh(String idGiamDinh) {
        List<SuaChuaDTO> list = suaChuaDao.findByIdGiamDinh(idGiamDinh);
        for (SuaChuaDTO item : list) {
            item.setChuKyList(kyTaiLieuDao.findById(item.getId()));
            item.setNguoiKyList(kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId()));
            item.setDanhSachTaiSan(suaChuaChiTietTaiSanDao.findByIdSuaChua(item.getId()));
            item.setDanhSachVatTu(suaChuaChiTietVatTuDao.findByIdSuaChua(item.getId()));
        }
        return list;
    }

    public SuaChua findById(String id) {
        return suaChuaDao.findById(id);
    }

    @Transactional
    public SuaChua insert(SuaChuaDTO dto) {
        SuaChua entity = new SuaChua();
        BeanUtils.copyProperties(dto, entity);
        SuaChua result = suaChuaDao.insert(entity);
        if (result != null) {
            String planId = result.getId();
            
            // 1. Insert details (Tai san)
            if (dto.getDanhSachTaiSan() != null && !dto.getDanhSachTaiSan().isEmpty()) {
                for (SuaChuaChiTietTaiSan chiTiet : dto.getDanhSachTaiSan()) {
                    if (chiTiet.getIdTaiSan() != null && !chiTiet.getIdTaiSan().isEmpty()) {
                        if (taiSanService.getById(chiTiet.getIdTaiSan()) == null) {
                            throw new IllegalArgumentException("Tài sản không tồn tại: " + chiTiet.getIdTaiSan());
                        }
                    }
                    chiTiet.setId(java.util.UUID.randomUUID().toString());
                    chiTiet.setIdSuaChua(planId);
                }
                suaChuaChiTietTaiSanDao.batchInsert(dto.getDanhSachTaiSan());
            }

            // 1b. Insert details (Vat tu)
            if (dto.getDanhSachVatTu() != null && !dto.getDanhSachVatTu().isEmpty()) {
                for (SuaChuaChiTietVatTu chiTiet : dto.getDanhSachVatTu()) {
                    chiTiet.setId(java.util.UUID.randomUUID().toString());
                    chiTiet.setIdSuaChua(planId);
                }
                suaChuaChiTietVatTuDao.batchInsert(dto.getDanhSachVatTu());
            }

            // 2. Insert signers
            if (dto.getNguoiKyList() != null && !dto.getNguoiKyList().isEmpty()) {
                for (NguoiKy nk : dto.getNguoiKyList()) {
                    nk.setIdTaiLieu(planId);
                }
                kyTaiLieuDao.insertNguoiKyBatch(dto.getNguoiKyList());
            }
        }
        return result;
    }

    @Transactional
    public SuaChua update(SuaChuaDTO dto) {
        SuaChua entity = new SuaChua();
        BeanUtils.copyProperties(dto, entity);
        SuaChua result = suaChuaDao.update(entity);
        if (result != null) {
            String planId = result.getId();

            // 1. Re-insert details
            suaChuaChiTietTaiSanDao.deleteByIdSuaChua(planId);
            suaChuaChiTietVatTuDao.deleteByIdSuaChua(planId);

            if (dto.getDanhSachTaiSan() != null && !dto.getDanhSachTaiSan().isEmpty()) {
                for (SuaChuaChiTietTaiSan chiTiet : dto.getDanhSachTaiSan()) {
                    if (chiTiet.getIdTaiSan() != null && !chiTiet.getIdTaiSan().isEmpty()) {
                        if (taiSanService.getById(chiTiet.getIdTaiSan()) == null) {
                            throw new IllegalArgumentException("Tài sản không tồn tại: " + chiTiet.getIdTaiSan());
                        }
                    }
                    chiTiet.setId(java.util.UUID.randomUUID().toString());
                    chiTiet.setIdSuaChua(planId);
                }
                suaChuaChiTietTaiSanDao.batchInsert(dto.getDanhSachTaiSan());
            }

            if (dto.getDanhSachVatTu() != null && !dto.getDanhSachVatTu().isEmpty()) {
                for (SuaChuaChiTietVatTu chiTiet : dto.getDanhSachVatTu()) {
                    chiTiet.setId(java.util.UUID.randomUUID().toString());
                    chiTiet.setIdSuaChua(planId);
                }
                suaChuaChiTietVatTuDao.batchInsert(dto.getDanhSachVatTu());
            }

            // 2. Re-insert signers
            kyTaiLieuDao.delete(planId); // Clear existing drawn signatures
            if (dto.getNguoiKyList() != null) {
                for (NguoiKy nk : dto.getNguoiKyList()) {
                    nk.setIdTaiLieu(planId);
                }
                kyTaiLieuDao.updateNguoiKy(planId, dto.getNguoiKyList());
            } else {
                kyTaiLieuDao.deleteAllNguoiKy(planId);
            }
        }
        return result;
    }

    @Transactional
    public void batchUpdate(List<SuaChuaDTO> entities) {
        for (SuaChuaDTO entity : entities) {
            update(entity);
        }
    }

    public int updateGhiChu(String id, String ghiChuBienBan) {
        return suaChuaDao.updateGhiChu(id, ghiChuBienBan);
    }

    @Transactional
    public int updateTrangThai(String id, String userId) {
        SuaChua sc = suaChuaDao.findById(id);
        if (sc == null) return 0;

        int trangThai = sc.getTrangThai() != null ? sc.getTrangThai() : 0;

        // 1. Cập nhật trạng thái ký trong bảng NguoiKy
        updateTrangThaiKy(id, userId);

        // 2. Cập nhật xác nhận của Người lập
        if (Objects.equals(userId, sc.getIdNguoiLap())) {
            sc.setNguoiLapXacNhan(true);
            trangThai = 1;
        }

        // 3. Cập nhật xác nhận của Giám đốc
        if (Objects.equals(userId, sc.getIdGiamDoc())) {
            sc.setGiamDocXacNhan(true);
            trangThai = 1;
        }

        // 4. Kiểm tra xem tất cả đã ký chưa
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

        // Nếu tất cả đã ký thì chuyển trạng thái sang 3 (Đã hoàn thành)
        if (allKy) {
            trangThai = 3;
        }

        sc.setTrangThai(trangThai);
        SuaChua result = suaChuaDao.update(sc);

        return result != null ? result.getTrangThai() : 0;
    }

    private void updateTrangThaiKy(String id, String userId) {
        NguoiKy nk = kyTaiLieuDao.getNguoiKy(userId, id);
        if (nk != null) {
            kyTaiLieuDao.updateTrangThai(nk.getId(), "1");
        }
    }

    private boolean checkAllOtherNguoiKy(String id) {
        List<NguoiKy> nkList = kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(id);
        if (nkList != null && !nkList.isEmpty()) {
            for (NguoiKy nk : nkList) {
                if (nk.getTrangThai() != 1) {
                    return false;
                }
            }
        }
        return true;
    }

    @Transactional
    public int huySuaChua(String id) {
        return suaChuaDao.huySuaChua(id);
    }

    @Transactional
    public int delete(String id) {
        // Cascade delete details and signers
        suaChuaChiTietTaiSanDao.deleteByIdSuaChua(id);
        suaChuaChiTietVatTuDao.deleteByIdSuaChua(id);
        kyTaiLieuDao.deleteAllNguoiKy(id);
        kyTaiLieuDao.delete(id);
        return suaChuaDao.delete(id);
    }

    @Transactional
    public void bulkDelete(List<String> ids) {
        for (String id : ids) {
            suaChuaChiTietTaiSanDao.deleteByIdSuaChua(id);
            suaChuaChiTietVatTuDao.deleteByIdSuaChua(id);
            kyTaiLieuDao.deleteAllNguoiKy(id);
            kyTaiLieuDao.delete(id);
        }
        suaChuaDao.batchDelete(ids);
    }
}
