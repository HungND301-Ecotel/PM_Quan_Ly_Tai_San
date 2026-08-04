package com.ecotel.quanlytaisan.controller;

import com.ecotel.quanlytaisan.model.ApiResponse;
import com.ecotel.quanlytaisan.model.SuaChuaMayThang;
import com.ecotel.quanlytaisan.model.SuaChuaMayThangDTO;
import com.ecotel.quanlytaisan.service.SuaChuaMayThangService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sua-chua-may-thang")
public class SuaChuaMayThangController {

    @Autowired
    private SuaChuaMayThangService suaChuaMayThangService;

    @GetMapping("/by-taisan/{idTaiSan}")
    public ResponseEntity<ApiResponse<Object>> getByTaiSanId(@PathVariable("idTaiSan") String idTaiSan) {
        try {
            List<SuaChuaMayThangDTO> result = suaChuaMayThangService.getByTaiSanId(idTaiSan);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sửa chữa thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> createBatch(@RequestBody List<SuaChuaMayThang> list) {
        try {
            int result = suaChuaMayThangService.createBatch(list);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Thêm mới danh sách sửa chữa thành công", null, result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @PutMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> updateBatch(@RequestBody List<SuaChuaMayThang> list) {
        try {
            int result = suaChuaMayThangService.updateBatch(list);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật danh sách sửa chữa thành công", null, result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> deleteBatch(@RequestBody List<String> ids) {
        try {
            int result = suaChuaMayThangService.deleteBatch(ids);
            return ResponseEntity.ok(ApiResponse.success("Xóa danh sách sửa chữa thành công", null, result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
}