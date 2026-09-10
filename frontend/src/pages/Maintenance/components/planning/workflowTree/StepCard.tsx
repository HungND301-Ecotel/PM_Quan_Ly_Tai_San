import React from "react";
import { Box, Typography, Chip, Paper } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { WorkflowStepData } from "./types";

interface Props {
  step: WorkflowStepData;
  isSelected: boolean;
  onClick: () => void;
}

export const StepCard: React.FC<Props> = ({ step, isSelected, onClick }) => {
  const isApproved =
    step.status === "approved" || step.status === "completed";
  const isCreated = step.status !== "not_created";
  const isCancelled = step.status === "cancelled";
  const isDraft = step.status === "draft";

  return (
    <Paper
      onClick={onClick}
      elevation={isSelected ? 3 : 0}
      sx={{
        flex: "1 1 0",
        minWidth: 155,
        p: 2,
        borderRadius: 3,
        cursor: "pointer",
        bgcolor: "#ffffff",
        position: "relative",
        transition: "all 0.2s ease-in-out",
        border: isSelected ? "2px solid #0284c7" : "1px dashed #cbd5e1",
        boxShadow: isSelected
          ? "0 4px 12px rgba(2, 132, 199, 0.15)"
          : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        opacity: step.isLocked ? 0.75 : 1,
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: isSelected ? "#0284c7" : "#94a3b8",
        },
      }}
    >
      {/* Top Badge: Circle checkmark or step number */}
      <Box
        sx={{
          position: "absolute",
          top: -12,
          left: "50%",
          transform: "translateX(-50%)",
          width: 26,
          height: 26,
          borderRadius: "50%",
          bgcolor: isApproved
            ? "#10b981"
            : isCancelled
            ? "#ef4444"
            : isSelected
            ? "#0284c7"
            : isCreated
            ? "#f59e0b"
            : "#94a3b8",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "0.8rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
        }}
      >
        {isApproved ? "✓" : isCancelled ? "✕" : step.stepNumber}
      </Box>

      {/* Lock Icon */}
      {step.isLocked && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            color: "#eab308",
          }}
        >
          <LockIcon sx={{ fontSize: 16 }} />
        </Box>
      )}

      {/* Document Icon */}
      <Box
        sx={{
          mt: 1,
          mb: 1,
          color: isSelected
            ? "#0284c7"
            : isApproved
            ? "#10b981"
            : isCancelled
            ? "#ef4444"
            : isCreated
            ? "#0f172a"
            : "#64748b",
        }}
      >
        <DescriptionOutlinedIcon sx={{ fontSize: 36 }} />
      </Box>

      {/* Title */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 800,
          color: isSelected || isApproved || isCreated ? "#0f172a" : "#64748b",
          fontSize: "0.95rem",
          mb: 0.5,
        }}
      >
        {step.title}
      </Typography>

      {/* Subtitle / Tên biên bản thực tế */}
      <Typography
        variant="caption"
        sx={{
          color: isSelected ? "#0284c7" : "#64748b",
          fontWeight: 600,
          fontSize: "0.82rem",
          mb: 1.5,
          minHeight: 32,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {step.subTitle}
      </Typography>

      {/* Status Chip */}
      <Chip
        label={step.statusText}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: "0.75rem",
          height: 24,
          px: 0.5,
          bgcolor: isApproved
            ? "#dcfce7"
            : isCancelled
            ? "#fee2e2"
            : isDraft
            ? "#fef3c7"
            : "#f1f5f9",
          color: isApproved
            ? "#15803d"
            : isCancelled
            ? "#b91c1c"
            : isDraft
            ? "#b45309"
            : "#64748b",
        }}
      />

      {/* Timestamp */}
      {step.date && (
        <Typography
          variant="caption"
          sx={{
            color: "#94a3b8",
            fontSize: "0.7rem",
            mt: 1,
            lineHeight: 1.2,
          }}
        >
          {step.date.split(" ")[0]}
          <br />
          {step.date.split(" ")[1] || ""}
        </Typography>
      )}
    </Paper>
  );
};
