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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import IncidentInspectionPreview from "../preview/IncidentInspectionPreview";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { MaintenancePlanData } from "../../types";
import {
  IncidenData,
  IncidentInspectionData,
  IncidentInspectionDetailData,
  IncidentInspectionVatTuData,
} from "../../types";
import { listSigneInfo } from "../../config";
import { PlanSigner } from "../../../../mockdata/mockPlans";
import { generateCode } from "../../../../utils/helpers";
import { CongTy, LOAI_BIEN_BAN_TYPE } from "../../../../utils/const";
import { useMaintenanceIncidentInspectionMutation } from "../../mutation";
import FieldDate from "../../../../components/TextField/FieldDate";
import { useAllToolDetailQuery } from "../../../ToolManager/Mutation";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import FieldInput from "../../../../components/TextField/FieldInput";
import dayjs from "dayjs";
import React from "react";
import { FormikProvider, useFormik } from "formik";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import { IncidentInspectionValidation } from "../../validation";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { Remove } from "@mui/icons-material";
import { useBienBanSuaChuaPageQuery } from "../../../RepairReport/Mutation";
import { currentBrandConfig } from "../../../../config/brandConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  incidentReport: IncidenData;
  selectedDeviceIds: string[];
  initData?: IncidentInspectionData | null;
}

const IncidentInspectionDialog = ({
  open,
  onClose,
  incidentReport,
  selectedDeviceIds,
  initData,
}: Props) => {
  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const { data: allToolDetail = [] } = useAllToolDetailQuery();
  const {
    createMutation: createIncInspMutation,
    updateMutation: updateIncInspMutation,
  } = useMaintenanceIncidentInspectionMutation();

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return (
      tab?.formData?.[`incidentInspectionDraft_${incidentReport?.id}`] ?? null
    );
  });

  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(
      0,
      9999,
      "",
      LOAI_BIEN_BAN_TYPE.KIEM_TRA_SU_CO,
      true,
    );
  const mauMacDinh = repairReportPage?.data?.items?.[0];

  const formik = useFormik({
    initialValues: {
      id: "",
      idCongTy: CongTy.CT001,
      idSuCo: incidentReport?.id || "",
      soPhieu: "",
      ngayKiemTra: dayjs().format("YYYY-MM-DD"),
      viTri: "",
      nhanXetKetLuan: "",
      bienPhapXuLy: "",
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      trangThai: 0,
      share: false,
      tenMauBienBan: mauMacDinh?.ten ?? `KIỂM TRA SỰ CỐ THIẾT BỊ`,
      congTy: mauMacDinh?.congTy ?? currentBrandConfig.company,
      danhSachChiTiet: [] as IncidentInspectionDetailData[],
      nguoiKyList: [] as any[],
    },
    // validationSchema: IncidentInspectionValidation,
    onSubmit: (values) => {
      dispatch(
        updateTabFormData({
          path: tabPath,
          data: {
            [`incidentInspectionDraft_${incidentReport?.id}`]: null,
            lastMinimizedDialog: null,
          },
        }),
      );
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
                id: (s as any).id || `${generateCode("SIG-")}-${idx}`,
                idNguoiKy: s.userId,
                tenNguoiKy: s.userName,
                idPhongBan: s.departmentId,
                trangThai: 0,
              }))
          : [];

      const record: IncidentInspectionData = {
        ...initData,
        ...values,
        idCongTy: CongTy.CT001,
        idSuCo: incidentReport.id,
        idNguoiLap: idNguoiLapBieu,
        idGiamDoc: idTrinhDuyetGiamDoc,
        nguoiKyList: intermediateSigners,
        danhSachChiTiet: values.danhSachChiTiet.map((entry) => {
          const actualDetailId = entry.id ? entry.id : generateCode("KSCT_");
          return {
            id: actualDetailId,
            idTaiSan: entry.idTaiSan,
            idSuCoChiTiet: entry.idSuCoChiTiet,
            danhSachVatTu: (entry.danhSachVatTu || []).map((vt) => ({
              id: vt.id ? vt.id : generateCode("KSVT_"),
              idChiTietKiemTraSuCo: actualDetailId,
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
      };

      if (initData) {
        updateIncInspMutation.mutate(record, {
          onSuccess: () => {
            handleClose();
          },
        });
      } else {
        createIncInspMutation.mutate(record, {
          onSuccess: () => {
            handleClose();
          },
        });
      }
    },
  });

  useEffect(() => {
    if (!open) return;

    if (initData) {
      const listInfo = listSigneInfo(initData, apiUsers, apiDepartments);
      const signersList = (listInfo ?? []).map((item: any, idx: number) => ({
        userId: item.idNhanVien || item.userId,
        userName: item.hoTen || item.userName,
        departmentId: item.idDonVi || item.departmentId,
        departmentName: item.donVi || item.departmentName,
        position: item.tenChucVu || item.position || "",
        order: idx + 1,
        signed: item.signed || false,
      }));

      formik.setValues({
        id: initData.id ?? "",
        idCongTy: initData.idCongTy ?? CongTy.CT001,
        idSuCo: initData.idSuCo ?? incidentReport.id,
        soPhieu: initData.soPhieu ?? "",
        ngayKiemTra: initData.ngayKiemTra ?? dayjs().format("YYYY-MM-DD"),
        viTri: initData.viTri ?? "",
        nhanXetKetLuan: initData.nhanXetKetLuan ?? "",
        bienPhapXuLy: initData.bienPhapXuLy ?? "",
        idNguoiLap: initData.idNguoiLap ?? "",
        nguoiLapXacNhan: initData.nguoiLapXacNhan ?? false,
        idGiamDoc: initData.idGiamDoc ?? "",
        giamDocXacNhan: initData.giamDocXacNhan ?? false,
        trangThai: initData.trangThai ?? 0,
        share: initData.share ?? false,
        tenMauBienBan:
          initData.tenMauBienBan ??
          mauMacDinh?.ten ??
          `KIỂM TRA SỰ CỐ THIẾT BỊ`,
        congTy:
          initData.congTy ?? mauMacDinh?.congTy ?? currentBrandConfig.company,
        danhSachChiTiet: (initData.danhSachChiTiet || []).map((d: any) => ({
          ...d,
          danhSachVatTu: (d.danhSachVatTu || []).map((vt: any) => ({ ...vt })),
        })),
        nguoiKyList: signersList,
      });
      return;
    }

    const danhSachChiTiet = (incidentReport?.danhSachTaiSan || [])
      .filter((d: any) => selectedDeviceIds.includes(String(d.id ?? "")))
      .map((d: any) => ({
        id: "",
        idTaiSan: d.idTaiSan,
        idSuCoChiTiet: d.id,
        tenTaiSan: d.tenTaiSan || d.idTaiSan,
        danhSachVatTu: [] as IncidentInspectionVatTuData[],
      }));

    const listInfoFromParent = incidentReport
      ? listSigneInfo(incidentReport as any, apiUsers, apiDepartments)
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
        idSuCo: incidentReport?.id || "",
        idNguoiLap: "",
        nguoiLapXacNhan: false,
        idGiamDoc: "",
        giamDocXacNhan: false,
        trangThai: 0,
        share: false,
        // restore từ draft
        soPhieu: savedDraft.soPhieu,
        ngayKiemTra: savedDraft.ngayKiemTra,
        viTri: savedDraft.viTri,
        nhanXetKetLuan: savedDraft.nhanXetKetLuan,
        bienPhapXuLy: savedDraft.bienPhapXuLy,
        danhSachChiTiet: savedDraft.danhSachChiTiet,
        nguoiKyList: savedDraft.nguoiKyList?.length
          ? savedDraft.nguoiKyList
          : signersListFromParent,
        tenMauBienBan: savedDraft.tenMauBienBan,
        congTy: savedDraft.congTy,
      });
      return;
    }

    formik.setValues({
      id: "",
      idCongTy: CongTy.CT001,
      idSuCo: incidentReport?.id || "",
      soPhieu: `BB-KT-${incidentReport?.id || Date.now()}`,
      ngayKiemTra: dayjs().format("YYYY-MM-DD"),
      viTri: incidentReport?.phanHeViTri || "",
      nhanXetKetLuan: "",
      bienPhapXuLy: "",
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      trangThai: 0,
      share: false,
      danhSachChiTiet,
      nguoiKyList: signersListFromParent,
      tenMauBienBan: mauMacDinh?.ten ?? `KIỂM TRA SỰ CỐ THIẾT BỊ`,
      congTy: mauMacDinh?.congTy ?? currentBrandConfig.company,
    });
  }, [
    open,
    initData,
    incidentReport,
    selectedDeviceIds,
    apiUsers,
    apiDepartments,
    savedDraft,
  ]);

  const addMaterialRow = (assetIdx: number) => {
    const detail = formik.values.danhSachChiTiet[assetIdx];
    const newMaterial: IncidentInspectionVatTuData = {
      id: "KSVT_" + Math.random().toString(36).substr(2, 9),
      idChiTietKiemTraSuCo: detail.id || "",
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

    const updated = [...(detail.danhSachVatTu || []), newMaterial];
    formik.setFieldValue(`danhSachChiTiet[${assetIdx}].danhSachVatTu`, updated);
  };

  const updateMaterial = (
    assetIdx: number,
    materialId: string,
    updatedFields: Partial<IncidentInspectionVatTuData> | string,
    value?: any,
  ) => {
    const detail = formik.values.danhSachChiTiet[assetIdx];
    const updated = (detail.danhSachVatTu || []).map((vt) => {
      if (vt.id === materialId) {
        if (typeof updatedFields === "string") {
          return { ...vt, [updatedFields]: value };
        } else {
          return { ...vt, ...updatedFields };
        }
      }
      return vt;
    });
    formik.setFieldValue(`danhSachChiTiet[${assetIdx}].danhSachVatTu`, updated);
  };

  const removeMaterialRow = (assetIdx: number, materialId: string) => {
    const detail = formik.values.danhSachChiTiet[assetIdx];
    const updated = (detail.danhSachVatTu || []).filter(
      (vt) => vt.id !== materialId,
    );
    formik.setFieldValue(`danhSachChiTiet[${assetIdx}].danhSachVatTu`, updated);
  };

  const handleQuantityChange = (
    assetIdx: number,
    materialId: string,
    field: "soLuong" | "soLuongSuaChua" | "soLuongThayMoi",
    value: number,
  ) => {
    const detail = formik.values.danhSachChiTiet[assetIdx];
    const updated = (detail.danhSachVatTu || []).map((vt) => {
      if (vt.id === materialId) {
        return { ...vt, [field]: value };
      }
      return vt;
    });
    formik.setFieldValue(`danhSachChiTiet[${assetIdx}].danhSachVatTu`, updated);
  };

  const handleMinimize = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`incidentInspectionDraft_${incidentReport?.id}`]: {
            soPhieu: formik.values.soPhieu,
            ngayKiemTra: formik.values.ngayKiemTra,
            viTri: formik.values.viTri,
            nhanXetKetLuan: formik.values.nhanXetKetLuan,
            bienPhapXuLy: formik.values.bienPhapXuLy,
            tenMauBienBan:
              formik.values.tenMauBienBan ||
              mauMacDinh?.ten ||
              `KIỂM TRA SỰ CỐ THIẾT BỊ`,
            congTy:
              formik.values.congTy ||
              mauMacDinh?.congTy ||
              currentBrandConfig.company,
            danhSachChiTiet: formik.values.danhSachChiTiet,
            nguoiKyList: formik.values.nguoiKyList,
          },
          lastMinimizedDialog: "incidentInspection",
        },
      }),
    );
    onClose();
  };

  const handleClose = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`incidentInspectionDraft_${incidentReport?.id}`]: null,
          lastMinimizedDialog: null,
        },
      }),
    );
    formik.resetForm();
    onClose();
  };

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
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Tạo Biên bản kiểm tra sự cố — {incidentReport.soPhieu}
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
            {/* Top section: 2-column layout */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 380px",
                gap: 3,
              }}
            >
              {/* Left column: Thông tin cơ bản */}
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 2.5,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Thông tin
                </Typography>
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12,
                      md: 6,
                    }}
                  >
                    <FieldInput title="Số biên bản" name="soPhieu" />
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      md: 6,
                    }}
                  >
                    <FieldDate title="Ngày kiểm tra" name="ngayKiemTra" />
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                    }}
                  >
                    <FieldInput title="Vị trí" name="viTri" />
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                    }}
                  >
                    <FieldInput
                      title="Nhận xét, kết luận"
                      name="nhanXetKetLuan"
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                    }}
                  >
                    <FieldInput
                      title="Đề nghị biện pháp xử lý"
                      name="bienPhapXuLy"
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Right column: Quy trình duyệt */}
              <Box>
                <SignerWorkflowSection formik={formik} />
              </Box>
            </Box>

            {/* Tình trạng thiết bị & vật tư phụ tùng đưa vào kiểm tra */}
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 2.5,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                Tình trạng chi tiết thiết bị & vật tư linh kiện kiểm tra sự cố
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
                      <React.Fragment key={entry.idTaiSan || assetIdx}>
                        {/* Hàng thiết bị chính (cha) */}
                        <TableRow sx={{ bgcolor: "#fafafa" }}>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {assetIdx + 1}
                          </TableCell>
                          <TableCell
                            colSpan={3}
                            sx={{ fontWeight: 700, color: "primary.main" }}
                          >
                            Thiết bị: {entry.tenTaiSan}
                          </TableCell>
                          <TableCell colSpan={4}></TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => addMaterialRow(assetIdx)}
                              color="primary"
                              title="Thêm vật tư phụ tùng kiểm tra"
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
                              Chưa có vật tư/linh kiện phụ tùng nào được chọn
                              dưới thiết bị này. Nhấp "+" để thêm.
                            </TableCell>
                          </TableRow>
                        ) : (
                          entry.danhSachVatTu.map((vt, vtIdx) => {
                            const sumQty =
                              (vt.soLuongSuaChua || 0) +
                              (vt.soLuongThayMoi || 0);
                            const isQtyError = sumQty > (vt.soLuong || 0);

                            return (
                              <TableRow key={vt.id || vtIdx}>
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
                                    name={`danhSachChiTiet[${assetIdx}].danhSachVatTu[${vtIdx}].soLuong`}
                                    type="number"
                                    noBorder={true}
                                    disabled={true}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FieldInput
                                    title=""
                                    name={`danhSachChiTiet[${assetIdx}].danhSachVatTu[${vtIdx}].tinhTrang`}
                                    noBorder={true}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FieldInput
                                    title=""
                                    name={`danhSachChiTiet[${assetIdx}].danhSachVatTu[${vtIdx}].soLuongSuaChua`}
                                    type="number"
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
                                    title=""
                                    name={`danhSachChiTiet[${assetIdx}].danhSachVatTu[${vtIdx}].soLuongThayMoi`}
                                    type="number"
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
                                    name={`danhSachChiTiet[${assetIdx}].danhSachVatTu[${vtIdx}].ghiChu`}
                                    noBorder={true}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      removeMaterialRow(assetIdx, vt.id!)
                                    }
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Preview section */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                Xem trước biên bản
              </Typography>
              <IncidentInspectionPreview
                number={formik.values.soPhieu}
                inspectionDate={formik.values.ngayKiemTra}
                location={formik.values.viTri}
                findings={formik.values.nhanXetKetLuan}
                recommendation={formik.values.bienPhapXuLy}
                danhSachChiTiet={formik.values.danhSachChiTiet}
                signers={formik.values.nguoiKyList}
                tieude={formik.values.tenMauBienBan}
                congty={formik.values.congTy}
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
            {initData?.id ? "Cập nhật biên bản" : "Tạo biên bản"}
          </Button>
        </DialogActions>
      </Dialog>
    </FormikProvider>
  );
};

export default IncidentInspectionDialog;
