import {
  InfoOutlineRounded,
  Remove,
  Close,
  ContentCopy,
  Delete,
  Add,
} from "@mui/icons-material";
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Typography,
  Button,
  Card,
  TextField,
  Autocomplete,
} from "@mui/material";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import { FormikProvider, useFormik } from "formik";
import { AssetGroupValidation } from "../validation/Validation";
import EditButton from "../../../components/Button/EditButton";
import { CongTy } from "../../../utils/const";
import { useLyLichQuery } from "../Mutation";
import { LyLichType } from "../types";

interface BulkItem {
  id: string;
  tenNhom: string;
  idCongTy: string;
  idLyLich?: string;
  errors?: Record<string, string>;
}

export default function AssetGroupForm({
  onEdit,
  onCancel,
  selectedAssetGroup,
  readOnly,
  onSave,
  initialFormData,
  onFormChange,
  onMinimize,
  isBulkMode = false,
  bulkItems = [],
  onBulkItemsChange,
  bulkEditType = "create",
}: {
  onEdit: () => void;
  onCancel: () => void;
  selectedAssetGroup?: any;
  readOnly: boolean;
  onSave: (values: any) => void;
  onFormChange?: (values: any) => void;
  initialFormData?: Record<string, any>;
  onMinimize: () => void;
  isBulkMode?: boolean;
  bulkItems?: BulkItem[];
  onBulkItemsChange?: (items: BulkItem[]) => void;
  bulkEditType?: "create" | "edit";
}) {
  const [localBulkItems, setLocalBulkItems] = useState<BulkItem[]>(bulkItems);
  const { data: lyLichList = [] } = useLyLichQuery();

  // Refs để giữ giá trị mới nhất mà không cần sync lên parent liên tục
  const latestBulkItemsRef = useRef<BulkItem[]>(localBulkItems);
  const latestSingleValuesRef = useRef<Record<string, any>>({});

  const normalizeBulkItems = (items: BulkItem[]): BulkItem[] =>
    items.map((item) => ({
      ...item,
      idCongTy: item.idCongTy || CongTy.CT001,
    }));

  // Sync ref khi localBulkItems thay đổi (không gọi parent)
  useEffect(() => {
    latestBulkItemsRef.current = localBulkItems;
  }, [localBulkItems]);

  // Flush lên parent (redux) — chỉ gọi khi minimize hoặc outside click
  const flushToParent = useCallback(() => {
    if (isBulkMode) {
      onBulkItemsChange?.(latestBulkItemsRef.current);
    } else {
      onFormChange?.(latestSingleValuesRef.current);
    }
  }, [isBulkMode, onBulkItemsChange, onFormChange]);

  const handleMinimize = useCallback(() => {
    flushToParent();
    onMinimize();
  }, [flushToParent, onMinimize]);

  // Click outside để flush
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        flushToParent();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [flushToParent]);

  // Single mode formik
  const formik = useFormik({
    initialValues: {
      id: initialFormData?.id ?? "",
      tenNhom: initialFormData?.tenNhom ?? "",
      idCongTy: initialFormData?.idCongTy ?? CongTy.CT001,
      idLyLich: initialFormData?.idLyLich ?? "",
    },
    validationSchema: AssetGroupValidation,
    onSubmit(values) {
      onSave(values);
    },
  });

  // Sync formik values vào ref (không gọi parent)
  useEffect(() => {
    latestSingleValuesRef.current = formik.values;
  }, [formik.values]);

  useEffect(() => {
    if (selectedAssetGroup) {
      const values = {
        ...selectedAssetGroup,
        idLyLich:
          selectedAssetGroup.idLyLich || selectedAssetGroup.lyLich?.id || "",
      };
      formik.setValues(values);
      formik.setErrors({});
    }
  }, [selectedAssetGroup, readOnly]);

  useEffect(() => {
    if (initialFormData?.items && initialFormData.items.length > 0) {
      setLocalBulkItems(normalizeBulkItems(initialFormData.items));
    }
  }, []);

  const validateBulkItems = async () => {
    // Dùng Promise.all thay vì await tuần tự
    const results = await Promise.all(
      localBulkItems.map(async (item) => {
        try {
          await AssetGroupValidation.validate(item, { abortEarly: false });
          return { ...item, errors: undefined };
        } catch (error: any) {
          const errors: Record<string, string> = {};
          for (const field of ["id", "tenNhom"]) {
            try {
              await AssetGroupValidation.validateAt(field, item);
            } catch (fieldError: any) {
              errors[field] = fieldError.message;
            }
          }
          return { ...item, errors };
        }
      }),
    );
    console.log("re", results);

    const hasError = results.some((item) => !!item.errors);
    setLocalBulkItems(results);
    latestBulkItemsRef.current = results;
    return { hasError, items: results };
  };

  const handleBulkSave = async () => {
    const { hasError, items } = await validateBulkItems();
    console.log("item", items);
    if (hasError) return;
    onSave(items);
  };

  const handleAddItem = useCallback(() => {
    const newItem: BulkItem = {
      id: "",
      tenNhom: "",
      idCongTy: CongTy.CT001,
      idLyLich: "",
    };
    setLocalBulkItems((prev) => [...prev, newItem]);
  }, []);

  const handleCopyItem = useCallback((index: number) => {
    setLocalBulkItems((prev) => {
      const itemToCopy = prev[index];
      const newItem: BulkItem = { ...itemToCopy, id: "" };
      return [...prev.slice(0, index + 1), newItem, ...prev.slice(index + 1)];
    });
  }, []);

  const handleDeleteItem = useCallback((index: number) => {
    setLocalBulkItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleBulkItemChange = useCallback(
    (index: number, field: string, value: string) => {
      setLocalBulkItems((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item;
          const updated = { ...item, [field]: value };
          if (!updated.idCongTy) updated.idCongTy = CongTy.CT001;
          return updated;
        }),
      );
    },
    [],
  );

  // Render single mode
  if (!isBulkMode) {
    return (
      <FormikProvider value={formik}>
        <Box
          ref={containerRef}
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
              Chi tiết nhóm tài sản
            </Typography>
            <Box display="flex" gap={0.5}>
              <IconButton size="small" onClick={handleMinimize} title="Ẩn tạm">
                <Remove fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={onCancel} title="Đóng">
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Thông tin */}
          <Paper sx={{ p: 2, borderRadius: "12px" }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <InfoOutlineRounded sx={{ color: "#1FA463" }} />
              <Typography sx={{ fontWeight: 600, color: "#1FA463" }}>
                Thông tin nhóm tài sản
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FieldInput
                  title="Mã nhóm tài sản *"
                  name="id"
                  disabled={Boolean(selectedAssetGroup?.id)}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput
                  title="Tên nhóm tài sản *"
                  name="tenNhom"
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={lyLichList}
                  getOptionLabel={(option: any) => option?.tenLyLich || ""}
                  value={
                    lyLichList.find(
                      (item: LyLichType) => item.id === formik.values.idLyLich,
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    formik.setFieldValue("idLyLich", newValue?.id || "");
                  }}
                  disabled={readOnly}
                  renderInput={(params) => (
                    <TextField {...params} label="Chọn lý lịch" size="small" />
                  )}
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

  // Render bulk mode
  return (
    <Box
      ref={containerRef}
      sx={{
        bgcolor: "#ffffff",
        p: 4,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        flex: 1,
        overflow: "hidden",
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
            ? `Thêm mới nhóm tài sản (${localBulkItems.length})`
            : `Sửa hàng loạt nhóm tài sản (${localBulkItems.length})`}
        </Typography>
        <Box display="flex" gap={0.5}>
          <IconButton size="small" onClick={handleMinimize} title="Ẩn tạm">
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
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          pr: 0.5,
        }}
      >
        {localBulkItems.map((item, index) => (
          <BulkItemCard
            key={index}
            item={item}
            index={index}
            lyLichList={lyLichList}
            bulkEditType={bulkEditType}
            totalItems={localBulkItems.length}
            onCopy={handleCopyItem}
            onDelete={handleDeleteItem}
            onChange={handleBulkItemChange}
          />
        ))}
      </Box>

      {/* Footer */}
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

// Tách BulkItemCard ra component riêng + memo để tránh re-render toàn bộ list
const BulkItemCard = memo(function BulkItemCard({
  item,
  index,
  lyLichList,
  bulkEditType,
  totalItems,
  onCopy,
  onDelete,
  onChange,
}: {
  item: BulkItem;
  index: number;
  lyLichList: LyLichType[];
  bulkEditType: "create" | "edit";
  totalItems: number;
  onCopy: (index: number) => void;
  onDelete: (index: number) => void;
  onChange: (index: number, field: string, value: string) => void;
}) {
  return (
    <Card
      sx={{
        p: 2,
        flexShrink: 0,
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
            onClick={() => onCopy(index)}
            title="Sao chép"
          >
            <ContentCopy fontSize="small" color="primary" />
          </IconButton>
          {totalItems > 1 && (
            <IconButton
              size="small"
              onClick={() => onDelete(index)}
              title="Xóa"
            >
              <Delete fontSize="small" color="error" />
            </IconButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            label="Mã nhóm tài sản *"
            value={item.id}
            onChange={(e) => onChange(index, "id", e.target.value)}
            disabled={bulkEditType === "edit"}
            error={!!item.errors?.id}
            helperText={item.errors?.id}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            label="Tên nhóm tài sản *"
            value={item.tenNhom}
            onChange={(e) => onChange(index, "tenNhom", e.target.value)}
            error={!!item.errors?.tenNhom}
            helperText={item.errors?.tenNhom}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Autocomplete
            options={lyLichList}
            getOptionLabel={(option: any) => option?.tenLyLich || ""}
            value={
              lyLichList.find(
                (lyLich: LyLichType) => lyLich.id === item.idLyLich,
              ) || null
            }
            onChange={(_, newValue) => {
              onChange(index, "idLyLich", newValue?.id || "");
            }}
            size="small"
            renderInput={(params) => (
              <TextField {...params} label="Chọn lý lịch" size="small" />
            )}
          />
        </Grid>
      </Grid>
    </Card>
  );
});
