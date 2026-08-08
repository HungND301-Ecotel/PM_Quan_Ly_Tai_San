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
  Button,
  Card,
  Checkbox,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import { FormikProvider, useFormik } from "formik";
import { PositionValidation } from "../validation/Validation";
import EditButton from "../../../components/Button/EditButton";
import { CongTy } from "../../../utils/const";

const normalizeItem = (item: any) => ({
  id: item.id ?? "",
  tenChucVu: item.tenChucVu ?? "",
  quanLyNhanVien: item.quanLyNhanVien ?? false,
  quanLyPhongBan: item.quanLyPhongBan ?? false,
  quanLyDuAn: item.quanLyDuAn ?? false,
  quanLyNguonVon: item.quanLyNguonVon ?? false,
  quanLyMoHinhTaiSan: item.quanLyMoHinhTaiSan ?? false,
  quanLyNhomTaiSan: item.quanLyNhomTaiSan ?? false,
  quanLyTaiSan: item.quanLyTaiSan ?? false,
  quanLyCCDCVatTu: item.quanLyCCDCVatTu ?? false,
  dieuDongTaiSan: item.dieuDongTaiSan ?? false,
  dieuDongCCDCVatTu: item.dieuDongCCDCVatTu ?? false,
  banGiaoTaiSan: item.banGiaoTaiSan ?? false,
  banGiaoCCDCVatTu: item.banGiaoCCDCVatTu ?? false,
  baoCao: item.baoCao ?? false,
  banHanhQuyetDinh: item.banHanhQuyetDinh ?? false,
  idCongTy: item.idCongTy ?? CongTy.CT001,
});

export default function PositionForm({
  onEdit,
  onCancel,
  selectedPosition,
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
  onMinimize: () => void;
  selectedPosition?: any;
  readOnly: boolean;
  onSave: (values: any) => void;
  onFormChange?: (values: any) => void;
  initialFormData?: Record<string, any>;
  isBulkMode?: boolean;
  bulkItems?: any[];
  onBulkItemsChange?: (items: any[]) => void;
  bulkEditType?: "create" | "edit";
}) {
  const formik = useFormik({
    initialValues: normalizeItem(initialFormData ?? {}),
    validationSchema: PositionValidation,
    onSubmit(values) {
      onSave(values);
    },
  });

  const onFormChangeRef = useRef(onFormChange);
  const onBulkItemsChangeRef = useRef(onBulkItemsChange);
  useEffect(() => {
    onFormChangeRef.current = onFormChange;
  });
  useEffect(() => {
    onBulkItemsChangeRef.current = onBulkItemsChange;
  });

  useEffect(() => {
    if (selectedPosition) {
      formik.setValues(normalizeItem(selectedPosition));
      formik.setErrors({});
    }
  }, [selectedPosition, readOnly]);

  useEffect(() => {
    if (initialFormData && Object.keys(initialFormData).length > 0) {
      formik.setValues(normalizeItem(initialFormData));
    }
  }, [initialFormData]);

  const [localBulkItems, setLocalBulkItems] = useState<any[]>(() => {
    if ((initialFormData?.items?.length ?? 0) > 0)
      return initialFormData!.items.map(normalizeItem);
    if ((bulkItems?.length ?? 0) > 0) return bulkItems.map(normalizeItem);
    return [];
  });

  const prevInitialFormDataRef = useRef(initialFormData);
  useEffect(() => {
    if (initialFormData === prevInitialFormDataRef.current) return;
    prevInitialFormDataRef.current = initialFormData;
    if ((initialFormData?.items?.length ?? 0) > 0) {
      setLocalBulkItems(initialFormData!.items.map(normalizeItem));
    }
  }, [initialFormData]);

  const listEndRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(localBulkItems.length);

  useEffect(() => {
    if (localBulkItems.length > prevLengthRef.current) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    prevLengthRef.current = localBulkItems.length;
  }, [localBulkItems.length]);

  // Bulk handlers
  const handleAddItem = () => {
    const newItem = {
      id: "",
      tenChucVu: "",
      quanLyNhanVien: false,
      quanLyPhongBan: false,
      quanLyDuAn: false,
      quanLyNguonVon: false,
      quanLyMoHinhTaiSan: false,
      quanLyNhomTaiSan: false,
      quanLyTaiSan: false,
      quanLyCCDCVatTu: false,
      dieuDongTaiSan: false,
      dieuDongCCDCVatTu: false,
      banGiaoTaiSan: false,
      banGiaoCCDCVatTu: false,
      baoCao: false,
      banHanhQuyetDinh: false,
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
  };

  const validateBulkItems = async () => {
    let hasError = false;
    const updated = await Promise.all(
      localBulkItems.map(async (item) => {
        try {
          await PositionValidation.validate(item, { abortEarly: false });
          return { ...item, errors: undefined };
        } catch (error: any) {
          hasError = true;
          // error.inner chứa tất cả lỗi khi abortEarly: false
          const errors = error.inner.reduce((acc: any, err: any) => {
            acc[err.path] = err.message;
            return acc;
          }, {});
          return { ...item, errors };
        }
      }),
    );
    setLocalBulkItems(updated);
    return { hasError, items: updated };
  };

  const handleBulkSave = async () => {
    const { hasError, items } = await validateBulkItems();
    if (hasError) return;

    // Dùng items từ validate, đồng thời strip field errors trước khi save
    const cleanItems = items.map(({ errors, ...rest }) => rest);
    onSave(cleanItems);
  };

  const handleMinimize = () => {
    if (isBulkMode) {
      onBulkItemsChangeRef.current?.(localBulkItems);
    } else {
      onFormChangeRef.current?.(formik.values);
    }
    onMinimize();
  };

  // Bulk mode render
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
              ? `Thêm mới chức vụ (${localBulkItems.length})`
              : `Sửa hàng loạt chức vụ (${localBulkItems.length})`}
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
                backgroundColor: "#ffffff",
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

              {/* Text fields */}
              <Grid container spacing={2} mb={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Mã chức vụ *"
                    value={item.id}
                    onChange={(e) =>
                      handleBulkItemChange(index, "id", e.target.value)
                    }
                    disabled={bulkEditType === "edit"}
                    error={!!item.errors?.id}
                    helperText={item.errors?.id}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Tên chức vụ *"
                    value={item.tenChucVu}
                    onChange={(e) =>
                      handleBulkItemChange(index, "tenChucVu", e.target.value)
                    }
                    error={!!item.errors?.tenChucVu}
                    helperText={item.errors?.tenChucVu}
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* Checkboxes */}
              <Typography sx={{ fontWeight: 600, color: "#1FA463", mb: 1 }}>
                Phân quyền
              </Typography>
              <Grid container spacing={1}>
                {[
                  { field: "quanLyNhanVien", label: "Quản lý nhân viên" },
                  { field: "quanLyPhongBan", label: "Quản lý phòng ban" },
                  { field: "quanLyDuAn", label: "Quản lý dự án" },
                  { field: "quanLyNguonVon", label: "Quản lý nguồn vốn" },
                  {
                    field: "quanLyMoHinhTaiSan",
                    label: "Quản lý mô hình tài sản",
                  },
                  { field: "quanLyNhomTaiSan", label: "Quản lý nhóm tài sản" },
                  { field: "quanLyTaiSan", label: "Quản lý tài sản" },
                  { field: "quanLyCCDCVatTu", label: "Quản lý CCDC vật tư" },
                  { field: "dieuDongTaiSan", label: "Điều động tài sản" },
                  {
                    field: "dieuDongCCDCVatTu",
                    label: "Điều động CCDC vật tư",
                  },
                  { field: "banGiaoTaiSan", label: "Bàn giao tài sản" },
                  { field: "banGiaoCCDCVatTu", label: "Bàn giao CCDC vật tư" },
                  { field: "banHanhQuyetDinh", label: "Ban hành quyết định" },
                  { field: "baoCao", label: "Báo cáo" },
                ].map(({ field, label }) => (
                  <Grid size={{ xs: 6 }} key={field}>
                    <Box display="flex" alignItems="center">
                      <Box width={200}>
                        <Typography variant="body2">{label}:</Typography>
                      </Box>
                      <Checkbox
                        size="small"
                        checked={item[field] ?? false}
                        onChange={(e) =>
                          handleBulkItemChange(index, field, e.target.checked)
                        }
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          ))}
          <div ref={listEndRef} />
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

  // Single mode render
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
            Chi tiết chức vụ
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

        {/* Thông tin cơ bản */}
        <Paper sx={{ p: 2, borderRadius: "12px" }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <InfoOutlineRounded sx={{ color: "#1FA463" }} />
            <Typography sx={{ fontWeight: 600, color: "#1FA463" }}>
              Thông tin chức vụ
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Mã chức vụ *"
                name="id"
                disabled={Boolean(selectedPosition?.id)}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldInput
                title="Tên chức vụ *"
                name="tenChucVu"
                disabled={readOnly}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Phân quyền */}
        <Paper sx={{ p: 2, borderRadius: "12px" }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <InfoOutlineRounded sx={{ color: "#1FA463" }} />
            <Typography sx={{ fontWeight: 600, color: "#1FA463" }}>
              Phân quyền
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Quản lý nhân viên:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.quanLyNhanVien}
                  onChange={(e) =>
                    formik.setFieldValue("quanLyNhanVien", e.target.checked)
                  }
                  name="quanLyNhanVien"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Quản lý CCDC vật tư:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.quanLyCCDCVatTu}
                  onChange={(e) =>
                    formik.setFieldValue("quanLyCCDCVatTu", e.target.checked)
                  }
                  name="quanLyCCDCVatTu"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Quản lý phòng ban:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.quanLyPhongBan}
                  onChange={(e) =>
                    formik.setFieldValue("quanLyPhongBan", e.target.checked)
                  }
                  name="quanLyPhongBan"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Điều động tài sản:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.dieuDongTaiSan}
                  onChange={(e) =>
                    formik.setFieldValue("dieuDongTaiSan", e.target.checked)
                  }
                  name="dieuDongTaiSan"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Quản lý dự án:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.quanLyDuAn}
                  onChange={(e) =>
                    formik.setFieldValue("quanLyDuAn", e.target.checked)
                  }
                  name="quanLyDuAn"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Điều động CCDC vật tư:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.dieuDongCCDCVatTu}
                  onChange={(e) =>
                    formik.setFieldValue("dieuDongCCDCVatTu", e.target.checked)
                  }
                  name="dieuDongCCDCVatTu"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Quản lý nguồn vốn:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.quanLyNguonVon}
                  onChange={(e) =>
                    formik.setFieldValue("quanLyNguonVon", e.target.checked)
                  }
                  name="quanLyNguonVon"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Bàn giao tài sản:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.banGiaoTaiSan}
                  onChange={(e) =>
                    formik.setFieldValue("banGiaoTaiSan", e.target.checked)
                  }
                  name="banGiaoTaiSan"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Quản lý mô hình tài sản:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.quanLyMoHinhTaiSan}
                  onChange={(e) =>
                    formik.setFieldValue("quanLyMoHinhTaiSan", e.target.checked)
                  }
                  name="quanLyMoHinhTaiSan"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Bàn giao CCDC vật tư:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.banGiaoCCDCVatTu}
                  onChange={(e) =>
                    formik.setFieldValue("banGiaoCCDCVatTu", e.target.checked)
                  }
                  name="banGiaoCCDCVatTu"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Quản lý nhóm tài sản:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.quanLyNhomTaiSan}
                  onChange={(e) =>
                    formik.setFieldValue("quanLyNhomTaiSan", e.target.checked)
                  }
                  name="quanLyNhomTaiSan"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Ban hành quyết định:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.banHanhQuyetDinh}
                  onChange={(e) =>
                    formik.setFieldValue("banHanhQuyetDinh", e.target.checked)
                  }
                  name="banHanhQuyetDinh"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Báo cáo:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.baoCao}
                  onChange={(e) =>
                    formik.setFieldValue("baoCao", e.target.checked)
                  }
                  name="baoCao"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box display="flex" alignItems="center">
                <Box width={200}>
                  <Typography>Quản lý tài sản:</Typography>
                </Box>
                <Checkbox
                  checked={formik.values.quanLyTaiSan}
                  onChange={(e) =>
                    formik.setFieldValue("quanLyTaiSan", e.target.checked)
                  }
                  name="quanLyTaiSan"
                  disabled={readOnly}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

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
