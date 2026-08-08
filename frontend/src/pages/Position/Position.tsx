import {
  Box,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import PageAction from "../../components/common/PageAction";
import TableCustom from "../../components/common/TableCustom";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import PositionForm from "./components/PositionForm";
import { ContentCopy, Delete, Edit } from "@mui/icons-material";
import { useState } from "react";
import { showConfirmAlert } from "../../components/Alert";
import {
  useAllPositionsQuery,
  usePositionMutation,
  usePositionsPageQuery,
} from "./Mutation";
import { useDebounce } from "../../hooks/useDebounce";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useTabForm } from "../../redux/useTabForm";
import { hasDraftData } from "../../utils/draftUtils";
import DraftIndicator from "../../components/common/DraftIndicator";

interface PositionTabState {
  showForm: boolean;
  selectedPosition: any | null;
  readOnly: boolean;
  isCopy: boolean;
  draftForm?: Record<string, any>;
  bulkMode: boolean;
  bulkEditType?: "create" | "edit";
  bulkItems?: any[];
  bulkDraftData?: Record<string, any>;
  showBulkForm: boolean;
}

export default function Position() {
  const { formData, setField } = useTabForm<PositionTabState>("/chuc_vu");
  const showForm = formData.showForm ?? false;
  const selectedPosition = formData.selectedPosition ?? null;
  const readOnly = formData.readOnly ?? false;
  const isCopy = formData.isCopy ?? false;
  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setSelectedPosition = (v: any) => setField({ selectedPosition: v });
  const setReadOnly = (v: boolean) => setField({ readOnly: v });
  const setIsCopy = (v: boolean) => setField({ isCopy: v });

  const setBulkMode = (v: boolean) => setField({ bulkMode: v });
  const setBulkEditType = (v: "create" | "edit") =>
    setField({ bulkEditType: v });
  const setBulkItems = (v: any[]) => setField({ bulkItems: v });
  const bulkMode = formData.bulkMode ?? false;
  const bulkEditType = formData.bulkEditType ?? "create";
  const bulkItems = formData.bulkItems ?? [];
  const showBulkForm = formData.showBulkForm ?? false;
  const setShowBulkForm = (v: boolean) => setField({ showBulkForm: v });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkFormKey, setBulkFormKey] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const { user } = useSelector((state: RootState) => state.user);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const {
    createMutation,
    updateMutation,
    deleteOneMutation,
    deleteManyMutation,
    importExcelMutation,
    exportMutation,
    deleteAllMutation,
    createBatchMutation,
    updateBatchMutation,
  } = usePositionMutation();

  const debouncedSearchValue = useDebounce(searchValue, 600);
  const { data: positionsPage = { items: [], totalItems: 0 }, isLoading } =
    usePositionsPageQuery(
      paginationModel.page,
      paginationModel.pageSize,
      debouncedSearchValue,
    );

  const handleRowClick = (params: GridRowParams) => {
    window.scrollTo({ top: 140, behavior: "smooth" });
    setField({
      ...(bulkMode ? { bulkMode: false, bulkItems: [] } : {}),
      selectedPosition: params.row,
      readOnly: true,
      showForm: true,
    });
  };

  const handleSave = (values: any) => {
    if (bulkMode) {
      if (bulkEditType === "create") {
        createBatchMutation.mutate(values);
      } else {
        updateBatchMutation.mutate(values);
      }
      setBulkMode(false);
      setBulkItems([]);
      setShowBulkForm(false);
      setSelectedIds([]);
      setField({ bulkDraftData: undefined });
    } else {
      if (selectedPosition && !isCopy) {
        updateMutation.mutate(values);
      } else {
        createMutation.mutate(values);
      }
      setShowForm(false);
      setSelectedPosition(null);
      setIsCopy(false);
      setField({ draftForm: undefined });
    }
  };

  const handleEdit = () => {
    setReadOnly(false);
  };

  const isMinimized = !showForm && hasDraftData(formData.draftForm);
  const isBulkMinimized = !showBulkForm && hasDraftData(formData.bulkDraftData);
  const handleMinimize = () => setShowForm(false);
  const handleBulkMinimize = () => setShowBulkForm(false);

  const handleRestoreFromDraft = () => {
    if (isBulkMinimized) {
      if (
        formData.bulkDraftData?.items &&
        Array.isArray(formData.bulkDraftData.items)
      ) {
        setBulkItems(formData.bulkDraftData.items);
        setBulkMode(true);
        if (formData.bulkDraftData?.bulkEditType) {
          setBulkEditType(formData.bulkDraftData.bulkEditType);
        }
      }
      setShowBulkForm(true);
    } else {
      setShowForm(true);
    }
  };

  const handleBulkEdit = () => {
    if (selectedIds.length === 0) return;
    const itemsToEdit = positionsPage.items
      .filter((item: any) => selectedIds.includes(item.id))
      .sort((a: any, b: any) => a.id.localeCompare(b.id));
    setBulkFormKey((k) => k + 1);
    setField({
      bulkMode: true,
      bulkEditType: "edit",
      bulkItems: itemsToEdit,
      showBulkForm: true,
    });
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Mã chức vụ",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenChucVu",
      headerName: "Tên chức vụ",
      flex: 1,
      minWidth: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "quanLyNhanVien",
      headerName: "Quản lý nhân viên",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <Checkbox checked={params.row.quanLyNhanVien} />,
    },
    {
      field: "quanLyPhongBan",
      headerName: "Quản lý phòng ban",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <Checkbox checked={params.row.quanLyPhongBan} />,
    },
    {
      field: "quanLyDuAn",
      headerName: "Quản lý dự án",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <Checkbox checked={params.row.quanLyDuAn} />,
    },
    {
      field: "quanLyNguonVon",
      headerName: "Quản lý nguồn vốn",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <Checkbox checked={params.row.quanLyNguonVon} />,
    },
    {
      field: "quanLyMoHinhTaiSan",
      headerName: "Quản lý mô hình tài sản",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Checkbox checked={params.row.quanLyMoHinhTaiSan} />
      ),
    },
    {
      field: "quanLyTaiSan",
      headerName: "Quản lý tài sản",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <Checkbox checked={params.row.quanLyTaiSan} />,
    },
    {
      field: "quanLyCCDCVatTu",
      headerName: "Quản lý CCDC - Vật tư",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <Checkbox checked={params.row.quanLyCCDCVatTu} />,
    },
    {
      field: "dieuDongTaiSan",
      headerName: "Điều động tài sản",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <Checkbox checked={params.row.dieuDongTaiSan} />,
    },
    {
      field: "dieuDongCCDCVatTu",
      headerName: "Điều động CCDC",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Checkbox checked={params.row.dieuDongCCDCVatTu} />
      ),
    },
    {
      field: "banGiaoTaiSan",
      headerName: "Bàn giao tài sản",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <Checkbox checked={params.row.banGiaoTaiSan} />,
    },
    {
      field: "banGiaoCCDCVatTu",
      headerName: "Bàn giao CCDC",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Checkbox checked={params.row.banGiaoCCDCVatTu} />
      ),
    },
    {
      field: "banHanhQuyetDinh",
      headerName: "Ban hành quyết định",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Checkbox checked={params.row.banHanhQuyetDinh} />
      ),
    },
    {
      field: "baoCao",
      headerName: "Báo cáo",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <Checkbox checked={params.row.baoCao} />,
    },
    {
      field: "action",
      headerName: "Hành động",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box display="flex" gap={1} justifyContent="center" alignItems="center">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick({ row: params.row } as GridRowParams);
              setIsCopy(false);
              setReadOnly(false);
            }}
          >
            <Edit color="primary" />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              const { id, ...copyData } = params.row;
              setSelectedPosition({ ...copyData, id: "" });
              setIsCopy(true);
              setReadOnly(false);
              setShowForm(true);
            }}
          >
            <ContentCopy color="primary" />
          </IconButton>

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
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <PageAction
        title="Quản lý chức vụ"
        onNewClick={() => {
          if (isBulkMinimized) {
            setShowBulkForm(true);
            return;
          }
          if (isMinimized) {
            setShowForm(true);
            return;
          }
          setBulkFormKey((k) => k + 1);
          setField({
            bulkMode: true,
            bulkEditType: "create",
            bulkItems: [{}],
            showBulkForm: true,
          });
        }}
        onExport={() => exportMutation.mutate()}
        onImport={(file) => importExcelMutation.mutate(file)}
        showExcel={true}
      />
      <Box p={2}>
        <Dialog
          open={exportMutation.isPending || importExcelMutation.isPending}
          PaperProps={{
            sx: {
              borderRadius: 0,
              boxShadow: "none",
              border: "1px solid #d9d9d9",
              minWidth: "200px",
            },
          }}
        >
          <DialogContent>
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={20} color="inherit" thickness={4} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Đang xử lý dữ liệu...
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>
        {/* Dialog single */}
        <Dialog
          open={showForm}
          onClose={handleMinimize}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            {selectedPosition || !readOnly ? (
              <PositionForm
                key={`single-${selectedPosition?.id || "new"}`}
                onCancel={() => {
                  setSelectedPosition(null);
                  setReadOnly(false);
                  setField({ draftForm: undefined });
                  setShowForm(false);
                }}
                onMinimize={handleMinimize}
                onEdit={handleEdit}
                selectedPosition={selectedPosition}
                readOnly={readOnly}
                onSave={handleSave}
                onFormChange={(values) => setField({ draftForm: values })}
                initialFormData={formData.draftForm}
                isBulkMode={false}
              />
            ) : null}
          </DialogContent>
        </Dialog>
        {/* Dialog bulk */}
        <Dialog
          open={showBulkForm}
          onClose={handleBulkMinimize}
          maxWidth="md"
          fullWidth
          keepMounted={false}
        >
          <DialogContent sx={{ p: 0 }}>
            {showBulkForm && (
              <PositionForm
                key={`bulk-${bulkFormKey}`}
                onCancel={() => {
                  setBulkMode(false);
                  setBulkItems([]);
                  setSelectedIds([]);
                  setField({ bulkDraftData: undefined });
                  setShowBulkForm(false);
                }}
                onMinimize={handleBulkMinimize}
                onEdit={handleEdit}
                selectedPosition={null}
                readOnly={false}
                onSave={handleSave}
                onFormChange={undefined}
                initialFormData={formData.bulkDraftData}
                isBulkMode={true}
                bulkItems={bulkItems}
                onBulkItemsChange={(items) => {
                  setBulkItems(items);
                  setField({ bulkDraftData: { items, bulkEditType } });
                }}
                bulkEditType={bulkEditType}
              />
            )}
          </DialogContent>
        </Dialog>

        {isBulkMinimized ? (
          <DraftIndicator
            onClick={() => {
              if (formData.bulkDraftData?.items) {
                setBulkItems(formData.bulkDraftData.items);
              }
              setShowBulkForm(true);
            }}
          />
        ) : (
          isMinimized && <DraftIndicator onClick={() => setShowForm(true)} />
        )}

        <TableCustom
          tableId="position"
          title="Quản lý chức vụ"
          columns={columns}
          rows={positionsPage.items}
          total={positionsPage.totalItems}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={isLoading}
          onRowClick={handleRowClick}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onDelete={deleteManyMutation.mutate}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          onDeleteAll={deleteAllMutation.mutate}
          showDeleteAll={user?.taiKhoan?.tenDangNhap === "admin"}
          onImportExcel={(file) => importExcelMutation.mutate(file)}
          onExportExcel={() => exportMutation.mutate()}
          onBulkEdit={selectedIds.length > 1 ? handleBulkEdit : undefined}
        />
      </Box>
    </Box>
  );
}
