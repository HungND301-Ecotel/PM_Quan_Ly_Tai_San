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
} from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import CloseIcon from "@mui/icons-material/Close";
import { useSelector } from "react-redux";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { useBienPhapMayMocMutation } from "../../mutation/MachineMeasure";
import { BienPhapMayMocData, InspectionRecordData } from "../../types";
import { CongTy, LOAI_BIEN_BAN_TYPE } from "../../../../utils/const";
import { generateCode } from "../../../../utils/helpers";
import { PlanSigner } from "../../../../mockdata/mockPlans";
import { listSigneInfo } from "../../config";
import dayjs from "dayjs";
import FileAttachmentInput from "../../../../components/TextField/FileAttachmentInput";
import S3Service from "../../../../services/S3Service";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import FieldDate from "../../../../components/TextField/FieldDate";
import FieldInput from "../../../../components/TextField/FieldInput";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import { MachineMeasuresValidation } from "../../validation";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { Remove } from "@mui/icons-material";
import MeasureMachinPreview from "../preview/MeasureMachinPreview";
import { useBienBanSuaChuaPageQuery } from "../../../RepairReport/Mutation";
import { currentBrandConfig } from "../../../../config/brandConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  inspectionRecord?: InspectionRecordData | null;
  initData?: BienPhapMayMocData | null;
}

const BienPhapMayMocDialog = ({
  open,
  onClose,
  inspectionRecord,
  initData,
}: Props) => {
  const { user } = useSelector((state: any) => state.user);
  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const [document, setDocument] = useState<File | string | any>("");
  const { createMutation, updateMutation } = useBienPhapMayMocMutation();

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return (
      tab?.formData?.[`bienPhapMayMocDraft_${inspectionRecord?.id}`] ?? null
    );
  });
  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(
      0,
      9999,
      "",
      LOAI_BIEN_BAN_TYPE.BIEN_PHAP_MAY_MOC,
      true,
    );
  const mauMacDinh = repairReportPage?.data?.items?.[0];

  const initialValues: BienPhapMayMocData & { nguoiKyList: any[] } = {
    id: "",
    idCongTy: CongTy.CT001,
    idGiamDinhMayMoc: inspectionRecord?.id || "",
    soPhieu: "",
    soDeNghi: "",
    donViSuaChua: "",
    donViPhoiHop: "",
    hinhThuc: "",
    thoiGianBatDau: dayjs().format("YYYY-MM-DD"),
    thoiGianKetThuc: dayjs().format("YYYY-MM-DD"),
    thoiGianNgay: 0,
    ghiChu: "",
    tenFile: "",
    duongDanFile: "",
    idNguoiLap: "",
    nguoiLapXacNhan: false,
    idGiamDoc: "",
    giamDocXacNhan: false,
    share: false,
    trangThai: 0,
    tenMauBienBan: mauMacDinh?.ten || "BIỆN PHÁP SỬA CHỮA MÁY MÓC THIẾT BỊ",
    congTy: mauMacDinh?.congTy || currentBrandConfig.company,
    nguoiKyList: [],
  };

  const formik = useFormik({
    initialValues,
    // validationSchema: MachineMeasuresValidation,
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

      let keyTailieu = "";
      if (document instanceof File) {
        keyTailieu = await S3Service.put({
          name: document.name,
          file: document,
          type: "tailieu",
        });
      }
      const payload: BienPhapMayMocData = {
        ...values,
        duongDanFile: keyTailieu,
        tenFile: document?.name,
        idNguoiLap,
        idGiamDoc,
        nguoiKyList,
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
      const listInfo = listSigneInfo(initData, apiUsers, apiDepartments);
      formik.setValues({
        ...initData,
        tenMauBienBan:
          initData?.tenMauBienBan ||
          mauMacDinh?.ten ||
          "BIỆN PHÁP SỬA CHỮA MÁY MÓC THIẾT BỊ",
        congTy:
          initData?.congTy || mauMacDinh?.congTy || currentBrandConfig.company,
        nguoiKyList: (listInfo ?? []).map((item: any) => ({
          userId: item.idNhanVien,
          userName: item.hoTen,
          departmentId: item.idDonVi,
          departmentName: item.donVi,
        })),
      } as any);
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
        idGiamDinhMayMoc: inspectionRecord?.id || "",
        soPhieu: savedDraft.soPhieu,
        soDeNghi: savedDraft.soDeNghi,
        donViSuaChua: savedDraft.donViSuaChua,
        donViPhoiHop: savedDraft.donViPhoiHop,
        hinhThuc: savedDraft.hinhThuc,
        thoiGianBatDau: savedDraft.thoiGianBatDau,
        thoiGianKetThuc: savedDraft.thoiGianKetThuc,
        thoiGianNgay: savedDraft.thoiGianNgay,
        ghiChu: savedDraft.ghiChu,
        tenMauBienBan: savedDraft.tenMauBienBan,
        congTy: savedDraft.congTy,
        nguoiKyList: savedDraft.nguoiKyList,
      });
      return;
    }

    formik.setValues({
      ...initialValues,
      nguoiKyList: signersListFromParent,
    });
  }, [open, initData, inspectionRecord, apiUsers, apiDepartments, savedDraft]);

  function handleClose() {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`bienPhapMayMocDraft_${inspectionRecord?.id}`]: null,
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
          [`bienPhapMayMocDraft_${inspectionRecord?.id}`]: {
            idGiamDinhMayMoc: formik.values.idGiamDinhMayMoc,
            soPhieu: formik.values.soPhieu,
            soDeNghi: formik.values.soDeNghi,
            donViSuaChua: formik.values.donViSuaChua,
            donViPhoiHop: formik.values.donViPhoiHop,
            hinhThuc: formik.values.hinhThuc,
            thoiGianBatDau: formik.values.thoiGianBatDau,
            thoiGianKetThuc: formik.values.thoiGianKetThuc,
            thoiGianNgay: formik.values.thoiGianNgay,
            ghiChu: formik.values.ghiChu,
            tenMauBienBan: formik.values.tenMauBienBan,
            congTy: formik.values.congTy,
            nguoiKyList: formik.values.nguoiKyList,
          },
          lastMinimizedDialog: "bienPhapMayMoc",
        },
      }),
    );
    onClose();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <FormikProvider value={formik}>
      <Dialog
        open={open}
        onClose={handleMinimize}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: "90vh" } }}
      >
        {/* Title */}
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BuildIcon color="warning" />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Biên pháp sửa chữa máy móc
              </Typography>
              {inspectionRecord?.soPhieu && (
                <Typography variant="caption" color="text.secondary">
                  Căn cứ BB giám định: {inspectionRecord?.soPhieu}
                </Typography>
              )}
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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 400px",
              gap: 3,
              // height: "100%",
            }}
          >
            {/* ── LEFT: Form nhập liệu ── */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
                overflowY: "auto",
              }}
            >
              {/* Thông tin chính */}
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
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <FieldInput title="Số phiếu" name="soPhieu" />
                    <FieldInput title="Số đề nghị" name="soDeNghi" />
                  </Box>
                  <FieldAutoCompleted
                    title="Đơn vị sửa chữa"
                    data={apiDepartments}
                    labelkey="tenPhongBan"
                    name="donViSuaChua"
                    value={formik.values.donViSuaChua ?? ""}
                  />
                  <FieldAutoCompleted
                    title="Đơn vị phối hợp"
                    data={apiDepartments}
                    labelkey="tenPhongBan"
                    name="donViPhoiHop"
                    value={formik.values.donViPhoiHop ?? ""}
                  />
                  <FieldInput title="Hình thức sửa chữa" name="hinhThuc" />
                </Box>
              </Box>

              {/* Thời gian */}
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  p: 2.5,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Thời gian thực hiện
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <FieldDate
                      title="Thời gian bắt đầu"
                      name="thoiGianBatDau"
                      onChange={(value) => {
                        // tự tính số ngày
                        if (formik.values.thoiGianKetThuc) {
                          const diff = dayjs(
                            formik.values.thoiGianKetThuc,
                          ).diff(dayjs(value), "day");
                          formik.setFieldValue(
                            "thoiGianNgay",
                            Math.max(0, diff),
                          );
                        }
                      }}
                    />
                    <FieldDate
                      title="Thời gian kết thúc"
                      name="thoiGianKetThuc"
                      onChange={(value) => {
                        if (formik.values.thoiGianBatDau) {
                          const diff = dayjs(value).diff(
                            dayjs(formik.values.thoiGianBatDau),
                            "day",
                          );
                          formik.setFieldValue(
                            "thoiGianNgay",
                            Math.max(0, diff),
                          );
                        }
                      }}
                    />
                  </Box>
                  <FieldInput
                    title="Thời gian thực hiện (số ngày)"
                    type="number"
                    name="thoiGianNgay"
                    slotProps={{
                      input: { min: 0 },
                      helperText: {
                        children: "Tự tính khi chọn ngày bắt đầu và kết thúc",
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Ghi chú */}
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  p: 2.5,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Ghi chú
                </Typography>
                <FieldInput title="Ghi chú" name="ghiChu" multiline rows={3} />
              </Box>

              {/* File đính kèm */}
              <Box mt={4} mb={4}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  Tài liệu đính kèm
                </Typography>

                <FileAttachmentInput
                  formik={formik}
                  fileName="tenFile"
                  filePath="duongDanFile"
                  setDocument={setDocument}
                />
              </Box>
            </Box>

            {/* ── RIGHT: Luồng ký ── */}
            <Box>
              <SignerWorkflowSection formik={formik} />
            </Box>
          </Box>
          <Box>
            <MeasureMachinPreview
              row={formik.values}
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
            color="warning"
            disabled={isPending || formik.values.nguoiKyList.length === 0}
            onClick={() => formik.submitForm()}
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

export default BienPhapMayMocDialog;
