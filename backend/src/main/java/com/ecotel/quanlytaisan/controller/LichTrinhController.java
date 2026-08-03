package com.ecotel.quanlytaisan.controller;

import com.ecotel.quanlytaisan.model.ApiResponse;
import com.ecotel.quanlytaisan.model.LichTrinhDTO;
import com.ecotel.quanlytaisan.service.LichTrinhService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import java.util.List;

@RestController
@RequestMapping("/api/lichtrinh")
@Validated
public class LichTrinhController {

    @Autowired
    private LichTrinhService lichTrinhService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LichTrinhDTO>>> getAll(
            @RequestParam(value = "idTaiSan", required = false) String idTaiSan,
            @RequestParam(value = "nam", required = false) Integer nam,
            @RequestParam(value = "thang", required = false) Integer thang,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "sortDir", required = false) String sortDir) {

        List<LichTrinhDTO> data = lichTrinhService.getAll(idTaiSan, nam, thang, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch trình thành công", data, data.size()));
    }

    @GetMapping("/luy-ke")
    public ResponseEntity<ApiResponse<Integer>> getLuyKe(
            @RequestParam String idTaiSan,
            @RequestParam Integer nam,
            @RequestParam Integer thang) {
        Integer luyKe = lichTrinhService.getLuyKeTruoc(idTaiSan, nam, thang);
        return ResponseEntity.ok(ApiResponse.success("Lấy lũy kế thành công", luyKe, 1));
    }

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> createBatch(@Valid @RequestBody List<@Valid LichTrinhDTO> dtos) {
        int result = lichTrinhService.createBatch(dtos);
        if (result > 0) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Tạo batch lịch trình thành công", dtos, result));
        }
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.failure("Tạo batch lịch trình thất bại", result));
    }

    @PutMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> updateBatch(@Valid @RequestBody List<@Valid LichTrinhDTO> dtos) {
        int result = lichTrinhService.updateBatch(dtos);
        if (result > 0) {
            return ResponseEntity.ok(ApiResponse.success("Cập nhật batch lịch trình thành công", dtos, result));
        }
        return ResponseEntity.ok(ApiResponse.failure("Không có lịch trình nào được cập nhật", result));
    }

     @DeleteMapping("/batch")
    public ResponseEntity<ApiResponse<Object>> deleteBatch(@RequestBody List<String> ids) {
        int result = lichTrinhService.deleteBatch(ids);
        if (result > 0) {
            return ResponseEntity.ok(ApiResponse.success("Xóa batch lịch trình thành công", ids, result));
        }
        return ResponseEntity.ok(ApiResponse.failure("Không tìm thấy lịch trình để xóa", result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LichTrinhDTO>> create(@Valid @RequestBody LichTrinhDTO dto) {
        LichTrinhDTO saved = lichTrinhService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo lịch trình thành công", saved, 1));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LichTrinhDTO>> update(@PathVariable String id, @Valid @RequestBody LichTrinhDTO dto) {
        LichTrinhDTO updated = lichTrinhService.update(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật lịch trình thành công", updated, 1));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(@PathVariable String id) {
        lichTrinhService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa lịch trình thành công", id, 1));
    }
}
