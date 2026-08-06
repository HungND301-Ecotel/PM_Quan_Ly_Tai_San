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
import { useMaintenanceAcceptanceTestVehicleMutation } from "../../mutation";
import {
  NghiemThuPhuongTienData,
  NghiemThuPhuongTienChiTietData,
  BienPhapPhuongTienChiTietData,
  VehicleInspectionRecordData,
} from "../../types";
import { CongTy, LOAI_BIEN_BAN_TYPE } from "../../../../utils/const";
import { generateCode } from "../../../../utils/helpers";
import { PlanSigner } from "../../../../mockdata/mockPlans";
import { listSigneInfo } from "../../config";
import dayjs from "dayjs";
import api from "../../../../config/api.config";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import { useAllToolDetailQuery } from "../../../ToolManager/Mutation";
import FieldInput from "../../../../components/TextField/FieldInput";
import TextFieldNumber from "../../../../components/TextField/TextFieldNumber";
import { BienPhapPhuongTienData } from "../../types";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import { AcceptanceVehicleValidation } from "../../validation";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { Remove } from "@mui/icons-material";
import AcceptanceVehiclePreview from "../preview/AcceptanceVehiclePreview";
import { useBienBanSuaChuaPageQuery } from "../../../RepairReport/Mutation";
import { currentBrandConfig } from "../../../../config/brandConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  initData?: NghiemThuPhuongTienData | null;
  bienPhap?: BienPhapPhuongTienData | null;
  inspectionRecord?: VehicleInspectionRecordData | null;
}

const NghiemThuPhuongTienDialog = ({
  open,
  onClose,
  initData,
  bienPhap,
  inspectionRecord,
}: Props) => {
  const { user } = useSelector((state: any) => state.user);
  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const { data: allToolDetail = [] } = useAllToolDetailQuery();

  const { createMutation, updateMutation } =
    useMaintenanceAcceptanceTestVehicleMutation();

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const draftId = bienPhap?.id || inspectionRecord?.id || "new";
  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return tab?.formData?.[`acceptanceVehicleDraft_${draftId}`] ?? null;
  });
  const [parentInspection, setParentInspection] = useState<any>(null);

  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(
      0,
      9999,
      "",
      LOAI_BIEN_BAN_TYPE.NGHIEM_THU_PHUONG_TIEN,
      true,
    );
  const mauMacDinh = repairReportPage?.data?.items?.[0];

  const initialValues: NghiemThuPhuongTienData & { nguoiKyList: any[] } = {
    id: "",
    idCongTy: CongTy.CT001,
    idBienPhapPhuongTien: bienPhap?.id || "",
    idGiamDinhPhuongTien: inspectionRecord?.id || "",
    idTaiSan: bienPhap?.idTaiSan || "",
    soPhieu: "",
    noiDung: "",
    tinhTrang: "",
    congViecPhatSinh: "",
    chiPhiNhanCong: 0,
    ketLuan: "Đảm bảo yêu cầu kỹ thuật đưa vào sử dụng",
    idNguoiLap: "",
    nguoiLapXacNhan: false,
    idGiamDoc: "",
    giamDocXacNhan: false,
    share: false,
    trangThai: 0,
    tenMauBienBan: mauMacDinh?.ten || "NGHIỆM THU SẢN PHẨM",
    congTy: mauMacDinh?.congTy || currentBrandConfig.company,
    danhSachChiTiet: [],
    nguoiKyList: [],
  };

  const formik = useFormik({
    initialValues,
    // validationSchema: AcceptanceVehicleValidation,
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

      const payload: NghiemThuPhuongTienData = {
        ...values,
        idNguoiLap,
        idGiamDoc,
        nguoiKyList,
        danhSachChiTiet: (values.danhSachChiTiet || []).map((item) => ({
          ...item,
          idNghiemThuPhuongTien: values.id || "",
          id: item.id || `${generateCode("NTPTCT-")}`,
        })),
        nguoiTao: user?.taiKhoan?.tenDangNhap,
        ngayTao: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        ngayCapNhat: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      };

      if (values.id) {
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
          initData.tenMauBienBan || mauMacDinh?.ten || "NGHIỆM THU SẢN PHẨM",
        congTy:
          initData.congTy || mauMacDinh?.congTy || currentBrandConfig.company,
        nguoiKyList: (listInfo ?? []).map((item: any) => ({
          userId: item.idNhanVien,
          userName: item.hoTen,
          departmentId: item.idDonVi,
          departmentName: item.donVi,
        })),
      } as any);
      return;
    }

    if (savedDraft) {
      formik.setValues({
        ...initialValues,
        idBienPhapPhuongTien: bienPhap?.id || "",
        idGiamDinhPhuongTien: inspectionRecord?.id || "",
        idTaiSan: bienPhap?.idTaiSan || "",
        soPhieu: savedDraft.soPhieu,
        noiDung: savedDraft.noiDung,
        tinhTrang: savedDraft.tinhTrang,
        congViecPhatSinh: savedDraft.congViecPhatSinh,
        chiPhiNhanCong: savedDraft.chiPhiNhanCong,
        ketLuan: savedDraft.ketLuan,
        tenMauBienBan: savedDraft.tenMauBienBan,
        congTy: savedDraft.congTy,
        danhSachChiTiet: savedDraft.danhSachChiTiet,
        nguoiKyList: savedDraft.nguoiKyList,
      });
      return;
    }

    const parentRecord = bienPhap || inspectionRecord;
    const listInfoFromParent = parentRecord
      ? listSigneInfo(parentRecord as any, apiUsers, apiDepartments)
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

    if (!bienPhap && inspectionRecord?.id) {
      formik.setValues({
        ...initialValues,
        idGiamDinhPhuongTien: inspectionRecord.id,
        nguoiKyList: signersListFromParent,
      });
      api
        .get(`/giamdinh-phuongtien/${inspectionRecord.id}`)
        .then((res) => {
          const data = res.data?.data || res.data;
          setParentInspection(data);
          formik.setFieldValue("idTaiSan", data.idTaiSan || "");
          formik.setFieldValue("tenTaiSan", data.tenTaiSan || "");
          formik.setFieldValue("soPhieu", `NT-${data.soPhieu || ""}`);
          if (data.danhSachChiTiet) {
            const mappedDetails = data.danhSachChiTiet.map((item: any) => ({
              id: "",
              idNghiemThuPhuongTien: "",
              idVatTu: item.idVatTu || "",
              idChiTietVatTu: item.idChiTietVatTu || "",
              tenVatTu: item.tenVatTu || "",
              donViTinh: item.donViTinh || "Cái",
              soLuongThayThe:
                item.soLuongSuaChua ?? item.soLuongThayMoi ?? item.soLuong ?? 1,
              soLuongThuHoi: item.soLuongThayMoi ?? 0,
              phanTramConLai: 0,
              bienPhapXuLy: "",
              ghiChu: "",
            }));
            formik.setFieldValue("danhSachChiTiet", mappedDetails);
          }
        })
        .catch((err) => console.error(err));
      return;
    }

    formik.setValues({
      ...initialValues,
      idBienPhapPhuongTien: bienPhap?.id || "",
      idGiamDinhPhuongTien: inspectionRecord?.id || "",
      idTaiSan: bienPhap?.idTaiSan || "",
      nguoiKyList: signersListFromParent,
      danhSachChiTiet: (bienPhap?.danhSachChiTiet || []).map(
        (item: BienPhapPhuongTienChiTietData) => ({
          idChiTietVatTu: item.idChiTietVatTu,
          idVatTu: item.idVatTu,
          soLuongThayThe: item.soLuongCap,
          soLuongThuHoi: item.soLuongThuHoi,
          phanTramConLai: 0,
          bienPhapXuLy: "",
          ghiChu: "",
          donViTinh: item.donViTinh,
        }),
      ),
    });
  }, [
    open,
    initData,
    bienPhap,
    apiUsers,
    apiDepartments,
    savedDraft,
    savedDraft,
    inspectionRecord,
  ]);

  function handleClose() {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`acceptanceVehicleDraft_${draftId}`]: null,
          lastMinimizedDialog: null,
        },
      }),
    );
    formik.resetForm();
    onClose();
  }

  function handleMinimize() {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`acceptanceVehicleDraft_${draftId}`]: {
            idBienPhapPhuongTien: bienPhap?.id || "",
            idGiamDinhPhuongTien: formik.values.idGiamDinhPhuongTien,
            soPhieu: formik.values.soPhieu,
            noiDung: formik.values.noiDung,
            tinhTrang: formik.values.tinhTrang,
            congViecPhatSinh: formik.values.congViecPhatSinh,
            chiPhiNhanCong: formik.values.chiPhiNhanCong,
            ketLuan: formik.values.ketLuan,
            tenMauBienBan:
              formik.values.tenMauBienBan ||
              mauMacDinh?.ten ||
              "NGHIỆM THU SẢN PHẨM",
            congTy:
              formik.values.congTy ||
              mauMacDinh?.congTy ||
              currentBrandConfig.company,
            danhSachChiTiet: formik.values.danhSachChiTiet,
            nguoiKyList: formik.values.nguoiKyList,
          },
          lastMinimizedDialog: "acceptanceVehicle",
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
        idNghiemThuPhuongTien: formik.values.id || "",
        idVatTu: "",
        idChiTietVatTu: "",
        tenVatTu: "",
        donViTinh: "Cái",
        soLuongThayThe: 1,
        soLuongThuHoi: 0,
        phanTramConLai: 0,
        bienPhapXuLy: "Nhập kho tái sử dụng",
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
    formik.setFieldValue(`danhSachChiTiet.${index}.${field}`, value);
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
                Nghiệm thu sửa chữa phương tiện
              </Typography>
              {bienPhap && (
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.85)" }}
                >
                  Căn cứ Biện pháp: {bienPhap.soBienBan} • Thiết bị:{" "}
                  {bienPhap.tenTaiSan}
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
              gridTemplateColumns: "1fr 380px",
              gap: 3,
              // height: "100%",
            }}
          >
            {/* ── LEFT COLUMN: Input Fields and Materials Table ── */}
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
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <FieldInput title="Số phiếu" name="soPhieu" />
                    <TextFieldNumber
                      title="Chi phí nhân công"
                      name="chiPhiNhanCong"
                    />
                  </Box>
                  <FieldInput
                    title="Nội dung"
                    name="noiDung"
                    multiline
                    rows={2}
                  />
                  <FieldInput
                    title="Tình trạng sau sửa chữa"
                    name="tinhTrang"
                    multiline
                    rows={2}
                  />
                  <FieldInput
                    title="Công việc phát sinh"
                    name="congViecPhatSinh"
                    multiline
                    rows={2}
                  />

                  <FieldInput
                    title="Kết luận nghiệm thu"
                    name="ketLuan"
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
              mt: 5,
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
                Chi phí vật tư, phụ tùng
              </Typography>
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
                    <TableCell sx={{ minWidth: 180 }}>
                      Tên vật tư, phụ tùng
                    </TableCell>
                    <TableCell width={100}>ĐVT</TableCell>
                    <TableCell width={100}>Thay thế</TableCell>
                    <TableCell width={100}>Thu hồi</TableCell>
                    <TableCell width={100}>% còn lại</TableCell>
                    <TableCell width={150}>Biện pháp xử lý</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell align="center" width={50}>
                      <IconButton onClick={handleAddMaterial}>
                        <AddIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(formik.values.danhSachChiTiet || []).length > 0 ? (
                    (formik.values.danhSachChiTiet || []).map(
                      (vt: NghiemThuPhuongTienChiTietData, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell align="center">{idx + 1}</TableCell>
                          <TableCell>
                            <FieldAutoCompleted
                              title=""
                              name={`danhSachChiTiet.${idx}.idChiTietVatTu`}
                              onChange={(newValue: any) => {
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
                                    ? String(newValue.donViTinh || "")
                                    : "",
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
                              name={`danhSachChiTiet.${idx}.donViTinh`}
                              title=""
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              name={`danhSachChiTiet.${idx}.soLuongThayThe`}
                              title=""
                              noBorder={true}
                              type="number"
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              name={`danhSachChiTiet.${idx}.soLuongThuHoi`}
                              title=""
                              noBorder={true}
                              type="number"
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              name={`danhSachChiTiet.${idx}.phanTramConLai`}
                              title=""
                              noBorder={true}
                              type="number"
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              name={`danhSachChiTiet.${idx}.bienPhapXuLy`}
                              title=""
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              name={`danhSachChiTiet.${idx}.ghiChu`}
                              title=""
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
                        colSpan={9}
                        align="center"
                        sx={{ py: 3, color: "text.secondary" }}
                      >
                        Chưa có vật tư. Nhấn "+" để thêm mới.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Preview */}
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="primary.main"
              mb={1.5}
            >
              Xem trước biên bản
            </Typography>
            <AcceptanceVehiclePreview
              row={{
                ...formik.values,
                tenTaiSan: bienPhap?.tenTaiSan || inspectionRecord?.tenTaiSan,
                nguoiKyList: formik.values.nguoiKyList,
              }}
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
                : "Tạo nghiệm thu"}
          </Button>
        </DialogActions>
      </Dialog>
    </FormikProvider>
  );
};

export default NghiemThuPhuongTienDialog;
