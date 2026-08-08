import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { DinhMucVatTu, DinhMucSuaChua } from "../types";
import { useAllToolDetailQuery } from "../../ToolManager/Mutation";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import { FormikProps } from "formik";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import FieldInput from "../../../components/TextField/FieldInput";

interface RepairNormVatTuTableProps {
  formik: FormikProps<DinhMucSuaChua>;
  readOnly?: boolean;
}

const RepairNormVatTuTable: React.FC<RepairNormVatTuTableProps> = ({
  formik,
  readOnly,
}) => {
  const { data: allMaterials = [] } = useAllToolDetailQuery();
  const vatTuList = formik.values.dinhMucVatTuList || [];

  const handleAddRow = () => {
    const newVatTu: DinhMucVatTu = {
      id: "",
      idDinhMuc: "",
      idCCDCVT: "",
      soLuong: 0,
      kyHieu: "",
      ghiChu: "",
      isNew: true,
    };
    formik.setFieldValue("dinhMucVatTuList", [...vatTuList, newVatTu]);
  };

  const handleRemoveRow = (index: number) => {
    const newList = [...vatTuList];
    newList.splice(index, 1);
    formik.setFieldValue("dinhMucVatTuList", newList);
  };

  const handleRowChange = (
    index: number,
    field: keyof DinhMucVatTu,
    value: any,
  ) => {
    const newList = [...vatTuList];
    newList[index] = { ...newList[index], [field]: value };
    if (!newList[index].isNew) {
      newList[index].isUpdated = true;
    }
    formik.setFieldValue("dinhMucVatTuList", newList);
  };

  const handleMaterialChange = (index: number, material: any) => {
    const newList = [...vatTuList];
    newList[index] = {
      ...newList[index],
      idChiTietVatTu: material?.id || "",
      idCCDCVT: material?.idTaiSan || "",
      tenCCDCVT: material?.tenTaiSan || "",
      donViTinh: material?.donViTinh || "",
      kyHieu: material?.kyHieu || "",
    };
    if (!newList[index].isNew) {
      newList[index].isUpdated = true;
    }
    formik.setFieldValue("dinhMucVatTuList", newList);
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell width="50px">STT</TableCell>
            <TableCell>Tên vật tư</TableCell>
            <TableCell width="150px">ĐVT</TableCell>
            <TableCell width="150px">Số lượng</TableCell>
            <TableCell width="150px">Quy cách</TableCell>
            <TableCell width="250px">Ghi chú</TableCell>
            {!readOnly && <TableCell width="100px">Thao tác</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {vatTuList.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                {readOnly ? (
                  item.tenCCDCVT
                ) : (
                  <FieldAutoCompleted
                    title="Tên vật tư"
                    data={allMaterials}
                    labelkey="tenTaiSan"
                    labelOption="idTaiSan"
                    name={`dinhMucVatTuList.${index}.idChiTietVatTu`}
                    disabled={readOnly}
                    onChange={(value) => handleMaterialChange(index, value)}
                    limitOptions={20}
                  />
                )}
              </TableCell>
              <TableCell>
                {readOnly ? (
                  item.donViTinh
                ) : (
                  <FieldInput
                    name={`dinhMucVatTuList.${index}.donViTinh`}
                    disabled={true}
                  />
                )}
              </TableCell>
              <TableCell>
                {readOnly ? (
                  item.soLuong
                ) : (
                  <TextFieldNumber
                    name={`dinhMucVatTuList.${index}.soLuong`}
                    disabled={readOnly}
                  />
                )}
              </TableCell>
              <TableCell>
                {readOnly ? (
                  item.kyHieu
                ) : (
                  <FieldInput
                    name={`dinhMucVatTuList.${index}.kyHieu`}
                    disabled={true}
                  />
                )}
              </TableCell>
              <TableCell>
                {readOnly ? (
                  item.ghiChu
                ) : (
                  <TextField
                    type="text"
                    size="small"
                    value={item.ghiChu}
                    onChange={(e) =>
                      handleRowChange(index, "ghiChu", e.target.value)
                    }
                    variant="outlined"
                    fullWidth
                  />
                )}
              </TableCell>
              {!readOnly && (
                <TableCell>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveRow(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!readOnly && (
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddRow}
          size="small"
          variant="text"
          sx={{ mt: 1 }}
        >
          Thêm vật tư
        </Button>
      )}
    </TableContainer>
  );
};

export default RepairNormVatTuTable;
