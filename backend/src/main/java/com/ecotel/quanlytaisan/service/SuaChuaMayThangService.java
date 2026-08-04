package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.SuaChuaMayThangDao;
import com.ecotel.quanlytaisan.model.SuaChuaMayThang;
import com.ecotel.quanlytaisan.model.SuaChuaMayThangDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SuaChuaMayThangService {

    @Autowired
    private SuaChuaMayThangDao suaChuaMayThangDao;

    public List<SuaChuaMayThangDTO> getByTaiSanId(String idTaiSan) {
        return suaChuaMayThangDao.getByTaiSanId(idTaiSan);
    }

    public SuaChuaMayThangDTO getById(String id) {
        return suaChuaMayThangDao.getById(id);
    }

    public int createBatch(List<SuaChuaMayThang> list) {
        return suaChuaMayThangDao.createBatch(list);
    }

    public int updateBatch(List<SuaChuaMayThang> list) {
        return suaChuaMayThangDao.updateBatch(list);
    }

    public int deleteBatch(List<String> ids) {
        return suaChuaMayThangDao.deleteBatch(ids);
    }
}