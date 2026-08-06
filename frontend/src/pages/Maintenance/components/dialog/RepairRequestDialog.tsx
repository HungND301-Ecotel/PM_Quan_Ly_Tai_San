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

import type { PlanSigner } from "../../../../mockdata/mockPlans";
import RepairRequestPreview from "../preview/RepairRequestPreview";
import { MaintenancePlanData } from "../../types";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { generateCode } from "../../../../utils/helpers";
import { CongTy, LOAI_BIEN_BAN_TYPE } from "../../../../utils/const";
import dayjs from "dayjs";
import { MaintenanceRepairData } from "../../types";
import { listSigneInfo } from "../../config";
import FieldInput from "../../../../components/TextField/FieldInput";
import { FormikProvider, useFormik } from "formik";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import { MaintenanceValidation } from "../../validation";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import {
  clearTabFormData,
  updateTabFormData,
} from "../../../../redux/tabsSlice";
import { MinimizeIcon } from "lucide-react";
import { Remove } from "@mui/icons-material";
import { useBienBanSuaChuaPageQuery } from "../../../RepairReport/Mutation";
import { currentBrandConfig } from "../../../../config/brandConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  plan: MaintenancePlanData;
  selectedDeviceIds: string[];
  selectedMonth: number;
  onSubmit: (req: MaintenanceRepairData) => void;
  initialData?: MaintenanceRepairData | null;
}

const RepairRequestDialog = ({
  open,
  onClose,
  plan,
  selectedDeviceIds,
  selectedMonth,
  onSubmit,
  initialData,
}: Props) => {
  const sourceDeptId = plan.idDonViGiao || "";
  const execDeptId = plan.idDonViNhan || "";

  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(0, 9999, "", LOAI_BIEN_BAN_TYPE.SUA_CHUA, true);
  const mauMacDinh = repairReportPage?.data?.items?.[0];

  const formik = useFormik({
    initialValues: {
      id: "",
      idCongTy: CongTy.CT001,
      soPhieu: "",
      idKeHoach: plan?.id || "",
      thang: selectedMonth,
      nam: plan?.nam || 2026,
      ghiChu: "",
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      tenMauBienBan: mauMacDinh?.ten || "ĐỀ NGHỊ SỬA CHỮA, BẢO DƯỠNG THIẾT BỊ",
      congTy: mauMacDinh?.congTy || currentBrandConfig.company,
      ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      ngayCapNhat: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      danhSachTaiSan: [] as any[],
      nguoiKyList: [] as any[],
    },
    // validationSchema: MaintenanceValidation,
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

      const req: MaintenanceRepairData = {
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
          data: { [`repairDraft_${plan.id}`]: null },
        }),
      );
      onSubmit(req);
      formik.resetForm();
      onClose();
    },
  });

  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t) => t.path === tabPath);
    return tab?.formData?.[`repairDraft_${plan.id}`] ?? null;
  });

  useEffect(() => {
    if (!open) return;
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
        soPhieu: initialData.soPhieu ?? "",
        idKeHoach: initialData.idKeHoach ?? plan?.id ?? "",
        thang: initialData.thang ?? selectedMonth,
        nam: plan?.nam ?? new Date().getFullYear(),
        ghiChu: initialData.ghiChu ?? "",
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
          initialData.tenMauBienBan ||
          mauMacDinh?.ten ||
          "ĐỀ NGHỊ SỬA CHỮA, BẢO DƯỠNG THIẾT BỊ",
        congTy:
          initialData.congTy ||
          mauMacDinh?.congTy ||
          currentBrandConfig.company,
        danhSachTaiSan: initialData.danhSachTaiSan ?? [],
        nguoiKyList: signersList,
      });
      return;
    }

    // Luôn tính lại danhSachTaiSan từ props
    const assetsList = (plan?.danhSachTaiSan || [])
      ?.filter((item) => selectedDeviceIds.includes(item.id ?? ""))
      ?.map((s: any) => {
        const level = s[`capSuaChuaThang${selectedMonth}`] || "";
        return {
          idKeHoachChiTiet: s.id || "",
          idTaiSan: s.idTaiSan || "",
          tenTaiSan: s.tenTaiSan || "",
          nhomTaiSan: s.idNhomTaiSan || "",
          capSuaChua: level,
          soLuong: s.soLuong,
          donViQuanLy: plan.idDonViGiao || "",
          donViBaoTri: s.idDonViBaoTri || "",
        };
      });

    if (savedDraft) {
      formik.setValues({
        id: "",
        idCongTy: CongTy.CT001,
        soPhieu: savedDraft.soPhieu,
        idKeHoach: plan?.id || "",
        thang: selectedMonth,
        nam: plan?.nam || 2026,
        ghiChu: savedDraft.ghiChu,
        idNguoiLap: "",
        nguoiLapXacNhan: false,
        idGiamDoc: "",
        giamDocXacNhan: false,
        share: false,
        trangThai: 0,
        ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        ngayCapNhat: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        tenMauBienBan:
          savedDraft.tenMauBienBan ||
          mauMacDinh?.ten ||
          "ĐỀ NGHỊ SỬA CHỮA, BẢO DƯỠNG THIẾT BỊ",
        congTy:
          savedDraft.congTy || mauMacDinh?.congTy || currentBrandConfig.company,
        danhSachTaiSan: assetsList,
        nguoiKyList: savedDraft.nguoiKyList,
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
      id: "",
      idCongTy: CongTy.CT001,
      soPhieu: "",
      idKeHoach: plan?.id || "",
      thang: selectedMonth,
      nam: plan?.nam || 2026,
      ghiChu: "",
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      tenMauBienBan: mauMacDinh?.ten || "ĐỀ NGHỊ SỬA CHỮA, BẢO DƯỠNG THIẾT BỊ",
      congTy: mauMacDinh?.congTy || currentBrandConfig.company,
      ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      ngayCapNhat: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
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
        data: { [`repairDraft_${plan.id}`]: null, lastMinimizedDialog: null },
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
          [`repairDraft_${plan.id}`]: {
            soPhieu: formik.values.soPhieu,
            ghiChu: formik.values.ghiChu,
            tenMauBienBan: formik.values.tenMauBienBan,
            congTy: formik.values.congTy,
            nguoiKyList: formik.values.nguoiKyList,
          },
          lastMinimizedDialog: "repair",
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
          Tạo Giấy đề nghị sửa chữa
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
        <FormikProvider value={formik}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* ── Hàng trên: 2 cột ── */}
            <Box
              sx={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 3 }}
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
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <FieldInput title="Số giấy đề nghị" name="soPhieu" />
                    <Typography variant="body2" color="text.secondary">
                      Căn cứ Kế hoạch SCBD tháng <b>{selectedMonth}</b> năm{" "}
                      <b>{plan.nam}</b>
                      &nbsp;—&nbsp;Số thiết bị:{" "}
                      <b>{selectedDeviceIds.length}</b>
                    </Typography>
                    <FieldInput
                      title="Nội dung sửa chữa"
                      name="ghiChu"
                      multiline
                      rows={3}
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
              <RepairRequestPreview
                assets={formik.values.danhSachTaiSan}
                month={initialData?.thang ? initialData?.thang : selectedMonth}
                year={plan.nam}
                number={formik.values.soPhieu}
                signers={formik.values.nguoiKyList}
                sourceDeptId={sourceDeptId}
                execDeptId={execDeptId}
                note={formik.values.ghiChu}
                tieude={formik.values.tenMauBienBan}
                congty={formik.values.congTy}
              />
            </Box>
          </Box>
        </FormikProvider>
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
          Tạo &amp; Gửi duyệt
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RepairRequestDialog;
