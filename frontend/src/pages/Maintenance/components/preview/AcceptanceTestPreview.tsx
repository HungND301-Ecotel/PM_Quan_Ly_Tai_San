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

interface Props {
  data: any;
  apiDepartments?: any[];
  apiUsers?: any[];
  tieude?: string;
  congty?: string;
}

const AcceptanceTestPreview = ({
  data,
  apiDepartments = [],
  tieude,
  congty,
}: Props) => {
  const dsVatTu = data?.danhSachVatTu || [];
  const dsTaiSan = data?.danhSachTaiSan || [];

  const donViInfo = apiDepartments.find((d) => d.id === data?.donViQuanLy);
  const tenDonVi =
    donViInfo?.tenPhongBan ||
    data?.donViQuanLy ||
    "...................................................";

  const dateStr = data?.ngayTao || dayjs().format("YYYY-MM-DD HH:mm");
  const parsedDate = dayjs(dateStr);
  const hour = parsedDate.isValid() ? parsedDate.format("HH") : "....";
  const minute = parsedDate.isValid() ? parsedDate.format("mm") : "....";
  const day = parsedDate.isValid() ? parsedDate.format("DD") : "....";
  const month = parsedDate.isValid() ? parsedDate.format("MM") : "....";
  const year = parsedDate.isValid() ? parsedDate.format("YYYY") : "........";

  const companyName = (
    currentBrandConfig.company || "CÔNG TY KHO VẬN VÀ CẢNG CẨM PHẢ - VINACOMIN"
  ).toUpperCase();
  let compLine1 = companyName;
  let compLine2 = "";
  const words = companyName.split(" ");
  if (words.length > 6) {
    compLine1 = words.slice(0, 6).join(" ");
    compLine2 = words.slice(6).join(" ");
  }

  const danhSachThietBi = dsTaiSan.map((ts: any) => ts.tenTaiSan).join(", ");

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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ textAlign: "center", width: "40%" }}>
          <Typography
            sx={{
              fontSize: 13,
              fontFamily: "inherit",
              textTransform: "uppercase",
            }}
          >
            TẬP ĐOÀN CN THAN
            <br />
            KHOÁNG SẢN - VIỆT NAM
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "inherit",
              textTransform: "uppercase",
            }}
          >
            {compLine1}
            {compLine2 && (
              <>
                <br />
                {compLine2}
              </>
            )}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "center", width: "50%" }}>
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
            }}
          >
            Độc lập – Tự do – Hạnh phúc
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
          color: "#000",
          fontFamily: "inherit",
        }}
      >
        BIÊN BẢN
      </Typography>
      <Typography
        sx={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: 16,
          mb: 2,
          color: "#000",
          fontFamily: "inherit",
        }}
      >
        NGHIỆM THU CHẠY THỬ VÀ BÀN GIAO THIẾT BỊ
        <br />
        SAU SỬA CHỮA/BẢO DƯỠNG
      </Typography>

      <Typography
        sx={{ fontSize: 14, mb: 2, fontFamily: "inherit", textIndent: 30 }}
      >
        Hôm nay, ngày {day} tháng {month} năm {year}. Tại {tenDonVi}.
      </Typography>

      {/* Signers list */}
      <Typography sx={{ fontSize: 14, mb: 1, fontFamily: "inherit" }}>
        Chúng tôi gồm:
      </Typography>
      {data?.nguoiKyList?.map((signer: any, index: number) => {
        let chucVu =
          signer.chucVu ||
          signer.position ||
          signer.departmentName ||
          "................";
        let hoTen =
          signer.userName || signer.hoTen || "........................";
        return (
          <Box key={index} sx={{ display: "flex", mb: 1, pl: 4 }}>
            <Typography
              sx={{ fontSize: 14, fontFamily: "inherit", width: 300 }}
            >
              {index + 1}. Ông: {hoTen}
            </Typography>
            <Typography sx={{ fontSize: 14, fontFamily: "inherit" }}>
              Chức vụ: {chucVu}
            </Typography>
          </Box>
        );
      })}

      <Typography
        sx={{
          fontSize: 14,
          mt: 2,
          mb: 1,
          fontFamily: "inherit",
          textIndent: 30,
        }}
      >
        Cùng thực hiện nghiệm thu kỹ thuật thiết bị: {danhSachThietBi} sau khi
        vào sửa chữa và bàn giao cho {tenDonVi} quản lý vận hành với các nội
        dung sau.
      </Typography>

      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 700,
          mt: 2,
          mb: 1,
          fontFamily: "inherit",
        }}
      >
        1. Nội dung sửa chữa
      </Typography>
      <Typography
        sx={{ fontSize: 14, mb: 1, fontFamily: "inherit", textIndent: 30 }}
      >
        {data?.noiDungSuaChua ||
          "..................................................."}
      </Typography>

      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 700,
          mt: 2,
          mb: 1,
          fontFamily: "inherit",
        }}
      >
        2. Kết quả kiểm tra, chạy thử
      </Typography>
      <Typography
        sx={{ fontSize: 14, mb: 1, fontFamily: "inherit", textIndent: 30 }}
      >
        {data?.ketQua || "..................................................."}
      </Typography>

      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 700,
          mt: 2,
          mb: 1,
          fontFamily: "inherit",
        }}
      >
        3. Các nội dung được sửa chữa được nghiệm thu:
      </Typography>

      <Typography sx={{ fontSize: 14, mb: 1, fontFamily: "inherit" }}>
        3.1. Khối lượng vật tư được nghiệm thu:
      </Typography>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #000", borderRadius: 0, mb: 3 }}
      >
        <Table
          size="small"
          sx={{
            "& .MuiTableCell-root": {
              border: "1px solid #000",
              fontFamily: "inherit",
              py: 0.5,
              px: 1,
              color: "#000",
            },
            "& .MuiTableCell-head": {
              fontWeight: 700,
              backgroundColor: "transparent",
              textAlign: "center",
              fontSize: 13,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2} width="5%">
                STT
              </TableCell>
              <TableCell rowSpan={2} width="25%">
                Vật tư thay thế
              </TableCell>
              <TableCell rowSpan={2} width="20%">
                Chủng loại, quy cách
              </TableCell>
              <TableCell rowSpan={2} width="10%">
                ĐVT
              </TableCell>
              <TableCell colSpan={2}>Số lượng</TableCell>
              <TableCell rowSpan={2} width="15%">
                Ghi chú
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell width="12%">Thay thế</TableCell>
              <TableCell width="12%">Thu hồi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dsVatTu.map((row: any, index: number) => (
              <TableRow key={index}>
                <TableCell align="center">{index + 1}</TableCell>
                <TableCell>{row.tenVatTu || "................"}</TableCell>
                <TableCell align="center">
                  {row.kyHieu || "................"}
                </TableCell>
                <TableCell align="center">{row.donViTinh || "Cái"}</TableCell>
                <TableCell align="center">{row.soLuongThayThe ?? 0}</TableCell>
                <TableCell align="center">{row.soLuongThuHoi ?? 0}</TableCell>
                <TableCell>{row.ghiChu || ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ fontSize: 14, mb: 1, fontFamily: "inherit" }}>
        3.2. Khối lượng công việc được nghiệm thu:
      </Typography>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #000", borderRadius: 0, mb: 3 }}
      >
        <Table
          size="small"
          sx={{
            "& .MuiTableCell-root": {
              border: "1px solid #000",
              fontFamily: "inherit",
              py: 0.5,
              px: 1,
              color: "#000",
            },
            "& .MuiTableCell-head": {
              fontWeight: 700,
              backgroundColor: "transparent",
              textAlign: "center",
              fontSize: 13,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell width="5%">STT</TableCell>
              <TableCell width="20%">Mã công việc</TableCell>
              <TableCell width="45%">Nội dung công việc</TableCell>
              <TableCell width="10%">Số lượng</TableCell>
              <TableCell width="20%">Ghi chú</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dsTaiSan.map((row: any, index: number) => (
              <TableRow key={index}>
                <TableCell align="center">{index + 1}</TableCell>
                <TableCell align="center">{row.maCongViec || ""}</TableCell>
                <TableCell>{row.noiDung || ""}</TableCell>
                <TableCell align="center">{row.soLuong ?? 1}</TableCell>
                <TableCell>{row.ghiChu || ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography
        sx={{
          fontSize: 14,
          mt: 3,
          mb: 3,
          fontFamily: "inherit",
          textIndent: 30,
        }}
      >
        Biên bản được lập xong lúc {hour} giờ {minute} phút cùng ngày, đã được
        các thành viên nhất trí thông qua.
      </Typography>

      <Typography
        sx={{ fontSize: 14, fontWeight: 700, mb: 3, fontFamily: "inherit" }}
      >
        CÁC THÀNH PHẦN THAM GIA
      </Typography>

      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 3, px: 2, mb: 6 }}
      >
        {data?.nguoiKyList?.map((signer: any, index: number) => {
          let chucVu =
            signer.chucVu ||
            signer.position ||
            signer.departmentName ||
            "................";
          let hoTen =
            signer.userName || signer.hoTen || "........................";
          return (
            <Box
              key={index}
              sx={{ display: "flex", alignItems: "flex-end", gap: 2 }}
            >
              <Typography
                sx={{ fontSize: 14, fontFamily: "inherit", width: 120 }}
              >
                {chucVu}:
              </Typography>
              <Box sx={{ borderBottom: "1px dotted #000",}} />
              <Typography
                sx={{
                  fontSize: 14,
                  fontFamily: "inherit",
                  width: 200,
                  textAlign: "right",
                }}
              >
                {hoTen}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default AcceptanceTestPreview;
