package com.ecotel.quanlytaisan.controller;

import com.ecotel.quanlytaisan.model.ApiResponse;
import com.ecotel.quanlytaisan.service.DeviceSyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    @Autowired
    private DeviceSyncService deviceSyncService;

    @Autowired
    private com.ecotel.quanlytaisan.service.DepartmentSyncService departmentSyncService;

    @PostMapping("/devices")
    public ResponseEntity<ApiResponse<String>> syncDevices() {
        try {
            deviceSyncService.syncDevices();
            return ResponseEntity.ok(ApiResponse.success("Đồng bộ dữ liệu thiết bị từ MongoDB thành công", null, 0));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.failure("Lỗi trong quá trình đồng bộ: " + e.getMessage(), 0));
        }
    }

    @PostMapping("/departments")
    public ResponseEntity<ApiResponse<String>> syncDepartments() {
        try {
            departmentSyncService.syncDepartments();
            return ResponseEntity.ok(ApiResponse.success("Đồng bộ dữ liệu phòng ban từ MongoDB thành công", null, 0));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.failure("Lỗi trong quá trình đồng bộ phòng ban: " + e.getMessage(), 0));
        }
    }
}
