import { ActionType, TypeBienBanType } from "../../../utils/const";

// sự cố
export interface IncidenData {
  id: string;
  idCongTy: string;
  idKeHoach: string;
  nhomTaiSan?: string;
  soPhieu: string;
  idDonViBaoCao: string;
  tenDonViBaoCao?: string;
  ngayPhatHien: string;
  tenHeThongThietBi: string;
  phanHeViTri: string;
  mucDo: number;
  moTa: string;
  idNguoiLap: string;
  nguoiLapXacNhan: boolean;
  idGiamDoc: string;
  giamDocXacNhan: boolean;
  share: boolean;
  trangThai: number;
  ngayTao: string;
  ngayCapNhat: string;
  nguoiTao: string;
  nguoiCapNhat?: string;
  daCoGiamDinh?: number;
  congTy?: string;
  tenMauBienBan?: string;
  danhSachTaiSan?: IncidenDetailData[];
  nguoiKyList?: any[];
}

export interface IncidenDetailData {
  id?: string;
  idSuCo?: string;
  idTaiSan: string;
  thuocHeThong: string;
  tinhTrang: string;
  idDonViQuanLyKyThuat: string;
  viTri?: string;
  soLuong?: number;
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;
  tenTaiSan?: string;
  donViTinh?: string;
  tenNhomTaiSan?: string;
  tenDonViQuanLyKyThuat?: string;
  daKiemTraSuCo?: number;
  action?: ActionType;
}

// sửa chữa

export interface MaintenanceRepairData {
  id?: string;
  idCongTy?: string;
  idGiamDinh?: string;
  donViQuanLy?: string;
  donViGiamSat?: string;
  gioHoatDong?: string;
  loaiSuaChua?: string;
  tinhTrang?: string;
  nhanCongThucHien?: string;
  thoiGian?: string;
  diaDiem?: string;
  ngayBaoDuongGanNhat?: string;
  idNguoiLap?: string;
  nguoiLapXacNhan?: boolean;
  idGiamDoc?: string;
  giamDocXacNhan?: boolean;
  share?: boolean;
  trangThai?: number;
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;
  tenMauBienBan?: string;
  congTy?: string;

  tenDonViQuanLy?: string;
  tenDonViGiamSat?: string;
  tenGiamDoc?:string;
  tenNguoiLap?:string;
  tenLoaiSuaChua?:string;
  daCoPhieuGiaoViec?:number;
  ghiChuBienBan?:string;

  danhSachTaiSan?: MaintenanceRepairDetailData[];
  danhSachVatTu?: MaintenanceRepairMaterialData[];
  nguoiKyList?: any[];
}

export interface MaintenanceRepairDetailData {
  id?: string;
  idSuaChua?: string;
  idTaiSan?: string;
  tenTaiSan?: string;
  idChiTietGiamDinh?: string;
}

export interface MaintenanceRepairMaterialData {
  id?: string;
  idSuaChua?: string;
  idVatTu?: string;
  idChiTietVatTu?: string;
  soLuong?: number;
  ghiChu?: string;
  // Extras for UI
  tenVatTu?: string;
  donViTinh?: string;
}

export interface JobAssignmentData {
  id?: string;
  idSuaChua?: string;
  soPhieu?: string;
  donViQuanLy?: string;
  caBatDau?: number;
  ngayBatDau?: string;
  caDuKien?: number;
  ngayDuKien?: string;

  idNguoiLap?: string;
  nguoiLapXacNhan?: boolean;
  idGiamDoc?: string;
  giamDocXacNhan?: boolean;
  share?: boolean;
  trangThai?: number;

  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;

  // View fields
  tenNguoiLap?: string;
  tenGiamDoc?: string;
  tenDonViQuanLy?: string;
  ghiChuBienBan?: string;
  daCoPhieuLinhVatTu?:number;

  danhSachTaiSan?: JobAssignmentAssetData[];
  danhSachVatTu?: JobAssignmentMaterialData[];
  nguoiKyList?: any[];
  chuKyList?: any[];
}

export interface JobAssignmentAssetData {
  id?: string;
  idPhieuGiaoViec?: string;
  idSuaChuaChiTiet?: string;
  idTaiSan?: string;
  tenTaiSan?: string;
  maCongViec?: string;
  noiDung?: string;
  nguoiThucHien?: string;
  tenNguoiThucHien?: string;
}

export interface JobAssignmentMaterialData {
  id?: string;
  idPhieuGiaoViec?: string;
  idVatTu?: string;
  idChiTietVatTu?: string;
  soLuong?: number;
  ghiChu?: string;

  // View fields
  tenVatTu?: string;
  donViTinh?: string;
  kyHieu?: string;
}

// Đánh giá vật tư thu hồi
export interface DanhGiaVatTuData {
  id?: string;
  idNghiemThu?: string;
  quyetDinhSo?: string;
  canCuHoSo?: string;
  ngayDanhGia?: string;
  diaDiem?: string;
  idDonViDanhGia?: string;
  tenDonViDanhGia?: string;

  // Ký duyệt
  idNguoiLap?: string;
  tenNguoiLap?: string;
  nguoiLapXacNhan?: boolean;
  idGiamDoc?: string;
  tenGiamDoc?: string;
  giamDocXacNhan?: boolean;

  share?: boolean;
  trangThai?: number;
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;

  danhSachChiTiet?: DanhGiaVatTuChiTietData[];
  nguoiKyList?: any[];
}

export interface DanhGiaVatTuChiTietData {
  id?: string;
  idDanhGia?: string;
  idVatTu?: string;
  idChiTietVatTu?: string;
  tenVatTu?: string;
  donViTinh?: string;
  soLuong?: number;
  khoiLuong?: number;
  chatLuongConLai?: number;
  donGia?: number;
  giaTriConLai?: number;
  ghiChu?: string;
}

// Kiểm tra sự cố
export interface IncidentInspectionData {
  id?: string;
  idCongTy?: string;
  idSuCo?: string;
  soPhieu?: string;
  ngayKiemTra?: string;
  viTri?: string;
  nhanXetKetLuan?: string;
  bienPhapXuLy?: string;

  idNguoiLap?: string;
  tenNguoiLap?: string;
  nguoiLapXacNhan?: boolean;
  idGiamDoc?: string;
  tenGiamDoc?: string;
  giamDocXacNhan?: boolean;

  share?: boolean;
  trangThai?: number;
  daCoGiamDinh?: number;
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;

  tenMauBienBan?: string;
  congTy?: string;

  danhSachChiTiet?: IncidentInspectionDetailData[];
  nguoiKyList?: any[];
}

export interface IncidentInspectionVatTuData {
  id?: string;
  idChiTietKiemTraSuCo?: string;
  idVatTu?: string;
  idChiTietVatTu?: string;
  soLuong?: number;
  tinhTrang?: string;
  soLuongSuaChua?: number;
  soLuongThayMoi?: number;
  ghiChu?: string;

  // View fields
  tenVatTu?: string;
  donViTinh?: string;

  action?: any;
}

export interface IncidentInspectionDetailData {
  id?: string;
  idKiemTraSuCo?: string;
  idTaiSan?: string;
  idSuCoChiTiet?: string;

  // Enrich
  maTaiSan?: string;
  tenTaiSan?: string;
  donViTinh?: string;

  danhSachVatTu?: IncidentInspectionVatTuData[];
  action?: any;
}

// quy trình sửa chữa
export interface QuyTrinhSuaChuaData {
  idSuaChuaChiTiet: string;
  thietBi: string;
  thietBiId: string;
  lenhSuaChua: string;
  idSuaChua: string;
  trangThaiSuaChua: number;
  bienBanGiamDinh: string;
  idGiamDinhMayMoc: string;
  trangThaiGiamDinh: number;
  phieuNghiemThu: string;
  idNghiemThu: string;
  trangThaiNghiemThu: number;
  trangThai: number;
}

// Biện pháp sửa chữa máy móc
export interface BienPhapMayMocData {
  id?: string;
  idCongTy?: string;
  idGiamDinhMayMoc?: string; // FK -> giamdinh_maymoc

  soPhieu?: string; // Số phiếu
  soDeNghi?: string; // Số đề nghị
  donViSuaChua?: string; // Đơn vị sửa chữa
  donViPhoiHop?: string; // Đơn vị phối hợp
  hinhThuc?: string; // Hình thức sửa chữa
  thoiGianBatDau?: string; // Thời gian bắt đầu
  thoiGianKetThuc?: string; // Thời gian kết thúc
  thoiGianNgay?: number; // Số ngày
  ghiChu?: string; // Ghi chú

  // File đính kèm
  tenFile?: string;
  duongDanFile?: string;

  // Luồng ký
  idNguoiLap?: string;
  tenNguoiLap?: string;
  nguoiLapXacNhan?: boolean;
  idGiamDoc?: string;
  tenGiamDoc?: string;
  giamDocXacNhan?: boolean;
  share?: boolean;
  trangThai?: number; // 0:nháp 1:đang duyệt 2:hủy 3:hoàn thành

  // Audit
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;

  tenMauBienBan?: string;
  congTy?: string;

  // Join
  soPhieuGiamDinhMayMoc?: string;
  nguoiKyList?: any[];
  chuKyList?: any[];
}

export interface BienPhapPhuongTienData {
  id?: string;
  idCongTy?: string;
  soBienBan?: string;
  idTaiSan?: string;
  mucDich?: string;
  yeuCau?: string;
  tinhTrangHienTai?: string;
  noiDungThucHien?: string;
  tienDoTuNgay?: string;
  tienDoDenNgay?: string;
  bienPhapAnToan?: string;
  idGiamDinhPhuongTien?: string;
  donViQuanLy?: string;

  // Luồng ký / Trạng thái
  idNguoiLap?: string;
  nguoiLapXacNhan?: boolean;
  idGiamDoc?: string;
  giamDocXacNhan?: boolean;
  share?: boolean;
  trangThai?: number;

  // Audit
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;

  tenMauBienBan?: string;
  congTy?: string;

  // Join fields
  tenNguoiLap?: string;
  tenGiamDoc?: string;
  tenTaiSan?: string;
  soPhieuSuCo?: string;
  daCoNghiemThu?: number;

  danhSachChiTiet?: BienPhapPhuongTienChiTietData[];
  nguoiKyList?: any[];
  chuKyList?: any[];
}

export interface BienPhapPhuongTienChiTietData {
  id?: string;
  idBienPhap?: string;
  idVatTu?: string;
  idChiTietVatTu?: string;
  soLuongCap?: number;
  soLuongThuHoi?: number;
  ghiChu?: string;

  // Join fields từ CCDCVatTu
  tenVatTu?: string;
  donViTinh?: string;
  action?: ActionType;
}

// nghiệm thu phương tiện
export interface NghiemThuPhuongTienData {
  id?: string;
  idCongTy?: string;
  idBienPhapPhuongTien?: string;
  idGiamDinhPhuongTien?: string;
  idTaiSan?: string;

  // Thông tin chính
  soPhieu?: string;
  noiDung?: string;
  tinhTrang?: string;
  congViecPhatSinh?: string;
  chiPhiNhanCong?: number;
  ketLuan?: string;

  // Luồng ký / Trạng thái
  idNguoiLap?: string;
  nguoiLapXacNhan?: boolean;
  idGiamDoc?: string;
  giamDocXacNhan?: boolean;
  share?: boolean;
  trangThai?: number;

  // Audit
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;

  // Join fields
  tenNguoiLap?: string;
  tenGiamDoc?: string;
  tenTaiSan?: string;
  soPhieuBienPhapPhuongTien?: string;

  tenMauBienBan?: string;
  congTy?: string;

  danhSachChiTiet?: NghiemThuPhuongTienChiTietData[];
  nguoiKyList?: any[];
  chuKyList?: any[];
}

export interface NghiemThuPhuongTienChiTietData {
  id?: string;
  idNghiemThuPhuongTien?: string;
  idChiTietVatTu?: string;
  idVatTu?: string;

  soLuongThayThe?: number;
  soLuongThuHoi?: number;
  phanTramConLai?: number;
  bienPhapXuLy?: string;
  ghiChu?: string;

  // View fields
  tenVatTu?: string;
  donViTinh?: string;
}

export interface PlanSigner {
  id: string;
  idTaiLieu: string;
  idNguoiKy: string;
  tenNguoiKy: string;
  idPhongBan: string;
  trangThai: number;
}

// kế hoạch
export interface MaintenancePlanData {
  id: string;
  idCongTy: string;
  soKeHoach: string;
  tenKeHoach: string;
  soQuyetDinh?: string;
  idLoaiKeHoach: string;
  idLoaiSuaChua: string;
  nam: number;
  nhomTaiSan?: string;
  idDonViGiao: string;
  idDonViNhan: string;
  tenDonViGiao?: string;
  tenDonViNhan?: string;
  idNguoiLapBieu: string;
  tenNguoiLapBieu?: string;
  nguoiLapBieuXacNhan: boolean;
  idTrinhDuyetGiamDoc: string;
  tenTrinhDuyetGiamDoc?: string;
  trinhDuyetGiamDocXacNhan: boolean;
  trangThai: number;
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;
  ghiChu?: string;
  duongDanFile?: string;
  tenFile?: string;
  ngayKy?: string;
  duongDanTaiLieuBangKe?: string;
  share: boolean;
  byStep: boolean;
  danhSachTaiSan?: MaintenancePlanAssetItem[];
  nguoiKyList?: any[];
  soLuongSuCo?: number;
  tenMauBienBanSuaChua?: string;
  coQuanDong1?: string;
  coQuanDong2?: string;
  coQuanDong3?: string;
  tieuDe1?: string;
  tieuDe2?: string;
}

export interface MaintenancePlanAssetItem {
  id?: string;
  idKeHoachSuaChua: string;
  idTaiSan: string;
  idNhomTaiSan?: string;
  idLoaiTaiSan?: string;
  idDonViBaoTri?: string;
  soLuong?: number;
  tenTaiSan?: string;
  tenNhom?: string;
  donViTinh?: string;
  ghiChu?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
  isActive?: boolean;
  capSuaChuaThang1?: string;
  capSuaChuaThang2?: string;
  capSuaChuaThang3?: string;
  capSuaChuaThang4?: string;
  capSuaChuaThang5?: string;
  capSuaChuaThang6?: string;
  capSuaChuaThang7?: string;
  capSuaChuaThang8?: string;
  capSuaChuaThang9?: string;
  capSuaChuaThang10?: string;
  capSuaChuaThang11?: string;
  capSuaChuaThang12?: string;

  capSuaChua?: string;
  daCoBienBan?: number;

  action?: ActionType;
}

//giám định
export interface InspectionRecordData {
  id?: string;
  idCongTy?: string;
  congTy?: string;
  tenMauBienBan?: string;
  idBaoCaoKyThuat?: string;
  ngayGiamDinh?: string;
  donViGiamDinh?: string;
  noiDung?: string;
  ghiChuBienBan?: string;

  // Người lập phiếu
  idNguoiLap?: string;
  nguoiLapXacNhan?: boolean;

  // Giám đốc duyệt
  idGiamDoc?: string;
  giamDocXacNhan?: boolean;

  // Workflow & trạng thái
  share?: boolean;
  trangThai?: number; // 0:nháp, 1:duyệt, 2:hủy, 3:hoàn thành

  // Audit
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;

  // Join fields
  tenNguoiLap?: string;
  tenGiamDoc?: string;
  soPhieuBienBan?: string;
  daCoBienPhap?: number;
  daCoNghiemThu?: number;

  // Danh sách chi tiết
  danhSachChiTiet?: InspectionRecordDetailData[];

  // Workflow tracking
  chuKyList?: any[];
  nguoiKyList?: any[];
}

export interface InspectionRecordDetailData {
  id?: string;
  idGiamDinh?: string;
  idBaoCaoKyThuatChiTiet?: string;
  idTaiSan?: string;
  tenTaiSan?: string;
  donViTinh?: string;
  soLuong?: number;
  tinhTrang?: string;
  thayMoi?: number;
  suaChua?: number;
  ghiChu?: string;
  noiDungCongViec?: string;
}

// nghiệm thu

export interface AcceptanceTestRecordData {
  id?: string;
  idCongTy?: string;
  idBienPhapMayMoc?: string;
  idGiamDinhMayMoc?: string;
  soPhieu?: string;
  ngayNghiemThu?: string;
  viTri?: string;
  tenThietBi?: string;
  soDangKi?: string;
  capSuaChua?: string;
  ketQua?: string;
  noiDung?: string;
  idNguoiLap?: string;
  nguoiLapXacNhan?: boolean;
  idGiamDoc?: string;
  giamDocXacNhan?: boolean;
  share?: boolean;
  trangThai?: number;
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;
  tenNguoiLap?: string;
  tenGiamDoc?: string;
  soPhieuBienPhapMayMoc?: string;
  tenMauBienBan?: string;
  congTy?: string;
  daCoPhieuDanhGia?: number;
  danhSachTaiSan?: AcceptanceTestRecordAssetData[];
  chuKyList?: any[];
  nguoiKyList?: any[];
}

export interface AcceptanceTestRecordAssetData {
  id?: string;
  idBienBan?: string;
  idTaiSan?: string;
  idChiTietGiamDinhMayMoc?: string;
  tenTaiSan?: string;
  donViTinh?: string;
  danhSachVatTu?: AcceptanceTestRecordToolData[];
  action?: ActionType;
}
export interface AcceptanceTestRecordToolData {
  id?: string;
  idBienBanTaiSan?: string;
  idChiTietVatTu?: string;
  soLuong?: number;
  ghiChu?: string;
  idVatTu?: string;
  tenVatTu?: string;
  donViTinh?: string;
  action?: ActionType;
}

// biện pháp phương tiện
export interface BienPhapPhuongTienData {
  id?: string;
  idCongTy?: string;
  soBienBan?: string;
  idTaiSan?: string;
  mucDich?: string;
  yeuCau?: string;
  tinhTrangHienTai?: string;
  noiDungThucHien?: string;
  tienDoTuNgay?: string;
  tienDoDenNgay?: string;
  bienPhapAnToan?: string;
  idGiamDinhPhuongTien?: string;

  // Luồng ký / Trạng thái
  idNguoiLap?: string;
  nguoiLapXacNhan?: boolean;
  idGiamDoc?: string;
  giamDocXacNhan?: boolean;
  share?: boolean;
  trangThai?: number;

  // Audit
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;

  // Join fields
  tenNguoiLap?: string;
  tenGiamDoc?: string;
  tenTaiSan?: string;
  soPhieuSuCo?: string;
  daCoNghiemThu?: number;

  danhSachChiTiet?: BienPhapPhuongTienChiTietData[];
  nguoiKyList?: any[];
  chuKyList?: any[];
}

export interface BienPhapPhuongTienChiTietData {
  id?: string;
  idBienPhap?: string;
  idVatTu?: string;
  idChiTietVatTu?: string;
  soLuongCap?: number;
  soLuongThuHoi?: number;
  ghiChu?: string;

  // Join fields từ CCDCVatTu
  tenVatTu?: string;
  donViTinh?: string;
  action?: ActionType;
}

// Báo cáo kỹ thuật
export interface TechnicalReportData {
  id?: string;
  idCongTy?: string;
  congTy?: string;
  tenMauBienBan?: string;
  soPhieu?: string;
  idKeHoach?: string;
  thang?: number;
  nam?: number;
  donViBaoCao?: string;
  donViNhan?: string;
  tenTaiSan?: string;
  ngayBaoDuongGanNhat?: string;
  tinhTrang?: string;
  noiDungSuaChua?: string;
  ghiChu?: string;
  ghiChuBienBan?: string;
  daCoGiamDinh?: number;

  idNguoiLap?: string;
  nguoiLapXacNhan?: boolean;
  idGiamDoc?: string;
  giamDocXacNhan?: boolean;
  share?: boolean;
  trangThai?: number;

  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;

  tenNguoiLap?: string;
  tenGiamDoc?: string;
  tenKeHoach?: string;
  tenDonViBaoCao?: string;
  tenDonViNhan?: string;

  danhSachTaiSan?: TechnicalReportDetailData[];
  chuKyList?: any[];
  nguoiKyList?: any[];
}

export interface TechnicalReportDetailData {
  id?: string;
  idBaoCaoKyThuat?: string;
  idTaiSan?: string;
  idKeHoachChiTiet?: string;

  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;

  tenTaiSan?: string;
  donViTinh?: string;
  nhomTaiSan?: string;
  donViQuanLy?: string;
  action?: ActionType;
}

// Biên bản nghiệm thu (từ phiếu lĩnh vật tư)
export interface NghiemThuData {
  id?: string;
  idBienBan?: string;
  donViQuanLy?: string;
  noiDungSuaChua?: string;
  ketQua?: string;

  idNguoiLap?: string;
  nguoiLapXacNhan?: boolean;
  idGiamDoc?: string;
  giamDocXacNhan?: boolean;
  share?: boolean;
  trangThai?: number;

  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;

  tenDonViQuanLy?: string;
  tenNguoiLap?: string;
  tenGiamDoc?: string;
  tenMauBienBan?: string;
  congTy?: string;

  danhSachTaiSan?: NghiemThuChiTietTaiSanData[];
  danhSachVatTu?: NghiemThuChiTietVatTuData[];
  chuKyList?: any[];
  nguoiKyList?: any[];
}

export interface NghiemThuChiTietTaiSanData {
  id?: string;
  idNghiemThu?: string;
  idTaiSan?: string;
  tenTaiSan?: string;
  maCongViec?: string;
  noiDung?: string;
  soLuong?: number;
  ghiChu?: string;
}

export interface NghiemThuChiTietVatTuData {
  id?: string;
  idNghiemThu?: string;
  idVatTu?: string;
  idChiTietVatTu?: string;
  kyHieu?: string;
  tenVatTu?: string;
  donViTinh?: string;
  soLuongThayThe?: number;
  soLuongThuHoi?: number;
  ghiChu?: string;
}
