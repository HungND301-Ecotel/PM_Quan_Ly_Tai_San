import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  ButtonBase,
  Typography,
} from "@mui/material";
import {
  LoopOutlined, // icon cho "Chu kỳ theo nhóm"
  HistoryOutlined, // icon cho "Lịch sử bảo dưỡng"
} from "@mui/icons-material";
import { FilterOption } from "../../components/common/FilterStatusGroup";
import PageAction from "../../components/common/PageAction";
import TableCustom from "../../components/common/TableCustom";
import { useChuKySuaChuaQuery, useMaintenanceHistoryQuery } from "./mutation";
import { useDebounce } from "../../hooks/useDebounce";
import { maintenanceLevelColors } from "../../mockdata/mockPlans";
import { GridColDef } from "@mui/x-data-grid";
import { currentBrandConfig } from "../../config/brandConfig";

const historyStatusConfig: Record<
  string,
  { label: string; color: "success" | "default" | "warning" | "info" | "error" }
> = {
  "1": { label: "Chuẩn bị bảo dưỡng", color: "info" },
  "2": { label: "Cần bảo dưỡng", color: "warning" },
  "3": { label: "Trong kỳ bảo dưỡng", color: "info" },
  "4": { label: "Đã bảo dưỡng", color: "success" },
};

// ── Component chính ──────────────────────────────────────
export default function MaintenanceCycles() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const searchDebounce = useDebounce(searchValue, 500);

  // ── Tab 0: Chu kỳ theo tài sản (API) ─────────────────────────
  const { data: pagedData, isLoading } = useChuKySuaChuaQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
  );

  const cycles = (pagedData?.items || []).map((item: any, idx: number) => ({
    ...item,
    stt: paginationModel.page * paginationModel.pageSize + idx + 1,
  }));

  const cycleColumns: GridColDef[] = [
    { field: "stt", headerName: "STT", width: 60 },
    { field: "idTaiSan", headerName: "Mã tài sản", width: 120 },
    { field: "tenTaiSan", headerName: "Tên tài sản", flex: 1, minWidth: 200 },
    {
      field: "tenLoaiSuaChua",
      headerName: "Loại bảo trì",
      width: 150,
    },
    {
      field: "idLoaiSuaChua",
      headerName: "Mã",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (p: any) => (
        <Chip
          label={p.value}
          size="small"
          sx={{
            bgcolor: maintenanceLevelColors[p.value] || "#1FA463",
          }}
        />
      ),
    },
    { field: "chuKy", headerName: "Chu kỳ", width: 90 },
    { field: "donViChuKy", headerName: "Đơn vị", width: 90 },
  ];

  // ── Tab 1: Lịch sử bảo dưỡng (API) ────────────────────────
  const {
    data: historyPagedData = { items: [] },
    isLoading: isHistoryLoading,
  } = useMaintenanceHistoryQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    statusFilter,
  );

  const historyRows = (historyPagedData?.items || []).map(
    (item: any, idx: number) => ({
      ...item,
      id:
        item.id ||
        item.idTaiSan ||
        paginationModel.page * paginationModel.pageSize + idx + 1,
      stt: paginationModel.page * paginationModel.pageSize + idx + 1,
    }),
  );

  const hCounts = historyPagedData?.trangThaiCounts || {};
  const historyStatusOptions: FilterOption[] = [
    {
      label: "Tất cả",
      value: "",
      count:
        (hCounts["1"] || 0) +
        (hCounts["2"] || 0) +
        (hCounts["3"] || 0) +
        (hCounts["4"] || 0),
      color: "primary",
    },
    {
      label: "Chuẩn bị bảo dưỡng",
      value: "1",
      count: hCounts["1"] || 0,
      color: "info",
    },
    {
      label: "Cần bảo dưỡng",
      value: "2",
      count: hCounts["2"] || 0,
      color: "warning",
    },
    {
      label: "Trong kỳ bảo dưỡng",
      value: "3",
      count: hCounts["3"] || 0,
      color: "info",
    },
    {
      label: "Đã bảo dưỡng",
      value: "4",
      count: hCounts["4"] || 0,
      color: "success",
    },
  ];

  const historyColumns = [
    { field: "thietBiId", headerName: "Mã TB", width: 110 },
    { field: "thietBi", headerName: "Tên thiết bị", flex: 1, minWidth: 160 },
    {
      field: "nhomTaiSan",
      headerName: "Nhóm",
      width: 110,
      renderCell: (p: any) => (
        <Chip label={p.value} size="small" variant="outlined" />
      ),
    },
    { field: "lanBTGanNhat", headerName: "Lần BT gần nhất", width: 140 },
    {
      field: "loaiBT",
      headerName: "Loại BT",
      width: 110,
      renderCell: (p: any) =>
        p.value ? (
          <Chip
            label={p.value}
            size="small"
            sx={{
              bgcolor: maintenanceLevelColors[p.value] || "#1FA463",
            }}
          />
        ) : (
          <span>—</span>
        ),
    },
    {
      field: "statusHistory",
      headerName: "Trạng thái",
      width: 150,
      renderCell: (p: any) => {
        const val = String(p.value);
        const cfg = historyStatusConfig[val];
        if (!cfg) return <span>—</span>;
        return <Chip label={cfg.label} size="small" color={cfg.color as any} />;
      },
    },
  ];

  // reset khi đổi tab
  const handleTabChange = (val: number) => {
    setActiveTab(val);
    setSearchValue("");
    setStatusFilter("");
    setPaginationModel({ pageSize: 10, page: 0 });
  };

  return (
    <>
      <PageAction title="Chu kỳ bảo dưỡng thiết bị" />

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {/* ── Tabs ── */}
          <Box
            sx={{
              width: "100%",
              overflowX: "auto",
              display: "flex",
              gap: 2,
              p: 2,
              bgcolor: "#f8fafc",
              borderBottom: "1px solid",
              borderColor: "divider",
              "&::-webkit-scrollbar": {
                height: "6px",
              },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "grey.300",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-track": {
                bgcolor: "transparent",
              },
            }}
          >
            {[
              {
                label: "Chu kỳ theo tài sản",
                subLabel: "Quản lý chu kỳ bảo dưỡng",
                icon: LoopOutlined,
              },
              {
                label: "Lịch sử bảo dưỡng",
                subLabel: "Lịch sử bảo dưỡng ",
                icon: HistoryOutlined,
              },
            ].map((t, idx) => {
              const IconComponent = t.icon;
              const isActive = activeTab === idx;

              return (
                <ButtonBase
                  key={idx}
                  onClick={() => handleTabChange(idx)}
                  focusRipple
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    minWidth: 175,
                    flex: "1 0 175px",
                    height: 110,
                    p: 2,
                    borderRadius: "14px",
                    textAlign: "left",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                    border: "1px solid",
                    borderColor: isActive
                      ? "transparent"
                      : "rgba(148, 163, 184, 0.25)",
                    background: isActive
                      ? `linear-gradient(135deg, ${currentBrandConfig.primaryColor} 0%, ${currentBrandConfig.primaryColor} 100%)`
                      : "#ffffff",
                    color: isActive ? "#ffffff" : "#334155",
                    boxShadow: isActive
                      ? "0 4px 12px rgba(4, 180, 110, 0.15)"
                      : "0 2px 4px rgba(0, 0, 0, 0.05)",
                    "&:hover": {
                      borderColor: isActive
                        ? "transparent"
                        : currentBrandConfig.primaryColor,
                      bgcolor: isActive ? undefined : "rgba(4, 180, 110, 0.04)",
                    },
                  }}
                >
                  {/* Top Row: Icon */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      bgcolor: isActive
                        ? "rgba(255, 255, 255, 0.18)"
                        : "rgba(4, 180, 110, 0.08)",
                      color: isActive ? "#ffffff" : "#04b46e",
                      transition: "all 0.25s ease",
                      mb: 1.5,
                    }}
                  >
                    <IconComponent sx={{ fontSize: 20 }} />
                  </Box>

                  {/* Bottom: Labels */}
                  <Box sx={{ width: "100%" }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1.3,
                        color: "inherit",
                        mb: 0.25,
                      }}
                    >
                      {t.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        lineHeight: 1.3,
                        color: isActive ? "rgba(255,255,255,0.75)" : "#94a3b8",
                        fontWeight: 400,
                      }}
                    >
                      {t.subLabel}
                    </Typography>
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>

          {/* ── Nội dung theo tab ── */}
          <Box sx={{ minHeight: 500 }}>
            {/* Tab 0: Chu kỳ theo tài sản */}
            {activeTab === 0 && (
              <Card elevation={0} sx={{ borderRadius: 0 }}>
                <CardContent sx={{ p: "0 !important" }}>
                  <TableCustom
                    title="Danh sách chu kỳ"
                    rows={cycles}
                    columns={cycleColumns}
                    total={pagedData?.data?.total || 0}
                    loading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    checkboxSelection={false}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    showDelete={false}
                  />
                </CardContent>
              </Card>
            )}

            {/* Tab 1: Lịch sử bảo dưỡng */}
            {activeTab === 1 && (
              <Card elevation={0} sx={{ borderRadius: 0 }}>
                <CardContent sx={{ p: "0 !important" }}>
                  <TableCustom
                    title="Lịch sử bảo dưỡng gần nhất"
                    rows={historyRows}
                    columns={historyColumns}
                    total={historyPagedData?.totalItems || 0}
                    loading={isHistoryLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    checkboxSelection={false}
                    statusOptions={historyStatusOptions}
                    statusValue={statusFilter}
                    onStatusChange={setStatusFilter}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    showDelete={false}
                  />
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
