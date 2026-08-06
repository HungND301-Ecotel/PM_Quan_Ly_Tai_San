import {
  Add,
  Delete,
  ContentCopy,
  ExpandMore,
  ExpandLess,
  Close,
  Remove,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Divider,
  Collapse,
  Tooltip,
  alpha,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import {
  useFormik,
  FieldArray,
  FormikProvider,
  useFormikContext,
  useField,
} from "formik";
import EditButton from "../../../components/Button/EditButton";
import { useAllTypeAssetByGroupQuery } from "../../TypeAsset/Mutation";
import {
  useAssetByTypeQuery,
  useAllAssetsQuery,
  useAllAssetsByDepartmentQuery,
} from "../Mutation";
import { useAllProjectsQuery } from "../../Project/Mutation";
import dayjs from "dayjs";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import { CongTy } from "../../../utils/const";
import FieldDateTime from "../../../components/TextField/FieldDateTime";
import FieldYearMonth from "../../../components/TextField/FieldYearMonth";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import React from "react";
import { useDebounce } from "../../../hooks/useDebounce";
import { TRANG_THAI_SUA_CHUA_OPTIONS } from "../../../utils/maintenanceStatus";

const defaultAsset = {
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
  idDonViQuanlyKiThuat: "",
  moTa: "",
  idCongTy: CongTy.CT001,
  ngayTao: "",
  ngayCapNhat: "",
  nguoiTao: "",
  nguoiCapNhat: "",
  isActive: true,
  isTaiSanCon: false,
  isHeThong: false,
  idLoaiTaiSanCon: "",
  soThe: "",
  nvNS: 0,
  vonVay: 0,
  vonKhac: 0,
  trangThaiSuaChua: 4,
  taiSanConList: [],
  chuKySuaChuaList: [],
};

interface AssetRowProps {
  index: number;
  readOnly?: boolean;
  onRemove: (index: number) => void;
  onCopy: (index: number) => void;
  allAssetModel: any[];
  allCurrentStatus: any[];
  assetGroups: any[];
  allDepartments: any[];
  allUnits: any[];
  allReasonIncreases: any[];
  allProjects: any[];
  allRepairTypes: any[];
}

const AssetRow = React.memo(function AssetRow({
  index,
  readOnly,
  onRemove,
  onCopy,
  allAssetModel,
  allCurrentStatus,
  assetGroups,
  allDepartments,
  allUnits,
  allReasonIncreases,
  allProjects,
  allRepairTypes,
}: AssetRowProps) {
  const { setFieldValue } = useFormikContext<any>(); // chỉ dùng để set, không đọc value -> không gây re-render
  const [{ value: asset }] = useField(`assets.${index}`); // chỉ re-render khi đúng row này đổi

  const [isExpanded, setIsExpanded] = useState(index === 0);
  const currentAssetId = asset.id;

  const ownerUnitId = asset.idDonViHienThoi || asset.idDonViBanDau;
  const { data: assetsByDepartment = [] } = useAllAssetsByDepartmentQuery(
    isExpanded ? ownerUnitId : undefined,
  );
  const { data: allAssetsForParent = [] } = useAllAssetsQuery(
    isExpanded ? ownerUnitId : undefined,
    true,
  );
  const { data: typeAssetsByAssetGroup = [] } = useAllTypeAssetByGroupQuery(
    isExpanded ? asset.idNhomTaiSan : undefined,
  );

  const trangThaiOptions = useMemo(() => {
    const current = asset.trangThaiSuaChua ?? 4;
    if (current === 4) return TRANG_THAI_SUA_CHUA_OPTIONS;
    return TRANG_THAI_SUA_CHUA_OPTIONS.filter((opt) => opt.id >= current);
  }, [asset.trangThaiSuaChua]);

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 2,
        borderRadius: "12px",
        border: "1px solid",
        borderColor: isExpanded ? "#009e60" : "#e5e7eb",
        overflow: "hidden",
        bgcolor: isExpanded ? "white" : alpha("#f3f4f6", 0.3),
        transition: "all 0.2s",
      }}
    >
      {/* Row Header (Inputs on the row) */}
      <Box
        sx={{
          p: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          cursor: "pointer",
          "&:hover": { bgcolor: alpha("#009e60", 0.02) },
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 40 }}>
          <Typography variant="caption" fontWeight={700} color="#6b7280">
            #{index + 1}
          </Typography>
          <IconButton size="small" color="primary">
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, display: "flex", gap: 1.5 }}>
          <Box sx={{ width: 140 }}>
            <FieldInput
              title="Mã tài sản *"
              name={`assets.${index}.id`}
              disabled={!asset.isNew || readOnly}
              onClick={(e: any) => e.stopPropagation()}
            />
          </Box>
          <Box sx={{ width: 120 }}>
            <FieldInput
              title="Số thẻ *"
              name={`assets.${index}.soThe`}
              disabled={readOnly}
              onClick={(e: any) => e.stopPropagation()}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <FieldInput
              title="Tên tài sản *"
              name={`assets.${index}.tenTaiSan`}
              disabled={readOnly}
              onClick={(e: any) => e.stopPropagation()}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5 }}>
          {!readOnly && (
            <>
              <Tooltip title="Nhân bản">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(index);
                  }}
                  sx={{ color: "#6366f1" }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Xóa">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  sx={{ color: "#ef4444" }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      <Collapse in={isExpanded} unmountOnExit mountOnEnter>
        <Divider />
        <Box sx={{ p: 4, bgcolor: "white" }}>
          <Grid container spacing={4}>
            <Grid container spacing={2} size={{ xs: 12, md: 6 }}>
              <Grid size={{ xs: 12 }}>
                <TextFieldNumber
                  title="Nguyên giá"
                  name={`assets.${index}.nguyenGia`}
                  disabled={true}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextFieldNumber
                  title="Giá trị khấu hao ban đầu"
                  name={`assets.${index}.giaTriKhauHaoBanDau`}
                  disabled={true}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextFieldNumber
                  title="Kỳ khấu hao ban đầu"
                  name={`assets.${index}.kyKhauHaoBanDau`}
                  disabled={true}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextFieldNumber
                  title="Giá trị thanh lý"
                  name={`assets.${index}.giaTriThanhLy`}
                  disabled={true}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Mô hình tài sản"
                  data={allAssetModel}
                  labelkey="tenMoHinh"
                  name={`assets.${index}.idMoHinhTaiSan`}
                  onChange={(newValue) => {
                    setFieldValue(
                      `assets.${index}.phuongPhapKhauHao`,
                      newValue?.phuongPhapKhauHao,
                    );
                    setFieldValue(
                      `assets.${index}.soKyKhauHao`,
                      newValue?.kyKhauHao ?? 0,
                    );
                    setFieldValue(
                      `assets.${index}.taiKhoanTaiSan`,
                      newValue?.taiKhoanTaiSan,
                    );
                    setFieldValue(
                      `assets.${index}.taiKhoanChiPhi`,
                      newValue?.taiKhoanChiPhi,
                    );
                    setFieldValue(
                      `assets.${index}.taiKhoanKhauHao`,
                      newValue?.taiKhoanKhauHao,
                    );
                  }}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Phương pháp khấu hao"
                  value={asset.phuongPhapKhauHao === 1 ? "Đường thẳng" : "Khác"}
                  disabled={true}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Số kỳ khấu hao"
                  name={`assets.${index}.soKyKhauHao`}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Tài khoản tài sản"
                  name={`assets.${index}.taiKhoanTaiSan`}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Tài khoản khấu hao"
                  name={`assets.${index}.taiKhoanKhauHao`}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Tài khoản chi phí"
                  name={`assets.${index}.taiKhoanChiPhi`}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Nhóm tài sản *"
                  data={assetGroups}
                  labelkey="tenNhom"
                  name={`assets.${index}.idNhomTaiSan`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Loại tài sản"
                  data={typeAssetsByAssetGroup}
                  labelkey="tenLoai"
                  name={`assets.${index}.idLoaiTaiSanCon`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldDateTime
                  title="Ngày vào sổ"
                  name={`assets.${index}.ngayVaoSo`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldDateTime
                  title="Ngày sử dụng"
                  name={`assets.${index}.ngaySuDung`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Trạng thái bảo dưỡng"
                  data={trangThaiOptions}
                  labelkey="ten"
                  name={`assets.${index}.trangThaiSuaChua`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={asset.isHeThong || false}
                      onChange={(e) => {
                        setFieldValue(
                          `assets.${index}.isHeThong`,
                          e.target.checked,
                        );
                        if (!e.target.checked) {
                          setFieldValue(`assets.${index}.taiSanConList`, []);
                        }
                      }}
                      disabled={readOnly}
                      color="success"
                    />
                  }
                  label="Hệ thống"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} size={{ xs: 12, md: 6 }}>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Dự án"
                  data={allProjects}
                  labelkey="tenDuAn"
                  name={`assets.${index}.idDuDan`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextFieldNumber
                  title="Vốn NS"
                  name={`assets.${index}.nvNS`}
                  disabled={readOnly}
                  onChange={(newValue) => {
                    const total =
                      Number(asset.vonVay || 0) +
                      Number(asset.vonKhac || 0) +
                      Number(newValue || 0);
                    setFieldValue(`assets.${index}.nguyenGia`, total);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextFieldNumber
                  title="Vốn vay"
                  name={`assets.${index}.vonVay`}
                  disabled={readOnly}
                  onChange={(newValue) => {
                    const total =
                      Number(newValue || 0) +
                      Number(asset.vonKhac || 0) +
                      Number(asset.nvNS || 0);
                    setFieldValue(`assets.${index}.nguyenGia`, total);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextFieldNumber
                  title="Vốn khác"
                  name={`assets.${index}.vonKhac`}
                  disabled={readOnly}
                  onChange={(newValue) => {
                    const total =
                      Number(asset.vonVay || 0) +
                      Number(newValue || 0) +
                      Number(asset.nvNS || 0);
                    setFieldValue(`assets.${index}.nguyenGia`, total);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Mã hiệu"
                  name={`assets.${index}.kyHieu`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Số mã hiệu"
                  name={`assets.${index}.soKyHieu`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Công suất"
                  name={`assets.${index}.congSuat`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Nước sản xuất"
                  name={`assets.${index}.nuocSanXuat`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Năm sản xuất"
                  type="number"
                  name={`assets.${index}.namSanXuat`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Lý do tăng"
                  data={allReasonIncreases}
                  labelkey="ten"
                  name={`assets.${index}.lyDoTang`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Hiện trạng"
                  data={allCurrentStatus}
                  labelkey="tenHTKT"
                  name={`assets.${index}.hienTrang`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Số lượng"
                  type="number"
                  name={`assets.${index}.soLuong`}
                  disabled={true}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Đơn vị tính"
                  data={allUnits}
                  labelkey="tenDonVi"
                  name={`assets.${index}.donViTinh`}
                  onChange={() => {
                    setFieldValue(`assets.${index}.taiSanConList`, []);
                  }}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldInput
                  title="Ghi chú"
                  name={`assets.${index}.ghiChu`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Kho"
                  data={allDepartments.filter(
                    (i) => i.loaiKho === 1 && i.isKho,
                  )}
                  labelkey="tenPhongBan"
                  name={`assets.${index}.idDonViBanDau`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Đơn vị hiện thời"
                  data={allDepartments}
                  labelkey="tenPhongBan"
                  name={`assets.${index}.idDonViHienThoi`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Đơn vị quản lý kĩ thuật"
                  data={allDepartments}
                  labelkey="tenPhongBan"
                  name={`assets.${index}.idDonViQuanlyKiThuat`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldYearMonth
                  title="Thời gian kiểm định"
                  name={`assets.${index}.tgKiemDinh`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FieldInput
                  title="Chu kỳ kiểm định"
                  type="number"
                  name={`assets.${index}.chuKyKiemDinh`}
                  disabled={readOnly}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FieldAutoCompleted
                  title="Tài sản cha"
                  data={allAssetsForParent.filter(
                    (a: any) => a.id !== currentAssetId,
                  )}
                  labelkey="tenTaiSan"
                  labelOption="id"
                  name={`assets.${index}.idTaiSanCha`}
                  disabled={readOnly}
                />
              </Grid>
            </Grid>
          </Grid>

          {asset.isHeThong && (
            <Box mt={4}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ mb: 2, color: "#009e60" }}
              >
                Chi tiết tài sản con
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha("#009e60", 0.05) }}>
                    <TableCell sx={{ width: "30%", fontWeight: 700 }}>
                      Tài sản
                    </TableCell>
                    <TableCell sx={{ width: "15%", fontWeight: 700 }}>
                      Số lượng
                    </TableCell>
                    <TableCell sx={{ width: "20%", fontWeight: 700 }}>
                      Tình trạng
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ghi chú</TableCell>
                    <TableCell width={50}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <FieldArray name={`assets.${index}.taiSanConList`}>
                    {({ push, remove }) => (
                      <React.Fragment>
                        {(asset.taiSanConList || [])
                          .filter((r: any) => !r.isDeleted)
                          .map((row: any, subIndex: number) => (
                            <TableRow key={subIndex}>
                              <TableCell>
                                <FieldAutoCompleted
                                  title=""
                                  data={[...assetsByDepartment, row]}
                                  labelkey="tenTaiSan"
                                  labelOption="id"
                                  name={`assets.${index}.taiSanConList.${subIndex}.id`}
                                  disabled={readOnly}
                                  onChange={(val) => {
                                    if (val) {
                                      setFieldValue(
                                        `assets.${index}.taiSanConList.${subIndex}.soLuong`,
                                        val.soLuong,
                                      );
                                      setFieldValue(
                                        `assets.${index}.taiSanConList.${subIndex}.donViTinh`,
                                        val.donViTinh,
                                      );
                                      setFieldValue(
                                        `assets.${index}.taiSanConList.${subIndex}.hienTrang`,
                                        val.hienTrang,
                                      );
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <FieldInput
                                  type="number"
                                  name={`assets.${index}.taiSanConList.${subIndex}.soLuong`}
                                  disabled={true}
                                />
                              </TableCell>
                              <TableCell>
                                <FieldAutoCompleted
                                  title=""
                                  data={allCurrentStatus}
                                  labelkey="tenHTKT"
                                  name={`assets.${index}.taiSanConList.${subIndex}.hienTrang`}
                                  disabled={true}
                                />
                              </TableCell>
                              <TableCell>
                                <FieldInput
                                  name={`assets.${index}.taiSanConList.${subIndex}.ghiChu`}
                                  disabled={true}
                                />
                              </TableCell>
                              <TableCell>
                                {!readOnly && (
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() =>
                                      setFieldValue(
                                        `assets.${index}.taiSanConList.${subIndex}.isDeleted`,
                                        true,
                                      )
                                    }
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        {!readOnly && (
                          <TableRow>
                            <TableCell colSpan={5}>
                              <Button
                                size="small"
                                startIcon={<Add />}
                                onClick={() =>
                                  push({
                                    id: "",
                                    idTaiSanCha: "",
                                    idTaiSanCon: "",
                                    isActive: true,
                                    isInsert: true,
                                  })
                                }
                              >
                                Thêm tài sản con
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )}
                  </FieldArray>
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Section Chu kỳ sửa chữa */}
          <Box
            sx={{
              mt: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ color: "#009e60" }}
            >
              Chu kỳ sửa chữa
            </Typography>
            {!readOnly && (
              <Button
                startIcon={<Add />}
                size="small"
                variant="outlined"
                color="success"
                onClick={() => {
                  const currentList = (asset.chuKySuaChuaList as any[]) || [];
                  setFieldValue(`assets.${index}.chuKySuaChuaList`, [
                    ...currentList,
                    {
                      id: "",
                      idTaiSan: "",
                      idLoaiSuaChua: "",
                      chuKy: "",
                      donViChuKy: "Giờ",
                      isInserted: true,
                    },
                  ]);
                }}
              >
                Thêm một dòng
              </Button>
            )}
          </Box>
          <Table size="small" sx={{ mt: 1 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha("#009e60", 0.05) }}>
                <TableCell sx={{ width: 40, fontWeight: 700 }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Loại sửa chữa</TableCell>
                <TableCell sx={{ width: 160, fontWeight: 700 }}>
                  Chu kỳ
                </TableCell>
                <TableCell sx={{ width: 140, fontWeight: 700 }}>
                  Đơn vị
                </TableCell>
                {!readOnly && <TableCell sx={{ width: 50 }} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {((asset.chuKySuaChuaList as any[]) || [])
                .map((row: any, subIdx: number) => ({ ...row, subIdx }))
                .filter((row: any) => !row.isDeleted)
                .map((row: any, displayIndex: number) => (
                  <TableRow key={row.subIdx}>
                    <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                      {displayIndex + 1}
                    </TableCell>

                    <TableCell>
                      <Select
                        fullWidth
                        size="small"
                        displayEmpty
                        disabled={readOnly}
                        value={row.idLoaiSuaChua || ""}
                        onChange={(e) => {
                          setFieldValue(
                            `assets.${index}.chuKySuaChuaList.${row.subIdx}.idLoaiSuaChua`,
                            e.target.value,
                          );
                        }}
                        sx={{ fontSize: 13 }}
                      >
                        <MenuItem value="" disabled>
                          <em>Chọn loại sửa chữa</em>
                        </MenuItem>
                        {allRepairTypes.map((rt: any) => (
                          <MenuItem key={rt.id} value={rt.id}>
                            {rt.ten}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    <TableCell>
                      <TextFieldNumber
                        title=""
                        name={`assets.${index}.chuKySuaChuaList.${row.subIdx}.chuKy`}
                        disabled={readOnly}
                      />
                    </TableCell>

                    <TableCell>
                      <Select
                        fullWidth
                        size="small"
                        disabled={readOnly}
                        value={row.donViChuKy || "Giờ"}
                        onChange={(e) => {
                          setFieldValue(
                            `assets.${index}.chuKySuaChuaList.${row.subIdx}.donViChuKy`,
                            e.target.value,
                          );
                        }}
                        sx={{ fontSize: 13 }}
                      >
                        <MenuItem value="Giờ">Giờ</MenuItem>
                      </Select>
                    </TableCell>

                    {!readOnly && (
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => {
                            const currentList =
                              (asset.chuKySuaChuaList as any[]) || [];
                            const currentRow = currentList[row.subIdx];
                            if (currentRow.isInserted) {
                              const newList = [...currentList];
                              newList.splice(row.subIdx, 1);
                              setFieldValue(
                                `assets.${index}.chuKySuaChuaList`,
                                newList,
                              );
                            } else {
                              setFieldValue(
                                `assets.${index}.chuKySuaChuaList.${row.subIdx}.isDeleted`,
                                true,
                              );
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              {((asset.chuKySuaChuaList as any[]) || []).filter(
                (r: any) => !r.isDeleted,
              ).length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={readOnly ? 4 : 5}
                    align="center"
                    sx={{ color: "text.disabled", fontSize: 13, py: 2 }}
                  >
                    Chưa có chu kỳ sửa chữa nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Collapse>
    </Paper>
  );
});

export default function AssetManagerForm({
  onEdit,
  onCancel,
  selectedAssets = [],
  readOnly,
  onSave,
  allAssetModel,
  allCurrentStatus,
  assetGroups,
  allDepartments,
  allUnits,
  allReasonIncreases,
  allRepairTypes,
  initialFormData,
  onFormChange,
  onMinimize,
}: {
  onEdit: () => void;
  onCancel: () => void;
  selectedAssets?: any[];
  readOnly?: boolean;
  onSave: (values: any[]) => void;
  allAssetModel: any[];
  allCurrentStatus: any[];
  assetGroups: any[];
  allDepartments: any[];
  allUnits: any[];
  allReasonIncreases: any[];
  allRepairTypes: any[];
  onFormChange?: (values: any) => void;
  initialFormData?: Record<string, any>;
  onMinimize: () => void;
}) {
  const { data: allProjects = [] } = useAllProjectsQuery();

  const formik = useFormik({
    initialValues: {
      assets:
        selectedAssets && selectedAssets.length > 0
          ? selectedAssets.map((a) => ({ ...a, isNew: a.isNew ?? false }))
          : initialFormData?.assets
            ? initialFormData.assets
            : [{ ...defaultAsset, isNew: true }],
    },
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit(values) {
      onSave(values.assets);
    },
  });

  const debouncedAssets = useDebounce(formik.values.assets, 1500);
  useEffect(() => {
    if (!selectedAssets || selectedAssets.length === 0) {
      onFormChange?.({ assets: debouncedAssets });
    }
  }, [debouncedAssets]);

  const selectedIds = selectedAssets?.map((a) => a.id).join(",");
  useEffect(() => {
    if (selectedAssets && selectedAssets.length > 0) {
      formik.setFieldValue(
        "assets",
        selectedAssets.map((a) => ({ ...a, isNew: a.isNew ?? false })),
      );
    }
  }, [selectedIds]);

  const assetsRef = useRef(formik.values.assets);
  assetsRef.current = formik.values.assets;

  const handleCopy = useCallback((idx: number) => {
    const source = assetsRef.current[idx];
    formik.setFieldValue("assets", [
      ...assetsRef.current,
      {
        ...source,
        id: "",
        soThe: "",
        isNew: true,
        fileDinhKemList: [],
        taiSanConList: source.taiSanConList.map((item: any) => ({
          ...item,
          id: "",
          idTaiSanCha: "",
          isInsert: true,
        })),
      },
    ]);
  }, []);

  return (
    <FormikProvider value={formik}>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sticky Header with Actions */}
        <Box
          sx={{
            p: 2,
            bgcolor: "#fffff",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pb: 2,
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1FA463" }}>
              Chi tiết tài sản
            </Typography>
            <Box display="flex" gap={0.5}>
              <IconButton size="small" onClick={onMinimize} title="Ẩn tạm">
                <Remove fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={onCancel} title="Đóng">
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box display="flex" gap={1.5} alignItems="center">
            {!readOnly && <SaveBtn onSave={formik.submitForm} />}
            {readOnly && <EditButton onClick={onEdit} />}
            {!readOnly && (
              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={() =>
                  formik.setFieldValue("assets", [
                    ...formik.values.assets,
                    { ...defaultAsset, isNew: true },
                  ])
                }
                sx={{
                  bgcolor: "#009e60",
                  "&:hover": { bgcolor: "#026e42" },
                  textTransform: "none",
                  fontWeight: 600,
                  height: "32px",
                }}
              >
                Thêm tài sản
              </Button>
            )}
            <CancelBtn onClick={onCancel} />
          </Box>
        </Box>
        {/* List of Assets */}
        <Box sx={{ flex: 1, p: 3, overflowY: "auto", bgcolor: "#ffffff" }}>
          <FieldArray name="assets">
            {({ push, remove }) => (
              <React.Fragment>
                {formik.values.assets.map((_: any, index: number) => (
                  <AssetRow
                    key={index}
                    index={index}
                    readOnly={readOnly}
                    onRemove={remove}
                    onCopy={(idx) => handleCopy(idx)}
                    allAssetModel={allAssetModel}
                    allCurrentStatus={allCurrentStatus}
                    assetGroups={assetGroups}
                    allDepartments={allDepartments}
                    allUnits={allUnits}
                    allReasonIncreases={allReasonIncreases}
                    allProjects={allProjects}
                    allRepairTypes={allRepairTypes}
                  />
                ))}
              </React.Fragment>
            )}
          </FieldArray>
        </Box>
      </Box>
    </FormikProvider>
  );
}
