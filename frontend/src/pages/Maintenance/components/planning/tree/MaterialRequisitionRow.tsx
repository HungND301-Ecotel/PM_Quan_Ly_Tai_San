import React, { useState } from "react";
import { TableRow, TableCell, Typography, Box, Chip, IconButton } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { TreeConnector, ROW_H, CONNECTOR_WIDTH } from "./TreeConnector";
import { ActionCell } from "./ActionCell";
import { showStatus } from "../../../config";
import MaterialRequisitionDialog from "../../dialog/MaterialRequisitionDialog";
import AcceptanceTestDialog from "../../dialog/AcceptanceTestDialog";
import { useMaterialRequisitionMutation, useAcceptanceByBienBanQuery } from "../../../mutation";
import { AcceptanceRow } from "./AcceptanceRow";

interface Props {
  data: any;
  jobAssignment?: any;
  depth: number;
  isLast: boolean;
}

export const MaterialRequisitionRow = ({
  data,
  jobAssignment,
  depth,
  isLast,
}: Props) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addNghiemThuDialogOpen, setAddNghiemThuDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { deleteMutation } = useMaterialRequisitionMutation();
  const { data: acceptances = [] } = useAcceptanceByBienBanQuery(
    isExpanded ? data.id : undefined,
  );

  const isDraft = data.trangThai === 0;
  const hasChildren = data.daCoNghiemThu === 1 || acceptances.length > 0;

  const handleDelete = () => {
    deleteMutation.mutateAsync(data.id);
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
                : `${CONNECTOR_WIDTH * depth - 6}px`,
            }}
          >
            {data.id}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label="Phiếu lĩnh vật tư"
            size="small"
            color="primary"
            sx={{ color: "#fff" }}
          />
        </TableCell>
        <TableCell>{data.ngayTao}</TableCell>
        <TableCell>{showStatus(data.trangThai ?? 0)}</TableCell>
        <TableCell align="right">
          <ActionCell
            isEdit={isDraft}
            onEdit={() => setEditDialogOpen(true)}
            editTooltip="Sửa Phiếu lĩnh vật tư"
            editColor="primary"
            isDelete={isDraft}
            onDelete={handleDelete}
            onAdd={() => setAddNghiemThuDialogOpen(true)}
            isAdd={data.trangThai === 3 && data.daCoNghiemThu !== 1}
            addTooltip="Tạo biên bản nghiệm thu"
            addColor="success"
          />
        </TableCell>
      </TableRow>

      {isExpanded &&
        acceptances.map((acc: any, index: number) => (
          <AcceptanceRow
            key={acc.id}
            acceptance={acc}
            plan={null as any}
            depth={depth + 1}
            isLast={index === acceptances.length - 1}
          />
        ))}

      {editDialogOpen && (
        <MaterialRequisitionDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          jobAssignment={jobAssignment}
          initialData={data}
        />
      )}

      {addNghiemThuDialogOpen && (
        <AcceptanceTestDialog
          open={addNghiemThuDialogOpen}
          onClose={() => setAddNghiemThuDialogOpen(false)}
          jobAssignment={jobAssignment}
          materialRequisition={data}
        />
      )}
    </>
  );
};

