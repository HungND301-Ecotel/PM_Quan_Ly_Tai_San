import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Remove } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";

import FieldInput from "../../../../components/TextField/FieldInput";
import TextFieldNumber from "../../../../components/TextField/TextFieldNumber";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import AcceptanceTestPreview from "../preview/AcceptanceTestPreview";

import { useAcceptanceMutation } from "../../mutation";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { useAllPositionsQuery } from "../../../Position/Mutation";
import { generateCode } from "../../../../utils/helpers";
import { listSigneInfo } from "../../config";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import { useAllToolDetailQuery } from "../../../ToolManager/Mutation";

interface Props {
  open: boolean;
  onClose: () => void;
  jobAssignment?: any;
  materialRequisition?: any;
  inspection?: any;
  initialData?: any | null;
}

const AcceptanceTestDialog = ({
  open,
  onClose,
  jobAssignment,
  materialRequisition,
  inspection,
  initialData,
}: Props) => {
  const [tabIndex, setTabIndex] = useState(0);
  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();
  const draftId = initialData?.id || materialRequisition?.id || "new_nghiemthu";

  const savedDraft = useAppSelector((state: any) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return tab?.formData?.[`nghiemThuDraft_${draftId}`] ?? null;
  });

  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const { data: apiPositions = [] } = useAllPositionsQuery();
  const { data: allToolDetail = [] } = useAllToolDetailQuery();
  const { createMutation, updateMutation } = useAcceptanceMutation();

  const formik = useFormik({
    initialValues: {
      id: "",
      idBienBan: materialRequisition?.id || "",
      soPhieuBienBan: materialRequisition?.soPhieu || "",
      donViQuanLy: materialRequisition?.donViDeNghi || "",
      noiDungSuaChua: "",
      ketQua:
        "Được các thành phần tham gia thống nhất đủ điều kiện để đưa vào khai thác phục vụ sản xuất.",
      ngayTao: dayjs().format("YYYY-MM-DD HH:mm"),
      danhSachTaiSan: [] as any[],
      danhSachVatTu: [] as any[],
      nguoiKyList: [] as any[],
    },
    onSubmit: (values) => {
      const idNguoiLapBieu =
        values.nguoiKyList.length > 0 ? values.nguoiKyList[0].userId : "";
      const idTrinhDuyetGiamDoc =
        values.nguoiKyList.length > 1
          ? values.nguoiKyList[values.nguoiKyList.length - 1].userId
          : "";

      const intermediateSigners =
        values.nguoiKyList.length > 2
          ? values.nguoiKyList.slice(1, -1).map((s: any, idx: number) => ({
              id: `${generateCode("SIG-")}-${idx}`,
              idTaiLieu: values.id,
              idNguoiKy: s.userId,
              trangThai: 0,
              idPhongBan: s.departmentId,
              chucVu: s.position,
            }))
          : [];

      const submitData = {
        ...values,
        idNguoiLap: idNguoiLapBieu,
        idGiamDoc: idTrinhDuyetGiamDoc,
        nguoiKyList: intermediateSigners,
        nguoiLapXacNhan: false,
        giamDocXacNhan: false,
        trangThai: 0,
      };

      if (values.id) {
        updateMutation.mutate(submitData, { onSuccess: handleClose });
      } else {
        createMutation.mutate(submitData, { onSuccess: handleClose });
      }
    },
  });

  useEffect(() => {
    if (!open) return;

    if (initialData && initialData.id) {
      const listInfo = listSigneInfo(
        initialData,
        apiUsers,
        apiDepartments,
        apiPositions,
      );
      const signersList = (listInfo || []).map((item, idx) => ({
        ...item,
        userId: item.idNhanVien,
        userName: item.hoTen,
        departmentId: item.idDonVi,
        departmentName: item.donVi,
        position: item.chucVu || "",
        order: idx + 1,
      }));

      formik.setValues({
        ...formik.initialValues,
        ...initialData,
        nguoiKyList: signersList,
      });
      return;
    }

    if (savedDraft) {
      formik.setValues(savedDraft);
      return;
    }

    if (materialRequisition) {
      const signersList = listSigneInfo(
        materialRequisition,
        apiUsers,
        apiDepartments,
        apiPositions,
      ).map((item: any, idx: number) => ({
        ...item,
        userId: item.idNhanVien || item.userId,
        userName: item.hoTen || item.userName,
        departmentId: item.idDonVi || item.departmentId,
        departmentName: item.donVi || item.departmentName,
        position: item.chucVu || "",
        order: idx + 1,
      }));

      const materialsList = (materialRequisition.danhSachVatTu || []).map(
        (vt: any) => ({
          id: `NT_VT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          idChiTietVatTu: vt.idChiTietVatTu || "",
          idVatTu: vt.idVatTu || "",
          tenVatTu: vt.tenVatTu || "",
          kyHieu: vt.kyHieu || vt.maHieu || "",
          donViTinh: vt.donViTinh || "",
          soLuongThayThe: vt.soLuongDuyet || vt.soLuongDeNghi || 1,
          soLuongThuHoi: vt.soLuongThuCu || 0,
          ghiChu: "",
        }),
      );

      const assetsList = (materialRequisition?.danhSachTaiSan || []).map(
        (ts: any) => {
          const inspDetail = (inspection?.danhSachChiTiet || []).find(
            (i: any) => i.idTaiSan === ts.idTaiSan,
          );
          return {
            id: `NT_TS_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            idTaiSan: ts.idTaiSan,
            tenTaiSan: ts.tenTaiSan,
            maCongViec: "",
            noiDung:
              inspDetail?.noiDungCongViec ||
              ts.noiDungCongViec ||
              ts.noiDung ||
              "Bảo dưỡng ; " + ts.tenTaiSan,
            soLuong: inspDetail?.soLuong || ts.soLuong || 1,
            ghiChu: "",
          };
        },
      );

      formik.setValues({
        ...formik.initialValues,
        idBienBan: materialRequisition.id,
        soPhieuBienBan: materialRequisition.soPhieu || "",
        donViQuanLy: materialRequisition.donViDeNghi || "",
        nguoiKyList: signersList,
        danhSachVatTu: materialsList,
        danhSachTaiSan: assetsList,
        noiDungSuaChua: assetsList.map((a: any) => a.noiDung).join("; "),
      });
    }
  }, [
    open,
    initialData,
    materialRequisition,
    inspection,
    savedDraft,
    apiUsers?.length,
    apiDepartments?.length,
    apiPositions?.length,
  ]);

  const addMaterialRow = () => {
    formik.setFieldValue("danhSachVatTu", [
      ...(formik.values.danhSachVatTu || []),
      {
        id: `NT_VT_${Date.now()}`,
        idChiTietVatTu: "",
        idVatTu: "",
        tenVatTu: "",
        kyHieu: "",
        donViTinh: "",
        soLuongThayThe: 1,
        soLuongThuHoi: 0,
        ghiChu: "",
      },
    ]);
  };

  const removeMaterialRow = (id: string) => {
    formik.setFieldValue(
      "danhSachVatTu",
      (formik.values.danhSachVatTu || []).filter((vt) => vt.id !== id),
    );
  };

  const updateMaterial = (id: string, fields: any) => {
    formik.setFieldValue(
      "danhSachVatTu",
      (formik.values.danhSachVatTu || []).map((vt) =>
        vt.id === id ? { ...vt, ...fields } : vt,
      ),
    );
  };

  const addAssetRow = () => {
    formik.setFieldValue("danhSachTaiSan", [
      ...(formik.values.danhSachTaiSan || []),
      {
        id: `NT_TS_${Date.now()}`,
        idTaiSan: "",
        tenTaiSan: "",
        maCongViec: "",
        noiDung: "",
        soLuong: 1,
        ghiChu: "",
      },
    ]);
  };

  const removeAssetRow = (id: string) => {
    formik.setFieldValue(
      "danhSachTaiSan",
      (formik.values.danhSachTaiSan || []).filter((ts) => ts.id !== id),
    );
  };

  const updateAsset = (id: string, fields: any) => {
    formik.setFieldValue(
      "danhSachTaiSan",
      (formik.values.danhSachTaiSan || []).map((ts) =>
        ts.id === id ? { ...ts, ...fields } : ts,
      ),
    );
  };

  const handleClose = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: { [`nghiemThuDraft_${draftId}`]: null },
      }),
    );
    formik.resetForm();
    onClose();
  };

  const handleMinimize = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: { [`nghiemThuDraft_${draftId}`]: formik.values },
      }),
    );
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleMinimize}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: "90vh" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          {initialData?.id
            ? "Chỉnh sửa Biên bản nghiệm thu"
            : "Tạo Biên bản nghiệm thu"}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton size="small" onClick={handleMinimize}>
            <Remove />
          </IconButton>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3, overflow: "auto" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 3 }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  p: 2.5,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Thông tin nghiệm thu
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FieldAutoCompleted
                    data={apiDepartments}
                    title="Đơn vị quản lý"
                    field="donViQuanLy"
                    formik={formik}
                    labelkey="tenPhongBan"
                  />
                  <FieldInput
                    title="Nội dung sửa chữa"
                    field="noiDungSuaChua"
                    formik={formik}
                    multiline
                    rows={2}
                  />
                  <FieldInput
                    title="Kết quả kiểm tra, chạy thử"
                    field="ketQua"
                    formik={formik}
                    multiline
                    rows={2}
                  />
                </Box>
              </Box>
            </Box>

            <Box>
              <SignerWorkflowSection formik={formik} />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              3.1 Khối lượng vật tư được nghiệm thu
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 40 }}>
                      STT
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 250 }}>
                      Vật tư thay thế
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 150 }}>
                      Chủng loại, quy cách
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 80 }}>
                      ĐVT
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      sx={{ fontWeight: 700, width: 140 }}
                      align="center"
                    >
                      Số lượng
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 150 }}>
                      Ghi chú
                    </TableCell>
                    <TableCell sx={{ width: 40 }} align="center" rowSpan={2}>
                      <IconButton
                        size="small"
                        onClick={addMaterialRow}
                        color="primary"
                        sx={{ border: "1px dashed", borderRadius: 1 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: 700, width: 70 }}
                      align="center"
                    >
                      Thay thế
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, width: 70 }}
                      align="center"
                    >
                      Thu hồi
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(formik.values.danhSachVatTu || []).map(
                    (row: any, rowIdx: number) => (
                      <TableRow key={row.id}>
                        <TableCell sx={{ pl: 2 }}>{rowIdx + 1}</TableCell>
                        <TableCell>
                          <FieldAutoCompleted
                            data={allToolDetail}
                            labelkey="tenTaiSan"
                            labelOption="idTaiSan"
                            title=""
                            noBorder={true}
                            formik={formik}
                            value={row.idChiTietVatTu}
                            onChange={(value: any) => {
                              if (value) {
                                updateMaterial(row.id || row.idVatTu, {
                                  idChiTietVatTu: value.id,
                                  idVatTu: value.idTaiSan,
                                  tenVatTu: value.tenTaiSan,
                                  donViTinh: value.donViTinh,
                                  kyHieu: value.kyHieu,
                                });
                              } else {
                                updateMaterial(row.id || row.idVatTu, {
                                  idChiTietVatTu: "",
                                  idVatTu: "",
                                  tenVatTu: "",
                                  donViTinh: "",
                                });
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldInput
                            title=""
                            field="kyHieu"
                            noBorder={true}
                            formik={{
                              values: { kyHieu: row.kyHieu },
                              setFieldValue: (_f: string, v: any) =>
                                updateMaterial(row.id, { kyHieu: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldInput
                            title=""
                            field="donViTinh"
                            noBorder={true}
                            formik={{
                              values: { donViTinh: row.donViTinh },
                              setFieldValue: (_f: string, v: any) =>
                                updateMaterial(row.id, { donViTinh: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextFieldNumber
                            field="soLuongThayThe"
                            noBorder={true}
                            formik={{
                              values: { soLuongThayThe: row.soLuongThayThe },
                              setFieldValue: (_f: string, v: any) =>
                                updateMaterial(row.id, { soLuongThayThe: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextFieldNumber
                            field="soLuongThuHoi"
                            noBorder={true}
                            formik={{
                              values: { soLuongThuHoi: row.soLuongThuHoi },
                              setFieldValue: (_f: string, v: any) =>
                                updateMaterial(row.id, { soLuongThuHoi: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldInput
                            title=""
                            field="ghiChu"
                            noBorder={true}
                            formik={{
                              values: { ghiChu: row.ghiChu },
                              setFieldValue: (_f: string, v: any) =>
                                updateMaterial(row.id, { ghiChu: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeMaterialRow(row.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              3.2 Khối lượng công việc được nghiệm thu
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>
                      STT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }}>
                      Mã công việc
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Nội dung công việc
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, width: 100 }}
                      align="center"
                    >
                      Số lượng
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 200 }}>
                      Ghi chú
                    </TableCell>
                    <TableCell sx={{ width: 40 }} align="center">
                      <IconButton
                        size="small"
                        onClick={addAssetRow}
                        color="primary"
                        sx={{ border: "1px dashed", borderRadius: 1 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(formik.values.danhSachTaiSan || []).map(
                    (row: any, rowIdx: number) => (
                      <TableRow key={row.id}>
                        <TableCell sx={{ pl: 2 }}>{rowIdx + 1}</TableCell>
                        <TableCell>
                          <FieldInput
                            title=""
                            field="maCongViec"
                            noBorder={true}
                            formik={{
                              values: { maCongViec: row.maCongViec },
                              setFieldValue: (_f: string, v: any) =>
                                updateAsset(row.id, { maCongViec: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldInput
                            title=""
                            field="noiDung"
                            noBorder={true}
                            multiline
                            rows={3}
                            formik={{
                              values: { noiDung: row.noiDung },
                              setFieldValue: (_f: string, v: any) =>
                                updateAsset(row.id, { noiDung: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextFieldNumber
                            field="soLuong"
                            noBorder={true}
                            formik={{
                              values: { soLuong: row.soLuong },
                              setFieldValue: (_f: string, v: any) =>
                                updateAsset(row.id, { soLuong: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldInput
                            title=""
                            field="ghiChu"
                            noBorder={true}
                            formik={{
                              values: { ghiChu: row.ghiChu },
                              setFieldValue: (_f: string, v: any) =>
                                updateAsset(row.id, { ghiChu: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeAssetRow(row.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <AcceptanceTestPreview
              data={formik.values}
              apiDepartments={apiDepartments}
              apiUsers={apiUsers}
            />
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} color="inherit">
          Hủy
        </Button>
        <Button
          onClick={() => formik.handleSubmit()}
          variant="contained"
          color="primary"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {initialData?.id ? "Cập nhật" : "Lưu & Gửi duyệt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AcceptanceTestDialog;
