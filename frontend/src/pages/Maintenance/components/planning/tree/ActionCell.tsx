import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { EditIcon, TrashIcon } from "lucide-react";
import { showConfirmAlert } from "../../../../../components/Alert";

export interface ActionCellProps {
  onView?: () => void;
  onAdd?: () => void;
  isAdd?: boolean;
  addTooltip?: string;
  addColor?: "primary" | "success" | "warning" | "secondary" | "error" | "info";
  onEdit?: () => void;
  isEdit?: boolean;
  editTooltip?: string;
  editColor?: "primary" | "success" | "warning" | "secondary" | "error" | "info";
  onDelete?: () => void;
  isDelete?: boolean;
  onAdd2?: () => void;
  isAdd2?: boolean;
  addTooltip2?: string;
  addColor2?: "primary" | "success" | "warning" | "secondary" | "error" | "info";
  deleteColor?: "primary" | "success" | "warning" | "secondary" | "error" | "info";
}

export const ActionCell = ({
  onView,
  onAdd,
  isAdd = true,
  addTooltip = "Tạo biên bản",
  addColor = "primary",
  onEdit,
  isEdit,
  editTooltip = "Chỉnh sửa",
  editColor = "primary",
  onDelete,
  isDelete,
  onAdd2,
  isAdd2,
  addTooltip2,
  addColor2 = "warning",
  deleteColor = "error",
}: ActionCellProps) => (
  <Box
    sx={{
      display: "flex",
      gap: 0.5,
      justifyContent: "flex-end",
      alignItems: "center",
    }}
  >
    {onView && (
      <Tooltip title="Xem chi tiết" placement="top">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    )}
    {onEdit && (
      <Tooltip title={editTooltip} placement="top">
        <IconButton
          size="small"
          color={editColor}
          disabled={!isEdit}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <EditIcon size={16} />
        </IconButton>
      </Tooltip>
    )}
    {onAdd && (
      <Tooltip title={addTooltip} placement="top">
        <IconButton
          size="small"
          color={addColor}
          disabled={!isAdd}
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
        >
          <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    )}
    {onAdd2 && (
      <Tooltip title={addTooltip2 || ""} placement="top">
        <IconButton
          size="small"
          disabled={!isAdd2}
          color={addColor2}
          onClick={(e) => {
            e.stopPropagation();
            onAdd2();
          }}
        >
          <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    )}
    {onDelete && (
      <Tooltip title="Xóa" placement="top">
        <IconButton
          size="small"
          color={deleteColor}
          disabled={!isDelete}
          onClick={(e) => {
            e.stopPropagation();
            showConfirmAlert("Bạn có chắc chắn muốn xóa không?").then(
              (isConfirm) => {
                if (isConfirm.isConfirmed) {
                  onDelete();
                }
              },
            );
          }}
        >
          <TrashIcon size={16} />
        </IconButton>
      </Tooltip>
    )}
  </Box>
);
