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
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { generateCode } from "../../../../utils/helpers";
import { CongTy, LOAI_BIEN_BAN_TYPE } from "../../../../utils/const";
import dayjs from "dayjs";
import { MaintenanceRepairData } from "../../types";
import { listSigneInfo } from "../../config";
import FieldInput from "../../../../components/TextField/FieldInput";
import { useFormik } from "formik";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { Remove } from "@mui/icons-material";
import { useBienBanSuaChuaPageQuery } from "../../../RepairReport/Mutation";
import { currentBrandConfig } from "../../../../config/brandConfig";
import { useMaintenanceRepairMutation } from "../../mutation";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import FieldDate from "../../../../components/TextField/FieldDate";
import { useAllLoaiSCBDQuery } from "../../../MaintenanceRepairType/Mutation";
import { useAllToolDetailQuery } from "../../../ToolManager/Mutation";
import api from "../../../../config/api.config";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import TextFieldNumber from "../../../../components/TextField/TextFieldNumber";

interface Props {
  open: boolean;
  onClose: () => void;
  inspection?: any;
  initialData?: MaintenanceRepairData | null;
}

const RepairRequestDialog = ({
  open,
  onClose,
  inspection,
  initialData,
}: Props) => {
  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const { data: departments = [] } = useAllDepartmentsQuery();
  const { data: repairLevels = [] } = useAllLoaiSCBDQuery();
  const { data: allToolDetail = [] } = useAllToolDetailQuery();

  const { createMutation, updateMutation } = useMaintenanceRepairMutation();

  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(0, 9999, "", LOAI_BIEN_BAN_TYPE.SUA_CHUA, true);
  const mauMacDinh = repairReportPage?.data?.items?.[0];

  const formik = useFormik({
    initialValues: {
      id: "",
      idCongTy: CongTy.CT001,
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      tenMauBienBan: mauMacDinh?.ten || "LỆNH SỬA CHỮA",
      congTy: mauMacDinh?.congTy || currentBrandConfig.company,
      ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      ngayCapNhat: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      idGiamDinh: inspection?.id,
      donViQuanLy: inspection?.donViGiamDinh,
      donViGiamSat: "",
      ngayBaoDuongGanNhat: dayjs(new Date()).format("YYYY-MM-DD"),
      gioHoatDong: "",
      loaiSuaChua: "",
      tenLoaiSuaChua: "",
      tinhTrang: "",
      nhanCongThucHien: "",
      thoiGian: dayjs(new Date()).format("YYYY-MM-DD"),
      diaDiem: "",

      danhSachTaiSan: [] as any[],
      danhSachVatTu: [] as any[],
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

      const req: MaintenanceRepairData = {
        ...values,
        idNguoiLap: idNguoiLapBieu,
        idGiamDoc: idTrinhDuyetGiamDoc,
        nguoiKyList: intermediateSigners,
        ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        ngayCapNhat: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      };

      const draftId = initialData?.id || initialData?.idGiamDinh || "new";
      dispatch(
        updateTabFormData({
          path: tabPath,
          data: { [`repairDraft_${draftId}`]: null },
        }),
      );
      if (initialData?.id) {
        updateMutation.mutate(req, {
          onSuccess: () => {
            formik.resetForm();
            onClose();
          },
        });
      } else {
        createMutation.mutate(req, {
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
    const draftId = initialData?.id || initialData?.idGiamDinh || "new";
    return tab?.formData?.[`repairDraft_${draftId}`] ?? null;
  });

  useEffect(() => {
    if (!open) return;
    if (initialData && initialData.id) {
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
        idGiamDinh: initialData.idGiamDinh || "",
        idCongTy: initialData.idCongTy || CongTy.CT001,
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
          initialData.tenMauBienBan || mauMacDinh?.ten || "LỆNH SỬA CHỮA",
        congTy:
          initialData.congTy ||
          mauMacDinh?.congTy ||
          currentBrandConfig.company,
        donViQuanLy: initialData.donViQuanLy ?? "",
        donViGiamSat: initialData.donViGiamSat ?? "",
        ngayBaoDuongGanNhat: initialData.ngayBaoDuongGanNhat ?? "",
        gioHoatDong: initialData.gioHoatDong ?? "",
        loaiSuaChua: initialData.loaiSuaChua ?? "",
        tenLoaiSuaChua: initialData.tenLoaiSuaChua ?? "",
        tinhTrang: initialData.tinhTrang ?? "",
        nhanCongThucHien: initialData.nhanCongThucHien ?? "",
        thoiGian: initialData.thoiGian ?? "",
        diaDiem: initialData.diaDiem ?? "",
        danhSachTaiSan: initialData.danhSachTaiSan ?? [],
        danhSachVatTu: initialData.danhSachVatTu ?? [],
        nguoiKyList: signersList,
      });
      return;
    }

    // Tính lại danhSachTaiSan từ inspection
    const assetsList = (inspection?.danhSachChiTiet || [])?.map((s: any) => {
      return {
        idTaiSan: s.idTaiSan || "",
        tenTaiSan: s.tenTaiSan || "",
        idChiTietGiamDinh: s.id || "",
      };
    });

    if (savedDraft) {
      formik.setValues({
        id: "",
        idGiamDinh: inspection?.id,
        idCongTy: CongTy.CT001,
        idNguoiLap: "",
        nguoiLapXacNhan: false,
        idGiamDoc: "",
        giamDocXacNhan: false,
        share: false,
        trangThai: 0,
        ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        ngayCapNhat: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        tenMauBienBan:
          savedDraft.tenMauBienBan || mauMacDinh?.ten || "LỆNH SỬA CHỮA",
        congTy:
          savedDraft.congTy || mauMacDinh?.congTy || currentBrandConfig.company,
        donViQuanLy: savedDraft.donViQuanLy ?? "",
        donViGiamSat: savedDraft.donViGiamSat ?? "",
        ngayBaoDuongGanNhat: savedDraft.ngayBaoDuongGanNhat ?? "",
        gioHoatDong: savedDraft.gioHoatDong ?? "",
        loaiSuaChua: savedDraft.loaiSuaChua ?? "",
        tenLoaiSuaChua: savedDraft.tenLoaiSuaChua ?? "",
        tinhTrang: savedDraft.tinhTrang ?? "",
        nhanCongThucHien: savedDraft.nhanCongThucHien ?? "",
        thoiGian: savedDraft.thoiGian ?? "",
        diaDiem: savedDraft.diaDiem ?? "",
        danhSachTaiSan: assetsList,
        danhSachVatTu: savedDraft.danhSachVatTu ?? [],
        nguoiKyList: savedDraft.nguoiKyList,
      });
      return;
    }

    const listInfoFromInspection = listSigneInfo(
      inspection,
      apiUsers,
      apiDepartments,
    );
    const signersListFromInspection = (listInfoFromInspection || []).map(
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
      idGiamDinh: inspection?.id,
      idCongTy: CongTy.CT001,
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      tenMauBienBan: mauMacDinh?.ten || "LỆNH SỬA CHỮA",
      congTy: mauMacDinh?.congTy || currentBrandConfig.company,
      ngayTao: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      ngayCapNhat: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      donViQuanLy: inspection?.donViGiamDinh || "",
      donViGiamSat: "",
      ngayBaoDuongGanNhat: dayjs(new Date()).format("YYYY-MM-DD"),
      gioHoatDong: "",
      loaiSuaChua: "",
      tenLoaiSuaChua: "",
      tinhTrang: "",
      nhanCongThucHien: "",
      thoiGian: dayjs(new Date()).format("YYYY-MM-DD"),
      diaDiem: "",
      danhSachTaiSan: assetsList,
      danhSachVatTu: [],
      nguoiKyList: signersListFromInspection,
    });
  }, [
    open,
    initialData,
    apiUsers,
    apiDepartments,
    inspection,
    savedDraft,
    mauMacDinh,
  ]);

  const addMaterialRow = () => {
    const newItem = {
      id: `SVT_${Date.now()}`,
      idChiTietVatTu: "",
      idVatTu: "",
      tenVatTu: "",
      donViTinh: "Cái",
      soLuong: 1,
      ghiChu: "",
    };
    formik.setFieldValue("danhSachVatTu", [
      ...(formik.values.danhSachVatTu || []),
      newItem,
    ]);
  };

  const removeMaterialRow = (materialId: string) => {
    formik.setFieldValue(
      "danhSachVatTu",
      (formik.values.danhSachVatTu || []).filter((vt) => vt.id !== materialId),
    );
  };

  const updateMaterial = (vtId: string, fields: any) => {
    formik.setFieldValue(
      "danhSachVatTu",
      (formik.values.danhSachVatTu || []).map((vt) =>
        vt.id === vtId ? { ...vt, ...fields } : vt,
      ),
    );
  };

  const handleClose = () => {
    const draftId = initialData?.id || initialData?.idGiamDinh || "new";
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: { [`repairDraft_${draftId}`]: null, lastMinimizedDialog: null },
      }),
    );
    formik.resetForm();
    onClose();
  };

  const handleMinimize = () => {
    const draftId = initialData?.id || initialData?.idGiamDinh || "new";
    dispatch(
      updateTabFormData({
        path: tabPath,
        data: {
          [`repairDraft_${draftId}`]: formik.values,
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
                  <FieldAutoCompleted
                    title="Đơn vị quản lý"
                    data={departments}
                    labelkey="tenPhongBan"
                    labelOption="id"
                    field="donViQuanLy"
                    formik={formik}
                  />
                  <FieldAutoCompleted
                    title="Đơn vị giám sát"
                    data={departments}
                    labelkey="tenPhongBan"
                    labelOption="id"
                    field="donViGiamSat"
                    formik={formik}
                  />
                  <FieldDate
                    title="Ngày SCBD gần nhất"
                    field="ngayBaoDuongGanNhat"
                    formik={formik}
                  />
                  <FieldInput
                    title="Giờ/km hoạt động"
                    field="gioHoatDong"
                    formik={formik}
                  />
                  <FieldAutoCompleted
                    title="Nội dung SCBD"
                    data={repairLevels}
                    labelkey="ten"
                    labelOption="id"
                    field="loaiSuaChua"
                    formik={formik}
                    onChange={async (value: any) => {
                      formik.setFieldValue("loaiSuaChua", value.id);
                      formik.setFieldValue("tenLoaiSuaChua", value.ten);
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
                            const numAssets =
                              formik.values.danhSachTaiSan?.length || 1;
                            const newVatTuList = normData.dinhMucVatTuList.map(
                              (vt: any, vtIdx: number) => ({
                                id: `SVT_${Date.now()}_${vtIdx}`,
                                idChiTietVatTu: vt.idChiTietVatTu || "",
                                idVatTu: vt.idCCDCVT || "",
                                tenVatTu: vt.tenCCDCVT || "",
                                donViTinh: vt.donViTinh || "Cái",
                                soLuong: (vt.soLuong || 1) * numAssets,
                                ghiChu: vt.ghiChu || "",
                              }),
                            );
                            formik.setFieldValue("danhSachVatTu", newVatTuList);
                          } else {
                            formik.setFieldValue("danhSachVatTu", []);
                          }
                        } catch (e) {
                          console.log(
                            "Không tìm thấy định mức cho cấp sửa chữa này",
                            e,
                          );
                        }
                      } else {
                        formik.setFieldValue("danhSachVatTu", []);
                      }
                    }}
                  />
                  <FieldInput
                    title="Tình trạng kỹ thuật"
                    field="tinhTrang"
                    formik={formik}
                    multiline
                  />
                  <FieldInput
                    title="Nhân công thực hiện"
                    field="nhanCongThucHien"
                    formik={formik}
                    multiline
                  />
                  <FieldDate
                    title="Thời gian thực hiện"
                    field="thoiGian"
                    formik={formik}
                  />
                  <FieldInput
                    title="Địa điểm thực hiện"
                    field="diaDiem"
                    formik={formik}
                  />
                </Box>
              </Box>
            </Box>

            {/* ── Cột phải: Quy trình duyệt ── */}
            <Box>
              <SignerWorkflowSection formik={formik} />
            </Box>
          </Box>

          {/* Vật tư / Thiết bị */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Danh sách Vật tư đề nghị
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
                    <TableCell sx={{ width: 36 }}>
                      <IconButton
                        size="small"
                        onClick={addMaterialRow}
                        color="primary"
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(formik.values.danhSachVatTu || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ py: 1.5 }}
                        >
                          Chưa có vật tư nào được chọn
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (formik.values.danhSachVatTu || []).map(
                      (item: any, rowIdx: number) => (
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
                              onChange={(value: any) => {
                                if (value) {
                                  updateMaterial(item.id, {
                                    idChiTietVatTu: value.id,
                                    idVatTu: value.idTaiSan,
                                    tenVatTu: value.tenTaiSan,
                                    donViTinh: value.donViTinh,
                                  });
                                } else {
                                  updateMaterial(item.id, {
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
                            <TextFieldNumber
                              title=""
                              field={`danhSachVatTu.${rowIdx}.soLuong`}
                              formik={formik}
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell>
                            <FieldInput
                              title=""
                              field={`danhSachVatTu.${rowIdx}.ghiChu`}
                              formik={formik}
                              noBorder={true}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => removeMaterialRow(item.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* ── Hàng dưới: Preview FULL WIDTH ── */}
          <Box>
            <RepairRequestPreview
              data={formik.values}
              repairLevels={repairLevels}
              departments={departments}
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
          Tạo &amp; Gửi duyệt
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RepairRequestDialog;
