import { useEffect, useState } from "react";
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
import IncidentPreview from "../preview/IncidentPreview";
import StepAssets from "../step/StepAssets";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import type { PlanSigner } from "../../../../mockdata/mockPlans";
import { MaintenancePlanData } from "../../types";
import type { IncidenData, IncidenDetailData } from "../../types/index";
import dayjs from "dayjs";
import {
  CongTy,
  LOAI_BIEN_BAN_TYPE,
  AssetGroup,
} from "../../../../utils/const";
import { generateCode } from "../../../../utils/helpers";
import { listSigneInfo } from "../../config";
import { FormikProvider, useFormik } from "formik";
import FieldInput from "../../../../components/TextField/FieldInput";
import FieldDateTime from "../../../../components/TextField/FieldDateTime";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import { IncidentValidation } from "../../validation";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { Remove } from "@mui/icons-material";
import { useBienBanSuaChuaPageQuery } from "../../../RepairReport/Mutation";
import { useAllAssetsByDepartmentQuery } from "../../../AssetManager/Mutation";
import { currentBrandConfig } from "../../../../config/brandConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  selectedPlans: MaintenancePlanData[];
  onSubmit: (rec: IncidenData) => void;
  initialIncident: IncidenData | null;
  nhomTaiSan?: string;
}

const ASSET_GROUP_OPTIONS = [
  { id: AssetGroup.MAYMOC, label: "Máy móc" },
  { id: AssetGroup.PHUONGTIEN, label: "Phương tiện" },
];

const IncidentDialog = ({
  open,
  onClose,
  selectedPlans,
  onSubmit,
  initialIncident,
  nhomTaiSan,
}: Props) => {
  const planIds = selectedPlans.map((p) => p.id);
  const [assets, setAssets] = useState<any[]>([]);

  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t) => t.path === tabPath);
    return tab?.formData?.incidentDraft ?? null;
  });

  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(
      0,
      9999,
      "",
      LOAI_BIEN_BAN_TYPE.PHIEU_SU_CO,
      true,
    );
  const mauMacDinh = repairReportPage?.data?.items?.[0];

  const formik = useFormik({
    initialValues: {
      id: "",
      idCongTy: CongTy.CT001,
      idKeHoach: "",
      soPhieu: "",
      idDonViBaoCao: "",
      ngayPhatHien: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      tenHeThongThietBi: "",
      phanHeViTri: "",
      mucDo: 2,
      moTa: "",
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      trangThai: 0,
      share: false,
      tenMauBienBan: mauMacDinh?.ten ?? `PHIẾU BÁO SỰ CỐ THIẾT BỊ`,
      congTy: mauMacDinh?.congTy ?? currentBrandConfig.company,
      ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      nhomTaiSan: nhomTaiSan ?? AssetGroup.MAYMOC,
      nguoiKyList: [] as any[],
      danhSachTaiSan: [] as any[],
    },
    // validationSchema: IncidentValidation,
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

      const rec: any = {
        ...values,
        idNguoiLap: idNguoiLapBieu,
        idGiamDoc: idTrinhDuyetGiamDoc,
        nguoiKyList: intermediateSigners,
        ngayPhatHien: dayjs(values.ngayPhatHien).format("YYYY-MM-DD HH:mm:ss"),
        ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      };

      dispatch(
        updateTabFormData({
          path: tabPath,
          data: { incidentDraft: null, lastMinimizedIncidentDialog: null },
        }),
      );

      onSubmit(rec);
      formik.resetForm();
      setAssets([]);
      onClose();
    },
  });

  // Load and Reset initial values
  useEffect(() => {
    if (!open) return;

    if (initialIncident) {
      const listInfo = listSigneInfo(initialIncident, apiUsers, apiDepartments);
      const signersList = (listInfo || []).map((item, idx) => ({
        ...item,
        userId: item.idNhanVien,
        userName: item.hoTen,
        departmentId: item.idDonVi,
        departmentName: item.donVi,
        order: idx + 1,
      }));

      const mappedAssets = (initialIncident.danhSachTaiSan || []).map(
        (a: IncidenDetailData) => ({
          id: a.id,
          deviceId: a.idTaiSan,
          tenTaiSan: a.tenTaiSan,
          tenNhom: a.tenNhomTaiSan,
          tenDonVi: a.tenDonViQuanLyKyThuat,
          tenHienTrang: a.tinhTrang,
          idDonViQuanLyKyThuat: a.idDonViQuanLyKyThuat,
          viTri: a.viTri,
          quantity: a.soLuong,
          thuocHeThong: a.thuocHeThong,
        }),
      );
      setAssets(mappedAssets);

      formik.setValues({
        id: initialIncident.id ?? "",
        idCongTy: initialIncident.idCongTy ?? CongTy.CT001,
        idKeHoach: initialIncident.idKeHoach ?? selectedPlans[0]?.id ?? "",
        soPhieu: initialIncident.soPhieu ?? "",
        idDonViBaoCao: initialIncident.idDonViBaoCao ?? "",
        ngayPhatHien:
          initialIncident.ngayPhatHien || dayjs().format("YYYY-MM-DD HH:mm:ss"),
        tenHeThongThietBi: initialIncident.tenHeThongThietBi ?? "",
        phanHeViTri: initialIncident.phanHeViTri ?? "",
        mucDo: initialIncident.mucDo ?? 2,
        moTa: initialIncident.moTa ?? "",
        idNguoiLap: initialIncident.idNguoiLap ?? "",
        nguoiLapXacNhan: initialIncident.nguoiLapXacNhan ?? false,
        idGiamDoc: initialIncident.idGiamDoc ?? "",
        giamDocXacNhan: initialIncident.giamDocXacNhan ?? false,
        trangThai: initialIncident.trangThai ?? 0,
        share: initialIncident.share ?? false,
        tenMauBienBan:
          initialIncident.tenMauBienBan ?? `PHIẾU BÁO SỰ CỐ THIẾT BỊ`,
        congTy: initialIncident.congTy ?? currentBrandConfig.company,
        ngayTao:
          initialIncident.ngayTao ||
          dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        nhomTaiSan:
          initialIncident.nhomTaiSan ?? nhomTaiSan ?? AssetGroup.MAYMOC,
        nguoiKyList: signersList,
        danhSachTaiSan: initialIncident.danhSachTaiSan || [],
      });
      return;
    }

    const listInfoFromParent =
      selectedPlans && selectedPlans.length > 0
        ? listSigneInfo(selectedPlans[0] as any, apiUsers, apiDepartments)
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
      setAssets(savedDraft.assets);
      formik.setValues({
        id: "",
        idCongTy: CongTy.CT001,
        idKeHoach: selectedPlans[0]?.id ?? "",
        soPhieu: savedDraft.soPhieu,
        idDonViBaoCao: savedDraft.idDonViBaoCao,
        ngayPhatHien: savedDraft.ngayPhatHien,
        tenHeThongThietBi: savedDraft.tenHeThongThietBi,
        phanHeViTri: savedDraft.phanHeViTri,
        mucDo: savedDraft.mucDo,
        moTa: savedDraft.moTa,
        idNguoiLap: "",
        nguoiLapXacNhan: false,
        idGiamDoc: "",
        giamDocXacNhan: false,
        trangThai: 0,
        share: false,
        tenMauBienBan: savedDraft.tenMauBienBan ?? `PHIẾU BÁO SỰ CỐ THIẾT BỊ`,
        congTy: savedDraft.congTy ?? currentBrandConfig.company,
        ngayTao: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        nhomTaiSan: savedDraft.nhomTaiSan ?? nhomTaiSan ?? AssetGroup.MAYMOC,
        nguoiKyList: savedDraft.nguoiKyList?.length
          ? savedDraft.nguoiKyList
          : signersListFromParent,
        danhSachTaiSan: savedDraft.danhSachTaiSan ?? [],
      });
      return;
    }

    setAssets([]);
    const defaultDept =
      selectedPlans && selectedPlans.length > 0
        ? selectedPlans[0].idDonViGiao || ""
        : "";
    const defaultNhomTaiSan =
      selectedPlans && selectedPlans.length > 0 && selectedPlans[0].nhomTaiSan
        ? selectedPlans[0].nhomTaiSan
        : (nhomTaiSan ?? AssetGroup.MAYMOC);
    formik.setValues({
      id: "",
      idCongTy: CongTy.CT001,
      idKeHoach:
        selectedPlans && selectedPlans.length > 0 ? selectedPlans[0].id : "",
      soPhieu: "",
      idDonViBaoCao: defaultDept,
      ngayPhatHien: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      tenHeThongThietBi: "",
      phanHeViTri: "",
      mucDo: 2,
      moTa: "",
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      trangThai: 0,
      share: false,
      tenMauBienBan: mauMacDinh?.ten ?? `PHIẾU BÁO SỰ CỐ THIẾT BỊ`,
      congTy: mauMacDinh?.congTy ?? currentBrandConfig.company,
      ngayTao: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      nhomTaiSan: defaultNhomTaiSan,
      nguoiKyList: signersListFromParent,
      danhSachTaiSan: [],
    });
  }, [
    open,
    initialIncident,
    selectedPlans,
    apiUsers,
    apiDepartments,
    savedDraft,
  ]);

  const handleAssetsChange = (newAssets: any[]) => {
    setAssets(newAssets);
    const nextList = newAssets.map((a: any) => ({
      id: a?.id,
      idTaiSan: a.deviceId ?? "",
      tenTaiSan: a.tenTaiSan ?? "",
      soLuong: a.quantity ?? 1,
      tinhTrang: a.tenHienTrang ?? "",
      tenNhomTaiSan: a.tenNhom || "",
      thuocHeThong: a.thuocHeThong ?? "",
      idDonViQuanLyKyThuat: a.idDonViQuanLyKyThuat ?? "",
      viTri: a.viTri ?? "",
    }));
    formik.setFieldValue("danhSachTaiSan", nextList);
  };

  const handleClose = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: { incidentDraft: null, lastMinimizedIncidentDialog: null },
      }),
    );
    formik.resetForm();
    setAssets([]);
    onClose();
  };

  const handleMinimize = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          incidentDraft: {
            soPhieu: formik.values.soPhieu,
            idDonViBaoCao: formik.values.idDonViBaoCao,
            ngayPhatHien: formik.values.ngayPhatHien,
            tenHeThongThietBi: formik.values.tenHeThongThietBi,
            phanHeViTri: formik.values.phanHeViTri,
            mucDo: formik.values.mucDo,
            moTa: formik.values.moTa,
            tenMauBienBan:
              formik.values.tenMauBienBan ||
              mauMacDinh?.ten ||
              `PHIẾU BÁO SỰ CỐ THIẾT BỊ`,
            congTy:
              formik.values.congTy ||
              mauMacDinh?.congTy ||
              currentBrandConfig.company,
            nhomTaiSan: formik.values.nhomTaiSan,
            nguoiKyList: formik.values.nguoiKyList,
            assets,
            danhSachTaiSan: formik.values.danhSachTaiSan,
          },
          lastMinimizedIncidentDialog: "incident",
        },
      }),
    );
    onClose();
  };

  const { data: fullDeptAssets = [] } = useAllAssetsByDepartmentQuery(
    formik.values.idDonViBaoCao,
  );

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
          Tạo Phiếu báo sự cố thiết bị
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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 380px",
                gap: 3,
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* ───────── Thông tin chung ───────── */}
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
                    <FieldInput title="Số phiếu" name="soPhieu" />

                    <FieldAutoCompleted
                      title="Đơn vị báo cáo"
                      data={apiDepartments}
                      labelkey="tenPhongBan"
                      name="idDonViBaoCao"
                      onChange={() => {
                        handleAssetsChange([]);
                      }}
                    />

                    {/* Ngày giờ phát hiện */}
                    <FieldDateTime
                      title="Ngày giờ phát hiện"
                      name="ngayPhatHien"
                    />

                    <FieldAutoCompleted
                      title="Loại tài sản"
                      data={ASSET_GROUP_OPTIONS}
                      labelkey="label"
                      name="nhomTaiSan"
                      onChange={() => {
                        handleAssetsChange([]);
                      }}
                    />

                    <FieldInput
                      title="Tên hệ thống/thiết bị gặp sự cố"
                      name="tenHeThongThietBi"
                    />

                    <FieldInput
                      title="Phân hệ/vị trí xảy ra sự cố"
                      name="phanHeViTri"
                    />

                    <FieldAutoCompleted
                      title="Mức độ"
                      name="mucDo"
                      data={[
                        { id: 0, name: "Nhẹ" },
                        { id: 1, name: "Trung bình" },
                        { id: 2, name: "Nặng" },
                        { id: 3, name: "Nghiêm trọng" },
                      ]}
                      labelkey="name"
                    />

                    <FieldInput
                      title="Mô tả tình trạng sự cố"
                      name="moTa"
                      multiline
                      rows={4}
                    />
                  </Box>
                </Box>

                {/* ───────── Danh sách thiết bị liên quan ───────── */}
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    p: 2.5,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Danh sách thiết bị liên quan{" "}
                    <span style={{ color: "#d32f2f" }}>*</span>
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {!formik.values.idDonViBaoCao && (
                      <Typography variant="body2" color="text.secondary">
                        Chọn đơn vị báo cáo để xem thiết bị.
                      </Typography>
                    )}
                    {formik.values.idDonViBaoCao && (
                      <StepAssets
                        idDonViGiao={formik.values.idDonViBaoCao}
                        assets={assets}
                        onAssetsChange={handleAssetsChange}
                        allDeptDevices={fullDeptAssets}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              {/* ───────── Quy trình duyệt (bên phải) ───────── */}
              <Box>
                <SignerWorkflowSection formik={formik} />
              </Box>
            </Box>

            {/* ── Preview FULL WIDTH với deviceEntries có thể edit ── */}
            <Box>
              <IncidentPreview
                number={formik.values.soPhieu}
                detectedAt={formik.values.ngayPhatHien}
                reporter={""}
                reporterDeptId={formik.values.idDonViBaoCao}
                signers={formik.values.nguoiKyList}
                systemName={formik.values.tenHeThongThietBi}
                subsystem={formik.values.phanHeViTri}
                location={""}
                description={formik.values.moTa}
                severity={formik.values.mucDo}
                deviceEntries={formik.values.danhSachTaiSan}
                onDeviceEntriesChange={(newEntries) => {
                  formik.setFieldValue("danhSachTaiSan", newEntries);
                }}
                planIds={planIds}
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
        {initialIncident?.id ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => formik.handleSubmit()}
          >
            Cập Nhật
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => formik.handleSubmit()}
          >
            Tạo Phiếu và Lưu
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default IncidentDialog;
