export const PlanAdapter = (s: any) => ({
  ...s,
  id: s.id,
  moTa: s.tenKeHoach,
  idTrinhDuyetGiamDoc: s.idTrinhDuyetGiamDoc,
  idNguoiLapBieu: s.idNguoiLapBieu,
  ngayTao: s.ngayTao,
  trangThai: s.trangThai,
});

export const MaterialRequisitionAdapter = (s: any) => ({
  ...s,
  id: s.id,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
});

export const TechnicalReportAdapter = (s: any) => ({
  ...s,
  id: s.id,
  planId: s.idKeHoach,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
});

export const IncidentAdapter = (s: any) => ({
  ...s,
  id: s.id,
  planId: s.idKeHoach,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
  moTa: s.moTa,
  ngayTao: s.ngayTao,
  trangThai: s.trangThai,
});

export const RepairAdapter = (s: any) => ({
  ...s,
  id: s.id,
  idGiamDinh: s.idGiamDinh,
  planId: s.idKeHoach,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
  moTa: s.ghiChu,
  ngayTao: s.ngayTao,
  trangThai: s.trangThai,
});

export const InspectionAdapter = (s: any) => ({
  ...s,
  id: s.id,
  planId: s.idKeHoach,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
  moTa: s.ghiChu,
  ngayTao: s.ngayTao,
  trangThai: s.trangThai,
  daCoNghiemThu: s.daCoNghiemThu,
});

export const AcceptanceTestAdapter = (s: any) => ({
  ...s,
  id: s.id,
  idBienPhapMayMoc: s.idBienPhapMayMoc,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
  moTa: s.noiDung,
  ngayTao: s.ngayTao,
  trangThai: s.trangThai,
});

export const MaterialAssessmentAdapter = (s: any) => ({
  ...s,
  id: s.id,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
  ngayTao: s.ngayTao,
  trangThai: s.trangThai,
});

export const IncidentInspectionAdapter = (s: any) => ({
  ...s,
  id: s.id,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
  moTa: s.nhanXetKetLuan,
  ngayTao: s.ngayTao,
  trangThai: s.trangThai,
});

export const BienPhapMayMocAdapter = (s: any) => ({
  ...s,
  id: s.id,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  idGiamDinh: s.idGiamDinhMayMoc,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
  ngayTao: s.ngayTao,
  trangThai: s.trangThai,
  daCoNghiemThu: s.daCoNghiemThu,
});

export const BienPhapPhuongTienAdapter = (s: any) => ({
  ...s,
  id: s.id,
  soPhieu: s.soBienBan,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
  idGiamDinh: s.idGiamDinhPhuongTien,
  ngayTao: s.ngayTao,
  trangThai: s.trangThai,
  daCoNghiemThu: s.daCoNghiemThu,
});

export const NghiemThuPhuongTienAdapter = (s: any) => ({
  ...s,
  id: s.id,
  idBienPhapPhuongTien: s.idBienPhapPhuongTien,
  idTaiSan: s.idTaiSan,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
  moTa: s.noiDung,
  ngayTao: s.ngayTao,
  trangThai: s.trangThai,
});
export const JobAssignmentAdapter = (s: any) => ({
  ...s,
  id: s.id,
  idTrinhDuyetGiamDoc: s.idGiamDoc,
  tenTrinhDuyetGiamDoc: s.tenGiamDoc,
  trinhDuyetGiamDocXacNhan: s.giamDocXacNhan,
  idNguoiLapBieu: s.idNguoiLap,
  tenNguoiLapBieu: s.tenNguoiLap,
  nguoiLapBieuXacNhan: s.nguoiLapXacNhan,
});
