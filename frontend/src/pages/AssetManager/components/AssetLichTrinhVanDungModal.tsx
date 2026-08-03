import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
} from "@mui/material";
import { Close, Save, CalendarMonth, Settings } from "@mui/icons-material";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import { showSuccessAlert, showErrorAlert } from "../../../components/Alert";
import { useMenuData } from "../../../hooks/useMenuData";
import LichTrinhTable from "./AssetLichTrinhVanDungTable";
import {
  useLichTrinhQuery,
  useCreateLichTrinhBatchMutation,
  useUpdateLichTrinhBatchMutation,
  useLuyKeQuery,
} from "../Mutation";
import { AssetLichTrinhChiTietType, AssetLichTrinhType } from "../types";
import { currentBrandConfig } from "../../../config/brandConfig";

// ============================================================
// Types
// ============================================================
export interface AssetScheduleData {
  idLichTrinh?: string;
  idTaiSan: string;
  tenTaiSan: string;
  soThe: string;
  ghiChu: string;
  chiTietLichTrinhs: AssetLichTrinhChiTietType[];
  luyKeTruoc?: number;
  chuKySuaChua?: number; // Chu kỳ sửa chữa đầu tiên tính theo giờ
}

interface LichTrinhVanDungModalProps {
  open: boolean;
  onClose: () => void;
  selectedAssets: any[];
}

// ============================================================
// Helpers
// ============================================================
const getDaysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();

// ============================================================
// Design System Tokens
// ============================================================
export const colors = {
  bgApp: "#f8fafc",
  borderDark: currentBrandConfig.primaryColor,
  borderLight: "#e2e8f0",
  cellBorder: "#cbd5e1",
  headerBg: currentBrandConfig.primaryColor,
  headerText: "#ffffff",
  accent: currentBrandConfig.primaryColor100,
  accentHover: currentBrandConfig.primaryColor,
  textMain: "#1e293b",
  textMuted: "#64748b",
  rowHover: "#f1f5f9",
  sumBg: currentBrandConfig.primaryColor100,
  sumText: currentBrandConfig.primaryColor,
};

export const cellBorderCss = `1px solid ${colors.cellBorder}`;

export const headerCellSx = {
  fontWeight: 700,
  fontSize: "11px",
  letterSpacing: "0.05em",
  border: `1px solid ${colors.borderDark}`,
  backgroundColor: colors.headerBg,
  color: colors.headerText,
  textAlign: "center" as const,
  padding: "8px 4px",
  whiteSpace: "normal" as const,
  lineHeight: 1.4,
  fontFamily: '"Outfit", "Inter", sans-serif',
  textTransform: "uppercase" as const,
};

export const dataCellSx = {
  fontSize: "12px",
  border: cellBorderCss,
  padding: "3px 4px",
  textAlign: "center" as const,
  height: "32px",
  verticalAlign: "middle" as const,
  fontFamily: '"Inter", sans-serif',
  color: colors.textMain,
};

export const inputSx = {
  "& .MuiInputBase-root": {
    borderRadius: "4px",
    backgroundColor: "transparent",
    transition: "all 0.2s ease",
    "&:hover": { backgroundColor: "rgba(16, 185, 129, 0.04)" },
    "&.Mui-focused": {
      backgroundColor: "#ffffff",
      boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.2)",
    },
  },
  "& .MuiInputBase-input": {
    textAlign: "center",
    fontSize: "13px",
    padding: "4px 2px",
    fontWeight: 600,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  },
  "& .MuiInput-underline:before": { borderBottom: "none" },
  "& .MuiInput-underline:after": { borderBottom: `2px solid ${colors.accent}` },
  "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
    borderBottom: "none",
  },
};

export const sumCellSx = {
  ...dataCellSx,
  fontWeight: 700,
  backgroundColor: colors.sumBg,
  color: colors.sumText,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
};

// ============================================================
// AssetScheduleItem — fetch data riêng mỗi tài sản
// ============================================================
interface AssetScheduleItemProps {
  asset: any;
  nam: number;
  thang: number;
  onDataReady: (
    idTaiSan: string,
    nam: number,
    thang: number,
    data: AssetScheduleData,
  ) => void;
}

const AssetScheduleItem = React.memo(
  ({ asset, nam, thang, onDataReady }: AssetScheduleItemProps) => {
    const idTaiSan = asset.id || asset.soThe;
    const { data: schedule } = useLichTrinhQuery(idTaiSan, nam, thang);
    const { data: luyKeData } = useLuyKeQuery(idTaiSan, nam, thang);

    useEffect(() => {
      // Lấy chu kỳ sửa chữa đầu tiên tính theo giờ
      const chuKyHour = (() => {
        const list: any[] = asset.chuKySuaChuaList || [];
        const hourEntry = list.find(
          (e: any) =>
            (e.donViChuKy || "").toLowerCase() === "giờ" && e.chuKy,
        );
        return hourEntry ? Number(hourEntry.chuKy) : undefined;
      })();

      const result: AssetScheduleData = {
        idLichTrinh: schedule?.id,
        idTaiSan,
        tenTaiSan: asset.tenTaiSan || "Không tên",
        soThe: asset.soThe || "",
        ghiChu: schedule?.ghiChu || "",
        chiTietLichTrinhs: schedule?.chiTietLichTrinhs || [],
        luyKeTruoc: luyKeData ?? schedule?.luyKeTruoc ?? 0,
        chuKySuaChua: chuKyHour,
      };
      onDataReady(idTaiSan, nam, thang, result);
    }, [
      schedule,
      luyKeData,
      idTaiSan,
      nam,
      thang,
      asset.tenTaiSan,
      asset.soThe,
      onDataReady,
    ]);

    return null;
  },
);

// ============================================================
// Component chính
// ============================================================
export default function LichTrinhVanDungModal({
  open,
  onClose,
  selectedAssets,
}: LichTrinhVanDungModalProps) {
  const queryClient = useQueryClient();
  const { config } = useMenuData();
  const thoiGianBaoSuaChua: number = (config as any)?.thoiGianBaoSuaChua ?? 30;
  const now = dayjs();
  const [selectedMonth, setSelectedMonth] = useState(now.month() + 1);
  const [selectedYear, setSelectedYear] = useState(now.year());

  // Map "idTaiSan|nam|thang" -> AssetScheduleData
  const [assetsMap, setAssetsMap] = useState<Record<string, AssetScheduleData>>(
    {},
  );

  const createBatch = useCreateLichTrinhBatchMutation();
  const updateBatch = useUpdateLichTrinhBatchMutation();

  const nam = selectedYear;
  const thang = selectedMonth;

  const daysInMonth = useMemo(
    () => getDaysInMonth(selectedMonth, selectedYear),
    [selectedMonth, selectedYear],
  );

  // Reset map chỉ khi đóng modal
  useEffect(() => {
    if (!open) setAssetsMap({});
  }, [open]);

  // Callback nhận data từ từng AssetScheduleItem
  // Key = idTaiSan|nam|thang để tránh hiển thị data tháng cũ
  const handleDataReady = useCallback(
    (idTaiSan: string, n: number, t: number, data: AssetScheduleData) => {
      const key = `${idTaiSan}|${n}|${t}`;
      setAssetsMap((prev) => {
        if (
          prev[key]?.idLichTrinh === data.idLichTrinh &&
          prev[key]?.chiTietLichTrinhs === data.chiTietLichTrinhs &&
          prev[key]?.luyKeTruoc === data.luyKeTruoc
        ) {
          return prev;
        }
        return { ...prev, [key]: data };
      });
    },
    [],
  );

  // Lấy mảng theo thứ tự selectedAssets, chỉ lấy data đúng tháng/năm hiện tại
  const assetsData = useMemo(
    () =>
      selectedAssets
        .map((a) => assetsMap[`${a.id || a.soThe}|${nam}|${thang}`])
        .filter(Boolean) as AssetScheduleData[],
    [assetsMap, selectedAssets, nam, thang],
  );

  // Set giá trị giờ
  const setShiftValue = useCallback(
    (assetIdx: number, day: number, ca: number, value: number) => {
      const idTaiSan =
        selectedAssets[assetIdx]?.id || selectedAssets[assetIdx]?.soThe;
      if (!idTaiSan) return;
      const key = `${idTaiSan}|${nam}|${thang}`;
      setAssetsMap((prev) => {
        const asset = prev[key];
        if (!asset) return prev;
        const chiTiets = [...asset.chiTietLichTrinhs];
        const idx = chiTiets.findIndex((s) => s.ngay === day);
        if (idx >= 0) {
          const detail = { ...chiTiets[idx] };
          if (ca === 1) detail.ca1 = value;
          if (ca === 2) detail.ca2 = value;
          if (ca === 3) detail.ca3 = value;
          chiTiets[idx] = detail;
        } else {
          chiTiets.push({
            idLichTrinh: asset.idLichTrinh,
            ngay: day,
            ca1: ca === 1 ? value : 0,
            ca2: ca === 2 ? value : 0,
            ca3: ca === 3 ? value : 0,
          });
        }
        return { ...prev, [key]: { ...asset, chiTietLichTrinhs: chiTiets } };
      });
    },
    [selectedAssets, nam, thang],
  );

  // Set trường meta
  const setAssetField = useCallback(
    (assetIdx: number, field: keyof AssetScheduleData, value: any) => {
      const idTaiSan =
        selectedAssets[assetIdx]?.id || selectedAssets[assetIdx]?.soThe;
      if (!idTaiSan) return;
      const key = `${idTaiSan}|${nam}|${thang}`;
      setAssetsMap((prev) => {
        const asset = prev[key];
        if (!asset) return prev;
        return { ...prev, [key]: { ...asset, [field]: value } };
      });
    },
    [selectedAssets, nam, thang],
  );

  // Lưu
  const handleSave = async () => {
    const toCreate: AssetLichTrinhType[] = [];
    const toUpdate: AssetLichTrinhType[] = [];

    assetsData.forEach((asset) => {
      const validChiTiets = asset.chiTietLichTrinhs.filter(
        (ct) => (ct.ca1 || 0) > 0 || (ct.ca2 || 0) > 0 || (ct.ca3 || 0) > 0,
      );
      const payload: AssetLichTrinhType = {
        idTaiSan: asset.idTaiSan,
        nam,
        thang,
        ghiChu: asset.ghiChu,
        chiTietLichTrinhs: validChiTiets,
      };
      if (asset.idLichTrinh) {
        payload.id = asset.idLichTrinh;
        toUpdate.push(payload);
      } else {
        toCreate.push(payload);
      }
    });

    try {
      const settled = await Promise.allSettled([
        ...(toCreate.length > 0 ? [createBatch.mutateAsync(toCreate)] : []),
        ...(toUpdate.length > 0 ? [updateBatch.mutateAsync(toUpdate)] : []),
      ]);

      if (settled.length === 0) return;

      const failures = settled.filter((r) => r.status === "rejected");
      const hasSuccess = failures.length < settled.length;

      if (failures.length === 0) {
        showSuccessAlert("Lưu lịch trình thành công!");
      } else if (hasSuccess) {
        showSuccessAlert(
          "Một số lịch trình đã được lưu, nhưng có lỗi xảy ra với các mục khác.",
        );
      } else {
        throw new Error("Tất cả các thao tác lưu đều thất bại");
      }

      if (hasSuccess) {
        queryClient.invalidateQueries({ queryKey: ["lichtrinh"] });
        queryClient.invalidateQueries({ queryKey: ["luyKe"] });
      }
    } catch (error) {
      console.error(error);
      showErrorAlert("Có lỗi xảy ra khi lưu lịch trình");
    }
  };

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  const isSaving = createBatch.isPending || updateBatch.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(6px)",
            backgroundColor: "rgba(15, 23, 42, 0.4)",
          },
        },
      }}
      PaperProps={{
        sx: {
          width: "96vw",
          maxWidth: "96vw",
          height: "92vh",
          maxHeight: "92vh",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        },
      }}
    >
      {/* Render ẩn — mỗi tài sản fetch data riêng biệt khi modal mở */}
      {open &&
        selectedAssets.map((asset) => (
          <AssetScheduleItem
            key={`${asset.id || asset.soThe}-${nam}-${thang}`}
            asset={asset}
            nam={nam}
            thang={thang}
            onDataReady={handleDataReady}
          />
        ))}

      {/* ===== HEADER ===== */}
      <DialogTitle
        sx={{
          background: colors.headerBg,
          color: colors.headerText,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 4,
          borderBottom: `1px solid ${colors.borderDark}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(16, 185, 129, 0.15)",
              color: colors.accent,
              p: 1,
              borderRadius: "8px",
            }}
          >
            <CalendarMonth />
          </Box>
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "16px",
                letterSpacing: "0.02em",
                fontFamily: '"Outfit", "Inter", sans-serif',
              }}
            >
              Lịch trình vận dụng
            </Typography>
            <Typography sx={{ fontSize: "11px", color: colors.textMain }}>
              Báo cáo & Nhập giờ máy hoạt động chi tiết
            </Typography>
          </Box>
          <Chip
            label={`${selectedAssets.length} tài sản đang chọn`}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.08)",
              color: "#e2e8f0",
              fontWeight: 600,
              fontSize: "11px",
              border: "1px solid rgba(255,255,255,0.1)",
              ml: 1,
            }}
          />
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: "rgba(255,255,255,0.6)",
            "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.08)" },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: colors.bgApp,
        }}
      >
        {/* ===== CONTROLS ===== */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 4,
            py: 2,
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            flexShrink: 0,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box sx={{ display: "flex", gap: 2.5, alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: "13px", fontWeight: 500 }}>
                Tháng
              </InputLabel>
              <Select
                value={selectedMonth}
                label="Tháng"
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                sx={{ borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <MenuItem key={m} value={m}>
                    Tháng {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: "13px", fontWeight: 500 }}>
                Năm
              </InputLabel>
              <Select
                value={selectedYear}
                label="Năm"
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                sx={{ borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}
              >
                {[
                  now.year() - 2,
                  now.year() - 1,
                  now.year(),
                  now.year() + 1,
                ].map((y) => (
                  <MenuItem key={y} value={y}>
                    Năm {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "rgba(15, 23, 42, 0.05)",
                py: 0.6,
                px: 1.5,
                borderRadius: "20px",
              }}
            >
              <Settings sx={{ fontSize: "14px", color: colors.textMuted }} />
              <Typography
                sx={{
                  fontSize: "12px",
                  color: colors.textMuted,
                  fontWeight: 600,
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                Kỳ làm việc: {daysInMonth} ngày
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={
              isSaving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Save />
              )
            }
            onClick={handleSave}
            disabled={isSaving}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "13px",
              px: 4,
              py: 1,
              borderRadius: "8px",
            }}
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu"}
          </Button>
        </Box>

        {/* ===== TABLE ===== */}
        <LichTrinhTable
          assetsData={assetsData}
          days={days}
          daysInMonth={daysInMonth}
          setShiftValue={setShiftValue}
          setAssetField={setAssetField}
          thoiGianBaoSuaChua={thoiGianBaoSuaChua}
        />
      </DialogContent>
    </Dialog>
  );
}
