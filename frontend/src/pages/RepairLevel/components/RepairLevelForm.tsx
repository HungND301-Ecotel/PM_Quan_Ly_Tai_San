import {
  InfoOutlineRounded,
  ArrowDropUp,
  ArrowDropDown,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import { FormikProvider, useFormik } from "formik";
import ViewBtn from "../../../components/Button/ViewBtn";
import { RepairLevelValidation } from "../validation/Validation";
import EditButton from "../../../components/Button/EditButton";
import { RepairLevel } from "../types";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import { useAllTypeAssetQuery } from "../../TypeAsset/Mutation";

export default function RepairLevelForm({
  onEdit,
  onCancel,
  selectedRepairLevel,
  readOnly,
  onSave,
}: {
  onEdit: () => void;
  onCancel: () => void;
  selectedRepairLevel?: RepairLevel;
  readOnly: boolean;
  onSave: (values: RepairLevel) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { data: allTypeAssets = [] } = useAllTypeAssetQuery();
  const formik = useFormik<RepairLevel>({
    initialValues: {
      id: "",
      kyHieu: "",
      ten: "",
      chuKyThucHien: "",
      soLanTrongChuKy: 0,
      thoiGianSuaChua: "",
      idLoaiTaiSan: "",
      mocGioDau: 0,
      mocGioCuoi: 0,
      ghiChu: "",
    },
    validationSchema: RepairLevelValidation,
    onSubmit(values) {
      let finalValues = { ...values };
      if (finalValues.chuKyThucHien) {
        const parts = finalValues.chuKyThucHien.split(/[:\-]/);
        if (parts.length >= 2) {
          const dau = parseInt(parts[0].replace(/\D/g, ""), 10);
          const cuoi = parseInt(parts[parts.length - 1].replace(/\D/g, ""), 10);
          finalValues.mocGioDau = isNaN(dau) ? 0 : dau;
          finalValues.mocGioCuoi = isNaN(cuoi) ? 0 : cuoi;
        } else if (parts.length === 1) {
          const num = parseInt(parts[0].replace(/\D/g, ""), 10);
          const val = isNaN(num) ? 0 : num;
          finalValues.mocGioDau = val;
          finalValues.mocGioCuoi = val;
        }
      }
      onSave(finalValues);
    },
  });

  useEffect(() => {
    if (selectedRepairLevel) {
      let copyData = { ...selectedRepairLevel };
      if (
        (!copyData.chuKyThucHien || copyData.chuKyThucHien === "") &&
        copyData.mocGioDau != null &&
        copyData.mocGioCuoi != null
      ) {
        copyData.chuKyThucHien = `${copyData.mocGioDau} : ${copyData.mocGioCuoi}`;
      }
      formik.setValues(copyData);
      formik.setErrors({});
    } else {
      formik.resetForm();
    }
  }, [selectedRepairLevel, readOnly]);

  return (
    <FormikProvider value={formik}>
      <Accordion sx={{ background: "#f6f8f4ff" }} expanded={expanded}>
        <AccordionSummary
          expandIcon={<ViewBtn expanded={expanded} setExpanded={setExpanded} />}
          aria-controls="panel1-content"
          id="panel1-header"
          sx={{
            "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
              transform: "none",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {expanded ? <ArrowDropUp /> : <ArrowDropDown />}
            <Typography>Chi tiết cấp sửa chữa</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" gap={2}>
            {!readOnly && <SaveBtn onSave={formik.submitForm} />}
            {!readOnly && <CancelBtn onClick={onCancel} />}
            {readOnly && <EditButton onClick={onEdit} />}
          </Box>
          <Paper sx={{ mt: 2, p: 2, borderRadius: "12px" }}>
            <Box display={"flex"} alignItems={"center"} gap={2}>
              <InfoOutlineRounded color="primary" />
              <Typography>Thông tin cấp sửa chữa</Typography>
            </Box>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid size={{ xs: 6 }}>
                <FieldInput
                  title="Ký hiệu *"
                  name="kyHieu"
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput
                  title="Cấp sửa chữa bảo dưỡng *"
                  name="ten"
                  disabled={readOnly}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <FieldAutoCompleted
                  title="Chủng loại thiết bị *"
                  data={allTypeAssets}
                  labelkey="tenLoai"
                  name="idLoaiTaiSan"
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput
                  title="Chu kỳ thực hiện (giờ máy) *"
                  name="chuKyThucHien"
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput
                  title="Số lần thực hiện trong 1 chu kỳ *"
                  name="soLanTrongChuKy"
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput
                  title="Thời gian dùng để sửa chữa *"
                  name="thoiGianSuaChua"
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Ghi chú"
                  name="ghiChu"
                  disabled={readOnly}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </Paper>
        </AccordionDetails>
      </Accordion>
    </FormikProvider>
  );
}
