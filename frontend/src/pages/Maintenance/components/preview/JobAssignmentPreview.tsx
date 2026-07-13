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
import { JobAssignmentData } from "../../types";
import { formatted } from "../../../../utils/helpers";

interface Props {
  data: JobAssignmentData;
  apiDepartments?: any[];
  apiUsers?: any[];
}

const JobAssignmentPreview = ({ data, apiDepartments = [], apiUsers = [] }: Props) => {
  // Format dates
  const ngayBatDauFormatted = data?.ngayBatDau
    ? dayjs(data.ngayBatDau)
    : dayjs();

  const dsTaiSan = data?.danhSachTaiSan || [];
  const thietBiBKS = dsTaiSan.map((ts: any) => ts.tenTaiSan).join("; ");

  const donViInfo = apiDepartments.find(d => d.id === data?.donViQuanLy);
  const tenDonVi = donViInfo?.tenPhongBan || data?.tenDonViQuanLy || data?.donViQuanLy || "...................................................";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 4,
        mt: 2,
        fontFamily: '"Times New Roman", serif',
        backgroundColor: "#fff",
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "inherit",
            textTransform: "uppercase",
          }}
        >
          {currentBrandConfig.company}
        </Typography>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "inherit",
          }}
        >
          Đơn vị:{" "}
          {tenDonVi}
        </Typography>
      </Box>

      {/* Title */}
      <Typography
        sx={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: 18,
          mt: 4,
          mb: 1,
          color: "#000",
          fontFamily: "inherit",
          textTransform: "uppercase",
        }}
      >
        PHIẾU GIAO VIỆC
      </Typography>
      <Typography
        sx={{
          textAlign: "center",
          fontSize: 14,
          mb: 3,
          fontFamily: "inherit",
        }}
      >
        Số phiếu: {data?.soPhieu || "........................"}
      </Typography>

      {/* Intro info */}
      <Typography sx={{ fontSize: 14, mb: 1, fontFamily: "inherit" }}>
        Ca {data?.caBatDau || "..."} {formatted(data?.ngayBatDau)}.
      </Typography>
      <Typography sx={{ fontSize: 14, mb: 1, fontFamily: "inherit" }}>
        Phân xưởng giao cho: Tổ sửa chữa thực hiện các công việc sau.
      </Typography>
      <Typography sx={{ fontSize: 14, mb: 3, fontFamily: "inherit" }}>
        Bảo dưỡng thiết bị:{" "}
        {thietBiBKS ||
          "..................................................................................."}
      </Typography>

      {/* Section I: Nội dung công việc */}
      <Typography
        sx={{ fontSize: 14, fontWeight: 700, mb: 1, fontFamily: "inherit" }}
      >
        I. Nội dung công việc:
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table
          size="small"
          sx={{
            "& th, & td": {
              fontSize: 13,
              fontFamily: '"Times New Roman", serif',
              border: "1px solid #000",
              py: 1,
              px: 1,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 700, width: "50px" }}>
                TT
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: "120px" }}
              >
                Mã công việc
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Nội dung công việc
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: "150px" }}
              >
                Đại diện nhóm người TH
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: "100px" }}
              >
                Ký nhận việc
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dsTaiSan.length === 0 ? (
              <TableRow>
                <TableCell
                  align="center"
                  colSpan={5}
                  sx={{ fontStyle: "italic", color: "#666" }}
                >
                  Chưa có nội dung công việc
                </TableCell>
              </TableRow>
            ) : (
              dsTaiSan.map((ts, idx) => {
                const userInfo = apiUsers.find(u => u.id === ts.nguoiThucHien);
                const tenNguoiTH = userInfo?.hoTen || ts.tenNguoiThucHien || ts.nguoiThucHien || "";
                return (
                  <TableRow key={idx}>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell align="center">{ts.maCongViec || ""}</TableCell>
                    <TableCell>{ts.noiDung || ts.tenTaiSan || ""}</TableCell>
                    <TableCell align="center">{tenNguoiTH}</TableCell>
                    <TableCell align="center"></TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Section II: Vật tư */}
      <Typography
        sx={{ fontSize: 14, fontWeight: 700, mb: 1, fontFamily: "inherit" }}
      >
        II. Vật tư:
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table
          size="small"
          sx={{
            "& th, & td": {
              fontSize: 13,
              fontFamily: '"Times New Roman", serif',
              border: "1px solid #000",
              py: 1,
              px: 1,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 700, width: "50px" }}>
                TT
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: "120px" }}
              >
                Mã số vật tư
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Tên vật tư
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: "120px" }}
              >
                Mã hiệu, quy cách
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, width: "80px" }}>
                ĐVT
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, width: "80px" }}>
                Số lượng
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, width: "100px" }}
              >
                Ghi chú
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.danhSachVatTu || []).length === 0 ? (
              <TableRow>
                <TableCell
                  align="center"
                  colSpan={7}
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
                  <TableCell align="center">{vt.kyHieu || ""}</TableCell>
                  <TableCell align="center">{vt.donViTinh || ""}</TableCell>
                  <TableCell align="center">{vt.soLuong || ""}</TableCell>
                  <TableCell>{vt.ghiChu || ""}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer Info */}
      <Typography sx={{ fontSize: 14, mb: 1, fontFamily: "inherit" }}>
        Dự kiến thời gian hoàn thành ca {data?.caDuKien || "..."}{" "}
        {formatted(data?.ngayDuKien)}.
      </Typography>
      <Typography sx={{ fontSize: 14, mb: 1, fontFamily: "inherit" }}>
        Người lao động làm các công việc trên phải thực hiện đầy đủ các quy
        trình kỹ thuật và các biện pháp đảm bảo an toàn.
      </Typography>


      {/* Signatures */}
      <Box
        sx={{ mt: 2, display: "flex", justifyContent: "space-between", gap: 2 }}
      >
        {(() => {
          const signers = data?.nguoiKyList || [];
          const sorted = [...signers].sort(
            (a, b) => (a.order || 0) - (b.order || 0),
          );
          const cols = sorted.map((s, idx) => ({
            label:
              idx === 0
                ? "Người giao việc"
                : idx === 1
                  ? "Người nhận việc"
                  : (s.position || "Phê duyệt"),
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
                {col.label}
              </Typography>
              {col.signer ? (
                <>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    display="block"
                  >
                    {col.signer.userName || col.signer.hoTen}
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

export default JobAssignmentPreview;
