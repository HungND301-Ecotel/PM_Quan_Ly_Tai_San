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
import { FormikProvider, useFormik } from "formik";
import { Print } from "@mui/icons-material";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldDateTime from "../../../components/TextField/FieldDateTime";
import { Buffer } from "buffer";
import XLSX from "xlsx-js-style";
import MauSo21Content from "./MauSo21Content";
import ExportExcelButton from "../../../components/Button/ExportExcelButton";
import { CongTy } from "../../../utils/const";
import { useAllDepartmentsQuery } from "../../Department/Mutation";
import { currentBrandConfig } from "../../../config/brandConfig";

if (typeof window !== "undefined") {
  (window as any).Buffer = (window as any).Buffer || Buffer;
}

export default function MauSo21({ title }: { title?: string }) {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [selectedDeptName, setSelectedDeptName] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "warning"
  >("success");
  const [contentData, setContentData] = useState({});

  const handleContentChange = useCallback((data: any) => {
    setContentData(data);
  }, []);

  const [fetchKey, setFetchKey] = useState(0);

  const formik = useFormik({
    initialValues: {
      IdDonVi: "",
      IdLoaiTaiSan: "",
      NgayBaoCao: new Date().toISOString().slice(0, 19).replace("T", " "),
    },
    onSubmit: (values) => {
      if (!values.IdLoaiTaiSan) {
        setSnackbarMessage("Vui lòng chọn loại tài sản trước khi lấy dữ liệu");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      setFetchKey((k) => k + 1);
    },
  });

  const idCongTy = CongTy.CT001;
  const { data: groups = [] } = useQuery({
    queryKey: ["nhomtaisan", idCongTy],
    queryFn: async () =>
      (await api.get("/nhomtaisan", { params: { idcongty: idCongTy } })).data,
  });
  const { data: departments = [] } = useAllDepartmentsQuery();

  const handleExport = () => {
    const data = contentData as any;
    const hasData = data && Array.isArray(data.rows) && data.rows.length > 0;

    if (!hasData) {
      console.warn("Export failed - no data:", { contentData });
      setSnackbarMessage(
        "Chưa có dữ liệu để xuất! Vui lòng click 'Lấy dữ liệu' trước.",
      );
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }

    const border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    const font = { name: "Times New Roman", sz: 11 };
    const fontB = { ...font, bold: true };
    const sHeader = {
      font: fontB,
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border,
    };
    const sText = {
      font,
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border,
    };
    const sCenter = {
      font,
      alignment: { horizontal: "center", vertical: "center" },
      border,
    };
    const sNum = {
      font,
      alignment: { horizontal: "right", vertical: "center" },
      border,
    };
    const cell = (v: any, s: any) => ({ v, s });

    const wb = XLSX.utils.book_new();
    let wsData: any[][] = [];
    let merges: any[] = [];
    let r = 0;

    wsData[r] = Array(14).fill("");
    wsData[r][0] = cell("TẬP ĐOÀN CÔNG NGHIỆP\nTHAN – KHOÁNG SẢN VIỆT NAM", {
      font: fontB,
      alignment: { horizontal: "center", wrapText: true },
    });
    wsData[r][11] = cell("Mẫu số S21-DN", {
      font: fontB,
      alignment: { horizontal: "center" },
    });
    merges.push({ s: { r: r, c: 0 }, e: { r: r + 1, c: 3 } });
    merges.push({ s: { r: r, c: 11 }, e: { r: r + 1, c: 13 } });
    r++;
    wsData[r] = Array(14).fill("");
    r++;

    wsData[r] = Array(14).fill("");
    wsData[r][0] = cell(currentBrandConfig.company, {
      font: fontB,
      alignment: { horizontal: "center" },
    });
    wsData[r][11] = cell(
      "(Ban hành theo Thông tư số 200/2014/TT-BTC\nngày 22/12/2014 của Bộ Tài chính)",
      {
        font: { ...font, italic: true },
        alignment: { horizontal: "center", wrapText: true },
      },
    );
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 3 } });
    merges.push({ s: { r: r, c: 11 }, e: { r: r + 1, c: 13 } });
    r += 2;

    wsData[r] = Array(14).fill("");
    wsData[r][0] = cell("SỔ TÀI SẢN CỐ ĐỊNH", {
      font: { name: "Times New Roman", sz: 16, bold: true },
      alignment: { horizontal: "center" },
    });
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 13 } });
    r++;
    wsData[r] = Array(14).fill("");
    wsData[r][6] = cell(`Năm: ${selectedYear || ""}`, {
      font: { ...font },
      alignment: { horizontal: "center" },
    });
    merges.push({ s: { r: r, c: 4 }, e: { r: r, c: 9 } });
    r += 2;

    wsData[r] = Array(14)
      .fill(null)
      .map(() => cell("", sHeader));
    wsData[r][0] = cell("STT", { ...sHeader });
    wsData[r][1] = cell("Ghi tăng TSCĐ", { ...sHeader });
    merges.push({ s: { r: r, c: 1 }, e: { r: r, c: 7 } });
    wsData[r][8] = cell("Khấu hao TSCĐ", { ...sHeader });
    merges.push({ s: { r: r, c: 8 }, e: { r: r, c: 10 } });
    wsData[r][11] = cell("Ghi giảm TSCĐ", { ...sHeader });
    merges.push({ s: { r: r, c: 11 }, e: { r: r, c: 13 } });
    r++;

    wsData[r] = Array(14)
      .fill(null)
      .map(() => cell("", sHeader));
    wsData[r][1] = cell("Chứng từ", sHeader);
    merges.push({ s: { r: r, c: 1 }, e: { r: r, c: 2 } });
    wsData[r][3] = cell("Tên, đặc điểm, ký hiệu TSCĐ", sHeader);
    merges.push({ s: { r: r, c: 3 }, e: { r: r, c: 3 } });
    wsData[r][4] = cell("Nước sản xuất", sHeader);
    wsData[r][5] = cell("Tháng năm đưa vào sử dụng", sHeader);
    wsData[r][6] = cell("Số hiệu TSCĐ", sHeader);
    wsData[r][7] = cell("Nguyên giá TSCĐ", sHeader);
    wsData[r][8] = cell("Khấu hao", sHeader);
    merges.push({ s: { r: r, c: 8 }, e: { r: r, c: 9 } });
    wsData[r][10] = cell("Khấu hao đã tính đến khi ghi giảm TSCĐ", sHeader);
    wsData[r][11] = cell("Chứng từ", sHeader);
    merges.push({ s: { r: r, c: 11 }, e: { r: r, c: 12 } });
    wsData[r][13] = cell("Lý do giảm TSCĐ", sHeader);
    r++;

    wsData[r] = [
      cell("A", sHeader),
      cell("B", sHeader),
      cell("C", sHeader),
      cell("D", sHeader),
      cell("E", sHeader),
      cell("G", sHeader),
      cell("H", sHeader),
      cell("I", sHeader),
      cell("2", sHeader),
      cell("3", sHeader),
      cell("4", sHeader),
      cell("K", sHeader),
      cell("L", sHeader),
      cell("M", sHeader),
    ];
    r++;

    (data.rows || []).forEach((row: any, i: number) => {
      wsData[r] = [
        cell(i + 1, sCenter), // STT
        cell(row.soHieu || "", sText),
        cell(row.ngay || "", sText),
        cell(row.ten || "", sText),
        cell(row.nuocSanXuat || "", sText),
        cell(row.thangNam || "", sText),
        cell(row.soHieuTscd || "", sText),
        cell(Number(row.nguyenGia) || row.nguyenGia || "", sNum),
        cell(row.tyLeKhauHao || "", sNum),
        cell(row.mucKhauHao || "", sNum),
        cell(row.khauHaoDaTinh || "", sNum),
        cell(row.soHieu || "", sText),
        cell(row.ngay || "", sText),
        cell(row.lyDoGiam || "", sText),
      ];
      r++;
    });

    const parseNum = (v: any) => {
      if (v === null || v === undefined || v === "") return 0;
      const s = String(v).replace(/[,\s]/g, "");
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : 0;
    };
    const totalNguyenGia = (data.rows || []).reduce(
      (s: number, r0: any) => s + parseNum(r0.nguyenGia),
      0,
    );
    const totalKhauHaoDaTinh = (data.rows || []).reduce(
      (s: number, r0: any) => s + parseNum(r0.khauHaoDaTinh),
      0,
    );

    wsData[r] = Array(14).fill(cell("", sHeader));
    wsData[r][0] = cell("", sHeader);
    wsData[r][1] = cell("Cộng", sHeader);
    wsData[r][7] = cell(totalNguyenGia || "", sNum);
    wsData[r][10] = cell(totalKhauHaoDaTinh || "", sNum);
    r++;

    wsData[r] = Array(14).fill("");
    wsData[r][0] = cell(
      "- Sổ này có .......... trang, đánh số từ trang 01 đến trang ..........",
      sText,
    );
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 13 } });
    r++;
    wsData[r] = Array(14).fill("");
    wsData[r][0] = cell("- Ngày mở sổ: ........................", sText);
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 13 } });
    r += 2;

    wsData[r] = Array(14).fill("");
    wsData[r][0] = cell("Người ghi sổ", { ...sHeader, font: fontB });
    wsData[r][5] = cell("Kế toán trưởng", { ...sHeader, font: fontB });
    wsData[r][10] = cell("Giám đốc", { ...sHeader, font: fontB });
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 4 } });
    merges.push({ s: { r: r, c: 5 }, e: { r: r, c: 9 } });
    merges.push({ s: { r: r, c: 10 }, e: { r: r, c: 13 } });
    r++;
    wsData[r] = Array(14).fill("");
    wsData[r][0] = cell("(Ký, họ tên)", {
      font: { name: "Times New Roman", sz: 11, italic: true },
      alignment: { horizontal: "center" },
    });
    wsData[r][5] = cell("(Ký, họ tên)", {
      font: { name: "Times New Roman", sz: 11, italic: true },
      alignment: { horizontal: "center" },
    });
    wsData[r][10] = cell("(Ký, họ tên, đóng dấu)", {
      font: { name: "Times New Roman", sz: 11, italic: true },
      alignment: { horizontal: "center" },
    });
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 4 } });
    merges.push({ s: { r: r, c: 5 }, e: { r: r, c: 9 } });
    merges.push({ s: { r: r, c: 10 }, e: { r: r, c: 13 } });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = merges;
    ws["!cols"] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 12 },
      { wch: 40 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 },
      { wch: 8 },
      { wch: 8 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
    ];

    const safeName = (selectedDeptName || "MauSo21").replace(
      /[^a-z0-9\-_]/gi,
      "_",
    );
    const fname = `Mau_So_21_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    try {
      XLSX.utils.book_append_sheet(wb, ws, "S21DN");
      XLSX.writeFile(wb, fname);
      setSnackbarMessage("Xuất file thành công");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (err: any) {
      console.error("Export MauSo21 error", err);
      setSnackbarMessage(
        err?.message ? `Lỗi xuất file: ${err.message}` : "Lỗi khi xuất file",
      );
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

  const selectedDeptAssetGroupName =
    groups.find(
      (d: any) => d.id?.toString() === String(formik.values.IdLoaiTaiSan),
    )?.tenNhom || "";
  const selectedYear = (() => {
    try {
      const raw = formik.values.NgayBaoCao;
      if (!raw) return "";
      const d = new Date(raw);
      const y = d.getFullYear();
      return Number.isFinite(y) ? y : "";
    } catch {
      return "";
    }
  })();

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
        <style>{`
        @media print {
          /* ensure wrapper removes scroll/borders */
          .report-scroll-container { position: static !important; margin: 0 !important; padding: 8mm !important; width: 100% !important; box-sizing: border-box !important; height: auto !important; overflow: visible !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }

          /* hide app chrome when using the marker-class */
          body.s22dn-print-mode #app-header,
          body.s22dn-print-mode header,
          body.s22dn-print-mode .app-header,
          body.s22dn-print-mode .topbar,
          body.s22dn-print-mode .MuiAppBar-root,
          body.s22dn-print-mode .navbar,
          body.s22dn-print-mode .layout-header,
          body.s22dn-print-mode .sidebar,
          body.s22dn-print-mode .left-sidebar { display: none !important; }

          /* Force printable content to not enforce large min-widths and fit page */
          #printable-mauso21-content, #printable-mauso21-content * { min-width: 0 !important; max-width: 100% !important; }
          #printable-mauso21-content { visibility: visible !important; padding: 6mm !important; zoom: 0.78; }
          #printable-mauso21-content table { min-width: 0 !important; width: 100% !important; table-layout: fixed !important; font-size: 8pt !important; }
          #printable-mauso21-content th, #printable-mauso21-content td { padding: 2px 4px !important; vertical-align: middle !important; }

          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          .no-print { display: none !important; }
        }
      `}</style>
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
            #printable-mauso21-content { visibility: visible !important; }

            #printable-mauso21-content table {
              width: 100% !important;
              border-collapse: collapse;
              page-break-inside: auto;
              font-size: 8.5pt !important;
              table-layout: fixed !important;
              word-break: break-word !important;
              white-space: normal !important;
              max-width: 100% !important;
            }

            #printable-mauso21-content col { width: auto !important; }
            #printable-mauso21-content table col { width: auto !important; }
            #printable-mauso21-content th, #printable-mauso21-content td {
              padding: 1px 4px !important;
              vertical-align: middle !important;
              font-size: 8.5pt !important;
              white-space: normal !important;
              overflow: hidden !important;
            }

            #printable-mauso21-content { zoom: 0.82; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }

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
              title="Đơn vị"
              labelkey="tenPhongBan"
              data={departments}
              name="IdDonVi"
              onChange={(values) => {
                setSelectedDeptName?.(values ? values.tenPhongBan : "");
              }}
              componentsProps={{
                paper: {
                  sx: {
                    backgroundColor: "#fff0f5",
                    borderRadius: "6px",
                  },
                },
                popper: {
                  style: { width: 360, overflow: "visible" },
                  placement: "bottom-start",
                },
                listbox: {
                  sx: { maxHeight: 220, overflow: "auto" },
                },
              }}
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <FieldAutoCompleted
              title="Loại tài sản"
              labelkey="tenNhom"
              data={groups}
              name="IdLoaiTaiSan"
              componentsProps={{
                paper: {
                  sx: {
                    backgroundColor: "#fff0f5",
                    borderRadius: "6px",
                  },
                },
                popper: {
                  style: { width: 360, overflow: "visible" },
                  placement: "bottom-start",
                },
                listbox: {
                  sx: { maxHeight: 220, overflow: "auto" },
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <FieldDateTime title="Năm" name="NgayBaoCao" />
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
            <Box
              className="no-print"
              sx={{ display: "flex", gap: 1, alignItems: "center" }}
            >
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
            position: "relative",
            zIndex: 1,
          }}
        >
          <MauSo21Content
            onContentChange={handleContentChange}
            selectedDeptName={selectedDeptName}
            selectedDeptAssetGroupName={selectedDeptAssetGroupName}
            selectedYear={selectedYear}
            idCongTy={idCongTy}
            idDonVi={formik.values.IdDonVi}
            idNhomTaiSan={formik.values.IdLoaiTaiSan}
            ngayBaoCao={formik.values.NgayBaoCao}
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
