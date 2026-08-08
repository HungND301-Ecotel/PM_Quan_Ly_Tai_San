import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  TableCell,
  IconButton,
  styled,
  TableBody,
  TableContainer,
  Collapse,
  Table,
  TableRow,
  TableHead,
  TextField,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
} from "@mui/material";
import {
  ArrowDropDown,
  ArrowDropUp,
  Add,
  Delete,
  Cancel,
  Visibility,
  FormatLineSpacing,
  Remove,
  Close,
} from "@mui/icons-material";
import { useFormik, FieldArray, FormikProvider } from "formik";

import FieldInput from "../../../components/TextField/FieldInput";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldDateTime from "../../../components/TextField/FieldDateTime";
import FileAttachmentInput from "../../../components/TextField/FileAttachmentInput";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import EditButton from "../../../components/Button/EditButton";
import CustomStepper from "../../../components/common/CustomStepper";
import ViewBtn from "../../../components/Button/ViewBtn";
import { AssetHandoverData, AssetHandoverFormValues } from "../types";
import {
  useAssetTranferMutation,
  useAssetTransferPageQuery,
} from "../../AssetTransfer/Mutation";
import dayjs from "dayjs";
import SignDocumentForm from "./SignDocumentForm";
import PreviewBtn from "../../../components/Button/PreviewBtn";
import { findById, generateCode } from "../../../utils/helpers";
import { useAllCurrentStatusQuery } from "../../CurrentStatus/Mutation";
import { assetHandoverValidationSchema } from "../validation";
import { generateBienBanPdf } from "../config";
import S3Service from "../../../services/S3Service";
import { useSelector } from "react-redux";
import { CongTy } from "../../../utils/const";
import { useDebounce } from "../../../hooks/useDebounce";

const UnderlinedInputWrapper = styled(Box)({
  width: "100%",
  "& .MuiOutlinedInput-root": {
    // 1. Ẩn toàn bộ khung mặc định
    "& fieldset": {
      border: "none",
    },
    // 2. Tạo vạch kẻ chân giả bằng border-bottom của chính Input
    borderBottom: "1px solid #ccc",
    borderRadius: 0,
    backgroundColor: "transparent",
    transition: "all 0.2s ease-in-out",
    paddingLeft: 0,
    paddingRight: 0,

    // 3. Hiệu ứng khi Hover
    "&:hover": {
      borderBottom: "1px solid #1976d2",
    },

    // 4. Hiệu ứng khi Focus (đang nhập liệu)
    "&.Mui-focused": {
      borderBottom: "2px solid #1976d2",
    },

    // 5. Trạng thái Disabled (Chỉ xem)
    "&.Mui-disabled": {
      borderBottom: "1px dotted #999",
    },
  },

  // Điều chỉnh khoảng cách chữ bên trong cho sát vạch kẻ
  "& .MuiInputBase-input": {
    padding: "8px 0px 4px 0px !important",
  },

  // Đẩy cái icon dropdown của Autocomplete lên một chút cho cân
  "& .MuiAutocomplete-endAdornment": {
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
  },
});

const CustomTableCell = styled(TableCell)(() => ({
  borderBottom: "1px solid rgba(224, 224, 224, 1)",
  padding: "8px",
  fontSize: "14px",
}));

export default function AssetHandoverForm({
  onEdit,
  onCancel,
  onClose,
  selectedAssetHandover,
  readOnly,
  onSave,
  label,
  allUnits = [],
  staffs = [],
  departments = [],
  positions = [],
  initialFormData,
  onFormChange,
  onMinimize,
}: {
  onEdit: () => void;
  onCancel: () => void;
  onClose: () => void;
  selectedAssetHandover?: AssetHandoverData;
  readOnly?: boolean;
  onSave: (values: any) => void;
  label?: string;
  allUnits?: any[];
  staffs?: any[];
  departments?: any[];
  positions?: any[];
  onFormChange?: (values: any) => void;
  initialFormData?: Record<string, any>;
  onMinimize: () => void;
}) {
  const { user } = useSelector((state: any) => state.user);
  const currentStatus =
    selectedAssetHandover?.trangThai ?? selectedAssetHandover?.trangThai ?? 0;

  const [expanded, setExpanded] = useState(true);
  const [tableExpanded, setTableExpanded] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [document, setDocument] = useState<File | string | any>("");
  const [bangKe, setBangKe] = useState<File | string | any>("");
  const [priviewDocument, setPriviewDocument] = useState(false);

  const [listASsets, setListAssets] = useState<any[]>([]);
  const { data: AssetTransferData = { items: [] } } = useAssetTransferPageQuery(
    0,
    9999,
    undefined,
    undefined,
    undefined,
    4,
    user.taiKhoan?.phongBanId,
    selectedAssetHandover?.id ? undefined : true,
  );
  const { data: allCurrentStatus = [] } = useAllCurrentStatusQuery();
  const { assetTransferDetailAllMutation } = useAssetTranferMutation();

  const formik = useFormik<AssetHandoverFormValues>({
    initialValues: {
      id: initialFormData?.id ?? "",
      soQuyetDinh: initialFormData?.soQuyetDinh ?? "",
      banGiaoTaiSan: initialFormData?.banGiaoTaiSan ?? "",
      quyetDinhDieuDongSo: initialFormData?.quyetDinhDieuDongSo ?? "",
      lenhDieuDong: initialFormData?.lenhDieuDong ?? "",
      idDonViGiao: initialFormData?.idDonViGiao ?? "",
      idDonViNhan: initialFormData?.idDonViNhan ?? "",
      ngayBanGiao:
        initialFormData?.ngayBanGiao ??
        dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      ngayQuyetDinh:
        initialFormData?.ngayQuyetDinh ??
        dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      ngayTaoChungTu:
        initialFormData?.ngayTaoChungTu ??
        dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      diaDiemQuyetDinh: initialFormData?.diaDiemQuyetDinh ?? "",
      idGiamDoc: initialFormData?.idGiamDoc ?? "",
      idCongTy: initialFormData?.idCongTy ?? CongTy.CT001,
      idLanhDao: initialFormData?.idLanhDao ?? "",
      idDaiDiendonviBanHanhQD: initialFormData?.idDaiDiendonviBanHanhQD ?? "",
      daXacNhan: initialFormData?.daXacNhan ?? false,
      idDaiDienBenGiao: initialFormData?.idDaiDienBenGiao ?? "",
      daiDienBenGiaoXacNhan: initialFormData?.daiDienBenGiaoXacNhan ?? false,
      idDaiDienBenNhan: initialFormData?.idDaiDienBenNhan ?? "",
      daiDienBenNhanXacNhan: initialFormData?.daiDienBenNhanXacNhan ?? false,
      trangThai: initialFormData?.trangThai ?? 0,
      note: initialFormData?.note ?? "",
      ngayTao: initialFormData?.ngayTao ?? "",
      ngayCapNhat: initialFormData?.ngayCapNhat ?? "",
      nguoiTao: initialFormData?.nguoiTao ?? "",
      nguoiCapNhat: initialFormData?.nguoiCapNhat ?? "",
      isActive: initialFormData?.isActive ?? true,
      share: initialFormData?.share ?? false,
      duongDanFile: initialFormData?.duongDanFile ?? "",
      tenFile: initialFormData?.tenFile ?? "",
      byStep: initialFormData?.byStep ?? true,
      giamDocKy: initialFormData?.giamDocKy ?? false,
      taiLieuBangKe: initialFormData?.taiLieuBangKe ?? "",
      nguoiKyList: initialFormData?.nguoiKyList ?? [],
      chiTietBanGiaoTaiSan: initialFormData?.chiTietBanGiaoTaiSan ?? [
        {
          id: "",
          idBanGiaoTaiSan: "",
          idTaiSan: "",
          tenTaiSan: "",
          kyHieu: "",
          nuocSanXuat: "",
          donViTinh: "",
          soLuong: 1,
          hienTrang: "1",
          ghiChu: "",
          isActive: true,
          moTa: "",
        },
      ],
      initialChiTiet: initialFormData?.initialChiTiet ?? [],
      isNew: initialFormData?.isNew ?? true,
    },
    validationSchema: assetHandoverValidationSchema,
    onSubmit: async (values) => {
      const chiTietBanGiaoTaiSan = values.chiTietBanGiaoTaiSan.map(
        (item: any, index) => ({
          ...item,
          id: `${generateCode("CTBGTS-")}-${index}`,
          idBanGiaoTaiSan: values.id,
        }),
      );

      const nguoiKyList = values.nguoiKyList.map((item: any, index) => ({
        ...item,
        id: `${generateCode("SIG-")}-${index}`,
        idTaiLieu: values.id,
      }));

      const bangKeBytes = await generateBienBanPdf(
        {
          ...values,
          tenDonViGiao: findById(departments, formik.values.idDonViGiao)
            ?.tenPhongBan,
          tenDonViNhan: findById(departments, formik.values.idDonViNhan)
            ?.tenPhongBan,
          tenLanhDao: "",
          idDaiDiendonviBanHanhQD: "",
          tenDaiDienBanHanhQD: "",
          tenDaiDienBenGiao: findById(staffs, formik.values.idDaiDienBenGiao)
            ?.hoTen,
          tenDaiDienBenNhan: findById(staffs, formik.values.idDaiDienBenNhan)
            ?.hoTen,
          tenGiamDoc: findById(staffs, formik.values.idGiamDoc)?.hoTen,
          trangThaiPhieu: 0,
          chuKyList: [],
        },
        allUnits,
        staffs,
        departments,
        positions,
      );
      const bobBangKe = new Blob([bangKeBytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const fileBangeKe = new File(
        [bangKeBytes.buffer as ArrayBuffer],
        `BienBan_${values.banGiaoTaiSan}_${Date.now()}.pdf`,
        {
          type: "application/pdf",
        },
      );

      // 2. Xử lý Key tài liệu gốc (duongDanFile)
      let keyTailieu = values.duongDanFile;
      let keyTaiLieuBangKe = values.taiLieuBangKe;

      // Nếu 'document' là File (người dùng vừa chọn file mới)
      if (document instanceof File) {
        keyTailieu = await S3Service.put({
          name: document.name,
          file: document,
          type: "tailieu",
        });
      }

      if (!keyTaiLieuBangKe) {
        keyTaiLieuBangKe = await S3Service.put({
          name: `BGTS_${values.banGiaoTaiSan}_${Date.now()}.pdf`,
          file: fileBangeKe,
          type: "tailieu",
        });
      } else {
        await S3Service.updatePresignedPutUrl(keyTaiLieuBangKe, bobBangKe);
      }
      const isSigningRequired = values.byStep;

      onSave({
        ...values,
        trangThai: isSigningRequired ? 0 : 3,
        share: !isSigningRequired,
        daiDienBenGiaoXacNhan:
          !isSigningRequired && values.idDaiDienBenGiao ? true : false,
        daiDienBenNhanXacNhan:
          !isSigningRequired && values.idDaiDienBenNhan ? true : false,
        giamDocKy: !isSigningRequired && values.idGiamDoc ? true : false,
        quyetDinhDieuDongSo: values.lenhDieuDong,
        chiTietBanGiaoTaiSan,
        nguoiKyList: nguoiKyList.map((item: any) => ({
          ...item,
          trangThai: !isSigningRequired ? 1 : 0,
        })),
        duongDanFile: keyTailieu,
        taiLieuBangKe: keyTaiLieuBangKe,
      });
    },
  });

  const debouncedValues = useDebounce(formik.values, 800);

  useEffect(() => {
    if (!selectedAssetHandover || selectedAssetHandover.isNew) {
      onFormChange?.(debouncedValues);
    }
  }, [debouncedValues]);

  useEffect(() => {
    if (selectedAssetHandover) {
      formik.setValues({
        ...selectedAssetHandover,
        isNew: selectedAssetHandover.isNew ?? false,
        chiTietBanGiaoTaiSan: selectedAssetHandover.chiTietBanGiaoTaiSan.map(
          (i: any) => ({ ...i, id: i.idTaiSan }),
        ),
        initialChiTiet: (selectedAssetHandover.chiTietBanGiaoTaiSan || []).map(
          (i: any) => i.id,
        ),
      });
      setDocument(selectedAssetHandover.duongDanFile);
      getListAsset(selectedAssetHandover.lenhDieuDong);
    }
  }, [selectedAssetHandover]);

  const [nvGiao, setNvGiao] = useState<any[]>([]);
  const [nvNhan, setNvNhan] = useState<any[]>([]);

  useEffect(() => {
    if (formik.values.idDonViGiao && departments.length && staffs.length) {
      const donvi = findById(departments, formik.values.idDonViGiao);
      if (donvi?.isKho) {
        const res = departments
          .filter((d: any) => d.isKho)
          .map((i: any) => i.id);
        setNvGiao(staffs.filter((s: any) => res.includes(s.phongBanId)));
      } else {
        setNvGiao(
          staffs.filter((s: any) => s.phongBanId === formik.values.idDonViGiao),
        );
      }
    }
  }, [formik.values.idDonViGiao, departments, staffs]);
  useEffect(() => {
    if (formik.values.idDonViGiao && departments.length && staffs.length) {
      const donvi = findById(departments, formik.values.idDonViNhan);
      if (donvi?.isKho) {
        const res = departments
          .filter((d: any) => d.isKho)
          .map((i: any) => i.id);
        setNvNhan(staffs.filter((s: any) => res.includes(s.phongBanId)));
      } else {
        setNvNhan(
          staffs.filter((s: any) => s.phongBanId === formik.values.idDonViNhan),
        );
      }
    }
  }, [formik.values.idDonViNhan, departments, staffs]);

  const lanhDaoDeptIds = new Set(
    departments.filter((d: any) => d.isLanhDao).map((d: any) => d.id),
  );

  const getListAsset = async (id: string) => {
    if (!id) return;
    const result = await assetTransferDetailAllMutation.mutateAsync(id);

    setListAssets(
      (result || []).map((i: any) => ({
        ...i,
        id: i.idTaiSan,
        moTa: i.moTa,
        ghiChu: i.ghiChu,
      })),
    );
  };

  return (
    <FormikProvider value={formik}>
      {isPreview && (
        <SignDocumentForm
          selectedIds={[]}
          document={document}
          bangKe={bangKe}
          previewDocument={priviewDocument}
          onCancel={() => {
            setIsPreview(false);
            setPriviewDocument(false);
          }}
          onSign={() => {
            console.log("Ký tài liệu thành công");
          }}
          showSignerSidebar={false}
          fullscreen={true}
          staffs={staffs}
          assetHandover={{
            ...formik.values,
            tenDonViGiao: findById(departments, formik.values.idDonViGiao)
              ?.tenPhongBan,
            tenDonViNhan: findById(departments, formik.values.idDonViNhan)
              ?.tenPhongBan,
            tenLanhDao: "",
            idDaiDiendonviBanHanhQD: "",
            tenDaiDienBanHanhQD: "",
            tenDaiDienBenGiao: findById(staffs, formik.values.idDaiDienBenGiao)
              ?.hoTen,
            tenDaiDienBenNhan: findById(staffs, formik.values.idDaiDienBenNhan)
              ?.hoTen,
            tenGiamDoc: findById(staffs, formik.values.idGiamDoc)?.hoTen,
            trangThaiPhieu: 0,
            chuKyList: [],
          }}
          allUnits={allUnits}
          departments={departments}
          positions={positions}
          isEdit={
            [0].includes(selectedAssetHandover?.trangThai ?? 0) ? true : false
          }
        />
      )}

      <Box
        sx={{
          bgcolor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header sticky */}
        <Box
          sx={{
            p: 2,
            bgcolor: "#f6f8f4ff",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 11,
          }}
        >
          {/* Title + Minimize/Close */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1FA463" }}>
              Chi tiết {label}
            </Typography>
            <Box display="flex" gap={0.5}>
              <CustomStepper activeStep={currentStatus} />

              <IconButton size="small" onClick={onMinimize} title="Ẩn tạm">
                <Remove fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={onClose} title="Đóng">
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Body — giữ nguyên toàn bộ Paper bên trong */}
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            }}
          >
            <Grid container spacing={4}>
              {/* CỘT 1 */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Grid container spacing={2}>
                  {!formik.values.isNew && (
                    <Grid size={12}>
                      <FieldInput
                        title="Số phiếu bàn giao"
                        name="id"
                        disabled={true}
                      />
                    </Grid>
                  )}
                  <Grid size={12}>
                    <FieldInput
                      title="Tên biên bản bàn giao"
                      name="banGiaoTaiSan"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FieldAutoCompleted
                      title="Lệnh điều động tài sản"
                      name="lenhDieuDong"
                      data={AssetTransferData.items || []}
                      labelkey="id"
                      onChange={async (value) => {
                        formik.setFieldValue("idDonViGiao", value.idDonViGiao);
                        formik.setFieldValue("idDonViNhan", value.idDonViNhan);
                        formik.setFieldValue("soQuyetDinh", value.soQuyetDinh);
                        getListAsset(value.id);
                      }}
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FieldAutoCompleted
                      title="Đơn vị giao"
                      name="idDonViGiao"
                      data={departments}
                      labelkey="tenPhongBan"
                      disabled={true}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FieldAutoCompleted
                      title="Đơn vị nhận"
                      name="idDonViNhan"
                      data={departments}
                      labelkey="tenPhongBan"
                      disabled={true}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FieldInput
                      title="Số quyết định"
                      name="soQuyetDinh"
                      disabled={true}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FieldInput
                      title="Địa điểm bàn giao"
                      name="diaDiemQuyetDinh"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FieldDateTime
                      title="Ngày quyết định"
                      name="ngayQuyetDinh"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FieldDateTime
                      title="Ngày bàn giao"
                      name="ngayBanGiao"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FieldDateTime
                      title="Ngày tạo chứng từ"
                      name="ngayTaoChungTu"
                      disabled={readOnly}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* CỘT 2 */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <FieldAutoCompleted
                      labelkey="hoTen"
                      title="Đơn vị giao"
                      name="idDaiDienBenGiao"
                      data={nvGiao}
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FieldAutoCompleted
                      labelkey="hoTen"
                      title="Đơn vị nhận"
                      name="idDaiDienBenNhan"
                      data={nvNhan}
                      disabled={readOnly}
                    />
                  </Grid>

                  <FieldArray name="nguoiKyList">
                    {({ push, remove }) => (
                      <Grid size={12}>
                        {!readOnly && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Add />}
                            sx={{ mb: 1 }}
                            onClick={() =>
                              push({
                                id: "",
                                idTaiLieu: "",
                                idNguoiKy: "",
                                tenNguoiKy: "",
                                idPhongBan: "",
                                trangThai: 0,
                              })
                            }
                          >
                            Thêm người đại diện
                          </Button>
                        )}
                        {(formik.values.nguoiKyList || []).map(
                          (item: any, index: number) => (
                            <Grid
                              container
                              spacing={1}
                              key={index}
                              sx={{ mb: 1 }}
                            >
                              <Grid size={11}>
                                <FieldAutoCompleted
                                  title={`Đơn vị đại diện ${index + 1}`}
                                  name={`nguoiKyList.${index}.idPhongBan`}
                                  data={departments}
                                  labelkey="tenPhongBan"
                                  disabled={readOnly}
                                />
                                <Box p={1}></Box>
                                <FieldAutoCompleted
                                  title={`Người đại diện ${index + 1}`}
                                  name={`nguoiKyList.${index}.idNguoiKy`}
                                  data={staffs.filter(
                                    (s: any) =>
                                      s.phongBanId === item.idPhongBan,
                                  )}
                                  labelkey="hoTen"
                                  onChange={(value) => {
                                    formik.setFieldValue(
                                      `nguoiKyList.${index}.tenNguoiKy`,
                                      value.hoTen,
                                    );
                                  }}
                                  disabled={readOnly}
                                />
                              </Grid>
                              {!readOnly && (
                                <Grid
                                  size={1}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <IconButton
                                    color="error"
                                    onClick={() => remove(index)}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Grid>
                              )}
                            </Grid>
                          ),
                        )}
                      </Grid>
                    )}
                  </FieldArray>

                  <Grid size={12} sx={{ mt: 2 }}>
                    <FieldAutoCompleted
                      labelkey="hoTen"
                      title="Giám đốc xác nhận"
                      name="idGiamDoc"
                      data={staffs.filter((s: any) =>
                        lanhDaoDeptIds.has(s.phongBanId),
                      )}
                      disabled={readOnly}
                    />
                  </Grid>

                  <Grid size={12}>
                    <FormControl
                      component="fieldset"
                      disabled={readOnly}
                      sx={{ mb: 1 }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        gutterBottom
                      >
                        Thực hiện luồng ký duyệt?
                      </Typography>
                      <RadioGroup
                        row
                        name="byStep"
                        value={formik.values.byStep ? "true" : "false"}
                        onChange={(e) => {
                          formik.setFieldValue(
                            "byStep",
                            e.target.value === "true",
                          );
                        }}
                      >
                        <FormControlLabel
                          value="true"
                          control={<Radio color="primary" />}
                          label={
                            <Typography sx={{ fontWeight: 500 }}>Có</Typography>
                          }
                        />
                        <FormControlLabel
                          value="false"
                          control={<Radio color="primary" />}
                          label={
                            <Typography sx={{ fontWeight: 500 }}>
                              Không
                            </Typography>
                          }
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* PHẦN 2: TÀI LIỆU QUYẾT ĐỊNH */}
            <Box mt={4} mb={4}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Tài liệu Quyết định
              </Typography>

              {/* Khung bao ngoài màu xám để chứa input file */}
              <Box
                sx={{ backgroundColor: "#f5f5f5", borderRadius: "4px", p: 2 }}
              >
                <FileAttachmentInput
                  formik={formik}
                  fileName="tenFile"
                  filePath="duongDanFile"
                  setDocument={setDocument}
                  disabled={readOnly}
                />
                <PreviewBtn
                  handleClick={() => {
                    setDocument(formik.values.duongDanFile || document);
                    setIsPreview(true);
                    setPriviewDocument(true);
                  }}
                />
              </Box>
            </Box>

            {/* PHẦN 3: CHI TIẾT TÀI SẢN BÀN GIAO */}
            <Box
              mt={3}
              sx={{ backgroundColor: "#f5f5f5", borderRadius: "4px", p: 1 }}
            >
              {/* Header của bảng nhỏ - Hoạt động giống cái lớn */}
              <Box
                onClick={() => setTableExpanded(!tableExpanded)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  px: 1,
                  py: 0.5,
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  {tableExpanded ? (
                    <ArrowDropUp
                      sx={{ color: "text.secondary", fontSize: 20 }}
                    />
                  ) : (
                    <ArrowDropDown
                      sx={{ color: "text.secondary", fontSize: 20 }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ color: "#666", fontSize: "13px" }}
                  >
                    Chi tiết tài sản bàn giao
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: "#666", fontSize: "13px" }}
                >
                  {tableExpanded ? "Thu gọn" : "Mở rộng"}
                </Typography>
              </Box>

              {/* Nội dung bảng bên trong lớp nền trắng */}
              <Collapse in={tableExpanded}>
                <TableContainer
                  component={Paper}
                  sx={{
                    boxShadow: "none",
                    border: "none",
                    backgroundColor: "#fff",
                    mt: 1,
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <CustomTableCell
                          width="35%"
                          sx={{
                            textAlign: "center",
                            fontWeight: "bold",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          Tên tài sản
                        </CustomTableCell>
                        <CustomTableCell
                          width="15%"
                          sx={{
                            textAlign: "center",
                            fontWeight: "bold",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          Đơn vị tính
                        </CustomTableCell>
                        <CustomTableCell
                          width="10%"
                          sx={{
                            textAlign: "center",
                            fontWeight: "bold",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          Số lượng
                        </CustomTableCell>
                        <CustomTableCell
                          width="20%"
                          sx={{
                            textAlign: "center",
                            fontWeight: "bold",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          Tình trạng kỹ thuật
                        </CustomTableCell>
                        <CustomTableCell
                          width="20%"
                          sx={{
                            textAlign: "center",
                            fontWeight: "bold",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          Ghi chú
                        </CustomTableCell>
                        {!readOnly && (
                          <CustomTableCell
                            width="45px"
                            sx={{ borderBottom: "1px solid #eee" }}
                          />
                        )}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {(formik.values.chiTietBanGiaoTaiSan || []).map(
                        (row: any, index: number) => (
                          <TableRow
                            key={index}
                            sx={{
                              height: "50px",
                              "&:hover": { backgroundColor: "#fafafa" },
                              "& td": { borderBottom: "none" },
                            }}
                          >
                            {/* 1. Tên tài sản */}
                            <CustomTableCell
                              sx={{ py: 0.5, px: 1, verticalAlign: "bottom" }}
                            >
                              <UnderlinedInputWrapper>
                                {readOnly ? (
                                  <TextField
                                    value={row.tenTaiSan}
                                    disabled
                                    fullWidth
                                  />
                                ) : (
                                  <FieldAutoCompleted
                                    labelkey="tenTaiSan"
                                    labelOption="id"
                                    title=""
                                    name={`chiTietBanGiaoTaiSan.${index}.idTaiSan`}
                                    data={listASsets}
                                    disabled={readOnly}
                                    onChange={(newValue: any) => {
                                      if (newValue) {
                                        formik.setFieldValue(
                                          `chiTietBanGiaoTaiSan.${index}.tenTaiSan`,
                                          newValue.tenTaiSan,
                                        );
                                        formik.setFieldValue(
                                          `chiTietBanGiaoTaiSan.${index}.nuocSanXuat`,
                                          newValue.nuocSanXuat,
                                        );
                                        formik.setFieldValue(
                                          `chiTietBanGiaoTaiSan.${index}.kyHieu`,
                                          newValue.kyHieu,
                                        );
                                        formik.setFieldValue(
                                          `chiTietBanGiaoTaiSan.${index}.donViTinh`,
                                          newValue.donViTinh,
                                        );
                                        formik.setFieldValue(
                                          `chiTietBanGiaoTaiSan.${index}.hienTrang`,
                                          newValue.hienTrang,
                                        );
                                        formik.setFieldValue(
                                          `chiTietBanGiaoTaiSan.${index}.soLuong`,
                                          newValue.soLuong,
                                        );
                                        formik.setFieldValue(
                                          `chiTietBanGiaoTaiSan.${index}.ghiChu`,
                                          newValue.ghiChu,
                                        );
                                        formik.setFieldValue(
                                          `chiTietBanGiaoTaiSan.${index}.moTa`,
                                          newValue.moTa,
                                        );
                                      }
                                    }}
                                  />
                                )}
                              </UnderlinedInputWrapper>
                            </CustomTableCell>

                            {/* 2. Đơn vị tính */}
                            <CustomTableCell
                              sx={{ py: 0.5, px: 1, verticalAlign: "bottom" }}
                            >
                              <UnderlinedInputWrapper>
                                <FieldInput
                                  title=""
                                  name={`chiTietBanGiaoTaiSan.${index}.donViTinh`}
                                  disabled={true}
                                />
                              </UnderlinedInputWrapper>
                            </CustomTableCell>

                            {/* 3. Số lượng */}
                            <CustomTableCell
                              sx={{ py: 0.5, px: 1, verticalAlign: "bottom" }}
                            >
                              <UnderlinedInputWrapper>
                                <FieldInput
                                  title=""
                                  type="number"
                                  name={`chiTietBanGiaoTaiSan.${index}.soLuong`}
                                  disabled={true}
                                />
                              </UnderlinedInputWrapper>
                            </CustomTableCell>

                            {/* 4. Tình trạng kỹ thuật */}
                            <CustomTableCell
                              sx={{ py: 0.5, px: 1, verticalAlign: "bottom" }}
                            >
                              <UnderlinedInputWrapper>
                                <FieldAutoCompleted
                                  labelkey="tenHTKT"
                                  data={allCurrentStatus}
                                  title=""
                                  name={`chiTietBanGiaoTaiSan.${index}.hienTrang`}
                                  disabled={readOnly}
                                />
                              </UnderlinedInputWrapper>
                            </CustomTableCell>

                            {/* 5. Ghi chú */}
                            <CustomTableCell
                              sx={{ py: 0.5, px: 1, verticalAlign: "bottom" }}
                            >
                              <UnderlinedInputWrapper>
                                <FieldInput
                                  title=""
                                  name={`chiTietBanGiaoTaiSan.${index}.ghiChu`}
                                  disabled={readOnly}
                                />
                              </UnderlinedInputWrapper>
                            </CustomTableCell>

                            {/* Nút xóa - Chỉ hiện khi không phải chế độ xem */}
                            {!readOnly && (
                              <CustomTableCell
                                align="center"
                                sx={{ py: 0.5, verticalAlign: "bottom" }}
                              >
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => {
                                    const newAssets = [
                                      ...formik.values.chiTietBanGiaoTaiSan,
                                    ];
                                    newAssets.splice(index, 1);
                                    formik.setFieldValue(
                                      "chiTietBanGiaoTaiSan",
                                      newAssets,
                                    );
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </CustomTableCell>
                            )}
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>

                  {/* Nút thêm mới - chỉ hiện khi không ReadOnly */}
                  {!readOnly && (
                    <Box p={1} display="flex" justifyContent="flex-start">
                      <Button
                        startIcon={<Add />}
                        size="small"
                        onClick={() =>
                          formik.setFieldValue("chiTietBanGiaoTaiSan", [
                            ...formik.values.chiTietBanGiaoTaiSan,
                            {
                              idTaiSan: "",
                              donViTinh: "",
                              soLuong: 1,
                              hienTrang: "1",
                              ghiChu: "",
                            },
                          ])
                        }
                        sx={{ textTransform: "none", color: "#1976d2" }}
                      >
                        Thêm tài sản
                      </Button>
                    </Box>
                  )}
                </TableContainer>
              </Collapse>
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={3}
              pt={2}
              sx={{ borderTop: "1px solid #f1f5f9" }}
            >
              {/* Trái — Xem trước tài liệu */}
              <PreviewBtn
                handleClick={() => {
                  setBangKe(formik.values.taiLieuBangKe);
                  setIsPreview(true);
                  setPriviewDocument(false);
                }}
              />

              {/* Phải — Lưu / Hủy / Sửa */}
              <Box display="flex" gap={2}>
                {[0, 2].includes(currentStatus) && !readOnly && (
                  <>
                    <CancelBtn onClick={onClose} />
                    <SaveBtn onSave={formik.submitForm} />
                  </>
                )}
                {[0, 2].includes(currentStatus) && readOnly && (
                  <EditButton onClick={onEdit} />
                )}
                {![0, 2, 3].includes(currentStatus) && (
                  <Button
                    size="small"
                    sx={{ bgcolor: "red", color: "white" }}
                    startIcon={<Cancel />}
                    onClick={onCancel}
                  >
                    Hủy phiếu {label}
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </FormikProvider>
  );
}
