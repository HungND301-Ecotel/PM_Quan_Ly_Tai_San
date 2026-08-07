import React, { useState } from "react";
import {
  showConfirmAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../components/Alert";
import {
  Box,
  Chip,
  Alert,
  Badge,
  Card,
  CardContent,
  Paper,
  Typography,
  IconButton,
  Tabs,
  Tab,
  ButtonBase,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  AssignmentOutlined,
  BuildOutlined,
  FactCheckOutlined,
  PlaylistAddCheckOutlined,
  InventoryOutlined,
  WarningOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import PageAction from "../../components/common/PageAction";
import TableCustom from "../../components/common/TableCustom";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useMaintenanceAcceptanceTestPageQuery,
  useMaintenanceAcceptanceTestVehiclePageQuery,
  useMaintenanceIncidentPageQuery,
  useMaintenanceInspectionPageQuery,
  useMaintenanceMaterialAssessmentPageQuery,
  useMaintenancePlanningPageQuery,
  useMaintenanceRepairPageQuery,
  useMaintenanceIncidentInspectionPageQuery,
  useMaintenanceBienPhapMayMocPageQuery,
  useMaintenanceBienPhapPhuongTienPageQuery,
  useMaintenanceVehicleInspectionPageQuery,
} from "./mutation";
import {
  generateBienBanKeHoachPdf,
  generatePhieuSuCoPdf,
  generateSuaChuaPdf,
  generateGiamDinhPdf,
  generateGiamDinhPhuongTienPdf,
  generateNghiemThuPdf,
  generateNghiemThuPhuongTienPdf,
  generateDanhGiaVatTuPdf,
  generateKiemTraSuCoPdf,
  generateBienPhapMayMocPdf,
  generateBienPhapPhuongTienPdf,
  showStatus,
  listSigneInfo,
  showShareStatus,
  isCheckShowShare,
  handleSendToSigner,
  showDownloadFile,
} from "./config";
import SignDocumentForm from "./components/signdocument/SignDocumentForm";
import { useAllDepartmentsQuery } from "../Department/Mutation";
import { useAllStaffsQuery } from "../Staff/Mutation";
import { useAllPositionsQuery } from "../Position/Mutation";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import {
  AcceptanceTestAdapter,
  NghiemThuPhuongTienAdapter,
  IncidentAdapter,
  InspectionAdapter,
  MaterialAssessmentAdapter,
  PlanAdapter,
  RepairAdapter,
  IncidentInspectionAdapter,
  BienPhapMayMocAdapter,
  BienPhapPhuongTienAdapter,
} from "./Adapter";
import { FilterOption } from "../../components/common/FilterStatusGroup";
import { useMaintenanceMutation } from "./mutation";
import { useMenuData } from "../../hooks/useMenuData";
import S3Service from "../../services/S3Service";
import { AssetGroup, AssetGroupType, TypeBienBan } from "../../utils/const";
import Filter from "./components/Filter";
import {
  ClipboardList,
  Wrench,
  FileSearch,
  ClipboardCheck,
  Boxes,
  AlertTriangle,
  FileWarning,
} from "lucide-react";
import { currentBrandConfig } from "../../config/brandConfig";
export default function MaintenanceRecordPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { user } = useSelector((state: any) => state.user);

  // Filter ngày & trạng thái
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bienPhapType, setBienPhapType] = useState<AssetGroupType>(
    AssetGroup.MAYMOC,
  );

  const { data: staffs } = useAllStaffsQuery();
  const { data: departments } = useAllDepartmentsQuery();
  const { data: positions } = useAllPositionsQuery();

  const { counts } = useMenuData();

  const { updateManyMutation, cancelMutation, saveNoteMutation } =
    useMaintenanceMutation(
      activeTab === 0
        ? "maintenancePlanningPage"
        : activeTab === 1
          ? "incidentPage"
          : activeTab === 2
            ? "incidentInspectionPage"
            : activeTab === 3
              ? "repairPage"
              : activeTab === 4
                ? bienPhapType === AssetGroup.MAYMOC
                  ? "inspectionPage"
                  : "vehicleInspectionPage"
                : activeTab === 5
                  ? bienPhapType === AssetGroup.MAYMOC
                    ? "bienPhapMayMocPage"
                    : "bienPhapPhuongTienPage"
                  : activeTab === 6
                    ? bienPhapType === AssetGroup.MAYMOC
                      ? "nghiemThuMayMocPage"
                      : "nghiemThuPhuongTienPage"
                    : activeTab === 7
                      ? "materialAssessmentPage"
                      : "",
      activeTab === 0
        ? "kehoach-suachua"
        : activeTab === 1
          ? "suco-thietbi"
          : activeTab === 2
            ? "kiemtra-suco"
            : activeTab === 3
              ? "suachua"
              : activeTab === 4
                ? bienPhapType === AssetGroup.MAYMOC
                  ? "giamdinh-maymoc"
                  : "giamdinh-phuongtien"
                : activeTab === 5
                  ? bienPhapType === AssetGroup.MAYMOC
                    ? "bienphap-maymoc"
                    : "bienphap-phuongtien"
                  : activeTab === 6
                    ? bienPhapType === AssetGroup.MAYMOC
                      ? "nghiemthu-maymoc"
                      : "nghiemthu-phuongtien"
                    : activeTab === 7
                      ? "danhgia-vattu"
                      : "",
      activeTab,
    );

  const searchDebounce = useDebounce(searchValue, 500);
  const {
    data: planPaged = { items: [], totalItems: 0, trangThaiCounts: {} },
    isLoading,
  } = useMaintenancePlanningPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    statusFilter !== "" ? Number(statusFilter) : undefined,
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom,
    dateTo,
    bienPhapType,
    undefined,
    activeTab === 0,
  );

  const {
    data: incidentPaged = { items: [], totalItems: 0, trangThaiCounts: {} },
    isLoading: isLoadingIncident,
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
    bienPhapType,
    undefined,
    activeTab === 1,
  );

  const {
    data: incidentInspectionPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
    isLoading: isLoadingIncidentInspection,
  } = useMaintenanceIncidentInspectionPageQuery(
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
    activeTab === 2,
  );

  const {
    data: repairPaged = { items: [], totalItems: 0, trangThaiCounts: {} },
    isLoading: isLoadingRepair,
  } = useMaintenanceRepairPageQuery(
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
    activeTab === 3,
  );

  const {
    data: giamDinhMayMoc = { items: [], totalItems: 0, trangThaiCounts: {} },
    isLoading: isLoadingInspection,
  } = useMaintenanceInspectionPageQuery(
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
    activeTab === 4 && bienPhapType === AssetGroup.MAYMOC,
  );

  const {
    data: giamDinhPhuongTien = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
    isLoading: isLoadingGiamDinh,
  } = useMaintenanceVehicleInspectionPageQuery(
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
    activeTab === 4 && bienPhapType === AssetGroup.PHUONGTIEN,
  );
  const inspectionPaged =
    bienPhapType === AssetGroup.MAYMOC ? giamDinhMayMoc : giamDinhPhuongTien;

  const {
    data: bienPhapMayMocPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
    isLoading: isLoadingBienPhapMayMoc,
  } = useMaintenanceBienPhapMayMocPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    statusFilter !== "" ? Number(statusFilter) : undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 5 && bienPhapType === AssetGroup.MAYMOC,
  );

  const {
    data: bienPhapPhuongTienPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
    isLoading: isLoadingBienPhapPhuongTien,
  } = useMaintenanceBienPhapPhuongTienPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    statusFilter !== "" ? Number(statusFilter) : undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 5 && bienPhapType === AssetGroup.PHUONGTIEN,
  );

  const bienPhapPaged =
    bienPhapType === AssetGroup.MAYMOC
      ? bienPhapMayMocPaged
      : bienPhapPhuongTienPaged;

  const {
    data: nghiemThuMayMocPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
    isLoading: isLoadingNghiemThuMayMoc,
  } = useMaintenanceAcceptanceTestPageQuery(
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
    activeTab === 6 && bienPhapType === AssetGroup.MAYMOC,
  );

  const {
    data: nghiemThuPhuongTienPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
    isLoading: isLoadingNghiemThuPhuongTien,
  } = useMaintenanceAcceptanceTestVehiclePageQuery(
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
    activeTab === 6 && bienPhapType !== AssetGroup.MAYMOC,
  );

  const acceptanceTestPaged =
    bienPhapType === AssetGroup.MAYMOC
      ? nghiemThuMayMocPaged
      : nghiemThuPhuongTienPaged;

  const {
    data: materialAssessmentPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
    isLoading: isLoadingMaterialAssessment,
  } = useMaintenanceMaterialAssessmentPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    statusFilter !== "" ? Number(statusFilter) : undefined,
    user?.taiKhoan?.tenDangNhap,
    undefined,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 7,
  );

  const tabConfigs = [
    { label: "Kế hoạch", icon: <AssignmentOutlined />, idLabel: "Mã KH" },
    {
      label: "Phiếu báo sự cố",
      icon: <WarningOutlined />,
      idLabel: "Số phiếu",
      field: "soPhieu",
    },
    {
      label: "BB Kiểm tra sự cố",
      icon: <SearchOutlined />,
      idLabel: "Số BB kiểm tra",
    },
    {
      label: "Lệnh sửa chữa",
      icon: <BuildOutlined />,
      idLabel: "Số lệnh SC",
      field: "soPhieu",
    },
    {
      label: "BB Giám định",
      icon: <FactCheckOutlined />,
      idLabel: "Số BB giám định",
      field: "soPhieu",
    },
    {
      label: "Biện pháp sửa chữa",
      icon: <BuildOutlined />,
      idLabel: "Số biện pháp",
      field: "soPhieu",
    },
    {
      label: "BB Nghiệm thu",
      icon: <PlaylistAddCheckOutlined />,
      idLabel: "Số BB nghiệm thu",
    },
    {
      label: "BB Đánh giá VT",
      icon: <InventoryOutlined />,
      idLabel: "Số BB đánh giá",
    },
  ];

  const parentColumnConfigs: Record<
    number,
    { field: string; headerName: string; key?: string }[]
  > = {
    1: [{ field: "planId", headerName: "Mã kế hoạch" }],
    2: [{ field: "planId", headerName: "Mã kế hoạch" }],
    3: [{ field: "idSuCo", headerName: "Mã phiếu báo SC" }],
    4: [
      {
        field: "idBienBanSuaChua",
        headerName: "Mã lệnh SC",
        key: TypeBienBan.SUA_CHUA,
      },
      {
        field: "idBienBanKiemTra",
        headerName: "Mã BB kiểm tra SC",
        key: TypeBienBan.SU_CO,
      },
    ],
    5: [{ field: "idGiamDinh", headerName: "Mã BB giám định" }],
    6: [{ field: "soPhieu", headerName: "Mã biện pháp" }],
    7: [{ field: "idNghiemThu", headerName: "Mã BB nghiệm thu" }],
  };

  const allRows = [
    { ...planPaged, items: planPaged.items.map(PlanAdapter) },
    { ...incidentPaged, items: incidentPaged.items.map(IncidentAdapter) },
    {
      ...incidentInspectionPaged,
      items: (incidentInspectionPaged.items || []).map(
        IncidentInspectionAdapter,
      ),
    },
    { ...repairPaged, items: repairPaged.items.map(RepairAdapter) },
    { ...inspectionPaged, items: inspectionPaged.items.map(InspectionAdapter) },
    {
      ...bienPhapPaged,
      items: (bienPhapPaged.items || []).map(
        bienPhapType === AssetGroup.MAYMOC
          ? BienPhapMayMocAdapter
          : BienPhapPhuongTienAdapter,
      ),
    },
    {
      ...acceptanceTestPaged,
      items: (acceptanceTestPaged.items || []).map(
        bienPhapType === AssetGroup.MAYMOC
          ? AcceptanceTestAdapter
          : NghiemThuPhuongTienAdapter,
      ),
    },
    {
      ...materialAssessmentPaged,
      items: (materialAssessmentPaged.items || []).map(
        MaterialAssessmentAdapter,
      ),
    },
  ];

  const currentAllData = allRows[activeTab];
  const safeRows = (currentAllData?.items || []).map((r: any) => ({
    ...r,
    id: r.id || crypto.randomUUID(),
  }));

  const buildColumns = (collapsed: boolean) => {
    const parentCols = (parentColumnConfigs[activeTab] ?? []).map((cfg) => ({
      field: cfg.field,
      headerName: cfg.headerName,
      width: 160,
      renderCell: (params: any) => {
        // Tab giám định: hiển thị dữ liệu vào đúng cột loại biên bản
        if (activeTab === 4) {
          const loai = params.row.loaiBienBan; // 'sua_chua' | 'su_co'
          if (loai === cfg.key) {
            return <span>{params.row.idBienBan || "—"}</span>;
          }
          return <span style={{ color: "#bbb" }}>—</span>;
        }
        return (
          <span style={{ color: params.value ? "inherit" : "#bbb" }}>
            {params.value || "—"}
          </span>
        );
      },
    }));

    if (collapsed) {
      return [
        {
          field: tabConfigs[activeTab].field || "id",
          headerName: tabConfigs[activeTab].idLabel,
          flex: 1,
        },
        {
          field: "trangThai",
          headerName: "TT",
          width: 110,
          renderCell: (params: any) => showStatus(params.row.trangThai),
        },
      ];
    }

    const columns: any[] = [
      { field: "id", headerName: tabConfigs[activeTab].idLabel, width: 160 },
      ...parentCols,
      { field: "moTa", headerName: "Nội dung/Ghi chú", flex: 1, minWidth: 200 },
    ];

    if (activeTab === 5 && bienPhapType === AssetGroup.MAYMOC) {
      columns.push({
        field: "tenFile",
        headerName: "Tài liệu",
        width: 180,
        renderCell: (params: any) => {
          return showDownloadFile(
            params.value,
            () => S3Service.download(params.row.duongDanFile),
            // handleDownloadFile(params.value),
          );
        },
      });
    }

    columns.push(
      { field: "ngayTao", headerName: "Ngày tạo", width: 120 },
      {
        field: "share",
        headerName: "Trình duyệt",
        width: 160,
        renderCell: (params: any) =>
          showShareStatus(
            params.row?.share ?? false,
            params.row?.nguoiTao === user?.taiKhoan?.tenDangNhap,
          ),
      },
      {
        field: "trangThai",
        headerName: "Trạng thái",
        width: 140,
        renderCell: (params: any) => showStatus(params.row.trangThai),
      },
    );

    return columns;
  };

  const renderPreview = () => {
    if (!selectedRow) return null;
    const handleReject = async () => {
      if (!selectedRow) return;
      const confirm = await showConfirmAlert(
        "Bạn có chắc muốn từ chối biên bản này?",
      );
      if (!confirm.isConfirmed) return;
      try {
        await cancelMutation.mutateAsync({ id: selectedRow.id });
        setSelectedRow(null);
      } catch (error) {
        console.error("Lỗi khi từ chối biên bản:", error);
      }
    };

    const handleSaveNote = async (note: string) => {
      if (!selectedRow) return;
      try {
        await saveNoteMutation.mutateAsync({
          id: selectedRow.id,
          ghiChuBienBan: note,
        });
        setSelectedRow((prev: any) =>
          prev ? { ...prev, ghiChuBienBan: note } : null,
        );
        showSuccessAlert("Lưu ghi chú thành công");
      } catch (error) {
        console.error("Lỗi khi lưu ghi chú:", error);
      }
    };

    const commonProps = {
      selectedIds: [selectedRow.id],
      onCancel: () => {
        setSelectedRow(null);
      },
      onSign: () => {},
      onReject: handleReject,
      onSaveNote: handleSaveNote,
      data: selectedRow,
      staffs: staffs || [],
      departments: departments || [],
      positions: positions || [],
      fullscreen: false,
      showSignerSidebar: true,
      showHeader: false,
    };

    switch (activeTab) {
      case 0:
        return (
          <SignDocumentForm
            {...commonProps}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              generateBienBanKeHoachPdf(
                selectedRow,
                staffs || [],
                departments || [],
                positions || [],
              )
            }
          />
        );
      case 1:
        return (
          <SignDocumentForm
            {...commonProps}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              generatePhieuSuCoPdf(
                selectedRow,
                staffs || [],
                departments || [],
                positions || [],
              )
            }
          />
        );
      case 2:
        return (
          <SignDocumentForm
            {...commonProps}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              generateKiemTraSuCoPdf(
                selectedRow,
                staffs || [],
                departments || [],
                positions || [],
              )
            }
          />
        );
      case 3:
        return (
          <SignDocumentForm
            {...commonProps}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              generateSuaChuaPdf(
                selectedRow,
                staffs || [],
                departments || [],
                positions || [],
              )
            }
          />
        );
      case 4:
        return (
          <SignDocumentForm
            {...commonProps}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              bienPhapType === AssetGroup.MAYMOC
                ? generateGiamDinhPdf(
                    selectedRow,
                    staffs || [],
                    departments || [],
                    positions || [],
                  )
                : generateGiamDinhPhuongTienPdf(
                    selectedRow,
                    staffs || [],
                    departments || [],
                    positions || [],
                  )
            }
          />
        );
      case 5:
        return (
          <SignDocumentForm
            {...commonProps}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              bienPhapType === AssetGroup.MAYMOC
                ? generateBienPhapMayMocPdf(
                    selectedRow,
                    staffs || [],
                    departments || [],
                    positions || [],
                  )
                : generateBienPhapPhuongTienPdf(
                    selectedRow,
                    staffs || [],
                    departments || [],
                    positions || [],
                  )
            }
          />
        );
      case 6:
        return (
          <SignDocumentForm
            {...commonProps}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              bienPhapType === AssetGroup.MAYMOC
                ? generateNghiemThuPdf(
                    selectedRow,
                    staffs || [],
                    departments || [],
                    positions || [],
                  )
                : generateNghiemThuPhuongTienPdf(
                    selectedRow,
                    staffs || [],
                    departments || [],
                    positions || [],
                  )
            }
          />
        );
      case 7:
        return (
          <SignDocumentForm
            {...commonProps}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              generateDanhGiaVatTuPdf(
                selectedRow,
                staffs || [],
                departments || [],
                positions || [],
              )
            }
          />
        );
      default:
        return null;
    }
  };

  const renderSignProcess = (row: any) => {
    const signers = listSigneInfo(row, staffs, departments, positions);
    if (!signers.length)
      return (
        <Alert severity="info">Không có quy trình ký cho biên bản này.</Alert>
      );

    return (
      <Box>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
        >
          Quy trình ký
          <Chip
            label={`${signers.length} người`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 400 }}
          />
        </Typography>
        <Box sx={{ position: "relative", pl: 5 }}>
          <Box
            sx={{
              position: "absolute",
              left: 16,
              top: 8,
              bottom: 8,
              width: "1px",
              bgcolor: "divider",
            }}
          />
          {signers.map((s: any, idx: number) => (
            <Box
              key={`${s.hoTen}-${idx}`}
              sx={{ position: "relative", mb: 1.5 }}
            >
              <Box
                sx={{
                  position: "absolute",
                  left: -37,
                  top: 14,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  zIndex: 1,
                  boxShadow: "0 0 0 3px white",
                }}
              >
                {idx + 1}
              </Box>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1.5,
                  bgcolor: "background.paper",
                  transition: "all 0.2s",
                  "&:hover": { boxShadow: 1, borderColor: "grey.300" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {s.hoTen?.charAt(0) ?? "?"}
                    </Box>
                    <Box>
                      <Typography fontWeight={600} fontSize={13}>
                        {s.hoTen ?? "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.chucVu || ""}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={s.donVi || ""}
                          size="small"
                          sx={{ fontSize: 10, height: 18, bgcolor: "grey.100" }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    {s.signed ? (
                      <Chip
                        label={`Đã ký${s.signedAt ? ` • ${s.signedAt}` : ""}`}
                        size="small"
                        color="success"
                      />
                    ) : (
                      <Chip label="Chưa ký" size="small" color="warning" />
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const handleClose = () => {
    setSelectedIds([]);
    setSearchValue("");
    setSelectedRow(null);
  };

  const handleSend = (items: any[]) => {
    handleSendToSigner(items, updateManyMutation.mutateAsync, handleClose);
  };

  const isDetailOpen = !!selectedRow;

  const resetFilters = () => {
    setSearchValue("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("");
    setSelectedRow(null);
    setPaginationModel((m) => ({ ...m, page: 0 }));
  };

  const statusOptions: FilterOption[] = [
    {
      label: "Tất cả",
      value: "",
      count:
        (currentAllData?.trangThaiCounts?.["0"] || 0) +
        (currentAllData?.trangThaiCounts?.["1"] || 0) +
        (currentAllData?.trangThaiCounts?.["2"] || 0) +
        (currentAllData?.trangThaiCounts?.["3"] || 0),
      color: "primary",
    },
    {
      label: "Bản nháp",
      value: 0,
      count: currentAllData?.trangThaiCounts?.["0"] || 0,
      color: "default",
    },
    {
      label: "Chờ duyệt",
      value: 1,
      count: currentAllData?.trangThaiCounts?.["1"] || 0,
      color: "warning",
    },
    {
      label: "Từ chối",
      value: 2,
      count: currentAllData?.trangThaiCounts?.["2"] || 0,
      color: "error",
    },
    {
      label: "Đã duyệt",
      value: 3,
      count: currentAllData?.trangThaiCounts?.["3"] || 0,
      color: "success",
    },
  ];

  return (
    <>
      <PageAction title="Quản lý biên bản" />

      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {/* ── Tab bar ── */}
          <Box
            sx={{
              width: "100%",
              overflowX: "auto",
              display: "flex",
              gap: 2,
              p: 2.5,
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
                label: "Kế hoạch",
                subLabel: "Kế hoạch bảo trì",
                icon: ClipboardList,
                count: counts.shareCounts?.totalPlan || 0,
              },
              {
                label: "Phiếu báo sự cố",
                subLabel: "Báo cáo sự cố thiết bị",
                icon: AlertTriangle,
                count: counts.shareCounts?.totalIncident || 0,
              },
              {
                label: "BB Kiểm tra sự cố",
                subLabel: "Kiểm tra hiện trạng SC",
                icon: FileWarning,
                count: counts.shareCounts?.totalIncidentInspection || 0,
              },
              {
                label: "Lệnh sửa chữa",
                subLabel: "Lệnh xử lý kỹ thuật",
                icon: Wrench,
                count: counts.shareCounts?.totalRepair || 0,
              },
              {
                label: "BB Giám định",
                subLabel: "Giám định máy móc",
                icon: FileSearch,
                count:
                  (counts.shareCounts?.totalInspectionMachine || 0) +
                  (counts.shareCounts?.totalInspectionVehicle || 0),
              },
              {
                label: "Biện pháp sửa chữa",
                subLabel: "Biện pháp xử lý thiết bị",
                icon: Wrench,
                count:
                  (counts.shareCounts?.totalMeasureMachine || 0) +
                  (counts.shareCounts?.totalMeasureVehicle || 0),
              },
              {
                label: "BB Nghiệm thu",
                subLabel: "Nghiệm thu hoàn thành",
                icon: ClipboardCheck,
                count:
                  (counts.shareCounts?.totalMachineInspection || 0) +
                  (counts.shareCounts?.totalVehicleAcceptance || 0),
              },
              {
                label: "BB Đánh giá VT",
                subLabel: "Đánh giá vật tư tiêu hao",
                icon: Boxes,
                count: counts.shareCounts?.totalMaterialAssessment || 0,
              },
            ].map((tab, idx) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === idx;

              return (
                <ButtonBase
                  key={idx}
                  onClick={() => {
                    setActiveTab(idx);
                    resetFilters();
                  }}
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
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    border: "1px solid",
                    borderColor: isActive
                      ? "transparent"
                      : "rgba(148, 163, 184, 0.25)",
                    background: isActive
                      ? `linear-gradient(135deg, ${currentBrandConfig.primaryColor} 0%, ${currentBrandConfig.primaryColor} 100%)`
                      : "#ffffff",
                    color: isActive ? "#ffffff" : "#334155",
                    boxShadow: isActive
                      ? "0 10px 20px -5px rgba(4, 180, 110, 0.35)"
                      : "0 2px 4px rgba(148, 163, 184, 0.05)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: isActive
                        ? "transparent"
                        : currentBrandConfig.primaryColor,
                      boxShadow: isActive
                        ? "0 12px 24px -5px rgba(4, 180, 110, 0.45)"
                        : "0 6px 16px rgba(4, 180, 110, 0.08)",
                      bgcolor: isActive ? undefined : "rgba(4, 180, 110, 0.02)",
                    },
                  }}
                >
                  {/* Top Row: Icon + Count */}
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1.5,
                    }}
                  >
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
                        color: isActive
                          ? "#ffffff"
                          : currentBrandConfig.primaryColor,
                        transition: "all 0.25s ease",
                      }}
                    >
                      <IconComponent size={20} />
                    </Box>

                    {tab.count > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 22,
                          height: 22,
                          borderRadius: "11px",
                          bgcolor: isActive
                            ? "rgba(255,255,255,0.25)"
                            : currentBrandConfig.primaryColor,
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          px: 0.75,
                        }}
                      >
                        {tab.count}
                      </Box>
                    )}
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
                      {tab.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        lineHeight: 1.3,
                        color: isActive ? "rgba(255,255,255,0.75)" : "#94a3b8",
                        fontWeight: 400,
                      }}
                    >
                      {tab.subLabel}
                    </Typography>
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>

          {/* ── Filter thời gian ── */}
          <Filter
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            nhomTaiSanFilter={
              activeTab === 0 ||
              activeTab === 1 ||
              activeTab === 4 ||
              activeTab === 5 ||
              activeTab === 6
                ? bienPhapType
                : undefined
            }
            setNhomTaiSanFilter={
              activeTab === 0 ||
              activeTab === 1 ||
              activeTab === 4 ||
              activeTab === 5 ||
              activeTab === 6
                ? setBienPhapType
                : undefined
            }
          />

          {/* ── Nội dung: bảng + panel detail song song ── */}
          <Box sx={{ display: "flex", gap: 0, minHeight: 500 }}>
            {/* ── Bảng danh sách ── */}
            <Card
              elevation={0}
              sx={{
                flex: isDetailOpen ? "0 0 400px" : 1,
                transition: "flex 0.3s ease",
                overflow: "hidden",
                borderRadius: 0,
                borderRight: isDetailOpen ? "1px solid" : "none",
                borderColor: "divider",
              }}
            >
              <CardContent sx={{ height: "100%", p: "0 !important" }}>
                <TableCustom
                  title="Danh sách biên bản"
                  rows={safeRows}
                  columns={buildColumns(isDetailOpen)}
                  total={currentAllData?.totalItems || 0}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  paginationMode="server"
                  checkboxSelection={true}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  searchValue={searchValue}
                  setSearchValue={setSearchValue}
                  showDelete={false}
                  onRowClick={(params) => {
                    setSelectedRow(params.row);

                    setDetailTab(0);
                  }}
                  isRowSelectable={() => true}
                  showStatusFilter={!isDetailOpen}
                  statusOptions={statusOptions as any}
                  statusValue={statusFilter}
                  onStatusChange={(val) => {
                    setStatusFilter(val as any);
                    setPaginationModel((m) => ({ ...m, page: 0 }));
                  }}
                  canSign={() => false}
                  isCheckShowShare={isCheckShowShare}
                  handleSendToSigner={handleSend}
                />
              </CardContent>
            </Card>

            {/* ── Panel chi tiết / preview ── */}
            {isDetailOpen && (
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2,
                  overflow: "auto",
                  borderRadius: 0,
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  sx={{
                    mb: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Xem trước: {selectedRow.id}
                  </Typography>
                  <IconButton size="small" onClick={() => setSelectedRow(null)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Tabs
                  value={detailTab}
                  onChange={(_, v) => setDetailTab(v)}
                  sx={{ mb: 2 }}
                >
                  <Tab label="Biên bản" />
                  <Tab label="Quy trình ký" />
                </Tabs>

                {detailTab === 0
                  ? renderPreview()
                  : renderSignProcess(selectedRow)}
              </Paper>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
