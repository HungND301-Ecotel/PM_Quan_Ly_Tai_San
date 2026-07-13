import {
  Box,
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
import { InspectionRecordData } from "../../types";
import { formatted } from "../../../../utils/helpers";

export default function InspectionRecordPreview({ data }: { data: any }) {
  return (
    <Box
      sx={{
        fontFamily: "serif",
        fontSize: "0.875rem",
        lineHeight: 1.8,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 3,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ textAlign: "left" }}>
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
            sx={{ textTransform: "uppercase", textDecoration: "underline" }}
          >
            {data?.congTy || currentBrandConfig.company}
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
        variant="subtitle2"
        align="center"
        fontWeight={700}
        display="block"
        sx={{ color: "primary.main", mb: 0.5 }}
      >
        BIÊN BẢN
      </Typography>
      <Typography
        variant="subtitle2"
        align="center"
        fontWeight={700}
        display="block"
        sx={{ mb: 2, textTransform: "uppercase" }}
      >
        {data?.tenMauBienBan ||
          "GIÁM ĐỊNH KỸ THUẬT VÀ BÀN GIAO THIẾT BỊ VÀO SỬA CHỮA"}
      </Typography>
      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        Hôm nay, vào hồi {new Date(data?.ngayGiamDinh).getHours()} giờ{" "}
        {new Date(data?.ngayGiamDinh).getMinutes()} phút, ngày{" "}
        {formatted(data?.ngayGiamDinh)}. Tại:{" "}
        {data?.donViGiamDinh || "……………………………"}
      </Typography>
      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        Chúng tôi gồm:
      </Typography>
      <Box sx={{ pl: 2, mb: 1 }}>
        {data?.nguoiKyList?.map((s: any, i: number) => (
          <Box key={i} sx={{ display: "flex", gap: 3, mb: 0.25 }}>
            <Typography variant="caption" sx={{ minWidth: 16 }}>
              {i + 1}.
            </Typography>
            <Typography
              variant="caption"
              sx={{ minWidth: 140, fontWeight: 500 }}
            >
              Ông: {s.userName || "………………………"}
            </Typography>
            <Typography variant="caption" sx={{ minWidth: 120 }}>
              Chức vụ: {s.positionName || "………………………"}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" display="block" sx={{ mb: 1 }}>
        Cùng kiểm tra tình trạng kỹ thuật thiết bị:{" "}
        {data?.danhSachChiTiet.map((e: any) => e.tenTaiSan).join(", ")} trước
        khi vào bảo dưỡng các cấp và bàn giao bộ phận sửa chữa với tình trạng kỹ
        thuật với nội dung sửa chữa sau:
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 1.5 }}>
        <Table size="small" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell
                rowSpan={2}
                sx={{ fontWeight: 700, width: 45, fontSize: "0.75rem" }}
              >
                TT
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{ fontWeight: 700, fontSize: "0.75rem" }}
              >
                Tên chi tiết/Nội dung công việc
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{ fontWeight: 700, width: 50, fontSize: "0.75rem" }}
              >
                ĐVT
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{ fontWeight: 700, width: 40, fontSize: "0.75rem" }}
              >
                SL
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{ fontWeight: 700, fontSize: "0.75rem" }}
              >
                Tình trạng kỹ thuật
              </TableCell>
              <TableCell
                align="center"
                colSpan={2}
                sx={{ fontWeight: 700, width: 200, fontSize: "0.75rem" }}
              >
                Biện pháp xử lý
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{ fontWeight: 700, width: 90, fontSize: "0.75rem" }}
              >
                Ghi chú
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: 100, fontSize: "0.75rem" }}
              >
                T.Mới
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: 100, fontSize: "0.75rem" }}
              >
                S.Chữa
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.danhSachChiTiet?.map((entry: any, idx: number) => (
              <TableRow key={`row-${idx}`}>
                <TableCell sx={{ fontSize: "0.75rem", align: "center" }}>
                  {idx + 1}
                </TableCell>
                <TableCell sx={{ fontSize: "0.75rem" }}>
                  {entry.noiDungCongViec || `Bảo dưỡng ${entry.tenTaiSan || entry.idTaiSan || "—"}`}
                </TableCell>
                <TableCell sx={{ fontSize: "0.75rem" }}>
                  {entry.donViTinh || "—"}
                </TableCell>
                <TableCell sx={{ fontSize: "0.75rem" }}>
                  {entry.soLuong}
                </TableCell>
                <TableCell sx={{ fontSize: "0.75rem" }}>
                  {entry.tinhTrang}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: "0.75rem" }}>
                  {entry.thayMoi || ""}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: "0.75rem" }}>
                  {entry.suaChua || ""}
                </TableCell>
                <TableCell sx={{ fontSize: "0.75rem" }}>
                  {entry.ghiChu}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" display="block" sx={{ mb: 1.5 }}>
        Các nội dung cần thống nhất khác: {data?.noiDung || "Không"}
      </Typography>
      <Typography variant="caption" display="block" sx={{ mb: 2 }}>
        Biên bản lập xong hồi {new Date(data?.ngayGiamDinh).getHours()} giờ{" "}
        {new Date(data?.ngayGiamDinh).getMinutes()} phút cùng ngày. Đã được mọi
        người nhất trí thông qua.
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent:
            data.nguoiKyList.length === 1 ? "flex-end" : "space-around",
          gap: 1,
        }}
      >
        {(() => {
          const sorted = [...(data?.nguoiKyList || [])].sort(
            (a, b) => (a.order || 0) - (b.order || 0),
          );
          const cols = sorted.map((s) => ({
            label: (s.positionName || "").toUpperCase(),
            signer: s,
          }));

          if (cols.length === 0) {
            return (
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography variant="caption" color="text.disabled">
                  Chưa có người duyệt
                </Typography>
              </Box>
            );
          }

          return cols.map((col, idx) => (
            <Box
              key={idx}
              sx={{
                flex: data.nguoiKyList.length === 1 ? "0 0 auto" : 1,
                textAlign: "center",
                width: data.nguoiKyList.length === 1 ? "auto" : undefined,
                minWidth: data.nguoiKyList.length === 1 ? "150px" : undefined,
              }}
            >
              <Typography
                fontWeight={700}
                display="block"
                sx={{ textTransform: "uppercase", mb: 0.5 }}
              >
                {col.label}
              </Typography>

              <Box
                sx={{
                  mt: 6,
                  width: "70%",
                  mx: "auto",
                  mb: 0.5,
                }}
              />
              {col.signer ? (
                <>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    display="block"
                  >
                    {col.signer.userName}
                  </Typography>
                </>
              ) : (
                <Typography variant="caption" color="text.disabled">
                  Chưa chọn
                </Typography>
              )}
            </Box>
          ));
        })()}
      </Box>
    </Box>
  );
}
