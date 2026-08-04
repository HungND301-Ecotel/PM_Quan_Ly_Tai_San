package com.ecotel.quanlytaisan.controller;

import com.ecotel.quanlytaisan.model.ApiResponse;
import com.ecotel.quanlytaisan.model.PhuTungTaiSan;
import com.ecotel.quanlytaisan.model.PhuTungTaiSanDTO;
import com.ecotel.quanlytaisan.service.PhuTungTaiSanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/phu-tung-tai-san")
public class PhuTungTaiSanController {

    @Autowired
    private PhuTungTaiSanService phuTungTaiSanService;

    // Lấy danh sách phụ tùng theo ID tài sản
    @GetMapping("/by-taisan/{idTaiSan}")
    public ResponseEntity<ApiResponse<Object>> getByTaiSanId(@PathVariable("idTaiSan") String idTaiSan) {
        try {
            List<PhuTungTaiSanDTO> result = phuTungTaiSanService.getByTaiSanId(idTaiSan);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phụ tùng thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // Lấy phụ tùng theo ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getById(@PathVariable("id") String id) {
        try {
            PhuTungTaiSanDTO result = phuTungTaiSanService.getById(id);
            if (result != null) {
                return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phụ tùng thành công", result, null));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy phụ tùng với id: " + id, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // Thêm mới 1 phụ tùng
    @PostMapping
    public ResponseEntity<ApiResponse<Object>> create(@RequestBody PhuTungTaiSan obj) {
        try {
            int result = phuTungTaiSanService.insert(obj);
            if (result > 0) {
                return ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Thêm phụ tùng thành công", null, result));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.failure("Thêm phụ tùng thất bại", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // Cập nhật 1 phụ tùng
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> update(@PathVariable("id") String id, @RequestBody PhuTungTaiSan obj) {
        try {
            obj.setId(id);
            int result = phuTungTaiSanService.update(obj);
            if (result > 0) {
                return ResponseEntity.ok(ApiResponse.success("Cập nhật phụ tùng thành công", null, result));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy phụ tùng để cập nhật", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // Xóa 1 phụ tùng
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable("id") String id) {
        try {
            int result = phuTungTaiSanService.delete(id);
            if (result > 0) {
                return ResponseEntity.ok(ApiResponse.success("Xóa phụ tùng thành công", null, result));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("Không tìm thấy phụ tùng để xóa", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // Thêm mới danh sách phụ tùng (createBatch)
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> createBatch(@RequestBody List<PhuTungTaiSan> list) {
        try {
            int result = phuTungTaiSanService.createBatch(list);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Thêm mới danh sách phụ tùng thành công", null, result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // Cập nhật danh sách phụ tùng (updateBatch)
    @PutMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> updateBatch(@RequestBody List<PhuTungTaiSan> list) {
        try {
            int result = phuTungTaiSanService.updateBatch(list);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật danh sách phụ tùng thành công", null, result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // Xóa danh sách phụ tùng theo list ID (deleteBatch)
    @DeleteMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> deleteBatch(@RequestBody List<String> ids) {
        try {
            int result = phuTungTaiSanService.deleteBatch(ids);
            return ResponseEntity.ok(ApiResponse.success("Xóa danh sách phụ tùng thành công", null, result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
}
