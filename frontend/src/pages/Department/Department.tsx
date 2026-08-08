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
import DepartmentForm from "./components/DepartmentForm";
import { ContentCopy, Delete, Edit } from "@mui/icons-material";
import { useState } from "react";

import {
  useDepartmentMutation,
  useDepartmentsPageQuery,
} from "./Mutation";
import { showConfirmAlert } from "../../components/Alert";
import { useDebounce } from "../../hooks/useDebounce";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useTabForm } from "../../redux/useTabForm";
import { hasDraftData } from "../../utils/draftUtils";
import DraftIndicator from "../../components/common/DraftIndicator";
import { DepartmentType } from "./types";
import BulkDepartmentForm from "./components/DepartmentBulkForm";

interface DepartmentTabState {
  showForm: boolean;
  selectedDepartment: any | null;
  readOnly: boolean;
  isCopy: boolean;
  draftForm?: Record<string, any>;
  bulkOpen?: boolean;
  bulkMode?: "create" | "edit";
  bulkDraft?: DepartmentType[];
}

export default function Department() {
  const { formData, setField } = useTabForm<DepartmentTabState>("/phong_ban");
  const showForm = formData.showForm ?? false;
  const isCopy = formData.isCopy ?? false;
  const selectedDepartment = formData.selectedDepartment ?? null;
  const readOnly = formData.readOnly ?? false;

  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setIsCopy = (v: boolean) => setField({ isCopy: v });
  const setSelectedDepartment = (v: any) => setField({ selectedDepartment: v });
  const setReadOnly = (v: boolean) => setField({ readOnly: v });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const { user } = useSelector((state: RootState) => state.user);

  const bulkOpen = formData.bulkOpen ?? false;
  const bulkMode = formData.bulkMode ?? "create";
  const bulkInitialRows = formData.bulkDraft ?? [];

  const setBulkOpen = (v: boolean) => setField({ bulkOpen: v });
  const setBulkMode = (v: "create" | "edit") => setField({ bulkMode: v });
  const setBulkInitialRows = (v: DepartmentType[]) =>
    setField({ bulkDraft: v });

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const {
    createMutation,
    createManyMutation,
    updateMutation,
    updateManyMutation,
    deleteOneMutation,
    deleteManyMutation,
    importExcelMutation,
    exportMutation,
    deleteAllMutation,
  } = useDepartmentMutation();

  const debouncedSearchValue = useDebounce(searchValue, 600);
  const { data: departmentsPage = { items: [], totalItems: 0 }, isLoading } =
    useDepartmentsPageQuery(
      paginationModel.page,
      paginationModel.pageSize,
      debouncedSearchValue,
    );


  const handleRowClick = (params: GridRowParams) => {
    setSelectedDepartment(params.row);
    window.scrollTo({ top: 140, behavior: "smooth" });
    setReadOnly(true);
    setShowForm(true);
  };

  const handleSave = (values: any) => {
    if (selectedDepartment && !isCopy) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
    setShowForm(false);
    setSelectedDepartment(null);
    setIsCopy(false);
    setField({ draftForm: undefined });
  };

  const handleOpenBulkCreate = () => {
    setBulkInitialRows([]);
    setBulkMode("create");
    setBulkOpen(true);
  };

  const handleOpenBulkEdit = () => {
    const selectedRows = departmentsPage.items.filter((item: DepartmentType) =>
      selectedIds.includes(item.id),
    );
    if (selectedRows.length === 0) return;
    setBulkInitialRows(selectedRows);
    setBulkMode("edit");
    setBulkOpen(true);
  };

  const handleBulkSave = (rows: DepartmentType[]) => {
    if (bulkMode === "create") {
      createManyMutation.mutate(rows);
    } else {
      updateManyMutation.mutate(rows);
    }
    setBulkOpen(false);
    setBulkInitialRows([]);
    setField({ bulkDraft: undefined });
    setSelectedIds([]);
  };

  const isMinimized = !showForm && hasDraftData(formData.draftForm);
  const isMinimizedBulk = !bulkOpen && bulkInitialRows.length > 0;
  const handleMinimize = () => setShowForm(false);

  const handleEdit = () => {
    setReadOnly(false);
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Mã phòng ban",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenPhongBan",
      headerName: "Tên phòng/ban",
      flex: 1,
      minWidth: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenPhongCapTren",
      headerName: "Phòng ban cấp trên",
      flex: 1,
      minWidth: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "soLuongNhanVien",
      headerName: "Số lượng nhân viên",
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
              setSelectedDepartment({ ...copyData, id: "" });
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
        title="Quản lý phòng ban"
        onNewClick={() => {
          if (isMinimized) {
            setShowForm(true);
            return;
          }
          handleOpenBulkCreate();
          setSelectedDepartment(null);
          setReadOnly(false);
        }}
        onExport={() => exportMutation.mutate()}
        onImport={(file) => importExcelMutation.mutate(file)}
        showExcel={true}
      />
      <Box p={2}>
        {/* Processing overlay */}
        <Dialog
          open={
            exportMutation.isPending ||
            importExcelMutation.isPending ||
            createManyMutation.isPending ||
            updateManyMutation.isPending
          }
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

        {/* Single form Dialog */}
        <Dialog
          open={showForm}
          onClose={handleMinimize}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <DepartmentForm
              onCancel={() => {
                setShowForm(false);
                setSelectedDepartment(null);
                setReadOnly(false);
                setField({ draftForm: undefined });
              }}
              onMinimize={handleMinimize}
              onEdit={handleEdit}
              selectedDepartment={selectedDepartment}
              readOnly={readOnly}
              onSave={handleSave}
              onFormChange={(values) => setField({ draftForm: values })}
              initialFormData={formData.draftForm}
            />
          </DialogContent>
        </Dialog>

        {/* Bulk form Dialog */}
        <BulkDepartmentForm
          open={bulkOpen}
          onClose={() => {
            setBulkOpen(false);
          }}
          onCancel={() => {
            setBulkOpen(false);
            setBulkInitialRows([]);
            setField({ bulkDraft: undefined });
          }}
          initialRows={bulkInitialRows}
          onSave={handleBulkSave}
          mode={bulkMode}
          onRowsChange={(rows: any) => setBulkInitialRows(rows)}
        />

        {isMinimized && <DraftIndicator onClick={() => setShowForm(true)} />}
        {isMinimizedBulk && (
          <DraftIndicator onClick={() => setBulkOpen(true)} />
        )}

        <TableCustom
          tableId="department"
          title="Quản lý phòng ban"
          columns={columns}
          rows={departmentsPage.items}
          total={departmentsPage.totalItems}
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
          onBulkEdit={selectedIds.length > 0 ? handleOpenBulkEdit : undefined}
          bulkEditCount={selectedIds.length}
        />
      </Box>
    </Box>
  );
}
