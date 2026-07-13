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
import { formatted } from "../../../../utils/helpers";

interface Props {
  data: any;
  apiDepartments?: any[];
  apiUsers?: any[];
}

const MaterialRequisitionPreview = ({
  data,
  apiDepartments = [],
  apiUsers = [],
}: Props) => {
  const dsVatTu = data?.danhSachVatTu || [];

  const donViInfo = apiDepartments.find((d) => d.id === data?.donViDeNghi);
  const tenDonVi =
    donViInfo?.tenPhongBan ||
    data?.donViDeNghi ||
    "...................................................";

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
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "inherit",
              textTransform: "uppercase",
            }}
          >
            {currentBrandConfig.company}
          </Typography>
          <Typography
            sx={{ fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}
          >
            {tenDonVi}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "center", width: "50%" }}>
          <Typography sx={{ fontSize: 13, fontFamily: "inherit", mb: 1 }}>
            Số phiếu: {data?.soPhieu || "........................"}
          </Typography>
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
          <Typography
            sx={{
              fontStyle: "italic",
              fontSize: 13,
              fontFamily: "inherit",
              mt: 1,
            }}
          >
            Quảng Ninh, {formatted(data?.ngayTao)}
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
          mb: 2,
          color: "#000",
          fontFamily: "inherit",
          textTransform: "uppercase",
        }}
      >
        ĐỀ NGHỊ LĨNH VẬT TƯ CẤP MỚI VÀ TRẢ VẬT TƯ THU HỒI
      </Typography>

      {/* Intro info */}
      <Typography sx={{ fontSize: 14, mb: 1, fontFamily: "inherit" }}>
        - Căn cứ Quyết định {data?.soQuyetDinh || "........."}/QĐ-KVCP, v/v ban
        hành định mức cho các thiết bị cơ điện luồng cảng.
      </Typography>
      <Typography sx={{ fontSize: 14, mb: 2, fontFamily: "inherit" }}>
        - Phân xưởng: {tenDonVi} đề nghị Giám đốc, các phòng chức năng duyệt
        lĩnh các vật tư sau :
      </Typography>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid #000",
          borderRadius: 0,
          mb: 3,
        }}
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
              fontSize: 12,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2} width="5%">
                TT
              </TableCell>
              <TableCell rowSpan={2} width="15%">
                Mã vật tư
              </TableCell>
              <TableCell rowSpan={2} width="20%">
                Tên vật tư
              </TableCell>
              <TableCell rowSpan={2} width="20%">
                Danh điểm, thông số kỹ thuật, số chế tạo hoặc quy cách
              </TableCell>
              <TableCell rowSpan={2} width="8%">
                Đơn vị tính
              </TableCell>
              <TableCell colSpan={2} align="center">
                Số lượng Vật tư cấp mới
              </TableCell>
              <TableCell rowSpan={2} width="12%">
                Mục đích sử dụng
              </TableCell>
              <TableCell rowSpan={2} width="10%">
                Số lượng vật tư thu cũ
              </TableCell>
              <TableCell rowSpan={2} width="10%">
                Ghi chú
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center" width="8%">
                Đề nghị
              </TableCell>
              <TableCell align="center" width="8%">
                Duyệt
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dsVatTu.length > 0 ? (
              dsVatTu.map((row: any, index: number) => (
                <TableRow key={index}>
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell>{row.maVatTu || row.idVatTu}</TableCell>
                  <TableCell>{row.tenVatTu || "Chưa xác định"}</TableCell>
                  <TableCell>
                    {row.kyHieu || row.thongSoKyThuat || "-"}
                  </TableCell>
                  <TableCell align="center">{row.donViTinh || "Cái"}</TableCell>
                  <TableCell align="center">{row.soLuongDeNghi || 0}</TableCell>
                  <TableCell align="center">
                    {row.soLuongDuyet || row.soLuongDeNghi || 0}
                  </TableCell>
                  {index === 0 && (
                    <TableCell
                      rowSpan={dsVatTu.length}
                      sx={{ verticalAlign: "top" }}
                    >
                      {data?.mucDichSuDung || ""}
                    </TableCell>
                  )}
                  <TableCell align="center">{row.soLuongThuCu || 0}</TableCell>
                  {index === 0 && (
                    <TableCell
                      rowSpan={dsVatTu.length}
                      sx={{ verticalAlign: "top" }}
                    >
                      {data?.ghiChu || ""}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={10}
                  align="center"
                  sx={{ py: 3, fontStyle: "italic" }}
                >
                  Chưa có vật tư nào được chọn
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Signatures */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 4,
          px: 2,
        }}
      >
        {data?.nguoiKyList && data.nguoiKyList.length > 0 ? (
          data.nguoiKyList.map((signer: any, index: number) => {
            const isFirst = index === 0;
            // The first signer is "NGƯỜI LẬP", others use their department name or role
            let roleText = isFirst
              ? "NGƯỜI LẬP"
              : signer.departmentName ||
                signer.donVi ||
                signer.tenDonVi ||
                signer.position ||
                signer.chucVu ||
                signer.tenChucVu ||
                "Người ký";

            return (
              <Box
                key={index}
                sx={{
                  textAlign: "center",
                  width: `${100 / data.nguoiKyList.length}%`,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 13,
                    fontFamily: "inherit",
                    textTransform: "uppercase",
                  }}
                >
                  {roleText}
                </Typography>
                <Box sx={{ height: 80 }} /> {/* Space for signature */}
                <Typography
                  sx={{ fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}
                >
                  {signer.userName ||
                    signer.hoTen ||
                    signer.tenNhanVien ||
                    "........................"}
                </Typography>
              </Box>
            );
          })
        ) : (
          <></>
        )}
      </Box>
    </Paper>
  );
};

export default MaterialRequisitionPreview;
