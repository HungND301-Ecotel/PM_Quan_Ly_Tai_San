import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  Download,
  PictureAsPdf,
  Close,
  Fullscreen,
  FullscreenExit,
} from "@mui/icons-material";
import {
  generateAssetManentancePDF,
  generateAssetPdf,
  generateAssetCoverPDF,
  generateMonthlyActivityReport,
  generateTransferHistoryPDF,
  generateSparePartsPDF,
  generateMaintenanceMonthlyPDF,
  mergePdf,
} from "../config";
import AssetInfo from "./AssetEBook/AssetInfo";
import TransferHistoryPage from "./AssetEBook/TransferHistoryPage";
import {
  useAssetHoursPageQuery,
  useHistoryAssethandoverQuery,
  useLichTrinhYearQuery,
  usePhuTungTaiSanQuery,
  useSuaChuaMayThangQuery,
  useSuCoTaiSanQuery,
} from "../Mutation";
import HoursAsset from "./AssetEBook/HoursAsset";
import AssetMaintenance from "./AssetEBook/AssetMaintenance";
import AssetEbookCover from "./AssetEBook/AssetEbookCover";
import SparePartsPage from "./AssetEBook/SparePartsPage";
import MaintenanceMonthlyPage from "./AssetEBook/MaintenanceMonthlyPage";
import { showErrorAlert } from "../../../components/Alert";

interface AssetEbookContentProps {
  selectedAsset: any;
  readOnly?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onClose: () => void;
  onSave: (values: any) => void;
  allAssetModel: any[];
  allCurrentStatus: any[];
  assetGroups: any[];
  allDepartments: any[];
  allUnits: any[];
  allReasonIncreases: any[];
  isView?: boolean;
}

const AssetEbookContent = ({
  selectedAsset,
  readOnly,
  onEdit,
  onCancel,
  onClose,
  onSave,
  allAssetModel,
  allCurrentStatus,
  assetGroups,
  allDepartments,
  allUnits,
  allReasonIncreases,
  isView = false,
}: AssetEbookContentProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(7);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Các query này CHỈ lấy DATA (json), nhẹ, không build PDF
  // -> đổi selectedAsset -> selectedAsset?.id để tránh refetch không cần thiết
  //    nếu object selectedAsset bị tạo lại tham chiếu mới ở component cha
  // THEO DÕI DI CHUYỂN LẮP ĐẶT MÁY
  const {
    data: historyData = { items: [], totalItems: 0 },
    isLoading: isLoadingHistory,
  } = useHistoryAssethandoverQuery(
    0,
    999,
    undefined,
    undefined,
    selectedAsset?.id,
  );
  //BẢNG KÊ CÁC PHỤ TÙNG CHÍNH CỦA MÁY
  const { data: sparePartsData = [], isLoading: isLoadingSpareParts } =
    usePhuTungTaiSanQuery(selectedAsset?.id);

  // thời gian hoạt động
  const currentYear = new Date().getFullYear();
  const { data: scheduleList = [], isLoading: isLoadingSchedule } =
    useLichTrinhYearQuery(selectedAsset?.id, currentYear);
  //THEO DÕI TÌNH HÌNH SỰ CỐ XẢY RA HÀNG THÁNG\
  const { data: incidentData = [], isLoading: isLoadingIncident } =
    useSuCoTaiSanQuery(selectedAsset?.id);

  // THEO DÕI CÔNG VIỆC SỬA CHỮA MÁY
  const { data: repairData = [], isLoading: isLoadingRepair } =
    useSuaChuaMayThangQuery(selectedAsset?.id);

  const dataReady =
    !isLoadingHistory &&
    !isLoadingSchedule &&
    !isLoadingSpareParts &&
    !isLoadingIncident &&
    !isLoadingRepair;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onCancel();
  };

  // Build PDF CHỈ khi người dùng thật sự bấm tải file
  const handleDownloadPdf = async () => {
    if (!selectedAsset) return;
    setExporting(true);
    try {
      const listPdf = [];

      const cover = await generateAssetCoverPDF(selectedAsset);
      if (cover) listPdf.push(cover);

      const info = await generateAssetPdf(
        selectedAsset,
        allAssetModel,
        allCurrentStatus,
        assetGroups,
        allDepartments,
        allUnits,
        allReasonIncreases,
      );
      if (info) listPdf.push(info);

      const transfer = await generateTransferHistoryPDF(historyData.items);
      if (transfer) listPdf.push(transfer);

      const spareParts = await generateSparePartsPDF(sparePartsData);
      if (spareParts) listPdf.push(spareParts);

      const activity = await generateMonthlyActivityReport(
        scheduleList,
        currentYear,
      );
      if (activity) listPdf.push(activity);

      const incident = await generateAssetManentancePDF(incidentData);
      if (incident) listPdf.push(incident);

      const maintenanceMonthly =
        await generateMaintenanceMonthlyPDF(repairData);
      if (maintenanceMonthly) listPdf.push(maintenanceMonthly);

      const merge = await mergePdf(listPdf);
      if (!merge) {
        showErrorAlert("Không thể tạo file PDF.");
        return;
      }

      const blob = new Blob([merge.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TaiSan_${selectedAsset.soThe}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showErrorAlert("Không thể tạo file PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: isFullscreen ? "100vh" : "100%",
        width: isFullscreen ? "100vw" : "100%",
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? 0 : "unset",
        left: isFullscreen ? 0 : "unset",
        zIndex: isFullscreen ? 1300 : 1,
        bgcolor: "white",
        overflow: "hidden",
      }}
    >
      {!isView ? (
        <Box
          sx={{
            p: 2,
            background:
              "linear-gradient(to right, rgb(0, 158, 96, 1) 0%, rgb(2, 110, 66, 1) 100%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                bgcolor: "#f87b38ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <PictureAsPdf fontSize="small" />
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "#f3f4f6", fontSize: "16px" }}
            >
              Sổ tài sản điện tử ({selectedAsset.id})
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={
                exporting ? (
                  <CircularProgress size={16} sx={{ color: "#026e42" }} />
                ) : (
                  <Download />
                )
              }
              onClick={handleDownloadPdf}
              disabled={exporting || !dataReady}
              sx={{
                textTransform: "none",
                bgcolor: "white",
                color: "#026e42",
                fontWeight: 600,
                "&:hover": { bgcolor: "#f3f4f6" },
              }}
            >
              {exporting
                ? "Đang tạo..."
                : !dataReady
                  ? "Đang tải dữ liệu..."
                  : "Tải PDF"}
            </Button>
            <IconButton
              onClick={() => setIsFullscreen(!isFullscreen)}
              sx={{ color: "white" }}
              title={isFullscreen ? "Thu nhỏ" : "Phóng to"}
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
            <IconButton onClick={onClose} sx={{ color: "white" }}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box></Box>
      )}

      {/* Pagination */}
      <Box
        sx={{
          zIndex: 10,
          bgcolor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(4px)",
          py: 1,
          borderBottom: "1px dashed #009e60",
          display: "flex",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Button
          size="small"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          sx={{ color: "#009e60", textTransform: "none" }}
        >
          ← Trước
        </Button>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: "#026e42",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {currentPage} / {totalPages}
        </Box>
        <Button
          size="small"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          sx={{ color: "#009e60", textTransform: "none" }}
        >
          Sau →
        </Button>
      </Box>

      {/* Main Content Area - render trực tiếp component React theo trang, KHÔNG cần build PDF trước */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          bgcolor: "#e8e0d0",
          p: 2,
          backgroundImage:
            "radial-gradient(circle at 25% 50%, rgba(0,0,0,0.02) 1%, transparent 1%)",
          backgroundSize: "20px 20px",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "1000px",
            margin: "0 auto",
            "& > div": { width: "100%" },
          }}
        >
          {currentPage === 1 && (
            <AssetEbookCover
              asset={selectedAsset}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              totalPages={totalPages}
            />
          )}
          {currentPage === 2 && (
            <AssetInfo
              readOnly={readOnly}
              onEdit={onEdit}
              onCancel={onCancel}
              onClose={onClose}
              selectedAsset={selectedAsset}
              onSave={onSave}
              allAssetModel={allAssetModel}
              allCurrentStatus={allCurrentStatus}
              assetGroups={assetGroups}
              allDepartments={allDepartments}
              allUnits={allUnits}
              allReasonIncreases={allReasonIncreases}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              totalPages={totalPages}
              isView={isView}
            />
          )}
          {currentPage === 3 && (
            <TransferHistoryPage
              readOnly={readOnly}
              onEdit={onEdit}
              onCancel={onCancel}
              asset={selectedAsset}
              allDepartments={allDepartments}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              totalPages={totalPages}
              isView={isView}
            />
          )}
          {currentPage === 4 && (
            <SparePartsPage
              asset={selectedAsset}
              readOnly={readOnly}
              onEdit={onEdit}
              onCancel={onCancel}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              totalPages={totalPages}
              isView={isView}
            />
          )}
          {currentPage === 5 && (
            <HoursAsset
              readOnly={readOnly}
              onEdit={onEdit}
              onCancel={onCancel}
              asset={selectedAsset}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              totalPages={totalPages}
              allDepartments={allDepartments}
              isView={isView}
            />
          )}
          {currentPage === 6 && (
            <AssetMaintenance
              asset={selectedAsset}
              readOnly={readOnly}
              onEdit={onEdit}
              onCancel={onCancel}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              totalPages={totalPages}
              isView={isView}
            />
          )}
          {currentPage === 7 && (
            <MaintenanceMonthlyPage
              asset={selectedAsset}
              readOnly={readOnly}
              onEdit={onEdit}
              onCancel={onCancel}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              totalPages={totalPages}
              isView={isView}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AssetEbookContent;
