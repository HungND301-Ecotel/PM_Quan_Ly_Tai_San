import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useTaiSanConQuery } from "../Mutation";
import dayjs from "dayjs";
import { currentBrandConfig } from "../../../config/brandConfig";

interface DetailRowContentProps {
  parentRowId: string | null;
}

export default function DetailRowContent({
  parentRowId,
}: DetailRowContentProps) {
  // Gọi API để lấy tài sản con khi mở rộng
  const { data: taiSanConList = [], isLoading } = useTaiSanConQuery(
    parentRowId ? parentRowId : undefined,
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          py: 3,
          gap: 1,
        }}
      >
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          Đang tải tài sản con...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxHeight: 220,
        py: 1,
        width: "100%",
        borderRadius: "8px",
        bgcolor: "#fafbfc",
      }}
    >
      <TableContainer
        sx={{
          maxHeight: 220,
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                bgcolor: currentBrandConfig.primaryColor,
                "& th": {
                  color: "#fff",
                  fontWeight: 700,
                  borderBottom: "2px solid #007a4d",
                  py: 1,
                },
              }}
            >
              <TableCell>Mã TS</TableCell>
              <TableCell>Tên tài sản</TableCell>
              <TableCell>Đơn vị tính</TableCell>
              <TableCell align="center">SL</TableCell>
              <TableCell>Hiện trạng</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {taiSanConList.length > 0 ? (
              taiSanConList.map((child: any, idx: number) => {
                const hasTransferDate = !child.isActive;
                return (
                  <TableRow
                    key={child.id || idx}
                    sx={{
                      opacity: hasTransferDate ? 0.5 : 1,
                      backgroundColor: hasTransferDate
                        ? "rgba(255, 152, 0, 0.06)"
                        : idx % 2 === 0
                          ? "#ffffff"
                          : "#f8fafc",
                      borderLeft: hasTransferDate
                        ? "3px solid #ff2600ff"
                        : "3px solid transparent",
                      borderBottom: "1px solid #e2e8f0",
                      "&:hover": {
                        opacity: hasTransferDate ? 0.65 : 0.95,
                        backgroundColor: hasTransferDate
                          ? "rgba(255, 152, 0, 0.12)"
                          : "rgba(0, 158, 96, 0.04)",
                      },
                      "& td": {
                        py: 0.75,
                        borderBottom: "1px solid #e2e8f0",
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      {child.idTaiSanCon}
                    </TableCell>
                    <TableCell>{child.tenTaiSan || "-"}</TableCell>
                    <TableCell>
                      {child.tenDonViTinh || child.donViTinh || "-"}
                    </TableCell>
                    <TableCell align="center">{child.soLuong || "-"}</TableCell>
                    <TableCell>
                      {child.tenHienTrang || child.hienTrang || "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8}>Không có tài sản con</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
