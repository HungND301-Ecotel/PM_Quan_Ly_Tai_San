package com.ecotel.quanlytaisan.dao;

import com.ecotel.quanlytaisan.model.Config;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class ConfigDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private RowMapper<Config> rowMapper = new RowMapper<Config>() {
        @Override
        public Config mapRow(ResultSet rs, int rowNum) throws SQLException {
            Config config = new Config();
            config.setIdAccount(rs.getString("IdAccount"));
            config.setThoiHanTaiLieu(rs.getInt("ThoiHanTaiLieu"));
            config.setNgayBaoHetHan(rs.getInt("NgayBaoHetHan"));
            config.setNgayBaoDangKiem(rs.getInt("NgayBaoDangKiem"));
            
            int soTabToiDa = rs.getInt("SoTabToiDa");
            config.setSoTabToiDa(rs.wasNull() ? 7 : soTabToiDa);
            
            int thoiGianBaoSuaChua = rs.getInt("ThoiGianBaoSuaChua");
            config.setThoiGianBaoSuaChua(rs.wasNull() ? 30 : thoiGianBaoSuaChua);
            return config;
        }
    };

    public List<Config> findAll() {
        String sql = "SELECT * FROM Config";
        return jdbcTemplate.query(sql, rowMapper);
    }

    public Config findByIdAccount(String idAccount) {
        String sql = "SELECT * FROM Config WHERE IdAccount = ?";
        List<Config> results = jdbcTemplate.query(sql, rowMapper, idAccount);
        return results.isEmpty() ? null : results.get(0);
    }


    public int insert(Config config) {
        // Kiểm tra xem record có tồn tại không
        String checkSql = "SELECT COUNT(*) FROM Config WHERE IdAccount = ?";
        int count = jdbcTemplate.queryForObject(checkSql, Integer.class, config.getIdAccount());
        
        if (count > 0) {
            // Nếu tồn tại thì update
            return update(config);
        } else {
            // Nếu chưa tồn tại thì insert
            String sql = "INSERT INTO Config (IdAccount, ThoiHanTaiLieu,NgayBaoHetHan,NgayBaoDangKiem, SoTabToiDa, ThoiGianBaoSuaChua) VALUES (?, ?,?,?,?,?)";
            return jdbcTemplate.update(sql, config.getIdAccount(), config.getThoiHanTaiLieu(), config.getNgayBaoHetHan(),config.getNgayBaoDangKiem(), config.getSoTabToiDa() != null ? config.getSoTabToiDa() : 7, config.getThoiGianBaoSuaChua() != null ? config.getThoiGianBaoSuaChua() : 30);
        }
    }

    public int update(Config config) {
        String sql = "UPDATE Config SET ThoiHanTaiLieu=?, NgayBaoHetHan=?, NgayBaoDangKiem=?, SoTabToiDa=?, ThoiGianBaoSuaChua=? WHERE IdAccount=?";
        return jdbcTemplate.update(sql, config.getThoiHanTaiLieu(), config.getNgayBaoHetHan(),config.getNgayBaoDangKiem(), config.getSoTabToiDa() != null ? config.getSoTabToiDa() : 7, config.getThoiGianBaoSuaChua() != null ? config.getThoiGianBaoSuaChua() : 30, config.getIdAccount());
    }

    public int delete(String idAccount) {
        String sql = "DELETE FROM Config WHERE IdAccount=?";
        return jdbcTemplate.update(sql, idAccount);
    }
}
