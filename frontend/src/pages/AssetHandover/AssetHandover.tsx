import { SyntheticEvent, useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  ButtonBase,
  Typography,
} from "@mui/material";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";

import TableCustom from "../../components/common/TableCustom";
import PageAction from "../../components/common/PageAction";
import AssetHandoverForm from "./components/AssetHandoverForm";
import SignerSidebar from "./components/SignerSidebar";

import { AssetHandoverData, AssetTransferData, SignaturesData } from "./types";
import {
  useAssetHandoverMutation,
  useAssetHandoverPageQuery,
} from "./Mutation";
import { Eye, Trash2, ListPlus, Edit, FileText, Truck } from "lucide-react";
import { VisibilityOff } from "@mui/icons-material";
import { ClassOutlined, TableChart } from "@mui/icons-material";
import { FilterOption } from "../../components/common/FilterStatusGroup";
import {
  showDownloadFile,
  showShareStatus,
  showStatusDocument,
} from "../AssetTransfer/config";
import { useSelector } from "react-redux";
import {
  canSign,
  getPermissionSigning,
  handleSendToSigner,
  handleSignDocument,
  isCheckShowDelete,
  isCheckShowShare,
  ShowPermissionSigning,
  showStatus,
  StatusHandover,
} from "./config";
import { showConfirmAlert } from "../../components/Alert";
import SignDocumentForm from "./components/SignDocumentForm";
import SignDocumentTransferForm from "../AssetTransfer/components/SignDocumentForm";

import dayjs from "dayjs";
import {
  useAssetTranferMutation,
  useAssetTransferPageQuery,
} from "../AssetTransfer/Mutation";
import { useDebounce } from "../../hooks/useDebounce";
import { useAllStaffsQuery, useStaffMutation } from "../Staff/Mutation";
import { useAllDepartmentsQuery } from "../Department/Mutation";
import { useAllUnitsQuery } from "../Unit/Mutation";
import { useAllPositionsQuery } from "../Position/Mutation";
import { useAllCurrentStatusQuery } from "../CurrentStatus/Mutation";
import S3Service from "../../services/S3Service";
import api from "../../config/api.config";
import { getAssetHandoverCount } from "../../utils/helpers";
import { useTabForm } from "../../redux/useTabForm";
import { hasDraftData } from "../../utils/draftUtils";
import DraftIndicator from "../../components/common/DraftIndicator";
import { currentBrandConfig } from "../../config/brandConfig";
import { useMenuData } from "../../hooks/useMenuData";

interface AssetHandoverTabState {
  showForm: boolean;
  selectedRow: any | null;
  showSidebar: boolean;
  readOnly: boolean;
  activeTab: number;
  tabValue: number;
  sidebarMode: "document" | "signer" | null;
  currentStatus: string;
  currentType: string;
  showSignDocument: boolean;
  isFullPageSign: boolean;
  selectedDocument: any | null;
  draftForm?: Record<string, any>;
}

export default function AssetHandover() {
  const { formData, setField } =
    useTabForm<AssetHandoverTabState>("/ban_giao_tai_san");
  const showForm = formData.showForm ?? false;
  const selectedRow = formData.selectedRow ?? null;
  const readOnly = formData.readOnly ?? false;
  const activeTab = formData.activeTab ?? 0;
  const currentStatus = formData.currentStatus ?? "";
  const currentType = formData.currentType ?? "";
  const showSidebar = formData.showSidebar ?? false;
  const tabValue = formData.tabValue ?? 0;
  const sidebarMode = formData.sidebarMode ?? null;
  const isFullPageSign = formData.isFullPageSign ?? false;
  const showSignDocument = formData.showSignDocument ?? false;
  const selectedDocument = formData.selectedDocument ?? null;
  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setSelectedRow = (v: any) => setField({ selectedRow: v });
  const setReadOnly = (v: boolean) => setField({ readOnly: v });
  const setActiveTab = (v: number) => setField({ activeTab: v });
  const setCurrentStatus = (v: string) => setField({ currentStatus: v });
  const setCurrentType = (v: string) => setField({ currentType: v });
  const setShowSidebar = (v: boolean) => setField({ showSidebar: v });
  const setTabValue = (v: number) => setField({ tabValue: v });
  const setSidebarMode = (v: any) => setField({ sidebarMode: v });
  const setIsFullPageSign = (v: boolean) => setField({ isFullPageSign: v });
  const setShowSignDocument = (v: boolean) => setField({ showSignDocument: v });
  const setSelectedDocument = (v: any) => setField({ selectedDocument: v });
  const { counts } = useMenuData();

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [showSignerSidebar, setShowSignerSidebar] = useState(true);
  const handleEdit = () => setReadOnly(false);

  const [isClosing, setIsClosing] = useState(false);
  const handleMinimize = () => setShowForm(false);
  const isMinimized =
    !showForm && !isClosing && hasDraftData(formData.draftForm);

  const { user } = useSelector((state: any) => state.user);
  const {
    createMutation,
    updateMutation,
    updateManyMutation,
    cancelMutation,
    deleteOneMutation,
    signMutation,
    handleSignatureList,
    handleDownloadFile,
  } = useAssetHandoverMutation();

  const searchDebounce = useDebounce(searchValue, 600);
  const { data: handoverPage = { items: [], totalItems: 0 }, isLoading } =
    useAssetHandoverPageQuery(
      paginationModel.page,
      paginationModel.pageSize,
      searchDebounce,
      user.taiKhoan?.tenDangNhap,
      currentStatus ? Number(currentStatus) : undefined,
    );

  const [storedLoaiCounts, setStoredLoaiCounts] = useState<any>({});
  const { data: transferPage = { items: [], totalItems: 0 } } =
    useAssetTransferPageQuery(
      paginationModel.page,
      paginationModel.pageSize,
      searchDebounce,
      currentType ? Number(currentType) : undefined,
      undefined,
      4,
      user.taiKhoan?.phongBanId,
      true,
    );
  useEffect(() => {
    if (!currentType && transferPage?.loaiCounts) {
      if (
        JSON.stringify(transferPage.loaiCounts) !==
        JSON.stringify(storedLoaiCounts)
      ) {
        setStoredLoaiCounts(transferPage.loaiCounts);
      }
    }
  }, [transferPage.loaiCounts, currentType, storedLoaiCounts]);

  const { data: staffs = [] } = useAllStaffsQuery();
  const { data: departments = [] } = useAllDepartmentsQuery();
  const { data: allUnits = [] } = useAllUnitsQuery();
  const { data: positions = [] } = useAllPositionsQuery();
  const { data: allCurrentStatus = [] } = useAllCurrentStatusQuery();
  const { assetTransferDetailAllMutation } = useAssetTranferMutation();
  const isFirstActiveTabMount = useRef(true);

  useEffect(() => {
    if (isFirstActiveTabMount.current) {
      isFirstActiveTabMount.current = false;
      return;
    }
    setSelectedIds([]);
    setSelectedRow(null);
    setShowForm(false);
    setShowSidebar(false);
    setField({ draftForm: undefined });
  }, [activeTab]);

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    handleClose();
  };

  const { data: assetHandover = { items: [] } } = useAssetHandoverPageQuery(
    0,
    999999,
  );
  const assetHandoverCount = getAssetHandoverCount(
    user?.taiKhoan?.tenDangNhap,
    assetHandover.items,
  );

  const statusOptions: FilterOption[] = [
    {
      label: "Tất cả",
      count:
        (handoverPage?.groupCounts?.["0"] ?? 0) +
        (handoverPage?.groupCounts?.["1"] ?? 0) +
        (handoverPage?.groupCounts?.["2"] ?? 0) +
        (handoverPage?.groupCounts?.["3"] ?? 0),
      color: "default",
      value: "",
    },
    {
      label: "Nháp",
      count: handoverPage?.groupCounts?.["0"] ?? 0,
      color: "default",
      value: "0",
    },
    {
      label: "Phê duyệt",
      count: handoverPage?.groupCounts?.["1"] ?? 0,
      color: "info",
      value: "1",
    },
    {
      label: "Hủy",
      count: handoverPage?.groupCounts?.["2"] ?? 0,
      color: "error",
      value: "2",
    },
    {
      label: "Hoàn thành",
      count: handoverPage?.groupCounts?.["3"] ?? 0,
      color: "success",
      value: "3",
    },
  ];

  const typeOptions: FilterOption[] = [
    {
      label: "Tất cả",
      count:
        (storedLoaiCounts?.["1"] ?? 0) +
        (storedLoaiCounts?.["2"] ?? 0) +
        (storedLoaiCounts?.["3"] ?? 0),
      color: "default",
      value: "",
    },
    {
      label: "Cấp phát",
      count: transferPage?.loaiCounts?.["1"] ?? 0,
      color: "success",
      value: "1",
    },
    {
      label: "Điều chuyển",
      count: transferPage?.loaiCounts?.["2"] ?? 0,
      color: "info",
      value: "2",
    },
    {
      label: "Thu hồi",
      count: transferPage?.loaiCounts?.["3"] ?? 0,
      color: "error",
      value: "3",
    },
  ];

  const handleRowClick = (params: GridRowParams) => {
    const data = params.row as any;
    setSelectedRow({ ...data, isNew: false });
    setReadOnly(true);
    setShowForm(false);
    setShowSidebar(true);
    setSidebarMode("document");
    setShowSignDocument(true);
    setIsFullPageSign(false);
    setTabValue(0);

    if (activeTab === 0) {
      setSelectedDocument(data.taiLieuBangKe);
    } else if (activeTab === 1) {
      setSelectedDocument(data.taiLieuCuoi);
    }
  };

  const handleCancel = async () => {
    if (selectedRow) {
      const confirm = await showConfirmAlert(
        `Hủy phiếu bàn giao tài sản "${selectedRow?.id}"`,
      );
      if (confirm.isConfirmed) {
        await cancelMutation.mutate(selectedRow);
        handleClose();
      }
    }
  };
  const handleViewSignAssets = async (fileName: string, item: any) => {
    setShowSignDocument(true);
    setSelectedRow(item);
    setIsFullPageSign(true);
  };
  const handleSend = (items: any[]) => {
    handleSendToSigner(items, updateManyMutation.mutateAsync, handleClose);
  };
  const handleSave = async (values: any) => {
    if (!values.isNew) {
      await updateMutation.mutate(values);
      handleClose();
    } else {
      await createMutation.mutate(values);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setSelectedIds([]);
    setSearchValue("");
    setShowSignDocument(false);
    setSelectedRow(null);
    setShowForm(false);
    setShowSidebar(false);
    setReadOnly(false);
    setField({ draftForm: undefined });
    setTimeout(() => setIsClosing(false), 100);
  };

  const handleSign = (
    data: SignaturesData[],
    assetHandover: AssetHandoverData,
  ) => {
    signMutation.mutate({ data, assetHandover });
  };

  const columns: GridColDef<AssetHandoverData>[] = [
    {
      field: "trangThaiPhieu",
      headerName: "Trạng thái phiếu",
      width: 200,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => StatusHandover(params.row.trangThaiPhieu ?? 0),
    },
    {
      field: "soQuyetDinh",
      headerName: "Số quyết định",
      minWidth: 150,
      flex: 1,
      valueGetter: (params, row: any) => row.id,
      renderCell: (params) => params.value,
    },
    {
      field: "lenhDieuDong",
      headerName: "Lệnh điều động",
      width: 150,
      valueGetter: (params, row: any) => row.lenhDieuDong,
    },
    {
      field: "idDonViGiao",
      headerName: "Đơn vị giao",
      width: 180,
      valueGetter: (params, row: any) => row.tenDonViGiao,
    },
    {
      field: "idDonViNhan",
      headerName: "Đơn vị nhận",
      width: 180,
      valueGetter: (params, row: any) => row.tenDonViNhan,
    },
    {
      field: "ngayBanGiao",
      headerName: "Ngày bàn giao",
      width: 150,
      valueGetter: (params, row: any) => row.ngayBanGiao,
    },
    {
      field: "ngayTaoChungTu",
      headerName: "Ngày tạo chứng từ",
      width: 150,
      valueGetter: (params, row: any) => row.ngayTaoChungTu,
    },
    {
      field: "nguoiTao",
      headerName: "Người lập phiếu",
      width: 160,
      valueGetter: (params, row: any) => row.tenDaiDienBenGiao || row.nguoiTao,
    },
    {
      field: "tenFile",
      headerName: "Tài liệu",
      width: 200,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        if (!params.value) return null;
        return showDownloadFile(params.value, () =>
          S3Service.download(params.row.duongDanFile),
        );
      },
    },
    {
      field: "trangThaiKy",
      headerName: "Trạng thái ký",
      width: 200,
      headerAlign: "center",
      align: "center",
      renderCell: (params) =>
        ShowPermissionSigning(getPermissionSigning(params.row, user, staffs)),
    },
    {
      field: "trangThai",
      headerName: "Trạng thái",
      width: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => showStatus(params.row.trangThai ?? 0),
    },
    {
      field: "trinhDuyet",
      headerName: "Trình duyệt",
      width: 100,
      headerAlign: "center",
      align: "center",
      renderCell: (params) =>
        showShareStatus(
          params.row?.share ?? false,
          params.row?.nguoiTao == user?.taiKhoan?.tenDangNhap,
        ),
    },
    {
      field: "actions",
      headerName: "Hành động",
      width: 120,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Xóa">
            <IconButton
              size="small"
              color="error"
              disabled={!isCheckShowDelete(params.row, user)}
              onClick={async (e) => {
                e.stopPropagation();
                const confirm = await showConfirmAlert(
                  `Xóa phiếu biên bản bàn giao "${params.row?.id}"`,
                );
                if (confirm.isConfirmed) {
                  deleteOneMutation.mutate(params.row);
                }
              }}
            >
              <Trash2 size={20} strokeWidth={2} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sửa">
            <IconButton
              size="small"
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRow({ ...params.row, isNew: false });
                setReadOnly(true);
                setShowForm(true);
                setShowSidebar(false);
              }}
            >
              <Edit size={20} strokeWidth={2} />
            </IconButton>
          </Tooltip>
          {/* <Tooltip title="Xem">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick({ row: params.row } as any);
              }}
            >
              <Eye size={20} strokeWidth={2} color="#4caf50" />
            </IconButton>
          </Tooltip> */}
        </Box>
      ),
    },
  ];

  const [assetTransfer, setAssetTransfer] = useState<any | null>(null);

  const columnsTransfer: GridColDef<AssetTransferData>[] = [
    {
      field: "id",
      headerName: "Mã",
      width: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "tenPhieu",
      headerName: "Phiếu ký nội sinh",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "ngayKy",
      headerName: "Ngày ký",
      width: 180,
      valueGetter: (params, row: any) => row.ngayKy,
    },
    {
      field: "tgGnTuNgay",
      headerName: "Ngày có hiệu lực",
      width: 180,
    },
    {
      field: "tenTrinhDuyetGiamDoc",
      headerName: "Trình duyệt ban giám đốc",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "tenFile",
      headerName: "Tài liệu duyệt",
      width: 200,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        if (!params.value) return null;
        return showDownloadFile(params.value, () =>
          S3Service.download(params.row.duongDanFile),
        );
      },
    },
    {
      field: "trangThai",
      headerName: "Trạng thái",
      width: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params) =>
        showStatusDocument(params.row?.trangThaiPhieuDieuDong ?? 0),
    },
    {
      field: "actions",
      headerName: "Hành động",
      width: 120,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* <IconButton
            size="small"
            onClick={async () => {
              handleRowClick({ row: params.row } as any);
            }}
          >
            <Eye size={20} strokeWidth={2} color="#4caf50" />
          </IconButton> */}
          <IconButton
            size="small"
            title="Tạo biên bản bàn giao tài sản"
            onClick={async (e) => {
              e.stopPropagation();
              window.scrollTo({ top: 140, behavior: "smooth" });

              try {
                const res = await assetTransferDetailAllMutation.mutateAsync(
                  params.row.id,
                );

                // Đảm bảo mảng chi tiết được lấy về đầy đủ
                const fullDetails = res || [];

                // 2. Set dữ liệu vào state để truyền xuống form
                setSelectedRow({
                  id: "",
                  soQuyetDinh: params.row.soQuyetDinh,
                  banGiaoTaiSan: "",
                  quyetDinhDieuDongSo: "",
                  lenhDieuDong: params.row.id,
                  idDonViGiao: params.row.idDonViGiao,
                  idDonViNhan: params.row.idDonViNhan,
                  ngayBanGiao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                  ngayQuyetDinh:
                    params.row.ngayQuyetDinh ||
                    dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                  ngayTaoChungTu: dayjs(new Date()).format(
                    "YYYY-MM-DD HH:mm:ss",
                  ),
                  diaDiemQuyetDinh: "",
                  idGiamDoc: "",
                  idCongTy: params.row.idCongTy,
                  idLanhDao: "",
                  idDaiDiendonviBanHanhQD: "",
                  daXacNhan: false,
                  idDaiDienBenGiao: "",
                  daiDienBenGiaoXacNhan: false,
                  idDaiDienBenNhan: "",
                  daiDienBenNhanXacNhan: false,
                  trangThai: 0,
                  note: "",
                  ngayTao: "",
                  ngayCapNhat: "",
                  nguoiTao: "",
                  nguoiCapNhat: "",
                  isActive: true,
                  share: false,
                  duongDanFile: "",
                  tenFile: "",
                  byStep: false,
                  giamDocKy: false,
                  taiLieuBangKe: "",
                  nguoiKyList: [] as any[],

                  // 3. Map lại từ fullDetails vừa gọi từ API về
                  chiTietBanGiaoTaiSan: fullDetails.map((item: any) => ({
                    id: "",
                    tenTaiSan: item.tenTaiSan,
                    idBanGiaoTaiSan: "",
                    idTaiSan: item.idTaiSan,
                    donViTinh: item.donViTinh,
                    soLuong: item.soLuong,
                    hienTrang: item.hienTrang || "1",
                    ghiChu: item.ghiChu || "",
                    isActive: true,
                    moTa: item.moTa || "",
                    kyHieu: item.kyHieu || "",
                    nuocSanXuat: item.nuocSanXuat || "",
                  })),
                  initialChiTiet: [] as any[],
                  isNew: true,
                });

                setReadOnly(false);
                setShowForm(true);
              } catch (error) {
                console.error(
                  "Lỗi khi lấy danh sách chi tiết tài sản: ",
                  error,
                );
              }
            }}
          >
            <ListPlus size={20} strokeWidth={2} color="#4caf50" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <>
      {/* {showSignDocument && isFullPageSign ? (
        activeTab === 0 ? (
          <SignDocumentForm
            key={selectedRow?.id}
            selectedIds={selectedIds}
            onCancel={handleClose}
            onSign={handleSign}
            assetHandover={selectedRow}
            showSignerSidebar={showSignerSidebar}
            allUnits={allUnits}
            fullscreen={true}
            staffs={staffs}
            departments={departments}
            positions={positions}
            // handleSignatureList={handleSignatureList}
            isEdit={false}
            bangKe={selectedRow.taiLieuBangKe}
          />
        ) : (
          <SignDocumentTransferForm
            key={selectedRow?.id}
            selectedIds={[selectedRow.id]}
            document={selectedDocument}
            onCancel={handleClose}
            onSign={() => {}}
            assetTransferDetail={selectedRow.chiTietDieuDongTaiSanDTOS || []}
            showSignerSidebar={showSignerSidebar}
            allUnits={allUnits}
            allCurrentStatus={allCurrentStatus}
            fullscreen={true}
            staffs={staffs}
            isEdit={false}
            // handleSignatureList={handleSignatureList}
          />
        )
      ) : (
        <> */}
      <PageAction
        title={"Biên bản bàn giao tài sản"}
        onNewClick={() => {
          if (isMinimized) {
            setShowForm(true);
            return;
          }
          setField({ draftForm: undefined });
          setSelectedRow(null);
          setReadOnly(false);
          setShowForm(true);
          setShowSidebar(false);
        }}
      />

      <Box sx={{ p: 2 }}>
        <Dialog
          open={showForm}
          onClose={handleMinimize}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0, overflow: "auto" }}>
            <AssetHandoverForm
              key={selectedRow?.id || "form-key"}
              onClose={handleClose}
              onMinimize={handleMinimize}
              onSave={handleSave}
              onCancel={handleCancel}
              onEdit={handleEdit}
              readOnly={readOnly}
              selectedAssetHandover={selectedRow}
              label={activeTab === 0 ? "Bàn giao" : "Điều động"}
              departments={departments}
              positions={positions}
              allUnits={allUnits}
              staffs={(staffs || []).filter((staff: any) => staff.hasAccount)}
              onFormChange={(values) => setField({ draftForm: values })}
              initialFormData={formData.draftForm}
            />
          </DialogContent>
        </Dialog>

        {isMinimized && <DraftIndicator onClick={() => setShowForm(true)} />}

        {/* Bước 1: Cấu trúc lại Grid để Tabs luôn chiếm 100% chiều ngang */}
        <Grid
          container
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {/* HÀNG 1: TABS - Luôn full width (size 12) */}
          <Grid size={{ xs: 12 }}>
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
                  label: "Biên bản bàn giao",
                  subLabel: "Bàn giao tài sản",
                  icon: FileText,
                },
                {
                  label: "Quyết định điều động",
                  subLabel: "Điều động thiết bị",
                  icon: Truck,
                  count: counts?.transferAssetPageItems || 0,
                },
              ].map((t, idx) => {
                const IconComponent = t.icon;
                const isActive = activeTab === idx;

                return (
                  <ButtonBase
                    key={idx}
                    onClick={() => {
                      setActiveTab(idx);
                      handleClose();
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
                        bgcolor: isActive
                          ? undefined
                          : "rgba(4, 180, 110, 0.04)",
                      },
                    }}
                  >
                    {/* Top Row: Icon */}
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
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
                          mb: 1.5,
                        }}
                      >
                        <IconComponent size={20} />
                      </Box>
                      {(t?.count || 0) > 0 && (
                        <Badge
                          badgeContent={t.count}
                          color="error"
                          sx={{
                            "& .MuiBadge-badge": {
                              position: "static",
                              transform: "none",
                            },
                          }}
                        />
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
          {/* HÀNG 2: BẢNG VÀ SIDEBAR */}
          <Grid
            size={{
              xs: showSidebar && sidebarMode === "document" ? 6 : 12,
            }}
            sx={{
              transition: "all 0.3s ease",
              borderRight:
                showSidebar && sidebarMode === "document"
                  ? "1px solid"
                  : "none",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <TableCustom
              tableId="assetHandover"
              loading={isLoading}
              title={
                activeTab === 0
                  ? "Biên bản bàn giao tài sản"
                  : "Biên bản điều động"
              }
              columns={activeTab === 0 ? columns : columnsTransfer}
              rows={
                activeTab === 0
                  ? handoverPage?.items || []
                  : transferPage?.items || []
              }
              total={
                activeTab === 0
                  ? handoverPage?.totalItems || 0
                  : transferPage?.totalItems || 0
              }
              showStatusFilter={true}
              statusOptions={activeTab === 0 ? statusOptions : typeOptions}
              statusValue={activeTab === 0 ? currentStatus : currentType}
              onStatusChange={(val) => {
                if (activeTab === 0) setCurrentStatus(val);
                else setCurrentType(val);
              }}
              // onSign={handleViewSignAssets}
              // handleSignDocument={handleSignDocument}
              // canSign={canSign}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              onRowClick={handleRowClick}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onDelete={() => {}}
              showDelete={false}
              // isCheckShowShare={isCheckShowShare}
              // handleSendToSigner={handleSend}
            />
          </Grid>

          {showSidebar && sidebarMode === "document" && (
            <Grid
              size={{ xs: 6 }}
              sx={{
                display: "flex",
                flexDirection: "column",
                bgcolor: "white",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  bgcolor: "white",
                  pr: 1,
                }}
              >
                <Tabs
                  value={tabValue}
                  onChange={(_, newValue) => setTabValue(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    "& .MuiTabs-indicator": {
                      backgroundColor: "#04b46eff",
                    },
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      minWidth: 100,
                      "&.Mui-selected": {
                        color: "#04b46eff",
                      },
                    },
                  }}
                >
                  <Tab label="Tài liệu" />
                  {activeTab === 0 && <Tab label="Quy trình ký" />}
                </Tabs>
                <IconButton
                  size="small"
                  onClick={() => {
                    setShowSidebar(false);
                    setSidebarMode(null);
                  }}
                >
                  <VisibilityOff sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>

              <Box sx={{ flex: 1, overflow: "hidden" }}>
                {tabValue === 0 ? (
                  <Box
                    sx={{
                      height: "calc(100vh - 120px)",
                      overflow: "hidden",
                    }}
                  >
                    {activeTab === 0 ? (
                      <SignDocumentForm
                        key={selectedRow?.id}
                        selectedIds={[selectedRow?.id]}
                        onCancel={handleClose}
                        onSign={handleSign}
                        assetHandover={selectedRow}
                        showSignerSidebar={false}
                        allUnits={allUnits}
                        fullscreen={false}
                        staffs={staffs}
                        departments={departments}
                        positions={positions}
                        // handleSignatureList={handleSignatureList}
                        isEdit={false}
                        bangKe={selectedRow.taiLieuBangKe}
                        title={`${selectedRow?.banGiaoTaiSan || ""} (${selectedRow?.id || ""})`}
                      />
                    ) : (
                      <SignDocumentTransferForm
                        key={selectedRow?.id}
                        selectedIds={[selectedRow.id]}
                        document={selectedDocument}
                        onCancel={handleClose}
                        onSign={() => {}}
                        assetTransferDetail={
                          selectedRow.chiTietDieuDongTaiSanDTOS || []
                        }
                        showSignerSidebar={false}
                        allUnits={allUnits}
                        allCurrentStatus={allCurrentStatus}
                        fullscreen={false}
                        staffs={staffs}
                        isEdit={false}
                        title={`${selectedRow?.soPhieu || ""} (${selectedRow?.id || ""})`}
                      />
                    )}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: "calc(100vh - 120px)",
                      overflow: "hidden",
                    }}
                  >
                    <SignerSidebar
                      key={selectedRow?.id}
                      selectedRow={selectedRow}
                      onClose={() => {
                        setShowSidebar(false);
                        setSidebarMode(null);
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
      {/* </>
      )} */}
    </>
  );
}
