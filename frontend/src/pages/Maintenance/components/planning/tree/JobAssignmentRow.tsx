import React, { useState } from "react";
import { TableRow, TableCell, Typography, Box, Chip } from "@mui/material";
import { TreeConnector, ROW_H, CONNECTOR_WIDTH } from "./TreeConnector";
import { ActionCell } from "./ActionCell";
import { showStatus } from "../../../config";
import JobAssignmentDialog from "../../dialog/JobAssignmentDialog";
import MaterialRequisitionDialog from "../../dialog/MaterialRequisitionDialog";
import {
  useJobAssignmentMutation,
  useMaterialRequisitionByJobAssignmentQuery,
} from "../../../mutation";
import { MaterialRequisitionRow } from "./MaterialRequisitionRow";
import { IconButton } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

interface Props {
  jobAssignment: any;
  depth: number;
  isLast: boolean;
  repairRequest?: any;
}

export const JobAssignmentRow = ({
  jobAssignment,
  depth,
  isLast,
  repairRequest,
}: Props) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createMaterialRequisitionOpen, setCreateMaterialRequisitionOpen] =
    useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { deleteMutation } = useJobAssignmentMutation();
  const { data: materialRequisitions = [] } =
    useMaterialRequisitionByJobAssignmentQuery(
      isExpanded ? jobAssignment.id : undefined,
    );

  const isDraft = jobAssignment.trangThai === 0;
  const isCompleted =
    jobAssignment.trangThai === 3 && jobAssignment.daCoPhieuLinhVatTu !== 1;

  const handleDelete = () => {
    deleteMutation.mutateAsync(jobAssignment.id);
  };

  const hasChildren =
    jobAssignment.daCoPhieuLinhVatTu === 1 || materialRequisitions.length > 0;

  return (
    <>
      <TableRow hover>
        <TableCell
          sx={{
            pl: 2,
            position: "relative",
            height: ROW_H,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              display: "flex",
              alignItems: "center",
            }}
          >
            <TreeConnector depth={depth} isLast={isLast && !hasChildren} />
          </Box>
          {hasChildren && (
            <IconButton
              size="small"
              sx={{
                ml: `${CONNECTOR_WIDTH * depth - 6}px`,
              }}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
          <Typography
            variant="body2"
            sx={{
              ml: hasChildren
                ? `${CONNECTOR_WIDTH * depth + 8}px`
                : `${CONNECTOR_WIDTH * depth + 36}px`,
            }}
          >
            {jobAssignment.id || "Chưa có số"}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label="Phiếu giao việc"
            size="small"
            color="secondary"
            sx={{ color: "#fff" }}
          />
        </TableCell>
        <TableCell>{jobAssignment.ngayTao}</TableCell>
        <TableCell>{showStatus(jobAssignment.trangThai ?? 0)}</TableCell>
        <TableCell align="right">
          <ActionCell
            isEdit={isDraft}
            onEdit={() => setEditDialogOpen(true)}
            editTooltip="Sửa Phiếu giao việc"
            editColor="primary"
            isDelete={isDraft}
            onDelete={handleDelete}
            onAdd={() => setCreateMaterialRequisitionOpen(true)}
            isAdd={isCompleted} // Only allow creating material slip when job is draft (or as required)
            addTooltip="Tạo phiếu lĩnh vật tư"
            addColor="warning"
          />
        </TableCell>
      </TableRow>

      {isExpanded &&
        materialRequisitions.map((req: any, index: number) => (
          <MaterialRequisitionRow
            key={req.id}
            data={req}
            jobAssignment={jobAssignment}
            depth={depth + 1}
            isLast={index === materialRequisitions.length - 1}
          />
        ))}

      {editDialogOpen && (
        <JobAssignmentDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          repairRequest={repairRequest}
          initialData={jobAssignment}
        />
      )}

      {createMaterialRequisitionOpen && (
        <MaterialRequisitionDialog
          open={createMaterialRequisitionOpen}
          onClose={() => setCreateMaterialRequisitionOpen(false)}
          jobAssignment={jobAssignment}
        />
      )}
    </>
  );
};
