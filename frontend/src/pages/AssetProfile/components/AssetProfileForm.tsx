import {
  InfoOutlineRounded,
  Remove,
  Close,
  Add,
  Delete,
  ContentCopy,
} from "@mui/icons-material";
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Typography,
  Button,
  Card,
  TextField as MuiTextField,
  Autocomplete,
} from "@mui/material";
import { useState, useEffect } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import { FormikProvider, useFormik } from "formik";
import { AssetProfileValidation } from "../validation/Validation";
import EditButton from "../../../components/Button/EditButton";
import { useDebounce } from "../../../hooks/useDebounce";
import { useLyLichTemplateQuery } from "../Mutation";
import { RootState } from "../../../redux/store";
import { useSelector } from "react-redux";
import AssetEbookContent from "../../AssetManager/components/AssetEbookContent";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";

export default function AssetProfileForm({
  onEdit,
  onCancel,
  selectedAssetProfile,
  readOnly,
  onSave,
  initialFormData,
  onFormChange,
  onMinimize,
  isBulkMode,
  bulkItems,
  onBulkItemsChange,
  bulkEditType,
}: {
  onEdit: () => void;
  onCancel: () => void;
  selectedAssetProfile?: any;
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
  const { user } = useSelector((state: RootState) => state.user);

  const formik = useFormik({
    initialValues: {
      ...(selectedAssetProfile?.id ? { id: selectedAssetProfile.id } : {}),
      maLyLich: initialFormData?.maLyLich ?? "",
      tenLyLich: initialFormData?.tenLyLich ?? "",
      moTa: initialFormData?.moTa ?? "",
      idLyLichTemplate: initialFormData?.idLyLichTemplate ?? "",
      idCongTy: initialFormData?.idCongTy ?? user?.congTy?.id ?? "",
    },
    validationSchema: AssetProfileValidation,
    onSubmit(values) {
      onSave(values);
    },
  });

  const debouncedValues = useDebounce(formik.values, 800);
  useEffect(() => {
    onFormChange?.(debouncedValues);
  }, [debouncedValues]);

  // Fetch LyLichTemplate
  const { data: lyLichTemplatesRaw } = useLyLichTemplateQuery();
  const lyLichTemplates: any[] = Array.isArray(lyLichTemplatesRaw)
    ? lyLichTemplatesRaw
    : (lyLichTemplatesRaw?.data ?? []);

  useEffect(() => {
    if (selectedAssetProfile) {
      formik.setValues(selectedAssetProfile);
      formik.setErrors({});
    }
  }, [selectedAssetProfile, readOnly]);

  // Bulk
  const normalizeItem = (item: any) => ({
    ...(item.id ? { id: item.id } : {}),
    maLyLich: item.maLyLich ?? "",
    tenLyLich: item.tenLyLich ?? "",
    moTa: item.moTa ?? "",
    idLyLichTemplate: item.idLyLichTemplate ?? "",
    idCongTy: item.idCongTy ?? user?.congTy?.id ?? "CT001",
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
    const newItem = normalizeItem({});
    const updated = [...localBulkItems, newItem];
    setLocalBulkItems(updated);
  };

  const handleCopyItem = (index: number) => {
    const { maLyLich, ...rest } = localBulkItems[index];
    const newItem = { ...rest, maLyLich: "" };
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
          await AssetProfileValidation.validate(item, { abortEarly: false });
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
              ? `Thêm mới lý lịch tài sản (${localBulkItems.length})`
              : `Sửa hàng loạt lý lịch tài sản (${localBulkItems.length})`}
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
                    label="Mã lý lịch *"
                    value={item.maLyLich}
                    onChange={(e) =>
                      handleBulkItemChange(index, "maLyLich", e.target.value)
                    }
                    disabled={bulkEditType === "edit"}
                    error={!!item.errors?.maLyLich}
                    helperText={item.errors?.maLyLich}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <MuiTextField
                    fullWidth
                    size="small"
                    label="Tên lý lịch *"
                    value={item.tenLyLich}
                    onChange={(e) =>
                      handleBulkItemChange(index, "tenLyLich", e.target.value)
                    }
                    error={!!item.errors?.tenLyLich}
                    helperText={item.errors?.tenLyLich}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FieldAutoCompleted
                    title="Chọn Template"
                    onChange={(value) =>
                      handleBulkItemChange(index, "idLyLichTemplate", value.id)
                    }
                    value={item.idLyLichTemplate}
                    data={lyLichTemplates}
                    labelkey="tenLyLich"
                  />
                </Grid>
                {(() => {
                  const template = lyLichTemplates.find(
                    (t: any) => t.id === item.idLyLichTemplate,
                  );
                  return (
                    template &&
                    typeof template.maLyLich === "string" &&
                    template.maLyLich.trim() !== "" && (
                      <AssetEbookContent
                        selectedAsset={null}
                        readOnly={readOnly}
                        onEdit={() => {}}
                        onCancel={() => {}}
                        onClose={() => {}}
                        onSave={(values) => {}}
                        allAssetModel={[]}
                        allCurrentStatus={[]}
                        assetGroups={[]}
                        allDepartments={[]}
                        allUnits={[]}
                        allReasonIncreases={[]}
                        isView={true}
                      />
                    )
                  );
                })()}
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
            Chi tiết lý lịch tài sản
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
              Thông tin lý lịch tài sản
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldInput
                title="Mã lý lịch *"
                name="maLyLich"
                disabled={Boolean(selectedAssetProfile?.id)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldInput
                title="Tên lý lịch *"
                name="tenLyLich"
                disabled={readOnly}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FieldAutoCompleted
                title="Chọn Template"
                name="idLyLichTemplate"
                disabled={readOnly}
                data={lyLichTemplates}
                labelkey="tenLyLich"
              />
            </Grid>
            {(() => {
              const template = lyLichTemplates.find(
                (t: any) => t.id === formik.values.idLyLichTemplate,
              );
              return (
                template &&
                typeof template.maLyLich === "string" &&
                template.maLyLich.trim() !== "" && (
                  <AssetEbookContent
                    selectedAsset={null}
                    readOnly={readOnly}
                    onEdit={() => {}}
                    onCancel={() => {}}
                    onClose={() => {}}
                    onSave={(values) => {}}
                    allAssetModel={[]}
                    allCurrentStatus={[]}
                    assetGroups={[]}
                    allDepartments={[]}
                    allUnits={[]}
                    allReasonIncreases={[]}
                    isView={true}
                  />
                )
              );
            })()}
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
