import React from "react";
import { Box, Typography, Chip, IconButton, Paper } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import { MaintenancePlanData } from "../../types";

interface Props {
  plan: MaintenancePlanData;
  onClose: () => void;
}

export const StepWorkflowHeader: React.FC<Props> = ({ plan, onClose }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: "#0f172a",
            fontSize: "1.25rem",
            letterSpacing: "-0.01em",
          }}
        >
          Chi tiết kế hoạch: {plan?.id || plan?.soPhieu || "KH-2026-0003"}
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#64748b",
            bgcolor: "#f1f5f9",
            "&:hover": { bgcolor: "#e2e8f0", color: "#0f172a" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* 3 Metric Cards + Status Badge */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
          {/* Metric 1: Năm kế hoạch */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "10px",
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
              }}
            >
              <CalendarTodayOutlinedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", fontSize: "0.8rem", display: "block" }}
              >
                Năm kế hoạch
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}
              >
                {plan?.nam || 2026}
              </Typography>
            </Box>
          </Box>

          {/* Metric 2: Ngày tạo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "10px",
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3b82f6",
              }}
            >
              <AccessTimeOutlinedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", fontSize: "0.8rem", display: "block" }}
              >
                Ngày tạo
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}
              >
                {plan?.ngayTao || "2026-07-02 07:26:38"}
              </Typography>
            </Box>
          </Box>

          {/* Metric 3: Đơn vị quản lý */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "10px",
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0284c7",
              }}
            >
              <ApartmentOutlinedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", fontSize: "0.8rem", display: "block" }}
              >
                Đơn vị quản lý
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}
              >
                {plan?.tenDonViGiao || plan?.tenDonViNhan || "Phân xưởng Cơ điện VHB"}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Status Chip */}
        <Box>
          <Chip
            label="Hoàn thành"
            sx={{
              bgcolor: "#e0f2fe",
              color: "#0284c7",
              fontWeight: 700,
              fontSize: "0.85rem",
              px: 1.5,
              py: 2.2,
              borderRadius: 2,
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};
