import { useEffect, useState } from "react";
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
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import MaterialRequisitionPreview from "../preview/MaterialRequisitionPreview";

import { useMaterialRequisitionMutation } from "../../mutation";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { useAllToolDetailQuery } from "../../../ToolManager/Mutation";
import { useAllPositionsQuery } from "../../../Position/Mutation";
import { generateCode } from "../../../../utils/helpers";
import { PlanSigner } from "../../../../mockdata/mockPlans";
import { listSigneInfo } from "../../config";

interface Props {
  open: boolean;
  onClose: () => void;
  jobAssignment?: any;
  inspection?: any;
  initialData?: any | null;
}

const MaterialRequisitionDialog = ({
  open,
  onClose,
  jobAssignment,
  inspection,
  initialData,
}: Props) => {
  const [tabIndex, setTabIndex] = useState(0);
  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();
  const draftId = initialData?.id || jobAssignment?.id || "new";

  const savedDraft = useAppSelector((state: any) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return tab?.formData?.[`materialRequisitionDraft_${draftId}`] ?? null;
  });

  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const { data: apiPositions = [] } = useAllPositionsQuery();
  const { data: allToolDetail = [] } = useAllToolDetailQuery();
  const { createMutation, updateMutation } = useMaterialRequisitionMutation();

  const formik = useFormik({
    initialValues: {
      id: "",
      idPhieuGiaoViec: jobAssignment?.id || "",
      soPhieu: "",
      soQuyetDinh: "",
      donViDeNghi: jobAssignment?.donViQuanLy || "",
      mucDichSuDung: "",
      ghiChu: "",
      ngayTao: dayjs().format("YYYY-MM-DD"),
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
          ? values.nguoiKyList
              .slice(1, -1)
              .map((s: PlanSigner, idx: number) => ({
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

    if (jobAssignment) {
      const signersList = listSigneInfo(
        jobAssignment,
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

      const materialsList = (jobAssignment.danhSachVatTu || []).map(
        (vt: any) => ({
          id: `SVT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          idChiTietVatTu: vt.idChiTietVatTu || "",
          idVatTu: vt.idVatTu || "",
          tenVatTu: vt.tenVatTu || "",
          kyHieu: vt.kyHieu || vt.maHieu || "",
          donViTinh: vt.donViTinh || "",
          soLuongDeNghi: vt.soLuong || 1,
          soLuongDuyet: vt.soLuong || 1,
          soLuongThuCu: 0,
        }),
      );

      const assetsList = (jobAssignment?.danhSachTaiSan || []).map(
        (ts: any) => ({
          idBienBan: ts.id,
          idTaiSan: ts.idTaiSan,
          tenTaiSan: ts.tenTaiSan,
        }),
      );

      formik.setValues({
        ...formik.initialValues,
        idPhieuGiaoViec: jobAssignment.id,
        donViDeNghi: jobAssignment.donViQuanLy || "",
        mucDichSuDung: assetsList
          .map((ts: any) => "Bảo dưỡng" + " " + ts.tenTaiSan)
          .join(", "),
        nguoiKyList: signersList,
        danhSachVatTu: materialsList,
        danhSachTaiSan: assetsList,
      });
    }
  }, [
    open,
    initialData,
    jobAssignment,
    savedDraft,
    apiUsers?.length,
    apiDepartments?.length,
    apiPositions?.length,
  ]);

  const addMaterialRow = () => {
    const newItem = {
      id: `SVT_${Date.now()}`,
      idChiTietVatTu: "",
      idVatTu: "",
      tenVatTu: "",
      kyHieu: "",
      donViTinh: "",
      soLuongDeNghi: 1,
      soLuongDuyet: 1,
      soLuongThuCu: 0,
    };
    formik.setFieldValue("danhSachVatTu", [
      ...(formik.values.danhSachVatTu || []),
      newItem,
    ]);
  };

  const removeMaterialRow = (id: string) => {
    formik.setFieldValue(
      "danhSachVatTu",
      (formik.values.danhSachVatTu || []).filter(
        (vt) => vt.id !== id && vt.idVatTu !== id,
      ),
    );
  };

  const updateMaterial = (vtId: string, fields: any) => {
    formik.setFieldValue(
      "danhSachVatTu",
      (formik.values.danhSachVatTu || []).map((vt) =>
        vt.id === vtId || vt.idVatTu === vtId ? { ...vt, ...fields } : vt,
      ),
    );
  };

  const handleClose = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: { [`materialRequisitionDraft_${draftId}`]: null },
      }),
    );
    formik.resetForm();
    onClose();
  };

  const handleMinimize = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: { [`materialRequisitionDraft_${draftId}`]: formik.values },
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
            ? "Chỉnh sửa Phiếu Lĩnh Vật Tư"
            : "Tạo Phiếu Lĩnh Vật Tư"}
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
                  Thông tin Phiếu lĩnh vật tư
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <FieldInput
                      title="Số phiếu"
                      field="soPhieu"
                      formik={formik}
                    />
                    <FieldInput
                      title="Số quyết định"
                      field="soQuyetDinh"
                      formik={formik}
                    />
                  </Box>
                  <FieldAutoCompleted
                    data={apiDepartments}
                    labelkey="tenPhongBan"
                    labelOption="id"
                    title="Đơn vị đề nghị"
                    field="donViDeNghi"
                    formik={formik}
                  />
                  <FieldInput
                    title="Mục đích sử dụng"
                    field="mucDichSuDung"
                    formik={formik}
                    multiline
                    rows={3}
                  />
                  {/* <FieldInput
                    title="Ghi chú"
                    field="ghiChu"
                    formik={formik}
                    multiline
                    rows={3}
                  /> */}
                </Box>
              </Box>
            </Box>

            <Box>
              <SignerWorkflowSection formik={formik} />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Danh sách vật tư đề nghị
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 40 }}>
                      STT
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 250 }}>
                      Mã vật tư
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 250 }}>
                      Tên vật tư
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 80 }}>
                      Quy cách
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ fontWeight: 700, width: 80 }}>
                      Đơn vị tính
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      sx={{ fontWeight: 700, width: 100 }}
                      align="center"
                    >
                      Số lượng vật tư cấp mới
                    </TableCell>
                    <TableCell
                      rowSpan={2}
                      sx={{ fontWeight: 700, width: 100 }}
                      align="center"
                    >
                      SL Thu cũ
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
                      sx={{ fontWeight: 700, width: 100 }}
                      align="center"
                    >
                      Đề nghị
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, width: 100 }}
                      align="center"
                    >
                      Duyệt
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(formik.values.danhSachVatTu || []).map(
                    (row: any, rowIdx: number) => (
                      <TableRow key={row.id || row.idVatTu || rowIdx}>
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
                            field="tenVatTu"
                            noBorder={true}
                            formik={{
                              values: { tenVatTu: row.tenVatTu },
                              setFieldValue: (_f: string, v: any) =>
                                updateMaterial(row.id, { tenVatTu: v }),
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
                            field="soLuongDeNghi"
                            noBorder={true}
                            formik={{
                              values: { soLuongDeNghi: row.soLuongDeNghi },
                              setFieldValue: (_f: string, v: any) =>
                                updateMaterial(row.id, { soLuongDeNghi: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextFieldNumber
                            field="soLuongDuyet"
                            noBorder={true}
                            formik={{
                              values: { soLuongDuyet: row.soLuongDuyet },
                              setFieldValue: (_f: string, v: any) =>
                                updateMaterial(row.id, { soLuongDuyet: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextFieldNumber
                            field="soLuongThuCu"
                            noBorder={true}
                            formik={{
                              values: { soLuongThuCu: row.soLuongThuCu },
                              setFieldValue: (_f: string, v: any) =>
                                updateMaterial(row.id, { soLuongThuCu: v }),
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              removeMaterialRow(row.id || row.idVatTu)
                            }
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
            <MaterialRequisitionPreview
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

export default MaterialRequisitionDialog;
