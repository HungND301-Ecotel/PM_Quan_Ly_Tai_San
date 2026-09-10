import React from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Paper,
  Stack,
  Alert,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { WorkflowStepData, AttachmentItem } from "./types";

interface Props {
  step: WorkflowStepData;
  onViewDetail?: () => void;
  onDownload?: () => void;
  onDownloadAttachment?: (file: AttachmentItem) => void;
  onEdit?: () => void;
  onCreateNext?: () => void;
  onCreateAlternativeNext?: () => void;
}

export const StepDetailCard: React.FC<Props> = ({
  step,
  onViewDetail,
  onDownload,
  onDownloadAttachment,
  onEdit,
  onCreateNext,
  onCreateAlternativeNext,
}) => {
  const isApproved =
    step.status === "approved" || step.status === "completed";
  const isCreated = step.status !== "not_created";
  const isCancelled = step.status === "cancelled";
  const isDraft = step.status === "draft";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header of Step Detail */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: isCreated ? "#f8fafc" : "#f1f5f9",
              color: isApproved
                ? "#10b981"
                : isCancelled
                ? "#ef4444"
                : isCreated
                ? "#0284c7"
                : "#64748b",
            }}
          >
            <DescriptionOutlinedIcon sx={{ fontSize: 28 }} />
          </Box>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                  fontSize: "1.1rem",
                }}
              >
                {step.title} - {step.subTitle}
              </Typography>
              <Chip
                label={step.statusText}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
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
            </Box>

            <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem" }}>
              {step.description}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons: CHỈ xuất hiện khi biên bản ĐÃ ĐƯỢC TẠO */}
        {isCreated && (
          <Stack direction="row" spacing={1.5}>
            {/* Nút lập biên bản tiếp theo khi đã duyệt/hoàn thành */}
            {isApproved && step.canCreateNext && onCreateNext && (
              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                onClick={onCreateNext}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#10b981",
                  color: "#ffffff",
                  borderRadius: 2,
                  px: 2,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#059669",
                    boxShadow: "none",
                  },
                }}
              >
                + Lập {step.nextStepName || "Biên bản tiếp theo"}
              </Button>
            )}

            {/* Nút lập biên bản thay thế (VD: từ Giám định có thể lập trực tiếp Nghiệm thu nếu không cần Biện pháp) */}
            {isApproved &&
              step.canCreateAlternativeNext &&
              onCreateAlternativeNext && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                  onClick={onCreateAlternativeNext}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#f59e0b",
                    color: "#ffffff",
                    borderRadius: 2,
                    px: 2,
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#d97706",
                      boxShadow: "none",
                    },
                  }}
                >
                  + Lập {step.alternativeNextStepName || "BB Nghiệm thu"}
                </Button>
              )}

            {/* Nút chỉnh sửa nếu là bản nháp */}
            {isDraft && onEdit && (
              <Button
                variant="contained"
                startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                onClick={onEdit}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#0284c7",
                  color: "#ffffff",
                  borderRadius: 2,
                  px: 2,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#0369a1",
                    boxShadow: "none",
                  },
                }}
              >
                Chỉnh sửa
              </Button>
            )}

            {/* Nút xem chi tiết PDF */}
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon sx={{ fontSize: 18 }} />}
              onClick={onViewDetail}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                color: "#0f172a",
                borderColor: "#cbd5e1",
                borderRadius: 2,
                px: 2,
                "&:hover": {
                  borderColor: "#94a3b8",
                  bgcolor: "#f8fafc",
                },
              }}
            >
              Xem chi tiết
            </Button>

            {/* Nút tải biên bản */}
            <Button
              variant="outlined"
              startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
              onClick={onDownload}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                color: "#0f172a",
                borderColor: "#cbd5e1",
                borderRadius: 2,
                px: 2,
                "&:hover": {
                  borderColor: "#94a3b8",
                  bgcolor: "#f8fafc",
                },
              }}
            >
              Tải biên bản
            </Button>
          </Stack>
        )}
      </Box>

      {/* Content Section: 2 Columns */}
      <Box
        sx={{
          p: 2.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" },
          gap: 3,
        }}
      >
        {/* Left Column: Thông tin biên bản */}
        <Box
          sx={{
            borderRadius: 2,
            border: "1px solid #f1f5f9",
            overflow: "hidden",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              p: 1.5,
              fontWeight: 800,
              color: "#0f172a",
              fontSize: "0.95rem",
              bgcolor: "#ffffff",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            Thông tin biên bản
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <InfoRow
              label="Mã biên bản"
              value={isCreated ? step.code || "—" : "Chưa lập"}
            />
            <InfoRow label="Loại biên bản" value={step.subTitle} />
            <InfoRow
              label="Ngày lập"
              value={isCreated ? step.date || "—" : "Chưa lập"}
            />
            <InfoRow
              label="Người lập"
              value={isCreated ? step.creator || "—" : "Chưa lập"}
            />
            <InfoRow
              label="Trạng thái"
              isStatus
              statusText={step.statusText}
              statusType={step.status}
            />
            <InfoRow
              label="Nội dung"
              value={
                isCreated
                  ? step.content || "Chưa có nội dung mô tả"
                  : "Biên bản chưa được tạo trong hệ thống."
              }
              isLast
            />
          </Box>
        </Box>

        {/* Right Column: Tài liệu đính kèm */}
        <Box
          sx={{
            borderRadius: 2,
            border: "1px solid #f1f5f9",
            overflow: "hidden",
            bgcolor: "#ffffff",
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AttachFileIcon sx={{ fontSize: 18, color: "#0f172a" }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}
              >
                Tài liệu đính kèm
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: "#64748b", fontWeight: 600 }}
            >
              {step.attachments.length} file
            </Typography>
          </Box>

          <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {step.attachments.map((file) => (
              <Box
                key={file.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: "#f1f5f9",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      bgcolor:
                        file.type === "pdf"
                          ? "#fee2e2"
                          : file.type === "xls"
                          ? "#dcfce7"
                          : "#e0f2fe",
                      color:
                        file.type === "pdf"
                          ? "#b91c1c"
                          : file.type === "xls"
                          ? "#15803d"
                          : "#0284c7",
                    }}
                  >
                    {file.type.toUpperCase()}
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: "0.85rem",
                      }}
                    >
                      {file.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", fontSize: "0.75rem" }}
                    >
                      {file.size}
                    </Typography>
                  </Box>
                </Box>

                <IconButton
                  size="small"
                  sx={{ color: "#0284c7", "&:hover": { bgcolor: "#e0f2fe" } }}
                  onClick={() => {
                    if (onDownloadAttachment) {
                      onDownloadAttachment(file);
                    } else if (onDownload) {
                      onDownload();
                    }
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            {step.attachments.length === 0 && (
              <Typography
                variant="body2"
                sx={{ color: "#94a3b8", textAlign: "center", py: 3 }}
              >
                {isCreated
                  ? "Không có tài liệu đính kèm"
                  : "Chưa có tài liệu đính kèm"}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Info Callout Banner */}
      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "#f0f9ff",
            border: "1px solid #bae6fd",
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: "4px",
              bgcolor: "#0284c7",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.75rem",
              flexShrink: 0,
              mt: 0.2,
            }}
          >
            i
          </Box>
          <Typography
            variant="body2"
            sx={{ color: "#0369a1", fontSize: "0.88rem", lineHeight: 1.5 }}
          >
            {step.nextStepInfo}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

interface InfoRowProps {
  label: string;
  value?: string;
  isStatus?: boolean;
  statusText?: string;
  statusType?: string;
  isLast?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  isStatus,
  statusText,
  statusType,
  isLast,
}) => {
  const isApproved = statusType === "approved";
  const isDraft = statusType === "draft";
  const isCreated = statusType !== "not_created";

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        p: 1.5,
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
        alignItems: "center",
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: "#64748b", fontWeight: 500, fontSize: "0.85rem" }}
      >
        {label}
      </Typography>

      {isStatus ? (
        <Box>
          <Chip
            label={statusText}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              bgcolor: isApproved
                ? "#dcfce7"
                : isDraft
                ? "#fef3c7"
                : isCreated
                ? "#e0f2fe"
                : "#f1f5f9",
              color: isApproved
                ? "#15803d"
                : isDraft
                ? "#b45309"
                : isCreated
                ? "#0284c7"
                : "#64748b",
            }}
          />
        </Box>
      ) : (
        <Typography
          variant="body2"
          sx={{ color: "#0f172a", fontWeight: 600, fontSize: "0.85rem" }}
        >
          {value}
        </Typography>
      )}
    </Box>
  );
};
