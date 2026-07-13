import React, { useState } from "react";
import {
  TableRow,
  TableCell,
  Typography,
  Box,
  Chip,
  IconButton,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { TreeConnector, ROW_H, CONNECTOR_WIDTH } from "./TreeConnector";
import { ActionCell } from "./ActionCell";
import { showStatus } from "../../../config";
import type { MaintenancePlanData } from "../../../types";
import {
  useMaintenanceMaterialAssessmentByAcceptanceQuery,
  useAcceptanceMutation,
} from "../../../mutation";
import { MaterialRow } from "./MaterialRow";
import AcceptanceTestDialog from "../../dialog/AcceptanceTestDialog";
import MaterialDialog from "../../dialog/MaterialDialog";
import { useAppSelector } from "../../../../../redux/store";
import { useLocation } from "react-router-dom";
import DraftIndicator from "../../../../../components/common/DraftIndicator";

interface Props {
  acceptance: any;
  depth: number;
  isLast: boolean;
  plan?: MaintenancePlanData | null;
  bienPhap?: any;
  inspection?: any; // parent inspection if direct
  useConnector?: boolean;
  isMachine: boolean;
}

export const AcceptanceRow = ({
  acceptance,
  depth,
  isLast,
  plan,
  bienPhap,
  inspection,
  useConnector = true,
  isMachine,
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false);

  const location = useLocation();
  const tabPath = location.pathname;

  const lastMinimizedDialog = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return tab?.formData?.lastMinimizedDialog ?? null;
  });

  const hasMaterialDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return !!tab?.formData?.[`materialDraft_${acceptance.id}`];
  });

  const { data: materials = [] } =
    useMaintenanceMaterialAssessmentByAcceptanceQuery(
      expanded ? acceptance.id : "",
    );

  const { deleteMutation } = useAcceptanceMutation();

  const isDraft = acceptance.trangThai === 0;
  const canAddMaterial =
    acceptance.trangThai === 3 && acceptance.daCoPhieuDanhGia !== 1;
  const hasMaterials =
    acceptance.daCoPhieuDanhGia === 1 || materials.length > 0;

  const handleDelete = () => {
    deleteMutation.mutateAsync(acceptance.id);
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
              <TreeConnector
                depth={depth}
                isLast={isLast && materials.length === 0}
              />
            </Box>
          )}
          {hasMaterials && (
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
              ml: hasMaterials
                ? useConnector
                  ? `${CONNECTOR_WIDTH * depth + 8}px`
                  : "8px"
                : useConnector
                  ? `${CONNECTOR_WIDTH * depth + 36}px`
                  : "36px",
            }}
          >
            {acceptance.id || "BB Nghiệm thu"}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label="BB Nghiệm thu"
            size="small"
            color="warning"
            sx={{ color: "#fff" }}
          />
        </TableCell>
        <TableCell>{acceptance.ngayTao}</TableCell>
        <TableCell>{showStatus(acceptance.trangThai ?? 0)}</TableCell>
        <TableCell align="right">
          <ActionCell
            onAdd={() => setAddMaterialDialogOpen(true)}
            isAdd={canAddMaterial}
            addTooltip={
              acceptance.daCoPhieuDanhGia === 1
                ? "Đã có BB Vật tư"
                : "Tạo BB Vật tư"
            }
            addColor="secondary"
            isEdit={isDraft}
            onEdit={() => setEditDialogOpen(true)}
            editTooltip="Chỉnh sửa BB Nghiệm thu"
            editColor="primary"
            isDelete={isDraft}
            onDelete={handleDelete}
          />
        </TableCell>
      </TableRow>

      {expanded &&
        materials.map((mat: any, idx: number) => (
          <MaterialRow
            key={mat.id}
            material={mat}
            depth={depth + 1}
            isLast={idx === materials.length - 1}
            plan={plan}
            acceptanceRecord={acceptance}
            useConnector={useConnector}
          />
        ))}

      {editDialogOpen &&
        <AcceptanceTestDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          initialData={acceptance}
        />
      }

      {addMaterialDialogOpen && (
        <MaterialDialog
          open={addMaterialDialogOpen}
          onClose={() => setAddMaterialDialogOpen(false)}
          plan={plan}
          repairRequest={null as any}
          acceptanceRecord={acceptance}
          initData={null}
        />
      )}

      {lastMinimizedDialog === "material" && hasMaterialDraft && (
        <DraftIndicator onClick={() => setAddMaterialDialogOpen(true)} />
      )}
    </>
  );
};
