import React, { useState, useEffect } from "react";
import { FormikProvider, useFormik } from "formik";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSelector } from "react-redux";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { useBienPhapPhuongTienMutation } from "../../mutation/VehicleMeasure";
import {
  BienPhapPhuongTienData,
  BienPhapPhuongTienChiTietData,
  VehicleInspectionRecordData,
} from "../../types";
import { CongTy, LOAI_BIEN_BAN_TYPE } from "../../../../utils/const";
import { generateCode } from "../../../../utils/helpers";
import { PlanSigner } from "../../../../mockdata/mockPlans";
import { listSigneInfo } from "../../config";
import dayjs from "dayjs";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import { useAllToolDetailQuery } from "../../../ToolManager/Mutation";
import api from "../../../../config/api.config";
import FieldInput from "../../../../components/TextField/FieldInput";
import FieldDate from "../../../../components/TextField/FieldDate";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import { VehicleMeasuresValidation } from "../../validation";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { Remove } from "@mui/icons-material";
import MeasureVehiclePreview from "../preview/MeasureVehiclePreview";
import { useBienBanSuaChuaPageQuery } from "../../../RepairReport/Mutation";
import { currentBrandConfig } from "../../../../config/brandConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  inspectionRecord?: VehicleInspectionRecordData | null;
  initData?: BienPhapPhuongTienData | null;
}

const BienPhapPhuongTienDialog = ({
  open,
  onClose,
  inspectionRecord,
  initData,
}: Props) => {
  const { user } = useSelector((state: any) => state.user);
  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const { data: allToolDetail = [] } = useAllToolDetailQuery();
  const { createMutation, updateMutation } = useBienPhapPhuongTienMutation();

  const [parentInspection, setParentInspection] = useState<any>(null);

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return (
      tab?.formData?.[`bienPhapPhuongTienDraft_${inspectionRecord?.id}`] ?? null
    );
  });

  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(
      0,
      9999,
      "",
      LOAI_BIEN_BAN_TYPE.BIEN_PHAP_PHUONG_TIEN,
      true,
    );
  const mauMacDinh = repairReportPage?.data?.items?.[0];

  const initialValues: BienPhapPhuongTienData & { nguoiKyList: any[] } = {
    id: "",
    idCongTy: CongTy.CT001,
    idGiamDinhPhuongTien: inspectionRecord?.id || "",
    soBienBan: "",
    idTaiSan: "",
    mucDich: "",
    yeuCau: "",
    tinhTrangHienTai: "",
    noiDungThucHien: "",
    tienDoTuNgay: dayjs().format("YYYY-MM-DD"),
    tienDoDenNgay: dayjs().format("YYYY-MM-DD"),
    bienPhapAnToan: "",
    idNguoiLap: "",
    nguoiLapXacNhan: false,
    idGiamDoc: "",
    giamDocXacNhan: false,
    share: false,
    trangThai: 0,
    donViQuanLy: "",
    tenMauBienBan: mauMacDinh?.ten || "BIỆN PHÁP SỬA CHỮA THIẾT BỊ",
    congTy: mauMacDinh?.congTy || currentBrandConfig.company,
    danhSachChiTiet: [],
    nguoiKyList: [],
  };

  const formik = useFormik({
    initialValues,
    // validationSchema: VehicleMeasuresValidation,
    onSubmit: async (values) => {
      const list: any[] = values.nguoiKyList ?? [];
      const idNguoiLap = list.length > 0 ? list[0].userId : "";
      const idGiamDoc = list.length > 1 ? list[list.length - 1].userId : "";
      const nguoiKyList =
        list.length > 2
          ? list.slice(1, -1).map((s: PlanSigner, idx: number) => ({
              id: `${generateCode("SIG-")}-${idx}`,
              idNguoiKy: s.userId,
              tenNguoiKy: s.userName,
              idPhongBan: s.departmentId,
              trangThai: 0,
            }))
          : [];

      const payload: BienPhapPhuongTienData = {
        ...values,
        idNguoiLap,
        idGiamDoc,
        tenMauBienBan: values.tenMauBienBan,
        congTy: values.congTy,
        nguoiKyList,
        danhSachChiTiet: (values.danhSachChiTiet || []).map((item) => ({
          ...item,
          idBienPhap: values.id || "",
          id: item.id || `${generateCode("BPPTCT-")}`,
        })),
        nguoiTao: user?.taiKhoan?.tenDangNhap,
        ngayTao: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        ngayCapNhat: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      };

      if (initData?.id) {
        updateMutation.mutate(payload, { onSuccess: handleClose });
      } else {
        createMutation.mutate(payload, { onSuccess: handleClose });
      }
    },
  });

  useEffect(() => {
    if (!open) return;

    if (initData) {
      const listInfo = listSigneInfo(initData as any, apiUsers, apiDepartments);
      formik.setValues({
        ...initData,
        tenMauBienBan:
          initData?.tenMauBienBan ||
          mauMacDinh?.ten ||
          "BIỆN PHÁP SỬA CHỮA THIẾT BỊ",
        congTy:
          initData?.congTy || mauMacDinh?.congTy || currentBrandConfig.company,
        nguoiKyList: (listInfo ?? []).map((item: any) => ({
          userId: item.idNhanVien,
          userName: item.hoTen,
          departmentId: item.idDonVi,
          departmentName: item.donVi,
        })),
      } as any);

      if (initData.idGiamDinhPhuongTien) {
        api
          .get(`/giamdinh-phuongtien/${initData.idGiamDinhPhuongTien}`)
          .then((res) => setParentInspection(res.data?.data || res.data))
          .catch((err) => console.error(err));
      }
      return;
    }

    const listInfoFromParent = inspectionRecord
      ? listSigneInfo(inspectionRecord, apiUsers, apiDepartments)
      : [];
    const signersListFromParent = (listInfoFromParent || []).map(
      (item: any, idx: number) => ({
        ...item,
        userId: item.idNhanVien || item.userId,
        userName: item.hoTen || item.userName,
        departmentId: item.idDonVi || item.departmentId,
        departmentName: item.donVi || item.departmentName,
        position: item.tenChucVu || item.position || "",
        order: idx + 1,
      }),
    );

    if (savedDraft) {
      formik.setValues({
        ...initialValues,
        idGiamDinhPhuongTien: inspectionRecord?.id || "",
        soBienBan: savedDraft.soBienBan,
        donViQuanLy: savedDraft.donViQuanLy,
        tienDoTuNgay: savedDraft.tienDoTuNgay,
        tienDoDenNgay: savedDraft.tienDoDenNgay,
        mucDich: savedDraft.mucDich,
        yeuCau: savedDraft.yeuCau,
        tinhTrangHienTai: savedDraft.tinhTrangHienTai,
        noiDungThucHien: savedDraft.noiDungThucHien,
        bienPhapAnToan: savedDraft.bienPhapAnToan,
        idTaiSan: savedDraft.idTaiSan,
        danhSachChiTiet: savedDraft.danhSachChiTiet,
        nguoiKyList: savedDraft.nguoiKyList,
      });
      if (inspectionRecord?.id) {
        api
          .get(`/giamdinh-phuongtien/${inspectionRecord.id}`)
          .then((res) => setParentInspection(res.data?.data || res.data))
          .catch((err) => console.error(err));
      }
      return;
    }

    formik.setValues({
      ...initialValues,
      idGiamDinhPhuongTien: inspectionRecord?.id || "",
      nguoiKyList: signersListFromParent,
    });
    if (inspectionRecord?.id) {
      api
        .get(`/giamdinh-phuongtien/${inspectionRecord.id}`)
        .then((res) => {
          const data = res.data?.data || res.data;
          setParentInspection(data);
          formik.setFieldValue("idTaiSan", data.idTaiSan || "");
          formik.setFieldValue("tenTaiSan", data.tenTaiSan || "");
          formik.setFieldValue("soBienBan", `BP-${data.soPhieu || ""}`);
          formik.setFieldValue(
            "donViQuanLy",
            data.donViSuaChua ||
              data.tenDonVi ||
              data.donViQuanLy ||
              "Xưởng cơ giới",
          );
          if (data.danhSachChiTiet) {
            const mappedDetails = data.danhSachChiTiet.map((item: any) => ({
              id: "",
              idBienPhap: "",
              idVatTu: item.idVatTu || "",
              idChiTietVatTu: item.idChiTietVatTu || "",
              tenVatTu: item.tenVatTu || "",
              donViTinh: item.donViTinh || "Cái",
              soLuongCap:
                item.soLuongSuaChua || item.soLuongThayMoi || item.soLuong || 1,
              soLuongThuHoi: item.soLuongThayMoi || 0,
              ghiChu: item.ghiChu || "",
            }));
            formik.setFieldValue("danhSachChiTiet", mappedDetails);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [open, initData, inspectionRecord, apiUsers, apiDepartments, savedDraft]);

  function handleClose() {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`bienPhapPhuongTienDraft_${inspectionRecord?.id}`]: null,
          lastMinimizedDialog: null,
        },
      }),
    );
    setParentInspection(null);
    formik.resetForm();
    onClose();
  }
  function handleMinimize() {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`bienPhapPhuongTienDraft_${inspectionRecord?.id}`]: {
            idGiamDinhPhuongTien: formik.values.idGiamDinhPhuongTien,
            soBienBan: formik.values.soBienBan,
            donViQuanLy: formik.values.donViQuanLy,
            tienDoTuNgay: formik.values.tienDoTuNgay,
            tienDoDenNgay: formik.values.tienDoDenNgay,
            mucDich: formik.values.mucDich,
            yeuCau: formik.values.yeuCau,
            tinhTrangHienTai: formik.values.tinhTrangHienTai,
            noiDungThucHien: formik.values.noiDungThucHien,
            bienPhapAnToan: formik.values.bienPhapAnToan,
            idTaiSan: formik.values.idTaiSan,
            tenMauBienBan: formik.values.tenMauBienBan,
            congTy: formik.values.congTy,
            danhSachChiTiet: formik.values.danhSachChiTiet,
            nguoiKyList: formik.values.nguoiKyList,
          },
          lastMinimizedDialog: "bienPhapPhuongTien",
        },
      }),
    );
    onClose();
  }

  const handleAddMaterial = () => {
    formik.setFieldValue("danhSachChiTiet", [
      ...(formik.values.danhSachChiTiet || []),
      {
        id: "",
        idBienPhap: formik.values.id || "",
        idVatTu: "",
        idChiTietVatTu: "",
        tenVatTu: "",
        donViTinh: "Cái",
        soLuongCap: 1,
        soLuongThuHoi: 0,
        ghiChu: "",
      },
    ]);
  };

  const handleRemoveMaterial = (index: number) => {
    const list = [...(formik.values.danhSachChiTiet || [])];
    list.splice(index, 1);
    formik.setFieldValue("danhSachChiTiet", list);
  };

  const updateMaterialField = (index: number, field: string, value: any) => {
    const list = [...(formik.values.danhSachChiTiet || [])];
    list[index] = { ...list[index], [field]: value };
    formik.setFieldValue("danhSachChiTiet", list);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <FormikProvider value={formik}>
      <Dialog
        open={open}
        onClose={handleMinimize}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: "90vh", borderRadius: 3 } }}
      >
        {/* Header Title */}
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1.5,
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <BuildIcon />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Biên pháp sửa chữa phương tiện
              </Typography>
              {parentInspection && (
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.85)" }}
                >
                  Căn cứ BB giám định: {parentInspection.soPhieu} • Thiết bị:{" "}
                  {parentInspection.tenTaiSan}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleMinimize}
              sx={{ color: "white" }}
            >
              <Remove />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: "white" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, overflow: "auto", bgcolor: "grey.50" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 400px",
              gap: 3,
              // height: "100%",
            }}
          >
            {/* ── LEFT COLUMN: Input Fields and Parts Table ── */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
                overflowY: "auto",
                pr: 1,
              }}
            >
              {/* General Info Card */}
              <Box
                sx={{
                  bgcolor: "white",
                  border: "1px solid",
                  borderColor: "grey.200",
                  borderRadius: 3,
                  p: 2.5,
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color="primary.main"
                  mb={2}
                >
                  Thông tin chung
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                    }}
                  >
                    <FieldInput title="Số biên bản" name="soBienBan" />
                    <FieldAutoCompleted
                      title="Đơn vị quản lý"
                      name="donViQuanLy"
                      data={apiDepartments}
                      labelkey="tenPhongBan"
                      value={
                        apiDepartments.find(
                          (d: any) =>
                            d.tenPhongBan === formik.values.donViQuanLy ||
                            d.id === formik.values.donViQuanLy,
                        ) || null
                      }
                      onChange={(newValue: any) => {
                        formik.setFieldValue(
                          "donViQuanLy",
                          newValue ? newValue.tenPhongBan : "",
                        );
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                    }}
                  >
                    <FieldDate title="Tiến độ từ ngày" name="tienDoTuNgay" />
                    <FieldDate title="Tiến độ đến ngày" name="tienDoDenNgay" />
                  </Box>

                  <FieldInput
                    title="Mục đích thực hiện"
                    name="mucDich"
                    multiline
                    rows={2}
                  />
                  <FieldInput
                    title="Yêu cầu kỹ thuật"
                    name="yeuCau"
                    multiline
                    rows={2}
                  />

                  <FieldInput
                    title="Tình trạng hiện tại"
                    name="tinhTrangHienTai"
                    multiline
                    rows={2}
                  />

                  <FieldInput
                    title="Nội dung thực hiện"
                    name="noiDungThucHien"
                    multiline
                    rows={2}
                  />

                  <FieldInput
                    title="Biện pháp an toàn lao động"
                    name="bienPhapAnToan"
                    multiline
                    rows={2}
                  />
                </Box>
              </Box>
            </Box>

            {/* ── RIGHT COLUMN: Approval Workflow ── */}
            <Box>
              <SignerWorkflowSection formik={formik} />
            </Box>
          </Box>
          {/* Materials/Parts Table Card */}
          <Box
            sx={{
              bgcolor: "white",
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 3,
              p: 2.5,
              boxShadow: "0px 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="primary.main"
              >
                Danh sách vật tư, phụ tùng yêu cầu
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                size="small"
                onClick={handleAddMaterial}
              >
                Thêm dòng
              </Button>
            </Box>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell align="center" width={50}>
                      STT
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      Tên vật tư, phụ tùng
                    </TableCell>
                    <TableCell width={100}>ĐVT</TableCell>
                    <TableCell width={120}>Số lượng cấp</TableCell>
                    <TableCell width={120}>Thu hồi</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell align="center" width={60}>
                      Xóa
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(formik.values.danhSachChiTiet || []).length > 0 ? (
                    (formik.values.danhSachChiTiet || []).map(
                      (vt: BienPhapPhuongTienChiTietData, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell align="center">{idx + 1}</TableCell>
                          <TableCell>
                            <FieldAutoCompleted
                              title=""
                              name={`danhSachChiTiet.${idx}.idChiTietVatTu`}
                              value={
                                allToolDetail.find(
                                  (t: any) =>
                                    String(t.id) === vt.idChiTietVatTu,
                                ) || null
                              }
                              onChange={(newValue: any) => {
                                updateMaterialField(
                                  idx,
                                  "idChiTietVatTu",
                                  newValue ? String(newValue.id) : "",
                                );
                                updateMaterialField(
                                  idx,
                                  "idVatTu",
                                  newValue
                                    ? String(
                                        newValue.idTaiSan ||
                                          newValue.idVatTu ||
                                          "",
                                      )
                                    : "",
                                );
                                updateMaterialField(
                                  idx,
                                  "tenVatTu",
                                  newValue
                                    ? String(newValue.tenTaiSan || "")
                                    : "",
                                );
                                updateMaterialField(
                                  idx,
                                  "donViTinh",
                                  newValue
                                    ? String(newValue.donViTinh || "Cái")
                                    : "Cái",
                                );
                              }}
                              data={allToolDetail}
                              labelkey="tenTaiSan"
                              labelOption="idTaiSan"
                              limitOptions={20}
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              title=""
                              name={`danhSachChiTiet.${idx}.donViTinh`}
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              type="number"
                              title=""
                              name={`danhSachChiTiet.${idx}.soLuongCap`}
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              type="number"
                              title=""
                              name={`danhSachChiTiet.${idx}.soLuongThuHoi`}
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              title="Ghi chú"
                              name={`danhSachChiTiet.${idx}.ghiChu`}
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveMaterial(idx)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        align="center"
                        sx={{ py: 3, color: "text.secondary" }}
                      >
                        Chưa có vật tư yêu cầu. Nhấn "Thêm dòng" để thêm mới.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box mt={4}>
            <MeasureVehiclePreview
              row={formik.values}
              tieude={formik.values.tenMauBienBan}
              congty={formik.values.congTy}
            />
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1, bgcolor: "grey.100" }}>
          <Button onClick={handleClose} color="inherit">
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={isPending}
            onClick={() => formik.submitForm()}
            sx={{ px: 3, fontWeight: 700 }}
          >
            {isPending
              ? "Đang lưu..."
              : initData?.id
                ? "Cập nhật"
                : "Tạo biện pháp"}
          </Button>
        </DialogActions>
      </Dialog>
    </FormikProvider>
  );
};

export default BienPhapPhuongTienDialog;
