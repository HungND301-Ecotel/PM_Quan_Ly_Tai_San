import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Grid,
  Stack,
  useTheme,
  Pagination,
  TextField,
} from "@mui/material";
import {
  BuildOutlined,
  DescriptionOutlined,
  FactCheckOutlined,
  InventoryOutlined,
  AssignmentTurnedInOutlined,
  CheckCircle,
  PendingOutlined,
  CloseOutlined,
  PrecisionManufacturingOutlined,
  RadioButtonUnchecked,
  WarningOutlined,
  SearchOutlined,
  ChevronRight,
  TuneOutlined,
  InfoOutlined,
  AvTimerOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";

import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  useMaintenancePlanningPageQuery,
  useMaintenanceRepairPageQuery,
  useMaintenanceInspectionPageQuery,
  useMaintenanceMaterialAssessmentPageQuery,
  useAcceptancePageQuery,
  useMaintenanceIncidentPageQuery,
  useMaintenanceIncidentInspectionPageQuery,
  useDeviceActivityHistoryQuery,
  useGetTaiSanByIdQuery,
  useMaterialRequisitionPageQuery,
} from "./mutation";
import { useMaintenanceTechnicalReportPageQuery } from "./mutation/TechnicalReport";
import { useMaintenanceJobAssignmentPageQuery } from "./mutation/JobAssignment";
import {
  PlanAdapter,
  RepairAdapter,
  InspectionAdapter,
  MaterialAssessmentAdapter,
  AcceptanceTestAdapter,
  IncidentAdapter,
  IncidentInspectionAdapter,
  TechnicalReportAdapter,
  JobAssignmentAdapter,
  MaterialRequisitionAdapter,
} from "./Adapter";
import { useAllDepartmentsQuery } from "../Department/Mutation";
import FieldAutoCompleted from "../../components/TextField/FieldAutoCompleted";
import { findById } from "../../utils/helpers";
import PageAction from "../../components/common/PageAction";
import { showStatus } from "./config";
import { useAllAssetsByDepartmentQuery } from "../AssetManager/Mutation";
import { currentBrandConfig } from "../../config/brandConfig";

// ── Summary Card ──────────────────────────────────────────────
const SummaryCard = ({
  icon,
  title,
  main,
  mainLabel,
  sub,
  subLabel,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  main: number;
  mainLabel: string;
  sub: number;
  subLabel: string;
  color: string;
}) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: "16px",
      p: 2.5,
      flex: 1,
      minWidth: 170,
      display: "flex",
      flexDirection: "column",
      gap: 2,
      bgcolor: "background.paper",
      border: "1px solid",
      borderColor: "grey.100",
      boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.06)",
      transition: "all 0.18s ease",
      position: "relative",
      overflow: "hidden",
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: "0 3px 12px 0 rgba(0, 0, 0, 0.06)",
        borderColor: `${color}40`,
        "& .card-icon-container": {
          bgcolor: color,
          color: "#fff",
          transform: "scale(1.1)",
        },
      },
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "4px",
        background: `linear-gradient(90deg, ${color}, ${color}80)`,
      },
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        sx={{ textTransform: "uppercase", letterSpacing: 1.2 }}
      >
        {title}
      </Typography>
      <Avatar
        className="card-icon-container"
        sx={{
          bgcolor: `${color}12`,
          color: color,
          width: 40,
          height: 40,
          transition: "all 0.3s ease",
        }}
      >
        {icon}
      </Avatar>
    </Box>

    <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ color: "grey.900", lineHeight: 1.1 }}
        >
          {main}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {mainLabel}
        </Typography>
      </Box>

      {sub > 0 ? (
        <Box
          sx={{
            bgcolor: "warning.lighter",
            color: "warning.dark",
            px: 1.5,
            py: 0.75,
            borderRadius: "10px",
            border: "1px solid",
            borderColor: "warning.light",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 60,
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} lineHeight={1.2}>
            {sub}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.68rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {subLabel}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: "grey.50",
            color: "grey.400",
            px: 1.5,
            py: 0.75,
            borderRadius: "10px",
            border: "1px solid",
            borderColor: "grey.200",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 60,
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} lineHeight={1.2}>
            0
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.68rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {subLabel}
          </Typography>
        </Box>
      )}
    </Box>
  </Paper>
);

// ── Quy Trinh Step ────────────────────────────────────────────
const QuyTrinhStep = ({
  step,
  title,
  icon,
  color,
  items,
  totalItems,
  onXemTatCa,
}: {
  step: number;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: { ma: string; trang: number }[];
  totalItems: number;
  onXemTatCa: () => void;
}) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: "16px",
      p: 2,
      flex: 1,
      minWidth: 220,
      bgcolor: "background.paper",
      border: "1px solid",
      borderColor: "grey.100",
      boxShadow: "0 4px 20px 0 rgba(0, 0, 0, 0.02)",
      display: "flex",
      flexDirection: "column",
      gap: 1,
      minHeight: 150,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 10px 24px 0 rgba(0, 0, 0, 0.05)",
        borderColor: `${color}40`,
        "& .step-badge": {
          bgcolor: color,
          color: "#fff",
          transform: "scale(1.05)",
        },
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box
        className="step-badge"
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          bgcolor: `${color}12`,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "0.88rem",
          transition: "all 0.3s ease",
          border: `1px solid ${color}30`,
          flexShrink: 0,
        }}
      >
        {step}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          flex: 1,
          overflow: "hidden",
        }}
      >
        <Box sx={{ color, display: "flex", alignItems: "center" }}>{icon}</Box>
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{
            color: "grey.800",
            fontSize: "0.78rem",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>

    <Divider sx={{ borderStyle: "dashed" }} />

    <Stack spacing={1} sx={{ flexGrow: 1 }}>
      {items.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
            py: 1,
          }}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontStyle: "italic" }}
          >
            Trống
          </Typography>
        </Box>
      ) : (
        items.slice(0, 1).map((item) => {
          return (
            <Box
              key={item.ma}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "grey.50",
                p: 0.75,
                borderRadius: "8px",
                border: "1px solid",
                borderColor: "grey.100",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "grey.700",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                }}
              >
                {item.ma}
              </Typography>
              {showStatus(item.trang)}
            </Box>
          );
        })
      )}
    </Stack>

    <Box
      sx={{ mt: "auto", pt: 1, display: "flex", justifyContent: "flex-end" }}
    >
      <Button
        onClick={onXemTatCa}
        size="small"
        variant="text"
        sx={{
          color: color,
          fontSize: "0.72rem",
          fontWeight: 700,
          p: 0,
          minWidth: 0,
          "&:hover": {
            bgcolor: "transparent",
            textDecoration: "underline",
          },
        }}
      >
        Xem tất cả ({totalItems})
      </Button>
    </Box>
  </Paper>
);

// ── Tien Do Item ──────────────────────────────────────────────
const TienDoItem = ({
  label,
  ma,
  trang,
  isLast = false,
}: {
  label: string;
  ma: string;
  trang: "done" | "pending" | "wait";
  isLast?: boolean;
}) => {
  const iconProps = {
    done: {
      icon: <CheckCircle sx={{ fontSize: 18, color: "#10b981" }} />,
      color: "#10b981",
    },
    pending: {
      icon: <PendingOutlined sx={{ fontSize: 18, color: "#f59e0b" }} />,
      color: "#f59e0b",
    },
    wait: {
      icon: <RadioButtonUnchecked sx={{ fontSize: 18, color: "#94a3b8" }} />,
      color: "#94a3b8",
    },
  }[trang];

  return (
    <Box sx={{ display: "flex", gap: 1.5, position: "relative" }}>
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: 8.5,
            top: 20,
            bottom: -8,
            width: 1,
            bgcolor: "grey.200",
            zIndex: 0,
          }}
        />
      )}
      <Box
        sx={{ zIndex: 1, display: "flex", alignItems: "center", height: 20 }}
      >
        {iconProps.icon}
      </Box>
      <Box sx={{ pb: isLast ? 0 : 2 }}>
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ color: "grey.800", display: "block" }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: "0.7rem", fontFamily: "monospace" }}
        >
          {ma}
        </Typography>
      </Box>
    </Box>
  );
};

// ── Modal Xem Tất Cả ──────────────────────────────────────────
const ModalXemTatCa = ({
  open,
  onClose,
  title,
  items,
  page,
  totalPages,
  onPageChange,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: { ma: string; trang: number }[];
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: "16px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      },
    }}
  >
    <DialogTitle
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontWeight: 700,
        px: 3,
        py: 2.5,
      }}
    >
      {title}
      <IconButton size="small" onClick={onClose} sx={{ color: "grey.500" }}>
        <CloseOutlined fontSize="small" />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers sx={{ px: 3, py: 2 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50", py: 1.5 }}>
                STT
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50", py: 1.5 }}>
                Mã phiếu
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50", py: 1.5 }}>
                Trạng thái
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, i) => {
              return (
                <TableRow
                  key={item.ma}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell sx={{ py: 1.5 }}>{i + 1}</TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      py: 1.5,
                      color: "grey.800",
                    }}
                  >
                    {item.ma}
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    {showStatus(item.trang)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, v) => onPageChange(v - 1)}
            color="primary"
          />
        </Box>
      )}
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button
        onClick={onClose}
        variant="outlined"
        size="small"
        sx={{
          borderRadius: "8px",
          color: "grey.600",
          borderColor: "grey.300",
          px: 2.5,
          textTransform: "none",
          fontWeight: 700,
          "&:hover": {
            bgcolor: "grey.50",
            borderColor: "grey.400",
          },
        }}
      >
        Đóng
      </Button>
    </DialogActions>
  </Dialog>
);

// ── Main Component ────────────────────────────────────────────
export default function MaintenanceStatPage() {
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.user);

  const [donVi, setDonVi] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    type: string;
  }>({
    open: false,
    title: "",
    type: "",
  });

  const [pageModels, setPageModels] = useState({
    plan: 0,
    technicalReport: 0,
    inspection: 0,
    repair: 0,
    jobAssignment: 0,
    materialRequisition: 0,
    acceptance: 0,
    materialAssessment: 0,
  });

  const { data: departments = [] } = useAllDepartmentsQuery();
  const { data: assets = [] } = useAllAssetsByDepartmentQuery(donVi);

  const { data: taiSanDetail = {} } = useGetTaiSanByIdQuery(
    selectedId,
    dateFrom,
    dateTo,
  );

  const openModal = (title: string, type: string) =>
    setModal({ open: true, title, type });

  // ── Queries ──
  // 1. Kế hoạch
  const {
    data: planPaged = { items: [], totalItems: 0, trangThaiCounts: {} },
  } = useMaintenancePlanningPageQuery(
    pageModels.plan,
    10,
    "",
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom || undefined,
    dateTo || undefined,
    selectedId || undefined,
    true,
  );

  // 2. Báo cáo kỹ thuật
  const {
    data: technicalReportPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
  } = useMaintenanceTechnicalReportPageQuery(
    pageModels.technicalReport,
    10,
    "",
    undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom || undefined,
    dateTo || undefined,
    selectedId || undefined,
    true,
  );

  // 3. Giám định
  const {
    data: inspectionPaged = { items: [], totalItems: 0, trangThaiCounts: {} },
  } = useMaintenanceInspectionPageQuery(
    pageModels.inspection,
    10,
    "",
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom || undefined,
    dateTo || undefined,
    selectedId || undefined,
  );

  // 4. Lệnh sửa chữa
  const {
    data: repairPaged = { items: [], totalItems: 0, trangThaiCounts: {} },
  } = useMaintenanceRepairPageQuery(
    pageModels.repair,
    10,
    "",
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom || undefined,
    dateTo || undefined,
    selectedId || undefined,
  );

  // 5. Phiếu giao việc
  const {
    data: jobAssignmentPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
  } = useMaintenanceJobAssignmentPageQuery(
    pageModels.jobAssignment,
    10,
    "",
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom || undefined,
    dateTo || undefined,
    selectedId || undefined,
  );

  // 6. Phiếu lĩnh vật tư
  const {
    data: materialRequisitionPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
  } = useMaterialRequisitionPageQuery(
    pageModels.materialRequisition,
    10,
    "",
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom || undefined,
    dateTo || undefined,
    selectedId || undefined,
  );

  // 7. Nghiệm thu
  const {
    data: acceptancePaged = { items: [], totalItems: 0, trangThaiCounts: {} },
  } = useAcceptancePageQuery(
    pageModels.acceptance,
    10,
    "",
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom || undefined,
    dateTo || undefined,
    selectedId || undefined,
  );

  // 8. Đánh giá vật tư
  const {
    data: materialAssessmentPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
  } = useMaintenanceMaterialAssessmentPageQuery(
    pageModels.materialAssessment,
    10,
    "",
    undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom || undefined,
    dateTo || undefined,
    selectedId || undefined,
  );

  const planItems = planPaged.items
    .map(PlanAdapter)
    .map((item: any) => ({
      ma: item.planId || item.id,
      trang: item.trangThai,
    }));
  const technicalReportItems = technicalReportPaged.items
    .map(TechnicalReportAdapter)
    .map((item: any) => ({
      ma: item.idBaoCaoKyThuat || item.id,
      trang: item.trangThai,
    }));
  const inspectionItems = inspectionPaged.items
    .map(InspectionAdapter)
    .map((item: any) => ({
      ma: item.idGiamDinhMayMoc || item.id,
      trang: item.trangThai,
    }));
  const repairItems = repairPaged.items
    .map(RepairAdapter)
    .map((item: any) => ({
      ma: item.idSuaChua || item.id,
      trang: item.trangThai,
    }));
  const jobAssignmentItems = jobAssignmentPaged.items
    .map(JobAssignmentAdapter)
    .map((item: any) => ({
      ma: item.idPhieuGiaoViec || item.id,
      trang: item.trangThai,
    }));
  const materialRequisitionItems = materialRequisitionPaged.items
    .map(MaterialRequisitionAdapter)
    .map((item: any) => ({
      ma: item.idBienBan || item.id,
      trang: item.trangThai,
    }));
  const acceptanceItems = acceptancePaged.items
    .map(AcceptanceTestAdapter)
    .map((item: any) => ({
      ma: item.idNghiemThu || item.id,
      trang: item.trangThai,
    }));
  const materialAssessmentItems = materialAssessmentPaged.items
    .map(MaterialAssessmentAdapter)
    .map((item: any) => ({
      ma: item.idDanhGia || item.id,
      trang: item.trangThai,
    }));

  const quyTrinhSteps = [
    {
      step: 1,
      title: "KẾ HOẠCH BẢO DƯỠNG",
      icon: <AssignmentTurnedInOutlined sx={{ fontSize: 16 }} />,
      color: "#3b82f6",
      items: planItems,
      totalItems: planPaged.totalItems,
      type: "plan",
    },
    {
      step: 2,
      title: "BÁO CÁO KỸ THUẬT",
      icon: <DescriptionOutlined sx={{ fontSize: 16 }} />,
      color: "#8b5cf6",
      items: technicalReportItems,
      totalItems: technicalReportPaged.totalItems,
      type: "technicalReport",
    },
    {
      step: 3,
      title: "BIÊN BẢN GIÁM ĐỊNH",
      icon: <FactCheckOutlined sx={{ fontSize: 16 }} />,
      color: "#22c55e",
      items: inspectionItems,
      totalItems: inspectionPaged.totalItems,
      type: "inspection",
    },
    {
      step: 4,
      title: "LỆNH SỬA CHỮA",
      icon: <BuildOutlined sx={{ fontSize: 16 }} />,
      color: "#f59e0b",
      items: repairItems,
      totalItems: repairPaged.totalItems,
      type: "repair",
    },
    {
      step: 5,
      title: "PHIẾU GIAO VIỆC",
      icon: <AssignmentTurnedInOutlined sx={{ fontSize: 16 }} />,
      color: "#ec4899",
      items: jobAssignmentItems,
      totalItems: jobAssignmentPaged.totalItems,
      type: "jobAssignment",
    },
    {
      step: 6,
      title: "PHIẾU LĨNH VẬT TƯ",
      icon: <InventoryOutlined sx={{ fontSize: 16 }} />,
      color: "#14b8a6",
      items: materialRequisitionItems,
      totalItems: materialRequisitionPaged.totalItems,
      type: "materialRequisition",
    },
    {
      step: 7,
      title: "BIÊN BẢN NGHIỆM THU",
      icon: <FactCheckOutlined sx={{ fontSize: 16 }} />,
      color: "#10b981",
      items: acceptanceItems,
      totalItems: acceptancePaged.totalItems,
      type: "acceptance",
    },
    {
      step: 8,
      title: "BIÊN BẢN ĐÁNH GIÁ VT",
      icon: <InventoryOutlined sx={{ fontSize: 16 }} />,
      color: "#f97316",
      items: materialAssessmentItems,
      totalItems: materialAssessmentPaged.totalItems,
      type: "materialAssessment",
    },
  ];

  return (
    <Box sx={{ bgcolor: "#f6f8fb", minHeight: "100vh" }}>
      <PageAction title="Quản lý sửa chữa" hideActionRow={true} />
      <Box sx={{ mx: "auto", py: 4, px: 4 }}>
        {/* ── Top Filter Bar ── */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "16px",
            mb: 4,
            border: "1px solid",
            borderColor: "grey.100",
            boxShadow: "0 4px 20px 0 rgba(0, 0, 0, 0.02)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <TuneOutlined sx={{ color: "#04b46e", fontSize: 20 }} />
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="grey.800"
              sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
            >
              Bộ lọc tìm kiếm
            </Typography>
          </Box>
          <Grid
            container
            spacing={3}
            alignItems="center"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 600,
                bgcolor: "rgba(4,180,110,0.04)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(4,180,110,0.15)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(4,180,110,0.3)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#04b46e",
                },
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "rgba(4,180,110,0.8)",
                "&.Mui-focused": {
                  color: "#04b46e",
                },
              },
              "& input[type='date']::-webkit-datetime-edit": {
                color: "rgba(4,180,110,0.8)",
              },
              "& input[type='date']::-webkit-datetime-edit-fields-wrapper": {
                color: "rgba(4,180,110,0.8)",
              },
              "& input[type='date']::-webkit-calendar-picker-indicator": {
                filter:
                  "invert(51%) sepia(72%) saturate(450%) hue-rotate(109deg)",
              },
            }}
          >
            <Grid size={{ xs: 12, md: 2.5 }}>
              <FieldAutoCompleted
                title="Đơn vị"
                data={departments}
                labelkey="tenPhongBan"
                setValue={setDonVi}
                value={donVi}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                label="Từ ngày"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                label="Đến ngày"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3.5 }}>
              <FieldAutoCompleted
                title="Chọn Thiết Bị"
                data={assets}
                labelkey="tenTaiSan"
                labelOption="id"
                setValue={setSelectedId}
                value={selectedId}
                limitOptions={20}
                anchorRight={true}
              />
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Left */}
          <Grid size={{ xs: 12, md: selectedId ? 8 : 12 }}>
            <Stack spacing={4}>
              {/* Summary */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  overflowX: "auto",
                  pb: 1.5,
                  width: "100%",
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
                <SummaryCard
                  icon={<AssignmentTurnedInOutlined sx={{ fontSize: 20 }} />}
                  title="Kế Hoạch"
                  color="#3b82f6"
                  main={planPaged.totalItems}
                  mainLabel="Tổng số kế hoạch"
                  sub={planPaged.trangThaiCounts["1"] || 0}
                  subLabel="Chờ duyệt"
                />
                <SummaryCard
                  icon={<DescriptionOutlined sx={{ fontSize: 20 }} />}
                  title="Báo cáo KT"
                  color="#8b5cf6"
                  main={technicalReportPaged.totalItems}
                  mainLabel="Tổng số báo cáo"
                  sub={technicalReportPaged.trangThaiCounts["1"] || 0}
                  subLabel="Chờ duyệt"
                />
                <SummaryCard
                  icon={<FactCheckOutlined sx={{ fontSize: 20 }} />}
                  title="Giám Định"
                  color="#22c55e"
                  main={inspectionPaged.totalItems}
                  mainLabel="Tổng bản giám định"
                  sub={inspectionPaged.trangThaiCounts["1"] || 0}
                  subLabel="Chờ duyệt"
                />
                <SummaryCard
                  icon={<BuildOutlined sx={{ fontSize: 20 }} />}
                  title="Lệnh SC"
                  color="#f59e0b"
                  main={repairPaged.totalItems}
                  mainLabel="Tổng lệnh sửa chữa"
                  sub={repairPaged.trangThaiCounts["1"] || 0}
                  subLabel="Chờ duyệt"
                />
                <SummaryCard
                  icon={<AssignmentTurnedInOutlined sx={{ fontSize: 20 }} />}
                  title="Phiếu GV"
                  color="#ec4899"
                  main={jobAssignmentPaged.totalItems}
                  mainLabel="Tổng phiếu giao việc"
                  sub={jobAssignmentPaged.trangThaiCounts["1"] || 0}
                  subLabel="Chờ duyệt"
                />
                <SummaryCard
                  icon={<InventoryOutlined sx={{ fontSize: 20 }} />}
                  title="Phiếu VT"
                  color="#14b8a6"
                  main={materialRequisitionPaged.totalItems}
                  mainLabel="Tổng phiếu vật tư"
                  sub={materialRequisitionPaged.trangThaiCounts["1"] || 0}
                  subLabel="Chờ duyệt"
                />
                <SummaryCard
                  icon={<FactCheckOutlined sx={{ fontSize: 20 }} />}
                  title="Nghiệm Thu"
                  color="#10b981"
                  main={acceptancePaged.totalItems}
                  mainLabel="Tổng bản nghiệm thu"
                  sub={acceptancePaged.trangThaiCounts["1"] || 0}
                  subLabel="Chờ duyệt"
                />
                <SummaryCard
                  icon={<InventoryOutlined sx={{ fontSize: 20 }} />}
                  title="Đánh giá VT"
                  color="#f97316"
                  main={materialAssessmentPaged.totalItems}
                  mainLabel="Tổng bản đánh giá"
                  sub={materialAssessmentPaged.trangThaiCounts["1"] || 0}
                  subLabel="Chờ duyệt"
                />
              </Box>

              {/* Quy Trinh */}
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  mb={2}
                  color="grey.700"
                  sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                >
                  Sơ đồ quy trình thực hiện
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    overflowX: "auto",
                    pb: 2,
                    px: 0.5,
                  }}
                >
                  {quyTrinhSteps.map((step, i) => (
                    <Box
                      key={step.step}
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Box sx={{ minWidth: 220 }}>
                        <QuyTrinhStep
                          {...step}
                          onXemTatCa={() => openModal(step.title, step.type)}
                        />
                      </Box>
                      {i < quyTrinhSteps.length - 1 && (
                        <Box
                          sx={{
                            color: "grey.500",
                            display: { xs: "none", lg: "block" },
                          }}
                        >
                          <ChevronRight sx={{ fontSize: 24 }} />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Stack>
          </Grid>

          {/* Right */}
          {selectedId && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ position: "sticky", top: 24 }}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "grey.100",
                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <Box
                    sx={{
                      background: currentBrandConfig.primaryColor,
                      px: 3,
                      py: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      color="#fff"
                      sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Thông Tin Thiết Bị
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedId("")}
                      sx={{
                        color: "#fff",
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.15)",
                        },
                      }}
                    >
                      <CloseOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2.5,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Avatar
                        sx={{
                          bgcolor: "#e2fbe8",
                          width: 56,
                          height: 56,
                          boxShadow: "0 4px 12px rgba(4, 180, 110, 0.15)",
                          border: "2px solid",
                          borderColor: "#bbf7c8",
                        }}
                      >
                        <PrecisionManufacturingOutlined
                          sx={{ color: "primary.main", fontSize: 28 }}
                        />
                      </Avatar>
                      <Box sx={{ overflow: "hidden" }}>
                        <Typography
                          fontWeight={700}
                          variant="body1"
                          sx={{
                            color: "grey.900",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {findById(assets, selectedId)?.tenTaiSan}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          Số thẻ:{" "}
                          <b
                            style={{
                              fontFamily: "monospace",
                              color: "#334155",
                            }}
                          >
                            {findById(assets, selectedId)?.soThe}
                          </b>
                        </Typography>
                      </Box>
                    </Box>

                    <Divider />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <InfoOutlined
                          sx={{ color: "grey.400", fontSize: 18 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600, textTransform: "uppercase" }}
                        >
                          Tình trạng
                        </Typography>
                      </Box>
                      <Box>
                        {(() => {
                          return (
                            <Box
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: "8px",
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                display: "inline-block",
                              }}
                            >
                              {(taiSanDetail as any)?.tenHienTrang || "-"}
                            </Box>
                          );
                        })()}
                      </Box>
                    </Box>

                    <Divider />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <AvTimerOutlined
                          sx={{ color: "grey.400", fontSize: 18 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600, textTransform: "uppercase" }}
                        >
                          Tổng giờ chạy
                        </Typography>
                      </Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{ color: "grey.800" }}
                      >
                        {(taiSanDetail as any)?.gioHoatDong || 0} giờ
                      </Typography>
                    </Box>

                    <Divider />

                    {/* <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                        }}
                      >
                        <NotesOutlined
                          sx={{ color: "grey.400", fontSize: 18 }}
                        />
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="text.secondary"
                          sx={{ textTransform: "uppercase" }}
                        >
                          Tiến độ quy trình
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {processPaged.items.length === 0 ? (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{
                              fontStyle: "italic",
                              textAlign: "center",
                              display: "block",
                              py: 2,
                            }}
                          >
                            Chưa có tiến độ sửa chữa nào
                          </Typography>
                        ) : (
                          processPaged.items.map((proc: any, index: number) => (
                            <Box
                              key={proc.idSuaChuaChiTiet || index}
                              sx={{
                                bgcolor: "grey.50",
                                p: 2,
                                borderRadius: "12px",
                                border: "1px solid",
                                borderColor: "grey.100",
                              }}
                            >
                              <Typography
                                variant="caption"
                                fontWeight={800}
                                color="primary.main"
                                sx={{
                                  display: "block",
                                  mb: 1.5,
                                  letterSpacing: 0.5,
                                }}
                              >
                                QUY TRÌNH #{index + 1}
                              </Typography>
                              <Stack spacing={0}>
                                <TienDoItem
                                  label="Lệnh sửa chữa"
                                  ma={proc.lenhSuaChua || "Chưa tạo"}
                                  trang={getProcessStepStatus(
                                    proc.idSuaChua,
                                    proc.trangThaiSuaChua,
                                  )}
                                />
                                <TienDoItem
                                  label="Giám định máy móc"
                                  ma={proc.bienBanGiamDinh || "Chưa tạo"}
                                  trang={getProcessStepStatus(
                                    proc.idGiamDinhMayMoc,
                                    proc.trangThaiGiamDinh,
                                  )}
                                />
                                <TienDoItem
                                  label="Nghiệm thu sửa chữa"
                                  ma={proc.phieuNghiemThu || "Chưa tạo"}
                                  trang={getProcessStepStatus(
                                    proc.idNghiemThu,
                                    proc.trangThaiNghiemThu,
                                  )}
                                  isLast={true}
                                />
                              </Stack>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box> */}

                    <Divider />

                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ textTransform: "uppercase" }}
                      >
                        Ghi chú thiết bị
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 1,
                          fontStyle: (taiSanDetail as any)?.ghiChu
                            ? "normal"
                            : "italic",
                        }}
                      >
                        {(taiSanDetail as any)?.ghiChu || "Không có ghi chú"}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Grid>
          )}

          {/* Danh Sách Vật Tư Tiêu Hao */}
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid",
                borderColor: "grey.100",
                boxShadow: "0 4px 20px 0 rgba(0, 0, 0, 0.02)",
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: "grey.50",
                }}
              >
                <InventoryOutlined
                  sx={{ color: "primary.main", fontSize: 20 }}
                />
                <Typography fontWeight={700} color="grey.800">
                  QUÁ TRÌNH HOẠT ĐỘNG THIẾT BỊ:{" "}
                  <span style={{ color: "#04b46eff" }}>
                    {findById(assets, selectedId)?.tenTaiSan?.toUpperCase() ||
                      "TẤT CẢ THIẾT BỊ"}
                  </span>
                </Typography>
              </Box>

              <TableContainer sx={{ maxHeight: 600 }}>
                <Table size="medium" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {[
                        "STT",
                        "Thời gian bắt đầu SC",
                        "Thời gian kết thúc sửa chữa",
                        "Loại sửa chữa",
                        "Ghi chú",
                      ].map((h) => (
                        <TableCell
                          key={h}
                          sx={{
                            bgcolor: "#fff",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            color: "grey.600",
                            py: 2,
                            borderBottom: "2px solid",
                            borderColor: "grey.100",
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <DeviceActivityHistoryRows
                      idTaiSan={selectedId}
                      dateFrom={dateFrom}
                      dateTo={dateTo}
                    />
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      <ModalXemTatCa
        open={modal.open}
        onClose={() =>
          setModal({
            open: false,
            title: "",
            type: "",
          })
        }
        title={modal.title}
        items={
          modal.type === "plan"
            ? planItems
            : modal.type === "technicalReport"
              ? technicalReportItems
              : modal.type === "inspection"
                ? inspectionItems
                : modal.type === "repair"
                  ? repairItems
                  : modal.type === "jobAssignment"
                    ? jobAssignmentItems
                    : modal.type === "materialRequisition"
                      ? materialRequisitionItems
                      : modal.type === "acceptance"
                        ? acceptanceItems
                        : modal.type === "materialAssessment"
                          ? materialAssessmentItems
                          : []
        }
        page={pageModels[modal.type as keyof typeof pageModels] || 0}
        totalPages={Math.ceil(
          (modal.type === "plan"
            ? planPaged.totalItems
            : modal.type === "technicalReport"
              ? technicalReportPaged.totalItems
              : modal.type === "inspection"
                ? inspectionPaged.totalItems
                : modal.type === "repair"
                  ? repairPaged.totalItems
                  : modal.type === "jobAssignment"
                    ? jobAssignmentPaged.totalItems
                    : modal.type === "materialRequisition"
                      ? materialRequisitionPaged.totalItems
                      : modal.type === "acceptance"
                        ? acceptancePaged.totalItems
                        : modal.type === "materialAssessment"
                          ? materialAssessmentPaged.totalItems
                          : 0) / 10,
        )}
        onPageChange={(p) =>
          setPageModels((prev) => ({
            ...prev,
            [modal.type]: p,
          }))
        }
      />
    </Box>
  );
}

const DeviceActivityHistoryRows = ({
  idTaiSan,
  dateFrom,
  dateTo,
}: {
  idTaiSan: string;
  dateFrom: string;
  dateTo: string;
}) => {
  const { data: histories = [], isLoading } = useDeviceActivityHistoryQuery(
    idTaiSan,
    dateFrom,
    dateTo,
  );

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
          <Typography variant="caption" color="text.secondary">
            Đang tải dữ liệu...
          </Typography>
        </TableCell>
      </TableRow>
    );
  }

  if (histories.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                bgcolor: "grey.100",
                color: "grey.400",
                width: 48,
                height: 48,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <InventoryOutlined sx={{ fontSize: 24 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {idTaiSan
                ? `Thiết bị không có hoạt động trong khoảng thời gian này`
                : "Vui lòng chọn thiết bị ở bộ lọc phía trên để xem lịch sử hoạt động"}
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {histories.map((h: any, idx: number) => (
        <TableRow
          key={idx}
          hover
          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
        >
          <TableCell>{idx + 1}</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>{h.ngayBatDau || "—"}</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>{h.ngayKetThuc || "—"}</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>{h.loaiSuaChua || "—"}</TableCell>
          <TableCell sx={{ fontWeight: 400, color: "text.secondary" }}>
            {h.ghiChu || "—"}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};
