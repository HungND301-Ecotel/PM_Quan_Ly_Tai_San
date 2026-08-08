import { ContentCopy, Delete, Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import PageAction from "../../components/common/PageAction";
import TableCustom from "../../components/common/TableCustom";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import StaffForm from "./components/StaffForm";
import StaffBulkForm from "./components/StaffBulkForm";
import { useStaffMutation, useStaffPagesQuery } from "./Mutation";
import { showConfirmAlert, showErrorAlert } from "../../components/Alert";
import ImportErrorDialog from "../../components/common/ImportErrorDialog";
import { useDebounce } from "../../hooks/useDebounce";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useTabForm } from "../../redux/useTabForm";
import DraftIndicator from "../../components/common/DraftIndicator";
import { hasDraftData } from "../../utils/draftUtils";

interface StaffTabState {
  showForm: boolean;
  isCopy: boolean;
  selectedStaff: any | null;
  readOnly: boolean;
  draftForm?: Record<string, any>;
  draftBulkForm?: Record<string, any>;
  showBulkForm: boolean;
  bulkMode: "add" | "edit";
  bulkItems: any[];
  selectedRows: any[];
}

export default function Staff() {
  const { formData, setField } = useTabForm<StaffTabState>("/nhan_vien");
  const showForm = formData.showForm ?? false;
  const isCopy = formData.isCopy ?? false;
  const selectedStaff = formData.selectedStaff ?? null;
  const readOnly = formData.readOnly ?? false;

  // Setter helper cho gọn
  const setShowForm = (v: boolean) => setField({ showForm: v });
  const setIsCopy = (v: boolean) => setField({ isCopy: v });
  const setSelectedStaff = (v: any) => setField({ selectedStaff: v });
  const setReadOnly = (v: boolean) => setField({ readOnly: v });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const showBulkForm = formData.showBulkForm ?? false;
  const bulkMode = formData.bulkMode ?? "add";
  const bulkItems = formData.bulkItems ?? [];
  const selectedRows = formData.selectedRows ?? [];

  const setShowBulkForm = (value: boolean) => setField({ showBulkForm: value });
  const setBulkMode = (value: "add" | "edit") => setField({ bulkMode: value });
  const setBulkItems = (value: any[]) => setField({ bulkItems: value });
  const setSelectedRows = (value: any[]) => setField({ selectedRows: value });

  const [searchValue, setSearchValue] = useState("");
  const { user } = useSelector((state: RootState) => state.user);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);

  const {
    createMutation,
    createManyMutation,
    updateMutation,
    updateManyMutation,
    deleteOneMutation,
    deleteManyMutation,
    uploadMutation,
    exportMutation,
    importExcelMutation,
    deleteAllMutation,
    uploadMultipleSignaturesMutation,
  } = useStaffMutation();

  const debouncedSearchValue = useDebounce(searchValue, 600);
  const { data: staffsPage = { items: [], totalItems: 0 }, isLoading } =
    useStaffPagesQuery(
      paginationModel.page,
      paginationModel.pageSize,
      debouncedSearchValue,
    );

  const handleRowClick = (params: GridRowParams) => {
    setSelectedStaff(params.row);
    window.scrollTo({ top: 140, behavior: "smooth" });
    setReadOnly(true);
    setShowForm(true);
  };

  const handleSave = (values: any) => {
    if (selectedStaff && !isCopy) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
    setShowForm(false);
    setSelectedStaff(null);
    setIsCopy(false);
    setField({ draftForm: undefined });
  };

  const handleEdit = () => {
    setReadOnly(false);
  };

  const handleBulkEdit = () => {
    const rowsToEdit = selectedRows.length
      ? selectedRows
      : staffsPage.items.filter((item: any) => selectedIds.includes(item.id));
    if (rowsToEdit.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một nhân viên để sửa hàng loạt");
      return;
    }
    setField({
      bulkMode: "edit",
      bulkItems: rowsToEdit,
      showBulkForm: true,
    });
  };

  const handleBulkSave = (items: any[]) => {
    if (bulkMode === "edit") {
      updateManyMutation.mutate(items);
    } else {
      createManyMutation.mutate(items);
    }
    setShowBulkForm(false);
    setBulkItems([]);
    setSelectedIds([]);
    setSelectedRows([]);
    setField({ draftBulkForm: undefined });
  };

  const bulkFormValuesRef = useRef<any>(null);

  const handleBulkClose = (event: any, reason?: string) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      setField({ draftBulkForm: bulkFormValuesRef.current });
      setShowBulkForm(false);
      return;
    }
    handleBulkCancel();
  };
  const handleBulkMinimize = () => {
    setField({ draftBulkForm: bulkFormValuesRef.current });
    setShowBulkForm(false);
  };

  const handleBulkCancel = () => {
    setShowBulkForm(false);
    setBulkItems([]);
    setField({ draftBulkForm: undefined });
  };

  const handleImport = (file: File) => {
    importExcelMutation.mutate(file, {
      onError: (error: any) => {
        // Kiểm tra nếu server trả về danh sách lỗi (array)
        const serverErrors = error.response?.data?.errors;
        if (Array.isArray(serverErrors) && serverErrors.length > 0) {
          setImportErrors(serverErrors);
          setOpenErrorDialog(true);
        } else {
          // Nếu không có mảng lỗi cụ thể, hiện alert lỗi chung như cũ
          showErrorAlert(
            error.response?.data?.message || "Lỗi khi nhập dữ liệu",
          );
        }
      },
    });
  };
  const isMinimized = !showForm && hasDraftData(formData.draftForm);
  const isBulkMinimized = !showBulkForm && hasDraftData(formData.draftBulkForm);

  const handleMinimize = () => {
    setShowForm(false);
    // Không xóa draftForm, không reset selectedStaff
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Mã nhân viên",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "hoTen",
      headerName: "Tên nhân viên",
      flex: 1,
      minWidth: 200,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "diDong",
      headerName: "Số điện thoại",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "emailCongViec",
      headerName: "Email",
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenPhongBan",
      headerName: "Phòng ban",
      width: 180,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "tenChucVu",
      headerName: "Chức vụ",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "signature",
      headerName: "Quyền ký",
      flex: 2,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const isFlashSign = params.row.kyNhay;
        const isNormalSign = params.row.kyThuong;
        const isDigitalSign = params.row.kySo;
        const isSignature = !isFlashSign && !isNormalSign && !isDigitalSign;
        return (
          <Box
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            gap={1}
            py={1}
            height={"auto"}
          >
            {isFlashSign && (
              <Chip
                size="small"
                color="secondary"
                label="Ký nháy"
                sx={{ color: "white" }}
              />
            )}
            {isNormalSign && (
              <Chip
                size="small"
                color="primary"
                label="Ký thường"
                sx={{ color: "white" }}
              />
            )}
            {isDigitalSign && (
              <Chip
                size="small"
                color="success"
                label="Ký số"
                sx={{ color: "white" }}
              />
            )}
            {isSignature && (
              <Chip
                size="small"
                color="error"
                label="Không ký"
                sx={{ color: "white" }}
              />
            )}
          </Box>
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
              setSelectedStaff({ ...copyData, id: "" });
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
        title="Quản lý nhân viên"
        onNewClick={() => {
          if (isMinimized) {
            setShowBulkForm(true);
            return;
          }
          setBulkMode("add");
          setBulkItems([]);
          setShowBulkForm(true);
        }}
        onExport={() => exportMutation.mutate()}
        onImport={handleImport}
        showExcel={true}
        showImportSignature={true}
        onImportSignature={(files) => {
          uploadMultipleSignaturesMutation.mutate(files);
        }}
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
        <Dialog
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedStaff(null);
            setReadOnly(false);
            setIsCopy(false);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              border: "2px solid #1FA463",
            },
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <StaffForm
              onCancel={() => {
                setShowForm(false);
                setSelectedStaff(null);
                setReadOnly(false);
                setIsCopy(false);
                setField({ draftForm: undefined });
              }}
              onMinimize={handleMinimize}
              onEdit={handleEdit}
              selectedStaff={selectedStaff}
              readOnly={readOnly}
              onSave={handleSave}
              onUpload={uploadMutation.mutate}
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
          PaperProps={{
            sx: {
              borderRadius: "16px",
              border: "2px solid #1FA463",
            },
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <StaffBulkForm
              mode={bulkMode}
              initialItems={bulkItems}
              onCancel={handleBulkCancel}
              onMinimize={handleBulkMinimize}
              onSave={handleBulkSave}
              onFormChange={(values) => {
                bulkFormValuesRef.current = values;
              }}
              initialFormData={formData.draftBulkForm}
            />
          </DialogContent>
        </Dialog>

        {isBulkMinimized ? (
          <DraftIndicator onClick={() => setShowBulkForm(true)} />
        ) : (
          isMinimized && <DraftIndicator onClick={() => setShowForm(true)} />
        )}

        <TableCustom
          tableId="staff"
          title="Quản lý nhân viên"
          columns={columns}
          rows={staffsPage.items}
          total={staffsPage.totalItems}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={isLoading}
          onRowClick={handleRowClick}
          selectedIds={selectedIds}
          onSelectionChange={(ids) => {
            setSelectedIds(ids);
            if (ids.length === 0) {
              setSelectedRows([]);
            }
          }}
          onSelectionRowsChange={setSelectedRows}
          onDelete={deleteManyMutation.mutate}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          titleSearch="Tìm kiếm theo tên nhân viên, mã nhân viên, ..."
          onDeleteAll={deleteAllMutation.mutate}
          showDeleteAll={user?.taiKhoan?.tenDangNhap === "admin"}
          onImportExcel={handleImport}
          onExportExcel={() => exportMutation.mutate()}
          onBulkEdit={selectedIds.length > 0 ? handleBulkEdit : undefined}
        />
      </Box>
      <ImportErrorDialog
        open={openErrorDialog}
        errors={importErrors}
        onClose={() => setOpenErrorDialog(false)}
      />
    </Box>
  );
}
