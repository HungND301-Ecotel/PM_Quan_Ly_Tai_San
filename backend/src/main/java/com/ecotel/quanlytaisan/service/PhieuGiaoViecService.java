package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.PhieuGiaoViecChiTietTaiSanDao;
import com.ecotel.quanlytaisan.dao.PhieuGiaoViecChiTietVatTuDao;
import com.ecotel.quanlytaisan.dao.PhieuGiaoViecDao;
import com.ecotel.quanlytaisan.dao.KyTaiLieuDao;
import com.ecotel.quanlytaisan.model.*;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PhieuGiaoViecService {

    @Autowired
    private PhieuGiaoViecDao phieuGiaoViecDao;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private PhieuGiaoViecChiTietTaiSanDao chiTietTaiSanDao;

    @Autowired
    private PhieuGiaoViecChiTietVatTuDao chiTietVatTuDao;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    public List<PhieuGiaoViecDTO> findAll() {
        List<PhieuGiaoViecDTO> list = phieuGiaoViecDao.findAll();
        for (PhieuGiaoViecDTO item : list) {
            enrichDetails(item);
        }
        return list;
    }

    public PageResponse<PhieuGiaoViecDTO> findAllPaged(
            int page, int size,
            String sortBy, String sortDir, String search,
            Integer trangThai, String userid, Boolean isSign,
            String dateFrom, String dateTo, String idTaiSan
    ) {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        List<PhieuGiaoViecDTO> sourceList = phieuGiaoViecDao.findAll();

        if (userid != null && !userid.trim().isEmpty()) {
            boolean shouldFilter = !"admin".equalsIgnoreCase(userid) || (isSign != null && isSign);
            if (shouldFilter) {
                List<PhieuGiaoViecDTO> filtered = new ArrayList<>();
                for (PhieuGiaoViecDTO item : sourceList) {
                    if (isSign != null && isSign) {
                        if (isNeedToSign(item, userid)) filtered.add(item);
                    } else {
                        if (isUserTurnToSign(item, userid)) filtered.add(item);
                    }
                }
                sourceList = filtered;
            }
        }

        Map<String, Long> trangThaiCounts = new HashMap<>();
        for (PhieuGiaoViecDTO item : sourceList) {
            if (item.getTrangThai() != null) {
                String key = item.getTrangThai().toString();
                trangThaiCounts.put(key, trangThaiCounts.getOrDefault(key, 0L) + 1);
            }
        }

        if (trangThai != null)
            sourceList = sourceList.stream()
                    .filter(i -> trangThai.equals(i.getTrangThai()))
                    .collect(java.util.stream.Collectors.toList());
        
        
        if (idTaiSan != null && !idTaiSan.trim().isEmpty()) {
            List<String> validIds = jdbcTemplate.queryForList(
                "SELECT idPhieuGiaoViec FROM phieugiaoviec_chitiettaisan WHERE idTaiSan = ?", 
                String.class, idTaiSan);
            sourceList = sourceList.stream()
                    .filter(i -> validIds.contains(i.getId()))
                    .collect(Collectors.toList());
        }
if (dateFrom != null && !dateFrom.isEmpty()) {
            sourceList = sourceList.stream()
                    .filter(i -> i.getNgayTao() != null && i.getNgayTao().compareTo(dateFrom) >= 0)
                    .collect(java.util.stream.Collectors.toList());
        }
        if (dateTo != null && !dateTo.isEmpty()) {
            String dateToEnd = dateTo + " 23:59:59";
            sourceList = sourceList.stream()
                    .filter(i -> i.getNgayTao() != null && i.getNgayTao().compareTo(dateToEnd) <= 0)
                    .collect(java.util.stream.Collectors.toList());
        }
        
        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase();
            sourceList = sourceList.stream()
                    .filter(i -> (i.getSoPhieu() != null && i.getSoPhieu().toLowerCase().contains(q)))
                    .collect(java.util.stream.Collectors.toList());
        }

        sourceList.sort(getComparator(sortBy, sortDir));

        long total = sourceList.size();
        int from = Math.min(page * size, sourceList.size());
        int to   = Math.min(from + size, sourceList.size());
        List<PhieuGiaoViecDTO> items = new ArrayList<>(sourceList.subList(from, to));

        for (PhieuGiaoViecDTO item : items) {
            enrichDetails(item);
        }

        PageResponse<PhieuGiaoViecDTO> response = new PageResponse<>(items, total, page, size);
        response.setTrangThaiCounts(trangThaiCounts);
        return response;
    }

    public boolean isNeedToSign(PhieuGiaoViecDTO item, String userId) {
        if (userId == null || userId.isEmpty()) return false;
        
        if (item.getTrangThai() != null && (item.getTrangThai() == 2 || item.getTrangThai() == 3)) {
            return false;
        }

        if (!Boolean.TRUE.equals(item.getShare())) {
            boolean isCreatorAndFirstSigner = false;
            if (item.getIdNguoiLap() != null && !item.getIdNguoiLap().isEmpty()) {
                if (userId.equalsIgnoreCase(item.getNguoiTao()) && userId.equalsIgnoreCase(item.getIdNguoiLap())) {
                    if (!Boolean.TRUE.equals(item.getNguoiLapXacNhan())) {
                        isCreatorAndFirstSigner = true;
                    }
                }
            } else {
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
            if (!isCreatorAndFirstSigner) return false;
        }

        if (item.getIdNguoiLap() != null && !item.getIdNguoiLap().isEmpty()) {
            if (!Boolean.TRUE.equals(item.getNguoiLapXacNhan()))
                return userId.equalsIgnoreCase(item.getIdNguoiLap());
        }

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

    public boolean isUserTurnToSign(PhieuGiaoViecDTO item, String userId) {
        if (userId != null && userId.equals(item.getNguoiTao())) return true;
        if (!Boolean.TRUE.equals(item.getShare())) return false;

        if (item.getIdNguoiLap() != null && !item.getIdNguoiLap().isEmpty()) {
            if (!Boolean.TRUE.equals(item.getNguoiLapXacNhan()))
                return userId != null && userId.equals(item.getIdNguoiLap());
            if (userId != null && userId.equals(item.getIdNguoiLap())) return true;
        }

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

    private Comparator<PhieuGiaoViecDTO> getComparator(String sortBy, String sortDir) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            Map<Integer, Integer> pm = new HashMap<>();
            pm.put(0, 1); pm.put(1, 2); pm.put(3, 3); pm.put(2, 4);
            return Comparator.<PhieuGiaoViecDTO>comparingInt(i -> pm.getOrDefault(i.getTrangThai(), 5))
                    .thenComparing(i -> i.getNgayTao() != null ? i.getNgayTao() : "",
                            Comparator.nullsLast(Comparator.reverseOrder()));
        }
        boolean asc = "asc".equalsIgnoreCase(sortDir);
        Comparator<PhieuGiaoViecDTO> comp;
        switch (sortBy.trim().toLowerCase()) {
            case "sophieu":
                comp = Comparator.comparing(i -> i.getSoPhieu() != null ? i.getSoPhieu() : "",
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

    public List<PhieuGiaoViecDTO> findByIdSuaChua(String idSuaChua) {
        List<PhieuGiaoViecDTO> list = phieuGiaoViecDao.findByIdSuaChua(idSuaChua);
        for (PhieuGiaoViecDTO item : list) {
            enrichDetails(item);
        }
        return list;
    }

    public PhieuGiaoViecDTO findByIdDTO(String id) {
        PhieuGiaoViecDTO dto = phieuGiaoViecDao.findByIdDTO(id);
        if (dto != null) enrichDetails(dto);
        return dto;
    }

    private void enrichDetails(PhieuGiaoViecDTO item) {
        item.setChuKyList(kyTaiLieuDao.findById(item.getId()));
        item.setNguoiKyList(kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId()));
        item.setDanhSachTaiSan(chiTietTaiSanDao.findByIdPhieuGiaoViec(item.getId()));
        item.setDanhSachVatTu(chiTietVatTuDao.findByIdPhieuGiaoViec(item.getId()));
    }

    @Transactional
    public PhieuGiaoViec insert(PhieuGiaoViecDTO dto) {
        PhieuGiaoViec entity = new PhieuGiaoViec();
        BeanUtils.copyProperties(dto, entity);
        PhieuGiaoViec result = phieuGiaoViecDao.insert(entity);
        if (result != null) {
            String planId = result.getId();
            
            // 1. Insert details (Tai san)
            if (dto.getDanhSachTaiSan() != null && !dto.getDanhSachTaiSan().isEmpty()) {
                for (PhieuGiaoViecChiTietTaiSan chiTiet : dto.getDanhSachTaiSan()) {
                    chiTiet.setId(java.util.UUID.randomUUID().toString());
                    chiTiet.setIdPhieuGiaoViec(planId);
                }
                chiTietTaiSanDao.batchInsert(dto.getDanhSachTaiSan());
            }

            // 1b. Insert details (Vat tu)
            if (dto.getDanhSachVatTu() != null && !dto.getDanhSachVatTu().isEmpty()) {
                for (PhieuGiaoViecChiTietVatTu chiTiet : dto.getDanhSachVatTu()) {
                    chiTiet.setId(java.util.UUID.randomUUID().toString());
                    chiTiet.setIdPhieuGiaoViec(planId);
                }
                chiTietVatTuDao.batchInsert(dto.getDanhSachVatTu());
            }

            // 2. Insert signers
            if (dto.getNguoiKyList() != null && !dto.getNguoiKyList().isEmpty()) {
                for (NguoiKy nk : dto.getNguoiKyList()) {
                    if (nk.getId() == null || nk.getId().isEmpty() || nk.getId().startsWith("temp_")) {
                        nk.setId(java.util.UUID.randomUUID().toString());
                    }
                    nk.setIdTaiLieu(planId);
                }
                kyTaiLieuDao.insertNguoiKyBatch(dto.getNguoiKyList());
            }
        }
        return result;
    }

    @Transactional
    public PhieuGiaoViec update(PhieuGiaoViecDTO dto) {
        PhieuGiaoViec entity = new PhieuGiaoViec();
        BeanUtils.copyProperties(dto, entity);
        PhieuGiaoViec result = phieuGiaoViecDao.update(entity);
        if (result != null) {
            String planId = result.getId();

            // 1. Re-insert details
            chiTietTaiSanDao.deleteByIdPhieuGiaoViec(planId);
            chiTietVatTuDao.deleteByIdPhieuGiaoViec(planId);

            if (dto.getDanhSachTaiSan() != null && !dto.getDanhSachTaiSan().isEmpty()) {
                for (PhieuGiaoViecChiTietTaiSan chiTiet : dto.getDanhSachTaiSan()) {
                    chiTiet.setId(java.util.UUID.randomUUID().toString());
                    chiTiet.setIdPhieuGiaoViec(planId);
                }
                chiTietTaiSanDao.batchInsert(dto.getDanhSachTaiSan());
            }

            if (dto.getDanhSachVatTu() != null && !dto.getDanhSachVatTu().isEmpty()) {
                for (PhieuGiaoViecChiTietVatTu chiTiet : dto.getDanhSachVatTu()) {
                    chiTiet.setId(java.util.UUID.randomUUID().toString());
                    chiTiet.setIdPhieuGiaoViec(planId);
                }
                chiTietVatTuDao.batchInsert(dto.getDanhSachVatTu());
            }

            // 2. Re-insert signers
            kyTaiLieuDao.delete(planId);
            if (dto.getNguoiKyList() != null) {
                for (NguoiKy nk : dto.getNguoiKyList()) {
                    if (nk.getId() == null || nk.getId().isEmpty() || nk.getId().startsWith("temp_")) {
                        nk.setId(java.util.UUID.randomUUID().toString());
                    }
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
    public void batchUpdate(List<PhieuGiaoViecDTO> entities) {
        for (PhieuGiaoViecDTO entity : entities) {
            update(entity);
        }
    }

    @Transactional
    public int updateTrangThai(String id, String userId) {
        PhieuGiaoViec p = phieuGiaoViecDao.findById(id);
        if (p == null) return 0;

        int trangThai = p.getTrangThai() != null ? p.getTrangThai() : 0;

        // 1. Cập nhật trạng thái ký trong bảng NguoiKy
        NguoiKy nk = kyTaiLieuDao.getNguoiKy(userId, id);
        if (nk != null) {
            kyTaiLieuDao.updateTrangThai(nk.getId(), "1");
        }

        // 2. Cập nhật xác nhận của Người lập
        if (Objects.equals(userId, p.getIdNguoiLap())) {
            p.setNguoiLapXacNhan(true);
            trangThai = 1;
        }

        // 3. Cập nhật xác nhận của Giám đốc
        if (Objects.equals(userId, p.getIdGiamDoc())) {
            p.setGiamDocXacNhan(true);
            trangThai = 1;
        }

        // 4. Kiểm tra xem tất cả đã ký chưa
        boolean allKy = true;
        if (p.getIdNguoiLap() != null && !p.getIdNguoiLap().isEmpty()) {
            allKy = allKy && Boolean.TRUE.equals(p.getNguoiLapXacNhan());
        }
        if (p.getIdGiamDoc() != null && !p.getIdGiamDoc().isEmpty()) {
            allKy = allKy && Boolean.TRUE.equals(p.getGiamDocXacNhan());
        }

        if (allKy) {
            List<NguoiKy> nkList = kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(id);
            if (nkList != null && !nkList.isEmpty()) {
                for (NguoiKy n : nkList) {
                    if (n.getTrangThai() != 1) {
                        allKy = false;
                        break;
                    }
                }
            }
        }

        if (allKy) {
            trangThai = 3; // Hoàn thành
        }

        p.setTrangThai(trangThai);
        PhieuGiaoViec result = phieuGiaoViecDao.update(p);

        return result != null ? result.getTrangThai() : 0;
    }

    @Transactional
    public int huyPhieu(String id) {
        return phieuGiaoViecDao.huyPhieu(id);
    }

    @Transactional
    public int delete(String id) {
        chiTietTaiSanDao.deleteByIdPhieuGiaoViec(id);
        chiTietVatTuDao.deleteByIdPhieuGiaoViec(id);
        kyTaiLieuDao.deleteAllNguoiKy(id);
        kyTaiLieuDao.delete(id);
        return phieuGiaoViecDao.delete(id);
    }

    @Transactional
    public void bulkDelete(List<String> ids) {
        for (String id : ids) {
            chiTietTaiSanDao.deleteByIdPhieuGiaoViec(id);
            chiTietVatTuDao.deleteByIdPhieuGiaoViec(id);
            kyTaiLieuDao.deleteAllNguoiKy(id);
            kyTaiLieuDao.delete(id);
        }
        phieuGiaoViecDao.batchDelete(ids);
    }
    public int updateGhiChu(String id, String ghiChuBienBan) {
        return phieuGiaoViecDao.updateGhiChu(id, ghiChuBienBan);
    }
}
