import React, { useEffect } from "react";
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
  IconButton,
  Divider,
} from "@mui/material";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { FormikProvider, useFormik } from "formik";
import {
  InspectionRecordData,
  InspectionRecordDetailData,
  AcceptanceTestRecordData,
  AcceptanceTestRecordAssetData,
  AcceptanceTestRecordToolData,
  BienPhapMayMocData,
} from "../../types";
import { MaintenanceRepairData } from "../../types";
import { CongTy, LOAI_BIEN_BAN_TYPE } from "../../../../utils/const";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { generateCode } from "../../../../utils/helpers";
import { useMaintenanceAcceptanceTestMutation } from "../../mutation";
import api from "../../../../config/api.config";
import { useSelector } from "react-redux";
import { PlanSigner } from "../../../../mockdata/mockPlans";
import dayjs from "dayjs";
import { useAllToolDetailQuery } from "../../../ToolManager/Mutation";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import { useAllLoaiSCBDQuery } from "../../../MaintenanceRepairType/Mutation";
import { listSigneInfo } from "../../config";
import FieldInput from "../../../../components/TextField/FieldInput";
import FieldDate from "../../../../components/TextField/FieldDate";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import AcceptanceTestPreview from "../preview/AcceptanceTestPreview";
import { AcceptanceMachineValidation } from "../../validation";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { Remove } from "@mui/icons-material";
import { useBienBanSuaChuaPageQuery } from "../../../RepairReport/Mutation";
import { currentBrandConfig } from "../../../../config/brandConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  repairRequest?: MaintenanceRepairData;
  inspectionRecord: InspectionRecordData;
  initData?: AcceptanceTestRecordData | null;
  bienPhap?: BienPhapMayMocData | null;
}

const AcceptanceTestDialog = ({
  open,
  onClose,
  repairRequest,
  inspectionRecord,
  initData,
  bienPhap,
}: Props) => {
  const { user } = useSelector((state: any) => state.user);
  const { createMutation, updateMutation } =
    useMaintenanceAcceptanceTestMutation();

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return (
      tab?.formData?.[
        `acceptanceDraft_${bienPhap?.id || inspectionRecord?.id}`
      ] ?? null
    );
  });

  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const { data: allToolDetail = [] } = useAllToolDetailQuery();
  const { data: allLevel = [] } = useAllLoaiSCBDQuery();

  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(
      0,
      9999,
      "",
      LOAI_BIEN_BAN_TYPE.NGHIEM_THU_MAY_MOC,
      true,
    );
  const mauMacDinh = repairReportPage?.data?.items?.[0];

  const formik = useFormik({
    initialValues: {
      id: "",
      idCongTy: CongTy.CT001,
      idBienPhapMayMoc: bienPhap?.id || "",
      idGiamDinhMayMoc: inspectionRecord?.id || "",
      soPhieu: "",
      ngayNghiemThu: dayjs().format("YYYY-MM-DD"),
      viTri: "",
      tenThietBi: "",
      soDangKi: "",
      capSuaChua: "",
      ketQua: "đảm bảo yêu cầu kỹ thuật",
      noiDung: "",
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      tenMauBienBan:
        mauMacDinh?.ten ||
        "NGHIỆM THU CHẠY THỬ VÀ BÀN GIAO THIẾT BỊ SAU SỬA CHỮA",
      congTy: mauMacDinh?.congTy || currentBrandConfig.company,
      danhSachTaiSan: [] as AcceptanceTestRecordAssetData[],
      nguoiKyList: [] as any[],
    },
    // validationSchema: AcceptanceMachineValidation,
    onSubmit: (values) => {
      const idNguoiLapVal =
        values.nguoiKyList.length > 0 ? values.nguoiKyList[0].userId : "";
      const idGiamDocVal =
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

      const mappedDanhSachTaiSan = values.danhSachTaiSan.map((ts) => {
        const actualTsId = ts.id ? ts.id : generateCode("NTTS-");

        return {
          id: actualTsId,
          idBienBan: values.id || "",
          idTaiSan: ts.idTaiSan,
          idChiTietGiamDinhMayMoc: ts.idChiTietGiamDinhMayMoc,
          danhSachVatTu: (ts.danhSachVatTu || []).map((vt) => ({
            id: vt.id ? vt.id : generateCode("NTVT-"),
            idBienBanTaiSan: actualTsId,
            idChiTietVatTu: vt.idChiTietVatTu || "",
            idVatTu: vt.idVatTu || "",
            tenVatTu: vt.tenVatTu || "",
            donViTinh: vt.donViTinh || "Cái",
            soLuong: vt.soLuong,
            ghiChu: vt.ghiChu || "",
          })),
        };
      });

      const payload = {
        ...values,
        idNguoiLap: idNguoiLapVal,
        idGiamDoc: idGiamDocVal,
        nguoiKyList: intermediateSigners,
        danhSachTaiSan: mappedDanhSachTaiSan,
        nguoiTao: user?.taiKhoan?.tenDangNhap,
        ngayTao: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      };

      if (initData) {
        updateMutation.mutate(payload, {
          onSuccess: () => handleClose(),
        });
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => handleClose(),
        });
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
        idBienPhapMayMoc: initData.idBienPhapMayMoc ?? "",
        idGiamDinhMayMoc: initData.idGiamDinhMayMoc ?? "",
        soPhieu: initData.soPhieu ?? "",
        ngayNghiemThu: initData.ngayNghiemThu ?? "",
        viTri: initData.viTri ?? "",
        tenThietBi: initData.tenThietBi ?? "",
        soDangKi: initData.soDangKi ?? "",
        capSuaChua: initData.capSuaChua ?? "",
        ketQua: initData.ketQua ?? "đảm bảo yêu cầu kỹ thuật",
        noiDung: initData.noiDung ?? "",
        idNguoiLap: initData.idNguoiLap ?? "",
        nguoiLapXacNhan: initData.nguoiLapXacNhan ?? false,
        idGiamDoc: initData.idGiamDoc ?? "",
        giamDocXacNhan: initData.giamDocXacNhan ?? false,
        share: initData.share ?? false,
        trangThai: initData.trangThai ?? 0,
        tenMauBienBan:
          initData?.tenMauBienBan ||
          mauMacDinh?.ten ||
          "NGHIỆM THU CHẠY THỬ VÀ BÀN GIAO THIẾT BỊ SAU SỬA CHỮA",
        congTy:
          initData?.congTy || mauMacDinh?.congTy || currentBrandConfig.company,
        danhSachTaiSan: (initData.danhSachTaiSan || []).map((ts) => ({
          ...ts,
          danhSachVatTu: (ts.danhSachVatTu || []).map((vt) => ({ ...vt })),
        })) as AcceptanceTestRecordAssetData[],
        nguoiKyList: (listInfo ?? []).map((item: any) => ({
          userId: item.idNhanVien,
          userName: item.hoTen,
          departmentId: item.idDonVi,
          departmentName: item.donVi,
        })),
      });
      return;
    }
    // Tính danhSachTaiSan từ inspectionRecord — luôn làm trước
    const list: AcceptanceTestRecordAssetData[] = [];
    (inspectionRecord?.danhSachChiTiet || []).forEach(
      (entry: InspectionRecordDetailData, idx: number) => {
        const activeVatTu = entry.danhSachVatTu || [];
        const tsId = `NTTS_${Date.now()}_${idx}`;
        if (activeVatTu.length > 0) {
          list.push({
            id: tsId,
            idTaiSan: entry.idTaiSan || "",
            idChiTietGiamDinhMayMoc: entry.id || "",
            tenTaiSan: entry.tenTaiSan || "",
            donViTinh: entry.donViTinh || "Cái",
            danhSachVatTu: activeVatTu.map((vt: any, vtIdx: number) => {
              const qty =
                vt.soLuongThayMoi || vt.soLuongSuaChua
                  ? (vt.soLuongThayMoi || 0) + (vt.soLuongSuaChua || 0)
                  : vt.soLuong || 1;
              return {
                id: `NTVT_${Date.now()}_${idx}_${vtIdx}`,
                idBienBanTaiSan: tsId,
                idChiTietVatTu: vt.idChiTietVatTu || "",
                idVatTu: vt.idVatTu || "",
                tenVatTu: vt.tenVatTu || "",
                donViTinh: vt.donViTinh || "Cái",
                soLuong: qty,
                ghiChu: vt.ghiChu || "",
              };
            }),
          });
        } else {
          list.push({
            id: tsId,
            idTaiSan: entry.idTaiSan || "",
            idChiTietGiamDinhMayMoc: entry.id || "",
            tenTaiSan: entry.tenTaiSan || "",
            donViTinh: entry.donViTinh || "Cái",
            danhSachVatTu: [
              {
                id: `NTVT_${Date.now()}_${idx}_0`,
                idBienBanTaiSan: tsId,
                idChiTietVatTu: "",
                idVatTu: "",
                tenVatTu: "",
                donViTinh: "Cái",
                soLuong: 1,
                ghiChu: "",
              },
            ],
          });
        }
      },
    );

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

    if (savedDraft) {
      formik.setValues({
        id: "",
        idCongTy: CongTy.CT001,
        idBienPhapMayMoc: bienPhap?.id || "",
        idGiamDinhMayMoc: inspectionRecord?.id || "",
        idNguoiLap: "",
        nguoiLapXacNhan: false,
        idGiamDoc: "",
        giamDocXacNhan: false,
        share: false,
        trangThai: 0,
        soPhieu: savedDraft.soPhieu,
        ngayNghiemThu: savedDraft.ngayNghiemThu,
        viTri: savedDraft.viTri,
        tenThietBi: savedDraft.tenThietBi,
        soDangKi: savedDraft.soDangKi,
        capSuaChua: savedDraft.capSuaChua,
        ketQua: savedDraft.ketQua,
        noiDung: savedDraft.noiDung,
        tenMauBienBan: savedDraft.tenMauBienBan,
        congTy: savedDraft.congTy,
        danhSachTaiSan: savedDraft.danhSachTaiSan,
        nguoiKyList: savedDraft.nguoiKyList,
      });
      return;
    }

    formik.setValues({
      id: "",
      idCongTy: CongTy.CT001,
      idBienPhapMayMoc: bienPhap?.id || "",
      idGiamDinhMayMoc: inspectionRecord?.id || "",
      soPhieu: `BB-NT-${repairRequest?.id ?? ""}`,
      ngayNghiemThu: dayjs().format("YYYY-MM-DD"),
      viTri: "",
      tenThietBi:
        inspectionRecord.danhSachChiTiet?.map((e) => e.idTaiSan).join(", ") ??
        "",
      soDangKi: "",
      capSuaChua: "",
      ketQua: "đảm bảo yêu cầu kỹ thuật",
      noiDung: "",
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      tenMauBienBan:
        mauMacDinh?.ten ||
        "NGHIỆM THU CHẠY THỬ VÀ BÀN GIAO THIẾT BỊ SAU SỬA CHỮA",
      congTy: mauMacDinh?.congTy || currentBrandConfig.company,
      danhSachTaiSan: list,
      nguoiKyList: signersListFromParent,
    });
  }, [
    open,
    initData,
    apiUsers,
    apiDepartments,
    savedDraft,
    bienPhap,
    inspectionRecord,
  ]);

  const addMaterialRow = (assetIdx: number) => {
    const ts = formik.values.danhSachTaiSan[assetIdx];
    const newItem: AcceptanceTestRecordToolData = {
      id: `NTVT_${Date.now()}`,
      idBienBanTaiSan: ts.id || "",
      idChiTietVatTu: "",
      idVatTu: "",
      tenVatTu: "",
      donViTinh: "Cái",
      soLuong: 1,
      ghiChu: "",
    };
    const updatedVatTu = [...(ts.danhSachVatTu || []), newItem];
    formik.setFieldValue(
      `danhSachTaiSan[${assetIdx}].danhSachVatTu`,
      updatedVatTu,
    );
  };

  const removeMaterialRow = (assetIdx: number, materialId: string) => {
    const ts = formik.values.danhSachTaiSan[assetIdx];
    const updatedVatTu = (ts.danhSachVatTu || []).filter(
      (vt) => vt.id !== materialId,
    );
    formik.setFieldValue(
      `danhSachTaiSan[${assetIdx}].danhSachVatTu`,
      updatedVatTu,
    );
  };

  const updateMaterial = (
    assetIdx: number,
    vtId: string,
    fields: Partial<AcceptanceTestRecordToolData>,
  ) => {
    const ts = formik.values.danhSachTaiSan[assetIdx];
    const updatedVatTu = (ts.danhSachVatTu || []).map((vt) =>
      vt.id === vtId ? { ...vt, ...fields } : vt,
    );
    formik.setFieldValue(
      `danhSachTaiSan[${assetIdx}].danhSachVatTu`,
      updatedVatTu,
    );
  };

  const handleClose = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`acceptanceDraft_${bienPhap?.id || inspectionRecord?.id}`]: null,
          lastMinimizedDialog: null,
        },
      }),
    );
    onClose();
  };
  const handleMinimize = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`acceptanceDraft_${bienPhap?.id || inspectionRecord?.id}`]: {
            idBienPhapMayMoc: formik.values.idBienPhapMayMoc,
            idGiamDinhMayMoc: formik.values.idGiamDinhMayMoc,
            idGiamDinh: inspectionRecord?.id,
            acceptanceParentBienPhapId: bienPhap?.id || inspectionRecord?.id,
            soPhieu: formik.values.soPhieu,
            ngayNghiemThu: formik.values.ngayNghiemThu,
            viTri: formik.values.viTri,
            tenThietBi: formik.values.tenThietBi,
            soDangKi: formik.values.soDangKi,
            capSuaChua: formik.values.capSuaChua,
            ketQua: formik.values.ketQua,
            noiDung: formik.values.noiDung,
            tenMauBienBan: formik.values.tenMauBienBan,
            congTy: formik.values.congTy,
            danhSachTaiSan: formik.values.danhSachTaiSan,
            nguoiKyList: formik.values.nguoiKyList,
          },
          lastMinimizedDialog: "acceptance",
        },
      }),
    );
    onClose();
  };

  const d = new Date(formik.values.ngayNghiemThu);

  return (
    <FormikProvider value={formik}>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FactCheckIcon color="success" />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Biên bản nghiệm thu chạy thử và bàn giao thiết bị sau sửa chữa
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Căn cứ BB giám định: {inspectionRecord?.soPhieu || ""} — GĐN:{" "}
                {repairRequest?.soPhieu || repairRequest?.id}
              </Typography>
            </Box>
          </Box>
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
          {/* 2-column layout: form | signers */}
          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 3 }}
          >
            {/* Col 1: Thông tin */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  p: 2.5,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Thông tin
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FieldInput title="Số phiếu" name="soPhieu" />
                  <FieldDate title="Ngày lập" name="ngayNghiemThu" />
                  <FieldInput title="Địa điểm (Tại...)" name="viTri" />
                  <FieldInput
                    title="Tên thiết bị nghiệm thu"
                    name="tenThietBi"
                  />
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <FieldInput title="Số đăng ký" name="soDangKi" />
                    <FieldAutoCompleted
                      title="Cấp sửa chữa"
                      labelkey="ten"
                      data={allLevel}
                      value={formik.values.capSuaChua}
                      anchorRight={true}
                      onChange={async (value) => {
                        formik.setFieldValue("capSuaChua", value.id);
                        if (value.id) {
                          try {
                            const res = await api.get(
                              `/dinhmucsuachua/loai-sua-chua/${value.id}`,
                            );
                            const normData = res.data;
                            if (
                              normData &&
                              normData.dinhMucVatTuList?.length > 0
                            ) {
                              const danhSachTaiSanUpdated =
                                formik.values.danhSachTaiSan.map((ts, idx) => {
                                  const newVatTuList =
                                    normData.dinhMucVatTuList.map(
                                      (vt: any, vtIdx: number) => ({
                                        id: `NTVT_${Date.now()}_${idx}_${vtIdx}`,
                                        idBienBanTaiSan: ts.id || "",
                                        idChiTietVatTu: vt.idChiTietVatTu || "",
                                        idVatTu: vt.idCCDCVT || "",
                                        tenVatTu: vt.tenCCDCVT || "",
                                        donViTinh: vt.donViTinh || "Cái",
                                        soLuong: vt.soLuong || 1,
                                        ghiChu: vt.ghiChu || "",
                                      }),
                                    );
                                  return { ...ts, danhSachVatTu: newVatTuList };
                                });
                              formik.setFieldValue(
                                "danhSachTaiSan",
                                danhSachTaiSanUpdated,
                              );
                            }
                          } catch (e) {
                            console.log(
                              "Không tìm thấy định mức cho cấp sửa chữa này",
                              e,
                            );
                          }
                        }
                      }}
                    />
                  </Box>
                  <FieldInput title="Kết quả chạy thử" name="ketQua" />
                  <FieldInput
                    title="Nội dung nghiệm thu"
                    name="noiDung"
                    multiline
                    rows={3}
                  />
                </Box>
              </Box>
            </Box>

            {/* Col 2: Quy trình duyệt */}
            <Box>
              <SignerWorkflowSection formik={formik} />
            </Box>
          </Box>

          {/* Vật tư / Thiết bị */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Vật tư / Thiết bị
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>
                      STT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 80 }}>
                      Mã VT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Tên vật tư, thiết bị
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 100 }}>
                      ĐVT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 100 }}>
                      SL
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }}>
                      Ghi chú
                    </TableCell>
                    <TableCell sx={{ width: 36 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formik.values.danhSachTaiSan.map((ts, assetIdx) => {
                    const activeVatTu = ts.danhSachVatTu || [];
                    return (
                      <React.Fragment key={ts.id || assetIdx}>
                        <TableRow sx={{ bgcolor: "#fafafa" }}>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {String.fromCharCode(73 + assetIdx)}/
                          </TableCell>
                          <TableCell colSpan={5} sx={{ fontWeight: 600 }}>
                            Thiết bị: {ts.tenTaiSan || ts.idTaiSan}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => addMaterialRow(assetIdx)}
                              color="primary"
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        {activeVatTu.length === 0 ? (
                          <TableRow>
                            <TableCell />
                            <TableCell colSpan={6} align="center">
                              <Typography
                                variant="body2"
                                color="textSecondary"
                                sx={{ py: 1.5 }}
                              >
                                Chưa có vật tư/linh kiện phụ tùng nào được chọn
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          activeVatTu.map((item, rowIdx) => (
                            <TableRow key={item.id || rowIdx}>
                              <TableCell sx={{ pl: 2 }}>
                                {String(rowIdx + 1).padStart(2, "0")}
                              </TableCell>
                              <TableCell sx={{ width: "200px" }}>
                                <FieldAutoCompleted
                                  title=""
                                  data={allToolDetail}
                                  labelkey="tenTaiSan"
                                  labelOption="idTaiSan"
                                  limitOptions={10}
                                  value={item.idChiTietVatTu}
                                  noBorder={true}
                                  onChange={(value) => {
                                    if (value) {
                                      updateMaterial(assetIdx, item.id!, {
                                        idChiTietVatTu: value.id,
                                        idVatTu: value.idTaiSan,
                                        tenVatTu: value.tenTaiSan,
                                        donViTinh: value.donViTinh,
                                      });
                                    } else {
                                      updateMaterial(assetIdx, item.id!, {
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
                              <TableCell>{item.donViTinh}</TableCell>
                              <TableCell>
                                <FieldInput
                                  title=""
                                  name={`danhSachTaiSan.${assetIdx}.danhSachVatTu.${rowIdx}.soLuong`}
                                  noBorder={true}
                                />
                              </TableCell>
                              <TableCell>
                                <FieldInput
                                  title=""
                                  name={`danhSachTaiSan.${assetIdx}.danhSachVatTu.${rowIdx}.ghiChu`}
                                  noBorder={true}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    removeMaterialRow(assetIdx, item.id!)
                                  }
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Full-width Preview */}
          <AcceptanceTestPreview
            formik={formik}
            d={d}
            tieude={formik.values.tenMauBienBan}
            congty={formik.values.congTy}
          />
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleClose} color="inherit">
            Hủy
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={createMutation.isPending || updateMutation.isPending}
            onClick={formik.submitForm}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Đang lưu..."
              : initData
                ? "Cập nhật"
                : "Tạo biên bản"}
          </Button>
        </DialogActions>
      </Dialog>
    </FormikProvider>
  );
};

export default AcceptanceTestDialog;
