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
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import dayjs from "dayjs";
import {
  DanhGiaVatTuData,
  QuyetToanData,
  QuyetToanChiTietData,
} from "../../types";
import FieldDate from "../../../../components/TextField/FieldDate";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { generateCode } from "../../../../utils/helpers";
import { useQuyetToanMutation } from "../../mutation/QuyetToan";
import { useAllToolDetailQuery } from "../../../ToolManager/Mutation";
import { listSigneInfo } from "../../config";
import FieldInput from "../../../../components/TextField/FieldInput";
import TextFieldNumber from "../../../../components/TextField/TextFieldNumber";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import QuyetToanPreview from "../preview/QuyetToanPreview";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { Remove } from "@mui/icons-material";
import { useAllPositionsQuery } from "../../../Position/Mutation";
import { PlanSigner } from "../../../../mockdata/mockPlans";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import { useAllLoaiSCBDQuery } from "../../../MaintenanceRepairType/Mutation";

interface Props {
  open: boolean;
  onClose: () => void;
  materialAssessment: DanhGiaVatTuData;
  initData?: QuyetToanData | null;
  acceptanceRecord?: any;
  jobAssignment?: any;
  materialRequisition?: any;
  repairRequest?: any;
}

const QuyetToanDialog = ({
  open,
  onClose,
  materialAssessment,
  initData,
  acceptanceRecord,
  jobAssignment,
  materialRequisition,
  repairRequest,
}: Props) => {
  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const { data: apiPositions = [] } = useAllPositionsQuery();
  const { data: repairLevels = [] } = useAllLoaiSCBDQuery();
  const { data: allToolDetail = [] } = useAllToolDetailQuery();
  const { createMutation, updateMutation } = useQuyetToanMutation();

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const draftId = initData?.id || materialAssessment?.id || "new_quyettoan";
  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t) => t.path === tabPath);
    return tab?.formData?.[`quyettoanDraft_${draftId}`] ?? null;
  });

  const formik = useFormik({
    initialValues: {
      id: "",
      idDanhGia: materialAssessment?.id || "",
      tenTaiSan:
        repairRequest?.danhSachTaiSan?.[0]?.tenTaiSan ||
        (materialAssessment as any)?.tenTaiSan ||
        "",
      thuocDonVi:
        repairRequest?.donViQuanLy ||
        (materialAssessment as any)?.donViDanhGia ||
        "",
      tenDonVi:
        repairRequest?.tenDonViQuanLy ||
        (materialAssessment as any)?.tenDonViDanhGia ||
        "",
      diaDiemSuaChua:
        repairRequest?.diaDiem || materialAssessment?.diaDiem || "",
      capSuaChua: repairRequest?.loaiSuaChua || "",
      tenCapSuaChua: repairRequest?.tenLoaiSuaChua || "",
      soPhieuGiaoViec: jobAssignment?.soPhieu || jobAssignment?.id || "",
      ngayNghiemThu: acceptanceRecord?.ngayTao
        ? dayjs(acceptanceRecord.ngayTao).format("YYYY-MM-DD")
        : "",
      soPhieuVatTu:
        materialRequisition?.soPhieu || materialRequisition?.id || "",
      ngayLinhVatTu: materialRequisition?.ngayTao
        ? dayjs(materialRequisition.ngayTao).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),

      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      danhSachChiTiet: [] as QuyetToanChiTietData[],
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

      const record: QuyetToanData = {
        id: values.id || undefined,
        idDanhGia: values.idDanhGia,
        tenTaiSan: values.tenTaiSan,
        thuocDonVi: values.thuocDonVi,
        tenDonVi: values.tenDonVi,
        diaDiemSuaChua: values.diaDiemSuaChua,
        capSuaChua: values.capSuaChua,
        soPhieuGiaoViec: values.soPhieuGiaoViec,
        ngayNghiemThu: values.ngayNghiemThu,
        soPhieuVatTu: values.soPhieuVatTu,
        ngayLinhVatTu: values.ngayLinhVatTu,
        idNguoiLap: idNguoiLapBieu,
        nguoiLapXacNhan: values.nguoiLapXacNhan || false,
        idGiamDoc: idTrinhDuyetGiamDoc,
        giamDocXacNhan: values.giamDocXacNhan || false,
        share: values.share || false,
        trangThai: values.trangThai || 0,
        nguoiKyList: intermediateSigners,
        danhSachChiTiet: values.danhSachChiTiet.map((vt) => ({
          id: vt.id || undefined,
          idQuyetToan: values.id || undefined,
          idChiTietVatTu: vt.idChiTietVatTu || "",
          idVatTu: vt.idVatTu || "",
          tenVatTu: vt.tenVatTu || "",
          soLuong: Number(vt.soLuong || 0),
          donGia: Number(vt.donGia || 0),
          thanhTien: Number(vt.soLuong || 0) * Number(vt.donGia || 0),
          ghiChu: vt.ghiChu || "",
        })),
      };

      if (initData) {
        updateMutation.mutate(record, {
          onSuccess: () => handleClose(),
        });
      } else {
        createMutation.mutate(record, {
          onSuccess: () => handleClose(),
        });
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    if (savedDraft) {
      formik.setValues({
        id: initData?.id || "",
        idDanhGia: materialAssessment?.id || "",
        tenTaiSan: savedDraft.tenTaiSan || "",
        thuocDonVi: savedDraft.thuocDonVi || "",
        tenDonVi: savedDraft.tenDonVi || "",
        diaDiemSuaChua: savedDraft.diaDiemSuaChua || "",
        capSuaChua: savedDraft.capSuaChua || "",
        tenCapSuaChua: savedDraft.tenCapSuaChua || "",
        soPhieuGiaoViec: savedDraft.soPhieuGiaoViec || "",
        ngayNghiemThu: savedDraft.ngayNghiemThu || "",
        soPhieuVatTu: savedDraft.soPhieuVatTu || "",
        ngayLinhVatTu: savedDraft.ngayLinhVatTu,
        idNguoiLap: "",
        nguoiLapXacNhan: false,
        idGiamDoc: "",
        giamDocXacNhan: false,
        share: false,
        trangThai: initData?.trangThai || 0,
        danhSachChiTiet: savedDraft.danhSachChiTiet || [],
        nguoiKyList: savedDraft.nguoiKyList?.length
          ? savedDraft.nguoiKyList
          : [],
      });
      return;
    }

    if (initData) {
      const listInfo = listSigneInfo(
        initData,
        apiUsers,
        apiDepartments,
        apiPositions,
      );
      const signersList = (listInfo || []).map((item, idx) => ({
        ...item,
        userId: item.idNhanVien,
        userName: item.hoTen,
        departmentId: item.idDonVi,
        departmentName: item.donVi,
        position: item.chucVu,
        order: idx + 1,
      }));
      formik.setValues({
        id: initData.id || "",
        idDanhGia: initData.idDanhGia || materialAssessment?.id || "",
        tenTaiSan: initData.tenTaiSan || "",
        thuocDonVi: initData.thuocDonVi || "",
        tenDonVi: initData.tenDonVi || "",
        diaDiemSuaChua: initData.diaDiemSuaChua || "",
        capSuaChua: initData.capSuaChua || "",
        tenCapSuaChua: initData.tenCapSuaChua || "",
        soPhieuGiaoViec: initData.soPhieuGiaoViec || "",
        ngayNghiemThu: initData.ngayNghiemThu || "",
        soPhieuVatTu: initData.soPhieuVatTu || "",
        ngayLinhVatTu: initData.ngayLinhVatTu || dayjs().format("YYYY-MM-DD"),
        idNguoiLap: initData.idNguoiLap || "",
        nguoiLapXacNhan: initData.nguoiLapXacNhan || false,
        idGiamDoc: initData.idGiamDoc || "",
        giamDocXacNhan: initData.giamDocXacNhan || false,
        share: initData.share || false,
        trangThai: initData.trangThai || 0,
        danhSachChiTiet: initData.danhSachChiTiet || [],
        nguoiKyList: signersList?.length ? signersList : [],
      });
      return;
    }

    // Default init for creation
    const list: QuyetToanChiTietData[] = [];
    const sourceVatTu =
      acceptanceRecord?.danhSachVatTu ||
      materialAssessment?.danhSachChiTiet ||
      [];
    if (sourceVatTu.length > 0) {
      sourceVatTu.forEach((vt: any) => {
        const soLuong = vt.soLuongThayThe || vt.soLuong || 1;
        const _donGia = vt.donGia || vt.giaTri || 0;
        list.push({
          idChiTietVatTu: vt.idChiTietVatTu || "",
          idVatTu: vt.idVatTu || "",
          tenVatTu: vt.tenVatTu || "",
          soLuong: soLuong,
          donGia: _donGia,
          thanhTien: (vt.soLuong || 1) * _donGia,
          ghiChu: vt.ghiChu || "",
        });
      });
    }

    const defaultList: QuyetToanChiTietData[] =
      list.length > 0
        ? list
        : [
            {
              idChiTietVatTu: "",
              idVatTu: "",
              tenVatTu: "",
              soLuong: 1,
              donGia: 0,
              thanhTien: 0,
              ghiChu: "",
            },
          ];

    const listInfoFromParent = materialAssessment
      ? listSigneInfo(
          materialAssessment as any,
          apiUsers,
          apiDepartments,
          apiPositions,
        )
      : [];
    const signersListFromParent = (listInfoFromParent || []).map(
      (item: any, idx: number) => ({
        ...item,
        userId: item.idNhanVien || item.userId,
        userName: item.hoTen || item.userName,
        departmentId: item.idDonVi || item.departmentId,
        departmentName: item.donVi || item.departmentName,
        position: item.chucVu || item.position || "",
        order: idx + 1,
      }),
    );

    formik.setValues({
      id: "",
      idDanhGia: materialAssessment?.id || "",
      tenTaiSan:
        repairRequest?.danhSachTaiSan?.[0]?.tenTaiSan ||
        (materialAssessment as any)?.tenTaiSan ||
        "",
      thuocDonVi:
        repairRequest?.donViQuanLy ||
        (materialAssessment as any)?.donViDanhGia ||
        "",
      tenDonVi:
        repairRequest?.tenDonViQuanLy ||
        (materialAssessment as any)?.tenDonViDanhGia ||
        "",
      diaDiemSuaChua:
        repairRequest?.diaDiem || materialAssessment?.diaDiem || "",
      capSuaChua: repairRequest?.loaiSuaChua || "",
      tenCapSuaChua: repairRequest?.tenLoaiSuaChua || "",
      soPhieuGiaoViec: jobAssignment?.soPhieu || jobAssignment?.id || "",
      ngayNghiemThu: acceptanceRecord?.ngayTao
        ? dayjs(acceptanceRecord.ngayTao).format("YYYY-MM-DD")
        : "",
      soPhieuVatTu:
        materialRequisition?.soPhieu || materialRequisition?.id || "",
      ngayLinhVatTu: materialRequisition?.ngayTao
        ? dayjs(materialRequisition.ngayTao).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      danhSachChiTiet: defaultList,
      nguoiKyList: signersListFromParent,
    });
  }, [
    open,
    initData,
    materialAssessment,
    apiUsers,
    apiDepartments,
    apiPositions,
    savedDraft,
    acceptanceRecord,
    jobAssignment,
    materialRequisition,
    repairRequest,
  ]);

  const addItem = () => {
    formik.setFieldValue("danhSachChiTiet", [
      ...formik.values.danhSachChiTiet,
      {
        idChiTietVatTu: "",
        idVatTu: "",
        tenVatTu: "",
        soLuong: 1,
        donGia: 0,
        thanhTien: 0,
        ghiChu: "",
      },
    ]);
  };

  const removeItem = (idx: number) => {
    const updatedList = formik.values.danhSachChiTiet.filter(
      (_, i) => i !== idx,
    );
    formik.setFieldValue("danhSachChiTiet", updatedList);
  };

  const updateItemFields = (
    idx: number,
    fields: Partial<QuyetToanChiTietData>,
  ) => {
    const updatedList = formik.values.danhSachChiTiet.map((it, i) => {
      if (i === idx) {
        return {
          ...it,
          ...fields,
          thanhTien:
            fields.soLuong !== undefined || fields.donGia !== undefined
              ? (fields.soLuong ?? it.soLuong ?? 0) *
                (fields.donGia ?? it.donGia ?? 0)
              : it.thanhTien,
        };
      }
      return it;
    });
    formik.setFieldValue("danhSachChiTiet", updatedList);
  };

  const handleClose = () => {
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`quyettoanDraft_${draftId}`]: null,
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
          [`quyettoanDraft_${draftId}`]: {
            soPhieuVatTu: formik.values.soPhieuVatTu,
            ngayLinhVatTu: formik.values.ngayLinhVatTu,
            tenTaiSan: formik.values.tenTaiSan,
            thuocDonVi: formik.values.thuocDonVi,
            tenDonVi: formik.values.tenDonVi,
            diaDiemSuaChua: formik.values.diaDiemSuaChua,
            capSuaChua: formik.values.capSuaChua,
            soPhieuGiaoViec: formik.values.soPhieuGiaoViec,
            ngayNghiemThu: formik.values.ngayNghiemThu,
            danhSachChiTiet: formik.values.danhSachChiTiet,
            nguoiKyList: formik.values.nguoiKyList,
          },
          lastMinimizedDialog: "quyettoan",
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
          <AttachMoneyIcon color="warning" />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Quyết Toán Công Trình
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Căn cứ BB Đánh giá vật tư: {materialAssessment?.id || ""}
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
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 3 }}>
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
              <FieldInput
                title="Số phiếu vật tư"
                formik={formik}
                field="soPhieuVatTu"
              />
              <FieldDate
                title="Ngày lĩnh vật tư"
                selectedDate={formik.values.ngayLinhVatTu}
                setSelectedDate={(date) =>
                  formik.setFieldValue("ngayLinhVatTu", date)
                }
              />
              <FieldInput
                title="Tên thiết bị/công trình"
                formik={formik}
                field="tenTaiSan"
              />
              <FieldAutoCompleted
                title="Thuộc đơn vị"
                data={apiDepartments}
                labelkey="tenPhongBan"
                formik={formik}
                field="thuocDonVi"
                onChange={(val) =>
                  formik.setFieldValue("tenDonVi", val?.tenPhongBan)
                }
              />
              <FieldInput
                title="Địa điểm sửa chữa"
                formik={formik}
                field="diaDiemSuaChua"
              />
              <FieldAutoCompleted
                title="Cấp sửa chữa"
                data={repairLevels}
                labelkey="ten"
                formik={formik}
                field="capSuaChua"
                onChange={(val) =>
                  formik.setFieldValue("tenCapSuaChua", val?.ten)
                }
              />
              <FieldInput
                title="Căn cứ Phiếu giao việc số"
                formik={formik}
                field="soPhieuGiaoViec"
              />
              <FieldDate
                title="Ngày nghiệm thu"
                selectedDate={formik.values.ngayNghiemThu}
                setSelectedDate={(date) =>
                  formik.setFieldValue("ngayNghiemThu", date)
                }
              />
            </Box>
          </Box>

          <Box>
            <SignerWorkflowSection formik={formik} />
          </Box>
        </Box>

        <Box
          sx={{
            mt: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            p: 2.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              Danh sách vật tư
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={addItem}
              variant="outlined"
            >
              Thêm dòng
            </Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 700, width: 40 }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 250 }}>
                    Các yếu tố (Tên vật tư)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 90 }}>
                    Số lượng
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 120 }}>
                    Đơn giá
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 120 }}>
                    Thành tiền
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 150 }}>
                    Ghi chú
                  </TableCell>
                  <TableCell sx={{ width: 36 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {formik.values.danhSachChiTiet.map((item, originalIdx) => (
                  <TableRow key={originalIdx}>
                    <TableCell>
                      {String(originalIdx + 1).padStart(2, "0")}
                    </TableCell>
                    <TableCell>
                      <FieldAutoCompleted
                        title=""
                        data={allToolDetail}
                        labelkey="tenTaiSan"
                        labelOption="idTaiSan"
                        limitOptions={10}
                        value={item.idChiTietVatTu}
                        noBorder={true}
                        onChange={(value) => {
                          updateItemFields(originalIdx, {
                            idChiTietVatTu: value?.id ?? "",
                            idVatTu: value?.idTaiSan ?? "",
                            tenVatTu: value?.tenTaiSan ?? "",
                            donGia: value?.giaTri ?? 0,
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextFieldNumber
                        formik={formik}
                        field={`danhSachChiTiet.${originalIdx}.soLuong`}
                        noBorder={true}
                        onChange={(val: any) =>
                          updateItemFields(originalIdx, {
                            soLuong: Number(val),
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextFieldNumber
                        formik={formik}
                        field={`danhSachChiTiet.${originalIdx}.donGia`}
                        noBorder={true}
                        onChange={(val: any) =>
                          updateItemFields(originalIdx, { donGia: Number(val) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {Number(item.thanhTien || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <FieldInput
                        formik={formik}
                        field={`danhSachChiTiet.${originalIdx}.ghiChu`}
                        noBorder={true}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => removeItem(originalIdx)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        {/* Full-width Preview */}
        <QuyetToanPreview formik={formik} />
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} color="inherit">
          Hủy
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => formik.handleSubmit()}
        >
          {initData ? "Cập nhật quyết toán" : "Tạo quyết toán"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuyetToanDialog;
