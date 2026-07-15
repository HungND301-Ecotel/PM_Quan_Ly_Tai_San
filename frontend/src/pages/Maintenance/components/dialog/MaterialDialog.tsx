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
  Chip,
  IconButton,
  Divider,
} from "@mui/material";
import RecyclingIcon from "@mui/icons-material/Recycling";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import dayjs from "dayjs";
import { MaintenancePlanData } from "../../types";
import {
  MaintenanceRepairData,
  DanhGiaVatTuData,
  DanhGiaVatTuChiTietData,
} from "../../types";
import FieldDate from "../../../../components/TextField/FieldDate";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllStaffsQuery } from "../../../Staff/Mutation";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import { PlanSigner } from "../../../../mockdata/mockPlans";
import { generateCode } from "../../../../utils/helpers";
import { useMaintenanceMaterialAssessmentMutation } from "../../mutation";
import { useAllToolDetailQuery } from "../../../ToolManager/Mutation";
import { useAllLoaiSCBDQuery } from "../../../MaintenanceRepairType/Mutation";
import {
  CongTy,
  BIEN_PHAP_XU_LY,
  LOAI_BIEN_BAN_TYPE,
} from "../../../../utils/const";
import { listSigneInfo } from "../../config";
import FieldInput from "../../../../components/TextField/FieldInput";

import TextFieldNumber from "../../../../components/TextField/TextFieldNumber";
import SignerWorkflowSection from "../signdocument/SignerWorkflowSection";
import MaterialPreview from "../preview/MaterialPreview";
import { MaterialValidation } from "../../validation";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../redux/store";
import { updateTabFormData } from "../../../../redux/tabsSlice";
import { Remove } from "@mui/icons-material";
import { useBienBanSuaChuaPageQuery } from "../../../RepairReport/Mutation";
import { currentBrandConfig } from "../../../../config/brandConfig";
import { useAllPositionsQuery } from "../../../Position/Mutation";

interface Props {
  open: boolean;
  onClose: () => void;
  plan?: MaintenancePlanData | null;
  repairRequest: MaintenanceRepairData;
  acceptanceRecord: any;
  initData?: DanhGiaVatTuData | null;
}

const MaterialDialog = ({
  open,
  onClose,
  plan,
  repairRequest,
  acceptanceRecord,
  initData,
}: Props) => {
  const { data: apiDepartments = [] } = useAllDepartmentsQuery();
  const { data: apiUsers = [] } = useAllStaffsQuery();
  const { data: apiPositions = [] } = useAllPositionsQuery();
  const { data: allToolDetail = [] } = useAllToolDetailQuery();
  const { createMutation, updateMutation } =
    useMaintenanceMaterialAssessmentMutation();

  const location = useLocation();
  const tabPath = location.pathname;
  const dispatch = useAppDispatch();

  const draftId = initData?.id || acceptanceRecord?.id || "new";
  const savedDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t) => t.path === tabPath);
    return tab?.formData?.[`materialDraft_${draftId}`] ?? null;
  });
  const { data: repairReportPage = { items: [], totalItems: 0 }, isLoading } =
    useBienBanSuaChuaPageQuery(
      0,
      9999,
      "",
      LOAI_BIEN_BAN_TYPE.DANH_GIA_VAT_TU,
      true,
    );
  const mauMacDinh = repairReportPage?.data?.items?.[0];

  const formik = useFormik({
    initialValues: {
      id: "",
      quyetDinhSo: "",
      canCuHoSo: "",
      ngayDanhGia: dayjs().format("YYYY-MM-DD"),
      diaDiem: acceptanceRecord.viTri || "",
      idNghiemThu: acceptanceRecord.id || "",
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      danhSachChiTiet: [] as DanhGiaVatTuChiTietData[],
      nguoiKyList: [] as any[],
    },
    // validationSchema: MaterialValidation,
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

      const record: DanhGiaVatTuData = {
        id: values.id || undefined,
        quyetDinhSo: values.quyetDinhSo,
        canCuHoSo: values.canCuHoSo,
        ngayDanhGia: values.ngayDanhGia,
        diaDiem: values.diaDiem,
        idNghiemThu: values.idNghiemThu,
        idNguoiLap: idNguoiLapBieu,
        nguoiLapXacNhan: values.nguoiLapXacNhan || false,
        idGiamDoc: idTrinhDuyetGiamDoc,
        giamDocXacNhan: values.giamDocXacNhan || false,
        share: values.share || false,
        trangThai: values.trangThai || 0,
        nguoiKyList: intermediateSigners,
        danhSachChiTiet: values.danhSachChiTiet.map((vt) => ({
          id: vt.id || undefined,
          idDanhGia: values.id || undefined,
          idChiTietVatTu: vt.idChiTietVatTu || "",
          idVatTu: vt.idVatTu || "",
          tenVatTu: vt.tenVatTu || "",
          donViTinh: vt.donViTinh || "Cái",
          soLuong: Number(vt.soLuong || 0),
          khoiLuong: Number(vt.khoiLuong || 0),
          chatLuongConLai: Number(vt.chatLuongConLai || 0),
          donGia: Number(vt.donGia || 0),
          giaTriConLai: Number(vt.giaTriConLai || 0),
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
        idNghiemThu: acceptanceRecord?.id || "",
        quyetDinhSo: savedDraft.quyetDinhSo || "",
        canCuHoSo: savedDraft.canCuHoSo || "",
        ngayDanhGia: savedDraft.ngayDanhGia,
        diaDiem: savedDraft.diaDiem,
        idNguoiLap: "",
        nguoiLapXacNhan: false,
        idGiamDoc: "",
        giamDocXacNhan: false,
        share: false,
        trangThai: initData?.trangThai || 0,
        danhSachChiTiet: savedDraft.danhSachChiTiet,
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
        quyetDinhSo: initData.quyetDinhSo || "",
        canCuHoSo: initData.canCuHoSo || "",
        ngayDanhGia: initData.ngayDanhGia || dayjs().format("YYYY-MM-DD"),
        diaDiem: initData.diaDiem || "",
        idNghiemThu: initData.idNghiemThu || "",
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

    const list: DanhGiaVatTuChiTietData[] = [];
    if ((acceptanceRecord?.danhSachVatTu || []).length > 0) {
      const mapVatTu = new Map<string, DanhGiaVatTuChiTietData>();
      (acceptanceRecord?.danhSachVatTu || []).forEach((vt: any) => {
        const key = vt.idChiTietVatTu || vt.idVatTu || vt.tenVatTu || "unknown";
        const soLuong = vt.soLuongThayThe || vt.soLuongThuHoi || 1;
        const giaTri = vt.giaTri || 0;

        if (mapVatTu.has(key)) {
          const existing = mapVatTu.get(key)!;
          existing.soLuong = (existing.soLuong || 0) + soLuong;
        } else {
          mapVatTu.set(key, {
            idChiTietVatTu: vt.idChiTietVatTu || "",
            idVatTu: vt.idVatTu || "",
            tenVatTu: vt.tenVatTu || "",
            donViTinh: vt.donViTinh || "",
            soLuong: soLuong,
            khoiLuong: soLuong,
            chatLuongConLai: 0,
            donGia: giaTri,
            giaTriConLai: 0,
            ghiChu: "",
          });
        }
      });
      list.push(...Array.from(mapVatTu.values()));
    }

    const defaultList: DanhGiaVatTuChiTietData[] =
      list.length > 0
        ? list
        : [
            {
              idChiTietVatTu: "",
              idVatTu: "",
              tenVatTu: "",
              donViTinh: "",
              soLuong: 1,
              khoiLuong: 1,
              chatLuongConLai: 0,
              donGia: 0,
              giaTriConLai: 0,
              ghiChu: "",
            },
          ];

    const listInfoFromParent = acceptanceRecord
      ? listSigneInfo(
          acceptanceRecord as any,
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
      quyetDinhSo: "",
      canCuHoSo: "",
      ngayDanhGia: dayjs().format("YYYY-MM-DD"),
      diaDiem: acceptanceRecord.viTri || "",
      idNghiemThu: acceptanceRecord.id || "",
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
    acceptanceRecord,
    apiUsers,
    apiDepartments,
    apiPositions,
    plan,
    repairRequest,
    savedDraft,
  ]);

  const addItem = () => {
    const newItem = {
      idChiTietVatTu: "",
      idVatTu: "",
      tenVatTu: "",
      donViTinh: "Cái",
      soLuong: 1,
      khoiLuong: 1,
      chatLuongConLai: 0,
      donGia: 0,
      giaTriConLai: 0,
      ghiChu: "",
    };
    formik.setFieldValue("danhSachChiTiet", [
      ...formik.values.danhSachChiTiet,
      newItem,
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
    fields: Partial<DanhGiaVatTuChiTietData>,
  ) => {
    const updatedList = formik.values.danhSachChiTiet.map((it, i) => {
      if (i === idx) {
        return {
          ...it,
          ...fields,
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
          [`materialDraft_${draftId}`]: null,
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
          [`materialDraft_${draftId}`]: {
            idNghiemThu: formik.values.idNghiemThu,
            materialParentAccId: acceptanceRecord?.id,
            quyetDinhSo: formik.values.quyetDinhSo,
            canCuHoSo: formik.values.canCuHoSo,
            ngayDanhGia: formik.values.ngayDanhGia,
            diaDiem: formik.values.diaDiem,
            danhSachChiTiet: formik.values.danhSachChiTiet,
            nguoiKyList: formik.values.nguoiKyList,
          },
          lastMinimizedDialog: "material",
        },
      }),
    );
    onClose();
  };

  const d = formik.values.ngayDanhGia
    ? new Date(formik.values.ngayDanhGia)
    : new Date();

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
          <RecyclingIcon color="warning" />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Biên bản đánh giá chất lượng vật tư phụ tùng thu hồi sau sửa chữa
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Căn cứ BB nghiệm thu: {acceptanceRecord.soPhieu || ""}
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
              Thông tin
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FieldInput
                title="Quyết định số"
                formik={formik}
                field="quyetDinhSo"
              />
              <FieldInput
                title="Căn cứ hồ sơ"
                formik={formik}
                field="canCuHoSo"
              />
              <FieldDate
                title="Ngày lập biên bản"
                selectedDate={formik.values.ngayDanhGia}
                setSelectedDate={(date) =>
                  formik.setFieldValue("ngayDanhGia", date)
                }
              />
              <FieldInput
                title="Địa điểm (Tại...)"
                formik={formik}
                field="diaDiem"
              />
              <FieldAutoCompleted
                title="Đơn vị đánh giá"
                formik={formik}
                field="idDonViDanhGia"
                data={apiDepartments}
                labelkey="tenPhongBan"
                onChange={(val: any) => {
                  formik.setFieldValue(
                    "tenDonViDanhGia",
                    val?.tenPhongBan || "",
                  );
                }}
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
              Danh mục vật tư thu hồi
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
                  <TableCell sx={{ fontWeight: 700, width: 200 }}>
                    Tên vật tư, thiết bị
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 55 }}>ĐVT</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 70 }}>SL</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 90 }}>
                    Khối lượng
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 90 }}>
                    CL còn lại
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 90 }}>
                    Đơn giá
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 90 }}>
                    GT còn lại
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 100 }}>
                    Ghi chú
                  </TableCell>
                  <TableCell sx={{ width: 36 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {formik.values.danhSachChiTiet
                  .map((item, originalIdx) => ({ item, originalIdx }))
                  .map(({ item, originalIdx }, idx) => (
                    <TableRow key={originalIdx}>
                      <TableCell>{String(idx + 1).padStart(2, "0")}</TableCell>
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
                              donViTinh: value?.donViTinh ?? "",
                              donGia: value?.giaTri ?? 0,
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>{item.donViTinh}</TableCell>
                      <TableCell>
                        <TextFieldNumber
                          formik={formik}
                          field={`danhSachChiTiet.${originalIdx}.soLuong`}
                          noBorder={true}
                        />
                      </TableCell>
                      <TableCell>
                        <TextFieldNumber
                          formik={formik}
                          field={`danhSachChiTiet.${originalIdx}.khoiLuong`}
                          noBorder={true}
                        />
                      </TableCell>
                      <TableCell>
                        <TextFieldNumber
                          formik={formik}
                          field={`danhSachChiTiet.${originalIdx}.chatLuongConLai`}
                          noBorder={true}
                        />
                      </TableCell>
                      <TableCell>
                        <TextFieldNumber
                          formik={formik}
                          field={`danhSachChiTiet.${originalIdx}.donGia`}
                          noBorder={true}
                        />
                      </TableCell>
                      <TableCell>
                        <TextFieldNumber
                          formik={formik}
                          field={`danhSachChiTiet.${originalIdx}.giaTriConLai`}
                          noBorder={true}
                        />
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
        <MaterialPreview d={d} formik={formik} />
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
          {initData ? "Cập nhật biên bản" : "Tạo biên bản"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialDialog;
