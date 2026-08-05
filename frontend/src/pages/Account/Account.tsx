import { useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { Edit, Trash2, ShieldCheck } from "lucide-react";
import PageAction from "../../components/common/PageAction";
import TableCustom from "../../components/common/TableCustom";
import { useAccountMutation } from "./Mutation";
import { AccountData } from "./types";
import { showConfirmAlert, showErrorAlert } from "../../components/Alert";
import AccountModal from "./components/AccountModal/AccountModal";
import PermissionModal from "./components/PermissionModal/PermissionModal";
import EditAccountModal from "./components/EditAccountModal/EditAccountModal";
import { useSelector } from "react-redux";

export default function Account() {
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountData | null>(
    null,
  );
  const [readOnly, setReadOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [showAccountModal, setShowAccountModal] = useState(false);

  const currentUser = useSelector((state: any) => state.user.user);

  const [permissionUserId, setPermissionUserId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState({
    open: false,
    data: null as AccountData | null,
  });

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  const {
    accountPage,
    isLoading,
    deleteAccountMutation,
    createMutation,
    updateMutation,
  } = useAccountMutation(
    paginationModel.page,
    paginationModel.pageSize,
    searchValue,
    undefined,
    currentUser?.taiKhoan?.idCongTy,
  );
  const handleRowClick = (params: GridRowParams) => {
    setSelectedAccount(params.row);
    setReadOnly(true);
    setShowForm(true);
  };

  const handleEdit = () => {
    setReadOnly(false);
  };

  const handleSave = (values: any) => {
    if (selectedAccount) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
    setShowForm(false);
    setSelectedAccount(null);
  };

  const handleDeleteMany = async (ids: string[]) => {
    const confirm = await showConfirmAlert(
      `Xác nhận xóa ${ids.length} tài khoản!`,
    );
    if (confirm.isConfirmed) {
      ids.forEach((id) => deleteAccountMutation.mutate(id));
      setSelectedIds([]);
    }
  };

  const columns: GridColDef<AccountData>[] = [
    { field: "tenDangNhap", headerName: "Mã danh bộ", width: 120 },
    {
      field: "tenPhongBan",
      headerName: "Phòng ban",
      flex: 1,
      minWidth: 200,
    },
    { field: "username", headerName: "Tên đăng nhập", width: 130 },
    { field: "hoTen", headerName: "Họ tên", flex: 1, minWidth: 180 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
    { field: "soDienThoai", headerName: "Số điện thoại", width: 120 },
    { field: "ngayTao", headerName: "Ngày tạo", width: 150 },
    { field: "ngayCapNhat", headerName: "Ngày cập nhật", width: 150 },
    { field: "nguoiTao", headerName: "Người tạo", width: 120 },
    { field: "nguoiCapNhat", headerName: "Người cập nhật", width: 130 },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 150,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const isAdmin =
          params.row.rule === 1 || params.row.tenDangNhap === "admin";

        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (
                  currentUser?.taiKhoan?.tenDangNhap === "admin" ||
                  currentUser?.taiKhoan?.tenDangNhap === params.row.tenDangNhap
                ) {
                  setEditModal({ open: true, data: params.row });
                  return;
                }
                return showErrorAlert("Bạn không có quyền sửa tài khoản này");
              }}
              sx={{ border: "1px solid #e0e0e0", bgcolor: "#f1f8e9" }}
            >
              <Edit size={18} color="#4caf50" />
            </IconButton>

            {!isAdmin && (
              <IconButton
                size="small"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (currentUser?.taiKhoan?.tenDangNhap !== "admin") {
                    return showErrorAlert(
                      "Bạn không có quyền xóa tài khoản này",
                    );
                  }
                  const confirm = await showConfirmAlert(
                    `Xác nhận xóa tài khoản "${params.row.hoTen}"?`,
                  );
                  if (confirm.isConfirmed) {
                    deleteAccountMutation.mutate(params.row.id);
                  }
                }}
                sx={{ border: "1px solid #e0e0e0", bgcolor: "#ffebee" }}
              >
                <Trash2 size={18} color="#f44336" />
              </IconButton>
            )}

            {currentUser?.taiKhoan?.tenDangNhap === "admin" && (
              <Tooltip title="Phân quyền">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 3. Kích hoạt mở Modal phân quyền bằng cách set ID
                    setPermissionUserId(params.row.id);
                  }}
                  sx={{ border: "1px solid #e0e0e0", bgcolor: "#fff3e0" }}
                >
                  <ShieldCheck size={18} color="#ff9800" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <PageAction
        title="Quản lý tài khoản"
        onNewClick={() => {
          const isAdmin = currentUser?.taiKhoan?.tenDangNhap === "admin";

          if (!isAdmin) {
            showErrorAlert("Bạn không có quyền tạo tài khoản");
            return;
          }
          setShowAccountModal(true);
        }}
        showExcel={false}
      />

      <Box
        sx={{
          p: 2,
          "& button": {
            "&.MuiButton-containedPrimary": {
              display: "none !important",
            },
          },
        }}
      >
        <TableCustom
          tableId="account"
          title="Danh sách tài khoản"
          columns={columns}
          rows={accountPage?.items || []}
          total={accountPage?.totalItems || 0}
          loading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          onRowClick={handleRowClick}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onDelete={handleDeleteMany}
        />

        <AccountModal
          open={showAccountModal}
          onClose={() => setShowAccountModal(false)}
        />

        {/* 4. Thêm PermissionModal vào đây */}
        <PermissionModal
          open={Boolean(permissionUserId)}
          userId={permissionUserId}
          onClose={() => setPermissionUserId(null)}
        />
      </Box>

      <EditAccountModal
        open={editModal.open}
        data={editModal.data}
        onClose={() => setEditModal({ ...editModal, open: false })}
      />
    </Box>
  );
}
