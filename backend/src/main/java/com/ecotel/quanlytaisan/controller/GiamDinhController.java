package com.ecotel.quanlytaisan.controller;

import com.ecotel.quanlytaisan.model.ApiResponse;
import com.ecotel.quanlytaisan.model.GiamDinh;
import com.ecotel.quanlytaisan.model.GiamDinhDTO;
import com.ecotel.quanlytaisan.model.PageResponse;
import com.ecotel.quanlytaisan.model.UpdateGhiChuRequest;
import com.ecotel.quanlytaisan.service.GiamDinhService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/giamdinh")
public class GiamDinhController {

    @Autowired
    private GiamDinhService service;

    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Object>> getAllPaged(
            @RequestParam("idCongTy") String idCongTy,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "trangThai", required = false) Integer trangThai,
            @RequestParam(value = "userid", required = false) String userid,
            @RequestParam(value = "isSign", required = false) Boolean isSign,
            @RequestParam(value = "dateFrom", required = false) String dateFrom,
            @RequestParam(value = "dateTo", required = false) String dateTo
    ,
            @RequestParam(value = "idTaiSan", required = false) String idTaiSan
    ) {
        try {
            PageResponse<GiamDinhDTO> response = service.findAllPaged(
                    idCongTy, page, size, sortBy, sortDir, search, trangThai, userid, isSign, dateFrom, dateTo, idTaiSan);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", response, (int) response.getTotalItems()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getAll(@RequestParam(value = "idcongty", required = false) String idCongTy) {
        try {
            List<GiamDinhDTO> list = service.findAll(idCongTy);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", list, list.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getById(@PathVariable("id") String id) {
        try {
            GiamDinhDTO dto = service.findByIdDTO(id);
            if (dto == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy biên bản giám định", null));
            return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thành công", dto, 1));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/bienban/{idBienBan}")
    public ResponseEntity<ApiResponse<Object>> getByIdBienBan(@PathVariable("idBienBan") String idBienBan) {
        try {
            List<GiamDinhDTO> list = service.findByIdBienBan(idBienBan);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", list, list.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/baocaokythuat/{idBaoCaoKyThuat}")
    public ResponseEntity<ApiResponse<Object>> getByIdBaoCaoKyThuat(@PathVariable("idBaoCaoKyThuat") String idBaoCaoKyThuat) {
        try {
            List<GiamDinhDTO> list = service.findByIdBaoCaoKyThuat(idBaoCaoKyThuat);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", list, list.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Object>> create(@Valid @RequestBody GiamDinh entity) {
        try {
            GiamDinh created = service.insert(entity);
            return ResponseEntity.ok(ApiResponse.success("Tạo biên bản thành công", created, 1));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> update(@PathVariable("id") String id, @Valid @RequestBody GiamDinh entity) {
        try {
            entity.setId(id);
            GiamDinh updated = service.update(entity);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated, 1));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @PostMapping("/capnhattrangthai")
    public ResponseEntity<ApiResponse<Object>> updateTrangThai(
            @RequestParam("id") String id,
            @RequestParam("userId") String userId) {
        try {
            int result = service.updateTrangThai(id, userId);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", result, 1));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @PostMapping("/huy")
    public ResponseEntity<ApiResponse<Object>> huyGiamDinh(@RequestParam("id") String id) {
        try {
            int result = service.huyGiamDinh(id);
            return ResponseEntity.ok(ApiResponse.success("Hủy biên bản thành công", null, result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @PutMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> updateBatch(@RequestBody List<@Valid GiamDinh> list) {
        try {
            service.bulkUpdate(list);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật danh sách thành công", null, list.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> deleteBatch(@RequestBody List<String> ids) {
        try {
            for (String id : ids) service.delete(id);
            return ResponseEntity.ok(ApiResponse.success("Xóa danh sách thành công", null, ids.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") String id) {
        try {
            int r = service.delete(id);
            return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null, r));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/permission-signing/{id}")
    public ResponseEntity<ApiResponse<Object>> getPermissionSigning(
            @PathVariable("id") String id,
            @RequestParam("tenDangNhap") String tenDangNhap
    ) {
        try {
            GiamDinhDTO item = service.findByIdDTO(id);
            if (item == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy biên bản giám định với ID: " + id, null));

            int permission = service.getPermissionSigning(item, tenDangNhap);
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

    @PatchMapping("/{id}/ghi-chu")
    public ResponseEntity<ApiResponse<Object>> updateGhiChu(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateGhiChuRequest body) {
        try {
            int result = service.updateGhiChu(id, body.getGhiChuBienBan());
            if (result > 0) return ResponseEntity.ok(ApiResponse.success("Cập nhật ghi chú thành công", null, result));
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Không tìm thấy bản ghi", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
}
