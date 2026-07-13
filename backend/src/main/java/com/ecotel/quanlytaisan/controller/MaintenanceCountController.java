package com.ecotel.quanlytaisan.controller;

import com.ecotel.quanlytaisan.model.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceCountController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/share-counts")
    public ResponseEntity<ApiResponse<Object>> getShareCounts(@RequestParam("userid") String userid) {
        try {
            boolean isAdmin = "admin".equalsIgnoreCase(userid);
            String baseCondition = "(Share IS NULL OR Share = 0) AND (TrangThai IS NULL OR TrangThai NOT IN (2, 3))";
            String condition = isAdmin ? baseCondition : baseCondition + " AND NguoiTao = ?";
            Object[] args = isAdmin ? new Object[]{} : new Object[]{userid};

            Map<String, Long> counts = new HashMap<>();

            counts.put("totalPlan", countTable("kehoachsuachua", condition, args));
            counts.put("totalIncident", countTable("suco_thietbi", condition, args));
            counts.put("totalRepair", countTable("suachua", condition, args));
            counts.put("totalIncidentInspection", countTable("kiemtra_suco", condition, args));
            counts.put("totalMaterialAssessment", countTable("danhgia_vattu", condition, args));
            counts.put("totalInspectionMachine", countTable("giamdinh", condition, args));
            counts.put("totalInspectionVehicle", 0L);
            counts.put("totalMachineInspection", countTable("nghiemthu_maymoc", condition, args));
            counts.put("totalVehicleAcceptance", countTable("nghiemthu_phuongtien", condition, args));
            counts.put("totalMeasureMachine", countTable("bienphap_maymoc", condition, args));
            counts.put("totalMeasureVehicle", countTable("bienphap_phuongtien", condition, args));

            long totalShareRecord = counts.values().stream().mapToLong(l -> l != null ? l.longValue() : 0L).sum();
            counts.put("totalMaintance", totalShareRecord);

            // Handover and Transfer
            long totalAssetTransfer1 = countTable("dieudongtaisan", condition + " AND (loai = 1 OR loai IS NULL)", args);
            long totalAssetTransfer2 = countTable("dieudongtaisan", condition + " AND loai = 2", args);
            long totalAssetTransfer3 = countTable("dieudongtaisan", condition + " AND loai = 3", args);
            long totalAssetTransfer = totalAssetTransfer1 + totalAssetTransfer2 + totalAssetTransfer3;

            long totalToolTransfer1 = countTable("dieudongccdcvattu", condition + " AND (loai = 1 OR loai IS NULL)", args);
            long totalToolTransfer2 = countTable("dieudongccdcvattu", condition + " AND loai = 2", args);
            long totalToolTransfer3 = countTable("dieudongccdcvattu", condition + " AND loai = 3", args);
            long totalToolTransfer = totalToolTransfer1 + totalToolTransfer2 + totalToolTransfer3;

            long totalAssetHandover = countTable("bangiaotaisan", condition, args);
            long totalToolHandover = countTable("bangiaoccdcvattu", condition, args);
            
            counts.put("totalAssetTransfer1", totalAssetTransfer1);
            counts.put("totalAssetTransfer2", totalAssetTransfer2);
            counts.put("totalAssetTransfer3", totalAssetTransfer3);
            
            counts.put("totalToolTransfer1", totalToolTransfer1);
            counts.put("totalToolTransfer2", totalToolTransfer2);
            counts.put("totalToolTransfer3", totalToolTransfer3);

            counts.put("totalAssetTransfer", totalAssetTransfer);
            counts.put("totalToolTransfer", totalToolTransfer);
            counts.put("totalAssetHandover", totalAssetHandover);
            counts.put("totalToolHandover", totalToolHandover);
            counts.put("totalTransfer", totalAssetTransfer + totalToolTransfer);
            counts.put("totalHandover", totalAssetHandover + totalToolHandover);

            return ResponseEntity.ok(ApiResponse.success("Lấy số lượng bản ghi có quyền share thành công", counts, 1));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    @GetMapping("/sign-counts")
    public ResponseEntity<ApiResponse<Object>> getSignCounts(@RequestParam("userid") String userid) {
        try {
            Map<String, Long> counts = new HashMap<>();

            counts.put("totalPlan", countSignTable("kehoachsuachua", "idNguoiLapBieu", "nguoiLapBieuXacNhan", "idTrinhDuyetGiamDoc", "trinhDuyetGiamDocXacNhan", userid));
            counts.put("totalIncident", countSignTable("suco_thietbi", "idNguoiLap", "nguoiLapXacNhan", "idGiamDoc", "giamDocXacNhan", userid));
            counts.put("totalIncidentInspection", countSignTable("kiemtra_suco", "idNguoiLap", "nguoiLapXacNhan", "idGiamDoc", "giamDocXacNhan", userid));
            counts.put("totalRepair", countSignTable("suachua", "idNguoiLap", "nguoiLapXacNhan", "idGiamDoc", "giamDocXacNhan", userid));
            counts.put("totalInspectionMachine", countSignTable("giamdinh_maymoc", "idNguoiLap", "nguoiLapXacNhan", "idGiamDoc", "giamDocXacNhan", userid));
            counts.put("totalInspectionVehicle", countSignTable("giamdinh_phuongtien", "idNguoiLap", "nguoiLapXacNhan", "idGiamDoc", "giamDocXacNhan", userid));
            counts.put("totalMeasureMachine", countSignTable("bienphap_maymoc", "idNguoiLap", "nguoiLapXacNhan", "idGiamDoc", "giamDocXacNhan", userid));
            counts.put("totalMeasureVehicle", countSignTable("bienphap_phuongtien", "idNguoiLap", "nguoiLapXacNhan", "idGiamDoc", "giamDocXacNhan", userid));
            counts.put("totalMachineInspection", countSignTable("nghiemthu_maymoc", "idNguoiLap", "nguoiLapXacNhan", "idGiamDoc", "giamDocXacNhan", userid));
            counts.put("totalVehicleAcceptance", countSignTable("nghiemthu_phuongtien", "idNguoiLap", "nguoiLapXacNhan", "idGiamDoc", "giamDocXacNhan", userid));
            counts.put("totalMaterialAssessment", countSignTable("danhgia_vattu", "idNguoiLap", "nguoiLapXacNhan", "idGiamDoc", "giamDocXacNhan", userid));
            
            long totalSignRecord = counts.values().stream().mapToLong(l -> l != null ? l.longValue() : 0L).sum();
            
            counts.put("totalMaintance", totalSignRecord);

            // Handover and Transfer
            long totalAssetTransfer1 = countTransferSignTableWithLoai("dieudongtaisan", userid, 1);
            long totalAssetTransfer2 = countTransferSignTableWithLoai("dieudongtaisan", userid, 2);
            long totalAssetTransfer3 = countTransferSignTableWithLoai("dieudongtaisan", userid, 3);

            long totalToolTransfer1 = countTransferSignTableWithLoai("dieudongccdcvattu", userid, 1);
            long totalToolTransfer2 = countTransferSignTableWithLoai("dieudongccdcvattu", userid, 2);
            long totalToolTransfer3 = countTransferSignTableWithLoai("dieudongccdcvattu", userid, 3);

            if (checkBanHanhQuyetDinh(userid)) {
                counts.put("totalAssetTransferBanHanh1", countTransferBanHanh("dieudongtaisan", userid, 1));
                counts.put("totalAssetTransferBanHanh2", countTransferBanHanh("dieudongtaisan", userid, 2));
                counts.put("totalAssetTransferBanHanh3", countTransferBanHanh("dieudongtaisan", userid, 3));

                counts.put("totalToolTransferBanHanh1", countTransferBanHanh("dieudongccdcvattu", userid, 1));
                counts.put("totalToolTransferBanHanh2", countTransferBanHanh("dieudongccdcvattu", userid, 2));
                counts.put("totalToolTransferBanHanh3", countTransferBanHanh("dieudongccdcvattu", userid, 3));
            } else {
                counts.put("totalAssetTransferBanHanh1", 0L);
                counts.put("totalAssetTransferBanHanh2", 0L);
                counts.put("totalAssetTransferBanHanh3", 0L);

                counts.put("totalToolTransferBanHanh1", 0L);
                counts.put("totalToolTransferBanHanh2", 0L);
                counts.put("totalToolTransferBanHanh3", 0L);
            }

            long totalAssetTransfer = totalAssetTransfer1 + totalAssetTransfer2 + totalAssetTransfer3;
            long totalToolTransfer = totalToolTransfer1 + totalToolTransfer2 + totalToolTransfer3;

            long totalAssetHandover = countHandoverSignTable("bangiaotaisan", userid);
            long totalToolHandover = countHandoverSignTable("bangiaoccdcvattu", userid);

            counts.put("totalAssetTransfer1", totalAssetTransfer1);
            counts.put("totalAssetTransfer2", totalAssetTransfer2);
            counts.put("totalAssetTransfer3", totalAssetTransfer3);
            counts.put("totalToolTransfer1", totalToolTransfer1);
            counts.put("totalToolTransfer2", totalToolTransfer2);
            counts.put("totalToolTransfer3", totalToolTransfer3);
            counts.put("totalAssetTransfer", totalAssetTransfer);
            counts.put("totalToolTransfer", totalToolTransfer);
            counts.put("totalAssetHandover", totalAssetHandover);
            counts.put("totalToolHandover", totalToolHandover);

            return ResponseEntity.ok(ApiResponse.success("Lấy số lượng bản ghi chờ ký thành công", counts, 1));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.failure("Lỗi hệ thống: " + e.getMessage(), null));
        }
    }

    private long countTable(String tableName, String condition, Object[] args) {
        try {
            String sql = "SELECT COUNT(*) FROM " + tableName + " WHERE " + condition;
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, args);
            return count != null ? count.longValue() : 0L;
        } catch (Exception e) {
            System.err.println("Error counting table " + tableName + ": " + e.getMessage());
            return 0L;
        }
    }

    private long countSignTable(String tableName, String idNguoiLapCol, String nguoiLapXacNhanCol, String idGiamDocCol, String giamDocXacNhanCol, String userid) {
        try {
            String sql = "SELECT COUNT(*) FROM " + tableName + " t " +
                         "WHERE (t.TrangThai IS NULL OR t.TrangThai NOT IN (2, 3)) " +
                         "AND (" +
                         "  (" +
                         "      t." + idNguoiLapCol + " = ? " +
                         "      AND (t." + nguoiLapXacNhanCol + " IS NULL OR t." + nguoiLapXacNhanCol + " = 0) " +
                         "      AND (t.Share = 1 OR t.NguoiTao = ?) " +
                         "  ) " +
                         "  OR (" +
                         "      t.Share = 1 " +
                         "      AND (t." + idNguoiLapCol + " IS NULL OR t." + idNguoiLapCol + " = '' OR t." + nguoiLapXacNhanCol + " = 1) " +
                         "      AND ? = (SELECT k2.idNguoiKy FROM NguoiKy k2 WHERE k2.idTaiLieu = t.Id AND (k2.TrangThai IS NULL OR k2.TrangThai = 0) ORDER BY k2.Id ASC LIMIT 1) " +
                         "  ) " +
                         "  OR (" +
                         "      t.Share = 1 " +
                         "      AND t." + idGiamDocCol + " = ? " +
                         "      AND (t." + giamDocXacNhanCol + " IS NULL OR t." + giamDocXacNhanCol + " = 0) " +
                         "      AND (t." + idNguoiLapCol + " IS NULL OR t." + idNguoiLapCol + " = '' OR t." + nguoiLapXacNhanCol + " = 1) " +
                         "      AND NOT EXISTS (SELECT 1 FROM NguoiKy k3 WHERE k3.idTaiLieu = t.Id AND (k3.TrangThai IS NULL OR k3.TrangThai = 0)) " +
                         "  )" +
                         ")";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userid, userid, userid, userid);
            return count != null ? count.longValue() : 0L;
        } catch (Exception e) {
            System.err.println("Error counting sign table " + tableName + ": " + e.getMessage());
            return 0L;
        }
    }

    private boolean checkBanHanhQuyetDinh(String userid) {
        if ("admin".equalsIgnoreCase(userid)) return false;
        try {
            String sql = "SELECT cv.BanHanhQuyetDinh FROM NhanVien nv JOIN ChucVu cv ON nv.ChucVu = cv.Id WHERE nv.Id = ?";
            Boolean banHanh = jdbcTemplate.queryForObject(sql, Boolean.class, userid);
            return Boolean.TRUE.equals(banHanh);
        } catch (Exception e) {
            return false;
        }
    }

    private long countTransferBanHanh(String tableName, String userid, int loai) {
        String loaiCondition = (loai == 1) ? "(t.loai = 1 OR t.loai IS NULL)" : "t.loai = " + loai;
        try {
            String sql = "SELECT COUNT(*) FROM " + tableName + " t " +
                         "JOIN NhanVien nv ON nv.Id = ? " +
                         "WHERE t.TrangThai = 3 AND t.IdCongTy = nv.IdCongTy AND " + loaiCondition;
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userid);
            return count != null ? count.longValue() : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    private long countTransferSignTableWithLoai(String tableName, String userid, int loai) {
        String loaiCondition = (loai == 1) ? "(t.loai = 1 OR t.loai IS NULL)" : "t.loai = " + loai;
        try {
            String sql = "SELECT COUNT(*) FROM " + tableName + " t " +
                         "WHERE (t.TrangThai IS NULL OR t.TrangThai NOT IN (2, 3, 4)) " +
                         "AND " + loaiCondition + " AND (" +
                         "  (" + 
                         "      t.NguoiLapPhieuKyNhay = 1 " +
                         "      AND (t.Share = 1 OR t.NguoiTao = ?) " +
                         "      AND t.idNguoiKyNhay = ? " +
                         "      AND (t.trangThaiKyNhay IS NULL OR t.trangThaiKyNhay = 0) " +
                         "  ) " +
                         "  OR (" + 
                         "      (t.Share = 1 OR t.NguoiTao = ?) " +
                         "      AND (t.NguoiLapPhieuKyNhay IS NULL OR t.NguoiLapPhieuKyNhay = 0 OR t.trangThaiKyNhay = 1) " +
                         "      AND t.idTrinhDuyetCapPhong = ? " +
                         "      AND (t.trinhDuyetCapPhongXacNhan IS NULL OR t.trinhDuyetCapPhongXacNhan = 0) " +
                         "  ) " +
                         "  OR (" + 
                         "      (t.Share = 1 OR t.NguoiTao = ?) " +
                         "      AND (t.NguoiLapPhieuKyNhay IS NULL OR t.NguoiLapPhieuKyNhay = 0 OR t.trangThaiKyNhay = 1) " +
                         "      AND (t.idTrinhDuyetCapPhong IS NULL OR t.idTrinhDuyetCapPhong = '' OR t.trinhDuyetCapPhongXacNhan = 1) " +
                         "      AND ? = (SELECT k2.idNguoiKy FROM NguoiKy k2 WHERE k2.idTaiLieu = t.Id AND (k2.TrangThai IS NULL OR k2.TrangThai = 0) ORDER BY k2.Id ASC LIMIT 1) " +
                         "  ) " +
                         "  OR (" + 
                         "      (t.Share = 1 OR t.NguoiTao = ?) " +
                         "      AND (t.NguoiLapPhieuKyNhay IS NULL OR t.NguoiLapPhieuKyNhay = 0 OR t.trangThaiKyNhay = 1) " +
                         "      AND (t.idTrinhDuyetCapPhong IS NULL OR t.idTrinhDuyetCapPhong = '' OR t.trinhDuyetCapPhongXacNhan = 1) " +
                         "      AND t.idTrinhDuyetGiamDoc = ? " +
                         "      AND (t.trinhDuyetGiamDocXacNhan IS NULL OR t.trinhDuyetGiamDocXacNhan = 0) " +
                         "      AND NOT EXISTS (SELECT 1 FROM NguoiKy k3 WHERE k3.idTaiLieu = t.Id AND (k3.TrangThai IS NULL OR k3.TrangThai = 0)) " +
                         "  )" +
                         ")";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userid, userid, userid, userid, userid, userid, userid, userid);
            return count != null ? count.longValue() : 0L;
        } catch (Exception e) {
            System.err.println("Error counting transfer sign table " + tableName + ": " + e.getMessage());
            return 0L;
        }
    }

    private long countHandoverSignTable(String tableName, String userid) {
        try {
            String sql = "SELECT COUNT(*) FROM " + tableName + " t " +
                         "WHERE (t.TrangThai IS NULL OR t.TrangThai NOT IN (2, 3, 4)) " +
                         "AND (" +
                         "  (" + 
                         "      (t.Share = 1 OR t.NguoiTao = ?) " +
                         "      AND t.idDaiDienBenGiao = ? " +
                         "      AND (t.daiDienBenGiaoXacNhan IS NULL OR t.daiDienBenGiaoXacNhan = 0) " +
                         "  ) " +
                         "  OR (" + 
                         "      (t.Share = 1 OR t.NguoiTao = ?) " +
                         "      AND (t.idDaiDienBenGiao IS NULL OR t.idDaiDienBenGiao = '' OR t.daiDienBenGiaoXacNhan = 1) " +
                         "      AND t.idDaiDienBenNhan = ? " +
                         "      AND (t.daiDienBenNhanXacNhan IS NULL OR t.daiDienBenNhanXacNhan = 0) " +
                         "  ) " +
                         "  OR (" + 
                         "      (t.Share = 1 OR t.NguoiTao = ?) " +
                         "      AND (t.idDaiDienBenGiao IS NULL OR t.idDaiDienBenGiao = '' OR t.daiDienBenGiaoXacNhan = 1) " +
                         "      AND (t.idDaiDienBenNhan IS NULL OR t.idDaiDienBenNhan = '' OR t.daiDienBenNhanXacNhan = 1) " +
                         "      AND ? = (SELECT k2.idNguoiKy FROM NguoiKy k2 WHERE k2.idTaiLieu = t.Id AND (k2.TrangThai IS NULL OR k2.TrangThai = 0) ORDER BY k2.Id ASC LIMIT 1) " +
                         "  ) " +
                         "  OR (" + 
                         "      (t.Share = 1 OR t.NguoiTao = ?) " +
                         "      AND (t.idDaiDienBenGiao IS NULL OR t.idDaiDienBenGiao = '' OR t.daiDienBenGiaoXacNhan = 1) " +
                         "      AND (t.idDaiDienBenNhan IS NULL OR t.idDaiDienBenNhan = '' OR t.daiDienBenNhanXacNhan = 1) " +
                         "      AND t.idGiamDoc = ? " +
                         "      AND (t.giamDocKy IS NULL OR t.giamDocKy = 0) " +
                         "      AND NOT EXISTS (SELECT 1 FROM NguoiKy k3 WHERE k3.idTaiLieu = t.Id AND (k3.TrangThai IS NULL OR k3.TrangThai = 0)) " +
                         "  )" +
                         ")";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userid, userid, userid, userid, userid, userid, userid, userid);
            return count != null ? count.longValue() : 0L;
        } catch (Exception e) {
            System.err.println("Error counting handover sign table " + tableName + ": " + e.getMessage());
            return 0L;
        }
    }
}
