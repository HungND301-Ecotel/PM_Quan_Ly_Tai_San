import React, { useState, useCallback } from "react";
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
import { Print, TableChart } from "@mui/icons-material";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldYearMonth from "../../../components/TextField/FieldYearMonth";
import MauSo01Content from "./MauSo01Content";
import { Buffer } from "buffer";
import XLSX from "xlsx-js-style";
import ExportExcelButton from "../../../components/Button/ExportExcelButton";
import { CongTy } from "../../../utils/const";
import { currentBrandConfig } from "../../../config/brandConfig";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

export default function MauSo01({ title }: { title?: string }) {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "warning"
  >("success");
  const [contentData, setContentData] = useState<any>({});
  const [fetchKey, setFetchKey] = useState(0);

  const handleContentChange = useCallback((data: any) => {
    setContentData(data);
  }, []);

  const formik = useFormik({
    initialValues: {
      IdDonVi: "",
      KyBaoCao: `${String(new Date().getMonth() + 1).padStart(
        2,
        "0",
      )}/${new Date().getFullYear()}`,
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
    const data = contentData;
    if (
      !data ||
      (!data.tsRows?.length &&
        !data.ccdcRows?.length &&
        !data.rows?.length &&
        !data.tableRows?.length)
    ) {
      setSnackbarMessage("Chưa có dữ liệu để xuất!");
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
    const styleHeader = {
      font: fontB,
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border,
    };
    const styleText = {
      font,
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border,
    };
    const styleCenter = {
      font,
      alignment: { horizontal: "center", vertical: "center" },
      border,
    };
    const styleNum = {
      font,
      alignment: { horizontal: "right", vertical: "center" },
      border,
    };
    const cell = (v: any, s: any) => ({ v, s });

    const wb = XLSX.utils.book_new();
    let wsData: any[][] = [];
    let merges: any[] = [];
    let r = 0;

    wsData[r] = Array(12).fill("");
    wsData[r][0] = cell("TẬP ĐOÀN CÔNG NGHIỆP\nTHAN – KHOÁNG SẢN VIỆT NAM", {
      font: fontB,
      alignment: { horizontal: "center", wrapText: true },
    });
    wsData[r][7] = cell("Mẫu số 01", {
      font: fontB,
      alignment: { horizontal: "center" },
    });
    merges.push(
      { s: { r: r, c: 0 }, e: { r: r + 1, c: 3 } },
      { s: { r: r, c: 7 }, e: { r: r, c: 11 } },
    );
    r++;

    wsData[r] = Array(12).fill("");
    r++;

    wsData[r] = Array(12).fill("");
    wsData[r][0] = cell(currentBrandConfig.company, {
      font: fontB,
      alignment: { horizontal: "center" },
    });
    wsData[r][7] = cell(
      "Ban hành kèm theo QĐ số ...../QĐ-TUB\nngày ..../..../.... của Giám đốc Công ty",
      {
        font: { ...font, italic: true },
        alignment: { horizontal: "center", wrapText: true },
      },
    );
    merges.push(
      { s: { r: r, c: 0 }, e: { r: r, c: 3 } },
      { s: { r: r, c: 7 }, e: { r: r + 1, c: 11 } },
    );
    r += 2;

    wsData[r] = Array(12).fill("");
    wsData[r][0] = cell(
      "SỔ THEO DÕI TÀI SẢN CỐ ĐỊNH VÀ CÔNG CỤ DỤNG CỤ TẠI NƠI SỬ DỤNG",
      {
        font: { name: "Times New Roman", sz: 16, bold: true },
        alignment: { horizontal: "center" },
      },
    );
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 11 } });
    r++;
    wsData[r] = Array(12).fill("");
    wsData[r][0] = cell(`Tháng ${formik.values.KyBaoCao}`, {
      font: { ...font, italic: true },
      alignment: { horizontal: "center" },
    });
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 11 } });
    r++;
    wsData[r] = Array(12).fill("");
    wsData[r][0] = cell("(Áp dụng cho các phân xưởng)", {
      font: { ...font, italic: true },
      alignment: { horizontal: "center" },
    });
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 11 } });
    r += 2;

    const h1 = Array(12)
      .fill(null)
      .map(() => cell("", styleHeader));
    h1[0] = cell("STT", styleHeader);
    h1[1] = cell(
      "Tên nhãn hiệu, quy cách tài sản cố định, công cụ dụng cụ",
      styleHeader,
    );
    h1[2] = cell("Đơn vị tính", styleHeader);
    h1[3] = cell("Nước sản xuất", styleHeader);
    h1[4] = cell("Số dư đầu kỳ", styleHeader);
    h1[5] = cell("Tăng trong kỳ", styleHeader);
    h1[7] = cell("Giảm trong kỳ", styleHeader);
    h1[9] = cell("Số dư cuối kỳ", styleHeader);
    h1[10] = cell("Tình trạng kỹ thuật", styleHeader);
    h1[11] = cell("Ghi chú", styleHeader);
    wsData[r] = h1;

    const h2 = Array(12)
      .fill(null)
      .map(() => cell("", styleHeader));
    h2[5] = cell("Số lượng", styleHeader);
    h2[6] = cell("Lý do tăng", styleHeader);
    h2[7] = cell("Số lượng", styleHeader);
    h2[8] = cell("Lý do giảm", styleHeader);
    wsData[r + 1] = h2;

    wsData[r + 2] = [
      "A",
      "B",
      "C",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7=2+3-5",
      "8",
      "9",
    ].map((t) => cell(t, styleHeader));

    [0, 1, 2, 3, 4, 9, 10, 11].forEach((c) =>
      merges.push({ s: { r: r, c: c }, e: { r: r + 1, c: c } }),
    );
    merges.push(
      { s: { r: r, c: 5 }, e: { r: r, c: 6 } },
      { s: { r: r, c: 7 }, e: { r: r, c: 8 } },
    );
    r += 3;

    const fillRow = (row: any, stt: any) => [
      cell(stt, styleCenter),
      cell(row.tenNhanHieu, styleText),
      cell(row.donViTinh || row.dvt, styleCenter),
      cell(row.nuocSanXuat, styleCenter),
      cell(Number(row.soDuDauKy) || 0, styleNum),
      cell(Number(row.tangSoLuong) || 0, styleNum),
      cell(row.tangLyDo, styleText),
      cell(Number(row.giamSoLuong) || 0, styleNum),
      cell(row.giamLyDo, styleText),
      cell(Number(row.soDuCuoiKy) || 0, styleNum),
      cell(row.tinhTrang, styleText),
      cell(row.ghiChu, styleText),
    ];

    const deriveFromTable = (which: "A" | "B") => {
      const t = data.tableRows || [];
      const res: any[] = [];
      let inSection = false;
      for (const r of t) {
        if (r.stt === which) {
          inSection = true;
          continue;
        }
        if (inSection) {
          if (r.stt === "A" || r.stt === "B") break;
          res.push(r);
        }
      }
      return res;
    };

    const tsRows =
      data.tsRows && data.tsRows.length ? data.tsRows : deriveFromTable("A");
    const ccdcRows =
      data.ccdcRows && data.ccdcRows.length
        ? data.ccdcRows
        : deriveFromTable("B");

    wsData[r] = Array(12).fill(cell("", { font: fontB, border }));
    wsData[r][0] = cell("A", {
      font: fontB,
      border,
      alignment: { horizontal: "center" },
    });
    wsData[r][1] = cell("Tài sản cố định", { font: fontB, border });
    r++;
    if (tsRows?.length) {
      tsRows.forEach((row: any, i: number) => {
        wsData[r] = fillRow(row, i + 1);
        r++;
      });
    }

    wsData[r] = Array(12).fill(cell("", { font: fontB, border }));
    wsData[r][0] = cell("B", {
      font: fontB,
      border,
      alignment: { horizontal: "center" },
    });
    wsData[r][1] = cell("Công cụ dụng cụ", { font: fontB, border });
    r++;
    if (ccdcRows?.length) {
      ccdcRows.forEach((row: any, i: number) => {
        wsData[r] = fillRow(row, i + 1);
        r++;
      });
    }
    if (!data.tsRows && !data.ccdcRows && data.rows) {
      data.rows.forEach((row: any, i: number) => {
        wsData[r] = fillRow(row, i + 1);
        r++;
      });
    }
    r++;

    wsData[r] = Array(12).fill("");
    wsData[r][0] = cell(
      "Gửi kèm theo các Quyết định, biên bản giao nhận tăng giảm tài sản, công cụ dụng cụ trong kỳ báo cáo",
      styleText,
    );
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 11 } });
    r++;
    wsData[r] = Array(12).fill("");
    wsData[r][0] = cell(
      "Lưu ý: Báo cáo tháng trước vào ngày 15 hàng tháng (tháng sau)",
      { ...styleText, font: { name: "Times New Roman", sz: 11, italic: true } },
    );
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 11 } });
    r += 2;

    wsData[r] = Array(12).fill("");
    const sSign = { font: fontB, alignment: { horizontal: "center" } };
    wsData[r][0] = cell("Thống kê phân xưởng", sSign);
    wsData[r][4] = cell("Phó quản đốc cơ điện", sSign);
    wsData[r][8] = cell("Quản đốc phân xưởng", sSign);
    merges.push(
      { s: { r: r, c: 0 }, e: { r: r, c: 3 } },
      { s: { r: r, c: 4 }, e: { r: r, c: 7 } },
      { s: { r: r, c: 8 }, e: { r: r, c: 11 } },
    );

    r++;
    wsData[r] = Array(12).fill("");
    const sSignNote = {
      font: { name: "Times New Roman", sz: 11, italic: true },
      alignment: { horizontal: "center" },
    };
    wsData[r][0] = cell("(Ký, ghi rõ họ tên)", sSignNote);
    wsData[r][4] = cell("(Ký, ghi rõ họ tên)", sSignNote);
    wsData[r][8] = cell("(Ký, ghi rõ họ tên)", sSignNote);
    merges.push(
      { s: { r: r, c: 0 }, e: { r: r, c: 3 } },
      { s: { r: r, c: 4 }, e: { r: r, c: 7 } },
      { s: { r: r, c: 8 }, e: { r: r, c: 11 } },
    );

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = merges;
    ws["!cols"] = [
      { wch: 5 },
      { wch: 35 },
      { wch: 8 },
      { wch: 10 },
      { wch: 8 },
      { wch: 8 },
      { wch: 15 },
      { wch: 8 },
      { wch: 15 },
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
    ];

    const fileName = `Mau_So_01_${(formik.values.IdDonVi || "").replace(/ /g, "_")}_${formik.values.KyBaoCao.replace("/", "-")}.xlsx`;
    try {
      XLSX.utils.book_append_sheet(wb, ws, "MauSo01");
      XLSX.writeFile(wb, fileName);
      setSnackbarMessage("Xuất file thành công");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (err: any) {
      console.error("Export MauSo01 error", err);
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
        {/* GLOBAL PRINT STYLES (copied from ReportS22DN, scoped to this component) */}
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
            #printable-mauso01-content { visibility: visible !important; }

            #printable-mauso01-content table {
              width: 100% !important;
              border-collapse: collapse;
              page-break-inside: auto;
              font-size: 8.5pt !important;
              table-layout: fixed !important;
              word-break: break-word !important;
              white-space: normal !important;
              max-width: 100% !important;
            }

            #printable-mauso01-content col { width: auto !important; }
            #printable-mauso01-content table col { width: auto !important; }
            #printable-mauso01-content th, #printable-mauso01-content td {
              padding: 1px 4px !important;
              vertical-align: middle !important;
              font-size: 8.5pt !important;
              white-space: normal !important;
              overflow: hidden !important;
            }

            #printable-mauso01-content { zoom: 0.82; }
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
            <FieldYearMonth
              title="Kỳ báo cáo"
              name="KyBaoCao"
            />
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
          <MauSo01Content
            onContentChange={handleContentChange}
            idDonVi={formik.values.IdDonVi}
            fetchKey={fetchKey}
            kyBaoCao={formik.values.KyBaoCao}
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
