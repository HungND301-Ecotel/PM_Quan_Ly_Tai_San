package com.ecotel.quanlytaisan.repository;

import com.ecotel.quanlytaisan.model.LichTrinh;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LichTrinhRepository extends JpaRepository<LichTrinh, String>, JpaSpecificationExecutor<LichTrinh> {
    @Query("SELECT SUM(COALESCE(ct.ca1, 0) + COALESCE(ct.ca2, 0) + COALESCE(ct.ca3, 0)) " +
           "FROM LichTrinh lt JOIN lt.chiTietLichTrinhs ct " +
           "WHERE lt.idTaiSan = :idTaiSan " +
           "AND (lt.nam < :nam OR (lt.nam = :nam AND lt.thang < :thang))")
    Integer sumHoursBefore(@Param("idTaiSan") String idTaiSan, @Param("nam") Integer nam, @Param("thang") Integer thang);

     @Query("SELECT lt.idTaiSan AS idTaiSan, " +
           "COALESCE(SUM(COALESCE(ct.ca1,0)+COALESCE(ct.ca2,0)+COALESCE(ct.ca3,0)), 0) AS tongGio " +
           "FROM LichTrinh lt JOIN lt.chiTietLichTrinhs ct " +
           "WHERE lt.idTaiSan IN :idTaiSanList " +
           "GROUP BY lt.idTaiSan")
    List<SumGioProjection> sumGioHoatDongGroupByTaiSan(@Param("idTaiSanList") List<String> idTaiSanList);

    interface SumGioProjection {
        String getIdTaiSan();
        Integer getTongGio();
    }
}
