import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import {
  Box,
  Button,
  Typography,
  Stack,
  Divider,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import XLSX from "xlsx-js-style";
import { FormikProvider, useFormik } from "formik";
import { Print } from "@mui/icons-material";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldYear from "../../../components/TextField/FieldYear";
import ReportS22DNContent from "./ReportS22DNContent";
import ExportExcelButton from "../../../components/Button/ExportExcelButton";
import { CongTy } from "../../../utils/const";

export default function ReportS22DN({ title }: { title?: string }) {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "warning"
  >("success");
  const [contentData, setContentData] = useState({});

  const handleContentChange = useCallback((data: any) => {
    setContentData(data);
  }, []);

  const formik = useFormik({
    initialValues: {
      IdDonVi: "",
      Nam: new Date().getFullYear(),
    },
    onSubmit: (values) => {
      if (!values.IdDonVi) {
        setSnackbarMessage("Vui lòng chọn đơn vị trước khi lấy dữ liệu");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      setFetchKey((k) => k + 1);
    },
  });

  const [fetchKey, setFetchKey] = useState(0);

  const idCongTy = CongTy.CT001;
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", idCongTy],
    queryFn: async () =>
      (await api.get("/phongban", { params: { idcongty: idCongTy } })).data,
  });

  const handlePrint = () => {
    try {
      const marker = "s22dn-print-mode";
      document.body.classList.remove(marker);
      void document.body.offsetWidth;
      document.body.classList.add(marker);

      const cleanup = () => {
        document.body.classList.remove(marker);
        window.removeEventListener("afterprint", cleanup);
      };

      window.addEventListener("afterprint", cleanup);
      setTimeout(cleanup, 3000);

      setTimeout(() => window.print(), 80);
    } catch (e) {
      console.error("Print error", e);
      window.print();
    }
  };

  const selectedDeptName =
    departments.find(
      (d: any) => d.id?.toString() === String(formik.values.IdDonVi),
    )?.tenPhongBan || "";
  const selectedYear = formik.values.Nam;
  const handleExport = () => {
    const data = contentData as any;
    if (!data || (!data.tsRows?.length && !data.ccdcRows?.length)) {
      setSnackbarMessage("Chưa có dữ liệu để xuất!");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }

    const borderStyle = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };

    const fontStyle = { name: "Times New Roman", sz: 11 };
    const fontBold = { name: "Times New Roman", sz: 11, bold: true };

    const sHeader = {
      font: fontBold,
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: borderStyle,
    };

    const sText = {
      font: fontStyle,
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: borderStyle,
    };

    const sNum = {
      font: fontStyle,
      alignment: { horizontal: "right", vertical: "center" },
      border: borderStyle,
    };

    const sTitle = {
      font: { name: "Times New Roman", sz: 16, bold: true },
      alignment: { horizontal: "center" },
    };
    const sInfo = { font: { name: "Times New Roman", sz: 12 } };
    const sInfoCenter = {
      font: { name: "Times New Roman", sz: 12, bold: true },
      alignment: { horizontal: "center" },
    };

    const cell = (v: any, s: any) => ({ v: v, s: s });

    const wb = XLSX.utils.book_new();
    let wsData: any[][] = [];
    let merges: any[] = [];
    let currentRow = 0;

    wsData.push([
      `Đơn vị: ${selectedDeptName || ""}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "Mẫu số S22-DN",
    ]);
    wsData.push([
      `Địa chỉ: ${data.diaChi || ""}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "(Ban hành theo TT số 200/2014/TT-BTC)",
    ]);
    wsData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "Ngày 22/12/2014 của Bộ Tài chính",
    ]);

    merges.push({ s: { r: 0, c: 8 }, e: { r: 0, c: 12 } });
    merges.push({ s: { r: 1, c: 8 }, e: { r: 1, c: 12 } });
    merges.push({ s: { r: 2, c: 8 }, e: { r: 2, c: 12 } });

    currentRow = 4;
    wsData[currentRow] = Array(13).fill("");
    wsData[currentRow][0] = {
      v: "SỔ THEO DÕI TÀI SẢN CỐ ĐỊNH VÀ CÔNG CỤ, DỤNG CỤ TẠI NƠI SỬ DỤNG",
      s: sTitle,
    };
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 12 } });

    currentRow++;
    wsData[currentRow] = Array(13).fill("");
    wsData[currentRow][0] = { v: `Năm ${selectedYear || ""}`, s: sInfoCenter };
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 12 } });

    currentRow++;
    wsData[currentRow] = Array(13).fill("");
    wsData[currentRow][0] = {
      v: `Tên đơn vị (phòng, ban hoặc người sử dụng): ${selectedDeptName || ""}`,
      s: sInfo,
    };
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 12 } });

    currentRow += 2;

    const addTableHeader = (startRow: number, title: string) => {
      wsData[startRow] = Array(13).fill(cell("", sHeader));
      wsData[startRow][0] = cell(title, {
        ...sHeader,
        alignment: { horizontal: "left", vertical: "center" },
      });
      merges.push({ s: { r: startRow, c: 0 }, e: { r: startRow, c: 12 } });

      const r = startRow + 1;

      const createHeaderRow = () =>
        Array(13)
          .fill(null)
          .map(() => cell("", sHeader));

      const h1 = createHeaderRow();
      h1[0] = cell("Ghi tăng tài sản cố định", sHeader);
      h1[7] = cell("Ghi giảm tài sản cố định", sHeader);
      h1[12] = cell("Ghi chú", sHeader);
      wsData[r] = h1;
      merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 6 } });
      merges.push({ s: { r: r, c: 7 }, e: { r: r, c: 11 } });
      merges.push({ s: { r: r, c: 12 }, e: { r: r + 2, c: 12 } });

      const h2 = createHeaderRow();
      h2[0] = cell("Chứng từ", sHeader);
      h2[7] = cell("Chứng từ", sHeader);
      h2[2] = cell("Tên, nhãn hiệu, quy cách", sHeader);
      h2[3] = cell("ĐVT", sHeader);
      h2[4] = cell("Số lượng", sHeader);
      h2[10] = cell("Số lượng", sHeader);
      h2[5] = cell("Đơn giá", sHeader);
      h2[6] = cell("Số tiền", sHeader);
      h2[11] = cell("Số tiền", sHeader);
      h2[9] = cell("Lý do", sHeader);
      wsData[r + 1] = h2;

      merges.push({ s: { r: r + 1, c: 0 }, e: { r: r + 1, c: 1 } });
      merges.push({ s: { r: r + 1, c: 7 }, e: { r: r + 1, c: 8 } });
      [2, 3, 4, 5, 6, 9, 10, 11].forEach((c) =>
        merges.push({ s: { r: r + 1, c: c }, e: { r: r + 2, c: c } }),
      );

      const h3 = createHeaderRow();
      h3[0] = cell("Số hiệu", sHeader);
      h3[1] = cell("Ngày tháng", sHeader);
      h3[7] = cell("Số hiệu", sHeader);
      h3[8] = cell("Ngày tháng", sHeader);
      wsData[r + 2] = h3;

      const h4 = [
        "A",
        "B",
        "C",
        "D",
        "1",
        "2",
        "3",
        "E",
        "G",
        "H",
        "4",
        "5",
        "I",
      ].map((t) => cell(t, sHeader));
      wsData[r + 3] = h4;

      return r + 4;
    };

    currentRow = addTableHeader(
      currentRow,
      "Bảng ghi tăng/giảm Tài sản cố định",
    );
    (data.tsRows || []).forEach((row: any) => {
      wsData[currentRow] = [
        cell(row.ctTangSoHieu, sText),
        cell(row.ctTangNgay, sText),
        cell(row.tenNhanHieu, sText),
        cell(row.dvt, sText),
        cell(Number(row.tangSoLuong) || row.tangSoLuong, sNum),
        cell(Number(row.tangDonGia) || row.tangDonGia, sNum),
        cell(Number(row.tangSoTien) || row.tangSoTien, sNum),
        cell(row.ctGiamSoHieu, sText),
        cell(row.ctGiamNgay, sText),
        cell(row.giamLyDo, sText),
        cell(Number(row.giamSoLuong) || row.giamSoLuong, sNum),
        cell(Number(row.giamSoTien) || row.giamSoTien, sNum),
        cell(row.ghiChu, sText),
      ];
      currentRow++;
    });

    currentRow += 1;

    currentRow = addTableHeader(
      currentRow,
      "Bảng ghi tăng/giảm Công cụ dụng cụ cố định",
    );
    (data.ccdcRows || []).forEach((row: any) => {
      wsData[currentRow] = [
        cell(row.ctTangSoHieu, sText),
        cell(row.ctTangNgay, sText),
        cell(row.tenNhanHieu, sText),
        cell(row.dvt, sText),
        cell(Number(row.tangSoLuong) || row.tangSoLuong, sNum),
        cell(Number(row.tangDonGia) || row.tangDonGia, sNum),
        cell(Number(row.tangSoTien) || row.tangSoTien, sNum),
        cell(row.ctGiamSoHieu, sText),
        cell(row.ctGiamNgay, sText),
        cell(row.giamLyDo, sText),
        cell(Number(row.giamSoLuong) || row.giamSoLuong, sNum),
        cell(Number(row.giamSoTien) || row.giamSoTien, sNum),
        cell(row.ghiChu, sText),
      ];
      currentRow++;
    });

    currentRow += 2;

    const f = data.footerData || {};
    wsData[currentRow] = [
      cell(
        `- Sổ này có ${f.soTrang || "..."} trang, đánh số từ trang 01 đến trang ${f.denTrang || "..."}`,
        sInfo,
      ),
    ];
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 12 } });

    currentRow++;
    wsData[currentRow] = [cell(`- Ngày mở sổ: ${f.ngayMoSo || "..."}`, sInfo)];
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 12 } });

    currentRow += 2;
    const dateSign = `Ngày ${f.ngayKy || "..."} tháng ${f.thangKy || "..."} năm ${f.namKy || "..."}`;

    const signRow = Array(13).fill("");
    signRow[0] = cell("Người ghi sổ", sInfoCenter);
    signRow[5] = cell("Kế toán trưởng", sInfoCenter);
    signRow[11] = cell(dateSign, {
      ...sInfoCenter,
      font: { ...sInfoCenter.font, italic: true },
    });
    wsData[currentRow] = signRow;

    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 2 } });
    merges.push({ s: { r: currentRow, c: 4 }, e: { r: currentRow, c: 7 } });
    merges.push({ s: { r: currentRow, c: 11 }, e: { r: currentRow, c: 12 } });

    currentRow++;
    const jobRow = Array(13).fill("");
    jobRow[11] = cell("Giám đốc", sInfoCenter);
    wsData[currentRow] = jobRow;
    merges.push({ s: { r: currentRow, c: 11 }, e: { r: currentRow, c: 12 } });

    currentRow++;
    const signTitleRow = Array(13).fill("");
    signTitleRow[0] = cell("(Ký, họ tên)", {
      ...sInfoCenter,
      font: { ...sInfoCenter.font, italic: true },
    });
    signTitleRow[5] = cell("(Ký, họ tên)", {
      ...sInfoCenter,
      font: { ...sInfoCenter.font, italic: true },
    });
    signTitleRow[11] = cell("(Ký, họ tên, đóng dấu)", {
      ...sInfoCenter,
      font: { ...sInfoCenter.font, italic: true },
    });
    wsData[currentRow] = signTitleRow;

    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 2 } });
    merges.push({ s: { r: currentRow, c: 4 }, e: { r: currentRow, c: 7 } });
    merges.push({ s: { r: currentRow, c: 11 }, e: { r: currentRow, c: 12 } });

    currentRow += 2;
    wsData[currentRow] = Array(13).fill("");
    wsData[currentRow][0] = cell(
      "SỔ THEO DÕI TÀI SẢN CỐ ĐỊNH VÀ CÔNG CỤ, DỤNG CỤ TẠI NƠI SỬ DỤNG",
      { ...sInfoCenter, font: { name: "Times New Roman", sz: 14, bold: true } },
    );
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 12 } });

    currentRow++;
    wsData[currentRow] = Array(13).fill("");
    wsData[currentRow][0] = cell("(Mẫu số S22-DN)", { ...sInfoCenter });
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 12 } });

    currentRow += 2;
    const descLines = [
      "1. Mục đích:",
      "Sổ này dùng để ghi chép tình hình tăng, giảm tài sản cố định và công cụ, dụng cụ tại nơi sử dụng nhằm quản lý tài sản và dụng cụ đã được cấp cho các phòng, ban; làm căn cứ đối chiếu khi tiến hành kiểm kê định kỳ.",
      "2. Căn cứ và phương pháp ghi sổ:",
      "Mỗi đơn vị hoặc bộ phận (phân xưởng, phòng ban...) thuộc doanh nghiệp phải mở một sổ để theo dõi tài sản. Căn cứ vào chứng từ gốc về tăng, giảm tài sản để ghi vào sổ theo đơn vị sử dụng như sau:",
      "- Cột A, B: Ghi số hiệu, ngày tháng của chứng từ tăng tài sản cố định và công cụ, dụng cụ.",
      "- Cột C: Ghi tên nhãn hiệu, đặc điểm TSCĐ và công cụ, dụng cụ.",
      "- Cột D: Ghi đơn vị tính (cái, chiếc,...).",
      "- Cột 1: Ghi số lượng.",
      "- Cột 2: Ghi nguyên giá TSCĐ hoặc đơn giá công cụ, dụng cụ.",
      "- Cột 3: Ghi số tiền (Cột 3 = Cột 1 x Cột 2).",
      "- Cột E, G: Ghi số hiệu, ngày tháng của chứng từ ghi giảm tài sản cố định và công cụ, dụng cụ.",
      "- Cột H: Ghi lý do giảm tài sản cố định và công cụ, dụng cụ.",
      "- Cột 4: Ghi số lượng tài sản/công cụ giảm.",
      "- Cột 5: Ghi nguyên giá tài sản cố định và giá trị công cụ, dụng cụ giảm.",
    ];

    descLines.forEach((txt) => {
      currentRow++;
      wsData[currentRow] = Array(13).fill("");
      wsData[currentRow][0] = cell(txt, sInfo);
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 12 } });
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = merges;
    ws["!cols"] = [
      { wch: 10 },
      { wch: 12 },
      { wch: 30 },
      { wch: 8 },
      { wch: 8 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 20 },
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "S22DN");
    const safeName = (selectedDeptName || "S22DN").replace(
      /[^a-z0-9\-_]/gi,
      "_",
    );
    const fname = `Bao_cao_S22DN_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fname);

    setSnackbarMessage("Xuất file thành công");
    setSnackbarSeverity("success");
    setOpenSnackbar(true);
  };

  return (
    <FormikProvider value={formik}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minHeight: "auto",
          position: "relative",
          zIndex: 0,
        }}
      >
        {/* GLOBAL PRINT STYLES */}
        <style>{`
          @media print {
              @page { size: A4 portrait; margin: 5mm 5mm 5mm 10mm; }
              @page :first { margin: 0mm 5mm 5mm 10mm; }

            html, body { margin: 0; padding: 0; background: white; height: 100%; }

            /* Keep the report container visible and avoid clipping */
            .report-scroll-container { position: static !important; margin: 0 !important; padding: 8mm !important; width: 100% !important; box-sizing: border-box !important; height: auto !important; overflow: visible !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }

            /* When printing via this component we add a body class so we can hide
              the app chrome reliably without affecting other pages. */
            body.s22dn-print-mode #app-header,
            body.s22dn-print-mode header,
            body.s22dn-print-mode .app-header,
            body.s22dn-print-mode .topbar,
            body.s22dn-print-mode .MuiAppBar-root,
            body.s22dn-print-mode .navbar,
            body.s22dn-print-mode .layout-header,
            body.s22dn-print-mode .sidebar,
            body.s22dn-print-mode .left-sidebar { display: none !important; }
            #printable-s22dn-content { visibility: visible !important; }

            /* Table readability for print - make compact and enforce consistent
               column widths across tables so multiple tables look identical. */
            #printable-s22dn-content table {
              width: 100% !important;
              border-collapse: collapse;
              page-break-inside: auto;
              /* smaller font to fit more columns */
              font-size: 8.5pt !important;
              /* enforce consistent widths across tables */
              table-layout: fixed !important;
              word-break: break-word !important;
              white-space: normal !important;
              max-width: 100% !important;
            }

            /* Reset any fixed col widths coming from colgroup */
            #printable-s22dn-content col { width: auto !important; }

            #printable-s22dn-content table col { width: auto !important; }
            #printable-s22dn-content table col:nth-child(1)  { width: 7%  !important; }
            #printable-s22dn-content table col:nth-child(2)  { width: 7%  !important; }
            #printable-s22dn-content table col:nth-child(3)  { width: 12% !important; }
            #printable-s22dn-content table col:nth-child(4)  { width: 6%  !important; }
            #printable-s22dn-content table col:nth-child(5)  { width: 6%  !important; }
            #printable-s22dn-content table col:nth-child(6)  { width: 8%  !important; }
            #printable-s22dn-content table col:nth-child(7)  { width: 8% !important; }
            #printable-s22dn-content table col:nth-child(8)  { width: 7%  !important; }
            #printable-s22dn-content table col:nth-child(9)  { width: 7%  !important; }
            #printable-s22dn-content table col:nth-child(10) { width: 8% !important; }
            #printable-s22dn-content table col:nth-child(11) { width: 6%  !important; }
            #printable-s22dn-content table col:nth-child(12) { width: 8%  !important; }
            #printable-s22dn-content table col:nth-child(13) { width: 10%  !important; }

            #printable-s22dn-content th, #printable-s22dn-content td {
              padding: 1px 4px !important;
              vertical-align: middle !important;
              font-size: 8.5pt !important;
              white-space: normal !important;
              overflow: hidden !important;
            }

            /* Slight overall scale so very wide tables fit better in portrait */
            #printable-s22dn-content { zoom: 0.82; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }

            /* Hide control-panel elements inside this component */
            .no-print { display: none !important; }
          }
        `}</style>

        <Box
          className="no-print"
          sx={{
            p: 3,
            bgcolor: "white",
            border: "2px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {title && (
            <Box sx={{ textAlign: "center", pb: 2, mb: 2 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: "25px",
                }}
              >
                {title}
              </Typography>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <FieldAutoCompleted
              title="Chọn đơn vị"
              labelkey="tenPhongBan"
              labelOption="id"
              data={departments}
              name="IdDonVi"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <FieldYear title="Năm" name="Nam" />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Button
              variant="contained"
              sx={{
                bgcolor: "#4caf50",
                color: "white",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 500,
                "&:hover": { bgcolor: "#45a049" },
              }}
              onClick={formik.submitForm}
            >
              Lấy dữ liệu
            </Button>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <ExportExcelButton onClick={handleExport} />
              <Tooltip title="In">
                <Button
                  variant="contained"
                  color="info"
                  sx={{
                    minWidth: "44px",
                    width: "44px",
                    height: "44px",
                    p: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={handlePrint}
                >
                  <Print />
                </Button>
              </Tooltip>
            </Box>
          </Stack>
        </Box>

        {/* Report Content Container - Thêm class report-scroll-container để xử lý in */}
        <Box
          className="report-scroll-container"
          sx={{
            p: 3,
            height: "800px",
            bgcolor: "white",
            border: "2px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
            zIndex: 1,
          }}
        >
          <ReportS22DNContent
            onContentChange={handleContentChange}
            selectedDeptName={selectedDeptName}
            selectedYear={selectedYear}
            idDonVi={formik.values.IdDonVi}
            fetchKey={fetchKey}
            onFetchSuccess={() => {
              setSnackbarMessage("Lấy dữ liệu thành công");
              setSnackbarSeverity("success");
              setOpenSnackbar(true);
            }}
          />
        </Box>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={() => setOpenSnackbar(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setOpenSnackbar(false)}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </FormikProvider>
  );
}
