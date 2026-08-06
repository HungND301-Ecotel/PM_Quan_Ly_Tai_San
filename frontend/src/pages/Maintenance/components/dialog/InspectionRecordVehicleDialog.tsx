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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Chip,
  IconButton,
  Grid,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSelector } from "react-redux";
import {
  MaintenancePlanData,
  VehicleInspectionRecordData,
  VehicleInspectionRecordDetailData,
} from "../../types";
import { IncidentInspectionData, MaintenanceRepairData } from "../../types";
import { useMaintenanceVehicleInspectionMutation } from "../../mutation";
import {
  CongTy,
  LOAI_BIEN_BAN_TYPE,
  TypeBienBan,
} from "../../../../utils/const";
import { generateCode } from "../../../../utils/helpers";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { PlanSigner } from "../../../../mockdata/mockPlans";
import dayjs from "dayjs";
import FieldDate from "../../../../components/TextField/FieldDate";
import { useAllToolDetailQuery } from "../../../ToolManager/Mutation";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import { listSigneInfo } from "../../config";
import FieldInput from "../../../../components/TextField/FieldInput";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import InspectionRecordVehiclePreview from "../preview/InspectionRecordVehiclePreview";
import { VehicleInspectionValidation } from "../../validation";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { Remove } from "@mui/icons-material";
import { useBienBanSuaChuaPageQuery } from "../../../RepairReport/Mutation";
import { currentBrandConfig } from "../../../../config/brandConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  plan?: MaintenancePlanData | null;
  repairRequest: MaintenanceRepairData | null;
  incidentInspection?: IncidentInspectionData;
  initData?: VehicleInspectionRecordData | null;
}

const InspectionRecordVehicleDialog = ({
  open,
  onClose,
  plan,
  repairRequest,
  incidentInspection,
  initData,
}: Props) => {
  const { user } = useSelector((state: any) => state.user);

  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const { data: allToolDetail = [] } = useAllToolDetailQuery();

  const { createMutation, updateMutation } =
    useMaintenanceVehicleInspectionMutation();

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const idBienBan = incidentInspection?.id || repairRequest?.id || "";

  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return tab?.formData?.[`inspectionVehicleDraft_${idBienBan}`] ?? null;
  });

  const parentAsset =
    incidentInspection?.danhSachChiTiet?.[0] ||
    repairRequest?.danhSachTaiSan?.[0];

  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(
      0,
      9999,
      "",
      LOAI_BIEN_BAN_TYPE.GIAM_DINH_PHUONG_TIEN,
      true,
    );
  const mauMacDinh = repairReportPage?.data?.items?.[0];

  const formik = useFormik({
    initialValues: {
      id: "",
      idCongTy: CongTy.CT001,
      idBienBan: incidentInspection?.id || repairRequest?.id || "",
      loaiBienBan: incidentInspection
        ? TypeBienBan.SU_CO
        : TypeBienBan.SUA_CHUA,
      soPhieu: "",
      ngayGiamDinh: dayjs().format("YYYY-MM-DD"),
      viTri: "",
      capBaoDuong: "",
      donViSuaChua: "",
      noiDungKhac: "",
      idTaiSan: parentAsset?.idTaiSan || "",
      tenTaiSan: parentAsset?.tenTaiSan || "",
      tinhTrang: "",
      share: false,
      trangThai: 0,
      tenMauBienBan:
        mauMacDinh?.ten ||
        `BIÊN BẢN GIÁM ĐỊNH KỸ THUẬT VÀ BÀN GIAO THIẾT BỊ ĐƯA VÀO SỬA CHỮA`,
      congTy: mauMacDinh?.congTy || currentBrandConfig.company,
      danhSachChiTiet: [] as VehicleInspectionRecordDetailData[],
      nguoiKyList: [] as any[],
    },
    // validationSchema: VehicleInspectionValidation,
    onSubmit: (values) => {
      if (hasValidationError()) return;
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

      const record: any = {
        id: values.id,
        idBienBan: values.idBienBan,
        loaiBienBan: values.loaiBienBan,
        idCongTy: values.idCongTy,
        soPhieu: values.soPhieu,
        ngayGiamDinh: values.ngayGiamDinh,
        viTri: values.viTri,
        capBaoDuong: values.capBaoDuong,
        donViSuaChua: values.donViSuaChua,
        noiDungKhac: values.noiDungKhac,
        idTaiSan: values.idTaiSan,
        tinhTrang: values.tinhTrang,
        idNguoiLap: idNguoiLapBieu,
        nguoiLapXacNhan: false,
        idGiamDoc: idTrinhDuyetGiamDoc,
        giamDocXacNhan: false,
        trangThai: 0,
        share: false,
        tenMauBienBan: values.tenMauBienBan,
        congTy: values.congTy,
        danhSachChiTiet: values.danhSachChiTiet.map((e) => {
          const actualDetailId = e.id ? e.id : generateCode("GDPTCT_");
          return {
            id: actualDetailId,
            idGiamDinhPhuongTien: values.id,
            idVatTu: e.idVatTu,
            idChiTietVatTu: e.idChiTietVatTu,
            soLuong: e.soLuong,
            tinhTrang: e.tinhTrang,
            soLuongSuaChua: e.soLuongSuaChua,
            soLuongThayMoi: e.soLuongThayMoi,
            ghiChu: e.ghiChu,
          };
        }),
        nguoiKyList: intermediateSigners,
      };

      if (initData) {
        updateMutation.mutateAsync(record).then(() => handleClose());
      } else {
        createMutation.mutateAsync(record).then(() => handleClose());
      }
    },
  });

  useEffect(() => {
    if (!open) return;

    if (initData) {
      const listInfo = listSigneInfo(initData, apiUsers, apiDepartments);
      formik.setValues({
        id: initData.id ?? "",
        idCongTy: initData.idCongTy ?? CongTy.CT001,
        idBienBan: initData.idBienBan ?? "",
        loaiBienBan: initData.loaiBienBan ?? "",
        soPhieu: initData.soPhieu ?? "",
        ngayGiamDinh: initData.ngayGiamDinh ?? "",
        viTri: initData.viTri ?? "",
        capBaoDuong: initData.capBaoDuong ?? "",
        donViSuaChua: initData.donViSuaChua ?? "",
        noiDungKhac: initData.noiDungKhac ?? "",
        idTaiSan: initData.idTaiSan ?? "",
        tenTaiSan: initData.tenTaiSan ?? "",
        tinhTrang: initData.tinhTrang ?? "",
        share: initData.share ?? false,
        trangThai: initData.trangThai ?? 0,
        tenMauBienBan:
          initData.tenMauBienBan ??
          mauMacDinh?.ten ??
          `BIÊN BẢN GIÁM ĐỊNH KỸ THUẬT VÀ BÀN GIAO THIẾT BỊ ĐƯA VÀO SỬA CHỮA`,
        congTy:
          initData.congTy ?? mauMacDinh?.congTy ?? currentBrandConfig.company,
        danhSachChiTiet: (initData.danhSachChiTiet ??
          []) as VehicleInspectionRecordDetailData[],
        nguoiKyList: (listInfo ?? []).map((item: any) => ({
          userId: item.idNhanVien,
          userName: item.hoTen,
          departmentId: item.idDonVi,
          departmentName: item.donVi,
        })),
      });
      return;
    }

    if (savedDraft) {
      formik.setValues({
        id: "",
        idCongTy: CongTy.CT001,
        idBienBan,
        loaiBienBan: incidentInspection
          ? TypeBienBan.SU_CO
          : TypeBienBan.SUA_CHUA,
        soPhieu: savedDraft.soPhieu,
        ngayGiamDinh: savedDraft.ngayGiamDinh,
        viTri: savedDraft.viTri,
        capBaoDuong: savedDraft.capBaoDuong,
        donViSuaChua: savedDraft.donViSuaChua,
        noiDungKhac: savedDraft.noiDungKhac,
        idTaiSan: parentAsset?.idTaiSan || "",
        tenTaiSan: parentAsset?.tenTaiSan || "",
        tinhTrang: savedDraft.tinhTrang,
        share: false,
        trangThai: 0,
        tenMauBienBan: savedDraft.tenMauBienBan,
        congTy: savedDraft.congTy,
        danhSachChiTiet: savedDraft.danhSachChiTiet,
        nguoiKyList: savedDraft.nguoiKyList,
      });
      return;
    }

    const parentRecord = incidentInspection || repairRequest;
    const listInfoFromParent = parentRecord
      ? listSigneInfo(parentRecord, apiUsers, apiDepartments)
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

    formik.setValues({
      id: "",
      idCongTy: CongTy.CT001,
      idBienBan,
      loaiBienBan: incidentInspection
        ? TypeBienBan.SU_CO
        : TypeBienBan.SUA_CHUA,
      soPhieu: "",
      ngayGiamDinh: dayjs().format("YYYY-MM-DD"),
      viTri: "",
      capBaoDuong: "",
      donViSuaChua: "",
      noiDungKhac: "",
      idTaiSan: parentAsset?.idTaiSan || "",
      tenTaiSan: parentAsset?.tenTaiSan || "",
      tinhTrang: "",
      share: false,
      trangThai: 0,
      tenMauBienBan:
        mauMacDinh?.ten ||
        `BIÊN BẢN GIÁM ĐỊNH KỸ THUẬT VÀ BÀN GIAO THIẾT BỊ ĐƯA VÀO SỬA CHỮA`,
      congTy: mauMacDinh?.congTy || currentBrandConfig.company,
      danhSachChiTiet: [] as VehicleInspectionRecordDetailData[],
      nguoiKyList: signersListFromParent,
    });
  }, [
    open,
    initData,
    idBienBan,
    apiUsers,
    apiDepartments,
    savedDraft,
    incidentInspection,
    parentAsset,
  ]);

  const addMaterialRow = () => {
    const newMaterial: VehicleInspectionRecordDetailData = {
      id: "GDPTCT_" + Math.random().toString(36).substr(2, 9),
      idGiamDinhPhuongTien: formik.values.id,
      idVatTu: "",
      idChiTietVatTu: "",
      soLuong: 0,
      tinhTrang: "",
      soLuongSuaChua: 0,
      soLuongThayMoi: 0,
      ghiChu: "",
      tenVatTu: "",
      donViTinh: "",
    };
    formik.setFieldValue("danhSachChiTiet", [
      ...formik.values.danhSachChiTiet,
      newMaterial,
    ]);
  };

  const removeMaterialRow = (materialId: string) => {
    const updated = formik.values.danhSachChiTiet.filter(
      (e) => e.id !== materialId,
    );
    formik.setFieldValue("danhSachChiTiet", updated);
  };

  const updateMaterialField = (
    materialId: string,
    fieldOrChanges:
      | keyof VehicleInspectionRecordDetailData
      | Partial<VehicleInspectionRecordDetailData>,
    value?: any,
  ) => {
    const updated = formik.values.danhSachChiTiet.map((e) => {
      if (e.id === materialId) {
        if (typeof fieldOrChanges === "string") {
          return { ...e, [fieldOrChanges]: value };
        } else {
          return { ...e, ...fieldOrChanges };
        }
      }
      return e;
    });
    formik.setFieldValue("danhSachChiTiet", updated);
  };

  function hasValidationError() {
    for (const vt of formik.values.danhSachChiTiet) {
      const soLuong = vt.soLuong || 0;
      const suaChua = vt.soLuongSuaChua || 0;
      const thayMoi = vt.soLuongThayMoi || 0;
      if (suaChua + thayMoi > soLuong) {
        return true;
      }
      if (!vt.idChiTietVatTu) {
        return true;
      }
    }
    return false;
  }

  function handleClose() {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`inspectionVehicleDraft_${idBienBan}`]: null,
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
          [`inspectionVehicleDraft_${idBienBan}`]: {
            idBienBan,
            soPhieu: formik.values.soPhieu,
            ngayGiamDinh: formik.values.ngayGiamDinh,
            viTri: formik.values.viTri,
            capBaoDuong: formik.values.capBaoDuong,
            donViSuaChua: formik.values.donViSuaChua,
            noiDungKhac: formik.values.noiDungKhac,
            tinhTrang: formik.values.tinhTrang,
            tenMauBienBan:
              formik.values.tenMauBienBan ||
              mauMacDinh?.ten ||
              "BIÊN BẢN GIÁM ĐỊNH KỸ THUẬT VÀ BÀN GIAO THIẾT BỊ ĐƯA VÀO SỬA CHỮA",
            congTy:
              formik.values.congTy ||
              mauMacDinh?.congTy ||
              currentBrandConfig.company,
            danhSachChiTiet: formik.values.danhSachChiTiet,
            nguoiKyList: formik.values.nguoiKyList,
          },
          lastMinimizedDialog: "inspection",
        },
      }),
    );
    onClose();
  }

  return (
    <FormikProvider value={formik}>
      <Dialog open={open} onClose={handleMinimize} maxWidth="xl" fullWidth>
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
            <DirectionsCarIcon />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {initData
                  ? "CẬP NHẬT BIÊN BẢN GIÁM ĐỊNH PHƯƠNG TIỆN"
                  : "TẠO BIÊN BẢN GIÁM ĐỊNH PHƯƠNG TIỆN"}
              </Typography>
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

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={4}>
            {/* Nửa bên phải: Thông tin giám định */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={2} sx={{ my: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldInput title="Số phiếu" name="soPhieu" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldDate title="Ngày giám định" name="ngayGiamDinh" />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldInput title="Vị trí giám định" name="viTri" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldInput title="Cấp bảo dưỡng" name="capBaoDuong" />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FieldAutoCompleted
                    title="Đơn vị sửa chữa"
                    name="donViSuaChua"
                    data={apiDepartments}
                    labelkey="tenPhongBan"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FieldInput
                    title="Nội dung khác"
                    name="noiDungKhac"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              {/* Right: Quy trình duyệt */}
              <SignerWorkflowSection formik={formik} />
            </Grid>
          </Grid>

          <Box>
            {/* Bảng chi tiết vật tư */}
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                DANH SÁCH CHI TIẾT VẬT TƯ
              </Typography>
            </Box>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ mb: 3, maxHeight: 350 }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell width={50} sx={{ fontWeight: 700 }}>
                      STT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Tên vật tư, chi tiết
                    </TableCell>
                    <TableCell width={100} sx={{ fontWeight: 700 }}>
                      ĐVT
                    </TableCell>
                    <TableCell width={100} sx={{ fontWeight: 700 }}>
                      Số lượng
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Tình trạng kỹ thuật
                    </TableCell>
                    <TableCell
                      width={100}
                      sx={{ fontWeight: 700 }}
                      align="center"
                    >
                      Thay mới
                    </TableCell>
                    <TableCell
                      width={100}
                      sx={{ fontWeight: 700 }}
                      align="center"
                    >
                      Sửa chữa
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ghi chú</TableCell>
                    <TableCell
                      width={60}
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={addMaterialRow}
                      >
                        <AddIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formik.values.danhSachChiTiet
                    .map((item, origIdx) => ({ item, origIdx }))
                    .map(({ item: vt, origIdx }, idx) => {
                      const validationError =
                        (vt.soLuongSuaChua || 0) + (vt.soLuongThayMoi || 0) >
                        (vt.soLuong || 0);

                      return (
                        <TableRow
                          key={vt.id}
                          sx={{
                            bgcolor: validationError
                              ? "error.lighter"
                              : undefined,
                          }}
                        >
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell sx={{ minWidth: 200 }}>
                            <FieldAutoCompleted
                              title="Chọn vật tư"
                              name={`danhSachChiTiet.${origIdx}.idChiTietVatTu`}
                              value={
                                allToolDetail.find(
                                  (t: any) =>
                                    String(t.id) === vt.idChiTietVatTu,
                                ) || null
                              }
                              onChange={(newValue: any) => {
                                updateMaterialField(vt.id!, {
                                  idChiTietVatTu: newValue
                                    ? String(newValue.id)
                                    : "",
                                  idVatTu: newValue
                                    ? String(
                                        newValue.idTaiSan ||
                                          newValue.idVatTu ||
                                          "",
                                      )
                                    : "",
                                  tenVatTu: newValue
                                    ? String(newValue.tenTaiSan || "")
                                    : "",
                                  donViTinh: newValue
                                    ? String(newValue.donViTinh || "Cái")
                                    : "",
                                });
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
                              name={`danhSachChiTiet.${origIdx}.donViTinh`}
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              type="number"
                              name={`danhSachChiTiet.${origIdx}.soLuong`}
                              noBorder={true}
                              disabled={true}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              name={`danhSachChiTiet.${origIdx}.tinhTrang`}
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              type="number"
                              name={`danhSachChiTiet.${origIdx}.soLuongThayMoi`}
                              noBorder={true}
                              onChange={(val) => {
                                const numRepair = Number(
                                  vt.soLuongSuaChua || 0,
                                );
                                const numReplace = Number(val || 0);
                                updateMaterialField(vt.id!, {
                                  soLuongThayMoi: numReplace,
                                  soLuong: numRepair + numReplace,
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              type="number"
                              name={`danhSachChiTiet.${origIdx}.soLuongSuaChua`}
                              noBorder={true}
                              onChange={(val) => {
                                const numRepair = Number(val || 0);
                                const numReplace = Number(
                                  vt.soLuongThayMoi || 0,
                                );
                                updateMaterialField(vt.id!, {
                                  soLuongSuaChua: numRepair,
                                  soLuong: numRepair + numReplace,
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              name={`danhSachChiTiet.${origIdx}.ghiChu`}
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeMaterialRow(vt.id!)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {formik.values.danhSachChiTiet.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        align="center"
                        sx={{ py: 4, color: "text.secondary" }}
                      >
                        Chưa có dòng vật tư nào. Nhấp "+" để bắt đầu.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Live Preview */}
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }}>
              <Chip label="XEM TRƯỚC BIÊN BẢN GIÁM ĐỊNH" size="small" />
            </Divider>
            <InspectionRecordVehiclePreview
              formik={formik}
              tieude={formik.values.tenMauBienBan}
              congty={formik.values.congTy}
            />
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
            {initData ? "Cập nhật" : "Tạo biên bản"}
          </Button>
        </DialogActions>
      </Dialog>
    </FormikProvider>
  );
};

export default InspectionRecordVehicleDialog;
