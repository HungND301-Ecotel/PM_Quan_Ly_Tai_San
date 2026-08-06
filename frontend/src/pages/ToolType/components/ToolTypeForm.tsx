import {
  Close,
  InfoOutlineRounded,
  Remove,
  Add,
  Delete,
  ContentCopy,
} from "@mui/icons-material";
import {
  Box,
  Card,
  Grid,
  IconButton,
  Paper,
  Typography,
  Autocomplete,
  Button,
  TextField as MuiTextField,
} from "@mui/material";
import { FormikProvider, useFormik } from "formik";
import { useEffect, useState } from "react";
import CancelBtn from "../../../components/Button/CancelBtn";
import EditButton from "../../../components/Button/EditButton";
import SaveBtn from "../../../components/Button/SaveBtn";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldInput from "../../../components/TextField/FieldInput";
import { useDebounce } from "../../../hooks/useDebounce";
import { useAllToolGroupQuery } from "../../ToolGroup/Mutation";
import { ToolTypeValidation } from "../validation/Validation";

export default function ToolTypeForm({
  onEdit,
  onCancel,
  selectedToolType,
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
  selectedToolType?: any;
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
  const { data: allToolGroup = [] } = useAllToolGroupQuery();

  const [localBulkItems, setLocalBulkItems] = useState<any[]>(
    initialFormData?.items && initialFormData.items.length > 0
      ? initialFormData.items
      : (bulkItems ?? []),
  );

  const debouncedBulkItems = useDebounce(localBulkItems, 600);
  useEffect(() => {
    onBulkItemsChange?.(debouncedBulkItems);
  }, [debouncedBulkItems]);

  const handleAddItem = () => {
    const newItem = { id: "", tenLoai: "", idLoaiCCDC: "" };
    const updated = [...localBulkItems, newItem];
    setLocalBulkItems(updated);
  };

  const handleCopyItem = (index: number) => {
    const { id, ...rest } = localBulkItems[index];
    const newItem = { ...rest, id: "" };
    const updated = [
      ...localBulkItems.slice(0, index + 1),
      newItem,
      ...localBulkItems.slice(index + 1),
    ];
    setLocalBulkItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    if (localBulkItems.length === 1) return;
    const updated = localBulkItems.filter((_, i) => i !== index);
    setLocalBulkItems(updated);
  };

  const handleBulkItemChange = (index: number, field: string, value: any) => {
    const updated = [...localBulkItems];
    updated[index] = { ...updated[index], [field]: value };
    setLocalBulkItems(updated);
  };

  const validateBulkItems = async () => {
    let hasError = false;
    const updated = await Promise.all(
      localBulkItems.map(async (item: any) => {
        try {
          await ToolTypeValidation.validate(item, { abortEarly: false });
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
    onSave(localBulkItems);
  };

  const formik = useFormik({
    initialValues: {
      id: initialFormData?.id ?? "",
      tenLoai: initialFormData?.tenLoai ?? "",
      idLoaiCCDC: initialFormData?.idLoaiCCDC ?? "",
    },
    validationSchema: ToolTypeValidation,
    onSubmit(values) {
      onSave(values);
    },
  });

  const debouncedValues = useDebounce(formik.values, 800);
  useEffect(() => {
    onFormChange?.(debouncedValues);
  }, [debouncedValues]);

  useEffect(() => {
    if (selectedToolType) {
      formik.setValues(selectedToolType);
      formik.setErrors({});
    }
  }, [selectedToolType, readOnly]);

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
            {bulkEditType === "create"
              ? `Thêm mới loại CCDC (${localBulkItems.length})`
              : `Sửa hàng loạt loại CCDC (${localBulkItems.length})`}
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

        {/* Items */}
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
          {localBulkItems.map((item: any, index: number) => (
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
                    label="Mã loại CCDC *"
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
                    label="Tên loại CCDC *"
                    value={item.tenLoai}
                    onChange={(e) =>
                      handleBulkItemChange(index, "tenLoai", e.target.value)
                    }
                    error={!!item.errors?.tenLoai}
                    helperText={item.errors?.tenLoai}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    size="small"
                    options={allToolGroup}
                    getOptionLabel={(option: any) => option.ten ?? ""}
                    value={
                      allToolGroup.find((g: any) => g.id === item.idLoaiCCDC) ??
                      null
                    }
                    onChange={(_, newValue) =>
                      handleBulkItemChange(
                        index,
                        "idLoaiCCDC",
                        newValue?.id ?? "",
                      )
                    }
                    renderInput={(params) => (
                      <MuiTextField
                        {...params}
                        label="Mã loại CCDC cha *"
                        error={!!item.errors?.idLoaiCCDC}
                        helperText={item.errors?.idLoaiCCDC}
                      />
                    )}
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
            Chi tiết loại CCDC
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
              Thông tin loại CCDC
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Mã loại CCDC *"
                name="id"
                disabled={Boolean(selectedToolType?.id)}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Tên loại CCDC *"
                name="tenLoai"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FieldAutoCompleted
                title="Mã loại CCDC cha *"
                data={allToolGroup}
                labelkey="ten"
                name="idLoaiCCDC"
                disabled={readOnly}
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
