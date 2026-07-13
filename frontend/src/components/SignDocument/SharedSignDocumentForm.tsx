import {
  Box,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from "@mui/material";
import { RateReviewOutlined } from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import "../../assets/fonts/times_new_roman-normal";
import { findById, generateSha256 } from "../../utils/helpers";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { SignaturesData } from "./types";
import dayjs from "dayjs";
import { showErrorAlert } from "../Alert";
import axios from "axios";
import { ConfirmPin } from "./ConfirmPin";
import { SignHeader } from "./SignHeader";
import CollapsibleSidebar from "./CollapsibleSidebar";
import SidebarContent from "./SidebarContent";
import { PdfViewer } from "./PdfViewer";
import renderDigitalSignatureToImage from "./DigitalSignatureToImage";
import S3Service from "../../services/S3Service";
import { handleSigning } from "../../utils/efySigning";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface SharedSignDocumentFormProps {
  idTaiLieu: string;
  pdfUrl: string | null;
  initialSignatures?: SignaturesData[];
  onSign: (data: SignaturesData[], pdfBlob: Blob) => Promise<void>;
  onCancel: () => void;
  title?: string;
  staffs: any[];
  canUserSign: (type: number, currentSignatures: SignaturesData[]) => boolean;
  fullscreen?: boolean;
  showSignerSidebar?: boolean;
  sourcePdfBytes?: Uint8Array | null;
  showHeader?: boolean;
  trangThai?: number;
  initialNote?: string;
  onSaveNote?: (note: string) => Promise<void>;
  onReject?: () => Promise<void>;
  coordinates?: Record<
    string,
    { xRatio: number; yRatio: number; page?: number }
  >;
}

export default function SharedSignDocumentForm({
  idTaiLieu,
  pdfUrl,
  initialSignatures = [],
  onSign,
  onCancel,
  title,
  staffs,
  canUserSign: canUserSignFunc,
  fullscreen = true,
  showSignerSidebar = true,
  sourcePdfBytes: externalSourcePdfBytes,
  showHeader = true,
  trangThai,
  initialNote,
  onSaveNote,
  onReject,
  coordinates,
}: SharedSignDocumentFormProps) {
  const [signatureType, setSignatureType] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const { user } = useSelector((state: RootState) => state.user);
  const employee = findById(staffs, user?.taiKhoan?.tenDangNhap);
  const hasAutoSigned = useRef(false);

  const [signatures, setSignatures] =
    useState<SignaturesData[]>(initialSignatures);
  const [pages, setPages] = useState<HTMLCanvasElement[]>([]);
  const [isSignLoading, setIsSignLoading] = useState(false);
  const [viewNoteOpen, setViewNoteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [digitalSignatureMap, setDigitalSignatureMap] = useState<
    Record<string, string>
  >({});
  const [openConfirmPin, setOpenConfirmPin] = useState(false);
  const [canvasDisplaySizes, setCanvasDisplaySizes] = useState<
    { width: number; height: number }[]
  >([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (initialSignatures.length > 0) {
      setSignatures(initialSignatures);
    }
  }, [initialSignatures]);

  const executeSigning = async (idNguoiKy: string, idTaiLieu: string) => {
    const result = await handleSigning(idNguoiKy, idTaiLieu);
    if (!result) {
      showErrorAlert("Ký không thành công hoặc đăng nhập thất bại!");
    }
    return result;
  };

  const handleConfirmPinDialog = async (pin: string) => {
    if (employee?.pin !== pin) {
      showErrorAlert("Mã pin không chính xác!");
      return;
    }

    setOpenConfirmPin(false);
    const result = await executeSigning(
      user?.taiKhoan?.tenDangNhap,
      "document-id",
    );

    if (!result) return;

    // [FIX] Lưu widthRatio thay vì px tuyệt đối
    const displayWidth = canvasDisplaySizes[0]?.width || 800;
    const baseWidthPx = 120;

    const userCoords = coordinates?.[user?.taiKhoan?.tenDangNhap];
    const defaultX = userCoords ? userCoords.xRatio : 0.2;
    const defaultY = userCoords ? userCoords.yRatio : 0.8;
    const defaultPage = userCoords ? (userCoords.page ?? 1) : 1;

    const newSignature: SignaturesData = {
      stt: signatures.length + 1,
      id: `temp-${Date.now()}`,
      idTaiLieu: idTaiLieu,
      idNguoiKy: user?.taiKhoan?.tenDangNhap,
      loaiKy: signatureType,
      ngayKy: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      x: defaultX,
      y: defaultY,
      chuKyNhay:
        (signatureType === 1 || signatureType === 5) && employee.chuKyNhay,
      chuKyThuong:
        (signatureType === 2 || signatureType === 4) && employee.chuKyThuong,
      width: baseWidthPx,
      widthRatio: baseWidthPx / displayWidth, // [FIX] tỉ lệ không đổi khi resize
      scale: 1,
      chuKySo: result,
      isLocked: false,
      page: defaultPage,
    };

    setSignatures((prev) => [...prev, newSignature]);
  };

  const handleSign = async () => {
    if (!employee) return;
    if (!employee.chuKyNhay && !employee.chuKyThuong && !employee.chuKySo) {
      return showErrorAlert("Không tìm thấy chữ ký");
    }
    if (signatureType === 0) {
      return showErrorAlert("Chưa chọn chữ ký");
    }

    if (!canUserSignFunc(signatureType, signatures)) {
      const hasDigitalSignature = signatures.some((img) =>
        [3, 4, 5].includes(img.loaiKy),
      );
      const errorMessage =
        hasDigitalSignature && ![3, 4, 5].includes(signatureType)
          ? "Tài liệu đã có chữ ký số, bạn chỉ có thể ký bằng chữ ký số!"
          : "Bạn đã ký tài liệu này rồi, không thể ký thêm!";
      showErrorAlert(errorMessage);
      return;
    }

    let key = "";
    if ([3, 4, 5].includes(signatureType)) {
      if (!employee.savePin) {
        setOpenConfirmPin(true);
        return;
      }
      const result = await executeSigning(
        user?.taiKhoan?.tenDangNhap,
        "document-id",
      );
      if (!result) return;
      key = result;
    }

    // [FIX] Lưu widthRatio thay vì px tuyệt đối
    const displayWidth = canvasDisplaySizes[0]?.width || 800;
    const baseWidthPx = 120;

    const userCoords = coordinates?.[user?.taiKhoan?.tenDangNhap];
    const defaultX = userCoords ? userCoords.xRatio : 0.2;
    const defaultY = userCoords ? userCoords.yRatio : 0.8;
    const defaultPage = userCoords ? (userCoords.page ?? 1) : 1;

    const newSignature: SignaturesData = {
      stt: signatures.length + 1,
      id: `temp-${Date.now()}`,
      idTaiLieu: idTaiLieu,
      idNguoiKy: user?.taiKhoan?.tenDangNhap,
      loaiKy: signatureType,
      ngayKy: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      x: defaultX,
      y: defaultY,
      chuKyNhay:
        (signatureType === 1 || signatureType === 5) && employee.chuKyNhay,
      chuKyThuong:
        (signatureType === 2 || signatureType === 4) && employee.chuKyThuong,
      width: baseWidthPx,
      widthRatio: baseWidthPx / displayWidth, // [FIX]
      scale: signatureType === 2 || signatureType === 4 ? 2 : 1,
      chuKySo: key,
      isLocked: false,
      page: defaultPage,
    };

    setSignatures([...signatures, newSignature]);
  };

  useEffect(() => {
    if (employee && !hasAutoSigned.current && signatures.length === 0) {
      if (employee.kySo) {
        if (employee.kyThuong) setSignatureType(4);
        else if (employee.kyNhay) setSignatureType(5);
        else setSignatureType(3);
      } else {
        if (employee.kyThuong) setSignatureType(2);
        else if (employee.kyNhay) setSignatureType(1);
      }
    }
  }, [employee, signatures.length]);

  useEffect(() => {
    const renderDigitalSignatures = async () => {
      const newMap: Record<string, string> = {};
      for (const sig of signatures) {
        if (sig.loaiKy === 3 && !digitalSignatureMap[sig.id]) {
          const signer = findById(staffs, sig.idNguoiKy);
          const base64 = await renderDigitalSignatureToImage(
            signer?.hoTen,
            dayjs(sig.ngayKy).format("DD/MM/YYYY"),
          );
          newMap[sig.id] = base64;
        }
      }
      if (Object.keys(newMap).length > 0) {
        setDigitalSignatureMap((prev) => ({ ...prev, ...newMap }));
      }
    };
    renderDigitalSignatures();
  }, [signatures, staffs]);

  const handleUpdatePosition = (
    id: string,
    newXRatio: number,
    newYRatio: number,
    newPage?: number,
  ) => {
    setSignatures((prev) =>
      prev.map((sig) =>
        sig.id === id
          ? {
              ...sig,
              x: newXRatio,
              y: newYRatio,
              ...(newPage !== undefined ? { page: newPage } : {}),
            }
          : sig,
      ),
    );
  };

  const handleUpdateScale = (id: string, newScale: number) => {
    setSignatures((prev) =>
      prev.map((sig) => (sig.id === id ? { ...sig, scale: newScale } : sig)),
    );
  };

  const handleUpdatePage = (id: string, newPage: number) => {
    setSignatures((prev) =>
      prev.map((sig) => (sig.id === id ? { ...sig, page: newPage } : sig)),
    );
  };

  const handleDeleteSignature = (id: string) => {
    setSignatures((prev) => prev.filter((sig) => sig.id !== id));
  };

  const handleConfirmSign = async () => {
    const newSignatures = signatures.filter((i) => !i.isLocked);
    if (newSignatures.length === 0) {
      return showErrorAlert("Chưa có chữ ký nào để lưu");
    }

    setLoading(true);
    try {
      if (!pdfUrl) throw new Error("Không có dữ liệu PDF để xử lý");
      const existingPdfBytes = await fetch(pdfUrl).then((res) =>
        res.arrayBuffer(),
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pdfPages = pdfDoc.getPages();

      for (const sig of signatures) {
        let imageBytes: ArrayBuffer | undefined;
        if (sig.loaiKy === 3) {
          const base64Data = digitalSignatureMap[sig.id];
          if (!base64Data) continue;
          const base64Content = base64Data.split(",")[1];
          const binaryString = window.atob(base64Content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          imageBytes = bytes.buffer;
        } else {
          const imgPath = sig.chuKyNhay || sig.chuKyThuong;
          if (!imgPath) continue;
          const s3Url = await S3Service.presignedGetUrl(imgPath);
          if (!s3Url) continue;
          const response = await fetch(s3Url);
          if (!response.ok) continue;
          imageBytes = await response.arrayBuffer();
        }

        if (imageBytes) {
          const pdfImage = await pdfDoc.embedPng(imageBytes);

          const sigPageNum = sig.page || 1;
          const targetPage = pdfPages[sigPageNum - 1] || pdfPages[0];
          const { width: pageWidth, height: pageHeight } = targetPage.getSize();

          // [FIX] Dùng widthRatio để tính kích thước trong PDF — không phụ thuộc displayWidth
          const canvasWidth =
            canvasDisplaySizes[sigPageNum - 1]?.width ||
            canvasDisplaySizes[0]?.width ||
            800;
          const effectiveWidthRatio =
            sig.widthRatio ?? (sig.width * (sig.scale || 1)) / canvasWidth;
          const pdfImageWidth =
            effectiveWidthRatio * (sig.scale || 1) * pageWidth;
          const pdfImageHeight =
            (pdfImage.height / pdfImage.width) * pdfImageWidth;
          const x = sig.x * pageWidth;
          const y = pageHeight - sig.y * pageHeight - pdfImageHeight;

          targetPage.drawImage(pdfImage, {
            x,
            y,
            width: pdfImageWidth,
            height: pdfImageHeight,
          });
        }
      }

      const finalPdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([finalPdfBytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });

      await onSign(newSignatures, pdfBlob);
      setOpenSnackbar(true);
    } catch (error: any) {
      console.error("Lỗi khi ký và cập nhật file:", error);
      showErrorAlert(
        `Có lỗi xảy ra: ${error.message || "Không thể ký và cập nhật file."}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const sourceBytes =
        externalSourcePdfBytes ||
        (pdfUrl ? await fetch(pdfUrl).then((res) => res.arrayBuffer()) : null);
      if (!sourceBytes) throw new Error("Không có dữ liệu để xuất");

      const pdfDoc = await PDFDocument.load(sourceBytes);
      const pdfPages = pdfDoc.getPages();

      for (const sig of signatures) {
        let imageBytes: ArrayBuffer | undefined;
        if (sig.loaiKy === 3) {
          const base64 = digitalSignatureMap[sig.id];
          if (!base64) continue;
          const bin = atob(base64.split(",")[1]);
          imageBytes = Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer;
        } else {
          const path = sig.chuKyNhay || sig.chuKyThuong;
          if (!path) continue;
          const s3Url = await S3Service.presignedGetUrl(path);
          if (!s3Url) continue;
          const response = await fetch(s3Url);
          if (!response.ok) continue;
          imageBytes = await response.arrayBuffer();
        }

        if (imageBytes) {
          const img = await pdfDoc.embedPng(imageBytes);
          const sigPageNum = sig.page || 1;
          const targetPage = pdfPages[sigPageNum - 1] || pdfPages[0];
          const { width, height } = targetPage.getSize();

          // [FIX] Dùng widthRatio
          const canvasWidth =
            canvasDisplaySizes[sigPageNum - 1]?.width ||
            canvasDisplaySizes[0]?.width ||
            800;
          const effectiveWidthRatio =
            sig.widthRatio ?? (sig.width * sig.scale) / canvasWidth;
          const pdfW = effectiveWidthRatio * sig.scale * width;
          const pdfH = (img.height / img.width) * pdfW;
          targetPage.drawImage(img, {
            x: sig.x * width,
            y: height - sig.y * height - pdfH,
            width: pdfW,
            height: pdfH,
          });
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TaiLieuKy_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setOpenSnackbar(true);
    } catch (e: any) {
      console.error(e);
      setPdfError("Xuất PDF thất bại");
    } finally {
      setLoading(false);
    }
  };

  // --- Render PDF ---
  useEffect(() => {
    const renderPDF = async () => {
      if (!pdfUrl) return;
      try {
        setLoading(true);
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        const canvases: HTMLCanvasElement[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          const viewport = page.getViewport({ scale: 1.5 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.dataset.page = i.toString();
          await page.render({ canvasContext: context, viewport }).promise;
          canvases.push(canvas);
        }
        setPages(canvases);
        setPdfError(null);
      } catch (error: any) {
        setPdfError(`Lỗi đọc PDF: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    renderPDF();
  }, [pdfUrl]);

  // [FIX] Xóa ResizeObserver cũ ở đây — PdfViewer tự quản lý observe canvas DOM thực

  const sidebarProps = {
    signatureType,
    setSignatureType,
    employee,
    handleSign,
    handleConfirmSign,
    onCancel,
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        height: fullscreen ? "100vh" : "100%",
        bgcolor: "#f5f5f5",
        ...(fullscreen && { position: "fixed", inset: 0, zIndex: 9999 }),
      }}
    >
      {showHeader && (
        <SignHeader
          pagesCount={pages.length}
          handleExportPDF={handleExportPDF}
          onCancel={() => {
            onCancel();
            setSignatures([]);
          }}
          title={title}
          trangThai={trangThai}
          initialNote={initialNote}
          onSaveNote={onSaveNote}
          onReject={onReject}
        />
      )}

      {/* Popup Dialog xem ghi chú */}
      <Dialog
        open={viewNoteOpen}
        onClose={() => setViewNoteOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "12px", p: 1 },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            pb: 1,
            color: "#d97706",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <RateReviewOutlined /> Nội dung ghi chú
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography
            variant="body1"
            sx={{
              color: "#78350f",
              bgcolor: "#fffbeb",
              p: 2,
              borderRadius: "8px",
              border: "1px solid #fde68a",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {initialNote}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setViewNoteOpen(false)}
            sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          flexDirection: isMobile ? "column-reverse" : "row",
        }}
      >
        {showSignerSidebar &&
          (isMobile ? (
            <CollapsibleSidebar>
              <SidebarContent
                {...sidebarProps}
                onCancel={() => {
                  onCancel();
                  setSignatures([]);
                }}
              />
            </CollapsibleSidebar>
          ) : (
            <Paper
              elevation={6}
              sx={{
                width: 320,
                p: 2,
                borderRight: "1px solid #e0e0e0",
                height: "100%",
                overflowY: "auto",
              }}
            >
              <SidebarContent
                {...sidebarProps}
                onCancel={() => {
                  onCancel();
                  setSignatures([]);
                }}
              />
            </Paper>
          ))}

        <Box
          ref={containerRef}
          sx={{
            flex: 1,
            bgcolor: "#e0e0e0",
            p: 4,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          {initialNote && (
            <Tooltip title="Xem ghi chú biên bản">
              <Button
                variant="contained"
                onClick={() => setViewNoteOpen(true)}
                startIcon={<RateReviewOutlined />}
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  bgcolor: "#fef3c7",
                  color: "#d97706",
                  "&:hover": { bgcolor: "#fde68a" },
                  zIndex: 98,
                  borderRadius: "20px",
                  fontWeight: 600,
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                  textTransform: "none",
                }}
              >
                Ghi chú
              </Button>
            </Tooltip>
          )}

          {pdfError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {pdfError}
            </Alert>
          )}
          {loading ? (
            <CircularProgress sx={{ mt: 10 }} />
          ) : (
            <PdfViewer
              pages={pages}
              signatures={signatures}
              canvasDisplaySizes={canvasDisplaySizes}
              setCanvasDisplaySizes={setCanvasDisplaySizes} // [FIX] thêm dòng này
              digitalSignatureMap={digitalSignatureMap}
              handleUpdatePosition={handleUpdatePosition}
              handleUpdateScale={handleUpdateScale}
              handleDeleteSignature={handleDeleteSignature}
              handleUpdatePage={handleUpdatePage}
            />
          )}
        </Box>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="success">Thành công</Alert>
      </Snackbar>

      <ConfirmPin
        open={openConfirmPin}
        onClose={() => setOpenConfirmPin(false)}
        onConfirm={handleConfirmPinDialog}
      />
    </Box>
  );
}
