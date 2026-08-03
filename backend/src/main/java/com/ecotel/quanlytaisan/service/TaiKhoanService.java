package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.dao.TaiKhoanDao;
import com.ecotel.quanlytaisan.dao.ChucVuDao;
import com.ecotel.quanlytaisan.model.TaiKhoan;
import com.ecotel.quanlytaisan.model.ChucVu;
import com.ecotel.quanlytaisan.model.UserPermission;
import com.ecotel.quanlytaisan.model.PageResponse;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class TaiKhoanService {

    @NonFinal
    @Value("${JWT_SECRET_KEY}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${JWT_SECRET_EXPIRATION}")
    protected long EXPIRATION;

    @NonFinal
    @Autowired
    private TaiKhoanDao taiKhoanDao;

    @NonFinal
    @Autowired
    private ChucVuDao chucVuDao;

    @NonFinal
    @Autowired
    private UserPermissionService userPermissionService;

    public List<TaiKhoan> getAll() {
        return taiKhoanDao.findAll();
    }

    public PageResponse<TaiKhoan> getAllPaged(int page, int size, String sortBy, String sortDir, String search) {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;
        
        long totalItems = taiKhoanDao.countAll(search);
        if (totalItems == 0) {
            return new PageResponse<>(List.of(), 0, page, size);
        }
        
        List<TaiKhoan> items = taiKhoanDao.findAllPaged(page, size, sortBy, sortDir, search);
        return new PageResponse<>(items, totalItems, page, size);
    }

    public TaiKhoan getById(String id) {
        return taiKhoanDao.findById(id);
    }

    public int create(TaiKhoan tk) {
        int result = taiKhoanDao.insert(tk);
        if (result > 0) {
            String chucVuId = taiKhoanDao.getChucVuIdByUsername(tk.getTenDangNhap());
            if (chucVuId != null) {
                ChucVu cv = chucVuDao.findById(chucVuId);
                if (cv != null && tk.getId() != null) {
                    syncPermissions(tk.getId(), cv);
                }
            }
        }
        return result;
    }

    public void syncPermissions(String userId, ChucVu cv) {
        Map<String, Boolean> pMap = new HashMap<>();
        pMap.put("NHANVIEN", cv.getQuanLyNhanVien() != null && cv.getQuanLyNhanVien());
        pMap.put("PHONGBAN", cv.getQuanLyPhongBan() != null && cv.getQuanLyPhongBan());
        pMap.put("DUAN", cv.getQuanLyDuAn() != null && cv.getQuanLyDuAn());
        pMap.put("NGUONVON", cv.getQuanLyNguonVon() != null && cv.getQuanLyNguonVon());
        pMap.put("MOHINHTAISAN", cv.getQuanLyMoHinhTaiSan() != null && cv.getQuanLyMoHinhTaiSan());
        pMap.put("NHOMTAISAN", cv.getQuanLyNhomTaiSan() != null && cv.getQuanLyNhomTaiSan());
        pMap.put("TAISAN", cv.getQuanLyTaiSan() != null && cv.getQuanLyTaiSan());
        pMap.put("CCDCVT", cv.getQuanLyCCDCVatTu() != null && cv.getQuanLyCCDCVatTu());
        pMap.put("DIEUDONG_TAISAN", cv.getDieuDongTaiSan() != null && cv.getDieuDongTaiSan());
        pMap.put("DIEUDONG_CCDC", cv.getDieuDongCCDCVatTu() != null && cv.getDieuDongCCDCVatTu());
        pMap.put("BANGIAO_TAISAN", cv.getBanGiaoTaiSan() != null && cv.getBanGiaoTaiSan());
        pMap.put("BANGIAO_CCDC", cv.getBanGiaoCCDCVatTu() != null && cv.getBanGiaoCCDCVatTu());
        pMap.put("BAOCAO", cv.getBaoCao() != null && cv.getBaoCao());

        List<UserPermission> userPerms = new ArrayList<>();
        for (Map.Entry<String, Boolean> entry : pMap.entrySet()) {
            UserPermission up = new UserPermission();
            up.setUserId(userId);
            up.setPermissionCode(entry.getKey());
            boolean val = entry.getValue();
            up.setCanCreate(val);
            up.setCanRead(val);
            up.setCanUpdate(val);
            up.setCanDelete(val);
            userPerms.add(up);
        }
        userPermissionService.setUserPermissionsBatch(userPerms);
    }

    public int update(TaiKhoan tk) {
        return taiKhoanDao.update(tk);
    }

    public int delete(String id) {
        return taiKhoanDao.delete(id);
    }

    public Map<String, Object> login(String tenDangNhap, String matKhau) {
        var queryResult=taiKhoanDao.login(tenDangNhap, matKhau);
        if (queryResult == null || queryResult.isEmpty()) {
            throw new RuntimeException("Tên đăng nhập hoặc mật khẩu không chính xác");
        }
        Map<String, Object> result = new HashMap<>(queryResult);
        var token=generateToken(tenDangNhap);
        result.put("token",token);

        System.out.println(result);
        return result;
    }
    public List<TaiKhoan> readCsv(MultipartFile file) throws IOException {
        List<TaiKhoan> list = new ArrayList<>();

        // Sử dụng InputStreamReader với UTF-8
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true; // bỏ qua header
            while ((line = br.readLine()) != null) {
                if (firstLine) {
                    firstLine = false;
                    continue;
                }
                String[] fields = line.split(",", -1); // giữ giá trị rỗng
                TaiKhoan ts = TaiKhoan.mapToTaiKhoan(fields); // map từ CSV sang object
                list.add(ts);
            }
        }
        return list;
    }


    public List<TaiKhoan> readExcel(MultipartFile file) throws IOException {
        List<TaiKhoan> list = new ArrayList<>();
        Workbook workbook = WorkbookFactory.create(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        boolean firstRow = true;
        for (Row row : sheet) {
            if (firstRow) { // bỏ qua header
                firstRow = false;
                continue;
            }
            TaiKhoan ts = TaiKhoan.mapToTaiKhoan(row); // map từ Row sang object
            list.add(ts);
        }
        workbook.close();
        return list;
    }

    public String generateToken(String username){
        Date now =new Date();
        Date expiration=new Date(now.getTime()+EXPIRATION);
        // TODO: Replace username-based scope with persisted role after RBAC implementation.
        String scope = username.equals("admin") ? "ADMIN" : "USER";
        JWSHeader header=new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet jwtClaimsSet=new JWTClaimsSet.Builder()
                .subject(username)
                .issuer("uongbi.com")
                .issueTime(new Date())
                .expirationTime(expiration)
                .claim("scope",scope)
                .build();

        Payload payload=new Payload(jwtClaimsSet.toJSONObject());
        JWSObject jwsObject=new JWSObject(header,payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
        } catch (JOSEException e) {
            log.error("Cannot create token",e);
            throw new RuntimeException(e);
        }
        return jwsObject.serialize();
    }
}
