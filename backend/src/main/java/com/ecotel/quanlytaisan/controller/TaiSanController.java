package com.ecotel.quanlytaisan.controller;
import com.ecotel.quanlytaisan.model.KhauHaoTaiSan;
import com.ecotel.quanlytaisan.model.TaiSan;
import com.ecotel.quanlytaisan.model.TaiSanCon;
import com.ecotel.quanlytaisan.model.TaiSanDTO;
import com.ecotel.quanlytaisan.model.ApiResponse;
import com.ecotel.quanlytaisan.model.PageResponse;
import com.ecotel.quanlytaisan.service.TaiSanService;
import com.ecotel.quanlytaisan.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/taisan")
public class TaiSanController {
    @Autowired
    private TaiSanService taiSanService;
    @Autowired
    private NotificationService notificationService;
    @PutMapping("/updatedonvi")
    public ResponseEntity<ApiResponse<Object>> updateDonVi(@RequestBody List<Map<String, String>> res) {
        try {
            int result = taiSanService.updateDonViTaiSan(res);
            if (result > 0) {
                return ResponseEntity.ok(ApiResponse.success("Cập nhật tài sản thành công", null, result));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Không tìm thấy tài sản để cập nhật", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @PutMapping("/update-tai-san-con")
    public ResponseEntity<ApiResponse<Object>> updateTaiSanCon(@RequestBody List<Map<String, Object>> res) {
        try {
            int count = 0;
            for (Map<String, Object> map : res) {
                String idTaiSan = (String) map.get("idTaiSan");
                Boolean isTaiSanCon = (Boolean) map.get("isTaiSanCon");
                count += taiSanService.updateTaiSanCon(idTaiSan, isTaiSanCon);
            }
            if (count > 0) {
                return ResponseEntity.ok(ApiResponse.success("Cập nhật tài sản thành công", null, count));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Không tìm thấy tài sản để cập nhật", count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getAll(
            @RequestParam("idcongty") String idcongty,
            @RequestParam(value = "idDonViQuanLy", required = false) String idDonViQuanLy,
            @RequestParam(value = "isHeThong", required = false) Boolean isHeThong) {
        try {
            List<TaiSanDTO> result = taiSanService.getAll(idcongty, idDonViQuanLy, isHeThong);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Object>> getAllPaged(@RequestParam("idcongty") String idcongty, @RequestParam(value = "page", defaultValue = "0") int page, @RequestParam(value = "size", defaultValue = "20") int size, @RequestParam(value = "sortBy", required = false) String sortBy, @RequestParam(value = "sortDir", required = false) String sortDir, @RequestParam(value = "search", required = false) String search, @RequestParam(value = "idNhomTaiSan", required = false) String idNhomTaiSan, @RequestParam(value = "idLoaiTaiSan", required = false) String idLoaiTaiSan, @RequestParam(value = "iddonvihienthoi", required = false) String iddonvihienthoi, @RequestParam(value="soNgayThongBaoKiemDinh",defaultValue = "10") int soNgayThongBaoKiemDinh, @RequestParam(value = "trangThaiKiemDinh", required = false) String trangThaiKiemDinh) {
        try {
            PageResponse<TaiSanDTO> result = taiSanService.getAllPaged(idcongty, page, size, sortBy, sortDir, search, idNhomTaiSan, idLoaiTaiSan, iddonvihienthoi, soNgayThongBaoKiemDinh, trangThaiKiemDinh);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản phân trang thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/paged-ban-giao")
    public ResponseEntity<ApiResponse<Object>> getAllPagedWithBanGiaoStatus(@RequestParam("idcongty") String idcongty, @RequestParam(value = "page", defaultValue = "0") int page, @RequestParam(value = "size", defaultValue = "20") int size, @RequestParam(value = "sortBy", required = false) String sortBy, @RequestParam(value = "sortDir", required = false) String sortDir, @RequestParam(value = "search", required = false) String search, @RequestParam(value = "idNhomTaiSan", required = false) String idNhomTaiSan, @RequestParam(value = "iddonvihienthoi", required = false) String iddonvihienthoi, @RequestParam(value="soNgayThongBaoKiemDinh",defaultValue = "10") int soNgayThongBaoKiemDinh, @RequestParam(value = "trangThaiKiemDinh", required = false) String trangThaiKiemDinh) {
        try {
            Map<String, Object> result = taiSanService.getAllPagedWithBanGiaoStatus(idcongty, page, size, sortBy, sortDir, search, idNhomTaiSan, iddonvihienthoi, soNgayThongBaoKiemDinh, trangThaiKiemDinh);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản theo trạng thái bàn giao thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/paged-da-ban-giao")
    public ResponseEntity<ApiResponse<Object>> getPagedDaBanGiao(@RequestParam("idcongty") String idcongty, @RequestParam(value = "page", defaultValue = "0") int page, @RequestParam(value = "size", defaultValue = "20") int size, @RequestParam(value = "sortBy", required = false) String sortBy, @RequestParam(value = "sortDir", required = false) String sortDir, @RequestParam(value = "search", required = false) String search, @RequestParam(value = "idNhomTaiSan", required = false) String idNhomTaiSan, @RequestParam(value = "iddonvihienthoi", required = false) String iddonvihienthoi, @RequestParam(value="soNgayThongBaoKiemDinh",defaultValue = "10") int soNgayThongBaoKiemDinh, @RequestParam(value = "trangThaiKiemDinh", required = false) String trangThaiKiemDinh) {
        try {
            PageResponse<TaiSanDTO> result = taiSanService.getPagedByBanGiaoStatus(idcongty, page, size, sortBy, sortDir, search, idNhomTaiSan, iddonvihienthoi, true, soNgayThongBaoKiemDinh, trangThaiKiemDinh);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản đã bàn giao thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/paged-chua-ban-giao")
    public ResponseEntity<ApiResponse<Object>> getPagedChuaBanGiao(@RequestParam("idcongty") String idcongty, @RequestParam(value = "page", defaultValue = "0") int page, @RequestParam(value = "size", defaultValue = "20") int size, @RequestParam(value = "sortBy", required = false) String sortBy, @RequestParam(value = "sortDir", required = false) String sortDir, @RequestParam(value = "search", required = false) String search, @RequestParam(value = "idNhomTaiSan", required = false) String idNhomTaiSan, @RequestParam(value = "iddonvihienthoi", required = false) String iddonvihienthoi, @RequestParam(value="soNgayThongBaoKiemDinh",defaultValue = "10") int soNgayThongBaoKiemDinh, @RequestParam(value = "trangThaiKiemDinh", required = false) String trangThaiKiemDinh) {
        try {
            PageResponse<TaiSanDTO> result = taiSanService.getPagedByBanGiaoStatus(idcongty, page, size, sortBy, sortDir, search, idNhomTaiSan, iddonvihienthoi, false, soNgayThongBaoKiemDinh, trangThaiKiemDinh);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản chưa bàn giao thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/by-donvi-bandau/paged")
    public ResponseEntity<ApiResponse<Object>> getByDonViBanDauPaged(
            @RequestParam("idcongty") String idcongty,
            @RequestParam(value = "iddonvibandau", required = false) String iddonvibandau,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "sortDir", required = false) String sortDir,
            @RequestParam(value = "idNhomTaiSan", required = false) String idNhomTaiSan,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value="soNgayThongBaoKiemDinh",defaultValue = "10") int soNgayThongBaoKiemDinh,
            @RequestParam(value = "trangThaiKiemDinh", required = false) String trangThaiKiemDinh
        ) {
        try {
            PageResponse<TaiSanDTO> result = taiSanService.getByDonViBanDauPaged(idcongty, iddonvibandau, page, size, sortBy, sortDir,idNhomTaiSan, search, soNgayThongBaoKiemDinh, trangThaiKiemDinh);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản theo đơn vị ban đầu thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/by-donvi-thuhoi/paged")
    public ResponseEntity<ApiResponse<Object>> getByDonViThuHoiPaged(
            @RequestParam("idcongty") String idcongty,
            @RequestParam(value = "iddonvithuhoi", required = false) String iddonvithuhoi,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "sortDir", required = false) String sortDir,
            @RequestParam(value = "idNhomTaiSan", required = false) String idNhomTaiSan,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "soNgayThongBaoKiemDinh", defaultValue = "10") int soNgayThongBaoKiemDinh,
            @RequestParam(value = "trangThaiKiemDinh", required = false) String trangThaiKiemDinh
    ) {
        try {
            PageResponse<TaiSanDTO> result = taiSanService.getByDonViThuHoiPaged(
                idcongty, iddonvithuhoi, page, size, sortBy, sortDir,idNhomTaiSan,search, 
                soNgayThongBaoKiemDinh, trangThaiKiemDinh
            );
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản theo kho thu hồi thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/by-donvi-hienthoi/paged")
    public ResponseEntity<ApiResponse<Object>> getByDonViHienThoiPaged(
            @RequestParam("idcongty") String idcongty,
            @RequestParam("iddonvihienthoi") String iddonvihienthoi,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "sortDir", required = false) String sortDir,
            @RequestParam(value = "idNhomTaiSan", required = false) String idNhomTaiSan,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value="soNgayThongBaoKiemDinh",defaultValue = "10") int soNgayThongBaoKiemDinh,
            @RequestParam(value = "trangThaiKiemDinh", required = false) String trangThaiKiemDinh
        ) {
        try {
            PageResponse<TaiSanDTO> result = taiSanService.getByDonViHienThoiPaged(idcongty, iddonvihienthoi, page, size, sortBy, sortDir, idNhomTaiSan, search, soNgayThongBaoKiemDinh, trangThaiKiemDinh);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản theo đơn vị hiện thời thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/sap-het-han-kiem-dinh")
    public ResponseEntity<ApiResponse<Object>> getSapHetHanKiemDinhPaged(
            @RequestParam("idcongty") String idcongty,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "soNgayThongBaoKiemDinh", defaultValue = "10") int soNgayThongBaoKiemDinh
    ) {
        try {
            PageResponse<TaiSanDTO> result = taiSanService.getSapHetHanKiemDinhPaged(idcongty, page, size, soNgayThongBaoKiemDinh);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản sắp hết hạn đăng kiểm thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/loaitaisan/")
    public ResponseEntity<ApiResponse<Object>> getByLoai(@RequestParam("idloataisan") String idloataisan) {
        try {
            List<TaiSanDTO> result = taiSanService.getByLoai(idloataisan);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản theo loại thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getById(@PathVariable("id") String id, 
            @RequestParam(required = false) String dateFrom, 
            @RequestParam(required = false) String dateTo) {
        try {
            TaiSanDTO result = taiSanService.getById(id, dateFrom, dateTo);
            if (result != null) {
                return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài sản thành công", result, null));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Không tìm thấy tài sản", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @PostMapping
    public ResponseEntity<ApiResponse<Object>> create(@RequestBody TaiSan ts) {
        try {
            int result = taiSanService.create(ts);
            if (result > 0) {
                // Gửi thông báo socket
                notificationService.notifyTaiSanCreated(ts.getIdCongTy(), ts.getId(), "System");
                return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo tài sản thành công", null, result));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.failure("Tạo tài sản thất bại", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> createBatch(@RequestBody List<TaiSan> list) {
        try {
            int total = taiSanService.batchCreate(list);
            if (total > 0) {
                // Send socket notifications
                for (TaiSan item : list) {
                    notificationService.notifyTaiSanCreated(item.getIdCongTy(), item.getId(), "System");
                }
                return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo danh sách tài sản thành công", null, total));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.failure("Tạo danh sách tài sản thất bại", total));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @PutMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> updateBatch(@RequestBody List<TaiSan> list) {
        try {
            int total = taiSanService.batchUpdate(list);
            if (total > 0) {
                // Send socket notifications
                for (TaiSan item : list) {
                    notificationService.notifyTaiSanUpdated(item.getIdCongTy(), item.getId(), "System");
                }
                return ResponseEntity.ok(ApiResponse.success("Cập nhật danh sách tài sản thành công", null, total));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.failure("Cập nhật danh sách tài sản thất bại", total));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> update(@PathVariable("id") String id, @RequestBody TaiSan ts) {
        try {
            ts.setId(id);
            int result = taiSanService.update(ts);
            if (result > 0) {
                // Gửi thông báo socket
                notificationService.notifyTaiSanUpdated(ts.getIdCongTy(), ts.getId(), "System");
                return ResponseEntity.ok(ApiResponse.success("Cập nhật tài sản thành công", null, result));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Không tìm thấy tài sản để cập nhật", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @PutMapping("/update-tai-san/tai-san-con")
    public ResponseEntity<ApiResponse<Object>> updateTaiSanConTaiSan(@RequestBody List<Map<String, Object>> maps) {
        try {
            int result = 0;
            for (Map<String, Object> map : maps) {
                result += taiSanService.updateTaiSanConTaiSan(map);
            }
            if (result > 0) {
                return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái tài sản thành công", null, result));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Không tìm thấy tài sản để cập nhật", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") String id) {
        try {
            // Lấy thông tin tài sản trước khi xóa để có thông tin công ty
            TaiSanDTO taiSan = taiSanService.getById(id);
            int result = taiSanService.delete(id);
            if (result > 0) {
                // Gửi thông báo socket
                if (taiSan != null) {
                    notificationService.notifyTaiSanDeleted(taiSan.getIdCongTy(), id, "System");
                }
                return ResponseEntity.ok(ApiResponse.success("Xóa tài sản thành công", null, result));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Không tìm thấy tài sản để xóa", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @DeleteMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> deleteBatch(@RequestBody List<String> ids) {
        try {
            List<TaiSanDTO> list = new ArrayList<>();
            for (String id : ids) {
                TaiSanDTO taiSan = taiSanService.getById(id);
                if (taiSan != null) {
                    list.add(taiSan);
                }
            }
            int total = taiSanService.batchDelete(ids);
            if (total > 0) {
                for (TaiSanDTO item : list) {
                    notificationService.notifyTaiSanDeleted(item.getIdCongTy(), item.getId(), "System");
                }
                return ResponseEntity.ok(ApiResponse.success("Xóa danh sách tài sản thành công", null, total));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.failure("Xóa danh sách tài sản thất bại", total));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @DeleteMapping("/delete-all")
    public ResponseEntity<ApiResponse<Object>> deleteAll() {
        try {
            int result = taiSanService.deleteAll();
            return ResponseEntity.ok(ApiResponse.success("Xóa toàn bộ tài sản thành công", null, result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @PostMapping("/taisancon/")
    public ResponseEntity<ApiResponse<Object>> insertTaiSanCon(@RequestBody TaiSanCon ts) {
        try {
            int result = taiSanService.insertTaiSanCon(ts);
            if (result > 0) {
                return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Thêm tài sản con thành công", null, result));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.failure("Thêm tài sản con thất bại", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @PostMapping("/taisancon/bulk")
    public ResponseEntity<ApiResponse<Object>> insertListTaiSanCon(@RequestBody List<TaiSanCon> listTs) {
        try {
            int successCount = 0;
            for (TaiSanCon ts : listTs) {
                int result = taiSanService.insertTaiSanCon(ts);
                if (result > 0) {
                    successCount++;
                }
            }
            if (successCount == listTs.size()) {
                return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Thêm danh sách tài sản con thành công", null, successCount));
            } else if (successCount > 0) {
                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(ApiResponse.failure("Một số tài sản con thêm thất bại", successCount));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.failure("Thêm danh sách tài sản con thất bại", successCount));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @PutMapping("/taisancon/")
    public ResponseEntity<ApiResponse<Object>> updateTaiSanCon(@RequestBody TaiSanCon ts) {
        try {
            int result = taiSanService.updateTaiSanCon(ts);
            if (result > 0) {
                return ResponseEntity.ok(ApiResponse.success("Cập nhật tài sản con thành công", null, result));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.failure("Cập nhật tài sản con thất bại", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/taisancon/{idTaiSan}")
    public ResponseEntity<ApiResponse<Object>> getTaiSanConByTaiSan(@PathVariable("idTaiSan") String idTaiSan) {
        try {
            List<TaiSanCon> result = taiSanService.getTaiSanCon(idTaiSan);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản con thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/children/{idTaiSan}")
    public ResponseEntity<ApiResponse<Object>> getTaiSanChildrenByParent(@PathVariable("idTaiSan") String idTaiSan) {
        try {
            List<TaiSanDTO> result = taiSanService.getTaiSanChildrenByParentId(idTaiSan);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài sản con từ TaiSan thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/taisancon/getall")
    public ResponseEntity<ApiResponse<Object>> getTaiSanConByTaiSan() {
        try {
            List<TaiSanCon> result = taiSanService.getAllTSC();
            return ResponseEntity.ok(ApiResponse.success("Lấy toàn bộ danh sách tài sản con thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @DeleteMapping("/taisancon/")
    public ResponseEntity<ApiResponse<Object>> deleteTaiSanCon(@RequestParam("idTaiSanCon") String idTaiSanCon) {
        try {
            int result = taiSanService.deleteTaiSanCon(idTaiSanCon);
            if (result > 0) {
                return ResponseEntity.ok(ApiResponse.success("Xóa tài sản con thành công", null, result));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Không tìm thấy tài sản con để xóa", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/khauhaotaisan")
    public ResponseEntity<ApiResponse<Object>> getKhauHaoTaiSan(
            @RequestParam("idcongty") String idcongty,
            @RequestParam("ngay") int ngay,
            @RequestParam("thang") int thang,
            @RequestParam("nam") int nam,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "sortDir", required = false) String sortDir,
            @RequestParam(value = "search", required = false) String search) {
        try {
            PageResponse<KhauHaoTaiSan> result = taiSanService.getKhauHaoTaiSanPaged(
                    idcongty, ngay, thang, nam, page, size, sortBy, sortDir, search
            );
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khấu hao tài sản thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/khauhaotaisanbynhom")
    public ResponseEntity<ApiResponse<Object>> getKhauHaoTaiSanByNhom(
            @RequestParam("idcongty") String idcongty,
            @RequestParam("ngay") int ngay,
            @RequestParam("thang") int thang,
            @RequestParam("nam") int nam,
            @RequestParam("idNhomTaiSan") String idNhomTaiSan,
            @RequestParam(value = "idDonViHienThoi", required = false) String idDonViHienThoi,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "sortDir", required = false) String sortDir,
            @RequestParam(value = "search", required = false) String search) {
        try {
            PageResponse<KhauHaoTaiSan> result = taiSanService.getKhauHaoTaiSanByNhomPaged(
                    idcongty, ngay, thang, nam, idNhomTaiSan,idDonViHienThoi, page, size, sortBy, sortDir, search
            );
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khấu hao tài sản theo nhóm thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("File không được rỗng", null));
        }
        String filename = file.getOriginalFilename();
        if (filename == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Tên file không hợp lệ", null));
        }
        try {
            // Đọc danh sách tài sản
            List<TaiSan> listTaiSan;
            if (filename.endsWith(".csv")) {
                listTaiSan = taiSanService.readCsv(file);
            } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                listTaiSan = taiSanService.readExcel(file);
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.failure("Chỉ hỗ trợ file CSV hoặc Excel", null));
            }
            // Tạo 2 danh sách kết quả
            List<TaiSan> successList = new ArrayList<>();
            List<Map<String, Object>> failureList = new ArrayList<>();
            for (TaiSan ts : listTaiSan) {
                if (ts.getId() == null) {
                    // Ghi nhận thất bại do thiếu ID
                    Map<String, Object> failItem = new HashMap<>();
                    failItem.put("data", ts);
                    failItem.put("error", "Thiếu ID");
                    failureList.add(failItem);
                    continue;
                }
                try {
                    int inserted = taiSanService.create(ts);
                    if (inserted > 0) {
                        successList.add(ts);
                    } else {
                        Map<String, Object> failItem = new HashMap<>();
                        failItem.put("data", ts);
                        failItem.put("error", "Không thể insert vào DB");
                        failureList.add(failItem);
                    }
                } catch (Exception ex) {
                    Map<String, Object> failItem = new HashMap<>();
                    failItem.put("data", ts);
                    failItem.put("error", ex.getMessage());
                    failureList.add(failItem);
                }
            }
            // Chuẩn bị dữ liệu trả về
            Map<String, Object> result = new HashMap<>();
            result.put("total", listTaiSan.size());
            result.put("successCount", successList.size());
            result.put("failureCount", failureList.size());
            result.put("successItems", successList);
            result.put("failureItems", failureList);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Upload hoàn tất", result, successList.size()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @GetMapping("/export/excel")
    public void exportToExcel(
            @RequestParam("idcongty") String idcongty,
            HttpServletResponse response) throws IOException {
        try {
            // Tạo tên file với timestamp
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = "TaiSan_" + timestamp + ".xlsx";
            String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8.toString())
                    .replace("+", "%20");
            // Set response headers
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename);
            // Xuất Excel
            taiSanService.exportToExcel(idcongty, response.getOutputStream());
            response.getOutputStream().flush();
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("Lỗi khi xuất file Excel: " + e.getMessage());
        }
    }
}