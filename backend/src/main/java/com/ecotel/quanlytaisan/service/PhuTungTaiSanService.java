package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.PhuTungTaiSanDao;
import com.ecotel.quanlytaisan.model.PhuTungTaiSan;
import com.ecotel.quanlytaisan.model.PhuTungTaiSanDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PhuTungTaiSanService {

    @Autowired
    private PhuTungTaiSanDao phuTungTaiSanDao;

    public List<PhuTungTaiSanDTO> getByTaiSanId(String idTaiSan) {
        return phuTungTaiSanDao.getByTaiSanId(idTaiSan);
    }

    public PhuTungTaiSanDTO getById(String id) {
        return phuTungTaiSanDao.getById(id);
    }

    public int insert(PhuTungTaiSan obj) {
        return phuTungTaiSanDao.insert(obj);
    }

    public int update(PhuTungTaiSan obj) {
        return phuTungTaiSanDao.update(obj);
    }

    public int delete(String id) {
        return phuTungTaiSanDao.delete(id);
    }

    public int createBatch(List<PhuTungTaiSan> list) {
        return phuTungTaiSanDao.createBatch(list);
    }

    public int updateBatch(List<PhuTungTaiSan> list) {
        return phuTungTaiSanDao.updateBatch(list);
    }

    public int deleteBatch(List<String> ids) {
        return phuTungTaiSanDao.deleteBatch(ids);
    }
}
