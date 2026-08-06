package com.ecotel.quanlytaisan.dao;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.ecotel.quanlytaisan.model.LyDoTang;

@Repository
public class LyDoTangDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<LyDoTang> findAllPaged(int offset, int limit, String sortBy, String sortDir, String keyword) {
        // Xử lý sortBy an toàn
        String normalizedSortBy = sortBy != null ? sortBy.trim().toLowerCase() : "ten";
        String orderColumn;
        switch (normalizedSortBy) {
            case "id":
                orderColumn = "ldt.Id";
                break;
            case "tanggiam":
                orderColumn = "ldt.TangGiam";
                break;
            case "ten":
            default:
                orderColumn = "ldt.Ten";
                break;
        }

        String direction = (sortDir != null && sortDir.equalsIgnoreCase("asc")) ? "ASC" : "DESC";

        // Luôn có WHERE cơ bản
        String whereClause = "WHERE 1=1";
        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();
        if (hasKeyword) {
            whereClause += " AND (LOWER(ldt.Ten) LIKE LOWER(?) OR LOWER(ldt.Id) LIKE LOWER(?))";
        }

        String sql = """
        SELECT ldt.Id,
               ldt.Ten,
               ldt.TangGiam
        FROM LyDoTang AS ldt
        %s
        ORDER BY %s %s
        LIMIT ? OFFSET ?
        """.formatted(whereClause, orderColumn, direction);

        if (hasKeyword) {
            String searchPattern = "%" + keyword.trim() + "%";
            return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(LyDoTang.class),
                    searchPattern, searchPattern, limit, offset);
        } else {
            return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(LyDoTang.class),
                    limit, offset);
        }
    }

    // Thay method countAll hiện tại bằng cái này
    public long countAll(String keyword) {
        String whereClause = "WHERE 1=1";
        if (keyword != null && !keyword.trim().isEmpty()) {
            whereClause += " AND (LOWER(Ten) LIKE LOWER(?) OR LOWER(Id) LIKE LOWER(?))";
        }

        String sql = "SELECT COUNT(*) FROM LyDoTang " + whereClause;

        if (keyword != null && !keyword.trim().isEmpty()) {
            String searchPattern = "%" + keyword.trim() + "%";
            return jdbcTemplate.queryForObject(sql, Long.class, searchPattern, searchPattern);
        } else {
            return jdbcTemplate.queryForObject(sql, Long.class);
        }
    }

    public List<LyDoTang> findAll() {
        String sql = "SELECT * FROM LyDoTang";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(LyDoTang.class));
    }

    public LyDoTang findById(String id) {
        String sql = "SELECT * FROM LyDoTang WHERE Id = ?";
        return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(LyDoTang.class), id);
    }

    public int insert(LyDoTang lyDoTang) {
        // Kiểm tra id không null và không empty
        if (lyDoTang.getId() == null || lyDoTang.getId().trim().isEmpty()) {
            throw new IllegalArgumentException("Id không được null hoặc rỗng");
        }

        // Kiểm tra xem record có tồn tại không
        String checkSql = "SELECT COUNT(*) FROM LyDoTang WHERE Id = ?";
        int count = jdbcTemplate.queryForObject(checkSql, Integer.class, lyDoTang.getId());
        
        if (count > 0) {
            // Nếu tồn tại thì update
            return update(lyDoTang);
        } else {
            // Nếu chưa tồn tại thì insert
            String sql = "INSERT INTO LyDoTang (Id, Ten, TangGiam) VALUES (?, ?,?)";
            return jdbcTemplate.update(sql, lyDoTang.getId(), lyDoTang.getTen(), lyDoTang.getTangGiam());
        }
    }

    public int update(LyDoTang lyDoTang) {
        String sql = "UPDATE LyDoTang SET Ten=?, TangGiam=? WHERE Id=?";
        return jdbcTemplate.update(sql, lyDoTang.getTen(), lyDoTang.getTangGiam(), lyDoTang.getId());
    }

    public int delete(String id) {
        String sql = "DELETE FROM LyDoTang WHERE Id=?";
        return jdbcTemplate.update(sql, id);
    }

    public int insertBatch(List<LyDoTang> lyDoTangs) {
        String sql = "INSERT INTO LyDoTang (Id, Ten, TangGiam) VALUES (?, ?,?) " +
                "ON DUPLICATE KEY UPDATE " +
                "Ten = VALUES(Ten)";

        int[] results = jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                LyDoTang lyDoTang = lyDoTangs.get(i);
                ps.setString(1, lyDoTang.getId());
                ps.setString(2, lyDoTang.getTen());
                ps.setInt(3,lyDoTang.getTangGiam());
            }

            @Override
            public int getBatchSize() {
                return lyDoTangs.size();
            }
        });
        return results.length;
    }

    public int updateBatch(List<LyDoTang> lyDoTangs) {
        String sql = "UPDATE LyDoTang SET Ten=?, TangGiam=? WHERE Id=?";
        int[] results = jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                LyDoTang lyDoTang = lyDoTangs.get(i);
                ps.setString(1, lyDoTang.getTen());
                ps.setInt(2,lyDoTang.getTangGiam());
                ps.setString(3, lyDoTang.getId());
            }

            @Override
            public int getBatchSize() {
                return lyDoTangs.size();
            }
        });
        return results.length;
    }

    public int deleteBatch(List<String> ids) {
        String sql = "DELETE FROM LyDoTang WHERE Id=?";
        int[] results = jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                ps.setString(1, ids.get(i));
            }

            @Override
            public int getBatchSize() {
                return ids.size();
            }
        });
        return results.length;
    }




    public int deleteAll() {
        String sql = "DELETE FROM LyDoTang";
        return jdbcTemplate.update(sql);
    }



}
