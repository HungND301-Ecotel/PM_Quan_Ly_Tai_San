import { ActionType } from "../../../utils/const";

export interface AssetType {
  id: string;
  idLoaiTaiSan: string;
  tenTaiSan: string;
  nguyenGia: number;
  giaTriKhauHaoBanDau: number;
  kyKhauHaoBanDau: number;
  giaTriThanhLy: number;
  idMoHinhTaiSan: string;
  tenMoHinh?: string;
  phuongPhapKhauHao: number;
  soKyKhauHao: number;
  taiKhoanTaiSan: number;
  taiKhoanKhauHao: number;
  taiKhoanChiPhi: number;
  idNhomTaiSan: string;
  tenNhom?: string;
  tenLoai?: string;
  ngayVaoSo: string;
  ngaySuDung: string;
  tgKiemDinh?: string;
  chuKyKiemDinh?: number;
  idDuDan: string;
  tenDuAn?: string;
  idNguonVon: string;
  kyHieu: string;
  soKyHieu: string;
  congSuat: string;
  nuocSanXuat: string;
  namSanXuat: number;
  lyDoTang: string;
  hienTrang: number;
  tenHienTrang?: string;
  soLuong: number;
  donViTinh: string;
  tenDonViTinh?: string;
  ghiChu: string;
  idDonViBanDau: string;
  tenDonViBanDau?: string;
  idDonViHienThoi: string;
  tenDonViHienThoi?: string;
  idDonViQuanlyKiThuat?: string;
  tenDonViQuanlyKiThuat?: string;
  moTa: string;
  idCongTy: string;
  ngayTao: string;
  ngayCapNhat: string;
  nguoiTao: string;
  nguoiCapNhat: string;
  isActive: boolean;
  isTaiSanCon: boolean;
  isHeThong?: boolean;
  idLoaiTaiSanCon: string;
  tenLoaiTaiSanCon?: string;
  soThe: string;
  nvNS: number;
  vonVay: number;
  vonKhac: number;
  taiSanConList?: AssetChildType[];
  fileDinhKemList?: AssetFileType[];
  chuKySuaChuaList?: ChuKySuaChuaType[];
}

export interface ChuKySuaChuaType {
  id: string;
  idTaiSan: string;
  idLoaiSuaChua: string;
  chuKy: number;
  donViChuKy: string;
  isInserted?: boolean;
  isDeleted?: boolean;
}

export interface AssetFileType {
  id?: number;
  idTaiSan: string;
  filePath: string;
  tenFile: string;
  loai: number;
  ngayTao?: string;
  ghiChu?: string;
  action?: ActionType;
}
export interface AssetChildType {
  id: string;
  idTaiSanCon: string;
  idTaiSanCha: string;
  ngayTao: string;
  ngayCapNhat: string;
  nguoiTao: string;
  nguoiCapNhat: string;
  isActive: string;
  isDeleted?: boolean;
  isInsert?: boolean;
}

export interface HistoryAssetType {
  id: string;
  idBanGiaoTaiSan: string;
  idTaiSan: string;
  idDonViGiao: string;
  idDonViNhan: string;
  thoiGianBanGiao: string;
}

export interface AssetHoursType {
  id: string;
  idTaiSan: string;
  nam: string;
  thang: string;
  ngay: string;
  idDonVi: string;
  tenDonVi?: string;
  gioHoatDong: number;
  ketQuaHoatDong: string;
  gioNgungMay_HongMay: number;
  gioNgungMay_ChoDoi: number;
  gioNgungMay_MatDien: number;
  gioNgungMay_ThieuNguyenLieu: number;
  gioNgungMay_LyDoKhac: number;
  ghiChu: string;
  ngayTao: string;
  ngayCapNhat: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

export interface TransferHistoryData {
  id: string;
  thoiGianBanGiao: string;
  idDonViNhan: string;
  tenDonViNhan?: string;
  idDonViGiao?: string;
  tenDonViGiao?: string;
  idTaiSan?: string;
  tenTaiSan?: string;
}
export interface MaintenanceIncidentType {
  id: string;
  tuNgay: string;
  denNgay: string;
  loaiSuCo: string; // Loại sự cố, tai nạn, nội dung hư hỏng
  noiSuaChua: string;
  ghiChu?: string;
  isNew?: boolean;
  isDeleted?: boolean;
  isUpdated?: boolean;
}

// lịch trình


export interface AssetLichTrinhType {
  id?: string;
  idTaiSan: string;
  nam: number;
  thang: number;
  ghiChu?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
  nguoiTao?: string;
  nguoiCapNhat?: string;
  chiTietLichTrinhs?: AssetLichTrinhChiTietType[];
}

export interface AssetLichTrinhChiTietType {
  id?: string;
  idLichTrinh?: string;
  ngay: number;
  ca1?:number;
  ca2?:number;
  ca3?:number;
}


