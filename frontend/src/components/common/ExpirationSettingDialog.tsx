import { Close } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Divider,
  Alert,
  alpha,
  useTheme,
  DialogActions,
  MenuItem,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import { showErrorAlert, showSuccessAlert } from "../Alert";
import { currentBrandConfig } from "../../config/brandConfig";
import { useSelector } from "react-redux";

interface ExpirationSettingDialogProps {
  open: boolean;
  onClose: () => void;
  initialConfig?: {
    thoiHanTaiLieu: number;
    ngayBaoHetHan: number;
    ngayBaoDangKiem?: number;
    soTabToiDa?: number;
    thoiGianBaoSuaChua?: number;
  };
  onConfirm?: (
    expirationDays: number,
    warningDays: number,
    registrationWarningDays: number,
    maxTabs: number,
    repairNotificationHours: number,
  ) => void | Promise<void>;
  loading?: boolean;
}

export default function ExpirationSettingDialog({
  open,
  onClose,
  initialConfig,
  onConfirm,
  loading = false,
}: ExpirationSettingDialogProps) {
  const theme = useTheme();
  const [expirationDays, setExpirationDays] = useState<string>("30");
  const [warningDays, setWarningDays] = useState<string>("30");
  const [registrationWarningDays, setRegistrationWarningDays] =
    useState<string>("30");
  const [maxTabs, setMaxTabs] = useState<string>("7");
  const [repairNotificationHours, setRepairNotificationHours] =
    useState<string>("30");
  const [error, setError] = useState<string>("");

  const [selectedDbConfigId, setSelectedDbConfigId] = useState<string>("");
  const [syncTime, setSyncTime] = useState<string>("");

  const { user } = useSelector((state: any) => state.user);

  const queryClient = useQueryClient();

  const { data: dbConfigs = [] } = useQuery({
    queryKey: ["dbConfigList_Expiration"],
    queryFn: async () => {
      const res = await api.get("/dbconfig");
      return res.data.data || [];
    },
    enabled: open,
  });

  useEffect(() => {
    if (dbConfigs.length > 0) {
      const defaultDb = dbConfigs.find(
        (db: any) => db.isDefault === true || db.isDefault === 1,
      );
      if (defaultDb) {
        setSelectedDbConfigId(defaultDb.id);
        setSyncTime(defaultDb.syncTime || "");
      }
    }
  }, [dbConfigs]);

  const updateDbConfigDefaultMutation = useMutation({
    mutationFn: async ({ id, time }: { id: string; time: string }) => {
      if (!id) return;
      await api.put(`/dbconfig/${id}/default?syncTime=${time}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dbConfigList_Expiration"] });
      showSuccessAlert("Cấu hình thời gian được lưu thành công!");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          "Đã xảy ra lỗi khi cấu hình thời gian!",
      );
    },
  });

  useEffect(() => {
    if (open && initialConfig) {
      const data = (initialConfig as any).data || initialConfig;

      if (data.thoiHanTaiLieu !== undefined && data.thoiHanTaiLieu !== null) {
        setExpirationDays(String(data.thoiHanTaiLieu));
      }
      if (data.ngayBaoHetHan !== undefined && data.ngayBaoHetHan !== null) {
        setWarningDays(data.ngayBaoHetHan.toString());
      }
      if (data.ngayBaoDangKiem !== undefined && data.ngayBaoDangKiem !== null) {
        setRegistrationWarningDays(data.ngayBaoDangKiem.toString());
      }
      if (data.soTabToiDa !== undefined && data.soTabToiDa !== null) {
        setMaxTabs(data.soTabToiDa.toString());
      }
      if (
        data.thoiGianBaoSuaChua !== undefined &&
        data.thoiGianBaoSuaChua !== null
      ) {
        setRepairNotificationHours(data.thoiGianBaoSuaChua.toString());
      }
    } else {
      setExpirationDays("0");
      setWarningDays("0");
      setRegistrationWarningDays("0");
      setMaxTabs("7");
      setRepairNotificationHours("30");
    }
  }, [initialConfig, open]);

  const MIN_VALUE = 1;
  const MAX_VALUE = 999;

  const normalizeValue = (value: string): string => {
    if (value === "") return value;
    const num = parseInt(value);
    if (isNaN(num)) return "";
    if (num < MIN_VALUE) return String(MIN_VALUE);
    if (num > MAX_VALUE) return String(MAX_VALUE);
    return String(num);
  };

  const handleConfirm = async () => {
    const exp = parseInt(expirationDays);
    const warn = parseInt(warningDays);
    const regWarn = parseInt(registrationWarningDays);
    const tabs = parseInt(maxTabs);
    const repairWarn = parseInt(repairNotificationHours);

    if (
      isNaN(exp) ||
      isNaN(warn) ||
      isNaN(regWarn) ||
      isNaN(tabs) ||
      isNaN(repairWarn)
    ) {
      setError("Vui lòng nhập số hợp lệ");
      return;
    }

    if (exp < 0 || warn < 0 || regWarn < 0 || tabs < 1 || repairWarn < 0) {
      setError(
        "Giá trị không hợp lệ (số tab tối đa ít nhất là 1, thời gian ít nhất là 0)",
      );
      return;
    }

    setError("");
    if (onConfirm) {
      if (selectedDbConfigId) {
        try {
          await updateDbConfigDefaultMutation.mutateAsync({
            id: selectedDbConfigId,
            time: syncTime,
          });
        } catch (e) {
          console.error(e);
        }
      }
      await onConfirm(exp, warn, regWarn, tabs, repairWarn);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      {/* Header với gradient */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${currentBrandConfig.primaryColor} 0%, ${currentBrandConfig.primaryColor} 100%)`,
          position: "relative",
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2.5 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h6" fontWeight="bold" color="white">
                Thiết lập cấu hình
              </Typography>
              <Typography
                variant="caption"
                color={alpha(theme.palette.common.white, 0.8)}
              >
                Thiết lập cấu hình hệ thống
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: "white",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
      </Box>

      <DialogContent sx={{ p: 3, backgroundColor: theme.palette.grey[50] }}>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Thời hạn hiệu lực */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "white",
              border: `1px solid ${theme.palette.grey[200]}`,
              transition: "all 0.2s",
              "&:hover": {
                borderColor: theme.palette.primary.light,
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
              },
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 20,
                  bgcolor: theme.palette.primary.main,
                  borderRadius: 1,
                  display: "inline-block",
                }}
              />
              Thời hạn hiệu lực tài liệu
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={expirationDays}
              onChange={(e) =>
                setExpirationDays(normalizeValue(e.target.value))
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">ngày</InputAdornment>
                ),
                sx: { backgroundColor: theme.palette.grey[50] },
              }}
              variant="outlined"
              size="medium"
              helperText="Quy định số ngày tài liệu có hiệu lực kể từ ngày ký"
              FormHelperTextProps={{
                sx: { ml: 0, mt: 0.5, color: theme.palette.grey[600] },
              }}
            />
          </Paper>

          {/* Cảnh báo hết hạn */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "white",
              border: `1px solid ${theme.palette.grey[200]}`,
              transition: "all 0.2s",
              "&:hover": {
                borderColor: theme.palette.warning.light,
                boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.1)}`,
              },
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 20,
                  bgcolor: theme.palette.warning.main,
                  borderRadius: 1,
                  display: "inline-block",
                }}
              />
              Cảnh báo hết hạn tài liệu
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={warningDays}
              onChange={(e) => setWarningDays(normalizeValue(e.target.value))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">ngày</InputAdornment>
                ),
                sx: { backgroundColor: theme.palette.grey[50] },
              }}
              variant="outlined"
              size="medium"
              helperText="Hệ thống sẽ gửi cảnh báo trước khi tài liệu hết hạn"
              FormHelperTextProps={{
                sx: { ml: 0, mt: 0.5, color: theme.palette.grey[600] },
              }}
            />
          </Paper>

          {/* Cảnh báo đăng kiểm */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "white",
              border: `1px solid ${theme.palette.grey[200]}`,
              transition: "all 0.2s",
              "&:hover": {
                borderColor: theme.palette.info.light,
                boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.1)}`,
              },
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 20,
                  bgcolor: theme.palette.info.main,
                  borderRadius: 1,
                  display: "inline-block",
                }}
              />
              Cảnh báo hết hạn đăng kiểm
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={registrationWarningDays}
              onChange={(e) =>
                setRegistrationWarningDays(normalizeValue(e.target.value))
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">ngày</InputAdornment>
                ),
                sx: { backgroundColor: theme.palette.grey[50] },
              }}
              variant="outlined"
              size="medium"
              helperText="Hệ thống sẽ gửi cảnh báo trước khi đến kỳ đăng kiểm"
              FormHelperTextProps={{
                sx: { ml: 0, mt: 0.5, color: theme.palette.grey[600] },
              }}
            />
          </Paper>

          {/* Cài đặt giới hạn tab */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: "white",
              border: `1px solid ${theme.palette.grey[200]}`,
              transition: "all 0.2s",
              "&:hover": {
                borderColor: theme.palette.success.light,
                boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.1)}`,
              },
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 20,
                  bgcolor: theme.palette.success.main,
                  borderRadius: 1,
                  display: "inline-block",
                }}
              />
              Số lượng tab được phép mở tối đa
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={maxTabs}
              onChange={(e) => {
                setMaxTabs(e.target.value);
                setError("");
              }}
              InputProps={{
                inputProps: { min: 1 },
                endAdornment: (
                  <InputAdornment position="end">Tab</InputAdornment>
                ),
                sx: { backgroundColor: theme.palette.grey[50] },
              }}
              variant="outlined"
              size="medium"
              helperText="Giới hạn số tab hiển thị trên thanh menu"
              FormHelperTextProps={{
                sx: { ml: 0, mt: 0.5, color: theme.palette.grey[600] },
              }}
            />
          </Paper>

          {/* Cảnh báo sửa chữa */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: "white",
              border: `1px solid ${theme.palette.grey[200]}`,
              transition: "all 0.2s",
              "&:hover": {
                borderColor: theme.palette.error.light,
                boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.1)}`,
              },
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 20,
                  bgcolor: theme.palette.error.main,
                  borderRadius: 1,
                  display: "inline-block",
                }}
              />
              Thời gian báo sửa chữa
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={repairNotificationHours}
              onChange={(e) => {
                setRepairNotificationHours(e.target.value);
                setError("");
              }}
              InputProps={{
                inputProps: { min: 0 },
                endAdornment: (
                  <InputAdornment position="end">giờ</InputAdornment>
                ),
                sx: { backgroundColor: theme.palette.grey[50] },
              }}
              variant="outlined"
              size="medium"
              helperText="Hệ thống sẽ gửi cảnh báo sửa chữa trước khoảng thời gian đến kì sửa chữa"
              FormHelperTextProps={{
                sx: { ml: 0, mt: 0.5, color: theme.palette.grey[600] },
              }}
            />
          </Paper>

          {/* Thiết lập đồng bộ cơ sở dữ liệu */}
          {user?.taiKhoan?.tenDangNhap === "admin" && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "white",
                border: `1px solid ${theme.palette.grey[200]}`,
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: theme.palette.secondary.light,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.1)}`,
                },
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 4,
                    height: 20,
                    bgcolor: theme.palette.secondary.main,
                    borderRadius: 1,
                    display: "inline-block",
                  }}
                />
                Thiết lập đồng bộ cơ sở dữ liệu
              </Typography>
              <Box display="flex" gap={2}>
                <TextField
                  select
                  fullWidth
                  label="Chọn cơ sở dữ liệu đồng bộ"
                  value={selectedDbConfigId}
                  onChange={(e) => setSelectedDbConfigId(e.target.value)}
                  variant="outlined"
                  size="medium"
                  sx={{ backgroundColor: theme.palette.grey[50], flex: 2 }}
                >
                  <MenuItem value="">
                    <em>Không chọn</em>
                  </MenuItem>
                  {dbConfigs.map((db: any) => (
                    <MenuItem key={db.id} value={db.id}>
                      {db.dbName} ({db.dbms} - {db.ip})
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  type="time"
                  label="Thời điểm tự động đồng bộ hàng ngày"
                  value={syncTime}
                  onChange={(e) => setSyncTime(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  variant="outlined"
                  size="medium"
                  sx={{ flex: 1, backgroundColor: theme.palette.grey[50] }}
                />
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, backgroundColor: "white" }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 3,
          }}
        >
          Hủy bỏ
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 4,
            transition: "all 0.2s",
          }}
        >
          {loading ? "Đang lưu..." : "Lưu cấu hình"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
