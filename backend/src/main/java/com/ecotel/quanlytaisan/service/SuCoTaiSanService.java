package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.SuCoTaiSanDao;
import com.ecotel.quanlytaisan.model.SuCoTaiSan;
import com.ecotel.quanlytaisan.model.SuCoTaiSanDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SuCoTaiSanService {

    @Autowired
    private SuCoTaiSanDao suCoTaiSanDao;

    public List<SuCoTaiSanDTO> getByTaiSanId(String idTaiSan) {
        return suCoTaiSanDao.getByTaiSanId(idTaiSan);
    }

    public SuCoTaiSanDTO getById(String id) {
        return suCoTaiSanDao.getById(id);
    }

    public int createBatch(List<SuCoTaiSan> list) {
        return suCoTaiSanDao.createBatch(list);
    }

    public int updateBatch(List<SuCoTaiSan> list) {
        return suCoTaiSanDao.updateBatch(list);
    }

    public int deleteBatch(List<String> ids) {
        return suCoTaiSanDao.deleteBatch(ids);
    }
}
