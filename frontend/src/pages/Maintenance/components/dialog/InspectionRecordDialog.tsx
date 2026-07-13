import React, { useEffect, useRef } from "react";
import { useFormik } from "formik";
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
  InspectionRecordData,
  InspectionRecordDetailData,
} from "../../types";
import { useMaintenanceInspectionMutation } from "../../mutation";
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
import { TechnicalReportData } from "../../types";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import FieldDateTime from "../../../../components/TextField/FieldDateTime";
import { useAllPositionsQuery } from "../../../Position/Mutation";

interface Props {
  open: boolean;
  onClose: () => void;
  technicalReport: TechnicalReportData | null;
  initData?: InspectionRecordData | null;
  onSubmit?: (data: InspectionRecordData) => void;
}

const InspectionRecordDialog = ({
  open,
  onClose,
  technicalReport,
  initData,
  onSubmit,
}: Props) => {
  const { user } = useSelector((state: any) => state.user);

  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const { data: apiPositions = [] } = useAllPositionsQuery();

  const { createMutation, updateMutation } = useMaintenanceInspectionMutation();

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return (
      tab?.formData?.[
        `inspectionDraft_${technicalReport?.id || initData?.id || ""}`
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
      idBaoCaoKyThuat: technicalReport?.id || "",
      donViGiamDinh: technicalReport?.donViBaoCao || "",
      ngayGiamDinh: dayjs().format("YYYY-MM-DD hh:mm"),
      noiDung: "",
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
      ngayTao: dayjs().format("YYYY-MM-DD HH:mm:ss"),
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
        idBaoCaoKyThuat: values.idBaoCaoKyThuat,
        idCongTy: values.idCongTy,
        ngayGiamDinh: values.ngayGiamDinh,
        donViGiamDinh: values.donViGiamDinh,
        noiDung: values.noiDung,
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
            idGiamDinh: values.id,
            idBaoCaoKyThuatChiTiet: e.idBaoCaoKyThuatChiTiet,
            idTaiSan: e.idTaiSan,
            tenTaiSan: e.tenTaiSan,
            donViTinh: e.donViTinh,
            soLuong: e.soLuong,
            tinhTrang: e.tinhTrang,
            thayMoi: e.thayMoi,
            suaChua: e.suaChua,
            ghiChu: e.ghiChu,
            noiDungCongViec: e.noiDungCongViec,
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
  const apiPositionsRef = useRef(apiPositions);

  useEffect(() => {
    apiUsersRef.current = apiUsers;
  }, [apiUsers]);
  useEffect(() => {
    apiDepartmentsRef.current = apiDepartments;
  }, [apiDepartments]);
  useEffect(() => {
    apiPositionsRef.current = apiPositions;
  }, [apiPositions]);

  useEffect(() => {
    if (!open) return;
    if (initData) {
      const listInfo = listSigneInfo(
        initData,
        apiUsersRef.current,
        apiDepartmentsRef.current,
        apiPositionsRef.current,
      );

      formik.setValues({
        id: initData.id ?? "",
        idCongTy: initData.idCongTy ?? CongTy.CT001,
        idBaoCaoKyThuat: initData.idBaoCaoKyThuat ?? "",
        donViGiamDinh: initData.donViGiamDinh ?? "",
        ngayGiamDinh: initData.ngayGiamDinh ?? "",
        noiDung: initData.noiDung ?? "",
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
        ngayTao: dayjs(initData.ngayTao).format("YYYY-MM-DD HH:mm:ss"),
        danhSachChiTiet: (initData.danhSachChiTiet ?? []).map((e: any) => ({
          ...e,
          noiDungCongViec: e.noiDungCongViec || `Bảo dưỡng ${e.tenTaiSan || "thiết bị"}`,
        })) as InspectionRecordDetailData[],
        nguoiKyList: (listInfo ?? []).map((item: any) => ({
          userId: item.idNhanVien,
          userName: item.hoTen,
          departmentId: item.idDonVi,
          departmentName: item.donVi,
          positionId: item.idChucVu,
          positionName: item.chucVu,
        })),
      });
      return;
    }

    // Tính danhSachChiTiet từ props — luôn làm trước
    const danhSachChiTiet = (technicalReport?.danhSachTaiSan || []).map(
      (e: any) => ({
        ...e,
        id: "",
        tenTaiSan: e.tenTaiSan,
        idBaoCaoKyThuatChiTiet: e.id,
        donViTinh: e.donViTinh,
        soLuong: 1,
        noiDungCongViec: `Bảo dưỡng ${e.tenTaiSan || "thiết bị"}`,
      }),
    ) as InspectionRecordDetailData[];

    if (savedDraft) {
      formik.setValues({
        id: "",
        idCongTy: CongTy.CT001,
        idBaoCaoKyThuat: technicalReport?.id || "",
        donViGiamDinh: technicalReport?.donViBaoCao || "",
        ngayGiamDinh: savedDraft?.ngayGiamDinh || "",
        noiDung: savedDraft?.noiDung || "",
        idNguoiLap: "",
        nguoiLapXacNhan: false,
        idGiamDoc: "",
        giamDocXacNhan: false,
        share: false,
        trangThai: 0,
        // restore từ draft
        danhSachChiTiet: savedDraft.danhSachChiTiet,
        nguoiKyList: savedDraft.nguoiKyList,
        tenMauBienBan: savedDraft.tenMauBienBan,
        congTy: savedDraft.congTy,
        ngayTao: dayjs(savedDraft.ngayTao).format("YYYY-MM-DD HH:mm:ss"),
      });
      return;
    }

    const parentRecord = technicalReport;
    const listInfoFromParent = parentRecord
      ? listSigneInfo(
          parentRecord,
          apiUsersRef.current,
          apiDepartmentsRef.current,
          apiPositionsRef.current,
        )
      : [];
    const signersListFromParent = (listInfoFromParent || []).map(
      (item: any, idx: number) => ({
        ...item,
        userId: item.idNhanVien || item.userId,
        userName: item.hoTen || item.userName,
        departmentId: item.idDonVi || item.departmentId,
        departmentName: item.donVi || item.departmentName,
        positionName: item.chucVu || item.position || "",
        positionId: item.idChucVu || item.positionId || "",
        order: idx + 1,
      }),
    );

    formik.setValues({
      id: "",
      idCongTy: CongTy.CT001,
      idBaoCaoKyThuat: technicalReport?.id || "",
      donViGiamDinh: technicalReport?.donViBaoCao || "",
      ngayGiamDinh: dayjs().format("YYYY-MM-DD"),
      noiDung: "",
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
      ngayTao: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      danhSachChiTiet,
      nguoiKyList: signersListFromParent,
    });
  }, [open, initData, technicalReport, savedDraft]);

  function hasValidationError() {
    for (const entry of formik.values.danhSachChiTiet) {
      const soLuong = Number(entry.soLuong || 0);
      const suaChua = Number(entry.suaChua || 0);
      const thayMoi = Number(entry.thayMoi || 0);
      if (suaChua + thayMoi > soLuong) {
        return true;
      }
    }
    return false;
  }

  const handleClose = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`inspectionDraft_${technicalReport?.id || initData?.id || ""}`]:
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
          [`inspectionDraft_${technicalReport?.id || initData?.id || ""}`]: {
            noiDung: formik.values.noiDung,
            ngayGiamDinh: formik.values.ngayGiamDinh,
            danhSachChiTiet: formik.values.danhSachChiTiet,
            nguoiKyList: formik.values.nguoiKyList,
            idBaoCaoKyThuat: formik.values.idBaoCaoKyThuat,
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EngineeringIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Biên bản giám định kỹ thuật và bàn giao thiết bị đưa vào sửa chữa
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
        {technicalReport?.danhSachTaiSan?.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Không có thiết bị nào để giám định. Vui lòng kiểm tra lại dữ liệu
            đầu vào.
          </Alert>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 3 }}>
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
                <FieldAutoCompleted
                  title="Đơn vị giám định"
                  data={apiDepartments}
                  labelkey="tenPhongBan"
                  labelOption="id"
                  formik={formik}
                  field="donViGiamDinh"
                />
                <FieldDateTime
                  title="Ngày/ giờ giám định"
                  selectedDate={formik.values.ngayGiamDinh}
                  setSelectedDate={(val) =>
                    formik.setFieldValue("ngayGiamDinh", val)
                  }
                />
                <FieldInput
                  title="Các nội dung cần thống nhất khác (Nội dung)"
                  field="noiDung"
                  formik={formik}
                  multiline
                  rows={2}
                />
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
                  <TableCell sx={{ fontWeight: 700, width: 60 }}>TT</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>
                    Tên chi tiết/Nội dung công việc
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 60 }}>ĐVT</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 100 }}>SL</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>
                    Tình trạng kỹ thuật
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, width: 100 }}
                  >
                    T.Mới
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, width: 100 }}
                  >
                    S.Chữa
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>
                    Ghi chú
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formik.values.danhSachChiTiet.map((entry, assetIdx) => (
                  <TableRow key={entry.idTaiSan}>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {assetIdx + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                      <FieldInput
                        title=""
                        field={`danhSachChiTiet.${assetIdx}.noiDungCongViec`}
                        formik={formik}
                        noBorder={true}
                        multiline
                        rows={5}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {entry.donViTinh || "......"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FieldInput
                        title=""
                        field={`danhSachChiTiet.${assetIdx}.soLuong`}
                        formik={formik}
                        type="number"
                        noBorder={true}
                      />
                    </TableCell>
                    <TableCell>
                      <FieldInput
                        title=""
                        field={`danhSachChiTiet.${assetIdx}.tinhTrang`}
                        formik={formik}
                        noBorder={true}
                      />
                    </TableCell>
                    <TableCell>
                      <FieldInput
                        title=""
                        type="number"
                        field={`danhSachChiTiet.${assetIdx}.thayMoi`}
                        formik={formik}
                        noBorder={true}
                      />
                    </TableCell>
                    <TableCell>
                      <FieldInput
                        title=""
                        type="number"
                        field={`danhSachChiTiet.${assetIdx}.suaChua`}
                        formik={formik}
                        noBorder={true}
                      />
                    </TableCell>
                    <TableCell>
                      <FieldInput
                        title=""
                        field={`danhSachChiTiet.${assetIdx}.ghiChu`}
                        formik={formik}
                        noBorder={true}
                      />
                    </TableCell>
                  </TableRow>
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
          <InspectionRecordPreview data={formik.values} />
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
            technicalReport?.danhSachTaiSan?.length === 0 ||
            hasValidationError()
          }
          onClick={() => formik.handleSubmit()}
        >
          {initData ? "Cập nhật" : "Tạo biên bản"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InspectionRecordDialog;
