import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Checkbox,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

import { PLAN_STATUS_CONFIG } from "../../config";
import CloseIcon from "@mui/icons-material/Close";
import PostAddIcon from "@mui/icons-material/PostAdd";
import CheckIcon from "@mui/icons-material/Check";
import { maintenanceLevelColors } from "../../../../mockdata/mockPlans";

import { MaintenancePlanData } from "../../types";
import { MaintenanceRepairData } from "../../types";
import { useAppSelector } from "../../../../redux/store";
import { useLocation } from "react-router-dom";
import DraftIndicator from "../../../../components/common/DraftIndicator";
import {
  useMaintenanceRepairMutation,
  useMaintenancePlanningDetailsByMonthQuery,
} from "../../mutation";
import { showStatus } from "../../config";
import { TechnicalReportRow } from "./tree/TechnicalReportRow";
import TechnicalReportDialog from "../dialog/TechnicalReportDialog";
import {
  useTechnicalReportByPlanQuery,
  useTechnicalReportMutation,
} from "../../mutation/TechnicalReport";
import { currentBrandConfig } from "../../../../config/brandConfig";

const months = Array.from({ length: 12 }, (_, i) => i + 1);

interface Props {
  plan: MaintenancePlanData;
  onClose: () => void;
}

// ── Component chính ───────────────────────────────────────
const PlanDetailPanel = ({ plan, onClose }: Props) => {
  const [tab, setTab] = useState(0);
  const [selectedMonths, setSelectedMonths] = useState<number[]>(() => {
    if (plan?.trangThai !== 3) {
      return months;
    }
    return [new Date().getMonth() + 1];
  });
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [techReportDialogOpen, setTechReportDialogOpen] = useState(false);

  const location = useLocation();
  const tabPath = location.pathname;

  const lastMinimizedDialog = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return tab?.formData?.lastMinimizedDialog ?? null;
  });
  const hasTechReportDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return !!tab?.formData?.[`techReportDraft_${plan?.id}`];
  });

  useEffect(() => {
    setSelectedDeviceIds([]);

    if (plan?.trangThai !== 3) {
      setSelectedMonths(months);
    } else {
      setSelectedMonths([new Date().getMonth() + 1]);
    }
  }, [plan?.id, plan?.trangThai]);

  const queryResults = useMaintenancePlanningDetailsByMonthQuery(
    plan?.id,
    selectedMonths,
  );

  const allMonthsData = useMemo(() => {
    return queryResults.map((r) => r.data || []);
  }, [queryResults]);

  const mergedDevices = useMemo(() => {
    const devicesMap: Record<string, any> = {};

    selectedMonths.forEach((thangIdx, queryIdx) => {
      const monthData = allMonthsData[queryIdx] || [];
      monthData.forEach((item: any) => {
        const key = item.idTaiSan;
        if (!devicesMap[key]) {
          devicesMap[key] = {
            id: item.id,
            idTaiSan: item.idTaiSan,
            tenTaiSan: item.tenTaiSan,
            idNhomTaiSan: item.idNhomTaiSan,
            soLuong: item.soLuong,
            monthlyData: {},
          };
        }
        devicesMap[key].monthlyData[thangIdx] = {
          id: item.id,
          capSuaChua: item.capSuaChua,
          daCoBienBan: item.daCoBienBan,
        };
      });
    });

    return Object.values(devicesMap);
  }, [selectedMonths, allMonthsData]);

  const { data: technicalReports = [] } = useTechnicalReportByPlanQuery(
    plan?.id,
  );

  const availableDevices = useMemo(() => {
    if (selectedMonths.length > 1) return [];
    const singleMonthIdx = selectedMonths[0];
    return mergedDevices.filter((d: any) => {
      const mData = d.monthlyData[singleMonthIdx];
      return mData && Number(mData.daCoBienBan || 0) === 0;
    });
  }, [mergedDevices, selectedMonths]);

  const handleToggle = (id: string) => {
    setSelectedDeviceIds((prev) => {
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const handleSelectAll = () =>
    setSelectedDeviceIds(
      selectedDeviceIds.length === availableDevices.length
        ? []
        : availableDevices.map((d: any) => d.id || d.idTaiSan || ""),
    );

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.5,
          mx: -2,
          mt: -2,
          mb: 2,
          bgcolor: currentBrandConfig.primaryColor,
          color: "#fff",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.1rem" }}>
          Chi tiết kế hoạch: {plan.id}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#fff" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Info Section */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: currentBrandConfig.primaryColor + "1a",
          border: "1px solid " + currentBrandConfig.primaryColor,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Typography variant="body2">
          <b>Năm:</b> {plan.nam}
        </Typography>
        <Typography variant="body2">
          <b>Ngày tạo:</b> {plan.ngayTao}
        </Typography>
        {plan.tenDonViGiao && (
          <Typography variant="body2">
            <b>ĐV quản lý:</b> {plan.tenDonViGiao}
          </Typography>
        )}
        {plan.tenDonViNhan && (
          <Typography variant="body2">
            <b>ĐV thực hiện:</b> {plan.tenDonViNhan}
          </Typography>
        )}
        {showStatus(plan.trangThai)}
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 2,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": {
            fontWeight: 600,
            textTransform: "none",
            fontSize: "0.95rem",
            color: "text.secondary",
            "&:hover": {
              color: currentBrandConfig.primaryColor,
              opacity: 0.85,
            },
          },
          "& .MuiTab-root.Mui-selected": {
            color: currentBrandConfig.primaryColor + " !important",
          },
          "& .MuiTabs-indicator": {
            backgroundColor: currentBrandConfig.primaryColor + " !important",
          },
        }}
      >
        <Tab label="Xem theo thiết bị" />
        <Tab label="Xem theo biên bản" />
      </Tabs>

      {/* ══════════════ TAB 0: Thiết bị ══════════════ */}
      {tab === 0 && (
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {plan.trangThai === 3 && (
            <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
              <FormControl size="small" sx={{ minWidth: 200, mt: 1 }}>
                <InputLabel
                  id="month-scbd-label"
                  sx={{
                    color: currentBrandConfig.primaryColor,
                    "&.Mui-focused": { color: currentBrandConfig.primaryColor },
                  }}
                >
                  Tháng SCBD
                </InputLabel>
                <Select
                  labelId="month-scbd-label"
                  multiple
                  value={selectedMonths}
                  label="Tháng SCBD"
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextMonths =
                      typeof val === "string"
                        ? val.split(",").map(Number)
                        : (val as number[]);
                    nextMonths.sort((a, b) => a - b);
                    setSelectedMonths(nextMonths);
                    setSelectedDeviceIds([]);
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {(selected as number[]).map((value) => (
                        <Chip
                          key={value}
                          label={`T${value}`}
                          size="small"
                          onDelete={(e) => {
                            e.stopPropagation();
                            const nextMonths = selectedMonths.filter(
                              (m) => m !== value,
                            );
                            setSelectedMonths(nextMonths);
                            setSelectedDeviceIds([]);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{
                            bgcolor: "#e8f5e9",
                            color: currentBrandConfig.primaryColor,
                            fontWeight: 600,
                            border: `1px solid ${currentBrandConfig.primaryColor}`,
                            "& .MuiChip-deleteIcon": {
                              color: "#d32f2f",
                            },
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: currentBrandConfig.primaryColor,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: currentBrandConfig.primaryColor,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: currentBrandConfig.primaryColor,
                    },
                  }}
                >
                  {months.map((m, idx) => (
                    <MenuItem
                      key={m}
                      value={m}
                      sx={{
                        "&.Mui-selected": {
                          bgcolor: "rgba(31, 164, 99, 0.08)",
                          "&:hover": {
                            bgcolor: "rgba(31, 164, 99, 0.12)",
                          },
                        },
                        "&:hover": {
                          bgcolor: "rgba(31, 164, 99, 0.04)",
                        },
                      }}
                    >
                      <Checkbox
                        checked={selectedMonths.includes(m)}
                        size="small"
                        sx={{
                          color: currentBrandConfig.primaryColor,
                          "&.Mui-checked": {
                            color: currentBrandConfig.primaryColor,
                          },
                        }}
                      />
                      T{m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<PostAddIcon />}
                disabled={
                  selectedDeviceIds.length === 0 || selectedMonths.length > 1
                }
                onClick={() => setTechReportDialogOpen(true)}
                size="small"
              >
                Tạo Báo Cáo Kỹ Thuật ({selectedDeviceIds.length})
              </Button>
            </Box>
          )}

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      bgcolor: currentBrandConfig.primaryColor + " !important",
                      color: "#fff !important",
                      fontWeight: 700,
                    },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedDeviceIds.length > 0 &&
                        selectedDeviceIds.length < availableDevices.length
                      }
                      checked={
                        availableDevices.length > 0 &&
                        selectedDeviceIds.length === availableDevices.length
                      }
                      onChange={handleSelectAll}
                      disabled={
                        plan.trangThai !== 3 || selectedMonths.length > 1
                      }
                      sx={{
                        color: "#fff",
                        "&.Mui-checked": { color: "#fff" },
                        "&.MuiCheckbox-indeterminate": { color: "#fff" },
                        "&.Mui-disabled": {
                          color: "rgba(255, 255, 255, 0.3) !important",
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>STT</TableCell>
                  <TableCell>Mã TB</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Tên</TableCell>
                  <TableCell>Nhóm</TableCell>
                  {selectedMonths.map((mIdx) => (
                    <TableCell key={mIdx}>T{mIdx}</TableCell>
                  ))}
                  <TableCell>SL</TableCell>
                  {selectedMonths.length === 1 && (
                    <TableCell>Trạng thái</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {mergedDevices?.map((device: any, idx: number) => {
                  const statusVal =
                    selectedMonths.length === 1
                      ? Number(
                          device.monthlyData[selectedMonths[0]]?.daCoBienBan ||
                            0,
                        )
                      : 0;
                  const isAlreadyRequested = statusVal > 0;
                  return (
                    <TableRow
                      key={device.idTaiSan}
                      sx={{
                        bgcolor: isAlreadyRequested ? "#f5f5f5" : undefined,
                        "&:hover": {
                          bgcolor: "rgba(31, 164, 99, 0.04) !important",
                        },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedDeviceIds.includes(device.id)}
                          onChange={() => handleToggle(device.id)}
                          disabled={
                            plan.trangThai !== 3 ||
                            selectedMonths.length > 1 ||
                            isAlreadyRequested
                          }
                        />
                      </TableCell>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{device.idTaiSan}</TableCell>
                      <TableCell>{device.tenTaiSan}</TableCell>
                      <TableCell>{device.idNhomTaiSan}</TableCell>
                      {selectedMonths.map((mIdx) => {
                        const mData = device.monthlyData[mIdx];
                        return (
                          <TableCell key={mIdx}>
                            {mData ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <Chip
                                  label={mData.capSuaChua}
                                  size="small"
                                  sx={{
                                    bgcolor:
                                      maintenanceLevelColors[
                                        mData.capSuaChua
                                      ] || "#1FA463",
                                    color: "#fff",
                                    fontWeight: 600,
                                  }}
                                />
                                {Number(mData.daCoBienBan || 0) > 0 && (
                                  <CheckIcon
                                    sx={{ color: "#1FA463", fontSize: 18 }}
                                  />
                                )}
                              </Box>
                            ) : (
                              <span style={{ color: "#aaa" }}>—</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell>{device.soLuong}</TableCell>
                      {selectedMonths.length === 1 && (
                        <TableCell>
                          <Chip
                            label={
                              PLAN_STATUS_CONFIG[statusVal]?.label || "Chưa lập"
                            }
                            size="small"
                            color={
                              PLAN_STATUS_CONFIG[statusVal]?.color || "default"
                            }
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {mergedDevices?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={
                        6 +
                        selectedMonths.length +
                        (selectedMonths.length === 1 ? 1 : 0)
                      }
                      align="center"
                      sx={{ py: 4 }}
                    >
                      Không có thiết bị cần SCBD trong các tháng đã chọn
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════════════ TAB 1: Biên bản — tree view ══════════════ */}
      {tab === 1 && (
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ overflowX: "auto" }}
          >
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      bgcolor: currentBrandConfig.primaryColor + " !important",
                      color: "#fff !important",
                      fontWeight: 700,
                    },
                  }}
                >
                  <TableCell>Biên bản</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Ngày</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {(() => {
                  const filteredReports = technicalReports.filter((req: any) =>
                    selectedMonths.includes(Number(req.thang))
                  );

                  if (filteredReports.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return filteredReports.map((req: any, reqIdx: number, arr: any[]) => (
                    <TechnicalReportRow
                      key={req.id}
                      report={req}
                      plan={plan}
                      isLast={reqIdx === arr.length - 1}
                    />
                  ));
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <TechnicalReportDialog
        open={techReportDialogOpen}
        onClose={() => {
          setSelectedDeviceIds([]);
          setTechReportDialogOpen(false);
        }}
        plan={plan}
        initialData={null}
        selectedDeviceIds={selectedDeviceIds}
        selectedMonth={selectedMonths[0]}
      />

      {lastMinimizedDialog === "techReport" && hasTechReportDraft && (
        <DraftIndicator onClick={() => setTechReportDialogOpen(true)} />
      )}
    </Box>
  );
};

export default PlanDetailPanel;
