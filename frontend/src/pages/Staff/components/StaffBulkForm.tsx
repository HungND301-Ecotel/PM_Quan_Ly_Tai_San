import {
  Box,
  Button,
  Checkbox,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useFormik, FieldArray, FormikProvider } from "formik";
import * as yup from "yup";
import React, { useEffect } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import UploadButton from "../../../components/Button/UploadButton";
import FieldInput from "../../../components/TextField/FieldInput";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import { useAllPositionsQuery } from "../../Position/Mutation";
import { useAllDepartmentsQuery } from "../../Department/Mutation";
import { CongTy } from "../../../utils/const";
import { Delete, Add, Close, Remove } from "@mui/icons-material";
import { StaffType } from "../types";
import { StaffBulkValidation } from "../validation/Validation";

const defaultRow: StaffType = {
  id: "",
  hoTen: "",
  diDong: "",
  emailCongViec: "",
  kyNhay: false,
  kyThuong: false,
  kySo: false,
  chuKyNhay: "",
  chuKyThuong: "",
  agreementUUId: "",
  pin: "",
  boPhan: "",
  chucVu: "",
  laQuanLy: true,
  idCongTy: CongTy.CT001,
  isActive: true,
  savePin: false,
};

export default function StaffBulkForm({
  mode = "add",
  onCancel,
  onMinimize,
  onSave,
  initialItems,
  onFormChange,
  initialFormData,
}: {
  mode?: "add" | "edit";
  onCancel: () => void;
  onMinimize?: () => void;
  onSave: (items: StaffType[]) => void;
  initialItems?: StaffType[];
  onFormChange?: (values: any) => void;
  initialFormData?: any;
}) {
  const { data: allPositions = [] } = useAllPositionsQuery();
  const { data: allDepartments = [] } = useAllDepartmentsQuery();


  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialFormData || {
      items:
        initialItems && initialItems.length > 0
          ? initialItems.map((item) => ({
              ...defaultRow,
              ...item,
            }))
          : [{ ...defaultRow }],
    },
    validationSchema: StaffBulkValidation,
    onSubmit: async (values) => {
      onSave(values.items);
    },
  });

  useEffect(() => {
    if (!initialFormData && initialItems && initialItems.length > 0) {
      formik.setValues({
        items: initialItems.map((item) => ({
          ...defaultRow,
          ...item,
          boPhan: item?.phongBanId,
          chucVu: item?.chucVuId,
        })),
      });
    }
  }, [initialItems, initialFormData]);

  const handleFileSelect = (fieldPath: string, fileKey: string) => {
    formik.setFieldValue(fieldPath, fileKey);
  };

  return (
    <Box
      sx={{
        bgcolor: "#ffffff",
        p: 4,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
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
          {mode === "edit" ? "Sửa nhiều nhân viên" : "Thêm nhiều nhân viên"}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          {onMinimize && (
            <IconButton
              size="small"
              onClick={() => {
                onFormChange?.(formik.values);
                onMinimize?.();
              }}
              title="Ẩn"
            >
              <Remove fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={onCancel} title="Đóng">
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <FormikProvider value={formik}>
        <form onSubmit={formik.handleSubmit}>
          <FieldArray name="items">
            {({ remove }) => (
              <Box display="flex" flexDirection="column" gap={2}>
                {formik.values.items.map((item: any, index: number) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{ p: 3, borderRadius: "12px" }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={2}
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        {item.hoTen ? item.hoTen : `Nhân viên ${index + 1}`}
                      </Typography>
                      {formik.values.items.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => remove(index)}
                          sx={{ color: "#ef4444" }}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FieldInput
                          title="Mã nhân viên *"
                          name={`items.${index}.id`}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FieldInput
                          title="Tên nhân viên *"
                          name={`items.${index}.hoTen`}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FieldInput
                          title="Email *"
                          name={`items.${index}.emailCongViec`}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FieldInput
                          title="Số điện thoại *"
                          name={`items.${index}.diDong`}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FieldAutoCompleted
                          title="Chức vụ *"
                          data={allPositions}
                          labelkey="tenChucVu"
                          name={`items.${index}.chucVu`}
                          disabled={false}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FieldAutoCompleted
                          title="Phòng ban/Bộ phận *"
                          data={allDepartments}
                          labelkey="tenPhongBan"
                          name={`items.${index}.boPhan`}
                          disabled={false}
                        />
                      </Grid>
                    </Grid>

                    <Box
                      display="flex"
                      flexWrap="wrap"
                      gap={2}
                      alignItems="center"
                      mt={2}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Checkbox
                          name={`items.${index}.kyNhay`}
                          checked={item?.kyNhay || false}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `items.${index}.kyNhay`,
                              e.target.checked,
                            )
                          }
                          sx={{
                            color: "#e2e8f0",
                            "&.Mui-checked": { color: "#1FA463" },
                          }}
                        />
                        <Typography>Ký nháy</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Checkbox
                          name={`items.${index}.kyThuong`}
                          checked={item?.kyThuong || false}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `items.${index}.kyThuong`,
                              e.target.checked,
                            )
                          }
                          sx={{
                            color: "#e2e8f0",
                            "&.Mui-checked": { color: "#1FA463" },
                          }}
                        />
                        <Typography>Ký thường</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Checkbox
                          name={`items.${index}.kySo`}
                          checked={item?.kySo || false}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `items.${index}.kySo`,
                              e.target.checked,
                            )
                          }
                          sx={{
                            color: "#e2e8f0",
                            "&.Mui-checked": { color: "#1FA463" },
                          }}
                        />
                        <Typography>Ký số</Typography>
                      </Box>
                    </Box>

                    {item?.kyNhay && (
                      <Box mt={2} sx={{ pl: 1 }}>
                        <UploadButton
                          label="Nhấn để chọn file chữ ký nháy (.png, .jpg...)"
                          name={`items.${index}.chuKyNhay`}
                          onChange={(fileKey: string) =>
                            handleFileSelect(
                              `items.${index}.chuKyNhay`,
                              fileKey,
                            )
                          }
                          nameFile={item?.chuKyNhay}
                        />
                      </Box>
                    )}
                    {item?.kyThuong && (
                      <Box mt={2} sx={{ pl: 1 }}>
                        <UploadButton
                          label="Nhấn để chọn file chữ ký thường (.png, .jpg...)"
                          name={`items.${index}.chuKyThuong`}
                          onChange={(fileKey: string) =>
                            handleFileSelect(
                              `items.${index}.chuKyThuong`,
                              fileKey,
                            )
                          }
                          nameFile={item?.chuKyThuong}
                        />
                      </Box>
                    )}

                    {item?.kySo && (
                      <Box mt={2}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 5 }}>
                            <FieldInput
                              title="Agreement UUID"
                              name={`items.${index}.agreementUUId`}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <FieldInput
                              title="PIN"
                              name={`items.${index}.pin`}
                              type="password"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Box display="flex" alignItems="center" gap={1.2}>
                              <Checkbox
                                name={`items.${index}.savePin`}
                                checked={item.savePin || false}
                                onChange={(e) =>
                                  formik.setFieldValue(
                                    `items.${index}.savePin`,
                                    e.target.checked,
                                  )
                                }
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
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </FieldArray>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
            mt={3}
          >
            {mode === "add" ? (
              <Button
                startIcon={<Add />}
                onClick={() => {
                  formik.setFieldValue("items", [
                    ...formik.values.items,
                    { ...defaultRow },
                  ]);
                }}
                variant="contained"
                size="small"
                sx={{
                  borderRadius: "10px",
                  bgcolor: "#1FA463",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Thêm dòng mới
              </Button>
            ) : (
              <Box />
            )}
            <Box display="flex" gap={2}>
              <CancelBtn onClick={onCancel} />
              <SaveBtn onSave={formik.submitForm} />
            </Box>
          </Box>
        </form>
      </FormikProvider>
    </Box>
  );
}
