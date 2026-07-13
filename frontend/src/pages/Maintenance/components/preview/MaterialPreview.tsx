import {
  Box,
  Chip,
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

export default function MaterialPreview({
  d,
  formik,
}: {
  d: Date;
  formik?: any;
}) {
  return (
    <Box
      sx={{
        mt: 3,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 2.5,
        fontFamily: "serif",
        fontSize: "0.875rem",
        lineHeight: 1.8,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="caption" display="block">
            TẬP ĐOÀN CÔNG NGHIỆP
          </Typography>
          <Typography variant="caption" display="block">
            THAN – KHOÁNG SẢN VIỆT NAM
          </Typography>
          <Typography
            variant="caption"
            display="block"
            fontWeight={700}
            sx={{ textDecoration: "underline", textTransform: "uppercase" }}
          >
            {currentBrandConfig.company}
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
        variant="caption"
        display="block"
        sx={{ textAlign: "right", fontStyle: "italic", mb: 2 }}
      >
        Quảng Ninh, ngày {d.getDate()} tháng {d.getMonth() + 1} năm{" "}
        {d.getFullYear()}
      </Typography>

      <Typography
        variant="subtitle2"
        align="center"
        fontWeight={700}
        sx={{ color: "primary.main", mb: 0.25 }}
      >
        BIÊN BẢN
      </Typography>
      <Typography
        variant="subtitle2"
        align="center"
        fontWeight={700}
        sx={{ mb: 2, textTransform: "uppercase" }}
      >
        BIÊN BẢN ĐÁNH GIÁ CHẤT LƯỢNG VẬT TƯ THU HỒI
      </Typography>

      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        Căn cứ Quyết định số: <b>{formik?.values.quyetDinhSo || "……………"}</b>
      </Typography>
      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        Căn cứ hồ sơ: <b>{formik?.values.canCuHoSo || "……………"}</b>
      </Typography>
      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        Hôm nay, ngày {d.getDate()} tháng {d.getMonth() + 1} năm{" "}
        {d.getFullYear()}. Tại {formik?.values.diaDiem || "………………………"}
      </Typography>
      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        - Tổ đánh giá vật tư thu hồi gồm:
      </Typography>
      <Box sx={{ pl: 2, mb: 1.5 }}>
        {formik?.values.nguoiKyList?.map((s: any, i: number) => (
          <Box key={i} sx={{ display: "flex", mb: 0.25 }}>
            <Typography variant="caption" sx={{ minWidth: 20 }}>
              {i + 1}
            </Typography>
            <Typography
              variant="caption"
              sx={{ minWidth: 200, fontWeight: 500 }}
            >
              Ông/Bà: {s.userName || "………………………"}
            </Typography>
            <Typography variant="caption" sx={{ minWidth: 200 }}>
              Chức vụ: {s.position || "………………………"}
            </Typography>
          </Box>
        ))}
      </Box>

      <Typography variant="caption" display="block" sx={{ mb: 1.5 }}>
        Đã tiến hành kiểm tra chi tiết các vật tư phụ tùng thu hồi sau sửa chữa
        cụ thể như sau:
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 1.5 }}>
        <Table size="small" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell
                sx={{ fontWeight: 700, width: 40, fontSize: "0.72rem" }}
              >
                STT
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                Tên vật tư, thiết bị
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, width: 45, fontSize: "0.72rem" }}
              >
                ĐVT
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, width: 40, fontSize: "0.72rem" }}
              >
                SL
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                Khối lượng
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                CL còn lại
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                Đơn giá
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                GT còn lại
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, width: 70, fontSize: "0.72rem" }}
              >
                Ghi chú
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formik?.values.danhSachChiTiet.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell sx={{ fontSize: "0.72rem" }}>
                  {String(idx + 1).padStart(2, "0")}
                </TableCell>
                <TableCell sx={{ fontSize: "0.72rem" }}>
                  {item.tenVatTu}
                </TableCell>
                <TableCell sx={{ fontSize: "0.72rem" }}>
                  {item.donViTinh}
                </TableCell>
                <TableCell sx={{ fontSize: "0.72rem" }}>
                  {item.soLuong}
                </TableCell>
                <TableCell sx={{ fontSize: "0.72rem" }}>
                  {item.khoiLuong}
                </TableCell>
                <TableCell sx={{ fontSize: "0.72rem" }}>
                  {item.chatLuongConLai}
                </TableCell>
                <TableCell sx={{ fontSize: "0.72rem" }}>
                  {item.donGia}
                </TableCell>
                <TableCell sx={{ fontSize: "0.72rem" }}>
                  {item.giaTriConLai}
                </TableCell>
                <TableCell sx={{ fontSize: "0.72rem" }}>
                  {item.ghiChu}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ mb: 2 }} />

      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {(() => {
          const sorted = [...(formik?.values.nguoiKyList || [])].sort(
            (a, b) => (a.order || 0) - (b.order || 0),
          );

          if (sorted.length === 0) {
            return (
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography variant="caption" color="text.disabled">
                  Chưa có người duyệt
                </Typography>
              </Box>
            );
          }

          const leader = sorted[0];
          const members = sorted.slice(1);

          return (
            <>
              {/* Leader Column */}
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  display="block"
                  sx={{ mb: 8 }}
                >
                  TỔ TRƯỞNG TỔ ĐÁNH GIÁ
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  display="block"
                >
                  {leader.userName}
                </Typography>
              </Box>

              {/* Members Column */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  display="block"
                  align="center"
                  sx={{ mb: 2 }}
                >
                  THÀNH VIÊN TỔ ĐÁNH GIÁ
                </Typography>
                {members.map((s, idx) => (
                  <Box
                    key={idx}
                    sx={{ display: "flex", mb: 1, px: 2 }}
                  >
                    <Typography variant="caption">
                      {idx + 2}. {s.position}
                    </Typography>
                    <Typography variant="caption">
                      .............. {s.userName}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          );
        })()}
      </Box>
    </Box>
  );
}
