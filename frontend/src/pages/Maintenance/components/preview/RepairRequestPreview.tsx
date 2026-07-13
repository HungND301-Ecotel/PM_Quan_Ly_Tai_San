import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { currentBrandConfig } from "../../../../config/brandConfig";
import dayjs from "dayjs";
import { findById, formatted } from "../../../../utils/helpers";

interface Props {
  data: any;
  repairLevels?: any[];
  departments?: any[];
  tieude?: string;
  congty?: string;
}

const RepairRequestPreview = ({
  data,
  repairLevels = [],
  departments = [],
  tieude,
  congty,
}: Props) => {
  const donViQuanLy =
    findById(departments, data?.donViQuanLy)?.tenPhongBan || "";
  const donViGiamSat =
    findById(departments, data?.donViGiamSat)?.tenPhongBan || "";

  const loaiSC = findById(repairLevels, data?.loaiSuaChua)?.ten || "";

  const signers = data?.nguoiKyList || [];

  // Format Thiết bị/BKS
  console.log(data?.danhSachTaiSan);
  const dsTaiSan = data?.danhSachTaiSan || [];
  const thietBiBKS = dsTaiSan.map((ts: any) => ts.tenTaiSan).join("; ");

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, mt: 2, fontFamily: '"Times New Roman", serif' }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ textAlign: "center", flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "inherit",
              textTransform: "uppercase",
            }}
          >
            {data?.congTy || currentBrandConfig.company}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center", flex: 1 }}>
          <Typography
            sx={{ fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}
          >
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "inherit",
              textDecoration: "underline",
            }}
          >
            Độc lập - Tự do - Hạnh phúc
          </Typography>
        </Box>
      </Box>

      {/* Title */}
      <Typography
        sx={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: 16,
          mt: 4,
          mb: 3,
          color: "#000",
          fontFamily: "inherit",
          textTransform: "uppercase",
        }}
      >
        {data?.tenMauBienBan || "LỆNH SỬA CHỮA"}
      </Typography>

      {/* Information Table */}
      <TableContainer sx={{ mb: 2 }}>
        <Table
          size="small"
          sx={{
            "& th, & td": {
              fontSize: 13,
              fontFamily: '"Times New Roman", serif',
              border: "1px solid #000",
              py: 0.5,
              px: 1,
            },
          }}
        >
          <TableBody>
            <TableRow>
              <TableCell sx={{ width: "200px" }}>
                Đơn vị quản lý thiết bị
              </TableCell>
              <TableCell>{donViQuanLy || ""}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Thiết bị/BKS</TableCell>
              <TableCell>{thietBiBKS}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Ngày SCBD gần nhất</TableCell>
              <TableCell>
                {data?.ngayBaoDuongGanNhat
                  ? dayjs(data?.ngayBaoDuongGanNhat).format("DD/MM/YYYY")
                  : ""}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Giờ/km hoạt động</TableCell>
              <TableCell>{data?.gioHoatDong || ""}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Nội dung SC/BD</TableCell>
              <TableCell>{loaiSC || ""}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tình trạng kỹ thuật</TableCell>
              <TableCell>{data?.tinhTrang || ""}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Section 1: Vật tư */}
      <Typography
        sx={{ fontSize: 13, fontWeight: 700, mb: 1, fontFamily: "inherit" }}
      >
        1. Vật tư, vật liệu:
      </Typography>
      <TableContainer sx={{ mb: 2 }}>
        <Table
          size="small"
          sx={{
            "& th, & td": {
              fontSize: 13,
              fontFamily: '"Times New Roman", serif',
              border: "1px solid #000",
              py: 0.5,
              px: 1,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 700, width: "50px" }}>
                Stt
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: "200px" }}
              >
                Mã vật tư
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Tên vật tư
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, width: "80px" }}>
                ĐVT
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, width: "80px" }}>
                SL
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Ghi chú
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.danhSachVatTu || []).length === 0 ? (
              <TableRow>
                <TableCell
                  align="center"
                  colSpan={6}
                  sx={{ fontStyle: "italic", color: "#666" }}
                >
                  Chưa có vật tư
                </TableCell>
              </TableRow>
            ) : (
              (data?.danhSachVatTu || []).map((vt: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell align="center">{idx + 1}</TableCell>
                  <TableCell align="center">{vt.idVatTu || ""}</TableCell>
                  <TableCell>{vt.tenVatTu || ""}</TableCell>
                  <TableCell align="center">{vt.donViTinh || ""}</TableCell>
                  <TableCell align="center">{vt.soLuong || ""}</TableCell>
                  <TableCell>{vt.ghiChu || ""}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Section 2: Nhân công */}
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          mb: 0.5,
          mt: 3,
          fontFamily: "inherit",
        }}
      >
        2. Nhân công thực hiện:
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          mb: 2,
          ml: 2,
          fontFamily: "inherit",
          whiteSpace: "pre-line",
        }}
      >
        - {data?.nhanCongThucHien || "Không"}
      </Typography>

      {/* Section 3: Thời gian, địa điểm */}
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          mb: 0.5,
          mt: 3,
          fontFamily: "inherit",
        }}
      >
        3. Thời gian, địa điểm thực hiện:
      </Typography>
      <Typography sx={{ fontSize: 13, mb: 0.5, ml: 2, fontFamily: "inherit" }}>
        - Thời gian:{" "}
        {data?.thoiGian ? dayjs(data?.thoiGian).format("DD/MM/YYYY") : ""}
      </Typography>
      <Typography sx={{ fontSize: 13, mb: 1, ml: 2, fontFamily: "inherit" }}>
        - Địa điểm: {data?.diaDiem || ""}
      </Typography>

      {/* Yêu cầu */}
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          mb: 0.5,
          ml: 2,
          textDecoration: "underline",
          fontFamily: "inherit",
        }}
      >
        *. Yêu cầu:
      </Typography>
      <Typography sx={{ fontSize: 13, mb: 0.5, ml: 4, fontFamily: "inherit" }}>
        1. Chấp hành đầy đủ nội quy, quy trình, quy phạm KT - AT, trong quá
        trình SCBD phải đảm bảo an toàn tuyệt đối cho người, thiết bị.
      </Typography>
      <Typography sx={{ fontSize: 13, mb: 0.5, ml: 4, fontFamily: "inherit" }}>
        2. {donViQuanLy || "..."} căn cứ nội dung làm các thủ tục lĩnh vật tư để
        phục vụ SCBD;
      </Typography>
      <Typography sx={{ fontSize: 13, mb: 2, ml: 4, fontFamily: "inherit" }}>
        3. {donViGiamSat || "..."} thực hiện nghiệm thu sau sửa chữa, lập biên
        bản nghiệm thu (nếu có).
      </Typography>

      <Typography textAlign={"right"} fontSize={14}>
        Quảng Ninh, {formatted(data?.ngayTao)}
      </Typography>

      {/* Signatures */}
      <Box
        sx={{ mt: 4, display: "flex", justifyContent: "space-between", gap: 2 }}
      >
        {(() => {
          const sorted = [...(signers || [])].sort(
            (a, b) => (a.order || 0) - (b.order || 0),
          );
          const cols = sorted.map((s, idx) => ({
            label:
              idx === 0
                ? "Người lập"
                : idx === sorted.length - 1
                  ? "Phê duyệt"
                  : (s.departmentName || "").toUpperCase(),
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
            <Box key={idx} sx={{ flex: 1, textAlign: "center" }}>
              <Typography
                variant="caption"
                fontWeight={700}
                display="block"
                sx={{ textTransform: "uppercase", mb: 8 }}
              >
                {col.signer?.departmentName}
              </Typography>
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
    </Paper>
  );
};

export default RepairRequestPreview;
