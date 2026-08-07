import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import PageAction from "../../components/common/PageAction";
import TableCustom from "../../components/common/TableCustom";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { ContentCopy, Delete, Edit } from "@mui/icons-material";
import { useRef, useState } from "react";
import { useModelAssetMutation, useModelAssetPageQuery } from "./Mutation";
import { showConfirmAlert } from "../../components/Alert";
import ImportErrorDialog from "../../components/common/ImportErrorDialog";
import { useDebounce } from "../../hooks/useDebounce";
import ModelAssetForm from "./components/ModelAssetForm";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { useTabForm } from "../../redux/useTabForm";
import { hasDraftData } from "../../utils/draftUtils";
import DraftIndicator from "../../components/common/DraftIndicator";

interface ModelAssetTabState {
  showForm: boolean;
  selectedModelAsset: any | null;
  readOnly: boolean;
  isCopy: boolean;
  draftForm?: Record<string, any>;
  showBulkForm: boolean;
  bulkEditType?: "create" | "edit";
  bulkItems?: any[];
  bulkDraftData?: Record<string, any>;
}

export default function ModelAsset() {
  const { formData, setField } =
    useTabForm<ModelAssetTabState>("/mo_hinh_tai_san");
  const showForm = formData.showForm ?? false;
  const selectedModelAsset = formData.selectedModelAsset ?? null;
  const readOnly = formData.readOnly ?? false;
  const isCopy = formData.isCopy ?? false;
  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setSelectedModelAsset = (v: any) => setField({ selectedModelAsset: v });
  const setReadOnly = (v: boolean) => setField({ readOnly: v });
  const setIsCopy = (v: boolean) => setField({ isCopy: v });

  const showBulkForm = formData.showBulkForm ?? false;
  const bulkEditType = formData.bulkEditType ?? "create";
  const bulkItems = formData.bulkItems ?? [];
  const setShowBulkForm = (v: boolean) => setField({ showBulkForm: v });
  const setBulkEditType = (v: "create" | "edit") =>
    setField({ bulkEditType: v });
  const setBulkItems = (v: any[]) => setField({ bulkItems: v });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const { user } = useSelector((state: RootState) => state.user);
  const bulkFormValuesRef = useRef<any>(null);

  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const handleMinimize = () => setShowForm(false);
  const handleBulkMinimize = () => {
    setField({ bulkDraftData: bulkFormValuesRef.current });
    setShowBulkForm(false);
  };
  const isMinimized = !showForm && hasDraftData(formData.draftForm);
  const isBulkMinimized = !showBulkForm && hasDraftData(formData.bulkDraftData);

  const handleBulkCancel = () => {
    setSelectedIds([]);
    setField({
      bulkDraftData: undefined,
      bulkItems: [],
      showBulkForm: false,
    });
  };
  const handleBulkClose = (event: any, reason?: string) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      setField({ bulkDraftData: bulkFormValuesRef.current });
      setShowBulkForm(false);
      return;
    }
    handleBulkCancel();
  };

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
  } = useModelAssetMutation();

  const debouncedSearchValue = useDebounce(searchValue, 600);
  const { data: modelAssetPage = { items: [], totalItems: 0 }, isLoading } =
    useModelAssetPageQuery(
      paginationModel.page,
      paginationModel.pageSize,
      debouncedSearchValue,
    );

  const handleImport = (file: File) => {
    importExcelMutation.mutate(file, {
      onError: (error: any) => {
        if (error.message && error.message.includes("\n")) {
          const errorList = error.message.split("\n");
          setImportErrors(errorList);
          setShowErrorDialog(true);
        }
      },
    });
  };

  const handleRowClick = (params: GridRowParams) => {
    setSelectedModelAsset(params.row);
    window.scrollTo({ top: 140, behavior: "smooth" });
    setReadOnly(true);
    setShowForm(true);
  };

  const handleSave = (values: any) => {
    if (Array.isArray(values)) {
      if (bulkEditType === "create") {
        createBatchMutation.mutate(values);
      } else {
        updateBatchMutation.mutate(values);
      }
      setShowBulkForm(false);
      setBulkItems([]);
      setSelectedIds([]);
      setField({ bulkDraftData: undefined });
    } else {
      if (selectedModelAsset && !isCopy) {
        updateMutation.mutate(values);
      } else {
        createMutation.mutate(values);
      }
      setShowForm(false);
      setSelectedModelAsset(null);
      setIsCopy(false);
      setField({ draftForm: undefined });
    }
  };

  const handleEdit = () => {
    setReadOnly(false);
  };

  const handleBulkEdit = () => {
    if (selectedIds.length === 0) return;
    const itemsToEdit = modelAssetPage.items
      .filter((item: any) => selectedIds.includes(item.id))
      .sort((a: any, b: any) => a.id.localeCompare(b.id));
    setBulkEditType("edit");
    setBulkItems(itemsToEdit);
    setShowBulkForm(true);
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Mã mô hình",
      width: 120,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenMoHinh",
      headerName: "Tên mô hình",
      flex: 1,
      minWidth: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "phuongPhapKhauHao",
      headerName: "Phương pháp khấu hao",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const value = params.value;
        if (value === 1) return "Đường thẳng";
        if (value === 0) return "Khác";
        return value;
      },
    },
    {
      field: "kyKhauHao",
      headerName: "Kỳ khấu hao",
      width: 120,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "loaiKyKhauHao",
      headerName: "Loại kỳ khấu hao",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "taiKhoanTaiSan",
      headerName: "Tài khoản tài sản",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "taiKhoanKhauHao",
      headerName: "Tài khoản khấu hao",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "taiKhoanChiPhi",
      headerName: "Tài khoản chi phí",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "ngayTao",
      headerName: "Ngày tạo",
      width: 180,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "ngayCapNhat",
      headerName: "Ngày cập nhật",
      width: 180,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "nguoiTao",
      headerName: "Người tạo",
      width: 120,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "nguoiCapNhat",
      headerName: "Người cập nhật",
      width: 120,
      align: "center",
      headerAlign: "center",
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
              setSelectedModelAsset({ ...copyData, id: "" });
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
        title="Quản lý mô hình tài sản"
        onNewClick={() => {
          if (isBulkMinimized) {
            setShowBulkForm(true);
            return;
          }
          if (isMinimized) {
            setShowForm(true);
            return;
          }
          setBulkEditType("create");
          setBulkItems([{}]);
          setShowBulkForm(true);
          setSelectedModelAsset(null);
          setReadOnly(false);
        }}
        onExport={() => exportMutation.mutate()}
        onImport={handleImport}
        showExcel={true}
      />
      <ImportErrorDialog
        open={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        errors={importErrors}
      />

      <Dialog
        open={exportMutation.isPending || importExcelMutation.isPending}
        PaperProps={{
          sx: {
            borderRadius: 0,
            boxShadow: "none",
            border: "1px solid #d9d9d9",
            minWidth: "240px",
          },
        }}
      >
        <DialogContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={20} color="inherit" thickness={4} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Đang xử lý dữ liệu mô hình tài sản...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      <Box p={2}>
        <Dialog
          open={showForm}
          onClose={handleMinimize}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <ModelAssetForm
              onEdit={handleEdit}
              onCancel={() => {
                setShowForm(false);
                setSelectedModelAsset(null);
                setReadOnly(false);
                setIsCopy(false);
                setField({ draftForm: undefined });
              }}
              onMinimize={handleMinimize}
              selectedModelAsset={selectedModelAsset}
              readOnly={readOnly}
              onSave={handleSave}
              onFormChange={(values) => setField({ draftForm: values })}
              initialFormData={formData.draftForm}
            />
          </DialogContent>
        </Dialog>
        <Dialog
          open={showBulkForm}
          onClose={handleBulkClose}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <ModelAssetForm
              key={`bulk-${bulkItems.length}`}
              onEdit={handleEdit}
              onCancel={handleBulkCancel}
              onMinimize={handleBulkMinimize}
              selectedModelAsset={null}
              readOnly={false}
              onSave={handleSave}
              onFormChange={undefined}
              initialFormData={formData.bulkDraftData}
              isBulkMode={true}
              bulkItems={bulkItems}
              onBulkItemsChange={(items) => {
                bulkFormValuesRef.current = { items, bulkEditType };
              }}
              bulkEditType={bulkEditType}
            />
          </DialogContent>
        </Dialog>

        {isBulkMinimized ? (
          <DraftIndicator onClick={() => setShowBulkForm(true)} />
        ) : (
          isMinimized && <DraftIndicator onClick={() => setShowForm(true)} />
        )}

        <TableCustom
          tableId="modelAsset"
          title="Quản lý mô hình tài sản"
          columns={columns}
          rows={modelAssetPage.items}
          total={modelAssetPage.totalItems}
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
          onImportExcel={handleImport}
          onExportExcel={() => exportMutation.mutate()}
          onBulkEdit={selectedIds.length > 1 ? handleBulkEdit : undefined}
        />
      </Box>
    </Box>
  );
}
