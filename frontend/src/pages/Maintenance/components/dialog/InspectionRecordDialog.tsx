import React, { useEffect, useRef } from "react";
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
  Alert,
  IconButton,
} from "@mui/material";
import EngineeringIcon from "@mui/icons-material/Engineering";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSelector } from "react-redux";
import {
  MaintenancePlanData,
  InspectionRecordVatTuData,
  InspectionRecordData,
  InspectionRecordDetailData,
} from "../../types";
import { IncidentInspectionData, MaintenanceRepairData } from "../../types";
import { useMaintenanceInspectionMutation } from "../../mutation";
import {
  Action,
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
import InspectionRecordPreview from "../preview/InspectionRecordPreview";
import { MachineInspectionValidation } from "../../validation";
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
  initData?: InspectionRecordData | null;
}

const InspectionRecordDialog = ({
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

  const { createMutation, updateMutation } = useMaintenanceInspectionMutation();

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return (
      tab?.formData?.[
        `inspectionDraft_${repairRequest?.id || incidentInspection?.id}`
      ] ?? null
    );
  });

  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(
      0,
      9999,
      "",
      LOAI_BIEN_BAN_TYPE.GIAM_DINH_MAY_MOC,
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
      soDeLaiPhucHoi: 0,
      soDeLamPheLieu: 0,
      soLuongHuy: 0,
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      tenMauBienBan:
        mauMacDinh?.ten ??
        `GIÁM ĐỊNH KỸ THUẬT VÀ BÀN GIAO THIẾT BỊ ĐƯA VÀO SỬA CHỮA`,
      congTy: mauMacDinh?.congTy ?? currentBrandConfig.company,
      danhSachChiTiet: [] as InspectionRecordDetailData[],
      nguoiKyList: [] as any[],
    },
    // validationSchema: MachineInspectionValidation,
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
        soDeLaiPhucHoi: values.soDeLaiPhucHoi,
        soDeLamPheLieu: values.soDeLamPheLieu,
        soLuongHuy: values.soLuongHuy,
        idNguoiLap: idNguoiLapBieu,
        nguoiLapXacNhan: false,
        idGiamDoc: idTrinhDuyetGiamDoc,
        giamDocXacNhan: false,
        trangThai: 0,
        share: false,
        tenMauBienBan: values.tenMauBienBan,
        congTy: values.congTy,
        danhSachChiTiet: values.danhSachChiTiet.map((e) => {
          const actualDetailId = e.id ? e.id : generateCode("GDCT_");
          return {
            id: actualDetailId,
            idTaiSan: e.idTaiSan,
            idBienBanChiTiet: e.idBienBanChiTiet,
            danhSachVatTu: (e.danhSachVatTu || []).map((vt) => ({
              id: vt.id ? vt.id : generateCode("GDVT_"),
              idChiTietGiamDinhMayMoc: actualDetailId,
              idVatTu: vt.idVatTu,
              idChiTietVatTu: vt.idChiTietVatTu,
              soLuong: vt.soLuong,
              tinhTrang: vt.tinhTrang,
              soLuongSuaChua: vt.soLuongSuaChua,
              soLuongThayMoi: vt.soLuongThayMoi,
              ghiChu: vt.ghiChu,
            })),
          };
        }),
        nguoiKyList: intermediateSigners,
      };

      if (initData) {
        updateMutation.mutate(record, {
          onSuccess: () => {
            handleClose();
          },
        });
      } else {
        createMutation.mutate(record, {
          onSuccess: () => {
            handleClose();
          },
        });
      }
    },
  });

  const apiUsersRef = useRef(apiUsers);
  const apiDepartmentsRef = useRef(apiDepartments);
  useEffect(() => {
    apiUsersRef.current = apiUsers;
  }, [apiUsers]);
  useEffect(() => {
    apiDepartmentsRef.current = apiDepartments;
  }, [apiDepartments]);

  useEffect(() => {
    if (!open) return;
    if (initData) {
      const listInfo = listSigneInfo(
        initData,
        apiUsersRef.current,
        apiDepartmentsRef.current,
      );

      formik.setValues({
        id: initData.id ?? "",
        idCongTy: initData.idCongTy ?? CongTy.CT001,
        idBienBan: initData.idBienBan ?? "",
        loaiBienBan: initData.loaiBienBan ?? "",
        soPhieu: initData.soPhieu ?? "",
        ngayGiamDinh: initData.ngayGiamDinh ?? "",
        viTri: initData.viTri ?? "",
        soDeLaiPhucHoi: initData.soDeLaiPhucHoi ?? 0,
        soDeLamPheLieu: initData.soDeLamPheLieu ?? 0,
        soLuongHuy: initData.soLuongHuy ?? 0,
        idNguoiLap: initData.idNguoiLap ?? "",
        nguoiLapXacNhan: initData.nguoiLapXacNhan ?? false,
        idGiamDoc: initData.idGiamDoc ?? "",
        giamDocXacNhan: initData.giamDocXacNhan ?? false,
        share: initData.share ?? false,
        trangThai: initData.trangThai ?? 0,
        tenMauBienBan:
          initData.tenMauBienBan ??
          mauMacDinh?.ten ??
          "GIÁM ĐỊNH KỸ THUẬT VÀ BÀN GIAO THIẾT BỊ ĐƯA VÀO SỬA CHỮA",
        congTy:
          initData.congTy ?? mauMacDinh?.congTy ?? currentBrandConfig.company,
        danhSachChiTiet: (initData.danhSachChiTiet ??
          []) as InspectionRecordDetailData[],
        nguoiKyList: (listInfo ?? []).map((item: any) => ({
          userId: item.idNhanVien,
          userName: item.hoTen,
          departmentId: item.idDonVi,
          departmentName: item.donVi,
        })),
      });
      return;
    }

    // Tính danhSachChiTiet từ props — luôn làm trước
    const danhSachChiTiet = (
      repairRequest?.danhSachTaiSan ||
      incidentInspection?.danhSachChiTiet ||
      []
    ).map((e: any) => ({
      ...e,
      id: "",
      idBienBanChiTiet: e.id,
    })) as InspectionRecordDetailData[];

    if (savedDraft) {
      formik.setValues({
        id: "",
        idCongTy: CongTy.CT001,
        idBienBan: incidentInspection?.id || repairRequest?.id || "",
        loaiBienBan: incidentInspection
          ? TypeBienBan.SU_CO
          : TypeBienBan.SUA_CHUA,
        idNguoiLap: "",
        nguoiLapXacNhan: false,
        idGiamDoc: "",
        giamDocXacNhan: false,
        share: false,
        trangThai: 0,
        // restore từ draft
        soPhieu: savedDraft.soPhieu,
        ngayGiamDinh: savedDraft.ngayGiamDinh,
        viTri: savedDraft.viTri,
        soDeLaiPhucHoi: savedDraft.soDeLaiPhucHoi,
        soDeLamPheLieu: savedDraft.soDeLamPheLieu,
        soLuongHuy: savedDraft.soLuongHuy,
        danhSachChiTiet: savedDraft.danhSachChiTiet,
        nguoiKyList: savedDraft.nguoiKyList,
        tenMauBienBan: savedDraft.tenMauBienBan,
        congTy: savedDraft.congTy,
      });
      return;
    }

    const parentRecord = incidentInspection || repairRequest;
    const listInfoFromParent = parentRecord
      ? listSigneInfo(
          parentRecord,
          apiUsersRef.current,
          apiDepartmentsRef.current,
        )
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
      idBienBan: incidentInspection?.id || repairRequest?.id || "",
      loaiBienBan: incidentInspection
        ? TypeBienBan.SU_CO
        : TypeBienBan.SUA_CHUA,
      soPhieu: "",
      ngayGiamDinh: dayjs().format("YYYY-MM-DD"),
      viTri: "",
      soDeLaiPhucHoi: 0,
      soDeLamPheLieu: 0,
      soLuongHuy: 0,
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      tenMauBienBan:
        mauMacDinh?.ten ??
        `GIÁM ĐỊNH KỸ THUẬT VÀ BÀN GIAO THIẾT BỊ ĐƯA VÀO SỬA CHỮA`,
      congTy: mauMacDinh?.congTy ?? currentBrandConfig.company,
      danhSachChiTiet,
      nguoiKyList: signersListFromParent,
    });
  }, [open, initData, repairRequest, incidentInspection, savedDraft]);

  const addMaterialRow = (assetIdx: number) => {
    const newMaterial: InspectionRecordVatTuData = {
      id: "GDVT_" + Math.random().toString(36).substr(2, 9),
      idChiTietGiamDinhMayMoc: formik.values.danhSachChiTiet[assetIdx].id,
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
    const updatedEntries = formik.values.danhSachChiTiet.map((e, idx) => {
      if (idx === assetIdx) {
        return {
          ...e,
          danhSachVatTu: [...(e.danhSachVatTu || []), newMaterial],
        };
      }
      return e;
    });
    formik.setFieldValue("danhSachChiTiet", updatedEntries);
  };

  const removeMaterialRow = (assetIdx: number, materialId: string) => {
    const updatedEntries = formik.values.danhSachChiTiet.map((e, idx) => {
      if (idx === assetIdx) {
        const updatedVatTu = (e.danhSachVatTu || []).filter(
          (m) => m.id !== materialId,
        );

        return {
          ...e,
          danhSachVatTu: updatedVatTu,
        };
      }
      return e;
    });
    formik.setFieldValue("danhSachChiTiet", updatedEntries);
  };

  const updateMaterial = (
    assetIdx: number,
    materialId: string,
    fieldOrChanges:
      | keyof InspectionRecordVatTuData
      | Partial<InspectionRecordVatTuData>,
    value?: any,
  ) => {
    const updatedEntries = formik.values.danhSachChiTiet.map((e, idx) => {
      if (idx === assetIdx) {
        return {
          ...e,
          danhSachVatTu: (e.danhSachVatTu || []).map((m) => {
            if (m.id === materialId) {
              if (typeof fieldOrChanges === "string") {
                return { ...m, [fieldOrChanges]: value };
              } else {
                return { ...m, ...fieldOrChanges };
              }
            }
            return m;
          }),
        };
      }
      return e;
    });
    formik.setFieldValue("danhSachChiTiet", updatedEntries);
  };

  function hasValidationError() {
    for (const entry of formik.values.danhSachChiTiet) {
      if (entry.danhSachVatTu) {
        for (const vt of entry.danhSachVatTu) {
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
      }
    }
    return false;
  }

  const handleClose = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`inspectionDraft_${repairRequest?.id || incidentInspection?.id}`]:
            null,
          lastMinimizedDialog: null,
        },
      }),
    );
    onClose();
    formik.resetForm();
  };

  const handleMinimize = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`inspectionDraft_${repairRequest?.id || incidentInspection?.id}`]: {
            soPhieu: formik.values.soPhieu,
            ngayGiamDinh: formik.values.ngayGiamDinh,
            viTri: formik.values.viTri,
            soDeLaiPhucHoi: formik.values.soDeLaiPhucHoi,
            soDeLamPheLieu: formik.values.soDeLamPheLieu,
            soLuongHuy: formik.values.soLuongHuy,
            danhSachChiTiet: formik.values.danhSachChiTiet,
            nguoiKyList: formik.values.nguoiKyList,
            idBienBan: formik.values.idBienBan,
            tenMauBienBan:
              formik.values.tenMauBienBan ||
              mauMacDinh?.ten ||
              "GIÁM ĐỊNH KỸ THUẬT VÀ BÀN GIAO THIẾT BỊ ĐƯA VÀO SỬA CHỮA",
            congTy:
              formik.values.congTy ||
              mauMacDinh?.congTy ||
              currentBrandConfig.company,
          },
          lastMinimizedDialog: "inspection",
        },
      }),
    );
    onClose();
  };

  const referenceLabel = repairRequest
    ? `${repairRequest.soPhieu || repairRequest.id} — Tháng ${repairRequest.thang}/${repairRequest.nam}`
    : plan
      ? `Kế hoạch: ${plan.id}`
      : `BB Kiểm tra sự cố: ${incidentInspection?.soPhieu || ""}`;

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
            <EngineeringIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Biên bản giám định kỹ thuật và bàn giao thiết bị đưa vào sửa
                chữa
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Căn cứ: {referenceLabel}
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
          {repairRequest?.danhSachTaiSan?.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Không có thiết bị nào để giám định. Vui lòng kiểm tra lại dữ liệu
              đầu vào.
            </Alert>
          )}

          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 3 }}
          >
            {/* Left: Thông tin + Số lượng vật tư */}
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
                  Thông tin chung
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FieldInput title="Số biên bản" name="soPhieu" />
                  <FieldDate
                    title="Ngày giám định"
                    selectedDate={formik.values.ngayGiamDinh}
                    setSelectedDate={(val) =>
                      formik.setFieldValue("ngayGiamDinh", val)
                    }
                  />
                  <FieldInput title="Địa điểm (Tại...)" name="viTri" />
                  {repairRequest ? (
                    <Typography variant="body2" color="text.secondary">
                      Căn cứ vào giấy đề nghị: <b>{repairRequest.soPhieu}</b> —
                      Ngày tạo: <b>{repairRequest.ngayTao}</b>
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Căn cứ vào BB Kiểm tra sự cố{plan ? ` — Kế hoạch: ` : ""}
                      <b>{plan?.id || ""}</b>
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  p: 2.5,
                }}
              >
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  {[
                    {
                      label: "Số để lại phục hồi phục vụ cho sản xuất",
                      field: "soDeLaiPhucHoi",
                    },
                    {
                      label: "Số để làm phế liệu (mục)",
                      field: "soDeLamPheLieu",
                    },
                    {
                      label: "Số lượng hủy (mục)",
                      field: "soLuongHuy",
                    },
                  ].map(({ label, field }) => (
                    <FieldInput
                      key={field}
                      title={label}
                      name={field}
                      type="number"
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Right: Quy trình duyệt */}
            <Box>
              <SignerWorkflowSection formik={formik} />
            </Box>
          </Box>

          {/* Tình trạng thiết bị */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              Tình trạng chi tiết thiết bị & vật tư linh kiện đưa vào sửa chữa
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>
                      STT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>
                      Tên Thiết bị / Vật tư phụ tùng
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>
                      ĐVT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 100 }}>
                      SL
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>
                      Tình trạng KT
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, width: 100 }}
                    >
                      Sửa chữa
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, width: 100 }}
                    >
                      Thay mới
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>
                      Ghi chú
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, width: 60 }}
                      align="center"
                    >
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formik.values.danhSachChiTiet.map((entry, assetIdx) => (
                    <React.Fragment key={entry.idTaiSan}>
                      {/* Hàng thiết bị chính (cha) */}
                      <TableRow sx={{ bgcolor: "#fafafa" }}>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {assetIdx + 1}
                        </TableCell>
                        <TableCell
                          colSpan={7}
                          sx={{ fontWeight: 700, color: "primary.main" }}
                        >
                          Thiết bị: {entry.tenTaiSan || entry.idTaiSan}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => addMaterialRow(assetIdx)}
                            color="primary"
                            title="Thêm vật tư phụ tùng giám định"
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* Hàng các vật tư phụ tùng chi tiết (con) */}
                      {!entry.danhSachVatTu ||
                      entry.danhSachVatTu.length === 0 ? (
                        <TableRow>
                          <TableCell></TableCell>
                          <TableCell
                            colSpan={8}
                            sx={{
                              fontStyle: "italic",
                              color: "text.secondary",
                              py: 1,
                            }}
                          >
                            Chưa có vật tư/linh kiện phụ tùng nào được chọn để
                            giám định dưới thiết bị này. Nhấp "+" để thêm.
                          </TableCell>
                        </TableRow>
                      ) : (
                        entry.danhSachVatTu.map((vt, vtIdx) => (
                          <TableRow key={vt.id}>
                            <TableCell
                              align="right"
                              sx={{ color: "text.secondary", pr: 2 }}
                            >
                              {assetIdx + 1}.{vtIdx + 1}
                            </TableCell>
                            <TableCell sx={{ width: "220px" }}>
                              <FieldAutoCompleted
                                title=""
                                data={allToolDetail}
                                labelkey="tenTaiSan"
                                labelOption="idTaiSan"
                                limitOptions={10}
                                value={vt.idChiTietVatTu}
                                noBorder={true}
                                onChange={(value) => {
                                  if (value) {
                                    updateMaterial(assetIdx, vt.id!, {
                                      idChiTietVatTu: value.id,
                                      idVatTu: value.idTaiSan,
                                      tenVatTu: value.tenTaiSan,
                                      donViTinh: value.donViTinh,
                                    });
                                  } else {
                                    updateMaterial(assetIdx, vt.id!, {
                                      idChiTietVatTu: "",
                                      idVatTu: "",
                                      tenVatTu: "",
                                      donViTinh: "",
                                    });
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>{vt.donViTinh || "—"}</TableCell>
                            <TableCell>
                              <FieldInput
                                title=""
                                name={`danhSachChiTiet.${assetIdx}.danhSachVatTu.${vtIdx}.soLuong`}
                                type="number"
                                noBorder={true}
                                disabled={true}
                              />
                            </TableCell>
                            <TableCell>
                              <FieldInput
                                title=""
                                name={`danhSachChiTiet.${assetIdx}.danhSachVatTu.${vtIdx}.tinhTrang`}
                                noBorder={true}
                              />
                            </TableCell>
                            <TableCell>
                              <FieldInput
                                type="number"
                                name={`danhSachChiTiet.${assetIdx}.danhSachVatTu.${vtIdx}.soLuongSuaChua`}
                                noBorder={true}
                                onChange={(val) => {
                                  const numRepair = Number(val || 0);
                                  const numReplace = Number(
                                    vt.soLuongThayMoi || 0,
                                  );
                                  updateMaterial(assetIdx, vt.id!, {
                                    soLuongSuaChua: numRepair,
                                    soLuong: numRepair + numReplace,
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <FieldInput
                                type="number"
                                name={`danhSachChiTiet.${assetIdx}.danhSachVatTu.${vtIdx}.soLuongThayMoi`}
                                noBorder={true}
                                onChange={(val) => {
                                  const numRepair = Number(
                                    vt.soLuongSuaChua || 0,
                                  );
                                  const numReplace = Number(val || 0);
                                  updateMaterial(assetIdx, vt.id!, {
                                    soLuongThayMoi: numReplace,
                                    soLuong: numRepair + numReplace,
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <FieldInput
                                title=""
                                name={`danhSachChiTiet.${assetIdx}.danhSachVatTu.${vtIdx}.ghiChu`}
                                noBorder={true}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  removeMaterialRow(assetIdx, vt.id!)
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Preview */}
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }}>
              <Chip label="Xem trước biên bản" size="small" />
            </Divider>
            <InspectionRecordPreview
              formik={formik}
              repairRequest={repairRequest}
              plan={plan}
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
            disabled={
              formik.values.nguoiKyList.length === 0 ||
              repairRequest?.danhSachTaiSan?.length === 0 ||
              hasValidationError()
            }
            onClick={() => formik.handleSubmit()}
          >
            {initData ? "Cập nhật" : "Tạo biên bản"}
          </Button>
        </DialogActions>
      </Dialog>
    </FormikProvider>
  );
};

export default InspectionRecordDialog;
