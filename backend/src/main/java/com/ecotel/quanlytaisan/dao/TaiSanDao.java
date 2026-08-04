package com.ecotel.quanlytaisan.dao;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.ecotel.quanlytaisan.model.KhauHaoTaiSan;
import com.ecotel.quanlytaisan.model.NguonKinhPhi;
import com.ecotel.quanlytaisan.model.SetNguonKinhPhi;
import com.ecotel.quanlytaisan.model.TaiSan;
import com.ecotel.quanlytaisan.model.TaiSanCon;
import com.ecotel.quanlytaisan.model.TaiSanDTO;

@Repository
public class TaiSanDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private SetNguonKinhPhiDao setNguonKinhPhiDao;

    // Updated SELECT with joins to PhongBan (twice) and DonViTinh
    private final String SELECT_TAISAN_DTO = """
            SELECT 
                ts.*, 
                mhts.TenMoHinh, 
                nts.TenNhom, 
                lts.TenLoai,
                da.TenDuAn, 
                nv.TenNguonKinhPhi,
                pb1.TenPhongBan AS tenDonViBanDau,
                pb2.TenPhongBan AS tenDonViHienThoi,
                pb3.TenPhongBan AS tenDonViQuanlyKiThuat,
                dvt.TenDonVi AS tenDonViTinh,
                ht.TenHTKT AS tenHienTrang,
                ts.IdDuDan as idDuAn,
                llt.MaLyLich as maLyLich
            FROM TaiSan AS ts
            LEFT JOIN MoHinhTaiSan AS mhts ON ts.IdMoHinhTaiSan = mhts.Id
            LEFT JOIN NhomTaiSan AS nts ON ts.IdNhomTaiSan = nts.Id
            LEFT JOIN lylich AS ll ON nts.IdLyLich = ll.Id
            LEFT JOIN lylich_template AS llt ON ll.IdLyLichTemplate = llt.Id
            LEFT JOIN LoaiTaiSanCon AS lts ON Ts.idLoaiTaiSanCon = lts.Id
            LEFT JOIN DuAn AS da ON ts.IdDuDan = da.Id
            LEFT JOIN NguonVon AS nv ON ts.IdNguonVon = nv.Id
            LEFT JOIN PhongBan AS pb1 ON ts.IdDonViBanDau = pb1.Id
            LEFT JOIN PhongBan AS pb2 ON ts.IdDonViHienThoi = pb2.Id
            LEFT JOIN PhongBan AS pb3 ON ts.IdDonViQuanlyKiThuat = pb3.Id
            LEFT JOIN DonViTinh AS dvt ON ts.DonViTinh = dvt.Id
            LEFT JOIN HienTrangKyThuat AS ht ON ts.HienTrang = ht.Id
            """;

    public List<TaiSanDTO> findAll(String idCongTy) {
        return findAll(idCongTy, null);
    }

    public List<TaiSanDTO> findAll(String idCongTy, String idDonViQuanLy) {
        return findAll(idCongTy, idDonViQuanLy, null);
    }

    public List<TaiSanDTO> findAll(String idCongTy, String idDonViQuanLy, Boolean isHeThong) {
        StringBuilder sql = new StringBuilder(SELECT_TAISAN_DTO + " WHERE ts.IdCongTy = ?");
        List<Object> params = new ArrayList<>();
        params.add(idCongTy);

        if (idDonViQuanLy != null && !idDonViQuanLy.trim().isEmpty()) {
            sql.append(" AND ( ")
               .append(" (ts.IdDonViHienThoi IS NOT NULL AND ts.IdDonViHienThoi != '' AND ts.IdDonViHienThoi = ?) ")
               .append(" OR ")
               .append(" ((ts.IdDonViHienThoi IS NULL OR ts.IdDonViHienThoi = '') AND ts.IdDonViBanDau = ?) ")
               .append(" )");
            params.add(idDonViQuanLy);
            params.add(idDonViQuanLy);
        }

        if (Boolean.TRUE.equals(isHeThong)) {
            sql.append(" AND ts.IsHeThong = 1");
        }

        List<TaiSanDTO> list = jdbcTemplate.query(sql.toString(), new BeanPropertyRowMapper<>(TaiSanDTO.class), params.toArray());
        attachAdditionalData(list);
        return list;
    }

    /**
     * Cập nhật hiện trạng (hienTrang) cho tài sản
     */
    public int updateHienTrang(String idTaiSan, String hienTrang) {
        String sql = "UPDATE TaiSan SET HienTrang = ? WHERE Id = ?";
        return jdbcTemplate.update(sql, hienTrang, idTaiSan);
    }

    /**
     * Hàm phụ trợ để load thêm dữ liệu quan hệ (Nguồn kinh phí) cho DTO
     */
    private void attachAdditionalData(List<TaiSanDTO> taiSanDTOList) {
        if (taiSanDTOList == null || taiSanDTOList.isEmpty()) return;

        List<String> soTheList = taiSanDTOList.stream()
                .map(TaiSanDTO::getSoThe)
                .filter(s -> s != null && !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());

        if (!soTheList.isEmpty()) {
            List<SetNguonKinhPhi> allSetNguon = setNguonKinhPhiDao.getSetNguonKinhPhiTaiSanIds(soTheList);
            List<Map<String, Object>> allNguonRaw = setNguonKinhPhiDao.getNguonKinhPhiWithTaiSanId(soTheList);

            Map<String, List<SetNguonKinhPhi>> setNguonMap = allSetNguon.stream()
                    .collect(Collectors.groupingBy(SetNguonKinhPhi::getIdTaiSan));

            Map<String, List<NguonKinhPhi>> nguonMap = new java.util.HashMap<>();
            for (Map<String, Object> row : allNguonRaw) {
                String idTaiSan = (String) row.get("IdTaiSan");
                NguonKinhPhi nkp = new NguonKinhPhi();
                nkp.setId((String) row.get("Id"));
                nkp.setTen((String) row.get("Ten"));
                nguonMap.computeIfAbsent(idTaiSan, k -> new ArrayList<>()).add(nkp);
            }

            for (TaiSanDTO dto : taiSanDTOList) {
                if (dto.getSoThe() != null) {
                    dto.setSetNguonKinhPhiList(setNguonMap.getOrDefault(dto.getSoThe(), new ArrayList<>()));
                    dto.setNguonKinhPhiList(nguonMap.getOrDefault(dto.getSoThe(), new ArrayList<>()));
                }
            }
        }
    }

    public long countByCongTy(String idCongTy, int soNgayThongBaoKiemDinh, String trangThaiKiemDinh) {
        String whereClause = "WHERE ts.IdCongTy = ?";
         String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
        // Filter theo trạng thái kiểm định
       // Lọc theo trạng thái kiểm định (thay vì Boolean, dùng String)
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'DA_DANG_KIEM'";
                    break;
                case "SAP_DEN_HAN":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'SAP_DEN_HAN'";
                    break;
                case "QUA_HAN":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'QUA_HAN'";
                    break;
            }
        }

        String sql = "SELECT COUNT(*) FROM TaiSan ts " + whereClause;
        Long result = jdbcTemplate.queryForObject(sql, Long.class, idCongTy);
        return result != null ? result : 0L;
    }

    public long countByCongTyAndNhom(String idCongTy, String idNhomTaiSan, int soNgayThongBaoKiemDinh, String trangThaiKiemDinh) {
        String whereClause = "WHERE ts.IdCongTy = ? AND ts.IdNhomTaiSan = ?";
         String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
        // Filter theo trạng thái kiểm định
       // Lọc theo trạng thái kiểm định (thay vì Boolean, dùng String)
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'DA_DANG_KIEM'";
                    break;
                case "SAP_DEN_HAN":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'SAP_DEN_HAN'";
                    break;
                case "QUA_HAN":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'QUA_HAN'";
                    break;
            }
        }
        String sql = "SELECT COUNT(*) FROM TaiSan ts " + whereClause;
        Long result = jdbcTemplate.queryForObject(sql, Long.class, idCongTy, idNhomTaiSan);
        return result != null ? result : 0L;
    }

   public long countByDonViBanDau(
        String idCongTy, 
        String idDonViBanDau,
        String search, 
        String idNhomTaiSan,
        int soNgayThongBaoKiemDinh, 
        String trangThaiKiemDinh,
        Boolean isPhatSinh,
        Integer trangThaiSuaChua) {
    
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();
        
        whereClause.append("WHERE ts.IdCongTy = ?");
        params.add(idCongTy);
        
        // Xử lý filter theo idDonViBanDau
        if (idDonViBanDau != null && !idDonViBanDau.trim().isEmpty()) {
            whereClause.append(" AND ts.IdDonViBanDau = ?");
            params.add(idDonViBanDau);
        } else {
            whereClause.append(" AND (ts.IdDonViBanDau IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND LoaiKho = 1 AND IsKho = 1) OR ts.IdDonViBanDau IS NULL OR ts.IdDonViBanDau = '')");
            params.add(idCongTy);
        }
        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?) ");
            String searchPattern = "%" + search + "%";
            for (int i = 0; i < 9; i++) {
                params.add(searchPattern);
            }
        }
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause.append(" AND ts.IdNhomTaiSan = ?");
            params.add(idNhomTaiSan);
        }
        if (isPhatSinh != null) {
            whereClause.append(" AND ts.IsTaiSanPhatSinh = ?");
            params.add(isPhatSinh ? 1 : 0);
        }
        if (trangThaiSuaChua != null) {
            whereClause.append(" AND ts.TrangThaiSuaChua = ?");
            params.add(trangThaiSuaChua);
        }
        
        whereClause.append(" AND (ts.IdDonViHienThoi IS NULL OR ts.IdDonViHienThoi = '')");
        
         String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
        // Filter theo trạng thái kiểm định
       // Lọc theo trạng thái kiểm định (thay vì Boolean, dùng String)
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'DA_DANG_KIEM'");
                    break;
                case "SAP_DEN_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'SAP_DEN_HAN'");
                    break;
                case "QUA_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'QUA_HAN'");
                    break;
            }
        }
        
        String sql = "SELECT COUNT(*) FROM TaiSan ts " + whereClause.toString();
        Long result = jdbcTemplate.queryForObject(sql, Long.class, params.toArray());
        return result != null ? result : 0L;
    }
    

    public long countByDonViThuHoi(
        String idCongTy, 
        String idDonViThuHoi, 
        String search,
        String idNhomTaiSan,
        int soNgayThongBaoKiemDinh, 
        String trangThaiKiemDinh,
        Boolean isPhatSinh,
        Integer trangThaiSuaChua) {
    
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();
        
        whereClause.append("WHERE ts.IdCongTy = ?");
        params.add(idCongTy);
        
        // Xử lý filter theo idDonViThuHoi
        if (idDonViThuHoi != null && !idDonViThuHoi.trim().isEmpty()) {
            whereClause.append(" AND ts.IdDonViHienThoi = ?");
            params.add(idDonViThuHoi);
        } else {
            whereClause.append(" AND ts.IdDonViHienThoi IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND LoaiKho = 2 AND IsKho = 1)");
            params.add(idCongTy);
        }
        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?) ");
            String searchPattern = "%" + search + "%";
            for (int i = 0; i < 9; i++) {
                params.add(searchPattern);
            }
        }
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause.append(" AND ts.IdNhomTaiSan = ?");
            params.add(idNhomTaiSan);
        }
        if (isPhatSinh != null) {
            whereClause.append(" AND ts.IsTaiSanPhatSinh = ?");
            params.add(isPhatSinh ? 1 : 0);
        }
        if (trangThaiSuaChua != null) {
            whereClause.append(" AND ts.TrangThaiSuaChua = ?");
            params.add(trangThaiSuaChua);
        }

        String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
        // Filter theo trạng thái kiểm định
       // Lọc theo trạng thái kiểm định (thay vì Boolean, dùng String)
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'DA_DANG_KIEM'");
                    break;
                case "SAP_DEN_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'SAP_DEN_HAN'");
                    break;
                case "QUA_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'QUA_HAN'");
                    break;
            }
        }
        
        String sql = "SELECT COUNT(*) FROM TaiSan ts " + whereClause.toString();
        Long result = jdbcTemplate.queryForObject(sql, Long.class, params.toArray());
        return result != null ? result : 0L;
    }

    public long countByDonViHienThoi(
        String idCongTy, 
        String idDonViHienThoi, 
        String search,
        String idNhomTaiSan, 
        int soNgayThongBaoKiemDinh, 
        String trangThaiKiemDinh) {
    
        StringBuilder whereClause = new StringBuilder("WHERE ts.IdCongTy = ? AND ts.IdDonViHienThoi = ?");
        List<Object> params = new ArrayList<>();
        params.add(idCongTy);
        params.add(idDonViHienThoi);
        
        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?) ");
            String searchPattern = "%" + search + "%";
            for (int i = 0; i < 9; i++) {
                params.add(searchPattern);
            }
        }
        
        // Lọc theo nhóm tài sản
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause.append(" AND ts.IdNhomTaiSan = ?");
            params.add(idNhomTaiSan);
        }
        
        String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
        
        // Lọc theo trạng thái kiểm định
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            whereClause.append(" AND ").append(inspectionStatusSql).append(" = ?");
            params.add(trangThaiKiemDinh);
        }
        
        String sql = "SELECT COUNT(*) FROM TaiSan ts " + whereClause.toString();
        Long result = jdbcTemplate.queryForObject(sql, Long.class, params.toArray());
        return result != null ? result : 0L;
    }

    /**
     * Đếm số lượng tài sản thực tế theo từng nhóm
     */
    public Map<String, Long> getCountByNhomTaiSan(String idCongTy) {
        String sql = """
        SELECT 
            ts.IdNhomTaiSan AS idNhomTaiSan,
            nts.TenNhom AS tenNhom,
            COUNT(ts.Id) AS soLuong
        FROM TaiSan ts
        LEFT JOIN NhomTaiSan nts ON ts.IdNhomTaiSan = nts.Id
        WHERE ts.IdCongTy = ?
        GROUP BY ts.IdNhomTaiSan, nts.TenNhom
        """;
        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, idCongTy);
        Map<String, Long> counts = new java.util.HashMap<>();
        for (Map<String, Object> row : results) {
            String id = (String) row.get("idNhomTaiSan");
            Long count = ((Number) row.get("soLuong")).longValue();
            if (id == null || id.isEmpty()) {
                counts.put("UNKNOWN", count);
            } else {
                counts.put(id, count);
            }
        }
        return counts;
    }

    public List<TaiSanDTO> findAllPaged(String idCongTy, int offset, int limit, String sortBy, String sortDir, String idNhomTaiSan, int soNgayThongBaoKiemDinh, String trangThaiKiemDinh) {
        String normalizedSortBy = sortBy != null ? sortBy.trim().toLowerCase() : "ngaycapnhat";
        String orderColumn;
        switch (normalizedSortBy) {
            case "tents":
            case "tentaisan":
                orderColumn = "ts.TenTaiSan";
                break;
            case "sothe":
                orderColumn = "ts.SoThe";
                break;
            case "ngaysudung":
                orderColumn = "ts.NgaySuDung";
                break;
            case "nguyengia":
                orderColumn = "ts.NguyenGia";
                break;
            case "ngaytao":
                orderColumn = "ts.NgayTao";
                break;
            case "ngaycapnhat":
            default:
                orderColumn = "ts.NgayCapNhat";
                break;
        }
        String direction = (sortDir != null && sortDir.equalsIgnoreCase("asc")) ? "ASC" : "DESC";

        String whereClause = "WHERE ts.IdCongTy = ?";
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause += " AND ts.IdNhomTaiSan = ?";
        }
         String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
        // Filter theo trạng thái kiểm định
       // Lọc theo trạng thái kiểm định (thay vì Boolean, dùng String)
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'DA_DANG_KIEM'";
                    break;
                case "SAP_DEN_HAN":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'SAP_DEN_HAN'";
                    break;
                case "QUA_HAN":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'QUA_HAN'";
                    break;
            }
        }
        String sql = String.format("""
                SELECT 
                    ts.Id,
                    ts.TenTaiSan,
                    ts.NguyenGia,
                    ts.GiaTriKhauHaoBanDau,
                    ts.KyKhauHaoBanDau,
                    ts.GiaTriThanhLy,
                    ts.IdMoHinhTaiSan,
                    mhts.TenMoHinh,
                    ts.IdNhomTaiSan,
                    nts.TenNhom,
                    ts.IdDuDan as idDuAn,
                    da.TenDuAn,
                    ts.IdNguonVon,
                    nv.TenNguonKinhPhi,
                    ts.PhuongPhapKhauHao,
                    ts.SoKyKhauHao,
                    ts.TaiKhoanTaiSan,
                    ts.TaiKhoanKhauHao,
                    ts.TaiKhoanChiPhi,
                    ts.NgayVaoSo,
                    ts.NgaySuDung,
                    ts.KyHieu,
                    ts.SoKyHieu,
                    ts.CongSuat,
                    ts.NuocSanXuat,
                    ts.NamSanXuat,
                    ts.LyDoTang,
                    ts.HienTrang,
                    ts.SoLuong,
                    ts.DonViTinh,
                    ts.GhiChu,
                    ts.IdDonViBanDau,
                    ts.IdDonViHienThoi,
                    ts.MoTa,
                    ts.IdCongTy,
                    ts.NgayTao,
                    ts.NgayCapNhat,
                    ts.NguoiTao,
                    ts.NguoiCapNhat,
                    ts.IsActive,
                    ts.IsHeThong,
                    ts.IdLoaiTaiSanCon,
                    ts.IdTaiSanCha,
                    lts.TenLoai,
                    ts.SoThe,
                    ts.nvNS,
                    ts.vonVay,
                    ts.vonKhac,
                    ts.tgKiemDinh,
                    ts.chuKyKiemDinh,
                    ts.IdDonViQuanlyKiThuat,
                    %s AS trangThaiKiemDinh,
                    pb1.TenPhongBan AS tenDonViBanDau,
                    pb2.TenPhongBan AS tenDonViHienThoi,
                    pb3.TenPhongBan AS tenDonViQuanlyKiThuat,
                    dvt.TenDonVi AS tenDonViTinh,
                    ht.TenHTKT,
                    llt.MaLyLich as maLyLich,
                    ts.TrangThaiSuaChua
                FROM 
                    TaiSan AS ts
                LEFT JOIN MoHinhTaiSan AS mhts ON ts.IdMoHinhTaiSan = mhts.Id
                LEFT JOIN NhomTaiSan AS nts ON ts.IdNhomTaiSan = nts.Id
                LEFT JOIN lylich AS ll ON nts.IdLyLich = ll.Id
                LEFT JOIN lylich_template AS llt ON ll.IdLyLichTemplate = llt.Id
                LEFT JOIN LoaiTaiSanCon AS lts ON Ts.idLoaiTaiSanCon = lts.Id
                LEFT JOIN DuAn AS da ON ts.IdDuDan = da.Id
                LEFT JOIN NguonVon AS nv ON ts.IdNguonVon = nv.Id
                LEFT JOIN PhongBan AS pb1 ON ts.IdDonViBanDau = pb1.Id
                LEFT JOIN PhongBan AS pb2 ON ts.IdDonViHienThoi = pb2.Id
                LEFT JOIN PhongBan AS pb3 ON ts.IdDonViQuanlyKiThuat = pb3.Id
                LEFT JOIN DonViTinh AS dvt ON ts.DonViTinh = dvt.Id
                LEFT JOIN HienTrangKyThuat AS ht ON ts.HienTrang = ht.Id
                %s
                ORDER BY %s %s
                LIMIT ? OFFSET ?
                """, inspectionStatusSql, whereClause, orderColumn, direction);
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanDTO.class), idCongTy, idNhomTaiSan, limit, offset);
        } else {
            return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanDTO.class), idCongTy, limit, offset);
        }
    }

    public List<TaiSanDTO> findByDonViBanDauPaged(
        String idCongTy, 
        String idDonViBanDau, // Có thể null
        int offset, 
        int limit, 
        String sortBy, 
        String sortDir, 
        String idNhomTaiSan,
        String search,
        int soNgayThongBaoKiemDinh, 
        String trangThaiKiemDinh,
        Boolean isPhatSinh,
        Integer trangThaiSuaChua) {
        
        String normalizedSortBy = sortBy != null ? sortBy.trim().toLowerCase() : "ngaycapnhat";
        String orderColumn;
        switch (normalizedSortBy) {
            case "tents":
            case "tentaisan":
                orderColumn = "ts.TenTaiSan";
                break;
            case "sothe":
                orderColumn = "ts.SoThe";
                break;
            case "ngaysudung":
                orderColumn = "ts.NgaySuDung";
                break;
            case "nguyengia":
                orderColumn = "ts.NguyenGia";
                break;
            case "ngaytao":
                orderColumn = "ts.NgayTao";
                break;
            case "ngaycapnhat":
            default:
                orderColumn = "ts.NgayCapNhat";
                break;
        }
        String direction = (sortDir != null && sortDir.equalsIgnoreCase("asc")) ? "ASC" : "DESC";
        
        String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);

        // Xây dựng whereClause linh hoạt
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();
        
        whereClause.append("WHERE ts.IdCongTy = ?");
        params.add(idCongTy);
        
        // Xử lý filter theo idDonViBanDau
        if (idDonViBanDau != null && !idDonViBanDau.trim().isEmpty()) {
            // Nếu có idDonViBanDau, filter theo nó
            whereClause.append(" AND ts.IdDonViBanDau = ?");
            params.add(idDonViBanDau);
        } else {
            // Nếu không có, lấy tất cả phòng ban có loaiKho = 1 hoặc rỗng
            whereClause.append(" AND (ts.IdDonViBanDau IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND LoaiKho = 1 AND IsKho = 1) OR ts.IdDonViBanDau IS NULL OR ts.IdDonViBanDau = '')");
            params.add(idCongTy);
        }
        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?) ");
            String searchPattern = "%" + search + "%";
            for (int i = 0; i < 9; i++) {
                params.add(searchPattern);
            }
        }
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause.append(" AND ts.IdNhomTaiSan = ?");
            params.add(idNhomTaiSan);
        }
        if (isPhatSinh != null) {
            whereClause.append(" AND ts.IsTaiSanPhatSinh = ?");
            params.add(isPhatSinh ? 1 : 0);
        }
        if (trangThaiSuaChua != null) {
            whereClause.append(" AND ts.TrangThaiSuaChua = ?");
            params.add(trangThaiSuaChua);
        }
        
        // Điều kiện: idDonViHienThoi rỗng hoặc null
        whereClause.append(" AND (ts.IdDonViHienThoi IS NULL OR ts.IdDonViHienThoi = '')");
        
        // Filter theo trạng thái kiểm định
        // Lọc theo trạng thái kiểm định (thay vì Boolean, dùng String)
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'DA_DANG_KIEM'");
                    break;
                case "SAP_DEN_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'SAP_DEN_HAN'");
                    break;
                case "QUA_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'QUA_HAN'");
                    break;
            }
        }
        
        String sql = String.format("""
                SELECT 
                    ts.Id,
                    ts.TenTaiSan,
                    ts.NguyenGia,
                    ts.GiaTriKhauHaoBanDau,
                    ts.KyKhauHaoBanDau,
                    ts.GiaTriThanhLy,
                    ts.IdMoHinhTaiSan,
                    mhts.TenMoHinh,
                    ts.IdNhomTaiSan,
                    nts.TenNhom,
                    ts.IdDuDan as idDuAn,
                    da.TenDuAn,
                    ts.IdNguonVon,
                    nv.TenNguonKinhPhi,
                    ts.PhuongPhapKhauHao,
                    ts.SoKyKhauHao,
                    ts.TaiKhoanTaiSan,
                    ts.TaiKhoanKhauHao,
                    ts.TaiKhoanChiPhi,
                    ts.NgayVaoSo,
                    ts.NgaySuDung,
                    ts.KyHieu,
                    ts.SoKyHieu,
                    ts.CongSuat,
                    ts.NuocSanXuat,
                    ts.NamSanXuat,
                    ts.LyDoTang,
                    ts.HienTrang,
                    ts.SoLuong,
                    ts.DonViTinh,
                    ts.GhiChu,
                    ts.IdDonViBanDau,
                    ts.IdDonViHienThoi,
                    ts.MoTa,
                    ts.IdCongTy,
                    ts.NgayTao,
                    ts.NgayCapNhat,
                    ts.NguoiTao,
                    ts.NguoiCapNhat,
                    ts.IsActive,
                    ts.IsHeThong,
                    ts.IsTaiSanCon,
                    ts.IdLoaiTaiSanCon,
                    ts.IdTaiSanCha,
                    lts.TenLoai,
                    ts.SoThe,
                    ts.nvNS,
                    ts.vonVay,
                    ts.vonKhac,
                    ts.tgKiemDinh,
                    ts.chuKyKiemDinh,
                    ts.IdDonViQuanlyKiThuat,
                    %s AS trangThaiKiemDinh,
                    ht.TenHTKT AS tenHienTrang,
                    pb1.TenPhongBan AS tenDonViBanDau,
                    pb2.TenPhongBan AS tenDonViHienThoi,
                    pb3.TenPhongBan AS tenDonViQuanlyKiThuat,
                    dvt.TenDonVi AS tenDonViTinh,
                    llt.MaLyLich as maLyLich,
                    ts.TrangThaiSuaChua,
                    (CASE WHEN EXISTS (
                        SELECT 1 FROM TaiSanCon tsc2 
                        WHERE tsc2.IdTaiSanCha = ts.Id AND tsc2.IsActive = 0
                    ) THEN 1 ELSE 0 END) AS coTaiSanConDaDieuChuyen
                FROM 
                    TaiSan AS ts
                LEFT JOIN MoHinhTaiSan AS mhts ON ts.IdMoHinhTaiSan = mhts.Id
                LEFT JOIN NhomTaiSan AS nts ON ts.IdNhomTaiSan = nts.Id
                LEFT JOIN lylich AS ll ON nts.IdLyLich = ll.Id
                LEFT JOIN lylich_template AS llt ON ll.IdLyLichTemplate = llt.Id
                LEFT JOIN LoaiTaiSanCon AS lts ON Ts.idLoaiTaiSanCon = lts.Id
                LEFT JOIN DuAn AS da ON ts.IdDuDan = da.Id
                LEFT JOIN NguonVon AS nv ON ts.IdNguonVon = nv.Id
                LEFT JOIN PhongBan AS pb1 ON ts.IdDonViBanDau = pb1.Id
                LEFT JOIN PhongBan AS pb2 ON ts.IdDonViHienThoi = pb2.Id
                LEFT JOIN PhongBan AS pb3 ON ts.IdDonViQuanlyKiThuat = pb3.Id
                LEFT JOIN DonViTinh AS dvt ON ts.DonViTinh = dvt.Id
                LEFT JOIN HienTrangKyThuat AS ht ON ts.HienTrang = ht.Id
                %s
                ORDER BY %s %s
                LIMIT ? OFFSET ?
                """, inspectionStatusSql, whereClause.toString(), orderColumn, direction);
        
        // Thêm limit và offset vào params
        params.add(limit);
        params.add(offset);
        
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanDTO.class), params.toArray());
    }

    public List<TaiSanDTO> findByDonViThuHoiPaged(
        String idCongTy, 
        String idDonViThuHoi, // Có thể null
        int offset, 
        int limit, 
        String sortBy, 
        String sortDir, 
        String idNhomTaiSan,
        String search,
        int soNgayThongBaoKiemDinh, 
        String trangThaiKiemDinh,
        Boolean isPhatSinh,
        Integer trangThaiSuaChua) {
    
        String normalizedSortBy = sortBy != null ? sortBy.trim().toLowerCase() : "ngaycapnhat";
        String orderColumn;
        switch (normalizedSortBy) {
            case "tents":
            case "tentaisan":
                orderColumn = "ts.TenTaiSan";
                break;
            case "sothe":
                orderColumn = "ts.SoThe";
                break;
            case "ngaysudung":
                orderColumn = "ts.NgaySuDung";
                break;
            case "nguyengia":
                orderColumn = "ts.NguyenGia";
                break;
            case "ngaytao":
                orderColumn = "ts.NgayTao";
                break;
            case "ngaycapnhat":
            default:
                orderColumn = "ts.NgayCapNhat";
                break;
        }
        String direction = (sortDir != null && sortDir.equalsIgnoreCase("asc")) ? "ASC" : "DESC";
        
        String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);

        // Xây dựng whereClause
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();
        
        whereClause.append("WHERE ts.IdCongTy = ?");
        params.add(idCongTy);
        
        // Xử lý filter theo idDonViThuHoi (đây là đơn vị hiện thời)
        if (idDonViThuHoi != null && !idDonViThuHoi.trim().isEmpty()) {
            // Nếu có idDonViThuHoi, filter theo nó
            whereClause.append(" AND ts.IdDonViHienThoi = ?");
            params.add(idDonViThuHoi);
        } else {
            // Nếu không có, lấy tất cả phòng ban có loaiKho = 2 (kho thu hồi)
            whereClause.append(" AND ts.IdDonViHienThoi IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND LoaiKho = 2 AND IsKho = 1)");
            params.add(idCongTy);
        }
        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?) ");
            String searchPattern = "%" + search + "%";
            for (int i = 0; i < 9; i++) {
                params.add(searchPattern);
            }
        }
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause.append(" AND ts.IdNhomTaiSan = ?");
            params.add(idNhomTaiSan);
        }

        if (isPhatSinh != null) {
            whereClause.append(" AND ts.IsTaiSanPhatSinh = ?");
            params.add(isPhatSinh ? 1 : 0);
        }

        if (trangThaiSuaChua != null) {
            whereClause.append(" AND ts.TrangThaiSuaChua = ?");
            params.add(trangThaiSuaChua);
        }
        
        // Filter theo trạng thái kiểm định
        // Lọc theo trạng thái kiểm định (thay vì Boolean, dùng String)
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'DA_DANG_KIEM'");
                    break;
                case "SAP_DEN_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'SAP_DEN_HAN'");
                    break;
                case "QUA_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'QUA_HAN'");
                    break;
            }
        }
        
        String sql = String.format("""
                SELECT 
                    ts.Id,
                    ts.TenTaiSan,
                    ts.NguyenGia,
                    ts.GiaTriKhauHaoBanDau,
                    ts.KyKhauHaoBanDau,
                    ts.GiaTriThanhLy,
                    ts.IdMoHinhTaiSan,
                    mhts.TenMoHinh,
                    ts.IdNhomTaiSan,
                    nts.TenNhom,
                    ts.IdDuDan as idDuAn,
                    da.TenDuAn,
                    ts.IdNguonVon,
                    nv.TenNguonKinhPhi,
                    ts.PhuongPhapKhauHao,
                    ts.SoKyKhauHao,
                    ts.TaiKhoanTaiSan,
                    ts.TaiKhoanKhauHao,
                    ts.TaiKhoanChiPhi,
                    ts.NgayVaoSo,
                    ts.NgaySuDung,
                    ts.KyHieu,
                    ts.SoKyHieu,
                    ts.CongSuat,
                    ts.NuocSanXuat,
                    ts.NamSanXuat,
                    ts.LyDoTang,
                    ts.HienTrang,
                    ts.SoLuong,
                    ts.DonViTinh,
                    ts.GhiChu,
                    ts.IdDonViBanDau,
                    ts.IdDonViHienThoi,
                    ts.MoTa,
                    ts.IdCongTy,
                    ts.NgayTao,
                    ts.NgayCapNhat,
                    ts.NguoiTao,
                    ts.NguoiCapNhat,
                    ts.IsActive,
                    ts.IsHeThong,
                    ts.IsTaiSanCon,
                    ts.IdLoaiTaiSanCon,
                    ts.IdTaiSanCha,
                    lts.TenLoai,
                    ts.SoThe,
                    ts.nvNS,
                    ts.vonVay,
                    ts.vonKhac,
                    ts.tgKiemDinh,
                    ts.chuKyKiemDinh,
                    ts.IdDonViQuanlyKiThuat,
                    %s AS trangThaiKiemDinh,
                    ht.TenHTKT AS tenHienTrang,
                    pb1.TenPhongBan AS tenDonViBanDau,
                    pb2.TenPhongBan AS tenDonViHienThoi,
                    pb3.TenPhongBan AS tenDonViQuanlyKiThuat,
                    dvt.TenDonVi AS tenDonViTinh,
                    llt.MaLyLich as maLyLich,
                    ts.TrangThaiSuaChua
                FROM 
                    TaiSan AS ts
                LEFT JOIN MoHinhTaiSan AS mhts ON ts.IdMoHinhTaiSan = mhts.Id
                LEFT JOIN NhomTaiSan AS nts ON ts.IdNhomTaiSan = nts.Id
                LEFT JOIN lylich AS ll ON nts.IdLyLich = ll.Id
                LEFT JOIN lylich_template AS llt ON ll.IdLyLichTemplate = llt.Id
                LEFT JOIN LoaiTaiSanCon AS lts ON Ts.idLoaiTaiSanCon = lts.Id
                LEFT JOIN DuAn AS da ON ts.IdDuDan = da.Id
                LEFT JOIN NguonVon AS nv ON ts.IdNguonVon = nv.Id
                LEFT JOIN PhongBan AS pb1 ON ts.IdDonViBanDau = pb1.Id
                LEFT JOIN PhongBan AS pb2 ON ts.IdDonViHienThoi = pb2.Id
                LEFT JOIN PhongBan AS pb3 ON ts.IdDonViQuanlyKiThuat = pb3.Id
                LEFT JOIN DonViTinh AS dvt ON ts.DonViTinh = dvt.Id
                LEFT JOIN HienTrangKyThuat AS ht ON ts.HienTrang = ht.Id
                %s
                ORDER BY %s %s
                LIMIT ? OFFSET ?
                """, inspectionStatusSql, whereClause.toString(), orderColumn, direction);
        
        params.add(limit);
        params.add(offset);
        
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanDTO.class), params.toArray());
    }

    public List<TaiSanDTO> findByDonViHienThoiPaged(String idCongTy, String idDonViHienThoi, int offset, int limit, String sortBy, String sortDir, String idNhomTaiSan, String search, int soNgayThongBaoKiemDinh, String trangThaiKiemDinh) {
        String normalizedSortBy = sortBy != null ? sortBy.trim().toLowerCase() : "ngaycapnhat";
        String orderColumn;
        switch (normalizedSortBy) {
            case "tents":
            case "tentaisan":
                orderColumn = "ts.TenTaiSan";
                break;
            case "sothe":
                orderColumn = "ts.SoThe";
                break;
            case "ngaysudung":
                orderColumn = "ts.NgaySuDung";
                break;
            case "nguyengia":
                orderColumn = "ts.NguyenGia";
                break;
            case "ngaytao":
                orderColumn = "ts.NgayTao";
                break;
            case "ngaycapnhat":
            default:
                orderColumn = "ts.NgayCapNhat";
                break;
        }
        String direction = "ASC".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";
        String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);

        // Xây dựng whereClause linh hoạt
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();
        
        whereClause.append("WHERE ts.IdCongTy = ? AND ts.IdDonViHienThoi = ?");
        params.add(idCongTy);
        params.add(idDonViHienThoi);

        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?) ");
            String searchPattern = "%" + search + "%";
            for (int i = 0; i < 9; i++) {
                params.add(searchPattern);
            }
        }

        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause.append(" AND ts.IdNhomTaiSan = ?");
            params.add(idNhomTaiSan);
        }
        
        // Filter theo trạng thái kiểm định
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'DA_DANG_KIEM'");
                    break;
                case "SAP_DEN_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'SAP_DEN_HAN'");
                    break;
                case "QUA_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'QUA_HAN'");
                    break;
                case "CHUA_DANG_KIEM":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'CHUA_DANG_KIEM'");
                    break;
            }
        }
        String sql = String.format("""
                    SELECT
                        ts.Id,
                        ts.TenTaiSan,
                        ts.NguyenGia,
                        ts.GiaTriKhauHaoBanDau,
                        ts.KyKhauHaoBanDau,
                        ts.GiaTriThanhLy,
                        ts.IdMoHinhTaiSan,
                        mhts.TenMoHinh,
                        ts.IdNhomTaiSan,
                        nts.TenNhom,
                        ts.IdDuDan as idDuAn,
                        da.TenDuAn,
                        ts.IdNguonVon,
                        nv.TenNguonKinhPhi,
                        ts.PhuongPhapKhauHao,
                        ts.SoKyKhauHao,
                        ts.TaiKhoanTaiSan,
                        ts.TaiKhoanKhauHao,
                        ts.TaiKhoanChiPhi,
                        ts.NgayVaoSo,
                        ts.NgaySuDung,
                        ts.KyHieu,
                        ts.SoKyHieu,
                        ts.CongSuat,
                        ts.NuocSanXuat,
                        ts.NamSanXuat,
                        ts.LyDoTang,
                        ts.HienTrang,
                        ts.SoLuong,
                        ts.DonViTinh,
                        ts.GhiChu,
                        ts.IdDonViBanDau,
                        ts.IdDonViHienThoi,
                        ts.MoTa,
                        ts.IdCongTy,
                        ts.NgayTao,
                        ts.NgayCapNhat,
                        ts.NguoiTao,
                        ts.NguoiCapNhat,
                        ts.IsActive,
                        ts.IsHeThong,
                        ts.IsTaiSanCon,
                        ts.IdLoaiTaiSanCon,
                    ts.IdTaiSanCha,
                        lts.TenLoai,
                        ts.SoThe,
                        ts.nvNS,
                        ts.vonVay,
                        ts.vonKhac,
                        ts.tgKiemDinh,
                        ts.chuKyKiemDinh,
                        ts.IdDonViQuanlyKiThuat,
                        %s AS trangThaiKiemDinh,
                        pb1.TenPhongBan AS tenDonViBanDau,
                        pb2.TenPhongBan AS tenDonViHienThoi,
                        pb3.TenPhongBan AS tenDonViQuanlyKiThuat,
                        dvt.TenDonVi AS tenDonViTinh,
                        ht.TenHTKT AS tenHienTrang,
                        llt.MaLyLich as maLyLich,
                        ts.TrangThaiSuaChua
                    FROM TaiSan ts
                    LEFT JOIN MoHinhTaiSan mhts ON ts.IdMoHinhTaiSan = mhts.Id
                    LEFT JOIN NhomTaiSan nts ON ts.IdNhomTaiSan = nts.Id
                    LEFT JOIN lylich AS ll ON nts.IdLyLich = ll.Id
                    LEFT JOIN lylich_template AS llt ON ll.IdLyLichTemplate = llt.Id
                    LEFT JOIN LoaiTaiSanCon AS lts ON Ts.idLoaiTaiSanCon = lts.Id
                    LEFT JOIN DuAn da ON ts.IdDuDan = da.Id
                    LEFT JOIN NguonVon nv ON ts.IdNguonVon = nv.Id
                    LEFT JOIN PhongBan pb1 ON ts.IdDonViBanDau = pb1.Id
                    LEFT JOIN PhongBan pb2 ON ts.IdDonViHienThoi = pb2.Id
                    LEFT JOIN PhongBan pb3 ON ts.IdDonViQuanlyKiThuat = pb3.Id
                    LEFT JOIN DonViTinh dvt ON ts.DonViTinh = dvt.Id
                    LEFT JOIN HienTrangKyThuat AS ht ON ts.HienTrang = ht.Id
                    %s
                    ORDER BY %s %s
                    LIMIT ? OFFSET ?
                """, inspectionStatusSql, whereClause.toString(), orderColumn, direction);
        
        // Thêm limit và offset vào params
        params.add(limit);
        params.add(offset);
        
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanDTO.class), params.toArray());
    }

    public List<TaiSanDTO> findByIdLoaiTS(String idLoaiTS) {
        String sql = SELECT_TAISAN_DTO + " WHERE ts.IdLoaiTaiSanCon = ?";
        List<TaiSanDTO> taiSanDTOList = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanDTO.class), idLoaiTS);
        for (TaiSanDTO dto : taiSanDTOList) {
            List<NguonKinhPhi> nguonKinhPhiList = setNguonKinhPhiDao.getNguonKinhPhiByTaiSan(dto.getSoThe());
            dto.setNguonKinhPhiList(nguonKinhPhiList);
        }
        return taiSanDTOList;
    }

    public TaiSanDTO findById(String id) {
        return findById(id, null, null);
    }

    public TaiSanDTO findById(String id, String dateFrom, String dateTo) {
        String gioHoatDongSubquery = "";
        Object[] params;
        if (dateFrom != null && !dateFrom.isEmpty() && dateTo != null && !dateTo.isEmpty()) {
            gioHoatDongSubquery = " (SELECT SUM(IFNULL(ctlt.Ca1, 0) + IFNULL(ctlt.Ca2, 0) + IFNULL(ctlt.Ca3, 0)) " +
                                  " FROM lichtrinh lt " +
                                  " JOIN chitietlichtrinh ctlt ON lt.Id = ctlt.IdLichTrinh " +
                                  " WHERE lt.IdTaiSan = ts.Id " +
                                  " AND STR_TO_DATE(CONCAT(lt.Nam, '-', lt.Thang, '-', ctlt.Ngay), '%Y-%c-%e') >= STR_TO_DATE(?, '%Y-%m-%d') " +
                                  " AND STR_TO_DATE(CONCAT(lt.Nam, '-', lt.Thang, '-', ctlt.Ngay), '%Y-%c-%e') <= STR_TO_DATE(?, '%Y-%m-%d')) AS gioHoatDong, ";
            params = new Object[]{dateFrom, dateTo, id};
        } else {
            params = new Object[]{id};
        }

        String sql = SELECT_TAISAN_DTO.replaceFirst("SELECT", "SELECT " + gioHoatDongSubquery) + " WHERE ts.Id = ?";
        
        try {
            return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(TaiSanDTO.class), params);
        } catch (Exception e) {
            return null;
        }
    }

    public int insert(TaiSan taiSan) {
        System.out.println(taiSan.toString());
        if (taiSan.getId() == null || taiSan.getId().trim().isEmpty()) {
            throw new IllegalArgumentException("Id không được null hoặc rỗng");
        }
        String checkSql = "SELECT COUNT(*) FROM TaiSan WHERE Id = ?";
        Long result = jdbcTemplate.queryForObject(checkSql, Long.class, taiSan.getId());
        int count = result != null ? result.intValue() : 0;
        if (count > 0) {
            return update(taiSan);
        } else {
            String sql = "INSERT INTO TaiSan (Id, IdLoaiTaiSan, TenTaiSan, NguyenGia, GiaTriKhauHaoBanDau, KyKhauHaoBanDau, " +
                    "GiaTriThanhLy, IdMoHinhTaiSan, PhuongPhapKhauHao, SoKyKhauHao, TaiKhoanTaiSan, TaiKhoanKhauHao, TaiKhoanChiPhi, " +
                    "IdNhomTaiSan, NgayVaoSo, NgaySuDung, IdDuDan, IdNguonVon, KyHieu, SoKyHieu, CongSuat, NuocSanXuat, NamSanXuat, " +
                    "LyDoTang, HienTrang, SoLuong, DonViTinh, GhiChu, IdDonViBanDau, IdDonViHienThoi, IdDonViQuanlyKiThuat, MoTa, IdCongTy, NgayTao, " +
                    "NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive, IsTaiSanCon, IsHeThong, IdLoaiTaiSanCon, SoThe, nvNS, vonVay, vonKhac, tgKiemDinh, chuKyKiemDinh, IdTaiSanCha, TrangThaiSuaChua) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)";
            return jdbcTemplate.update(sql,
                    taiSan.getId(), taiSan.getIdLoaiTaiSan(), taiSan.getTenTaiSan(), taiSan.getNguyenGia(),
                    taiSan.getGiaTriKhauHaoBanDau(), taiSan.getKyKhauHaoBanDau(), taiSan.getGiaTriThanhLy(),
                    taiSan.getIdMoHinhTaiSan(), taiSan.getPhuongPhapKhauHao(), taiSan.getSoKyKhauHao(),
                    taiSan.getTaiKhoanTaiSan(), taiSan.getTaiKhoanKhauHao(), taiSan.getTaiKhoanChiPhi(),
                    taiSan.getIdNhomTaiSan(), taiSan.getNgayVaoSo(), taiSan.getNgaySuDung(), taiSan.getIdDuDan(),
                    taiSan.getIdNguonVon(), taiSan.getKyHieu(), taiSan.getSoKyHieu(), taiSan.getCongSuat(),
                    taiSan.getNuocSanXuat(), taiSan.getNamSanXuat(), taiSan.getLyDoTang(), taiSan.getHienTrang(),
                    taiSan.getSoLuong(), taiSan.getDonViTinh(), taiSan.getGhiChu(), taiSan.getIdDonViBanDau(),
                    taiSan.getIdDonViHienThoi(), taiSan.getIdDonViQuanlyKiThuat(), taiSan.getMoTa(), taiSan.getIdCongTy(), taiSan.getNgayTao(),
                    taiSan.getNgayCapNhat(), taiSan.getNguoiTao(), taiSan.getNguoiCapNhat(), taiSan.getIsActive(),
                    taiSan.getIsTaiSanCon(), taiSan.getIsHeThong(), taiSan.getIdLoaiTaiSanCon(), taiSan.getSoThe(), taiSan.getNvNS(),
                    taiSan.getVonVay(), taiSan.getVonKhac(), taiSan.getTgKiemDinh(), taiSan.getChuKyKiemDinh(), taiSan.getIdTaiSanCha(), taiSan.getTrangThaiSuaChua());
        }
    }

    public int update(TaiSan taiSan) {
        String sql = """
                    UPDATE TaiSan SET
                        IdLoaiTaiSan=?, TenTaiSan=?, NguyenGia=?, GiaTriKhauHaoBanDau=?, KyKhauHaoBanDau=?,
                        GiaTriThanhLy=?, IdMoHinhTaiSan=?, PhuongPhapKhauHao=?, SoKyKhauHao=?,
                        TaiKhoanTaiSan=?, TaiKhoanKhauHao=?, TaiKhoanChiPhi=?, IdNhomTaiSan=?,
                        NgayVaoSo=?, NgaySuDung=?, IdDuDan=?, IdNguonVon=?, KyHieu=?, SoKyHieu=?,
                        CongSuat=?, NuocSanXuat=?, NamSanXuat=?, LyDoTang=?, HienTrang=?, SoLuong=?,
                        DonViTinh=?, GhiChu=?, IdDonViBanDau=?, IdDonViHienThoi=?, IdDonViQuanlyKiThuat=?, MoTa=?, IdCongTy=?,
                        NgayCapNhat=?, NguoiTao=?, NguoiCapNhat=?, IsActive=?, IsTaiSanCon=?, IsHeThong=?, IdLoaiTaiSanCon=?,
                        SoThe=?, nvNS=?, vonVay=?, vonKhac=?, tgKiemDinh=?, chuKyKiemDinh=?, IdTaiSanCha=?, TrangThaiSuaChua=?
                    WHERE Id=?
                """;
        return jdbcTemplate.update(sql,
                taiSan.getIdLoaiTaiSan(), taiSan.getTenTaiSan(), taiSan.getNguyenGia(),
                taiSan.getGiaTriKhauHaoBanDau(), taiSan.getKyKhauHaoBanDau(), taiSan.getGiaTriThanhLy(),
                taiSan.getIdMoHinhTaiSan(), taiSan.getPhuongPhapKhauHao(), taiSan.getSoKyKhauHao(),
                taiSan.getTaiKhoanTaiSan(), taiSan.getTaiKhoanKhauHao(), taiSan.getTaiKhoanChiPhi(),
                taiSan.getIdNhomTaiSan(), taiSan.getNgayVaoSo(), taiSan.getNgaySuDung(), taiSan.getIdDuDan(),
                taiSan.getIdNguonVon(), taiSan.getKyHieu(), taiSan.getSoKyHieu(), taiSan.getCongSuat(),
                taiSan.getNuocSanXuat(), taiSan.getNamSanXuat(), taiSan.getLyDoTang(), taiSan.getHienTrang(),
                taiSan.getSoLuong(), taiSan.getDonViTinh(), taiSan.getGhiChu(), taiSan.getIdDonViBanDau(),
                taiSan.getIdDonViHienThoi(), taiSan.getIdDonViQuanlyKiThuat(), taiSan.getMoTa(), taiSan.getIdCongTy(), taiSan.getNgayCapNhat(),
                taiSan.getNguoiTao(), taiSan.getNguoiCapNhat(),
                taiSan.getIsActive() != null ? (taiSan.getIsActive() ? 1 : 0) : 1,
                taiSan.getIsTaiSanCon(), taiSan.getIsHeThong(), taiSan.getIdLoaiTaiSanCon(), taiSan.getSoThe(), taiSan.getNvNS(),
                taiSan.getVonVay(), taiSan.getVonKhac(), taiSan.getTgKiemDinh(), taiSan.getChuKyKiemDinh(),
                taiSan.getIdTaiSanCha(), taiSan.getTrangThaiSuaChua(),
                taiSan.getId());
    }

    public int updateTaiSanConTaiSan(Map<String, Object> params) {
        String id = (String) params.get("id");
        boolean isTaiSanCon = (Boolean) params.get("isTaiSanCon");
        String sql = "UPDATE TaiSan SET IsTaiSanCon = ? WHERE Id = ?";
        return jdbcTemplate.update(sql, isTaiSanCon ? 1 : 0, id);
    }

    public int batchInsert(List<TaiSan> list) {
        String sql = "INSERT INTO TaiSan (Id, IdLoaiTaiSan, TenTaiSan, NguyenGia, GiaTriKhauHaoBanDau, KyKhauHaoBanDau, " +
                "GiaTriThanhLy, IdMoHinhTaiSan, PhuongPhapKhauHao, SoKyKhauHao, TaiKhoanTaiSan, TaiKhoanKhauHao, TaiKhoanChiPhi, " +
                "IdNhomTaiSan, NgayVaoSo, NgaySuDung, IdDuDan, IdNguonVon, KyHieu, SoKyHieu, CongSuat, NuocSanXuat, NamSanXuat, " +
                "LyDoTang, HienTrang, SoLuong, DonViTinh, GhiChu, IdDonViBanDau, IdDonViHienThoi, IdDonViQuanlyKiThuat, MoTa, IdCongTy, NgayTao, " +
                "NgayCapNhat, NguoiTao, NguoiCapNhat, IsActive, IsTaiSanCon, IsHeThong, IdLoaiTaiSanCon, SoThe, nvNS, vonVay, vonKhac, tgKiemDinh, chuKyKiemDinh, IdTaiSanCha, TrangThaiSuaChua) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        int[] result = jdbcTemplate.batchUpdate(sql, new org.springframework.jdbc.core.BatchPreparedStatementSetter() {
            @Override
            public void setValues(java.sql.PreparedStatement ps, int i) throws java.sql.SQLException {
                TaiSan ts = list.get(i);
                ps.setString(1, ts.getId());
                ps.setString(2, ts.getIdLoaiTaiSan());
                ps.setString(3, ts.getTenTaiSan());

                // Double
                if (ts.getNguyenGia() != null) ps.setDouble(4, ts.getNguyenGia()); else ps.setNull(4, java.sql.Types.DOUBLE);
                if (ts.getGiaTriKhauHaoBanDau() != null) ps.setDouble(5, ts.getGiaTriKhauHaoBanDau()); else ps.setNull(5, java.sql.Types.DOUBLE);

                // Integer
                if (ts.getKyKhauHaoBanDau() != null) ps.setInt(6, ts.getKyKhauHaoBanDau()); else ps.setNull(6, java.sql.Types.INTEGER);

                // Double
                if (ts.getGiaTriThanhLy() != null) ps.setDouble(7, ts.getGiaTriThanhLy()); else ps.setNull(7, java.sql.Types.DOUBLE);

                ps.setString(8, ts.getIdMoHinhTaiSan());

                // Integer
                if (ts.getPhuongPhapKhauHao() != null) ps.setInt(9, ts.getPhuongPhapKhauHao()); else ps.setNull(9, java.sql.Types.INTEGER);

                // Integer
                if (ts.getSoKyKhauHao() != null) ps.setInt(10, ts.getSoKyKhauHao()); else ps.setNull(10, java.sql.Types.INTEGER);

                // Integer
                if (ts.getTaiKhoanTaiSan() != null) ps.setInt(11, ts.getTaiKhoanTaiSan()); else ps.setNull(11, java.sql.Types.INTEGER);
                if (ts.getTaiKhoanKhauHao() != null) ps.setInt(12, ts.getTaiKhoanKhauHao()); else ps.setNull(12, java.sql.Types.INTEGER);
                if (ts.getTaiKhoanChiPhi() != null) ps.setInt(13, ts.getTaiKhoanChiPhi()); else ps.setNull(13, java.sql.Types.INTEGER);

                ps.setString(14, ts.getIdNhomTaiSan());
                ps.setString(15, ts.getNgayVaoSo());
                ps.setString(16, ts.getNgaySuDung());
                ps.setString(17, ts.getIdDuDan());
                ps.setString(18, ts.getIdNguonVon());
                ps.setString(19, ts.getKyHieu());
                ps.setString(20, ts.getSoKyHieu());
                ps.setString(21, ts.getCongSuat());
                ps.setString(22, ts.getNuocSanXuat());

                // Integer
                if (ts.getNamSanXuat() != null) ps.setInt(23, ts.getNamSanXuat()); else ps.setNull(23, java.sql.Types.INTEGER);

                ps.setString(24, ts.getLyDoTang());

                // Integer
                if (ts.getHienTrang() != null) ps.setString(25, ts.getHienTrang()); else ps.setNull(25, java.sql.Types.VARCHAR);
                if (ts.getSoLuong() != null) ps.setInt(26, ts.getSoLuong()); else ps.setNull(26, java.sql.Types.INTEGER);

                ps.setString(27, ts.getDonViTinh());
                ps.setString(28, ts.getGhiChu());
                ps.setString(29, ts.getIdDonViBanDau());
                ps.setString(30, ts.getIdDonViHienThoi());
                ps.setString(31, ts.getIdDonViQuanlyKiThuat());
                ps.setString(32, ts.getMoTa());
                ps.setString(33, ts.getIdCongTy());
                ps.setString(34, ts.getNgayTao());
                ps.setString(35, ts.getNgayCapNhat());
                ps.setString(36, ts.getNguoiTao());
                ps.setString(37, ts.getNguoiCapNhat());

                // Boolean handling
                ps.setBoolean(38, ts.getIsActive() != null ? ts.getIsActive() : true);
                ps.setBoolean(39, ts.getIsTaiSanCon() != null ? ts.getIsTaiSanCon() : false);
                ps.setBoolean(40, ts.getIsHeThong() != null ? ts.getIsHeThong() : false);

                ps.setString(41, ts.getIdLoaiTaiSanCon());
                ps.setString(42, ts.getSoThe());

                // Double
                if (ts.getNvNS() != null) ps.setDouble(43, ts.getNvNS()); else ps.setNull(43, java.sql.Types.DOUBLE);
                if (ts.getVonVay() != null) ps.setDouble(44, ts.getVonVay()); else ps.setNull(44, java.sql.Types.DOUBLE);
                if (ts.getVonKhac() != null) ps.setDouble(45, ts.getVonKhac()); else ps.setNull(45, java.sql.Types.DOUBLE);

                ps.setString(46, ts.getTgKiemDinh());

                // Integer
                if (ts.getChuKyKiemDinh() != null) ps.setInt(47, ts.getChuKyKiemDinh()); else ps.setNull(47, java.sql.Types.INTEGER);
                ps.setString(48, ts.getIdTaiSanCha());
                if (ts.getTrangThaiSuaChua() != null) ps.setInt(49, ts.getTrangThaiSuaChua()); else ps.setNull(49, java.sql.Types.INTEGER);
            }

            @Override
            public int getBatchSize() {
                return list.size();
            }
        });
        return result.length;
    }

    public int batchUpdate(List<TaiSan> list) {
        String sql = """
                    UPDATE TaiSan SET
                        IdLoaiTaiSan=?, TenTaiSan=?, NguyenGia=?, GiaTriKhauHaoBanDau=?, KyKhauHaoBanDau=?,
                        GiaTriThanhLy=?, IdMoHinhTaiSan=?, PhuongPhapKhauHao=?, SoKyKhauHao=?,
                        TaiKhoanTaiSan=?, TaiKhoanKhauHao=?, TaiKhoanChiPhi=?, IdNhomTaiSan=?,
                        NgayVaoSo=?, NgaySuDung=?, IdDuDan=?, IdNguonVon=?, KyHieu=?, SoKyHieu=?,
                        CongSuat=?, NuocSanXuat=?, NamSanXuat=?, LyDoTang=?, HienTrang=?, SoLuong=?,
                        DonViTinh=?, GhiChu=?, IdDonViBanDau=?, IdDonViHienThoi=?, IdDonViQuanlyKiThuat=?, MoTa=?, IdCongTy=?,
                        NgayCapNhat=?, NguoiTao=?, NguoiCapNhat=?, IsActive=?, IsTaiSanCon=?, IsHeThong=?, IdLoaiTaiSanCon=?,
                        SoThe=?, nvNS=?, vonVay=?, vonKhac=?, tgKiemDinh=?, chuKyKiemDinh=?, IdTaiSanCha=?, TrangThaiSuaChua=?
                    WHERE Id=?
                """;
        int[] result = jdbcTemplate.batchUpdate(sql, new org.springframework.jdbc.core.BatchPreparedStatementSetter() {
            @Override
            public void setValues(java.sql.PreparedStatement ps, int i) throws java.sql.SQLException {
                TaiSan ts = list.get(i);
                ps.setString(1, ts.getIdLoaiTaiSan());
                ps.setString(2, ts.getTenTaiSan());

                // Double
                if (ts.getNguyenGia() != null) ps.setDouble(3, ts.getNguyenGia()); else ps.setNull(3, java.sql.Types.DOUBLE);
                if (ts.getGiaTriKhauHaoBanDau() != null) ps.setDouble(4, ts.getGiaTriKhauHaoBanDau()); else ps.setNull(4, java.sql.Types.DOUBLE);

                // Integer
                if (ts.getKyKhauHaoBanDau() != null) ps.setInt(5, ts.getKyKhauHaoBanDau()); else ps.setNull(5, java.sql.Types.INTEGER);

                // Double
                if (ts.getGiaTriThanhLy() != null) ps.setDouble(6, ts.getGiaTriThanhLy()); else ps.setNull(6, java.sql.Types.DOUBLE);

                ps.setString(7, ts.getIdMoHinhTaiSan());

                // Integer
                if (ts.getPhuongPhapKhauHao() != null) ps.setInt(8, ts.getPhuongPhapKhauHao()); else ps.setNull(8, java.sql.Types.INTEGER);

                // Integer
                if (ts.getSoKyKhauHao() != null) ps.setInt(9, ts.getSoKyKhauHao()); else ps.setNull(9, java.sql.Types.INTEGER);

                // Integer
                if (ts.getTaiKhoanTaiSan() != null) ps.setInt(10, ts.getTaiKhoanTaiSan()); else ps.setNull(10, java.sql.Types.INTEGER);
                if (ts.getTaiKhoanKhauHao() != null) ps.setInt(11, ts.getTaiKhoanKhauHao()); else ps.setNull(11, java.sql.Types.INTEGER);
                if (ts.getTaiKhoanChiPhi() != null) ps.setInt(12, ts.getTaiKhoanChiPhi()); else ps.setNull(12, java.sql.Types.INTEGER);

                ps.setString(13, ts.getIdNhomTaiSan());
                ps.setString(14, ts.getNgayVaoSo());
                ps.setString(15, ts.getNgaySuDung());
                ps.setString(16, ts.getIdDuDan());
                ps.setString(17, ts.getIdNguonVon());
                ps.setString(18, ts.getKyHieu());
                ps.setString(19, ts.getSoKyHieu());
                ps.setString(20, ts.getCongSuat());
                ps.setString(21, ts.getNuocSanXuat());

                // Integer
                if (ts.getNamSanXuat() != null) ps.setInt(22, ts.getNamSanXuat()); else ps.setNull(22, java.sql.Types.INTEGER);

                ps.setString(23, ts.getLyDoTang());

                // Integer
                if (ts.getHienTrang() != null) ps.setString(24, ts.getHienTrang()); else ps.setNull(24, java.sql.Types.VARCHAR);
                if (ts.getSoLuong() != null) ps.setInt(25, ts.getSoLuong()); else ps.setNull(25, java.sql.Types.INTEGER);

                ps.setString(26, ts.getDonViTinh());
                ps.setString(27, ts.getGhiChu());
                ps.setString(28, ts.getIdDonViBanDau());
                ps.setString(29, ts.getIdDonViHienThoi());
                ps.setString(30, ts.getIdDonViQuanlyKiThuat());
                ps.setString(31, ts.getMoTa());
                ps.setString(32, ts.getIdCongTy());
                ps.setString(33, ts.getNgayCapNhat());
                ps.setString(34, ts.getNguoiTao());
                ps.setString(35, ts.getNguoiCapNhat());

                // Boolean handling
                ps.setBoolean(36, ts.getIsActive() != null ? ts.getIsActive() : true);
                ps.setBoolean(37, ts.getIsTaiSanCon() != null ? ts.getIsTaiSanCon() : false);
                ps.setBoolean(38, ts.getIsHeThong() != null ? ts.getIsHeThong() : false);

                ps.setString(39, ts.getIdLoaiTaiSanCon());
                ps.setString(40, ts.getSoThe());

                // Double
                if (ts.getNvNS() != null) ps.setDouble(41, ts.getNvNS()); else ps.setNull(41, java.sql.Types.DOUBLE);
                if (ts.getVonVay() != null) ps.setDouble(42, ts.getVonVay()); else ps.setNull(42, java.sql.Types.DOUBLE);
                if (ts.getVonKhac() != null) ps.setDouble(43, ts.getVonKhac()); else ps.setNull(43, java.sql.Types.DOUBLE);

                ps.setString(44, ts.getTgKiemDinh());

                // Integer
                if (ts.getChuKyKiemDinh() != null) ps.setInt(45, ts.getChuKyKiemDinh()); else ps.setNull(45, java.sql.Types.INTEGER);
                ps.setString(46, ts.getIdTaiSanCha());
                if (ts.getTrangThaiSuaChua() != null) ps.setInt(47, ts.getTrangThaiSuaChua()); else ps.setNull(47, java.sql.Types.INTEGER);
                ps.setString(48, ts.getId());
            }

            @Override
            public int getBatchSize() {
                return list.size();
            }
        });
        return result.length;
    }

    public List<TaiSan> batchCreate(List<TaiSan> list) {
        if (list == null || list.isEmpty()) {
            return new java.util.ArrayList<>();
        }

        List<String> ids = new java.util.ArrayList<>();
        for (TaiSan ts : list) {
            if (ts.getId() != null && !ts.getId().trim().isEmpty()) {
                ids.add(ts.getId());
            }
        }

        if (ids.isEmpty()) {
            return new java.util.ArrayList<>();
        }

        StringBuilder inBuilder = new StringBuilder();
        for (int i = 0; i < ids.size(); i++) {
            inBuilder.append("?");
            if (i < ids.size() - 1) {
                inBuilder.append(",");
            }
        }

        String checkSql = "SELECT Id FROM TaiSan WHERE Id IN (" + inBuilder.toString() + ")";
        List<String> existingIds = jdbcTemplate.query(
                checkSql,
                (rs, rowNum) -> rs.getString("Id"),
                ids.toArray()
        );

        List<TaiSan> toInsert = new java.util.ArrayList<>();
        List<TaiSan> toUpdate = new java.util.ArrayList<>();

        java.util.Set<String> existingSet = new java.util.HashSet<>(existingIds);
        for (TaiSan ts : list) {
            if (ts.getId() == null || ts.getId().trim().isEmpty()) {
                continue;
            }
            if (existingSet.contains(ts.getId())) {
                toUpdate.add(ts);
            } else {
                toInsert.add(ts);
            }
        }

        if (!toInsert.isEmpty()) {
            batchInsert(toInsert);
        }
        if (!toUpdate.isEmpty()) {
            batchUpdate(toUpdate);
        }

        return toInsert;
    }

    public int updateDonViSoHuu(String id, String idDonViHienThoi) {
        String sql = "UPDATE TaiSan SET IdDonViHienThoi=? WHERE Id=?";
        return jdbcTemplate.update(sql, idDonViHienThoi, id);
    }
    public int updateTrangThaiSuaChua(String id, Integer trangThaiSuaChua) {
        // Chỉ update nếu: đang ở trạng thái 4 (cho set tự do)
        // HOẶC trạng thái mới lớn hơn trạng thái hiện tại (chỉ cho set xuôi)
        String sql = "UPDATE TaiSan SET TrangThaiSuaChua=? " +
                    "WHERE Id=? AND (TrangThaiSuaChua=4 OR TrangThaiSuaChua<?)";
        return jdbcTemplate.update(sql, trangThaiSuaChua, id, trangThaiSuaChua);
    }

    public int updateTaiSanPhatSinhBatch(List<String> ids, boolean isTaiSanPhatSinh) {
        if (ids == null || ids.isEmpty()) return 0;
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        String sql = "UPDATE TaiSan SET IsTaiSanPhatSinh = ? WHERE Id IN (" + placeholders + ")";

        List<Object> params = new ArrayList<>();
        params.add(isTaiSanPhatSinh ? 1 : 0);
        params.addAll(ids);

        return jdbcTemplate.update(sql, params.toArray());
    }

    public int deactivateTaiSanConRelation(String idTaiSanCha, String idTaiSanCon) {
        jdbcTemplate.update(
            "UPDATE TaiSan SET IdTaiSanCha = NULL, MaPhu = NULL WHERE Id = ? AND IdTaiSanCha = ?",
            idTaiSanCon, idTaiSanCha
        );
        return jdbcTemplate.update(
            "UPDATE TaiSanCon SET IsActive = 0 WHERE IdTaiSanCha = ? AND IdTaiSanCon = ? AND IsActive = 1",
            idTaiSanCha, idTaiSanCon
        );
    }

    public int delete(String id) {
        String sql = "DELETE FROM TaiSan WHERE Id=?";
        return jdbcTemplate.update(sql, id);
    }

    public int batchDelete(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }

        String sql = "DELETE FROM TaiSan WHERE Id=?";
        int[] result = jdbcTemplate.batchUpdate(sql, new org.springframework.jdbc.core.BatchPreparedStatementSetter() {
            @Override
            public void setValues(java.sql.PreparedStatement ps, int i) throws java.sql.SQLException {
                ps.setString(1, ids.get(i));
            }

            @Override
            public int getBatchSize() {
                return ids.size();
            }
        });

        int total = 0;
        for (int r : result) {
            if (r > 0 || r == java.sql.Statement.SUCCESS_NO_INFO) {
                total += (r == java.sql.Statement.SUCCESS_NO_INFO) ? 1 : r;
            }
        }
        return total;
    }

    public int deleteAllTaiSanCon() {
        String sql = "DELETE FROM TaiSanCon WHERE IdTaiSanCha IN (SELECT Id FROM TaiSan)";
        return jdbcTemplate.update(sql);
    }

    public int deleteAll() {
        String sql = "DELETE FROM TaiSan";
        return jdbcTemplate.update(sql);
    }

    public List<TaiSanCon> getTaiSanConByTaiSan(String idTaiSan) {
        String sql = """
            SELECT
                tsc.*,
                ts.TenTaiSan AS tenTaiSan,
                ts.DonViTinh AS donViTinh,
                ts.SoLuong AS soLuong,
                ts.HienTrang AS hienTrang,
                ts.GhiChu AS ghiChuTaiSan,
                dvt.TenDonVi AS tenDonViTinh,
                ht.TenHTKT AS tenHienTrang
            FROM TaiSanCon tsc
            LEFT JOIN TaiSan ts ON ts.Id = tsc.IdTaiSanCon
            LEFT JOIN DonViTinh dvt ON ts.DonViTinh = dvt.Id
            LEFT JOIN HienTrangKyThuat ht ON ts.HienTrang = ht.Id
            WHERE tsc.IdTaiSanCha = ?
            ORDER BY tsc.Id ASC
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanCon.class), idTaiSan);
    }

    public List<TaiSanCon> getTaiSanConByTaiSanIds(List<String> taiSanIds) {
        if (taiSanIds == null || taiSanIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        String inSql = String.join(",", java.util.Collections.nCopies(taiSanIds.size(), "?"));
        String sql = String.format("""
            SELECT
                tsc.*,
                ts.TenTaiSan AS tenTaiSan,
                ts.DonViTinh AS donViTinh,
                ts.SoLuong AS soLuong,
                ts.HienTrang AS hienTrang,
                ts.GhiChu AS ghiChuTaiSan,
                dvt.TenDonVi AS tenDonViTinh,
                ht.TenHTKT AS tenHienTrang
            FROM TaiSanCon tsc
            LEFT JOIN TaiSan ts ON ts.Id = tsc.IdTaiSanCon
            LEFT JOIN DonViTinh dvt ON ts.DonViTinh = dvt.Id
            LEFT JOIN HienTrangKyThuat ht ON ts.HienTrang = ht.Id
            WHERE tsc.IdTaiSanCha IN (%s)
            ORDER BY tsc.Id ASC
            """, inSql);
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanCon.class), taiSanIds.toArray());
    }

    public int deleteTaiSanConByTaiSan(String idTaiSan) {
        String sql = "DELETE FROM TaiSanCon WHERE IdTaiSanCha = ?";
        return jdbcTemplate.update(sql, idTaiSan);
    }

    public int batchDeleteTaiSanConByTaiSan(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        String placeholders = String.join(",", java.util.Collections.nCopies(ids.size(), "?"));
        String sql = "DELETE FROM TaiSanCon WHERE IdTaiSanCha IN (" + placeholders + ")";
        return jdbcTemplate.update(sql, ids.toArray());
    }

    public List<TaiSanCon> getAll() {
        String sql = "SELECT * FROM TaiSanCon";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanCon.class));
    }

    public TaiSanCon findByTaiSanConId(String idTaiSanCon) {
        String sql = "SELECT * FROM TaiSanCon WHERE IdTaiSanCon = ? ORDER BY Id DESC LIMIT 1";
        List<TaiSanCon> results = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanCon.class), idTaiSanCon);
        return results.isEmpty() ? null : results.get(0);
    }

    public int insertTaiSanCon(TaiSanCon tsc) {
        // Upsert: nếu đã tồn tại thì kích hoạt lại IsActive
        return jdbcTemplate.update(
            "INSERT INTO TaiSanCon (Id, IdTaiSanCon, IdTaiSanCha, IsActive, NguoiTao, NguoiCapNhat) " +
            "VALUES (?, ?, ?, 1, ?, ?) " +
            "ON DUPLICATE KEY UPDATE IsActive = 1, NguoiCapNhat = ?",
            tsc.getId(), tsc.getIdTaiSanCon(), tsc.getIdTaiSanCha(),
            tsc.getNguoiTao(), tsc.getNguoiCapNhat(),
            tsc.getNguoiCapNhat()
        );
    }

    public int updateTaiSanCon(TaiSanCon tsc) {
        String sql = "UPDATE TaiSanCon SET IdTaiSanCha=?, IdTaiSanCon=?, IsActive=?, NguoiCapNhat=? WHERE Id=?";
        return jdbcTemplate.update(sql,
            tsc.getIdTaiSanCha(), tsc.getIdTaiSanCon(),
            tsc.getIsActive() != null && tsc.getIsActive() ? 1 : 0,
            tsc.getNguoiCapNhat(), tsc.getId()
        );
    }

    public int deleteTaiSanCon(String id) {
        String sql = "DELETE FROM TaiSanCon WHERE Id=?";
        return jdbcTemplate.update(sql, id);
    }

    public List<KhauHaoTaiSan> getKhauHaoTaiSanByNhom(String idCongTy, int ngay, int thang, int nam, String idNhomTaiSan, String idDonViHienThoi) {
        StringBuilder sql = new StringBuilder("""
        WITH RECURSIVE periods AS (
            SELECT 1 AS ky
            UNION ALL
            SELECT ky + 1 FROM periods WHERE ky < 240
        )
        SELECT
            ts.Id AS soThe,
            ts.TenTaiSan AS tenTaiSan,
            ts.TaiKhoanTaiSan AS maTk,
            DATE_ADD(STR_TO_DATE(ts.NgaySuDung, '%Y-%m-%d'), INTERVAL (p.ky - 1) * 30 DAY) AS ngayTinhKhao,
            p.ky AS thangKh,
            ts.NguyenGia AS nguyenGia,
            ts.GiaTriKhauHaoBanDau AS khauHaoBanDau,
            (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * (p.ky - 1)) AS khauHaoPsdk,
            GREATEST(ts.NguyenGia - (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * (p.ky - 1)), 0) AS gtclBanDau,
            (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * p.ky) AS khauHaoPsck,
            GREATEST(ts.NguyenGia - (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * p.ky), 0) AS gtclHienTai,
            (ts.NguyenGia / ts.SoKyKhauHao) AS khauHaoBinhQuan,
            (ts.NguyenGia / ts.SoKyKhauHao) AS soTien,
            0 AS chenhLech,
            CAST((ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * GREATEST(p.ky - 2, 0)) AS DECIMAL(18,2)) AS khKyTruoc,
            CAST(0 AS DECIMAL(18,2)) AS clKyTruoc,
            GREATEST(ts.SoKyKhauHao - (ts.KyKhauHaoBanDau + p.ky), 0) AS hsdCkh,
            ts.TaiKhoanChiPhi AS tkNo,
            ts.TaiKhoanKhauHao AS tkCo,
            '00' AS dtgt,
            'P01' AS dtth,
            '30' AS kmcp,
            '' AS ghiChuKhao,
            ts.NguoiCapNhat AS userId,
            ts.nvNS,
            ts.vonVay,
            ts.vonKhac,
            CAST(COALESCE(ts.NgayCapNhat, CURRENT_DATE) AS DATE) AS userTime
        FROM TaiSan ts
        JOIN periods p ON p.ky <= ts.SoKyKhauHao
        WHERE STR_TO_DATE(ts.NgaySuDung, '%Y-%m-%d') IS NOT NULL
          AND DATE_ADD(STR_TO_DATE(ts.NgaySuDung, '%Y-%m-%d'), INTERVAL (p.ky - 1) * 30 DAY) <= CONCAT(?, '-', LPAD(?,2,'0'), '-', LPAD(?,2,'0'))
          AND DATE_ADD(STR_TO_DATE(ts.NgaySuDung, '%Y-%m-%d'), INTERVAL p.ky * 30 DAY) > CONCAT(?, '-', LPAD(?,2,'0'), '-', LPAD(?,2,'0'))
          AND ts.IdCongTy = ?
          AND ts.IdNhomTaiSan = ?
        """);
        List<Object> params = new java.util.ArrayList<>();
        params.add(nam); params.add(thang); params.add(ngay);
        params.add(nam); params.add(thang); params.add(ngay);
        params.add(idCongTy); params.add(idNhomTaiSan);
        if (idDonViHienThoi != null && !idDonViHienThoi.trim().isEmpty()) {
            sql.append("\n          AND ts.IdDonViHienThoi = ?\n");
            params.add(idDonViHienThoi);
        }
        sql.append("ORDER BY ts.KyHieu, p.ky");
        return jdbcTemplate.query(sql.toString(), new BeanPropertyRowMapper<>(KhauHaoTaiSan.class), params.toArray());
    }

    public List<KhauHaoTaiSan> getKhauHaoTaiSan(String idCongTy, int ngay, int thang, int nam) {
        String sql = """
        WITH RECURSIVE periods AS (
            SELECT 1 AS ky
            UNION ALL
            SELECT ky + 1 FROM periods WHERE ky < 240
        )
        SELECT
            ts.Id AS soThe,
            ts.TenTaiSan AS tenTaiSan,
            ts.TaiKhoanTaiSan AS maTk,
            DATE_ADD(STR_TO_DATE(ts.NgaySuDung, '%Y-%m-%d'), INTERVAL (p.ky - 1) * 30 DAY) AS ngayTinhKhao,
            p.ky AS thangKh,
            ts.NguyenGia AS nguyenGia,
            ts.GiaTriKhauHaoBanDau AS khauHaoBanDau,
            (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * (p.ky - 1)) AS khauHaoPsdk,
            GREATEST(ts.NguyenGia - (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * (p.ky - 1)), 0) AS gtclBanDau,
            (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * p.ky) AS khauHaoPsck,
            GREATEST(ts.NguyenGia - (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * p.ky), 0) AS gtclHienTai,
            (ts.NguyenGia / ts.SoKyKhauHao) AS khauHaoBinhQuan,
            (ts.NguyenGia / ts.SoKyKhauHao) AS soTien,
            0 AS chenhLech,
            CAST((ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * GREATEST(p.ky - 2, 0)) AS DECIMAL(18,2)) AS khKyTruoc,
            CAST(0 AS DECIMAL(18,2)) AS clKyTruoc,
            GREATEST(ts.SoKyKhauHao - (ts.KyKhauHaoBanDau + p.ky), 0) AS hsdCkh,
            ts.TaiKhoanChiPhi AS tkNo,
            ts.TaiKhoanKhauHao AS tkCo,
            '00' AS dtgt,
            'P01' AS dtth,
            '30' AS kmcp,
            '' AS ghiChuKhao,
            ts.NguoiCapNhat AS userId,
            ts.nvNS,
            ts.vonVay,
            ts.vonKhac,
            CAST(COALESCE(ts.NgayCapNhat, CURRENT_DATE) AS DATE) AS userTime
        FROM TaiSan ts
        JOIN periods p ON p.ky <= ts.SoKyKhauHao
        WHERE STR_TO_DATE(ts.NgaySuDung, '%Y-%m-%d') IS NOT NULL
          AND DATE_ADD(STR_TO_DATE(ts.NgaySuDung, '%Y-%m-%d'), INTERVAL (p.ky - 1) * 30 DAY) <= CONCAT(?, '-', LPAD(?,2,'0'), '-', LPAD(?,2,'0'))
          AND DATE_ADD(STR_TO_DATE(ts.NgaySuDung, '%Y-%m-%d'), INTERVAL p.ky * 30 DAY) > CONCAT(?, '-', LPAD(?,2,'0'), '-', LPAD(?,2,'0'))
          AND ts.IdCongTy = ?
        ORDER BY ts.KyHieu, p.ky
        """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(KhauHaoTaiSan.class), nam, thang, ngay, nam, thang, ngay, idCongTy);
    }

    public int updateTaiSanCon(String idTaiSan, Boolean isTaiSanCon) {
        String sql = "UPDATE TaiSan SET IsTaiSanCon=? WHERE Id=?";
        return jdbcTemplate.update(sql, isTaiSanCon, idTaiSan);
    }

    public Set<String> getTaiSanDaBanGiaoIds(String idCongTy) {
        String sql = """
                SELECT DISTINCT ct.IdTaiSan
                FROM ChiTietBanGiaoTaiSan ct
                INNER JOIN BanGiaoTaiSan bg ON ct.IdBanGiaoTaiSan = bg.Id
                WHERE bg.IdCongTy = ? AND ct.IsActive = 1
                """;
        List<String> ids = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("IdTaiSan"), idCongTy);
        return ids.stream().collect(Collectors.toSet());
    }

    public List<TaiSanDTO> findByBanGiaoStatusPaged(
        String idCongTy,
        boolean isBanGiao,
        int offset,
        int limit,
        String sortBy,
        String sortDir,
        String search,
        String idNhomTaiSan,
        String idDonViHienThoi,
        int soNgayThongBaoKiemDinh,
        String trangThaiKiemDinh,
        Boolean isPhatSinh,
        Integer trangThaiSuaChua) {
    
        String normalizedSortBy = sortBy != null ? sortBy.trim().toLowerCase() : "ngaycapnhat";
        String orderColumn;
        switch (normalizedSortBy) {
            case "tents":
            case "tentaisan":
                orderColumn = "ts.TenTaiSan";
                break;
            case "sothe":
                orderColumn = "ts.SoThe";
                break;
            case "ngaysudung":
                orderColumn = "ts.NgaySuDung";
                break;
            case "nguyengia":
                orderColumn = "ts.NguyenGia";
                break;
            case "ngaytao":
                orderColumn = "ts.NgayTao";
                break;
            case "ngaycapnhat":
            default:
                orderColumn = "ts.NgayCapNhat";
                break;
        }
        String direction = (sortDir != null && sortDir.equalsIgnoreCase("asc")) ? "ASC" : "DESC";
        
        String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);

        // Xây dựng whereClause
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();
        
        whereClause.append("WHERE ts.IdCongTy = ?");
        params.add(idCongTy);
        
        // Logic bàn giao
        if (isBanGiao) {
            // Đã bàn giao: có IdDonViHienThoi và không phải kho (loaiKho = 1 hoặc 2)
            whereClause.append(" AND ts.IdDonViHienThoi IS NOT NULL AND ts.IdDonViHienThoi <> ''");
            whereClause.append(" AND ts.IdDonViHienThoi NOT IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND IsKho = 1 AND LoaiKho IN (1, 2))");
            params.add(idCongTy);
        } else {
            // Chưa bàn giao: IdDonViHienThoi rỗng/null HOẶC đang ở kho (loaiKho = 1 hoặc 2)
            whereClause.append(" AND (ts.IdDonViHienThoi IS NULL OR ts.IdDonViHienThoi = ''");
            whereClause.append(" OR ts.IdDonViHienThoi IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND IsKho = 1 AND LoaiKho IN (1, 2)))");
            params.add(idCongTy);
        }
        
        // Lọc theo nhóm tài sản
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause.append(" AND ts.IdNhomTaiSan = ?");
            params.add(idNhomTaiSan);
        }
        if (isPhatSinh != null) {
            whereClause.append(" AND ts.IsTaiSanPhatSinh = ?");
            params.add(isPhatSinh ? 1 : 0);
        }
        if (trangThaiSuaChua != null) {
            whereClause.append(" AND ts.TrangThaiSuaChua = ?");
            params.add(trangThaiSuaChua);
        }
        
        // Lọc theo đơn vị hiện thời
        if (idDonViHienThoi != null && !idDonViHienThoi.trim().isEmpty()) {
            whereClause.append(" AND ts.IdDonViHienThoi = ?");
            params.add(idDonViHienThoi);
        }
        
        // Lọc theo search
        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?)");
            String searchPattern = "%" + search + "%";
            for (int i = 0; i < 9; i++) {
                params.add(searchPattern);
            }
        }
        
        // Lọc theo trạng thái kiểm định (thay vì Boolean, dùng String)
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'DA_DANG_KIEM'");
                    break;
                case "SAP_DEN_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'SAP_DEN_HAN'");
                    break;
                case "QUA_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'QUA_HAN'");
                    break;
                case "CHUA_DANG_KIEM":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'CHUA_DANG_KIEM'");
                    break;
            }
        }
        
        String sql = String.format("""
                SELECT 
                    ts.Id,
                    ts.TenTaiSan,
                    ts.NguyenGia,
                    ts.GiaTriKhauHaoBanDau,
                    ts.KyKhauHaoBanDau,
                    ts.GiaTriThanhLy,
                    ts.IdMoHinhTaiSan,
                    mhts.TenMoHinh,
                    ts.IdNhomTaiSan,
                    nts.TenNhom,
                    ts.IdDuDan as idDuAn,
                    da.TenDuAn,
                    ts.IdNguonVon,
                    nv.TenNguonKinhPhi,
                    ts.PhuongPhapKhauHao,
                    ts.SoKyKhauHao,
                    ts.TaiKhoanTaiSan,
                    ts.TaiKhoanKhauHao,
                    ts.TaiKhoanChiPhi,
                    ts.NgayVaoSo,
                    ts.NgaySuDung,
                    ts.KyHieu,
                    ts.SoKyHieu,
                    ts.CongSuat,
                    ts.NuocSanXuat,
                    ts.NamSanXuat,
                    ts.LyDoTang,
                    ts.HienTrang,
                    ts.SoLuong,
                    ts.DonViTinh,
                    ts.GhiChu,
                    ts.IdDonViBanDau,
                    ts.IdDonViHienThoi,
                    ts.MoTa,
                    ts.IdCongTy,
                    ts.NgayTao,
                    ts.NgayCapNhat,
                    ts.NguoiTao,
                    ts.NguoiCapNhat,
                    ts.IsActive,
                    ts.IsHeThong,
                    ts.IsTaiSanCon,
                    ts.IdLoaiTaiSanCon,
                    ts.IdTaiSanCha,
                    lts.TenLoai,
                    ts.SoThe,
                    ts.nvNS,
                    ts.vonVay,
                    ts.vonKhac,
                    ts.tgKiemDinh,
                    ts.chuKyKiemDinh,
                    %s AS trangThaiKiemDinh,
                    ht.TenHTKT AS tenHienTrang,
                    pb1.TenPhongBan AS tenDonViBanDau,
                    pb2.TenPhongBan AS tenDonViHienThoi,
                    dvt.TenDonVi AS tenDonViTinh,
                    llt.MaLyLich as maLyLich,
                    ts.TrangThaiSuaChua
                FROM 
                    TaiSan AS ts
                LEFT JOIN MoHinhTaiSan AS mhts ON ts.IdMoHinhTaiSan = mhts.Id
                LEFT JOIN NhomTaiSan AS nts ON ts.IdNhomTaiSan = nts.Id
                LEFT JOIN lylich AS ll ON nts.IdLyLich = ll.Id
                LEFT JOIN lylich_template AS llt ON ll.IdLyLichTemplate = llt.Id
                LEFT JOIN LoaiTaiSanCon AS lts ON Ts.idLoaiTaiSanCon = lts.Id
                LEFT JOIN DuAn AS da ON ts.IdDuDan = da.Id
                LEFT JOIN NguonVon AS nv ON ts.IdNguonVon = nv.Id
                LEFT JOIN PhongBan AS pb1 ON ts.IdDonViBanDau = pb1.Id
                LEFT JOIN PhongBan AS pb2 ON ts.IdDonViHienThoi = pb2.Id
                LEFT JOIN DonViTinh AS dvt ON ts.DonViTinh = dvt.Id
                LEFT JOIN HienTrangKyThuat AS ht ON ts.HienTrang = ht.Id
                %s
                ORDER BY %s %s
                LIMIT ? OFFSET ?
                """, inspectionStatusSql, whereClause.toString(), orderColumn, direction);
        
        params.add(limit);
        params.add(offset);
        
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanDTO.class), params.toArray());
    }

    public long countByBanGiaoStatus(
        String idCongTy,
        boolean isBanGiao,
        String search,
        String idNhomTaiSan,
        String idDonViHienThoi,
        int soNgayThongBaoKiemDinh,
        String trangThaiKiemDinh,
        Boolean isPhatSinh,
        Integer trangThaiSuaChua) {
    
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();
        
        whereClause.append("WHERE ts.IdCongTy = ?");
        params.add(idCongTy);
        
        // Logic bàn giao
        if (isBanGiao) {
            whereClause.append(" AND ts.IdDonViHienThoi IS NOT NULL AND ts.IdDonViHienThoi <> ''");
            whereClause.append(" AND ts.IdDonViHienThoi NOT IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND IsKho = 1 AND LoaiKho IN (1, 2))");
            params.add(idCongTy);
        } else {
            whereClause.append(" AND (ts.IdDonViHienThoi IS NULL OR ts.IdDonViHienThoi = ''");
            whereClause.append(" OR ts.IdDonViHienThoi IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND IsKho = 1 AND LoaiKho IN (1, 2))");
            params.add(idCongTy);
        }
        
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause.append(" AND ts.IdNhomTaiSan = ?");
            params.add(idNhomTaiSan);
        }
        if (isPhatSinh != null) {
            whereClause.append(" AND ts.IsTaiSanPhatSinh = ?");
            params.add(isPhatSinh ? 1 : 0);
        }

        if (trangThaiSuaChua != null) {
            whereClause.append(" AND ts.TrangThaiSuaChua = ?");
            params.add(trangThaiSuaChua);
        }
        
        if (idDonViHienThoi != null && !idDonViHienThoi.trim().isEmpty()) {
            whereClause.append(" AND ts.IdDonViHienThoi = ?");
            params.add(idDonViHienThoi);
        }
        
        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?)");
            String searchPattern = "%" + search + "%";
            for (int i = 0; i < 9; i++) {
                params.add(searchPattern);
            }
        }
        
         String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
        // Filter theo trạng thái kiểm định
       // Lọc theo trạng thái kiểm định (thay vì Boolean, dùng String)
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'DA_DANG_KIEM'");
                    break;
                case "SAP_DEN_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'SAP_DEN_HAN'");
                    break;
                case "QUA_HAN":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'QUA_HAN'");
                    break;
                case "CHUA_DANG_KIEM":
                    whereClause.append(" AND ").append(inspectionStatusSql).append(" = 'CHUA_DANG_KIEM'");
                    break;
            }
        }
        
        String sql = "SELECT COUNT(*) FROM TaiSan ts " + whereClause.toString();
        Long result = jdbcTemplate.queryForObject(sql, Long.class, params.toArray());
        return result != null ? result : 0L;
    }

    public List<TaiSanDTO> findAllPagedWithBanGiaoStatus(String idCongTy, int offset, int limit, String sortBy, String sortDir, String idNhomTaiSan, boolean daBanGiao, int soNgayThongBaoKiemDinh, String trangThaiKiemDinh) {
        String normalizedSortBy = sortBy != null ? sortBy.trim().toLowerCase() : "ngaycapnhat";
        String orderColumn;
        switch (normalizedSortBy) {
            case "tents":
            case "tentaisan":
                orderColumn = "ts.TenTaiSan";
                break;
            case "sothe":
                orderColumn = "ts.SoThe";
                break;
            case "ngaysudung":
                orderColumn = "ts.NgaySuDung";
                break;
            case "nguyengia":
                orderColumn = "ts.NguyenGia";
                break;
            default:
                orderColumn = "ts.NgayCapNhat";
        }
        String sortDirection = (sortDir != null && sortDir.trim().equalsIgnoreCase("asc")) ? "ASC" : "DESC";
        String whereClause = " WHERE ts.IdCongTy = ? ";
        List<Object> params = new ArrayList<>();
        params.add(idCongTy);
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause += " AND ts.IdNhomTaiSan = ? ";
            params.add(idNhomTaiSan);
        }
        if (daBanGiao) {
            whereClause += " AND (ts.IdDonViHienThoi IS NOT NULL AND ts.IdDonViHienThoi <> '') ";
        } else {
            whereClause += " AND (ts.IdDonViHienThoi IS NULL OR ts.IdDonViHienThoi = '') ";
        }


         String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
        // Filter theo trạng thái kiểm định
       // Lọc theo trạng thái kiểm định (thay vì Boolean, dùng String)
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'DA_DANG_KIEM'";
                    break;
                case "SAP_DEN_HAN":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'SAP_DEN_HAN'";
                    break;
                case "QUA_HAN":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'QUA_HAN'";
                    break;
                case "CHUA_DANG_KIEM":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'CHUA_DANG_KIEM'";
                    break;
            }
        }
        String sql = """
                SELECT 
                    ts.Id,
                    ts.TenTaiSan,
                    ts.NguyenGia,
                    ts.GiaTriKhauHaoBanDau,
                    ts.KyKhauHaoBanDau,
                    ts.GiaTriThanhLy,
                    ts.IdMoHinhTaiSan,
                    mhts.TenMoHinh,
                    ts.IdNhomTaiSan,
                    nts.TenNhom,
                    ts.IdDuDan as idDuAn,
                    da.TenDuAn,
                    ts.IdNguonVon,
                    nv.TenNguonKinhPhi,
                    ts.PhuongPhapKhauHao,
                    ts.SoKyKhauHao,
                    ts.TaiKhoanTaiSan,
                    ts.TaiKhoanKhauHao,
                    ts.TaiKhoanChiPhi,
                    ts.NgayVaoSo,
                    ts.NgaySuDung,
                    ts.KyHieu,
                    ts.SoKyHieu,
                    ts.CongSuat,
                    ts.NuocSanXuat,
                    ts.NamSanXuat,
                    ts.LyDoTang,
                    ts.HienTrang,
                    ts.SoLuong,
                    ts.DonViTinh,
                    ts.GhiChu,
                    ts.IdDonViBanDau,
                    ts.IdDonViHienThoi,
                    ts.MoTa,
                    ts.IdCongTy,
                    ts.NgayTao,
                    ts.NgayCapNhat,
                    ts.NguoiTao,
                    ts.NguoiCapNhat,
                    ts.IsActive,
                    ts.IsHeThong,
                    ts.IsTaiSanCon,
                    ts.IdLoaiTaiSanCon,
                    ts.IdTaiSanCha, 
                    lts.TenLoai,
                    ts.SoThe,
                    ts.nvNS,
                    ts.vonVay,
                    ts.vonKhac,
                    ts.tgKiemDinh,
                    ts.chuKyKiemDinh,
                    ts.IdDonViQuanlyKiThuat,
                    %s AS trangThaiKiemDinh,
                    ht.TenHTKT AS tenHienTrang,
                    pb1.TenPhongBan AS tenDonViBanDau,
                    pb2.TenPhongBan AS tenDonViHienThoi,
                    pb3.TenPhongBan AS tenDonViQuanlyKiThuat,
                    dvt.TenDonVi AS tenDonViTinh,
                    llt.MaLyLich as maLyLich,
                    ts.TrangThaiSuaChua
                FROM 
                    TaiSan AS ts
                LEFT JOIN MoHinhTaiSan AS mhts ON ts.IdMoHinhTaiSan = mhts.Id
                LEFT JOIN NhomTaiSan AS nts ON ts.IdNhomTaiSan = nts.Id
                LEFT JOIN lylich AS ll ON nts.IdLyLich = ll.Id
                LEFT JOIN lylich_template AS llt ON ll.IdLyLichTemplate = llt.Id
                LEFT JOIN LoaiTaiSanCon AS lts ON Ts.idLoaiTaiSanCon = lts.Id
                LEFT JOIN DuAn AS da ON ts.IdDuDan = da.Id
                LEFT JOIN NguonVon AS nv ON ts.IdNguonVon = nv.Id
                LEFT JOIN PhongBan AS pb1 ON ts.IdDonViBanDau = pb1.Id
                LEFT JOIN PhongBan AS pb2 ON ts.IdDonViHienThoi = pb2.Id
                LEFT JOIN PhongBan AS pb3 ON ts.IdDonViQuanlyKiThuat = pb3.Id
                LEFT JOIN DonViTinh AS dvt ON ts.DonViTinh = dvt.Id
                LEFT JOIN HienTrangKyThuat AS ht ON ts.HienTrang = ht.Id
                """ + whereClause + " ORDER BY " + orderColumn + " " + sortDirection + " LIMIT ? OFFSET ? ";
        String sqlFull = String.format(sql, inspectionStatusSql);
        params.add(limit);
        params.add(offset);
        return jdbcTemplate.query(sqlFull, new BeanPropertyRowMapper<>(TaiSanDTO.class), params.toArray());
    }

    public long countByCongTyAndBanGiaoStatus(String idCongTy, String idNhomTaiSan, boolean daBanGiao, int soNgayThongBaoKiemDinh, String trangThaiKiemDinh) {
        String whereClause = " WHERE ts.IdCongTy = ? ";
        List<Object> params = new ArrayList<>();
        params.add(idCongTy);
        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause += " AND ts.IdNhomTaiSan = ? ";
            params.add(idNhomTaiSan);
        }
        if (daBanGiao) {
            whereClause += " AND (ts.IdDonViHienThoi IS NOT NULL AND ts.IdDonViHienThoi <> '') ";
        } else {
            whereClause += " AND (ts.IdDonViHienThoi IS NULL OR ts.IdDonViHienThoi = '') ";
        }

         String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
        // Filter theo trạng thái kiểm định
       // Lọc theo trạng thái kiểm định (thay vì Boolean, dùng String)
        if (trangThaiKiemDinh != null && !trangThaiKiemDinh.trim().isEmpty()) {
            switch (trangThaiKiemDinh) {
                case "DA_DANG_KIEM":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'DA_DANG_KIEM'";
                    break;
                case "SAP_DEN_HAN":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'SAP_DEN_HAN'";
                    break;
                case "QUA_HAN":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'QUA_HAN'";
                    break;
                case "CHUA_DANG_KIEM":
                    whereClause +=" AND "+ inspectionStatusSql + " = 'CHUA_DANG_KIEM'";
                    break;
            }
        }

        String sql = "SELECT COUNT(*) FROM TaiSan AS ts " + whereClause;
        Long result = jdbcTemplate.queryForObject(sql, Long.class, params.toArray());
        return result != null ? result : 0L;
    }

    public Map<String, Long> getCountByNhomTaiSanWithBanGiaoStatus(String idCongTy, Boolean daBanGiao, String search, String idDonViHienThoi) {
        StringBuilder whereClause = new StringBuilder(" WHERE ts.IdCongTy = ? ");
        List<Object> params = new ArrayList<>();
        params.add(idCongTy);
        if (daBanGiao != null) {
            if (daBanGiao) {
                whereClause.append(" AND (ts.IdDonViHienThoi IS NOT NULL AND ts.IdDonViHienThoi <> '') ");
            } else {
                whereClause.append(" AND (ts.IdDonViHienThoi IS NULL OR ts.IdDonViHienThoi = '') ");
            }
        }
        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?) ");
            String searchPattern = "%" + search + "%";
            for (int i = 0; i < 9; i++) {
                params.add(searchPattern);
            }
        }
        if (idDonViHienThoi != null && !idDonViHienThoi.trim().isEmpty()) {
            whereClause.append(" AND (ts.IdDonViHienThoi LIKE ?) ");
            params.add("%" + idDonViHienThoi + "%");
        }
        String sql = """
        SELECT 
            ts.IdNhomTaiSan AS idNhomTaiSan,
            nts.TenNhom AS tenNhom,
            COUNT(ts.Id) AS soLuong
        FROM TaiSan ts
        LEFT JOIN NhomTaiSan nts ON ts.IdNhomTaiSan = nts.Id
        """ + whereClause.toString() + """
        GROUP BY ts.IdNhomTaiSan, nts.TenNhom
        """;
        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, params.toArray());
        Map<String, Long> counts = new java.util.HashMap<>();
        for (Map<String, Object> row : results) {
            String id = (String) row.get("idNhomTaiSan");
            Long count = ((Number) row.get("soLuong")).longValue();
            if (id == null || id.isEmpty()) {
                counts.put("UNKNOWN", count);
            } else {
                counts.put(id, count);
            }
        }
        return counts;
    }

    public Map<String, Long> getCountByNhomTaiSanForDonViHienThoi(String idCongTy, String idDonViHienThoi, String search) {
        StringBuilder whereClause = new StringBuilder(" WHERE ts.IdCongTy = ? AND ts.IdDonViHienThoi = ? ");
        List<Object> params = new ArrayList<>();
        params.add(idCongTy);
        params.add(idDonViHienThoi);
        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?) ");
            String searchPattern = "%" + search + "%";
            for (int i = 0; i < 9; i++) {
                params.add(searchPattern);
            }
        }
        String sql = """
            SELECT 
                ts.IdNhomTaiSan AS idNhomTaiSan,
                nts.TenNhom AS tenNhom,
                COUNT(ts.Id) AS soLuong
            FROM TaiSan ts
            LEFT JOIN NhomTaiSan nts ON ts.IdNhomTaiSan = nts.Id
            """ + whereClause.toString() + """
            GROUP BY ts.IdNhomTaiSan, nts.TenNhom
            """;
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, params.toArray());
            Map<String, Long> counts = new java.util.HashMap<>();
            for (Map<String, Object> row : results) {
                String id = (String) row.get("idNhomTaiSan");
                Long count = ((Number) row.get("soLuong")).longValue();
                if (id == null || id.isEmpty()) {
                    counts.put("UNKNOWN", count);
                } else {
                    counts.put(id, count);
                }
            }
            return counts;
        }
    public Map<String, Long> getCountByTrangThaiKiemDinh(
            String idCongTy,
            String type, // "CAP_PHAT", "THU_HOI", "DA_BAN_GIAO"
            String idDonVi, // idDonViBanDau hoặc idDonViHienThoi (có thể null)
            String search,
            String idNhomTaiSan,
            String idDonViHienThoi, // chỉ dùng cho type = "DA_BAN_GIAO"
            int soNgayThongBaoKiemDinh) {
        
            StringBuilder whereClause = new StringBuilder();
            List<Object> params = new ArrayList<>();
            
            whereClause.append("WHERE ts.IdCongTy = ?");
            params.add(idCongTy);
            
            // Logic theo từng loại
            switch (type) {
                case "CAP_PHAT":
                    if (idDonVi != null && !idDonVi.trim().isEmpty()) {
                        whereClause.append(" AND ts.IdDonViBanDau = ?");
                        params.add(idDonVi);
                    } else {
                        whereClause.append(" AND ts.IdDonViBanDau IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND IsKho=1 AND LoaiKho = 1)");
                        params.add(idCongTy);
                    }
                    whereClause.append(" AND (ts.IdDonViHienThoi IS NULL OR ts.IdDonViHienThoi = '')");
                    break;
                    
                case "THU_HOI":
                    if (idDonVi != null && !idDonVi.trim().isEmpty()) {
                        whereClause.append(" AND ts.IdDonViHienThoi = ?");
                        params.add(idDonVi);
                    } else {
                        whereClause.append(" AND ts.IdDonViHienThoi IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND IsKho=1 AND LoaiKho = 2)");
                        params.add(idCongTy);
                    }
                    break;
                case "DA_BAN_GIAO":
                    whereClause.append(" AND ts.IdDonViHienThoi IS NOT NULL AND ts.IdDonViHienThoi <> ''");
                    whereClause.append(" AND ts.IdDonViHienThoi NOT IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND IsKho = 1 AND LoaiKho IN (1, 2))");
                    params.add(idCongTy);
                    
                    if (idDonViHienThoi != null && !idDonViHienThoi.trim().isEmpty()) {
                        whereClause.append(" AND ts.IdDonViHienThoi = ?");
                        params.add(idDonViHienThoi);
                    }
                    break;
            }
            
            // Lọc theo nhóm tài sản
            if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
                whereClause.append(" AND ts.IdNhomTaiSan = ?");
                params.add(idNhomTaiSan);
            }
            whereClause.append(" AND (ts.IsTaiSanPhatSinh IS NULL OR ts.IsTaiSanPhatSinh = 0)");
            whereClause.append(" AND (ts.IsTaiSanPhatSinh IS NULL OR ts.IsTaiSanPhatSinh = 0)");
            
            // Lọc theo search
            if (search != null && !search.trim().isEmpty()) {
                whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?)");
                String searchPattern = "%" + search + "%";
                for (int i = 0; i < 9; i++) {
                    params.add(searchPattern);
                }
            }
            
            String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
            
            String sql = String.format("""
                SELECT 
                    %s AS trang_thai,
                    COUNT(*) AS so_luong
                FROM TaiSan ts
                %s
                GROUP BY trang_thai
                """, inspectionStatusSql, whereClause.toString());
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, params.toArray());
            
            Map<String, Long> counts = new HashMap<>();
            counts.put("Tat ca", 0L);
            counts.put("Da dang kiem", 0L);      // Đã đăng kiểm
            counts.put("Sap den han", 0L);        // Sắp đến hạn
            counts.put("Qua han", 0L);            // Quá hạn
            
            for (Map<String, Object> row : results) {
                String trangThai = (String) row.get("trang_thai");
                Long soLuong = ((Number) row.get("so_luong")).longValue();
                
                if (trangThai != null) {
                    switch (trangThai) {
                        case "DA_DANG_KIEM":
                            counts.put("Da dang kiem", soLuong);
                            break;
                        case "SAP_DEN_HAN":
                            counts.put("Sap den han", soLuong);
                            break;
                        case "QUA_HAN":
                            counts.put("Qua han", counts.get("Qua han") + soLuong);
                            break;
                    }
                    counts.put("Tat ca", counts.get("Tat ca") + soLuong);
                }
            }
            
            return counts;
        }
   
   public Map<String, Long> getCountByTrangThaiSuaChua(
        String idCongTy,
        String type, // "CAP_PHAT", "THU_HOI", "DA_BAN_GIAO"
        String idDonVi,
        String search,
        String idNhomTaiSan,
        String idDonViHienThoi // chỉ dùng cho type = "DA_BAN_GIAO"
    ) {
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();

        whereClause.append("WHERE ts.IdCongTy = ?");
        params.add(idCongTy);

        switch (type) {
            case "CAP_PHAT":
                if (idDonVi != null && !idDonVi.trim().isEmpty()) {
                    whereClause.append(" AND ts.IdDonViBanDau = ?");
                    params.add(idDonVi);
                } else {
                    whereClause.append(" AND ts.IdDonViBanDau IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND IsKho=1 AND LoaiKho = 1)");
                    params.add(idCongTy);
                }
                whereClause.append(" AND (ts.IdDonViHienThoi IS NULL OR ts.IdDonViHienThoi = '')");
                break;

            case "THU_HOI":
                if (idDonVi != null && !idDonVi.trim().isEmpty()) {
                    whereClause.append(" AND ts.IdDonViHienThoi = ?");
                    params.add(idDonVi);
                } else {
                    whereClause.append(" AND ts.IdDonViHienThoi IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND IsKho=1 AND LoaiKho = 2)");
                    params.add(idCongTy);
                }
                break;

            case "DA_BAN_GIAO":
                whereClause.append(" AND ts.IdDonViHienThoi IS NOT NULL AND ts.IdDonViHienThoi <> ''");
                whereClause.append(" AND ts.IdDonViHienThoi NOT IN (SELECT Id FROM PhongBan WHERE IdCongTy = ? AND IsKho = 1 AND LoaiKho IN (1, 2))");
                params.add(idCongTy);

                if (idDonViHienThoi != null && !idDonViHienThoi.trim().isEmpty()) {
                    whereClause.append(" AND ts.IdDonViHienThoi = ?");
                    params.add(idDonViHienThoi);
                }
                break;
        }

        if (idNhomTaiSan != null && !idNhomTaiSan.trim().isEmpty()) {
            whereClause.append(" AND ts.IdNhomTaiSan = ?");
            params.add(idNhomTaiSan);
        }
        whereClause.append(" AND (ts.IsTaiSanPhatSinh IS NULL OR ts.IsTaiSanPhatSinh = 0)");

        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.SoThe LIKE ? OR ts.KyHieu LIKE ? OR ts.SoKyHieu LIKE ? OR ts.CongSuat LIKE ? OR ts.NuocSanXuat LIKE ? OR ts.DonViTinh LIKE ? OR ts.MoTa LIKE ?)");
            String searchPattern = "%" + search + "%";
            for (int i = 0; i < 9; i++) {
                params.add(searchPattern);
            }
        }

        // Lưu ý: KHÔNG filter theo trangThaiSuaChua ở đây — đếm phải cho ra
        // số lượng của TẤT CẢ 4 trạng thái, không bị ảnh hưởng bởi filter đang chọn
        // (giống hệt cách kiemDinhCounts không nhận trangThaiKiemDinh làm điều kiện lọc)
        String sql = String.format("""
            SELECT 
                COALESCE(ts.TrangThaiSuaChua, 4) AS trang_thai,
                COUNT(*) AS so_luong
            FROM TaiSan ts
            %s
            GROUP BY trang_thai
            """, whereClause.toString());

        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, params.toArray());

        Map<String, Long> counts = new HashMap<>();
        counts.put("Chuan bi can bao duong", 0L); // 1
        counts.put("Can bao duong", 0L);          // 2
        counts.put("Trong ky bao duong", 0L);     // 3
        counts.put("Da bao duong", 0L);           // 4

        for (Map<String, Object> row : results) {
            Object trangThaiObj = row.get("trang_thai");
            int trangThai = trangThaiObj != null ? ((Number) trangThaiObj).intValue() : 4;
            Long soLuong = ((Number) row.get("so_luong")).longValue();

            switch (trangThai) {
                case 1:
                    counts.put("Chuan bi can bao duong", soLuong);
                    break;
                case 2:
                    counts.put("Can bao duong", soLuong);
                    break;
                case 3:
                    counts.put("Trong ky bao duong", soLuong);
                    break;
                default: // 4 hoặc null
                    counts.put("Da bao duong", counts.get("Da bao duong") + soLuong);
                    break;
            }
        }

        return counts;
    }
        public PagedResult<KhauHaoTaiSan> getKhauHaoTaiSanPaged(String idCongTy, int ngay, int thang, int nam,
                                                            int offset, int limit, String sortBy, String sortDir, String search) {
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();
        params.add(nam); params.add(thang); params.add(ngay);
        params.add(nam); params.add(thang); params.add(ngay);
        params.add(idCongTy);
        if (search != null && !search.trim().isEmpty()) {
            whereClause.append(" AND (ts.Id LIKE ? OR ts.TenTaiSan LIKE ? OR ts.TaiKhoanTaiSan LIKE ?)");
            String searchPattern = "%" + search + "%";
            params.add(searchPattern); params.add(searchPattern); params.add(searchPattern);
        }
        String normalizedSortBy = sortBy != null ? sortBy.trim().toLowerCase() : "ngaytinhkhao";
        String orderColumn;
        switch (normalizedSortBy) {
            case "sothe": orderColumn = "ts.Id"; break;
            case "tentaisan": orderColumn = "ts.TenTaiSan"; break;
            case "nguyengia": orderColumn = "nguyenGia"; break;
            case "thangkh": orderColumn = "thangKh"; break;
            default: orderColumn = "ngayTinhKhao";
        }
        String direction = (sortDir != null && sortDir.equalsIgnoreCase("asc")) ? "ASC" : "DESC";

        String countSql = """
        WITH RECURSIVE periods AS (
            SELECT 1 AS ky
            UNION ALL
            SELECT ky + 1 FROM periods WHERE ky < 240
        )
        SELECT COUNT(*) 
        FROM TaiSan ts
        JOIN periods p ON p.ky <= ts.SoKyKhauHao
        WHERE DATE_ADD(DATE(ts.NgaySuDung), INTERVAL (p.ky - 1) * 30 DAY) <= DATE(CONCAT(?, '-', LPAD(?,2,'0'), '-', LPAD(?,2,'0')))
          AND DATE_ADD(DATE(ts.NgaySuDung), INTERVAL p.ky * 30 DAY) > DATE(CONCAT(?, '-', LPAD(?,2,'0'), '-', LPAD(?,2,'0')))
          AND ts.IdCongTy = ?
        """ + whereClause.toString();
        Long total = jdbcTemplate.queryForObject(countSql, Long.class, params.toArray());

        params.add(limit);
        params.add(offset);
        String dataSql = String.format("""
        WITH RECURSIVE periods AS (
            SELECT 1 AS ky
            UNION ALL
            SELECT ky + 1 FROM periods WHERE ky < 240
        )
        SELECT
            ts.Id AS soThe,
            ts.TenTaiSan AS tenTaiSan,
            ts.TaiKhoanTaiSan AS maTk,
            DATE_ADD(DATE(ts.NgaySuDung), INTERVAL (p.ky - 1) * 30 DAY) AS ngayTinhKhao,
            p.ky AS thangKh,
            ts.NguyenGia AS nguyenGia,
            ts.GiaTriKhauHaoBanDau AS khauHaoBanDau,
            (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * (p.ky - 1)) AS khauHaoPsdk,
            GREATEST(ts.NguyenGia - (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * (p.ky - 1)), 0) AS gtclBanDau,
            (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * p.ky) AS khauHaoPsck,
            GREATEST(ts.NguyenGia - (ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * p.ky), 0) AS gtclHienTai,
            (ts.NguyenGia / ts.SoKyKhauHao) AS khauHaoBinhQuan,
            (ts.NguyenGia / ts.SoKyKhauHao) AS soTien,
            0 AS chenhLech,
            CAST((ts.GiaTriKhauHaoBanDau + (ts.NguyenGia / ts.SoKyKhauHao) * GREATEST(p.ky - 2, 0)) AS DECIMAL(18,2)) AS khKyTruoc,
            CAST(0 AS DECIMAL(18,2)) AS clKyTruoc,
            GREATEST(ts.SoKyKhauHao - (ts.KyKhauHaoBanDau + p.ky), 0) AS hsdCkh,
            ts.TaiKhoanChiPhi AS tkNo,
            ts.TaiKhoanKhauHao AS tkCo,
            '00' AS dtgt,
            'P01' AS dtth,
            '30' AS kmcp,
            '' AS ghiChuKhao,
            ts.NguoiCapNhat AS userId,
            ts.nvNS,
            ts.vonVay,
            ts.vonKhac,
            COALESCE(ts.NgayCapNhat, CURRENT_DATE) AS userTime
        FROM TaiSan ts
        JOIN periods p ON p.ky <= ts.SoKyKhauHao
        WHERE DATE_ADD(DATE(ts.NgaySuDung), INTERVAL (p.ky - 1) * 30 DAY) <= DATE(CONCAT(?, '-', LPAD(?,2,'0'), '-', LPAD(?,2,'0')))
          AND DATE_ADD(DATE(ts.NgaySuDung), INTERVAL p.ky * 30 DAY) > DATE(CONCAT(?, '-', LPAD(?,2,'0'), '-', LPAD(?,2,'0')))
          AND ts.IdCongTy = ?
        %s
        ORDER BY %s %s
        LIMIT ? OFFSET ?
        """, whereClause.toString(), orderColumn, direction);
        List<KhauHaoTaiSan> items = jdbcTemplate.query(dataSql, new BeanPropertyRowMapper<>(KhauHaoTaiSan.class), params.toArray());
        return new PagedResult<>(items, total);
    }

    public long countSapHetHanKiemDinh(String idCongTy, int soNgayThongBaoKiemDinh) {
        String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
        String sql = "SELECT COUNT(*) FROM TaiSan ts WHERE ts.IdCongTy = ? AND " + inspectionStatusSql + " = 'SAP_DEN_HAN'";
        Long result = jdbcTemplate.queryForObject(sql, Long.class, idCongTy);
        return result != null ? result : 0L;
    }

    public List<TaiSanDTO> findSapHetHanKiemDinhPaged(String idCongTy, int offset, int limit, int soNgayThongBaoKiemDinh) {
        String inspectionStatusSql = getInspectionStatusSql(soNgayThongBaoKiemDinh);
        // NgayDangKiemTiepTheo = 01/(tgKiemDinh + chuKy)
        String deadlineSql = "DATE_ADD(STR_TO_DATE(CONCAT('01/', ts.tgKiemDinh), '%d/%m/%Y'), INTERVAL ts.chuKyKiemDinh MONTH)";
        
        String sql = String.format("""
                SELECT 
                    ts.Id,
                    ts.TenTaiSan,
                    ts.SoThe,
                    ts.tgKiemDinh,
                    ts.chuKyKiemDinh,
                    DATE_FORMAT(%s, '%%d/%%m/%%Y') AS ngayDangKiemTiepTheo,
                    DATEDIFF(%s, CURRENT_DATE) AS thoiHanConLai,
                    'SAP_DEN_HAN' AS trangThaiKiemDinh,
                    pb1.TenPhongBan AS tenDonViBanDau,
                    pb2.TenPhongBan AS tenDonViHienThoi,
                    dvt.TenDonVi AS tenDonViTinh,
                    ht.TenHTKT AS tenHienTrang
                FROM 
                    TaiSan AS ts
                LEFT JOIN PhongBan AS pb1 ON ts.IdDonViBanDau = pb1.Id
                LEFT JOIN PhongBan AS pb2 ON ts.IdDonViHienThoi = pb2.Id
                LEFT JOIN DonViTinh AS dvt ON ts.DonViTinh = dvt.Id
                LEFT JOIN HienTrangKyThuat AS ht ON ts.HienTrang = ht.Id
                WHERE ts.IdCongTy = ? AND %s = 'SAP_DEN_HAN'
                ORDER BY thoiHanConLai ASC
                LIMIT ? OFFSET ?
                """, deadlineSql, deadlineSql, inspectionStatusSql);
        
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(TaiSanDTO.class), idCongTy, limit, offset);
    }

    private String getInspectionStatusSql(int soNgayThongBaoKiemDinh) {
        return String.format("""
            (CASE 
                WHEN (ts.tgKiemDinh IS NOT NULL AND ts.tgKiemDinh <> '' AND ts.chuKyKiemDinh IS NOT NULL) THEN 
                    (CASE 
                        -- Ngày hết hạn là ngày cuối cùng của tháng (tgKiemDinh + chuKy - 1)
                        WHEN CURRENT_DATE > LAST_DAY(DATE_ADD(STR_TO_DATE(CONCAT('01/', ts.tgKiemDinh), '%%d/%%m/%%Y'), INTERVAL (ts.chuKyKiemDinh - 1) MONTH)) THEN 'QUA_HAN'
                        -- Trong khoảng cảnh báo (sắp đến hạn): bắt đầu từ n ngày trước khi hết hạn cho đến hết ngày hạn chót
                        WHEN CURRENT_DATE >= DATE_SUB(LAST_DAY(DATE_ADD(STR_TO_DATE(CONCAT('01/', ts.tgKiemDinh), '%%d/%%m/%%Y'), INTERVAL (ts.chuKyKiemDinh - 1) MONTH)), INTERVAL %d DAY) THEN 'SAP_DEN_HAN'
                        ELSE 'DA_DANG_KIEM'
                    END)
                ELSE 'QUA_HAN'
            END)
            """, soNgayThongBaoKiemDinh);
    }
    public static class PagedResult<T> {
        private List<T> items;
        private Long total;
        public PagedResult(List<T> items, Long total) {
            this.items = items;
            this.total = total;
        }
        public List<T> getItems() { return items; }
        public Long getTotal() { return total; }
    }

    /**
     * Khi xóa quan hệ cha-con (tài sản cha không còn gắn tài sản con này):
     * 1. Set IdTaiSanCha = NULL và MaPhu = NULL trên TaiSan (bảng tài sản con)
     * 2. Set IsActive = 0 trên TaiSanCon (giữ lịch sử, làm mờ UI)
     */
    public int clearIdTaiSanCha(String idTaiSanCha) {
        // Bước 1: set NULL trên bảng TaiSan
        jdbcTemplate.update("UPDATE TaiSan SET IdTaiSanCha = NULL, MaPhu = NULL WHERE IdTaiSanCha = ?", idTaiSanCha);
        // Bước 2: đánh IsActive = 0 trên TaiSanCon để giữ lịch sử
        return jdbcTemplate.update("UPDATE TaiSanCon SET IsActive = 0 WHERE IdTaiSanCha = ? AND IsActive = 1", idTaiSanCha);
    }

    /**
     * Gán tài sản con vào tài sản cha:
     * 1. Set IdTaiSanCha và MaPhu (= idChild.idParent) trên bảng TaiSan
     * 2. Upsert vào bảng TaiSanCon dùng MaPhu làm Id (nếu trùng thì cập nhật IsActive=1)
     */
    public int updateIdTaiSanChaForList(List<String> listIdTaiSanCon, String idTaiSanCha) {
        if (listIdTaiSanCon == null || listIdTaiSanCon.isEmpty()) {
            return 0;
        }
        int count = 0;
        for (String idTaiSanCon : listIdTaiSanCon) {
            String maPhu = idTaiSanCha + "." + idTaiSanCon;
            // Cập nhật IdTaiSanCha và MaPhu trên bảng TaiSan
            jdbcTemplate.update(
                "UPDATE TaiSan SET IdTaiSanCha = ?, MaPhu = ? WHERE Id = ?",
                idTaiSanCha, maPhu, idTaiSanCon
            );
            // Upsert vào TaiSanCon: dùng MaPhu làm Id, nếu đã có thì kích hoạt lại
            jdbcTemplate.update(
                "INSERT INTO TaiSanCon (Id, IdTaiSanCon, IdTaiSanCha, IsActive) " +
                "VALUES (?, ?, ?, 1) " +
                "ON DUPLICATE KEY UPDATE IsActive = 1",
                maPhu, idTaiSanCon, idTaiSanCha
            );
            count++;
        }
        return count;
    }

    public List<TaiSanDTO> getTaiSanDTOByTaiSanChaIds(List<String> taiSanIds) {
        if (taiSanIds == null || taiSanIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        String inSql = String.join(",", java.util.Collections.nCopies(taiSanIds.size(), "?"));
        String sql = String.format(SELECT_TAISAN_DTO + " WHERE ts.IdTaiSanCha IN (%s)", inSql);
        return jdbcTemplate.query(sql, new org.springframework.jdbc.core.BeanPropertyRowMapper<>(TaiSanDTO.class), taiSanIds.toArray());
    }
}
