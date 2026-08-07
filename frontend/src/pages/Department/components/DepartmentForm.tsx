import {
  InfoOutlineRounded,
  ArrowDropDown,
  ArrowDropUp,
  Remove,
  Close,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import { FormikProvider, useFormik } from "formik";
import { DepartmentValidation } from "../validation";
import ViewBtn from "../../../components/Button/ViewBtn";
import EditButton from "../../../components/Button/EditButton";
import { CongTy } from "../../../utils/const";
import { DepartmentType } from "../types";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import { useDebounce } from "../../../hooks/useDebounce";
import { useAllDepartmentsQuery } from "../Mutation";

export default function DepartmentForm({
  onEdit,
  onCancel,
  selectedDepartment,
  readOnly,
  onSave,
  initialFormData,
  onFormChange,
  onMinimize,
}: {
  onEdit: () => void;
  onCancel: () => void;
  selectedDepartment?: any;
  readOnly: boolean;
  onSave: (values: any) => void;
  onFormChange?: (values: any) => void;
  initialFormData?: Record<string, any>;
  onMinimize: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { data: allDepartment = [] } = useAllDepartmentsQuery();

  const formik = useFormik({
    initialValues: {
      id: initialFormData?.id ?? "",
      tenPhongBan: initialFormData?.tenPhongBan ?? "",
      idCongTy: initialFormData?.idCongTy ?? CongTy.CT001,
      phongCapTren: initialFormData?.phongCapTren ?? "",
      isKho: initialFormData?.isKho ?? false,
      isLanhDao: initialFormData?.isLanhDao ?? false,
      loaiKho: initialFormData?.loaiKho ?? (undefined as Number | undefined),
    },
    validationSchema: DepartmentValidation,
    onSubmit(values) {
      onSave(values);
    },
  });

  const debouncedValues = useDebounce(formik.values, 800);
  useEffect(() => {
    onFormChange?.(debouncedValues);
  }, [debouncedValues]);

  useEffect(() => {
    if (selectedDepartment) {
      formik.setValues(selectedDepartment);
      formik.setErrors({}); // Clear errors when selectedDepartment changes
    } else {
      formik.resetForm();
    }
  }, [selectedDepartment, readOnly]); // Add readOnly to dependencies

  return (
    <FormikProvider value={formik}>
      <Box
        sx={{
          bgcolor: "#ffffff",
          p: 4,
          display: "flex",
          flexDirection: "column",
          gap: 3,
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
            Chi tiết phòng ban
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

        {/* Thông tin */}
        <Paper sx={{ p: 2, borderRadius: "12px" }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <InfoOutlineRounded sx={{ color: "#1FA463" }} />
            <Typography sx={{ fontWeight: 600, color: "#1FA463" }}>
              Thông tin phòng ban
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Mã phòng ban *"
                name="id"
                disabled={Boolean(selectedDepartment?.id)}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Tên phòng ban *"
                name="tenPhongBan"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 12 }}>
              <FieldAutoCompleted
                title="Phòng ban cấp trên"
                data={allDepartment}
                labelkey="tenPhongBan"
                name="phongCapTren"
                disabled={readOnly}
                limitOptions={10}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {/* Giữ nguyên toàn bộ phần checkbox isKho, loaiKho, isLanhDao */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography>Là kho:</Typography>
                <Checkbox
                  name="isKho"
                  checked={Boolean(formik.values.isKho)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    formik.setFieldValue("isKho", isChecked);
                    if (isChecked) formik.setFieldValue("isLanhDao", false);
                    else formik.setFieldValue("loaiKho", undefined);
                  }}
                  disabled={readOnly}
                />
              </Box>
              {formik.values.isKho && (
                <Box pl={4}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2">Kho cấp phát:</Typography>
                    <Checkbox
                      size="small"
                      checked={formik.values.loaiKho === 1}
                      onChange={() => formik.setFieldValue("loaiKho", 1)}
                      disabled={readOnly}
                    />
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2">Kho thu hồi:</Typography>
                    <Checkbox
                      size="small"
                      checked={formik.values.loaiKho === 2}
                      onChange={() => formik.setFieldValue("loaiKho", 2)}
                      disabled={readOnly}
                    />
                  </Box>
                </Box>
              )}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mt={1}
              >
                <Typography>Là phòng ban lãnh đạo:</Typography>
                <Checkbox
                  name="isLanhDao"
                  checked={Boolean(formik.values.isLanhDao)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    formik.setFieldValue("isLanhDao", isChecked);
                    if (isChecked) {
                      formik.setFieldValue("isKho", false);
                      formik.setFieldValue("loaiKho", undefined);
                    }
                  }}
                  disabled={readOnly}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Footer */}
        <Box
          display="flex"
          justifyContent="flex-end"
          gap={2}
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
