import {
  InfoOutlineRounded,
  ArrowDropUp,
  ArrowDropDown,
  Remove,
  Close,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import { FormikProvider, useFormik } from "formik";
import ViewBtn from "../../../components/Button/ViewBtn";
import EditButton from "../../../components/Button/EditButton";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import RepairNormVatTuTable from "./RepairNormVatTuTable";
import { DinhMucSuaChua } from "../types";
import { RepairNormValidation } from "../validation";
import { useAllLoaiSCBDQuery } from "../../MaintenanceRepairType/Mutation";
import { useDebounce } from "../../../hooks/useDebounce";

export default function RepairNormForm({
  onEdit,
  onCancel,
  editData,
  readOnly,
  onSave,
  initialFormData,
  onFormChange,
  onMinimize,
}: {
  onEdit: () => void;
  onCancel: () => void;
  editData?: DinhMucSuaChua | null;
  readOnly: boolean;
  onSave: (values: DinhMucSuaChua) => void;
  onFormChange?: (values: any) => void;
  initialFormData?: Record<string, any>;
  onMinimize: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { data: allRepairTypes = [] } = useAllLoaiSCBDQuery();

  const formik = useFormik<DinhMucSuaChua>({
    initialValues: {
      id: initialFormData?.id ?? "",
      idLoaiSuaChua: initialFormData?.idLoaiSuaChua ?? "",
      ghiChu: initialFormData?.ghiChu ?? "",
      isActive: initialFormData?.isActive ?? true,
      dinhMucVatTuList: initialFormData?.dinhMucVatTuList ?? [],
    },
    validationSchema: RepairNormValidation,
    onSubmit(values) {
      onSave(values);
    },
  });

  const debouncedValues = useDebounce(formik.values, 800);
  useEffect(() => {
    if (!editData) {
      onFormChange?.(debouncedValues);
    }
  }, [debouncedValues]);

  useEffect(() => {
    if (editData) {
      formik.setValues({
        ...editData,
        dinhMucVatTuList: editData.dinhMucVatTuList || [],
      });
      formik.setErrors({});
    }
  }, [editData, readOnly]);

  return (
    <FormikProvider value={formik}>
      <Box
        sx={{
          bgcolor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header sticky */}
        <Box
          sx={{
            p: 2,
            bgcolor: "#f6f8f4ff",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 11,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1FA463" }}>
              Chi tiết định mức sửa chữa
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
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          <Paper sx={{ p: 2, borderRadius: "12px" }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <InfoOutlineRounded sx={{ color: "#1FA463" }} />
              <Typography sx={{ fontWeight: 600, color: "#1FA463" }}>
                Thông tin định mức sửa chữa
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Loại sửa chữa *"
                  data={allRepairTypes}
                  labelkey="ten"
                  labelOption="id"
                  name="idLoaiSuaChua"
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Ghi chú"
                  name="ghiChu"
                  disabled={readOnly}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Danh sách định mức vật tư
                  </Typography>
                  <RepairNormVatTuTable formik={formik} readOnly={readOnly} />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Footer */}
        <Box
          display="flex"
          justifyContent="flex-end"
          gap={2}
          p={2}
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
