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
  useSuaChuaMayThangQuery,
  useCreateBatchSuaChuaMutation,
  useUpdateBatchSuaChuaMutation,
  useDeleteBatchSuaChuaMutation,
} from "../../Mutation";
import { SuaChuaMayThangType } from "../../types";
import { showErrorAlert, showSuccessAlert } from "../../../../components/Alert";

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

const hcell = (extra?: object) => ({
  fontFamily: '"Times New Roman", Times, serif',
  fontWeight: "bold",
  fontSize: "13px",
  border: "1px solid black",
  backgroundColor: "transparent",
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
  padding: "5px 4px",
  lineHeight: 1.3,
  ...extra,
});

const dcell = (extra?: object) => ({
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: "13px",
  borderTop: "none",
  borderBottom: "1px dashed black",
  borderLeft: "1px solid black",
  borderRight: "1px solid black",
  padding: "4px 5px",
  height: "38px",
  verticalAlign: "middle" as const,
  ...extra,
});

interface RepairRow {
  id: string;
  capSuaChua: string;
  ngayVao: string;
  ngayRa: string;
  thayTheSuaChua: string;
  cong_keHoach: string;
  cong_thucHien: string;
  tongKimLoai: string;
  hoTenKyThuat: string;
  xacNhanKetQua: string;
  isNew?: boolean;
  isUpdated?: boolean;
}

interface MaintenanceMonthlyPageProps {
  asset?: any;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  readOnly?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  isView?: boolean;
}

const EMPTY_ROWS_TARGET = 14;

const mapApiToRow = (item: SuaChuaMayThangType): RepairRow => ({
  id: item.id || `item-${Math.random()}`,
  capSuaChua: item.capSuaChua || "",
  ngayVao: item.ngayVao || "",
  ngayRa: item.ngayRa || "",
  thayTheSuaChua: item.thayTheSuaChua || "",
  cong_keHoach: item.congKeHoach != null ? String(item.congKeHoach) : "",
  cong_thucHien: item.congThucHien != null ? String(item.congThucHien) : "",
  tongKimLoai: item.tongKimLoai != null ? String(item.tongKimLoai) : "",
  hoTenKyThuat: item.hoTenKyThuat || "",
  xacNhanKetQua: item.xacNhanKetQua || "",
  isNew: false,
  isUpdated: false,
});

const MaintenanceMonthlyPage: React.FC<MaintenanceMonthlyPageProps> = ({
  asset,
  onPageChange,
  currentPage = 7,
  totalPages = 7,
  readOnly = true,
  onEdit,
  onCancel,
  isView = false,
}) => {
  const assetId = asset?.id || asset?.Id;
  const {
    data: apiData,
    isLoading,
    refetch,
  } = useSuaChuaMayThangQuery(assetId);

  const createBatchMutation = useCreateBatchSuaChuaMutation();
  const updateBatchMutation = useUpdateBatchSuaChuaMutation();
  const deleteBatchMutation = useDeleteBatchSuaChuaMutation();

  const [rows, setRows] = useState<RepairRow[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Đồng bộ dữ liệu từ API
  useEffect(() => {
    if (apiData && Array.isArray(apiData)) {
      setRows(apiData.map(mapApiToRow));
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
    if (apiData && Array.isArray(apiData)) {
      setRows(apiData.map(mapApiToRow));
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
      // 1. Delete batch
      if (deletedIds.length > 0) {
        const validDeleteIds = deletedIds.filter(
          (id) => !id.startsWith("temp-"),
        );
        if (validDeleteIds.length > 0) {
          await deleteBatchMutation.mutateAsync(validDeleteIds);
        }
      }

      // 2. Create batch
      const newRows = rows.filter((r) => r.isNew || r.id.startsWith("temp-"));
      if (newRows.length > 0) {
        const createPayload = newRows.map((r) => ({
          idTaiSan: assetId,
          capSuaChua: r.capSuaChua,
          ngayVao: r.ngayVao,
          ngayRa: r.ngayRa,
          thayTheSuaChua: r.thayTheSuaChua,
          congKeHoach: r.cong_keHoach ? parseFloat(r.cong_keHoach) : null,
          congThucHien: r.cong_thucHien ? parseFloat(r.cong_thucHien) : null,
          tongKimLoai: r.tongKimLoai ? parseFloat(r.tongKimLoai) : null,
          hoTenKyThuat: r.hoTenKyThuat,
          xacNhanKetQua: r.xacNhanKetQua,
        }));
        await createBatchMutation.mutateAsync(createPayload);
      }

      // 3. Update batch
      const updatedRows = rows.filter(
        (r) => !r.isNew && !r.id.startsWith("temp-") && r.isUpdated,
      );
      if (updatedRows.length > 0) {
        const updatePayload = updatedRows.map((r) => ({
          id: r.id,
          idTaiSan: assetId,
          capSuaChua: r.capSuaChua,
          ngayVao: r.ngayVao,
          ngayRa: r.ngayRa,
          thayTheSuaChua: r.thayTheSuaChua,
          congKeHoach: r.cong_keHoach ? parseFloat(r.cong_keHoach) : null,
          congThucHien: r.cong_thucHien ? parseFloat(r.cong_thucHien) : null,
          tongKimLoai: r.tongKimLoai ? parseFloat(r.tongKimLoai) : null,
          hoTenKyThuat: r.hoTenKyThuat,
          xacNhanKetQua: r.xacNhanKetQua,
        }));
        await updateBatchMutation.mutateAsync(updatePayload);
      }

      showSuccessAlert("Lưu theo dõi sửa chữa thành công");
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
    const newRow: RepairRow = {
      id: `temp-${Date.now()}`,
      capSuaChua: "",
      ngayVao: dayjs().format("YYYY-MM-DD"),
      ngayRa: dayjs().format("YYYY-MM-DD"),
      thayTheSuaChua: "",
      cong_keHoach: "",
      cong_thucHien: "",
      tongKimLoai: "",
      hoTenKyThuat: "",
      xacNhanKetQua: "",
      isNew: true,
      isUpdated: false,
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    if (!id.startsWith("temp-")) {
      setDeletedIds((prev) => [...prev, id]);
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleChange = (id: string, field: keyof RepairRow, value: string) => {
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

  const inputSx = (center?: boolean) => ({
    fullWidth: true,
    size: "small" as const,
    variant: "standard" as const,
    InputProps: {
      disableUnderline: true,
      inputProps: center ? { style: { textAlign: "center" as const } } : {},
    },
  });

  return (
    <Box sx={bookStyles.container}>
      {/* Toolbar */}
      {!isView && (
        <Box
          sx={{
            display: "flex",
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
        THEO DÕI SỬA CHỮA MÁY TỪNG THÁNG
      </Typography>

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
            Thêm dòng
          </Button>
        </Box>
      )}

      <Box sx={bookStyles.content}>
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
              <TableRow>
                <TableCell rowSpan={2} sx={hcell({ width: "50px" })}>
                  TT
                </TableCell>
                <TableCell rowSpan={2} sx={hcell({ width: "100px" })}>
                  Cấp sửa chữa
                </TableCell>
                <TableCell
                  colSpan={2}
                  align="center"
                  sx={hcell({ width: "400px" })}
                >
                  Thời gian sửa chữa
                </TableCell>
                <TableCell rowSpan={2} sx={hcell({ width: "150px" })}>
                  Thay thế sửa chữa hoặc cải tiến bộ phận nào của máy
                </TableCell>
                <TableCell
                  colSpan={2}
                  align="center"
                  sx={hcell({ width: "150px" })}
                >
                  Số công sửa chữa (Công)
                </TableCell>
                <TableCell rowSpan={2} sx={hcell({ width: "150px" })}>
                  Tổng kim loại màu phục vụ cho sửa chữa (kg)
                </TableCell>
                <TableCell rowSpan={2} sx={hcell({ width: "150px" })}>
                  Họ tên và chữ ký của người chịu trách nhiệm sửa chữa và kiểm
                  tra kỹ thuật sau s/c
                </TableCell>
                <TableCell rowSpan={2} sx={hcell({ width: "150px" })}>
                  Xác nhận kết quả sau sửa chữa
                </TableCell>
                {isEditMode && (
                  <TableCell rowSpan={2} sx={hcell({ width: "50px" })}>
                    Thao tác
                  </TableCell>
                )}
              </TableRow>
              <TableRow>
                <TableCell align="center" sx={hcell()}>
                  Ngày vào
                </TableCell>
                <TableCell align="center" sx={hcell()}>
                  Ngày ra
                </TableCell>
                <TableCell align="center" sx={hcell()}>
                  Kế hoạch
                </TableCell>
                <TableCell align="center" sx={hcell()}>
                  Thực hiện
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={row.id}>
                  {/* TT - tự tính theo vị trí, không lưu DB */}
                  <TableCell align="center" sx={dcell()}>
                    <Typography
                      sx={{
                        fontFamily: '"Times New Roman", Times, serif',
                        fontSize: "13px",
                      }}
                    >
                      {idx + 1}
                    </Typography>
                  </TableCell>
                  {/* Cấp sửa chữa */}
                  <TableCell sx={dcell()}>
                    {isEditMode ? (
                      <TextField
                        {...inputSx()}
                        value={row.capSuaChua}
                        onChange={(e) =>
                          handleChange(row.id, "capSuaChua", e.target.value)
                        }
                        placeholder="Cấp..."
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: "13px",
                        }}
                      >
                        {row.capSuaChua}
                      </Typography>
                    )}
                  </TableCell>
                  {/* Ngày vào */}
                  <TableCell align="center" sx={dcell()}>
                    {isEditMode ? (
                      <TextField
                        type="date"
                        {...inputSx()}
                        value={row.ngayVao}
                        onChange={(e) =>
                          handleChange(row.id, "ngayVao", e.target.value)
                        }
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: "13px",
                        }}
                      >
                        {row.ngayVao
                          ? dayjs(row.ngayVao).format("DD/MM/YYYY")
                          : ""}
                      </Typography>
                    )}
                  </TableCell>
                  {/* Ngày ra */}
                  <TableCell align="center" sx={dcell()}>
                    {isEditMode ? (
                      <TextField
                        type="date"
                        {...inputSx()}
                        value={row.ngayRa}
                        onChange={(e) =>
                          handleChange(row.id, "ngayRa", e.target.value)
                        }
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: "13px",
                        }}
                      >
                        {row.ngayRa
                          ? dayjs(row.ngayRa).format("DD/MM/YYYY")
                          : ""}
                      </Typography>
                    )}
                  </TableCell>
                  {/* Thay thế sửa chữa */}
                  <TableCell sx={dcell()}>
                    {isEditMode ? (
                      <TextField
                        {...inputSx()}
                        value={row.thayTheSuaChua}
                        onChange={(e) =>
                          handleChange(row.id, "thayTheSuaChua", e.target.value)
                        }
                        placeholder="Mô tả..."
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: "13px",
                        }}
                      >
                        {row.thayTheSuaChua}
                      </Typography>
                    )}
                  </TableCell>
                  {/* Kế hoạch */}
                  <TableCell align="center" sx={dcell()}>
                    {isEditMode ? (
                      <TextField
                        {...inputSx(true)}
                        type="number"
                        value={row.cong_keHoach}
                        onChange={(e) =>
                          handleChange(row.id, "cong_keHoach", e.target.value)
                        }
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: "13px",
                          textAlign: "center",
                        }}
                      >
                        {row.cong_keHoach}
                      </Typography>
                    )}
                  </TableCell>
                  {/* Thực hiện */}
                  <TableCell align="center" sx={dcell()}>
                    {isEditMode ? (
                      <TextField
                        {...inputSx(true)}
                        type="number"
                        value={row.cong_thucHien}
                        onChange={(e) =>
                          handleChange(row.id, "cong_thucHien", e.target.value)
                        }
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: "13px",
                          textAlign: "center",
                        }}
                      >
                        {row.cong_thucHien}
                      </Typography>
                    )}
                  </TableCell>
                  {/* Tổng kim loại */}
                  <TableCell align="center" sx={dcell()}>
                    {isEditMode ? (
                      <TextField
                        {...inputSx(true)}
                        type="number"
                        value={row.tongKimLoai}
                        onChange={(e) =>
                          handleChange(row.id, "tongKimLoai", e.target.value)
                        }
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: "13px",
                          textAlign: "center",
                        }}
                      >
                        {row.tongKimLoai}
                      </Typography>
                    )}
                  </TableCell>
                  {/* Họ tên kỹ thuật */}
                  <TableCell sx={dcell()}>
                    {isEditMode ? (
                      <TextField
                        {...inputSx()}
                        value={row.hoTenKyThuat}
                        onChange={(e) =>
                          handleChange(row.id, "hoTenKyThuat", e.target.value)
                        }
                        placeholder="Họ và tên..."
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: "13px",
                        }}
                      >
                        {row.hoTenKyThuat}
                      </Typography>
                    )}
                  </TableCell>
                  {/* Xác nhận */}
                  <TableCell sx={dcell()}>
                    {isEditMode ? (
                      <TextField
                        {...inputSx()}
                        value={row.xacNhanKetQua}
                        onChange={(e) =>
                          handleChange(row.id, "xacNhanKetQua", e.target.value)
                        }
                        placeholder="Kết quả..."
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: "13px",
                        }}
                      >
                        {row.xacNhanKetQua}
                      </Typography>
                    )}
                  </TableCell>
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
                Array.from({ length: emptyCount }).map((_, i) => (
                  <TableRow key={`empty-${i}`}>
                    {Array.from({ length: 10 }).map((__, ci) => (
                      <TableCell key={ci} sx={{ ...dcell(), height: "38px" }} />
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={bookStyles.footer}>
        <Box sx={bookStyles.pageNumber}>Trang {currentPage}</Box>
      </Box>
    </Box>
  );
};

export default MaintenanceMonthlyPage;
