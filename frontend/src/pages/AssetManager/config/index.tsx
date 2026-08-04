import { Box, Chip, Typography } from "@mui/material";
import dayjs from "dayjs";
import "../../../assets/fonts/times_new_roman-normal";
import "../../../assets/fonts/times_new_roman-bold";

export const ShowStatus = (trangThai: string) => {
  let label = "Đã đăng kiểm";
  let color = "#4caf50";

  if (trangThai === "DA_DANG_KIEM") {
    label = "Đã đăng kiểm";
    color = "#4caf50";
  } else if (trangThai === "SAP_DEN_HAN") {
    label = "Sắp đến hạn đăng kiểm";
    color = "#ff9800";
  } else if (trangThai === "QUA_HAN") {
    label = "Quá hạn đăng kiểm";
    color = "#f44336";
  } else {
    label = "Quá hạn đăng kiểm";
    color = "#f44336";
  }

  return (
    <Chip
      label={label}
      sx={{
        backgroundColor: color,
        color: "white",
        fontWeight: 600,
        fontSize: "12px",
        borderRadius: "4px",
        height: "24px",
      }}
    />
  );
};

export const showDownloadFile = (fileName: string, onDownload: () => void) => {
  return (
    <Box
      component="span"
      onClick={(e) => {
        e.stopPropagation();
        onDownload();
      }}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
        color: "#1976d2", // Màu xanh link truyền thống
        "&:hover": {
          textDecoration: "underline",
          color: "#115293",
        },
        transition: "all 0.2s",
        gap: 0.5,
      }}
    >
      <Typography
        variant="body2"
        component="span"
        sx={{
          fontSize: "13px",
          fontWeight: 500,
          whiteSpace: "normal",
          wordBreak: "break-all",
          flex: 1,
        }}
      >
        {fileName || "Tài liệu đính kèm"}
      </Typography>
      <FileDownloadOutlined sx={{ fontSize: "16px" }} />
    </Box>
  );
};

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AssetHoursType,
  AssetType,
  MaintenanceIncidentType,
  TransferHistoryData,
} from "../types";
import { FileDownloadOutlined } from "@mui/icons-material";
import { findById } from "../../../utils/helpers";
import { PDFDocument } from "pdf-lib";
import { currentBrandConfig } from "../../../config/brandConfig";

// Trang 1: BÌA - LÝ LỊCH THIẾT BỊ
export const generateAssetCoverPDF = async (
  asset: AssetType,
): Promise<Uint8Array> => {
  const doc = new jsPDF();
  doc.setFont("times_new_roman", "normal");

  // Nền màu hồng toàn trang
  doc.setFillColor(212, 111, 158);
  doc.rect(0, 0, 210, 297, "F");

  // Viền ngoài đậm
  doc.setDrawColor(26, 26, 26);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, 194, 281);
  // Viền trong mảnh
  doc.setLineWidth(0.3);
  doc.rect(11, 11, 188, 275);

  // Header – tên tập đoàn / công ty
  doc.setTextColor(14, 14, 14);
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(13);
  doc.text("TẬP ĐOÀN CÔNG NGHIỆP THAN - KHOÁNG SẢN VIỆT NAM", 105, 30, {
    align: "center",
  });
  doc.text(currentBrandConfig.company, 105, 40, { align: "center" });

  // Tiêu đề chính
  doc.setFontSize(30);
  doc.setFont("times_new_roman", "bold");
  (doc as any).setCharSpace(3);
  doc.text("LÝ LỊCH THIẾT BỊ", 90, 100, { align: "center" });
  (doc as any).setCharSpace(0);

  // Các trường thông tin (style đường kẻ chấm đứt)
  const drawField = (label: string, value: string, y: number) => {
    doc.setFont("times_new_roman", "bold");
    doc.setFontSize(14);
    doc.text(label, 30, y);
    const labelWidth = doc.getTextWidth(label);
    doc.setFont("times_new_roman", "normal");
    doc.setFontSize(14);
    if (value) doc.text(value, 35 + labelWidth, y);
    // Đường kẻ chấm từ sau label đến lề phải
    (doc as any).setLineDash([1, 2]);
    doc.setLineWidth(0.2);
    doc.setDrawColor(26, 26, 26);
    doc.line(
      35 + labelWidth + (value ? doc.getTextWidth(value) + 2 : 0),
      y + 1,
      178,
      y + 1,
    );
    (doc as any).setLineDash([]);
  };

  drawField("Tên thiết bị :", asset?.tenTaiSan || "", 130);
  drawField("Mã hiệu :", asset?.kyHieu || "", 150);
  drawField("Số chế tạo :", "", 170);
  drawField("Số kiểm kê :", "", 190);

  // Footer
  doc.setFont("times_new_roman", "normal");
  doc.setFontSize(13);
  doc.setTextColor(14, 14, 14);
  const year = dayjs().year();
  doc.text(`Tháng ..... năm ......`, 105, 265, { align: "center" });

  return new Uint8Array(doc.output("arraybuffer"));
};

// Trang 2: THÔNG TIN TÀI SẢN (theo layout AssetInfo)
export const generateAssetPdf = async (
  asset: AssetType,
  allAssetModel: any[],
  allCurrentStatus: any[],
  assetGroups: any[],
  allDepartments: any[],
  allUnits: any[],
  allReasonIncreases: any[],
): Promise<Uint8Array> => {
  const doc = new jsPDF();
  doc.setFont("times_new_roman", "normal");

  // Tiêu đề
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(16);
  doc.text("LÝ LỊCH THIẾT BỊ", 105, 15, { align: "center" });

  // ---- Header thông tin bìa (giống phần đầu AssetInfo) ----
  let y = 25;
  const drawDottedField = (
    label: string,
    value: string,
    yPos: number,
    x1 = 15,
    x2 = 195,
  ) => {
    doc.setFont("times_new_roman", "normal");
    doc.setFontSize(11);
    doc.text(label, x1, yPos);
    const lw = doc.getTextWidth(label);
    if (value) {
      doc.setFont("times_new_roman", "bold");
      doc.text(value, x1 + lw + 2, yPos);
    }
    (doc as any).setLineDash([1, 2]);
    doc.setLineWidth(0.2);
    doc.setDrawColor(26, 26, 26);
    const usedWidth = lw + (value ? doc.getTextWidth(value) + 4 : 2);
    doc.line(x1 + usedWidth, yPos + 1, x2, yPos + 1);
    (doc as any).setLineDash([]);
  };

  drawDottedField(
    "Tên thiết bị, mã hiệu:  ",
    `${asset?.tenTaiSan || ""}${asset?.kyHieu ? " - " + asset.kyHieu : ""}`,
    y,
  );
  y += 10;
  drawDottedField("Số chế tạo:  ", "", y, 15, 100);
  drawDottedField("Số kiểm kê:  ", "", y, 110, 195);
  y += 10;
  drawDottedField("Tên nhà máy chế tạo:  ", "", y);
  y += 10;
  drawDottedField("Nước chế tạo:  ", asset?.nuocSanXuat || "", y, 15, 100);
  drawDottedField(
    "Năm chế tạo:  ",
    asset?.namSanXuat ? String(asset.namSanXuat) : "",
    y,
    110,
    195,
  );
  y += 14;

  // Tiêu đề phần chi tiết
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(16);
  doc.text("ĐẶC TÍNH KĨ THUẬT", 105, y, { align: "center" });
  y += 5;

  // --- Phần thông tin chính (giữ nguyên) ---
  const pairs: [string, any][] = [
    ["Số thẻ tài sản", asset.soThe],
    ["Nguyên giá", formatCurrency(asset.nguyenGia)],
    ["Giá trị khấu hao ban đầu", formatCurrency(asset.giaTriKhauHaoBanDau)],
    ["Kỳ khấu hao ban đầu", asset.kyKhauHaoBanDau],
    ["Giá trị thanh lý", formatCurrency(asset.giaTriThanhLy)],
    ["Mô hình tài sản", asset.tenMoHinh || asset.idMoHinhTaiSan],
    [
      "Phương pháp khấu hao",
      asset.phuongPhapKhauHao === 1 ? "Đường thẳng" : "Khác",
    ],
    ["Số kỳ khấu hao", asset.soKyKhauHao],
    ["Tài khoản tài sản", asset.taiKhoanTaiSan],
    ["Tài khoản khấu hao", asset.taiKhoanKhauHao],
    ["Tài khoản chi phí", asset.taiKhoanChiPhi],
    ["Nhóm tài sản", asset.tenNhom || asset.idNhomTaiSan],
    ["Loại tài sản", asset.tenLoaiTaiSanCon || asset.idLoaiTaiSanCon],
    ["Dự án", asset.tenDuAn || asset.idDuDan],
    ["Vốn NS", formatCurrency(asset.nvNS)],
    ["Vốn vay", formatCurrency(asset.vonVay)],
    ["Vốn khác", formatCurrency(asset.vonKhac)],
    ["Mã hiệu", asset.kyHieu],
    ["Số mã hiệu", asset.soKyHieu],
    ["Công suất", asset.congSuat],
    ["Nước sản xuất", asset.nuocSanXuat],
    ["Năm sản xuất", asset.namSanXuat],
    ["Lý do tăng", asset.lyDoTang],
    ["Hiện trạng", findById(allCurrentStatus, asset.hienTrang)?.tenHTKT],
    ["Số lượng", asset.soLuong],
    ["Đơn vị tính", asset.tenDonViTinh],
    ["Kho", asset.tenDonViBanDau || asset.idDonViBanDau],
    ["Đơn vị hiện thời", asset.tenDonViHienThoi || asset.idDonViHienThoi],
  ];

  // Nhóm thành dòng 2 cặp (4 cột)
  const rows: any[] = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const pair1 = pairs[i];
    const pair2 = pairs[i + 1];
    rows.push([
      pair1[0],
      pair1[1],
      pair2 ? pair2[0] : "",
      pair2 ? pair2[1] : "",
    ]);
  }

  const tableBody: any[] = [
    [
      {
        content: `Tên tài sản: ${asset.tenTaiSan}`,
        colSpan: 4,
        styles: { fontSize: 12, fontStyle: "bold" },
      },
    ],
    ...rows,
    [
      "Ngày vào sổ:",
      asset.ngayVaoSo ? dayjs(asset.ngayVaoSo).format("DD/MM/YYYY") : "",
    ],
    [
      "Ngày sử dụng:",
      asset.ngaySuDung ? dayjs(asset.ngaySuDung).format("DD/MM/YYYY") : "",
    ],
    [
      {
        content: `Ghi chú: ${asset.ghiChu || ""}`,
        colSpan: 4,
        styles: { fontSize: 11, fontStyle: "italic" },
      },
    ],
  ];

  autoTable(doc, {
    startY: y + 4,
    body: tableBody,
    theme: "plain",
    styles: { font: "times_new_roman", fontSize: 11, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { cellWidth: 60 },
      2: { fontStyle: "bold", cellWidth: 45 },
      3: { cellWidth: 60 },
    },
    margin: { left: 15, right: 15 },
  });

  let yFinal = (doc as any).lastAutoTable.finalY + 10;

  // --- Phần tài sản con (liệt kê dạng văn bản, không kẻ bảng) ---
  if (asset.taiSanConList && asset.taiSanConList.length > 0) {
    const conList = asset.taiSanConList.filter((con: any) => !con.isDeleted);
    if (conList.length > 0) {
      doc.setFont("times_new_roman", "bold");
      doc.setFontSize(12);
      doc.text("Danh sách tài sản con:", 20, yFinal);
      yFinal += 6;
      doc.setFontSize(10);

      conList.forEach((con: any, idx: number) => {
        // Chuẩn bị nội dung: số thứ tự + mã tài sản + tên tài sản
        const line = `${idx + 1}. ${con.idTaiSanCon || ""} - ${con.tenTaiSan || "N/A"}`;
        // Tự động xuống dòng nếu nội dung quá dài
        const lines = doc.splitTextToSize(line, 170); // chiều rộng vùng in (A4 trừ lề)
        doc.text(lines, 25, yFinal);
        yFinal += lines.length * 5; // mỗi dòng cao 5mm (có thể điều chỉnh)
      });

      yFinal += 5; // khoảng cách sau danh sách
    }
  }

  // --- Phần danh sách tệp đính kèm (chỉ tên) ---
  if (asset.fileDinhKemList && asset.fileDinhKemList.length > 0) {
    doc.setFontSize(12);
    doc.text("Danh sách tệp đính kèm:", 20, yFinal);
    yFinal += 6;
    asset.fileDinhKemList
      .filter((file: any) => !file.isDeleted)
      .forEach((att, idx) => {
        doc.setFontSize(10);
        doc.text(`${idx + 1}. ${att.tenFile}`, 25, yFinal);
        yFinal += 5;
      });
  }

  // Không cần thêm trang nhúng nội dung nữa vì yêu cầu chỉ hiển thị tên
  return new Uint8Array(doc.output("arraybuffer"));
};

export const generateMonthlyActivityReport = async (
  scheduleList: any[],
  selectedYear: number = new Date().getFullYear(),
): Promise<Uint8Array> => {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(15);
  doc.text("THEO DÕI TÌNH HÌNH HOẠT ĐỘNG HÀNG THÁNG", 148, 14, {
    align: "center",
  });
  console.log(scheduleList);

  const rows = Array.from({ length: 12 }).map((_, i) => {
    const monthNum = i + 1;
    const schedule = scheduleList?.find((s: any) => s.thang === monthNum);
    let totalHours = 0;
    if (schedule?.chiTietLichTrinhs) {
      schedule.chiTietLichTrinhs.forEach((ct: any) => {
        totalHours += (ct.ca1 || 0) + (ct.ca2 || 0) + (ct.ca3 || 0);
      });
    }
    return {
      month: i + 1,
      year: selectedYear,
      totalHours,
    };
  });

  const grandTotal = rows.reduce((acc, row) => acc + row.totalHours, 0);
  const tableData: any[][] = rows.map((r) => [
    `${String(r.month).padStart(2, "0")}/${r.year}`,
    "", // Đơn vị quản lý
    r.totalHours > 0 ? r.totalHours : "", // Giờ hoạt động
    "", // Kết quả
    "",
    "",
    "",
    "",
    "", // Ngừng máy
    "", // Ghi chú
  ]);

  tableData.push([
    {
      content: "TỔNG",
      colSpan: 2,
      styles: { halign: "center", fontStyle: "bold" },
    },
    grandTotal > 0 ? grandTotal : "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  autoTable(doc, {
    startY: 20,
    head: [
      [
        {
          content: "Ngày/tháng/năm",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Đơn vị quản lý",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Giờ hoạt động trong tháng",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Kết quả hoạt động của thiết bị",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Giờ ngừng máy (h)",
          colSpan: 5,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Ghi chú",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
      ],
      [
        { content: "Hỏng máy", styles: { halign: "center" } },
        { content: "Chờ đợi", styles: { halign: "center" } },
        { content: "Mất điện", styles: { halign: "center" } },
        { content: "Thiếu N.liệu", styles: { halign: "center" } },
        { content: "Lý do khác", styles: { halign: "center" } },
      ],
    ],
    body: tableData,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 9,
      valign: "middle",
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
      minCellHeight: 10,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 28, halign: "center" },
      1: { cellWidth: 45 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 45 },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
      7: { cellWidth: 22, halign: "center" },
      8: { cellWidth: 18, halign: "center" },
      9: { cellWidth: 30 },
    },
    margin: { left: 8, right: 8 },
    theme: "grid",
    styles: { font: "times_new_roman", lineColor: [0, 0, 0], lineWidth: 0.1 },
  });

  return new Uint8Array(doc.output("arraybuffer"));
};

export const generateTransferHistoryPDF = async (
  data: TransferHistoryData[],
): Promise<Uint8Array> => {
  const doc = new jsPDF();
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(16);
  doc.text("THEO DÕI DI CHUYỂN LẮP ĐẶT MÁY", 105, 15, { align: "center" });

  // Map data sang 4 cột đúng với component
  const tableData = data.map((item) => [
    item.thoiGianBanGiao
      ? dayjs(item.thoiGianBanGiao).format("DD/MM/YYYY")
      : "",
    (item as any).tenDonViNhan || (item as any).idDonViNhan || "",
    "",
    "", // Họ tên và chữ ký – trống (ký tay)
  ]);

  // Đảm bảo ít nhất 15 dòng trống (giống component dùng EMPTY_ROWS)
  const EMPTY_ROWS_TARGET = 15;
  while (tableData.length < EMPTY_ROWS_TARGET) {
    tableData.push(["", "", "", ""]);
  }

  autoTable(doc, {
    startY: 22,
    head: [
      [
        {
          content: "Ngày/tháng/năm",
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Địa điểm đặt máy",
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Đối tượng phục vụ",
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Họ tên và chữ ký người\nchịu trách nhiệm lắp đặt",
          styles: { halign: "center", valign: "middle" },
        },
      ],
    ],
    body: tableData,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 11,
      valign: "middle",
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 5,
      minCellHeight: 12,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 32, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 50 },
      3: { cellWidth: 52 },
    },
    margin: { left: 10, right: 10 },
    theme: "grid",
    styles: {
      font: "times_new_roman",
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    // Dòng data: viền ngang là nét đứt, viền dọc vẫn solid (giống component)
    didParseCell: (hookData: any) => {
      if (hookData.section === "body") {
        hookData.cell.styles.lineColor = [0, 0, 0];
        hookData.cell.styles.lineWidth = 0.1;
      }
    },
  });

  return new Uint8Array(doc.output("arraybuffer"));
};

// Trang 6: THEO DÕI TÌNH HÌNH SỰ CỐ XẢY RA HÀNG THÁNG
export const generateAssetManentancePDF = async (
  data: any[],
): Promise<Uint8Array> => {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(15);
  doc.text("THEO DÕI TÌNH HÌNH SỰ CỐ XẢY RA HÀNG THÁNG", 148, 15, {
    align: "center",
  });

  const tableData = data.map((item: any) => [
    item.ca || "",
    item.ngayThangNam ? dayjs(item.ngayThangNam).format("DD/MM/YYYY") : "",
    item.hoTenVanHanh || "",
    item.nguyenNhan || "",
    item.hoTenSuaChua || "",
    item.gioNgung || "",
    item.tienCongSC || "",
    item.tienNguyenVatLieu || "",
    item.tongCong || "",
  ]);

  autoTable(doc, {
    startY: 22,
    head: [
      [
        {
          content: "Ca",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Ngày/tháng/năm",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Họ tên và chữ ký người vận hành ca máy xảy ra sự cố",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Nguyên nhân sự cố, tình trạng và cách giải quyết hư hỏng",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Họ tên và chữ ký người sửa chữa",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Thiệt hại vì sự cố",
          colSpan: 4,
          styles: { halign: "center", valign: "middle" },
        },
      ],
      [
        { content: "Giờ ngừng (h)", styles: { halign: "center" } },
        { content: "Tiền công s/c", styles: { halign: "center" } },
        { content: "Tiền nguyên vật liệu", styles: { halign: "center" } },
        { content: "Tổng cộng (đ)", styles: { halign: "center" } },
      ],
    ],
    body:
      tableData.length > 0 ? tableData : [["", "", "", "", "", "", "", "", ""]],
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, cellPadding: 3, minCellHeight: 10 },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 40 },
      3: { cellWidth: 55 },
      4: { cellWidth: 40 },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 22, halign: "center" },
      7: { cellWidth: 26, halign: "center" },
      8: { cellWidth: 22, halign: "center" },
    },
    margin: { left: 10, right: 10 },
    theme: "grid",
    styles: { font: "times_new_roman", lineColor: [0, 0, 0], lineWidth: 0.1 },
  });

  return new Uint8Array(doc.output("arraybuffer"));
};

// Trang 4: BẢNG KÊ CÁC PHỤ TÙNG CHÍNH CỦA MÁY
export const generateSparePartsPDF = async (
  data: any[],
): Promise<Uint8Array> => {
  const doc = new jsPDF();
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(15);
  doc.text("BẢNG KÊ CÁC PHỤ TÙNG CHÍNH CỦA MÁY", 105, 15, { align: "center" });

  const tableData = data.map((item: any, idx: number) => [
    idx + 1,
    item.ten || "",
    item.donViTinh || "",
    item.soLuong || "",
    item.trongLuong || "",
    item.nguyenLieuCheTao || "",
  ]);

  autoTable(doc, {
    startY: 22,
    head: [
      [
        { content: "TT", styles: { halign: "center" } },
        { content: "Tên và quy cách phụ tùng", styles: { halign: "center" } },
        { content: "Đơn vị tính", styles: { halign: "center" } },
        { content: "Số lượng", styles: { halign: "center" } },
        { content: "Trọng lượng (kg)", styles: { halign: "center" } },
        { content: "Nguyên liệu chế tạo", styles: { halign: "center" } },
      ],
    ],
    body: tableData.length > 0 ? tableData : [["", "", "", "", "", ""]],
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 10,
      valign: "middle",
      halign: "center",
    },
    bodyStyles: { fontSize: 9, cellPadding: 4, minCellHeight: 10 },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 65 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 28, halign: "center" },
      5: { cellWidth: 30 },
    },
    margin: { left: 15, right: 15 },
    theme: "grid",
    styles: { font: "times_new_roman", lineColor: [0, 0, 0], lineWidth: 0.1 },
  });

  return new Uint8Array(doc.output("arraybuffer"));
};

// Trang 7: THEO DÕI SỬA CHỮA MÁY TỪNG THÁNG
export const generateMaintenanceMonthlyPDF = async (
  data: any[],
): Promise<Uint8Array> => {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFont("times_new_roman", "bold");
  doc.setFontSize(15);
  doc.text("THEO DÕI SỬA CHỮA MÁY TỪNG THÁNG", 148, 15, { align: "center" });

  console.log(data);

  const tableData = data.map((item: any, idx: number) => [
    idx + 1,
    item.capSuaChua || "",
    item.ngayVao ? dayjs(item.ngayVao).format("DD/MM/YYYY") : "",
    item.ngayRa ? dayjs(item.ngayRa).format("DD/MM/YYYY") : "",
    item.thayTheSuaChua || "",
    item.congKeHoach || "",
    item.congThucHien || "",
    item.tongKimLoai || "",
    item.hoTenKyThuat || "",
    item.xacNhanKetQua || "",
  ]);

  autoTable(doc, {
    startY: 22,
    head: [
      [
        {
          content: "TT",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Cấp sửa chữa",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Thời gian sửa chữa",
          colSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Thay thế sửa chữa hoặc cải tiến bộ phận nào của máy",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Số công sửa chữa (Công)",
          colSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Tổng kim loại màu phục vụ cho sửa chữa (kg)",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content:
            "Họ tên và chữ ký người chịu trách nhiệm sửa chữa và kiểm tra kỹ thuật sau s/c",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        {
          content: "Xác nhận kết quả sau sửa chữa",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
      ],
      [
        { content: "Ngày vào", styles: { halign: "center" } },
        { content: "Ngày ra", styles: { halign: "center" } },
        { content: "Kế hoạch", styles: { halign: "center" } },
        { content: "Thực hiện", styles: { halign: "center" } },
      ],
    ],
    body:
      tableData.length > 0
        ? tableData
        : [["", "", "", "", "", "", "", "", "", ""]],
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 8,
      valign: "middle",
    },
    bodyStyles: { fontSize: 8, cellPadding: 3, minCellHeight: 10 },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 45 },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
      7: { cellWidth: 22, halign: "center" },
      8: { cellWidth: 42 },
      9: { cellWidth: 38 },
    },
    margin: { left: 8, right: 8 },
    theme: "grid",
    styles: { font: "times_new_roman", lineColor: [0, 0, 0], lineWidth: 0.1 },
  });

  return new Uint8Array(doc.output("arraybuffer"));
};

// Hàm định dạng tiền tệ (VNĐ)
const formatCurrency = (value: number | undefined | null): string => {
  if (value == null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export const mergePdf = async (
  pdfBytesList: Uint8Array[],
  outputFileName: string = "merged_document.pdf",
): Promise<Uint8Array | null> => {
  // Kiểm tra đầu vào
  if (!pdfBytesList || pdfBytesList.length === 0) {
    console.error("Không có file PDF nào để merge");
    return null;
  }

  try {
    // Tạo document PDF mới
    const mergedPdf = await PDFDocument.create();

    // Duyệt qua từng file PDF trong danh sách
    for (const pdfBytes of pdfBytesList) {
      // Load từng PDF từ Uint8Array
      const pdf = await PDFDocument.load(pdfBytes);

      // Copy tất cả các trang từ PDF nguồn sang PDF đích
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      // Thêm từng trang đã copy vào PDF đã merge
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // Xuất file PDF đã merge
    const finalPdfBytes = await mergedPdf.save();

    return finalPdfBytes;
  } catch (error) {
    console.error("Lỗi khi merge PDF:", error);
    return null;
  }
};
