import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Grid,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  DialogContent,
  Dialog,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff,
} from "@mui/icons-material";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import AssetTransferForm from "./components/AssetTransferForm";
import SignerSidebar from "./components/SignerSidebar";
import SignDocumentForm from "./components/SignDocumentForm";
import BienBanTabContent from "./components/BienBanTabContent";
import TableCustom from "../../components/common/TableCustom";
import { AssetTransferData, SignaturesData } from "./types";
import PageAction from "../../components/common/PageAction";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAssetTranferMutation, useAssetTransferPageQuery } from "./Mutation";
import { useSelector } from "react-redux";
import {
  canSign,
  getDecision,
  getPermissionSigning,
  getTypeInfo,
  handleSendToSigner,
  handleSignDocument,
  isCheckShowDelete,
  isCheckShowShare,
  showDownloadFile,
  ShowPermissionSigning,
  showShareStatus,
  showStatus,
  showStatusDocument,
} from "./config";
import { showConfirmAlert } from "../../components/Alert";
import { FilterOption } from "../../components/common/FilterStatusGroup";
import { Building, Trash2, Edit } from "lucide-react";
import { AssetHandoverData } from "../AssetHandover/types";
import { useDebounce } from "../../hooks/useDebounce";
import { useAllStaffsQuery } from "../Staff/Mutation";
import { useAllDepartmentsQuery } from "../Department/Mutation";
import { useAllCurrentStatusQuery } from "../CurrentStatus/Mutation";
import { useAllUnitsQuery } from "../Unit/Mutation";
import S3Service from "../../services/S3Service";
import { useTabForm } from "../../redux/useTabForm";
import { hasDraftData } from "../../utils/draftUtils";
import DraftIndicator from "../../components/common/DraftIndicator";

interface AssetTransferTabState {
  showForm: boolean;
  selectedRow: any | null;
  showSidebar: boolean;
  readOnly: boolean;
  tabValue: number;
  sidebarMode: "document" | "signer" | null;
  status: string;
  showSignDocument: boolean;
  isFullPageSign: boolean;
  selectedDocument: any | null;
  draftForm?: Record<string, any>;
  prevType: string | null;
}

export default function AssetTransfer() {
  const { user } = useSelector((state: any) => state.user);
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  const { formData, setField } = useTabForm<AssetTransferTabState>(
    `/dieu_dong_tai_san?type=${type ?? "1"}`,
  );

  // Đọc từ Redux
  const showForm = formData.showForm ?? false;
  const selectedRow = formData.selectedRow ?? null;
  const showSidebar = formData.showSidebar ?? false;
  const readOnly = formData.readOnly ?? false;
  const tabValue = formData.tabValue ?? 0;
  const sidebarMode = formData.sidebarMode ?? null;
  const status = formData.status ?? "";
  const showSignDocument = formData.showSignDocument ?? false;
  const isFullPageSign = formData.isFullPageSign ?? false;
  const selectedDocument = formData.selectedDocument ?? null;
  const prevType = formData.prevType ?? null;

  // Setter helpers
  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setSelectedRow = (v: any) => setField({ selectedRow: v });
  const setShowSidebar = (v: boolean) => setField({ showSidebar: v });
  const setReadOnly = (v: boolean) => setField({ readOnly: v });
  const setTabValue = (v: number) => setField({ tabValue: v });
  const setSidebarMode = (v: any) => setField({ sidebarMode: v });
  const setStatus = (v: string) => setField({ status: v });
  const setShowSignDocument = (v: boolean) => setField({ showSignDocument: v });
  const setIsFullPageSign = (v: boolean) => setField({ isFullPageSign: v });
  const setSelectedDocument = (v: any) => setField({ selectedDocument: v });

  // Local state (không cần persist)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [assetTransferDetail, setAssetTransferDetail] = useState<any[]>([]);
  const [assetHandover, setAssetHandover] = useState<AssetHandoverData[]>([]);
  const [showSignerSidebar, setShowSignerSidebar] = useState(true);

  const isClosingRef = useRef(false);
  const formRef = useRef<{ getValues: () => any }>(null);

  const handleMinimize = () => {
    setShowForm(false);
    const values = formRef.current?.getValues();
    if (values) setField({ draftForm: values });
  };

  const isMinimized =
    !showForm && !isClosingRef.current && hasDraftData(formData.draftForm);

  const location = useLocation();
  const navigate = useNavigate();
  const {
    createMutation,
    updateMutation,
    updateManyMutation,
    cancelMutation,
    deleteOneMutation,
    handleSignatureList,
    signMutation,
    getAssetHandoverMutation,
    decisionMutation,
  } = useAssetTranferMutation();

  const debouncedSearchValue = useDebounce(searchValue, 600);
  const {
    data: assetTranferPage = {
      items: [],
      totalItems: 0,
      loaiCounts: {},
      trangThaiCounts: {},
    },
    isLoading,
  } = useAssetTransferPageQuery(
    paginationModel.page,
    paginationModel.pageSize,
    debouncedSearchValue,
    type ? Number(type) : undefined,
    user?.taiKhoan?.tenDangNhap,
    status ? Number(status) : undefined,
  );

  const { data: allStaffs = [] } = useAllStaffsQuery();

  const statusOptions: FilterOption[] = [
    {
      label: "Tất cả",
      count: assetTranferPage.loaiCounts?.[`${type}`] ?? 0,
      color: "default",
      value: "",
    },
    {
      label: "Nháp",
      count: assetTranferPage?.trangThaiCounts?.["0"] ?? 0,
      color: "default",
      value: "0",
    },
    {
      label: "Phê duyệt",
      count: assetTranferPage?.trangThaiCounts?.["1"] ?? 0,
      color: "info",
      value: "1",
    },
    {
      label: "Hủy",
      count: assetTranferPage?.trangThaiCounts?.["2"] ?? 0,
      color: "error",
      value: "2",
    },
    {
      label: "Chưa ban hành",
      count: assetTranferPage?.trangThaiCounts?.["3"] ?? 0,
      color: "secondary",
      value: "3",
    },
    {
      label: "Đã ban hành",
      count: assetTranferPage?.trangThaiCounts?.["4"] ?? 0,
      color: "success",
      value: "4",
    },
  ];

  useEffect(() => {
    if (prevType === type) return;

    setSelectedIds([]);
    setSelectedDocument(null);
    setSearchValue("");
    setShowSignDocument(false);
    setSelectedRow(null);
    setShowForm(false);
    setShowSidebar(false);
    setReadOnly(false);
    setSidebarMode(null);
    setIsFullPageSign(false);
    setTabValue(0);
    setField({ draftForm: undefined, prevType: type });
  }, [type]);

  useEffect(() => {
    if (location.state?.autoCreate) {
      setField({ draftForm: undefined });
      setShowForm(true);
      setSelectedRow(null);
      setReadOnly(false);

      navigate(location.pathname + location.search, { replace: true });
    }
  }, [
    location.state?.autoCreate,
    location.pathname,
    location.search,
    navigate,
  ]);

  const { title, label } = getTypeInfo(type);

  const handleRowClick = async (params: GridRowParams) => {
    const data = params.row as AssetTransferData;
    // setSelectedIds([data.id]);
    setSelectedRow(data);
    setShowForm(false);
    setReadOnly(true);
    setShowSidebar(true);
    setSidebarMode("document");
    setShowSignDocument(true);
    setIsFullPageSign(false);
    setTabValue(0);
    setSelectedDocument(data.taiLieuCuoi);
    setAssetTransferDetail(data.chiTietDieuDongTaiSanDTOS || []);

    // Tự động tải biên bản khi click row
    if (data.coPhieuBanGiao) {
      const result: any[] = await getAssetHandoverMutation.mutateAsync(data.id);
      setAssetHandover(result);
    } else {
      setAssetHandover([]);
    }
  };

  const handleEdit = () => {
    setReadOnly(false);
  };
  const handleClose = () => {
    isClosingRef.current = true;
    setShowForm(false);
    setField({ draftForm: undefined });
    setSelectedIds([]);
    setSelectedDocument(null);
    setSearchValue("");
    setShowSignDocument(false);
    setSelectedRow(null);
    setShowSidebar(false);
    setReadOnly(false);
    setAssetHandover([]);
    setSidebarMode(null);
    setIsFullPageSign(false);
    setTabValue(0);
    setTimeout(() => {
      isClosingRef.current = false;
    }, 300);
  };

  const handleSend = (items: any[]) => {
    handleSendToSigner(items, updateManyMutation.mutateAsync, handleClose);
  };
  const handleSave = async (values: any) => {
    if (selectedRow) {
      await updateMutation.mutate(values);
      handleClose();
    } else {
      await createMutation.mutate(values);
      handleClose();
    }
  };

  const handleCancel = async () => {
    if (selectedRow) {
      const confirm = await showConfirmAlert(
        `Hủy phiếu ${title} "${selectedRow?.id}"`,
      );
      if (confirm.isConfirmed) {
        await cancelMutation.mutate(selectedRow);
        handleClose();
      }
    }
  };

  const handleSign = (data: SignaturesData[]) => {
    signMutation.mutate({
      SignaturesData: data,
      asset: selectedRow,
    });
  };

  const handleDecision = (data: any[]) => {
    decisionMutation.mutate(data, {
      onSuccess: () => {
        if (!selectedRow) return;
        const isJustIssued = data.some((item) => item.id === selectedRow.id);
        if (isJustIssued) {
          setField({ selectedRow: { ...selectedRow, trangThai: 4 } });
        }
      },
    });
  };

  const handleViewSignAssets = async (fileName: string, item: any) => {
    setSelectedDocument(fileName);
    setShowSignDocument(true);
    setIsFullPageSign(true);
    setSelectedRow(item);
    setAssetTransferDetail(item.chiTietDieuDongTaiSanDTOS);
    setShowSignerSidebar(true);
  };

  const handleViewBienBan = async (id: string) => {
    const result: any[] = await getAssetHandoverMutation.mutateAsync(id);
    setAssetHandover(result);
    setShowSidebar(true);
    setSidebarMode("document");
    setTabValue(2);
  };

  const columns = useMemo<GridColDef<any>[]>(
    () => [
      {
        field: "trangThai",
        headerName: "Trạng thái phiếu",
        width: 140,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => showStatus(params.row.trangThai ?? 0),
      },
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
        minWidth: 200,
        flex: 1,
        headerAlign: "center",
        align: "center",
      },

      {
        field: "trichYeu",
        headerName: "Trích yếu",
        width: 180,
        headerAlign: "center",
        align: "center",
      },

      {
        field: "ngayHieuLuc",
        headerName: "Ngày có hiệu lực",
        width: 160,
        headerAlign: "center",
        align: "center",
        renderCell(params) {
          if (!params.row?.tgGnTuNgay) return "";
          return new Date(params.row?.tgGnTuNgay).toLocaleString("vi-VN");
        },
      },

      {
        field: "tenTrinhDuyetGiamDoc",
        headerName: "Trình duyệt biên bản",
        width: 160,
        headerAlign: "center",
        align: "center",
      },

      {
        field: "tenFile",
        headerName: "Tài liệu duyệt",
        width: 180,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => {
          return showDownloadFile(
            params.value,
            () => S3Service.download(params.row.duongDanFile),
            // handleDownloadFile(params.value),
          );
        },
      },
      {
        field: "tgGnTuNgay",
        headerName: "Thời gian giao nhận từ ngày",
        width: 160,
        headerAlign: "center",
        align: "center",
        valueFormatter: (value: any) => {
          if (!value) return "";
          return new Date(value).toLocaleString("vi-VN");
        },
      },

      {
        field: "tgGnDenNgay",
        headerName: "Thời gian giao nhận đến ngày",
        width: 160,
        headerAlign: "center",
        align: "center",
        valueFormatter: (value: any) => {
          if (!value) return "";
          return new Date(value).toLocaleString("vi-VN");
        },
      },

      {
        field: "tenDonViGiao",
        headerName: "Đơn vị giao",
        width: 180,
        headerAlign: "center",
        align: "center",
      },
      {
        field: "tenDonViNhan",
        headerName: "Đơn vị nhận",
        width: 180,
        headerAlign: "center",
        align: "center",
      },

      {
        field: "TrangThaiKy",
        headerName: "Trạng thái ký",
        width: 140,
        headerAlign: "center",
        align: "center",
        renderCell: (params) =>
          ShowPermissionSigning(
            getPermissionSigning(params.row, user, allStaffs),
          ),
      },

      {
        field: "TrangThaiBanGiao",
        headerName: "Trạng thái bàn giao",
        width: 140,
        headerAlign: "center",
        align: "center",
        renderCell: (params) =>
          showStatusDocument(params.row?.trangThaiPhieuDieuDong ?? 0),
      },

      {
        field: "share",
        headerName: "Trình duyệt",
        width: 140,
        headerAlign: "center",
        align: "center",
        renderCell: (params) =>
          showShareStatus(
            params.row?.share ?? false,
            params.row?.nguoiTao === user?.taiKhoan?.tenDangNhap,
          ),
      },

      {
        field: "HanhDong",
        headerName: "Hành động",
        width: 140,
        headerAlign: "center",
        align: "center",
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const rowData = params.row as AssetTransferData;
          return (
            <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
              <Tooltip title="Chỉnh sửa">
                <IconButton
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setField({
                      selectedRow: rowData,
                      showForm: true,
                      readOnly: true,
                      showSidebar: false,
                    });
                  }}
                  sx={{
                    padding: "4px",
                    "&:hover": { bgcolor: "rgba(25, 118, 210, 0.08)" },
                  }}
                >
                  <Edit size={20} strokeWidth={2} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Xóa">
                <IconButton
                  color="error"
                  disabled={!isCheckShowDelete(rowData, user)}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const confirm = await showConfirmAlert(
                      `Xóa phiếu ${title} "${rowData?.id}"`,
                    );
                    if (confirm.isConfirmed) {
                      deleteOneMutation.mutate(rowData);
                    }
                  }}
                  sx={{
                    padding: "4px",
                    "&:hover": { bgcolor: "rgba(244, 67, 54, 0.08)" },
                  }}
                >
                  <Trash2 size={20} strokeWidth={2} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [allStaffs, user, title],
  );

  return (
    <>
      {/* Biên bản Dialog không còn dùng trực tiếp ở đây nữa vì đã tích hợp vào Tab */}

      {/* {showSignDocument && isFullPageSign ? (
        <SignDocumentForm
          key={selectedRow?.id}
          selectedIds={selectedIds}
          document={selectedDocument}
          onCancel={handleClose}
          onSign={handleSign}
          assetTransferDetail={assetTransferDetail}
          showSignerSidebar={showSignerSidebar}
          allUnits={allUnits}
          allCurrentStatus={allCurrentStatus}
          fullscreen={true}
          staffs={allStaffs}
          isEdit={false}
        />
      ) : (
        <> */}
          <PageAction
            title={title}
            onNewClick={() => {
              if (isMinimized) {
                setShowForm(true);
                return;
              }
              setField({ draftForm: undefined });
              handleClose();
              setShowForm(true);
            }}
          />
          <Box sx={{ p: 2 }}>
            <Dialog
              open={showForm}
              onClose={handleMinimize}
              maxWidth="lg"
              slotProps={{
                transition: { timeout: 100 },
              }}
              fullWidth
            >
              <DialogContent sx={{ p: 0, overflow: "auto" }}>
                <AssetTransferForm
                  ref={formRef}
                  key={
                    showForm
                      ? `new-form-type-${type}`
                      : `edit-${selectedRow?.id}`
                  }
                  onClose={handleClose}
                  onMinimize={handleMinimize}
                  readOnly={readOnly}
                  type={Number(type)}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  selectedTransfer={selectedRow}
                  label={label}
                  isSignedForm={!!selectedRow && !showForm}
                  staffs={(allStaffs || []).filter(
                    (staff: any) => staff.hasAccount,
                  )}
                  initialFormData={formData.draftForm}
                />
              </DialogContent>
            </Dialog>

            {isMinimized && (
              <DraftIndicator onClick={() => setShowForm(true)} />
            )}

            <Grid
              container
              sx={{
                display: "flex",
                alignItems: "stretch",
                bgcolor: "background.paper",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Grid
                size={{
                  xs: showSidebar ? (sidebarMode === "document" ? 6 : 9) : 12,
                }}
                sx={{
                  transition: "all 0.3s ease",
                  borderRight: showSidebar ? "1px solid" : "none",
                  borderColor: "divider",
                  "& .MuiPaper-root": {
                    margin: 0,
                    boxShadow: "none",
                    borderRadius: 0,
                  },
                }}
              >
                <TableCustom
                  tableId="assetTransfer"
                  title={`Phiếu duyệt ${label}`}
                  columns={columns}
                  rows={assetTranferPage.items}
                  total={assetTranferPage.totalItems}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  onRowClick={handleRowClick}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  // onDelete={handleDelete}
                  // onSign={handleViewSignAssets}
                  // handleSignDocument={handleSignDocument}
                  // canSign={canSign}
                  searchValue={searchValue}
                  setSearchValue={setSearchValue}
                  showStatusFilter={true}
                  showDelete={false}
                  // handleSendToSigner={handleSend}
                  statusOptions={statusOptions}
                  onStatusChange={(value) => {
                    setStatus(value);
                  }}
                  // handleDecision={handleDecision}
                  // isDecision={getDecision}
                  statusValue={status}
                  // isCheckShowShare={isCheckShowShare}
                  loading={isLoading}
                />
              </Grid>

              {showSidebar && (
                <Grid
                  size={{ xs: sidebarMode === "document" ? 6 : 3 }}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "background.paper",
                    borderLeft: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      borderBottom: 1,
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
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
                      <Tab label="Quy trình ký" />
                      <Tab label="Biên bản" />
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
                        <SignDocumentForm
                          key={selectedRow?.id}
                          selectedIds={selectedIds}
                          document={selectedDocument}
                          onCancel={handleClose}
                          onSign={handleSign}
                          assetTransferDetail={assetTransferDetail}
                          showSignerSidebar={false}
                          fullscreen={false}
                          staffs={allStaffs}
                          isEdit={false}
                          title={`${selectedRow?.tenPhieu || ""} (${selectedRow?.id || ""})`}
                        />
                      </Box>
                    ) : tabValue === 1 ? (
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
                    ) : (
                      <Box
                        sx={{
                          height: "calc(100vh - 120px)",
                          overflow: "hidden",
                        }}
                      >
                        <BienBanTabContent
                          assetHandover={assetHandover}
                          handleSignatureList={handleSignatureList}
                          onClose={handleClose}
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
