import {
  Box,
  Button,
  Checkbox,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  styled,
} from "@mui/material";
import { FormikProvider, useFormik } from "formik";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  Add,
  Delete,
  Cancel,
  Visibility,
  Remove,
  Close,
} from "@mui/icons-material";
import SaveBtn from "../../../components/Button/SaveBtn";
import CancelBtn from "../../../components/Button/CancelBtn";
import EditButton from "../../../components/Button/EditButton";
import FieldInput from "../../../components/TextField/FieldInput";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldDateTime from "../../../components/TextField/FieldDateTime";
import CustomStepper from "../../../components/common/CustomStepper";
import FileAttachmentInput from "../../../components/TextField/FileAttachmentInput";
import SignDocumentForm from "./SignDocumentForm";
import { generateCode } from "../../../utils/helpers";
import { useAssetByDonViQuery } from "../Mutation";
import dayjs from "dayjs";
import { RootState } from "../../../redux/store";
import { useSelector } from "react-redux";
import { generateBangKePdf, mergeBangKeWithOriginalPdf } from "../config";
import S3Service from "../../../services/S3Service";
import { assetTransferValidationSchema } from "../validation";
import ExcelAssetUploader from "../../../components/common/ExcelAssetUploader";
import { useAllDepartmentsQuery } from "../../Department/Mutation";
import { useAllCurrentStatusQuery } from "../../CurrentStatus/Mutation";
import { useAllUnitsQuery } from "../../Unit/Mutation";

const CustomTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: "1px solid rgba(224, 224, 224, 1)",
  padding: "16px 8px",
  fontSize: "14px",
}));

const CustomTableHeadCell = styled(CustomTableCell)(({ theme }) => ({
  fontWeight: "bold",
  color: "rgba(0, 0, 0, 0.87)",
  backgroundColor: "transparent",
}));
export default forwardRef(function AssetTransferForm(
  {
    onEdit,
    onClose,
    selectedTransfer,
    readOnly,
    type,
    onSave,
    onCancel,
    label,
    isSignedForm = false,
    staffs,
    initialFormData,
    onFormChange,
    onMinimize,
  }: {
    onEdit: () => void;
    onClose: () => void;
    selectedTransfer?: any;
    readOnly?: boolean;
    type: number;
    onSave: (values: any) => void;
    onCancel: () => void;
    label?: string;
    isSignedForm?: boolean;
    staffs: any[];
    onFormChange?: (values: any) => void;
    initialFormData?: Record<string, any>;
    onMinimize: () => void;
  },
  ref: any,
) {
  const [isPreview, setIsPreview] = useState(false);
  const [document, setDocument] = useState<File | string | any>("");
  const { user } = useSelector((state: RootState) => state.user);

  const { data: departments = [] } = useAllDepartmentsQuery();
  const { data: allCurrentStatus = [] } = useAllCurrentStatusQuery();
  const { data: allUnits = [] } = useAllUnitsQuery();

  // Logic trạng thái
  const currentStatus = selectedTransfer?.trangThai ?? 0; // 0: Nháp, 1: Duyệt, 2: Hủy, 3: Hoàn thành

  const formik = useFormik({
    initialValues: {
      id: initialFormData?.id ?? "",
      soQuyetDinh: initialFormData?.soQuyetDinh ?? "",
      tenPhieu: initialFormData?.tenPhieu ?? "",
      idDonViGiao: initialFormData?.idDonViGiao ?? (type === 1 ? "Kty" : ""),
      idDonViNhan: initialFormData?.idDonViNhan ?? (type === 3 ? "kth" : ""),
      idNguoiKyNhay: initialFormData?.idNguoiKyNhay ?? "",
      trangThaiKyNhay: initialFormData?.trangThaiKyNhay ?? false,
      nguoiLapPhieuKyNhay: initialFormData?.nguoiLapPhieuKyNhay ?? false,
      idDonViDeNghi:
        initialFormData?.idDonViDeNghi ?? user?.taiKhoan?.phongBanId ?? "",
      tgGnTuNgay:
        initialFormData?.tgGnTuNgay ??
        dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      tgGnDenNgay:
        initialFormData?.tgGnDenNgay ??
        dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      idTrinhDuyetCapPhong: initialFormData?.idTrinhDuyetCapPhong ?? "",
      trinhDuyetCapPhongXacNhan:
        initialFormData?.trinhDuyetCapPhongXacNhan ?? false,
      idTrinhDuyetGiamDoc: initialFormData?.idTrinhDuyetGiamDoc ?? "",
      trinhDuyetGiamDocXacNhan:
        initialFormData?.trinhDuyetGiamDocXacNhan ?? false,
      trichYeu: initialFormData?.trichYeu ?? "",
      duongDanFile: initialFormData?.duongDanFile ?? "",
      tenFile: initialFormData?.tenFile ?? "",
      taiLieuCuoi: initialFormData?.taiLieuCuoi ?? "",
      loai: initialFormData?.loai ?? type,
      nguoiKyList: initialFormData?.nguoiKyList ?? [],
      chiTietDieuDongTaiSanDTOS: initialFormData?.chiTietDieuDongTaiSanDTOS ?? [
        {
          id: "",
          idDieuDongTaiSan: "",
          tentaiSan: "",
          idTaiSan: "",
          soLuong: 0,
          ghiChu: "",
          ngayTao: "",
          ngayCapNhat: "",
          nguoiTao: "",
          nguoiCapNhat: "",
          isActive: true,
          hienTrang: "",
          moTa: "",
          daBanGiao: false,
        },
      ],
      initialChiTiet: [],
      initialNguoiKy: [],
    },
    validationSchema: assetTransferValidationSchema,
    onSubmit: async (values) => {
      const chiTietDieuDongTaiSanDTOS = values.chiTietDieuDongTaiSanDTOS
        .filter(
          (item: any) => item.idTaiSan !== "" || item.idTaiSan !== undefined,
        )
        .map((item: any, index: number) => ({
          ...item,
          id: `${generateCode("CTDD-")}-${index}`,
          idDieuDongTaiSan: values.id,
        }));
      const nguoiKyList = values.nguoiKyList.map(
        (item: any, index: number) => ({
          ...item,
          id: `${generateCode("NK-")}-${index}`,
          idTaiLieu: values.id,
          idPhongBan: values.idDonViDeNghi,
        }),
      );
      const bangKeBytes = await generateBangKePdf(
        values.chiTietDieuDongTaiSanDTOS,
        allUnits,
        allCurrentStatus,
      );

      // 2. Xử lý Key tài liệu gốc (duongDanFile)
      let keyTailieu = values.duongDanFile;
      let keyTaiLieuCuoi = values.taiLieuCuoi;

      // Nếu 'document' là File (người dùng vừa chọn file mới)
      if (document instanceof File) {
        keyTailieu = await S3Service.put({
          name: document.name,
          file: document,
          type: "tailieu",
        });
      }

      // 3. Merge và Upload tài liệu cuối (taiLieuCuoi)
      const mergePdf = await mergeBangKeWithOriginalPdf(
        keyTailieu,
        bangKeBytes,
      );
      if (!mergePdf) throw new Error("Không thể tạo tài liệu");

      if (!keyTaiLieuCuoi) {
        keyTaiLieuCuoi = await S3Service.put({
          name: `DDTS_${values.tenPhieu}_${Date.now()}.pdf`,
          file: mergePdf,
          type: "tailieu",
        });
      } else {
        await S3Service.updatePresignedPutUrl(keyTaiLieuCuoi, mergePdf);
      }
      onSave({
        ...values,
        chiTietDieuDongTaiSanDTOS,
        nguoiKyList,
        duongDanFile: keyTailieu,
        taiLieuCuoi: keyTaiLieuCuoi,
      });
    },
  });

  useImperativeHandle(ref, () => ({
    getValues: () => formik.values,
  }));

  useEffect(() => {
    if (selectedTransfer) {
      formik.setValues({
        ...selectedTransfer,
        initialChiTiet: selectedTransfer.chiTietDieuDongTaiSanDTOS.map(
          (i: any) => i.id,
        ),
        initialNguoiKy: selectedTransfer.nguoiKyList.map((i: any) => i.id),
      });
      setDocument(
        [0].includes(selectedTransfer.trangThai ?? 0)
          ? selectedTransfer.duongDanFile
          : selectedTransfer.taiLieuCuoi,
      );
    }
  }, [selectedTransfer]);

  const isCapPhat = type === 1;
  const isThuHoi = type === 3;
  const dvGiao = departments.filter((i: any) =>
    isCapPhat ? i.isKho === true && i.loaiKho === 1 : !i.isKho,
  );
  const dvNhan = departments.filter((i: any) =>
    isThuHoi ? i.isKho === true && i.loaiKho === 2 : !i.isKho,
  );

  const [nvThamMuu, setNVThamMuu] = useState<any[]>([]);
  const [nvPGD, setNVPGD] = useState<any[]>([]);

  useEffect(() => {
    if (formik.values.idDonViDeNghi && departments && staffs) {
      setNVThamMuu(
        staffs.filter((i) => i.phongBanId === formik.values.idDonViDeNghi),
      );
      const lanhDaoDeptIds = departments
        .filter((d: any) => d.isLanhDao === true)
        .map((d: any) => d.id);

      // Bước B: Lọc nhân viên có phongBanId nằm trong danh sách ID vừa tìm được
      const filteredPGD = staffs.filter((s) =>
        lanhDaoDeptIds.includes(s.phongBanId),
      );
      setNVPGD(filteredPGD);
    }
  }, [formik.values.idDonViDeNghi, departments, staffs]);

  const {
    data: allAssetsByDonVi = { items: [] },
    isFetching,
    isLoading,
  } = useAssetByDonViQuery(type, formik.values.idDonViGiao);

  const availableToolItems = useMemo(() => {
    return [
      ...allAssetsByDonVi.items,
      ...(selectedTransfer?.chiTietDieuDongTaiSanDTOS || []).map((i: any) => ({
        ...i,
        id: i.idTaiSan,
      })),
    ];
  }, [allAssetsByDonVi, selectedTransfer]);
  return (
    <FormikProvider value={formik}>
      {isPreview && (
        <SignDocumentForm
          selectedIds={[]}
          document={document}
          onCancel={() => {
            setIsPreview(false);
          }}
          onSign={() => {
            console.log("Ký tài liệu thành công");
          }}
          showSignerSidebar={false}
          fullscreen={true}
          assetTransferDetail={formik.values.chiTietDieuDongTaiSanDTOS}
          isEdit={[0].includes(selectedTransfer?.trangThai ?? 0) ? true : false}
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
            bgcolor: "#ffffff",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 11,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            {/* Bên trái: Tiêu đề */}
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1FA463" }}>
              Chi tiết {label}
            </Typography>

            {/* Bên phải: Stepper + Các nút */}
            <Box display="flex" alignItems="center" gap={1}>
              <CustomStepper activeStep={currentStatus} />

              {![0, 2, 3, 4].includes(currentStatus) && (
                <Button
                  size="small"
                  sx={{ bgcolor: "red", color: "white" }}
                  startIcon={<Cancel />}
                  onClick={onCancel}
                >
                  Hủy phiếu {label}
                </Button>
              )}

              <IconButton size="small" onClick={onMinimize} title="Ẩn tạm">
                <Remove fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={onClose} title="Đóng">
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <Paper
          sx={{
            p: 3,
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}
        >
          {/* --- PHẦN 1: THÔNG TIN CHUNG (Sử dụng Grid size MUI v7) --- */}
          <Grid container spacing={4}>
            {/* CỘT TRÁI */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grid container spacing={2}>
                {selectedTransfer && (
                  <Grid size={12}>
                    <FieldInput
                      title="Số chứng từ *"
                      name="id"
                      disabled={true}
                    />
                  </Grid>
                )}
                <Grid size={12}>
                  <FieldInput
                    title="Tên phiếu *"
                    name="tenPhieu"
                    disabled={readOnly}
                  />
                </Grid>
                <Grid size={12}>
                  <FieldInput
                    title="Trích yếu *"
                    name="trichYeu"
                    disabled={readOnly}
                  />
                </Grid>
                <Grid size={12}>
                  <FieldAutoCompleted
                    title="Đơn vị giao *"
                    labelkey="tenPhongBan"
                    data={dvGiao}
                    name="idDonViGiao"
                    disabled={readOnly}
                  />
                </Grid>
                <Grid size={12}>
                  <FieldAutoCompleted
                    title="Đơn vị nhận *"
                    labelkey="tenPhongBan"
                    data={dvNhan}
                    name="idDonViNhan"
                    disabled={readOnly}
                  />
                </Grid>
                <Grid size={12}>
                  <FieldDateTime
                    title="TGCN từ Ngày"
                    name="tgGnTuNgay"
                    disabled={readOnly}
                  />
                </Grid>
                <Grid size={12}>
                  <FieldDateTime
                    title="TGCN đến Ngày"
                    name="tgGnDenNgay"
                    disabled={readOnly}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* CỘT PHẢI */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <FieldAutoCompleted
                    title="Đơn vị đề nghị *"
                    labelkey="tenPhongBan"
                    data={departments.filter((i: any) => !i.isKho)}
                    name="idDonViDeNghi"
                    disabled={readOnly}
                  />
                </Grid>
                <Grid size={12}>
                  <FieldAutoCompleted
                    title="Người lập biểu *"
                    labelkey="hoTen"
                    data={nvThamMuu}
                    name="idNguoiKyNhay"
                    disabled={readOnly}
                  />
                </Grid>
                <Grid size={12}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography fontSize={14} color="text.secondary">
                      Người lập phiếu ký nháy :
                    </Typography>
                    <Checkbox
                      checked={formik.values.nguoiLapPhieuKyNhay}
                      onChange={(e) =>
                        formik.setFieldValue(
                          "nguoiLapPhieuKyNhay",
                          e.target.checked,
                        )
                      }
                      disabled={readOnly}
                      color="primary"
                    />
                  </Box>
                </Grid>
                <Grid size={12}>
                  <FieldAutoCompleted
                    title="Người duyệt *"
                    labelkey="hoTen"
                    data={nvThamMuu}
                    name="idTrinhDuyetCapPhong"
                    disabled={readOnly}
                  />
                </Grid>
                <Grid size={12} sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    color="inherit"
                    size="small"
                    startIcon={<Add />}
                    disabled={readOnly}
                    sx={{
                      bgcolor: "#e0e0e0",
                      color: "#000",
                      textTransform: "none",
                      boxShadow: "none",
                    }}
                    onClick={() => {
                      const newNguoiKy = [
                        ...formik.values.nguoiKyList,
                        {
                          id: "",
                          idTaiLieu: "",
                          idNguoiKy: "",
                          tenNguoiKy: "",
                          idPhongBan: "",
                          trangThai: 0,
                        },
                      ];
                      formik.setFieldValue("nguoiKyList", newNguoiKy);
                    }}
                  >
                    Thêm người ký
                  </Button>
                </Grid>

                {formik.values.nguoiKyList.map((row: any, index: number) => (
                  <Grid size={12}>
                    <Box display="flex">
                      <FieldAutoCompleted
                        title={`Người đại diện ${index + 1}`}
                        labelkey="hoTen"
                        data={nvThamMuu}
                        name={`nguoiKyList[${index}].idNguoiKy`}
                        onChange={(value) => {
                          formik.setFieldValue(
                            `nguoiKyList[${index}].tenNguoiKy`,
                            value?.hoTen,
                          );
                        }}
                        disabled={readOnly}
                      />
                      <IconButton
                        onClick={() => {
                          const newNguoiKy = [...formik.values.nguoiKyList];
                          newNguoiKy.splice(index, 1);
                          formik.setFieldValue("nguoiKyList", newNguoiKy);
                        }}
                      >
                        <Delete sx={{ color: "red" }} />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
                <Grid size={12}>
                  <FieldAutoCompleted
                    title="Người phê duyệt *"
                    labelkey="hoTen"
                    data={nvPGD}
                    name={`idTrinhDuyetGiamDoc`}
                    disabled={readOnly}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* --- PHẦN 2: TÀI LIỆU QUYẾT ĐỊNH --- */}
          <Box mt={4} mb={4}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Tài liệu Quyết định *
            </Typography>

            <FileAttachmentInput
              formik={formik}
              fileName="tenFile"
              filePath="duongDanFile"
              setDocument={setDocument}
              disabled={readOnly}
            />
          </Box>

          {/* --- PHẦN 3: CHI TIẾT TÀI SẢN --- */}
          <Box>
            <Box display={"flex"} justifyContent={"space-between"}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Chi tiết tài sản điều chuyển:
              </Typography>
              <ExcelAssetUploader
                readOnly={readOnly}
                availableAssets={[
                  ...allAssetsByDonVi.items,
                  ...((selectedTransfer?.chiTietDieuDongTaiSanDTOS as any[]) ||
                    []),
                ].map((item: any) => ({
                  id: item.id || item.idTaiSan || "",
                  name: item.tenTaiSan || item.ten || "",
                  originalData: item,
                }))}
                onUploadSuccess={(matchedWrapperAssets) => {
                  const existingIds =
                    formik.values.chiTietDieuDongTaiSanDTOS.map(
                      (i: any) => i.idTaiSan,
                    );
                  const newItems = matchedWrapperAssets
                    .map((wrapper) => wrapper.originalData)
                    .filter(
                      (item) => !existingIds.includes(item.id || item.idTaiSan),
                    )
                    .map((item) => ({
                      id: "",
                      idDieuDongTaiSan: "",
                      tenTaiSan: item.tenTaiSan || item.ten || "",
                      idTaiSan: item.id || item.idTaiSan,
                      soLuong: 1,
                      ghiChu: "",
                      ngayTao: "",
                      ngayCapNhat: "",
                      nguoiTao: "",
                      nguoiCapNhat: "",
                      isActive: true,
                      hienTrang: item.hienTrang || "Đang sử dụng",
                      moTa: item.moTa || "",
                      donViTinh: item.donViTinh || "",
                      daBanGiao: false,
                    }));

                  if (newItems.length > 0) {
                    formik.setFieldValue("chiTietDieuDongTaiSanDTOS", [
                      ...formik.values.chiTietDieuDongTaiSanDTOS,
                      ...newItems,
                    ]);
                  } else {
                    alert(
                      "Không tìm thấy tài sản hợp lệ mới nào từ file. Hoặc tất cả tài sản đã có trong danh sách.",
                    );
                  }
                }}
              />
            </Box>
            <Table
              size="small"
              sx={{
                "& .MuiTableCell-root": {
                  borderBottom: "1px solid #e0e0e0",
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <CustomTableHeadCell width="25%">Tài sản</CustomTableHeadCell>
                  <CustomTableHeadCell width="15%">
                    Đơn vị tính
                  </CustomTableHeadCell>
                  <CustomTableHeadCell width="15%">
                    Số lượng
                  </CustomTableHeadCell>
                  <CustomTableHeadCell width="20%">
                    Tình trạng kỹ thuật
                  </CustomTableHeadCell>
                  <CustomTableHeadCell width="20%">Ghi chú</CustomTableHeadCell>
                  {!readOnly && (
                    <CustomTableHeadCell width="5%"></CustomTableHeadCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {formik.values.chiTietDieuDongTaiSanDTOS.map(
                  (row: any, index: number) => {
                    const selectedIdCustoms =
                      formik.values.chiTietDieuDongTaiSanDTOS
                        .filter(
                          (r: any, i: number) => i !== index && r.idTaiSan,
                        )
                        .map((r: any) => r.idTaiSan);

                    // Options cho dòng này = list gốc - item đã bị dòng khác chọn
                    const rowData = availableToolItems.filter(
                      (item: any) => !selectedIdCustoms.includes(item.id),
                    );
                    return (
                      <TableRow key={index}>
                        <CustomTableCell>
                          <FieldAutoCompleted
                            title=""
                            labelkey="tenTaiSan"
                            labelOption="id"
                            data={rowData}
                            name={`chiTietDieuDongTaiSanDTOS.${index}.idTaiSan`}
                            onChange={(value) => {
                              const isDuplicate =
                                formik.values.chiTietDieuDongTaiSanDTOS.some(
                                  (r: any, i: number) =>
                                    i !== index && r.idTaiSan === value?.id,
                                );
                              if (value && isDuplicate) {
                                alert(
                                  "Tài sản này đã được chọn ở dòng khác. Vui lòng chọn vật tư khác.",
                                );
                                return;
                              }
                              formik.setFieldValue(
                                `chiTietDieuDongTaiSanDTOS.${index}.donViTinh`,
                                value?.donViTinh,
                              );
                              formik.setFieldValue(
                                `chiTietDieuDongTaiSanDTOS.${index}.tenTaiSan`,
                                value?.tenTaiSan,
                              );
                              formik.setFieldValue(
                                `chiTietDieuDongTaiSanDTOS.${index}.soLuong`,
                                value?.soLuong,
                              );
                              formik.setFieldValue(
                                `chiTietDieuDongTaiSanDTOS.${index}.hienTrang`,
                                value?.hienTrang,
                              );
                              formik.setFieldValue(
                                `chiTietDieuDongTaiSanDTOS.${index}.moTa`,
                                value?.moTa,
                              );
                              formik.setFieldValue(
                                `chiTietDieuDongTaiSanDTOS.${index}.ghiChu`,
                                value?.ghiChu,
                              );
                            }}
                            disabled={readOnly}
                            limitOptions={10}
                          />
                        </CustomTableCell>
                        <CustomTableCell>
                          <FieldAutoCompleted
                            title=""
                            labelkey="tenDonVi"
                            data={allUnits}
                            name={`chiTietDieuDongTaiSanDTOS.${index}.donViTinh`}
                            disabled={true}
                          />
                        </CustomTableCell>
                        <CustomTableCell>
                          <FieldInput
                            title=""
                            type="number"
                            name={`chiTietDieuDongTaiSanDTOS.${index}.soLuong`}
                            disabled={true}
                            compactError
                          />
                        </CustomTableCell>
                        <CustomTableCell>
                          <FieldAutoCompleted
                            title=""
                            labelkey="tenHTKT"
                            data={allCurrentStatus}
                            name={`chiTietDieuDongTaiSanDTOS.${index}.hienTrang`}
                            disabled={readOnly}
                          />
                        </CustomTableCell>
                        <CustomTableCell>
                          <FieldInput
                            title=""
                            name={`chiTietDieuDongTaiSanDTOS.${index}.ghiChu`}
                            disabled={readOnly}
                          />
                        </CustomTableCell>
                        {!readOnly && (
                          <CustomTableCell align="center">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => {
                                const newAssets = [
                                  ...formik.values.chiTietDieuDongTaiSanDTOS,
                                ];
                                newAssets.splice(index, 1);
                                formik.setFieldValue(
                                  "chiTietDieuDongTaiSanDTOS",
                                  newAssets,
                                );
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </CustomTableCell>
                        )}
                      </TableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
            {!readOnly && (
              <Box mt={2} display="flex" gap={2} alignItems="center">
                <Button
                  startIcon={<Add />}
                  variant="text"
                  onClick={() => {
                    formik.setFieldValue("chiTietDieuDongTaiSanDTOS", [
                      ...formik.values.chiTietDieuDongTaiSanDTOS,
                      {
                        assetId: "",
                        uom: "",
                        quantity: 1,
                        status: "Đang sử dụng",
                        note: "",
                      },
                    ]);
                  }}
                  sx={{ textTransform: "none" }}
                >
                  Thêm một dòng
                </Button>
              </Box>
            )}
            <Box
              mt={2}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box
                display="flex"
                alignItems="center"
                gap={0.5}
                sx={{ cursor: "pointer", color: "#1976d2" }}
                onClick={() => setIsPreview(true)}
              >
                <Typography variant="body2">Xem trước tài liệu</Typography>
                <Visibility fontSize="small" />
              </Box>

              {[0].includes(currentStatus) && (
                <Box display="flex" gap={2}>
                  {!readOnly && <SaveBtn onSave={formik.submitForm} />}
                  {!readOnly && <CancelBtn onClick={onClose} />}
                  {readOnly && <EditButton onClick={onEdit} />}
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </FormikProvider>
  );
});
