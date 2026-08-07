import {
  Add,
  ArrowDropDown,
  ArrowDropUp,
  Close,
  Delete,
  InfoOutlineRounded,
  Remove,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import FieldInput from "../../../components/TextField/FieldInput";
import { FormikProvider, useFormik } from "formik";
import ViewBtn from "../../../components/Button/ViewBtn";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldDateTime from "../../../components/TextField/FieldDateTime";
import EditButton from "../../../components/Button/EditButton";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import dayjs from "dayjs";
import { ToolValidation } from "../validation";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import { CongTy } from "../../../utils/const";
import { useDebounce } from "../../../hooks/useDebounce";
import { currentBrandConfig } from "../../../config/brandConfig";
import { useAllToolTypeQuery } from "../../ToolType/Mutation";
import { useAllUnitsQuery } from "../../Unit/Mutation";

export default function ToolForm({
  onEdit,
  onCancel,
  selectedTool,
  readOnly,
  onSave,
  departments,
  toolGroups,
  initialFormData,
  onFormChange,
  onMinimize,
}: {
  onEdit: () => void;
  onCancel: () => void;
  selectedTool?: any;
  readOnly?: boolean;
  onSave: (values: any) => void;
  departments: any[];
  toolGroups: any[];
  onFormChange?: (values: any) => void;
  initialFormData?: Record<string, any>;
  onMinimize: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { user } = useSelector((state: RootState) => state.user);

  const { data: toolTypes = [] } = useAllToolTypeQuery();
  const { data: allUnits = [] } = useAllUnitsQuery();

  const formik = useFormik({
    initialValues: {
      id: initialFormData?.id ?? "",
      idDonVi: initialFormData?.idDonVi ?? "",
      ten: initialFormData?.ten ?? "",
      ngayNhap:
        initialFormData?.ngayNhap ??
        dayjs(new Date()).format("YYYY-MM-DDTHH:mm:ss"),
      donViTinh: initialFormData?.donViTinh ?? "",
      soLuong: initialFormData?.soLuong ?? 0,
      donViTinh2: initialFormData?.donViTinh2 ?? "",
      soLuong2: initialFormData?.soLuong2 ?? 0,
      idNhomCCDC: initialFormData?.idNhomCCDC ?? "",
      giaTri: initialFormData?.giaTri ?? 0,
      soKyHieu: initialFormData?.soKyHieu ?? "",
      kyHieu: initialFormData?.kyHieu ?? "",
      congSuat: initialFormData?.congSuat ?? "",
      nuocSanXuat: initialFormData?.nuocSanXuat ?? "",
      namSanXuat: initialFormData?.namSanXuat ?? 0,
      ghiChu: initialFormData?.ghiChu ?? "",
      idCongTy: initialFormData?.idCongTy ?? CongTy.CT001,
      ngayTao: initialFormData?.ngayTao ?? "",
      ngayCapNhat: initialFormData?.ngayCapNhat ?? "",
      nguoiTao: initialFormData?.nguoiTao ?? "",
      nguoiCapNhat: initialFormData?.nguoiCapNhat ?? user?.username ?? "",
      isActive: initialFormData?.isActive ?? true,
      idLoaiCCDCCon: initialFormData?.idLoaiCCDCCon ?? "",
      hienTrang: initialFormData?.hienTrang ?? 0,
      chiTietTaiSanList: initialFormData?.chiTietTaiSanList?.length
        ? initialFormData.chiTietTaiSanList
        : [
            {
              id: "",
              soLuong: 1,
              congSuat: "",
              nuocSanXuat: "",
              namSanXuat: 0,
              isInserted: true,
            },
          ],
      chiTietDonViSoHuuList: initialFormData?.chiTietDonViSoHuuList ?? [],
    },
    validationSchema: ToolValidation,
    onSubmit(values) {
      onSave({
        ...values,
        // Đảm bảo số lượng tổng của CCDC cũng là số
        soLuong: Number(values.soLuong || 0),
        soLuong2: Number(values.soLuong2 || 0),
        giaTri: Number(values.giaTri || 0),

        chiTietTaiSanList: values.chiTietTaiSanList.map((item: any) => ({
          ...item,
          // Ép kiểu số cho từng dòng chi tiết để tránh lỗi Backend
          soLuong: Number(item.soLuong || 0),
          namSanXuat: Number(item.namSanXuat || 0),

          // Giữ nguyên logic mapping ID
          idDonVi: values.idDonVi,
          idTaiSan: values.id,
        })),
      });
    },
  });

  const debouncedValues = useDebounce(formik.values, 1500);
  useEffect(() => {
    if (!selectedTool) {
      onFormChange?.(debouncedValues);
    }
  }, [debouncedValues]);

  useEffect(() => {
    if (selectedTool) {
      formik.setValues({
        ...selectedTool,
        donViTinh2: selectedTool.donViTinh2 ?? "",
        soLuong2: selectedTool.soLuong2 ?? 0,
        chiTietTaiSanList: selectedTool.chiTietTaiSanList.map(
          (item: any, index: number) => {
            const ownerRecord = selectedTool.chiTietDonViSoHuuList?.find(
              (o: any) => o.idTsCon === item.id,
            );

            return {
              ...item,
              stt: index + 1,
              idOwnerRecord: ownerRecord?.id || "",
              ngayTaoRecord: ownerRecord?.ngayTao || "",
              isUpdated: false,
            };
          },
        ),
      });
    }
  }, [selectedTool]);

  useEffect(() => {
    const soLuong = formik.values.chiTietTaiSanList
      .filter((item: any) => !item?.isDeleted)
      .reduce((sum: number, item: any) => sum + Number(item.soLuong || 0), 0);
    formik.setFieldValue("soLuong", soLuong);
  }, [formik.values.chiTietTaiSanList]);

  const handleFieldChange = (eOrValue: any, originalIndex: number) => {
    // 1. Cập nhật giá trị vào Formik
    if (eOrValue?.target) {
      // Nếu là Event (từ FieldInput cũ)
      formik.handleChange(eOrValue);
    } else {
      // Nếu là giá trị số trực tiếp (từ TextFieldNumber mới)
      // Lưu ý: TextFieldNumber của bạn đã tự setFieldValue bên trong rồi,
      // nên ở đây ta có thể bỏ qua hoặc set lại cho chắc chắn.
    }

    // 2. Logic đánh dấu isUpdated (Dùng chung cho cả 2)
    const currentRow = formik.values.chiTietTaiSanList[originalIndex] as any;
    if (!currentRow.isInserted) {
      formik.setFieldValue(
        `chiTietTaiSanList.${originalIndex}.isUpdated`,
        true,
      );
    }
  };

  return (
    <FormikProvider value={formik}>
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
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: currentBrandConfig.primaryColor }}
            >
              Chi tiết CCDC - Vật tư
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

          {/* Actions + Status bar */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box display="flex" gap={2}>
              {!readOnly && <SaveBtn onSave={() => formik.submitForm()} />}
              {readOnly && <EditButton onClick={onEdit} />}
              <CancelBtn onClick={onCancel} />
            </Box>

            {/* Status bar Nháp/Khóa — giữ nguyên */}
            <Box
              sx={{
                display: "flex",
                gap: 0,
                alignItems: "center",
                borderRadius: "8px",
                overflow: "visible",
                backgroundColor: "#F5F5F5",
                border: "2px solid",
                borderColor: "#B3E5FC",
                transition: "all 0.3s ease",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 28px",
                  backgroundColor: !readOnly ? "#B3E5FC" : "transparent",
                  color: !readOnly ? "#00695C" : "#BDBDBD",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "default",
                  flex: 1,
                  transition: "all 0.3s ease",
                  borderRadius: "6px 0 0 6px",
                  clipPath: !readOnly
                    ? "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)"
                    : "none",
                  position: "relative",
                  zIndex: !readOnly ? 2 : 1,
                }}
              >
                Nháp
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 28px",
                  backgroundColor: readOnly ? "#B3E5FC" : "transparent",
                  color: readOnly ? "#00695C" : "#BDBDBD",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "default",
                  flex: 1,
                  transition: "all 0.3s ease",
                  borderRadius: "0 6px 6px 0",
                  clipPath: readOnly
                    ? "polygon(14px 0, 100% 0, 100% 100%, 14px 100%, 0 50%)"
                    : "none",
                  position: "relative",
                  zIndex: readOnly ? 2 : 1,
                }}
              >
                Khóa
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          <Paper elevation={0} sx={{ mt: 2, p: 2, borderRadius: "12px" }}>
            <Box display={"flex"} alignItems={"center"} gap={2}>
              <InfoOutlineRounded color="primary" />
              <Typography>Thông tin CCDC - Vật tư</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Mã công cụ dụng cụ *"
                      name="id"
                      disabled={Boolean(selectedTool?.id)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Tên công cụ dụng cụ *"
                      name="ten"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldAutoCompleted
                      title="Đơn vị tính *"
                      data={allUnits}
                      labelkey="tenDonVi"
                      name="donViTinh"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldAutoCompleted
                      title="Đơn vị tính 2"
                      data={allUnits}
                      labelkey="tenDonVi"
                      name="donViTinh2"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldAutoCompleted
                      title="Đơn vị ban đầu"
                      data={departments}
                      labelkey="tenPhongBan"
                      name="idDonVi"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldDateTime
                      title="Ngày nhập"
                      name="ngayNhap"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Ghi chú"
                      name="ghiChu"
                      disabled={readOnly}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid size={{ xs: 12 }}>
                    <FieldAutoCompleted
                      title="Nhóm CCDC *"
                      data={toolGroups}
                      labelkey="ten"
                      name="idNhomCCDC"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldAutoCompleted
                      title="Loại CCDC *"
                      data={toolTypes}
                      labelkey="tenLoai"
                      name="idLoaiCCDCCon"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextFieldNumber
                      title="Số lượng"
                      name="soLuong"
                      disabled={true}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextFieldNumber
                      title="Số lượng 2"
                      name="soLuong2"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextFieldNumber
                      title="Giá trị *"
                      name="giaTri"
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FieldInput
                      title="Ký hiệu"
                      name="kyHieu"
                      disabled={readOnly}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            <Typography fontSize={14} py={2}>
              Chi tiết CCDC Vật tư:
            </Typography>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Số lượng</TableCell>
                  <TableCell>Công suất</TableCell>
                  <TableCell>Nước sản xuất</TableCell>
                  <TableCell>Năm sản xuất</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formik.values.chiTietTaiSanList
                  .map((row: any, originalIndex: number) => ({
                    ...row,
                    originalIndex,
                  }))
                  .filter((row: any) => !row.isDeleted)
                  .map((row: any) => (
                    <TableRow key={row.originalIndex}>
                      <TableCell>
                        <TextFieldNumber
                          title=""
                          name={`chiTietTaiSanList.${row.originalIndex}.soLuong`}
                          disabled={readOnly}
                          onChange={(e) =>
                            handleFieldChange(e, row.originalIndex)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <FieldInput
                          name={`chiTietTaiSanList.${row.originalIndex}.congSuat`}
                          disabled={readOnly}
                          onChange={(e) =>
                            handleFieldChange(e, row.originalIndex)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <FieldInput
                          name={`chiTietTaiSanList.${row.originalIndex}.nuocSanXuat`}
                          disabled={readOnly}
                          onChange={(e) =>
                            handleFieldChange(e, row.originalIndex)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <FieldInput
                          name={`chiTietTaiSanList.${row.originalIndex}.namSanXuat`}
                          type="number"
                          disabled={readOnly}
                          onChange={(e) =>
                            handleFieldChange(e, row.originalIndex)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      </Box>
    </FormikProvider>
  );
}
