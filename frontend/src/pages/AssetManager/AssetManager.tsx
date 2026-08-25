import {
  Delete,
  Inventory2,
  Build,
  ContentCopy,
  ContentCopyTwoTone,
  MenuBookTwoTone,
  Edit,
  Close,
  CalendarMonth,
} from "@mui/icons-material";
import LichTrinhVanDungModal from "./components/AssetLichTrinhVanDungModal";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  Grid,
  ButtonBase,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import PageAction from "../../components/common/PageAction";
import TableCustom from "../../components/common/TableCustom";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import AssetManagerForm from "./components/AssetManagerForm";
import AssetGroupItem from "./components/AssetGroupItem";
import { showConfirmAlert } from "../../components/Alert";
import { useAssetManagerMutation, useAssetPageQuery } from "./Mutation";
import { findById } from "../../utils/helpers";
import { useAllDepartmentsQuery } from "../Department/Mutation";
import { useAllCurrentStatusQuery } from "../CurrentStatus/Mutation";
import {
  useAllAssetGroupQuery,
  useAllTypeAssetByGroupQuery,
  useAllTypeAssetQuery,
} from "../TypeAsset/Mutation";
import { useAllUnitsQuery } from "../Unit/Mutation";
import { useAllReasonIncreaseQuery } from "../ReasonIncrease/Mutation";
import { useAllLoaiSCBDQuery } from "../MaintenanceRepairType/Mutation";
import ImportErrorDialog from "../../components/common/ImportErrorDialog";
import { useAllModelAssetQuery } from "../ModelAsset/Mutation";
import { useDebounce } from "../../hooks/useDebounce";
import {
  BookOpenCheckIcon,
  Eye,
  HistoryIcon,
  Archive,
  UserCheck,
  Building2,
} from "lucide-react";
import AssetHistoryModal from "./components/AssetHistoryModal";
import { useLocation, useNavigate } from "react-router-dom";
import { ShowStatus } from "./config";
import AssetEbookModal from "./components/AssetEbookModal";
import AssetEbookContent from "./components/AssetEbookContent";
import { Action } from "../../utils/const";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useConfig } from "../../hooks/useContext";
import { FilterOption } from "../../components/common/FilterStatusGroup";
import { useTabForm } from "../../redux/useTabForm";
import { hasDraftData } from "../../utils/draftUtils";
import DraftIndicator from "../../components/common/DraftIndicator";
import SyncLoadingModal from "../../components/common/SyncLoadingModal";
import SelectDbDialog from "../../components/common/SelectDbDialog";
import { currentBrandConfig } from "../../config/brandConfig";

interface AssetManagerTabState {
  showForm: boolean;
  showSidebar: boolean;
  selectedAssets: any[];
  readOnly: boolean;
  isCopy: boolean;
  tab: number;
  status: string;
  draftForm?: Record<string, any>;
}

export default function AssetManager({
  isInspectionMode = false,
}: {
  isInspectionMode?: boolean;
}) {
  const { formData, setField } = useTabForm<AssetManagerTabState>(
    isInspectionMode ? "/kiem_dinh_tai_san" : "/quan_ly_tai_san",
  );
  const tab = formData.tab ?? 0;
  const showForm = formData.showForm ?? false;
  const selectedAssets = formData.selectedAssets ?? [];
  const showSidebar = formData.showSidebar ?? false;
  const readOnly = formData.readOnly ?? true;
  const isCopy = formData.isCopy ?? false;
  const status = formData.status ?? "";
  const setTab = (v: number) => setField({ tab: v });
  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setSelectedAssets = (v: any[]) => setField({ selectedAssets: v });
  const setShowSidebar = (v: boolean) => setField({ showSidebar: v });
  const setReadOnly = (v: boolean) => setField({ readOnly: v });
  const setIsCopy = (v: boolean) => setField({ isCopy: v });
  const setStatus = (v: string) => setField({ status: v });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.user);
  const { config } = useConfig();
  const [openSelectDb, setOpenSelectDb] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const handleMinimize = () => setShowForm(false);
  const isMinimized = !showForm && hasDraftData(formData.draftForm);

  const {
    createMutation,
    updateMutation,
    deleteOneMutation,
    deleteManyMutation,
    exportAssetMutation,
    importAssetMutation,
    deleteAllMutation,
    createBatchMutation,
    syncTaiSanMutation,
  } = useAssetManagerMutation((messages) => {
    setImportErrors(messages); // Lưu mảng lỗi vào state
    setOpenErrorModal(true); // Mở Modal MUI hiển thị danh sách lỗi
  });
  const valueDebounce = useDebounce(searchValue, 600);

  const {
    data: assetsPage = { items: [], totalItems: 0, loaiCounts: {} },
    isLoading,
  } = useAssetPageQuery(
    tab < 4 ? tab : -1,
    paginationModel.page,
    paginationModel.pageSize,
    valueDebounce,
    selectedGroup,
    selectedDepartment,
    config?.ngayBaoDangKiem,
    undefined,
    Number(status) >= 1 && Number(status) <= 4 ? undefined : status,
    Number(status) >= 1 && Number(status) <= 4 ? Number(status) : undefined,
  );

  const statusOptions: FilterOption[] = isInspectionMode
    ? [
        {
          label: "Tất cả",
          count: assetsPage.loaiCounts?.["Tat ca"] ?? 0,
          color: "default",
          value: "",
        },
        {
          label: "Đã đăng kiểm",
          count: assetsPage?.loaiCounts?.["Da dang kiem"] ?? 0,
          color: "success",
          value: "DA_DANG_KIEM",
        },
        {
          label: "Sắp đến hạn đăng kiểm",
          count: assetsPage?.loaiCounts?.["Sap den han"] ?? 0,
          color: "warning",
          value: "SAP_DEN_HAN",
        },
        {
          label: "Quá hạn đăng kiểm",
          count: assetsPage?.loaiCounts?.["Qua han"] ?? 0,
          color: "error",
          value: "QUA_HAN",
        },
      ]
    : [
        {
          label: "Tất cả",
          count: assetsPage.loaiCounts?.["Tat ca"] ?? 0,
          color: "default",
          value: "",
        },
        {
          label: "Chuẩn bị bảo dưỡng",
          count: assetsPage?.loaiCounts?.["Chuan bi can bao duong"] ?? 0,
          color: "info",
          value: "1",
        },
        {
          label: "Cần bảo dưỡng",
          count: assetsPage?.loaiCounts?.["Can bao duong"] ?? 0,
          color: "info",
          value: "2",
        },
        {
          label: "Trong kỳ bảo dưỡng",
          count: assetsPage?.loaiCounts?.["Trong ky bao duong"] ?? 0,
          color: "info",
          value: "3",
        },
        {
          label: "Đã bảo dưỡng",
          count: assetsPage?.loaiCounts?.["Da bao duong"] ?? 0,
          color: "info",
          value: "4",
        },
      ];

  const { data: allDepartments = [] } = useAllDepartmentsQuery();
  const { data: assetGroups = [] } = useAllAssetGroupQuery();

  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [openErrorModal, setOpenErrorModal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (location.state?.autoCreate) {
      setField({ draftForm: undefined });
      setShowForm(true);
      setSelectedAssets([]);
      setReadOnly(false);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleRowClick = (params: GridRowParams) => {
    if (!params.row?.maLyLich) {
      return;
    }
    setSelectedAssets([params.row]);
    setShowSidebar(true);
    setShowForm(false);
  };

  const handleEdit = () => {
    setReadOnly(false);
  };

  const handleSave = (values: any[]) => {
    if (values.length > 0) {
      values.forEach((data) => {
        if (data.isNew) {
          createMutation.mutate(data);
        } else {
          updateMutation.mutate(data, {
            onSuccess: () => {
              if (values.length === 1) {
                setSelectedAssets([
                  {
                    ...data,
                    taiSanConList: (data.taiSanConList || []).filter(
                      (item: any) => !item.isDeleted,
                    ),
                    fileDinhKemList: (data.fileDinhKemList || []).filter(
                      (item: any) => item.action !== Action.DELETE,
                    ),
                  },
                ]);
              }
            },
          });
        }
      });
    }
    setShowForm(false);
    setReadOnly(true);
    setIsCopy(false);
    setField({ draftForm: undefined });
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Mã tài sản",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "soThe",
      headerName: "Số thẻ",
      flex: 1,
      minWidth: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenTaiSan",
      headerName: "Tên tài sản",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "ngayVaoSo",
      headerName: "Ngày vào sổ",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "nvNS",
      headerName: "Vốn NS",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (params.row.nvNS || 0).toLocaleString(),
    },
    {
      field: "vonVay",
      headerName: "Vốn vay",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (params.row.vonVay || 0).toLocaleString(),
    },
    {
      field: "vonKhac",
      headerName: "Vốn khác",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (params.row.vonKhac || 0).toLocaleString(),
    },
    {
      field: "ngaySuDung",
      headerName: "Ngày sử dụng",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenDonViHienThoi",
      headerName: "Đơn vị hiện thời",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      // renderCell: (params) =>
      //   findById(allDepartments, params.row.idDonViHienThoi)?.tenPhongBan,
    },
    {
      field: "taiSanConList",
      headerName: "Số lượng TS con",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => params.row.taiSanConList.length || 0,
    },
    {
      field: "tenNhom",
      headerName: "Nhóm tài sản",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenLoai",
      headerName: "Loại tài sản",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      // renderCell: (params) =>
      //   findById(allTypeAssets, params.row.idLoaiTaiSanCon)?.tenLoai,
    },
    {
      field: "tenHienTrang",
      headerName: "Hiện trạng",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      // renderCell: (params) =>
      //   findById(allCurrentStatus, params.row.hienTrang)?.tenHTKT,
    },
    {
      field: "soLuong",
      headerName: "Số lượng",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenDonViTinh",
      headerName: "Đơn vị tính",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      // renderCell: (params) =>
      //   findById(allUnits, params.row.donViTinh)?.tenDonVi,
    },
    {
      field: "kyHieu",
      headerName: "Mã hiệu",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "soKyHieu",
      headerName: "Số mã hiệu",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "trangThaiKiemDinh",
      headerName: "Trạng thái kiểm định",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => ShowStatus(params.row.trangThaiKiemDinh ?? true),
    },
    ...(isInspectionMode
      ? []
      : [
          {
            field: "action",
            headerName: "Hành động",
            width: 200,
            align: "center",
            headerAlign: "center",
            renderCell: (params: any) => (
              <>
                <Tooltip title="Chỉnh sửa">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAssets([{ ...params.row, isNew: false }]);
                      setReadOnly(true);
                      setShowForm(true);
                      setShowSidebar(false);
                    }}
                  >
                    <Edit color="success" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sao chép">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      const { id, ...copyData } = params.row;
                      setSelectedAssets([
                        {
                          ...copyData,
                          id: "",
                          isNew: true,
                          fileDinhKemList: [],
                          taiSanConList: copyData.taiSanConList.map(
                            (item: any) => ({
                              ...item,
                              id: "",
                              idTaiSanCha: "",
                              isInsert: true,
                            }),
                          ),
                        },
                      ]);
                      setIsCopy(true);
                      setReadOnly(false);
                      setShowForm(true);
                    }}
                  >
                    <ContentCopyTwoTone color="primary" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Xóa">
                  <IconButton
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirm = await showConfirmAlert("Xác nhận xóa!");
                      if (confirm.isConfirmed) {
                        deleteOneMutation.mutate(params.row.id);
                      }
                    }}
                  >
                    <Delete color="error" />
                  </IconButton>
                </Tooltip>
              </>
            ),
          } as GridColDef,
        ]),
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <ImportErrorDialog
        open={openErrorModal}
        onClose={() => setOpenErrorModal(false)}
        errors={importErrors}
      />
      <SelectDbDialog
        open={openSelectDb}
        onClose={() => setOpenSelectDb(false)}
        onConfirm={(dbId) => syncTaiSanMutation.mutate(dbId)}
      />
      <SyncLoadingModal
        open={importAssetMutation.isPending || syncTaiSanMutation.isPending}
        title={
          syncTaiSanMutation.isPending
            ? "Đang đồng bộ SQL Server..."
            : "Đang xử lý file Excel..."
        }
      />

      <PageAction
        title={
          isInspectionMode
            ? "Kiểm định máy móc thiết bị"
            : "Quản lý máy móc thiết bị"
        }
        onNewClick={
          isInspectionMode
            ? undefined
            : () => {
                if (isMinimized) {
                  setShowForm(true);
                  return;
                }
                setField({ draftForm: undefined });
                setShowForm(true);
                setSelectedAssets([]);
                setReadOnly(false);
              }
        }
        loading={exportAssetMutation.isPending || importAssetMutation.isPending}
        onExport={
          isInspectionMode ? undefined : () => exportAssetMutation.mutate()
        }
        onImport={
          isInspectionMode
            ? undefined
            : (file) => importAssetMutation.mutate(file)
        }
        // onSyncDb={
        //   isInspectionMode || user?.taiKhoan?.tenDangNhap !== "admin"
        //     ? undefined
        //     : () => setOpenSelectDb(true)
        // }
        showExcel={!isInspectionMode}
      />
      <Box p={2}>
        <Dialog
          open={showForm}
          onClose={handleMinimize}
          maxWidth="xl"
          fullWidth
          PaperProps={{ sx: { height: "90vh" } }}
        >
          <DialogContent
            sx={{
              p: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <AssetManagerForm
              onCancel={() => {
                setShowForm(false);
                setSelectedAssets([]);
                setReadOnly(true);
                setIsCopy(false); // ← thêm
                setField({ draftForm: undefined });
              }}
              onMinimize={handleMinimize} // ← thêm
              selectedAssets={selectedAssets}
              readOnly={readOnly}
              onEdit={handleEdit}
              onSave={handleSave}
              allDepartments={allDepartments}
              assetGroups={assetGroups}
              onFormChange={(values) => setField({ draftForm: values })}
              initialFormData={formData.draftForm}
            />
          </DialogContent>
        </Dialog>

        {isMinimized && <DraftIndicator onClick={() => setShowForm(true)} />}

        {!isInspectionMode && (
          <Paper
            sx={{
              bgcolor: currentBrandConfig.primaryColor,
              p: 2,
              mt: 2,
              width: "100%",
            }}
          >
            <Typography fontWeight={600} color="white">
              Quản lý máy móc thiết bị
            </Typography>
            <Divider sx={{ bgcolor: "white", my: 2 }} />
            <Box
              display="flex"
              gap={2}
              sx={{
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                py: 1,

                // Thanh cuộn mỏng
                "&::-webkit-scrollbar": {
                  height: 6,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(255,255,255,0.6)",
                  borderRadius: 10,
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "rgba(255,255,255,0.2)",
                },
              }}
            >
              {assetGroups
                .filter((e: any) => e.soLuongTaiSan > 0)
                .map((i: any, index: number) => (
                  <AssetGroupItem
                    key={i.id}
                    item={i}
                    selectedGroup={selectedGroup}
                    setSelectedGroup={setSelectedGroup}
                  />
                ))}
            </Box>
          </Paper>
        )}
        <Box>
          <Grid
            container
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              overflow: "hidden",
              alignItems: "stretch",
              mt: 2,
            }}
          >
            <Grid size={{ xs: 12 }} sx={{ borderBottom: "1px solid #e0e0e0" }}>
              <Box
                sx={{
                  width: "100%",
                  overflowX: "auto",
                  display: "flex",
                  gap: 2,
                  p: 2,
                  bgcolor: "#f8fafc",
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
                    label: "Kho thu hồi",
                    subLabel: "Tài sản thu hồi",
                    icon: Archive,
                  },
                  {
                    label: "Đã bàn giao",
                    subLabel: "Máy móc thiết bị đã bàn giao",
                    icon: UserCheck,
                  },
                  {
                    label: "Kho công ty",
                    subLabel: "Tài sản công ty",
                    icon: Building2,
                  },
                ].map((t, idx) => {
                  const IconComponent = t.icon;
                  const isActive = tab === idx;

                  return (
                    <ButtonBase
                      key={idx}
                      onClick={() => setTab(idx)}
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
                          ? `0 10px 20px -5px rgba(${currentBrandConfig.primaryColor}, 0.35)`
                          : "0 2px 4px rgba(148, 163, 184, 0.05)",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          borderColor: isActive
                            ? "transparent"
                            : currentBrandConfig.primaryColor,
                          boxShadow: isActive
                            ? `0 12px 24px -5px rgba(${currentBrandConfig.primaryColor}, 0.45)`
                            : "0 6px 16px rgba(4, 180, 110, 0.08)",
                          bgcolor: isActive
                            ? undefined
                            : "rgba(4, 180, 110, 0.02)",
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
                          color: isActive
                            ? "#ffffff"
                            : currentBrandConfig.primaryColor,
                          transition: "all 0.25s ease",
                          mb: 1.5,
                        }}
                      >
                        <IconComponent size={20} />
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
                            color: isActive
                              ? "rgba(255,255,255,0.75)"
                              : "#94a3b8",
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
            </Grid>
            <Grid
              size={{ xs: showSidebar ? 6 : 12 }}
              sx={{
                transition: "all 0.3s ease",
                borderRight: showSidebar ? "1px solid #e0e0e0" : "none",
              }}
            >
              <TableCustom
                tableId="assetManager"
                title={
                  tab === 0
                    ? `${isInspectionMode ? "Kiểm định máy móc thiết bị" : "Quản lý máy móc thiết bị"} - Kho thu hồi`
                    : tab === 1
                      ? `${isInspectionMode ? "Kiểm định máy móc thiết bị" : "Quản lý máy móc thiết bị"} - Đã bàn giao`
                      : tab === 2
                        ? `${isInspectionMode ? "Kiểm định máy móc thiết bị" : "Quản lý máy móc thiết bị"} - Kho công ty`
                        : ""
                }
                columns={columns}
                rows={assetsPage.items}
                total={assetsPage.totalItems}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                loading={tab < 3 ? isLoading : false}
                onRowClick={!isInspectionMode ? handleRowClick : undefined}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                checkboxSelection={!isInspectionMode}
                extraActions={
                  !isInspectionMode &&
                  selectedIds.length > 0 && (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        color="info"
                        onClick={() => {
                          const mapped = assetsPage.items.filter((item: any) =>
                            selectedIds.includes(item.id || item.soThe),
                          );
                          setSelectedAssets(mapped);
                          setReadOnly(true);
                          setShowForm(true);
                          setShowSidebar(false);
                        }}
                      >
                        Chỉnh sửa ({selectedIds.length})
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CalendarMonth />}
                        onClick={() => {
                          setOpenScheduleModal(true);
                        }}
                        sx={{
                          bgcolor: "#7c3aed",
                          textTransform: "none",
                          fontWeight: 600,
                          "&:hover": { bgcolor: "#6d28d9" },
                        }}
                      >
                        Lịch trình vận dụng ({selectedIds.length})
                      </Button>
                    </>
                  )
                }
                onDelete={
                  isInspectionMode ? undefined : deleteManyMutation.mutate
                }
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                isDepreciation={!isInspectionMode}
                departments={allDepartments}
                isFilterDepartment={tab === 1}
                selectedDepartment={selectedDepartment}
                setSelectedDepartment={setSelectedDepartment}
                onDeleteAll={
                  isInspectionMode ? undefined : deleteAllMutation.mutate
                }
                showDeleteAll={
                  !isInspectionMode && user?.taiKhoan?.tenDangNhap === "admin"
                }
                statusOptions={isInspectionMode ? statusOptions : []}
                onStatusChange={(value) => {
                  setStatus(value);
                }}
                statusValue={status}
                onImportExcel={
                  isInspectionMode
                    ? undefined
                    : (file) => importAssetMutation.mutate(file)
                }
                onExportExcel={
                  isInspectionMode
                    ? undefined
                    : () => exportAssetMutation.mutate()
                }
              />
            </Grid>
            {showSidebar && (
              <Grid
                size={{ xs: 6 }}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: "white",
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <AssetEbookContent
                    selectedAsset={selectedAssets[0]}
                    readOnly={readOnly}
                    onEdit={handleEdit}
                    onCancel={() => {
                      setReadOnly(true);
                    }}
                    onClose={() => {
                      setShowSidebar(false);
                      setSelectedAssets([]);
                      setReadOnly(true);
                    }}
                    onSave={(values) => {
                      handleSave([values]);
                    }}
                    assetGroups={assetGroups}
                    allDepartments={allDepartments}
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
      <AssetHistoryModal
        open={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedAssets([]);
          setShowForm(false);
        }}
        selectedAsset={selectedAssets[0]}
      />
      <LichTrinhVanDungModal
        open={openScheduleModal}
        onClose={() => {
          setOpenScheduleModal(false);
          setSelectedIds([]);
        }}
        selectedAssets={assetsPage.items.filter((item: any) =>
          selectedIds.includes(item.id || item.soThe),
        )}
      />
    </Box>
  );
}
