import React, { useState } from "react";
import { TableRow, TableCell, Typography, Box, Chip } from "@mui/material";
import { TreeConnector, ROW_H, CONNECTOR_WIDTH } from "./TreeConnector";
import { ActionCell } from "./ActionCell";
import { showStatus } from "../../../config";
import type { QuyetToanData, DanhGiaVatTuData } from "../../../types";
import { useAppSelector } from "../../../../../redux/store";
import { useLocation } from "react-router-dom";
import DraftIndicator from "../../../../../components/common/DraftIndicator";
import { useQuyetToanMutation } from "../../../mutation/QuyetToan";
import QuyetToanDialog from "../../dialog/QuyetToanDialog";

interface Props {
  quyetToan: QuyetToanData;
  materialAssessment: DanhGiaVatTuData;
  depth: number;
  isLast: boolean;
  useConnector?: boolean;
}

export const QuyetToanRow = ({
  quyetToan,
  materialAssessment,
  depth,
  isLast,
  useConnector = true,
}: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { deleteMutation } = useQuyetToanMutation();

  const location = useLocation();
  const tabPath = location.pathname;

  const lastMinimizedDialog = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return tab?.formData?.lastMinimizedDialog ?? null;
  });

  const hasDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return !!tab?.formData?.[`quyettoanDraft_${quyetToan.id}`];
  });

  const isDraft = quyetToan.trangThai === 0;

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
            {quyetToan.id || ""}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip label="Quyết toán" size="small" color="error" />
        </TableCell>
        <TableCell>{quyetToan.ngayTao || "—"}</TableCell>
        <TableCell>{showStatus(quyetToan.trangThai ?? 0)}</TableCell>
        <TableCell align="right">
          <ActionCell
            isEdit={isDraft}
            onEdit={() => setDialogOpen(true)}
            isDelete={isDraft}
            onDelete={() => deleteMutation.mutateAsync(quyetToan.id || "")}
            editTooltip="Chỉnh sửa Quyết toán"
            editColor="error"
          />
        </TableCell>
      </TableRow>

      {dialogOpen && (
        <QuyetToanDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          materialAssessment={materialAssessment}
          initData={quyetToan}
        />
      )}
      {lastMinimizedDialog === "quyettoan" && hasDraft && (
        <DraftIndicator onClick={() => setDialogOpen(true)} />
      )}
    </>
  );
};
