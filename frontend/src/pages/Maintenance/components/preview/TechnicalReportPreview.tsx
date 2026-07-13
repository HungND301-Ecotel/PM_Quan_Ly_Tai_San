import { Box, Typography, Paper } from "@mui/material";
import { currentBrandConfig } from "../../../../config/brandConfig";
import dayjs from "dayjs";
import { formatted } from "../../../../utils/helpers";

interface Props {
  data: any;
  departments: any[];
}

const TechnicalReportPreview = ({ data, departments }: Props) => {
  const dateStr = `Quảng Ninh, ${formatted(data?.ngayTao)}`;
  const execDept = departments.find((d) => d.id === data?.donViNhan);
  const sourceDept = departments.find((d) => d.id === data?.donViBaoCao);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 4,
        mt: 2,
        fontFamily: '"Times New Roman", serif',
        lineHeight: 1.6,
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ textAlign: "center", flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "inherit",
              textTransform: "uppercase",
            }}
          >
            {data?.congty || currentBrandConfig.company}
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "inherit",
              textDecoration: "underline",
              textTransform: "uppercase",
            }}
          >
            {sourceDept?.tenPhongBan || ""}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center", flex: 1 }}>
          <Typography
            sx={{ fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}
          >
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "inherit",
              textDecoration: "underline",
            }}
          >
            Độc lập – Tự do – Hạnh phúc
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{
          textAlign: "right",
          fontStyle: "italic",
          fontSize: 14,
          mb: 4,
          fontFamily: "inherit",
        }}
      >
        {dateStr}
      </Typography>

      {/* Title */}
      <Typography
        sx={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: 18,
          fontFamily: "inherit",
          textTransform: "uppercase",
          mb: 1,
        }}
      >
        {data?.tenMauBienBan ?? "BÁO CÁO TÌNH TRẠNG KỸ THUẬT"}
      </Typography>
      <Typography
        sx={{
          textAlign: "center",
          fontSize: 14,
          mb: 4,
          fontStyle: "italic",
          fontFamily: "inherit",
          fontWeight: 600,
        }}
      >
        Thiết bị: {data?.tenTaiSan || "..."}
      </Typography>

      {/* Content */}
      <Typography sx={{ fontSize: 15, mb: 3, fontFamily: "inherit", px: 6 }}>
        Kính gửi:{" "}
        {execDept?.tenPhongBan ||
          "..................................................."}
      </Typography>

      <Box sx={{ px: 4 }}>
        <Typography sx={{ fontSize: 15, mb: 1, fontFamily: "inherit" }}>
          Căn cứ kế hoạch sửa chữa thường xuyên tháng{" "}
          {data?.thang && data?.thang < 10 ? `0${data?.thang}` : data?.thang}{" "}
          năm {data?.nam}
        </Typography>
        <Typography sx={{ fontSize: 15, mb: 2, fontFamily: "inherit" }}>
          Căn cứ tình trạng Kỹ thuật; giờ hoạt động lũy kế của{" "}
          {data?.tenTaiSan || "..."}
        </Typography>

        <Typography
          sx={{
            fontSize: 15,
            mb: 3,
            fontFamily: "inherit",
            textIndent: "30px",
          }}
        >
          Đơn vị {sourceDept?.tenPhongBan || "..."} báo cáo và đề nghị cho{" "}
          {data?.tenTaiSan || "..."} bảo dưỡng các cấp cụ thể như sau:
        </Typography>

        <Typography sx={{ fontSize: 15, mb: 2, fontFamily: "inherit", pl: 3 }}>
          1. Tên thiết bị: {data?.tenTaiSan || "..."}
        </Typography>

        <Typography sx={{ fontSize: 15, mb: 2, fontFamily: "inherit", pl: 3 }}>
          2. Ngày giờ bảo dưỡng gần nhất:{" "}
          <span style={{ color: "red" }}>
            {data?.ngayBaoDuongGanNhat
              ? dayjs(data?.ngayBaoDuongGanNhat).format("DD/MM/YYYY")
              : "..."}
          </span>
        </Typography>

        <Typography
          sx={{
            fontSize: 15,
            mb: 2,
            fontFamily: "inherit",
            pl: 3,
            textAlign: "justify",
          }}
        >
          3. Tình trạng kỹ thuật: {data?.tinhTrang || "..."}
        </Typography>

        <Typography sx={{ fontSize: 15, mb: 2, fontFamily: "inherit", pl: 3 }}>
          4. Nội dung sửa chữa: {data?.noiDungSuaChua || "..."}
        </Typography>

        <Typography sx={{ fontSize: 15, mb: 4, fontFamily: "inherit" }}>
          Đề nghị {execDept?.tenPhongBan || "Phòng Kỹ thuật"} Công ty kiểm tra,
          xét duyệt./.
        </Typography>
      </Box>

      {/* Chữ ký */}
      <Box
        sx={{
          display: "flex",
          justifyContent:
            data.nguoiKyList.length === 1 ? "flex-end" : "space-around",
          gap: 1,
        }}
      >
        {data.nguoiKyList.map((signer: any, idx: number) => (
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
              variant="caption"
              fontWeight={700}
              display="block"
              sx={{ textTransform: "uppercase", fontSize: "1rem" }}
            >
              {signer.donVi ||
                signer.departmentName ||
                signer.title ||
                "Ký tên"}
            </Typography>
            <Box sx={{ height: "100px" }} />
            <Typography
              variant="caption"
              fontWeight={600}
              display="block"
              sx={{ fontSize: "1rem" }}
            >
              {signer.userName || signer.hoTen || ""}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default TechnicalReportPreview;
