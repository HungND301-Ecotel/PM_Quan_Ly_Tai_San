import { Remove, Close } from "@mui/icons-material";
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import { useFormik } from "formik";
import EditButton from "../../../components/Button/EditButton";
import { useDebounce } from "../../../hooks/useDebounce";
import { RepairReportValidation } from "../validation";

import IncidentPreview from "../../Maintenance/components/preview/IncidentPreview";
import IncidentInspectionPreview from "../../Maintenance/components/preview/IncidentInspectionPreview";
import AcceptanceTestPreview from "../../Maintenance/components/preview/AcceptanceTestPreview";
import InspectionRecordPreview from "../../Maintenance/components/preview/InspectionRecordPreview";
import MaterialPreview from "../../Maintenance/components/preview/MaterialPreview";
import RepairRequestPreview from "../../Maintenance/components/preview/RepairRequestPreview";
import { BienBanSuaChua } from "../types";
import PlanPreview from "../../Maintenance/components/preview/PlanPreview";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import { LOAI_BIEN_BAN_OPTIONS } from "../../../utils/const";

// ── Section label helper ──────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 1, mt: 0.5 }}>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, color: "#1FA463", fontSize: 13 }}
      >
        {children}
      </Typography>
      <Divider sx={{ mt: 0.5, borderColor: "#e0f2ec" }} />
    </Box>
  );
}

// ── Main form ─────────────────────────────────────────────────

const renderPreviewComponent = (loai: string, values: BienBanSuaChua) => {
  if (!loai) return <Typography>Vui lòng chọn Loại biên bản</Typography>;

  switch (loai) {
    case "KE_HOACH":
      return (
        <PlanPreview
          idDonViGiao=""
          idDonViNhan=""
          signers={[]}
          tieude={values?.ten || ""}
        />
      );
    case "SUA_CHUA":
      return (
        <RepairRequestPreview
          data={null}
          repairLevels={[]}
          departments={[]}
          tieude={values?.ten || ""}
          congty={values?.congTy || ""}
        />
      );
    case "PHIEU_SU_CO":
      return (
        <IncidentPreview
          tieude={values?.ten || ""}
          congty={values?.congTy || ""}
        />
      );
    case "GIAM_DINH":
      return <InspectionRecordPreview data={values} />;
    case "NGHIEM_THU":
      return (
        <AcceptanceTestPreview
          data={undefined}
          apiDepartments={[]}
          tieude={values?.ten || ""}
          congty={values?.congTy || ""}
        />
      );
    case "DANH_GIA_VAT_TU":
      return (
        <MaterialPreview
          d={new Date()}
          formik={undefined}
          congty={values?.congTy || ""}
          tieude={values?.ten || ""}
        />
      );
    case "KIEM_TRA_SU_CO":
      return (
        <IncidentInspectionPreview
          tieude={values?.ten || ""}
          congty={values?.congTy || ""}
        />
      );
    default:
      return <Typography>Vui lòng chọn Loại biên bản</Typography>;
  }
};
export default function RepairReportForm({
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
  editData?: BienBanSuaChua | null;
  readOnly: boolean;
  onSave: (values: BienBanSuaChua) => void;
  onFormChange?: (values: BienBanSuaChua) => void;
  initialFormData?: BienBanSuaChua;
  onMinimize: () => void;
}) {
  const formik = useFormik<BienBanSuaChua>({
    initialValues: {
      ma: initialFormData?.ma ?? "",
      ten: initialFormData?.ten ?? "",
      congTy: initialFormData?.congTy ?? "",
      loaiBienBan: initialFormData?.loaiBienBan ?? "",
      macDinh: initialFormData?.macDinh ?? false,
    },
    validationSchema: RepairReportValidation,
    onSubmit(values) {
      onSave(values);
    },
  });

  const debouncedValues = useDebounce(formik.values, 800);

  useEffect(() => {
    if (!editData) onFormChange?.(debouncedValues);
  }, [debouncedValues]);

  useEffect(() => {
    if (editData) {
      formik.setValues(editData);
      formik.setErrors({});
    }
  }, [editData, readOnly]);

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: 11,
          bgcolor: "#fff",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1FA463" }}>
            Mẫu biên bản sửa chữa
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

      {/* ── Body ── */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        <Grid container spacing={2}>
          {/* ── Thông tin chung ── */}
          <Grid size={{ xs: 12 }}>
            <SectionLabel>Thông tin chung</SectionLabel>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FieldInput
              title="Mã *"
              formik={formik}
              field="ma"
              disabled={readOnly}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FieldAutoCompleted
              data={LOAI_BIEN_BAN_OPTIONS}
              field="loaiBienBan"
              formik={formik}
              labelkey="label"
              title="Loại biên bản *"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }} display="flex" alignItems="center">
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.macDinh}
                  onChange={(e) =>
                    formik.setFieldValue("macDinh", e.target.checked)
                  }
                  disabled={readOnly}
                  sx={{
                    color: "#1FA463",
                    "&.Mui-checked": { color: "#1FA463" },
                  }}
                />
              }
              label="Mặc định"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FieldInput
              title="Công ty *"
              formik={formik}
              field="congTy"
              disabled={readOnly}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FieldInput
              title="Tiêu đề *"
              formik={formik}
              field="ten"
              disabled={readOnly}
            />
          </Grid>

          {/* ── Preview ── */}
          <Grid size={{ xs: 12 }}>
            <SectionLabel>Xem trước</SectionLabel>
            <Box
              sx={{
                mt: 2,
                bgcolor: "#f8fafc",
                p: 2,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {renderPreviewComponent(
                formik.values.loaiBienBan || "",
                formik.values,
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ── Footer ── */}
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
  );
}
