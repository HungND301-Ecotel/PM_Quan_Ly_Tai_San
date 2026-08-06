import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  Typography,
  Grid,
  Divider,
  Slide,
  Tooltip,
} from "@mui/material";
import {
  Close,
  AddCircle,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useAccountMutation } from "../../Mutation";
import { FormikProvider, useFormik } from "formik";
import TableCustom from "../../../../components/common/TableCustom";
import FieldInput from "../../../../components/TextField/FieldInput";
import SaveBtn from "../../../../components/Button/SaveBtn";
import CancelBtn from "../../../../components/Button/CancelBtn";
import { useSelector } from "react-redux";
import { showConfirmAlert } from "../../../../components/Alert";
import { useStaffPagesQuery } from "../../../Staff/Mutation";
import { useDebounce } from "../../../../hooks/useDebounce";

const generateCredentials = (fullName: string) => {
  if (!fullName) return { username: "", password: "" };

  // 1. Chuyển về chữ thường và bỏ dấu
  const normalized = fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

  const parts = normalized.split(/\s+/);
  if (parts.length < 1) return { username: "", password: "" };

  // 2. Lấy tên chính (phần tử cuối)
  const firstName = parts[parts.length - 1];

  // 3. Lấy các chữ cái đầu của họ và tên đệm
  const initials = parts
    .slice(0, parts.length - 1)
    .map((p) => p[0])
    .join("");

  const username = firstName + initials;
  return {
    username: username,
    password: `${username}123`,
  };
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AccountModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const currentUser = useSelector((state: any) => state.user.user);

  const { accountPage, createMutation } = useAccountMutation(
    undefined,
    undefined,
    undefined,
    null,
    currentUser?.taiKhoan?.idCongTy,
  );
  const searchDebounce = useDebounce(searchValue, 600);
  const { data: staffs = {} } = useStaffPagesQuery(
    paginationModel.page,
    paginationModel.pageSize,
    searchDebounce,
  );

  const formik = useFormik({
    initialValues: {
      tenDangNhap: "",
      matKhau: "",
      username: "",
      hoTen: "",
      email: "",
      soDienThoai: "",
      idCongTy: currentUser?.taiKhoan?.idCongTy || "",
      nguoiTao: currentUser?.taiKhoan?.hoTen || "",
      isActive: true,
    },
    onSubmit: async (values) => {
      // THÊM MODAL XÁC NHẬN TẠI ĐÂY
      const confirm = await showConfirmAlert(
        `Bạn có chắc chắn muốn tạo tài khoản cho nhân viên "${selectedStaff?.hoTen}" không?`,
      );

      if (confirm.isConfirmed) {
        createMutation.mutate(
          {
            values: values,
            staff: selectedStaff,
          },
          {
            onSuccess: () => handleClose(),
          },
        );
      }
    },
  });

  const handleClose = () => {
    setStep(0);
    setSelectedStaff(null);
    formik.resetForm();
    onClose();
  };

  const columns: any[] = [
    {
      field: "action",
      headerName: "Thao tác",
      width: 80,
      align: "center",
      headerAlign: "center",
      renderCell: (params: any) => (
        <Tooltip
          title={params.row.hasAccount ? "Đã có tài khoản" : "Tạo tài khoản"}
          placement="top"
          arrow
        >
          <span>
            <IconButton
              disabled={params.row.hasAccount}
              onClick={() => {
                setSelectedStaff(params.row);
                const { username, password } = generateCredentials(
                  params.row.hoTen,
                );
                formik.setValues({
                  ...formik.initialValues,
                  tenDangNhap: params.row.id,
                  username: username,
                  matKhau: password,
                  hoTen: params.row.hoTen,
                  email: params.row.emailCongViec,
                  soDienThoai: params.row.diDong,
                });
                setStep(1);
              }}
            >
              <AddCircle
                sx={{ color: params.row.hasAccount ? "#bdbdbd" : "#f44336" }}
              />
            </IconButton>
          </span>
        </Tooltip>
      ),
    },
    { field: "id", headerName: "Mã nhân viên", width: 120 },
    { field: "hoTen", headerName: "Họ tên", flex: 1 },
    { field: "emailCongViec", headerName: "Email công việc", flex: 1 },
    { field: "diDong", headerName: "Số điện thoại", width: 130 },
    { field: "tenChucVu", headerName: "Chức vụ", width: 150 },
    { field: "tenPhongBan", headerName: "Phòng ban", width: 180 },
    {
      field: "hasAccount",
      headerName: "Trạng thái tài khoản",
      width: 180,
      renderCell: (params: any) => (
        <Typography
          variant="body2"
          sx={{
            color: params.row.hasAccount ? "text.secondary" : "error.main",
          }}
        >
          {params.row.hasAccount ? "Đã có tài khoản" : "Chưa có tài khoản"}
        </Typography>
      ),
    },
    {
      field: "nguoiTao",
      headerName: "Người tạo",
    },
  ];

  return (
    <FormikProvider value={formik}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "96vw",
            height: "92vh",
            maxWidth: "none",
            m: 0,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          },
        }}
      >
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            position: "absolute",
            right: 3,
            top: 3,
            zIndex: 1100,
            color: "#1976d2",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          <Close />
        </IconButton>

        <DialogContent
          sx={{
            p: 0,
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <Slide
            direction="right"
            in={step === 0}
            mountOnEnter
            unmountOnExit
            timeout={400}
          >
            {/* Thẻ Box duy nhất bọc toàn bộ Step 0 */}
            <Box
              sx={{
                flex: 1,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                overflow: "auto",
                "& .MuiPaper-root": {
                  m: 0,
                  boxShadow: "none",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                },
                "& .MuiDataGrid-root": { flex: 1 },
              }}
            >
              <TableCustom
                title={"Danh sách nhân viên"}
                columns={columns}
                rows={staffs?.items || []}
                total={staffs?.totalItems || 0}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                checkboxSelection={false}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
              />
            </Box>
          </Slide>
          <Slide
            direction="left"
            in={step === 1}
            mountOnEnter
            unmountOnExit
            timeout={400}
          >
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Box
                sx={{
                  p: 1,
                  background: "#f5efefff",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                <Grid color="success" fontSize="small" />
                <Typography sx={{ fontWeight: 500 }}>
                  Tạo account cho nhân viên {selectedStaff?.hoTen}
                </Typography>
              </Box>

              <Box p={2} sx={{ flex: 1, overflowY: "auto" }}>
                <Box mb={2} display="flex" gap={1}>
                  <SaveBtn onSave={() => formik.handleSubmit()} />
                  <CancelBtn onClick={() => setStep(0)} />
                </Box>
                <Divider />

                <Grid container spacing={4} mt={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography
                      color="primary"
                      fontWeight="bold"
                      align="center"
                      mb={2}
                    >
                      Thông tin tài khoản
                    </Typography>

                    <Divider />
                    <Box display="flex" flexDirection="column" gap={4} mt={4}>
                      <FieldInput title="Tên đăng nhập" name="username" />
                      <FieldInput
                        title="Mật khẩu"
                        name="matKhau"
                        type={showPassword ? "text" : "password"}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          ),
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography
                      color="primary"
                      fontWeight="bold"
                      align="center"
                      mb={2}
                    >
                      Thông tin nhân viên
                    </Typography>
                    <Divider />
                    <Box display="flex" flexDirection="column" gap={4} mt={4}>
                      <FieldInput
                        title="Mã nhân viên"
                        name="tenDangNhap"
                        disabled
                      />
                      <FieldInput title="Họ tên" name="hoTen" disabled />
                      <FieldInput title="Email" name="email" disabled />
                      <FieldInput
                        title="Số điện thoại"
                        name="soDienThoai"
                        disabled
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Slide>
        </DialogContent>
      </Dialog>
    </FormikProvider>
  );
}
