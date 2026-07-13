import jsPDF from "jspdf";
import { findById, formatted, loadImage } from "../../../utils/helpers";
import { MaintenancePlanData } from "..//types";
import autoTable from "jspdf-autotable";
import "../../../assets/fonts/times_new_roman-normal";
import "../../../assets/fonts/times_new_roman-bold";
import "../../../assets/fonts/times_new_roman_italic-italic";
import { Chip } from "@mui/material";

import { IncidenData } from "../types";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../../components/Alert";
import { MessageTypeFunctions } from "../../../utils/const";
import socketService from "../../../services/socketService";
import { FileDownloadOutlined } from "@mui/icons-material";
import { currentBrandConfig } from "../../../config/brandConfig";
import dayjs from "dayjs";

export const PLAN_STATUS_CONFIG: Record<
  number,
  {
    label: string;
    color:
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "info"
      | "success"
      | "warning";
  }
> = {
  0: { label: "Chưa lập", color: "default" },
  1: { label: "Đã báo cáo", color: "info" },
  2: { label: "Đã giám định", color: "warning" },
  3: { label: "Đã lên lệnh sửa chữa", color: "error" },
  4: { label: "Đã giao việc", color: "success" },
  5: { label: "Đã lĩnh vật tư", color: "primary" },
  6: { label: "Đã nghiệm thu", color: "success" },
  7: { label: "Đã đánh giá", color: "success" },
  8: { label: "Đã quyết toán", color: "success" },
};

export const showShareStatus = (isShare: boolean, isMyCreated: boolean) => {
  return (
    <Chip
      label={isShare ? (isMyCreated ? "Đã gửi" : "Được gửi") : "Chưa gửi"}
      sx={{
        backgroundColor: isShare ? "#4caf50" : "#f30d0d",
        color: "white",
        fontWeight: 500,
        fontSize: "12px",
        borderRadius: "4px", // BorderRadius.circular(4)
        height: "auto",
        padding: "1px 5px", // EdgeInsets.symmetric(horizontal: 5, vertical: 1)
        mb: "2px", // margin: const EdgeInsets.only(bottom: 2)
        "& .MuiChip-label": {
          padding: 0,
        },
      }}
    />
  );
};

export const showDownloadFile = (fileName: string, onDownload: () => void) => {
  return (
    <Chip
      icon={
        <FileDownloadOutlined style={{ fontSize: "14px", color: "#388e3c" }} />
      }
      label={fileName || "File"}
      onClick={(e) => {
        e.stopPropagation();
        onDownload();
      }}
      variant="outlined"
      sx={{
        backgroundColor: "#f1f8e9", // Tương đương Colors.green.shade50
        color: "#388e3c", // Tương đương Colors.green.shade700
        borderColor: "#c8e6c9", // Tương đương Colors.green.shade200
        borderRadius: "6px", // BorderRadius.circular(6)
        height: "24px", // Chiều cao compact cho bảng
        fontSize: "11px",
        fontWeight: 500,
        cursor: "pointer",
        maxWidth: "100%",
        "& .MuiChip-label": {
          px: 1, // Padding horizontal cho text
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
        "&:hover": {
          backgroundColor: "#e8f5e9", // Hiệu ứng hover nhẹ
        },
      }}
    />
  );
};

// kiem tra quyền share
export const isCheckShowShare = (items: any[]) => {
  if (items.length === 0) {
    return false;
  }
  const hasSharedItems = items.some((e) => e.share === true);

  if (hasSharedItems) {
    return false;
  }

  return items.some((e) => e.share !== true);
};

//

/**
 * Lọc danh sách phiếu chưa trình duyệt và hiển thị thông báo nếu có phiếu đã trình duyệt rồi.
 */
const getNotSharedAndNotify = (items: any[]): any[] => {
  if (!items || items.length === 0) {
    showErrorAlert("Không có phiếu nào để trình duyệt");
    return [];
  }

  // Lọc phiếu đã trình duyệt và chưa trình duyệt
  const alreadyShared = items.filter((e) => e.share === true);
  const notShared = items.filter((e) => e.share !== true);

  // Trường hợp tất cả đều đã trình duyệt
  if (notShared.length === 0) {
    showErrorAlert("Các phiếu này đều đã được trình duyệt");
    return [];
  }

  // Thông báo nếu trong danh sách chọn có lẫn phiếu đã trình duyệt
  if (alreadyShared.length > 0) {
    const names = alreadyShared
      .map((e) => (e.tenPhieu?.trim() ? e.tenPhieu : e.id))
      .filter(Boolean)
      .join(", ");

    const message = names
      ? `Các phiếu đã được trình duyệt: ${names}`
      : "Có phiếu đã được trình duyệt trong danh sách chọn";

    showErrorAlert(message);
  }

  return notShared;
};

export const canUserSign = (newSigningType: number, images: any[]) => {
  // Kiểm tra xem tài liệu đã có chữ ký số (loaiKy = 3, 4, 5) chưa
  const hasDigitalSignature = images.some(
    (img) => img.loaiKy === 3 || img.loaiKy === 4 || img.loaiKy === 5,
  );

  // Nếu tài liệu đã có chữ ký số, chỉ cho phép ký số (loaiKy = 3, 4, 5)
  if (hasDigitalSignature) {
    if (newSigningType !== 3 && newSigningType !== 4 && newSigningType !== 5) {
      return false;
    }
  }

  // Chữ ký loại 1 (ký nháy) luôn được phép ký (nếu chưa có chữ ký số)
  if (newSigningType === 1) {
    return true;
  }

  // Lấy tất cả chữ ký mới của user hiện tại trong phiên này
  const userNewSignatures = images.filter((img) => !img.isLocked);
  // Nếu chưa có chữ ký mới nào, được phép ký
  if (userNewSignatures.length === 0) {
    return true;
  }

  // Kiểm tra xem đã có chữ ký loại khác 1 chưa
  const hasNonType1Signature = userNewSignatures.some(
    (img) => img.loaiKy !== 1,
  );

  // Nếu đã có chữ ký loại khác 1 (2, 3, 4, 5), không được ký thêm
  if (hasNonType1Signature) {
    return false;
  }

  // Nếu chỉ có chữ ký loại 1, được phép ký thêm
  return true;
};

export const handleSendToSigner = async (
  selectedItems: any[],
  onUpdate: (data: any[]) => Promise<any>,
  onClose: () => void,
) => {
  // 1. Kiểm tra rỗng
  if (!selectedItems || selectedItems.length === 0) {
    showErrorAlert("Không có phiếu nào để chia sẻ");
    return;
  }

  // 2. Hiển thị Dialog xác nhận (tương tự showConfirmDialog trong Flutter)
  const confirm = await showConfirmAlert(
    "Bạn có chắc muốn trình duyệt cho người ký?",
  );

  if (confirm.isConfirmed) {
    // 3. Lọc danh sách hợp lệ
    const notSharedItems = getNotSharedAndNotify(selectedItems);

    if (notSharedItems.length > 0) {
      try {
        const list = await listNguoiKy(selectedItems);
        await onUpdate(notSharedItems.map((e) => ({ ...e, share: true })));
        await socketService.send({
          type: MessageTypeFunctions.ASSET_TRANSFER,
          recieve: list,
        });
        showSuccessAlert("Trình duyệt phiếu thành công!");
        onClose();
      } catch (error) {
        showErrorAlert("Có lỗi xảy ra khi trình duyệt phiếu.");
      }
    }
  }
  onClose();
};

export const listNguoiKy = (selectedItems: any[]) => {
  const allIds = new Set<string>();
  for (var item of selectedItems) {
    const id1 = item?.idNguoiLapBieu || item?.idNguoiLap;
    const id2 = item?.idTrinhDuyetGiamDoc || item?.idGiamDoc;

    if (id1) allIds.add(id1);
    if (id2) allIds.add(id2);
    const signatories = item.nguoiKyList;
    if (signatories != null) {
      for (var s of signatories) {
        const sigId = s.idNguoiKy;
        if (sigId) allIds.add(sigId);
      }
    }
  }
  return Array.from(allIds);
};

const getStatusDetails = (status: number) => {
  switch (status) {
    case 0:
      return { label: "Nháp", color: "#9e9e9e" }; // Đỏ
    case 1:
      return { label: "Duyệt", color: "#ff9800" }; // Cam
    case 2:
      return { label: "Hủy", color: "#4caf50" }; // Xanh lá
    case 3:
      return { label: "Hoàn thành", color: "#68b9f0" }; // Xanh lá
    default:
      return { label: "Nháp", color: "#9e9e9e" }; // Xám
  }
};

export const showStatus = (status: number) => {
  const { label, color } = getStatusDetails(status);

  return (
    <Chip
      label={label}
      sx={{
        backgroundColor: color,
        color: "white",
        fontWeight: 500,
        fontSize: "12px",
        borderRadius: "4px", // BorderRadius.circular(4)
        height: "auto",
        padding: "1px 5px", // EdgeInsets.symmetric(horizontal: 5, vertical: 1)
        mb: "2px", // margin: const EdgeInsets.only(bottom: 2)
        "& .MuiChip-label": {
          padding: 0,
        },
      }}
    />
  );
};
// ── Severity color helper ─────────────────────────────────

const getSeverityDetails = (status: number) => {
  switch (status) {
    case 0:
      return { label: "Nhẹ", color: "#4caf50" }; // Đỏ
    case 1:
      return { label: "Trung bình", color: "#ff9800" }; // Cam
    case 2:
      return { label: "Nặng", color: "#f44336" }; // Xanh lá
    case 3:
      return { label: "Nghiêm trọng", color: "#9c27b0" }; // Xanh lá
    default:
      return { label: "Nhẹ", color: "#4caf50" }; // Xám
  }
};

export const showServerity = (status: number) => {
  const { label, color } = getSeverityDetails(status);

  return (
    <Chip
      label={label}
      sx={{
        backgroundColor: color,
        color: "white",
        fontWeight: 500,
        fontSize: "12px",
        borderRadius: "4px", // BorderRadius.circular(4)
        height: "auto",
        padding: "1px 5px", // EdgeInsets.symmetric(horizontal: 5, vertical: 1)
        mb: "2px", // margin: const EdgeInsets.only(bottom: 2)
        "& .MuiChip-label": {
          padding: 0,
        },
      }}
    />
  );
};

const getChucVu = (idUser: string, staffs: any[], positions: any[]) => {
  const nhanVien = findById(staffs, idUser);
  const chucVu = findById(positions, nhanVien?.chucVuId ?? "");
  return chucVu;
};
const getDonVi = (idUser: string, staffs: any[], departments: any[]) => {
  const nhanVien = findById(staffs, idUser);
  const donVi = findById(departments, nhanVien?.phongBanId ?? "");
  return donVi;
};

export const listSigneInfo = (
  item?: any,
  staffs: any[] = [],
  departments: any[] = [],
  positions: any[] = [],
) => {
  if (!item) return [];

  const result: any[] = [];

  if (item.idNguoiLapBieu) {
    result.push({
      idNhanVien: item.idNguoiLapBieu ?? "",
      title: "Người lập",
      hoTen: item.tenNguoiLapBieu ?? "",
      chucVu: getChucVu(item.idNguoiLapBieu ?? "", staffs, positions)
        ?.tenChucVu,
      idChucVu: getChucVu(item.idNguoiLapBieu ?? "", staffs, positions)?.id,
      donVi: getDonVi(item.idNguoiLapBieu ?? "", staffs, departments)
        ?.tenPhongBan,
      idDonVi: getDonVi(item.idNguoiLapBieu ?? "", staffs, departments)?.id,
      signed: item.nguoiLapBieuXacNhan || false,
    });
  }

  // ===== NGƯỜI KÝ BỔ SUNG =====
  if (item.nguoiKyList?.length) {
    for (let i = 0; i < item.nguoiKyList.length; i++) {
      const sign = item.nguoiKyList[i];
      result.push({
        idNhanVien: sign.idNguoiKy ?? "",
        hoTen: sign.tenNguoiKy ?? "",
        chucVu: getChucVu(sign.idNguoiKy ?? "", staffs, positions)?.tenChucVu,
        idChucVu: getChucVu(sign.idNguoiKy ?? "", staffs, positions)?.id,
        donVi: getDonVi(sign.idNguoiKy ?? "", staffs, departments)?.tenPhongBan,
        idDonVi: getDonVi(sign.idNguoiKy ?? "", staffs, departments)?.id,
        signed: sign.trangThai === 0 ? false : true,
      });
    }
  }

  // ===== GIÁM ĐỐC =====
  if (item.idTrinhDuyetGiamDoc) {
    result.push({
      idNhanVien: item.idTrinhDuyetGiamDoc ?? "",
      title:
        getChucVu(item.idTrinhDuyetGiamDoc ?? "", staffs, positions)
          ?.tenChucVu || "Giám đốc",
      hoTen: item.tenTrinhDuyetGiamDoc ?? "",
      chucVu: getChucVu(item.idTrinhDuyetGiamDoc ?? "", staffs, positions)
        ?.tenChucVu,
      idChucVu: getChucVu(item.idTrinhDuyetGiamDoc ?? "", staffs, positions)
        ?.id,
      donVi: getDonVi(item.idTrinhDuyetGiamDoc ?? "", staffs, departments)
        ?.tenPhongBan,
      idDonVi: getDonVi(item.idTrinhDuyetGiamDoc ?? "", staffs, departments)
        ?.id,
      signed: item.trinhDuyetGiamDocXacNhan || false,
    });
  }

  return result;
};

export const ShowPermissionSigning = (status: number) => {
  // Định nghĩa cấu hình cho từng trạng thái
  const getStatusConfig = (status: number) => {
    switch (status) {
      case 1:
        return { label: "Chưa đến lượt ký", color: "#f44336" }; // Red
      case 2:
        return { label: "Không được phép ký", color: "#ffab40" }; // OrangeAccent
      case 3:
        return { label: "Đã ký", color: "#2196f3" }; // Blue
      case 4:
        return { label: "Đã ký & tạo", color: "#9c27b0" }; // Purple
      case 5:
        return { label: "Cần ký & tạo", color: "#ff9800" }; // Orange
      default:
        return { label: "Cần ký", color: "#4caf50" }; // Green
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      sx={{
        backgroundColor: config.color,
        color: "white",
        fontWeight: 500,
        fontSize: "12px",
        borderRadius: "4px", // Bo góc theo mẫu Flutter (4)
        height: "24px", // Tương đương với padding vertical của bạn
        "& .MuiChip-label": {
          paddingLeft: "5px",
          paddingRight: "5px",
        },
      }}
    />
  );
};
export const getPermissionSigning = (data: any, user?: any): number => {
  const signatureFlow = [
    {
      id: data.idNguoiLapBieu,
      signed: data.nguoiLapBieuXacNhan === true,
    },
    ...(data.nguoiKyList?.length
      ? data.nguoiKyList.map((e: any) => ({
          id: e.idNguoiKy,
          signed: e.trangThai === 1,
        }))
      : []),
    {
      id: data.idTrinhDuyetGiamDoc,
      signed: data.trinhDuyetGiamDocXacNhan === true,
    },
  ].filter((step) => step.id && step.id.trim() !== "");

  const currentIndex = signatureFlow.findIndex(
    (s) => s.id === user?.taiKhoan?.tenDangNhap,
  );

  if (currentIndex === -1) return 2;

  // Người đại diện đơn vị ban hành QĐ
  if (data.idDaiDiendonviBanHanhQD === user?.taiKhoan?.tenDangNhap) {
    return signatureFlow[currentIndex].signed ? 4 : 5;
  }

  if (signatureFlow[currentIndex].signed) return 3;

  const previousNotSigned = signatureFlow
    .slice(0, currentIndex)
    .find((s) => s.signed === false);

  if (previousNotSigned) return 1;

  return 0;
};

interface SignatureStep {
  id: string;
  signed: boolean;
}
const buildSignatureFlow = (item: any): SignatureStep[] => {
  if (!item) return [];

  const steps: (SignatureStep | null)[] = [
    {
      id: item.idNguoiLapBieu,
      signed: item.nguoiLapBieuXacNhan === true,
    },
    ...(Array.isArray(item.nguoiKyList)
      ? item.nguoiKyList.map((e: any) => ({
          id: e.idNguoiKy,
          signed: e.trangThai === 1,
        }))
      : []),

    {
      id: item.idTrinhDuyetGiamDoc,
      signed: item.trinhDuyetGiamDocXacNhan === true,
    },
  ];

  return steps.filter((s): s is SignatureStep => Boolean(s?.id));
};
export const canSign = (items: any[], user?: any): boolean => {
  if (!user || items.length !== 1) return false;

  const item = items[0];
  const signatureFlow = buildSignatureFlow(item);

  const currentIndex = signatureFlow.findIndex(
    (s) => s.id === user?.taiKhoan?.tenDangNhap,
  );

  // Không có trong flow hoặc đã ký rồi
  if (currentIndex === -1 || signatureFlow[currentIndex].signed) {
    return false;
  }

  // Tất cả bước trước đó phải đã ký
  return signatureFlow.slice(0, currentIndex).every((s) => s.signed);
};
export const getAutoSignatureType = (employee: any): number => {
  if (!employee) return 0;
  if (employee.kySo) {
    if (employee.kyThuong) return 4;
    if (employee.kyNhay) return 5;
    return 3;
  } else {
    if (employee.kyThuong) return 2;
    if (employee.kyNhay) return 1;
    return 0;
  }
};

export const generateBienBanKeHoachPdf = async (
  plan: MaintenancePlanData,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const listSigneInfos: any[] = listSigneInfo(
    plan,
    staffs,
    departments,
    positions,
  );
  const doc = new jsPDF("l", "mm", "a4");

  doc.setFont("times_new_roman", "bold");

  doc.setFontSize(12);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  doc.text(
    plan.tenMauBienBanSuaChua
      ? `${plan.tenMauBienBanSuaChua}`
      : `KẾ HOẠCH SỬA CHỮA BẢO DƯỠNG THIẾT BỊ NĂM ${plan.nam ?? new Date().getFullYear()}`,
    centerX,
    20,
    { align: "center" },
  );
  doc.text(
    `PHÂN XƯỞNG: ${(plan.tenDonViGiao || ".......................................................").toUpperCase()}`,
    centerX,
    26,
    { align: "center" },
  );

  // ===== CĂN CỨ =====
  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(11);

  const canCuText = `(Theo QĐ số ${plan?.soQuyetDinh ?? "........."} /QĐ - TUB ${formatted(plan?.ngayTao)})`;
  doc.text(canCuText, centerX, 32, { align: "center" });

  let y = 35;

  // Giả sử signatures là mảng đối tượng có { hoTen, chucVu, phongBan }

  // ===== TABLE =====
  const tableData = (plan?.danhSachTaiSan ?? []).map(
    (item: any, index: number) => [
      index + 1,
      item.idTaiSan ?? "",
      item.tenTaiSan ?? "",
      item.idNhomTaiSan ?? "",
      item.idLoaiTaiSan ?? "",
      item.soLuong,
      plan.idDonViGiao,
      item.idDonViBaoTri,
      item.capSuaChuaThang1,
      item.capSuaChuaThang2,
      item.capSuaChuaThang3,
      item.capSuaChuaThang4,
      item.capSuaChuaThang5,
      item.capSuaChuaThang6,
      item.capSuaChuaThang7,
      item.capSuaChuaThang8,
      item.capSuaChuaThang9,
      item.capSuaChuaThang10,
      item.capSuaChuaThang11,
      item.capSuaChuaThang12,
    ],
  );

  autoTable(doc, {
    startY: y + 5,
    margin: { left: 20, right: 20 },
    head: [
      [
        "STT",
        "Mã TB",
        "Tên thiết bị",
        "Nhóm TB",
        "Loại TS",
        "SL",
        "Đơn vị QL",
        "Đơn vị bảo trì",
        "T1",
        "T2",
        "T3",
        "T4",
        "T5",
        "T6",
        "T7",
        "T8",
        "T9",
        "T10",
        "T11",
        "T12",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
      font: "times_new_roman",
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      font: "times_new_roman",
      fontSize: 10,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 15, halign: "center" },
      2: { halign: "center" }, // auto width for equipment name
      3: { cellWidth: 13, halign: "center" },
      4: { cellWidth: 13, halign: "center" },
      5: { cellWidth: 10, halign: "center" },
      6: { cellWidth: 15, halign: "center" },
      7: { cellWidth: 15, halign: "center" },
      8: { cellWidth: 11, halign: "center" },
      9: { cellWidth: 11, halign: "center" },
      10: { cellWidth: 11, halign: "center" },
      11: { cellWidth: 11, halign: "center" },
      12: { cellWidth: 11, halign: "center" },
      13: { cellWidth: 11, halign: "center" },
      14: { cellWidth: 11, halign: "center" },
      15: { cellWidth: 11, halign: "center" },
      16: { cellWidth: 11, halign: "center" },
      17: { cellWidth: 11, halign: "center" },
      18: { cellWidth: 11, halign: "center" },
      19: { cellWidth: 11, halign: "center" },
    },
  });

  // ===== KẾT LUẬN & CHỮ KÝ =====
  let finalY = (doc as any).lastAutoTable.finalY + 10;

  finalY += 15;
  if (finalY > pageHeight - 80) {
    doc.addPage();
    finalY = 20;
  }

  const marginX = 40; // Lề trái và lề phải (giống lề của bảng phía trên)
  const printableWidth = pageWidth - 2 * marginX; // Chiều rộng thực tế dùng để chia cột

  const colWidth = 45; // Độ rộng vùng text mỗi chữ ký
  const maxPerRow = 5; // Tối đa 4 chữ ký / hàng
  const rowGap = 70;
  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};
  const baseY = finalY;
  const baseWidthPx = 120;
  const displayWidth = 800;

  listSigneInfos?.forEach((s, index) => {
    const rowIndex = Math.floor(index / maxPerRow);
    const colIndex = index % maxPerRow;

    // Xác định số lượng chữ ký thực tế của hàng này
    const itemsInRow = Math.min(
      maxPerRow,
      listSigneInfos.length - rowIndex * maxPerRow,
    );

    let x;
    if (itemsInRow === 1) {
      // 1 người: Căn giữa trang
      x = pageWidth / 2;
    } else {
      // Từ 2 người trở lên: Chia đều khoảng cách để 2 người ngoài cùng sát lề marginX
      // Công thức: Lề trái + (vị trí cột * (chiều rộng khả dụng / số khoảng trống giữa các cột))
      const gapSize = printableWidth / (itemsInRow - 1);
      x = marginX + colIndex * gapSize;
    }

    const y = baseY + rowIndex * rowGap + 15;

    const sigWidthMm = (baseWidthPx / displayWidth) * pageWidth;
    coordinates[s.idNhanVien] = {
      xRatio: Math.max(0, Math.min((x - sigWidthMm / 2) / pageWidth, 1)),
      yRatio: Math.max(0, Math.min((y + 5) / pageHeight, 1)), // +5 để vào giữa khoảng trống
      page: (doc as any).internal.getNumberOfPages(),
    };

    // 1️⃣ Đơn vị (Phòng ban/Phân xưởng)
    // Dùng fontSize nhỏ hơn một chút nếu cần giống ảnh mẫu
    doc.setFontSize(10);
    const donViLines = doc.splitTextToSize(
      s?.title || s?.donVi || "",
      colWidth,
    );
    doc.text(donViLines, x, y, { align: "center" });

    // 2️⃣ Họ tên người ký
    // Cố định khoảng cách nameY để tạo khoảng trống cho chữ ký tay
    const nameY = y + 35;
    const hoTenLines = doc.splitTextToSize(s?.hoTen || "", colWidth);
    doc.text(hoTenLines, x, nameY, { align: "center" });
  });

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};

export const generateSuaChuaPdf = async (
  repair: any,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const listSigneInfos: any[] = listSigneInfo(
    repair,
    staffs,
    departments,
    positions,
  );
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(11);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftColCenter = pageWidth / 4;
  const rightColCenter = (pageWidth * 3) / 4;

  const donViQuanLy =
    findById(departments, repair?.donViQuanLy)?.tenPhongBan || "";
  const donViGiamSat =
    findById(departments, repair?.donViGiamSat)?.tenPhongBan || "";

  // Header Left (Company) - Match Giám định layout
  doc.text("TẬP ĐOÀN CÔNG NGHIỆP", leftColCenter, 20, { align: "center" });
  doc.text("THAN - KHOÁNG SẢN VIỆT NAM", leftColCenter, 25, {
    align: "center",
  });

  doc.setFont("times_new_roman", "bold");
  const companyName = (
    repair?.congTy || currentBrandConfig.company
  ).toUpperCase();
  let y = 30;
  const words = companyName.split(" ");
  if (words.length > 6) {
    const line1 = words.slice(0, 6).join(" ");
    const line2 = words.slice(6).join(" ");
    doc.text(line1, leftColCenter, y, { align: "center" });
    y += 5;
    doc.text(line2, leftColCenter, y, { align: "center" });
  } else {
    doc.text(companyName, leftColCenter, y, { align: "center" });
  }
  doc.line(leftColCenter - 15, y + 1, leftColCenter + 15, y + 1);

  // Header Right
  let yRight = 20;
  doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", rightColCenter, yRight, {
    align: "center",
  });
  yRight += 5;
  doc.text("Độc lập - Tự do - Hạnh phúc", rightColCenter, yRight, {
    align: "center",
  });
  doc.line(rightColCenter - 25, yRight + 1, rightColCenter + 25, yRight + 1);

  y = Math.max(y, yRight) + 15;

  // Title
  doc.setFontSize(14);
  doc.text(repair?.tenMauBienBan || "LỆNH SỬA CHỮA", pageWidth / 2, y, {
    align: "center",
  });
  y += 10;

  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(12);

  // Information Table
  const dsTaiSan = repair?.danhSachTaiSan || [];
  const thietBiBKS = dsTaiSan.map((ts: any) => ts.tenTaiSan).join("; ");
  const ngaySCBD = repair?.ngayBaoDuongGanNhat
    ? dayjs(repair?.ngayBaoDuongGanNhat).format("DD/MM/YYYY")
    : "";

  const infoTableBody = [
    ["Đơn vị quản lý thiết bị", donViQuanLy],
    ["Thiết bị/BKS", thietBiBKS],
    ["Ngày SCBD gần nhất", ngaySCBD],
    ["Giờ/km hoạt động", repair?.gioHoatDong || ""],
    ["Nội dung SC/BD", repair?.tenLoaiSuaChua || ""],
    ["Tình trạng kỹ thuật", repair?.tinhTrang || ""],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    body: infoTableBody,
    theme: "grid",
    styles: { font: "times_new_roman", fontSize: 11, cellPadding: 2 },
    bodyStyles: { textColor: 0, lineColor: 0, lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 50 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // 1. Vật tư
  doc.setFont("times_new_roman", "bold");
  doc.text("1. Vật tư, vật liệu:", 15, y);
  y += 5;

  const vatTuData = (repair?.danhSachVatTu || []).map(
    (vt: any, idx: number) => [
      idx + 1,
      vt.idVatTu || vt.maCcdcVatTu || "",
      vt.tenVatTu || vt.tenCcdcVatTu || "",
      vt.donViTinh || "",
      vt.soLuong || "",
      vt.ghiChu || "",
    ],
  );

  if (vatTuData.length === 0) {
    vatTuData.push([
      {
        content: "Chưa có vật tư",
        colSpan: 6,
        styles: { halign: "center", fontStyle: "italic" },
      },
    ]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [["Stt", "Mã vật tư", "Tên vật tư", "ĐVT", "SL", "Ghi chú"]],
    body: vatTuData,
    theme: "grid",
    styles: { font: "times_new_roman", fontSize: 11, cellPadding: 2 },
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.2,
      lineColor: 0,
      halign: "center",
    },
    bodyStyles: { textColor: 0, lineColor: 0, lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 35, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // 2. Nhân công
  doc.setFont("times_new_roman", "bold");
  doc.text("2. Nhân công thực hiện:", 15, y);
  y += 6;
  doc.setFont("times_new_roman", "normal");
  const nhanCongLines = doc.splitTextToSize(
    "- " + (repair?.nhanCongThucHien || "Không"),
    pageWidth - 30,
  );
  nhanCongLines.forEach((line: string) => {
    doc.text(line, 20, y);
    y += 6;
  });

  // 3. Thời gian, địa điểm
  doc.setFont("times_new_roman", "bold");
  doc.text("3. Thời gian, địa điểm thực hiện:", 15, y);
  y += 6;
  doc.setFont("times_new_roman", "normal");
  doc.text(
    "- Thời gian: " +
      (repair?.thoiGian ? dayjs(repair?.thoiGian).format("DD/MM/YYYY") : ""),
    20,
    y,
  );
  y += 6;
  doc.text("- Địa điểm: " + (repair?.diaDiem || ""), 20, y);
  y += 8;

  // Yêu cầu
  doc.setFont("times_new_roman", "bold");
  doc.text("*. Yêu cầu:", 15, y);
  y += 6;
  doc.setFont("times_new_roman", "normal");

  const yeuCau1 =
    "1. Chấp hành đầy đủ nội quy, quy trình, quy phạm KT - AT, trong quá trình SCBD phải đảm bảo an toàn tuyệt đối cho người, thiết bị.";
  const yc1Lines = doc.splitTextToSize(yeuCau1, pageWidth - 30);
  yc1Lines.forEach((line: string) => {
    doc.text(line, 20, y);
    y += 6;
  });

  const yc2Lines = doc.splitTextToSize(
    `2. ${donViQuanLy || "..."} căn cứ nội dung làm các thủ tục lĩnh vật tư để phục vụ SCBD;`,
    pageWidth - 30,
  );
  yc2Lines.forEach((line: string) => {
    doc.text(line, 20, y);
    y += 6;
  });

  const yc3Lines = doc.splitTextToSize(
    `3. ${donViGiamSat || "..."} thực hiện nghiệm thu sau sửa chữa, lập biên bản nghiệm thu (nếu có).`,
    pageWidth - 30,
  );
  yc3Lines.forEach((line: string) => {
    doc.text(line, 20, y);
    y += 6;
  });

  y += 5;
  doc.setFont("times_new_roman", "normal");
  const dateStr = `Quảng Ninh, ${formatted(repair.ngayTao)}`;
  doc.text(dateStr, pageWidth - 20, y, { align: "right" });
  y += 10;

  // Signatures
  let finalY = y;
  if (finalY > pageHeight - 40) {
    doc.addPage();
    finalY = 20;
  }
  const marginX = 20;
  const printableWidth = pageWidth - 2 * marginX;
  const maxPerRow = 3;
  const rowGap = 50;
  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};
  const baseWidthPx = 120;
  const displayWidth = 800;

  listSigneInfos.forEach((s: any, index: number) => {
    const rowIndex = Math.floor(index / maxPerRow);
    const colIndex = index % maxPerRow;
    const itemsInRow = Math.min(
      maxPerRow,
      listSigneInfos.length - rowIndex * maxPerRow,
    );

    let x;
    if (itemsInRow === 1) x = pageWidth / 2;
    else {
      const gapSize = printableWidth / (itemsInRow - 1);
      x = marginX + colIndex * gapSize;
    }

    let yPos = finalY + rowIndex * rowGap;
    if (yPos > pageHeight - 40) {
      doc.addPage();
      finalY = 20 - rowIndex * rowGap;
      yPos = 20;
    }
    const sigWidthMm = (baseWidthPx / displayWidth) * pageWidth;

    coordinates[s.idNhanVien || s.idNguoiKy || s.userId] = {
      xRatio: Math.max(0, Math.min((x - sigWidthMm / 2) / pageWidth, 1)),
      yRatio: Math.max(0, Math.min((yPos + 10) / pageHeight, 1)),
      page: (doc as any).internal.getNumberOfPages(),
    };

    doc.setFont("times_new_roman", "bold");
    doc.setFontSize(10);
    doc.text(s.donVi || "", x, yPos, { align: "center" });
    doc.setFont("times_new_roman", "bold");
    doc.text(s.hoTen || s.userName || "", x, yPos + 35, { align: "center" });
  });

  return { pdf: new Uint8Array(doc.output("arraybuffer")), coordinates };
};
export const generatePhieuSuCoPdf = async (
  incident: IncidenData,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const listSigneInfos: any[] = listSigneInfo(
    incident,
    staffs,
    departments,
    positions,
  );
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(11);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftColCenter = pageWidth / 4; // Giữa cột trái
  const rightColCenter = (pageWidth * 3) / 4;

  // Header Left
  doc.text(incident?.congTy || currentBrandConfig.company, leftColCenter, 20, {
    align: "center",
  });
  doc.text(`Đơn vị: ${incident.tenDonViBaoCao}`, leftColCenter, 26, {
    align: "center",
  });

  // Header Right
  doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", rightColCenter, 20, {
    align: "center",
  });
  doc.text("Độc lập - Tự do - Hạnh phúc", rightColCenter, 26, {
    align: "center",
  });

  // Lines - căn theo text
  const leftLineWidth = 30; // độ dài line cột trái
  const rightLineWidth = 30; // độ dài line cột phải

  doc.line(
    leftColCenter - leftLineWidth / 2,
    27,
    leftColCenter + leftLineWidth / 2,
    27,
  );

  doc.line(
    rightColCenter - rightLineWidth / 2,
    27,
    rightColCenter + rightLineWidth / 2,
    27,
  );

  // Date
  doc.setFont("times_new_roman_italic", "italic");
  doc.setFontSize(10);
  const today = new Date(incident.ngayTao || new Date());
  const dateStr = `Quảng Ninh, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
  doc.text(dateStr, pageWidth - 20, 35, { align: "right" });

  // Title
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(16);
  doc.text(
    incident?.tenMauBienBan || "PHIẾU BÁO SỰ CỐ THIẾT BỊ",
    pageWidth / 2,
    50,
    { align: "center" },
  );
  doc.setFontSize(12);
  doc.text(
    `Số: ${incident.soPhieu || (incident as any).number || "..."}`,
    pageWidth / 2,
    58,
    {
      align: "center",
    },
  );

  doc.setFont("times_new_roman", "normal");
  let y = 70;
  const severityLabels: Record<number, string> = {
    0: "Nhẹ",
    1: "Trung bình",
    2: "Nặng",
    3: "Nghiêm trọng",
  };

  const drawField = (label: string, value: string) => {
    doc.setFont("times_new_roman", "normal");
    doc.text(`- ${label}: `, 20, y);
    const labelW = doc.getTextWidth(`- ${label}: `);
    doc.setFont("times_new_roman", "bold");
    doc.text(value, 20 + labelW, y);
    y += 8;
  };

  drawField(
    "Đơn vị báo cáo",
    incident.tenDonViBaoCao || (incident as any).idDonViBaoCao || "...",
  );

  drawField("Ngày giờ phát hiện", incident.ngayPhatHien);
  drawField(
    "Tên hệ thống/thiết bị gặp sự cố",
    incident.tenHeThongThietBi || "...",
  );
  drawField("Phân hệ/vị trí xảy ra sự cố", incident.phanHeViTri || "...");

  doc.setFont("times_new_roman", "normal");
  doc.text(`- Mô tả tình trạng sự cố: ${incident.moTa || "..."}`, 20, y);
  y += 8;

  const mucDo = incident.mucDo ?? (incident as any).severity ?? 0;
  drawField("Đánh giá mức độ", severityLabels[mucDo] || "...");

  y += 5;
  doc.setFont("times_new_roman", "bold");
  doc.text("Danh sách hệ thống/thiết bị bị sự cố:", pageWidth / 2, y, {
    align: "center",
  });
  y += 5;

  const tableData = (incident?.danhSachTaiSan ?? []).map((item, idx) => [
    idx + 1 || "",
    incident.soPhieu || "",
    item.idTaiSan || "",
    item.tenTaiSan || "",
    item.tenNhomTaiSan || "",
    item.thuocHeThong || "",
    item.viTri || "",
    item.tinhTrang || "",
    incident.idDonViBaoCao,
    item.idDonViQuanLyKyThuat || "",
    severityLabels[mucDo] || "",
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 20, right: 20 },
    head: [
      [
        "STT",
        "Số chứng từ",
        "Mã thiết bị",
        "Tên TB",
        "Nhóm chủng loại",
        "Thuộc hệ thống",
        "Vị trí",
        "Tình trạng",
        "Đơn vị quản lý TB",
        "Đơn vị quản lý KT",
        "Mức độ",
      ],
    ],
    body: tableData || [],
    theme: "grid",
    styles: { font: "times_new_roman", fontSize: 8 },
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
      font: "times_new_roman",
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      font: "times_new_roman",
      fontSize: 10,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 30, halign: "center" },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 15, halign: "center" },
      6: { cellWidth: 15, halign: "center" },
      7: { cellWidth: 15, halign: "center" },
      8: { cellWidth: 15, halign: "center" },
      9: { cellWidth: 15, halign: "center" },
      10: { cellWidth: 15, halign: "center" },
      11: { cellWidth: 15, halign: "center" },
    },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 20;
  if (finalY > pageHeight - 80) {
    doc.addPage();
    finalY = 20;
  }
  const marginX = 35;
  const printableWidth = pageWidth - 2 * marginX;
  const maxPerRow = 3;
  const rowGap = 60;
  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};
  const baseWidthPx = 120;
  const displayWidth = 800;

  listSigneInfos.forEach((s, index) => {
    const rowIndex = Math.floor(index / maxPerRow);
    const colIndex = index % maxPerRow;
    const itemsInRow = Math.min(
      maxPerRow,
      listSigneInfos.length - rowIndex * maxPerRow,
    );

    let x;
    if (itemsInRow === 1) x = pageWidth / 2;
    else {
      const gapSize = printableWidth / (itemsInRow - 1);
      x = marginX + colIndex * gapSize;
    }

    let yPos = finalY + rowIndex * rowGap;
    if (yPos > pageHeight - 80) {
      doc.addPage();
      finalY = 20 - rowIndex * rowGap;
      yPos = 20;
    }
    const sigWidthMm = (baseWidthPx / displayWidth) * pageWidth;

    coordinates[s.idNhanVien] = {
      xRatio: Math.max(0, Math.min((x - sigWidthMm / 2) / pageWidth, 1)),
      yRatio: Math.max(0, Math.min((yPos + 10) / pageHeight, 1)),
      page: (doc as any).internal.getNumberOfPages(),
    };

    doc.setFont("times_new_roman", "bold");
    doc.setFontSize(10);
    doc.text(s.title || s.donVi || "", x, yPos, { align: "center" });
    doc.setFont("times_new_roman", "italic");
    doc.text("(Ký, ghi rõ họ tên)", x, yPos + 5, { align: "center" });
    doc.setFont("times_new_roman", "bold");
    doc.text(s.hoTen || "", x, yPos + 35, { align: "center" });
  });

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};
export const generateGiamDinhPdf = async (
  inspection: any,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const listSigneInfos: any[] = listSigneInfo(
    inspection,
    staffs,
    departments,
    positions,
  );
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(11);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftColCenter = pageWidth / 4;
  const rightColCenter = (pageWidth * 3) / 4;

  // Header Left
  doc.setFont("times_new_roman", "normal");
  let congTyText = (
    inspection?.congTy || currentBrandConfig.company
  ).toUpperCase();
  let currentY = 20;

  const words = congTyText.split(" ");
  if (words.length > 6) {
    const line1 = words.slice(0, 6).join(" ");
    const line2 = words.slice(6).join(" ");
    doc.text(line1, leftColCenter, currentY, { align: "center" });
    currentY += 5;
    doc.text(line2, leftColCenter, currentY, { align: "center" });
  } else {
    doc.text(congTyText, leftColCenter, currentY, { align: "center" });
  }
  currentY += 5;

  doc.setFont("times_new_roman", "bold");
  let rawDonVi = inspection?.tenDonViGiamDinh || inspection?.tenDonVi || "";
  if (rawDonVi.toString().toLowerCase() === "null") rawDonVi = "";

  const tenDonVi = rawDonVi.toUpperCase();
  if (tenDonVi) {
    doc.text(tenDonVi, leftColCenter, currentY, { align: "center" });
    const textWidth = doc.getTextWidth(tenDonVi);
    doc.line(
      leftColCenter - textWidth / 2,
      currentY + 1,
      leftColCenter + textWidth / 2,
      currentY + 1,
    );
  }

  // Header Right
  doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", rightColCenter, 20, {
    align: "center",
  });
  doc.text("Độc lập - Tự do - Hạnh phúc", rightColCenter, 26, {
    align: "center",
  });
  doc.line(rightColCenter - 15, 27, rightColCenter + 15, 27);

  // Title
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(14);
  doc.text("BIÊN BẢN", pageWidth / 2, 50, { align: "center" });
  doc.text(
    inspection?.tenMauBienBan ||
      "GIÁM ĐỊNH KỸ THUẬT VÀ BÀN GIAO THIẾT BỊ ĐƯA VÀO SỬA CHỮA",
    pageWidth / 2,
    58,
    { align: "center" },
  );

  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(11);
  let y = 70;

  const d = dayjs(inspection.ngayGiamDinh || new Date()).format();
  doc.text(
    ` Hôm nay, vào hồi ${new Date(inspection?.ngayGiamDinh).getHours()} giờ ${new Date(inspection?.ngayGiamDinh).getMinutes()} phút, ngày ${formatted(inspection?.ngayGiamDinh)}. Tại ${inspection.donViGiamDinh || "……………………………"}`,
    20,
    y,
  );
  y += 8;
  doc.text("Chúng tôi gồm:", 20, y);
  y += 8;

  listSigneInfos.forEach((s, idx) => {
    doc.setFont("times_new_roman", "normal");
    const prefix = `${idx + 1}. Ông: `;
    doc.text(prefix, 25, y);

    // Switch to bold for the name if desired or keep normal.
    // The image seems to show normal text for the name, but just in case:
    doc.setFont("times_new_roman", "normal");
    const labelWidth = doc.getTextWidth(prefix);
    doc.text(s.hoTen || "………………………", 25 + labelWidth, y);

    doc.setFont("times_new_roman", "normal");
    doc.text(`Chức vụ: ${s.idChucVu || ""}`, 120, y);
    y += 7;
  });

  y += 3;
  const tenTaiSanList = (inspection.danhSachChiTiet || [])
    .map((i: any) => i.tenTaiSan || i.idTaiSan)
    .filter(Boolean)
    .join(", ");
  const canCuText = `Cùng kiểm tra tình trạng kỹ thuật thiết bị: ${tenTaiSanList || inspection.noiDung || "........................."} trước khi vào bảo dưỡng các cấp và bàn giao bộ phận sửa chữa với tình trạng kỹ thuật với nội dung sửa chữa sau:`;
  const canCuLines = doc.splitTextToSize(canCuText, pageWidth - 40);
  canCuLines.forEach((line: string) => {
    doc.text(line, 20, y);
    y += 7;
  });
  y += 1;

  // Table
  const tableData: any[] = [];
  (inspection.danhSachChiTiet || []).forEach((entry: any, idx: number) => {
    tableData.push([
      (idx + 1).toString(),
      entry.noiDungCongViec ||
        `Bảo dưỡng ${entry.tenTaiSan || entry.idTaiSan || "—"}`,
      entry.donViTinh || "—",
      entry.soLuong || "",
      entry.tinhTrang || "",
      entry.thayMoi || "",
      entry.suaChua || "",
      entry.ghiChu || "",
    ]);
  });

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [
      [
        {
          content: "STT",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Tên chi tiết/Nội dung công việc",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "ĐVT",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "SL",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Tình trạng kỹ thuật",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Biện pháp xử lý",
          colSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Ghi chú",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
      ],
      [
        { content: "T.Mới", styles: { halign: "center", valign: "middle" } },
        { content: "S.Chữa", styles: { halign: "center", valign: "middle" } },
      ],
    ],
    body: tableData,
    theme: "grid",
    styles: { font: "times_new_roman", fontSize: 9 },
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
      fontStyle: "bold",
    },
    bodyStyles: { lineWidth: 0.1, lineColor: 0, textColor: 0 },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 10, halign: "center" },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
    },
  });

  const lastY = (doc as any).lastAutoTable.finalY;
  y = lastY + 10;

  const noiDungKhacText = `Các nội dung cần thống nhất khác: ${inspection.noiDung || "Không"}`;
  const noiDungKhacLines = doc.splitTextToSize(noiDungKhacText, pageWidth - 40);
  noiDungKhacLines.forEach((line: string) => {
    doc.text(line, 20, y);
    y += 7;
  });

  const h = new Date(inspection.ngayTao || new Date()).getHours();
  const m = new Date(inspection.ngayTao || new Date()).getMinutes();
  doc.text(
    `Biên bản lập xong hồi ${h} giờ ${m < 10 ? "0" + m : m} phút cùng ngày, đã được mọi người nhất trí thông qua.`,
    20,
    y,
  );
  y += 15;
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 20;
  }

  // Signatures
  const marginX = 20;
  const printableWidth = pageWidth - 2 * marginX;
  const maxPerRow = 5;
  const rowGap = 50;
  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};
  const baseWidthPx = 120;
  const displayWidth = 800;

  listSigneInfos.forEach((s, index) => {
    const rowIndex = Math.floor(index / maxPerRow);
    const colIndex = index % maxPerRow;
    const itemsInRow = Math.min(
      maxPerRow,
      listSigneInfos.length - rowIndex * maxPerRow,
    );

    let x;
    if (itemsInRow === 1) x = pageWidth / 2;
    else {
      const gapSize = printableWidth / (itemsInRow - 1);
      x = marginX + colIndex * gapSize;
    }

    let yPos = y + rowIndex * rowGap;
    if (yPos > pageHeight - 60) {
      doc.addPage();
      y = 20 - rowIndex * rowGap;
      yPos = 20;
    }
    const sigWidthMm = (baseWidthPx / displayWidth) * pageWidth;

    coordinates[s.idNhanVien] = {
      xRatio: Math.max(0, Math.min((x - sigWidthMm / 2) / pageWidth, 1)),
      yRatio: Math.max(0, Math.min((yPos + 5) / pageHeight, 1)),
      page: (doc as any).internal.getNumberOfPages(),
    };

    doc.setFont("times_new_roman", "bold");
    doc.setFontSize(10);
    doc.text(s.idChucVu || "", x, yPos, { align: "center" });
    doc.text(s.hoTen || "", x, yPos + 30, { align: "center" });
  });

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};

export const generateNghiemThuPdf = async (
  item: any,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const listSigneInfos: any[] = listSigneInfo(
    item,
    staffs,
    departments,
    positions,
  );
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(11);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const leftColCenter = pageWidth * 0.3;
  const rightColCenter = pageWidth * 0.75;

  const companyName = (
    currentBrandConfig.company || "CÔNG TY KHO VẬN VÀ CẢNG CẨM PHẢ - VINACOMIN"
  ).toUpperCase();
  let compLine1 = companyName;
  let compLine2 = "";
  const words = companyName.split(" ");
  if (words.length > 6) {
    compLine1 = words.slice(0, 6).join(" ");
    compLine2 = words.slice(6).join(" ");
  }

  doc.setFontSize(11);
  doc.setFont("times_new_roman", "normal");
  doc.text("TẬP ĐOÀN CN THAN", leftColCenter, 20, { align: "center" });
  doc.text("KHOÁNG SẢN - VIỆT NAM", leftColCenter, 25, { align: "center" });
  doc.setFont("times_new_roman", "bold");
  doc.text(compLine1, leftColCenter, 30, { align: "center" });
  if (compLine2) {
    doc.text(compLine2, leftColCenter, 35, { align: "center" });
  }

  doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", rightColCenter, 20, {
    align: "center",
  });
  doc.text("Độc lập – Tự do – Hạnh phúc", rightColCenter, 25, {
    align: "center",
  });

  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(14);
  doc.text("BIÊN BẢN", centerX, 45, { align: "center" });
  doc.text("NGHIỆM THU CHẠY THỬ VÀ BÀN GIAO THIẾT BỊ", centerX, 52, {
    align: "center",
  });
  doc.text("SAU SỬA CHỮA/BẢO DƯỠNG", centerX, 59, { align: "center" });

  let y = 70;
  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(12);

  const donViInfo = departments.find((d) => d.id === item?.donViQuanLy);
  const tenDonVi =
    donViInfo?.tenPhongBan ||
    item?.donViQuanLy ||
    "...................................................";

  const dateObj = new Date(item?.ngayTao || new Date());
  const hour = dateObj.getHours().toString().padStart(2, "0");
  const minute = dateObj.getMinutes().toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObj.getFullYear();

  doc.text(
    `Hôm nay, ngày ${day} tháng ${month} năm ${year}. Tại ${tenDonVi}.`,
    20,
    y,
  );
  y += 7;

  doc.text("Chúng tôi gồm:", 20, y);
  y += 7;

  listSigneInfos.forEach((s, index) => {
    let chucVu = s.chucVu || s.title || s.donVi || "................";
    let hoTen = s.hoTen || "........................";
    doc.text(`${index + 1}. Ông: ${hoTen}`, 25, y);
    doc.text(`Chức vụ: ${chucVu}`, 100, y);
    y += 7;
  });

  y += 3;
  const dsTaiSan = item?.danhSachTaiSan || [];
  const danhSachThietBi = dsTaiSan.map((ts: any) => ts.tenTaiSan).join(", ");

  const introText = `Cùng thực hiện nghiệm thu kỹ thuật thiết bị: ${danhSachThietBi} sau khi vào sửa chữa và bàn giao cho ${tenDonVi} quản lý vận hành với các nội dung sau.`;
  const introLines = doc.splitTextToSize(introText, pageWidth - 40);
  doc.text(introLines, 20, y);
  y += introLines.length * 7;

  doc.setFont("times_new_roman", "bold");
  doc.text("1. Nội dung sửa chữa", 20, y);
  y += 7;
  doc.setFont("times_new_roman", "normal");
  const ndLines = doc.splitTextToSize(
    item?.noiDungSuaChua ||
      "...................................................",
    pageWidth - 45,
  );
  doc.text(ndLines, 25, y);
  y += ndLines.length * 7;

  doc.setFont("times_new_roman", "bold");
  doc.text("2. Kết quả kiểm tra, chạy thử", 20, y);
  y += 7;
  doc.setFont("times_new_roman", "normal");
  const kqLines = doc.splitTextToSize(
    item?.ketQua || "...................................................",
    pageWidth - 45,
  );
  doc.text(kqLines, 25, y);
  y += kqLines.length * 7;

  doc.setFont("times_new_roman", "bold");
  doc.text("3. Các nội dung được sửa chữa được nghiệm thu:", 20, y);
  y += 7;
  doc.setFont("times_new_roman", "normal");
  doc.text("3.1. Khối lượng vật tư được nghiệm thu:", 20, y);
  y += 5;

  const dsVatTu = item?.danhSachVatTu || [];
  const vatTuTableData = dsVatTu.map((row: any, index: number) => [
    index + 1,
    row.tenVatTu || "................",
    row.kyHieu || "................",
    row.donViTinh || "Cái",
    row.soLuongThayThe ?? 0,
    row.soLuongThuHoi ?? 0,
    row.ghiChu || "",
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 20, right: 20 },
    head: [
      [
        { content: "STT", rowSpan: 2 },
        { content: "Vật tư thay thế", rowSpan: 2 },
        { content: "Chủng loại, quy cách", rowSpan: 2 },
        { content: "ĐVT", rowSpan: 2 },
        { content: "Số lượng", colSpan: 2 },
        { content: "Ghi chú", rowSpan: 2 },
      ],
      ["Thay thế", "Thu hồi"],
    ],
    body: vatTuTableData,
    theme: "grid",
    styles: {
      font: "times_new_roman",
      fontSize: 10,
      textColor: 0,
      lineColor: 0,
      lineWidth: 0.1,
    },
    headStyles: { fillColor: false, fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 15, halign: "center" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 7;
  doc.text("3.2. Khối lượng công việc được nghiệm thu:", 20, y);
  y += 5;

  const cvTableData = dsTaiSan.map((row: any, index: number) => [
    index + 1,
    row.maCongViec || "",
    row.noiDung || "",
    row.soLuong ?? 1,
    row.ghiChu || "",
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 20, right: 20 },
    head: [
      ["STT", "Mã công việc", "Nội dung công việc", "Số lượng", "Ghi chú"],
    ],
    body: cvTableData,
    theme: "grid",
    styles: {
      font: "times_new_roman",
      fontSize: 10,
      textColor: 0,
      lineColor: 0,
      lineWidth: 0.1,
    },
    headStyles: { fillColor: false, fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 35, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  const endText = `Biên bản được lập xong lúc ${hour} giờ ${minute} phút cùng ngày, đã được các thành viên nhất trí thông qua.`;
  const endLines = doc.splitTextToSize(endText, pageWidth - 40);
  doc.text(endLines, 20, y);
  y += endLines.length * 7;

  if (y > pageHeight - 60) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("times_new_roman", "bold");
  doc.text("CÁC THÀNH PHẦN THAM GIA", 20, y);
  y += 10;

  doc.setFont("times_new_roman", "normal");

  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};

  doc.setFontSize(11);
  const rowGap = 20;

  listSigneInfos.forEach((s, index) => {
    let chucVu = s.chucVu || s.title || s.donVi || "................";
    let hoTen = s.hoTen || "........................";

    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("times_new_roman", "normal");
    const labelStr = `${chucVu}:`;
    doc.text(labelStr, 25, y);

    const startX = 50;
    const endX = 100;

    const dotWidth = doc.getTextWidth(".");
    const numDots = Math.floor((endX - startX) / dotWidth);
    let dots = "";
    for (let i = 0; i < numDots; i++) dots += ".";
    doc.text(dots, startX, y);

    const nameStr = hoTen;
    doc.text(nameStr, endX + 5, y);

    const sigX = (startX + endX) / 2;
    const baseWidthPx = 120;
    const displayWidth = 800;
    const sigWidthMm = (baseWidthPx / displayWidth) * pageWidth;

    coordinates[s.idNhanVien] = {
      xRatio: Math.max(0, Math.min((sigX - sigWidthMm / 2) / pageWidth, 1)),
      yRatio: Math.max(0, Math.min((y - 10) / pageHeight, 1)),
      page: (doc as any).internal.getNumberOfPages(),
    };

    y += rowGap;
  });

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};

export const generateDanhGiaVatTuPdf = async (
  item: any,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const listSigneInfos: any[] = listSigneInfo(
    item,
    staffs,
    departments,
    positions,
  );
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(11);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftColCenter = pageWidth / 4;
  const rightColCenter = (pageWidth * 3) / 4;

  const companyName = (
    item?.congTy ||
    currentBrandConfig.company ||
    "CÔNG TY KHO VẬN VÀ CẢNG CẨM PHẢ - VINACOMIN"
  ).toUpperCase();
  let compLine1 = companyName;
  let compLine2 = "";
  const words = companyName.split(" ");
  if (words.length > 6) {
    compLine1 = words.slice(0, 6).join(" ");
    compLine2 = words.slice(6).join(" ");
  }

  // Header Left
  doc.text("TẬP ĐOÀN CÔNG NGHIỆP", leftColCenter, 20, { align: "center" });
  doc.text("THAN – KHOÁNG SẢN VIỆT NAM", leftColCenter, 25, {
    align: "center",
  });

  doc.text(compLine1, leftColCenter, 30, { align: "center" });
  if (compLine2) {
    doc.text(compLine2, leftColCenter, 35, { align: "center" });
    doc.line(leftColCenter - 15, 36, leftColCenter + 15, 36);
  } else {
    doc.line(leftColCenter - 15, 31, leftColCenter + 15, 31);
  }

  // Header Right
  doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", rightColCenter, 20, {
    align: "center",
  });
  doc.text("Độc lập - Tự do - Hạnh phúc", rightColCenter, 26, {
    align: "center",
  });
  doc.line(rightColCenter - 15, 27, rightColCenter + 15, 27);

  // Date
  doc.setFont("times_new_roman_italic", "italic");
  doc.setFontSize(10);
  const today = new Date(item.ngayTao || new Date());
  const dateStr = `Quảng Ninh, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
  doc.text(dateStr, pageWidth - 20, 40, { align: "right" });

  // Title
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(14);
  doc.text("BIÊN BẢN ĐÁNH GIÁ CHẤT LƯỢNG VẬT TƯ THU HỒI", pageWidth / 2, 58, {
    align: "center",
  });

  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(11);
  let y = 70;

  doc.text(`Căn cứ Quyết định số:`, 20, y);
  doc.text(`${item?.quyetDinhSo || "……………"}`, 60, y);
  doc.setFont("times_new_roman", "normal");
  y += 7;

  doc.text(`Căn cứ hồ sơ:`, 20, y);
  doc.text(`${item?.canCuHoSo || "……………"}`, 45, y);
  doc.setFont("times_new_roman", "normal");
  y += 7;

  doc.text("- Tổ đánh giá vật tư thu hồi gồm:", 20, y);
  y += 7;

  listSigneInfos.forEach((s, idx) => {
    doc.text(`${idx + 1}.`, 25, y);
    doc.setFont("times_new_roman", "normal");
    doc.text(`Ông/Bà: ${s.hoTen || "………………………"}`, 35, y);
    doc.text(`Chức vụ: ${s.chucVu || "………………………"}`, 100, y);
    y += 7;
  });

  const ngayDanhGia = new Date(item?.ngayDanhGia || new Date());
  y += 3;
  doc.text(
    `- Thời gian: Ngày ${ngayDanhGia.getDate()} tháng ${ngayDanhGia.getMonth() + 1} năm ${ngayDanhGia.getFullYear()}. Địa điểm: ${item?.diaDiem || ""}`,
    20,
    y,
  );
  y += 7;
  doc.text(
    "- Tổ nghiệm thu thống nhất nghiệm thu số lượng và chất lượng còn lại của vật tư thu hồi cụ thể như sau:",
    20,
    y,
  );
  y += 5;

  // Table
  const tableData: any[] = [
    [
      { content: "A", styles: { fontStyle: "bold" } },
      "",
      { content: "Chất thải nguy hại", styles: { fontStyle: "bold" } },
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ...(item.danhSachChiTiet || []).map((it: any, idx: number) => [
      String(idx + 1),
      it.idVatTu || "",
      it.tenVatTu || "",
      it.donViTinh || "",
      it.soLuong ?? "",
      it.khoiLuong ?? "",
      it.chatLuongConLai ?? "",
      it.donGia ?? "",
      it.giaTriConLai ?? "",
      it.ghiChu || "",
    ]),
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [
      [
        "TT",
        "Mã vật tư",
        "Tên PX/tên vật tư thu hồi",
        "ĐVT",
        "Số lượng",
        "Khối lượng\n(Kg)",
        "Đánh giá\nchất\nlượng\ncòn lại\n(%)",
        "Đơn\ngiá",
        "Giá trị\ncòn lại",
        "Ghi chú",
      ],
    ],
    body: tableData,
    theme: "grid",
    styles: { font: "times_new_roman", fontSize: 9, halign: "center", valign: "middle" },
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
      fontStyle: "bold",
      halign: "center",
      valign: "middle"
    },
    bodyStyles: { lineWidth: 0.1, lineColor: 0, textColor: 0 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" }, // TT
      1: { cellWidth: 20, halign: "center" }, // Mã vật tư
      2: { halign: "left" }, // Tên
      3: { cellWidth: 12, halign: "center" }, // ĐVT
      4: { cellWidth: 15, halign: "center" }, // Số lượng
      5: { cellWidth: 15, halign: "center" }, // Khối lượng
      6: { cellWidth: 18, halign: "center" }, // Đánh giá CL
      7: { cellWidth: 15, halign: "center" }, // Đơn giá
      8: { cellWidth: 20, halign: "center" }, // Giá trị còn lại
      9: { cellWidth: 15, halign: "left" }, // Ghi chú
    },
  });

  const lastY = (doc as any).lastAutoTable.finalY;
  y = lastY + 15;

  if (y > pageHeight - 60) {
    doc.addPage();
    y = 20;
  }

  // Signatures
  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};

  if (listSigneInfos.length > 0) {
    const leader = listSigneInfos[0];
    const members = listSigneInfos.slice(1);

    // Tổ trưởng bên trái
    doc.setFont("times_new_roman", "bold");
    doc.setFontSize(11);
    doc.text("TỔ TRƯỞNG TỔ ĐÁNH GIÁ", leftColCenter, y, { align: "center" });

    // Lưu tọa độ ký cho tổ trưởng
    const sigWidthMm = (120 / 800) * pageWidth;
    coordinates[leader.idNhanVien] = {
      xRatio: Math.max(
        0,
        Math.min((leftColCenter - sigWidthMm / 2) / pageWidth, 1),
      ),
      yRatio: Math.max(0, Math.min((y + 10) / pageHeight, 1)),
      page: (doc as any).internal.getNumberOfPages(),
    };

    doc.setFont("times_new_roman", "bold");
    doc.text(leader.hoTen || "", leftColCenter, y + 40, { align: "center" });

    // Thành viên bên phải
    doc.text("THÀNH VIÊN TỔ ĐÁNH GIÁ", rightColCenter - 10, y, {
      align: "center",
    });

    let memberY = y + 15;
    doc.setFont("times_new_roman", "normal");
    members.forEach((m, idx) => {
      const titleText = `${idx + 2}. ${m.chucVu || ""}`;
      const nameText = m.hoTen || "";
      const startX = rightColCenter - 55;
      const nameX = rightColCenter + 15;

      doc.text(titleText, startX, memberY);
      doc.text(nameText, nameX, memberY);

      const titleWidth = doc.getTextWidth(titleText);
      const dotStartX = startX + titleWidth + 2;
      const dotEndX = nameX - 2;

      if (dotEndX > dotStartX) {
        const dotWidth = doc.getTextWidth(".");
        const numDots = Math.floor((dotEndX - dotStartX) / dotWidth);
        doc.text(".".repeat(Math.max(0, numDots)), dotStartX, memberY);
      }

      const middleX = dotEndX > dotStartX ? (dotStartX + dotEndX) / 2 : startX + 30;
      coordinates[m.idNhanVien] = {
        xRatio: Math.max(0, Math.min((middleX - sigWidthMm / 2) / pageWidth, 1)),
        yRatio: Math.max(0, Math.min((memberY - 15) / pageHeight, 1)),
        page: (doc as any).internal.getNumberOfPages(),
      };

      memberY += 20; // Increased spacing to accommodate the signature above the line
    });
  } else {
    doc.setFont("times_new_roman", "italic");
    doc.text("Chưa có người duyệt", pageWidth / 2, y, { align: "center" });
  }

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};

export const generateKiemTraSuCoPdf = async (
  item: any,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const listSigneInfos: any[] = listSigneInfo(
    item,
    staffs,
    departments,
    positions,
  );
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(11);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftColCenter = pageWidth / 4;
  const rightColCenter = (pageWidth * 3) / 4;

  // Header Left
  doc.setFont("times_new_roman", "normal");
  doc.text("TẬP ĐOÀN CÔNG NGHIỆP", leftColCenter, 20, { align: "center" });
  doc.text("THAN - KHOÁNG SẢN VIỆT NAM", leftColCenter, 25, {
    align: "center",
  });
  doc.setFont("times_new_roman", "bold");
  doc.text(`${item?.congTy || currentBrandConfig.company}`, leftColCenter, 30, {
    align: "center",
  });
  doc.line(leftColCenter - 25, 31, leftColCenter + 25, 31);

  // Header Right
  doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", rightColCenter, 20, {
    align: "center",
  });
  doc.text("Độc lập - Tự do - Hạnh phúc", rightColCenter, 26, {
    align: "center",
  });
  doc.line(rightColCenter - 25, 27, rightColCenter + 25, 27);

  // Date
  doc.setFont("times_new_roman_italic", "italic");
  doc.setFontSize(11);
  const today = new Date(item.ngayTao || item.ngayKiemTra || new Date());
  const dateStr = `Quảng Ninh, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
  doc.text(dateStr, pageWidth - 20, 35, { align: "right" });

  // Title
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(14);
  doc.text("BIÊN BẢN", pageWidth / 2, 45, { align: "center" });
  doc.text(
    item?.tenMauBienBan || "KIỂM TRA SỰ CỐ THIẾT BỊ",
    pageWidth / 2,
    53,
    { align: "center" },
  );

  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(12);
  let y = 65;

  const getDots = (len: number) => ".".repeat(len);

  // Intro
  doc.text(
    `Hôm nay, ngày ....... tháng ........ năm ........... Tại ${item.viTri || getDots(50)}`,
    20,
    y,
  );
  y += 8;
  doc.setFont("times_new_roman", "bold");
  doc.text("Chúng tôi gồm:", 20, y);
  y += 8;

  doc.setFont("times_new_roman", "normal");
  listSigneInfos.forEach((s, i) => {
    doc.text(`${i + 1}. ${s.hoTen || getDots(30)}`, 25, y);
    doc.text(`${s.chucVu || getDots(20)}`, 85, y);
    doc.text(`${s.donVi || getDots(30)}`, 140, y);
    y += 7;
  });

  y += 3;
  doc.text(
    `Đã tiến hành kiểm tra tình trạng kỹ thuật thiết bị: ${getDots(70)}`,
    20,
    y,
  );
  y += 8;
  doc.text(`Số đăng ký: ${getDots(100)}`, 20, y);
  y += 8;
  doc.text(
    `Sau khi xảy ra sự cố vào lúc ....... giờ ....... ngày ....... tháng ....... năm ..........`,
    20,
    y,
  );
  y += 10;

  // Findings
  const writeField = (label: string, content: string) => {
    doc.setFont("times_new_roman", "bold");
    doc.text(label, 20, y);
    y += 6;
    doc.setFont("times_new_roman", "normal");
    const lines = doc.splitTextToSize(content || getDots(120), pageWidth - 40);
    doc.text(lines, 25, y);
    y += lines.length * 6 + 2;
  };

  writeField("1. Nội dung sự cố:", item.nhanXetKetLuan || item.moTa || "");
  writeField("2. Điều kiện vận hành:", "");
  writeField("3. Nội dung sửa chữa/ bảo dưỡng gần nhất:", "");
  writeField("4. Tình trạng thiết bị:", "");
  writeField("5. Sơ bộ xác định nguyên nhân:", "");

  doc.setFont("times_new_roman", "bold");
  doc.text(
    "6. Nội dung cần sửa chữa khắc phục: (theo bảng kê chi tiết đính kèm)",
    20,
    y,
  );
  y += 8;

  // Table
  const tableData: any[] = [];
  (item.danhSachChiTiet || []).forEach((danhSachChiTiet: any, idx: number) => {
    // Group row (I/, II/, ...)
    tableData.push([
      {
        content: `${String.fromCharCode(73 + idx)}/`,
        styles: { fontStyle: "bold" },
      },
      {
        content: `Thiết bị: ${danhSachChiTiet.tenTaiSan || danhSachChiTiet.idTaiSan || ""}`,
        colSpan: 7,
        styles: { fontStyle: "bold" },
      },
    ]);

    // Hàng các vật tư chi tiết đi kèm
    if (
      !danhSachChiTiet.danhSachVatTu ||
      danhSachChiTiet.danhSachVatTu.length === 0
    ) {
      tableData.push([
        "",
        {
          content: "",
          colSpan: 7,
          styles: { fontStyle: "italic" },
        },
      ]);
    } else {
      danhSachChiTiet.danhSachVatTu.forEach((vt: any, vtIdx: number) => {
        tableData.push([
          `${idx + 1}.${vtIdx + 1}`,
          vt.tenVatTu || vt.idChiTietVatTu || "",
          vt.donViTinh || "",
          vt.soLuong || "",
          vt.tinhTrang || "",
          vt.soLuongSuaChua || 0,
          vt.soLuongThayMoi || 0,
          vt.ghiChu || "",
        ]);
      });
    }
  });
  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [
      [
        "TT",
        "Tên vật tư, thiết bị",
        "ĐVT",
        "SL",
        "Tình trạng kỹ thuật",
        "SC",
        "Thay mới",
        "Ghi chú",
      ],
    ],
    body: tableData,
    theme: "grid",
    styles: { font: "times_new_roman", fontSize: 10 },
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    bodyStyles: { lineWidth: 0.1, lineColor: 0, textColor: 0 },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { halign: "left" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 10, halign: "center" },
      4: { cellWidth: 35, halign: "left" },
      5: { cellWidth: 12, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
      7: { cellWidth: 25, halign: "left" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont("times_new_roman", "normal");
  doc.text(
    "Biên bản được lập xong lúc ...... giờ cùng ngày, được các thành phần thống nhất thông qua./.",
    15,
    y,
  );

  y += 15;
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 20;
  }

  // Signatures
  const marginX = 35;
  const printableWidth = pageWidth - 2 * marginX;
  const maxPerRow = 3;
  const rowGap = 60;
  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};
  const baseWidthPx = 120;
  const displayWidth = 800;

  listSigneInfos.forEach((s, index) => {
    const rowIndex = Math.floor(index / maxPerRow);
    const colIndex = index % maxPerRow;
    const itemsInRow = Math.min(
      maxPerRow,
      listSigneInfos.length - rowIndex * maxPerRow,
    );

    let x;
    if (itemsInRow === 1) x = pageWidth / 2;
    else {
      const gapSize = printableWidth / (itemsInRow - 1);
      x = marginX + colIndex * gapSize;
    }

    let yPos = y + rowIndex * rowGap;
    if (yPos > pageHeight - 80) {
      doc.addPage();
      y = 20 - rowIndex * rowGap;
      yPos = 20;
    }
    const sigWidthMm = (baseWidthPx / displayWidth) * pageWidth;

    coordinates[s.idNhanVien] = {
      xRatio: Math.max(0, Math.min((x - sigWidthMm / 2) / pageWidth, 1)),
      yRatio: Math.max(0, Math.min((yPos + 10) / pageHeight, 1)),
      page: (doc as any).internal.getNumberOfPages(),
    };

    doc.setFont("times_new_roman", "bold");
    doc.setFontSize(10);
    doc.text(s.title || s.donVi || "", x, yPos, { align: "center" });
    doc.setFont("times_new_roman_italic", "italic");
    doc.text("(Ký, ghi rõ họ tên)", x, yPos + 5, { align: "center" });
    doc.setFont("times_new_roman", "bold");
    doc.text(s.hoTen || "", x, yPos + 35, { align: "center" });
  });

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};

export const generateBienPhapMayMocPdf = async (
  item: any,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const listSigneInfos: any[] = listSigneInfo(
    item,
    staffs,
    departments,
    positions,
  );
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(11);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftColCenter = pageWidth / 4;
  const rightColCenter = (pageWidth * 3) / 4;

  // Header Left
  doc.setFont("times_new_roman", "normal");
  doc.text("TẬP ĐOÀN CÔNG NGHIỆP", leftColCenter, 20, { align: "center" });
  doc.text("THAN – KHOÁNG SẢN VIỆT NAM", leftColCenter, 25, {
    align: "center",
  });
  doc.setFont("times_new_roman", "bold");
  doc.text(`${item?.congTy || currentBrandConfig.company}`, leftColCenter, 30, {
    align: "center",
  });
  doc.line(leftColCenter - 25, 31, leftColCenter + 25, 31);

  // Header Right
  doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", rightColCenter, 20, {
    align: "center",
  });
  doc.text("Độc lập - Tự do - Hạnh phúc", rightColCenter, 26, {
    align: "center",
  });
  doc.line(rightColCenter - 25, 27, rightColCenter + 25, 27);

  // Date
  doc.setFont("times_new_roman_italic", "italic");
  doc.setFontSize(11);
  const today = new Date(item.ngayTao || new Date());
  const dateStr = `Quảng Ninh, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
  doc.text(dateStr, pageWidth - 20, 35, { align: "right" });

  // Title
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(14);
  doc.text(
    item?.tenMauBienBan || "BIỆN PHÁP SỬA CHỮA MÁY MÓC THIẾT BỊ",
    pageWidth / 2,
    48,
    { align: "center" },
  );

  let y = 62;

  // Date formatter helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Table Data mapping the provided columns
  const tableHead = [
    [
      "Số Lệnh/BP\nsửa chữa",
      "Số đề nghị",
      "Đơn vị\nSC",
      "Đơn vị\nphối hợp",
      "Hình\nthức",
      "Thời gian\nbắt đầu",
      "Thời gian\nkết thúc",
      "Thời gian\n(ngày)",
      "Ghi chú",
    ],
  ];

  const tableBody = [
    [
      item.soPhieu || "—",
      item.soDeNghi || "—",
      item.donViSuaChua || "—",
      item.donViPhoiHop || "—",
      item.hinhThuc || "—",
      formatDate(item.thoiGianBatDau),
      formatDate(item.thoiGianKetThuc),
      item.thoiGianNgay != null ? String(item.thoiGianNgay) : "—",
      item.ghiChu || "—",
    ],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: tableHead,
    body: tableBody,
    theme: "grid",
    styles: {
      font: "times_new_roman",
      fontSize: 9,
      halign: "center",
      valign: "middle",
    },
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
      fontStyle: "bold",
    },
    bodyStyles: { lineWidth: 0.1, lineColor: 0, textColor: [180, 0, 0] }, // Red as in the provided image
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 16 },
      5: { cellWidth: 22 },
      6: { cellWidth: 22 },
      7: { cellWidth: 16 },
      8: { halign: "left" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 20;
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 20;
  }

  // Signatures block
  const marginX = 35;
  const printableWidth = pageWidth - 2 * marginX;
  const maxPerRow = 3;
  const rowGap = 60;
  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};
  const baseWidthPx = 120;
  const displayWidth = 800;

  listSigneInfos.forEach((s, index) => {
    const rowIndex = Math.floor(index / maxPerRow);
    const colIndex = index % maxPerRow;
    const itemsInRow = Math.min(
      maxPerRow,
      listSigneInfos.length - rowIndex * maxPerRow,
    );

    let x;
    if (itemsInRow === 1) x = pageWidth / 2;
    else {
      const gapSize = printableWidth / (itemsInRow - 1);
      x = marginX + colIndex * gapSize;
    }

    let yPos = y + rowIndex * rowGap;
    if (yPos > pageHeight - 80) {
      doc.addPage();
      y = 20 - rowIndex * rowGap;
      yPos = 20;
    }
    const sigWidthMm = (baseWidthPx / displayWidth) * pageWidth;

    coordinates[s.idNhanVien] = {
      xRatio: Math.max(0, Math.min((x - sigWidthMm / 2) / pageWidth, 1)),
      yRatio: Math.max(0, Math.min((yPos + 10) / pageHeight, 1)),
      page: (doc as any).internal.getNumberOfPages(),
    };

    doc.setFont("times_new_roman", "bold");
    doc.setFontSize(10);
    doc.text(s.title || s.donVi || "", x, yPos, { align: "center" });
    doc.setFont("times_new_roman_italic", "italic");
    doc.text("(Ký, ghi rõ họ tên)", x, yPos + 5, { align: "center" });
    doc.setFont("times_new_roman", "bold");
    doc.text(s.hoTen || "", x, yPos + 35, { align: "center" });
  });

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};

export const generateBienPhapPhuongTienPdf = async (
  item: any,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const listSigneInfos: any[] = listSigneInfo(
    item,
    staffs,
    departments,
    positions,
  );
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftColCenter = 55;
  const rightColCenter = 155;

  // Header Left
  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(9.5);
  doc.text("TẬP ĐOÀN CÔNG NGHIỆP", leftColCenter, 20, { align: "center" });
  doc.text("THAN – KHOÁNG SẢN VIỆT NAM", leftColCenter, 25, {
    align: "center",
  });
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(10);
  doc.text(`${item?.congTy || currentBrandConfig.company}`, leftColCenter, 30, {
    align: "center",
  });

  // Underline for Company name
  doc.setLineWidth(0.3);
  doc.line(leftColCenter - 20, 31.5, leftColCenter + 20, 31.5);

  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(10);
  doc.text(`Số: ${item.soBienBan || "401"} /BP- CV`, leftColCenter, 37, {
    align: "center",
  });

  // Header Right
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(10);
  doc.text("CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM", rightColCenter, 20, {
    align: "center",
  });
  doc.setFontSize(11);
  doc.text("Độc lập – Tự do – Hạnh phúc", rightColCenter, 25, {
    align: "center",
  });

  // Underline for national motto
  doc.setLineWidth(0.3);
  doc.line(rightColCenter - 15, 26.5, rightColCenter + 15, 26.5);

  // Date
  doc.setFont("times_new_roman_italic", "italic");
  doc.setFontSize(10);
  const today = new Date(item.ngayTao || new Date());
  const dateStr = `Quảng Ninh, ngày ${today.getDate()} tháng ${String(today.getMonth() + 1).padStart(2, "0")} năm ${today.getFullYear()}`;
  doc.text(dateStr, rightColCenter + 15, 33, { align: "center" });

  // Title
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(13);
  doc.text(
    item?.tenMauBienBan || "BIỆN PHÁP SỬA CHỮA THIẾT BỊ",
    pageWidth / 2,
    47,
    { align: "center" },
  );

  doc.setFont("times_new_roman_italic", "italic");
  doc.setFontSize(11);
  doc.text(
    `V/v sửa chữa thiết bị ô tô xe máy – ${item.tenTaiSan || "Xe ô tô DONGFENG biển số 14C-12876"}`,
    pageWidth / 2,
    52,
    { align: "center" },
  );
  doc.setFont("times_new_roman_italic", "italic");
  doc.text(
    `Phân xưởng ${item.donViQuanLy || "........"} quản lý`,
    pageWidth / 2,
    57,
    { align: "center" },
  );

  let y = 67;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const renderBulletList = (text: string, x: number, maxWidth: number) => {
    if (!text) return;
    const items = text
      .split("\n")
      .map((i) => i.trim())
      .filter(Boolean);
    items.forEach((itemText) => {
      const formattedItem = itemText.startsWith("-")
        ? itemText
        : `- ${itemText}`;
      const lines = doc.splitTextToSize(formattedItem, maxWidth);
      lines.forEach((line: string, idx: number) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("times_new_roman", "normal");
        doc.setFontSize(11);
        const currentX = idx === 0 ? x : x + 3;
        doc.text(line, currentX, y);
        y += 6;
      });
    });
  };

  // I. MỤC ĐÍCH VÀ YÊU CẦU
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(11);
  doc.text("I. MỤC ĐÍCH VÀ YÊU CẦU", 15, y);
  y += 6;

  doc.setFont("times_new_roman", "bold");
  doc.text("1. Mục đích:", 15, y);
  y += 6;
  renderBulletList(
    item.mucDich || "Sửa chữa bảo dưỡng xe ô tô để huy động phục vụ sản xuất.",
    15,
    180,
  );

  doc.setFont("times_new_roman", "bold");
  doc.text("2. Yêu cầu:", 15, y);
  y += 6;
  renderBulletList(
    item.yeuCau ||
      "Thiết bị được sửa chữa lắp đặt phải đúng KTCB, trong quá trình lắp đặt phải có cán bộ chỉ huy trực tiếp tại hiện trường đảm bảo an toàn cho con người và thiết bị.",
    15,
    180,
  );

  // II. TÌNH TRẠNG HIỆN TẠI
  if (y > pageHeight - 25) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("times_new_roman", "bold");
  doc.text("II. TÌNH TRẠNG HIỆN TẠI", 15, y);
  y += 6;
  renderBulletList(
    item.tinhTrangHienTai ||
      "Đến kỳ bảo dưỡng.\nThiết bị hoạt động không ổn định.",
    15,
    180,
  );

  // III. BIỆN PHÁP SỬA CHỮA
  if (y > pageHeight - 25) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("times_new_roman", "bold");
  doc.text("III. BIỆN PHÁP SỬA CHỮA", 15, y);
  y += 6;

  doc.setFont("times_new_roman", "bold");
  doc.text("1. Nội dung thực hiện:", 15, y);
  y += 6;
  renderBulletList(
    item.noiDungThucHien ||
      "Vệ sinh công nghiệp thiết bị trước khi sửa chữa.\nTiến hành tháo lắp, kiểm tra và bảo dưỡng theo quy trình.\nVận hành chạy thử sau khi sửa chữa xong.",
    15,
    180,
  );

  if (y > pageHeight - 25) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("times_new_roman", "bold");
  doc.text("2. Chi phí vật tư:", 15, y);
  y += 6;

  // Table of Materials
  const tableHead = [
    [
      "STT",
      "Tên vật tư, thiết bị",
      "ĐVT",
      "Số lượng cấp",
      "Thu hồi",
      "Ghi chú",
    ],
  ];

  const tableBody = (item.danhSachChiTiet || []).map((vt: any, idx: number) => {
    const slCap =
      vt.soLuongCap != null
        ? String(vt.soLuongCap)
        : vt.soLuong != null
          ? String(vt.soLuong)
          : "—";
    const slThuHoi = vt.soLuongThuHoi != null ? String(vt.soLuongThuHoi) : "—";
    return [
      idx + 1,
      vt.tenVatTu || vt.idChiTietVatTu || "",
      vt.donViTinh || "",
      slCap,
      slThuHoi,
      vt.ghiChu || "",
    ];
  });

  if (tableBody.length === 0) {
    tableBody.push([
      "—",
      "Không có vật tư thiết bị thay thế",
      "—",
      "—",
      "—",
      "—",
    ]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: tableHead,
    body: tableBody,
    theme: "grid",
    styles: {
      font: "times_new_roman",
      fontSize: 9.5,
      halign: "center",
      valign: "middle",
      textColor: 0,
    },
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.15,
      lineColor: 0,
      fontStyle: "bold",
    },
    bodyStyles: { lineWidth: 0.15, lineColor: 0 },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { halign: "left", cellWidth: 85 },
      2: { cellWidth: 15 },
      3: { cellWidth: 23 },
      4: { cellWidth: 23 },
      5: { halign: "left" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // 3. Tiến độ thực hiện
  if (y > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("times_new_roman", "bold");
  doc.text("3.Tiến độ thực hiện: ", 15, y);
  const progText = `Từ ngày ${formatDate(item.tienDoTuNgay)} đến ngày ${formatDate(item.tienDoDenNgay)}.`;
  doc.setFont("times_new_roman", "normal");
  doc.text(progText, 52, y);
  y += 8;

  // IV. BIỆN PHÁP AN TOÀN
  if (y > pageHeight - 25) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("times_new_roman", "bold");
  doc.text("IV. BIỆN PHÁP AN TOÀN", 15, y);
  y += 6;
  renderBulletList(
    item.bienPhapAnToan ||
      "Thợ sửa chữa trang bị đầy đủ bảo hộ lao động theo quy định ATBHLĐ.\nChỉ những người được phổ biến biện pháp, phân công nhiệm vụ mới được tham gia công việc.",
    15,
    180,
  );

  if (y > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("times_new_roman_italic", "italic");
  doc.setFontSize(10.5);
  doc.text(
    "- Trong quá trình thực hiện phải tuân thủ các quy định, quy trình của nhà nước, Công ty đã ban hành đảm bảo kỹ thuật, an toàn ./. ",
    15,
    y,
    { maxWidth: 180 },
  );
  y += 18;

  y = y + 15;
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 20;
  }

  // Signatures block
  const marginX = 25;
  const printableWidth = pageWidth - 2 * marginX;
  const maxPerRow = 3;
  const rowGap = 60;
  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};
  const baseWidthPx = 120;
  const displayWidth = 800;

  listSigneInfos.forEach((s, index) => {
    const rowIndex = Math.floor(index / maxPerRow);
    const colIndex = index % maxPerRow;
    const itemsInRow = Math.min(
      maxPerRow,
      listSigneInfos.length - rowIndex * maxPerRow,
    );

    if (rowIndex > 0 && y + rowIndex * rowGap > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    let x;
    if (itemsInRow === 1) x = pageWidth / 2;
    else {
      const gapSize = printableWidth / (itemsInRow - 1);
      x = marginX + colIndex * gapSize;
    }

    const yPos = y + rowIndex * rowGap;
    const sigWidthMm = (baseWidthPx / displayWidth) * pageWidth;

    coordinates[s.idNhanVien] = {
      xRatio: Math.max(0, Math.min((x - sigWidthMm / 2) / pageWidth, 1)),
      yRatio: Math.max(0, Math.min((yPos + 10) / pageHeight, 1)),
      page: (doc as any).internal.getNumberOfPages(),
    };

    doc.setFont("times_new_roman", "bold");
    doc.setFontSize(10);
    doc.text(s.title || s.donVi || "", x, yPos, { align: "center" });
    doc.setFont("times_new_roman_italic", "italic");
    doc.text("(Ký, ghi rõ họ tên)", x, yPos + 5, { align: "center" });
    doc.setFont("times_new_roman", "bold");
    doc.text(s.hoTen || "", x, yPos + 35, { align: "center" });
  });

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};

export const generateNghiemThuPhuongTienPdf = async (
  item: any,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const listSigneInfos: any[] = listSigneInfo(
    item,
    staffs,
    departments,
    positions,
  );
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftColCenter = 55;
  const rightColCenter = 155;

  // Header Left
  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(9.5);
  doc.text("TẬP ĐOÀN CÔNG NGHIỆP", leftColCenter, 20, { align: "center" });
  doc.text("THAN – KHOÁNG SẢN VIỆT NAM", leftColCenter, 25, {
    align: "center",
  });
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(10);
  doc.text(`${item?.congTy || currentBrandConfig.company}`, leftColCenter, 30, {
    align: "center",
  });

  // Underline for Company name
  doc.setLineWidth(0.3);
  doc.line(leftColCenter - 20, 31.5, leftColCenter + 20, 31.5);

  // Header Right
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(10);
  doc.text("CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM", rightColCenter, 20, {
    align: "center",
  });
  doc.setFontSize(11);
  doc.text("Độc lập – Tự do – Hạnh phúc", rightColCenter, 25, {
    align: "center",
  });

  // Underline for national motto
  doc.setLineWidth(0.3);
  doc.line(rightColCenter - 15, 26.5, rightColCenter + 15, 26.5);

  // Date
  doc.setFont("times_new_roman_italic", "italic");
  doc.setFontSize(10);
  const today = new Date(item.ngayNghiemThu || item.ngayTao || new Date());
  const dateStr = `Quảng Ninh, ngày ${today.getDate()} tháng ${String(today.getMonth() + 1).padStart(2, "0")} năm ${today.getFullYear()}`;
  doc.text(dateStr, rightColCenter + 15, 33, { align: "center" });

  // Title
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(13);
  doc.text(item?.tenMauBienBan || "NGHIỆM THU SẢN PHẨM", pageWidth / 2, 47, {
    align: "center",
  });

  let y = 57;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // I. Thành phần
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(11);
  doc.text("I. Thành phần:", 15, y);
  y += 6;

  listSigneInfos.forEach((s, idx) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("times_new_roman", "normal");
    doc.text(`${idx + 1}. Ông: `, 15, y);
    doc.setFont("times_new_roman", "bold");
    doc.text(s.hoTen || "………………………", 30, y);
    doc.setFont("times_new_roman", "normal");
    doc.text(s.chucVu || "", 95, y);
    doc.text(s.donVi || "", 145, y);
    y += 6;
  });

  // II. Nội dung
  if (y > pageHeight - 25) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("times_new_roman", "bold");
  doc.text("II. Nội dung:", 15, y);
  doc.setFont("times_new_roman", "normal");

  const bpNumber = item.soBienBanBienPhap || item.soPhieu || "401/BP-CV";
  const bpDate = formatDate(item.ngayTaoBienPhap || item.ngayTao || new Date());
  const assetName = item.tenTaiSan || "xe ô tô DONGFENG biển số 14C-12876";
  const contentLine = `${item.noiDung}.`;
  const contentLines = doc.splitTextToSize(contentLine, 180);
  contentLines.forEach((line: string) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 15, y + 6);
    y += 6;
  });
  y += 8;

  if (y > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }
  doc.text(
    `1. Tình trạng kỹ thuật của thiết bị sau khi đã sửa chữa: ${item.tinhTrang || "Đảm bảo kỹ thuật."}`,
    15,
    y,
  );
  y += 6;
  if (y > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }
  doc.text(
    `2. Công việc phát sinh: ${item.congViecPhatSinh || "Không."}`,
    15,
    y,
  );
  y += 6;
  if (y > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }
  doc.text(`3. Chi phí vật tư, phụ tùng:`, 15, y);
  y += 6;

  // Table of Materials
  const tableHead: any[][] = [
    [
      {
        content: "TT",
        rowSpan: 2,
        styles: { halign: "center", valign: "middle" },
      },
      {
        content: "Vật tư - Phụ tùng thay thế",
        colSpan: 3,
        styles: { halign: "center" },
      },
      {
        content: "Vật tư - Phụ tùng thu hồi",
        colSpan: 3,
        styles: { halign: "center" },
      },
      {
        content: "Ghi chú",
        rowSpan: 2,
        styles: { halign: "center", valign: "middle" },
      },
    ],
    [
      "Tên vật tư",
      "ĐVT",
      "Số lượng",
      "Số lượng",
      "% còn lại",
      "Biện pháp xử lý",
    ],
  ];

  const tableBody = (item.danhSachChiTiet || []).map((vt: any, idx: number) => {
    return [
      idx + 1,
      vt.tenVatTu || vt.idChiTietVatTu || vt.idVatTu || "",
      vt.donViTinh || "Cái",
      vt.soLuongThayTe ?? vt.soLuongCap ?? vt.soLuong ?? 1,
      vt.soLuongThuHoi ?? 0,
      `${vt.phanTramConLai ?? 0}%`,
      vt.bienPhapXuLy || "",
      vt.ghiChu || "",
    ];
  });

  if (tableBody.length === 0) {
    tableBody.push([
      "—",
      "Không có vật tư thiết bị thay thế/thu hồi",
      "—",
      "—",
      "—",
      "—",
      "—",
      "—",
    ]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: tableHead,
    body: tableBody,
    theme: "grid",
    styles: {
      font: "times_new_roman",
      fontSize: 9,
      halign: "center",
      valign: "middle",
      textColor: 0,
    },
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.15,
      lineColor: 0,
      fontStyle: "bold",
    },
    bodyStyles: { lineWidth: 0.15, lineColor: 0 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { halign: "left", cellWidth: 60 },
      2: { cellWidth: 12 },
      3: { cellWidth: 15 },
      4: { cellWidth: 15 },
      5: { cellWidth: 15 },
      6: { halign: "left", cellWidth: 28 },
      7: { halign: "left" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // 4. Chi phí nhân công & Kết luận
  if (y > pageHeight - 25) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("times_new_roman", "bold");
  doc.text("4. Chi phí nhân công:", 15, y);
  doc.setFont("times_new_roman", "normal");
  doc.text(`Tổng cộng: ${item.chiPhiNhanCong ?? "—"} công.`, 55, y);
  y += 8;

  if (y > pageHeight - 25) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("times_new_roman", "bold");
  doc.text("Kết luận:", 15, y);
  doc.setFont("times_new_roman", "normal");
  doc.text(
    item.ketLuan ||
      `Thiết bị ${item.tenTaiSan || ""} đã được sửa chữa đảm bảo kỹ thuật đưa vào sử dụng.`,
    33,
    y,
  );
  y += 18;
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 20;
  }

  // Signatures block
  const marginX = 25;
  const printableWidth = pageWidth - 2 * marginX;
  const maxPerRow = 3;
  const rowGap = 60;
  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};
  const baseWidthPx = 120;
  const displayWidth = 800;

  listSigneInfos.forEach((s, index) => {
    const rowIndex = Math.floor(index / maxPerRow);
    const colIndex = index % maxPerRow;
    const itemsInRow = Math.min(
      maxPerRow,
      listSigneInfos.length - rowIndex * maxPerRow,
    );

    if (rowIndex > 0 && y + rowIndex * rowGap > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    let x;
    if (itemsInRow === 1) x = pageWidth / 2;
    else {
      const gapSize = printableWidth / (itemsInRow - 1);
      x = marginX + colIndex * gapSize;
    }

    const yPos = y + rowIndex * rowGap;
    const sigWidthMm = (baseWidthPx / displayWidth) * pageWidth;

    coordinates[s.idNhanVien] = {
      xRatio: Math.max(0, Math.min((x - sigWidthMm / 2) / pageWidth, 1)),
      yRatio: Math.max(0, Math.min((yPos + 10) / pageHeight, 1)),
      page: (doc as any).internal.getNumberOfPages(),
    };

    doc.setFont("times_new_roman", "bold");
    doc.setFontSize(10);
    doc.text(s.title || s.donVi || "", x, yPos, { align: "center" });
    doc.setFont("times_new_roman_italic", "italic");
    doc.text("(Ký, ghi rõ họ tên)", x, yPos + 5, { align: "center" });
    doc.setFont("times_new_roman", "bold");
    doc.text(s.hoTen || "", x, yPos + 35, { align: "center" });
  });

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};

// pdf báo cáo thống kê
export const generateTechnicalReportPdf = async (
  data: any,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const listSigneInfos: any[] = listSigneInfo(
    data,
    staffs,
    departments,
    positions,
  );
  const doc = new jsPDF("p", "mm", "a4");

  console.log(doc.getFontList());
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(11);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftColCenter = pageWidth / 4;
  const rightColCenter = (pageWidth * 3) / 4;

  // Header Left
  const companyName =
    `${data?.congTy || currentBrandConfig.company}`.toUpperCase();
  const words = companyName.split(" ");
  let companyLines: string[];
  if (words.length > 6) {
    const mid = Math.ceil(words.length / 2);
    companyLines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  } else {
    companyLines = doc.splitTextToSize(companyName, pageWidth / 2 - 20);
  }

  doc.text(companyLines, leftColCenter, 20, { align: "center" });

  let currentY = 20 + (companyLines.length - 1) * 5 + 6;
  const deptName = `${data?.tenDonViBaoCao || ""}`.toUpperCase();
  const deptLines = doc.splitTextToSize(deptName, pageWidth / 2 - 20);
  doc.text(deptLines, leftColCenter, currentY, { align: "center" });

  currentY += (deptLines.length - 1) * 5 + 1;
  doc.line(leftColCenter - 15, currentY, leftColCenter + 15, currentY); // Underline

  // Header Right
  doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", rightColCenter, 20, {
    align: "center",
  });
  doc.text("Độc lập - Tự do - Hạnh phúc", rightColCenter, 26, {
    align: "center",
  });
  doc.line(rightColCenter - 15, 27, rightColCenter + 15, 27);

  // Date
  doc.setFont("times_new_roman_italic", "italic");
  doc.setFontSize(10);
  const today = new Date(data?.ngayTao || new Date());
  const dateStr = `Quảng Ninh, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
  doc.text(dateStr, pageWidth - 20, 35, { align: "right" });

  // Title
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(14);
  doc.text(
    (data?.tenMauBienBan ?? "BÁO CÁO TÌNH TRẠNG KỸ THUẬT").toUpperCase(),
    pageWidth / 2,
    45,
    { align: "center" },
  );
  doc.setFontSize(11);
  doc.setFont("times_new_roman_italic", "italic");
  const equipmentText = `Thiết bị: ${data?.tenTaiSan || "..."}`;
  const splitEquipmentText = doc.splitTextToSize(equipmentText, pageWidth - 40);
  doc.text(splitEquipmentText, pageWidth / 2, 52, {
    align: "center",
  });

  // Content
  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(12);
  let y = 52 + splitEquipmentText.length * 6 + 7;
  const marginX = 30;

  doc.text(
    `Kính gửi: ${data?.tenDonViNhan || "..................................................."}`,
    marginX,
    y,
  );
  y += 10;

  const indent = "   ";

  const thangStr =
    data?.thang && data?.thang < 10 ? `0${data?.thang}` : data?.thang || "...";
  const canCu1 = `${indent}Căn cứ kế hoạch sửa chữa thường xuyên tháng ${thangStr} năm ${data?.nam || "..."}`;
  const canCu1Lines = doc.splitTextToSize(canCu1, pageWidth - 2 * marginX);
  doc.text(canCu1Lines, marginX, y);
  y += canCu1Lines.length * 7;

  const canCu2 = `${indent}Căn cứ tình trạng Kỹ thuật; giờ hoạt động lũy kế của ${data?.tenTaiSan || "..."}`;
  const canCu2Lines = doc.splitTextToSize(canCu2, pageWidth - 2 * marginX);
  doc.text(canCu2Lines, marginX, y);
  y += canCu2Lines.length * 7;

  const p1 = `${indent}Đơn vị ${data?.tenDonViBaoCao || "..."} báo cáo và đề nghị cho ${data?.tenTaiSan || "..."} bảo dưỡng các cấp cụ thể như sau:`;
  const p1Lines = doc.splitTextToSize(p1, pageWidth - 2 * marginX);
  doc.text(p1Lines, marginX, y);
  y += p1Lines.length * 7;

  const p2 = `${indent}1. Tên thiết bị: ${data?.tenTaiSan || "..."}`;
  const p2Lines = doc.splitTextToSize(p2, pageWidth - 2 * marginX);
  doc.text(p2Lines, marginX, y);
  y += p2Lines.length * 7;

  const p2b = `${indent}2. Ngày giờ bảo dưỡng gần nhất: ${data?.ngayBaoDuongGanNhat ? formatted(data?.ngayBaoDuongGanNhat) : "..."}`;
  const p2bLines = doc.splitTextToSize(p2b, pageWidth - 2 * marginX);
  doc.text(p2bLines, marginX, y);
  y += p2bLines.length * 7;

  const p3 = `${indent}3. Tình trạng kỹ thuật: ${data?.tinhTrang || "..."}`;
  const p3Lines = doc.splitTextToSize(p3, pageWidth - 2 * marginX);
  doc.text(p3Lines, marginX, y);
  y += p3Lines.length * 7;

  const p4 = `${indent}4. Nội dung sửa chữa: ${data?.noiDungSuaChua || "..."}`;
  const p4Lines = doc.splitTextToSize(p4, pageWidth - 2 * marginX);
  doc.text(p4Lines, marginX, y);
  y += p4Lines.length * 7;

  y += 3;
  const p5 = `Đề nghị ${data?.tenDonViNhan || "................"} Công ty kiểm tra, xét duyệt./.`;
  const p5Lines = doc.splitTextToSize(p5, pageWidth - 2 * marginX);
  doc.text(p5Lines, marginX, y);
  y += p5Lines.length * 7 + 10;

  // Signatures
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 30;
  }

  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};
  const baseWidthPx = 120;
  const displayWidth = 800;
  const colWidth = 45;
  const printableWidth = pageWidth - 2 * marginX;

  const maxPerRow = 5;
  listSigneInfos.forEach((s, index) => {
    const rowIndex = Math.floor(index / maxPerRow);
    const colIndex = index % maxPerRow;
    const itemsInRow = Math.min(
      maxPerRow,
      listSigneInfos.length - rowIndex * maxPerRow,
    );
    let x;
    if (itemsInRow === 1) {
      x = rightColCenter;
    } else {
      const firstX = marginX + colWidth / 2;
      const lastX = pageWidth - marginX - colWidth / 2;
      const gapSize = (lastX - firstX) / (itemsInRow - 1);
      x = firstX + colIndex * gapSize;
    }

    const currentY = y + rowIndex * 60;
    const sigWidthMm = (baseWidthPx / displayWidth) * pageWidth;
    coordinates[s.idNhanVien] = {
      xRatio: Math.max(0, Math.min((x - sigWidthMm / 2) / pageWidth, 1)),
      yRatio: Math.max(0, Math.min((currentY + 5) / pageHeight, 1)),
      page: (doc as any).internal.getNumberOfPages(),
    };

    doc.setFontSize(10);
    doc.setFont("times_new_roman", "bold");
    const donViLines = doc.splitTextToSize(
      (s.donVi || s.departmentName || s.title || "Ký tên").toUpperCase(),
      colWidth,
    );
    doc.text(donViLines, x, currentY, { align: "center" });

    const nameY = currentY + 30;
    const hoTenLines = doc.splitTextToSize(
      s.hoTen || s.userName || "",
      colWidth,
    );
    doc.text(hoTenLines, x, nameY, { align: "center" });
  });

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};

export const generatePhieuGiaoViecPdf = async (
  data: any,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(14);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  doc.text(currentBrandConfig.company.toUpperCase(), centerX, 20, {
    align: "center",
  });
  doc.setFont("times_new_roman", "bold");
  doc.text(`Đơn vị: ${data?.tenDonViQuanLy}`, centerX, 26, { align: "center" });

  doc.setFontSize(18);
  doc.text("PHIẾU GIAO VIỆC", centerX, 40, { align: "center" });

  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(12);
  doc.text(
    `Số phiếu: ${data?.soPhieu || "........................"}`,
    centerX,
    46,
    { align: "center" },
  );

  let y = 55;
  doc.text(
    `Ca ${data?.caBatDau || "..."} ${formatted(data?.ngayBatDau)}.`,
    15,
    y,
  );
  y += 6;
  doc.text(
    "Phân xưởng giao cho: Tổ sửa chữa thực hiện các công việc sau.",
    15,
    y,
  );
  y += 6;
  const dsTaiSan = data?.danhSachTaiSan || [];
  const thietBiBKS = dsTaiSan.map((ts: any) => ts.tenTaiSan).join("; ");

  const thietBiText = doc.splitTextToSize(
    `Bảo dưỡng thiết bị: ${thietBiBKS || "..................................................................................."}`,
    pageWidth - 30,
  );
  doc.text(thietBiText, 15, y);
  y += 6 * thietBiText.length;

  doc.setFont("times_new_roman", "bold");
  doc.text("I. Nội dung công việc:", 15, y);
  y += 2;

  const table1Data = dsTaiSan.map((ts: any, idx: number) => {
    const userInfo = findById(staffs, ts.nguoiThucHien);
    const tenNguoiTH =
      userInfo?.hoTen || ts.tenNguoiThucHien || ts.nguoiThucHien || "";
    return [
      idx + 1,
      ts.maCongViec || "",
      ts.noiDung || ts.tenTaiSan || "",
      tenNguoiTH,
      "",
    ];
  });

  autoTable(doc, {
    startY: y + 2,
    margin: { left: 15, right: 15 },
    head: [
      [
        "TT",
        "Mã công việc",
        "Nội dung công việc",
        "Đại diện nhóm người TH",
        "Ký nhận việc",
      ],
    ],
    body:
      table1Data.length > 0
        ? table1Data
        : [["", "", "Chưa có nội dung công việc", "", ""]],
    theme: "grid",
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
      font: "times_new_roman",
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      font: "times_new_roman",
      fontSize: 10,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 40, halign: "center" },
      4: { cellWidth: 30, halign: "center" },
    },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(12);
  doc.text("II. Vật tư:", 15, finalY);

  const dsVatTu = data?.danhSachVatTu || [];
  const table2Data = dsVatTu.map((vt: any, idx: number) => [
    idx + 1,
    vt.idVatTu || "",
    vt.tenVatTu || "",
    vt.kyHieu || "",
    vt.donViTinh || "",
    vt.soLuong || "",
    vt.ghiChu || "",
  ]);

  autoTable(doc, {
    startY: finalY + 4,
    margin: { left: 15, right: 15 },
    head: [
      [
        "TT",
        "Mã số vật tư",
        "Tên vật tư",
        "Mã hiệu, quy cách",
        "ĐVT",
        "Số lượng",
        "Ghi chú",
      ],
    ],
    body:
      table2Data.length > 0
        ? table2Data
        : [["", "", "Chưa có vật tư", "", "", "", ""]],
    theme: "grid",
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
      font: "times_new_roman",
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      font: "times_new_roman",
      fontSize: 10,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 30, halign: "center" },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 25, halign: "center" },
    },
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(12);

  const footer1 = `Dự kiến thời gian hoàn thành ca ${data?.caDuKien || "..."} ${formatted(data?.ngayDuKien)}.`;
  doc.text(footer1, 15, finalY);
  finalY += 6;

  const footer2 =
    "Người lao động làm các công việc trên phải thực hiện đầy đủ các quy trình kỹ thuật và các biện pháp đảm bảo an toàn.";
  const splitFooter = doc.splitTextToSize(footer2, pageWidth - 30);
  doc.text(splitFooter, 15, finalY);
  finalY += splitFooter.length * 6 + 10;

  if (finalY > pageHeight - 60) {
    doc.addPage();
    finalY = 20;
  }
  const listSigneInfos: any[] = listSigneInfo(
    data,
    staffs,
    departments,
    positions,
  );

  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};

  if (listSigneInfos.length === 0) {
    doc.setFont("times_new_roman", "italic");
    doc.text("Chưa có người ký", centerX, finalY, { align: "center" });
  } else {
    const marginX = 20;
    const printableWidth = pageWidth - 2 * marginX;
    const maxPerRow = 3;
    const rowGap = 50;
    const baseWidthPx = 120;
    const displayWidth = 800;

    listSigneInfos.forEach((s: any, index: number) => {
      const rowIndex = Math.floor(index / maxPerRow);
      const colIndex = index % maxPerRow;
      const itemsInRow = Math.min(
        maxPerRow,
        listSigneInfos.length - rowIndex * maxPerRow,
      );

      let x;
      if (itemsInRow === 1) x = pageWidth / 2;
      else {
        const gapSize = printableWidth / (itemsInRow - 1);
        x = marginX + colIndex * gapSize;
      }

      let yPos = finalY + rowIndex * rowGap;
      if (yPos > pageHeight - 40) {
        doc.addPage();
        finalY = 20 - rowIndex * rowGap;
        yPos = 20;
      }
      const sigWidthMm = (baseWidthPx / displayWidth) * pageWidth;

      coordinates[s.idNhanVien || s.idNguoiKy || s.userId] = {
        xRatio: Math.max(0, Math.min((x - sigWidthMm / 2) / pageWidth, 1)),
        yRatio: Math.max(0, Math.min((yPos + 10) / pageHeight, 1)),
        page: (doc as any).internal.getNumberOfPages(),
      };

      let label = "";
      if (index === 0) label = "Người giao việc";
      else if (index === 1) label = "Người nhận việc";
      else label = s.chucVu || s.title || s.donVi || "Phê duyệt";

      doc.setFont("times_new_roman", "bold");
      doc.setFontSize(10);
      const splitLabel = doc.splitTextToSize(label, 45);
      doc.text(splitLabel, x, yPos, { align: "center" });

      const nameY = yPos + 35;
      const name = s.hoTen || s.userName || s.tenNguoiKy || "";
      const splitName = doc.splitTextToSize(name, 45);
      doc.text(splitName, x, nameY, { align: "center" });
    });
  }

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};

export const generatePhieuLinhVatTuPdf = async (
  data: any,
  staffs: any[],
  departments: any[],
  positions: any[],
): Promise<{
  pdf: Uint8Array;
  coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}> => {
  const doc = new jsPDF("l", "mm", "a4");

  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(13);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  const donViInfo = departments.find((d) => d.id === data?.donViDeNghi);
  const tenDonVi =
    donViInfo?.tenPhongBan ||
    data?.donViDeNghi ||
    "...................................................";

  const companyName = (
    currentBrandConfig.company || "CÔNG TY KHO VẬN VÀ CẢNG CẨM PHẢ - VINACOMIN"
  ).toUpperCase();
  let compLine1 = companyName;
  let compLine2 = "";
  const words = companyName.split(" ");
  if (words.length > 6) {
    compLine1 = words.slice(0, 6).join(" ");
    compLine2 = words.slice(6).join(" ");
  }

  const leftCenterX = 55;
  const rightCenterX = pageWidth - 60;

  // Số phiếu ở đầu trang
  doc.setFont("times_new_roman", "normal");
  doc.text(`Số phiếu: ${data?.soPhieu || "....."}`, rightCenterX, 15, {
    align: "center",
  });

  // Header trái
  doc.setFont("times_new_roman", "normal");
  doc.text(compLine1, leftCenterX, 22, { align: "center" });
  if (compLine2) {
    doc.text(compLine2, leftCenterX, 28, { align: "center" });
  }
  doc.setFont("times_new_roman", "bold");
  doc.text(tenDonVi, leftCenterX, compLine2 ? 34 : 28, { align: "center" });

  // Header phải
  doc.setFont("times_new_roman", "bold");
  doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", rightCenterX, 22, {
    align: "center",
  });
  doc.text("Độc lập - Tự do - Hạnh phúc", rightCenterX, 28, {
    align: "center",
  });
  const titleX2 = doc.getTextWidth("Độc lập - Tự do - Hạnh phúc");
  doc.line(rightCenterX - titleX2 / 2, 29, rightCenterX + titleX2 / 2, 29);

  doc.setFont("times_new_roman_italic", "italic");
  doc.text(`Quảng Ninh, ${formatted(data?.ngayTao)}`, rightCenterX, 42, {
    align: "center",
  });

  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(16);
  doc.text("ĐỀ NGHỊ LĨNH VẬT TƯ CẤP MỚI VÀ TRẢ VẬT TƯ THU HỒI", centerX, 52, {
    align: "center",
  });

  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(14);
  doc.text(
    `- Căn cứ Quyết định ${data?.soQuyetDinh || "........."}/QĐ-KVCP, v/v ban hành định mức cho các thiết bị cơ điện luồng cảng.`,
    15,
    65,
  );
  doc.text(
    `- Phân xưởng: ${tenDonVi} đề nghị Giám đốc, các phòng chức năng duyệt lĩnh các vật tư sau :`,
    15,
    73,
  );

  const dsVatTu = data?.danhSachVatTu || [];
  let tableData = dsVatTu.map((row: any, index: number) => {
    let md = index === 0 ? data?.mucDichSuDung || "" : "";
    let gc = index === 0 ? data?.ghiChu || "" : "";
    return [
      index + 1,
      row.idVatTu || "",
      row.tenVatTu || "",
      row.kyHieu || "-",
      row.donViTinh || "",
      row.soLuongDeNghi || 0,
      row.soLuongDuyet || 0,
      md,
      row.soLuongThuCu || 0,
      gc,
    ];
  });

  if (tableData.length === 0) {
    tableData = [["", "", "", "", "", "", "", "", "", ""]];
  }

  autoTable(doc, {
    startY: 85,
    margin: { left: 15, right: 15 },
    head: [
      [
        {
          content: "TT",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Mã vật tư",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Tên vật tư",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Danh điểm, thông số kỹ thuật, số chế tạo hoặc quy cách",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Đơn vị tính",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Số lượng Vật tư cấp mới",
          colSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Mục đích sử dụng",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Số lượng vật tư thu cũ",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Ghi chú",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
      ],
      [
        { content: "Đề nghị", styles: { halign: "center", valign: "middle" } },
        { content: "Duyệt", styles: { halign: "center", valign: "middle" } },
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: false,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
      font: "times_new_roman",
      fontStyle: "bold",
    },
    bodyStyles: {
      font: "times_new_roman",
      fontSize: 11,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: 0,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 25 },
      2: { cellWidth: 35 },
      3: { cellWidth: 40 },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
      7: { cellWidth: 40 },
      8: { cellWidth: 25, halign: "center" },
      9: { cellWidth: 35 },
    },
    didDrawCell: function (data) {
      // Handle row span for column 7 and 9
    },
    willDrawCell: function (data) {
      if (
        data.section === "body" &&
        (data.column.index === 7 || data.column.index === 9)
      ) {
        if (data.row.index > 0) {
          // If we want to hide it, but jspdf-autotable doesn't easily support dynamic rowSpan in array input without object definitions.
          // Wait, it is simpler to just set the content to '' for index > 0. Which we did.
          // If we want to remove top border, we can adjust styles.
        }
      }
    },
  });

  // Since jspdf-autotable doesn't easily do rowSpan across dynamically generated rows without complex obj structures,
  // we just let it draw empty cells for the subsequent rows.

  let finalY = (doc as any).lastAutoTable.finalY + 15;

  const listSigneInfos: any[] = listSigneInfo(
    data,
    staffs,
    departments,
    positions,
  );

  const coordinates: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  > = {};

  if (listSigneInfos.length === 0) {
    doc.setFont("times_new_roman", "italic");
    doc.text("Chưa có người ký", centerX, finalY, { align: "center" });
  } else {
    const signatureWidth = 50;
    const spacing =
      (pageWidth - 30 - signatureWidth * listSigneInfos.length) /
      (listSigneInfos.length + 1);

    listSigneInfos.forEach((s: any, index: number) => {
      let roleText =
        index === 0
          ? "NGƯỜI LẬP"
          : s.chucVu || s.position || s.tenChucVu || "Người ký";

      const xPos = 15 + spacing + index * (signatureWidth + spacing);
      const yPos = finalY;

      doc.setFont("times_new_roman", "bold");
      doc.setFontSize(11);
      const splitLabel = doc.splitTextToSize(
        roleText.toUpperCase(),
        signatureWidth,
      );
      doc.text(splitLabel, xPos + signatureWidth / 2, yPos, {
        align: "center",
      });

      coordinates[s.idNguoiKy || s.userId || s.idNhanVien || ""] = {
        xRatio: Math.max(0, Math.min(xPos / pageWidth, 1)),
        yRatio: Math.max(0, Math.min((yPos + 5) / pageHeight, 1)),
        page: (doc as any).internal.getNumberOfPages(),
      };

      const nameY = yPos + 35;
      const name =
        s.userName || s.hoTen || s.tenNhanVien || "........................";
      const splitName = doc.splitTextToSize(name, signatureWidth);
      doc.text(splitName, xPos + signatureWidth / 2, nameY, {
        align: "center",
      });
    });
  }

  return {
    pdf: new Uint8Array(doc.output("arraybuffer")),
    coordinates,
  };
};
