import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Grid } from "@mui/material";
import { Dashboard as DashboardIcon } from "@mui/icons-material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import { useDashboardMutation, useDashboardStatisticsQuery } from "./Mutation";
import { COLORS } from "./components/PieChart";
import SummaryCards from "./components/SummaryCards";
import CcdcGroupCard from "./sections/CcdcGroupCard";
import CcdcMonthlyCard from "./sections/CcdcMonthlyCard";
import TaisanGroupCard from "./sections/TaisanGroupCard";
import TaisanTypeCard from "./sections/TaisanTypeCard";
import TaisanMonthlyCard from "./sections/TaisanMonthlyCard";
import NearDepreciationPanel from "./sections/NearDepreciationPanel";
import { QuickActionButtons } from "./components/QuickActionButtons";
import PageAction from "../../components/common/PageAction";
import { currentBrandConfig } from "../../config/brandConfig";
import AssetRepairTime from "./sections/AssetRepairTime";

/* ── Section header helper ─────────────────────────── */
const SectionHeader = ({ label, color }: { label: string; color: string }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      mt: 4,
      mb: 2,
    }}
  >
    <Box
      sx={{
        width: 4,
        height: 22,
        borderRadius: "4px",
        bgcolor: color,
        flexShrink: 0,
      }}
    />
    <Typography
      sx={{
        fontWeight: 700,
        fontSize: "18px",
        color: "#1e293b",
        lineHeight: 1,
      }}
    >
      {label}
    </Typography>
    <Box
      sx={{
        flex: 1,
        height: "1px",
        ml: 1,
        background: `linear-gradient(90deg, ${color}33 0%, transparent 100%)`,
      }}
    />
  </Box>
);

export default function DashBoard() {
  const currentYear = new Date().getFullYear();
  const [selectedNhomTaiSan, setSelectedNhomTaiSan] = useState<
    string | undefined
  >(undefined);
  const [selectedNhomCCDC, setSelectedNhomCCDC] = useState<string | undefined>(
    undefined,
  );
  const [yearTaiSan, setYearTaiSan] = useState(currentYear);
  const [yearCCDC, setYearCCDC] = useState(currentYear);

  const { data: statsData, isLoading: isLoadingStats } =
    useDashboardStatisticsQuery();
  const statistics = statsData?.data || null;

  const {
    taiSanTheoNhom,
    ccdcTheoNhom,
    nhomCCDCList,
    nhomTaiSanList,
    uniqueNhomCCDC,
    taiSanTheoLoai,
    ccdcTheoLoai,
    isLoading,
  } = useDashboardMutation(
    selectedNhomTaiSan,
    selectedNhomCCDC,
    yearTaiSan,
    yearCCDC,
  );

  const tongCCDC = useMemo(() => statistics?.tongCCDC || 0, [statistics]);
  const tongGiaTriCCDC = useMemo(
    () => statistics?.tongGiaTriCCDC || 0,
    [statistics],
  );

  const ccdcTheoThang = useMemo(() => {
    if (!statistics) return [];
    return statistics.ccdcTangMoiTheoThang || statistics.ccdcTheoThang || [];
  }, [statistics]);

  const taiSanTheoThang = useMemo(() => {
    if (!statistics) return [];
    return (
      statistics.taiSanTangMoiTheoThang || statistics.taiSanTheoThang || []
    );
  }, [statistics]);

  // Tự động chọn nhóm CCDC đầu tiên nếu chưa chọn
  useEffect(() => {
    if (
      !selectedNhomCCDC &&
      Array.isArray(uniqueNhomCCDC) &&
      uniqueNhomCCDC.length > 0
    ) {
      const first = uniqueNhomCCDC[0];
      if (first && first.id) setSelectedNhomCCDC(String(first.id));
    }
  }, [uniqueNhomCCDC, selectedNhomCCDC]);

  // Tự động chọn nhóm tài sản đầu tiên nếu chưa chọn
  useEffect(() => {
    if (
      !selectedNhomTaiSan &&
      Array.isArray(nhomTaiSanList) &&
      nhomTaiSanList.length > 0
    ) {
      const first = nhomTaiSanList[0];
      if (first?.id) setSelectedNhomTaiSan(String(first.id));
    }
  }, [nhomTaiSanList, selectedNhomTaiSan]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Dữ liệu biểu đồ tròn CCDC
  let ccdcPieData = (ccdcTheoNhom || []).map((item: any, index: number) => ({
    ten: item.tenNhom || item.ten,
    soLuong: item.soLuong,
    phanTram: item.phanTram,
    color: COLORS[index % COLORS.length],
  }));

  let hideCcdcLegend = false;
  const allEmptyGroup =
    !ccdcPieData ||
    ccdcPieData.length === 0 ||
    ccdcPieData.every(
      (it: any) =>
        !it.ten ||
        String(it.ten).trim() === "" ||
        String(it.ten).trim() === "Chưa xác định",
    );

  if (allEmptyGroup) {
    ccdcPieData = [{ ten: "", soLuong: 1, phanTram: 100, color: COLORS[0] }];
    hideCcdcLegend = true;
  }

  // Dữ liệu biểu đồ tròn tài sản
  const taiSanPieData = (taiSanTheoNhom || []).map(
    (item: any, index: number) => ({
      ten: item.ten || item.tenNhom,
      soLuong: item.soLuong,
      phanTram: item.phanTram,
      color: COLORS[index % COLORS.length],
    }),
  );

  // Dữ liệu biểu đồ cột CCDC (đã được chuẩn hóa từ hook)
  const ccdcBarData =
    ccdcTheoLoai && ccdcTheoLoai.length > 0 ? ccdcTheoLoai : [];

  const taiSanBarData = taiSanTheoLoai || [];

  // Dữ liệu tháng CCDC
  const rawCcdcMonthly = ccdcTheoThang || [];
  const ccdcMonthlyData = (rawCcdcMonthly || [])
    .filter((item: any) => item.nam === yearCCDC)
    .sort((a: any, b: any) => a.thang - b.thang);

  // Dữ liệu tháng tài sản
  const rawTaiSanMonthly = taiSanTheoThang || [];
  const taiSanMonthlyData = (rawTaiSanMonthly || [])
    .filter((item: any) => item.nam === yearTaiSan)
    .sort((a: any, b: any) => a.thang - b.thang);

  const maxCCDC = Math.max(
    ...(ccdcMonthlyData || []).map((d: any) => d.soLuong || 0),
    1,
  );
  const maxTaiSan = Math.max(
    ...(taiSanMonthlyData || []).map((d: any) => d.soLuong || 0),
    1,
  );

  return (
    <>
      <PageAction title="Tổng quan" hideActionRow={true} />

      {/* ── Premium Page Header ─────────────────────── */}
      <Box
        sx={{
          mx: 2,
          my: 3,
          px: 3.5,
          py: 3,
          borderRadius: "16px",
          background: `linear-gradient(135deg, ${currentBrandConfig.primaryColor100} 0%, ${currentBrandConfig.primaryColor100} 50%, ${currentBrandConfig.primaryColor} 100%)`,
          border: "1px solid rgba(4, 180, 110, 0.1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              bgcolor: "rgba(4, 180, 110, 0.12)",
              borderRadius: "14px",
              p: 1.3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(4, 180, 110, 0.1)",
            }}
          >
            <DashboardOutlinedIcon
              sx={{ color: currentBrandConfig.primaryColor, fontSize: 28 }}
            />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#1e293b",
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
              }}
            >
              Tổng quan
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#64748b", fontWeight: 500, mt: 0.3 }}
            >
              Thống kê tổng quan về tài sản và công cụ dụng cụ vật tư
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Main Dashboard Container ────────────────── */}
      <Box
        sx={{
          p: 3,
          borderRadius: "16px",
          bgcolor: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          mx: 2,
          mb: 3,
        }}
      >
        {/* Summary Cards */}
        <SummaryCards
          tongTaiSan={statistics?.tongTaiSan || 0}
          tongNguyenGia={statistics?.tongNguyenGia || 0}
          tongCCDC={tongCCDC || 0}
          tongGiaTriCCDC={tongGiaTriCCDC || 0}
          isLoading={isLoading}
        />

        {/* Quick Actions */}
        <QuickActionButtons />

        {/* ── CCDC Section ────────────────────────────── */}
        <SectionHeader label="Công cụ dụng cụ" color="#3b82f6" />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <CcdcGroupCard
              ccdcPieData={ccdcPieData}
              hideCcdcLegend={hideCcdcLegend}
              tongCCDC={tongCCDC}
              tongGiaTriCCDC={tongGiaTriCCDC}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <CcdcMonthlyCard
              ccdcMonthlyData={ccdcMonthlyData}
              maxCCDC={maxCCDC}
              yearCCDC={yearCCDC}
              setYearCCDC={setYearCCDC}
              years={years}
            />
          </Grid>
        </Grid>

        {/* ── Tài sản Section ─────────────────────────── */}
        <SectionHeader label="Tài sản" color="#04b46e" />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TaisanGroupCard
              taiSanPieData={taiSanPieData}
              statistics={statistics}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4.5 }}>
            <TaisanTypeCard
              taiSanBarData={taiSanBarData}
              selectedNhomTaiSan={selectedNhomTaiSan}
              setSelectedNhomTaiSan={setSelectedNhomTaiSan}
              uniqueNhomTaiSan={nhomTaiSanList}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4.5 }}>
            <TaisanMonthlyCard
              taiSanMonthlyData={taiSanMonthlyData}
              maxTaiSan={maxTaiSan}
              yearTaiSan={yearTaiSan}
              setYearTaiSan={setYearTaiSan}
              years={years}
            />
          </Grid>
        </Grid>

        {/* ── Depreciation Section ────────────────────── */}

        <Box>
          <NearDepreciationPanel />
        </Box>

        <Box>
          <AssetRepairTime />
        </Box>
      </Box>
    </>
  );
}
