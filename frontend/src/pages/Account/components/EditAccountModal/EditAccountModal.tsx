import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  Typography,
  Grid,
  Button,
  Divider,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { FormikProvider, useFormik } from "formik";
import FieldInput from "../../../../components/TextField/FieldInput";
import { AccountData } from "../../types";
import { useAccountMutation } from "../../Mutation";

interface Props {
  open: boolean;
  onClose: () => void;
  data: AccountData | null;
}

export default function EditAccountModal({ open, onClose, data }: Props) {
  const { updateMutation } = useAccountMutation();

  const formik = useFormik({
    initialValues: {
      id: "",
      tenDangNhap: "",
      matKhau: "",
      hoTen: "",
      email: "",
      soDienThoai: "",
      nguoiTao: "",
      idCongTy: "",
      username: "",
      isActive: true,
      // ... các field khác nếu cần
    },
    onSubmit: (values) => {
      updateMutation.mutate(values, {
        onSuccess: () => onClose(),
      });
    },
  });

  // Cập nhật giá trị form khi data thay đổi
  useEffect(() => {
    if (data) {
      formik.setValues({
        ...data,
        matKhau: data.matKhau || "",
      });
    }
  }, [data, open]);

  return (
    <FormikProvider value={formik}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "12px", bgcolor: "#f5f3faff" }, // Màu nền hơi tím nhạt như ảnh
        }}
      >
        <Box sx={{ p: 2, textAlign: "center", position: "relative" }}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            Sửa thông tin tài khoản
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 4, pb: 4 }}>
          <Box component="form" onSubmit={formik.handleSubmit}>
            {/* PHẦN 1: THÔNG TIN TÀI KHOẢN */}
            <Typography color="primary" align="center" fontWeight="bold" mb={2}>
              Thông tin tài khoản
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2} mb={4}>
              <Grid size={{ xs: 6 }}>
                <FieldInput title="Tên đăng nhập" name="username" />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput title="Mật khẩu" name="matKhau" type="password" />
              </Grid>
            </Grid>

            {/* PHẦN 2: THÔNG TIN NHÂN VIÊN */}
            <Typography color="primary" align="center" fontWeight="bold" mb={2}>
              Thông tin nhân viên
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FieldInput title="Mã nhân viên" name="tenDangNhap" disabled />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput title="Số điện thoại" name="soDienThoai" disabled />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput title="Họ tên" name="hoTen" disabled />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput title="Người tạo" name="nguoiTao" disabled />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput title="Email" name="email" disabled />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput title="Công ty" name="idCongTy" disabled />
              </Grid>
            </Grid>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{
                mt: 6,
                py: 1.2,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              Xác nhận
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </FormikProvider>
  );
}
