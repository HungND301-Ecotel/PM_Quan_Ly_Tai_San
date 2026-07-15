package com.ecotel.quanlytaisan.controller;

import com.ecotel.quanlytaisan.model.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Generic batch share controller for all maintenance modules.
 * 
 * Instead of sending full object data to the batch update endpoint (which can null-out fields),
 * this controller only updates the Share column by IDs — lightweight and safe.
 * 
 * POST /api/batch-share/{module}
 * Body: ["ID-001", "ID-002", ...]
 */
@RestController
@RequestMapping("/api/batch-share")
public class BatchShareController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Whitelist mapping: apiUri → actual DB table name (prevents SQL injection)
    private static final Map<String, String> TABLE_MAP = Map.ofEntries(
            Map.entry("kehoach-suachua", "kehoachsuachua"),
            Map.entry("baocaokythuat", "baocaokythuat"),
            Map.entry("suachua", "suachua"),
            Map.entry("giamdinh", "giamdinh"),
            Map.entry("phieugiaoviec", "PhieuGiaoViec"),
            Map.entry("phieulinhvattu", "PhieuLinhVatTu"),
            Map.entry("nghiemthu", "nghiemthu"),
            Map.entry("danhgia-vattu", "danhgia_vattu"),
            Map.entry("quyettoan", "quyettoan"),
            Map.entry("suco-thietbi", "suco_thietbi"),
            Map.entry("kiemtra-suco", "kiemtra_suco")
    );

    @PostMapping("/{module}")
    public ResponseEntity<ApiResponse<Object>> batchShare(
            @PathVariable("module") String module,
            @RequestBody List<String> ids) {
        try {
            String tableName = TABLE_MAP.get(module);
            if (tableName == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.failure("Module không hợp lệ: " + module, null));
            }
            if (ids == null || ids.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.failure("Danh sách ID trống", null));
            }

            String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            String placeholders = String.join(",", ids.stream().map(id -> "?").toArray(String[]::new));
            String sql = "UPDATE " + tableName + " SET Share = 1, NgayCapNhat = ? WHERE Id IN (" + placeholders + ")";

            Object[] params = new Object[ids.size() + 1];
            params[0] = now;
            for (int i = 0; i < ids.size(); i++) {
                params[i + 1] = ids.get(i);
            }

            int updated = jdbcTemplate.update(sql, params);

            return ResponseEntity.ok(ApiResponse.success(
                    "Trình duyệt thành công " + updated + " biên bản", null, updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
}
