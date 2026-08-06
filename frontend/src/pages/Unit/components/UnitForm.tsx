import {
  InfoOutlineRounded,
  Add,
  Delete,
  ContentCopy,
  Remove,
  Close,
} from "@mui/icons-material";
import {
  Button,
  Card,
  TextField as MuiTextField,
  Box,
  Grid,
  IconButton,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useState, useEffect } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import { FormikProvider, useFormik } from "formik";

import EditButton from "../../../components/Button/EditButton";
import { UnitValidation } from "../validation/Validation";
import { useDebounce } from "../../../hooks/useDebounce";

export default function UnitForm({
  onEdit,
  onCancel,
  selectedUnit,
  readOnly,
  onSave,
  initialFormData,
  onFormChange,
  onMinimize,
  bulkEditType,
  bulkItems,
  isBulkMode,
  onBulkItemsChange,
}: {
  onEdit: () => void;
  onCancel: () => void;
  selectedUnit?: any;
  readOnly: boolean;
  onSave: (values: any) => void;
  onFormChange?: (values: any) => void;
  initialFormData?: Record<string, any>;
  onMinimize: () => void;
  isBulkMode?: boolean;
  bulkItems?: any[];
  onBulkItemsChange?: (items: any[]) => void;
  bulkEditType?: "create" | "edit";
}) {
  const formik = useFormik({
    initialValues: {
      id: initialFormData?.id ?? "",
      tenDonVi: initialFormData?.tenDonVi ?? "",
      note: initialFormData?.note ?? "",
      laHeThong: initialFormData?.laHeThong ?? false,
    },
    validationSchema: UnitValidation,
    onSubmit(values) {
      onSave(values);
    },
  });

  const normalizeItem = (item: any) => ({
    id: item.id ?? "",
    tenDonVi: item.tenDonVi ?? "",
    note: item.note ?? "",
    laHeThong: item.laHeThong ?? false,
  });

  const [localBulkItems, setLocalBulkItems] = useState<any[]>(
    initialFormData?.items && initialFormData.items.length > 0
      ? initialFormData.items.map(normalizeItem)
      : (bulkItems ?? []).map(normalizeItem),
  );

  const debouncedBulkItems = useDebounce(localBulkItems, 600);
  useEffect(() => {
    onBulkItemsChange?.(debouncedBulkItems);
  }, [debouncedBulkItems]);

  const handleAddItem = () => {
    setLocalBulkItems((prev) => [...prev, normalizeItem({})]);
  };

  const handleCopyItem = (index: number) => {
    const { id, ...rest } = localBulkItems[index];
    setLocalBulkItems((prev) => [
      ...prev.slice(0, index + 1),
      { ...rest, id: "" },
      ...prev.slice(index + 1),
    ]);
  };

  const handleDeleteItem = (index: number) => {
    if (localBulkItems.length === 1) return;
    setLocalBulkItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkItemChange = (index: number, field: string, value: any) => {
    setLocalBulkItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateBulkItems = async () => {
    let hasError = false;
    const updated = await Promise.all(
      localBulkItems.map(async (item) => {
        try {
          await UnitValidation.validate(item, { abortEarly: false });
          return { ...item, errors: undefined };
        } catch (error: any) {
          hasError = true;
          const errors = error.inner?.reduce((acc: any, e: any) => {
            acc[e.path] = e.message;
            return acc;
          }, {}) ?? { [error.path]: error.message };
          return { ...item, errors };
        }
      }),
    );
    setLocalBulkItems(updated);
    onBulkItemsChange?.(updated);
    return { hasError };
  };

  const handleBulkSave = async () => {
    const { hasError } = await validateBulkItems();
    if (hasError) return;
    const cleanItems = localBulkItems.map(({ errors, ...rest }) => rest);
    onSave(cleanItems);
  };

  const debouncedValues = useDebounce(formik.values, 800);
  useEffect(() => {
    onFormChange?.(debouncedValues);
  }, [debouncedValues]);

  useEffect(() => {
    if (selectedUnit) {
      formik.setValues(selectedUnit);
      formik.setErrors({}); // Clear errors when selectedUnit changes
    }
  }, [selectedUnit, readOnly]); // Add readOnly to dependencies

  if (isBulkMode) {
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
            {bulkEditType === "create"
              ? `Thêm mới đơn vị tính (${localBulkItems.length})`
              : `Sửa hàng loạt đơn vị tính (${localBulkItems.length})`}
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

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: "65vh",
            overflowY: "auto",
            overflowX: "hidden",
            pr: 1,
          }}
        >
          {localBulkItems.map((item, index) => (
            <Card
              key={index}
              sx={{
                flexShrink: 0,
                p: 2,
                borderRadius: "12px",
                border: "1px solid #e0e0e0",
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography sx={{ fontWeight: 600, color: "#1FA463" }}>
                  Item {index + 1}
                </Typography>
                <Box display="flex" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyItem(index)}
                    title="Sao chép"
                  >
                    <ContentCopy fontSize="small" color="primary" />
                  </IconButton>
                  {localBulkItems.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteItem(index)}
                      title="Xóa"
                    >
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <MuiTextField
                    fullWidth
                    size="small"
                    label="Mã đơn vị tính *"
                    value={item.id}
                    onChange={(e) =>
                      handleBulkItemChange(index, "id", e.target.value)
                    }
                    disabled={bulkEditType === "edit"}
                    error={!!item.errors?.id}
                    helperText={item.errors?.id}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <MuiTextField
                    fullWidth
                    size="small"
                    label="Tên đơn vị tính *"
                    value={item.tenDonVi}
                    onChange={(e) =>
                      handleBulkItemChange(index, "tenDonVi", e.target.value)
                    }
                    error={!!item.errors?.tenDonVi}
                    helperText={item.errors?.tenDonVi}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <MuiTextField
                    fullWidth
                    size="small"
                    label="Ghi chú"
                    value={item.note}
                    onChange={(e) =>
                      handleBulkItemChange(index, "note", e.target.value)
                    }
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.laHeThong || false}
                        onChange={(e) =>
                          handleBulkItemChange(
                            index,
                            "laHeThong",
                            e.target.checked,
                          )
                        }
                        disabled={bulkEditType === "edit" || readOnly}
                      />
                    }
                    label="Là hệ thống"
                  />
                </Grid>
              </Grid>
            </Card>
          ))}
        </Box>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          pt={2.5}
          sx={{ borderTop: "1px solid #f1f5f9" }}
        >
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddItem}
            sx={{
              bgcolor: "#1FA463",
              color: "#fff",
              "&:hover": { bgcolor: "#178a52" },
            }}
          >
            Thêm dòng mới
          </Button>
          <Box display="flex" gap={2}>
            <CancelBtn onClick={onCancel} />
            <SaveBtn onSave={handleBulkSave} />
          </Box>
        </Box>
      </Box>
    );
  }

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
            Chi tiết đơn vị tính
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

        {/* Body */}
        <Paper sx={{ p: 2, borderRadius: "12px" }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <InfoOutlineRounded sx={{ color: "#1FA463" }} />
            <Typography sx={{ fontWeight: 600, color: "#1FA463" }}>
              Thông tin đơn vị tính
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Mã đơn vị tính *"
                name="id"
                disabled={Boolean(selectedUnit?.id)}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Tên đơn vị tính *"
                name="tenDonVi"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FieldInput title="Ghi chú" name="note" disabled={readOnly} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formik.values.laHeThong || false}
                    onChange={(e) =>
                      formik.setFieldValue("laHeThong", e.target.checked)
                    }
                    name="laHeThong"
                    disabled={readOnly}
                  />
                }
                label="Là hệ thống"
              />
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
