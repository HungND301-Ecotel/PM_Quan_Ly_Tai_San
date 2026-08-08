import {
  ArrowDropDown,
  ArrowDropUp,
  Close,
  InfoOutlineRounded,
  Remove,
  Security,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Box,
  Checkbox,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import { FormikProvider, useFormik } from "formik";
import { StaffValidation } from "../validation/Validation";
import UploadButton from "../../../components/Button/UploadButton";
import EditButton from "../../../components/Button/EditButton";
import { useAllPositionsQuery } from "../../Position/Mutation";
import { useAllDepartmentsQuery } from "../../Department/Mutation";
import { CongTy } from "../../../utils/const";
import { useDebounce } from "../../../hooks/useDebounce";

export default function StaffForm({
  onEdit,
  onCancel,
  selectedStaff,
  readOnly,
  onSave,
  onUpload,
  onFormChange,
  initialFormData,
  onMinimize,
}: {
  onEdit: () => void;
  onCancel: () => void;
  onMinimize: () => void;
  selectedStaff?: any;
  readOnly: boolean;
  onSave: (values: any) => void;
  onUpload: (file: File) => void;
  onFormChange?: (values: any) => void;
  initialFormData?: Record<string, any>;
}) {
  const [showPin, setShowPin] = useState(false);
  const { data: allPositions } = useAllPositionsQuery();
  const { data: allDepartments = [] } = useAllDepartmentsQuery();

  const formik = useFormik({
    initialValues: {
      id: initialFormData?.id ?? "",
      hoTen: initialFormData?.hoTen ?? "",
      diDong: initialFormData?.diDong ?? "",
      emailCongViec: initialFormData?.emailCongViec ?? "",
      kyNhay: initialFormData?.kyNhay ?? false,
      kyThuong: initialFormData?.kyThuong ?? false,
      kySo: initialFormData?.kySo ?? false,
      chuKyNhay: initialFormData?.chuKyNhay ?? "",
      chuKyThuong: initialFormData?.chuKyThuong ?? "",
      agreementUUId: initialFormData?.agreementUUId ?? "",
      pin: initialFormData?.pin ?? "",
      boPhan: initialFormData?.boPhan ?? "",
      chucVu: initialFormData?.chucVu ?? "",
      laQuanLy: initialFormData?.laQuanLy ?? true,
      idCongTy: initialFormData?.idCongTy ?? CongTy.CT001,
      isActive: initialFormData?.isActive ?? true,
      savePin: initialFormData?.savePin ?? false,
      // tempFileKyNhay: null as File | null,
      // tempFileKyThuong: null as File | null,
    },
    validationSchema: StaffValidation,
    onSubmit: async (values) => {
      try {
        onSave(values);
      } catch (error) {
        console.error("Lỗi khi upload file:", error);
      }
    },
  });

  useEffect(() => {
    if (selectedStaff) {
      formik.setValues({
        ...selectedStaff,
        boPhan: selectedStaff?.phongBanId,
        chucVu: selectedStaff?.chucVuId,
      });
      formik.setErrors({}); // Clear errors when selectedStaff changes
    }
  }, [selectedStaff, readOnly]); // Add readOnly to dependencies

  useEffect(() => {
    onFormChange?.(formik.values);
  }, [formik.values]);

  // Hàm xử lý chung cho input file
  const handleFileSelect = (
    file: string, // Nhận trực tiếp File hoặc null từ UploadButton
    fieldName: "chuKyNhay" | "chuKyThuong",
    tempFieldName: "tempFileKyNhay" | "tempFileKyThuong",
  ) => {
    if (file) {
      // Lưu tên file vào Formik để hiển thị/gửi DB
      formik.setFieldValue(fieldName, file);
      // Lưu file thực tế vào trường tạm để chờ submit
      // formik.setFieldValue(tempFieldName, file);
    } else {
      // Nếu xóa file (handleRemove từ nút Delete)
      formik.setFieldValue(fieldName, "");
      // formik.setFieldValue(tempFieldName, null);
    }
  };

  return (
    <FormikProvider value={formik}>
      <Box
        sx={{
          bgcolor: "#ffffff",
          p: 4,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            transition: "all 0.2s",
            "& fieldset": { borderColor: "#e2e8f0" },
            "&:hover fieldset": { borderColor: "#1FA463" },
            "&.Mui-focused fieldset": {
              borderColor: "#1FA463",
              borderWidth: "1.5px",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#64748b",
            "&.Mui-focused": { color: "#1FA463" },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 2,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1FA463" }}>
            Chi tiết nhân viên
          </Typography>
          <Box display="flex" gap={0.5}>
            <IconButton size="small" onClick={onMinimize} title="Ẩn tạm">
              <Remove fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onCancel} title="Đóng">
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Phần 1: Thông tin nhân viên */}
        <Box>
          <Box display="flex" alignItems="center" gap={1.2} mb={2.5}>
            <InfoOutlineRounded sx={{ color: "#1FA463", fontSize: "20px" }} />
            <Typography
              sx={{ fontWeight: 600, fontSize: "16px", color: "#1FA463" }}
            >
              Thông tin nhân viên
            </Typography>
          </Box>
          <Grid container spacing={3.5}>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Mã nhân viên *"
                name="id"
                disabled={Boolean(selectedStaff?.id)}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Tên nhân viên *"
                name="hoTen"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Email *"
                name="emailCongViec"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Số điện thoại *"
                name="diDong"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldAutoCompleted
                title="Chức vụ *"
                data={allPositions}
                labelkey="tenChucVu"
                name="chucVu"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldAutoCompleted
                title="Phòng ban/Bộ phận *"
                data={allDepartments}
                labelkey="tenPhongBan"
                name="boPhan"
                disabled={readOnly}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Phần 2: Quyền ký duyệt */}
        <Box sx={{ mt: 1.5 }}>
          <Box display="flex" alignItems="center" gap={1.2} mb={2}>
            <Security sx={{ color: "#1FA463", fontSize: "20px" }} />
            <Typography
              sx={{ fontWeight: 600, fontSize: "16px", color: "#1FA463" }}
            >
              Quyền ký duyệt
            </Typography>
          </Box>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: "12px",
              bgcolor: "#fcfdfe",
              borderColor: "#e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
            {/* Ký nháy */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pb: formik.values.kyNhay ? 2 : 0,
                borderBottom: formik.values.kyNhay
                  ? "1px dashed #e2e8f0"
                  : "none",
              }}
            >
              <Box display="flex" alignItems="center">
                <Checkbox
                  name="kyNhay"
                  checked={formik.values.kyNhay}
                  onChange={
                    !readOnly
                      ? (e) => formik.setFieldValue("kyNhay", e.target.checked)
                      : undefined
                  }
                  disabled={readOnly}
                  sx={{
                    color: "#e2e8f0",
                    p: 0,
                    mr: 1.5,
                    "&.Mui-checked": { color: "#1FA463" },
                  }}
                />
                <Typography sx={{ fontWeight: 500, color: "#334155" }}>
                  Ký nháy
                </Typography>
              </Box>
              {formik.values.kyNhay && (
                <Box sx={{ pl: 4, width: "100%" }}>
                  <UploadButton
                    label="Nhấn để chọn file chữ ký (.png, .jpg...)"
                    disabled={readOnly}
                    name="chuKyNhay"
                    onChange={(file: string) =>
                      handleFileSelect(file, "chuKyNhay", "tempFileKyNhay")
                    }
                    nameFile={formik.values.chuKyNhay}
                  />
                </Box>
              )}
            </Box>

            {/* Ký thường */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pb: formik.values.kyThuong ? 2 : 0,
                borderBottom: formik.values.kyThuong
                  ? "1px dashed #e2e8f0"
                  : "none",
              }}
            >
              <Box display="flex" alignItems="center">
                <Checkbox
                  name="kyThuong"
                  checked={formik.values.kyThuong}
                  onChange={
                    !readOnly
                      ? (e) =>
                          formik.setFieldValue("kyThuong", e.target.checked)
                      : undefined
                  }
                  disabled={readOnly}
                  sx={{
                    color: "#e2e8f0",
                    p: 0,
                    mr: 1.5,
                    "&.Mui-checked": { color: "#1FA463" },
                  }}
                />
                <Typography sx={{ fontWeight: 500, color: "#334155" }}>
                  Ký thường
                </Typography>
              </Box>
              {formik.values.kyThuong && (
                <Box sx={{ pl: 4, width: "100%" }}>
                  <UploadButton
                    label="Nhấn để chọn file chữ ký (.png, .jpg...)"
                    disabled={readOnly}
                    name="chuKyThuong"
                    onChange={(e: any) =>
                      handleFileSelect(e, "chuKyThuong", "tempFileKyThuong")
                    }
                    nameFile={formik.values.chuKyThuong}
                  />
                </Box>
              )}
            </Box>

            {/* Ký số */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box display="flex" alignItems="center">
                <Checkbox
                  name="kySo"
                  checked={formik.values.kySo}
                  onChange={
                    !readOnly
                      ? (e) => formik.setFieldValue("kySo", e.target.checked)
                      : undefined
                  }
                  disabled={readOnly}
                  sx={{
                    color: "#e2e8f0",
                    p: 0,
                    mr: 1.5,
                    "&.Mui-checked": { color: "#1FA463" },
                  }}
                />
                <Typography sx={{ fontWeight: 500, color: "#334155" }}>
                  Ký số
                </Typography>
              </Box>
              {formik.values.kySo && (
                <Box
                  sx={{
                    pl: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                    mt: 1,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Agreement UUID"
                        name="agreementUUId"
                        value={formik.values.agreementUUId}
                        onChange={!readOnly ? formik.handleChange : undefined}
                        InputProps={{
                          sx: { borderRadius: "8px" },
                          readOnly: readOnly,
                        }}
                        disabled={readOnly}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="PIN"
                        type={showPin ? "text" : "password"}
                        name="pin"
                        value={formik.values.pin}
                        onChange={!readOnly ? formik.handleChange : undefined}
                        InputProps={{
                          sx: { borderRadius: "8px" },
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPin(!showPin)}
                                edge="end"
                                disabled={readOnly}
                              >
                                {showPin ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                          readOnly: readOnly,
                        }}
                        disabled={readOnly}
                      />
                    </Grid>
                  </Grid>
                  <Box display="flex" alignItems="center" gap={1.2}>
                    <Checkbox
                      name="savePin"
                      checked={formik.values.savePin || false}
                      onChange={
                        !readOnly
                          ? (e) =>
                              formik.setFieldValue("savePin", e.target.checked)
                          : undefined
                      }
                      disabled={readOnly}
                      sx={{
                        color: "#e2e8f0",
                        p: 0,
                        "&.Mui-checked": { color: "#1FA463" },
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "#64748b", fontWeight: 500 }}
                    >
                      Lưu mã PIN
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Footer actions */}
        <Box
          display="flex"
          justifyContent="flex-end"
          gap={2}
          mt={1}
          pt={2.5}
          sx={{ borderTop: "1px solid #f1f5f9" }}
        >
          {readOnly ? (
            <EditButton onClick={onEdit} />
          ) : (
            <>
              <CancelBtn onClick={onCancel} />
              <SaveBtn onSave={formik.submitForm} />
            </>
          )}
        </Box>
      </Box>
    </FormikProvider>
  );
}
