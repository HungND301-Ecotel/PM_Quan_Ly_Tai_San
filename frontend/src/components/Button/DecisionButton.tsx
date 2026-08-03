import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import GavelIcon from "@mui/icons-material/Gavel";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh"; // Icon cho nhập nhanh
import FieldDate from "../TextField/FieldDate";
import dayjs from "dayjs";

export default function DecisionButton({
  data, // data bây giờ là mảng các hàng đã chọn: any[]
  handleDecision,
  onClose,
}: {
  data: any[];
  handleDecision?: (payload: any[]) => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [decisionMap, setDecisionMap] = useState<{ [key: string]: string }>({});
  const [dateMap, setDateMap] = useState<{ [key: string]: string }>({});
  const [commonCode, setCommonCode] = useState("");
  const [commonDate, setCommonDate] = useState(dayjs().format("YYYY-MM-DD"));

  // Cập nhật decisionMap và dateMap khi data thay đổi (ví dụ: mở modal)
  useEffect(() => {
    if (open) {
      const initialMap: { [key: string]: string } = {};
      const initialDateMap: { [key: string]: string } = {};
      data.forEach((item) => {
        initialMap[item.id] = "";
        initialDateMap[item.id] = dayjs().format("YYYY-MM-DD");
      });
      setDecisionMap(initialMap);
      setDateMap(initialDateMap);
      setCommonDate(dayjs().format("YYYY-MM-DD"));
    }
  }, [open, data]);

  const handleClickOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setCommonCode("");
    onClose();
  };

  // Hàm nhập nhanh cho tất cả các hàng
  const applyParamsToAll = () => {
    const updatedDecisionMap = { ...decisionMap };
    const updatedDateMap = { ...dateMap };
    data.forEach((item) => {
      if (commonCode) updatedDecisionMap[item.id] = commonCode;
      if (commonDate) updatedDateMap[item.id] = commonDate;
    });
    setDecisionMap(updatedDecisionMap);
    setDateMap(updatedDateMap);
  };

  const handleInputChange = (id: string, value: string) => {
    setDecisionMap((prev) => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (id: string, value: string) => {
    setDateMap((prev) => ({ ...prev, [id]: value }));
  };

  const handleSend = async () => {
    // Chuyển format thành mảng các object gửi lên Backend
    const payload = data.map((item) => ({
      id: item.id,
      soQuyetDinh: decisionMap[item.id] || "",
      ngayQuyetDinh: dateMap[item.id] || "",
    }));

    await handleDecision?.(payload);
    handleClose();
  };

  // Kiểm tra xem tất cả các ô đã được nhập số quyết định và ngày quyết định chưa
  const isInvalid = data.some(
    (item) => !decisionMap[item.id]?.trim() || !dateMap[item.id]?.trim(),
  );

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        disabled={data.length === 0}
        startIcon={<GavelIcon />}
        onClick={handleClickOpen}
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: "bold",
          px: 3,
        }}
      >
        Ban hành ({data.length}) quyết định
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: "bold", color: "#1976d2" }}>
          Xác nhận ban hành quyết định
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Vui lòng nhập **Số quyết định** và **Ngày quyết định** để hoàn tất
            quy trình ban hành quyết định.
          </DialogContentText>

          {/* Nhập nhanh (Batch Input) */}
          {/* <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
              p: 2,
              bgcolor: "#f8f9fa",
              borderRadius: "8px",
              border: "1px dashed #1976d2",
            }}
          >
            <AutoFixHighIcon color="primary" sx={{ opacity: 0.7 }} />
            <Typography variant="body2" fontWeight="bold" color="primary">
              Nhập nhanh:
            </Typography>
            <TextField
              size="small"
              label="Số chung"
              placeholder="Nhập số..."
              value={commonCode}
              onChange={(e) => setCommonCode(e.target.value)}
              sx={{ width: 150 }}
            />
            <Box sx={{ width: 180 }}>
              <FieldDate
                title="Ngày chung"
                selectedDate={commonDate}
                setSelectedDate={setCommonDate}
              />
            </Box>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={applyParamsToAll}
              startIcon={<AutoFixHighIcon />}
              sx={{ textTransform: "none", ml: "auto" }}
            >
              Áp dụng cho tất cả
            </Button>
          </Box> */}

          {/* Bảng danh sách hàng đã chọn */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ maxHeight: 400, borderRadius: "8px" }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", bgcolor: "#f1f1f1" }}>
                    Mã
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      width: "200px",
                      bgcolor: "#f1f1f1",
                    }}
                  >
                    Số quyết định
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      width: "180px",
                      bgcolor: "#f1f1f1",
                    }}
                  >
                    Ngày quyết định
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {item.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="Số quyết định..."
                        fullWidth
                        value={decisionMap[item.id] || ""}
                        onChange={(e) =>
                          handleInputChange(item.id, e.target.value)
                        }
                        error={!decisionMap[item.id]?.trim()}
                      />
                    </TableCell>
                    <TableCell>
                      <FieldDate
                        title=""
                        selectedDate={dateMap[item.id] || ""}
                        setSelectedDate={(val: any) =>
                          handleDateChange(
                            item.id,
                            typeof val === "function"
                              ? val(dateMap[item.id])
                              : val,
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Button onClick={handleClose} color="inherit">
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSend}
            variant="contained"
            endIcon={<SendIcon />}
            disabled={isInvalid}
          >
            Gửi ({data.length}) ban hành
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
