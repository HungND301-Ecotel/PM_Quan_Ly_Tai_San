import { ContentCopy, Delete, Edit } from "@mui/icons-material";
import {
  Box,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import { useState } from "react";
import PageAction from "../../components/common/PageAction";
import TableCustom from "../../components/common/TableCustom";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import TypeAssetForm from "./components/UnitForm";
import {
  useAllUnitsQuery,
  useUnitMutation,
  useUnitPagesQuery,
} from "./Mutation";
import { showConfirmAlert } from "../../components/Alert";
import ImportErrorDialog from "../../components/common/ImportErrorDialog";
import { useDebounce } from "../../hooks/useDebounce";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { useTabForm } from "../../redux/useTabForm";
import { hasDraftData } from "../../utils/draftUtils";
import DraftIndicator from "../../components/common/DraftIndicator";

interface UnitTabState {
  showForm: boolean;
  selectedUnit: any | null;
  readOnly: boolean;
  isCopy: boolean;
  draftForm?: Record<string, any>;
  showBulkForm: boolean;
  bulkEditType?: "create" | "edit";
  bulkItems?: any[];
  bulkDraftData?: Record<string, any>;
}

export default function Unit() {
  const { formData, setField } = useTabForm<UnitTabState>("/don_vi_tinh");
  const showForm = formData.showForm ?? false;
  const selectedUnit = formData.selectedUnit ?? null;
  const readOnly = formData.readOnly ?? false;
  const isCopy = formData.isCopy ?? false;
  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setSelectedUnit = (v: any) => setField({ selectedUnit: v });
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

  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const handleMinimize = () => setShowForm(false);
  const isMinimized = !showForm && hasDraftData(formData.draftForm);
  const handleBulkMinimize = () => setShowBulkForm(false);
  const isBulkMinimized = !showBulkForm && hasDraftData(formData.bulkDraftData);

  const {
    createMutation,
    updateMutation,
    importExcelMutation,
    exportMutation,
    deleteOneMutation,
    deleteManyMutation,
    deleteAllMutation,
    createBatchMutation,
    updateBatchMutation,
  } = useUnitMutation();
  const debouncedSearchValue = useDebounce(searchValue, 600);
  const { data: unitPages = { items: [], totalItems: 0 }, isLoading } =
    useUnitPagesQuery(
      paginationModel.page,
      paginationModel.pageSize,
      debouncedSearchValue,
    );

  const handleImport = (file: File) => {
    importExcelMutation.mutate(file, {
      onError: (error: any) => {
        if (error.message && error.message.includes("\n")) {
          setImportErrors(error.message.split("\n"));
          setShowErrorDialog(true);
        }
      },
    });
  };

  const handleRowClick = (params: GridRowParams) => {
    setSelectedUnit(params.row);
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
      if (selectedUnit && !isCopy) {
        updateMutation.mutate(values);
      } else {
        createMutation.mutate(values);
      }
      setShowForm(false);
      setSelectedUnit(null);
      setIsCopy(false);
      setField({ draftForm: undefined });
    }
  };

  const handleEdit = () => {
    setReadOnly(false);
  };

  const handleBulkEdit = () => {
    if (selectedIds.length === 0) return;
    const itemsToEdit = unitPages.items
      .filter((item: any) => selectedIds.includes(item.id))
      .sort((a: any, b: any) => a.id.localeCompare(b.id));
    setBulkEditType("edit");
    setBulkItems(itemsToEdit);
    setShowBulkForm(true);
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Mã đơn vị tính",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenDonVi",
      headerName: "Tên đơn vị tính",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "note",
      headerName: "Ghi chú",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "laHeThong",
      headerName: "Hệ thống",
      minWidth: 70,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography>{params.row.laHeThong ? "✓" : ""}</Typography>
      ),
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
              setSelectedUnit({ ...copyData, id: "" });
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
        title="Quản lý đơn vị tính"
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
          setSelectedUnit(null);
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

      {/* Dialog Loading */}
      <Dialog open={exportMutation.isPending || importExcelMutation.isPending}>
        <DialogContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={20} />
            <Typography variant="body2">
              Đang xử lý dữ liệu đơn vị tính...
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
            <TypeAssetForm
              onCancel={() => {
                setShowForm(false);
                setSelectedUnit(null);
                setReadOnly(false);
                setIsCopy(false);
                setField({ draftForm: undefined });
              }}
              onMinimize={handleMinimize}
              onEdit={handleEdit}
              selectedUnit={selectedUnit}
              readOnly={readOnly}
              onSave={handleSave}
              onFormChange={(values) => setField({ draftForm: values })}
              initialFormData={formData.draftForm}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={showBulkForm}
          onClose={handleBulkMinimize}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <TypeAssetForm
              onEdit={() => {}}
              onCancel={() => {
                setBulkItems([]);
                setSelectedIds([]);
                setField({ bulkDraftData: undefined });
                setShowBulkForm(false);
              }}
              onMinimize={handleBulkMinimize}
              selectedUnit={null}
              readOnly={false}
              onSave={handleSave}
              isBulkMode={true}
              bulkItems={bulkItems}
              onBulkItemsChange={(items) => {
                setField({
                  bulkDraftData: { items, bulkEditType },
                  bulkItems: items,
                });
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
          tableId="unit"
          title="Quản lý đơn vị tính"
          columns={columns}
          rows={unitPages.items}
          total={unitPages.totalItems}
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
