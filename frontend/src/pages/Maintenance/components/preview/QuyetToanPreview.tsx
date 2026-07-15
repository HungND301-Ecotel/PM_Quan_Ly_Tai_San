import {
  Box,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { currentBrandConfig } from "../../../../config/brandConfig";
import dayjs from "dayjs";
import numberToWords from "../../../../utils/numberToWords";
import { formatted } from "../../../../utils/helpers";

export default function QuyetToanPreview({ formik }: { formik?: any }) {
  const d = new Date();
  
  const totalAmount = formik?.values.danhSachChiTiet?.reduce((acc: number, item: any) => acc + (Number(item.thanhTien) || 0), 0) || 0;

  return (
    <Box
      sx={{
        mt: 3,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 4,
        fontFamily: "serif",
        fontSize: "0.875rem",
        lineHeight: 1.8,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="caption" display="block">
            {currentBrandConfig.company}
          </Typography>
          <Typography
            variant="caption"
            display="block"
            fontWeight={700}
            sx={{ textDecoration: "underline", textTransform: "uppercase" }}
          >
            PX: {formik?.values.tenDonVi || "………………………"}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="caption" display="block" fontWeight={700}>
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </Typography>
          <Typography variant="caption" display="block" fontWeight={700}>
            <u>Độc lập – Tự do – Hạnh phúc</u>
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="subtitle1"
        align="center"
        fontWeight={700}
        sx={{ mb: 0.25 }}
      >
        QUYẾT TOÁN
      </Typography>
      <Typography
        variant="subtitle2"
        align="center"
        fontWeight={700}
        sx={{ mb: 3, textTransform: "uppercase" }}
      >
        CÔNG TRÌNH SỬA CHỮA {formik?.values.tenCapSuaChua || "THƯỜNG XUYÊN"}
      </Typography>

      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        Tên thiết bị/công trình: {formik?.values.tenTaiSan || "………………………"}
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption">
          Thuộc đơn vị: {formik?.values.tenDonVi || "………………………"}
        </Typography>
        <Typography variant="caption">
          Cấp sửa chữa: {formik?.values.tenCapSuaChua || "………………………"}
        </Typography>
      </Box>

      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        Sửa chữa tại: {formik?.values.diaDiemSuaChua || "………………………"}
      </Typography>
      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        Căn cứ:
      </Typography>
      <Box sx={{ pl: 2, mb: 1.5 }}>
        <Typography variant="caption" display="block">
          - Phiếu giao việc số: {formik?.values.soPhieuGiaoViec || "………………………"}
        </Typography>
        <Typography variant="caption" display="block">
          - Biên bản nghiệm thu và bàn giao{" "}
          {formatted(formik?.values.ngayNghiemThu)}
        </Typography>
      </Box>

      <Typography variant="caption" display="block" sx={{ mb: 1.5 }}>
        Chúng tôi thống nhất quyết toán công trình sửa chữa với nội dung sau:
      </Typography>

      <Typography
        variant="caption"
        display="block"
        fontWeight={700}
        sx={{ mb: 0.5 }}
      >
        TỔNG HỢP QUYẾT TOÁN:
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 1.5 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 700,
                  width: 40,
                  border: "1px solid #ccc",
                  textAlign: "center",
                }}
              >
                STT
              </TableCell>
              <TableCell
                colSpan={2}
                sx={{
                  fontWeight: 700,
                  border: "1px solid #ccc",
                  textAlign: "center",
                }}
              >
                Phiếu vật tư
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 700,
                  border: "1px solid #ccc",
                  textAlign: "center",
                }}
              >
                Các yếu tố
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 700,
                  width: 70,
                  border: "1px solid #ccc",
                  textAlign: "center",
                }}
              >
                Số lượng
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 700,
                  width: 90,
                  border: "1px solid #ccc",
                  textAlign: "center",
                }}
              >
                Đơn giá
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 700,
                  width: 100,
                  border: "1px solid #ccc",
                  textAlign: "center",
                }}
              >
                Thành tiền
                <br />
                (đ)
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 700,
                  width: 80,
                  border: "1px solid #ccc",
                  textAlign: "center",
                }}
              >
                Ghi chú
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 700,
                  width: 80,
                  border: "1px solid #ccc",
                  textAlign: "center",
                }}
              >
                Số phiếu
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  width: 90,
                  border: "1px solid #ccc",
                  textAlign: "center",
                }}
              >
                Ngày tháng
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formik?.values.danhSachChiTiet?.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell
                  sx={{ border: "1px solid #ccc", textAlign: "center" }}
                >
                  {idx + 1}
                </TableCell>
                {idx === 0 && (
                  <>
                    <TableCell
                      rowSpan={formik?.values.danhSachChiTiet.length}
                      sx={{
                        border: "1px solid #ccc",
                        textAlign: "center",
                        fontWeight: 700,
                      }}
                    >
                      {formik?.values.soPhieuVatTu}
                    </TableCell>
                    <TableCell
                      rowSpan={formik?.values.danhSachChiTiet.length}
                      sx={{
                        border: "1px solid #ccc",
                        textAlign: "center",
                        fontWeight: 700,
                      }}
                    >
                      {formik?.values.ngayLinhVatTu
                        ? dayjs(formik.values.ngayLinhVatTu).format(
                            "DD/MM/YYYY",
                          )
                        : ""}
                    </TableCell>
                  </>
                )}
                <TableCell sx={{ border: "1px solid #ccc" }}>
                  {item.tenVatTu}
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", textAlign: "center" }}
                >
                  {item.soLuong}
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", textAlign: "right" }}
                >
                  {Number(item.donGia || 0).toLocaleString()}
                </TableCell>
                <TableCell
                  sx={{ border: "1px solid #ccc", textAlign: "right" }}
                >
                  {Number(item.thanhTien || 0).toLocaleString()}
                </TableCell>
                <TableCell sx={{ border: "1px solid #ccc" }}>
                  {item.ghiChu}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell
                colSpan={6}
                sx={{
                  border: "1px solid #ccc",
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                Tổng cộng
              </TableCell>
              <TableCell
                sx={{
                  border: "1px solid #ccc",
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {totalAmount.toLocaleString()}
              </TableCell>
              <TableCell sx={{ border: "1px solid #ccc" }}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography
        variant="caption"
        display="block"
        sx={{ mb: 4, fontStyle: "italic" }}
      >
        Viết bằng chữ: {numberToWords(totalAmount)} đồng chẵn./.
      </Typography>

      <Box
        sx={{
          mt: 4,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 2,
          textAlign: "center",
        }}
      >
        {formik?.values.nguoiKyList?.map((s: any, idx: number) => {
          const title = idx === 0 ? "NGƯỜI LẬP" : (s.departmentName || s.donVi || s.position || "ĐẠI DIỆN ĐƠN VỊ").toUpperCase();
          return (
            <Box key={idx} sx={{ mb: 4 }}>
              <Typography
                variant="caption"
                fontWeight={700}
                display="block"
                sx={{ mb: 8 }}
              >
                {title}
              </Typography>
              <Typography variant="caption" fontWeight={700} display="block">
                {s.userName || s.hoTen || ""}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
