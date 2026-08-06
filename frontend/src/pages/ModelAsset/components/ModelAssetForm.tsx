import {
  InfoOutlineRounded,
  ArrowDropUp,
  ArrowDropDown,
  Remove,
  Close,
  ContentCopy,
  Add,
  Delete,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  Paper,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  IconButton,
  Button,
  TextField,
  Card,
} from "@mui/material";
import { useState, useEffect } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import { FormikProvider, useFormik } from "formik";
import ViewBtn from "../../../components/Button/ViewBtn";
import { ModelAssetValidation } from "../validation/Validation";
import EditButton from "../../../components/Button/EditButton";
import { CongTy } from "../../../utils/const";
import { useDebounce } from "../../../hooks/useDebounce";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";

export default function ModelAssetForm({
  onEdit,
  onCancel,
  selectedModelAsset,
  readOnly,
  onSave,
  initialFormData,
  onFormChange,
  onMinimize,
  bulkEditType,
  isBulkMode,
  bulkItems,
  onBulkItemsChange,
}: {
  onEdit: () => void;
  onCancel: () => void;
  selectedModelAsset?: any;
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
  const [expanded, setExpanded] = useState(true);
  const formik = useFormik({
    initialValues: {
      id: initialFormData?.id ?? "",
      tenMoHinh: initialFormData?.tenMoHinh ?? "",
      phuongPhapKhauHao: initialFormData?.phuongPhapKhauHao ?? "",
      kyKhauHao: initialFormData?.kyKhauHao ?? "",
      loaiKyKhauHao: initialFormData?.loaiKyKhauHao ?? "",
      taiKhoanTaiSan: initialFormData?.taiKhoanTaiSan ?? "",
      taiKhoanKhauHao: initialFormData?.taiKhoanKhauHao ?? "",
      taiKhoanChiPhi: initialFormData?.taiKhoanChiPhi ?? "",
      idCongTy: initialFormData?.idCongTy ?? CongTy.CT001,
    },
    validationSchema: ModelAssetValidation,
    onSubmit(values) {
      onSave(values);
    },
  });

  const phuongPhapOptions = [
    { id: 1, label: "Đường thẳng" },
    { id: 0, label: "Khác" },
  ];

  useEffect(() => {
    if (selectedModelAsset) {
      formik.setValues(selectedModelAsset);
      formik.setErrors({});
    }
  }, [selectedModelAsset, readOnly]);

  // Bulk state
  const [localBulkItems, setLocalBulkItems] = useState<any[]>(bulkItems ?? []);

  useEffect(() => {
    if (
      initialFormData?.items &&
      Array.isArray(initialFormData.items) &&
      initialFormData.items.length > 0
    ) {
      setLocalBulkItems(initialFormData.items);
    }
  }, []);

  // Bulk handlers
  const handleAddItem = () => {
    const newItem = {
      id: "",
      tenMoHinh: "",
      phuongPhapKhauHao: "",
      kyKhauHao: "",
      loaiKyKhauHao: "",
      taiKhoanTaiSan: "",
      taiKhoanKhauHao: "",
      taiKhoanChiPhi: "",
      idCongTy: CongTy.CT001,
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
    onBulkItemsChange?.(updated);
  };

  const validateBulkItems = async () => {
    let hasError = false;
    const updated = await Promise.all(
      localBulkItems.map(async (item) => {
        try {
          await ModelAssetValidation.validate(item, { abortEarly: false });
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
    return { hasError, items: updated };
  };

  const handleBulkSave = async () => {
    const { hasError } = await validateBulkItems();
    if (hasError) return;
    onSave(localBulkItems);
  };

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
              ? `Thêm mới mô hình tài sản (${localBulkItems.length})`
              : `Sửa hàng loạt mô hình tài sản (${localBulkItems.length})`}
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
              {/* Card Header */}
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

              {/* Fields */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Mã mô hình *"
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
                  <TextField
                    fullWidth
                    size="small"
                    label="Tên mô hình *"
                    value={item.tenMoHinh}
                    onChange={(e) =>
                      handleBulkItemChange(index, "tenMoHinh", e.target.value)
                    }
                    error={!!item.errors?.tenMoHinh}
                    helperText={item.errors?.tenMoHinh}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Phương pháp khấu hao</InputLabel>
                    <Select
                      value={item.phuongPhapKhauHao ?? ""}
                      onChange={(e) =>
                        handleBulkItemChange(
                          index,
                          "phuongPhapKhauHao",
                          e.target.value,
                        )
                      }
                      label="Phương pháp khấu hao"
                    >
                      <MenuItem value={1}>Đường thẳng</MenuItem>
                      <MenuItem value={0}>Khác</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Kỳ khấu hao"
                    type="number"
                    value={item.kyKhauHao}
                    onChange={(e) =>
                      handleBulkItemChange(index, "kyKhauHao", e.target.value)
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Loại kỳ khấu hao"
                    value={item.loaiKyKhauHao}
                    onChange={(e) =>
                      handleBulkItemChange(
                        index,
                        "loaiKyKhauHao",
                        e.target.value,
                      )
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tài khoản tài sản"
                    value={item.taiKhoanTaiSan}
                    onChange={(e) =>
                      handleBulkItemChange(
                        index,
                        "taiKhoanTaiSan",
                        e.target.value,
                      )
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tài khoản khấu hao"
                    value={item.taiKhoanKhauHao}
                    onChange={(e) =>
                      handleBulkItemChange(
                        index,
                        "taiKhoanKhauHao",
                        e.target.value,
                      )
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tài khoản chi phí"
                    value={item.taiKhoanChiPhi}
                    onChange={(e) =>
                      handleBulkItemChange(
                        index,
                        "taiKhoanChiPhi",
                        e.target.value,
                      )
                    }
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
            Chi tiết mô hình tài sản
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

        {/* Body - giữ nguyên Paper + Grid + tất cả fields */}

        <Paper sx={{ mt: 2, p: 2, borderRadius: "12px" }}>
          <Box display={"flex"} alignItems={"center"} gap={2}>
            <InfoOutlineRounded sx={{ color: "#1FA463" }} />
            <Typography sx={{ fontWeight: 600, color: "#1FA463" }}>
              Thông tin mô hình tài sản
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldInput
                title="Mã mô hình *"
                name="id"
                disabled={Boolean(selectedModelAsset?.id)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldInput
                title="Tên mô hình *"
                name="tenMoHinh"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldAutoCompleted
                title="Phương pháp khấu hao *"
                name="phuongPhapKhauHao"
                disabled={readOnly}
                data={phuongPhapOptions}
                labelkey="label"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldInput
                title="Kỳ khấu hao"
                name="kyKhauHao"
                disabled={readOnly}
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldInput
                title="Loại kỳ khấu hao"
                name="loaiKyKhauHao"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldInput
                title="Tài khoản tài sản"
                name="taiKhoanTaiSan"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldInput
                title="Tài khoản khấu hao"
                name="taiKhoanKhauHao"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldInput
                title="Tài khoản chi phí"
                name="taiKhoanChiPhi"
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
