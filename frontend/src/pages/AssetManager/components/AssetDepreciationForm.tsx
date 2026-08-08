import {
  Add,
  ArrowDropDown,
  ArrowDropUp,
  Delete,
  InfoOutlineRounded,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import { FormikProvider, useFormik } from "formik";
import ViewBtn from "../../../components/Button/ViewBtn";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import AssetParents from "../../../data/AssetParent.json";
import TypeAssets from "../../../data/TypeAsset.json";
import Projects from "../../../data/Project.json";
import FieldDateTime from "../../../components/TextField/FieldDateTime";
import EditButton from "../../../components/Button/EditButton";
import FieldDate from "../../../components/TextField/FieldDate";

export default function AssetDepreciationForm({
  onEdit,
  onCancel,
  selectedAsset,
  readOnly,
  onSave,
}: {
  onEdit: () => void;
  onCancel: () => void;
  selectedAsset?: any;
  readOnly?: boolean;
  onSave: (values: any) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const formik = useFormik({
    initialValues: {
      soThe: "",
      tenTaiSan: "",
      nguonVon: "",
      maTk: "",
      ngayTinhKhao: "",
      thangKh: 0,
      nguyenGia: 0,
      khauHaoBanDau: 0,
      khauHaoPsdk: 0,
      gtclBanDau: 0,
      khauHaoPsck: 0,
      gtclHienTai: 0,
      khauHaoBinhQuan: 0,
      soTien: 0,
      chenhLech: 0,
      khKyTruoc: 0,
      clKyTruoc: 0,
      hsdCkh: 0,
      tkNo: "",
      tkCo: "",
      dtgt: "",
      dtth: "",
      kmcp: "",
      ghiChuKhao: "",
      userId: "",
      userTime: "",
      nvNS: 0,
      vonVay: 0,
      vonKhac: 0,
    },
    onSubmit(values) {
      onSave(values);
    },
  });
  useEffect(() => {
    if (selectedAsset) {
      formik.setValues(selectedAsset);
    } else {
      formik.resetForm();
    }
  }, [selectedAsset]);
  return (
    <Accordion sx={{ background: "#f6f8f4ff" }} expanded={expanded}>
      <AccordionSummary
        expandIcon={<ViewBtn expanded={expanded} setExpanded={setExpanded} />}
        aria-controls="panel1-content"
        id="panel1-header"
        sx={{
          "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
            transform: "none", // Ngăn không cho xoay
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {expanded ? <ArrowDropUp /> : <ArrowDropDown />}
          <Typography>Chi tiết khấu hao tài sản</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <FormikProvider value={formik}>
          <Paper sx={{ p: 2, borderRadius: "12px" }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Số thẻ *"
                      name="soThe"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Tên tài sản *"
                      name="tenTaiSan"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Nguồn vốn"
                      name="nguonVon"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Mã tài khoản"
                      type="number"
                      name="maTk"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldDate
                      title="Ngày tính khấu hao"
                      name="ngayTinhKhao"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Tháng khấu hao"
                      type="number"
                      name="thangKh"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Nguyên giá"
                      name="nguyenGia"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Khấu hao ban đầu"
                      type="number"
                      name="khauHaoBanDau"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Khấu hao PSDK"
                      type="number"
                      name="khauHaoPsdk"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="GTCL ban đầu"
                      type="number"
                      name="gtclBanDau"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="DTGT"
                      type="number"
                      name="dtgt"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput title="DTTH" name="dtth" disabled={readOnly} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Ghi chú khấu hao"
                      name="ghiChuKhao"
                      disabled={readOnly}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Khấu hao PSCK"
                      name="khauHaoPsck"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="GTCL hiện tại"
                      name="gtclHienTai"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Khấu hao bình quân"
                      type="number"
                      name="khauHaoBinhQuan"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Số tiền"
                      name="soTien"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Chênh lệch"
                      type="number"
                      name="chenhLech"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Khấu hao kỳ trước"
                      name="khKyTruoc"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Chênh lệch kỳ trước"
                      name="clKyTruoc"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="HSDCKH"
                      type="number"
                      name="hsdCkh"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Tài khoản nợ"
                      type="number"
                      name="tkNo"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Tài khoản có"
                      name="tkCo"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput title="KMCP" name="kmcp" disabled={readOnly} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Người tạo"
                      name="userId"
                      disabled={readOnly}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </FormikProvider>
      </AccordionDetails>
    </Accordion>
  );
}
