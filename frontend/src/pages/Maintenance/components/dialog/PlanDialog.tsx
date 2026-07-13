import {
  Box,
  Button,
  IconButton,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import FieldYear from "../../../../components/TextField/FieldYear";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import type { PlanSigner } from "../../../../mockdata/mockPlans";
import StepSchedule from "../step/StepSchedule";
import StepPreview from "../preview/PlanPreview";
import StepAssets from "../step/StepAssets";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import FieldInput from "../../../../components/TextField/FieldInput";
import { AssetGroup, LOAI_BIEN_BAN_TYPE } from "../../../../utils/const";
import { generateCode } from "../../../../utils/helpers";
import { MaintenancePlanData } from "../../types";
import { listSigneInfo } from "../../config";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import { PlanMaintenanceValidation } from "../../validation";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { useEffect, useState } from "react";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { Remove } from "@mui/icons-material";
import { useBienBanSuaChuaPageQuery } from "../../../RepairReport/Mutation";
import { useAllAssetsByDepartmentQuery } from "../../../AssetManager/Mutation";

interface PlanAsset {
  id?: string;
  deviceId: string;
  quantity: number;
  idDonViBaoTri?: string;
  month1: string;
  month2: string;
  month3: string;
  month4: string;
  month5: string;
  month6: string;
  month7: string;
  month8: string;
  month9: string;
  month10: string;
  month11: string;
  month12: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (plan: any, isEdit?: boolean) => void;
  initialData?: MaintenancePlanData | null;
}

const CreatePlanDialog = ({ open, onClose, onSave, initialData }: Props) => {
  const isEdit = !!initialData;

  const { data: departments = [] } = useAllDepartmentsQuery();
  const { data: users = [] } = useAllStaffsQuery();

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const draftKey = initialData
    ? `planDraft_${initialData.id}`
    : "planDraft_new";

  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t) => t.path === tabPath);
    return tab?.formData?.[draftKey] ?? null;
  });

  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(0, 9999, "", LOAI_BIEN_BAN_TYPE.KE_HOACH, true);
  const tenMauMacDinh = repairReportPage?.data?.items?.[0]?.ten;

  const formik = useFormik({
    initialValues: {
      id: "",
      tenKeHoach: "",
      soKeHoach: "",
      nam: new Date().getFullYear(),
      idDonViGiao: "",
      idDonViNhan: "",
      soQuyetDinh: "",
      nguoiKyList: [] as any[],
      danhSachTaiSan: [] as any[],
      idCongTy: "CT001",
      idLoaiKeHoach: "THIET_BI",
      trangThai: 0,
      share: false,
      tenMauBienBanSuaChua:
        tenMauMacDinh ??
        `KẾ HOẠCH SỬA CHỮA BẢO DƯỠNG THIẾT BỊ NĂM ${new Date().getFullYear()}`,
    },
    onSubmit: (values) => {
      // 1. Ánh xạ chi tiết tài sản với 12 tháng
      const danhSachTaiSan = values.danhSachTaiSan.map((a: PlanAsset) => ({
        id: a.id,
        idTaiSan: a.deviceId,
        soLuong: a.quantity || 1,
        idDonViBaoTri: a.idDonViBaoTri,
        capSuaChuaThang1: a.month1,
        capSuaChuaThang2: a.month2,
        capSuaChuaThang3: a.month3,
        capSuaChuaThang4: a.month4,
        capSuaChuaThang5: a.month5,
        capSuaChuaThang6: a.month6,
        capSuaChuaThang7: a.month7,
        capSuaChuaThang8: a.month8,
        capSuaChuaThang9: a.month9,
        capSuaChuaThang10: a.month10,
        capSuaChuaThang11: a.month11,
        capSuaChuaThang12: a.month12,
      }));

      // 2. Phân tách người ký
      const signers = formik.values.nguoiKyList;
      const idNguoiLapBieu = signers.length > 0 ? signers[0].userId : "";
      const idTrinhDuyetGiamDoc =
        signers.length > 1 ? signers[signers.length - 1].userId : "";

      // Người ký trung gian (nếu có)
      const intermediateSigners =
        signers.length > 2
          ? signers.slice(1, -1).map((s: PlanSigner, idx: number) => ({
              id: `${generateCode("SIG-")}-${idx}`,
              idNguoiKy: s.userId,
              tenNguoiKy: s.userName,
              idPhongBan: s.departmentId,
              trangThai: 0,
            }))
          : [];

      const newPlanData: any = {
        // Dùng id làm ID nếu có, nếu không thì để null để Backend tự tạo hoặc Frontend tạo GUID
        id: formik.values.id.trim() || undefined,
        idCongTy: formik.values.idCongTy,
        soKeHoach: formik.values.soKeHoach,
        tenKeHoach: formik.values.tenKeHoach,
        soQuyetDinh: formik.values.soQuyetDinh,
        idLoaiKeHoach: formik.values.idLoaiKeHoach,
        nam: formik.values.nam,
        idDonViGiao: formik.values.idDonViGiao,
        idDonViNhan: formik.values.idDonViNhan,
        idNguoiLapBieu: idNguoiLapBieu,
        nguoiLapBieuXacNhan: false,
        idTrinhDuyetGiamDoc: idTrinhDuyetGiamDoc,
        trinhDuyetGiamDocXacNhan: false,
        trangThai: 0,
        share: false,
        ghiChu: `Kế hoạch SCBD - ${departments.find((d: any) => d.id === formik.values.idDonViGiao)?.tenPhongBan || formik.values.idDonViGiao}`,
        danhSachTaiSan: danhSachTaiSan,
        nguoiKyList: intermediateSigners,
        tenMauBienBanSuaChua: formik.values.tenMauBienBanSuaChua,
      };

      onSave(newPlanData, isEdit);
      handleClose();
    },
  });

  const { data: fullDeptAssets = [] } = useAllAssetsByDepartmentQuery(
    formik.values.idDonViGiao,
  );

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      const listInfo = listSigneInfo(initialData, users, departments);
      formik.setValues({
        id: initialData?.id || "",
        tenKeHoach: initialData?.tenKeHoach || "",
        soKeHoach: initialData?.soKeHoach || "",
        nam: initialData?.nam || new Date().getFullYear(),
        idDonViGiao: initialData?.idDonViGiao || "",
        idDonViNhan: initialData?.idDonViNhan || "",
        soQuyetDinh: initialData?.soQuyetDinh || "",
        nguoiKyList: (listInfo || []).map((item, idx) => ({
          ...item,
          userId: item.idNhanVien,
          userName: item.hoTen,
          departmentId: item.idDonVi,
          departmentName: item.donVi,
          order: idx + 1,
        })),
        danhSachTaiSan: (initialData?.danhSachTaiSan || []).map((item) => ({
          ...item,
          deviceId: item.idTaiSan,
          quantity: item.soLuong ?? 1,
          idDonViBaoTri: item.idDonViBaoTri,
          month1: item.capSuaChuaThang1 ?? "",
          month2: item.capSuaChuaThang2 ?? "",
          month3: item.capSuaChuaThang3 ?? "",
          month4: item.capSuaChuaThang4 ?? "",
          month5: item.capSuaChuaThang5 ?? "",
          month6: item.capSuaChuaThang6 ?? "",
          month7: item.capSuaChuaThang7 ?? "",
          month8: item.capSuaChuaThang8 ?? "",
          month9: item.capSuaChuaThang9 ?? "",
          month10: item.capSuaChuaThang10 ?? "",
          month11: item.capSuaChuaThang11 ?? "",
          month12: item.capSuaChuaThang12 ?? "",
        })),
        idCongTy: initialData?.idCongTy || "CT001",
        idLoaiKeHoach: initialData?.idLoaiKeHoach || "THIET_BI",
        trangThai: initialData?.trangThai || 0,
        share: initialData?.share ?? false,
        tenMauBienBanSuaChua:
          initialData.tenMauBienBanSuaChua ||
          tenMauMacDinh ||
          `KẾ HOẠCH SỬA CHỮA BẢO DƯỠNG THIẾT BỊ NĂM ${initialData.nam}`,
      });
      return;
    }

    if (savedDraft) {
      formik.setValues(savedDraft);
      return;
    }

    formik.resetForm();
  }, [open, initialData, users, departments, savedDraft]);

  const handleClose = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [draftKey]: null,
          lastMinimizedDialog: null,
        },
      }),
    );
    formik.resetForm();
    onClose();
  };

  const handleMinimize = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [draftKey]: formik.values,
          lastMinimizedDialog: "plan",
        },
      }),
    );
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleMinimize}
      maxWidth="xl"
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
          Tạo kế hoạch mới
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
        {/* ── ROW 1: 2 cột trên cùng ── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 380px",
            gap: 3,
            mb: 3,
          }}
        >
          {/* ── CỘT TRÁI: Đơn vị + Chọn thiết bị ── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Thông tin kế hoạch */}
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 3,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Thông tin kế hoạch
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "0.7fr 1.2fr 1fr 0.5fr",
                  gap: 2,
                  alignItems: "end",
                }}
              >
                <FieldInput
                  title="Mã phiếu"
                  formik={formik}
                  field="soKeHoach"
                />
                <FieldInput
                  title="Tên kế hoạch"
                  formik={formik}
                  field="tenKeHoach"
                />
                <FieldInput
                  title="Số quyết định"
                  formik={formik}
                  field="soQuyetDinh"
                />
                <FieldYear title="Năm" formik={formik} field="nam" />
              </Box>
            </Box>

            {/* Đơn vị */}
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 3,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                1. Đơn vị
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <FieldAutoCompleted
                  title="Đơn vị quản lý (Nguồn)"
                  data={departments}
                  labelkey="tenPhongBan"
                  formik={formik}
                  field="idDonViGiao"
                  onChange={(value) => {
                    formik.setFieldValue("assets", []);
                  }}
                />
              </Box>
            </Box>
            {/* Chọn thiết bị */}
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 3,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                2. Chọn thiết bị
              </Typography>
              {!formik.values.idDonViGiao ? (
                <Alert severity="info">
                  Vui lòng chọn đơn vị quản lý trước
                </Alert>
              ) : (
                <StepAssets
                  idDonViGiao={formik.values.idDonViGiao}
                  assets={formik.values.danhSachTaiSan}
                  onAssetsChange={(assets) =>
                    formik.setFieldValue("danhSachTaiSan", assets)
                  }
                  allDeptDevices={fullDeptAssets}
                />
              )}
            </Box>
          </Box>

          {/* ── CỘT PHẢI: Quy trình duyệt ── */}
          <Box>
            <SignerWorkflowSection formik={formik} fieldName="nguoiKyList" />
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* ── Lịch sửa chữa ── */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
            3. Lịch sửa chữa bảo dưỡng
          </Typography>
          {formik.values.danhSachTaiSan.length === 0 ? (
            <Alert severity="info">Vui lòng chọn thiết bị trước</Alert>
          ) : (
            <StepSchedule
              assets={formik.values.danhSachTaiSan}
              onAssetsChange={(assets) =>
                formik.setFieldValue("danhSachTaiSan", assets)
              }
              deptDevices={fullDeptAssets}
              departments={departments}
            />
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* ── Xem trước ── */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
            4. Xem trước kế hoạch
          </Typography>
          <StepPreview
            idDonViGiao={formik.values.idDonViGiao}
            idDonViNhan={formik.values.idDonViNhan}
            assets={formik.values.danhSachTaiSan}
            signers={formik.values.nguoiKyList}
            deptDevices={fullDeptAssets}
            departments={departments}
            formik={formik}
            tieude={formik.values.tenMauBienBanSuaChua}
            nam={formik.values.nam}
          />
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} color="inherit">
          Hủy
        </Button>
        {isEdit ? (
          <Button onClick={() => formik.handleSubmit()} variant="outlined">
            Cập nhật
          </Button>
        ) : (
          <>
            <Button variant="contained" onClick={() => formik.handleSubmit()}>
              Gửi phê duyệt
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreatePlanDialog;
