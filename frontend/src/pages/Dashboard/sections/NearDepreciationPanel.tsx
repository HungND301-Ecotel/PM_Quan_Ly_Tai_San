import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import FilterListIcon from "@mui/icons-material/FilterList";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import Pagination from "@mui/material/Pagination";
import { useDashboardMutation } from "../Mutation";
import { useAssetInspectionPageQuery } from "../../AssetManager/Mutation";
import { useConfig } from "../../../hooks/useContext";

export default function NearDepreciationPanel() {
  const { config } = useConfig();
  const [rowsPerPage, setRowsPerPage] = useState<number | "all">(20);
  const [page, setPage] = useState(0);
  const { data: taiSanSapHet = { items: [], totalItems: 0 }, isLoading } =
    useAssetInspectionPageQuery(
      page,
      rowsPerPage === "all" ? 9999999 : rowsPerPage,
      config?.ngayBaoDangKiem,
    );

  const handleRowsPerPageChange = (e: any) => {
    const v = e.target.value;
    setRowsPerPage(v === "all" ? 9999999 : Number(v));
    setPage(0);
  };

  const handlePageChange = (_: any, value: number) => {
    setPage(value - 1);
  };

  /* ─── shared header cell sx ─── */
  const headerCellSx = {
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    color: "#64748b",
    bgcolor: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
    py: 1.75,
    px: 2,
  };

  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: "16px",
        bgcolor: "#ffffff",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        overflow: "hidden",
        /* 3px gradient accent line at top */
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, #f59e0b, #f97316, #f34f21)",
        },
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        {/* ─── HEADER ─── */}
        <Grid container alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <WarningAmberOutlinedIcon
                  sx={{ fontSize: 22, color: "#d97706" }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: 17,
                    color: "#1e293b",
                    lineHeight: 1.3,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Tài sản sắp hết hạn đăng kiểm
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#94a3b8", fontWeight: 500 }}
                >
                  Theo dõi tài sản cần đăng kiểm lại
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "flex-start", md: "flex-end" },
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#64748b", fontWeight: 500 }}
                >
                  Hiển thị:
                </Typography>
                <Select
                  size="small"
                  value={rowsPerPage === "all" ? "all" : rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  sx={{
                    bgcolor: "#f8fafc",
                    borderRadius: "10px",
                    fontSize: 13,
                    fontWeight: 600,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#e2e8f0",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#cbd5e1",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#f59e0b",
                      borderWidth: "1.5px",
                    },
                  }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                  <MenuItem value="all">Tất cả</MenuItem>
                </Select>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  background:
                    "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(249,115,22,0.08) 100%)",
                  border: "1px solid rgba(245, 158, 11, 0.18)",
                  borderRadius: "12px",
                  px: 2,
                  py: 0.75,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    border: "1px solid rgba(245, 158, 11, 0.32)",
                    boxShadow: "0 2px 8px rgba(245,158,11,0.1)",
                  },
                }}
              >
                <InsertChartOutlinedIcon
                  sx={{ color: "#f59e0b", mr: 0.75, fontSize: 18 }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "#d97706", fontWeight: 700, fontSize: 13 }}
                >
                  {(taiSanSapHet?.totalItems ?? 0).toLocaleString()} tài sản
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ─── TABLE ─── */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: "12px",
            overflow: "auto",
            bgcolor: "transparent",
            maxHeight: 420,
            border: "1px solid #e2e8f0",
            scrollBehavior: "smooth",
            "&::-webkit-scrollbar": { width: 6, height: 6 },
            "&::-webkit-scrollbar-track": {
              bgcolor: "#f8fafc",
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "#cbd5e1",
              borderRadius: 3,
              "&:hover": { bgcolor: "#94a3b8" },
            },
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ height: 48 }}>
                <TableCell sx={{ ...headerCellSx, width: 140 }}>
                  Số thẻ (ID)
                </TableCell>
                <TableCell align="left" sx={{ ...headerCellSx, minWidth: 200 }}>
                  Tên tài sản
                </TableCell>
                <TableCell align="left" sx={{ ...headerCellSx, minWidth: 200 }}>
                  Ngày hết hạn đăng kiểm
                </TableCell>
                <TableCell align="left" sx={{ ...headerCellSx, minWidth: 150 }}>
                  Thời hạn còn lại
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* ─── EMPTY STATE ─── */}
              {(!taiSanSapHet?.items || taiSanSapHet.items.length === 0) &&
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ border: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          py: 7,
                          px: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 2,
                          }}
                        >
                          <InboxOutlinedIcon
                            sx={{ fontSize: 32, color: "#d97706" }}
                          />
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 700, color: "#475569", mb: 0.5 }}
                        >
                          Không có tài sản nào
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "#94a3b8", textAlign: "center" }}
                        >
                          Hiện tại không có tài sản nào sắp hết hạn đăng kiểm
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

              {taiSanSapHet?.items?.map((row: any, idx: number) => {
                const days =
                  row.thoiHanConLai != null ? Number(row.thoiHanConLai) : null;
                const isDanger = days !== null && days <= 7;
                const isWarning = days !== null && days > 7 && days <= 30;

                let chipBg = "rgba(13, 158, 109, 0.08)";
                let chipColor = "#0d9e6d";
                let chipBorder = "rgba(13, 158, 109, 0.16)";

                if (isDanger) {
                  chipBg = "rgba(239, 68, 68, 0.08)";
                  chipColor = "#ef4444";
                  chipBorder = "rgba(239, 68, 68, 0.16)";
                } else if (isWarning) {
                  chipBg = "rgba(245, 158, 11, 0.08)";
                  chipColor = "#f59e0b";
                  chipBorder = "rgba(245, 158, 11, 0.16)";
                }

                return (
                  <TableRow
                    key={String(row.id || row.soThe || idx)}
                    hover
                    sx={{
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafbfd",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "rgba(245, 158, 11, 0.04) !important",
                        boxShadow: "inset 3px 0 0 #f59e0b",
                      },
                      "& td": {
                        borderBottom: "1px solid #f1f5f9",
                        py: 1.5,
                        px: 2,
                      },
                    }}
                  >
                    <TableCell align="left">
                      <Chip
                        label={row.soThe}
                        size="small"
                        sx={{
                          bgcolor: "rgba(13, 158, 109, 0.06)",
                          color: "#0d9e6d",
                          fontWeight: 700,
                          fontSize: 12,
                          border: "1px solid rgba(13, 158, 109, 0.14)",
                          borderRadius: "8px",
                          height: 26,
                          "& .MuiChip-label": { px: 1.25 },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          fontWeight: 600,
                          color: "#334155",
                          fontSize: 13,
                          maxWidth: 280,
                        }}
                      >
                        {row.tenTaiSan || ""}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ width: 280 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <EventNoteOutlinedIcon
                          sx={{ fontSize: 16, color: "#94a3b8" }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: "#475569", fontSize: 13 }}
                        >
                          {row.ngayDangKiemTiepTheo || ""}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width: 280 }}>
                      {days !== null ? (
                        <Chip
                          label={`${days} ngày`}
                          size="small"
                          sx={{
                            bgcolor: chipBg,
                            color: chipColor,
                            fontWeight: 700,
                            fontSize: 12,
                            border: `1px solid ${chipBorder}`,
                            borderRadius: "8px",
                            height: 26,
                            "& .MuiChip-label": { px: 1.25 },
                            transition: "all 0.2s ease",
                            ...(isDanger && {
                              animation: "pulse-danger 2s ease-in-out infinite",
                              "@keyframes pulse-danger": {
                                "0%, 100%": {
                                  boxShadow: "0 0 0 0 rgba(239,68,68,0)",
                                },
                                "50%": {
                                  boxShadow: "0 0 0 4px rgba(239,68,68,0.1)",
                                },
                              },
                            }),
                          }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ─── PAGINATION ─── */}
        <Box
          sx={{
            mt: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#94a3b8", fontWeight: 500, fontSize: 12 }}
            >
              {(() => {
                const total = taiSanSapHet?.totalItems || 0;
                if (total === 0) return `Hiển thị 0 kết quả`;
                if (rowsPerPage === "all")
                  return `Hiển thị 1–${total} trong ${total} kết quả`;
                const start = page * (rowsPerPage as number) + 1;
                const end = Math.min(
                  (page + 1) * (rowsPerPage as number),
                  total,
                );
                return `Hiển thị ${start}–${end} trong ${total} kết quả`;
              })()}
            </Typography>
          </Box>
          <Box>
            {rowsPerPage !== "all" &&
              (taiSanSapHet?.totalItems || 0) > (rowsPerPage as number) && (
                <Pagination
                  count={Math.ceil(
                    (taiSanSapHet?.totalItems || 0) / (rowsPerPage as number),
                  )}
                  page={page + 1}
                  onChange={handlePageChange}
                  color="primary"
                  size="small"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: 12,
                      minWidth: 32,
                      height: 32,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "rgba(245, 158, 11, 0.08)",
                      },
                      "&.Mui-selected": {
                        background:
                          "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
                        color: "#fff",
                        fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(245,158,11,0.25)",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #d97706 0%, #ea580c 100%)",
                        },
                      },
                    },
                  }}
                />
              )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
