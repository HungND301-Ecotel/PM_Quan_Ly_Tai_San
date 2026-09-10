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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { devices } from "../../../../mockdata/mockDevices";
import { departments } from "../../../../mockdata/mockDepartments";
import IncidentInspectionDialog from "../dialog/Incidentinspectiondialog";
import DraftIndicator from "../../../../components/common/DraftIndicator";

import {
  useMaintenanceIncidentDetailByIncidentQuery,
  useMaintenanceIncidentInspectionBySuCoQuery,
} from "../../mutation";
import { MaintenancePlanData } from "../../types";
import type { IncidenData } from "../../types";
import { showServerity, showStatus } from "../../config";
import { AssetGroup } from "../../../../utils/const";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "../../../../redux/store";
import { currentBrandConfig } from "../../../../config/brandConfig";
import IncidentDetailWorkflowPanel from "./IncidentDetailWorkflowPanel";

interface Props {
  incident: IncidenData;
  plan?: MaintenancePlanData | null;
  onClose: () => void;
}

const IncidentDetailPanel = ({ incident, plan, onClose }: Props) => {
  const [tab, setTab] = useState(0);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [expandedBBKTKSC, setExpandedBBKTKSC] = useState<string | null>(null);
  const [incidentInspectionParentId, setIncidentInspectionParentId] = useState<
    string | null
  >(null);
  const [selectedIncidentInspection, setSelectedIncidentInspection] = useState<
    any | null
  >(null);

  const location = useLocation();
  const tabPath = location.pathname;

  const lastMinimizedDialog = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return tab?.formData?.lastMinimizedDialog ?? null;
  });

  const hasIncidentInspectionDraft = useAppSelector((state) => {
    const tab = state.tabs.tabs.find((t: any) => t.path === tabPath);
    return !!tab?.formData?.[`incidentInspectionDraft_${incident?.id}`];
  });

  useEffect(() => {
    setSelectedDeviceIds([]);
  }, [incident?.id]);

  const { data: incidentDevices = [] } =
    useMaintenanceIncidentDetailByIncidentQuery(incident?.id);
  const { data: incidentInspections = [] } =
    useMaintenanceIncidentInspectionBySuCoQuery(incident?.id);

  // Lấy danh sách thiết bị từ deviceEntries
  const deviceIds = useMemo(
    () => incident.danhSachTaiSan?.map((e) => e.idTaiSan) || [],
    [incident.danhSachTaiSan],
  );

  const devicesInIncident = useMemo(
    () => devices.filter((d) => deviceIds.includes(d.id)),
    [deviceIds],
  );

  const handleToggle = (id: string) => {
    const isVehicle = plan?.nhomTaiSan === AssetGroup.PHUONGTIEN;
    setSelectedDeviceIds((prev) => {
      if (isVehicle) {
        return prev.includes(id) ? [] : [id];
      }
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };
  const availableDevices = (incident?.danhSachTaiSan || []).filter(
    (d: any) => !d?.daKiemTraSuCo || d?.daKiemTraSuCo === 0,
  );
  const handleSelectAll = () =>
    setSelectedDeviceIds(
      selectedDeviceIds.length === availableDevices.length
        ? []
        : availableDevices.map((d: any) => d.id || ""),
    );

  const reporterDept = incident.idDonViBaoCao
    ? departments.find((d) => d.id === incident.idDonViBaoCao)
    : null;

  const inc: any = incident;

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
          Chi tiết: Phiếu báo sự cố {inc.soPhieu || inc.number}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#fff" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Info section */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: "#f1f8e9",
          border: "1px solid #d0e7b5",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Typography variant="body2">
          <b>Ngày phát hiện:</b> {inc.ngayPhatHien || inc.detectedAt}
        </Typography>
        <Typography variant="body2">
          <b>Hệ thống:</b> {inc.tenHeThongThietBi || inc.systemName}
        </Typography>
        {(inc.mucDo !== undefined || inc.severity) && showServerity(inc.mucDo)}
        {reporterDept && (
          <Typography variant="body2">
            <b>Đơn vị báo cáo:</b> {reporterDept.name}
          </Typography>
        )}
        {showStatus(inc.trangThai ?? 0)}
      </Box>

      {incident.moTa && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            bgcolor: "#f5f5f5",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="body2">
            <b>Mô tả:</b> {incident.moTa}
          </Typography>
        </Box>
      )}

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
          {incident.trangThai === 3 && (
            <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
              <Button
                variant="contained"
                disabled={selectedDeviceIds.length === 0}
                onClick={() => setIncidentInspectionParentId(incident.id)}
                size="small"
              >
                Tạo BB Kiểm tra sự cố ({selectedDeviceIds.length})
              </Button>
            </Box>
          )}

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      bgcolor: currentBrandConfig.primaryColor,
                      color: "#fff !important",
                      fontWeight: 700,
                    },
                  }}
                >
                  {incident.trangThai === 3 && (
                    <TableCell padding="checkbox">
                      {plan?.nhomTaiSan !== AssetGroup.PHUONGTIEN && (
                        <Checkbox
                          indeterminate={
                            selectedDeviceIds.length > 0 &&
                            selectedDeviceIds.length < devicesInIncident.length
                          }
                          checked={
                            devicesInIncident.length > 0 &&
                            selectedDeviceIds.length ===
                              devicesInIncident.length
                          }
                          onChange={handleSelectAll}
                          sx={{
                            color: "#fff",
                            "&.Mui-checked": { color: "#fff" },
                            "&.MuiCheckbox-indeterminate": { color: "#fff" },
                          }}
                        />
                      )}
                    </TableCell>
                  )}
                  <TableCell>STT</TableCell>
                  <TableCell>Mã TB</TableCell>
                  <TableCell>Tên TB</TableCell>
                  <TableCell>Nhóm</TableCell>
                  <TableCell>Vị trí</TableCell>
                  <TableCell>Tình trạng</TableCell>
                  <TableCell>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidentDevices?.map((device: any, idx: number) => {
                  return (
                    <TableRow
                      key={device.id}
                      sx={{
                        "&:hover": {
                          bgcolor: "rgba(31, 164, 99, 0.04) !important",
                        },
                      }}
                    >
                      {incident.trangThai === 3 && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedDeviceIds.includes(
                              device.id ?? "",
                            )}
                            onChange={() => handleToggle(device.id ?? "")}
                            disabled={
                              device.daKiemTraSuCo !== undefined &&
                              device.daKiemTraSuCo >= 1
                            }
                          />
                        </TableCell>
                      )}
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{device.idTaiSan}</TableCell>
                      <TableCell>{device.tenTaiSan}</TableCell>
                      <TableCell>{device.tenNhomTaiSan}</TableCell>
                      <TableCell>{device?.viTri || "—"}</TableCell>
                      <TableCell>{device?.tinhTrang || "—"}</TableCell>
                      <TableCell>
                        {device.daKiemTraSuCo === 1 && (
                          <Chip label="Đã kiểm tra" size="small" color="info" />
                        )}
                        {device.daKiemTraSuCo === 2 && (
                          <Chip
                            label="Đã giám định"
                            size="small"
                            color="warning"
                          />
                        )}
                        {device.daKiemTraSuCo === 3 && (
                          <Chip
                            label="Đã lên biện pháp"
                            size="small"
                            color="error"
                          />
                        )}
                        {device.daKiemTraSuCo === 4 && (
                          <Chip
                            label="Đã nghiệm thu"
                            size="small"
                            color="success"
                          />
                        )}
                        {device.daKiemTraSuCo === 5 && (
                          <Chip
                            label="Đã đánh giá"
                            size="small"
                            color="primary"
                          />
                        )}
                        {(!device.daKiemTraSuCo ||
                          device.daKiemTraSuCo === 0) && (
                          <Chip
                            label="Chưa kiểm tra"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════════════ TAB 1: Biên bản — 5-Step Workflow & Chi tiết biên bản ══════════════ */}
      {tab === 1 && (
        <Box sx={{ flex: 1, overflow: "auto", pb: 2 }}>
          <IncidentDetailWorkflowPanel
            incident={incident}
            plan={plan}
            onClose={onClose}
            hideHeader={true}
          />
        </Box>
      )}

      {/* Dialogs */}
      {incidentInspectionParentId && (
        <IncidentInspectionDialog
          open={true}
          onClose={() => {
            setIncidentInspectionParentId(null);
            setSelectedIncidentInspection(null);
            setSelectedDeviceIds([]);
          }}
          incidentReport={incident}
          selectedDeviceIds={selectedDeviceIds}
          initData={selectedIncidentInspection}
        />
      )}

      {lastMinimizedDialog === "incidentInspection" &&
        hasIncidentInspectionDraft && (
          <DraftIndicator
            onClick={() => setIncidentInspectionParentId(incident.id)}
          />
        )}
    </Box>
  );
};

export default IncidentDetailPanel;
