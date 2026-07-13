package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.BaoCaoKyThuatChiTietDao;
import com.ecotel.quanlytaisan.dao.BaoCaoKyThuatDao;
import com.ecotel.quanlytaisan.dao.KyTaiLieuDao;
import com.ecotel.quanlytaisan.model.*;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class BaoCaoKyThuatService {

    @Autowired
    private BaoCaoKyThuatDao baoCaoKyThuatDao;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private BaoCaoKyThuatChiTietDao baoCaoKyThuatChiTietDao;

    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;

    @Autowired
    private TaiSanService taiSanService;

    public List<BaoCaoKyThuatDTO> findAll(String idCongTy) {
        return baoCaoKyThuatDao.findAll(idCongTy);
    }

    public PageResponse<BaoCaoKyThuatDTO> findAllPaged(
            String idCongTy, int page, int size,
            String sortBy, String sortDir, String search,
            Integer trangThai, String userid, Boolean isSign,
            String dateFrom, String dateTo, String idTaiSan
    ) {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        List<BaoCaoKyThuatDTO> sourceList = baoCaoKyThuatDao.findAll(idCongTy);

        if (userid != null && !userid.trim().isEmpty()) {
            boolean shouldFilter = !"admin".equalsIgnoreCase(userid) || (isSign != null && isSign);
            if (shouldFilter) {
                List<BaoCaoKyThuatDTO> filtered = new ArrayList<>();
                for (BaoCaoKyThuatDTO item : sourceList) {
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
        for (BaoCaoKyThuatDTO item : sourceList) {
            if (item.getTrangThai() != null) {
                String key = item.getTrangThai().toString();
                trangThaiCounts.put(key, trangThaiCounts.getOrDefault(key, 0L) + 1);
            }
        }

        if (trangThai != null)
            sourceList = sourceList.stream()
                    .filter(i -> trangThai.equals(i.getTrangThai()))
                    .collect(Collectors.toList());
        
        
        if (idTaiSan != null && !idTaiSan.trim().isEmpty()) {
            List<String> validIds = jdbcTemplate.queryForList(
                "SELECT idBaoCaoKyThuat FROM baocaokythuat_chitiet WHERE idTaiSan = ?", 
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
        
        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase();
            sourceList = sourceList.stream()
                    .filter(i -> (i.getGhiChu() != null && i.getGhiChu().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        sourceList.sort(getComparator(sortBy, sortDir));

        long total = sourceList.size();
        int from = Math.min(page * size, sourceList.size());
        int to   = Math.min(from + size, sourceList.size());
        List<BaoCaoKyThuatDTO> items = new ArrayList<>(sourceList.subList(from, to));

        for (BaoCaoKyThuatDTO item : items) {
            item.setChuKyList(kyTaiLieuDao.findById(item.getId()));
            item.setNguoiKyList(kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId()));
            item.setDanhSachTaiSan(baoCaoKyThuatChiTietDao.findByIdBaoCao(item.getId()));
        }

        PageResponse<BaoCaoKyThuatDTO> response = new PageResponse<>(items, total, page, size);
        response.setTrangThaiCounts(trangThaiCounts);
        return response;
    }

    public boolean isNeedToSign(BaoCaoKyThuatDTO item, String userId) {
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
                    kyList.sort(Comparator.comparing(a -> a.getId() != null ? a.getId() : ""));
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
                kyList.sort(Comparator.comparing(a -> a.getId() != null ? a.getId() : ""));
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

    public boolean isUserTurnToSign(BaoCaoKyThuatDTO item, String userId) {
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

    private Comparator<BaoCaoKyThuatDTO> getComparator(String sortBy, String sortDir) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            Map<Integer, Integer> pm = new HashMap<>();
            pm.put(0, 1); pm.put(1, 2); pm.put(3, 3); pm.put(2, 4);
            return Comparator.<BaoCaoKyThuatDTO>comparingInt(i -> pm.getOrDefault(i.getTrangThai(), 5))
                    .thenComparing(i -> i.getNgayTao() != null ? i.getNgayTao() : "",
                            Comparator.nullsLast(Comparator.reverseOrder()));
        }
        boolean asc = "asc".equalsIgnoreCase(sortDir);
        Comparator<BaoCaoKyThuatDTO> comp;
        switch (sortBy.trim().toLowerCase()) {
            case "trangthai":
                comp = Comparator.comparing(i -> i.getTrangThai() != null ? i.getTrangThai() : 0,
                        Comparator.nullsLast(Integer::compareTo)); break;
            case "ngaytao": default:
                comp = Comparator.comparing(i -> i.getNgayTao() != null ? i.getNgayTao() : "",
                        Comparator.nullsLast(String::compareTo)); break;
        }
        return asc ? comp : comp.reversed();
    }

    public BaoCaoKyThuatDTO findByIdDTO(String id) {
        BaoCaoKyThuatDTO dto = baoCaoKyThuatDao.findByIdDTO(id);
        if (dto != null) {
            dto.setDanhSachTaiSan(baoCaoKyThuatChiTietDao.findByIdBaoCao(id));
        }
        return dto;
    }

    public List<BaoCaoKyThuatDTO> findByIdKeHoach(String idKeHoach) {
        List<BaoCaoKyThuatDTO> list = baoCaoKyThuatDao.findByIdKeHoach(idKeHoach);
        for (BaoCaoKyThuatDTO item : list) {
            item.setChuKyList(kyTaiLieuDao.findById(item.getId()));
            item.setNguoiKyList(kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId()));
            item.setDanhSachTaiSan(baoCaoKyThuatChiTietDao.findByIdBaoCao(item.getId()));
        }
        return list;
    }

    public BaoCaoKyThuat findById(String id) {
        return baoCaoKyThuatDao.findById(id);
    }

    @Transactional
    public BaoCaoKyThuat insert(BaoCaoKyThuatDTO dto) {
        BaoCaoKyThuat entity = new BaoCaoKyThuat();
        BeanUtils.copyProperties(dto, entity);
        BaoCaoKyThuat result = baoCaoKyThuatDao.insert(entity);
        if (result != null) {
            String recordId = result.getId();
            
            if (dto.getDanhSachTaiSan() != null && !dto.getDanhSachTaiSan().isEmpty()) {
                for (BaoCaoKyThuatChiTiet chiTiet : dto.getDanhSachTaiSan()) {
                    if (chiTiet.getIdTaiSan() != null && !chiTiet.getIdTaiSan().isEmpty()) {
                        if (taiSanService.getById(chiTiet.getIdTaiSan()) == null) {
                            throw new IllegalArgumentException("Tài sản không tồn tại: " + chiTiet.getIdTaiSan());
                        }
                    }
                    chiTiet.setId(baoCaoKyThuatChiTietDao.generateNextId());
                    chiTiet.setIdBaoCaoKyThuat(recordId);
                }
                baoCaoKyThuatChiTietDao.batchInsert(dto.getDanhSachTaiSan());
            }

            if (dto.getNguoiKyList() != null && !dto.getNguoiKyList().isEmpty()) {
                for (NguoiKy nk : dto.getNguoiKyList()) {
                    nk.setIdTaiLieu(recordId);
                }
                kyTaiLieuDao.insertNguoiKyBatch(dto.getNguoiKyList());
            }
        }
        return result;
    }

    @Transactional
    public BaoCaoKyThuat update(BaoCaoKyThuatDTO dto) {
        BaoCaoKyThuat entity = new BaoCaoKyThuat();
        BeanUtils.copyProperties(dto, entity);
        BaoCaoKyThuat result = baoCaoKyThuatDao.update(entity);
        if (result != null) {
            String recordId = result.getId();

            baoCaoKyThuatChiTietDao.deleteByIdBaoCao(recordId);
            if (dto.getDanhSachTaiSan() != null && !dto.getDanhSachTaiSan().isEmpty()) {
                for (BaoCaoKyThuatChiTiet chiTiet : dto.getDanhSachTaiSan()) {
                    if (chiTiet.getIdTaiSan() != null && !chiTiet.getIdTaiSan().isEmpty()) {
                        if (taiSanService.getById(chiTiet.getIdTaiSan()) == null) {
                            throw new IllegalArgumentException("Tài sản không tồn tại: " + chiTiet.getIdTaiSan());
                        }
                    }
                    chiTiet.setId(baoCaoKyThuatChiTietDao.generateNextId());
                    chiTiet.setIdBaoCaoKyThuat(recordId);
                }
                baoCaoKyThuatChiTietDao.batchInsert(dto.getDanhSachTaiSan());
            }

            kyTaiLieuDao.delete(recordId);
            if (dto.getNguoiKyList() != null) {
                for (NguoiKy nk : dto.getNguoiKyList()) {
                    nk.setIdTaiLieu(recordId);
                }
                kyTaiLieuDao.updateNguoiKy(recordId, dto.getNguoiKyList());
            } else {
                kyTaiLieuDao.deleteAllNguoiKy(recordId);
            }
        }
        return result;
    }

    @Transactional
    public void batchUpdate(List<BaoCaoKyThuatDTO> entities) {
        for (BaoCaoKyThuatDTO entity : entities) {
            update(entity);
        }
    }

    public int updateGhiChu(String id, String ghiChuBienBan) {
        return baoCaoKyThuatDao.updateGhiChu(id, ghiChuBienBan);
    }

    @Transactional
    public int updateTrangThai(String id, String userId) {
        BaoCaoKyThuat bc = baoCaoKyThuatDao.findById(id);
        if (bc == null) return 0;

        int trangThai = bc.getTrangThai() != null ? bc.getTrangThai() : 0;

        updateTrangThaiKy(id, userId);

        if (Objects.equals(userId, bc.getIdNguoiLap())) {
            bc.setNguoiLapXacNhan(true);
            trangThai = 1;
        }

        if (Objects.equals(userId, bc.getIdGiamDoc())) {
            bc.setGiamDocXacNhan(true);
            trangThai = 1;
        }

        boolean allKy = true;
        if (bc.getIdNguoiLap() != null && !bc.getIdNguoiLap().isEmpty()) {
            allKy = allKy && Boolean.TRUE.equals(bc.getNguoiLapXacNhan());
        }
        if (bc.getIdGiamDoc() != null && !bc.getIdGiamDoc().isEmpty()) {
            allKy = allKy && Boolean.TRUE.equals(bc.getGiamDocXacNhan());
        }

        if (allKy) {
            allKy = checkAllOtherNguoiKy(id);
        }

        if (allKy) {
            trangThai = 3;
        }

        bc.setTrangThai(trangThai);
        BaoCaoKyThuat result = baoCaoKyThuatDao.update(bc);

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
    public int huy(String id) {
        return baoCaoKyThuatDao.huy(id);
    }

    @Transactional
    public int delete(String id) {
        baoCaoKyThuatChiTietDao.deleteByIdBaoCao(id);
        kyTaiLieuDao.deleteAllNguoiKy(id);
        kyTaiLieuDao.delete(id);
        return baoCaoKyThuatDao.delete(id);
    }

    @Transactional
    public void bulkDelete(List<String> ids) {
        for (String id : ids) {
            baoCaoKyThuatChiTietDao.deleteByIdBaoCao(id);
            kyTaiLieuDao.deleteAllNguoiKy(id);
            kyTaiLieuDao.delete(id);
        }
        baoCaoKyThuatDao.batchDelete(ids);
    }
}
