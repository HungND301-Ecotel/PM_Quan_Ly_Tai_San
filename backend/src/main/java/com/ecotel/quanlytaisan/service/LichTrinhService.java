package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.repository.LichTrinhRepository;
import com.ecotel.quanlytaisan.exception.ResourceNotFoundException;
import com.ecotel.quanlytaisan.model.ChiTietLichTrinh;
import com.ecotel.quanlytaisan.model.LichTrinh;
import com.ecotel.quanlytaisan.model.LichTrinhDTO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LichTrinhService {

    @Autowired
    private LichTrinhRepository lichTrinhRepository;

    public List<LichTrinhDTO> getAll(String idTaiSan, Integer nam, Integer thang, String sortBy, String sortDir) {
        String normalizedSortBy = sortBy != null && !sortBy.trim().isEmpty() ? sortBy.trim() : "ngayTao";
        Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("asc")) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, normalizedSortBy);

        Specification<LichTrinh> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (idTaiSan != null && !idTaiSan.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("idTaiSan"), idTaiSan));
            }
            if (nam != null) {
                predicates.add(cb.equal(root.get("nam"), nam));
            }
            if (thang != null) {
                predicates.add(cb.equal(root.get("thang"), thang));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<LichTrinh> lichTrinhs = lichTrinhRepository.findAll(spec, sort);

        return lichTrinhs.stream().map(lt -> {
            LichTrinhDTO dto = new LichTrinhDTO();
            BeanUtils.copyProperties(lt, dto);
            dto.setChiTietLichTrinhs(lt.getChiTietLichTrinhs() != null ? lt.getChiTietLichTrinhs() : new ArrayList<>());
            
            Integer sumBefore = lichTrinhRepository.sumHoursBefore(lt.getIdTaiSan(), lt.getNam(), lt.getThang());
            dto.setLuyKeTruoc(sumBefore != null ? sumBefore : 0);
            
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public int createBatch(List<LichTrinhDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return 0;

        List<LichTrinh> lichTrinhs = new ArrayList<>();

        for (LichTrinhDTO dto : dtos) {
            LichTrinh lt = new LichTrinh();
            BeanUtils.copyProperties(dto, lt);
            
            if (lt.getId() == null || lt.getId().isEmpty()) {
                lt.setId(UUID.randomUUID().toString());
            }

            if (dto.getChiTietLichTrinhs() != null) {
                List<ChiTietLichTrinh> chiTiets = new ArrayList<>();
                for (ChiTietLichTrinh ct : dto.getChiTietLichTrinhs()) {
                    if (ct.getId() == null || ct.getId().isEmpty()) {
                        ct.setId(UUID.randomUUID().toString());
                    }
                    ct.setLichTrinh(lt);
                    chiTiets.add(ct);
                }
                lt.setChiTietLichTrinhs(chiTiets);
            }
            lichTrinhs.add(lt);
        }

        lichTrinhRepository.saveAll(lichTrinhs);
        return lichTrinhs.size();
    }

    @Transactional
    public int updateBatch(List<LichTrinhDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return 0;

        List<LichTrinh> lichTrinhs = new ArrayList<>();

        for (LichTrinhDTO dto : dtos) {
            if (dto.getId() == null || dto.getId().isEmpty()) continue;

            LichTrinh lt = lichTrinhRepository.findById(dto.getId()).orElse(null);
            if (lt == null) continue;
            BeanUtils.copyProperties(dto, lt, "chiTietLichTrinhs");

            if (dto.getChiTietLichTrinhs() != null) {
                if (lt.getChiTietLichTrinhs() == null) {
                    lt.setChiTietLichTrinhs(new ArrayList<>());
                } else {
                    lt.getChiTietLichTrinhs().clear();
                }
                
                for (ChiTietLichTrinh ct : dto.getChiTietLichTrinhs()) {
                    if (ct.getId() == null || ct.getId().isEmpty()) {
                        ct.setId(UUID.randomUUID().toString());
                    }
                    ct.setLichTrinh(lt);
                    lt.getChiTietLichTrinhs().add(ct);
                }
            }
            lichTrinhs.add(lt);
        }

        lichTrinhRepository.saveAll(lichTrinhs);
        return lichTrinhs.size();
    }

    @Transactional
    public LichTrinhDTO create(LichTrinhDTO dto) {
        if (dto == null) return null;
        
        LichTrinh lt = new LichTrinh();
        BeanUtils.copyProperties(dto, lt);
        
        if (lt.getId() == null || lt.getId().isEmpty()) {
            lt.setId(UUID.randomUUID().toString());
        }

        if (dto.getChiTietLichTrinhs() != null) {
            List<ChiTietLichTrinh> chiTiets = new ArrayList<>();
            for (ChiTietLichTrinh ct : dto.getChiTietLichTrinhs()) {
                if (ct.getId() == null || ct.getId().isEmpty()) {
                    ct.setId(UUID.randomUUID().toString());
                }
                ct.setLichTrinh(lt);
                chiTiets.add(ct);
            }
            lt.setChiTietLichTrinhs(chiTiets);
        }
        
        lichTrinhRepository.save(lt);
        
        LichTrinhDTO savedDto = new LichTrinhDTO();
        BeanUtils.copyProperties(lt, savedDto);
        savedDto.setChiTietLichTrinhs(lt.getChiTietLichTrinhs() != null ? lt.getChiTietLichTrinhs() : new ArrayList<>());
        
        Integer sumBefore = lichTrinhRepository.sumHoursBefore(lt.getIdTaiSan(), lt.getNam(), lt.getThang());
        savedDto.setLuyKeTruoc(sumBefore != null ? sumBefore : 0);
        
        return savedDto;
    }

    @Transactional
    public LichTrinhDTO update(String id, LichTrinhDTO dto) {
        if (id == null || id.trim().isEmpty() || dto == null) return null;
        
        LichTrinh lt = lichTrinhRepository.findById(id).orElse(null);
        if (lt == null) {
            throw new ResourceNotFoundException("Không tìm thấy lịch trình để cập nhật");
        }
        
        BeanUtils.copyProperties(dto, lt, "id", "chiTietLichTrinhs");

        if (dto.getChiTietLichTrinhs() != null) {
            if (lt.getChiTietLichTrinhs() == null) {
                lt.setChiTietLichTrinhs(new ArrayList<>());
            } else {
                lt.getChiTietLichTrinhs().clear();
            }
            
            for (ChiTietLichTrinh ct : dto.getChiTietLichTrinhs()) {
                if (ct.getId() == null || ct.getId().isEmpty()) {
                    ct.setId(UUID.randomUUID().toString());
                }
                ct.setLichTrinh(lt);
                lt.getChiTietLichTrinhs().add(ct);
            }
        }
        
        lichTrinhRepository.save(lt);
        
        LichTrinhDTO updatedDto = new LichTrinhDTO();
        BeanUtils.copyProperties(lt, updatedDto);
        updatedDto.setChiTietLichTrinhs(lt.getChiTietLichTrinhs() != null ? lt.getChiTietLichTrinhs() : new ArrayList<>());
        
        Integer sumBefore = lichTrinhRepository.sumHoursBefore(lt.getIdTaiSan(), lt.getNam(), lt.getThang());
        updatedDto.setLuyKeTruoc(sumBefore != null ? sumBefore : 0);
        
        return updatedDto;
    }

    @Transactional
    public void delete(String id) {
        if (id == null || id.isEmpty()) return;
        lichTrinhRepository.deleteById(id);
    }

    @Transactional
    public int deleteBatch(List<String> ids) {
        if (ids == null || ids.isEmpty()) return 0;
        lichTrinhRepository.deleteAllById(ids);
        return ids.size();
    }

    public Integer getLuyKeTruoc(String idTaiSan, Integer nam, Integer thang) {
        Integer sum = lichTrinhRepository.sumHoursBefore(idTaiSan, nam, thang);
        return sum != null ? sum : 0;
    }
}
