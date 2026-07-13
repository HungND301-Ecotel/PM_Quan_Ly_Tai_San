package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.QuyTrinhDao;
import com.ecotel.quanlytaisan.model.PageResponse;
import com.ecotel.quanlytaisan.model.QuyTrinhSuaChuaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class QuyTrinhService {

    @Autowired
    private QuyTrinhDao quyTrinhDao;

    public PageResponse<QuyTrinhSuaChuaDTO> getPagedQuyTrinh(int page, int pageSize, String idTaiSan, Integer nam) {
        int total = quyTrinhDao.countQuyTrinh(idTaiSan, nam);
        List<QuyTrinhSuaChuaDTO> list = quyTrinhDao.getPagedQuyTrinh(page, pageSize, idTaiSan, nam);

        return new PageResponse<>(list, total, page, pageSize);
    }

    public PageResponse<QuyTrinhSuaChuaDTO> getPagedHistory(int page, int pageSize, String search, Integer status) {
        int total = quyTrinhDao.countHistory(search, status);
        List<QuyTrinhSuaChuaDTO> list = quyTrinhDao.getPagedHistory(page, pageSize, search, status);

        // Get counts by status
        List<Map<String, Object>> counts = quyTrinhDao.countHistoryByStatus(search);
        Map<String, Long> trangThaiCounts = new HashMap<>();
        trangThaiCounts.put("0", 0L); // Đang bảo trì
        trangThaiCounts.put("1", 0L); // Đã BT

        for (Map<String, Object> row : counts) {
            String s = row.get("statusHistory").toString();
            Long count = (Long) row.get("count");
            trangThaiCounts.put(s, count);
        }

        PageResponse<QuyTrinhSuaChuaDTO> response = new PageResponse<>(list, total, page, pageSize);
        response.setTrangThaiCounts(trangThaiCounts);
        return response;
    }

    public List<Map<String, Object>> getLichSuHoatDong(String idTaiSan, String dateFrom, String dateTo) {
        return quyTrinhDao.getLichSuHoatDong(idTaiSan, dateFrom, dateTo);
    }

    public List<com.ecotel.quanlytaisan.model.VatTuTieuHaoDTO> getMaterialConsumption(
            String idTaiSan, String dateFrom, String dateTo, String nhomTaiSan) {
        return quyTrinhDao.getMaterialConsumption(idTaiSan, dateFrom, dateTo, nhomTaiSan);
    }
}
