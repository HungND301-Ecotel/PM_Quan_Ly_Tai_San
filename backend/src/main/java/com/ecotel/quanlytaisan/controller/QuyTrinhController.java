package com.ecotel.quanlytaisan.controller;

import com.ecotel.quanlytaisan.model.ApiResponse;
import com.ecotel.quanlytaisan.model.PageResponse;
import com.ecotel.quanlytaisan.model.QuyTrinhSuaChuaDTO;
import com.ecotel.quanlytaisan.service.QuyTrinhService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quy-trinh")
public class QuyTrinhController {

    @Autowired
    private QuyTrinhService quyTrinhService;

    @GetMapping("/lich-su-hoat-dong")
    public ResponseEntity<ApiResponse<Object>> getLichSuHoatDong(
            @RequestParam String idTaiSan,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        try {
            List<java.util.Map<String, Object>> result = quyTrinhService.getLichSuHoatDong(idTaiSan, dateFrom, dateTo);
            return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử hoạt động thành công", result, result.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Object>> getPaged(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String idTaiSan,
            @RequestParam(required = false) Integer nam) {
        try {
            PageResponse<QuyTrinhSuaChuaDTO> result = quyTrinhService.getPagedQuyTrinh(page, pageSize, idTaiSan, nam);
            return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu quy trình thành công", result, (int) result.getTotalItems()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/history-paged")
    public ResponseEntity<ApiResponse<Object>> getHistoryPaged(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer status) {
        try {
            PageResponse<QuyTrinhSuaChuaDTO> result = quyTrinhService.getPagedHistory(page, pageSize, search, status);
            return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử bảo dưỡng thành công", result, (int) result.getTotalItems()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/material-consumption")
    public ResponseEntity<ApiResponse<Object>> getMaterialConsumption(
            @RequestParam String idTaiSan,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String nhomTaiSan) {
        try {
            List<com.ecotel.quanlytaisan.model.VatTuTieuHaoDTO> result = quyTrinhService.getMaterialConsumption(idTaiSan, dateFrom, dateTo, nhomTaiSan);
            return ResponseEntity.ok(ApiResponse.success("Lấy vật tư tiêu hao thành công", result, result.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
}
