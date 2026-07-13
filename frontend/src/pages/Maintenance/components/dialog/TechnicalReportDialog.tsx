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
import { Remove } from "@mui/icons-material";

import type { PlanSigner } from "../../../../mockdata/mockPlans";
import TechnicalReportPreview from "../preview/TechnicalReportPreview";
import { MaintenancePlanData } from "../../types";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { generateCode } from "../../../../utils/helpers";
import { CongTy, LOAI_BIEN_BAN_TYPE } from "../../../../utils/const";
import dayjs from "dayjs";
import { TechnicalReportData } from "../../types";
import { listSigneInfo } from "../../config";
import FieldInput from "../../../../components/TextField/FieldInput";
import { useFormik } from "formik";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { currentBrandConfig } from "../../../../config/brandConfig";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import FieldDate from "../../../../components/TextField/FieldDate";
import { useTechnicalReportMutation } from "../../mutation";

interface Props {
  open: boolean;
  onClose: () => void;
  plan: MaintenancePlanData;
  selectedDeviceIds: string[];
  selectedMonth: number;
  initialData?: TechnicalReportData | null;
}

const TechnicalReportDialog = ({
  open,
  onClose,
  plan,
  selectedDeviceIds,
  selectedMonth,
  initialData,
}: Props) => {
  const sourceDeptId = plan.idDonViGiao || "";
  const execDeptId = plan.idDonViNhan || "";

  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const {
    createMutation: createTechMutation,
    updateMutation: updateTechMutation,
  } = useTechnicalReportMutation();

  // Tạo Tên thiết bị chung từ danh sách thiết bị
  const tenTaiSanDefault = selectedDeviceIds
    .map((id) => plan.danhSachTaiSan?.find((ts) => ts.id === id)?.tenTaiSan)
    .filter(Boolean)
    .join(", ");

  const formik = useFormik({
    initialValues: {
      id: "",
      idCongTy: CongTy.CT001,
      idKeHoach: plan?.id || "",
      thang: selectedMonth,
      nam: plan?.nam || new Date().getFullYear(),
      ghiChu: "",
      donViBaoCao: sourceDeptId,
      donViNhan: execDeptId,
      tenTaiSan: tenTaiSanDefault,
      ngayBaoDuongGanNhat: "",
      tinhTrang: "",
      noiDungSuaChua: "",

      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      tenMauBienBan: "BÁO CÁO TÌNH TRẠNG KỸ THUẬT",
      congTy: currentBrandConfig.company,
      ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      ngayCapNhat: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      danhSachTaiSan: [] as any[],
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
                idNguoiKy: s.userId,
                tenNguoiKy: s.userName,
                idPhongBan: s.departmentId,
                trangThai: 0,
              }))
          : [];

      const req: TechnicalReportData = {
        ...values,
        idNguoiLap: idNguoiLapBieu,
        idGiamDoc: idTrinhDuyetGiamDoc,
        nguoiKyList: intermediateSigners,
        ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        ngayCapNhat: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      };

      dispatch(
        updateTabFormData({
          path: tabPath,
          data: { [`techReportDraft_${plan.id}`]: null },
        }),
      );
      if (initialData?.id) {
        updateTechMutation.mutateAsync(req, {
          onSuccess: () => {
            formik.resetForm();
            onClose();
          },
        });
      } else {
        createTechMutation.mutateAsync(req, {
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
    return tab?.formData?.[`techReportDraft_${plan.id}`] ?? null;
  });

  useEffect(() => {
    if (!open) return;

    const assetsList = (plan?.danhSachTaiSan || [])
      ?.filter((item) => selectedDeviceIds.includes(item.id ?? ""))
      ?.map((s: any) => ({
        idTaiSan: s.idTaiSan || "",
        tenTaiSan: s.tenTaiSan || "",
        idKeHoachChiTiet: s.id || "",
      }));

    if (initialData) {
      const listInfo = listSigneInfo(initialData, apiUsers, apiDepartments);
      const signersList = (listInfo || []).map((item, idx) => ({
        ...item,
        userId: item.idNhanVien,
        userName: item.hoTen,
        departmentId: item.idDonVi,
        departmentName: item.donVi,
        order: idx + 1,
      }));

      formik.setValues({
        id: initialData.id || "",
        idCongTy: initialData.idCongTy || CongTy.CT001,
        idKeHoach: initialData.idKeHoach ?? plan?.id ?? "",
        thang: initialData.thang ?? selectedMonth,
        nam: plan?.nam ?? new Date().getFullYear(),
        ghiChu: initialData.ghiChu ?? "",
        donViBaoCao: initialData.donViBaoCao || sourceDeptId,
        donViNhan: initialData.donViNhan || execDeptId,
        tenTaiSan: initialData.tenTaiSan || tenTaiSanDefault,
        ngayBaoDuongGanNhat: initialData.ngayBaoDuongGanNhat || "",
        tinhTrang: initialData.tinhTrang || "",
        noiDungSuaChua: initialData.noiDungSuaChua || "",

        idNguoiLap: initialData.idNguoiLap ?? "",
        nguoiLapXacNhan: initialData.nguoiLapXacNhan ?? false,
        idGiamDoc: initialData.idGiamDoc ?? "",
        giamDocXacNhan: initialData.giamDocXacNhan ?? false,
        share: initialData.share ?? false,
        trangThai: initialData.trangThai ?? 0,

        ngayTao:
          initialData.ngayTao ||
          dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        ngayCapNhat: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        tenMauBienBan:
          initialData.tenMauBienBan || "BÁO CÁO TÌNH TRẠNG KỸ THUẬT",
        congTy: initialData.congTy || currentBrandConfig.company,
        danhSachTaiSan:
          assetsList.length > 0
            ? assetsList
            : (initialData.danhSachTaiSan ?? []),
        nguoiKyList: signersList,
      });
      return;
    }

    if (savedDraft) {
      formik.setValues({
        ...formik.initialValues,
        ...savedDraft,
        idKeHoach: plan?.id || "",
        thang: selectedMonth,
        nam: plan?.nam || 2026,
        danhSachTaiSan: assetsList,
        donViBaoCao: sourceDeptId,
        donViNhan: execDeptId,
      });
      return;
    }

    const listInfoFromPlan = listSigneInfo(plan, apiUsers, apiDepartments);
    const signersListFromPlan = (listInfoFromPlan || []).map(
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
      ...formik.initialValues,
      idKeHoach: plan?.id || "",
      thang: selectedMonth,
      nam: plan?.nam || 2026,
      tenTaiSan: tenTaiSanDefault,
      danhSachTaiSan: assetsList,
      nguoiKyList: signersListFromPlan,
    });
  }, [
    open,
    initialData,
    apiUsers,
    apiDepartments,
    selectedDeviceIds,
    plan,
    savedDraft,
  ]);

  const handleClose = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`techReportDraft_${plan.id}`]: null,
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
          [`techReportDraft_${plan.id}`]: formik.values,
          lastMinimizedDialog: "techReport",
        },
      }),
    );
    onClose(); // không resetForm
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
          Báo cáo tình trạng kỹ thuật
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
          {/* ── Hàng trên: 2 cột ── */}
          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 3 }}
          >
            {/* ── Cột trái: Thông tin ── */}
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
                  Thông tin
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Căn cứ Kế hoạch SCBD tháng <b>{selectedMonth}</b> năm{" "}
                    <b>{plan.nam}</b>
                  </Typography>
                  <FieldAutoCompleted
                    title="Đơn vị báo cáo"
                    data={apiDepartments}
                    labelkey="tenPhongBan"
                    labelOption="id"
                    formik={formik}
                    field="donViBaoCao"
                  />
                  <FieldAutoCompleted
                    title="Đơn vị nhận báo cáo"
                    data={apiDepartments}
                    labelkey="tenPhongBan"
                    labelOption="id"
                    formik={formik}
                    field="donViNhan"
                  />
                  <FieldInput
                    title="Tên thiết bị"
                    field="tenTaiSan"
                    formik={formik}
                    multiline
                    rows={2}
                  />
                  <FieldDate
                    title="Ngày báo dưỡng gần nhất"
                    field="ngayBaoDuongGanNhat"
                    formik={formik}
                  />
                  <FieldInput
                    title="Tình trạng kỹ thuật"
                    field="tinhTrang"
                    formik={formik}
                    multiline
                    rows={2}
                  />
                  <FieldInput
                    title="Nội dung sửa chữa"
                    field="noiDungSuaChua"
                    formik={formik}
                    multiline
                    rows={4}
                  />
                </Box>
              </Box>
            </Box>

            {/* ── Cột phải: Quy trình duyệt ── */}
            <Box>
              <SignerWorkflowSection formik={formik} />
            </Box>
          </Box>

          {/* ── Hàng dưới: Preview FULL WIDTH ── */}
          <Box>
            <TechnicalReportPreview
              data={formik.values}
              departments={apiDepartments}
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
          {initialData?.id ? "Cập nhật" : "Tạo & Gửi duyệt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TechnicalReportDialog;
