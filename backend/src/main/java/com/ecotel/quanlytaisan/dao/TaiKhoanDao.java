package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.Config;
import com.ecotel.quanlytaisan.model.TaiKhoan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class TaiKhoanDao {
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private ConfigDao configDao;

    private RowMapper<TaiKhoan> rowMapper = new RowMapper<TaiKhoan>() {
        @Override
        public TaiKhoan mapRow(ResultSet rs, int rowNum) throws SQLException {
            TaiKhoan tk = new TaiKhoan();
            tk.setId(rs.getString("Id"));
            tk.setTenDangNhap(rs.getString("TenDangNhap"));
            tk.setMatKhau(rs.getString("MatKhau"));
            tk.setHoTen(rs.getString("HoTen"));
            try {
                tk.setPhongBanId(rs.getString("PhongBanId"));
            } catch (SQLException e) {
                tk.setPhongBanId(null);
            }
            try {
                tk.setTenPhongBan(rs.getString("TenPhongBan"));
            }catch (SQLException e) {
                tk.setTenPhongBan(null);
            }
             try {
                tk.setChucVuId(rs.getString("ChucVuId"));
            } catch (SQLException e) {
                tk.setChucVuId(null);
            }
            tk.setEmail(rs.getString("Email"));
            tk.setSoDienThoai(rs.getString("SoDienThoai"));
            tk.setHinhAnh(rs.getString("HinhAnh"));
            tk.setNgayTao(rs.getString("NgayTao"));
            tk.setNgayCapNhat(rs.getString("NgayCapNhat"));
            tk.setNguoiTao(rs.getString("NguoiTao"));
            tk.setNguoiCapNhat(rs.getString("NguoiCapNhat"));
            tk.setIdCongTy(rs.getString("IdCongTy"));
            tk.setRule(rs.getInt("Rule"));
            tk.setIsActive(rs.getBoolean("IsActive"));
            tk.setUsername(rs.getString("Username"));

            // Xử lý trường TenNhanVien nếu có
            try {
                String tenNhanVien = rs.getString("TenNhanVien");
                if (tenNhanVien != null) {
                    // Có thể set vào một field mới trong TaiKhoan hoặc xử lý theo cách khác
                    // tk.setTenNhanVien(tenNhanVien);
                }
            } catch (SQLException e) {
                // Trường TenNhanVien có thể không tồn tại trong một số query
            }

            return tk;
        }
    };

    public List<TaiKhoan> findAll() {
        String sql = "SELECT * FROM TaiKhoan";
        return jdbcTemplate.query(sql, rowMapper);
    }

    public List<TaiKhoan> findByChucVuId(String chucVuId) {
        String sql = "SELECT tk.*, nv.HoTen AS TenNhanVien, nv.BoPhan AS PhongBanId, nv.ChucVu AS ChucVuId " +
                     "FROM TaiKhoan tk " +
                     "JOIN NhanVien nv ON nv.Id = tk.TenDangNhap " +
                     "WHERE nv.ChucVu = ?";
        return jdbcTemplate.query(sql, rowMapper, chucVuId);
    }

    public String getChucVuIdByUsername(String username) {
        String sql = "SELECT ChucVu FROM NhanVien WHERE Id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, String.class, username);
        } catch (Exception e) {
            return null;
        }
    }

    public List<TaiKhoan> findAllPaged(int page, int size, String sortBy, String sortDir, String search) {
        // Xử lý sortBy và sortDir
        String orderBy = "Id"; // default sort
        if (sortBy != null && !sortBy.trim().isEmpty()) {
            // Validate sortBy để tránh SQL injection
            String[] allowedColumns = {"Id", "TenDangNhap", "HoTen", "Email", "SoDienThoai", "NgayTao", "NgayCapNhat", "Rule"};
            for (String column : allowedColumns) {
                if (column.equalsIgnoreCase(sortBy)) {
                    orderBy = column;
                    break;
                }
            }
        }
        
        String direction = "ASC";
        if (sortDir != null && sortDir.equalsIgnoreCase("desc")) {
            direction = "DESC";
        }
        
        // Xử lý search
        String whereClause = "";
        String searchPattern = null;
        if (search != null && !search.trim().isEmpty()) {
            whereClause = "WHERE (tk.TenDangNhap LIKE ? OR tk.HoTen LIKE ? OR tk.Email LIKE ? OR tk.SoDienThoai LIKE ? OR tk.Username LIKE ?)";
            searchPattern = "%" + search.trim() + "%";
        }
        
        String sql = """
            SELECT tk.*, nv.BoPhan AS PhongBanId, pb.TenPhongBan AS tenPhongBan
            FROM TaiKhoan tk 
            LEFT JOIN NhanVien nv ON nv.Id = tk.TenDangNhap
            LEFT JOIN PhongBan pb ON nv.BoPhan = pb.Id
            """ + whereClause + " ORDER BY tk." + orderBy + " " + direction + " LIMIT ? OFFSET ?";
        int offset = page * size;
        
        if (searchPattern != null) {
            return jdbcTemplate.query(sql, rowMapper, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, size, offset);
        } else {
            return jdbcTemplate.query(sql, rowMapper, size, offset);
        }
    }

    public long countAll(String search) {
        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.trim() + "%";
            String sql = "SELECT COUNT(*) FROM TaiKhoan tk WHERE (tk.TenDangNhap LIKE ? OR tk.HoTen LIKE ? OR tk.Email LIKE ? OR tk.SoDienThoai LIKE ? OR tk.Username LIKE ?)";
            return jdbcTemplate.queryForObject(sql, Long.class, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        } else {
            String sql = "SELECT COUNT(*) FROM TaiKhoan";
            return jdbcTemplate.queryForObject(sql, Long.class);
        }
    }

    public TaiKhoan findById(String id) {
        String sql = "SELECT * FROM TaiKhoan WHERE Id = ?";
        return jdbcTemplate.queryForObject(sql, rowMapper, id);
    }

    public int insert(TaiKhoan tk) {
        // Kiểm tra xem record có tồn tại không
        String checkSql = "SELECT COUNT(*) FROM TaiKhoan WHERE Id = ?";
        int count = jdbcTemplate.queryForObject(checkSql, Integer.class, tk.getId());
        
        if (count > 0) {
            // Nếu tồn tại thì update
            return update(tk);
        } else {
            // Nếu chưa tồn tại thì insert
            if (tk.getId() == null || tk.getId().isEmpty()) {
                tk.setId(UUID.randomUUID().toString());
            }
            String sql = "INSERT INTO TaiKhoan (Id, TenDangNhap, MatKhau, HoTen, Email, SoDienThoai, HinhAnh, NguoiTao, NguoiCapNhat, IdCongTy, Rule, IsActive,Username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)";
            return jdbcTemplate.update(sql, tk.getId(), tk.getTenDangNhap(), tk.getMatKhau(), tk.getHoTen(), tk.getEmail(), tk.getSoDienThoai(), tk.getHinhAnh(), tk.getNguoiTao(), tk.getNguoiCapNhat(), tk.getIdCongTy(), tk.getRule(), tk.getIsActive(), tk.getUsername());
        }
    }

    public int update(TaiKhoan tk) {
        String sql = "UPDATE TaiKhoan SET TenDangNhap=?, MatKhau=?, HoTen=?, Email=?, SoDienThoai=?, HinhAnh=?, NguoiTao=?, NguoiCapNhat=?, IdCongTy=?, Rule=?, IsActive=?, Username=? WHERE Id=?";
        return jdbcTemplate.update(sql, tk.getTenDangNhap(), tk.getMatKhau(), tk.getHoTen(), tk.getEmail(), tk.getSoDienThoai(), tk.getHinhAnh(), tk.getNguoiTao(), tk.getNguoiCapNhat(), tk.getIdCongTy(), tk.getRule(), tk.getIsActive(), tk.getUsername(), tk.getId());
    }

    public int delete(String id) {
        String sql1 = "DELETE FROM UserPermission WHERE UserId=?";
        jdbcTemplate.update(sql1, id);
        String sql = "DELETE FROM TaiKhoan WHERE Id=?";
        return jdbcTemplate.update(sql, id);
    }

    public TaiKhoan findByTenDangNhap(String tenDangNhap) {
        String sql = "SELECT * FROM TaiKhoan WHERE TenDangNhap = ?";
        List<TaiKhoan> list = jdbcTemplate.query(sql, rowMapper, tenDangNhap);
        return list.isEmpty() ? null : list.get(0);
    }

    public Map<String, Object> login(String tenDangNhap, String matKhau) {
        String sql = """
                SELECT tk.Id,
                       tk.TenDangNhap,
                       tk.MatKhau,
                       tk.HoTen,
                       tk.Email,
                       tk.SoDienThoai,
                       tk.HinhAnh,
                       tk.NgayTao,
                       tk.NgayCapNhat,
                       tk.NguoiTao,
                       tk.NguoiCapNhat,
                       tk.IdCongTy,
                       tk.Rule,
                       tk.IsActive,
                       nv.HoTen AS TenNhanVien,
                       nv.BoPhan AS PhongBanId,
                       nv.ChucVu AS ChucVuId,
                       pb.TenPhongBan AS tenPhongBan,
                tk.Username
                FROM TaiKhoan AS tk
                         LEFT JOIN NhanVien AS nv ON nv.Id = tk.TenDangNhap
                         LEFT JOIN PhongBan AS pb ON pb.Id = nv.BoPhan
                WHERE tk.Username = ?;""";

        List<TaiKhoan> list = jdbcTemplate.query(sql, rowMapper, tenDangNhap);

        if (list.isEmpty()) {
            throw new RuntimeException("Tên đăng nhập không tồn tại");
        }

        TaiKhoan taiKhoan = list.get(0);

        if (!taiKhoan.getMatKhau().equals(matKhau)) {
            throw new RuntimeException("Sai mật khẩu");
        }

        Config config = configDao.findByIdAccount(taiKhoan.getId());
        if (config == null) {
            Map<String, Object> result = Map.of(
                    "taiKhoan", taiKhoan
            );
            return result;

        }
        Map<String, Object> result = Map.of(
                "taiKhoan", taiKhoan,
                "config", config,
                "token",""
        );
        System.out.println(result);
        return result;
    }
}
