import React, { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useLocation } from "react-router-dom";

import IncidentDialog from "./components/dialog/IncidentDialog";

import CreatePlanDialog from "./components/dialog/PlanDialog";
import PlanDetailPanel from "./components/planning/PlanDetailPanel";
import IncidentDetailPanel from "./components/planning/IncidentDetailPanel";
import { FilterOption } from "../../components/common/FilterStatusGroup";
import PageAction from "../../components/common/PageAction";
import TableCustom from "../../components/common/TableCustom";
import {
  useMaintenanceIncidenMutation,
  useMaintenanceIncidentByPlanQuery,
  useMaintenanceIncidentPageQuery,
  useMaintenancePlanningGroupedQuery,
  useMaintenancePlanningMutation,
} from "./mutation";
import { AssetGroup, CongTy } from "../../utils/const";
import { MaintenancePlanData } from "./types";
import { showServerity, showShareStatus, showStatus } from "./config";
import { useDebounce } from "../../hooks/useDebounce";
import { IncidenData } from "./types";
import { Edit, Trash2 } from "lucide-react";
import { useAllDepartmentsQuery } from "../Department/Mutation";
import { showConfirmAlert } from "../../components/Alert";
import { useSelector } from "react-redux";
import Filter from "./components/Filter";
import { useAppSelector } from "../../redux/store";
import DraftIndicator from "../../components/common/DraftIndicator";
import { currentBrandConfig } from "../../config/brandConfig";
import { IncidentAdapter } from "./Adapter";

export default function MaintenancePlanRepair() {
  const { user } = useSelector((state: any) => state.user);

  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlanData | null>(
    null,
  );
  const [selectedIncident, setSelectedIncident] = useState<IncidenData | null>(
    null,
  );

  const [searchValue, setSearchValue] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedIncidentIds, setSelectedIncidentIds] = useState<string[]>([]);
  const [expandedIncidentPlanIds, setExpandedIncidentPlanIds] = useState<
    Set<string>
  >(new Set());
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const { data: allDepartment = [] } = useAllDepartmentsQuery();
  const searchDebounce = useDebounce(searchValue, 500);
  // kehoach
  const { data: groupedData, isLoading } = useMaintenancePlanningGroupedQuery(
    CongTy.CT001,
    statusFilter !== "" ? Number(statusFilter) : undefined,
    searchDebounce,
    undefined,
    selectedDepartment,
    dateFrom,
    dateTo,
  );
  const { createMutation, updateMutation, deleteMutation } =
    useMaintenancePlanningMutation();

  const location = useLocation();
  const tabPath = location.pathname;

  const lastMinimizedDialog = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t) => t.path === tabPath);
    return tab?.formData?.lastMinimizedDialog ?? null;
  });

  const lastMinimizedIncidentDialog = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t) => t.path === tabPath);
    return tab?.formData?.lastMinimizedIncidentDialog ?? null;
  });

  // su co
  const {
    createMutation: createIncidentMutation,
    updateMutation: updateIncidentMutation,
    deleteMutation: deleteIncidentMutation,
  } = useMaintenanceIncidenMutation();

  const { data: incidentReports = [] } = useMaintenanceIncidentByPlanQuery(
    expandedIncidentPlanIds.values().next().value,
  );

  const {
    data: incidentPageData = { items: [], totalItems: 0 },
    isLoading: isLoadingIncidents,
  } = useMaintenanceIncidentPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    statusFilter !== "" ? Number(statusFilter) : undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 1,
  );

  const handleSaveIncident = async (selectedIncident: IncidenData) => {
    if (selectedIncident.id) {
      await updateIncidentMutation.mutateAsync(selectedIncident);
    } else {
      await createIncidentMutation.mutateAsync(selectedIncident);
    }
    setShowForm(false);
    setSelectedIncident(null);
  };

  const handleEditIncidentClick = (incident: any, e: React.MouseEvent) => {
    setSelectedIncident(incident);
    setShowIncidentDialog(true);
    e.stopPropagation();
  };

  const handleDeleteIncidentClick = (incident: any, e: React.MouseEvent) => {
    showConfirmAlert("Bạn có chắc chắn muốn xóa phiếu sự cố này?").then(
      (res) => {
        if (res?.isConfirmed) {
          deleteIncidentMutation.mutate(incident);
        }
      },
    );
    e.stopPropagation();
  };

  const allPlans = useMemo(() => {
    if (!groupedData?.data?.data) return [];
    return Object.values(groupedData.data.data).flat() as MaintenancePlanData[];
  }, [groupedData]);

  const toggleYear = (year: string) =>
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));

  const toggleIncidentExpand = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIncidentPlanIds((prev) => {
      if (prev.has(planId)) return new Set();
      return new Set([planId]);
    });
  };

  const handleToggleSelect = (planId: string) => {
    setSelectedIds((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId],
    );
  };

  const handleToggleSelectIncident = (incidentId: string) => {
    setSelectedIncidentIds((prev) =>
      prev.includes(incidentId)
        ? prev.filter((id) => id !== incidentId)
        : [...prev, incidentId],
    );
  };

  // ── Navigation handlers ───────────────────────────────────
  // Case 1 & 4: Click KH → hiển thị chi tiết KH, ẩn SC
  const handlePlanRowClick = (plan: MaintenancePlanData) => {
    setSelectedPlan(plan);
    setSelectedIncident(null);
    // Auto-expand incident sub-rows for this plan
    setExpandedIncidentPlanIds((prev) => {
      const next = new Set(prev);
      next.add(plan.id);
      return next;
    });
  };

  // Case 2: Click SC → hiển thị chi tiết SC
  const handleIncidentRowClick = (
    plan: MaintenancePlanData,
    incident: IncidenData,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setSelectedPlan(plan);
    setSelectedIncident(incident);
    setExpandedIncidentPlanIds((prev) => {
      const next = new Set(prev);
      next.add(plan.id);
      return next;
    });
  };

  // Case 3 & 5: Đóng panel → về danh sách
  const handleCloseAll = () => {
    setSelectedPlan(null);
    setSelectedIncident(null);
    setShowForm(false);
    setShowIncidentDialog(false);
    setSelectedIncidentIds([]);
    setSelectedIds([]);
    setExpandedIncidentPlanIds(new Set());
  };

  // ── Selection helpers ─────────────────────────────────────
  const selectedPlans = allPlans.filter((plan) =>
    selectedIds.includes(plan.id),
  );

  const canCreateIncident =
    selectedPlans.length === 1 && selectedPlans[0].trangThai === 3;

  const [showIncidentDialog, setShowIncidentDialog] = useState(false);

  const serverCounts = (activeTab === 0 ? groupedData?.data?.trangThaiCounts : incidentPageData?.trangThaiCounts) || {};
  const totalCount = Object.values(serverCounts).reduce(
    (a: any, b: any) => a + b,
    0,
  ) as number;

  const statusOptions: FilterOption[] = [
    { label: "Tất cả", value: "", count: totalCount, color: "primary" },
    {
      label: "Bản nháp",
      value: 0,
      count: serverCounts["0"] || 0,
      color: "default",
    },
    {
      label: "Chờ duyệt",
      value: 1,
      count: serverCounts["1"] || 0,
      color: "warning",
    },
    {
      label: "Từ chối",
      value: 2,
      count: serverCounts["2"] || 0,
      color: "error",
    },
    {
      label: "Đã duyệt",
      value: 3,
      count: serverCounts["3"] || 0,
      color: "success",
    },
  ];

  const isDetailOpen = !!selectedPlan || !!selectedIncident;

  const isCompactIncidentOpen = selectedPlan
    ? expandedIncidentPlanIds.has(selectedPlan.id)
    : false;

  const columnsFull = [
    { field: "id", headerName: "Mã kế hoạch", width: 140, editable: false },
    {
      field: "description",
      headerName: "Mô tả",
      flex: 1,
      minWidth: 200,
      editable: false,
    },
    {
      field: "sourceDepartmentId",
      headerName: "Đơn vị/Phân xưởng",
      width: 160,
      editable: false,
    },
    { field: "year", headerName: "Năm", width: 80, editable: false },
    {
      field: "createdDate",
      headerName: "Ngày tạo",
      width: 110,
      editable: false,
    },
    {
      field: "deviceIds",
      headerName: "Số TB",
      width: 80,
      editable: false,
      renderCell: (params: any) => params.row.deviceIds?.length ?? 0,
    },
    {
      field: "share",
      headerName: "Trình duyệt",
      width: 130,
      editable: false,
      renderCell: (params: any) =>
        showShareStatus(
          params.value ?? false,
          params.row?.nguoiTao === user?.taiKhoan?.tenDangNhap,
        ),
    },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 130,
      editable: false,
      renderCell: (params: any) => showStatus(params.value),
    },
    {
      field: "action",
      headerName: "Thao tác",
      width: 130,
      editable: false,
      renderCell: (params: any) => (
        <IconButton>
          <Edit />
        </IconButton>
      ),
    },
  ];

  const columnsCollapsed = [
    { field: "id", headerName: "Mã kế hoạch", flex: 1, editable: false },
    {
      field: "trangThai",
      headerName: "Trạng thái",
      width: 120,
      editable: false,
      renderCell: (params: any) => showStatus(params.value),
    },
  ];

  const incidentColumnsFull = [
    { field: "soPhieu", headerName: "Số phiếu", width: 140, editable: false },
    {
      field: "tenHeThongThietBi",
      headerName: "Hệ thống/ thiết bị sự cố",
      flex: 1,
      minWidth: 200,
      editable: false,
    },
    {
      field: "mucDo",
      headerName: "Mức độ nghiêm trọng",
      flex: 1,
      minWidth: 200,
      editable: false,
      renderCell: (params: any) => showServerity(params.value),
    },
    {
      field: "tenDonViBaoCao",
      headerName: "Đơn vị/Phân xưởng",
      width: 160,
      editable: false,
    },
    {
      field: "ngayPhatHien",
      headerName: "Ngày phát hiện",
      width: 130,
      editable: false,
    },
    {
      field: "trangThai",
      headerName: "Trạng thái",
      width: 130,
      editable: false,
      renderCell: (params: any) => showStatus(params.value),
    },
    {
      field: "thaoTac",
      headerName: "Thao tác",
      width: 130,
      editable: false,
      renderCell: (params: any) => {
        const incident = params.row;
        return (
          <>
            <IconButton
              disabled={incident.trangThai !== 0}
              onClick={(e) => handleEditIncidentClick(incident, e)}
            >
              <Edit
                color={incident.trangThai !== 0 ? "#afb6bdff" : "#1976d2"}
              />
            </IconButton>
            <IconButton
              disabled={incident.trangThai !== 0}
              onClick={(e) => handleDeleteIncidentClick(incident, e)}
            >
              <Trash2 color={incident.trangThai !== 0 ? "#afb6bdff" : "red"} />
            </IconButton>
          </>
        );
      },
    },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    handleCloseAll();
  };

  return (
    <>
      <PageAction
        title="Lập kế hoạch sửa chữa bảo dưỡng"
        onNewClick={() => setShowForm(true)}
        // extraActions={
        //   <Button
        //     size="small"
        //     variant="contained"
        //     color="error"
        //     onClick={() => setShowIncidentDialog(true)}
        //     sx={{
        //       borderRadius: "10px",
        //       fontWeight: 700,
        //       textTransform: "none",
        //       fontSize: "0.85rem",
        //       px: 2.5,
        //       py: 0.8,
        //       boxShadow: "0 4px 12px rgba(211, 47, 47, 0.2)",
        //     }}
        //   >
        //     Tạo phiếu báo sự cố
        //   </Button>
        // }
      />

      {/* <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={<b>Kế hoạch bảo dưỡng</b>} />
          <Tab label={<b>Phiếu báo sự cố</b>} />
        </Tabs>
      </Box> */}

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            height: "calc(100vh - 228px)",
            minHeight: 600,
            maxHeight: "80vh",
          }}
        >
          {/* ══ LEFT PANEL ══════════════════════════════════════ */}
          <Card
            elevation={0}
            sx={{
              flex: isDetailOpen ? "0 0 400px" : 1,
              transition: "flex 0.3s ease",
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent
              sx={{
                height: "100%",
                p: "0 !important",
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              {/* ── Filter thời gian ── */}
              <Filter
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                isCompact={isDetailOpen}
              />
              {activeTab === 0 && (
                <TableCustom
                  title="Danh sách kế hoạch"
                  rows={isDetailOpen ? allPlans : []}
                  columns={isDetailOpen ? columnsCollapsed : columnsFull}
                  total={allPlans?.length}
                  isCompact={isDetailOpen}
                  highlightedId={selectedPlan?.id}
                  onRowClick={(params) =>
                    handlePlanRowClick(params.row as MaintenancePlanData)
                  }
                  statusOptions={statusOptions}
                  statusValue={statusFilter}
                  onStatusChange={setStatusFilter}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  searchValue={searchValue}
                  setSearchValue={setSearchValue}
                  onDelete={() => {}}
                  showDelete={false}
                  setSelectedDepartment={setSelectedDepartment}
                  departments={allDepartment}
                  selectedDepartment={selectedDepartment}
                  isFilterDepartment={true}
                  customContent={
                    !isDetailOpen ? (
                      /* ── LIST MODE: accordion theo năm ── */
                      <Stack
                        spacing={2}
                        sx={{ py: 1, px: 1, flex: 1, overflow: "auto" }}
                      >
                        {allPlans?.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            Không có kế hoạch phù hợp.
                          </Typography>
                        ) : (
                          (
                            Object.entries(groupedData?.data?.data || {}) as [
                              string,
                              MaintenancePlanData[],
                            ][]
                          )
                            .sort((a, b) => Number(b[0]) - Number(a[0]))
                            .map(([year, plans]) => (
                              <Accordion
                                key={year}
                                expanded={!!expandedYears[year]}
                                onChange={() => toggleYear(year)}
                                disableGutters
                                sx={{
                                  mb: 1,
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 1,
                                }}
                              >
                                <AccordionSummary
                                  expandIcon={<ExpandMore />}
                                  sx={{
                                    bgcolor: "background.paper",
                                    minHeight: 56,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 2,
                                      alignItems: "center",
                                      width: "100%",
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      fontWeight={700}
                                    >
                                      {year}
                                    </Typography>
                                    <Chip
                                      label={`${plans.length} kế hoạch`}
                                      size="small"
                                    />
                                    <Typography
                                      color="text.secondary"
                                      sx={{ flexGrow: 1 }}
                                    >
                                      Tổng TB:{" "}
                                      {plans.reduce(
                                        (sum, p) =>
                                          sum + (p.danhSachTaiSan?.length ?? 0),
                                        0,
                                      )}
                                    </Typography>
                                  </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 0 }}>
                                  <TableContainer
                                    component={Paper}
                                    variant="outlined"
                                  >
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow
                                          sx={{
                                            bgcolor:
                                              currentBrandConfig.primaryColor,
                                          }}
                                        >
                                          <TableCell
                                            padding="checkbox"
                                            sx={{ color: "#fff", width: 40 }}
                                          />
                                          <TableCell
                                            padding="checkbox"
                                            sx={{ color: "#fff" }}
                                          />
                                          <TableCell
                                            sx={{
                                              fontWeight: 700,
                                              color: "#fff",
                                            }}
                                          >
                                            Mã kế hoạch
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              fontWeight: 700,
                                              color: "#fff",
                                            }}
                                          >
                                            Mô tả
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              fontWeight: 700,
                                              color: "#fff",
                                            }}
                                          >
                                            Đơn vị/Phân xưởng
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              fontWeight: 700,
                                              color: "#fff",
                                            }}
                                          >
                                            Năm
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              fontWeight: 700,
                                              color: "#fff",
                                            }}
                                          >
                                            Ngày tạo
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              fontWeight: 700,
                                              color: "#fff",
                                            }}
                                            align="right"
                                          >
                                            Số TB
                                          </TableCell>
                                          {/* <TableCell
                                            sx={{
                                              fontWeight: 700,
                                              color: "#fff",
                                            }}
                                          >
                                            Sự cố
                                          </TableCell> */}
                                          <TableCell
                                            sx={{
                                              fontWeight: 700,
                                              color: "#fff",
                                            }}
                                          >
                                            Trình duyệt
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              fontWeight: 700,
                                              color: "#fff",
                                            }}
                                          >
                                            Trạng thái
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              fontWeight: 700,
                                              color: "#fff",
                                            }}
                                          >
                                            Thao tác
                                          </TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {plans.map(
                                          (plan: MaintenancePlanData) => {
                                            const isIncidentOpen =
                                              expandedIncidentPlanIds.has(
                                                plan.id,
                                              );
                                            const isPlanSelected =
                                              (
                                                selectedPlan as MaintenancePlanData | null
                                              )?.id === plan.id;

                                            return (
                                              <React.Fragment key={plan.id}>
                                                <TableRow
                                                  hover
                                                  selected={isPlanSelected}
                                                  sx={{
                                                    cursor: "pointer",
                                                    bgcolor: isPlanSelected
                                                      ? "rgba(249,168,37,0.15) !important"
                                                      : undefined,
                                                    "&:hover": {
                                                      bgcolor:
                                                        "rgba(14, 238, 6, 0.08) !important",
                                                    },
                                                  }}
                                                  onClick={() =>
                                                    handlePlanRowClick(plan)
                                                  }
                                                >
                                                  <TableCell
                                                    padding="checkbox"
                                                    sx={{ width: 40 }}
                                                  >
                                                    {/* {(plan?.soLuongSuCo ?? 0) >
                                                      0 && (
                                                      <Tooltip
                                                        title={
                                                          isIncidentOpen
                                                            ? "Ẩn sự cố"
                                                            : `${plan?.soLuongSuCo} sự cố`
                                                        }
                                                      >
                                                        <IconButton size="small">
                                                          {isIncidentOpen ? (
                                                            <KeyboardArrowUpIcon fontSize="small" />
                                                          ) : (
                                                            <KeyboardArrowDownIcon fontSize="small" />
                                                          )}
                                                        </IconButton>
                                                      </Tooltip>
                                                    )} */}
                                                  </TableCell>
                                                  <TableCell
                                                    padding="checkbox"
                                                    onClick={(e) =>
                                                      e.stopPropagation()
                                                    }
                                                  >
                                                    <Checkbox
                                                      size="small"
                                                      checked={selectedIds.includes(
                                                        plan.id,
                                                      )}
                                                      onChange={() =>
                                                        handleToggleSelect(
                                                          plan.id,
                                                        )
                                                      }
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    {plan.id}
                                                  </TableCell>
                                                  <TableCell>
                                                    {plan.tenKeHoach}
                                                  </TableCell>
                                                  <TableCell>
                                                    {plan.tenDonViGiao ?? "—"}
                                                  </TableCell>
                                                  <TableCell>
                                                    {plan.nam}
                                                  </TableCell>
                                                  <TableCell>
                                                    {plan.ngayTao}
                                                  </TableCell>
                                                  <TableCell align="right">
                                                    {plan.danhSachTaiSan
                                                      ?.length ?? 0}
                                                  </TableCell>
                                                  {/* <TableCell>
                                                    {(plan?.soLuongSuCo ?? 0) >
                                                    0 ? (
                                                      <Chip
                                                        icon={
                                                          <WarningAmberIcon
                                                            sx={{
                                                              fontSize: 14,
                                                            }}
                                                          />
                                                        }
                                                        label={
                                                          plan?.soLuongSuCo
                                                        }
                                                        size="small"
                                                        color="warning"
                                                        variant="outlined"
                                                      />
                                                    ) : (
                                                      <Typography
                                                        variant="caption"
                                                        color="text.disabled"
                                                      >
                                                        —
                                                      </Typography>
                                                    )}
                                                  </TableCell> */}
                                                  <TableCell>
                                                    {showShareStatus(
                                                      plan.share ?? false,
                                                      plan.ngayTao ===
                                                        user?.taiKhoan
                                                          ?.tenDangNhap,
                                                    )}
                                                  </TableCell>
                                                  <TableCell>
                                                    {showStatus(plan.trangThai)}
                                                  </TableCell>
                                                  <TableCell
                                                    sx={{
                                                      display: "flex",
                                                      gap: 1,
                                                    }}
                                                  >
                                                    <IconButton
                                                      disabled={
                                                        plan.trangThai !== 0
                                                      }
                                                      onClick={(e) => {
                                                        // handleEdit(plan);
                                                        setSelectedPlan(plan);
                                                        setShowForm(true);
                                                        e.stopPropagation();
                                                      }}
                                                    >
                                                      <Edit
                                                        color={
                                                          plan.trangThai !== 0
                                                            ? "#afb6bdff"
                                                            : "#1976d2"
                                                        }
                                                      />
                                                    </IconButton>
                                                    <IconButton
                                                      disabled={
                                                        plan.trangThai !== 0
                                                      }
                                                      onClick={(e) => {
                                                        showConfirmAlert(
                                                          "Bạn có chắc chắn muốn xóa kế hoạch này?",
                                                        ).then((res) => {
                                                          if (
                                                            res?.isConfirmed
                                                          ) {
                                                            deleteMutation.mutate(
                                                              plan,
                                                            );
                                                          }
                                                        });
                                                        e.stopPropagation();
                                                      }}
                                                    >
                                                      <Trash2
                                                        color={
                                                          plan.trangThai !== 0
                                                            ? "#afb6bdff"
                                                            : "red"
                                                        }
                                                      />
                                                    </IconButton>
                                                  </TableCell>
                                                </TableRow>

                                                {/* Incident sub-rows */}
                                                {false && (plan?.soLuongSuCo ?? 0) >
                                                  0 && (
                                                  <TableRow>
                                                    <TableCell
                                                      colSpan={13}
                                                      sx={{ p: 0, border: 0 }}
                                                    >
                                                      <Collapse
                                                        in={isIncidentOpen}
                                                        timeout="auto"
                                                        unmountOnExit
                                                      >
                                                        <Box
                                                          sx={{
                                                            bgcolor: "#fffde7",
                                                            borderBottom:
                                                              "1px solid",
                                                            borderColor:
                                                              "divider",
                                                          }}
                                                        >
                                                          <Table size="small">
                                                            <TableHead>
                                                              <TableRow
                                                                sx={{
                                                                  bgcolor:
                                                                    "#f9a825",
                                                                }}
                                                              >
                                                                <TableCell padding="checkbox">
                                                                  <Checkbox
                                                                    size="small"
                                                                    indeterminate={
                                                                      selectedIncidentIds.length >
                                                                        0 &&
                                                                      selectedIncidentIds.length <
                                                                        incidentReports.length
                                                                    }
                                                                    checked={
                                                                      incidentReports.length >
                                                                        0 &&
                                                                      selectedIncidentIds.length ===
                                                                        incidentReports.length
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) => {
                                                                      const currentIds =
                                                                        incidentReports.map(
                                                                          (
                                                                            i: IncidenData,
                                                                          ) =>
                                                                            i.id,
                                                                        );
                                                                      if (
                                                                        e.target
                                                                          .checked
                                                                      ) {
                                                                        setSelectedIncidentIds(
                                                                          (
                                                                            prev,
                                                                          ) =>
                                                                            Array.from(
                                                                              new Set(
                                                                                [
                                                                                  ...prev,
                                                                                  ...currentIds,
                                                                                ],
                                                                              ),
                                                                            ),
                                                                        );
                                                                      } else {
                                                                        setSelectedIncidentIds(
                                                                          (
                                                                            prev,
                                                                          ) =>
                                                                            prev.filter(
                                                                              (
                                                                                id,
                                                                              ) =>
                                                                                !currentIds.includes(
                                                                                  id,
                                                                                ),
                                                                            ),
                                                                        );
                                                                      }
                                                                    }}
                                                                    sx={{
                                                                      color:
                                                                        "#fff",
                                                                      "&.Mui-checked":
                                                                        {
                                                                          color:
                                                                            "#fff",
                                                                        },
                                                                      "&.MuiCheckbox-indeterminate":
                                                                        {
                                                                          color:
                                                                            "#fff",
                                                                        },
                                                                    }}
                                                                  />
                                                                </TableCell>
                                                                <TableCell
                                                                  sx={{
                                                                    pl: 6,
                                                                    fontWeight: 700,
                                                                    color:
                                                                      "#fff",
                                                                    fontSize: 12,
                                                                  }}
                                                                >
                                                                  Số phiếu
                                                                </TableCell>
                                                                <TableCell
                                                                  sx={{
                                                                    fontWeight: 700,
                                                                    color:
                                                                      "#fff",
                                                                    fontSize: 12,
                                                                  }}
                                                                >
                                                                  Ngày phát hiện
                                                                </TableCell>
                                                                <TableCell
                                                                  sx={{
                                                                    fontWeight: 700,
                                                                    color:
                                                                      "#fff",
                                                                    fontSize: 12,
                                                                  }}
                                                                >
                                                                  Hệ thống
                                                                </TableCell>
                                                                <TableCell
                                                                  sx={{
                                                                    fontWeight: 700,
                                                                    color:
                                                                      "#fff",
                                                                    fontSize: 12,
                                                                  }}
                                                                >
                                                                  Mức độ
                                                                </TableCell>
                                                                <TableCell
                                                                  sx={{
                                                                    fontWeight: 700,
                                                                    color:
                                                                      "#fff",
                                                                    fontSize: 12,
                                                                  }}
                                                                >
                                                                  Trình duyệt
                                                                </TableCell>
                                                                <TableCell
                                                                  sx={{
                                                                    fontWeight: 700,
                                                                    color:
                                                                      "#fff",
                                                                    fontSize: 12,
                                                                  }}
                                                                >
                                                                  Trạng thái
                                                                </TableCell>
                                                                <TableCell
                                                                  sx={{
                                                                    fontWeight: 700,
                                                                    color:
                                                                      "#fff",
                                                                    fontSize: 12,
                                                                  }}
                                                                >
                                                                  Thao tác
                                                                </TableCell>
                                                              </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                              {incidentReports.map(
                                                                (
                                                                  incident: any,
                                                                ) => {
                                                                  const isIncidentSelected =
                                                                    (
                                                                      selectedIncident as IncidenData | null
                                                                    )?.id ===
                                                                    incident.id;
                                                                  return (
                                                                    <TableRow
                                                                      key={
                                                                        incident.id
                                                                      }
                                                                      hover
                                                                      selected={
                                                                        isIncidentSelected
                                                                      }
                                                                      sx={{
                                                                        cursor:
                                                                          "pointer",
                                                                        bgcolor:
                                                                          isIncidentSelected
                                                                            ? "rgba(249,168,37,0.15)"
                                                                            : undefined,
                                                                        "&:hover":
                                                                          {
                                                                            bgcolor:
                                                                              "rgba(249,168,37,0.08)",
                                                                          },
                                                                      }}
                                                                      onClick={(
                                                                        e,
                                                                      ) =>
                                                                        handleIncidentRowClick(
                                                                          plan,
                                                                          incident,
                                                                          e,
                                                                        )
                                                                      }
                                                                    >
                                                                      <TableCell
                                                                        padding="checkbox"
                                                                        onClick={(
                                                                          e,
                                                                        ) =>
                                                                          e.stopPropagation()
                                                                        }
                                                                      >
                                                                        <Checkbox
                                                                          size="small"
                                                                          checked={selectedIncidentIds.includes(
                                                                            incident.id,
                                                                          )}
                                                                          onChange={() =>
                                                                            handleToggleSelectIncident(
                                                                              incident.id,
                                                                            )
                                                                          }
                                                                        />
                                                                      </TableCell>
                                                                      <TableCell
                                                                        sx={{
                                                                          pl: 6,
                                                                        }}
                                                                      >
                                                                        <Box
                                                                          sx={{
                                                                            display:
                                                                              "flex",
                                                                            alignItems:
                                                                              "center",
                                                                            gap: 0.5,
                                                                          }}
                                                                        >
                                                                          <WarningAmberIcon
                                                                            sx={{
                                                                              fontSize: 14,
                                                                              color:
                                                                                "#f9a825",
                                                                            }}
                                                                          />
                                                                          <Typography
                                                                            variant="body2"
                                                                            fontWeight={
                                                                              500
                                                                            }
                                                                          >
                                                                            {incident.soPhieu ||
                                                                              incident.number}
                                                                          </Typography>
                                                                        </Box>
                                                                      </TableCell>
                                                                      <TableCell>
                                                                        <Typography variant="body2">
                                                                          {incident.ngayPhatHien ||
                                                                            incident.detectedAt}
                                                                        </Typography>
                                                                      </TableCell>
                                                                      <TableCell>
                                                                        <Typography variant="body2">
                                                                          {incident.tenHeThongThietBi ||
                                                                            incident.systemName}
                                                                        </Typography>
                                                                      </TableCell>
                                                                      <TableCell>
                                                                        {incident.mucDo !==
                                                                          undefined ||
                                                                        incident.severity
                                                                          ? showServerity(
                                                                              incident.mucDo,
                                                                            )
                                                                          : "—"}
                                                                      </TableCell>
                                                                      <TableCell>
                                                                        {showShareStatus(
                                                                          incident.share ??
                                                                            false,
                                                                          incident.ngayTao ===
                                                                            user
                                                                              ?.taiKhoan
                                                                              ?.tenDangNhap,
                                                                        )}
                                                                      </TableCell>
                                                                      <TableCell>
                                                                        {showStatus(
                                                                          incident.trangThai,
                                                                        )}
                                                                      </TableCell>
                                                                      <TableCell>
                                                                        <IconButton
                                                                          disabled={
                                                                            incident.trangThai !==
                                                                            0
                                                                          }
                                                                          onClick={(
                                                                            e,
                                                                          ) =>
                                                                            handleEditIncidentClick(
                                                                              incident,
                                                                              e,
                                                                            )
                                                                          }
                                                                        >
                                                                          <Edit
                                                                            color={
                                                                              incident.trangThai !==
                                                                              0
                                                                                ? "#afb6bdff"
                                                                                : "#1976d2"
                                                                            }
                                                                          />
                                                                        </IconButton>
                                                                        <IconButton
                                                                          disabled={
                                                                            incident.trangThai !==
                                                                            0
                                                                          }
                                                                          onClick={(
                                                                            e,
                                                                          ) =>
                                                                            handleDeleteIncidentClick(
                                                                              incident,
                                                                              e,
                                                                            )
                                                                          }
                                                                        >
                                                                          <Trash2
                                                                            color={
                                                                              incident.trangThai !==
                                                                              0
                                                                                ? "#afb6bdff"
                                                                                : "red"
                                                                            }
                                                                          />
                                                                        </IconButton>
                                                                      </TableCell>
                                                                    </TableRow>
                                                                  );
                                                                },
                                                              )}
                                                            </TableBody>
                                                          </Table>
                                                        </Box>
                                                      </Collapse>
                                                    </TableCell>
                                                  </TableRow>
                                                )}
                                              </React.Fragment>
                                            );
                                          },
                                        )}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </AccordionDetails>
                              </Accordion>
                            ))
                        )}
                      </Stack>
                    ) : undefined
                  }
                />
              )}
              {activeTab === 1 && (
                <TableCustom
                  title="Danh sách sự cố"
                  rows={incidentPageData?.items.map(IncidentAdapter) || []}
                  columns={incidentColumnsFull}
                  total={incidentPageData?.totalItems}
                  onPaginationModelChange={setPaginationModel}
                  paginationModel={paginationModel}
                  isCompact={isDetailOpen}
                  highlightedId={selectedIncident?.id}
                  onRowClick={(params) => {
                    setSelectedIncident(params.row as IncidenData);
                    setSelectedPlan(null);
                  }}
                  statusOptions={statusOptions}
                  statusValue={statusFilter}
                  onStatusChange={setStatusFilter}
                  selectedIds={selectedIncidentIds}
                  onSelectionChange={setSelectedIncidentIds}
                  searchValue={searchValue}
                  setSearchValue={setSearchValue}
                  onDelete={() => {}}
                  showDelete={false}
                  setSelectedDepartment={setSelectedDepartment}
                  departments={allDepartment}
                  selectedDepartment={selectedDepartment}
                  isFilterDepartment={false}
                />
              )}

              {/* ── COMPACT MODE: incident sub-section bên dưới danh sách thu nhỏ ──
                  Chỉ hiện khi đang xem chi tiết KH/SC và plan đó có sự cố.
                  Cho phép người dùng click vào KH (row trên) hoặc SC bất kỳ bên dưới. ── */}
              {/* {false && isDetailOpen &&
                selectedPlan &&
                (selectedPlan.soLuongSuCo ?? 0) > 0 && (
                  <Box
                    sx={{
                      borderTop: "2px solid",
                      borderColor: "divider",
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        px: 1.5,
                        py: 0.75,
                        bgcolor: "#fffde7",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#fff9c4" },
                        userSelect: "none",
                      }}
                      onClick={(e) => toggleIncidentExpand(selectedPlan.id, e)}
                    >
                      <WarningAmberIcon
                        sx={{ fontSize: 15, color: "#f9a825", mr: 0.75 }}
                      />
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{ flex: 1, color: "#795548" }}
                      >
                        {selectedPlan.soLuongSuCo ?? 0} sự cố —{" "}
                        {selectedPlan.id}
                      </Typography>
                      <IconButton
                        size="small"
                        sx={{ p: 0.25 }}
                        onClick={(e) =>
                          toggleIncidentExpand(selectedPlan.id, e)
                        }
                      >
                        {isCompactIncidentOpen ? (
                          <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                        )}
                      </IconButton>
                    </Box>

                    <Collapse
                      in={isCompactIncidentOpen}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box sx={{ bgcolor: "#fffde7" }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: "#f9a825" }}>
                              <TableCell
                                sx={{
                                  pl: 2,
                                  fontWeight: 700,
                                  color: "#fff",
                                  fontSize: 12,
                                }}
                              >
                                Số phiếu
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 700,
                                  color: "#fff",
                                  fontSize: 12,
                                }}
                              >
                                Trạng thái
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {incidentReports?.map((incident: IncidenData) => {
                              const isIncidentSelected =
                                selectedIncident?.id === incident.id;
                              return (
                                <TableRow
                                  key={incident.id}
                                  hover
                                  selected={isIncidentSelected}
                                  sx={{
                                    cursor: "pointer",
                                    bgcolor: isIncidentSelected
                                      ? "rgba(249,168,37,0.15)"
                                      : undefined,
                                    "&:hover": {
                                      bgcolor: "rgba(249,168,37,0.08)",
                                    },
                                  }}
                                  onClick={(e) =>
                                    handleIncidentRowClick(
                                      selectedPlan,
                                      incident,
                                      e,
                                    )
                                  }
                                >
                                  <TableCell sx={{ pl: 2 }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                      }}
                                    >
                                      <WarningAmberIcon
                                        sx={{ fontSize: 13, color: "#f9a825" }}
                                      />
                                      <Typography
                                        variant="body2"
                                        fontWeight={
                                          isIncidentSelected ? 700 : 400
                                        }
                                      >
                                        {incident.soPhieu}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    {showStatus(incident.trangThai)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </Box>
                )} */}
            </CardContent>
          </Card>

          {/* ══ RIGHT PANEL ═════════════════════════════════════ */}
          {isDetailOpen && (selectedPlan || selectedIncident) && (
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 2,
                overflow: "auto",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "background.paper",
              }}
            >
              {selectedIncident ? (
                <IncidentDetailPanel
                  incident={selectedIncident}
                  plan={selectedPlan}
                  onClose={handleCloseAll}
                />
              ) : selectedPlan ? (
                <PlanDetailPanel plan={selectedPlan} onClose={handleCloseAll} />
              ) : null}
            </Paper>
          )}
        </Box>
      </Box>

      <CreatePlanDialog
        open={showForm}
        initialData={selectedPlan}
        onClose={() => {
          setShowForm(false);
          setSelectedPlan(null);
        }}
        onSave={async (plan, isEdit) => {
          if (isEdit) {
            await updateMutation.mutateAsync(plan);
          } else {
            await createMutation.mutateAsync(plan);
          }
          setShowForm(false);
          setSelectedPlan(null);
        }}
      />
      <IncidentDialog
        open={showIncidentDialog}
        onClose={handleCloseAll}
        selectedPlans={selectedPlans}
        initialIncident={selectedIncident}
        onSubmit={handleSaveIncident}
        nhomTaiSan={undefined}
      />

      {(lastMinimizedDialog === "plan" ||
        lastMinimizedIncidentDialog === "incident") && (
        <DraftIndicator
          onClick={() => {
            if (lastMinimizedIncidentDialog === "incident") {
              setShowIncidentDialog(true);
            } else {
              setShowForm(true);
            }
          }}
        />
      )}
    </>
  );
}
