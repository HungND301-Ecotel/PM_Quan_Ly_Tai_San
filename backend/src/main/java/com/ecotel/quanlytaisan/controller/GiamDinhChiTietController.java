package com.ecotel.quanlytaisan.controller;

import com.ecotel.quanlytaisan.model.ApiResponse;
import com.ecotel.quanlytaisan.model.GiamDinhChiTiet;
import com.ecotel.quanlytaisan.dao.GiamDinhChiTietDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/giamdinh-chitiet")
public class GiamDinhChiTietController {

    @Autowired
    private GiamDinhChiTietDao dao;

    @GetMapping("/giamdinh/{idGiamDinh}")
    public ResponseEntity<ApiResponse<Object>> getByGiamDinh(@PathVariable("idGiamDinh") String idGiamDinh) {
        try {
            List<GiamDinhChiTiet> list = dao.findByIdGiamDinh(idGiamDinh);
            return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành công", list, list.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }
}
