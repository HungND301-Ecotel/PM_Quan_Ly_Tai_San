import { useState } from "react";
import {
  Box,
  Chip,
  Alert,
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
} from "@mui/icons-material";
import PageAction from "../../components/common/PageAction";
import TableCustom from "../../components/common/TableCustom";
import { useSignBatch } from "../../hooks/useSignBatch";
import { SignBatchModal } from "../../components/SignDocument/Signbatchmodal";
import {
  useAcceptancePageQuery,
  useMaintenanceInspectionPageQuery,
  useMaintenanceMaterialAssessmentPageQuery,
  useMaintenancePlanningPageQuery,
  useMaintenanceRepairPageQuery,
  useMaterialRequisitionPageQuery,
} from "./mutation";
import { useQuyetToanPageQuery } from "./mutation/QuyetToan";
import { useMaintenanceJobAssignmentPageQuery } from "./mutation/JobAssignment";
import { useDebounce } from "../../hooks/useDebounce";
import {
  AcceptanceTestAdapter,
  InspectionAdapter,
  MaterialAssessmentAdapter,
  PlanAdapter,
  TechnicalReportAdapter,
  RepairAdapter,
  JobAssignmentAdapter,
  MaterialRequisitionAdapter,
} from "./Adapter";
import { useSelector } from "react-redux";
import { useAllPositionsQuery } from "../Position/Mutation";
import { useAllStaffsQuery } from "../Staff/Mutation";
import { useAllDepartmentsQuery } from "../Department/Mutation";
import {
  listSigneInfo,
  generateBienBanKeHoachPdf,
  generateTechnicalReportPdf,
  generateSuaChuaPdf,
  generateGiamDinhPdf,
  generateNghiemThuPdf,
  generateDanhGiaVatTuPdf,
  generatePhieuGiaoViecPdf,
  generatePhieuLinhVatTuPdf,
  generateQuyetToanPdf,
  getPermissionSigning,
  getAutoSignatureType,
  ShowPermissionSigning,
  canSign,
  showStatus,
  showDownloadFile,
} from "./config";

import SignDocumentForm from "./components/signdocument/SignDocumentForm";
import {
  AlertTriangle,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  EditIcon,
  FileSearch,
  FileWarning,
  Wrench,
} from "lucide-react";
import { useMaintenanceMutation } from "./mutation";
import { SignaturesData } from "../../components/SignDocument/types";
import { useMenuData } from "../../hooks/useMenuData";
import Filter from "./components/Filter";
import { currentBrandConfig } from "../../config/brandConfig";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import Swal from "sweetalert2";
import { handleSigning } from "../../utils/efySigning";
import dayjs from "dayjs";
import { useMaintenanceTechnicalReportPageQuery } from "./mutation/TechnicalReport";

export default function MaintenanceApprovalPage() {
  const signBatch = useSignBatch();
  const { user } = useSelector((state: any) => state.user);

  const [activeTab, setActiveTab] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [justSigned, setJustSigned] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedItem, setSelectedItem] = useState<any[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const { data: positions } = useAllPositionsQuery();
  const { data: staffs } = useAllStaffsQuery();
  const { data: departments } = useAllDepartmentsQuery();

  const { counts } = useMenuData();

  const searchDebounce = useDebounce(searchValue, 500);

  const {
    data: technicalReportPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
  } = useMaintenanceTechnicalReportPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    true,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 1,
  );
  const {
    data: planPaged = { items: [], totalItems: 0, trangThaiCounts: {} },
    isLoading,
  } = useMaintenancePlanningPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    true,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 0,
  );

  const {
    data: repairPaged = { items: [], totalItems: 0, trangThaiCounts: {} },
    isLoading: isLoadingRepair,
  } = useMaintenanceRepairPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    true,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 3,
  );

  const {
    data: inspectionPaged = { items: [], totalItems: 0, trangThaiCounts: {} },
    isLoading: isLoadingInspection,
  } = useMaintenanceInspectionPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    true,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 2,
  );

  const {
    data: jobAssignmentPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
    isLoading: isLoadingJobAssignment,
  } = useMaintenanceJobAssignmentPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    true,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 4,
  );

  // phiếu vật tư
  const {
    data: materialRequisitionPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
    isLoading: isLoadingMaterialRequisition,
  } = useMaterialRequisitionPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    true,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 5,
  );

  const {
    data: acceptanceTestPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
    isLoading: isLoadingNghiemThuMayMoc,
  } = useAcceptancePageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    undefined,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    true,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 6,
  );

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
    undefined,
    user?.taiKhoan?.tenDangNhap,
    true,
    dateFrom,
    undefined,
    dateTo,
    activeTab === 7,
  );

  const {
    data: quyetToanPaged = {
      items: [],
      totalItems: 0,
      trangThaiCounts: {},
    },
    isLoading: isLoadingQuyetToan,
  } = useQuyetToanPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
    undefined,
    user?.taiKhoan?.tenDangNhap,
    true,
    dateFrom,
    dateTo,
    undefined,
    activeTab === 8,
  );

  const { signMutation } = useMaintenanceMutation(
    activeTab === 0
      ? "maintenancePlanningPage"
      : activeTab === 1
        ? "maintenanceTechnicalReportPage"
        : activeTab === 2
          ? "inspectionPage"
          : activeTab === 3
            ? "repairPage"
            : activeTab === 4
              ? "jobAssignmentPage"
              : activeTab === 5
                ? "materialRequisitionPage"
                : activeTab === 6
                  ? "nghiemThuPage"
                  : activeTab === 7
                    ? "materialAssessmentPage"
                    : activeTab === 8
                      ? "quyetToanPage"
                      : "",
    activeTab === 0
      ? "kehoach-suachua"
      : activeTab === 1
        ? "baocaokythuat"
        : activeTab === 2
          ? "giamdinh"
          : activeTab === 3
            ? "suachua"
            : activeTab === 4
              ? "phieugiaoviec"
              : activeTab === 5
                ? "phieulinhvattu"
                : activeTab === 6
                  ? "nghiemthu"
                  : activeTab === 7
                    ? "danhgia-vattu"
                    : activeTab === 8
                      ? "quyettoan"
                      : "",
    activeTab,
  );

  const allRows = [
    { ...planPaged, items: planPaged.items.map(PlanAdapter) },
    {
      ...technicalReportPaged,
      items: technicalReportPaged.items.map(TechnicalReportAdapter),
    },
    { ...inspectionPaged, items: inspectionPaged.items.map(InspectionAdapter) },
    { ...repairPaged, items: repairPaged.items.map(RepairAdapter) },
    {
      ...jobAssignmentPaged,
      items: jobAssignmentPaged.items.map(JobAssignmentAdapter),
    },
    {
      ...materialRequisitionPaged,
      items: (materialRequisitionPaged.items || []).map(
        MaterialRequisitionAdapter,
      ),
    },
    {
      ...acceptanceTestPaged,
      items: (acceptanceTestPaged.items || []).map(AcceptanceTestAdapter),
    },
    {
      ...materialAssessmentPaged,
      items: (materialAssessmentPaged.items || []).map(
        MaterialAssessmentAdapter,
      ),
    },
    {
      ...quyetToanPaged,
      items: (quyetToanPaged.items || []).map(MaterialAssessmentAdapter),
    },
  ];

  const tabConfigs = [
    { label: "Kế hoạch", icon: <AssignmentOutlined />, idLabel: "Mã KH" },
    {
      label: "Báo cáo kỹ thuật",
      icon: <FactCheckOutlined />,
      idLabel: "Mã báo cáo kỹ thuật",
    },
    {
      label: "BB Giám định",
      icon: <FactCheckOutlined />,
      idLabel: "Số BB giám định",
    },
    {
      label: "Lệnh sửa chữa",
      icon: <BuildOutlined />,
      idLabel: "Lệnh sửa chữa",
    },
    {
      label: "Phiếu giao việc",
      icon: <AssignmentOutlined />,
      idLabel: "Mã phiếu",
      field: "id",
    },
    {
      label: "Phiếu vật tư",
      icon: <PlaylistAddCheckOutlined />,
      idLabel: "Số phiếu vật tư",
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
    {
      label: "Quyết toán",
      icon: <AssignmentOutlined />,
      idLabel: "Mã quyết toán",
      field: "id",
    },
  ];

  const parentColumnConfigs: Record<
    number,
    { field: string; headerName: string; key?: string }[]
  > = {
    1: [{ field: "planId", headerName: "Mã kế hoạch" }],
    2: [
      {
        field: "idBaoCaoKyThuat",
        headerName: "Mã báo cáo kỹ thuật",
      },
    ],
    3: [{ field: "idGiamDinh", headerName: "Mã giám định" }],
    4: [{ field: "idSuaChua", headerName: "Mã lệnh SC" }],
    5: [{ field: "idPhieuGiaoViec", headerName: "Mã phiếu giao việc" }],
    6: [{ field: "idBienBan", headerName: "Mã phiếu lĩnh vật tư" }],
    7: [{ field: "idNghiemThu", headerName: "Mã BB nghiệm thu" }],
    8: [{ field: "idDanhGia", headerName: "Mã BB đánh giá" }],
  };

  const currentAllRows = allRows[activeTab];

  const handleSign = (data: SignaturesData[], item?: any) => {
    // ponytail: return mutateAsync promise so batch signing can await and catch individual errors
    return signMutation.mutateAsync(
      {
        SignaturesData: data,
        asset: item || selectedRow || selectedItem,
      },
      {
        onSuccess: () => {
          if (!item) {
            setSelectedItem([]);
            setSelectedIds([]);
            setSelectedRow(null);
          }
        },
      },
    );
  };

  const buildColumns = (collapsed: boolean) => {
    const parentCols = (parentColumnConfigs[activeTab] ?? []).map((cfg) => ({
      field: cfg.field,
      headerName: cfg.headerName,
      width: 160,
      renderCell: (params: any) => {
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
      {
        field: tabConfigs[activeTab].field || "id",
        headerName: tabConfigs[activeTab].idLabel,
        width: 160,
      },
      ...parentCols,
      { field: "moTa", headerName: "Mô tả", flex: 1, minWidth: 200 },
    ];

    columns.push(
      { field: "ngayTao", headerName: "Ngày tạo", width: 120 },
      {
        field: "trangThaiKy",
        headerName: "Trạng thái ký",
        width: 200,
        renderCell: (params: any) =>
          ShowPermissionSigning(getPermissionSigning(params.row, user)),
      },
      {
        field: "trangThai",
        headerName: "Trạng thái",
        width: 140,
        renderCell: (params: any) => showStatus(params.row.trangThai),
      },
      {
        field: "sign",
        headerName: "Ký",
        width: 140,
        renderCell: (params: any) => (
          <IconButton
            aria-label="edit"
            onClick={(e) => {
              e.stopPropagation();
              if (canSign([params.row], user)) {
                setSelectedRow(params.row);
                setIsSigning(true);
              }
            }}
            size="small"
          >
            <EditIcon color="#1976d2" />
          </IconButton>
        ),
      },
    );

    return columns;
  };

  const renderPreview = () => {
    if (!selectedRow) return null;
    switch (activeTab) {
      case 0:
        return (
          <SignDocumentForm
            selectedIds={[selectedRow.id]}
            onCancel={() => {
              setSelectedRow(null);
              setIsDetailOpen(false);
            }}
            onSign={() => {}}
            data={selectedRow}
            staffs={staffs || []}
            departments={departments || []}
            positions={positions || []}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              generateBienBanKeHoachPdf(
                selectedRow,
                staffs,
                departments,
                positions,
              )
            }
          />
        );
      case 1:
        return (
          <SignDocumentForm
            selectedIds={[selectedRow.id]}
            onCancel={() => {
              setSelectedRow(null);
              setIsDetailOpen(false);
            }}
            onSign={() => {}}
            data={selectedRow}
            staffs={staffs || []}
            departments={departments || []}
            positions={positions || []}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              generateTechnicalReportPdf(
                selectedRow,
                staffs,
                departments,
                positions,
              )
            }
          />
        );
      case 2:
        return (
          <SignDocumentForm
            selectedIds={[selectedRow.id]}
            onCancel={() => {
              setSelectedRow(null);
              setIsDetailOpen(false);
            }}
            onSign={() => {}}
            data={selectedRow}
            staffs={staffs || []}
            departments={departments || []}
            positions={positions || []}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={false}
            generatePdf={() =>
              generateGiamDinhPdf(selectedRow, staffs, departments, positions)
            }
          />
        );
      case 3:
        return (
          <SignDocumentForm
            selectedIds={[selectedRow.id]}
            onCancel={() => {
              setSelectedRow(null);
              setIsDetailOpen(false);
            }}
            onSign={() => {}}
            data={selectedRow}
            staffs={staffs || []}
            departments={departments || []}
            positions={positions || []}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={false}
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
            selectedIds={[selectedRow.id]}
            onCancel={() => {
              setSelectedRow(null);
              setIsDetailOpen(false);
            }}
            onSign={() => {}}
            data={selectedRow}
            staffs={staffs || []}
            departments={departments || []}
            positions={positions || []}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              generatePhieuGiaoViecPdf(
                selectedRow,
                staffs,
                departments,
                positions,
              )
            }
          />
        );
      case 5:
        return (
          <SignDocumentForm
            selectedIds={[selectedRow.id]}
            onCancel={() => {
              setSelectedRow(null);
              setIsDetailOpen(false);
            }}
            onSign={() => {}}
            data={selectedRow}
            staffs={staffs || []}
            departments={departments || []}
            positions={positions || []}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={false}
            generatePdf={() =>
              generatePhieuLinhVatTuPdf(
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
            selectedIds={[selectedRow.id]}
            onCancel={() => {
              setSelectedRow(null);
              setIsDetailOpen(false);
            }}
            onSign={() => {}}
            data={selectedRow}
            staffs={staffs || []}
            departments={departments || []}
            positions={positions || []}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={false}
            generatePdf={() =>
              generateNghiemThuPdf(selectedRow, staffs, departments, positions)
            }
          />
        );
      case 7:
        return (
          <SignDocumentForm
            selectedIds={[selectedRow.id]}
            onCancel={() => {
              setSelectedRow(null);
              setIsDetailOpen(false);
            }}
            onSign={() => {}}
            data={selectedRow}
            staffs={staffs || []}
            departments={departments || []}
            positions={positions || []}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={false}
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
      case 8:
        return (
          <SignDocumentForm
            selectedIds={[selectedRow.id]}
            onCancel={() => {
              setSelectedRow(null);
              setIsDetailOpen(false);
            }}
            onSign={() => {}}
            data={selectedRow}
            staffs={staffs || []}
            departments={departments || []}
            positions={positions || []}
            fullscreen={false}
            showSignerSidebar={false}
            showHeader={true}
            generatePdf={() =>
              generateQuyetToanPdf(
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

  return (
    <>
      {selectedRow && isSigning && activeTab === 0 && (
        <SignDocumentForm
          selectedIds={[selectedRow?.id]}
          onCancel={() => {
            setIsSigning(false);
            setSelectedRow(null);
          }}
          onSign={handleSign}
          data={selectedRow}
          staffs={staffs || []}
          departments={departments || []}
          positions={positions || []}
          fullscreen={true}
          showSignerSidebar={true}
          generatePdf={() =>
            generateBienBanKeHoachPdf(
              selectedRow,
              staffs,
              departments,
              positions,
            )
          }
        />
      )}

      {selectedRow && isSigning && activeTab === 1 && (
        <SignDocumentForm
          selectedIds={[selectedRow?.id]}
          onCancel={() => {
            setIsSigning(false);
            setSelectedRow(null);
          }}
          onSign={handleSign}
          data={selectedRow}
          staffs={staffs || []}
          departments={departments || []}
          positions={positions || []}
          fullscreen={true}
          showSignerSidebar={true}
          generatePdf={() =>
            generateTechnicalReportPdf(
              selectedRow,
              staffs,
              departments,
              positions,
            )
          }
        />
      )}

      {selectedRow && isSigning && activeTab === 2 && (
        <SignDocumentForm
          selectedIds={[selectedRow?.id]}
          onCancel={() => {
            setIsSigning(false);
            setSelectedRow(null);
          }}
          onSign={handleSign}
          data={selectedRow}
          staffs={staffs || []}
          departments={departments || []}
          positions={positions || []}
          fullscreen={true}
          showSignerSidebar={true}
          generatePdf={() =>
            generateGiamDinhPdf(selectedRow, staffs, departments, positions)
          }
        />
      )}

      {selectedRow && isSigning && activeTab === 3 && (
        <SignDocumentForm
          selectedIds={[selectedRow?.id]}
          onCancel={() => {
            setIsSigning(false);
            setSelectedRow(null);
          }}
          onSign={handleSign}
          data={selectedRow}
          staffs={staffs || []}
          departments={departments || []}
          positions={positions || []}
          fullscreen={true}
          showSignerSidebar={true}
          generatePdf={() =>
            generateSuaChuaPdf(selectedRow, staffs, departments, positions)
          }
        />
      )}
      {selectedRow && isSigning && activeTab === 4 && (
        <SignDocumentForm
          selectedIds={[selectedRow?.id]}
          onCancel={() => {
            setIsSigning(false);
            setSelectedRow(null);
          }}
          onSign={handleSign}
          data={selectedRow}
          staffs={staffs || []}
          departments={departments || []}
          positions={positions || []}
          fullscreen={true}
          showSignerSidebar={true}
          generatePdf={() =>
            generatePhieuGiaoViecPdf(
              selectedRow,
              staffs,
              departments,
              positions,
            )
          }
        />
      )}
      {selectedRow && isSigning && activeTab === 5 && (
        <SignDocumentForm
          selectedIds={[selectedRow?.id]}
          onCancel={() => {
            setIsSigning(false);
            setSelectedRow(null);
          }}
          onSign={handleSign}
          data={selectedRow}
          staffs={staffs || []}
          departments={departments || []}
          positions={positions || []}
          fullscreen={true}
          showSignerSidebar={true}
          generatePdf={() =>
            generatePhieuLinhVatTuPdf(
              selectedRow,
              staffs,
              departments,
              positions,
            )
          }
        />
      )}
      {selectedRow && isSigning && activeTab === 6 && (
        <SignDocumentForm
          selectedIds={[selectedRow?.id]}
          onCancel={() => {
            setIsSigning(false);
            setSelectedRow(null);
          }}
          onSign={handleSign}
          data={selectedRow}
          staffs={staffs || []}
          departments={departments || []}
          positions={positions || []}
          fullscreen={true}
          showSignerSidebar={true}
          generatePdf={() =>
            generateNghiemThuPdf(
              selectedRow,
              staffs || [],
              departments || [],
              positions || [],
            )
          }
        />
      )}
      {selectedRow && isSigning && activeTab === 7 && (
        <SignDocumentForm
          selectedIds={[selectedRow?.id]}
          onCancel={() => {
            setIsSigning(false);
            setSelectedRow(null);
          }}
          onSign={handleSign}
          data={selectedRow}
          staffs={staffs || []}
          departments={departments || []}
          positions={positions || []}
          fullscreen={true}
          showSignerSidebar={true}
          generatePdf={() =>
            generateDanhGiaVatTuPdf(selectedRow, staffs, departments, positions)
          }
        />
      )}
      {selectedRow && isSigning && activeTab === 8 && (
        <SignDocumentForm
          selectedIds={[selectedRow?.id]}
          onCancel={() => {
            setIsSigning(false);
            setSelectedRow(null);
          }}
          onSign={handleSign}
          data={selectedRow}
          staffs={staffs || []}
          departments={departments || []}
          positions={positions || []}
          fullscreen={true}
          showSignerSidebar={true}
          generatePdf={() =>
            generateQuyetToanPdf(selectedRow, staffs, departments, positions)
          }
        />
      )}

      <PageAction title="Ký duyệt biên bản" />

      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {justSigned && (
          <Alert severity="success" onClose={() => setJustSigned(null)}>
            Đã ký duyệt thành công: <strong>{justSigned}</strong>
          </Alert>
        )}

        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {/* Tab bar */}
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
                count: counts.signCounts?.totalPlan || 0,
              },
              {
                label: "Báo cáo kỹ thuật",
                subLabel: "Báo cáo kỹ thuật",
                icon: ClipboardList,
                count: counts.signCounts?.totalTechnicalReport || 0,
              },
              {
                label: "BB Giám định",
                subLabel: "Giám định máy móc",
                icon: FileSearch,
                count: counts.signCounts?.totalInspection || 0,
              },
              {
                label: "Lệnh sửa chữa",
                subLabel: "Lệnh sửa chữa thiết bị",
                icon: Wrench,
                count: counts.signCounts?.totalRepair || 0,
              },
              {
                label: "Phiếu giao việc",
                subLabel: "Bàn giao công việc ",
                icon: AlertTriangle,
                count: counts.signCounts?.totalJobAssignment || 0,
              },
              {
                label: "Phiếu lĩnh vật tư",
                subLabel: "Lĩnh vật tư sửa chữa",
                icon: AlertTriangle,
                count: counts.signCounts?.totalMaterialRequisition || 0,
              },
              {
                label: "BB Nghiệm thu",
                subLabel: "Nghiệm thu hoàn thành",
                icon: ClipboardCheck,
                count: counts.signCounts?.totalAcceptance || 0,
              },
              {
                label: "BB Đánh giá VT",
                subLabel: "Đánh giá vật tư tiêu hao",
                icon: Boxes,
                count: counts.signCounts?.totalMaterialAssessment || 0,
              },
              {
                label: "Quyết toán",
                subLabel: "Quyết toán vật tư",
                icon: ClipboardCheck,
                count: counts.signCounts?.totalSettlement || 0,
              },
            ].map((tab, idx) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === idx;

              return (
                <ButtonBase
                  key={idx}
                  onClick={() => {
                    setActiveTab(idx);
                    setSelectedIds([]);
                    setSearchValue("");
                    setDateFrom("");
                    setDateTo("");
                    setSelectedRow(null);
                    setSelectedItem([]);
                    setIsDetailOpen(false);
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
                          minWidth: 20,
                          height: 20,
                          px: 0.8,
                          borderRadius: "10px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: isActive
                            ? currentBrandConfig.primaryColor
                            : "#ffffff",
                          background: isActive
                            ? "#ffffff"
                            : "linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)",
                          boxShadow: isActive
                            ? "none"
                            : "0 4px 8px rgba(239, 68, 68, 0.35)",
                        }}
                      >
                        {tab.count}
                      </Box>
                    )}
                  </Box>

                  {/* Bottom Section: Text Labels */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{
                        fontSize: "0.85rem",
                        lineHeight: 1.2,
                        mb: 0.2,
                      }}
                    >
                      {tab.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.7rem",
                        opacity: isActive ? 0.85 : 0.6,
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
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
          />

          <SignBatchModal
            open={signBatch.isOpen}
            items={signBatch.items}
            onClose={() => {
              signBatch.closeModal();
              setSelectedIds([]);
              setSelectedItem([]);
              setSelectedRow(null);
            }}
          />

          {/* Nội dung: bảng + panel detail song song */}
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
                  title="Biên bản chờ ký duyệt"
                  rows={currentAllRows.items}
                  columns={buildColumns(isDetailOpen)}
                  total={currentAllRows.totalItems}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  paginationMode="client"
                  checkboxSelection={!isDetailOpen}
                  selectedIds={selectedIds}
                  onSelectionChange={(ids) => {
                    setSelectedIds(ids);
                    const selected = currentAllRows.items.filter((row: any) =>
                      ids.includes(row.id),
                    );
                    setSelectedItem(selected);
                  }}
                  searchValue={searchValue}
                  setSearchValue={setSearchValue}
                  showDelete={false}
                  onRowClick={(params) => {
                    setSelectedRow(params.row);
                    setDetailTab(0);
                    setIsDetailOpen(true);
                  }}
                  isRowSelectable={(params) => canSign([params.row], user)}
                  showStatusFilter={false}
                  canSign={(items) => items.length >= 1}
                  handleSignDocuments={async (items) => {
                    // ponytail: show confirmation modal before proceeding to sign batch
                    const confirmResult = await showConfirmAlert(
                      "Bạn có chắc chắn muốn ký duyệt các kế hoạch đã chọn?",
                    );
                    if (!confirmResult.isConfirmed) return;

                    // Show loading alert using Swal
                    Swal.fire({
                      title: "Đang xử lý...",
                      text: "Vui lòng chờ trong khi hệ thống ký duyệt các tài liệu",
                      allowOutsideClick: false,
                      allowEscapeKey: false,
                      showConfirmButton: false,
                      didOpen: () => {
                        Swal.showLoading();
                      },
                    });

                    const finalSignedItems: any[] = [];
                    let successCount = 0;
                    let errorCount = 0;

                    const employee = staffs?.find(
                      (s: any) => s.id === user?.taiKhoan?.tenDangNhap,
                    );
                    if (!employee) {
                      Swal.close();
                      showErrorAlert("Không tìm thấy thông tin nhân viên");
                      return;
                    }

                    // Get PDF generator function based on activeTab
                    const pdfGenerator =
                      activeTab === 0
                        ? generateBienBanKeHoachPdf
                        : activeTab === 1
                          ? generateTechnicalReportPdf
                          : activeTab === 2
                            ? generateGiamDinhPdf
                            : activeTab === 3
                              ? generateSuaChuaPdf
                              : activeTab === 4
                                ? generatePhieuGiaoViecPdf
                                : activeTab === 5
                                  ? generatePhieuLinhVatTuPdf
                                  : activeTab === 6
                                    ? generateNghiemThuPdf
                                    : activeTab === 7
                                      ? generateDanhGiaVatTuPdf
                                      : generateQuyetToanPdf;

                    for (const item of items) {
                      try {
                        const signatureType = getAutoSignatureType(employee);
                        if (signatureType === 0) {
                          finalSignedItems.push({
                            ...item,
                            status: "error",
                            errorMessage:
                              "Bạn chưa thiết lập loại chữ ký hợp lệ.",
                          });
                          errorCount++;
                          continue;
                        }

                        let chuKySo = "";
                        if ([3, 4, 5].includes(signatureType)) {
                          if (!employee.savePin) {
                            finalSignedItems.push({
                              ...item,
                              status: "error",
                              errorMessage: `Bạn chưa lưu mã PIN để thực hiện ký số lô cho tài liệu ${item.id}`,
                            });
                            errorCount++;
                            continue;
                          }
                          const hash = await handleSigning(
                            user?.taiKhoan?.tenDangNhap,
                            item.id,
                          );
                          if (!hash) {
                            finalSignedItems.push({
                              ...item,
                              status: "error",
                              errorMessage: "Ký số EFY thất bại",
                            });
                            errorCount++;
                            continue;
                          }
                          chuKySo = hash;
                        }

                        const result = await pdfGenerator(
                          item,
                          staffs || [],
                          departments || [],
                          positions || [],
                        );
                        const coords = result.coordinates[
                          user?.taiKhoan?.tenDangNhap
                        ] ?? {
                          xRatio: 0.2,
                          yRatio: 0.8,
                          page: 1,
                        };
                        const displayWidth = 800;
                        const baseWidthPx = 120;

                        const signatureData: SignaturesData = {
                          stt: 1,
                          id: `temp-${Date.now()}`,
                          idTaiLieu: item.id,
                          idNguoiKy: user?.taiKhoan?.tenDangNhap,
                          loaiKy: signatureType,
                          ngayKy: dayjs(new Date()).format(
                            "YYYY-MM-DD HH:mm:ss",
                          ),
                          x: coords.xRatio,
                          y: coords.yRatio,
                          page: coords.page || 1,
                          chuKyNhay:
                            (signatureType === 1 || signatureType === 5) &&
                            employee.chuKyNhay,
                          chuKyThuong:
                            (signatureType === 2 || signatureType === 4) &&
                            employee.chuKyThuong,
                          width: baseWidthPx,
                          widthRatio: baseWidthPx / displayWidth,
                          scale: 1,
                          chuKySo: chuKySo,
                          isLocked: false,
                        };

                        // Call mutateAsync directly and suppress default alerts
                        await signMutation.mutateAsync({
                          SignaturesData: [signatureData],
                          asset: item,
                          suppressAlert: true,
                        });

                        finalSignedItems.push({
                          ...item,
                          status: "success",
                        });
                        successCount++;
                      } catch (error: any) {
                        console.error(`Lỗi ký biên bản ${item.id}:`, error);
                        const errorMsg =
                          error?.response?.data?.message ||
                          error?.message ||
                          "Lỗi ký biên bản";
                        finalSignedItems.push({
                          ...item,
                          status: "error",
                          errorMessage: errorMsg,
                        });
                        errorCount++;
                      }
                    }

                    // Close loading alert
                    Swal.close();

                    // Show exactly one success or status alert, and wait for user to dismiss it
                    if (successCount > 0 && errorCount === 0) {
                      await showSuccessAlert(
                        `Ký thành công tất cả ${successCount} biên bản!`,
                      );
                    } else if (successCount > 0 && errorCount > 0) {
                      await showErrorAlert(
                        `Ký duyệt hoàn tất: ${successCount} thành công, ${errorCount} thất bại.`,
                      );
                    } else {
                      await showErrorAlert(
                        `Tất cả ${errorCount} biên bản đều ký thất bại.`,
                      );
                    }

                    // Open the summary modal with pre-filled results
                    signBatch.openModal(finalSignedItems);
                  }}
                  onSign={() => {}}
                />
              </CardContent>
            </Card>

            {/* ── Panel chi tiết / preview ── */}
            {isDetailOpen && selectedRow && (
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
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedRow(null);
                      setIsDetailOpen(false);
                    }}
                  >
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
