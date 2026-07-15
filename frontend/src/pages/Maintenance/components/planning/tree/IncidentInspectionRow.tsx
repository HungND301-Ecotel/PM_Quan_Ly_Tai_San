import React, { useState } from "react";
import { TableRow, TableCell, Typography, Box, Chip, IconButton } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { ActionCell } from "./ActionCell";
import { showStatus } from "../../../config";
import type { MaintenancePlanData } from "../../../types";
import {
  useMaintenanceInspectionByBienBanQuery,
  useMaintenanceIncidentInspectionMutation,
} from "../../../mutation";
import { InspectionRow } from "./InspectionRow";
import IncidentInspectionDialog from "../../dialog/Incidentinspectiondialog";
import InspectionRecordDialog from "../../dialog/InspectionRecordDialog";
import { AssetGroup } from "../../../../../utils/const";

interface Props {
  incidentInspection: any;
  plan?: MaintenancePlanData | null;
  incidentReport: any;
  isMachine: boolean;
}

export const IncidentInspectionRow = ({
  incidentInspection,
  plan,
  incidentReport,
  isMachine,
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addInspectionDialogOpen, setAddInspectionDialogOpen] = useState(false);

  const { data: inspectionMachine = [] } = useMaintenanceInspectionByBienBanQuery(
    isMachine && expanded ? incidentInspection.id : "",
    isMachine
  );
  // const { data: inspectionVehicle = [] } = useMaintenanceVehicleInspectionByBienBanQuery(
  //   !isMachine && expanded ? incidentInspection.id : "",
  //   !isMachine
  // );

  const inspections = inspectionMachine

  const { deleteMutation } = useMaintenanceIncidentInspectionMutation();

  const isDraft = incidentInspection.trangThai === 0;
  const canAddInspection = incidentInspection.trangThai === 3 && incidentInspection.daCoGiamDinh !== 1;
  const hasInspections = incidentInspection.daCoGiamDinh === 1 || inspections.length > 0;

  const handleDelete = () => {
    deleteMutation.mutateAsync(incidentInspection.id);
  };

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ pl: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {hasInspections && (
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            )}
            <Typography
              variant="body2"
              sx={{
                ml: hasInspections ? 0 : "28px",
              }}
            >
              {incidentInspection.soPhieu}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label="BB Kiểm tra SC"
            size="small"
            color="warning"
            sx={{ color: "#fff" }}
          />
        </TableCell>
        <TableCell>{incidentInspection.ngayKiemTra}</TableCell>
        <TableCell>{showStatus(incidentInspection.trangThai ?? 0)}</TableCell>
        <TableCell align="right">
          {incidentInspection.daCoGiamDinh === 1 ? (
            <Chip
              label="Đã có BB GĐ"
              size="small"
              color="info"
              variant="outlined"
            />
          ) : (
            <ActionCell
              onAdd={() => setAddInspectionDialogOpen(true)}
              isAdd={canAddInspection}
              addTooltip="Tạo BB Giám định"
              addColor="success"
              isEdit={isDraft}
              onEdit={() => setEditDialogOpen(true)}
              editTooltip="Chỉnh sửa BB KTSC"
              editColor="primary"
              isDelete={isDraft}
              onDelete={handleDelete}
            />
          )}
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
            parentReq={incidentInspection}
            useConnector={false} // Incident panel doesn't use connectors
            isMachine={isMachine}
            defaultExpanded={true}
          />
        ))}

      {/* {editDialogOpen && (
        <IncidentInspectionDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          incidentReport={incidentReport}
          selectedDeviceIds={[]} // Not needed for edit
          initData={incidentInspection}
        />
      )}

      {addInspectionDialogOpen && (
        isMachine ? (
          <InspectionRecordDialog
            open={addInspectionDialogOpen}
            onClose={() => setAddInspectionDialogOpen(false)}
            plan={plan}
            incidentInspection={incidentInspection}
            repairRequest={null as any}
            initData={null}
          />
        ) : (
          <InspectionRecordVehicleDialog
            open={addInspectionDialogOpen}
            onClose={() => setAddInspectionDialogOpen(false)}
            plan={plan}
            incidentInspection={incidentInspection}
            repairRequest={null as any}
            initData={null as any}
          />
        )
      )} */}
    </>
  );
};
