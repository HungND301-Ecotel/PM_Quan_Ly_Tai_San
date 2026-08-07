package com.ecotel.quanlytaisan.controller;

import com.ecotel.quanlytaisan.model.*;
import com.ecotel.quanlytaisan.service.KeHoachSuaChuaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller kế hoạch sửa chữa.
 * TrangThai: 0=Nháp | 1=Chờ duyệt | 2=Đã hủy | 3=Đã duyệt/Hoàn thành
 */
@RestController
@RequestMapping("/api/kehoach-suachua")
public class KeHoachSuaChuaController {

    @Autowired
    private KeHoachSuaChuaService keHoachSuaChuaService;

    // ==================== GET ALL (paged) ====================

    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Object>> getAllPaged(
            @RequestParam("idCongTy") String idCongTy,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "loaiKeHoach", required = false) String loaiKeHoach,
            @RequestParam(value = "idDonViGiao", required = false) String idDonViGiao,
            @RequestParam(value = "idDonViNhan", required = false) String idDonViNhan,
            @RequestParam(value = "trangThai", required = false) Integer trangThai,
            @RequestParam(value = "nam", required = false) Integer nam,
            @RequestParam(value = "userid", required = false) String userid,
            @RequestParam(value = "isSign", required = false) Boolean isSign,
            @RequestParam(value = "dateFrom", required = false) String dateFrom,
            @RequestParam(value = "dateTo", required = false) String dateTo,
            @RequestParam(value = "nhomTaiSan", required = false) String nhomTaiSan,
            @RequestParam(value = "idTaiSan", required = false) String idTaiSan
    ) throws SQLException {
        try {
            PageResponse<KeHoachSuaChuaDTO> response = keHoachSuaChuaService.findAllPaged(
                    idCongTy, page, size, sortBy, sortDir, search,
                    loaiKeHoach, idDonViGiao, idDonViNhan, trangThai, nam, userid, isSign,
                    dateFrom, dateTo, nhomTaiSan, idTaiSan
            );
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", response, (int) response.getTotalItems()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // ==================== GET ALL (no paging) ====================

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getAll(@RequestParam("idcongty") String idCongTy) throws SQLException {
        try {
            List<KeHoachSuaChuaDTO> list = keHoachSuaChuaService.findAll(idCongTy);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", list, list.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // ==================== GET BY ID ====================

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getById(@PathVariable("id") String id) throws SQLException {
        try {
            KeHoachSuaChuaDTO dto = keHoachSuaChuaService.findByIdDTO(id);
            if (dto == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy kế hoạch sửa chữa", null));
            return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thành công", dto, 1));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/grouped-summary")
    public ResponseEntity<?> findYearSummaryPaged(
            @RequestParam(value = "idCongTy") String idCongTy,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "5") int size,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "trangThai", required = false) Integer trangThai,
            @RequestParam(value = "nam", required = false) Integer nam,
            @RequestParam(value = "userid", required = false) String userid,
            @RequestParam(value = "idDonViGiao", required = false) String idDonViGiao,
            @RequestParam(value = "dateFrom", required = false) String dateFrom,
            @RequestParam(value = "dateTo", required = false) String dateTo,
            @RequestParam(value = "nhomTaiSan", required = false) String nhomTaiSan
    ) {
        try {
            return ResponseEntity.ok(keHoachSuaChuaService.findYearSummaryPaged(
                    idCongTy, page, size, search, trangThai, nam, userid,
                    idDonViGiao, dateFrom, dateTo, nhomTaiSan));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
     @GetMapping("/grouped-by-year")
    public ResponseEntity<ApiResponse<Object>> getAllGroupedByYear(
            @RequestParam("idCongTy") String idCongTy,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "trangThai", required = false) Integer trangThai,
            @RequestParam(value = "nam", required = false) Integer nam,
            @RequestParam(value = "userid", required = false) String userid,
            @RequestParam(value = "idDonViGiao", required = false) String idDonViGiao,
            @RequestParam(value = "dateFrom", required = false) String dateFrom,
            @RequestParam(value = "dateTo", required = false) String dateTo,
            @RequestParam(value = "nhomTaiSan", required = false) String nhomTaiSan
    ) throws SQLException {
        try {
            Map<String, Object> result = keHoachSuaChuaService.findAllGroupedByYear(
                idCongTy, search, trangThai, nam, userid, idDonViGiao, dateFrom, dateTo, nhomTaiSan);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách theo năm thành công", result, result.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }


    // ==================== CREATE ====================

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> create(@Valid @RequestBody KeHoachSuaChuaDTO entity) throws SQLException {
        try {
            KeHoachSuaChua result = keHoachSuaChuaService.insert(entity);
            if (result != null) return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Tạo kế hoạch sửa chữa thành công", result, 1));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.failure("Tạo kế hoạch sửa chữa thất bại", 0));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // ==================== CREATE BATCH ====================

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> createBatch(@RequestBody List<@Valid KeHoachSuaChuaDTO> list) {
        try {
            int total = 0;
            for (KeHoachSuaChuaDTO item : list) {
                if (keHoachSuaChuaService.insert(item) != null) total++;
            }
            if (total > 0) return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Tạo danh sách kế hoạch sửa chữa thành công", null, total));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.failure("Tạo danh sách kế hoạch sửa chữa thất bại", total));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // ==================== UPDATE ====================

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> update(
            @PathVariable("id") String id, @Valid @RequestBody KeHoachSuaChuaDTO entity) throws SQLException {
        try {
            entity.setId(id);
            KeHoachSuaChua result = keHoachSuaChuaService.update(entity);
            if (result != null) return ResponseEntity.ok(ApiResponse.success("Cập nhật kế hoạch sửa chữa thành công", result, 1));
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy kế hoạch sửa chữa để cập nhật", 0));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // ==================== UPDATE BATCH ====================

    @PutMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> updateBatch(@RequestBody List<@Valid KeHoachSuaChuaDTO> list) {
        try {
            int total = 0;
            for (KeHoachSuaChuaDTO item : list) {
                if (keHoachSuaChuaService.update(item) != null) total++;
            }
            if (total > 0) return ResponseEntity.ok(ApiResponse.success("Cập nhật danh sách kế hoạch sửa chữa thành công", null, total));
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy kế hoạch sửa chữa để cập nhật", total));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // ==================== DELETE ====================

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") String id) throws SQLException {
        try {
            int result = keHoachSuaChuaService.delete(id);
            if (result > 0) return ResponseEntity.ok(ApiResponse.success("Xóa kế hoạch sửa chữa thành công", null, result));
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy kế hoạch sửa chữa để xóa", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // ==================== DELETE BATCH ====================

    @DeleteMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> deleteBatch(@RequestBody List<String> ids) throws SQLException {
        try {
            int total = 0;
            for (String id : ids) total += keHoachSuaChuaService.delete(id);
            if (total > 0) return ResponseEntity.ok(ApiResponse.success("Xóa danh sách kế hoạch sửa chữa thành công", null, total));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.failure("Xóa danh sách kế hoạch sửa chữa thất bại", total));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // ==================== CẬP NHẬT TRẠNG THÁI ====================

    /**
     * trangThai: 0=Nháp | 1=Chờ duyệt | 2=Đã hủy | 3=Đã duyệt/Hoàn thành
     */
    @PostMapping("/capnhattrangthai")
    public ResponseEntity<ApiResponse<Object>> updateTrangThai(
            @RequestParam("id") String id,
            @RequestParam("userId") String userId
    ) {
        try {
            int result = keHoachSuaChuaService.updateTrangThai(id, userId);
            if (result > 0) return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", result, result));
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy kế hoạch sửa chữa", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage(), null));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.failure(e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // ==================== HỦY ====================

    @PostMapping("/huy")
    public ResponseEntity<ApiResponse<Object>> huyKeHoach(@RequestParam("id") String id) {
        try {
            int result = keHoachSuaChuaService.huyKeHoach(id);
            if (result > 0) return ResponseEntity.ok(ApiResponse.success("Hủy kế hoạch thành công", null, result));
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy kế hoạch sửa chữa", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // ==================== PERMISSION SIGNING ====================

    @GetMapping("/permission-signing/{id}")
    public ResponseEntity<ApiResponse<Object>> getPermissionSigning(
            @PathVariable("id") String id,
            @RequestParam("tenDangNhap") String tenDangNhap) throws SQLException {
        try {
            KeHoachSuaChuaDTO item = keHoachSuaChuaService.findByIdDTO(id);
            if (item == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy kế hoạch sửa chữa với ID: " + id, null));

            int permission = keHoachSuaChuaService.getPermissionSigning(item, tenDangNhap);
            Map<String, Object> response = new HashMap<>();
            response.put("permission", permission);
            response.put("permissionDescription", getPermissionDescription(permission));
            response.put("itemId", id);
            response.put("tenDangNhap", tenDangNhap);
            return ResponseEntity.ok(ApiResponse.success("Lấy thông tin quyền ký thành công", response, 1));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    private String getPermissionDescription(int permission) {
        switch (permission) {
            case 0: return "Có thể ký";
            case 1: return "Chờ người trước ký";
            case 2: return "Không nằm trong flow ký";
            case 3: return "Đã ký";
            case 4: return "Đã tạo phiếu";
            case 5: return "Có thể tạo phiếu";
            default: return "Trạng thái không xác định";
        }
    }

    // ==================== TỔNG HỢP VẬT TƯ ====================

    @GetMapping("/{id}/tong-vattu")
    public ResponseEntity<ApiResponse<Object>> getTongVatTu(@PathVariable("id") String id) {
        try {
            List<DinhMucVatTuDTO> list = keHoachSuaChuaService.getTongVatTu(id);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tổng hợp vật tư thành công", list, list.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống khi tổng hợp vật tư: " + e.getMessage(), null));
        }
    }

    @PatchMapping("/{id}/ghi-chu")
    public ResponseEntity<ApiResponse<Object>> updateGhiChu(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateGhiChuRequest body) {
        try {
            int result = keHoachSuaChuaService.updateGhiChu(id, body.getGhiChuBienBan());
            if (result > 0) return ResponseEntity.ok(ApiResponse.success("Cập nhật ghi chú thành công", null, result));
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Không tìm thấy bản ghi", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
}
