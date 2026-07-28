import React, { useState } from "react";
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Chip,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  Edit,
  Delete,
  ContentCopy,
} from "@mui/icons-material";
import { findById } from "../../../utils/helpers";
import { useTaiSanConQuery } from "../Mutation";
import dayjs from "dayjs";

interface AssetManagerTableProps {
  rows: any[];
  allDepartments: any[];
  onRowClick?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (id: string) => void;
  onCopy?: (row: any) => void;
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

// Component hàng con - gọi API khi expand
function ExpandableRow({
  row,
  allDepartments,
  onRowClick,
  onEdit,
  onDelete,
  onCopy,
}: {
  row: any;
  allDepartments: any[];
  onRowClick?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (id: string) => void;
  onCopy?: (row: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Gọi API để lấy tài sản con khi mở rộng
  const { data: taiSanConList = [], isLoading } = useTaiSanConQuery(
    expanded ? row.id : undefined,
  );

  // Kiểm tra có tài sản con nào đã điều chuyển không
  const hasAnyChildWithTransferDate = taiSanConList.some(
    (child: any) => !!child.ngayDieuChuyen,
  );

  const highlightBg = hasAnyChildWithTransferDate
    ? "rgba(255, 152, 0, 0.06)"
    : "transparent";
  const highlightBorder = hasAnyChildWithTransferDate
    ? "4px solid #ff9800"
    : "4px solid transparent";

  return (
    <>
      {/* Hàng cha */}
      <TableRow
        hover
        sx={{
          backgroundColor: highlightBg,
          borderLeft: highlightBorder,
          cursor: "pointer",
          "&:hover": {
            backgroundColor: hasAnyChildWithTransferDate
              ? "rgba(255, 152, 0, 0.12)"
              : undefined,
          },
        }}
        onClick={() => onRowClick?.(row)}
      >
        <TableCell
          padding="checkbox"
          sx={{ width: 40 }}
          onClick={(e) => e.stopPropagation()}
        >
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>

        <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>{row.id}</TableCell>
        <TableCell sx={{ minWidth: 120 }}>{row.soThe}</TableCell>
        <TableCell sx={{ minWidth: 200 }}>{row.tenTaiSan}</TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          {findById(allDepartments, row.idDonViHienThoi)?.tenPhongBan || "-"}
        </TableCell>
        <TableCell sx={{ minWidth: 80 }} align="center">
          {taiSanConList.length > 0 ? (
            <Chip
              label={taiSanConList.length}
              size="small"
              color={hasAnyChildWithTransferDate ? "warning" : "primary"}
              variant={hasAnyChildWithTransferDate ? "filled" : "outlined"}
            />
          ) : (
            "0"
          )}
        </TableCell>
        <TableCell sx={{ minWidth: 80 }} align="center">
          {row.soLuong}
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          {row.ngaySuDung ? dayjs(row.ngaySuDung).format("DD/MM/YYYY") : "-"}
        </TableCell>

        <TableCell
          sx={{ width: 120 }}
          align="center"
          onClick={(e) => e.stopPropagation()}
        >
          <IconButton
            size="small"
            color="success"
            onClick={() => onEdit?.(row)}
            title="Chỉnh sửa"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => onCopy?.(row)}
            title="Sao chép"
          >
            <ContentCopy fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete?.(row.id)}
            title="Xóa"
          >
            <Delete fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Hàng mở rộng - hiển thị tài sản con */}
      <TableRow>
        <TableCell colSpan={8} sx={{ p: 0, borderBottom: "none" }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box
              sx={{
                mx: 4,
                my: 1,
                p: 2,
                bgcolor: "#fafafa",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ mb: 1, color: "#333" }}
              >
                Tài sản con ({taiSanConList.length})
              </Typography>

              {isLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Đang tải...
                  </Typography>
                </Box>
              ) : taiSanConList.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Không có tài sản con
                </Typography>
              ) : (
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f0f0f0" }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>
                          Mã TS
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>
                          Tên tài sản
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>
                          Mã phụ
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>
                          Đơn vị tính
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, fontSize: 11 }}
                          align="center"
                        >
                          SL
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>
                          Hiện trạng
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>
                          Ngày nhận
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>
                          Ngày điều chuyển
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {taiSanConList.map((child: any, idx: number) => {
                        const hasTransferDate = !!child.ngayDieuChuyen;
                        return (
                          <TableRow
                            key={child.id || idx}
                            sx={{
                              // Hàng đã điều chuyển: làm mờ
                              opacity: hasTransferDate ? 0.55 : 1,
                              backgroundColor: hasTransferDate
                                ? "rgba(255, 152, 0, 0.06)"
                                : "transparent",
                              borderLeft: hasTransferDate
                                ? "3px solid #ff9800"
                                : "3px solid transparent",
                              "&:hover": {
                                opacity: hasTransferDate ? 0.7 : 0.95,
                                backgroundColor: hasTransferDate
                                  ? "rgba(255, 152, 0, 0.12)"
                                  : "rgba(0, 0, 0, 0.02)",
                              },
                            }}
                          >
                            <TableCell sx={{ fontSize: 11, fontWeight: 500 }}>
                              {child.idTaiSanCon || child.id}
                            </TableCell>
                            <TableCell sx={{ fontSize: 11 }}>
                              {child.tenTaiSan || "-"}
                            </TableCell>
                            <TableCell sx={{ fontSize: 11 }}>
                              <Chip
                                label={child.maPhu || "-"}
                                size="small"
                                variant="outlined"
                                color={hasTransferDate ? "warning" : "default"}
                                sx={{ fontSize: 10, height: 20 }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: 11 }}>
                              {child.tenDonViTinh || child.donViTinh || "-"}
                            </TableCell>
                            <TableCell sx={{ fontSize: 11 }} align="center">
                              {child.soLuong || "-"}
                            </TableCell>
                            <TableCell sx={{ fontSize: 11 }}>
                              {child.tenHienTrang || child.hienTrang || "-"}
                            </TableCell>
                            <TableCell sx={{ fontSize: 11 }}>
                              {child.ngayNhan
                                ? dayjs(child.ngayNhan).format(
                                    "DD/MM/YYYY HH:mm",
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell sx={{ fontSize: 11 }}>
                              {child.ngayDieuChuyen ? (
                                <Chip
                                  label={dayjs(child.ngayDieuChuyen).format(
                                    "DD/MM/YYYY HH:mm",
                                  )}
                                  size="small"
                                  color="warning"
                                  variant="filled"
                                  sx={{ fontSize: 10, height: 20 }}
                                />
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// Component table chính
export default function AssetManagerTable({
  rows,
  allDepartments,
  onRowClick,
  onEdit,
  onDelete,
  onCopy,
  loading,
  total = 0,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}: AssetManagerTableProps) {
  return (
    <Paper variant="outlined" sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: "calc(100vh - 350px)" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f1f5f9" }}>
              <TableCell
                sx={{
                  width: 40,
                  fontWeight: 700,
                  fontSize: 12,
                  bgcolor: "#f1f5f9",
                }}
              />
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: 12,
                  minWidth: 120,
                  bgcolor: "#f1f5f9",
                }}
              >
                Mã tài sản
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: 12,
                  minWidth: 120,
                  bgcolor: "#f1f5f9",
                }}
              >
                Số thẻ
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: 12,
                  minWidth: 200,
                  bgcolor: "#f1f5f9",
                }}
              >
                Tên tài sản
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: 12,
                  minWidth: 150,
                  bgcolor: "#f1f5f9",
                }}
              >
                Đơn vị hiện thời
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: 12,
                  minWidth: 80,
                  bgcolor: "#f1f5f9",
                }}
                align="center"
              >
                TS con
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: 12,
                  minWidth: 80,
                  bgcolor: "#f1f5f9",
                }}
                align="center"
              >
                Số lượng
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: 12,
                  minWidth: 120,
                  bgcolor: "#f1f5f9",
                }}
              >
                Ngày sử dụng
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: 12,
                  width: 120,
                  bgcolor: "#f1f5f9",
                }}
                align="center"
              >
                Hành động
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    Đang tải dữ liệu...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Không có dữ liệu
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <ExpandableRow
                  key={row.id}
                  row={row}
                  allDepartments={allDepartments}
                  onRowClick={onRowClick}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onCopy={onCopy}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {total > 0 && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => onPageChange?.(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) =>
            onPageSizeChange?.(parseInt(e.target.value, 10))
          }
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Dòng/trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count}`
          }
        />
      )}
    </Paper>
  );
}
