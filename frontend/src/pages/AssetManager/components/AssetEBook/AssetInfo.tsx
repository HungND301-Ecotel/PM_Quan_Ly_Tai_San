import {
  Add,
  Delete,
  InfoOutlineRounded,
  RemoveRedEye,
} from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Divider,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { ChangeEvent, useEffect, useState } from "react";
import SaveBtn from "../../../../components/Button/SaveBtn";
import CancelBtn from "../../../../components/Button/CancelBtn";
import FieldInput from "../../../../components/TextField/FieldInput";
import { useFormik } from "formik";
import EditButton from "../../../../components/Button/EditButton";
import { findById, formatDecimal } from "../../../../utils/helpers";
import {
  useAllAssetsByDepartmentQuery,
  useAssetByTypeQuery,
} from "../../Mutation";
import { useAllTypeAssetByGroupQuery } from "../../../TypeAsset/Mutation";
import { useAllProjectsQuery } from "../../../Project/Mutation";
import dayjs from "dayjs";
import { AssetValidation } from "../../validation";
import TextFieldNumber from "../../../../components/TextField/TextFieldNumber";
import { Action, CongTy } from "../../../../utils/const";
import FieldYearMonth from "../../../../components/TextField/FieldYearMonth";
import FieldDateTime from "../../../../components/TextField/FieldDateTime";
import FieldAutoCompleted from "../../../../components/TextField/FieldAutoCompleted";
import { AssetFileType } from "../../types";
import { showDownloadFile } from "../../config";
import S3Service from "../../../../services/S3Service";
import ViewTaiLieu from "../ViewTaiLieu";

// Style cho hiệu ứng sách
const bookStyles = {
  container: {
    width: "210mm",
    minHeight: "297mm",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    backgroundImage: "none",
    borderRadius: "2px",
    boxShadow:
      "0 8px 32px rgba(0, 158, 96, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
    position: "relative" as const,
    padding: "24px",
    "&::before": {
      content: '""',
      position: "absolute" as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: "6px",
      background:
        "linear-gradient(to right, rgba(0, 158, 96, 0.2), transparent)",
      pointerEvents: "none" as const,
    },
  },
  header: {
    borderBottom: "2px solid #009e60",
    paddingBottom: "12px",
    marginBottom: "24px",
    position: "relative" as const,
  },
  pageNumber: {
    position: "absolute" as const,
    bottom: "16px",
    right: "24px",
    fontSize: "12px",
    fontStyle: "italic" as const,
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 600,
    borderLeft: "4px solid #009e60",
    paddingLeft: "12px",
    marginBottom: "16px",
    marginTop: "8px",
  },
  fieldRow: {
    marginBottom: "16px",
  },
  label: {
    fontWeight: 500,
    marginBottom: "6px",
    fontSize: "13px",
  },
};

export default function AssetInfo({
  readOnly,
  onEdit,
  onCancel,
  selectedAsset,
  onSave,
  allAssetModel,
  allCurrentStatus,
  assetGroups,
  allDepartments,
  allUnits,
  allReasonIncreases,
  onPageChange,
  currentPage = 2,
  totalPages = 4,
  onClose,
  isView = false,
}: {
  readOnly?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  selectedAsset?: any;
  onSave: (values: any) => void;
  allAssetModel: any[];
  allCurrentStatus: any[];
  assetGroups: any[];
  allDepartments: any[];
  allUnits: any[];
  allReasonIncreases: any[];
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  onClose: () => void;
  isView?: boolean;
}) {
  const [previewFile, setPreviewFile] = useState("");
  const formik = useFormik({
    initialValues: {
      id: "",
      idLoaiTaiSan: "",
      tenTaiSan: "",
      nguyenGia: 0,
      giaTriKhauHaoBanDau: 0,
      kyKhauHaoBanDau: 0,
      giaTriThanhLy: 0,
      idMoHinhTaiSan: "",
      phuongPhapKhauHao: 0,
      soKyKhauHao: 0,
      taiKhoanTaiSan: 0,
      taiKhoanKhauHao: 0,
      taiKhoanChiPhi: 0,
      idNhomTaiSan: "",
      ngayVaoSo: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      ngaySuDung: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      tgKiemDinh: dayjs(new Date()).format("YYYY-MM"),
      chuKyKiemDinh: 0,
      idDuDan: "",
      idNguonVon: "",
      kyHieu: "",
      soKyHieu: "",
      congSuat: "",
      nuocSanXuat: "",
      namSanXuat: 0,
      lyDoTang: "",
      hienTrang: 0,
      soLuong: 1,
      donViTinh: "",
      ghiChu: "",
      idDonViBanDau: "Kty",
      idDonViHienThoi: "",
      moTa: "",
      idCongTy: CongTy.CT001,
      ngayTao: "",
      ngayCapNhat: "",
      nguoiTao: "",
      nguoiCapNhat: "",
      isActive: true,
      isTaiSanCon: false,
      idLoaiTaiSanCon: "",
      soThe: "",
      nvNS: 0,
      vonVay: 0,
      vonKhac: 0,
      isHeThong: false,
      fileDinhKemList: [
        {
          id: undefined as Number | undefined,
          idTaiSan: "",
          filePath: "",
          tenFile: "",
          loai: 0,
          ngayTao: "",
          ghiChu: "",
          action: Action.CREATE,
        },
      ] as AssetFileType[],
      taiSanConList: [
        {
          id: "",
          idTaiSanCha: "",
          idTaiSanCon: "",
          ngayTao: "",
          ngayCapNhat: "",
          nguoiTao: "",
          nguoiCapNhat: "",
          isActive: true,
          donViTinh: "",
          soLuong: 0,
          hienTrang: "",
          ghiChu: "",
          isDeleted: false,
          isInsert: true,
        },
      ],
    },
    validationSchema: AssetValidation,
    onSubmit(values) {
      onSave({
        ...values,
        idLoaiTaiSan: values.idNhomTaiSan,
        moTa: values?.moTa,
        taiSanConList: values.taiSanConList.map((item: any) => ({
          ...item,
          idTaiSanCha: values.id,
        })),
      });
    },
  });

  const EMPTY_ARRAY: any[] = [];

  const ownerUnitId =
    formik.values.idDonViHienThoi || formik.values.idDonViBanDau;
  const { data: assetsByDepartment = EMPTY_ARRAY } =
    useAllAssetsByDepartmentQuery(ownerUnitId);
  const { data: typeAssetsByAssetGroup = [] } = useAllTypeAssetByGroupQuery(
    formik.values.idNhomTaiSan,
  );
  const { data: allProjects = [] } = useAllProjectsQuery();

  useEffect(() => {
    if (selectedAsset) {
      const enrichedTaiSanConList =
        selectedAsset.taiSanConList?.map((item: any) => ({
          ...item,
          donViTinh: findById(assetsByDepartment, item.id)?.donViTinh,
          soLuong: findById(assetsByDepartment, item.id)?.soLuong,
          hienTrang:
            findById(assetsByDepartment, item.id)?.hienTrang || -1,
          ghiChu: findById(assetsByDepartment, item.id)?.ghiChu,
          isDeleted: false,
          isInsert: true,
        })) || [];

      formik.setValues({
        ...selectedAsset,
        idDuDan: selectedAsset.idDuAn,
        taiSanConList: enrichedTaiSanConList,
      });
    } else {
      formik.resetForm();
    }
  }, [selectedAsset?.id, assetsByDepartment.length]);

  const handleCancel = () => {
    if (selectedAsset) {
      const enrichedTaiSanConList =
        selectedAsset.taiSanConList?.map((item: any) => ({
          ...item,
          donViTinh: findById(assetsByDepartment, item.id)?.donViTinh,
          soLuong: findById(assetsByDepartment, item.id)?.soLuong,
          hienTrang:
            findById(assetsByDepartment, item.id)?.hienTrang || -1,
          ghiChu: findById(assetsByDepartment, item.id)?.ghiChu,
          isDeleted: false,
          isInsert: true,
        })) || [];

      formik.setValues({
        ...selectedAsset,
        idDuDan: selectedAsset.idDuAn,
        taiSanConList: enrichedTaiSanConList,
      });
    } else {
      formik.resetForm();
    }
    onCancel();
  };

  const handleFileUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    loai: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const keyTailieu = await S3Service.put({
        name: file.name,
        file: file,
        type: "tailieu",
      });
      const newFile: AssetFileType = {
        id: undefined,
        idTaiSan: formik.values.id,
        filePath: keyTailieu,
        tenFile: file.name,
        loai: loai,
        ngayTao: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        ghiChu: "",
        action: Action.CREATE,
      };
      formik.setFieldValue("fileDinhKemList", [
        ...formik.values.fileDinhKemList,
        newFile,
      ]);
    } catch (error) {
      console.error("Upload file error", error);
    }
    event.target.value = "";
  };

  const handleRemoveFile = (fileId?: number) => {
    if (!fileId) return;
    const currentList = formik.values.fileDinhKemList;
    const fileToRemove = currentList.find((f) => f.id === fileId);

    if (fileToRemove && fileToRemove.id) {
      const newList = currentList.map((f) =>
        f.id === fileId ? { ...f, action: Action.DELETE } : f,
      );
      formik.setFieldValue("fileDinhKemList", newList);
    } else {
      const newList = currentList.filter((f) => f.id !== fileId);
      formik.setFieldValue("fileDinhKemList", newList);
    }
  };

  return (
    <Box sx={{ ...bookStyles.container }}>
      {/* Nút hành động */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          mb: 2,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {!isView && (
          <Box sx={{ display: "flex", gap: 2 }}>
            {!readOnly && <SaveBtn onSave={formik.submitForm} />}
            {!readOnly && <CancelBtn onClick={handleCancel} />}
            {readOnly && <EditButton onClick={onEdit} />}
          </Box>
        )}
      </Box>
      {/* Header sách */}
      <Typography
        textAlign="center"
        fontSize={20}
        fontWeight={700}
        sx={{ letterSpacing: "2px", mb: 3 }}
      >
        LÝ LỊCH THIẾT BỊ
      </Typography>

      {/* Thông tin mô phỏng bìa giấy */}
      <Box
        sx={{
          mb: 4,
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: "18px",
          lineHeight: 1.8,
        }}
      >
        <Box sx={{ display: "flex", mb: 1 }}>
          <Box sx={{ whiteSpace: "nowrap", mr: 1 }}>Tên thiết bị, mã hiệu:</Box>
          <Box
            sx={{
              flexGrow: 1,
              borderBottom: "2px dotted #1a1a1a",
              display: "flex",
              alignItems: "flex-end",
              fontStyle: "italic",
              pb: "2px",
              paddingLeft: "8px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "inherit",
                fontStyle: "inherit",
                fontSize: "inherit",
                lineHeight: 1,
              }}
            >
              {formik.values.tenTaiSan}{" "}
              {formik.values.kyHieu ? `- ${formik.values.kyHieu}` : ""}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", mb: 1, gap: 1 }}>
          <Box sx={{ whiteSpace: "nowrap" }}>Số chế tạo:</Box>
          <Box
            sx={{
              flexGrow: 1,
              borderBottom: "2px dotted #1a1a1a",
              fontStyle: "italic",
              color: "#1818a8",
              display: "flex",
              alignItems: "flex-end",
              pb: "2px",
              paddingLeft: "8px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "inherit",
                fontStyle: "inherit",
                fontSize: "inherit",
                lineHeight: 1,
              }}
            ></Typography>
          </Box>
          <Box sx={{ whiteSpace: "nowrap", ml: 2 }}>Số kiểm kê:</Box>
          <Box
            sx={{
              flexGrow: 1,
              borderBottom: "2px dotted #1a1a1a",
              fontStyle: "italic",
              color: "#1818a8",
              display: "flex",
              alignItems: "flex-end",
              pb: "2px",
              paddingLeft: "8px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "inherit",
                fontStyle: "inherit",
                fontSize: "inherit",
                lineHeight: 1,
              }}
            ></Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", mb: 1 }}>
          <Box sx={{ whiteSpace: "nowrap", mr: 1 }}>Tên nhà máy chế tạo:</Box>
          <Box
            sx={{
              flexGrow: 1,
              borderBottom: "2px dotted #1a1a1a",
              fontStyle: "italic",
              color: "#1818a8",
              display: "flex",
              alignItems: "flex-end",
              pb: "2px",
              paddingLeft: "8px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "inherit",
                fontStyle: "inherit",
                fontSize: "inherit",
                lineHeight: 1,
              }}
            ></Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", mb: 1, gap: 1 }}>
          <Box sx={{ whiteSpace: "nowrap" }}>Nước chế tạo:</Box>
          <Box
            sx={{
              flexGrow: 1,
              borderBottom: "2px dotted #1a1a1a",
              fontStyle: "italic",
              color: "#1818a8",
              display: "flex",
              alignItems: "flex-end",
              pb: "2px",
              paddingLeft: "8px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "inherit",
                fontStyle: "inherit",
                fontSize: "inherit",
                lineHeight: 1,
              }}
            >
              {formik.values.nuocSanXuat}
            </Typography>
          </Box>
          <Box sx={{ whiteSpace: "nowrap", ml: 2 }}>Năm chế tạo:</Box>
          <Box
            sx={{
              flexGrow: 1,
              borderBottom: "2px dotted #1a1a1a",
              fontStyle: "italic",
              color: "#1818a8",
              display: "flex",
              alignItems: "flex-end",
              pb: "2px",
              paddingLeft: "8px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "inherit",
                fontStyle: "inherit",
                fontSize: "inherit",
                lineHeight: 1,
              }}
            >
              {formik.values.namSanXuat}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Typography
        variant="h6"
        sx={{
          fontSize: "18px",
          fontWeight: "bold",
          mb: 2,
          color: "#026e42",
          textTransform: "uppercase",
        }}
      >
        Thông tin chi tiết
      </Typography>

      {/* Nội dung chính - giữ nguyên các trường nhập */}
      <Grid container spacing={3}>
        {/* Cột trái */}
        <Grid size={{ xs: 6 }}>
          <Box sx={{ pr: 1 }}>
            {/* Số thẻ tài sản */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Số thẻ tài sản:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.soThe || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Số thẻ tài sản *"
                  formik={formik}
                  field="soThe"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Tên tài sản */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Tên tài sản:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.tenTaiSan || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Tên tài sản *"
                  formik={formik}
                  field="tenTaiSan"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Nguyên giá */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Nguyên giá:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formatDecimal(formik.values.nguyenGia)} đ
                  </Typography>
                </Box>
              ) : (
                <TextFieldNumber
                  title="Nguyên giá tài sản"
                  formik={formik}
                  field="nguyenGia"
                  disabled={true}
                />
              )}
            </Box>

            {/* Giá trị khấu hao ban đầu */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Giá trị khấu hao ban đầu:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formatDecimal(formik.values.giaTriKhauHaoBanDau)} đ
                  </Typography>
                </Box>
              ) : (
                <TextFieldNumber
                  title="Giá trị khấu hao ban đầu"
                  formik={formik}
                  field="giaTriKhauHaoBanDau"
                  disabled={true}
                />
              )}
            </Box>

            {/* Kỳ khấu hao ban đầu */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Kỳ khấu hao ban đầu:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.kyKhauHaoBanDau || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <TextFieldNumber
                  title="Kỳ khấu hao ban đầu"
                  formik={formik}
                  field="kyKhauHaoBanDau"
                  disabled={true}
                />
              )}
            </Box>

            {/* Giá trị thanh lý */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Giá trị thanh lý:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formatDecimal(formik.values.giaTriThanhLy)} đ
                  </Typography>
                </Box>
              ) : (
                <TextFieldNumber
                  title="Giá trị thanh lý"
                  formik={formik}
                  field="giaTriThanhLy"
                  disabled={true}
                />
              )}
            </Box>

            {/* Mô hình tài sản */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Mô hình tài sản:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {findById(allAssetModel, formik.values.idMoHinhTaiSan)
                      ?.tenMoHinh || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldAutoCompleted
                  title="Mô hình tài sản"
                  data={allAssetModel}
                  labelkey="tenMoHinh"
                  formik={formik}
                  field="idMoHinhTaiSan"
                  onChange={(newValue) => {
                    formik.setFieldValue(
                      "phuongPhapKhauHao",
                      newValue?.phuongPhapKhauHao,
                    );
                    formik.setFieldValue(
                      "soKyKhauHao",
                      newValue?.kyKhauHao ?? 0,
                    );
                    formik.setFieldValue(
                      "taiKhoanTaiSan",
                      newValue?.taiKhoanTaiSan,
                    );
                    formik.setFieldValue(
                      "taiKhoanChiPhi",
                      newValue?.taiKhoanChiPhi,
                    );
                    formik.setFieldValue(
                      "taiKhoanKhauHao",
                      newValue?.taiKhoanKhauHao,
                    );
                  }}
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Phương pháp khấu hao */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Phương pháp khấu hao:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.phuongPhapKhauHao === 1
                      ? "Đường thẳng"
                      : "Khác"}
                  </Typography>
                </Box>
              ) : (
                <TextField
                  size="small"
                  fullWidth
                  label="Phương pháp khấu hao"
                  value={
                    formik.values.phuongPhapKhauHao === 1
                      ? "Đường thẳng"
                      : "Khác"
                  }
                  disabled
                />
              )}
            </Box>

            {/* Số kỳ khấu hao */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Số kỳ khấu hao:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.soKyKhauHao}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Số kỳ khấu hao"
                  formik={formik}
                  field="soKyKhauHao"
                  disabled={true}
                />
              )}
            </Box>

            {/* Tài khoản tài sản */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Tài khoản tài sản:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.taiKhoanTaiSan || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Tài khoản tài sản"
                  formik={formik}
                  field="taiKhoanTaiSan"
                  disabled={true}
                />
              )}
            </Box>

            {/* Tài khoản khấu hao */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Tài khoản khấu hao:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.taiKhoanKhauHao || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Tài khoản khấu hao"
                  formik={formik}
                  field="taiKhoanKhauHao"
                  disabled={true}
                />
              )}
            </Box>

            {/* Tài khoản chi phí */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Tài khoản chi phí:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.taiKhoanChiPhi || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Tài khoản chi phí"
                  formik={formik}
                  field="taiKhoanChiPhi"
                  disabled={true}
                />
              )}
            </Box>

            {/* Nhóm tài sản */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Nhóm tài sản:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {findById(assetGroups, formik.values.idNhomTaiSan)
                      ?.tenNhom || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldAutoCompleted
                  title="Nhóm tài sản *"
                  data={assetGroups}
                  labelkey="tenNhom"
                  formik={formik}
                  field="idNhomTaiSan"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Loại tài sản */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Loại tài sản:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {findById(
                      typeAssetsByAssetGroup,
                      formik.values.idLoaiTaiSanCon,
                    )?.tenLoai || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldAutoCompleted
                  title="Loại tài sản"
                  data={typeAssetsByAssetGroup}
                  labelkey="tenLoai"
                  formik={formik}
                  field="idLoaiTaiSanCon"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Ngày vào sổ */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Ngày vào sổ:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {dayjs(formik.values.ngayVaoSo).format(
                      "DD/MM/YYYY HH:mm:ss",
                    )}
                  </Typography>
                </Box>
              ) : (
                <FieldDateTime
                  title="Ngày vào sổ"
                  formik={formik}
                  field="ngayVaoSo"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Ngày sử dụng */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Ngày sử dụng:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {dayjs(formik.values.ngaySuDung).format(
                      "DD/MM/YYYY HH:mm:ss",
                    )}
                  </Typography>
                </Box>
              ) : (
                <FieldDateTime
                  title="Ngày sử dụng"
                  formik={formik}
                  field="ngaySuDung"
                  disabled={readOnly}
                />
              )}
            </Box>
          </Box>
        </Grid>

        {/* Cột phải */}
        <Grid size={{ xs: 6 }}>
          <Box sx={{ pl: 1 }}>
            {/* Dự án */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Dự án:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {findById(allProjects, formik.values.idDuDan)?.tenDuAn ||
                      "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldAutoCompleted
                  title="Dự án"
                  data={allProjects}
                  labelkey="tenDuAn"
                  formik={formik}
                  field="idDuDan"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Vốn NS */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Vốn NS:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formatDecimal(formik.values.nvNS)} đ
                  </Typography>
                </Box>
              ) : (
                <TextFieldNumber
                  title="Vốn NS"
                  formik={formik}
                  field="nvNS"
                  disabled={readOnly}
                  onChange={(newValue) => {
                    formik.setFieldValue(
                      "nguyenGia",
                      Number(formik.values.vonVay ?? 0) +
                        Number(formik.values.vonKhac ?? 0) +
                        Number(newValue ?? 0),
                    );
                  }}
                />
              )}
            </Box>

            {/* Vốn vay */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Vốn vay:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formatDecimal(formik.values.vonVay)} đ
                  </Typography>
                </Box>
              ) : (
                <TextFieldNumber
                  title="Vốn vay"
                  formik={formik}
                  field="vonVay"
                  disabled={readOnly}
                  onChange={(newValue) => {
                    formik.setFieldValue(
                      "nguyenGia",
                      Number(formik.values.nvNS ?? 0) +
                        Number(formik.values.vonKhac ?? 0) +
                        Number(newValue ?? 0),
                    );
                  }}
                />
              )}
            </Box>

            {/* Vốn khác */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Vốn khác:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formatDecimal(formik.values.vonKhac)} đ
                  </Typography>
                </Box>
              ) : (
                <TextFieldNumber
                  title="Vốn khác"
                  formik={formik}
                  field="vonKhac"
                  disabled={readOnly}
                  onChange={(newValue) => {
                    formik.setFieldValue(
                      "nguyenGia",
                      Number(formik.values.nvNS ?? 0) +
                        Number(formik.values.vonVay ?? 0) +
                        Number(newValue ?? 0),
                    );
                  }}
                />
              )}
            </Box>

            {/* Mã hiệu */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Mã hiệu:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.kyHieu || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Mã hiệu"
                  formik={formik}
                  field="kyHieu"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Số mã hiệu */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Số mã hiệu:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.soKyHieu || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Số mã hiệu"
                  formik={formik}
                  field="soKyHieu"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Công suất */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Công suất:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.congSuat || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Công suất"
                  formik={formik}
                  field="congSuat"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Nước sản xuất */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Nước sản xuất:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.nuocSanXuat || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Nước sản xuất"
                  formik={formik}
                  field="nuocSanXuat"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Năm sản xuất */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Năm sản xuất:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.namSanXuat}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Năm sản xuất"
                  type="number"
                  formik={formik}
                  field="namSanXuat"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Lý do tăng */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Lý do tăng:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {findById(allReasonIncreases, formik.values.lyDoTang)
                      ?.ten || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldAutoCompleted
                  title="Lý do tăng"
                  data={allReasonIncreases}
                  labelkey="ten"
                  formik={formik}
                  field="lyDoTang"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Hiện trạng */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Hiện trạng:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {findById(allCurrentStatus, formik.values.hienTrang)
                      ?.tenHTKT || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldAutoCompleted
                  title="Hiện trạng"
                  data={allCurrentStatus}
                  labelkey="tenHTKT"
                  formik={formik}
                  field="hienTrang"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Số lượng */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Số lượng:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.soLuong || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <TextFieldNumber
                  title="Số lượng"
                  formik={formik}
                  field="soLuong"
                  disabled={true}
                />
              )}
            </Box>

            {/* Đơn vị tính */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Đơn vị tính:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {findById(allUnits, formik.values.donViTinh)?.tenDonVi ||
                      "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldAutoCompleted
                  title="Đơn vị tính"
                  data={allUnits}
                  labelkey="tenDonVi"
                  formik={formik}
                  field="donViTinh"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Ghi chú */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Ghi chú:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {formik.values.ghiChu || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldInput
                  title="Ghi chú"
                  formik={formik}
                  field="ghiChu"
                  disabled={readOnly}
                />
              )}
            </Box>

            {/* Kho */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Kho:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {findById(allDepartments, formik.values.idDonViBanDau)
                      ?.tenPhongBan || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldAutoCompleted
                  title="Kho"
                  data={allDepartments.filter(
                    (i) => i.id?.toLocaleLowerCase() === "Kty",
                  )}
                  labelkey="tenPhongBan"
                  formik={formik}
                  field="idDonViBanDau"
                  disabled={true}
                />
              )}
            </Box>

            {/* Đơn vị hiện thời */}
            <Box sx={bookStyles.fieldRow}>
              {readOnly ? (
                <Box display="flex" alignItems="flex-start">
                  <Typography sx={bookStyles.label} width="140px">
                    Đơn vị hiện thời:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {findById(allDepartments, formik.values.idDonViHienThoi)
                      ?.tenPhongBan || "N/A"}
                  </Typography>
                </Box>
              ) : (
                <FieldAutoCompleted
                  title="Đơn vị hiện thời"
                  data={allDepartments}
                  labelkey="tenPhongBan"
                  formik={formik}
                  field="idDonViHienThoi"
                  disabled={readOnly}
                />
              )}
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.isHeThong || false}
                  onChange={(e) => {
                    formik.setFieldValue(`isHeThong`, e.target.checked);
                    if (!e.target.checked) {
                      formik.setFieldValue(`taiSanConList`, []);
                    }
                  }}
                  disabled={readOnly}
                  color="success"
                />
              }
              label="Hệ thống"
            />
          </Box>
        </Grid>
      </Grid>

      {/* Chi tiết tài sản con */}
      {formik.values.isHeThong && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ my: 2, borderColor: "#009e60" }} />
          <Typography sx={bookStyles.sectionTitle}>
            DANH SÁCH TÀI SẢN TRỰC THUỘC
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#e8f5e9" }}>
                <TableCell sx={{ fontWeight: 600, color: "#026e42" }}>
                  Tên tài sản
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#026e42" }}>
                  Đơn vị tính
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#026e42" }}>
                  Số lượng
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b4c3b" }}>
                  Tình trạng kỹ thuật
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b4c3b" }}>
                  Ghi chú
                </TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={bookStyles.container}>
              {formik.values.taiSanConList
                .map((row, originalIndex) => ({ ...row, originalIndex }))
                .filter((row) => !row.isDeleted)
                .map((row) => (
                  <TableRow key={row.id || row.originalIndex} sx={bookStyles}>
                    <TableCell sx={bookStyles}>
                      {readOnly ? (
                        <Typography variant="body2">
                          {findById(assetsByDepartment, row.id)?.tenTaiSan ||
                            "N/A"}
                        </Typography>
                      ) : (
                        <FieldAutoCompleted
                          title=""
                          data={assetsByDepartment}
                          labelkey="tenTaiSan"
                          labelOption="id"
                          formik={formik}
                          field={`taiSanConList.${row.originalIndex}.id`}
                          disabled={readOnly}
                          onChange={(val) => {
                            if (val) {
                              formik.setFieldValue(
                                `taiSanConList.${row.originalIndex}.isActive`,
                                val.isActive,
                              );
                              formik.setFieldValue(
                                `taiSanConList.${row.originalIndex}.soLuong`,
                                val.soLuong,
                              );
                              formik.setFieldValue(
                                `taiSanConList.${row.originalIndex}.donViTinh`,
                                val.donViTinh,
                              );
                              formik.setFieldValue(
                                `taiSanConList.${row.originalIndex}.hienTrang`,
                                val.hienTrang,
                              );
                              formik.setFieldValue(
                                `taiSanConList.${row.originalIndex}.tenTaiSan`,
                                val.tenTaiSan,
                              );
                            }
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <Typography variant="body2">
                          {row.donViTinh || ""}
                        </Typography>
                      ) : (
                        <TextField
                          fullWidth
                          size="small"
                          value={
                            findById(allUnits, row.donViTinh)?.tenDonVi || ""
                          }
                          disabled
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <Typography variant="body2">
                          {row?.soLuong || 1}
                        </Typography>
                      ) : (
                        <FieldInput
                          type="number"
                          formik={formik}
                          field={`taiSanConList.${row.originalIndex}.soLuong`}
                          disabled
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <Typography variant="body2">
                          {findById(allCurrentStatus, row.hienTrang)?.tenHTKT ||
                            ""}
                        </Typography>
                      ) : (
                        <TextField
                          fullWidth
                          size="small"
                          value={
                            findById(allCurrentStatus, row.hienTrang)
                              ?.tenHTKT || ""
                          }
                          disabled
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <Typography variant="body2">
                          {row?.ghiChu || ""}
                        </Typography>
                      ) : (
                        <FieldInput
                          formik={formik}
                          field={`taiSanConList.${row.originalIndex}.ghiChu`}
                          disabled
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {!readOnly && (
                        <IconButton
                          color="error"
                          onClick={() => {
                            formik.setFieldValue(
                              `taiSanConList.${row.originalIndex}.isDeleted`,
                              true,
                            );
                            formik.setFieldValue(
                              `taiSanConList.${row.originalIndex}.isInsert`,
                              false,
                            );
                          }}
                          disabled={readOnly}
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {!readOnly && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => {
                        formik.setFieldValue("taiSanConList", [
                          ...formik.values.taiSanConList,
                          {
                            id: "",
                            idTaiSanCha: "",
                            idTaiSanCon: "",
                            isActive: true,
                            isDeleted: false,
                            isInsert: true,
                          },
                        ]);
                      }}
                      variant="text"
                      sx={{ color: "#009e60" }}
                    >
                      Thêm một dòng
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Tài liệu đính kèm */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 6 }}>
          <Divider sx={{ my: 1, borderColor: "#009e60" }} />
          <Typography sx={bookStyles.sectionTitle}>
            BIÊN BẢN NGHIỆM THU
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {!readOnly && (
              <Button
                variant="outlined"
                size="small"
                component="label"
                startIcon={<Add />}
                sx={{
                  alignSelf: "flex-start",
                  mb: 1,
                  borderColor: "#009e60",
                  color: "#009e60",
                }}
              >
                Tệp đính kèm
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, 0)}
                />
              </Button>
            )}
            {formik.values.fileDinhKemList
              .filter((e) => e.loai === 0 && e.action !== Action.DELETE)
              .map((i, index) => (
                <Box
                  key={i.id || index}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    py: 1,
                    borderBottom: "1px dashed #e8f5e9",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#009e60", minWidth: "25px", mt: "2px" }}
                  >
                    {index + 1}.
                  </Typography>
                  {showDownloadFile(i.tenFile, () =>
                    S3Service.download(i.filePath),
                  )}
                  <IconButton
                    size="small"
                    onClick={() => setPreviewFile(i.filePath)}
                    sx={{ color: "#026e42" }}
                  >
                    <RemoveRedEye fontSize="small" />
                  </IconButton>
                  {!readOnly && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFile(i.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            {formik.values.fileDinhKemList.filter(
              (e) => e.loai === 0 && e.action !== Action.DELETE,
            ).length === 0 && (
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                Không có tệp đính kèm.
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <Divider sx={{ my: 1, borderColor: "#009e60" }} />
          <Typography sx={bookStyles.sectionTitle}>
            TÀI LIỆU KỸ THUẬT
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {!readOnly && (
              <Button
                variant="outlined"
                size="small"
                component="label"
                startIcon={<Add />}
                sx={{
                  alignSelf: "flex-start",
                  mb: 1,
                  borderColor: "#009e60",
                  color: "#009e60",
                }}
              >
                Tệp đính kèm
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, 1)}
                />
              </Button>
            )}
            {formik.values.fileDinhKemList
              .filter((e) => e.loai === 1 && e.action !== Action.DELETE)
              .map((i, index) => (
                <Box
                  key={i.id || index}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    py: 1,
                    borderBottom: "1px dashed #e8f5e9",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ minWidth: "25px", mt: "2px" }}
                  >
                    {index + 1}.
                  </Typography>
                  {showDownloadFile(i.tenFile, () =>
                    S3Service.download(i.filePath),
                  )}
                  <IconButton
                    size="small"
                    onClick={() => setPreviewFile(i.filePath)}
                    sx={{ color: "#026e42" }}
                  >
                    <RemoveRedEye fontSize="small" />
                  </IconButton>
                  {!readOnly && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFile(i.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            {formik.values.fileDinhKemList.filter(
              (e) => e.loai === 1 && e.action !== Action.DELETE,
            ).length === 0 && (
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                Không có tệp đính kèm.
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      <ViewTaiLieu
        open={!!previewFile}
        onClose={() => setPreviewFile("")}
        filePath={previewFile}
      />
    </Box>
  );
}
