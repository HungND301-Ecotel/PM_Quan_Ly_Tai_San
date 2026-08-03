package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.BanGiaoTaiSanDao;
import com.ecotel.quanlytaisan.dao.ChiTietBanGiaoTaiSanDao;
import com.ecotel.quanlytaisan.dao.KyTaiLieuDao;
import com.ecotel.quanlytaisan.dao.NhanVienDao;
import com.ecotel.quanlytaisan.dao.TaiSanDao;
import com.ecotel.quanlytaisan.dao.DieuDongTaiSanDao;
import com.ecotel.quanlytaisan.model.*;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.*;

@Service
public class BanGiaoTaiSanService {
    @Autowired
    private final BanGiaoTaiSanDao dao;
    @Autowired
    private ChiTietBanGiaoTaiSanDao chiTietBanGiaoTaiSanDao;
    @Autowired
    private NhanVienDao nhanVienDao;
    @Autowired
    private KyTaiLieuDao kyTaiLieuDao;
    @Autowired
    private S3Service s3Service;
    @Autowired
    private TaiSanDao taiSanDao;
    @Autowired
    private DieuDongTaiSanDao dieuDongTaiSanDao;
    @Autowired
    private LichSuDieuChuyenTaiSanService lichSuDieuChuyenTaiSanService;
    public BanGiaoTaiSanService() {
        this.dao = new BanGiaoTaiSanDao();
    }

    public List<BanGiaoTaiSanDTO> findAll(String idCongTy) throws SQLException {
        List<BanGiaoTaiSanDTO> banGiaoTaiSanDTOList = dao.findAll(idCongTy);
        for (int i = 0; i < banGiaoTaiSanDTOList.size(); i++) {
            BanGiaoTaiSanDTO banGiaoTaiSanDTO = banGiaoTaiSanDTOList.get(i);
            List<ChiTietBanGiaoTaiSanDTO> chiTietBanGiaoTaiSanDTOS = chiTietBanGiaoTaiSanDao
                    .findAll(banGiaoTaiSanDTO.getId());
            banGiaoTaiSanDTO.setChiTietBanGiaoTaiSan(chiTietBanGiaoTaiSanDTOS);
            banGiaoTaiSanDTOList.set(i, banGiaoTaiSanDTO);
        }
        return banGiaoTaiSanDTOList;
    }

    public PageResponse<BanGiaoTaiSanDTO> findAllPaged(String idCongTy, int page, int size, String sortBy,
                                                       String sortDir, String search, String userid, Integer trangThai, String idDonViGiao, Boolean isSign) throws SQLException {
        if (page < 0)
            page = 0;
        if (size <= 0)
            size = 20;

        List<BanGiaoTaiSanDTO> sourceList;
        sourceList = findAll(idCongTy);

        // Filter theo lượt ký - chỉ lấy những item mà đến lượt user ký
        // Ngoại lệ: admin lấy hết, NguoiTao cũng lấy không phân biệt thứ tự
        if (userid != null && !userid.trim().isEmpty()) {
            boolean shouldFilter = !"admin".equalsIgnoreCase(userid) || (isSign != null && isSign);
            if (shouldFilter) {
                List<BanGiaoTaiSanDTO> filtered = new ArrayList<>();
                for (BanGiaoTaiSanDTO item : sourceList) {
                    if (isSign != null && isSign) {
                        if (isNeedToSign(item, userid)) filtered.add(item);
                    } else {
                        if (isUserTurnToSign(item, userid)) filtered.add(item);
                    }
                }
                sourceList = filtered;
            }
        }

        // Filter by idDonViGiao if provided
        if (idDonViGiao != null && !idDonViGiao.trim().isEmpty()) {
            List<BanGiaoTaiSanDTO> donViGiaoFiltered = new ArrayList<>();
            for (BanGiaoTaiSanDTO item : sourceList) {
                if (item != null && item.getIdDonViGiao() != null && item.getIdDonViGiao().equals(idDonViGiao)) {
                    donViGiaoFiltered.add(item);
                }
            }
            sourceList = donViGiaoFiltered;
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase();
            List<BanGiaoTaiSanDTO> filtered = new ArrayList<>();
            for (BanGiaoTaiSanDTO item : sourceList) {
                if (item != null && item.toString() != null && item.toString().toLowerCase().contains(q)) {
                    filtered.add(item);
                }
            }
            sourceList = filtered;
        }

        // --- TÍNH TOÁN COUNTS (Trước khi lọc trạng thái) ---
        Map<String, Long> groupCounts = new java.util.HashMap<>();
        for (BanGiaoTaiSanDTO item : sourceList) {
            if (item != null && item.getTrangThai() != null) {
                String key = item.getTrangThai().toString();
                groupCounts.put(key, groupCounts.getOrDefault(key, 0L) + 1);
            }
        }

        // Filter by trangThaiPhieu if trangThai != 4
        if (trangThai != null && trangThai != 4) {
            List<BanGiaoTaiSanDTO> trangThaiFiltered = new ArrayList<>();
            for (BanGiaoTaiSanDTO item : sourceList) {
                if (item != null && item.getTrangThai() != null && item.getTrangThai().equals(trangThai)) {
                    trangThaiFiltered.add(item);
                }
            }
            sourceList = trangThaiFiltered;
        }

        // Apply sorting
        sourceList.sort(getComparator(sortBy, sortDir));

        long total = sourceList.size();
        int from = Math.min(page * size, sourceList.size());
        int to = Math.min(from + size, sourceList.size());
        List<BanGiaoTaiSanDTO> items = sourceList.subList(from, to);
        for (BanGiaoTaiSanDTO item : items) {
            item.setChuKyList(kyTaiLieuDao.findById(item.getId()));
            item.setNguoiKyList(kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId()));
        }
        for (int i = 0; i < items.size(); i++) {
            BanGiaoTaiSanDTO banGiaoTaiSanDTO = items.get(i);
            List<ChiTietBanGiaoTaiSanDTO> chiTietBanGiaoTaiSanDTOS = chiTietBanGiaoTaiSanDao
                    .findAll(banGiaoTaiSanDTO.getId());
            banGiaoTaiSanDTO.setChiTietBanGiaoTaiSan(chiTietBanGiaoTaiSanDTOS);
            items.set(i, banGiaoTaiSanDTO);
        }

        PageResponse<BanGiaoTaiSanDTO> response = new PageResponse<>(items, total, page, size);
        response.setGroupCounts(groupCounts);
        return response;
    }

    /**
     * Comparator cho BanGiaoTaiSanDTO.
     * - Nếu sortBy null hoặc rỗng: sắp xếp mặc định theo trạng thái ưu tiên (0,1,3,2) rồi ngày tạo giảm dần.
     * - Ngược lại, sắp xếp theo trường được chỉ định.
     */
    private Comparator<BanGiaoTaiSanDTO> getComparator(String sortBy, String sortDir) {
        // Nếu không có sortBy, dùng sắp xếp mặc định: theo trạng thái ưu tiên, rồi ngày tạo giảm dần
        if (sortBy == null || sortBy.trim().isEmpty()) {
            Map<Integer, Integer> priorityMap = new HashMap<>();
            priorityMap.put(0, 1); // Nháp
            priorityMap.put(1, 2); // Duyệt
            priorityMap.put(3, 3); // Hoàn thành
            priorityMap.put(2, 4); // Hủy

            Comparator<BanGiaoTaiSanDTO> comparator = Comparator.comparingInt(
                    item -> priorityMap.getOrDefault(item.getTrangThai(), 5)
            );

            // Sau đó so sánh theo ngày tạo (mới nhất trước)
            comparator = comparator.thenComparing(
                    item -> item.getNgayTao() != null ? item.getNgayTao() : "",
                    Comparator.nullsLast(Comparator.reverseOrder())
            );
            return comparator;
        }

        // Nếu có sortBy, xử lý như cũ
        String normalizedSortBy = sortBy.trim().toLowerCase();
        boolean ascending = sortDir != null && sortDir.equalsIgnoreCase("asc");

        Comparator<BanGiaoTaiSanDTO> comparator = null;

        switch (normalizedSortBy) {
            case "bangaotaisan":
                comparator = Comparator.comparing(
                        item -> item.getBanGiaoTaiSan() != null ? item.getBanGiaoTaiSan() : "",
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                break;
            case "quyetdinhdieudongso":
                comparator = Comparator.comparing(
                        item -> item.getQuyetDinhDieuDongSo() != null ? item.getQuyetDinhDieuDongSo() : "",
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                break;
            case "ngaybangiao":
                comparator = Comparator.comparing(
                        item -> item.getNgayBanGiao() != null ? item.getNgayBanGiao() : "",
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                break;
            case "ngaytao":
                comparator = Comparator.comparing(
                        item -> item.getNgayTao() != null ? item.getNgayTao() : "",
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                break;
            case "ngaycapnhat":
            default:
                comparator = Comparator.comparing(
                        item -> item.getNgayCapNhat() != null ? item.getNgayCapNhat() : "",
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                break;
            case "trangthai":
                comparator = Comparator.comparing(
                        item -> item.getTrangThai() != null ? item.getTrangThai() : 0,
                        Comparator.nullsLast(Integer::compareTo));
                break;
            case "tendonvigiao":
                comparator = Comparator.comparing(
                        item -> item.getTenDonViGiao() != null ? item.getTenDonViGiao() : "",
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                break;
            case "tendonvinhan":
                comparator = Comparator.comparing(
                        item -> item.getTenDonViNhan() != null ? item.getTenDonViNhan() : "",
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                break;
        }

        if (comparator == null) {
            // Default to ngayCapNhat
            comparator = Comparator.comparing(
                    item -> item.getNgayCapNhat() != null ? item.getNgayCapNhat() : "",
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
        }

        return ascending ? comparator : comparator.reversed();
    }

    public List<BanGiaoTaiSanDTO> getByUserId(String userId) throws SQLException {

        List<BanGiaoTaiSanDTO> banGiaoTaiSanDTOList = dao.getByUserId(userId);

        // Filter duplicates by ID using LinkedHashMap to preserve order
        Map<String, BanGiaoTaiSanDTO> uniqueMap = new java.util.LinkedHashMap<>();
        for (BanGiaoTaiSanDTO item : banGiaoTaiSanDTOList) {
            if (item != null && item.getId() != null) {
                uniqueMap.put(item.getId(), item);
            }
        }
        banGiaoTaiSanDTOList = new ArrayList<>(uniqueMap.values());

        for (int i = 0; i < banGiaoTaiSanDTOList.size(); i++) {
            BanGiaoTaiSanDTO banGiaoTaiSanDTO = banGiaoTaiSanDTOList.get(i);
            List<ChiTietBanGiaoTaiSanDTO> chiTietBanGiaoTaiSanDTOS = chiTietBanGiaoTaiSanDao
                    .findAll(banGiaoTaiSanDTO.getId());
            banGiaoTaiSanDTO.setChiTietBanGiaoTaiSan(chiTietBanGiaoTaiSanDTOS);
            banGiaoTaiSanDTOList.set(i, banGiaoTaiSanDTO);
        }
        return banGiaoTaiSanDTOList;
    }

    public List<BanGiaoTaiSanDTO> getByUserIdStatus(String userId, int trangThai) throws SQLException {
        List<BanGiaoTaiSanDTO> banGiaoTaiSanDTOList = dao.getByUserIdStatus(userId, trangThai);
        for (int i = 0; i < banGiaoTaiSanDTOList.size(); i++) {
            BanGiaoTaiSanDTO banGiaoTaiSanDTO = banGiaoTaiSanDTOList.get(i);
            List<ChiTietBanGiaoTaiSanDTO> chiTietBanGiaoTaiSanDTOS = chiTietBanGiaoTaiSanDao
                    .findAll(banGiaoTaiSanDTO.getId());
            banGiaoTaiSanDTO.setChiTietBanGiaoTaiSan(chiTietBanGiaoTaiSanDTOS);
            banGiaoTaiSanDTOList.set(i, banGiaoTaiSanDTO);
        }
        return banGiaoTaiSanDTOList;
    }

    public List<BanGiaoTaiSanDTO> getByStatus(int trangThai) throws SQLException {
        List<BanGiaoTaiSanDTO> banGiaoTaiSanDTOList = dao.getByStatus(trangThai);
        for (int i = 0; i < banGiaoTaiSanDTOList.size(); i++) {
            BanGiaoTaiSanDTO banGiaoTaiSanDTO = banGiaoTaiSanDTOList.get(i);
            List<ChiTietBanGiaoTaiSanDTO> chiTietBanGiaoTaiSanDTOS = chiTietBanGiaoTaiSanDao
                    .findAll(banGiaoTaiSanDTO.getId());
            banGiaoTaiSanDTO.setChiTietBanGiaoTaiSan(chiTietBanGiaoTaiSanDTOS);
            banGiaoTaiSanDTOList.set(i, banGiaoTaiSanDTO);
        }
        return banGiaoTaiSanDTOList;
    }

    public BanGiaoTaiSan findById(String id) throws SQLException {
        return dao.findById(id);
    }

    public BanGiaoTaiSanDTO findByIdDTO(String id) throws SQLException {
        return dao.findByIdDTO(id);
    }

    @Transactional(rollbackFor = Exception.class)
    public BanGiaoTaiSan insert(BanGiaoTaiSan obj) throws SQLException {
        if (obj.getId() == null || obj.getId().isEmpty()) {
            obj.setId(UUID.randomUUID().toString());
        }
        BanGiaoTaiSan result = dao.insert(obj);
        if (result != null) {
            if (obj.getChiTietBanGiaoTaiSan() != null && !obj.getChiTietBanGiaoTaiSan().isEmpty()) {
                List<ChiTietBanGiaoTaiSan> itemsToInsert = new ArrayList<>();
                for (ChiTietBanGiaoTaiSan ct : obj.getChiTietBanGiaoTaiSan()) {
                    if (ct.getId() == null || ct.getId().isEmpty()) {
                        ct.setId(UUID.randomUUID().toString());
                    }
                    ct.setIdBanGiaoTaiSan(result.getId());
                    itemsToInsert.add(ct);
                }
                chiTietBanGiaoTaiSanDao.batchInsert(itemsToInsert);
            }
            if (obj.getNguoiKyList() != null) {
                for (NguoiKy nk : obj.getNguoiKyList()) {
                    if (nk.getId() == null || nk.getId().isEmpty()) {
                        nk.setId(UUID.randomUUID().toString());
                    }
                    nk.setIdTaiLieu(result.getId());
                }
                kyTaiLieuDao.insertNguoiKyBatch(obj.getNguoiKyList());
            }

            if (result.getTrangThai() != null && result.getTrangThai() == 3) {
                handleHoanThanhBanGiao(result.getId());
            }
        }
        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public BanGiaoTaiSan update(BanGiaoTaiSan obj) throws SQLException {
        BanGiaoTaiSan oldObj = null;
        try {
            oldObj = dao.findById(obj.getId());
        } catch(Exception e) {}
        List<String> keysToDelete = new ArrayList<>();
        if (oldObj != null) {
            if (oldObj.getDuongDanFile() != null && !oldObj.getDuongDanFile().isEmpty() 
                    && !oldObj.getDuongDanFile().equals(obj.getDuongDanFile())) {
                keysToDelete.add(oldObj.getDuongDanFile());
            }
            if (oldObj.getTaiLieuBangKe() != null && !oldObj.getTaiLieuBangKe().isEmpty() 
                    && !oldObj.getTaiLieuBangKe().equals(obj.getTaiLieuBangKe())) {
                keysToDelete.add(oldObj.getTaiLieuBangKe());
            }
        }

        BanGiaoTaiSan result = dao.update(obj);
        if (result != null) {
            if (obj.getChiTietBanGiaoTaiSan() != null) {
                List<ChiTietBanGiaoTaiSanDTO> currentDetails = chiTietBanGiaoTaiSanDao.findAll(obj.getId());
                Set<String> newIds = new HashSet<>();
                for (ChiTietBanGiaoTaiSan ct : obj.getChiTietBanGiaoTaiSan()) {
                    if (ct.getId() != null && !ct.getId().isEmpty()) {
                        newIds.add(ct.getId());
                    }
                }
                
                List<String> idsToDelete = new ArrayList<>();
                for (ChiTietBanGiaoTaiSanDTO current : currentDetails) {
                    if (!newIds.contains(current.getId())) {
                        idsToDelete.add(current.getId());
                    }
                }
                if (!idsToDelete.isEmpty()) {
                    chiTietBanGiaoTaiSanDao.batchDelete(idsToDelete);
                }

                List<ChiTietBanGiaoTaiSan> itemsToInsert = new ArrayList<>();
                List<ChiTietBanGiaoTaiSan> itemsToUpdate = new ArrayList<>();
                Set<String> currentIds = new HashSet<>();
                for (ChiTietBanGiaoTaiSanDTO c : currentDetails) currentIds.add(c.getId());

                for (ChiTietBanGiaoTaiSan ct : obj.getChiTietBanGiaoTaiSan()) {
                    ct.setIdBanGiaoTaiSan(result.getId());
                    if (ct.getId() == null || ct.getId().isEmpty()) {
                        ct.setId(UUID.randomUUID().toString());
                        itemsToInsert.add(ct);
                    } else if (!currentIds.contains(ct.getId())) {
                        itemsToInsert.add(ct);
                    } else {
                        itemsToUpdate.add(ct);
                    }
                }
                
                if (!itemsToInsert.isEmpty()) {
                    chiTietBanGiaoTaiSanDao.batchInsert(itemsToInsert);
                }
                if (!itemsToUpdate.isEmpty()) {
                    chiTietBanGiaoTaiSanDao.batchUpdate(itemsToUpdate);
                }
            }
            if (obj.getNguoiKyList() != null) {
                for (NguoiKy nk : obj.getNguoiKyList()) {
                    if (nk.getId() == null || nk.getId().isEmpty()) {
                        nk.setId(UUID.randomUUID().toString());
                    }
                    nk.setIdTaiLieu(result.getId());
                }
                kyTaiLieuDao.updateNguoiKy(result.getId(), obj.getNguoiKyList());
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

            if (oldObj != null && oldObj.getTrangThai() != null && oldObj.getTrangThai() != 3 
                && result.getTrangThai() != null && result.getTrangThai() == 3) {
                handleHoanThanhBanGiao(result.getId());
            }
        }
        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public int delete(String id) throws SQLException {
        BanGiaoTaiSan oldObj = null;
        List<String> keysToDelete = new ArrayList<>();

        try {
            oldObj = dao.findById(id);
            if (oldObj != null) {
                if (oldObj.getDuongDanFile() != null && !oldObj.getDuongDanFile().isEmpty()) {
                    keysToDelete.add(oldObj.getDuongDanFile());
                }
                if (oldObj.getTaiLieuBangKe() != null && !oldObj.getTaiLieuBangKe().isEmpty()) {
                    keysToDelete.add(oldObj.getTaiLieuBangKe());
                }
            }
        } catch (Exception e) { }
        
        if (oldObj != null) {
            List<ChiTietBanGiaoTaiSanDTO> details = chiTietBanGiaoTaiSanDao.findAll(id);
            if (!details.isEmpty()) {
                List<String> detailIds = new ArrayList<>();
                for (ChiTietBanGiaoTaiSanDTO dto : details) {
                    detailIds.add(dto.getId());
                }
                chiTietBanGiaoTaiSanDao.batchDelete(detailIds);
            }
            kyTaiLieuDao.deleteAllNguoiKy(id);
            kyTaiLieuDao.delete(id);
        }
        
        int res = dao.delete(id);
        
        if (res > 0 && oldObj != null) {
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
        
        return res;
    }

    @Transactional
    public int updateTrangThai(String id, String userId) {
        int trangThai = dao.updateTrangThai(id, userId);
        if (trangThai == 3) {
            handleHoanThanhBanGiao(id);
        }
        return trangThai;
    }

    private void handleHoanThanhBanGiao(String idBanGiaoTaiSan) {
        try {
            BanGiaoTaiSan banGiaoTaiSan = dao.findById(idBanGiaoTaiSan);
            if (banGiaoTaiSan == null) return;

            String idDonViNhan = banGiaoTaiSan.getIdDonViNhan();
            String idDonViGiao = banGiaoTaiSan.getIdDonViGiao();
            String lenhDieuDong = banGiaoTaiSan.getLenhDieuDong();

            List<ChiTietBanGiaoTaiSanDTO> chiTietList = chiTietBanGiaoTaiSanDao.findAll(idBanGiaoTaiSan);
            List<LichSuDieuChuyenTaiSanDTO> lichSuList = new ArrayList<>();
            String thoiGianBanGiao = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            List<String> taiSanIds = new ArrayList<>();

            for (ChiTietBanGiaoTaiSanDTO chiTiet : chiTietList) {
                String idTaiSan = chiTiet.getIdTaiSan();
                if (idTaiSan != null && !idTaiSan.isEmpty()) {
                    taiSanIds.add(idTaiSan);

                    TaiSanDTO transferredAsset = taiSanDao.findById(idTaiSan);
                    if (transferredAsset != null && transferredAsset.getIdTaiSanCha() != null && !transferredAsset.getIdTaiSanCha().isEmpty()) {
                        taiSanDao.deactivateTaiSanConRelation(transferredAsset.getIdTaiSanCha(), idTaiSan);
                    }

                    taiSanDao.updateDonViSoHuu(idTaiSan, idDonViNhan);

                    LichSuDieuChuyenTaiSanDTO ls = new LichSuDieuChuyenTaiSanDTO();
                    ls.setIdBanGiaoTaiSan(idBanGiaoTaiSan);
                    ls.setIdTaiSan(idTaiSan);
                    ls.setIdDonViNhan(idDonViNhan);
                    ls.setIdDonViGiao(idDonViGiao);
                    ls.setThoiGianBanGiao(thoiGianBanGiao);
                    lichSuList.add(ls);
                }
            }

            // Xử lý tài sản con
            if (!taiSanIds.isEmpty()) {
                List<TaiSanDTO> childAssets = taiSanDao.getTaiSanDTOByTaiSanChaIds(taiSanIds);
                if (childAssets != null && !childAssets.isEmpty()) {
                    for (TaiSanDTO child : childAssets) {
                        String childId = child.getId();
                        if (childId != null && !childId.isEmpty()) {
                            taiSanDao.updateDonViSoHuu(childId, idDonViNhan);
                        }
                    }
                }
                 taiSanDao.updateTaiSanPhatSinhBatch(taiSanIds, true);
            }

            if (!lichSuList.isEmpty()) {
                lichSuDieuChuyenTaiSanService.createBatch(lichSuList);
            }

            if (lenhDieuDong != null && !lenhDieuDong.isEmpty()) {
                dieuDongTaiSanDao.updateTrangThaiBanGiao(lenhDieuDong, true);
            }

            System.out.println("Đã xử lý hoàn thành bàn giao cho " + lichSuList.size() + " tài sản (bao gồm tài sản con)");
        } catch (Exception e) {
            System.err.println("Lỗi khi xử lý hoàn thành bàn giao: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi xử lý hoàn thành bàn giao: " + e.getMessage(), e);
        }
    }

    public boolean isNeedToSign(BanGiaoTaiSanDTO item, String userId) {
        if (userId == null || userId.isEmpty()) return false;
        
        // ===== Trạng thái nháp/hoàn thành/hủy bỏ (trangThai 2, 3 bỏ qua) =====
        if (item.getTrangThai() != null && (item.getTrangThai() == 2 || item.getTrangThai() == 3)) {
            return false;
        }

        // ===== Kiểm tra điều kiện share / người tạo ký trước khi share =====
        if (!Boolean.TRUE.equals(item.getShare())) {
            // Nếu chưa share, chỉ cho phép ký nếu userId là người tạo trùng với người ký đầu tiên và người đó chưa ký.
            boolean isCreatorAndFirstSigner = false;

            // 1. Kiểm tra bên giao (người ký đầu tiên)
            if (item.getIdDaiDienBenGiao() != null && !item.getIdDaiDienBenGiao().isEmpty()) {
                if (userId.equalsIgnoreCase(item.getNguoiTao()) && userId.equalsIgnoreCase(item.getIdDaiDienBenGiao())) {
                    if (!Boolean.TRUE.equals(item.getDaiDienBenGiaoXacNhan())) {
                        isCreatorAndFirstSigner = true;
                    }
                }
            } else if (item.getIdDaiDienBenNhan() != null && !item.getIdDaiDienBenNhan().isEmpty()) {
                // 2. Nếu không có bên giao, bên nhận là người ký đầu tiên
                if (userId.equalsIgnoreCase(item.getNguoiTao()) && userId.equalsIgnoreCase(item.getIdDaiDienBenNhan())) {
                    if (!Boolean.TRUE.equals(item.getDaiDienBenNhanXacNhan())) {
                        isCreatorAndFirstSigner = true;
                    }
                }
            } else {
                // 3. Nếu không có cả hai, kiểm tra người ký đầu tiên trong danh sách NguoiKy
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

        // ===== Lượt ký tuần tự =====

        // 1. Đại diện bên giao
        if (item.getIdDaiDienBenGiao() != null && !item.getIdDaiDienBenGiao().isEmpty()) {
            if (!Boolean.TRUE.equals(item.getDaiDienBenGiaoXacNhan())) {
                return userId.equalsIgnoreCase(item.getIdDaiDienBenGiao());
            }
        }

        // 2. Đại diện bên nhận
        boolean benGiaoDone = item.getIdDaiDienBenGiao() == null || item.getIdDaiDienBenGiao().isEmpty() || Boolean.TRUE.equals(item.getDaiDienBenGiaoXacNhan());
        if (benGiaoDone && item.getIdDaiDienBenNhan() != null && !item.getIdDaiDienBenNhan().isEmpty()) {
            if (!Boolean.TRUE.equals(item.getDaiDienBenNhanXacNhan())) {
                return userId.equalsIgnoreCase(item.getIdDaiDienBenNhan());
            }
        }

        // 3. Danh sách người ký (kyList)
        boolean benNhanDone = benGiaoDone && (item.getIdDaiDienBenNhan() == null || item.getIdDaiDienBenNhan().isEmpty() || Boolean.TRUE.equals(item.getDaiDienBenNhanXacNhan()));
        if (benNhanDone) {
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
                
                // 4. Giám đốc ký (sau khi tất cả NguoiKy đã ký)
                if (allSigned && item.getIdGiamDoc() != null && !item.getIdGiamDoc().isEmpty()) {
                    if (!Boolean.TRUE.equals(item.getGiamDocKy())) {
                        return userId.equalsIgnoreCase(item.getIdGiamDoc());
                    }
                }
            } else {
                // Không có người ký trong danh sách, chuyển thẳng sang Giám đốc
                if (item.getIdGiamDoc() != null && !item.getIdGiamDoc().isEmpty()) {
                    if (!Boolean.TRUE.equals(item.getGiamDocKy())) {
                        return userId.equalsIgnoreCase(item.getIdGiamDoc());
                    }
                }
            }
        }

        return false;
    }

    @Transactional(rollbackFor = Exception.class)
    public int huyTrangThai(String id) {
        kyTaiLieuDao.delete(id);
        return dao.huyTrangThai(id);
    }

    /**
     * Kiểm tra xem có phải lượt ký của user không
     * Thứ tự ký:
     * 1. Đại diện bên giao (check userId với IdDaiDienBenGiao)
     * 2. Đại diện bên nhận (sau khi DaiDienBenGiaoXacNhan = true)
     * 3. NguoiKy từ bảng NguoiKy (sau khi DaiDienBenNhanXacNhan = true)
     * 4. Giám đốc ký (sau khi toàn bộ NguoiKy TrangThai = 1)
     *
     * Điều kiện:
     * - Share phải = true để hiển thị phiếu
     * - Admin và NguoiTao luôn được xem
     * - Người đã hoàn thành bước của mình vẫn hiển thị
     *
     * Ngoại lệ:
     * - userId = "admin" → lấy hết
     * - userId = NguoiTao → lấy không phân biệt thứ tự
     */
    public boolean isUserTurnToSign(BanGiaoTaiSanDTO item, String userId) {
        // Người tạo luôn được xem
        if (userId != null && userId.equals(item.getNguoiTao())) {
            return true;
        }

        // Kiểm tra điều kiện Share = true (trừ admin và người tạo)
        if (!Boolean.TRUE.equals(item.getShare())) {
            return false;
        }

        // Bước 1: Đại diện bên giao
        if (!Boolean.TRUE.equals(item.getDaiDienBenGiaoXacNhan())) {
            // Chỉ đại diện bên giao mới thấy
            return userId != null && userId.equals(item.getIdDaiDienBenGiao());
        }
        // Đại diện bên giao đã ký vẫn được xem
        if (userId != null && userId.equals(item.getIdDaiDienBenGiao()) ) {
            return true;
        }

        // Bước 2: Đại diện bên nhận (sau khi bên giao đã ký)
        if (Boolean.TRUE.equals(item.getDaiDienBenGiaoXacNhan()) && !Boolean.TRUE.equals(item.getDaiDienBenNhanXacNhan())) {
            // Chỉ đại diện bên nhận mới thấy
            return userId != null && userId.equals(item.getIdDaiDienBenNhan());
        }
        // Đại diện bên nhận đã ký vẫn được xem
        if (Boolean.TRUE.equals(item.getDaiDienBenNhanXacNhan())
                && userId != null && userId.equals(item.getIdDaiDienBenNhan())) {
            return true;
        }

        // Bước 3: NguoiKy từ bảng NguoiKy (sau khi bên nhận đã ký) - ký theo thứ tự
        if (Boolean.TRUE.equals(item.getDaiDienBenNhanXacNhan())) {
            // Lấy danh sách người ký theo IdTaiLieu
            List<NguoiKy> nguoiKyList = kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId());

            if (nguoiKyList != null && !nguoiKyList.isEmpty()) {
                // Tìm người ký đầu tiên chưa ký (theo thứ tự trong danh sách)
                NguoiKy firstUnsignedNguoiKy = null;
                boolean allNguoiKySigned = true;

                for (NguoiKy nguoiKy : nguoiKyList) {
                    if (nguoiKy.getTrangThai() != 1) {
                        allNguoiKySigned = false;
                        if (firstUnsignedNguoiKy == null) {
                            firstUnsignedNguoiKy = nguoiKy;
                        }
                    }
                }

                // Kiểm tra xem user có phải là người ký trong danh sách không
                boolean isUserInNguoiKyList = false;
                boolean userAlreadySigned = false;
                for (NguoiKy nguoiKy : nguoiKyList) {
                    if (userId != null && userId.equals(nguoiKy.getIdNguoiKy())) {
                        isUserInNguoiKyList = true;
                        if (nguoiKy.getTrangThai() == 1) {
                            userAlreadySigned = true;
                        }
                        break;
                    }
                }

                // Nếu user đã ký rồi thì vẫn hiển thị
                if (userAlreadySigned) {
                    return true;
                }

                // Chỉ người ký tiếp theo (đầu tiên chưa ký) mới thấy
                if (firstUnsignedNguoiKy != null && isUserInNguoiKyList) {
                    if (userId != null && userId.equals(firstUnsignedNguoiKy.getIdNguoiKy())) {
                        return true;
                    }
                }

                // Bước 4: Giám đốc ký (sau khi tất cả NguoiKy đã ký)
                if (allNguoiKySigned && !Boolean.TRUE.equals(item.getGiamDocKy())) {
                    // Chỉ Giám đốc mới thấy
                    return userId != null && userId.equals(item.getIdGiamDoc());
                }
                // Giám đốc đã ký vẫn được xem
                if (Boolean.TRUE.equals(item.getGiamDocKy())
                        && userId != null && userId.equals(item.getIdGiamDoc())) {
                    return true;
                }
            } else {
                // Không có người ký nào trong danh sách, chuyển thẳng sang Giám đốc
                if (!Boolean.TRUE.equals(item.getGiamDocKy())) {
                    // Chỉ Giám đốc mới thấy
                    return userId != null && userId.equals(item.getIdGiamDoc());
                }
                // Giám đốc đã ký vẫn được xem
                if (Boolean.TRUE.equals(item.getGiamDocKy())
                        && userId != null && userId.equals(item.getIdGiamDoc())) {
                    return true;
                }
            }
        }

        return false;
    }

    public List<BanGiaoTaiSan> readCsv(MultipartFile file) throws IOException {
        List<BanGiaoTaiSan> list = new ArrayList<>();

        // Sử dụng InputStreamReader với UTF-8
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true; // bỏ qua header
            while ((line = br.readLine()) != null) {
                if (firstLine) {
                    firstLine = false;
                    continue;
                }
                String[] fields = line.split(",", -1); // giữ giá trị rỗng
                BanGiaoTaiSan ts = BanGiaoTaiSan.mapToBanGiaoTaiSan(fields); // map từ CSV sang object
                list.add(ts);
            }
        }
        return list;
    }

    public List<BanGiaoTaiSan> readExcel(MultipartFile file) throws IOException {
        List<BanGiaoTaiSan> list = new ArrayList<>();
        Workbook workbook = WorkbookFactory.create(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        boolean firstRow = true;
        for (Row row : sheet) {
            if (firstRow) { // bỏ qua header
                firstRow = false;
                continue;
            }
            BanGiaoTaiSan ts = BanGiaoTaiSan.mapToBanGiaoTaiSan(row); // map từ Row sang object
            list.add(ts);
        }
        workbook.close();
        return list;
    }

    public int getPermissionSigning(BanGiaoTaiSanDTO item, String tenDangNhap) {
        // Tạo danh sách flow ký duyệt
        List<Map<String, Object>> signatureFlow = new ArrayList<>();

        // Đại diện đơn vị ban hành QĐ
        if (item.getIdDaiDiendonviBanHanhQD() != null && !item.getIdDaiDiendonviBanHanhQD().isEmpty()) {
            Map<String, Object> step = new HashMap<>();
            step.put("id", item.getIdDaiDiendonviBanHanhQD());
            step.put("signed", Boolean.TRUE.equals(item.getDaXacNhan()));
            signatureFlow.add(step);
        }

        // Đại diện bên giao
        if (item.getIdDaiDienBenGiao() != null && !item.getIdDaiDienBenGiao().isEmpty()) {
            Map<String, Object> step = new HashMap<>();
            step.put("id", item.getIdDaiDienBenGiao());
            step.put("signed", Boolean.TRUE.equals(item.getDaiDienBenGiaoXacNhan()));
            signatureFlow.add(step);
        }

        // Đại diện bên nhận
        if (item.getIdDaiDienBenNhan() != null && !item.getIdDaiDienBenNhan().isEmpty()) {
            Map<String, Object> step = new HashMap<>();
            step.put("id", item.getIdDaiDienBenNhan());
            step.put("signed", Boolean.TRUE.equals(item.getDaiDienBenNhanXacNhan()));
            signatureFlow.add(step);
        }
        List<NguoiKy> kyTaiLieuList = kyTaiLieuDao.getAllNguoiKyByIdTaiLieu(item.getId());
        // Danh sách người ký bổ sung
        if (kyTaiLieuList != null && !kyTaiLieuList.isEmpty()) {
            for (NguoiKy e : kyTaiLieuList) {
                if (e.getIdNguoiKy() != null && !e.getIdNguoiKy().isEmpty()) {
                    Map<String, Object> step = new HashMap<>();
                    step.put("id", e.getIdNguoiKy());
                    step.put("signed", e.getTrangThai() == 1);
                    signatureFlow.add(step);
                }
            }
        }

        // Tìm index người dùng hiện tại trong flow ký
        int currentIndex = -1;
        for (int i = 0; i < signatureFlow.size(); i++) {
            if (Objects.equals(signatureFlow.get(i).get("id"), tenDangNhap)) {
                currentIndex = i;
                break;
            }
        }

        // Không nằm trong flow ký
        if (currentIndex == -1)
            return 2;

        Object signedObj = signatureFlow.get(currentIndex).get("signed");
        boolean signed = signedObj instanceof Boolean && (Boolean) signedObj;

        // Nếu là người ban hành quyết định
        if (Objects.equals(item.getIdDaiDiendonviBanHanhQD(), tenDangNhap) && signedObj != null) {
            return signed ? 4 : 5;
        }

        // Đã ký
        if (signed)
            return 3;

        // Kiểm tra nếu có ai trước đó chưa ký
        boolean previousNotSigned = false;
        for (int i = 0; i < currentIndex; i++) {
            Object prevSignedObj = signatureFlow.get(i).get("signed");
            boolean prevSigned = prevSignedObj instanceof Boolean && (Boolean) prevSignedObj;
            if (!prevSigned) {
                previousNotSigned = true;
                break;
            }
        }

        if (previousNotSigned)
            return 1;

        // Có thể ký
        return 0;
    }

}