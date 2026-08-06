import { useEffect, useState, useCallback } from "react";
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
import { Buffer } from "buffer";
import XLSX from "xlsx-js-style";
import { FormikProvider, useFormik } from "formik";
import { Print, TableChart } from "@mui/icons-material";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldDateTime from "../../../components/TextField/FieldDateTime";
import BBKiemKeContent from "./BBKiemKeContent";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import ExportExcelButton from "../../../components/Button/ExportExcelButton";
import { CongTy } from "../../../utils/const";
import { currentBrandConfig } from "../../../config/brandConfig";

export default function BienBanKiemKe({ title }: { title?: string }) {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "warning"
  >("success");
  const [fetchKey, setFetchKey] = useState(0);
  const [contentData, setContentData] = useState({});

  const handleContentChange = useCallback((data: any) => {
    setContentData(data);
  }, []);

  const formik = useFormik({
    initialValues: {
      IdDonVi: "",
      NgayKiemKe: new Date().toISOString().slice(0, 19).replace("T", " "),
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

  const handleExport = () => {
    const data = contentData as any;
    const items =
      (data &&
        (Array.isArray(data.inventoryItems)
          ? data.inventoryItems
          : data.rows)) ||
      [];
    if (!data || !Array.isArray(items) || items.length === 0) {
      setSnackbarMessage("Chưa có dữ liệu để xuất!");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }

    try {
      if (typeof window !== "undefined")
        window.Buffer = window.Buffer || Buffer;

      const {
        headerInfo,
        generalInfo,
        members = [],
        membersUnit = [],
        inventoryItems: invItems = [],
        closingTime = "",
      } = (contentData as any) || {};

      const inventoryItems = invItems.length ? invItems : items;

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
      const fontBI = { ...font, bold: true, italic: true };

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
      const sTextNormal = {
        font,
        alignment: { horizontal: "left", vertical: "center", wrapText: false },
      };
      const sTextBold = {
        font: fontB,
        alignment: { horizontal: "left", vertical: "center" },
      };

      const cell = (v: any, s: any) => ({ v, s });

      const COLS = 8;
      let wsData: any[][] = [];
      let merges: any[] = [];
      let r = 0;

      wsData[r] = Array(COLS).fill("");
      wsData[r][0] = cell("TẬP ĐOÀN CÔNG NGHIỆP\nTHAN - KHOÁNG SẢN VIỆT NAM", {
        font: fontB,
        alignment: { horizontal: "center", wrapText: true },
      });
      wsData[r][COLS - 3] = cell("Mẫu số 01a-TS", {
        font: fontB,
        alignment: { horizontal: "center", wrapText: true },
      });
      merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 2 } });
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
      merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 2 } });
      merges.push({ s: { r: r, c: COLS - 3 }, e: { r: r + 1, c: COLS - 1 } });
      r++;

      wsData[r] = Array(COLS).fill("");
      r++;

      wsData[r] = Array(COLS).fill("");
      wsData[r][0] = cell("BIÊN BẢN KIỂM KÊ TSCĐ, CCDC TẠI HIỆN TRƯỜNG", {
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
      try {
        const raw = String(formik.values.NgayKiemKe || "");
        let dateTimeStr = raw;
        if (raw) {
          const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
          const dt = new Date(iso);
          if (!isNaN(dt.getTime())) {
            dateTimeStr = dt.toLocaleString("vi-VN");
          }
        }
        wsData[r][0] = cell(`Thời điểm kiểm kê: ${dateTimeStr}`, {
          font: fontI,
          alignment: { horizontal: "center", vertical: "center" },
        });
        merges.push({ s: { r: r, c: 0 }, e: { r: r, c: COLS - 1 } });
      } catch (err) {
        wsData[r][0] = cell("Thời điểm kiểm kê:", {
          font: fontI,
          alignment: { horizontal: "center", vertical: "center" },
        });
        merges.push({ s: { r: r, c: 0 }, e: { r: r, c: COLS - 1 } });
      }
      r++;

      const headers = [
        "STT",
        "Tên tài sản, công cụ dụng cụ ( ký mã hiệu )",
        "Đơn vị tính",
        "Nước sản xuất",
        "Phương thức kiểm kê",
        "Số lượng kiểm kê thực tế",
        "Hiện trạng",
        "Ghi chú",
      ];

      wsData[r] = headers.map((h) => cell(h, sHeaderTable));
      r++;

      (inventoryItems || []).forEach((item: any) => {
        const row = Array(COLS).fill("");
        row[0] = cell(item.stt || "", sCenterTable);
        row[1] = cell(item.tenTaiSan || "", sTextTable);
        row[2] = cell(item.dvt || "", sCenterTable);
        row[3] = cell(item.nuocSx || "", sTextTable);
        row[4] = cell("", sTextTable);
        row[5] = cell(item.soLuong || "", sCenterTable);
        row[6] = cell("", sTextTable);
        row[7] = cell(item.ghiChu || "", sTextTable);
        wsData[r] = row;
        r++;
      });

      if ((inventoryItems || []).length === 0) {
        for (let k = 0; k < 5; k++) {
          const row = Array(COLS).fill(cell("", sTextTable));
          wsData[r] = row;
          r++;
        }
      }

      r++;
      wsData[r] = Array(COLS).fill("");
      wsData[r][0] = cell(
        `Biên bản được lập xong hồi ${closingTime || "......"} giờ cùng ngày, các thành viên thống nhất thông qua.`,
        sTextNormal,
      );
      merges.push({ s: { r: r, c: 0 }, e: { r: r, c: COLS - 1 } });
      r += 3;

      wsData[r] = Array(COLS).fill("");
      wsData[r][COLS - 3] = cell("TRƯỞNG TIỂU BAN KIỂM KÊ", {
        font: fontB,
        alignment: { horizontal: "center" },
      });
      merges.push({ s: { r: r, c: COLS - 3 }, e: { r: r, c: COLS - 1 } });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!merges"] = merges;
      ws["!rows"] = [
        { hpt: 28 },
        { hpt: 20 },
        { hpt: 6 },
        { hpt: 26 },
        { hpt: 18 },
        { hpt: 18 },
      ];

      ws["!cols"] = [
        { wch: 5 },
        { wch: 45 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "BB_KiemKe");
      const safeName = (selectedDeptName || "don_vi").replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
      const fname = `Bien_Ban_Kiem_Ke_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fname);
    } catch (e) {
      console.error("Export BienBanKiemKe error", e);
      setSnackbarMessage("Lỗi khi xuất file");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        handleExport();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contentData]);

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
        {/* GLOBAL PRINT STYLES */}
        <style>
          {`
          @media print {
              @page {
                size: A4 portrait;
                margin: 5mm 5mm 5mm 10mm; 
              }

              @page :first {
                margin: 0mm 5mm 5mm 10mm;
              }

            html, body {
              margin: 0;
              padding: 0;
              background: white;
              height: 100%;
            }

            #printable-bbkiemke-content, #printable-bbkiemke-content * {
              visibility: visible;
            }

            /* Hide app chrome when print marker is active (same logic as ReportS22DN) */
            body.s22dn-print-mode #app-header,
            body.s22dn-print-mode header,
            body.s22dn-print-mode .app-header,
            body.s22dn-print-mode .topbar,
            body.s22dn-print-mode .MuiAppBar-root,
            body.s22dn-print-mode .navbar,
            body.s22dn-print-mode .layout-header,
            body.s22dn-print-mode .sidebar,
            body.s22dn-print-mode .left-sidebar { display: none !important; }

            #printable-bbkiemke-content {
              position: static !important;
              width: 100% !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
              zoom: 78%;
            }

            /* First-child adjustments to pull page-top up when needed */
            #printable-bbkiemke-content > *:first-child {
              margin-top: -6mm !important;
              padding-top: 0 !important;
            }

            #printable-bbkiemke-content .MuiTypography-root:first-of-type,
            #printable-bbkiemke-content p:first-of-type,
            #printable-bbkiemke-content div:first-of-type {
              margin-top: 0 !important;
              padding-top: 0 !important;
            }

            .no-print {
              display: none !important;
            }

            #printable-bbkiemke-content .MuiStack-root:first-of-type {
              margin-top: 0 !important;
              padding-top: 0 !important;
            }

            table {
              width: 100% !important;
              border-collapse: collapse;
              page-break-inside: auto;
              font-size: 11px !important;
            }

            th, td {
              padding: 2px 4px !important; 
              word-wrap: break-word; 
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }

            /* Avoid forcing a page break after the last printed element */
            #printable-bbkiemke-content > *:last-child {
              page-break-after: avoid !important;
            }

            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }

            .no-print {
              display: none !important;
            }

            .report-scroll-container {
              position: static !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              overflow: visible !important;
              border: none !important;
              box-shadow: none !important;
              display: block !important;
            }
          }
        `}
        </style>

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
            <FieldDateTime title="Ngày kiểm kê" name="NgayKiemKe" />
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
          <BBKiemKeContent
            onContentChange={handleContentChange}
            selectedDeptName={selectedDeptName}
            idPhongBan={formik.values.IdDonVi}
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
