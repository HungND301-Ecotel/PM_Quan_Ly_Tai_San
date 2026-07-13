import React, { useState } from "react";
import { TableRow, TableCell, Typography, Box, Chip } from "@mui/material";
import { TreeConnector, ROW_H, CONNECTOR_WIDTH } from "./TreeConnector";
import { ActionCell } from "./ActionCell";
import { showStatus } from "../../../config";
import type { DanhGiaVatTuData, MaintenancePlanData } from "../../../types";
import { useAppSelector } from "../../../../../redux/store";
import { useLocation } from "react-router-dom";
import DraftIndicator from "../../../../../components/common/DraftIndicator";
import { useMaintenanceMaterialAssessmentMutation } from "../../../mutation";
import MaterialDialog from "../../dialog/MaterialDialog";

interface Props {
  material: DanhGiaVatTuData;
  depth: number;
  isLast: boolean;
  plan?: MaintenancePlanData | null;
  acceptanceRecord: any;
  useConnector?: boolean;
}

export const MaterialRow = ({
  material,
  depth,
  isLast,
  plan,
  acceptanceRecord,
  useConnector = true,
}: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { deleteMutation } = useMaintenanceMaterialAssessmentMutation();

  const location = useLocation();
  const tabPath = location.pathname;

  const lastMinimizedDialog = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return tab?.formData?.lastMinimizedDialog ?? null;
  });

  const hasDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return !!tab?.formData?.[`materialDraft_${material.id}`];
  });

  const isDraft = material.trangThai === 0;

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
              <TreeConnector depth={depth} isLast={isLast} />
            </Box>
          )}
          <Typography
            variant="body2"
            sx={{
              ml: useConnector ? `${CONNECTOR_WIDTH * depth + 36}px` : 0,
            }}
          >
            {material.id || ""}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip label="BB Vật tư" size="small" color="secondary" />
        </TableCell>
        <TableCell>{(material as any).ngayTao || "—"}</TableCell>
        <TableCell>{showStatus(material.trangThai ?? 0)}</TableCell>
        <TableCell align="right">
          <ActionCell
            isEdit={isDraft}
            onEdit={() => setDialogOpen(true)}
            isDelete={isDraft}
            onDelete={() => deleteMutation.mutateAsync(material.id || "")}
            editTooltip="Chỉnh sửa BB Đánh giá Vật tư"
            editColor="secondary"
          />
        </TableCell>
      </TableRow>

      {dialogOpen && (
        <MaterialDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          plan={plan}
          repairRequest={null as any} // Not strictly needed for update if not fetched, but maybe we should pass it down if possible. It's often optional.
          acceptanceRecord={acceptanceRecord}
          initData={material}
        />
      )}
      {lastMinimizedDialog === "material" && hasDraft && (
        <DraftIndicator onClick={() => setDialogOpen(true)} />
      )}
    </>
  );
};
