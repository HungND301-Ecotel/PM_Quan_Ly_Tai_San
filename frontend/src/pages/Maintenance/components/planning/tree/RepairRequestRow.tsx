import React, { useState } from "react";
import { TableRow, TableCell, Typography, Box, Chip, IconButton } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { TreeConnector, ROW_H, CONNECTOR_WIDTH } from "./TreeConnector";
import { ActionCell } from "./ActionCell";
import { showStatus } from "../../../config";
import type {
  MaintenancePlanData,
  MaintenanceRepairData,
} from "../../../types";
import { useMaintenanceRepairMutation } from "../../../mutation";
import RepairRequestDialog from "../../dialog/RepairRequestDialog";
import { useJobAssignmentByRepairQuery } from "../../../mutation/JobAssignment";
import JobAssignmentDialog from "../../dialog/JobAssignmentDialog";
import { JobAssignmentRow } from "./JobAssignmentRow";
import { useAppSelector } from "../../../../../redux/store";
import { useLocation } from "react-router-dom";
import DraftIndicator from "../../../../../components/common/DraftIndicator";

interface Props {
  repairRequest: MaintenanceRepairData;
  plan?: MaintenancePlanData|null;
  inspection?: any;
  isLast: boolean;
  depth?: number;
  useConnector?: boolean;
  defaultExpanded?: boolean;
}

export const RepairRequestRow = ({
  repairRequest,
  plan,
  inspection,
  isLast,
  depth = 3,
  useConnector = true,
  defaultExpanded = true,
}: Props) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [jobAssignmentDialogOpen, setJobAssignmentDialogOpen] = useState(false);

  const { deleteMutation } = useMaintenanceRepairMutation();

  const isDraft = repairRequest.trangThai === 0;
  const isCompleted =
    repairRequest.trangThai === 3 && repairRequest.daCoPhieuGiaoViec !== 1;

  const { data: jobAssignments = [] } = useJobAssignmentByRepairQuery(
    expanded ? repairRequest.id : "",
  );
  const existingJobAssignment =
    jobAssignments.length > 0 ? jobAssignments[0] : null;

  const hasChildren =
    (repairRequest.daCoPhieuGiaoViec && repairRequest.daCoPhieuGiaoViec > 0) || jobAssignments.length > 0;

  const handleDelete = () => {
    deleteMutation.mutateAsync(repairRequest);
  };

  return (
    <>
      <TableRow hover>
        <TableCell
          sx={{
            pl: useConnector ? 2 : depth * 4,
            position: "relative",
            height: ROW_H,
            display: "flex",
            alignItems: "center",
          }}
        >
          {useConnector && (
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
          )}
          {hasChildren && (
            <IconButton
              size="small"
              sx={{
                ml: useConnector ? `${CONNECTOR_WIDTH * depth - 6}px` : 0,
              }}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
          <Typography
            variant="body2"
            sx={{
              ml: hasChildren
                ? useConnector ? `${CONNECTOR_WIDTH * depth + 8}px` : "8px"
                : useConnector ? `${CONNECTOR_WIDTH * depth + 36}px` : "36px",
            }}
          >
            {repairRequest.id}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip label="Lệnh sửa chữa" size="small" color="primary" />
        </TableCell>
        <TableCell>{repairRequest.ngayTao}</TableCell>
        <TableCell>{showStatus(repairRequest.trangThai ?? 0)}</TableCell>
        <TableCell align="right">
          <ActionCell
            isAdd={isCompleted}
            onAdd={() => setJobAssignmentDialogOpen(true)}
            addTooltip={"Tạo Phiếu giao việc"}
            addColor="success"
            isEdit={isDraft}
            onEdit={() => setEditDialogOpen(true)}
            editTooltip="Sửa Lệnh sửa chữa"
            editColor="primary"
            isDelete={isDraft}
            onDelete={handleDelete}
          />
        </TableCell>
      </TableRow>

      {expanded &&
        jobAssignments.map((assignment: any, idx: number) => (
          <JobAssignmentRow
            key={assignment.id}
            jobAssignment={assignment}
            repairRequest={repairRequest}
            inspection={inspection}
            depth={depth + 1}
            isLast={isLast && idx === jobAssignments.length - 1}
            defaultExpanded={defaultExpanded}
          />
        ))}

      {editDialogOpen && (
        <RepairRequestDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          initialData={repairRequest}
        />
      )}

      {jobAssignmentDialogOpen && (
        <JobAssignmentDialog
          open={jobAssignmentDialogOpen}
          onClose={() => setJobAssignmentDialogOpen(false)}
          repairRequest={repairRequest}
          inspection={inspection}
          initialData={existingJobAssignment}
        />
      )}
    </>
  );
};
