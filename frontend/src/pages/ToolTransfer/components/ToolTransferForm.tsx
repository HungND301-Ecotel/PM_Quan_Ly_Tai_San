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
import SignDocumentForm from "./SignDocumentForm";
import { generateCode } from "../../../utils/helpers";
import { toolTransferValidationSchema } from "../validation";
import dayjs from "dayjs";
import FileAttachmentInput from "../../../components/TextField/FileAttachmentInput";
import { useToolByDepartmentPageQuery } from "../Mutation";
import { useAllStaffsQuery } from "../../Staff/Mutation";
import DialogLoading from "../../../components/common/DialogLoading";
import { RootState } from "../../../redux/store";
import { useSelector } from "react-redux";
import { generateBangKePdf } from "../config";
import S3Service from "../../../services/S3Service";
import { mergeBangKeWithOriginalPdf } from "../../AssetTransfer/config";
import { CongTy } from "../../../utils/const";
import ExcelAssetUploader from "../../../components/common/ExcelAssetUploader";
import { useDebounce } from "../../../hooks/useDebounce";
import { useAllDepartmentsQuery } from "../../Department/Mutation";
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
interface ToolTransferFormProps {
  onEdit: () => void;
  onClose: () => void;
  selectedTool?: any;
  readOnly?: boolean;
  type: number;
  onSave: (values: any) => void;
  onCancel: () => void;
  label?: string;
  isSignedForm?: boolean;
  onFormChange?: (values: any) => void;
  initialFormData?: Record<string, any>;
  onMinimize: () => void;
  staffs: any[];
}

export default forwardRef(function ToolTransferForm(
  {
    onEdit,
    onClose,
    selectedTool,
    readOnly,
    type,
    onSave,
    onCancel,
    label,
    isSignedForm = false,
    initialFormData,
    onFormChange,
    onMinimize,
    staffs = [],
  }: ToolTransferFormProps,
  ref: any,
) {
  const { user } = useSelector((state: RootState) => state.user);
  const [expanded, setExpanded] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [document, setDocument] = useState<File | string | any>("");

  const { data: departments = [] } = useAllDepartmentsQuery();
  const { data: allUnits = [] } = useAllUnitsQuery();

  // Logic trạng thái
  const currentStatus = selectedTool?.trangThai ?? 0; // 0: Nháp, 1: Duyệt, 2: Hủy, 3: Hoàn thành
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
      diaDiemGiaoNhan: initialFormData?.diaDiemGiaoNhan ?? "",
      idPhongBanXemPhieu: initialFormData?.idPhongBanXemPhieu ?? "",
      noiNhan: initialFormData?.noiNhan ?? "",
      trangThai: initialFormData?.trangThai ?? 0,
      idCongTy: initialFormData?.idCongTy ?? CongTy.CT001,
      loai: initialFormData?.loai ?? type,
      trichYeu: initialFormData?.trichYeu ?? "",
      tenFile: initialFormData?.tenFile ?? "",
      duongDanFile: initialFormData?.duongDanFile ?? "",
      taiLieuCuoi: initialFormData?.taiLieuCuoi ?? "",
      nguoiKyList: initialFormData?.nguoiKyList ?? [],
      chiTietDieuDongCCDCVatTuDTOS:
        initialFormData?.chiTietDieuDongCCDCVatTuDTOS ?? [
          {
            idCustom: "",
            idCCDCVatTu: "",
            soChungTu: "",
            idChiTietCCDCVatTu: "",
            donViTinh: "",
            soLuong: 0,
            soLuongXuat: 0,
            ghiChu: "",
            hienTrang: "",
            moTa: "",
            isActive: true,
            soLuongDaBanGiao: 0,
            soKyHieu: "",
            kyHieu: "",
            namSanXuat: "",
          },
        ],
      initialChiTiet: initialFormData?.initialChiTiet ?? [],
    },
    validationSchema: toolTransferValidationSchema,
    onSubmit: async (values) => {
      // Logic map ID tương tự nhưng dùng prefix của Tool
      const chiTietDieuDongCCDCVatTuDTOS = values.chiTietDieuDongCCDCVatTuDTOS
        .filter((i: any) => i.idCCDCVatTu !== "" && i.idCCDCVatTu !== undefined)
        .map((item: any, index: number) => ({
          ...item,
          id: `${generateCode("CTBG-")}-${index}`,
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
        values.chiTietDieuDongCCDCVatTuDTOS,
        allUnits,
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
          name: `DDCCDC_${values.tenPhieu}_${Date.now()}.pdf`,
          file: mergePdf,
          type: "tailieu",
        });
      } else {
        await S3Service.updatePresignedPutUrl(keyTaiLieuCuoi, mergePdf);
      }
      onSave({
        ...values,
        chiTietDieuDongCCDCVatTuDTOS,
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
    if (selectedTool) {
      formik.setValues({
        ...selectedTool,
        initialChiTiet: (selectedTool.chiTietDieuDongCCDCVatTuDTOS || []).map(
          (i: any) => i.id,
        ),
        chiTietDieuDongCCDCVatTuDTOS: (
          selectedTool.chiTietDieuDongCCDCVatTuDTOS || []
        ).map((i: any) => ({
          ...i,
          idCustom: i.soChungTu + "_" + i.idCCDCVatTu,
          tenCCDCVatTu: `${i.tenCCDCVatTu} - (${i.soChungTu || ""})`,
        })),
        initialNguoiKy: (selectedTool.nguoiKyList || []).map((i: any) => i.id),
      });
      setDocument(
        [0].includes(selectedTool.trangThai ?? 0)
          ? selectedTool.duongDanFile
          : selectedTool.taiLieuCuoi,
      );
    }
  }, [selectedTool]);

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
        staffs.filter(
          (i: any) =>
            i.hasAccount && i.phongBanId === formik.values.idDonViDeNghi,
        ),
      );
      const lanhDaoDeptIds = departments
        .filter((d: any) => d.isLanhDao === true)
        .map((d: any) => d.id);

      // Bước B: Lọc nhân viên có phongBanId nằm trong danh sách ID vừa tìm được
      const filteredPGD = staffs.filter(
        (s: any) => s.hasAccount && lanhDaoDeptIds.includes(s.phongBanId),
      );
      setNVPGD(filteredPGD);
    }
  }, [formik.values.idDonViDeNghi, departments, staffs]);

  const { data: toolsByDepartment = [], isLoading } =
    useToolByDepartmentPageQuery({
      departmentId: formik.values.idDonViGiao,
      loai: "ccdc",
    });

  const tools = useMemo(() => {
    if (!toolsByDepartment?.length) return [];

    return toolsByDepartment.map((i: any) => ({
      ...i,
      id: i.idDetaiAsset || i.id,
    }));
  }, [toolsByDepartment]);

  const availableToolItems = useMemo(() => {
    return [
      ...tools,
      ...(selectedTool?.chiTietDieuDongCCDCVatTuDTOS || []).map((i: any) => ({
        ...i,
        id: i.soChungTu + "_" + i.idCCDCVatTu,
        tenDetailAsset: `${i.tenCCDCVatTu} - (${i.soChungTu || ""})`,
      })),
    ];
  }, [tools, selectedTool]);

  return (
    <FormikProvider value={formik}>
      <DialogLoading loading={isLoading} title="Đang tải ccdc ..." />
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
          toolTransferDetail={formik.values.chiTietDieuDongCCDCVatTuDTOS}
          allUnits={allUnits}
          isEdit={[0].includes(selectedTool?.trangThai ?? 0) ? true : false}
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

        {/* Body — giữ nguyên toàn bộ Paper bên trong */}
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
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
                  {selectedTool && (
                    <Grid size={12}>
                      <FieldInput
                        title="Số chứng từ"
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
                      title="Người lập phiếu *"
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
                  Chi tiết ccdc-vật tư điều chuyển:
                </Typography>
                <ExcelAssetUploader
                  readOnly={readOnly}
                  availableAssets={[
                    ...tools,
                    ...((selectedTool?.chiTietDieuDongCCDCVatTuDTOS as any[]) ||
                      []),
                  ].map((item: any) => ({
                    id: item.soChungTu + "_" + item.idCCDCVatTu,
                    name: `${item.tenDetailAsset} (SL: ${item.soLuong || 0})`,
                    originalData: item,
                  }))}
                  onUploadSuccess={(matchedWrapperAssets) => {
                    const existingIds =
                      formik.values.chiTietDieuDongCCDCVatTuDTOS.map(
                        (i: any) => i.idCustom,
                      );
                    const newItems = matchedWrapperAssets
                      .map((wrapper) => wrapper.originalData)
                      .filter((item) => !existingIds.includes(item.idCustom))
                      .map((item) => ({
                        idCustom: item.id,
                        idChiTietCCDCVatTu:
                          item.idChiTietCCDCVatTu || item.idDetaiAsset || "",
                        idCCDCVatTu: item.idCCDCVatTu || "",
                        soChungTu: item.soChungTu || "",
                        tenCCDCVatTu:
                          item.tenCCDCVatTu ||
                          item.ten ||
                          item.tenDetailAsset ||
                          "",
                        donViTinh: item.donViTinh || "",
                        soLuong: item.soLuong || 0,
                        soLuongXuat: 1,
                        soLuongDaBanGiao: 0,
                        ghiChu: "",
                        hienTrang: item.hienTrang || "Đang sử dụng",
                        moTa: item.moTa || "",
                        isActive: true,
                        namSanXuat: item.namSanXuat || "",
                        kyHieu: item.kyHieu || "",
                        soKyHieu: item.soKyHieu || "",
                      }));

                    if (newItems.length > 0) {
                      formik.setFieldValue("chiTietDieuDongCCDCVatTuDTOS", [
                        ...formik.values.chiTietDieuDongCCDCVatTuDTOS,
                        ...newItems,
                      ]);
                    } else {
                      alert(
                        "Không tìm thấy dữ liệu hợp lệ mới nào từ file. Hoặc tất cả công cụ/dụng cụ đã có trong danh sách.",
                      );
                    }
                  }}
                />
              </Box>
              <Table
                size="small"
                sx={{
                  "& .MuiTableCell-root": { borderBottom: "1px solid #e0e0e0" },
                }}
              >
                <TableHead>
                  <TableRow>
                    <CustomTableHeadCell width="25%">
                      CCDC Vật tư
                    </CustomTableHeadCell>
                    <CustomTableHeadCell width="15%">
                      Đơn vị tính
                    </CustomTableHeadCell>
                    <CustomTableHeadCell width="15%">
                      Số lượng có sẵn
                    </CustomTableHeadCell>{" "}
                    <CustomTableHeadCell width="15%">
                      Số lượng xuất
                    </CustomTableHeadCell>
                    <CustomTableHeadCell width="20%">
                      Số lượng đã bàn giao
                    </CustomTableHeadCell>
                    <CustomTableHeadCell width="20%">
                      Ghi chú
                    </CustomTableHeadCell>
                    {!readOnly && (
                      <CustomTableHeadCell width="5%"></CustomTableHeadCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(formik.values.chiTietDieuDongCCDCVatTuDTOS || []).map(
                    (row: any, index: number) => {
                      const selectedIdCustoms =
                        formik.values.chiTietDieuDongCCDCVatTuDTOS
                          .filter(
                            (r: any, i: number) => i !== index && r.idCustom,
                          )
                          .map((r: any) => r.idCustom);

                      // Options cho dòng này = list gốc - item đã bị dòng khác chọn
                      const rowData = availableToolItems.filter(
                        (item: any) => !selectedIdCustoms.includes(item.id),
                      );
                      return (
                        <TableRow key={index}>
                          <CustomTableCell>
                            <FieldAutoCompleted
                              title=""
                              labelkey="tenDetailAsset"
                              data={rowData}
                              name={`chiTietDieuDongCCDCVatTuDTOS.${index}.idCustom`}
                              labelOption="idCCDCVatTu"
                              onChange={(value) => {
                                const isDuplicate =
                                  formik.values.chiTietDieuDongCCDCVatTuDTOS.some(
                                    (r: any, i: number) =>
                                      i !== index && r.idCustom === value?.id,
                                  );
                                if (value && isDuplicate) {
                                  alert(
                                    "Vật tư này đã được chọn ở dòng khác. Vui lòng chọn vật tư khác.",
                                  );
                                  return;
                                }
                                // Component FieldAutoCompleted đã tự động lưu value.id vào 'idChiTietCCDCVatTu' ở trên.
                                // Ta cần lưu bù id cha vào 'idCCDCVatTu' để payload gửi xuống backend không bị thiếu.
                                formik.setFieldValue(
                                  `chiTietDieuDongCCDCVatTuDTOS.${index}.idCCDCVatTu`,
                                  value?.idCCDCVatTu || value?.idTaiSan || "",
                                );
                                formik.setFieldValue(
                                  `chiTietDieuDongCCDCVatTuDTOS.${index}.soChungTu`,
                                  value?.soChungTu || "",
                                );
                                formik.setFieldValue(
                                  `chiTietDieuDongCCDCVatTuDTOS.${index}.idChiTietCCDCVatTu`,
                                  value?.idChiTietCCDCVatTu || "",
                                );
                                // Các setFieldValue khác giữ nguyên như cũ của bạn
                                formik.setFieldValue(
                                  `chiTietDieuDongCCDCVatTuDTOS.${index}.donViTinh`,
                                  value?.donViTinh || "",
                                );
                                formik.setFieldValue(
                                  `chiTietDieuDongCCDCVatTuDTOS.${index}.soLuong`,
                                  value?.soLuong || 0,
                                );
                                formik.setFieldValue(
                                  `chiTietDieuDongCCDCVatTuDTOS.${index}.tenCCDCVatTu`,
                                  value?.tenDetailAsset || "",
                                );
                                formik.setFieldValue(
                                  `chiTietDieuDongCCDCVatTuDTOS.${index}.namSanXuat`,
                                  value?.namSanXuat || "",
                                );
                                formik.setFieldValue(
                                  `chiTietDieuDongCCDCVatTuDTOS.${index}.kyHieu`,
                                  value?.kyHieu || "",
                                );
                                formik.setFieldValue(
                                  `chiTietDieuDongCCDCVatTuDTOS.${index}.soKyHieu`,
                                  value?.soKyHieu || "",
                                );
                              }}
                              limitOptions={20}
                              disabled={readOnly}
                            />
                          </CustomTableCell>

                          <CustomTableCell>
                            <FieldInput
                              title=""
                              name={`chiTietDieuDongCCDCVatTuDTOS.${index}.donViTinh`}
                              disabled={true}
                              compactError
                            />
                          </CustomTableCell>

                          <CustomTableCell>
                            <FieldInput
                              title=""
                              type="number"
                              name={`chiTietDieuDongCCDCVatTuDTOS.${index}.soLuong`}
                              disabled={true}
                              compactError
                            />
                          </CustomTableCell>

                          <CustomTableCell>
                            <FieldInput
                              title=""
                              type="number"
                              name={`chiTietDieuDongCCDCVatTuDTOS.${index}.soLuongXuat`}
                              disabled={readOnly}
                              compactError
                            />
                          </CustomTableCell>
                          <CustomTableCell>
                            <FieldInput
                              title=""
                              type="number"
                              name={`chiTietDieuDongCCDCVatTuDTOS.${index}.soLuongDaBanGiao`}
                              disabled={true}
                            />
                          </CustomTableCell>

                          <CustomTableCell>
                            <FieldInput
                              title=""
                              name={`chiTietDieuDongCCDCVatTuDTOS.${index}.ghiChu`}
                              disabled={readOnly}
                            />
                          </CustomTableCell>

                          {!readOnly && (
                            <CustomTableCell align="center">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => {
                                  const newTools = [
                                    ...formik.values
                                      .chiTietDieuDongCCDCVatTuDTOS,
                                  ];
                                  newTools.splice(index, 1);
                                  formik.setFieldValue(
                                    "chiTietDieuDongCCDCVatTuDTOS",
                                    newTools,
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
                <Box mt={2}>
                  <Button
                    startIcon={<Add />}
                    variant="text"
                    onClick={() => {
                      formik.setFieldValue("chiTietDieuDongCCDCVatTuDTOS", [
                        ...formik.values.chiTietDieuDongCCDCVatTuDTOS,
                        {
                          idCCDCVatTu: "",
                          donViTinh: "",
                          soLuong: 0,
                          soLuongXuat: 0,
                          ghiChu: "",
                          hienTrang: "",
                          moTa: "",
                          isActive: true,
                          soLuongDaBanGiao: 0,
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
      </Box>
    </FormikProvider>
  );
});
