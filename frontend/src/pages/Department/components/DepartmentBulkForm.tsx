import {
  Add,
  Close,
  ContentCopy,
  Delete,
  ExpandMore,
  InfoOutlineRounded,
  Remove,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { FormikProvider, useFormik } from "formik";
import { useCallback, useEffect, useRef, useState } from "react";
import * as yup from "yup";
import CancelBtn from "../../../components/Button/CancelBtn";
import SaveBtn from "../../../components/Button/SaveBtn";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldInput from "../../../components/TextField/FieldInput";
import { CongTy } from "../../../utils/const";
import { DepartmentType } from "../types";
import { DepartmentValidation } from "../validation";
import { useDebounce } from "../../../hooks/useDebounce";
import React from "react";

interface BulkRowState {
  key: string;
  data: Partial<DepartmentType>;
}

interface BulkDepartmentFormProps {
  open: boolean;
  onClose: () => void;
  initialRows?: DepartmentType[];
  allDepartment: DepartmentType[];
  onSave: (rows: DepartmentType[]) => void;
  mode: "create" | "edit";
  onRowsChange?: (rows: Partial<DepartmentType>[]) => void;
  onCancel: () => void;
}

interface RowFormProps {
  rowIndex: number;
  rowKey: string;
  initialData: Partial<DepartmentType>;
  allDepartment: DepartmentType[];
  mode: "create" | "edit";
  submitRef: React.MutableRefObject<
    (() => Promise<DepartmentType | null>) | null
  >;
  onRowChange: (key: string, values: Partial<DepartmentType>) => void;
}

const RowForm = React.memo(function RowForm({
  rowIndex,
  rowKey,
  initialData,
  allDepartment,
  mode,
  submitRef,
  onRowChange,
}: RowFormProps) {
  const formik = useFormik<Partial<DepartmentType>>({
    initialValues: {
      id: initialData.id ?? "",
      tenPhongBan: initialData.tenPhongBan ?? "",
      idCongTy: initialData.idCongTy ?? CongTy.CT001,
      phongCapTren: initialData.phongCapTren ?? "",
      isKho: initialData.isKho ?? false,
      isLanhDao: initialData.isLanhDao ?? false,
      loaiKho: initialData.loaiKho ?? undefined,
    },
    validationSchema: DepartmentValidation,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: () => {},
  });

  // Expose a submit function to parent
  useEffect(() => {
    submitRef.current = async () => {
      const errors = await formik.validateForm();
      if (Object.keys(errors).length > 0) {
        formik.setTouched(
          Object.keys(errors).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
        );
        return null;
      }
      return formik.values as DepartmentType;
    };
  });

  useEffect(() => {
    onRowChange(rowKey, formik.values);
  }, [formik.values, rowKey]);

  const hasError =
    Object.keys(formik.errors).length > 0 &&
    Object.keys(formik.touched).length > 0;

  return (
    <FormikProvider value={formik}>
      <Box>
        {hasError && (
          <Box mb={1}>
            <Typography variant="caption" color="error">
              Vui lòng điền đầy đủ thông tin bắt buộc
            </Typography>
          </Box>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FieldInput
              title="Mã phòng ban *"
              name="id"
              disabled={mode === "edit" && Boolean(initialData.id)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FieldInput title="Tên phòng ban *" name="tenPhongBan" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FieldAutoCompleted
              title="Phòng ban cấp trên"
              data={allDepartment}
              labelkey="tenPhongBan"
              name="phongCapTren"
              limitOptions={10}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="body2">Là kho:</Typography>
                <Checkbox
                  name="isKho"
                  size="small"
                  checked={Boolean(formik.values.isKho)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    formik.setFieldValue("isKho", isChecked);
                    if (isChecked) formik.setFieldValue("isLanhDao", false);
                    else formik.setFieldValue("loaiKho", undefined);
                  }}
                />
              </Box>

              {formik.values.isKho && (
                <Box pl={3}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="caption">Kho cấp phát:</Typography>
                    <Checkbox
                      size="small"
                      checked={formik.values.loaiKho === 1}
                      onChange={() => formik.setFieldValue("loaiKho", 1)}
                    />
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="caption">Kho thu hồi:</Typography>
                    <Checkbox
                      size="small"
                      checked={formik.values.loaiKho === 2}
                      onChange={() => formik.setFieldValue("loaiKho", 2)}
                    />
                  </Box>
                </Box>
              )}

              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="body2">Là phòng ban lãnh đạo:</Typography>
                <Checkbox
                  name="isLanhDao"
                  size="small"
                  checked={Boolean(formik.values.isLanhDao)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    formik.setFieldValue("isLanhDao", isChecked);
                    if (isChecked) {
                      formik.setFieldValue("isKho", false);
                      formik.setFieldValue("loaiKho", undefined);
                    }
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </FormikProvider>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

let rowCounter = 0;
const newKey = () => `row-${++rowCounter}`;

const emptyRow = (): BulkRowState => ({
  key: newKey(),
  data: {},
});

export default function BulkDepartmentForm({
  open,
  onClose,
  initialRows = [],
  allDepartment,
  onSave,
  mode,
  onRowsChange,
  onCancel,
}: BulkDepartmentFormProps) {
  const [rows, setRows] = useState<BulkRowState[]>([]);
  const [expanded, setExpanded] = useState<string | false>(false);
  const [submitError, setSubmitError] = useState(false);

  // Map key → submit function ref
  const submitRefs = useRef<
    Map<
      string,
      React.MutableRefObject<(() => Promise<DepartmentType | null>) | null>
    >
  >(new Map());

  // Init rows when dialog opens
  useEffect(() => {
    if (open) {
      if (initialRows.length > 0) {
        const initial = initialRows.map((r) => ({ key: newKey(), data: r }));
        setRows(initial);
        setExpanded(initial[0].key);
      } else {
        const first = emptyRow();
        setRows([first]);
        setExpanded(first.key);
      }
      setSubmitError(false);
    }
  }, [open]);

  const getOrCreateRef = (key: string) => {
    if (!submitRefs.current.has(key)) {
      submitRefs.current.set(key, { current: null });
    }
    return submitRefs.current.get(key)!;
  };

  const handleAddRow = () => {
    const newRow = emptyRow();
    setRows((prev) => [...prev, newRow]);
    setExpanded(newRow.key);
  };
  const handleCopyRow = (key: string) => {
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    const newRow: BulkRowState = {
      key: newKey(),
      data: { ...row.data, id: "" }, // giữ data, reset id
    };
    setRows((prev) => {
      const index = prev.findIndex((r) => r.key === key);
      const next = [...prev];
      next.splice(index + 1, 0, newRow); // chèn ngay sau row được copy
      return next;
    });
    setExpanded(newRow.key);
  };

  const handleDeleteRow = (key: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.key !== key);
      submitRefs.current.delete(key);
      return next;
    });
  };

  const handleSaveAll = async () => {
    setSubmitError(false);
    const results: (DepartmentType | null)[] = await Promise.all(
      rows.map((row) => {
        const ref = submitRefs.current.get(row.key);
        if (ref?.current) return ref.current();
        return Promise.resolve(null);
      }),
    );

    const hasError = results.some((r) => r === null);
    if (hasError) {
      setSubmitError(true);
      // Expand first error row
      const firstErrorIndex = results.findIndex((r) => r === null);
      if (firstErrorIndex !== -1) {
        setExpanded(rows[firstErrorIndex].key);
      }
      return;
    }

    onSave(results as DepartmentType[]);
  };

  const handleRowDataChange = useCallback(
    (key: string, values: Partial<DepartmentType>) => {
      setRows((prev) =>
        prev.map((r) => (r.key === key ? { ...r, data: values } : r)),
      );
    },
    [],
  );

  const getRowLabel = (row: BulkRowState, index: number) => {
    return row.data.tenPhongBan || row.data.id || `Phòng ban ${index + 1}`;
  };

  const handleMinimize = () => {
    onRowsChange?.(rows.map((r) => r.data as DepartmentType));
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleMinimize} maxWidth="md" fullWidth>
      {/* Title */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f1f5f9",
          pb: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <InfoOutlineRounded sx={{ color: "#1FA463" }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1FA463" }}>
            {mode === "create" ? "Thêm nhiều phòng ban" : "Chỉnh sửa hàng loạt"}
          </Typography>
          <Chip
            label={`${rows.length} phòng ban`}
            size="small"
            sx={{ bgcolor: "#e8f5e9", color: "#1FA463", fontWeight: 600 }}
          />
        </Box>
        <Box display="flex" alignItems="center">
          <IconButton size="small" onClick={handleMinimize}>
            <Remove fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onCancel}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Error banner */}
        {submitError && (
          <Box
            sx={{
              mx: 3,
              mt: 2,
              px: 2,
              py: 1,
              bgcolor: "#fff3f3",
              border: "1px solid #ffcdd2",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="error">
              Có phòng ban chưa điền đủ thông tin bắt buộc. Vui lòng kiểm tra
              lại.
            </Typography>
          </Box>
        )}

        {/* Accordion list */}
        <Box sx={{ px: 3, pt: 2, pb: 1, maxHeight: "60vh", overflowY: "auto" }}>
          {rows.map((row, index) => (
            <Box
              key={row.key}
              sx={{
                mb: 2,
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  bgcolor: "#f0fdf4",
                  borderRadius: "8px 8px 0 0",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: "#1FA463",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography sx={{ fontWeight: 600, flex: 1 }}>
                  {getRowLabel(row, index)}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.25}>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyRow(row.key)}
                    sx={{ p: 0.5, color: "primary.main" }}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                  {rows.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteRow(row.key)}
                      sx={{ p: 0.5, color: "error.main" }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>

              {/* Form */}
              <Box sx={{ p: 2 }}>
                <RowForm
                  rowIndex={index}
                  rowKey={row.key}
                  initialData={row.data}
                  allDepartment={allDepartment}
                  mode={mode}
                  submitRef={getOrCreateRef(row.key)}
                  onRowChange={handleRowDataChange}
                />
              </Box>
            </Box>
          ))}
        </Box>
        <Divider />

        {/* Footer */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={3}
          py={2}
        >
          {mode === "create" && (
            <Button
              startIcon={<Add />}
              onClick={handleAddRow}
              variant="contained"
              sx={{
                bgcolor: "#1FA463",
                color: "#fff",
                "&:hover": { bgcolor: "#178a52" },
              }}
            >
              Thêm dòng mới
            </Button>
          )}
          <Box display="flex" gap={2} ml="auto">
            <CancelBtn onClick={onCancel} />
            <SaveBtn onSave={handleSaveAll} />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
