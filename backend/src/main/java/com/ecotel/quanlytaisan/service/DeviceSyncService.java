package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.TaiSanDao;
import com.ecotel.quanlytaisan.dao.NhomTaiSanDao;
import com.ecotel.quanlytaisan.dao.mongo.MongoDeviceRepository;
import com.ecotel.quanlytaisan.model.TaiSan;
import com.ecotel.quanlytaisan.model.TaiSanDTO;
import com.ecotel.quanlytaisan.model.NhomTaiSan;
import com.ecotel.quanlytaisan.model.mongo.MongoDevice;
import com.ecotel.quanlytaisan.model.mongo.MongoDepartment;
import com.ecotel.quanlytaisan.model.mongo.MongoDeviceType;
import com.ecotel.quanlytaisan.dao.mongo.MongoDepartmentRepository;
import com.ecotel.quanlytaisan.dao.mongo.MongoDeviceTypeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class DeviceSyncService {

    @Autowired
    private TaiSanDao taiSanDao;

    @Autowired
    private MongoDepartmentRepository mongoDepartmentRepository;

    @Autowired
    private MongoDeviceRepository mongoDeviceRepository;

    @Autowired
    private MongoDeviceTypeRepository mongoDeviceTypeRepository;

    @Autowired
    private NhomTaiSanDao nhomTaiSanDao;

    @Autowired
    private DepartmentSyncService departmentSyncService;

    public void syncDevices() {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String currentTime = dtf.format(LocalDateTime.now());

        // 1. Đồng bộ phòng ban trước
        log.info("Gọi đồng bộ phòng ban trước khi đồng bộ thiết bị...");
        departmentSyncService.syncDepartments();

        // Lấy danh sách departments để map department -> code
        List<MongoDepartment> allDepts = mongoDepartmentRepository.findAll();
        java.util.Map<String, String> deptIdToCodeMap = new java.util.HashMap<>();
        for (MongoDepartment d : allDepts) {
            deptIdToCodeMap.put(d.getId(), d.getCode());
        }

        // 2. Đồng bộ NhomTaiSan (từ deviceTypes)
        log.info("Đồng bộ NhomTaiSan (deviceTypes)...");
        List<MongoDeviceType> deviceTypes = mongoDeviceTypeRepository.findAll();
        List<NhomTaiSan> existingNhomTaiSans = nhomTaiSanDao.findAll("CT001");
        java.util.Map<String, String> deviceTypeIdToMySQLId = new java.util.HashMap<>();

        for (MongoDeviceType dt : deviceTypes) {
            if (dt.getName() == null || dt.getName().isEmpty()) continue;
            
            // Tìm xem đã có trong MySQL chưa (dựa theo tên)
            Optional<NhomTaiSan> existing = existingNhomTaiSans.stream()
                    .filter(n -> dt.getName().equals(n.getTenNhom()))
                    .findFirst();
                    
            if (existing.isPresent()) {
                deviceTypeIdToMySQLId.put(dt.getId(), existing.get().getId());
            } else {
                // Tạo mới
                NhomTaiSan nts = new NhomTaiSan();
                String newId = java.util.UUID.randomUUID().toString();
                nts.setId(newId);
                nts.setTenNhom(dt.getName());
                nts.setHieuLuc(true);
                nts.setIdCongTy("CT001");
                nts.setNgayTao(currentTime);
                nts.setNgayCapNhat(currentTime);
                nts.setNguoiTao("admin");
                nts.setNguoiCapNhat("admin");
                nts.setIsActive(true);
                
                nhomTaiSanDao.insert(nts);
                
                deviceTypeIdToMySQLId.put(dt.getId(), newId);
            }
        }

        // 3. Đồng bộ thiết bị
        log.info("Bắt đầu đồng bộ dữ liệu từ MongoDB (devices) sang MySQL (TaiSan)...");

        List<MongoDevice> devices = mongoDeviceRepository.findAll();

        int successCount = 0;
        int failCount = 0;

        for (MongoDevice device : devices) {
            try {
                if (device.getCode() == null || device.getCode().trim().isEmpty()) {
                    log.warn("Bỏ qua device vì không có code: {}", device);
                    failCount++;
                    continue;
                }

                String sothe = device.getVehicleNumber();
                if (sothe == null || sothe.trim().isEmpty()) {
                    sothe = device.getCode(); // Fallback code as sothe
                }

                // Lấy code của phòng ban để gán cho idDonViHienThoi
                String idDonViHienThoi = null;
                if (device.getDepartment() != null) {
                    idDonViHienThoi = deptIdToCodeMap.get(device.getDepartment());
                }

                // Lấy idNhomTaiSan từ category
                String idNhomTaiSan = null;
                if (device.getCategory() != null) {
                    idNhomTaiSan = deviceTypeIdToMySQLId.get(device.getCategory());
                }

                // Chuyển đổi dữ liệu MongoDevice sang TaiSan
                TaiSan ts = new TaiSan();
                ts.setId(device.getCode());
                ts.setSoThe(sothe);
                ts.setTenTaiSan(device.getName() != null ? device.getName() : "Không tên");
                ts.setIdCongTy("CT001");
                ts.setNgayTao(currentTime);
                ts.setNgayCapNhat(currentTime);
                ts.setNguoiTao("admin");
                ts.setNguoiCapNhat("admin");
                ts.setIsActive(true);
                ts.setIdDonViBanDau("Cty");
                ts.setIdDonViHienThoi(idDonViHienThoi);
                ts.setIdNhomTaiSan(idNhomTaiSan);
                ts.setSoLuong(1);

                // Các trường bắt buộc khác có thể set giá trị mặc định để tránh lỗi SQL Not Null (tùy theo DB schema)
                // Dao.insert đã có cơ chế upsert tự động
                TaiSanDTO existing = taiSanDao.findById(ts.getId());
                if(existing != null) {
                    // Bản ghi đã tồn tại -> UPDATE.
                    // Copy lại những trường của existing mà Mongo KHÔNG có, 
                    // giữ nguyên những trường đã được parse từ Mongo để nó đè lên database.
                    ts.setNguyenGia(existing.getNguyenGia() != null ? existing.getNguyenGia().floatValue() : null);
                    ts.setGiaTriKhauHaoBanDau(existing.getGiaTriKhauHaoBanDau() != null ? existing.getGiaTriKhauHaoBanDau().floatValue() : null);
                    ts.setKyKhauHaoBanDau(existing.getKyKhauHaoBanDau());
                    ts.setGiaTriThanhLy(existing.getGiaTriThanhLy() != null ? existing.getGiaTriThanhLy().floatValue() : null);
                    ts.setIdMoHinhTaiSan(existing.getIdMoHinhTaiSan());
                    ts.setPhuongPhapKhauHao(existing.getPhuongPhapKhauHao());
                    ts.setSoKyKhauHao(existing.getSoKyKhauHao());
                    ts.setTaiKhoanTaiSan(existing.getTaiKhoanTaiSan());
                    ts.setTaiKhoanKhauHao(existing.getTaiKhoanKhauHao());
                    ts.setTaiKhoanChiPhi(existing.getTaiKhoanChiPhi());
                    // KHÔNG LẤY LẠI existing.getIdNhomTaiSan() ĐỂ UPDATE GIÁ TRỊ MỚI TỪ MONGO
                    ts.setNgayVaoSo(existing.getNgayVaoSo());
                    ts.setNgaySuDung(existing.getNgaySuDung());
                    ts.setIdDuDan(existing.getIdDuAn());
                    ts.setIdNguonVon(existing.getIdNguonVon());
                    ts.setKyHieu(existing.getKyHieu());
                    ts.setSoKyHieu(existing.getSoKyHieu());
                    ts.setCongSuat(existing.getCongSuat());
                    ts.setNuocSanXuat(existing.getNuocSanXuat());
                    ts.setNamSanXuat(existing.getNamSanXuat());
                    ts.setLyDoTang(existing.getLyDoTang());
                    ts.setHienTrang(existing.getHienTrang());
                    // KHÔNG LẤY LẠI existing.getSoLuong() ĐỂ UPDATE SỐ LƯỢNG MỚI (1)
                    ts.setDonViTinh(existing.getDonViTinh());
                    ts.setGhiChu(existing.getGhiChu());
                    // KHÔNG LẤY LẠI existing.getIdDonViBanDau() ĐỂ UPDATE GIÁ TRỊ MỚI TỪ MONGO
                    // KHÔNG LẤY LẠI existing.getIdDonViHienThoi() ĐỂ UPDATE GIÁ TRỊ MỚI TỪ MONGO
                    ts.setIdDonViQuanlyKiThuat(existing.getIdDonViQuanlyKiThuat());
                    ts.setMoTa(existing.getMoTa());
                    
                    // Giữ nguyên ngày tạo và người tạo ban đầu
                    ts.setNguoiTao(existing.getNguoiTao());
                    ts.setNgayTao(existing.getNgayTao());
                    
                    ts.setIsTaiSanCon(existing.getIsTaiSanCon() != null ? existing.getIsTaiSanCon() : false);
                    ts.setIsHeThong(existing.getIsHeThong() != null ? existing.getIsHeThong() : false);
                    ts.setTrangThaiSuaChua(existing.getTrangThaiSuaChua());
                    ts.setIdLoaiTaiSanCon(existing.getIdLoaiTaiSanCon());
                    ts.setNvNS(existing.getNvNS() != null ? existing.getNvNS().floatValue() : null);
                    ts.setVonVay(existing.getVonVay() != null ? existing.getVonVay().floatValue() : null);
                    ts.setVonKhac(existing.getVonKhac() != null ? existing.getVonKhac().floatValue() : null);
                    ts.setTgKiemDinh(existing.getTgKiemDinh());
                    ts.setChuKyKiemDinh(existing.getChuKyKiemDinh());
                    ts.setIdTaiSanCha(existing.getIdTaiSanCha());
                    ts.setTrangThaiSuaChua(existing.getTrangThaiSuaChua());
                }

                taiSanDao.insert(ts);
                successCount++;
            } catch (Exception e) {
                log.error("Lỗi khi đồng bộ thiết bị code {}: {}", device.getCode(), e.getMessage());
                failCount++;
            }
        }
        log.info("Đồng bộ hoàn tất. Thành công: {}, Thất bại: {}", successCount, failCount);
    }

    /**
     * Đồng bộ một device type đơn lẻ (từ Change Streams).
     * Trả về MySQL ID của nhóm tài sản sau khi upsert.
     */
    public String syncSingleDeviceType(MongoDeviceType dt) {
        if (dt == null || dt.getName() == null || dt.getName().isEmpty()) {
            log.warn("Bỏ qua deviceType vì không có name: {}", dt);
            return null;
        }
        String currentTime = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").format(LocalDateTime.now());
        List<NhomTaiSan> existing = nhomTaiSanDao.findAll("CT001");
        Optional<NhomTaiSan> found = existing.stream()
                .filter(n -> dt.getName().equals(n.getTenNhom()))
                .findFirst();
        if (found.isPresent()) {
            log.info("DeviceType '{}' đã tồn tại trong NhomTaiSan với id={}", dt.getName(), found.get().getId());
            return found.get().getId();
        }
        NhomTaiSan nts = new NhomTaiSan();
        String newId = java.util.UUID.randomUUID().toString();
        nts.setId(newId);
        nts.setTenNhom(dt.getName());
        nts.setHieuLuc(true);
        nts.setIdCongTy("CT001");
        nts.setNgayTao(currentTime);
        nts.setNgayCapNhat(currentTime);
        nts.setNguoiTao("admin");
        nts.setNguoiCapNhat("admin");
        nts.setIsActive(true);
        nhomTaiSanDao.insert(nts);
        log.info("Đã tạo mới NhomTaiSan '{}' với id={}", dt.getName(), newId);
        return newId;
    }

    /**
     * Đồng bộ một device đơn lẻ (từ Change Streams).
     * Tự động lookup phòng ban và nhóm tài sản trong DB.
     */
    public void syncSingleDevice(MongoDevice device) {
        if (device == null || device.getCode() == null || device.getCode().trim().isEmpty()) {
            log.warn("Bỏ qua device vì không có code: {}", device);
            return;
        }
        String currentTime = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").format(LocalDateTime.now());

        // Lookup phòng ban
        String idDonViHienThoi = null;
        if (device.getDepartment() != null) {
            mongoDepartmentRepository.findById(device.getDepartment()).ifPresent(dept -> {
                // sẽ được gán bên dưới
            });
            // Tìm department từ MongoDB và lấy code của nó
            java.util.Optional<com.ecotel.quanlytaisan.model.mongo.MongoDepartment> deptOpt =
                    mongoDepartmentRepository.findById(device.getDepartment());
            if (deptOpt.isPresent()) {
                idDonViHienThoi = deptOpt.get().getCode();
            }
        }

        // Lookup nhóm tài sản
        String idNhomTaiSan = null;
        if (device.getCategory() != null) {
            java.util.Optional<MongoDeviceType> dtOpt = mongoDeviceTypeRepository.findById(device.getCategory());
            if (dtOpt.isPresent()) {
                // Tìm trong MySQL theo tên
                List<NhomTaiSan> nhomList = nhomTaiSanDao.findAll("CT001");
                Optional<NhomTaiSan> nhomFound = nhomList.stream()
                        .filter(n -> dtOpt.get().getName().equals(n.getTenNhom()))
                        .findFirst();
                if (nhomFound.isPresent()) {
                    idNhomTaiSan = nhomFound.get().getId();
                } else {
                    // Chưa có nhóm tài sản -> tạo mới
                    idNhomTaiSan = syncSingleDeviceType(dtOpt.get());
                }
            }
        }

        String sothe = device.getVehicleNumber();
        if (sothe == null || sothe.trim().isEmpty()) sothe = device.getCode();

        TaiSan ts = new TaiSan();
        ts.setId(device.getCode());
        ts.setSoThe(sothe);
        ts.setTenTaiSan(device.getName() != null ? device.getName() : "Không tên");
        ts.setIdCongTy("CT001");
        ts.setNgayTao(currentTime);
        ts.setNgayCapNhat(currentTime);
        ts.setNguoiTao("admin");
        ts.setNguoiCapNhat("admin");
        ts.setIsActive(true);
        ts.setIdDonViBanDau("Cty");
        ts.setIdDonViHienThoi(idDonViHienThoi);
        ts.setIdNhomTaiSan(idNhomTaiSan);
        ts.setSoLuong(1);

        TaiSanDTO existing = taiSanDao.findById(ts.getId());
        if (existing != null) {
            ts.setNguyenGia(existing.getNguyenGia() != null ? existing.getNguyenGia().floatValue() : null);
            ts.setGiaTriKhauHaoBanDau(existing.getGiaTriKhauHaoBanDau() != null ? existing.getGiaTriKhauHaoBanDau().floatValue() : null);
            ts.setKyKhauHaoBanDau(existing.getKyKhauHaoBanDau());
            ts.setIdMoHinhTaiSan(existing.getIdMoHinhTaiSan());
            ts.setPhuongPhapKhauHao(existing.getPhuongPhapKhauHao());
            ts.setSoKyKhauHao(existing.getSoKyKhauHao());
            ts.setTaiKhoanTaiSan(existing.getTaiKhoanTaiSan());
            ts.setTaiKhoanKhauHao(existing.getTaiKhoanKhauHao());
            ts.setTaiKhoanChiPhi(existing.getTaiKhoanChiPhi());
            ts.setNgayVaoSo(existing.getNgayVaoSo());
            ts.setNgaySuDung(existing.getNgaySuDung());
            ts.setIdDuDan(existing.getIdDuAn());
            ts.setIdNguonVon(existing.getIdNguonVon());
            ts.setDonViTinh(existing.getDonViTinh());
            ts.setGhiChu(existing.getGhiChu());
            ts.setIdDonViQuanlyKiThuat(existing.getIdDonViQuanlyKiThuat());
            ts.setMoTa(existing.getMoTa());
            ts.setNguoiTao(existing.getNguoiTao());
            ts.setNgayTao(existing.getNgayTao());
            ts.setIsTaiSanCon(existing.getIsTaiSanCon() != null ? existing.getIsTaiSanCon() : false);
            ts.setIsHeThong(existing.getIsHeThong() != null ? existing.getIsHeThong() : false);
            ts.setTrangThaiSuaChua(existing.getTrangThaiSuaChua());
            taiSanDao.update(ts);
        } else {
            taiSanDao.insert(ts);
        }
        log.info("Đã đồng bộ device: {}", device.getCode());
    }
}
