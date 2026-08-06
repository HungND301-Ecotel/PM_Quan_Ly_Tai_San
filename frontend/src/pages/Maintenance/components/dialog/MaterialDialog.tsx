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
import { FormikProvider, useFormik } from "formik";
import dayjs from "dayjs";
import { MaintenancePlanData } from "../../types";
import {
  MaintenanceRepairData,
  DanhGiaVatTuData,
  ChiTietVatTuThuHoiData,
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
  const { data: allToolDetail = [] } = useAllToolDetailQuery();
  const { data: allLevel = [] } = useAllLoaiSCBDQuery();
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
      idCongTy: CongTy.CT001,
      soPhieu: `BB-DG-`,
      ngayDanhGia: dayjs().format("YYYY-MM-DD"),
      viTri: acceptanceRecord.viTri || "",
      capSuaChua: acceptanceRecord.capSuaChua || "",
      tenThietBi: acceptanceRecord.tenThietBi || "",
      kieu: "",
      soDangKi: acceptanceRecord.soDangKi || "",
      idDonViQuanLy: plan?.tenDonViGiao || "",
      idNghiemThu: acceptanceRecord.id || "",
      soLuongPhucHoi: 0,
      soLuongPheLieu: 0,
      soLuongHuy: 0,
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      tenMauBienBan:
        mauMacDinh?.ten ||
        "ĐÁNH GIÁ CHẤT LƯỢNG VẬT TƯ PHỤ TÙNG THU HỒI SAU SỬA CHỮA",
      congTy: mauMacDinh?.congTy || currentBrandConfig.company,
      danhSachChiTiet: [] as ChiTietVatTuThuHoiData[],
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
        idCongTy: values.idCongTy,
        soPhieu: values.soPhieu,
        ngayDanhGia: values.ngayDanhGia,
        viTri: values.viTri,
        capSuaChua: values.capSuaChua,
        tenThietBi: values.tenThietBi,
        kieu: values.kieu,
        soDangKi: values.soDangKi,
        idDonViQuanLy: values.idDonViQuanLy,
        idNghiemThu: values.idNghiemThu,
        soLuongPhucHoi: Number(values.soLuongPhucHoi || 0),
        soLuongPheLieu: Number(values.soLuongPheLieu || 0),
        soLuongHuy: Number(values.soLuongHuy || 0),
        idNguoiLap: idNguoiLapBieu,
        nguoiLapXacNhan: values.nguoiLapXacNhan || false,
        idGiamDoc: idTrinhDuyetGiamDoc,
        giamDocXacNhan: values.giamDocXacNhan || false,
        share: values.share || false,
        trangThai: values.trangThai || 0,
        tenMauBienBan: values.tenMauBienBan,
        congTy: values.congTy,
        nguoiKyList: intermediateSigners,
        danhSachChiTiet: values.danhSachChiTiet.map((vt) => ({
          id: vt.id || undefined,
          idDanhGiaVatTu: values.id || undefined,
          idChiTietVatTu: vt.idChiTietVatTu || "",
          idVatTu: vt.idVatTu || "",
          tenVatTu: vt.tenVatTu || "",
          donViTinh: vt.donViTinh || "Cái",
          soLuong: Number(vt.soLuong || 0),
          tinhTrang: vt.tinhTrang || "",
          bienPhapXuLy: vt.bienPhapXuLy || "",
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
        idCongTy: initData?.idCongTy || CongTy.CT001,
        idNghiemThu: acceptanceRecord?.id || "",
        idDonViQuanLy: plan?.tenDonViGiao || "",
        idNguoiLap: "",
        nguoiLapXacNhan: false,
        idGiamDoc: "",
        giamDocXacNhan: false,
        share: false,
        trangThai: initData?.trangThai || 0,
        soPhieu: savedDraft.soPhieu,
        ngayDanhGia: savedDraft.ngayDanhGia,
        viTri: savedDraft.viTri,
        capSuaChua: savedDraft.capSuaChua,
        tenThietBi: savedDraft.tenThietBi,
        kieu: savedDraft.kieu,
        soDangKi: savedDraft.soDangKi,
        soLuongPhucHoi: savedDraft.soLuongPhucHoi,
        soLuongPheLieu: savedDraft.soLuongPheLieu,
        soLuongHuy: savedDraft.soLuongHuy,
        tenMauBienBan:
          savedDraft.tenMauBienBan ||
          mauMacDinh?.ten ||
          "ĐÁNH GIÁ CHẤT LƯỢNG VẬT TƯ PHỤ TÙNG THU HỒI SAU SỬA CHỮA",
        congTy:
          savedDraft.congTy || mauMacDinh?.congTy || currentBrandConfig.company,
        danhSachChiTiet: savedDraft.danhSachChiTiet,
        nguoiKyList: savedDraft.nguoiKyList?.length
          ? savedDraft.nguoiKyList
          : [],
      });
      return;
    }

    if (initData) {
      const listInfo = listSigneInfo(initData, apiUsers, apiDepartments);
      const signersList = (listInfo || []).map((item, idx) => ({
        ...item,
        userId: item.idNhanVien,
        userName: item.hoTen,
        departmentId: item.idDonVi,
        departmentName: item.donVi,
        order: idx + 1,
      }));
      formik.setValues({
        id: initData.id || "",
        idCongTy: initData.idCongTy || CongTy.CT001,
        soPhieu: initData.soPhieu || "",
        ngayDanhGia: initData.ngayDanhGia || dayjs().format("YYYY-MM-DD"),
        viTri: initData.viTri || "",
        capSuaChua: initData.capSuaChua || "",
        tenThietBi: initData.tenThietBi || "",
        kieu: initData.kieu || "",
        soDangKi: initData.soDangKi || "",
        idDonViQuanLy: initData.idDonViQuanLy || "",
        idNghiemThu: initData.idNghiemThu || "",
        soLuongPhucHoi: initData.soLuongPhucHoi || 0,
        soLuongPheLieu: initData.soLuongPheLieu || 0,
        soLuongHuy: initData.soLuongHuy || 0,
        idNguoiLap: initData.idNguoiLap || "",
        nguoiLapXacNhan: initData.nguoiLapXacNhan || false,
        idGiamDoc: initData.idGiamDoc || "",
        giamDocXacNhan: initData.giamDocXacNhan || false,
        share: initData.share || false,
        trangThai: initData.trangThai || 0,
        tenMauBienBan:
          initData.tenMauBienBan ||
          mauMacDinh?.ten ||
          "ĐÁNH GIÁ CHẤT LƯỢNG VẬT TƯ PHỤ TÙNG THU HỒI SAU SỬA CHỮA",
        congTy:
          initData.congTy || mauMacDinh?.congTy || currentBrandConfig.company,
        danhSachChiTiet: initData.danhSachChiTiet || [],
        nguoiKyList: signersList?.length ? signersList : [],
      });
      return;
    }

    // Tính danhSachChiTiet từ acceptanceRecord — luôn làm trước
    const list: ChiTietVatTuThuHoiData[] = [];
    if ((acceptanceRecord?.danhSachTaiSan || []).length > 0) {
      const mapVatTu = new Map<string, ChiTietVatTuThuHoiData>();
      (acceptanceRecord?.danhSachTaiSan || [])
        .filter((t: any) => t.danhSachVatTu && t.danhSachVatTu.length > 0)
        .forEach((t: any) => {
          (t.danhSachVatTu || []).forEach((vt: any) => {
            const key =
              vt.idChiTietVatTu || vt.idVatTu || vt.tenVatTu || "unknown";
            const soLuong = vt.soLuong || 1;

            if (mapVatTu.has(key)) {
              const existing = mapVatTu.get(key)!;
              existing.soLuong = (existing.soLuong || 0) + soLuong;
            } else {
              mapVatTu.set(key, {
                idChiTietVatTu: vt.idChiTietVatTu || "",
                idVatTu: vt.idVatTu || "",
                tenVatTu: vt.tenVatTu || "",
                donViTinh: vt.donViTinh || "Cái",
                soLuong: soLuong,
                tinhTrang: "",
                bienPhapXuLy: "",
                ghiChu: "",
              });
            }
          });
        });
      list.push(...Array.from(mapVatTu.values()));
    } else if ((acceptanceRecord?.danhSachChiTiet || []).length > 0) {
      const mapVatTu = new Map<string, ChiTietVatTuThuHoiData>();
      (acceptanceRecord?.danhSachChiTiet || []).forEach((vt: any) => {
        const key = vt.idChiTietVatTu || vt.idVatTu || vt.tenVatTu || "unknown";
        const soLuong = vt.soLuongThayThe || vt.soLuong || 1;

        if (mapVatTu.has(key)) {
          const existing = mapVatTu.get(key)!;
          existing.soLuong = (existing.soLuong || 0) + soLuong;
        } else {
          mapVatTu.set(key, {
            idChiTietVatTu: vt.idChiTietVatTu || "",
            idVatTu: vt.idVatTu || "",
            tenVatTu: vt.tenVatTu || "",
            donViTinh: vt.donViTinh || "Cái",
            soLuong: soLuong,
            tinhTrang: "",
            bienPhapXuLy: "",
            ghiChu: "",
          });
        }
      });
      list.push(...Array.from(mapVatTu.values()));
    }

    const defaultList: ChiTietVatTuThuHoiData[] =
      list.length > 0
        ? list
        : [
            {
              idChiTietVatTu: "",
              idVatTu: "",
              tenVatTu: "",
              donViTinh: "Cái",
              soLuong: 1,
              tinhTrang: "",
              bienPhapXuLy: "",
              ghiChu: "",
            },
          ];

    const listInfoFromParent = acceptanceRecord
      ? listSigneInfo(acceptanceRecord as any, apiUsers, apiDepartments)
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

    formik.setValues({
      id: "",
      idCongTy: CongTy.CT001,
      soPhieu: `BB-DG-${repairRequest?.id || Date.now()}`,
      ngayDanhGia: dayjs().format("YYYY-MM-DD"),
      viTri: acceptanceRecord.viTri || "",
      capSuaChua: acceptanceRecord.capSuaChua || "",
      tenThietBi:
        acceptanceRecord.tenThietBi || acceptanceRecord?.idTaiSan || "",
      kieu: "",
      soDangKi: acceptanceRecord.soDangKi || "",
      idDonViQuanLy: plan?.tenDonViGiao || "",
      idNghiemThu: acceptanceRecord.id || "",
      soLuongPhucHoi: 0,
      soLuongPheLieu: 0,
      soLuongHuy: 0,
      idNguoiLap: "",
      nguoiLapXacNhan: false,
      idGiamDoc: "",
      giamDocXacNhan: false,
      share: false,
      trangThai: 0,
      tenMauBienBan:
        mauMacDinh?.ten ||
        "ĐÁNH GIÁ CHẤT LƯỢNG VẬT TƯ PHỤ TÙNG THU HỒI SAU SỬA CHỮA",
      congTy: mauMacDinh?.congTy || currentBrandConfig.company,
      danhSachChiTiet: defaultList,
      nguoiKyList: signersListFromParent,
    });
  }, [
    open,
    initData,
    acceptanceRecord,
    apiUsers,
    apiDepartments,
    plan,
    repairRequest,
    savedDraft,
  ]);

  const listItems = formik.values.danhSachChiTiet;
  useEffect(() => {
    let phucHoi = 0;
    let pheLieu = 0;
    let huy = 0;
    listItems.forEach((item) => {
      const qty = Number(item.soLuong) || 0;
      if (item.bienPhapXuLy === BIEN_PHAP_XU_LY.PHUC_HOI) {
        phucHoi += qty;
      } else if (item.bienPhapXuLy === BIEN_PHAP_XU_LY.PHE_LIEU) {
        pheLieu += qty;
      } else if (item.bienPhapXuLy === BIEN_PHAP_XU_LY.HUY) {
        huy += qty;
      }
    });

    if (
      formik.values.soLuongPhucHoi !== phucHoi ||
      formik.values.soLuongPheLieu !== pheLieu ||
      formik.values.soLuongHuy !== huy
    ) {
      formik.setFieldValue("soLuongPhucHoi", phucHoi);
      formik.setFieldValue("soLuongPheLieu", pheLieu);
      formik.setFieldValue("soLuongHuy", huy);
    }
  }, [
    listItems,
    formik.values.soLuongPhucHoi,
    formik.values.soLuongPheLieu,
    formik.values.soLuongHuy,
  ]);

  const addItem = () => {
    const newItem = {
      idChiTietVatTu: "",
      idVatTu: "",
      tenVatTu: "",
      donViTinh: "Cái",
      soLuong: 1,
      tinhTrang: "",
      bienPhapXuLy: "",
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
    fields: Partial<ChiTietVatTuThuHoiData>,
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
            idBienPhapMayMoc: acceptanceRecord?.idBienPhapMayMoc,
            materialParentAccId: acceptanceRecord?.id,
            soPhieu: formik.values.soPhieu,
            ngayDanhGia: formik.values.ngayDanhGia,
            viTri: formik.values.viTri,
            capSuaChua: formik.values.capSuaChua,
            tenThietBi: formik.values.tenThietBi,
            kieu: formik.values.kieu,
            soDangKi: formik.values.soDangKi,
            soLuongPhucHoi: formik.values.soLuongPhucHoi,
            soLuongPheLieu: formik.values.soLuongPheLieu,
            soLuongHuy: formik.values.soLuongHuy,
            danhSachChiTiet: formik.values.danhSachChiTiet,
            nguoiKyList: formik.values.nguoiKyList,
            tenMauBienBan:
              formik.values.tenMauBienBan ||
              mauMacDinh?.ten ||
              "ĐÁNH GIÁ CHẤT LƯỢNG VẬT TƯ PHỤ TÙNG THU HỒI SAU SỬA CHỮA",
            congTy:
              formik.values.congTy ||
              mauMacDinh?.congTy ||
              currentBrandConfig.company,
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
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RecyclingIcon color="warning" />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Biên bản đánh giá chất lượng vật tư phụ tùng thu hồi sau sửa
                chữa
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
          {/* 2-column grid: Thông tin | Quy trình duyệt */}
          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 3 }}
          >
            {/* Col 1: Thông tin */}
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
                <FieldInput title="Số biên bản" name="soPhieu" />
                <FieldDate
                  title="Ngày lập biên bản"
                  selectedDate={formik.values.ngayDanhGia}
                  setSelectedDate={(date) =>
                    formik.setFieldValue("ngayDanhGia", date)
                  }
                />
                <FieldInput title="Địa điểm (Tại...)" name="viTri" />
                <FieldAutoCompleted
                  title="Cấp sửa chữa"
                  labelkey="ten"
                  data={allLevel}
                  value={formik.values.capSuaChua}
                  onChange={(value) =>
                    formik.setFieldValue("capSuaChua", value.id)
                  }
                  autocompleteSx={{ flex: 1 }}
                />
                <FieldInput title="Của thiết bị" name="tenThietBi" />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <FieldInput title="Kiểu" name="kieu" />
                  <FieldInput title="Số (đăng ký)" name="soDangKi" />
                </Box>
                <FieldAutoCompleted
                  title="Đơn vị quản lý vận hành"
                  data={apiDepartments}
                  value={formik.values.idDonViQuanLy}
                  setValue={(val) => formik.setFieldValue("idDonViQuanLy", val)}
                  labelkey="tenPhongBan"
                />
              </Box>
            </Box>

            {/* Col 2: Quy trình duyệt */}
            <Box>
              <SignerWorkflowSection formik={formik} />
            </Box>
          </Box>

          {/* Full-width: Danh mục vật tư thu hồi */}
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
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>
                      STT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 250 }}>
                      Tên vật tư, thiết bị
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 55 }}>
                      ĐVT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 100 }}>
                      SL
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tình trạng</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Biện pháp xử lý
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }}>
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
                        <TableCell>
                          {String(idx + 1).padStart(2, "0")}
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
                                donViTinh: value?.donViTinh ?? "Cái",
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>{item.donViTinh}</TableCell>
                        <TableCell>
                          <TextFieldNumber
                            name={`danhSachChiTiet.${originalIdx}.soLuong`}
                            noBorder={true}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldInput
                            name={`danhSachChiTiet.${originalIdx}.tinhTrang`}
                            noBorder={true}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldAutoCompleted
                            title=""
                            data={[
                              {
                                id: BIEN_PHAP_XU_LY.HUY,
                                name: BIEN_PHAP_XU_LY.HUY,
                              },
                              {
                                id: BIEN_PHAP_XU_LY.PHE_LIEU,
                                name: BIEN_PHAP_XU_LY.PHE_LIEU,
                              },
                              {
                                id: BIEN_PHAP_XU_LY.PHUC_HOI,
                                name: BIEN_PHAP_XU_LY.PHUC_HOI,
                              },
                            ]}
                            name={`danhSachChiTiet.${originalIdx}.bienPhapXuLy`}
                            labelkey="name"
                            noBorder={true}
                          />
                        </TableCell>
                        <TableCell>
                          <FieldInput
                            name={`danhSachChiTiet.${originalIdx}.ghiChu`}
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

            {/* Số lượng phân loại */}
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <FieldInput
                title="Số để lại phục hồi"
                type="number"
                name="soLuongPhucHoi"
                noBorder={true}
                sx={{ width: 200 }}
              />
              <FieldInput
                title="Số phế liệu"
                type="number"
                name="soLuongPheLieu"
                noBorder={true}
                sx={{ width: 200 }}
              />
              <FieldInput
                title="Số hủy"
                type="number"
                name="soLuongHuy"
                noBorder={true}
                sx={{ width: 200 }}
              />
            </Box>
          </Box>

          {/* Full-width Preview */}
          <MaterialPreview
            d={d}
            formik={formik}
            tieude={formik.values.tenMauBienBan}
            congty={formik.values.congTy}
          />
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
    </FormikProvider>
  );
};

export default MaterialDialog;
