import React, { useState } from "react";
import { TableRow, TableCell, Typography, Box, Chip, IconButton } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { TreeConnector, ROW_H, CONNECTOR_WIDTH } from "./TreeConnector";
import { ActionCell } from "./ActionCell";
import { showStatus } from "../../../config";
import type { InspectionRecordData, MaintenancePlanData } from "../../../types";
import { TechnicalReportData } from "../../../types";
import { useTechnicalReportMutation } from "../../../mutation/TechnicalReport";
import TechnicalReportDialog from "../../dialog/TechnicalReportDialog";
import { useMaintenanceInspectionMutation } from "../../../mutation";
import { useMaintenanceInspectionByBaoCaoQuery } from "../../../mutation/Inspection";
import InspectionRecordDialog from "../../dialog/InspectionRecordDialog";
import { InspectionRow } from "./InspectionRow";

interface Props {
  report: TechnicalReportData;
  plan: MaintenancePlanData;
  isLast: boolean;
}

export const TechnicalReportRow = ({ report, plan, isLast }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { deleteMutation, updateMutation } = useTechnicalReportMutation();
  const { createMutation } = useMaintenanceInspectionMutation();

  const isDraft = report.trangThai === 0;

  const { data: inspections = [] } = useMaintenanceInspectionByBaoCaoQuery(
    expanded ? report.id : ""
  );

  const hasChildren = (report.daCoGiamDinh === 1) || inspections.length > 0;

  const handleDelete = () => {
    deleteMutation.mutateAsync(report.id || "");
  };

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
            <TreeConnector depth={1} isLast={isLast && !hasChildren} />
          </Box>
          {hasChildren && (
            <IconButton
              size="small"
              sx={{
                ml: `${CONNECTOR_WIDTH * 1 - 6}px`,
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
                ? `${CONNECTOR_WIDTH * 1 + 8}px`
                : `${CONNECTOR_WIDTH * 1 + 36}px`,
            }}
          >
            {report.id || "Chưa có số"}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip label="Báo cáo kỹ thuật" size="small" />
        </TableCell>
        <TableCell>{report.ngayTao}</TableCell>
        <TableCell>{showStatus(report.trangThai ?? 0)}</TableCell>
        <TableCell align="right">
          <ActionCell
            isAdd={report.trangThai === 3 && report.daCoGiamDinh !== 1}
            onAdd={() => setCreateDialogOpen(true)}
            isEdit={isDraft}
            onEdit={() => setEditDialogOpen(true)}
            editTooltip="Sửa"
            editColor="success"
            isDelete={isDraft}
            onDelete={handleDelete}
          />
        </TableCell>
      </TableRow>

      {expanded &&
        inspections.map((insp: any, idx: number) => (
          <InspectionRow
            key={insp.id}
            inspection={insp}
            depth={2}
            isLast={idx === inspections.length - 1}
            plan={plan}
            parentReq={report}
            useConnector={true}
            defaultExpanded={true}
          />
        ))}

      {editDialogOpen && (
        <TechnicalReportDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          plan={plan}
          initialData={report}
          selectedDeviceIds={[]}
          selectedMonth={report.thang || 0}
        />
      )}
      {createDialogOpen && (
        <InspectionRecordDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          technicalReport={report}
          onSubmit={(updatedData: InspectionRecordData) => {
            createMutation.mutate(updatedData, {
              onSuccess: () => {
                setCreateDialogOpen(false);
              },
            });
          }}
        />
      )}
    </>
  );
};
