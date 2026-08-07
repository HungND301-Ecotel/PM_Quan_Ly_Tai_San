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
import { Delete, ContentCopy, Edit } from "@mui/icons-material";
import AssetGroupForm from "./components/AssetGroupForm";
import { useState } from "react";
import {
  useAllAssetGroupQuery,
  useAssetGroupMutation,
  useAssetGroupPageQuery,
  useLyLichQuery,
} from "./Mutation";
import { showConfirmAlert } from "../../components/Alert";
import ImportErrorDialog from "../../components/common/ImportErrorDialog";
import { useDebounce } from "../../hooks/useDebounce";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { useTabForm } from "../../redux/useTabForm";
import { hasDraftData } from "../../utils/draftUtils";
import DraftIndicator from "../../components/common/DraftIndicator";

interface AssetGroupTabState {
  showForm: boolean;
  selectedAssetGroup: any | null;
  readOnly: boolean;
  bulkMode: boolean;
  bulkEditType?: "create" | "edit";
  bulkItems?: any[];
  bulkDraftData?: Record<string, any>;
}

export default function AssetGroup() {
  const { formData, setField } =
    useTabForm<AssetGroupTabState>("/nhom_tai_san");
  const showForm = formData.showForm ?? false;
  const selectedAssetGroup = formData.selectedAssetGroup ?? null;
  const readOnly = formData.readOnly ?? false;
  const bulkMode = formData.bulkMode ?? false;
  const bulkEditType = formData.bulkEditType ?? "create";
  const bulkItems = formData.bulkItems ?? [];

  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setSelectedAssetGroup = (v: any) => setField({ selectedAssetGroup: v });
  const setReadOnly = (v: boolean) => setField({ readOnly: v });
  const setBulkMode = (v: boolean) => setField({ bulkMode: v });
  const setBulkEditType = (v: "create" | "edit") =>
    setField({ bulkEditType: v });
  const setBulkItems = (v: any[]) => setField({ bulkItems: v });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const { user } = useSelector((state: RootState) => state.user);

  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  // Thêm handleMinimize
  const handleMinimize = () => {
    setShowForm(false);
  };
  const handleRestoreFromDraft = () => {
    const draft = formData.bulkDraftData;
    if (draft?.items && Array.isArray(draft.items)) {
      setBulkItems(draft.items);
    }
    if (draft?.bulkEditType) {
      setBulkEditType(draft.bulkEditType);
    }
    setBulkMode(true);
    setShowForm(true);
  };
  const isMinimized = !showForm && hasDraftData(formData.bulkDraftData);

  const {
    createMutation,
    updateMutation,
    deleteOneMutation,
    deleteManyMutation,
    importExcelMutation,
    exportMutation,
    deleteAllMutation,
  } = useAssetGroupMutation(
  );

  const debouncedSearchValue = useDebounce(searchValue, 600);
  const { data: assetGroupPage = { items: [], totalItems: 0 }, isLoading } =
    useAssetGroupPageQuery(
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
    // Cancel bulk mode khi click vào single row
    if (bulkMode) {
      setBulkMode(false);
      setBulkItems([]);
    }
    setSelectedAssetGroup(params.row);
    window.scrollTo({ top: 140, behavior: "smooth" });
    setReadOnly(true);
    setShowForm(true);
  };

  const handleSave = (values: any) => {
    if (bulkMode) {
      // Bulk save - handle both create and edit
      if (bulkEditType === "create") {
        // Create multiple items
        Promise.all(values.map((item: any) => createMutation.mutateAsync(item)))
          .then(() => {
            setBulkMode(false);
            setBulkItems([]);
            setShowForm(false);
            setField({ bulkDraftData: undefined });
          })
          .catch((error) => {
            console.error("Bulk create error:", error);
          });
      } else {
        // Edit multiple items
        Promise.all(values.map((item: any) => updateMutation.mutateAsync(item)))
          .then(() => {
            setBulkMode(false);
            setBulkItems([]);
            setShowForm(false);
            setSelectedIds([]);
            setField({ bulkDraftData: undefined });
          })
          .catch((error) => {
            console.error("Bulk update error:", error);
          });
      }
    } else {
      // Single edit mode
      updateMutation.mutate(values);
      setShowForm(false);
      setSelectedAssetGroup(null);
      setField({ bulkDraftData: undefined });
    }
  };

  const handleBulkEdit = () => {
    if (selectedIds.length === 0) return;

    // Get selected items from table
    const itemsToEdit = assetGroupPage.items
      .filter((item: any) => selectedIds.includes(item.id))
      .sort((a: any, b: any) => a.id.localeCompare(b.id));

    setBulkMode(true);
    setBulkEditType("edit");
    setBulkItems(itemsToEdit);
    setShowForm(true);
  };

  const handleCopyItem = (item: any) => {
    // Copy item to bulk create mode (without id)
    const { id, ...copyData } = item;
    const copiedItem = {
      ...copyData,
      id: "",
    };
    setBulkMode(true);
    setBulkEditType("create");
    setBulkItems([copiedItem]);
    setShowForm(true);
    setSelectedAssetGroup(null);
    setReadOnly(false);
  };

  const handleStartBulkCreate = () => {
    if (isMinimized) {
      handleRestoreFromDraft();
      return;
    }
    setBulkMode(true);
    setBulkEditType("create");
    setBulkItems([{}]);
    setShowForm(true);
    setSelectedAssetGroup(null);
    setReadOnly(false);
  };
  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Mã nhóm tài sản",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenNhom",
      headerName: "Tên nhóm tài sản",
      flex: 1,
      minWidth: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "lyLichName",
      headerName: "Tên lý lịch",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      valueGetter: (value: any, row: any) => row?.lyLich?.tenLyLich || "N/A",
    },
    {
      field: "ngayTao",
      headerName: "Ngày tạo",
      width: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "ngayCapNhat",
      headerName: "Ngày cập nhật",
      width: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "nguoiTao",
      headerName: "Người tạo",
      width: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "nguoiCapNhat",
      headerName: "Người cập nhật",
      width: 200,
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
              setReadOnly(false);
            }}
          >
            <Edit color="primary" />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleCopyItem(params.row);
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
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", px: 2, py: 1 }}>
        <Box sx={{ flex: 1 }}>
          <PageAction
            title="Quản lý nhóm tài sản"
            onNewClick={handleStartBulkCreate}
            onExport={() => exportMutation.mutate()}
            onImport={handleImport}
            showExcel={true}
          />
        </Box>
      </Box>
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
              Đang xử lý dữ liệu nhóm tài sản...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      <Box p={2}>
        <Dialog
          open={showForm}
          onClose={handleMinimize}
          maxWidth={bulkMode ? "sm" : "md"}
          fullWidth
          slotProps={{
            paper: {
              sx: {
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              },
            },
          }}
        >
          <DialogContent
            sx={{
              p: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              flex: 1,
            }}
          >
            {bulkMode || selectedAssetGroup ? (
              <AssetGroupForm
                key={
                  bulkMode
                    ? `bulk-${bulkItems.length}`
                    : `single-${selectedAssetGroup?.id || "view"}`
                }
                onCancel={() => {
                  // Clear all data FIRST before closing form
                  if (bulkMode) {
                    setBulkMode(false);
                    setBulkItems([]);
                    setSelectedIds([]);
                  } else {
                    setSelectedAssetGroup(null);
                    setReadOnly(false);
                  }
                  setField({ bulkDraftData: undefined });
                  // Then close form
                  setShowForm(false);
                }}
                onMinimize={handleMinimize}
                onEdit={() => setReadOnly(false)}
                selectedAssetGroup={selectedAssetGroup}
                readOnly={readOnly}
                onSave={handleSave}
                onFormChange={undefined}
                initialFormData={bulkMode ? formData.bulkDraftData : undefined}
                isBulkMode={bulkMode}
                bulkItems={bulkItems}
                onBulkItemsChange={(items) => {
                  setBulkItems(items);
                  setField({ bulkDraftData: { items, bulkEditType } });
                }}
                bulkEditType={bulkEditType}
              />
            ) : null}
          </DialogContent>
        </Dialog>

        {isMinimized && <DraftIndicator onClick={handleRestoreFromDraft} />}

        <TableCustom
          tableId="assetGroup"
          title="Quản lý nhóm tài sản"
          columns={columns}
          rows={assetGroupPage.items}
          total={assetGroupPage.totalItems}
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
