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
  Switch,
  FormControlLabel,
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
import { CapitalSourceValidation } from "../validation/Validation";
import EditButton from "../../../components/Button/EditButton";
import { CongTy } from "../../../utils/const";
import { useDebounce } from "../../../hooks/useDebounce";

export default function CapitalSourceForm({
  onEdit,
  onCancel,
  selectedCapitalSource,
  readOnly,
  onSave,
  initialFormData,
  onFormChange,
  onMinimize,
  isBulkMode,
  bulkEditType,
  bulkItems,
  onBulkItemsChange,
}: {
  onEdit: () => void;
  onCancel: () => void;
  selectedCapitalSource?: any;
  readOnly?: boolean;
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
      tenNguonKinhPhi: initialFormData?.tenNguonKinhPhi ?? "",
      idCongTy: initialFormData?.idCongTy ?? CongTy.CT001,
      ghiChu: initialFormData?.ghiChu ?? "",
      hieuLuc: initialFormData?.hieuLuc ?? true,
      isActive: initialFormData?.isActive ?? true,
    },
    validationSchema: CapitalSourceValidation,
    onSubmit(values) {
      onSave(values);
    },
  });

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
    const newItem = {
      id: "",
      tenNguonKinhPhi: "",
      ghiChu: "",
      hieuLuc: true,
      isActive: true,
      idCongTy: CongTy.CT001,
      nguoiTao: "admin",
      nguoiCapNhat: "admin",
      ngayTao: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    };
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
      localBulkItems.map(async (item) => {
        try {
          await CapitalSourceValidation.validate(item, { abortEarly: false });
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

  const debouncedValues = useDebounce(formik.values, 800);
  useEffect(() => {
    onFormChange?.(debouncedValues);
  }, [debouncedValues]);

  useEffect(() => {
    if (selectedCapitalSource) {
      formik.setValues(selectedCapitalSource);
      formik.setErrors({});
    }
  }, [selectedCapitalSource, readOnly]);

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
              ? `Thêm mới nguồn vốn (${localBulkItems.length})`
              : `Sửa hàng loạt nguồn vốn (${localBulkItems.length})`}
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
                    label="Mã nguồn kinh phí *"
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
                    label="Tên nguồn kinh phí *"
                    value={item.tenNguonKinhPhi}
                    onChange={(e) =>
                      handleBulkItemChange(
                        index,
                        "tenNguonKinhPhi",
                        e.target.value,
                      )
                    }
                    error={!!item.errors?.tenNguonKinhPhi}
                    helperText={item.errors?.tenNguonKinhPhi}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <MuiTextField
                    fullWidth
                    size="small"
                    label="Ghi chú"
                    value={item.ghiChu}
                    onChange={(e) =>
                      handleBulkItemChange(index, "ghiChu", e.target.value)
                    }
                  />
                </Grid>
                {/* <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={item.hieuLuc ?? true}
                        onChange={(e) =>
                          handleBulkItemChange(
                            index,
                            "hieuLuc",
                            e.target.checked,
                          )
                        }
                        color="success"
                      />
                    }
                    label="Hiệu lực"
                  />
                </Grid> */}
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
            Chi tiết nguồn vốn
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
              Thông tin nguồn vốn
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Mã nguồn kinh phí *"
                name="id"
                disabled={Boolean(selectedCapitalSource?.id)}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Tên nguồn kinh phí *"
                name="tenNguonKinhPhi"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FieldInput title="Ghi chú" name="ghiChu" disabled={readOnly} />
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
