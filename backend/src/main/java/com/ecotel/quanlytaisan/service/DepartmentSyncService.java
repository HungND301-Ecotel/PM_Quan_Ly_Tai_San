package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.PhongBanDao;
import com.ecotel.quanlytaisan.dao.mongo.MongoDepartmentRepository;
import com.ecotel.quanlytaisan.model.PhongBan;
import com.ecotel.quanlytaisan.model.mongo.MongoDepartment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
public class DepartmentSyncService {

    @Autowired
    private MongoDepartmentRepository mongoDepartmentRepository;

    @Autowired
    private PhongBanDao phongBanDao;

    private String getCurrentTime() {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return dtf.format(LocalDateTime.now());
    }

    /**
     * Đồng bộ một phòng ban đơn lẻ (dùng cho Change Streams).
     */
    public void syncSingleDepartment(MongoDepartment dept) {
        if (dept == null || dept.getCode() == null || dept.getCode().trim().isEmpty()) {
            log.warn("Bỏ qua department vì không có code: {}", dept);
            return;
        }
        String currentTime = getCurrentTime();
        PhongBan pb = new PhongBan();
        pb.setId(dept.getCode());
        pb.setTenPhongBan(dept.getName() != null ? dept.getName() : "Không tên");
        pb.setIdCongTy("CT001");
        pb.setNgayTao(currentTime);
        pb.setNgayCapNhat(currentTime);
        pb.setNguoiTao("admin");
        pb.setNguoiCapNhat("admin");
        pb.setIsActive(true);
        pb.setIsKho(false);
        pb.setIsLanhDao(false);
        pb.setLoaiKho(0);
        phongBanDao.insert(pb);
        log.info("Đã đồng bộ phòng ban: {}", dept.getCode());
    }

    /**
     * Đồng bộ toàn bộ departments (dùng cho sync thủ công).
     */
    public void syncDepartments() {
        log.info("Bắt đầu đồng bộ dữ liệu từ MongoDB (departments) sang MySQL (PhongBan)...");

        List<MongoDepartment> departments = mongoDepartmentRepository.findAll();
        int successCount = 0;
        int failCount = 0;

        for (MongoDepartment dept : departments) {
            try {
                syncSingleDepartment(dept);
                successCount++;
            } catch (Exception e) {
                log.error("Lỗi khi đồng bộ department có code {}: {}", dept.getCode(), e.getMessage());
                failCount++;
            }
        }

        log.info("Kết thúc đồng bộ. Thành công: {}, Thất bại: {}", successCount, failCount);
    }
}
