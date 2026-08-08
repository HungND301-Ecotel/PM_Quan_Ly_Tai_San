import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import {
  EmailOutlined,
  LockOutline,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import * as yup from "yup";
import { FormikProvider, useFormik } from "formik";
import FieldInput from "../../components/TextField/FieldInput";
import { validationSchema } from "./validation";

import { useAuthMutation } from "./Mutation";
import { currentBrandConfig } from "../../config/brandConfig";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../../redux/userSlice";
import api from "../../config/api.config";
import { decodeJwt, mapPortalPermissionsToRoles } from "../../utils/auth";
import { showErrorAlert } from "../../components/Alert";

export default function Login() {
  const [showPassWord, setShowPassWord] = useState(true);
  const [exchanging, setExchanging] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loginMutation } = useAuthMutation();

  const formik = useFormik({
    initialValues: {
      tenDangNhap: "",
      matKhau: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      loginMutation.mutate(values);
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setExchanging(true);

      // Xóa code khỏi URL ngay lập tức để tránh exchange lại khi reload
      params.delete("code");
      const cleanSearch = params.toString();
      const cleanPath =
        window.location.pathname +
        (cleanSearch ? `?${cleanSearch}` : "") +
        window.location.hash;
      window.history.replaceState({}, document.title, cleanPath);

      api
        .post("/taikhoan/exchange-code", { code })
        .then((res) => {
          const { appToken } = res.data;
          const payload = decodeJwt(appToken);
          if (payload) {
            const userData = {
              taiKhoan: {
                id: payload.userId || payload.sub,
                tenDangNhap: payload.username || payload.sub,
                hoTen: payload.fullName || payload.sub,
              },
              token: appToken,
              isPortal: true,
              role: mapPortalPermissionsToRoles(payload.permissions || {}),
            };
            dispatch(loginSuccess(userData));
            navigate("/");
          } else {
            throw new Error("Token từ portal không hợp lệ");
          }
        })
        .catch((err) => {
          console.error("Lỗi exchange code:", err);
          showErrorAlert(
            err.response?.data?.message ||
              "Xác thực qua Portal thất bại hoặc mã code đã hết hạn.",
          );
        })
        .finally(() => {
          setExchanging(false);
        });
    }
  }, [dispatch, navigate]);
  return (
    <FormikProvider value={formik}>
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          background: `url(${currentBrandConfig.backgroundImage})`,
          backgroundSize: "cover",
          position: "relative",
        }}
      >
        <Box
          height={120}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
          sx={{
            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
            background: `repeating-linear-gradient(
                    20deg, 
                    rgba(255, 255, 255, 0.15) 0px, 
                    rgba(255, 255, 255, 0.15) 1px, 
                    transparent 2px, 
                    transparent 40px
                ),linear-gradient(to right,${currentBrandConfig.primaryColor} 0%,${currentBrandConfig.primaryColor} 100%)`,
          }}
        >
          <Typography fontSize={50} fontWeight={700} sx={{ color: "white" }}>
            PHẦN MỀM QUẢN LÝ TÀI SẢN
          </Typography>
        </Box>

        <form onSubmit={formik.handleSubmit}>
          <Box
            sx={{
              height: "calc(100vh - 120px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Container
              maxWidth={"xs"}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                background: "white",
                borderRadius: "12px",
                p: 5,
                gap: 3,
              }}
            >
              <Avatar
                src={currentBrandConfig.logo}
                alt="logo"
                sx={{ width: 80, height: 80 }}
              />
              <Typography fontWeight={700} fontSize={24}>
                Đăng nhập
              </Typography>
              <FieldInput
                title="Tên đăng nhập *"
                name="tenDangNhap"
                debounce={false}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <FieldInput
                title="Mật khẩu *"
                type={showPassWord ? "password" : "text"}
                name="matKhau"
                debounce={false}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutline />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment
                        position="end"
                        onClick={() => setShowPassWord(!showPassWord)}
                      >
                        <IconButton>
                          {showPassWord ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                variant="contained"
                type="submit"
                fullWidth
                sx={{
                  p: 1.8,
                  borderRadius: "12px",
                  fontWeight: "bold",
                }}
                onClick={() => formik.submitForm()}
              >
                Đăng nhập
              </Button>
              <Box display="flex" alignItems="center" width="100%">
                <Box flex={1} height="1px" bgcolor="#e0e0e0" />
                <Typography
                  variant="body2"
                  sx={{ mx: 2, color: "text.secondary" }}
                >
                  Hoặc
                </Typography>
                <Box flex={1} height="1px" bgcolor="#e0e0e0" />
              </Box>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  p: 1.8,
                  borderRadius: "12px",
                  borderColor: "rgb(0, 158, 96, 1)",
                  color: "rgb(0, 158, 96, 1)",
                  fontWeight: "bold",
                  "&:hover": {
                    borderColor: "rgb(2, 110, 66, 1)",
                    background: "rgba(0, 158, 96, 0.04)",
                  },
                }}
                onClick={() => {
                  const portalUrl =
                    import.meta.env.VITE_PORTAL_URL || "http://localhost:8080";
                  window.location.href = `${portalUrl}?redirect=hrm`;
                }}
              >
                Đăng nhập qua Portal
              </Button>
            </Container>
          </Box>
        </form>
        <Box sx={{ position: "absolute", bottom: 10, left: 10, index: 999 }}>
          <Typography sx={{ color: "white" }}>
            quanlytaisan-Version:dev_3.0_18/06/2026
          </Typography>
        </Box>
        <Backdrop
          sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
          open={exchanging}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <CircularProgress color="inherit" />
            <Typography variant="h6" sx={{ color: "#fff" }}>
              Đang xác thực thông tin với Portal...
            </Typography>
          </Box>
        </Backdrop>
      </Box>
    </FormikProvider>
  );
}
