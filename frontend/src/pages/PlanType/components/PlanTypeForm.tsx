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
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import EditButton from "../../../components/Button/EditButton";
import { PlanTypeValidation } from "../validation";

export default function PlanTypeForm({
  onEdit,
  onCancel,
  selectedPlanType,
  readOnly,
  onSave,
}: {
  onEdit: () => void;
  onCancel: () => void;
  selectedPlanType?: any;
  readOnly: boolean;
  onSave: (values: any) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const formik = useFormik({
    initialValues: {
      id: "",
      tenLoai: "",
      isActive: true,
    },
    validationSchema: PlanTypeValidation,
    onSubmit(values) {
      onSave(values);
    },
  });

  useEffect(() => {
    if (selectedPlanType) {
      formik.setValues(selectedPlanType);
      formik.setErrors({});
    } else {
      formik.resetForm();
    }
  }, [selectedPlanType, readOnly]);

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
            <Typography>Chi tiết loại kế hoạch</Typography>
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
              <Typography>Thông tin loại kế hoạch</Typography>
            </Box>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Mã loại kế hoạch *"
                  name="id"
                  disabled={Boolean(selectedPlanType?.id)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Tên loại kế hoạch *"
                  name="tenLoai"
                  disabled={readOnly}
                />
              </Grid>
            </Grid>
          </Paper>
        </AccordionDetails>
      </Accordion>
    </FormikProvider>
  );
}
