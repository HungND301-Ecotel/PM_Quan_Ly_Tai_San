import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { Buffer } from "buffer";
import XLSX from "xlsx-js-style";
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
import { FormikProvider, useFormik } from "formik";
import { Print } from "@mui/icons-material";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldDateTime from "../../../components/TextField/FieldDateTime";
import BaoCaoTSCDContent from "./BaoCaoTSCDContent";
import ExcelLogo from "../../../assets/icons/excel.png";
import WExcelLogo from "../../../assets/icons/w_excel.png";
import ExportExcelButton from "../../../components/Button/ExportExcelButton";
import { CongTy } from "../../../utils/const";
import { currentBrandConfig } from "../../../config/brandConfig";

export default function BaoCaoTSCD({ title }: { title?: string }) {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "info" | "warning" | "error"
  >("success");
  const [contentData, setContentData] = useState({});
  const [fetchKey, setFetchKey] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleContentChange = useCallback((data: any) => {
    setContentData(data);
  }, []);

  const formik = useFormik({
    initialValues: {
      IdDonVi: "",
      NgayBaoCao: new Date().toISOString().slice(0, 19).replace("T", " "),
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

  const idCongTy = CongTy.CT001;
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", idCongTy],
    queryFn: async () =>
      (await api.get("/phongban", { params: { idcongty: idCongTy } })).data,
  });

  const handleExport = () => {
    const data = contentData as any;
    const items =
      data && Array.isArray(data.inventoryItems) ? data.inventoryItems : [];
    if (!data || items.length === 0) {
      setSnackbarMessage("Chưa có dữ liệu để xuất!");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }

    try {
      if (typeof window !== "undefined")
        window.Buffer = window.Buffer || Buffer;

      const { closingTime = "" } = data || {};
      const inventory = items;

      const wb = XLSX.utils.book_new();

      const border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      const font = { name: "Times New Roman", sz: 12 };
      const fontB = { ...font, bold: true };
      const fontI = { ...font, italic: true };

      const sHeaderTable = {
        font: fontB,
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border,
      };
      const sTextTable = {
        font,
        alignment: { horizontal: "left", vertical: "center", wrapText: true },
        border,
      };
      const sCenterTable = {
        font,
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border,
      };
      const sNumberCenter = { ...sCenterTable, numFmt: "#,##0" };

      const cell = (v: any, s: any) => ({ v, s });

      const COLS = 14;
      let wsData: any[][] = [];
      let merges: any[] = [];
      let r = 0;

      wsData[r] = Array(COLS).fill("");
      wsData[r][0] = cell("TẬP ĐOÀN CÔNG NGHIỆP\nTHAN - KHOÁNG SẢN VIỆT NAM", {
        font: fontB,
        alignment: { horizontal: "center", wrapText: true },
      });
      wsData[r][COLS - 3] = cell("Mẫu số 05-TSCĐ", {
        font: fontB,
        alignment: { horizontal: "center", wrapText: true },
      });
      merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 3 } });
      merges.push({ s: { r: r, c: COLS - 3 }, e: { r: r, c: COLS - 1 } });
      r++;

      wsData[r] = Array(COLS).fill("");
      wsData[r][0] = cell(currentBrandConfig.company, {
        font: fontB,
        alignment: { horizontal: "center", wrapText: true },
      });
      wsData[r][COLS - 3] = cell(
        "Ban hành kèm theo QĐ số ............./QĐ-TUB\nngày ....../....../...... của Giám đốc Công ty",
        {
          font: { ...font, sz: 11, italic: true },
          alignment: { horizontal: "center", wrapText: true },
        },
      );
      merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 3 } });
      merges.push({ s: { r: r, c: COLS - 3 }, e: { r: r + 1, c: COLS - 1 } });
      r++;

      wsData[r] = Array(COLS).fill("");
      r++;

      wsData[r] = Array(COLS).fill("");
      wsData[r][0] = cell("BIÊN BẢN KIỂM KÊ TÀI SẢN CỐ ĐỊNH", {
        font: { ...fontB, sz: 14 },
        alignment: { horizontal: "center", vertical: "center" },
      });
      merges.push({ s: { r: r, c: 0 }, e: { r: r, c: COLS - 1 } });
      r++;

      wsData[r] = Array(COLS).fill("");
      wsData[r][0] = cell(
        `Đơn vị: ${selectedDeptName || "...................................."}`,
        {
          font: fontB,
          alignment: { horizontal: "center", vertical: "center" },
        },
      );
      merges.push({ s: { r: r, c: 0 }, e: { r: r, c: COLS - 1 } });
      r++;

      wsData[r] = Array(COLS).fill("");
      let dateTimeStr = "";
      try {
        const raw = String(formik.values.NgayBaoCao || "");
        dateTimeStr = raw;
        if (raw) {
          const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
          const dt = new Date(iso);
          if (!isNaN(dt.getTime())) dateTimeStr = dt.toLocaleString("vi-VN");
        }
      } catch (err) {}

      wsData[r][0] = cell(`Thời điểm kiểm kê: ${dateTimeStr}`, {
        font: fontI,
        alignment: { horizontal: "center", vertical: "center" },
      });
      merges.push({ s: { r: r, c: 0 }, e: { r: r, c: COLS - 1 } });
      r++;

      wsData[r] = Array(COLS).fill("");
      r++;

      const rHeaderStart = r;

      wsData[r] = Array(COLS).fill("");

      wsData[r][0] = cell("STT", sHeaderTable);
      wsData[r][1] = cell("Tên tài sản cố định\n(Ký mã hiệu)", sHeaderTable);
      wsData[r][2] = cell("Mã số", sHeaderTable);
      wsData[r][3] = cell("Nơi sử\ndụng", sHeaderTable);
      wsData[r][4] = cell("Kế toán", sHeaderTable);
      wsData[r][7] = cell("Kiểm kê", sHeaderTable);
      wsData[r][10] = cell("Chênh lệch", sHeaderTable);
      wsData[r][13] = cell("Ghi chú", sHeaderTable);

      wsData[r][5] = cell("", sHeaderTable);
      wsData[r][6] = cell("", sHeaderTable);

      wsData[r][8] = cell("", sHeaderTable);
      wsData[r][9] = cell("", sHeaderTable);

      wsData[r][11] = cell("", sHeaderTable);
      wsData[r][12] = cell("", sHeaderTable);

      merges.push({ s: { r: r, c: 0 }, e: { r: r + 1, c: 0 } });
      merges.push({ s: { r: r, c: 1 }, e: { r: r + 1, c: 1 } });
      merges.push({ s: { r: r, c: 2 }, e: { r: r + 1, c: 2 } });
      merges.push({ s: { r: r, c: 3 }, e: { r: r + 1, c: 3 } });
      merges.push({ s: { r: r, c: 13 }, e: { r: r + 1, c: 13 } });

      merges.push({ s: { r: r, c: 4 }, e: { r: r, c: 6 } });
      merges.push({ s: { r: r, c: 7 }, e: { r: r, c: 9 } });
      merges.push({ s: { r: r, c: 10 }, e: { r: r, c: 12 } });

      r++;

      wsData[r] = Array(COLS).fill("");

      const subCols = ["Số lượng", "Nguyên giá", "Giá trị còn lại"];

      wsData[r][4] = cell(subCols[0], sHeaderTable);
      wsData[r][5] = cell(subCols[1], sHeaderTable);
      wsData[r][6] = cell(subCols[2], sHeaderTable);

      wsData[r][7] = cell(subCols[0], sHeaderTable);
      wsData[r][8] = cell(subCols[1], sHeaderTable);
      wsData[r][9] = cell(subCols[2], sHeaderTable);

      wsData[r][10] = cell(subCols[0], sHeaderTable);
      wsData[r][11] = cell(subCols[1], sHeaderTable);
      wsData[r][12] = cell(subCols[2], sHeaderTable);

      [0, 1, 2, 3, 13].forEach((colIdx) => {
        wsData[r][colIdx] = cell("", sHeaderTable);
      });

      r++;

      (inventory || []).forEach((it: any, idx: number) => {
        const row = Array(COLS).fill("");

        const parseNum = (val: any) => {
          if (!val) return 0;
          const num = Number(String(val).replace(/,/g, ""));
          return isFinite(num) ? num : 0;
        };

        row[0] = cell(it.stt || String(idx + 1), sCenterTable);
        row[1] = cell(it.tenTSCD || it.tenTaiSan || "", sTextTable);
        row[2] = cell(it.maso || it.maSo || "", sCenterTable);
        row[3] = cell(it.noiSudung || "", sTextTable);

        const ktSL = it.soluongkt || it.soluong;
        const ktNG = parseNum(it.nguyengiakt || it.nguyenGia);
        const ktGTCL = parseNum(it.giatriconlaikt || it.giaTriConLai);

        row[4] = cell(ktSL || "", sCenterTable);
        row[5] =
          ktNG !== 0 ? cell(ktNG, sNumberCenter) : cell("", sCenterTable);
        row[6] =
          ktGTCL !== 0 ? cell(ktGTCL, sNumberCenter) : cell("", sCenterTable);

        const kkSL = it.soluongkk;
        const kkNG = parseNum(it.nguyengiakk);
        const kkGTCL = parseNum(it.giatriconlaikk);

        row[7] = cell(kkSL || "", sCenterTable);
        row[8] =
          kkNG !== 0 ? cell(kkNG, sNumberCenter) : cell("", sCenterTable);
        row[9] =
          kkGTCL !== 0 ? cell(kkGTCL, sNumberCenter) : cell("", sCenterTable);

        let clSL = it.soluongcl;
        if (clSL === undefined || clSL === null) {
          const sl1 = Number(ktSL) || 0;
          const sl2 = Number(kkSL) || 0;
          if (sl1 !== sl2) clSL = sl2 - sl1;
        }

        let clNG = parseNum(it.nguyengiacl);
        if (clNG === 0 && kkNG !== ktNG) clNG = kkNG - ktNG;

        let clGTCL = parseNum(it.giatriconlaicl);
        if (clGTCL === 0 && kkGTCL !== ktGTCL) clGTCL = kkGTCL - ktGTCL;

        row[10] = clSL ? cell(clSL, sCenterTable) : cell("", sCenterTable);
        row[11] =
          clNG !== 0 ? cell(clNG, sNumberCenter) : cell("", sCenterTable);
        row[12] =
          clGTCL !== 0 ? cell(clGTCL, sNumberCenter) : cell("", sCenterTable);

        row[13] = cell(it.ghiChu || "", sTextTable);

        wsData[r] = row;
        r++;
      });

      if ((inventory || []).length === 0) {
        for (let k = 0; k < 5; k++) {
          wsData[r] = Array(COLS).fill(cell("", sTextTable));
          r++;
        }
      }

      r++;
      wsData[r] = Array(COLS).fill("");
      wsData[r][0] = cell(
        `Biên bản được lập xong hồi ${closingTime || "......"} giờ cùng ngày, các thành viên thống nhất thông qua.`,
        { font, alignment: { horizontal: "left" } },
      );
      merges.push({ s: { r: r, c: 0 }, e: { r: r, c: COLS - 1 } });

      r++;
      wsData[r] = Array(COLS).fill("");
      r++;

      wsData[r] = Array(COLS).fill("");

      wsData[r][2] = cell("GIÁM ĐỐC", {
        font: fontB,
        alignment: { horizontal: "center", vertical: "center" },
      });
      merges.push({ s: { r: r, c: 2 }, e: { r: r, c: 6 } });

      wsData[r][8] = cell("KẾ TOÁN", {
        font: fontB,
        alignment: { horizontal: "center", vertical: "center" },
      });
      merges.push({ s: { r: r, c: 8 }, e: { r: r, c: 11 } });

      r++;

      const sItalicSmall = {
        font: { name: "Times New Roman", sz: 11, italic: true },
        alignment: { horizontal: "center", vertical: "top", wrapText: true },
      };

      wsData[r] = Array(COLS).fill("");

      wsData[r][2] = cell(
        "(Ghi ý kiến giải quyết số chênh lệch)",
        sItalicSmall,
      );
      merges.push({ s: { r: r, c: 2 }, e: { r: r, c: 6 } });

      wsData[r][8] = cell("(Ký, họ tên)", sItalicSmall);
      merges.push({ s: { r: r, c: 8 }, e: { r: r, c: 11 } });

      r++;

      wsData[r] = Array(COLS).fill("");

      wsData[r][2] = cell("(Ký, họ tên, đóng dấu)", sItalicSmall);
      merges.push({ s: { r: r, c: 2 }, e: { r: r, c: 6 } });

      r += 4;

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!merges"] = merges;

      ws["!cols"] = [
        { wch: 5 },
        { wch: 35 },
        { wch: 12 },
        { wch: 15 },
        { wch: 8 },
        { wch: 13 },
        { wch: 13 },
        { wch: 8 },
        { wch: 13 },
        { wch: 13 },
        { wch: 8 },
        { wch: 13 },
        { wch: 13 },
        { wch: 15 },
      ];
      ws["!rows"] = [
        { hpt: 28 },
        { hpt: 20 },
        { hpt: 6 },
        { hpt: 26 },
        { hpt: 18 },
        { hpt: 18 },
        { hpt: 10 },
        { hpt: 25 },
        { hpt: 25 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "BaoCao_TSCD");
      const fname = `BaoCao_TSCD_${(selectedDeptName || "don_vi").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fname);
      setSnackbarMessage("Xuất file thành công");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (e) {
      console.error("Export BaoCaoTSCD error", e);
      setSnackbarMessage("Lỗi khi xuất file");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

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

  return (
    <FormikProvider value={formik}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minHeight: "100vh",
        }}
      >
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
          {/* GLOBAL PRINT STYLES */}
          <style>{`
          @media print {
              @page { size: A4 portrait; margin: 5mm 5mm 5mm 10mm; }
              @page :first { margin: 0mm 5mm 5mm 10mm; }

            html, body { margin: 0; padding: 0; background: white; height: 100%; }

            .report-scroll-container { position: static !important; margin: 0 !important; padding: 8mm !important; width: 100% !important; box-sizing: border-box !important; height: auto !important; overflow: visible !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }

            body.s22dn-print-mode #app-header,
            body.s22dn-print-mode header,
            body.s22dn-print-mode .app-header,
            body.s22dn-print-mode .topbar,
            body.s22dn-print-mode .MuiAppBar-root,
            body.s22dn-print-mode .navbar,
            body.s22dn-print-mode .layout-header,
            body.s22dn-print-mode .sidebar,
            body.s22dn-print-mode .left-sidebar { display: none !important; }
            #printable-bc-tscd-content { visibility: visible !important; }

            #printable-bc-tscd-content table {
              width: 100% !important;
              border-collapse: collapse;
              page-break-inside: auto;
              font-size: 8.5pt !important;
              table-layout: fixed !important;
              word-break: break-word !important;
              white-space: normal !important;
              max-width: 100% !important;
            }

            #printable-bc-tscd-content col { width: auto !important; }
            #printable-bc-tscd-content table col { width: auto !important; }
            #printable-bc-tscd-content table col:nth-child(1)  { width: 3%  !important; }
            #printable-bc-tscd-content table col:nth-child(2)  { width: 19%  !important; }
            #printable-bc-tscd-content table col:nth-child(3)  { width: 7% !important; }
            #printable-bc-tscd-content table col:nth-child(4)  { width: 8%  !important; }
            #printable-bc-tscd-content table col:nth-child(5)  { width: 4%  !important; }
            #printable-bc-tscd-content table col:nth-child(6)  { width: 7%  !important; }
            #printable-bc-tscd-content table col:nth-child(7)  { width: 7% !important; }
            #printable-bc-tscd-content table col:nth-child(8)  { width: 4%  !important; }
            #printable-bc-tscd-content table col:nth-child(9)  { width: 7%  !important; }
            #printable-bc-tscd-content table col:nth-child(10) { width: 7% !important; }
            #printable-bc-tscd-content table col:nth-child(11) { width: 4%  !important; }
            #printable-bc-tscd-content table col:nth-child(12) { width: 7%  !important; }
            #printable-bc-tscd-content table col:nth-child(13) { width: 7%  !important; }
            #printable-bc-tscd-content table col:nth-child(14) { width: 8%  !important; }

            #printable-bc-tscd-content th, #printable-bc-tscd-content td {
              padding: 1px 4px !important;
              vertical-align: middle !important;
              font-size: 8.5pt !important;
              white-space: normal !important;
              overflow: hidden !important;
            }

            #printable-bc-tscd-content { zoom: 0.82; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }

            .no-print { display: none !important; }
          }
        `}</style>
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
            <FieldDateTime title="Ngày kiểm kê" name="NgayBaoCao" />
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
          }}
        >
          <BaoCaoTSCDContent
            onContentChange={handleContentChange}
            selectedDeptName={selectedDeptName}
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
