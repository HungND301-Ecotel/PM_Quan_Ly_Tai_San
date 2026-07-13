package com.ecotel.quanlytaisan.controller;
import jakarta.validation.Valid;
import com.ecotel.quanlytaisan.model.UpdateGhiChuRequest;

import com.ecotel.quanlytaisan.model.ApiResponse;
import com.ecotel.quanlytaisan.model.PageResponse;
import com.ecotel.quanlytaisan.model.PhieuLinhVatTu;
import com.ecotel.quanlytaisan.model.PhieuLinhVatTuDTO;
import com.ecotel.quanlytaisan.service.PhieuLinhVatTuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/phieulinhvattu")
public class PhieuLinhVatTuController {

    @Autowired
    private PhieuLinhVatTuService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PhieuLinhVatTuDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phiếu lĩnh vật tư thành công", service.findAll(), null));
    }

    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Object>> getAllPaged(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "trangThai", required = false) Integer trangThai,
            @RequestParam(value = "idPhieuGiaoViec", required = false) String idPhieuGiaoViec,
            @RequestParam(value = "userid", required = false) String userid,
            @RequestParam(value = "isSign", required = false) Boolean isSign,
            @RequestParam(value = "dateFrom", required = false) String dateFrom,
            @RequestParam(value = "dateTo", required = false) String dateTo
    ,
            @RequestParam(value = "idTaiSan", required = false) String idTaiSan
    ) {
        try {
            PageResponse<PhieuLinhVatTuDTO> response = service.findAllPaged(
                    page, size, sortBy, sortDir, search,
                    trangThai, idPhieuGiaoViec, userid, isSign, dateFrom, dateTo, idTaiSan);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", response, (int) response.getTotalItems()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PhieuLinhVatTuDTO>> getById(@PathVariable String id) {
        PhieuLinhVatTuDTO item = service.findByIdDTO(id);
        if (item != null) {
            return ResponseEntity.ok(ApiResponse.success("Lấy phiếu lĩnh vật tư thành công", item, null));
        }
        return ResponseEntity.badRequest().body(ApiResponse.failure("Không tìm thấy phiếu lĩnh vật tư", null));
    }

    @GetMapping("/phieugiaoviec/{idPhieuGiaoViec}")
    public ResponseEntity<ApiResponse<List<PhieuLinhVatTuDTO>>> getByIdPhieuGiaoViec(@PathVariable String idPhieuGiaoViec) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", service.findByIdPhieuGiaoViec(idPhieuGiaoViec), null));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PhieuLinhVatTu>> create(@RequestBody PhieuLinhVatTuDTO dto) {
        try {
            PhieuLinhVatTu result = service.insert(dto);
            return ResponseEntity.ok(ApiResponse.success("Tạo phiếu lĩnh vật tư thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Lỗi khi tạo: " + e.getMessage(), null));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PhieuLinhVatTu>> update(@PathVariable String id, @RequestBody PhieuLinhVatTuDTO dto) {
        try {
            dto.setId(id);
            PhieuLinhVatTu result = service.update(dto);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật phiếu lĩnh vật tư thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Lỗi khi cập nhật: " + e.getMessage(), null));
        }
    }

    @PutMapping("/batch")
    public ResponseEntity<ApiResponse<Void>> updateBatch(@RequestBody List<PhieuLinhVatTuDTO> entities) {
        try {
            for (PhieuLinhVatTuDTO entity : entities) {
                service.update(entity);
            }
            return ResponseEntity.ok(ApiResponse.success("Cập nhật danh sách phiếu lĩnh vật tư thành công", null, entities.size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(ApiResponse.success("Xóa phiếu lĩnh vật tư thành công", null, 1));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Lỗi khi xóa: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/batch")
    public ResponseEntity<ApiResponse<Void>> deleteBatch(@RequestBody List<String> ids) {
        try {
            for (String id : ids) {
                service.delete(id);
            }
            return ResponseEntity.ok(ApiResponse.success("Xóa danh sách phiếu lĩnh vật tư thành công", null, ids.size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @PostMapping("/capnhattrangthai")
    public ResponseEntity<ApiResponse<Integer>> updateTrangThai(
            @RequestParam("id") String id,
            @RequestParam("userId") String userId) {
        try {
            int result = service.updateTrangThai(id, userId);
            if (result > 0) return ResponseEntity.ok(
                    ApiResponse.success("Cập nhật trạng thái thành công", result, 1));
            return ResponseEntity.badRequest().body(
                    ApiResponse.failure("Cập nhật trạng thái thất bại", 0));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
    @PatchMapping("/{id}/ghi-chu")
    public ResponseEntity<ApiResponse<Object>> updateGhiChu(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateGhiChuRequest body) {
        try {
            int result = service.updateGhiChu(id, body.getGhiChuBienBan());
            if (result > 0) return ResponseEntity.ok(ApiResponse.success("C?p nh?t ghi ch� th�nh c�ng", null, result));
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("Kh�ng t�m th?y b?n ghi", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("L?i h? th?ng: " + e.getMessage(), null));
        }
    }
}
