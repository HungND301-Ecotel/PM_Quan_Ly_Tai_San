import { ContentCopy, Delete, Edit } from "@mui/icons-material";
import {
  Box,
  Chip,
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
import CapitalSourceForm from "./components/CapitalSourceForm";
import {
  useAllCapitalSourceQuery,
  useCapitalSourceMutation,
  useCapitalSourcePageQuery,
} from "./Mutation";
import { showConfirmAlert } from "../../components/Alert";
import { useDebounce } from "../../hooks/useDebounce";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useTabForm } from "../../redux/useTabForm";
import { hasDraftData } from "../../utils/draftUtils";
import DraftIndicator from "../../components/common/DraftIndicator";

interface CapitalSourceTabState {
  showForm: boolean;
  selectedCapitalSource: any | null;
  readOnly: boolean;
  isCopy: boolean;
  draftForm?: Record<string, any>;
  showBulkForm: boolean;
  bulkEditType?: "create" | "edit";
  bulkItems?: any[];
  bulkDraftData?: Record<string, any>;
}

export default function CapitalSource() {
  const { formData, setField } =
    useTabForm<CapitalSourceTabState>("/nguon_von");
  const showForm = formData.showForm ?? false;
  const selectedCapitalSource = formData.selectedCapitalSource ?? null;
  const readOnly = formData.readOnly ?? false;
  const isCopy = formData.isCopy ?? false;
  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setSelectedCapitalSource = (v: any) =>
    setField({ selectedCapitalSource: v });
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
    deleteOneMutation,
    deleteManyMutation,
    importExcelMutation,
    exportMutation,
    deleteAllMutation,
    createBatchMutation,
    updateBatchMutation,
  } = useCapitalSourceMutation();

  const debouncedSearchValue = useDebounce(searchValue, 600);
  const { data: capitalSourcesPage = { items: [], totalItems: 0 }, isLoading } =
    useCapitalSourcePageQuery(
      paginationModel.page,
      paginationModel.pageSize,
      debouncedSearchValue,
    );

  const handleRowClick = (params: GridRowParams) => {
    setSelectedCapitalSource(params.row);
    window.scrollTo({ top: 140, behavior: "smooth" });
    setReadOnly(true);
    setShowForm(true);
  };

  const handleEdit = () => {
    setReadOnly(false);
  };

  const handleBulkEdit = () => {
    if (selectedIds.length === 0) return;
    const itemsToEdit = capitalSourcesPage.items
      .filter((item: any) => selectedIds.includes(item.id))
      .sort((a: any, b: any) => a.id.localeCompare(b.id));
    setBulkEditType("edit");
    setBulkItems(itemsToEdit);
    setShowBulkForm(true);
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
      if (selectedCapitalSource && !isCopy) {
        updateMutation.mutate(values);
      } else {
        createMutation.mutate(values);
      }
      setShowForm(false);
      setSelectedCapitalSource(null);
      setIsCopy(false);
      setField({ draftForm: undefined });
    }
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Mã nguồn kinh phí",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenNguonKinhPhi",
      headerName: "Tên nguồn kinh phí",
      flex: 1,
      minWidth: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "ghiChu",
      headerName: "Ghi chú",
      width: 300,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const isActive = params.row.isActive;
        return (
          <Chip
            label={isActive ? "Hoạt động" : "Không hoạt động"}
            size="small"
            sx={{
              bgcolor: isActive ? "#baf7cbff" : "#f5f5f5",
              color: isActive ? "#137333" : "#616161",
              border: "none",
            }}
          />
        );
      },
    },
    {
      field: "active",
      headerName: "Hiệu lực",
      width: 200,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const isActive = params.row.hieuLuc;
        return (
          <Chip
            label={isActive ? "Có hiệu lực" : "Không hiệu lực"}
            size="small" // Nên để small cho gọn trong bảng
            sx={{
              bgcolor: isActive ? "#baf7cbff" : "#f5f5f5",

              color: isActive ? "#137333" : "#616161",

              // Bỏ viền nếu không cần
              border: "none",
            }}
          />
        );
      },
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
              setSelectedCapitalSource({ ...copyData, id: "" });
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
        title="Quản lý nguồn vốn"
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
          setSelectedCapitalSource(null);
          setReadOnly(false);
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
                Đang xử lý dữ liệu nguồn vốn...
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>
        <Dialog
          open={showForm}
          onClose={handleMinimize}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <CapitalSourceForm
              onCancel={() => {
                setShowForm(false);
                setSelectedCapitalSource(null);
                setReadOnly(false);
                setIsCopy(false);
                setField({ draftForm: undefined });
              }}
              onMinimize={handleMinimize}
              onEdit={handleEdit}
              selectedCapitalSource={selectedCapitalSource}
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
            <CapitalSourceForm
              onEdit={() => {}}
              onCancel={() => {
                setBulkItems([]);
                setSelectedIds([]);
                setField({ bulkDraftData: undefined });
                setShowBulkForm(false);
              }}
              onMinimize={handleBulkMinimize}
              selectedCapitalSource={null}
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
          tableId="capitalSource"
          title="Quản lý nguồn vốn"
          columns={columns}
          rows={capitalSourcesPage.items}
          total={capitalSourcesPage.totalItems}
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
