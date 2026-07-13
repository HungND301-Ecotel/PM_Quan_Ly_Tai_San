package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.KyTaiLieuDao;
import com.ecotel.quanlytaisan.dao.NghiemThuChiTietTaiSanDao;
import com.ecotel.quanlytaisan.dao.NghiemThuChiTietVatTuDao;
import com.ecotel.quanlytaisan.dao.NghiemThuDao;
import com.ecotel.quanlytaisan.model.NguoiKy;
import com.ecotel.quanlytaisan.model.PageResponse;
import com.ecotel.quanlytaisan.model.NghiemThu;
import com.ecotel.quanlytaisan.model.NghiemThuChiTietTaiSan;
import com.ecotel.quanlytaisan.model.NghiemThuChiTietVatTu;
import com.ecotel.quanlytaisan.model.NghiemThuDTO;
import com.ecotel.quanlytaisan.model.NghiemThuTaiSan;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NghiemThuService {

    @Autowired
    private NghiemThuDao nghiemThuDao;

    @Autowired
    private NghiemThuChiTietTaiSanDao nghiemThuTaiSanDao;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private NghiemThuChiTietTaiSanDao chiTietTaiSanDao;

    @Autowired
    private NghiemThuChiTietVatTuDao chiTietVatTuDao;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    public List<NghiemThuDTO> findAll() {
        List<NghiemThuDTO> list = nghiemThuDao.findAll();
        for (NghiemThuDTO item : list) {
            enrichDetails(item);
        }
        return list;
    }

    public PageResponse<NghiemThuDTO> findAllPaged(
            int page, int size, String sortBy, String sortDir, String search, Integer trangThai, 
            String idBienBan, String userId, Boolean isSign, String dateFrom, String dateTo,String idTaiSan) {
        
        List<NghiemThuDTO> sourceList = nghiemThuDao.findAll();

        if (userId != null && !userId.isEmpty()) {
            boolean shouldFilter = !"admin".equalsIgnoreCase(userId) || (isSign != null && isSign);
            if (shouldFilter) {
                List<NghiemThuDTO> filtered = new ArrayList<>();
                for (NghiemThuDTO item : sourceList) {
                    if (isSign != null && isSign) {
                        if (isNeedToSign(item, userId)) filtered.add(item);
                    } else {
                        if (isUserTurnToSign(item, userId)) filtered.add(item);
                    }
                }
                sourceList = filtered;
            }
        }

        Map<String, Long> trangThaiCounts = new java.util.HashMap<>();
        for (NghiemThuDTO item : sourceList) {
            if (item.getTrangThai() != null) {
                String key = item.getTrangThai().toString();
                trangThaiCounts.put(key, trangThaiCounts.getOrDefault(key, 0L) + 1);
            }
        }

        if (trangThai != null) {
            sourceList = sourceList.stream()
                .filter(i -> trangThai.equals(i.getTrangThai()))
                .collect(Collectors.toList());
        }

        if (idBienBan != null && !idBienBan.isEmpty()) {
            sourceList = sourceList.stream()
                .filter(i -> idBienBan.equals(i.getIdBienBan()))
                .collect(Collectors.toList());
        }

        
        if (idTaiSan != null && !idTaiSan.trim().isEmpty()) {
            List<String> validIds = jdbcTemplate.queryForList(
                "SELECT idNghiemThu FROM nghiemthu_chitiettaisan WHERE idTaiSan = ?", 
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
                "SELECT idNghiemThu FROM nghiemthu_chitiettaisan WHERE idTaiSan = ?", 
                String.class, idTaiSan);
            sourceList = sourceList.stream()
                    .filter(i -> validIds.contains(i.getId()))
                    .collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase();
            sourceList = sourceList.stream()
                .filter(i -> (i.getSoPhieuBienBan() != null && i.getSoPhieuBienBan().toLowerCase().contains(q)) ||
                             (i.getTenDonViQuanLy() != null && i.getTenDonViQuanLy().toLowerCase().contains(q)))
                .collect(Collectors.toList());
        }

        long total = sourceList.size();
        sourceList.sort(getComparator(sortBy, sortDir));
        
        int from = Math.min(page * size, sourceList.size());
        int to = Math.min(from + size, sourceList.size());
        
        List<NghiemThuDTO> items = new ArrayList<>(sourceList.subList(from, to));
        for (NghiemThuDTO item : items) {
            enrichDetails(item);
        }
        
        PageResponse<NghiemThuDTO> response = new PageResponse<>(items, total, page, size);
        response.setTrangThaiCounts(trangThaiCounts);
        return response;
    }

    public boolean isNeedToSign(NghiemThuDTO item, String userId) {
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
                if (allSigned && !Boolean.TRUE.equals(item.getGiamDocXacNhan())) {
                    if (item.getIdGiamDoc() != null) return userId.equalsIgnoreCase(item.getIdGiamDoc());
                }
            } else {
                if (!Boolean.TRUE.equals(item.getGiamDocXacNhan())) {
                    if (item.getIdGiamDoc() != null) return userId.equalsIgnoreCase(item.getIdGiamDoc());
                }
            }
        }
        return false;
    }

    public boolean isUserTurnToSign(NghiemThuDTO item, String userId) {
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
                if (allSigned && !Boolean.TRUE.equals(item.getGiamDocXacNhan())) {
                    if (item.getIdGiamDoc() != null) return userId != null && userId.equalsIgnoreCase(item.getIdGiamDoc());
                }
            } else {
                if (!Boolean.TRUE.equals(item.getGiamDocXacNhan())) {
                    if (item.getIdGiamDoc() != null) return userId != null && userId.equalsIgnoreCase(item.getIdGiamDoc());
                }
            }
        }
        if (Boolean.TRUE.equals(item.getGiamDocXacNhan())
                && item.getIdGiamDoc() != null && userId != null && userId.equals(item.getIdGiamDoc()))
            return true;

        return false;
    }

    private Comparator<NghiemThuDTO> getComparator(String sortBy, String sortDir) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            Map<Integer, Integer> pm = Map.of(0, 1, 1, 2, 3, 3, 2, 4);
            return Comparator.<NghiemThuDTO>comparingInt(i -> pm.getOrDefault(i.getTrangThai(), 5))
                    .thenComparing(i -> i.getNgayTao() != null ? i.getNgayTao() : "", Comparator.nullsLast(Comparator.reverseOrder()));
        }
        boolean asc = "asc".equalsIgnoreCase(sortDir);
        Comparator<NghiemThuDTO> comp;
        switch (sortBy.trim().toLowerCase()) {
            case "trangthai":
                comp = Comparator.comparing(i -> i.getTrangThai() != null ? i.getTrangThai() : 0, Comparator.nullsLast(Integer::compareTo)); break;
            case "ngaytao": default:
                comp = Comparator.comparing(i -> i.getNgayTao() != null ? i.getNgayTao() : "", Comparator.nullsLast(String::compareTo)); break;
        }
        return asc ? comp : comp.reversed();
    }

    public NghiemThuDTO findByIdDTO(String id) {
        NghiemThuDTO dto = nghiemThuDao.findByIdDTO(id);
        if (dto != null) enrichDetails(dto);
        return dto;
    }

    public List<NghiemThuDTO> findByIdBienBan(String idBienBan) {
        List<NghiemThuDTO> list = nghiemThuDao.findByIdBienBan(idBienBan);
        for (NghiemThuDTO item : list) {
            enrichDetails(item);
        }
        return list;
    }

    private void enrichDetails(NghiemThuDTO item) {
        item.setDanhSachTaiSan(chiTietTaiSanDao.findByIdNghiemThu(item.getId()));
        item.setDanhSachVatTu(chiTietVatTuDao.findByIdNghiemThu(item.getId()));
        enrichSignatures(item);
    }

    private void enrichSignatures(NghiemThuDTO item) {
        item.setChuKyList(kyTaiLieuDao.findById(item.getId()));
        item.setNguoiKyList(kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId()));
    }

    @Transactional
    public NghiemThu insert(NghiemThuDTO dto) {
        NghiemThu entity = new NghiemThu();
        copyProperties(dto, entity);
        NghiemThu result = nghiemThuDao.insert(entity);
        
        String planId = result.getId();
        
        if (dto.getDanhSachTaiSan() != null) {
            for (NghiemThuChiTietTaiSan chiTiet : dto.getDanhSachTaiSan()) {
                chiTiet.setIdNghiemThu(planId);
                if (chiTiet.getId() == null || chiTiet.getId().isEmpty()) {
                    chiTiet.setId(UUID.randomUUID().toString());
                }
            }
            chiTietTaiSanDao.batchInsert(dto.getDanhSachTaiSan());
        }
        
        if (dto.getDanhSachVatTu() != null) {
            for (NghiemThuChiTietVatTu chiTiet : dto.getDanhSachVatTu()) {
                chiTiet.setIdNghiemThu(planId);
                if (chiTiet.getId() == null || chiTiet.getId().isEmpty()) {
                    chiTiet.setId(UUID.randomUUID().toString());
                }
            }
            chiTietVatTuDao.batchInsert(dto.getDanhSachVatTu());
        }
        
        if (dto.getNguoiKyList() != null && !dto.getNguoiKyList().isEmpty()) {
            for (NguoiKy nk : dto.getNguoiKyList()) {
                if (nk.getId() == null || nk.getId().isEmpty() || nk.getId().startsWith("temp_")) {
                    nk.setId(UUID.randomUUID().toString());
                }
                nk.setIdTaiLieu(planId);
            }
            kyTaiLieuDao.insertNguoiKyBatch(dto.getNguoiKyList());
        }
        return result;
    }

    @Transactional
    public NghiemThu update(NghiemThuDTO dto) {
        NghiemThu entity = new NghiemThu();
        copyProperties(dto, entity);
        NghiemThu result = nghiemThuDao.update(entity);
        
        String planId = result.getId();
        
        chiTietTaiSanDao.deleteByIdNghiemThu(planId);
        chiTietVatTuDao.deleteByIdNghiemThu(planId);
        
        if (dto.getDanhSachTaiSan() != null) {
            for (NghiemThuChiTietTaiSan chiTiet : dto.getDanhSachTaiSan()) {
                chiTiet.setIdNghiemThu(planId);
                if (chiTiet.getId() == null || chiTiet.getId().isEmpty()) {
                    chiTiet.setId(UUID.randomUUID().toString());
                }
            }
            chiTietTaiSanDao.batchInsert(dto.getDanhSachTaiSan());
        }
        
        if (dto.getDanhSachVatTu() != null) {
            for (NghiemThuChiTietVatTu chiTiet : dto.getDanhSachVatTu()) {
                chiTiet.setIdNghiemThu(planId);
                if (chiTiet.getId() == null || chiTiet.getId().isEmpty()) {
                    chiTiet.setId(UUID.randomUUID().toString());
                }
            }
            chiTietVatTuDao.batchInsert(dto.getDanhSachVatTu());
        }
        
        kyTaiLieuDao.deleteAllNguoiKy(planId);
        if (dto.getNguoiKyList() != null && !dto.getNguoiKyList().isEmpty()) {
            for (NguoiKy nk : dto.getNguoiKyList()) {
                if (nk.getId() == null || nk.getId().isEmpty() || nk.getId().startsWith("temp_")) {
                    nk.setId(UUID.randomUUID().toString());
                }
                nk.setIdTaiLieu(planId);
            }
            kyTaiLieuDao.insertNguoiKyBatch(dto.getNguoiKyList());
        }
        return result;
    }

    @Transactional
    public void delete(String id) {
        NghiemThu p = nghiemThuDao.findById(id);
        if (p != null) {
            chiTietTaiSanDao.deleteByIdNghiemThu(id);
            chiTietVatTuDao.deleteByIdNghiemThu(id);
            kyTaiLieuDao.deleteAllNguoiKy(id);
            kyTaiLieuDao.delete(id);
            nghiemThuDao.delete(id);
        }
    }

    @Transactional
    public int updateTrangThai(String id, String userId) {
        NghiemThu p = nghiemThuDao.findById(id);
        if (p == null) return 0;

        int trangThai = p.getTrangThai() != null ? p.getTrangThai() : 0;

        // 1. Cập nhật trạng thái ký trong bảng NguoiKy
        NguoiKy nk = kyTaiLieuDao.getNguoiKy(userId, id);
        if (nk != null) {
            kyTaiLieuDao.updateTrangThai(nk.getId(), "1");
        }

        // 2. Cập nhật xác nhận của Người lập
        if (userId.equals(p.getIdNguoiLap())) {
            p.setNguoiLapXacNhan(true);
            trangThai = 1;
        }

        // 3. Cập nhật xác nhận của Giám đốc
        if (userId.equals(p.getIdGiamDoc())) {
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
        NghiemThu result = nghiemThuDao.update(p);

        return result != null ? result.getTrangThai() : 0;
    }

    private void copyProperties(NghiemThuDTO source, NghiemThu target) {
        target.setId(source.getId());
        target.setIdBienBan(source.getIdBienBan());
        target.setDonViQuanLy(source.getDonViQuanLy());
        target.setNoiDungSuaChua(source.getNoiDungSuaChua());
        target.setKetQua(source.getKetQua());
        target.setIdNguoiLap(source.getIdNguoiLap());
        target.setNguoiLapXacNhan(source.getNguoiLapXacNhan());
        target.setIdGiamDoc(source.getIdGiamDoc());
        target.setGiamDocXacNhan(source.getGiamDocXacNhan());
        target.setShare(source.getShare());
        target.setTrangThai(source.getTrangThai());
        target.setNgayTao(source.getNgayTao());
        target.setNguoiTao(source.getNguoiTao());
    }
    public int updateGhiChu(String id, String ghiChuBienBan) {
        return nghiemThuDao.updateGhiChu(id, ghiChuBienBan);
    }
}
