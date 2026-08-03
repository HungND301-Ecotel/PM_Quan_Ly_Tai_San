package com.ecotel.quanlytaisan.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.ecotel.quanlytaisan.dao.ChuKySuaChuaDao;
import com.ecotel.quanlytaisan.dao.ConfigDao;
import com.ecotel.quanlytaisan.dao.LichSuDieuChuyenTaiSanDao;
import com.ecotel.quanlytaisan.dao.PhongBanDao;
import com.ecotel.quanlytaisan.dao.TaiSanDao;
import com.ecotel.quanlytaisan.dao.TaiSanFileDao;
import com.ecotel.quanlytaisan.model.ChuKySuaChua;
import com.ecotel.quanlytaisan.model.Config;
import com.ecotel.quanlytaisan.model.KhauHaoTaiSan;
import com.ecotel.quanlytaisan.model.LichSuDieuChuyenTaiSanDTO;
import com.ecotel.quanlytaisan.model.PageResponse;
import com.ecotel.quanlytaisan.model.PhongBanDTO;
import com.ecotel.quanlytaisan.model.TaiSan;
import com.ecotel.quanlytaisan.model.TaiSanCon;
import com.ecotel.quanlytaisan.model.TaiSanDTO;
import com.ecotel.quanlytaisan.model.TaiSanFile;
import com.ecotel.quanlytaisan.model.TaiSanSapDenKySuaChuaDTO;
import com.ecotel.quanlytaisan.repository.LichTrinhRepository;

@Service
public class TaiSanService {
    @Autowired
    private TaiSanDao taiSanDao;
    @Autowired
    private LichTrinhRepository lichTrinhRepository;
    @Autowired
    private ConfigDao configDao;
    @Autowired
    private ChuKySuaChuaDao chuKySuaChuaDao;
     @Autowired
    private TaiSanFileDao taiSanFileDao;
    @org.springframework.beans.factory.annotation.Autowired
    private com.ecotel.quanlytaisan.service.S3Service s3Service;
    @Autowired
    private PhongBanDao phongBanDao;
    @Autowired
    private LichSuDieuChuyenTaiSanDao lichSuDieuChuyenTaiSanDao;


    public List<TaiSanDTO> getAll(String idCongTy) {
        return getAll(idCongTy, null);
    }

    public List<TaiSanDTO> getAll(String idCongTy, String idDonViQuanLy) {
        return getAll(idCongTy, idDonViQuanLy, null);
    }

    public List<TaiSanDTO> getAll(String idCongTy, String idDonViQuanLy, Boolean isHeThong) {
        List<TaiSanDTO> taiSanDTOList = taiSanDao.findAll(idCongTy, idDonViQuanLy, isHeThong);
        // enrichTaiSanDTOList(taiSanDTOList);
        return taiSanDTOList;
    }

    public PageResponse<TaiSanDTO> getAllPaged(String idCongTy, int page, int size, String sortBy, String sortDir, String search, String idNhomTaiSan, String idLoaiTaiSan, String idDonViHienThoi, int soNgayThongBaoKiemDinh, String trangThaiKiemDinh) {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase();
            List<TaiSanDTO> all = getAll(idCongTy);
            List<TaiSanDTO> filtered = new ArrayList<>();
            for (TaiSanDTO item : all) {
                if (item != null) {
                    if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()
                            && !idNhomTaiSan.equals(item.getIdNhomTaiSan())) {
                        continue;
                    }
                    if (idLoaiTaiSan != null && !idLoaiTaiSan.trim().isEmpty()
                            && !idLoaiTaiSan.equals(item.getIdLoaiTaiSanCon())) {
                        continue;
                    }
                    if (idDonViHienThoi != null && !idDonViHienThoi.trim().isEmpty()
                            && !idDonViHienThoi.equals(item.getIdDonViHienThoi())) {
                        continue;
                    }
                    if (matchesTaiSanSearch(item, q)) {
                        filtered.add(item);
                    }
                }
            }
            long total = filtered.size();
            int from = Math.min(page * size, filtered.size());
            int to = Math.min(from + size, filtered.size());
            List<TaiSanDTO> items = filtered.subList(from, to);

            // ĐẾM THỰC TẾ theo filter hiện tại
            Map<String, Long> groupCounts = taiSanDao.getCountByNhomTaiSanWithBanGiaoStatus(idCongTy, null, search,idDonViHienThoi);

            PageResponse<TaiSanDTO> response = new PageResponse<>(items, total, page, size);
            response.setGroupCounts(groupCounts);
            return response;
        }

        long total;
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            total = taiSanDao.countByCongTyAndNhom(idCongTy, idNhomTaiSan, soNgayThongBaoKiemDinh, trangThaiKiemDinh);
        } else {
            total = taiSanDao.countByCongTy(idCongTy, soNgayThongBaoKiemDinh, trangThaiKiemDinh);
        }

        if (total == 0) {
            PageResponse<TaiSanDTO> response = new PageResponse<>(List.of(), 0, page, size);
            // ĐẾM THỰC TẾ ngay cả khi không có dữ liệu
            response.setGroupCounts(taiSanDao.getCountByNhomTaiSan(idCongTy));
            return response;
        }

        int offset = page * size;
        List<TaiSanDTO> items = taiSanDao.findAllPaged(idCongTy, offset, size, sortBy, sortDir, idNhomTaiSan, soNgayThongBaoKiemDinh, trangThaiKiemDinh);

        enrichTaiSanDTOList(items);

        // ĐẾM THỰC TẾ từ bảng TaiSan
        Map<String, Long> groupCounts = taiSanDao.getCountByNhomTaiSan(idCongTy);

        PageResponse<TaiSanDTO> response = new PageResponse<>(items, total, page, size);
        response.setGroupCounts(groupCounts);
        return response;
    }

    public PageResponse<TaiSanDTO> getSapHetHanKiemDinhPaged(String idCongTy, int page, int size, int soNgayThongBaoKiemDinh) {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        long total = taiSanDao.countSapHetHanKiemDinh(idCongTy, soNgayThongBaoKiemDinh);
        if (total == 0) {
            return new PageResponse<>(List.of(), 0, page, size);
        }

        int offset = page * size;
        List<TaiSanDTO> items = taiSanDao.findSapHetHanKiemDinhPaged(idCongTy, offset, size, soNgayThongBaoKiemDinh);
        return new PageResponse<>(items, total, page, size);
    }


    public PageResponse<TaiSanSapDenKySuaChuaDTO> getDanhSachSapDenKySuaChua(
        String idCongTy, String userId, int page, int size) {

        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        Config config = configDao.findByIdAccount(userId);
        int thoiGianBaoSuaChua = (config != null && config.getThoiGianBaoSuaChua() != null)
                ? config.getThoiGianBaoSuaChua() : 0;
        if (thoiGianBaoSuaChua <= 0) {
            return new PageResponse<>(List.of(), 0, page, size);
        }

        List<TaiSanDTO> allTaiSan = taiSanDao.findAll(idCongTy);
        if (allTaiSan == null || allTaiSan.isEmpty()) {
            return new PageResponse<>(List.of(), 0, page, size);
        }
        List<String> taiSanIds = allTaiSan.stream().map(TaiSanDTO::getId).collect(Collectors.toList());
        Map<String, TaiSanDTO> taiSanMap = allTaiSan.stream()
                .collect(Collectors.toMap(TaiSanDTO::getId, t -> t, (a, b) -> a));

        List<ChuKySuaChua> allChuKy = chuKySuaChuaDao.findAllByTaiSanIds(taiSanIds);
        if (allChuKy == null || allChuKy.isEmpty()) {
            return new PageResponse<>(List.of(), 0, page, size);
        }

        // 1. Tổng giờ (ca1+ca2+ca3) toàn bộ tháng — 1 query
        Map<String, Integer> tongGioMap = new HashMap<>();
        for (LichTrinhRepository.SumGioProjection p : lichTrinhRepository.sumGioHoatDongGroupByTaiSan(taiSanIds)) {
            tongGioMap.put(p.getIdTaiSan(), p.getTongGio());
        }

        // 3. Duyệt từng chu kỳ sửa chữa, kiểm tra có nằm trong khoảng cảnh báo không
        List<TaiSanSapDenKySuaChuaDTO> result = new ArrayList<>();

        for (ChuKySuaChua chuKy : allChuKy) {
            if (chuKy.getChuKy() == null || chuKy.getChuKy() <= 0) continue;

            TaiSanDTO taiSan = taiSanMap.get(chuKy.getIdTaiSan());
            if (taiSan == null) continue;

            double gioHoatDong = tongGioMap.getOrDefault(chuKy.getIdTaiSan(), 0);
            if (gioHoatDong <= 0) continue;

            int cycle = chuKy.getChuKy();

            long k = (long) Math.floor(gioHoatDong / cycle);
            long mocSap = (k + 1) * cycle;      // mốc sắp tới (chưa đạt)
            long mocVuaQua = k * cycle;         // mốc gần nhất đã đạt (0 nếu chưa từng đạt)

            boolean sapDenMoc = gioHoatDong >= (mocSap - thoiGianBaoSuaChua) && gioHoatDong < mocSap;
            boolean vuaQuaMoc = k >= 1
                    && gioHoatDong >= mocVuaQua
                    && gioHoatDong < (mocVuaQua + thoiGianBaoSuaChua);

            if (!sapDenMoc && !vuaQuaMoc) continue;

            long mocSuaChuaTiepTheo = sapDenMoc ? mocSap : mocVuaQua;

            // Công thức chung: còn lại = mốc - giờ hiện tại, âm thì clamp về 0
            double gioConLai = Math.max(0, mocSuaChuaTiepTheo - gioHoatDong);

            TaiSanSapDenKySuaChuaDTO dto = new TaiSanSapDenKySuaChuaDTO();
            dto.setIdTaiSan(taiSan.getId());
            dto.setTenTaiSan(taiSan.getTenTaiSan());
            dto.setSoThe(taiSan.getSoThe());
            dto.setChuKy(cycle);
            dto.setDonViChuKy(chuKy.getDonViChuKy());
            dto.setIdLoaiSuaChua(chuKy.getIdLoaiSuaChua());
            dto.setGioHoatDongTong(gioHoatDong);
            dto.setMocSuaChuaTiepTheo((int) mocSuaChuaTiepTheo);
            dto.setGioConLai(gioConLai);

            result.add(dto);
        }


        result.sort(Comparator.comparingDouble(TaiSanSapDenKySuaChuaDTO::getGioConLai));

        long total = result.size();
        int from = Math.min(page * size, result.size());
        int to = Math.min(from + size, result.size());
        List<TaiSanSapDenKySuaChuaDTO> items = new ArrayList<>(result.subList(from, to));

        return new PageResponse<>(items, total, page, size);
    }
    public PageResponse<TaiSanDTO> getByDonViBanDauPaged(
        String idCongTy, 
        String idDonViBanDau, 
        int page, 
        int size, 
        String sortBy, 
        String sortDir, 
        String idNhomTaiSan,
        String search,
        int soNgayThongBaoKiemDinh, 
        String trangThaiKiemDinh,
        Boolean isPhatSinh) {
    
        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        // Tính offset
        int offset = page * size;
        
        // Lấy tổng số từ DAO (DAO đã filter theo idDonViBanDau, loaiKho=1, idDonViHienThoi rỗng, và trangThaiKiemDinh)
        long total = taiSanDao.countByDonViBanDau(idCongTy, idDonViBanDau,search,idNhomTaiSan, soNgayThongBaoKiemDinh, trangThaiKiemDinh, isPhatSinh);
        
        // Lấy danh sách phân trang từ DAO
        List<TaiSanDTO> items = taiSanDao.findByDonViBanDauPaged(
            idCongTy, idDonViBanDau, offset, size, sortBy, sortDir,idNhomTaiSan, search,
            soNgayThongBaoKiemDinh, trangThaiKiemDinh, isPhatSinh
        );

        // Enrich children lists
        enrichTaiSanDTOList(items);
        Map<String, Long> kiemDinhCounts = taiSanDao.getCountByTrangThaiKiemDinh(
            idCongTy, "CAP_PHAT", idDonViBanDau,search,idNhomTaiSan, null, soNgayThongBaoKiemDinh
        );
        long phatSinhCount = taiSanDao.countByDonViBanDau(idCongTy, idDonViBanDau, search, idNhomTaiSan, soNgayThongBaoKiemDinh, null, true);
        kiemDinhCounts.put("Tai san phat sinh", phatSinhCount);

        PageResponse<TaiSanDTO> response = new PageResponse<>(items, total, page, size);
        response.setLoaiCounts(kiemDinhCounts);
        
        return response;
    }

    public PageResponse<TaiSanDTO> getByDonViThuHoiPaged(
        String idCongTy, 
        String idDonViThuHoi, 
        int page, 
        int size, 
        String sortBy, 
        String sortDir, 
        String idNhomTaiSan,
        String search,
        int soNgayThongBaoKiemDinh, 
        String trangThaiKiemDinh,
        Boolean isPhatSinh) {
    
        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        // Tính offset
        int offset = page * size;
        
        // Lấy tổng số từ DAO
        long total = taiSanDao.countByDonViThuHoi(idCongTy, idDonViThuHoi,search,idNhomTaiSan, soNgayThongBaoKiemDinh, trangThaiKiemDinh, isPhatSinh);
        
        // Lấy danh sách phân trang từ DAO
        List<TaiSanDTO> items = taiSanDao.findByDonViThuHoiPaged(
            idCongTy, idDonViThuHoi, offset, size, sortBy, sortDir,idNhomTaiSan,search, 
            soNgayThongBaoKiemDinh, trangThaiKiemDinh, isPhatSinh
        );
        
        // Enrich children lists
        enrichTaiSanDTOList(items);
        Map<String, Long> kiemDinhCounts = taiSanDao.getCountByTrangThaiKiemDinh(
            idCongTy, "THU_HOI",idDonViThuHoi,search,idNhomTaiSan, null, soNgayThongBaoKiemDinh
        );
        long phatSinhCount = taiSanDao.countByDonViThuHoi(idCongTy, idDonViThuHoi, search, idNhomTaiSan, soNgayThongBaoKiemDinh, null, true);
        kiemDinhCounts.put("Tai san phat sinh", phatSinhCount);

        PageResponse<TaiSanDTO> response = new PageResponse<>(items, total, page, size);
        response.setLoaiCounts(kiemDinhCounts);
        
        return response;
    }

    public PageResponse<TaiSanDTO> getByDonViHienThoiPaged(String idCongTy, String idDonViHienThoi, int page, int size, String sortBy, String sortDir, String idNhomTaiSan, String search, int soNgayThongBaoKiemDinh, String trangThaiKiemDinh) {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        // Pagination
        long total = taiSanDao.countByDonViHienThoi(idCongTy, idDonViHienThoi, search, idNhomTaiSan, soNgayThongBaoKiemDinh, trangThaiKiemDinh);
        int offset = page * size;
        List<TaiSanDTO> items = taiSanDao.findByDonViHienThoiPaged(idCongTy, idDonViHienThoi, offset, size, sortBy, sortDir, idNhomTaiSan, search, soNgayThongBaoKiemDinh, trangThaiKiemDinh);

        enrichTaiSanDTOList(items);

        // ĐẾM THỰC TẾ cho đơn vị hiện thời
        Map<String, Long> groupCounts = taiSanDao.getCountByNhomTaiSanForDonViHienThoi(idCongTy, idDonViHienThoi, search);

        PageResponse<TaiSanDTO> response = new PageResponse<>(items, total, page, size);
        response.setGroupCounts(groupCounts);
        return response;
    }

    public List<TaiSanDTO> getByLoai(String idLoai) {

        List<TaiSanDTO> taiSanDTOList = taiSanDao.findByIdLoaiTS(idLoai);
        enrichTaiSanDTOList(taiSanDTOList);
        return taiSanDTOList;
    }

    public TaiSanDTO getById(String id) {
        return getById(id, null, null);
    }

    public TaiSanDTO getById(String id, String dateFrom, String dateTo) {
        TaiSanDTO dto = taiSanDao.findById(id, dateFrom, dateTo);
        if (dto != null) {
            java.util.List<TaiSanDTO> children = taiSanDao.getTaiSanDTOByTaiSanChaIds(java.util.Collections.singletonList(id));
            dto.setTaiSanConList(children);
        }
        return dto;
    }

    public List<TaiSanDTO> getTaiSanChildrenByParentId(String idTaiSan) {
        return taiSanDao.getTaiSanDTOByTaiSanChaIds(java.util.Collections.singletonList(idTaiSan));
    }

    @Transactional
    public int create(TaiSan ts) {
        int result = taiSanDao.insert(ts);
        if (result > 0) {
            createInitialHistory(ts);
            if (ts.getListIdTaiSanCon() != null && !ts.getListIdTaiSanCon().isEmpty()) {
                taiSanDao.updateIdTaiSanChaForList(ts.getListIdTaiSanCon(), ts.getId());
            }

            // Sync files
            if (ts.getFileDinhKemList() != null && !ts.getFileDinhKemList().isEmpty()) {
                for (com.ecotel.quanlytaisan.model.TaiSanFile file : ts.getFileDinhKemList()) {
                    if ("DELETE".equals(file.getAction())) {
                        if (file.getId() != null) {
                            com.ecotel.quanlytaisan.model.TaiSanFile existingFile = taiSanFileDao.findById(file.getId());
                            if (existingFile != null && existingFile.getFilePath() != null && !existingFile.getFilePath().isEmpty()) {
                                try {
                                    s3Service.deleteFile(existingFile.getFilePath());
                                } catch (Exception e) {
                                    System.err.println("Failed to delete S3 file: " + existingFile.getFilePath());
                                }
                            }
                            taiSanFileDao.delete(file.getId());
                        }
                    } else if ("CREATE".equals(file.getAction())) {
                        file.setIdTaiSan(ts.getId());
                        taiSanFileDao.insert(file);
                    }
                }
            }

            // Sync chu ky sua chua
            if (ts.getChuKySuaChuaList() != null && !ts.getChuKySuaChuaList().isEmpty()) {
                for (com.ecotel.quanlytaisan.model.ChuKySuaChua item : ts.getChuKySuaChuaList()) {
                    item.setIdTaiSan(ts.getId());
                    if (Boolean.TRUE.equals(item.getIsDeleted())) {
                        if (item.getId() != null && !item.getId().isEmpty()) {
                            chuKySuaChuaDao.delete(item.getId());
                        }
                    } else if (Boolean.TRUE.equals(item.getIsInserted()) || item.getId() == null || item.getId().isEmpty()) {
                        if (item.getId() == null || item.getId().isEmpty()) {
                            item.setId(java.util.UUID.randomUUID().toString());
                        }
                        chuKySuaChuaDao.insert(item);
                    } else {
                        chuKySuaChuaDao.update(item);
                    }
                }
            }
        }
        return result;
    }

    @Transactional
    public int batchCreate(List<TaiSan> list) {
        if (list == null || list.isEmpty()) {
            return 0;
        }

        List<TaiSan> newlyInserted = taiSanDao.batchCreate(list);

        if (!newlyInserted.isEmpty()) {
            List<LichSuDieuChuyenTaiSanDTO> histories = new ArrayList<>();
            List<com.ecotel.quanlytaisan.model.TaiSanFile> allFiles = new ArrayList<>();
            
            for (TaiSan ts : newlyInserted) {
                LichSuDieuChuyenTaiSanDTO history = new LichSuDieuChuyenTaiSanDTO();
                history.setIdTaiSan(ts.getId());
                history.setIdDonViGiao(ts.getIdDonViBanDau());
                history.setIdDonViNhan(ts.getIdDonViBanDau());
                history.setThoiGianBanGiao(ts.getNgayTao() != null ? ts.getNgayTao() : java.time.LocalDateTime.now().toString());
                histories.add(history);
                
                // Child assets
                if (ts.getListIdTaiSanCon() != null && !ts.getListIdTaiSanCon().isEmpty()) {
                    taiSanDao.updateIdTaiSanChaForList(ts.getListIdTaiSanCon(), ts.getId());
                }
                
                // Files
                if (ts.getFileDinhKemList() != null && !ts.getFileDinhKemList().isEmpty()) {
                    for (com.ecotel.quanlytaisan.model.TaiSanFile file : ts.getFileDinhKemList()) {
                        if ("CREATE".equals(file.getAction()) || file.getAction() == null) {
                            file.setIdTaiSan(ts.getId());
                            allFiles.add(file);
                        }
                    }
                }
                
                // ChuKySuaChua
                if (ts.getChuKySuaChuaList() != null && !ts.getChuKySuaChuaList().isEmpty()) {
                    for (com.ecotel.quanlytaisan.model.ChuKySuaChua item : ts.getChuKySuaChuaList()) {
                        item.setIdTaiSan(ts.getId());
                        if (Boolean.TRUE.equals(item.getIsInserted()) || item.getId() == null || item.getId().isEmpty()) {
                            if (item.getId() == null || item.getId().isEmpty()) {
                                item.setId(java.util.UUID.randomUUID().toString());
                            }
                            chuKySuaChuaDao.insert(item);
                        }
                    }
                }
            }
            lichSuDieuChuyenTaiSanDao.createBatch(histories);
            
            if (!allFiles.isEmpty()) {
                taiSanFileDao.insertBatch(allFiles);
            }
        }

        return list.size();
    }

    private void createInitialHistory(TaiSan ts) {
        LichSuDieuChuyenTaiSanDTO history = new LichSuDieuChuyenTaiSanDTO();
        history.setIdTaiSan(ts.getId());
        history.setIdDonViGiao(ts.getIdDonViBanDau());
        
        // Đơn vị nhận mặc định là đơn vị ban đầu khi khởi tạo
        history.setIdDonViNhan(ts.getIdDonViBanDau());
        
        // Thời gian là ngày tạo hoặc hiện tại
        history.setThoiGianBanGiao(ts.getNgayTao() != null ? ts.getNgayTao() : java.time.LocalDateTime.now().toString());
        
        lichSuDieuChuyenTaiSanDao.create(history);
    }

    @Transactional
    public int update(TaiSan ts) {
        int result = taiSanDao.update(ts);
        if (result > 0) {
            taiSanDao.clearIdTaiSanCha(ts.getId());
            if (ts.getListIdTaiSanCon() != null && !ts.getListIdTaiSanCon().isEmpty()) {
                taiSanDao.updateIdTaiSanChaForList(ts.getListIdTaiSanCon(), ts.getId());
            }

            // Sync files
            if (ts.getFileDinhKemList() != null && !ts.getFileDinhKemList().isEmpty()) {
                for (com.ecotel.quanlytaisan.model.TaiSanFile file : ts.getFileDinhKemList()) {
                    if ("DELETE".equals(file.getAction())) {
                        if (file.getId() != null) {
                            com.ecotel.quanlytaisan.model.TaiSanFile existingFile = taiSanFileDao.findById(file.getId());
                            if (existingFile != null && existingFile.getFilePath() != null && !existingFile.getFilePath().isEmpty()) {
                                try {
                                    s3Service.deleteFile(existingFile.getFilePath());
                                } catch (Exception e) {
                                    System.err.println("Failed to delete S3 file: " + existingFile.getFilePath());
                                }
                            }
                            taiSanFileDao.delete(file.getId());
                        }
                    } else if ("CREATE".equals(file.getAction())) {
                        file.setIdTaiSan(ts.getId());
                        taiSanFileDao.insert(file);
                    }
                }
            }

            // Sync chu ky sua chua
            if (ts.getChuKySuaChuaList() != null && !ts.getChuKySuaChuaList().isEmpty()) {
                for (com.ecotel.quanlytaisan.model.ChuKySuaChua item : ts.getChuKySuaChuaList()) {
                    item.setIdTaiSan(ts.getId());
                    if (Boolean.TRUE.equals(item.getIsDeleted())) {
                        if (item.getId() != null && !item.getId().isEmpty()) {
                            chuKySuaChuaDao.delete(item.getId());
                        }
                    } else if (Boolean.TRUE.equals(item.getIsInserted()) || item.getId() == null || item.getId().isEmpty()) {
                        if (item.getId() == null || item.getId().isEmpty()) {
                            item.setId(java.util.UUID.randomUUID().toString());
                        }
                        chuKySuaChuaDao.insert(item);
                    } else {
                        chuKySuaChuaDao.update(item);
                    }
                }
            }
        }
        return result;
    }

    @Transactional
    public int batchUpdate(List<TaiSan> list) {
        if (list == null || list.isEmpty()) {
            return 0;
        }
        int result = taiSanDao.batchUpdate(list);
        if (result > 0) {
            for (TaiSan ts : list) {
                taiSanDao.clearIdTaiSanCha(ts.getId());
                if (ts.getListIdTaiSanCon() != null && !ts.getListIdTaiSanCon().isEmpty()) {
                    taiSanDao.updateIdTaiSanChaForList(ts.getListIdTaiSanCon(), ts.getId());
                }

                // Sync files
                if (ts.getFileDinhKemList() != null && !ts.getFileDinhKemList().isEmpty()) {
                    for (com.ecotel.quanlytaisan.model.TaiSanFile file : ts.getFileDinhKemList()) {
                        if ("DELETE".equals(file.getAction())) {
                            if (file.getId() != null) {
                                com.ecotel.quanlytaisan.model.TaiSanFile existingFile = taiSanFileDao.findById(file.getId());
                                if (existingFile != null && existingFile.getFilePath() != null && !existingFile.getFilePath().isEmpty()) {
                                    try {
                                        s3Service.deleteFile(existingFile.getFilePath());
                                    } catch (Exception e) {
                                        System.err.println("Failed to delete S3 file: " + existingFile.getFilePath());
                                    }
                                }
                                taiSanFileDao.delete(file.getId());
                            }
                        } else if ("CREATE".equals(file.getAction())) {
                            file.setIdTaiSan(ts.getId());
                            taiSanFileDao.insert(file);
                        }
                    }
                }

                // Sync chu ky sua chua
                if (ts.getChuKySuaChuaList() != null && !ts.getChuKySuaChuaList().isEmpty()) {
                    for (com.ecotel.quanlytaisan.model.ChuKySuaChua item : ts.getChuKySuaChuaList()) {
                        item.setIdTaiSan(ts.getId());
                        if (Boolean.TRUE.equals(item.getIsDeleted())) {
                            if (item.getId() != null && !item.getId().isEmpty()) {
                                chuKySuaChuaDao.delete(item.getId());
                            }
                        } else if (Boolean.TRUE.equals(item.getIsInserted()) || item.getId() == null || item.getId().isEmpty()) {
                            if (item.getId() == null || item.getId().isEmpty()) {
                                item.setId(java.util.UUID.randomUUID().toString());
                            }
                            chuKySuaChuaDao.insert(item);
                        } else {
                            chuKySuaChuaDao.update(item);
                        }
                    }
                }
            }
        }
        return result;
    }

    public int updateTaiSanConTaiSan(Map<String, Object> map) {
        return taiSanDao.updateTaiSanConTaiSan(map);
    }

    @Transactional
    public int delete(String id) {
        // Handle child assets
        taiSanDao.clearIdTaiSanCha(id);
        
        // Handle files
        java.util.List<com.ecotel.quanlytaisan.model.TaiSanFile> files = taiSanFileDao.findByTaiSanId(id);
        if (files != null && !files.isEmpty()) {
            java.util.List<String> keys = files.stream()
                .map(com.ecotel.quanlytaisan.model.TaiSanFile::getFilePath)
                .filter(p -> p != null && !p.isEmpty())
                .collect(java.util.stream.Collectors.toList());
            if (!keys.isEmpty()) {
                try {
                    s3Service.deleteFiles(keys);
                } catch (Exception e) {
                    System.err.println("Failed to delete S3 files for asset: " + id);
                }
            }
            taiSanFileDao.deleteByTaiSanId(id);
        }
        
        // Handle ChuKySuaChua
        chuKySuaChuaDao.deleteByIdTaiSan(id);
        
        return taiSanDao.delete(id);
    }

    @Transactional
    public int batchDelete(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        
        for(String id : ids) {
            taiSanDao.clearIdTaiSanCha(id);
        }
        
        // Handle files
        java.util.List<com.ecotel.quanlytaisan.model.TaiSanFile> files = taiSanFileDao.findAllByTaiSanIds(ids);
        if (files != null && !files.isEmpty()) {
            java.util.List<String> keys = files.stream()
                .map(com.ecotel.quanlytaisan.model.TaiSanFile::getFilePath)
                .filter(p -> p != null && !p.isEmpty())
                .collect(java.util.stream.Collectors.toList());
            if (!keys.isEmpty()) {
                try {
                    s3Service.deleteFiles(keys);
                } catch (Exception e) {
                    System.err.println("Failed to delete S3 files for batch assets.");
                }
            }
            for (String id : ids) {
                 taiSanFileDao.deleteByTaiSanId(id);
            }
        }
        
        chuKySuaChuaDao.batchDeleteByIdTaiSan(ids);
        return taiSanDao.batchDelete(ids);
    }

    @Transactional
    public int deleteAll() {
        // Handle files
        // (Assuming we want to delete all S3 files related to TaiSan when deleteAll is called)
        // If we want to do it properly, we should fetch all files and delete them.
        try {
             // In a real scenario we'd fetch all keys. We will skip complex S3 wipe here unless needed,
             // but we should at least not crash.
             // taiSanFileDao.deleteAll(); // Not implemented yet, so we just let DB cascade or ignore
        } catch (Exception e) {}
        
        chuKySuaChuaDao.deleteAll();
        // taiSanDao.deleteAllTaiSanCon(); // Deprecated
        return taiSanDao.deleteAll();
    }

    public int updateDonViTaiSan(List<Map<String, String>> maps) {
        int result = 0;

        // Map<idTaiSanCha, idDonVi> để lookup nhanh
        Map<String, String> donViMap = new HashMap<>();
        for (Map<String, String> map : maps) {
            donViMap.put(map.get("id"), map.get("idDonVi"));
        }

        // Update tài sản cha
        for (Map.Entry<String, String> entry : donViMap.entrySet()) {
            result += taiSanDao.updateDonViSoHuu(entry.getKey(), entry.getValue());
        }

        // Query batch lấy tất cả tài sản con theo danh sách id tài sản cha
        List<String> chaIds = new ArrayList<>(donViMap.keySet());
        List<TaiSanDTO> childAssets = taiSanDao.getTaiSanDTOByTaiSanChaIds(chaIds);
        if (childAssets != null && !childAssets.isEmpty()) {
            for (TaiSanDTO child : childAssets) {
                String idDonVi = donViMap.get(child.getIdTaiSanCha());
                if (idDonVi != null) {
                    result += taiSanDao.updateDonViSoHuu(child.getId(), idDonVi);
                }
            }
        }

        return result;
    }


    public int insertTaiSanCon(TaiSanCon tsCon) {
        return taiSanDao.insertTaiSanCon(tsCon);
    }

    public int updateTaiSanCon(TaiSanCon tsCon) {
        return taiSanDao.updateTaiSanCon(tsCon);
    }

    public int deleteTaiSanCon(String id) {
        return taiSanDao.deleteTaiSanCon(id);
    }

    public List<TaiSanCon> getTaiSanCon(String idTaiSan) {
        return taiSanDao.getTaiSanConByTaiSan(idTaiSan);
    }

    public List<TaiSanCon> getAllTSC() {
        return taiSanDao.getAll();
    }

    public List<KhauHaoTaiSan> getKhauHaoTaiSan(String idCongTy, int ngay, int thang, int nam) {
        return taiSanDao.getKhauHaoTaiSan(idCongTy, ngay, thang, nam);
    }

    public List<KhauHaoTaiSan> getKhauHaoTaiSanByNhom(String idCongTy, int ngay, int thang, int nam, String idNhomTaiSan, String idDonViHienThoi) {
        return taiSanDao.getKhauHaoTaiSanByNhom(idCongTy, ngay, thang, nam, idNhomTaiSan, idDonViHienThoi);
    }

    public List<TaiSan> readCsv(MultipartFile file) throws IOException {
        List<TaiSan> list = new ArrayList<>();

        // Sử dụng InputStreamReader với UTF-8
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true; // bỏ qua header
            while ((line = br.readLine()) != null) {
                if (firstLine) {
                    firstLine = false;
                    continue;
                }
                String[] fields = line.split(",", -1); // giữ giá trị rỗng
                TaiSan ts = TaiSan.mapToTaiSan(fields); // map từ CSV sang object
                list.add(ts);
            }
        }
        return list;
    }


    public List<TaiSan> readExcel(MultipartFile file) throws IOException {
        List<TaiSan> list = new ArrayList<>();
        Workbook workbook = WorkbookFactory.create(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        boolean firstRow = true;
        for (Row row : sheet) {
            if (firstRow) { // bỏ qua header
                firstRow = false;
                continue;
            }
            TaiSan ts = TaiSan.mapToTaiSan(row); // map từ Row sang object
            list.add(ts);
        }
        workbook.close();
        return list;
    }
    public int updateTaiSanCon(String idTaiSan, Boolean isTaiSanCon) {
        return taiSanDao.updateTaiSanCon(idTaiSan,isTaiSanCon);
    }

    public void exportToExcel(String idCongTy, OutputStream outputStream) throws IOException {
        // Lấy danh sách Tài sản trực tiếp từ DAO (không load các list con để tối ưu performance)
        List<TaiSanDTO> list = taiSanDao.findAll(idCongTy);

        // Tạo workbook và sheet
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("TaiSan");

        // Tạo font cho header
        Font headerFont = workbook.createFont();
        headerFont.setFontName("Times New Roman");
        headerFont.setFontHeightInPoints((short) 13);
        headerFont.setBold(true);

        // Tạo style cho header
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFont(headerFont);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);
        headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);

        // Tạo font cho data
        Font dataFont = workbook.createFont();
        dataFont.setFontName("Times New Roman");
        dataFont.setFontHeightInPoints((short) 13);

        // Tạo style cho data
        CellStyle dataStyle = workbook.createCellStyle();
        dataStyle.setFont(dataFont);
        dataStyle.setBorderBottom(BorderStyle.THIN);
        dataStyle.setBorderTop(BorderStyle.THIN);
        dataStyle.setBorderLeft(BorderStyle.THIN);
        dataStyle.setBorderRight(BorderStyle.THIN);

        // Tạo style cho số
        CellStyle numberStyle = workbook.createCellStyle();
        numberStyle.setFont(dataFont);
        numberStyle.setBorderBottom(BorderStyle.THIN);
        numberStyle.setBorderTop(BorderStyle.THIN);
        numberStyle.setBorderLeft(BorderStyle.THIN);
        numberStyle.setBorderRight(BorderStyle.THIN);
        numberStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("#,##0"));

        // Tạo style cho số thập phân
        CellStyle decimalStyle = workbook.createCellStyle();
        decimalStyle.setFont(dataFont);
        decimalStyle.setBorderBottom(BorderStyle.THIN);
        decimalStyle.setBorderTop(BorderStyle.THIN);
        decimalStyle.setBorderLeft(BorderStyle.THIN);
        decimalStyle.setBorderRight(BorderStyle.THIN);
        decimalStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("#,##0.00"));

        // Tạo header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {
            "Số thẻ tài sản",
            "Mã tài sản",
            "Tên tài sản",
            "Giá trị khấu hao ban đầu",
            "Kỳ khấu hao ban đầu",
            "Giá trị thanh lý",
            "Mã mô hình tài sản",
            "Mã nhóm tài sản",
            "Mã loại tài sản",
            "Mã dự án",
            "Vốn NS",
            "Vốn vay",
            "Vốn khác",
            "Phương pháp khấu hao",
            "Số kỳ khấu hao",
            "TK tài sản",
            "TK khấu hao",
            "TK chi phí",
            "Ngày vào sổ",
            "Ngày sử dụng",
            "Ký hiệu",
            "Số ký hiệu",
            "Công suất",
            "Nước sản xuất",
            "Năm sản xuất",
            "Lý do tăng",
            "Hiện trạng",
            "Số lượng",
            "Đơn vị tính",
            "Ghi chú",
            "Mã đơn vị ban đầu",
            "Mã đơn vị hiện thời",
            "Mô tả",
            "Mã đơn vị quản lý kỹ thuật",
            "Ngày tạo",
            "Ngày cập nhật",
            "Người tạo",
            "Người cập nhật"
        };

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Ghi dữ liệu
        int rowNum = 1;
        for (TaiSanDTO item : list) {
            Row row = sheet.createRow(rowNum++);
            int colIndex = 0;
            
            // Số thẻ tài sản
            Cell cell0 = row.createCell(colIndex++);
            cell0.setCellValue(item.getSoThe() != null ? item.getSoThe() : "");
            cell0.setCellStyle(dataStyle);
            
            // Mã tài sản
            Cell cell1 = row.createCell(colIndex++);
            cell1.setCellValue(item.getId() != null ? item.getId() : "");
            cell1.setCellStyle(dataStyle);
            
            // Tên tài sản
            Cell cell2 = row.createCell(colIndex++);
            cell2.setCellValue(item.getTenTaiSan() != null ? item.getTenTaiSan() : "");
            cell2.setCellStyle(dataStyle);
            
            // Giá trị khấu hao ban đầu
            Cell cell3 = row.createCell(colIndex++);
            if (item.getGiaTriKhauHaoBanDau() != null) {
                cell3.setCellValue(item.getGiaTriKhauHaoBanDau());
                cell3.setCellStyle(decimalStyle);
            } else {
                cell3.setCellValue("");
                cell3.setCellStyle(dataStyle);
            }
            
            // Kỳ khấu hao ban đầu
            Cell cell4 = row.createCell(colIndex++);
            if (item.getKyKhauHaoBanDau() != null) {
                cell4.setCellValue(item.getKyKhauHaoBanDau());
                cell4.setCellStyle(numberStyle);
            } else {
                cell4.setCellValue("");
                cell4.setCellStyle(dataStyle);
            }
            
            // Giá trị thanh lý
            Cell cell5 = row.createCell(colIndex++);
            if (item.getGiaTriThanhLy() != null) {
                cell5.setCellValue(item.getGiaTriThanhLy());
                cell5.setCellStyle(decimalStyle);
            } else {
                cell5.setCellValue("");
                cell5.setCellStyle(dataStyle);
            }
            
            // Mã mô hình tài sản
            Cell cell6 = row.createCell(colIndex++);
            cell6.setCellValue(item.getIdMoHinhTaiSan() != null ? item.getIdMoHinhTaiSan() : "");
            cell6.setCellStyle(dataStyle);
            
            // Mã nhóm tài sản
            Cell cell7 = row.createCell(colIndex++);
            cell7.setCellValue(item.getIdNhomTaiSan() != null ? item.getIdNhomTaiSan() : "");
            cell7.setCellStyle(dataStyle);
            
            // Mã loại tài sản
            Cell cell8 = row.createCell(colIndex++);
            cell8.setCellValue(item.getIdLoaiTaiSanCon() != null ? item.getIdLoaiTaiSanCon() : "");
            cell8.setCellStyle(dataStyle);
            
            // Mã dự án
            Cell cell9 = row.createCell(colIndex++);
            cell9.setCellValue(item.getIdDuAn() != null ? item.getIdDuAn() : "");
            cell9.setCellStyle(dataStyle);
            
            // Vốn NS
            Cell cell10 = row.createCell(colIndex++);
            if (item.getNvNS() != null) {
                cell10.setCellValue(item.getNvNS());
                cell10.setCellStyle(decimalStyle);
            } else {
                cell10.setCellValue("");
                cell10.setCellStyle(dataStyle);
            }
            
            // Vốn vay
            Cell cell11 = row.createCell(colIndex++);
            if (item.getVonVay() != null) {
                cell11.setCellValue(item.getVonVay());
                cell11.setCellStyle(decimalStyle);
            } else {
                cell11.setCellValue("");
                cell11.setCellStyle(dataStyle);
            }
            
            // Vốn khác
            Cell cell12 = row.createCell(colIndex++);
            if (item.getVonKhac() != null) {
                cell12.setCellValue(item.getVonKhac());
                cell12.setCellStyle(decimalStyle);
            } else {
                cell12.setCellValue("");
                cell12.setCellStyle(dataStyle);
            }
            
            // Phương pháp khấu hao
            Cell cell13 = row.createCell(colIndex++);
            if (item.getPhuongPhapKhauHao() != null) {
                cell13.setCellValue(item.getPhuongPhapKhauHao());
                cell13.setCellStyle(numberStyle);
            } else {
                cell13.setCellValue("");
                cell13.setCellStyle(dataStyle);
            }
            
            // Số kỳ khấu hao
            Cell cell14 = row.createCell(colIndex++);
            if (item.getSoKyKhauHao() != null) {
                cell14.setCellValue(item.getSoKyKhauHao());
                cell14.setCellStyle(numberStyle);
            } else {
                cell14.setCellValue("");
                cell14.setCellStyle(dataStyle);
            }
            
            // TK tài sản
            Cell cell15 = row.createCell(colIndex++);
            if (item.getTaiKhoanTaiSan() != null) {
                cell15.setCellValue(item.getTaiKhoanTaiSan());
                cell15.setCellStyle(numberStyle);
            } else {
                cell15.setCellValue("");
                cell15.setCellStyle(dataStyle);
            }
            
            // TK khấu hao
            Cell cell16 = row.createCell(colIndex++);
            if (item.getTaiKhoanKhauHao() != null) {
                cell16.setCellValue(item.getTaiKhoanKhauHao());
                cell16.setCellStyle(numberStyle);
            } else {
                cell16.setCellValue("");
                cell16.setCellStyle(dataStyle);
            }
            
            // TK chi phí
            Cell cell17 = row.createCell(colIndex++);
            if (item.getTaiKhoanChiPhi() != null) {
                cell17.setCellValue(item.getTaiKhoanChiPhi());
                cell17.setCellStyle(numberStyle);
            } else {
                cell17.setCellValue("");
                cell17.setCellStyle(dataStyle);
            }
            
            // Ngày vào sổ
            Cell cell18 = row.createCell(colIndex++);
            cell18.setCellValue(item.getNgayVaoSo() != null ? item.getNgayVaoSo() : "");
            cell18.setCellStyle(dataStyle);
            
            // Ngày sử dụng
            Cell cell19 = row.createCell(colIndex++);
            cell19.setCellValue(item.getNgaySuDung() != null ? item.getNgaySuDung() : "");
            cell19.setCellStyle(dataStyle);
            
            // Ký hiệu
            Cell cell20 = row.createCell(colIndex++);
            cell20.setCellValue(item.getKyHieu() != null ? item.getKyHieu() : "");
            cell20.setCellStyle(dataStyle);
            
            // Số ký hiệu
            Cell cell21 = row.createCell(colIndex++);
            cell21.setCellValue(item.getSoKyHieu() != null ? item.getSoKyHieu() : "");
            cell21.setCellStyle(dataStyle);
            
            // Công suất
            Cell cell22 = row.createCell(colIndex++);
            cell22.setCellValue(item.getCongSuat() != null ? item.getCongSuat() : "");
            cell22.setCellStyle(dataStyle);
            
            // Nước sản xuất
            Cell cell23 = row.createCell(colIndex++);
            cell23.setCellValue(item.getNuocSanXuat() != null ? item.getNuocSanXuat() : "");
            cell23.setCellStyle(dataStyle);
            
            // Năm sản xuất
            Cell cell24 = row.createCell(colIndex++);
            if (item.getNamSanXuat() != null) {
                cell24.setCellValue(item.getNamSanXuat());
                cell24.setCellStyle(numberStyle);
            } else {
                cell24.setCellValue("");
                cell24.setCellStyle(dataStyle);
            }
            
            // Lý do tăng
            Cell cell25 = row.createCell(colIndex++);
            cell25.setCellValue(item.getLyDoTang() != null ? item.getLyDoTang() : "");
            cell25.setCellStyle(dataStyle);
            
            // Hiện trạng
            Cell cell26 = row.createCell(colIndex++);
            if (item.getHienTrang() != null) {
                cell26.setCellValue(item.getHienTrang());
                cell26.setCellStyle(numberStyle);
            } else {
                cell26.setCellValue("");
                cell26.setCellStyle(dataStyle);
            }
            
            // Số lượng
            Cell cell27 = row.createCell(colIndex++);
            if (item.getSoLuong() != null) {
                cell27.setCellValue(item.getSoLuong());
                cell27.setCellStyle(numberStyle);
            } else {
                cell27.setCellValue("");
                cell27.setCellStyle(dataStyle);
            }
            
            // Đơn vị tính
            Cell cell28 = row.createCell(colIndex++);
            cell28.setCellValue(item.getDonViTinh() != null ? item.getDonViTinh() : "");
            cell28.setCellStyle(dataStyle);
            
            // Ghi chú
            Cell cell29 = row.createCell(colIndex++);
            cell29.setCellValue(item.getGhiChu() != null ? item.getGhiChu() : "");
            cell29.setCellStyle(dataStyle);
            
            // Mã đơn vị ban đầu
            Cell cell30 = row.createCell(colIndex++);
            cell30.setCellValue(item.getIdDonViBanDau() != null ? item.getIdDonViBanDau() : "");
            cell30.setCellStyle(dataStyle);
            
            // Mã đơn vị hiện thời
            Cell cell31 = row.createCell(colIndex++);
            cell31.setCellValue(item.getIdDonViHienThoi() != null ? item.getIdDonViHienThoi() : "");
            cell31.setCellStyle(dataStyle);
            
            // Mô tả
            Cell cell32 = row.createCell(colIndex++);
            cell32.setCellValue(item.getMoTa() != null ? item.getMoTa() : "");
            cell32.setCellStyle(dataStyle);
            
            // Ngày tạo
            Cell cell33 = row.createCell(colIndex++);
            cell33.setCellValue(item.getNgayTao() != null ? item.getNgayTao() : "");
            cell33.setCellStyle(dataStyle);
            
            // Ngày cập nhật
            Cell cell34 = row.createCell(colIndex++);
            cell34.setCellValue(item.getNgayCapNhat() != null ? item.getNgayCapNhat() : "");
            cell34.setCellStyle(dataStyle);
            
            // Người tạo
            Cell cell35 = row.createCell(colIndex++);
            cell35.setCellValue(item.getNguoiTao() != null ? item.getNguoiTao() : "");
            cell35.setCellStyle(dataStyle);
            
            // Người cập nhật
            Cell cell36 = row.createCell(colIndex++);
            cell36.setCellValue(item.getNguoiCapNhat() != null ? item.getNguoiCapNhat() : "");
            cell36.setCellStyle(dataStyle);

            // Đơn vị quản lý kỹ thuật
            Cell cell37 = row.createCell(colIndex++);
            cell37.setCellValue(item.getIdDonViQuanlyKiThuat() != null ? item.getIdDonViQuanlyKiThuat() : "");
            cell37.setCellStyle(dataStyle);
        }

        // Set column widths (tối ưu hơn auto-size)
        // Auto-size chỉ cho một số cột quan trọng, các cột khác set width cố định
        int[] columnWidths = {
            15,  // Số thẻ tài sản
            20,  // Mã tài sản
            30,  // Tên tài sản
            20,  // Giá trị khấu hao ban đầu
            18,  // Kỳ khấu hao ban đầu
            18,  // Giá trị thanh lý
            20,  // Mã mô hình tài sản
            18,  // Mã nhóm tài sản
            18,  // Mã loại tài sản
            15,  // Mã dự án
            15,  // Vốn NS
            15,  // Vốn vay
            15,  // Vốn khác
            20,  // Phương pháp khấu hao
            18,  // Số kỳ khấu hao
            15,  // TK tài sản
            15,  // TK khấu hao
            15,  // TK chi phí
            18,  // Ngày vào sổ
            18,  // Ngày sử dụng
            15,  // Ký hiệu
            15,  // Số ký hiệu
            15,  // Công suất
            18,  // Nước sản xuất
            15,  // Năm sản xuất
            25,  // Lý do tăng
            15,  // Hiện trạng
            12,  // Số lượng
            15,  // Đơn vị tính
            30,  // Ghi chú
            20,  // Mã đơn vị ban đầu
            20,  // Mã đơn vị hiện thời
            40,  // Mô tả
            18,  // Ngày tạo
            18,  // Ngày cập nhật
            20,  // Người tạo
            20   // Người cập nhật
        };
        
        for (int i = 0; i < headers.length && i < columnWidths.length; i++) {
            sheet.setColumnWidth(i, columnWidths[i] * 256); // Excel width unit = 1/256 of a character
        }

        // Ghi workbook ra output stream
        workbook.write(outputStream);
        workbook.close();
    }

    /**
     * Lấy danh sách tài sản chia thành 2 nhóm: đã bàn giao và chưa bàn giao
     * Sử dụng SQL query trực tiếp để tối ưu performance
     * @param idCongTy ID công ty
     * @param page Trang hiện tại
     * @param size Số lượng item trên một trang
     * @param sortBy Cột sắp xếp
     * @param sortDir Hướng sắp xếp
     * @param search Từ khóa tìm kiếm (không áp dụng trong phiên bản SQL tối ưu)
     * @param idNhomTaiSan ID nhóm tài sản
     * @return Map chứa 2 key: "daBanGiao" và "chuaBanGiao" với dữ liệu phân trang
     */
    public Map<String, Object> getAllPagedWithBanGiaoStatus(String idCongTy, int page, int size,
                                                            String sortBy, String sortDir,
                                                            String search, String idNhomTaiSan, String idDonViHienThoi, int soNgayThongBaoKiemDinh, String trangThaiKiemDinh) {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        int offset = page * size;
        
        List<TaiSanDTO> daBanGiaoItems = taiSanDao.findAllPagedWithBanGiaoStatus(idCongTy, offset, size, sortBy, sortDir, idNhomTaiSan, true, soNgayThongBaoKiemDinh, trangThaiKiemDinh);
        long totalDa = taiSanDao.countByCongTyAndBanGiaoStatus(idCongTy, idNhomTaiSan, true, soNgayThongBaoKiemDinh, trangThaiKiemDinh);

        List<TaiSanDTO> chuaBanGiaoItems = taiSanDao.findAllPagedWithBanGiaoStatus(idCongTy, offset, size, sortBy, sortDir, idNhomTaiSan, false, soNgayThongBaoKiemDinh, trangThaiKiemDinh);
        long totalChua = taiSanDao.countByCongTyAndBanGiaoStatus(idCongTy, idNhomTaiSan, false, soNgayThongBaoKiemDinh, trangThaiKiemDinh);

        enrichTaiSanDTOList(daBanGiaoItems);
        enrichTaiSanDTOList(chuaBanGiaoItems);

        // ĐẾM THỰC TẾ riêng cho từng tab với filter search
        Map<String, Long> groupCountsDaBanGiao = taiSanDao.getCountByNhomTaiSanWithBanGiaoStatus(idCongTy, true, search, idDonViHienThoi);
        Map<String, Long> groupCountsChuaBanGiao = taiSanDao.getCountByNhomTaiSanWithBanGiaoStatus(idCongTy, false, search, idDonViHienThoi);
        Map<String, Long> groupCountsAll = taiSanDao.getCountByNhomTaiSanWithBanGiaoStatus(idCongTy, null, search, idDonViHienThoi);

        PageResponse<TaiSanDTO> daBanGiaoResponse = new PageResponse<>(daBanGiaoItems, totalDa, page, size);
        daBanGiaoResponse.setGroupCounts(groupCountsDaBanGiao);

        PageResponse<TaiSanDTO> chuaBanGiaoResponse = new PageResponse<>(chuaBanGiaoItems, totalChua, page, size);
        chuaBanGiaoResponse.setGroupCounts(groupCountsChuaBanGiao);

        Map<String, Object> result = new HashMap<>();
        result.put("daBanGiao", daBanGiaoResponse);
        result.put("chuaBanGiao", chuaBanGiaoResponse);
        result.put("groupCountsAll", groupCountsAll);

        return result;
    }


    public PageResponse<TaiSanDTO> getPagedByBanGiaoStatus(
        String idCongTy, 
        int page, 
        int size,
        String sortBy, 
        String sortDir,
        String search, 
        String idNhomTaiSan, 
        String idDonViHienThoi, 
        boolean isBanGiao, 
        int soNgayThongBaoKiemDinh, 
        String trangThaiKiemDinh,
        Boolean isPhatSinh) {
    
        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        int offset = page * size;
        
        // Lấy tổng số từ DAO
        long total = taiSanDao.countByBanGiaoStatus(
            idCongTy, isBanGiao, search, idNhomTaiSan, 
            idDonViHienThoi, soNgayThongBaoKiemDinh, trangThaiKiemDinh, isPhatSinh
        );
        
        // Lấy danh sách phân trang từ DAO
        List<TaiSanDTO> items = taiSanDao.findByBanGiaoStatusPaged(
            idCongTy, isBanGiao, offset, size, sortBy, sortDir,
            search, idNhomTaiSan, idDonViHienThoi, 
            soNgayThongBaoKiemDinh, trangThaiKiemDinh, isPhatSinh
        );
        
        // Enrich children lists
        enrichTaiSanDTOList(items);
        
        // Lấy group counts
        Map<String, Long> groupCounts = taiSanDao.getCountByNhomTaiSanWithBanGiaoStatus(
            idCongTy, isBanGiao, search, idDonViHienThoi
        );
        Map<String, Long> kiemDinhCounts = taiSanDao.getCountByTrangThaiKiemDinh(
            idCongTy, "DA_BAN_GIAO", null, search, idNhomTaiSan, idDonViHienThoi, soNgayThongBaoKiemDinh
        );
        long phatSinhCount = taiSanDao.countByBanGiaoStatus(idCongTy, isBanGiao, search, idNhomTaiSan, idDonViHienThoi, soNgayThongBaoKiemDinh, null, true);
        kiemDinhCounts.put("Tai san phat sinh", phatSinhCount);

        PageResponse<TaiSanDTO> response = new PageResponse<>(items, total, page, size);
        response.setGroupCounts(groupCounts);
        response.setLoaiCounts(kiemDinhCounts);
        
        return response;
    }

    private void enrichTaiSanDTOList(List<TaiSanDTO> taiSanDTOList) {
        if (taiSanDTOList == null || taiSanDTOList.isEmpty()) {
            return;
        }
        System.out.println("1");

        List<String> ids = taiSanDTOList.stream()
                .map(TaiSanDTO::getId)
                .collect(Collectors.toList());
        System.out.println("2");
        System.out.println("ids: " + ids);
        // Fetch all related data in parallel

        CompletableFuture<List<TaiSanDTO>> taiSanConFuture = CompletableFuture.supplyAsync(() -> 
            taiSanDao.getTaiSanDTOByTaiSanChaIds(ids)
        );
        System.out.println("3");
        System.out.println("taiSanConFuture: " + taiSanConFuture);
        CompletableFuture<List<TaiSanFile>> taiSanFileFuture = CompletableFuture.supplyAsync(() ->
            taiSanFileDao.findAllByTaiSanIds(ids)
        );
        System.out.println("4");
        CompletableFuture<List<ChuKySuaChua>> chuKySuaChuaFuture = CompletableFuture.supplyAsync(() ->
            chuKySuaChuaDao.findAllByTaiSanIds(ids)
        );


        // Wait for all to complete and get results
        List<TaiSanDTO> allTaiSanCon;
        List<TaiSanFile> allTaiSanFile;
        List<ChuKySuaChua> allChuKySuaChua;
        try {
            CompletableFuture.allOf(taiSanConFuture, taiSanFileFuture, chuKySuaChuaFuture).join();
            allTaiSanCon = taiSanConFuture.get();
            allTaiSanFile = taiSanFileFuture.get();
            allChuKySuaChua = chuKySuaChuaFuture.get();
        } catch (Exception e) {
            e.printStackTrace();
            return;
        }

        Map<String, List<TaiSanDTO>> taiSanConMap = allTaiSanCon.stream()
                .collect(Collectors.groupingBy(TaiSanDTO::getIdTaiSanCha));
        Map<String, List<TaiSanFile>> taiSanFileMap = allTaiSanFile.stream()
                .collect(Collectors.groupingBy(TaiSanFile::getIdTaiSan));
        Map<String, List<ChuKySuaChua>> chuKySuaChuaMap = allChuKySuaChua.stream()
                .collect(Collectors.groupingBy(ChuKySuaChua::getIdTaiSan));

        // Assign back to DTOs
        for (TaiSanDTO dto : taiSanDTOList) {
            dto.setTaiSanConList(taiSanConMap.getOrDefault(dto.getId(), new ArrayList<>()));
            dto.setFileDinhKemList(taiSanFileMap.getOrDefault(dto.getId(), new ArrayList<>()));
            dto.setChuKySuaChuaList(chuKySuaChuaMap.getOrDefault(dto.getId(), new ArrayList<>()));
        }
    }

    /**
     * Search TaiSan theo cac truong: id, tenTaiSan, soThe, kyHieu, soKyHieu, tenNhom, congSuat, nuocSanXuat
     */
    private boolean matchesTaiSanSearch(TaiSanDTO item, String query) {
        if (item == null || query == null || query.isEmpty()) {
            return false;
        }
        String q = query.toLowerCase();
        return containsIgnoreCase(item.getId(), q)
            || containsIgnoreCase(item.getTenTaiSan(), q)
            || containsIgnoreCase(item.getSoThe(), q)
            || containsIgnoreCase(item.getKyHieu(), q)
            || containsIgnoreCase(item.getSoKyHieu(), q)
            || containsIgnoreCase(item.getTenNhom(), q)
            || containsIgnoreCase(item.getCongSuat(), q)
            || containsIgnoreCase(item.getNuocSanXuat(), q)
            || containsIgnoreCase(item.getDonViTinh(), q)
            || containsIgnoreCase(item.getMoTa(), q);
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }

    /**
     * Sort danh sach TaiSanDTO theo sortBy va sortDir
     */
    private void sortTaiSanList(List<TaiSanDTO> list, String sortBy, String sortDir) {
        if (list == null || list.isEmpty()) return;

        String normalizedSortBy = sortBy != null ? sortBy.trim().toLowerCase() : "ngaycapnhat";
        boolean asc = sortDir != null && sortDir.equalsIgnoreCase("asc");

        java.util.Comparator<TaiSanDTO> comparator = (a, b) -> {
            int result = 0;
            switch (normalizedSortBy) {
                case "tents":
                case "tentaisan":
                    result = compareStrings(a.getTenTaiSan(), b.getTenTaiSan());
                    break;
                case "sothe":
                    result = compareStrings(a.getSoThe(), b.getSoThe());
                    break;
                case "ngaysudung":
                    result = compareStrings(a.getNgaySuDung(), b.getNgaySuDung());
                    break;
                case "nguyengia":
                    result = compareDoubles(a.getNguyenGia(), b.getNguyenGia());
                    break;
                case "ngaytao":
                    result = compareStrings(a.getNgayTao(), b.getNgayTao());
                    break;
                case "ngaycapnhat":
                default:
                    result = compareStrings(a.getNgayCapNhat(), b.getNgayCapNhat());
                    break;
            }
            return asc ? result : -result;
        };

        list.sort(comparator);
    }

    private int compareStrings(String a, String b) {
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;
        return a.compareTo(b);
    }

    private int compareDoubles(Double a, Double b) {
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;
        return a.compareTo(b);
    }

    /**
     * Lay danh sach ID cac phong ban la kho thu hoi (LoaiKho = 2)
     * Chi query 1 lan, su dung de filter nhanh
     */
    private java.util.Set<String> getKhoThuHoiIds(String idCongTy) {
        List<PhongBanDTO> allPhongBan = phongBanDao.findAll(idCongTy);
        java.util.Set<String> khoThuHoiIds = new java.util.HashSet<>();
        for (PhongBanDTO pb : allPhongBan) {
            if (pb.getLoaiKho() != null && pb.getLoaiKho() == 2) {
                khoThuHoiIds.add(pb.getId());
            }
        }
        return khoThuHoiIds;
    }

    /**
     * Lấy danh sách khấu hao tài sản với phân trang và tìm kiếm
     */
    public PageResponse<KhauHaoTaiSan> getKhauHaoTaiSanPaged(
            String idCongTy, int ngay, int thang, int nam,
            int page, int size, String sortBy, String sortDir, String search) {

        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        // Lấy toàn bộ dữ liệu khấu hao (sử dụng method hiện có)
        List<KhauHaoTaiSan> all = taiSanDao.getKhauHaoTaiSan(idCongTy, ngay, thang, nam);

        // Filter theo search
        List<KhauHaoTaiSan> filtered = filterKhauHaoTaiSan(all, search);

        // Sort
        sortKhauHaoTaiSanList(filtered, sortBy, sortDir);

        // Pagination
        long total = filtered.size();
        int from = Math.min(page * size, filtered.size());
        int to = Math.min(from + size, filtered.size());
        List<KhauHaoTaiSan> items = new ArrayList<>(filtered.subList(from, to));

        return new PageResponse<>(items, total, page, size);
    }

    /**
     * Lấy danh sách khấu hao tài sản theo nhóm với phân trang và tìm kiếm
     */
    public PageResponse<KhauHaoTaiSan> getKhauHaoTaiSanByNhomPaged(
            String idCongTy, int ngay, int thang, int nam, String idNhomTaiSan,String idDonViHienThoi,
            int page, int size, String sortBy, String sortDir, String search) {

        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        // Lấy toàn bộ dữ liệu khấu hao theo nhóm (sử dụng method hiện có)
        List<KhauHaoTaiSan> all = taiSanDao.getKhauHaoTaiSanByNhom(idCongTy, ngay, thang, nam, idNhomTaiSan,idDonViHienThoi);

        // Filter theo search
        List<KhauHaoTaiSan> filtered = filterKhauHaoTaiSan(all, search);

        // Sort
        sortKhauHaoTaiSanList(filtered, sortBy, sortDir);

        // Pagination
        long total = filtered.size();
        int from = Math.min(page * size, filtered.size());
        int to = Math.min(from + size, filtered.size());
        List<KhauHaoTaiSan> items = new ArrayList<>(filtered.subList(from, to));

        return new PageResponse<>(items, total, page, size);
    }

    /**
     * Filter danh sách khấu hao theo search
     */
    private List<KhauHaoTaiSan> filterKhauHaoTaiSan(List<KhauHaoTaiSan> list, String search) {
        if (search == null || search.trim().isEmpty()) {
            return list;
        }

        String q = search.toLowerCase().trim();
        List<KhauHaoTaiSan> filtered = new ArrayList<>();

        for (KhauHaoTaiSan item : list) {
            if (matchesKhauHaoSearch(item, q)) {
                filtered.add(item);
            }
        }

        return filtered;
    }

    /**
     * Kiểm tra khấu hao có khớp với search không
     */
    private boolean matchesKhauHaoSearch(KhauHaoTaiSan item, String query) {
        if (item == null || query == null || query.isEmpty()) {
            return false;
        }

        return containsIgnoreCase(item.getSoThe(), query)
                || containsIgnoreCase(item.getTenTaiSan(), query)
                || containsIgnoreCase(item.getNguonVon(), query)
                || containsIgnoreCase(item.getMaTk(), query)
                || containsIgnoreCase(item.getTkNo(), query)
                || containsIgnoreCase(item.getTkCo(), query)
                || containsIgnoreCase(item.getDtgt(), query)
                || containsIgnoreCase(item.getDtth(), query)
                || containsIgnoreCase(item.getKmcp(), query)
                || containsIgnoreCase(item.getGhiChuKhao(), query);
    }

    /**
     * Sort danh sách khấu hao tài sản
     */
    private void sortKhauHaoTaiSanList(List<KhauHaoTaiSan> list, String sortBy, String sortDir) {
        if (list == null || list.isEmpty()) return;

        String normalizedSortBy = sortBy != null ? sortBy.trim().toLowerCase() : "ngaytinhkhao";
        boolean asc = sortDir != null && sortDir.equalsIgnoreCase("asc");

        java.util.Comparator<KhauHaoTaiSan> comparator = (a, b) -> {
            int result = 0;
            switch (normalizedSortBy) {
                case "sothe":
                    result = compareStrings(a.getSoThe(), b.getSoThe());
                    break;
                case "tentaisan":
                    result = compareStrings(a.getTenTaiSan(), b.getTenTaiSan());
                    break;
                case "nguonvon":
                    result = compareStrings(a.getNguonVon(), b.getNguonVon());
                    break;
                case "matk":
                    result = compareStrings(a.getMaTk(), b.getMaTk());
                    break;
                case "nguyengia":
                    result = compareBigDecimals(a.getNguyenGia(), b.getNguyenGia());
                    break;
                case "khauhaobandau":
                    result = compareBigDecimals(a.getKhauHaoBanDau(), b.getKhauHaoBanDau());
                    break;
                case "khauhaopsdk":
                    result = compareBigDecimals(a.getKhauHaoPsdk(), b.getKhauHaoPsdk());
                    break;
                case "gtclbandau":
                    result = compareBigDecimals(a.getGtclBanDau(), b.getGtclBanDau());
                    break;
                case "khauhaopsck":
                    result = compareBigDecimals(a.getKhauHaoPsck(), b.getKhauHaoPsck());
                    break;
                case "gtclhientai":
                    result = compareBigDecimals(a.getGtclHienTai(), b.getGtclHienTai());
                    break;
                case "khauhaobinhquan":
                    result = compareBigDecimals(a.getKhauHaoBinhQuan(), b.getKhauHaoBinhQuan());
                    break;
                case "sotien":
                    result = compareBigDecimals(a.getSoTien(), b.getSoTien());
                    break;
                case "chenhlech":
                    result = compareBigDecimals(a.getChenhLech(), b.getChenhLech());
                    break;
                case "khkytruoc":
                    result = compareBigDecimals(a.getKhKyTruoc(), b.getKhKyTruoc());
                    break;
                case "clkytruoc":
                    result = compareBigDecimals(a.getClKyTruoc(), b.getClKyTruoc());
                    break;
                case "thangkh":
                    result = compareIntegers(a.getThangKh(), b.getThangKh());
                    break;
                case "hsdckh":
                    result = compareIntegers(a.getHsdCkh(), b.getHsdCkh());
                    break;
                case "tkno":
                    result = compareStrings(a.getTkNo(), b.getTkNo());
                    break;
                case "tkco":
                    result = compareStrings(a.getTkCo(), b.getTkCo());
                    break;
                case "nvns":
                    result = compareDoubles(a.getNvNS(), b.getNvNS());
                    break;
                case "vonvay":
                    result = compareDoubles(a.getVonVay(), b.getVonVay());
                    break;
                case "vonkhac":
                    result = compareDoubles(a.getVonKhac(), b.getVonKhac());
                    break;
                case "ngaytinhkhao":
                default:
                    result = compareDates(a.getNgayTinhKhao(), b.getNgayTinhKhao());
                    break;
            }
            return asc ? result : -result;
        };

        list.sort(comparator);
    }


    /**
     * So sánh Integer (null-safe)
     */
    private int compareIntegers(Integer a, Integer b) {
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;
        return a.compareTo(b);
    }

    private int compareBigDecimals(java.math.BigDecimal a, java.math.BigDecimal b) {
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;
        return a.compareTo(b);
    }

    private int compareDates(java.util.Date a, java.util.Date b) {
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;
        return a.compareTo(b);
    }
}
