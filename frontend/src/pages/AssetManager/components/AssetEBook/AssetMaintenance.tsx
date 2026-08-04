import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  Button,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import dayjs from "dayjs";
import SaveBtn from "../../../../components/Button/SaveBtn";
import CancelBtn from "../../../../components/Button/CancelBtn";
import EditButton from "../../../../components/Button/EditButton";
import {
  useSuCoTaiSanQuery,
  useCreateBatchSuCoMutation,
  useUpdateBatchSuCoMutation,
  useDeleteBatchSuCoMutation,
} from "../../Mutation";
import { SuCoTaiSanType } from "../../types";
import { showErrorAlert, showSuccessAlert } from "../../../../components/Alert";

// Style sách – giống các trang khác trong AssetEBook
const bookStyles = {
  container: {
    width: "210mm",
    minHeight: "297mm",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "2px",
    boxShadow:
      "0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
    position: "relative" as const,
    padding: "24px",
    display: "flex",
    flexDirection: "column" as const,
    "&::before": {
      content: '""',
      position: "absolute" as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: "24px",
      background:
        "linear-gradient(to right, rgba(139, 69, 19, 0.08), transparent)",
      pointerEvents: "none" as const,
      borderTopLeftRadius: "12px",
      borderBottomLeftRadius: "12px",
    },
    "&::after": {
      content: '""',
      position: "absolute" as const,
      right: 0,
      top: 0,
      bottom: 0,
      width: "24px",
      background:
        "linear-gradient(to left, rgba(139, 69, 19, 0.08), transparent)",
      pointerEvents: "none" as const,
      borderTopRightRadius: "12px",
      borderBottomRightRadius: "12px",
    },
  },
  content: { flex: 1, overflow: "auto" },
  footer: {
    marginTop: "auto",
    paddingTop: "24px",
    position: "relative" as const,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  pageNumber: {
    position: "absolute" as const,
    bottom: 0,
    right: "20px",
    fontSize: "12px",
    fontStyle: "italic" as const,
  },
};

// Shared cell sx for header
const hcell = (extra?: object) => ({
  fontFamily: '"Times New Roman", Times, serif',
  fontWeight: "bold",
  fontSize: "14px",
  border: "1px solid black",
  backgroundColor: "transparent",
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
  padding: "6px 4px",
  ...extra,
});

// Shared cell sx for data rows
const dcell = (extra?: object) => ({
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: "14px",
  borderTop: "none",
  borderBottom: "1px dashed black",
  borderLeft: "1px solid black",
  borderRight: "1px solid black",
  padding: "4px 6px",
  height: "38px",
  verticalAlign: "middle" as const,
  ...extra,
});

interface IncidentRow {
  id: string;
  ca: string;
  ngayThangNam: string;
  hoTenVanHanh: string;
  nguyenNhan: string;
  hoTenSuaChua: string;
  gioNgung: string;
  tienCongSC: string;
  tienNguyenVatLieu: string;
  tongCong: string;
  isNew?: boolean;
  isUpdated?: boolean;
}

interface AssetMaintenanceProps {
  asset?: any;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  readOnly?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  isView?: boolean;
}

const EMPTY_ROWS_TARGET = 12;

export default function AssetMaintenance({
  asset,
  onPageChange,
  currentPage = 6,
  totalPages = 6,
  readOnly = true,
  onEdit,
  onCancel,
  isView = false,
}: AssetMaintenanceProps) {
  const assetId = asset?.id || asset?.Id;
  const { data: apiData, isLoading, refetch } = useSuCoTaiSanQuery(assetId);

  const createBatchMutation = useCreateBatchSuCoMutation();
  const updateBatchMutation = useUpdateBatchSuCoMutation();
  const deleteBatchMutation = useDeleteBatchSuCoMutation();

  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Đồng bộ dữ liệu từ API khi tải xong hoặc thay đổi asset
  useEffect(() => {
    if (apiData && Array.isArray(apiData)) {
      const mappedRows: IncidentRow[] = apiData.map((item: SuCoTaiSanType) => ({
        id: item.id || `item-${Math.random()}`,
        ca: item.ca || "",
        ngayThangNam: item.ngayThangNam || "",
        hoTenVanHanh: item.hoTenVanHanh || "",
        nguyenNhan: item.nguyenNhan || "",
        hoTenSuaChua: item.hoTenSuaChua || "",
        gioNgung: item.gioNgung != null ? String(item.gioNgung) : "",
        tienCongSC: item.tienCongSC != null ? String(item.tienCongSC) : "",
        tienNguyenVatLieu:
          item.tienNguyenVatLieu != null ? String(item.tienNguyenVatLieu) : "",
        tongCong: item.tongCong != null ? String(item.tongCong) : "",
        isNew: false,
        isUpdated: false,
      }));
      setRows(mappedRows);
    } else {
      setRows([]);
    }
  }, [apiData]);

  const handleEdit = () => {
    setIsEditMode(true);
    setDeletedIds([]);
    onEdit?.();
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setDeletedIds([]);
    // Trở lại dữ liệu ban đầu
    if (apiData && Array.isArray(apiData)) {
      setRows(
        apiData.map((item: SuCoTaiSanType) => ({
          id: item.id || "",
          ca: item.ca || "",
          ngayThangNam: item.ngayThangNam || "",
          hoTenVanHanh: item.hoTenVanHanh || "",
          nguyenNhan: item.nguyenNhan || "",
          hoTenSuaChua: item.hoTenSuaChua || "",
          gioNgung: item.gioNgung != null ? String(item.gioNgung) : "",
          tienCongSC: item.tienCongSC != null ? String(item.tienCongSC) : "",
          tienNguyenVatLieu:
            item.tienNguyenVatLieu != null
              ? String(item.tienNguyenVatLieu)
              : "",
          tongCong: item.tongCong != null ? String(item.tongCong) : "",
          isNew: false,
          isUpdated: false,
        })),
      );
    }
    onCancel?.();
  };

  const handleSave = async () => {
    if (!assetId) {
      showErrorAlert("Không tìm thấy ID tài sản");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Xử lý Delete Batch
      if (deletedIds.length > 0) {
        const validDeleteIds = deletedIds.filter(
          (id) => !id.startsWith("temp-"),
        );
        if (validDeleteIds.length > 0) {
          await deleteBatchMutation.mutateAsync(validDeleteIds);
        }
      }

      // 2. Xử lý Create Batch
      const newRows = rows.filter((r) => r.isNew || r.id.startsWith("temp-"));
      if (newRows.length > 0) {
        const createPayload = newRows.map((r) => ({
          idTaiSan: assetId,
          ca: r.ca,
          ngayThangNam: r.ngayThangNam,
          hoTenVanHanh: r.hoTenVanHanh,
          nguyenNhan: r.nguyenNhan,
          hoTenSuaChua: r.hoTenSuaChua,
          gioNgung: r.gioNgung ? parseFloat(r.gioNgung) : null,
          tienCongSC: r.tienCongSC ? parseFloat(r.tienCongSC) : null,
          tienNguyenVatLieu: r.tienNguyenVatLieu
            ? parseFloat(r.tienNguyenVatLieu)
            : null,
          tongCong: r.tongCong ? parseFloat(r.tongCong) : null,
        }));
        await createBatchMutation.mutateAsync(createPayload);
      }

      // 3. Xử lý Update Batch
      const updatedRows = rows.filter(
        (r) => !r.isNew && !r.id.startsWith("temp-") && r.isUpdated,
      );
      if (updatedRows.length > 0) {
        const updatePayload = updatedRows.map((r) => ({
          id: r.id,
          idTaiSan: assetId,
          ca: r.ca,
          ngayThangNam: r.ngayThangNam,
          hoTenVanHanh: r.hoTenVanHanh,
          nguyenNhan: r.nguyenNhan,
          hoTenSuaChua: r.hoTenSuaChua,
          gioNgung: r.gioNgung ? parseFloat(r.gioNgung) : null,
          tienCongSC: r.tienCongSC ? parseFloat(r.tienCongSC) : null,
          tienNguyenVatLieu: r.tienNguyenVatLieu
            ? parseFloat(r.tienNguyenVatLieu)
            : null,
          tongCong: r.tongCong ? parseFloat(r.tongCong) : null,
        }));
        await updateBatchMutation.mutateAsync(updatePayload);
      }

      showSuccessAlert("Lưu theo dõi sự cố thành công");
      setIsEditMode(false);
      setDeletedIds([]);
      refetch();
    } catch (error: any) {
      showErrorAlert(
        error?.response?.data?.message || error?.message || "Lưu thất bại",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRow = () => {
    const newRow: IncidentRow = {
      id: `temp-${Date.now()}`,
      ca: "",
      ngayThangNam: dayjs().format("YYYY-MM-DD"),
      hoTenVanHanh: "",
      nguyenNhan: "",
      hoTenSuaChua: "",
      gioNgung: "",
      tienCongSC: "",
      tienNguyenVatLieu: "",
      tongCong: "",
      isNew: true,
      isUpdated: false,
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    if (!id.startsWith("temp-")) {
      setDeletedIds((prev) => [...prev, id]);
    }
    setRows(rows.filter((r) => r.id !== id));
  };

  const handleChange = (
    id: string,
    field: keyof IncidentRow,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
              isUpdated: !row.isNew ? true : row.isUpdated,
            }
          : row,
      ),
    );
  };

  const emptyCount = Math.max(0, EMPTY_ROWS_TARGET - rows.length);

  return (
    <Box sx={bookStyles.container}>
      {/* Toolbar */}
      {!isView && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            mb: 2,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            {isEditMode && (
              <>
                <SaveBtn onSave={handleSave} />
                <CancelBtn onClick={handleCancel} />
              </>
            )}
            {!isEditMode && <EditButton onClick={handleEdit} />}
          </Box>
        </Box>
      )}

      {/* Tiêu đề */}
      <Typography
        textAlign="center"
        fontSize={17}
        fontWeight={700}
        sx={{
          letterSpacing: "1px",
          mb: 2,
          fontFamily: '"Times New Roman", Times, serif',
        }}
      >
        THEO DÕI TÌNH HÌNH SỰ CỐ XẢY RA HÀNG THÁNG
      </Typography>

      {/* Nút thêm dòng (chỉ khi edit) */}
      {isEditMode && (
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddRow}
            disabled={isSaving}
            sx={{
              borderColor: "#009e60",
              color: "#009e60",
              "&:hover": { borderColor: "#66bb6a", bgcolor: "#e6f7f0" },
              textTransform: "none",
            }}
          >
            Thêm sự cố
          </Button>
        </Box>
      )}

      {/* Bảng */}
      <Box sx={bookStyles.content}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: "0px",
              overflowX: "auto",
              width: "100%",
              mt: "4px",
            }}
          >
            <Table
              size="small"
              sx={{
                borderCollapse: "collapse",
                border: "1px solid black",
                tableLayout: "fixed",
              }}
            >
              <TableHead>
                {/* Header tầng 1 */}
                <TableRow>
                  <TableCell rowSpan={2} sx={hcell({ width: "50px" })}>
                    Ca
                  </TableCell>
                  <TableCell rowSpan={2} sx={hcell({ width: "120px" })}>
                    Ngày/tháng/năm
                  </TableCell>
                  <TableCell rowSpan={2} sx={hcell({ width: "200px" })}>
                    Họ tên và chữ ký người vận hành ca máy xảy ra sự cố
                  </TableCell>
                  <TableCell rowSpan={2} sx={hcell({ width: "200px" })}>
                    Nguyên nhân sự cố, tình trạng và cách giải quyết hư hỏng
                  </TableCell>
                  <TableCell rowSpan={2} sx={hcell({ width: "200px" })}>
                    Họ tên và chữ ký người sửa chữa
                  </TableCell>
                  {/* Nhóm "Thiệt hại vì sự cố" – span 4 cột */}
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={hcell({ width: "300px" })}
                  >
                    Thiệt hại vì sự cố
                  </TableCell>
                  {isEditMode && (
                    <TableCell rowSpan={2} sx={hcell({ width: "70px" })}>
                      Thao tác
                    </TableCell>
                  )}
                </TableRow>

                {/* Header tầng 2 */}
                <TableRow>
                  <TableCell sx={hcell({ width: "200px" })}>
                    Giờ ngừng (h)
                  </TableCell>
                  <TableCell sx={hcell({ width: "200px" })}>
                    Tiền công s/c
                  </TableCell>
                  <TableCell sx={hcell({ width: "200px" })}>
                    Tiền nguyên vật liệu
                  </TableCell>
                  <TableCell sx={hcell({ width: "200px" })}>
                    Tổng cộng (đ)
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {/* Dữ liệu thực */}
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {/* Ca */}
                    <TableCell align="center" sx={dcell()}>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          variant="standard"
                          type="number"
                          InputProps={{
                            disableUnderline: true,
                            inputProps: {
                              style: { textAlign: "center" },
                              min: 1,
                            },
                          }}
                          value={row.ca}
                          onChange={(e) =>
                            handleChange(row.id, "ca", e.target.value)
                          }
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: "14px",
                            textAlign: "center",
                          }}
                        >
                          {row.ca}
                        </Typography>
                      )}
                    </TableCell>
                    {/* Ngày/tháng/năm */}
                    <TableCell align="center" sx={dcell()}>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          variant="standard"
                          type="date"
                          InputProps={{ disableUnderline: true }}
                          value={row.ngayThangNam}
                          onChange={(e) =>
                            handleChange(row.id, "ngayThangNam", e.target.value)
                          }
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: "14px",
                          }}
                        >
                          {row.ngayThangNam
                            ? dayjs(row.ngayThangNam).format("DD/MM/YYYY")
                            : ""}
                        </Typography>
                      )}
                    </TableCell>
                    {/* Họ tên vận hành */}
                    <TableCell sx={dcell()}>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          variant="standard"
                          InputProps={{ disableUnderline: true }}
                          value={row.hoTenVanHanh}
                          onChange={(e) =>
                            handleChange(row.id, "hoTenVanHanh", e.target.value)
                          }
                          placeholder="Họ và tên..."
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: "14px",
                          }}
                        >
                          {row.hoTenVanHanh}
                        </Typography>
                      )}
                    </TableCell>
                    {/* Nguyên nhân */}
                    <TableCell sx={dcell()}>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          variant="standard"
                          multiline
                          maxRows={3}
                          InputProps={{ disableUnderline: true }}
                          value={row.nguyenNhan}
                          onChange={(e) =>
                            handleChange(row.id, "nguyenNhan", e.target.value)
                          }
                          placeholder="Mô tả nguyên nhân..."
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: "14px",
                          }}
                        >
                          {row.nguyenNhan}
                        </Typography>
                      )}
                    </TableCell>
                    {/* Họ tên sửa chữa */}
                    <TableCell sx={dcell()}>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          variant="standard"
                          InputProps={{ disableUnderline: true }}
                          value={row.hoTenSuaChua}
                          onChange={(e) =>
                            handleChange(row.id, "hoTenSuaChua", e.target.value)
                          }
                          placeholder="Họ và tên..."
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: "14px",
                          }}
                        >
                          {row.hoTenSuaChua}
                        </Typography>
                      )}
                    </TableCell>
                    {/* Giờ ngừng */}
                    <TableCell align="center" sx={dcell()}>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          variant="standard"
                          type="number"
                          InputProps={{
                            disableUnderline: true,
                            inputProps: {
                              style: { textAlign: "center" },
                              min: 0,
                              step: 0.5,
                            },
                          }}
                          value={row.gioNgung}
                          onChange={(e) =>
                            handleChange(row.id, "gioNgung", e.target.value)
                          }
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: "14px",
                            textAlign: "center",
                          }}
                        >
                          {row.gioNgung}
                        </Typography>
                      )}
                    </TableCell>
                    {/* Tiền công s/c */}
                    <TableCell align="center" sx={dcell()}>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          variant="standard"
                          type="number"
                          InputProps={{
                            disableUnderline: true,
                            inputProps: {
                              style: { textAlign: "center" },
                              min: 0,
                            },
                          }}
                          value={row.tienCongSC}
                          onChange={(e) =>
                            handleChange(row.id, "tienCongSC", e.target.value)
                          }
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: "14px",
                            textAlign: "center",
                          }}
                        >
                          {row.tienCongSC}
                        </Typography>
                      )}
                    </TableCell>
                    {/* Tiền nguyên vật liệu */}
                    <TableCell align="center" sx={dcell()}>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          variant="standard"
                          type="number"
                          InputProps={{
                            disableUnderline: true,
                            inputProps: {
                              style: { textAlign: "center" },
                              min: 0,
                            },
                          }}
                          value={row.tienNguyenVatLieu}
                          onChange={(e) =>
                            handleChange(
                              row.id,
                              "tienNguyenVatLieu",
                              e.target.value,
                            )
                          }
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: "14px",
                            textAlign: "center",
                          }}
                        >
                          {row.tienNguyenVatLieu}
                        </Typography>
                      )}
                    </TableCell>
                    {/* Tổng cộng */}
                    <TableCell align="center" sx={dcell()}>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          variant="standard"
                          type="number"
                          InputProps={{
                            disableUnderline: true,
                            inputProps: {
                              style: { textAlign: "center" },
                              min: 0,
                            },
                          }}
                          value={row.tongCong}
                          onChange={(e) =>
                            handleChange(row.id, "tongCong", e.target.value)
                          }
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: "14px",
                            textAlign: "center",
                          }}
                        >
                          {row.tongCong}
                        </Typography>
                      )}
                    </TableCell>
                    {/* Xóa */}
                    {isEditMode && (
                      <TableCell align="center" sx={dcell()}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRow(row.id)}
                          sx={{ color: "#d32f2f" }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}

                {/* Dòng trống mô phỏng sổ sách */}
                {!isEditMode &&
                  Array.from({ length: emptyCount }).map((_, index) => (
                    <TableRow key={`empty-${index}`}>
                      {Array.from({ length: 9 }).map((__, ci) => (
                        <TableCell
                          key={ci}
                          sx={{ ...dcell(), height: "38px" }}
                        />
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Footer */}
      <Box sx={bookStyles.footer}>
        <Box sx={bookStyles.pageNumber}>Trang {currentPage}</Box>
      </Box>
    </Box>
  );
}
