import { useEffect } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { Remove } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

import JobAssignmentPreview from "../preview/JobAssignmentPreview";
import FieldInput from "../../../../components/TextField/FieldInput";
import FieldDate from "../../../../components/TextField/FieldDate";
import TextFieldNumber from "../../../../components/TextField/TextFieldNumber";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { useJobAssignmentMutation } from "../../mutation";
import { JobAssignmentData } from "../../types";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { useAllToolDetailQuery } from "../../../ToolManager/Mutation";
import { listSigneInfo } from "../../config";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import { generateCode } from "../../../../utils/helpers";
import { PlanSigner } from "../../../../mockdata/mockPlans";
import { useAllPositionsQuery } from "../../../Position/Mutation";

interface Props {
  open: boolean;
  onClose: () => void;
  repairRequest?: any;
  initialData?: JobAssignmentData | null;
}

const JobAssignmentDialog = ({
  open,
  onClose,
  repairRequest,
  initialData,
}: Props) => {
  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const { data: apiPositions = [] } = useAllPositionsQuery();
  const { data: allToolDetail = [] } = useAllToolDetailQuery();
  const { createMutation, updateMutation } = useJobAssignmentMutation();

  const formik = useFormik({
    initialValues: {
      id: "",
      idSuaChua: repairRequest?.id || "",
      soPhieu: "",
      donViQuanLy: repairRequest?.donViQuanLy || "",
      caBatDau: 1,
      ngayBatDau: dayjs().format("YYYY-MM-DD"),
      caDuKien: 1,
      ngayDuKien: dayjs().add(3, "day").format("YYYY-MM-DD"),
      danhSachTaiSan: [] as any[],
      danhSachVatTu: [] as any[],
      nguoiKyList: [] as any[],
      idNguoiLap: "",
      idGiamDoc: "",
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
                idNguoiKy: s.userId,
                tenNguoiKy: s.userName,
                idPhongBan: s.departmentId,
                trangThai: 0,
              }))
          : [];

      const req: JobAssignmentData = {
        ...values,
        idNguoiLap: idNguoiLapBieu,
        idGiamDoc: idTrinhDuyetGiamDoc,
        nguoiKyList: intermediateSigners,
        ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        ngayCapNhat: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      };

      const draftId =
        initialData?.id || initialData?.idSuaChua || repairRequest?.id || "new";
      dispatch(
        updateTabFormData({
          path: tabPath,
          data: { [`jobAssignmentDraft_${draftId}`]: null },
        }),
      );

      if (initialData?.id) {
        updateMutation.mutate(req, {
          onSuccess: () => {
            formik.resetForm();
            onClose();
          },
        });
      } else {
        createMutation.mutate(req, {
          onSuccess: () => {
            formik.resetForm();
            onClose();
          },
        });
      }
    },
  });

  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t) => t.path === tabPath);
    const draftId =
      initialData?.id || initialData?.idSuaChua || repairRequest?.id || "new";
    return tab?.formData?.[`jobAssignmentDraft_${draftId}`] ?? null;
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

    if (repairRequest) {
      // Auto-fill from repairRequest
      const assetsList = (repairRequest?.danhSachTaiSan || []).map(
        (ts: any) => ({
          idSuaChuaChiTiet: ts.id,
          idTaiSan: ts.idTaiSan,
          tenTaiSan: ts.tenTaiSan,
          maCongViec: "",
          noiDung: `Bảo dưỡng ${ts.tenTaiSan || ""}`,
          nguoiThucHien: "",
        }),
      );

      const materialsList = (repairRequest?.danhSachVatTu || []).map(
        (vt: any) => ({
          idVatTu: vt.idVatTu,
          idChiTietVatTu: vt.idChiTietVatTu,
          tenVatTu: vt.tenVatTu,
          kyHieu: vt.kyHieu || "",
          donViTinh: vt.donViTinh || "",
          soLuong: vt.soLuong || 1,
          ghiChu: vt.ghiChu || "",
        }),
      );

      const signersList = listSigneInfo(
        repairRequest,
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

      formik.setValues({
        ...formik.initialValues,
        idSuaChua: repairRequest.id,
        donViQuanLy: repairRequest.donViQuanLy || "",
        danhSachTaiSan: assetsList,
        danhSachVatTu: materialsList,
        nguoiKyList: signersList,
      });
    }
  }, [
    open,
    initialData,
    repairRequest,
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
      soLuong: 1,
      ghiChu: "",
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
    const draftId =
      initialData?.id || initialData?.idSuaChua || repairRequest?.id || "new";
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`jobAssignmentDraft_${draftId}`]: null,
          lastMinimizedDialog: null,
        },
      }),
    );
    formik.resetForm();
    onClose();
  };

  const handleMinimize = () => {
    const draftId =
      initialData?.id || initialData?.idSuaChua || repairRequest?.id || "new";
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`jobAssignmentDraft_${draftId}`]: formik.values,
          lastMinimizedDialog: "jobAssignment",
        },
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
          Tạo Phiếu giao việc
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
                  Thông tin Phiếu giao việc
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FieldInput
                    title="Số phiếu"
                    field="soPhieu"
                    formik={formik}
                  />
                  <FieldAutoCompleted
                    data={apiDepartments}
                    labelkey="tenPhongBan"
                    labelOption="id"
                    title="Đơn vị quản lý"
                    field="donViQuanLy"
                    formik={formik}
                  />

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <FieldInput
                      title="Ca bắt đầu"
                      field="caBatDau"
                      formik={formik}
                      type="number"
                    />
                    <FieldDate
                      title="Ngày bắt đầu"
                      field="ngayBatDau"
                      formik={formik}
                    />
                  </Box>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <FieldInput
                      title="Ca dự kiến hoàn thành"
                      field="caDuKien"
                      formik={formik}
                      type="number"
                    />
                    <FieldDate
                      title="Ngày dự kiến hoàn thành"
                      field="ngayDuKien"
                      formik={formik}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box>
              <SignerWorkflowSection formik={formik} />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Nội dung công việc (Tài sản)
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>
                      STT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }}>
                      Mã công việc
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Nội dung công việc
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 300 }}>
                      Đại diện nhóm người TH
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(formik.values.danhSachTaiSan || []).map(
                    (item: any, rowIdx: number) => (
                      <TableRow key={item.id || item.idTaiSan || rowIdx}>
                        <TableCell sx={{ pl: 2 }}>{rowIdx + 1}</TableCell>
                        <TableCell>
                          <FieldInput
                            title=""
                            field={`danhSachTaiSan.${rowIdx}.maCongViec`}
                            formik={formik}
                            noBorder={true}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldInput
                            title=""
                            field={`danhSachTaiSan.${rowIdx}.noiDung`}
                            formik={formik}
                            noBorder={true}
                            multiline
                            rows={3}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldAutoCompleted
                            title=""
                            data={apiUsers}
                            labelkey="hoTen"
                            field={`danhSachTaiSan.${rowIdx}.nguoiThucHien`}
                            formik={formik}
                            noBorder={true}
                          />
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Vật tư
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>
                      STT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }}>
                      Mã vật tư
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tên vật tư</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }}>
                      Mã hiệu, quy cách
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 80 }}>
                      ĐVT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 80 }}>
                      Số lượng
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }}>
                      Ghi chú
                    </TableCell>
                    <TableCell sx={{ width: 40 }}>
                      <IconButton
                        size="small"
                        onClick={addMaterialRow}
                        color="primary"
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(formik.values.danhSachVatTu || []).map(
                    (item: any, rowIdx: number) => (
                      <TableRow key={item.id || item.idVatTu || rowIdx}>
                        <TableCell sx={{ pl: 2 }}>{rowIdx + 1}</TableCell>
                        <TableCell sx={{ width: "200px" }}>
                          <FieldAutoCompleted
                            title=""
                            data={allToolDetail}
                            labelkey="tenTaiSan"
                            labelOption="idTaiSan"
                            limitOptions={10}
                            value={item.idChiTietVatTu}
                            noBorder={true}
                            onChange={(value: any) => {
                              if (value) {
                                updateMaterial(item.id || item.idVatTu, {
                                  idChiTietVatTu: value.id,
                                  idVatTu: value.idTaiSan,
                                  tenVatTu: value.tenTaiSan,
                                  donViTinh: value.donViTinh,
                                  kyHieu: value.kyHieu,
                                });
                              } else {
                                updateMaterial(item.id || item.idVatTu, {
                                  idChiTietVatTu: "",
                                  idVatTu: "",
                                  tenVatTu: "",
                                  donViTinh: "",
                                });
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            maxWidth: "150px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.tenVatTu}
                        </TableCell>
                        <TableCell>
                          <FieldInput
                            title=""
                            field={`danhSachVatTu.${rowIdx}.kyHieu`}
                            formik={formik}
                            noBorder={true}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldInput
                            title=""
                            field={`danhSachVatTu.${rowIdx}.donViTinh`}
                            formik={formik}
                            noBorder={true}
                          />
                        </TableCell>
                        <TableCell>
                          <TextFieldNumber
                            title=""
                            field={`danhSachVatTu.${rowIdx}.soLuong`}
                            formik={formik}
                            noBorder={true}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldInput
                            title=""
                            field={`danhSachVatTu.${rowIdx}.ghiChu`}
                            formik={formik}
                            noBorder={true}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() =>
                              removeMaterialRow(item.id || item.idVatTu)
                            }
                            color="error"
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
            <JobAssignmentPreview
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
          variant="contained"
          color="primary"
          onClick={() => formik.handleSubmit()}
        >
          Lưu &amp; Gửi duyệt
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobAssignmentDialog;
