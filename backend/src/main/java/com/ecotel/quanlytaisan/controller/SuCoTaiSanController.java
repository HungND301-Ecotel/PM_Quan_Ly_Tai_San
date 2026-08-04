package com.ecotel.quanlytaisan.controller;

import com.ecotel.quanlytaisan.model.ApiResponse;
import com.ecotel.quanlytaisan.model.SuCoTaiSan;
import com.ecotel.quanlytaisan.model.SuCoTaiSanDTO;
import com.ecotel.quanlytaisan.service.SuCoTaiSanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/su-co-tai-san")
public class SuCoTaiSanController {

    @Autowired
    private SuCoTaiSanService suCoTaiSanService;

    // Lấy danh sách sự cố theo ID tài sản
    @GetMapping("/by-taisan/{idTaiSan}")
    public ResponseEntity<ApiResponse<Object>> getByTaiSanId(@PathVariable("idTaiSan") String idTaiSan) {
        try {
            List<SuCoTaiSanDTO> result = suCoTaiSanService.getByTaiSanId(idTaiSan);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sự cố thành công", result, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // Thêm mới danh sách sự cố (createBatch)
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> createBatch(@RequestBody List<SuCoTaiSan> list) {
        try {
            int result = suCoTaiSanService.createBatch(list);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Thêm mới danh sách sự cố thành công", null, result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // Cập nhật danh sách sự cố (updateBatch)
    @PutMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> updateBatch(@RequestBody List<SuCoTaiSan> list) {
        try {
            int result = suCoTaiSanService.updateBatch(list);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật danh sách sự cố thành công", null, result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    // Xóa danh sách sự cố theo list ID (deleteBatch)
    @DeleteMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> deleteBatch(@RequestBody List<String> ids) {
        try {
            int result = suCoTaiSanService.deleteBatch(ids);
            return ResponseEntity.ok(ApiResponse.success("Xóa danh sách sự cố thành công", null, result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
}
