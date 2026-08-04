import React, { useMemo, useCallback } from "react";
import {
  Box,
  Fade,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Typography,
} from "@mui/material";
import {
  AssetScheduleData,
  colors,
  dataCellSx,
  headerCellSx,
  sumCellSx,
  cellBorderCss,
} from "./AssetLichTrinhVanDungModal";
import { currentBrandConfig } from "../../../config/brandConfig";

const ROWS_PER_ASSET = 4;

// ============================================================
// Native input styles — tránh overhead MUI TextField
// ============================================================
const nativeInputStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  textAlign: "center",
  fontSize: "13px",
  fontWeight: 600,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  color: "#1e293b", // colors.textMain — hardcode tránh circular init
  padding: "4px 2px",
  cursor: "text",
};

// ============================================================
// ShiftCell — local state để gõ mượt, sync về parent khi blur
// ============================================================
interface ShiftCellProps {
  value: number;
  onCommit: (val: number) => void;
}

const ShiftCell = React.memo(({ value, onCommit }: ShiftCellProps) => {
  const [localVal, setLocalVal] = React.useState<string>(
    value > 0 ? String(value) : "",
  );

  // Đồng bộ khi prop value thay đổi từ bên ngoài (load data mới)
  React.useEffect(() => {
    setLocalVal(value > 0 ? String(value) : "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || /^\d{1,2}$/.test(raw)) {
      setLocalVal(raw);
      // Commit ngay để Cộng row cập nhật real-time
      const v = raw === "" ? 0 : Number(raw);
      onCommit(Math.min(v, 24));
    }
  };

  const handleBlur = () => {
    // Chuẩn hóa khi rời ô (vd: "0" → "")
    const v = localVal === "" ? 0 : Math.min(Number(localVal), 24);
    setLocalVal(v > 0 ? String(v) : "");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block e, E, +, -, . (không cần số thập phân hay ký hiệu KH)
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <td
      style={{
        fontSize: "12px",
        border: cellBorderCss,
        padding: "3px 4px",
        textAlign: "center",
        height: "32px",
        verticalAlign: "middle",
        width: 42,
      }}
    >
      <input
        type="text"
        inputMode="numeric"
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          ...nativeInputStyle,
          color: localVal && localVal !== "0" ? "#1e293b" : "#94a3b8",
        }}
        onFocus={(e) => {
          e.target.select();
          e.target.style.background = "#ffffff";
          e.target.style.boxShadow = "0 0 0 2px rgba(16, 185, 129, 0.2)";
          e.target.style.borderRadius = "4px";
        }}
        onBlurCapture={(e) => {
          e.target.style.background = "transparent";
          e.target.style.boxShadow = "none";
        }}
      />
    </td>
  );
});

// ============================================================
// AssetRow — 1 tài sản = 4 rows (Ca1, Ca2, Ca3, Cộng)
// ============================================================
interface AssetRowProps {
  asset: AssetScheduleData;
  assetIdx: number;
  days: number[];
  thoiGianBaoSuaChua: number;
  setShiftValue: (
    assetIdx: number,
    day: number,
    ca: number,
    val: number,
  ) => void;
  setAssetField: (
    assetIdx: number,
    field: keyof AssetScheduleData,
    val: any,
  ) => void;
}

const AssetRow = React.memo(
  ({
    asset,
    assetIdx,
    days,
    thoiGianBaoSuaChua,
    setShiftValue,
    setAssetField,
  }: AssetRowProps) => {
    // O(1) lookup map
    const detailMap = useMemo(() => {
      const map: Record<string, { ca1: number; ca2: number; ca3: number }> = {};
      for (const ct of asset.chiTietLichTrinhs) {
        map[ct.ngay] = {
          ca1: ct.ca1 || 0,
          ca2: ct.ca2 || 0,
          ca3: ct.ca3 || 0,
        };
      }
      return map;
    }, [asset.chiTietLichTrinhs]);

    const maxEnteredDay = useMemo(() => {
      let maxD = 0;
      for (const dStr in detailMap) {
        const val = detailMap[dStr];
        if (val.ca1 > 0 || val.ca2 > 0 || val.ca3 > 0) {
          const d = parseInt(dStr, 10);
          if (d > maxD) maxD = d;
        }
      }
      return maxD;
    }, [detailMap]);

    const getVal = useCallback(
      (day: number, ca: number) => {
        const d = detailMap[day.toString()];
        if (!d) return 0;
        return ca === 1 ? d.ca1 : ca === 2 ? d.ca2 : d.ca3;
      },
      [detailMap],
    );

    const getDayTotal = useCallback(
      (day: number) => {
        const d = detailMap[day.toString()];
        if (!d) return 0;
        return d.ca1 + d.ca2 + d.ca3;
      },
      [detailMap],
    );

    const getCumulativeDayTotal = useCallback(
      (day: number) => {
        let sum = asset.luyKeTruoc || 0;
        for (let dNum = 1; dNum <= day; dNum++) {
          const dVal = detailMap[dNum.toString()];
          if (dVal) {
            sum += (dVal.ca1 || 0) + (dVal.ca2 || 0) + (dVal.ca3 || 0);
          }
        }
        return sum;
      },
      [detailMap, asset.luyKeTruoc],
    );

    const getCaMonthTotal = useCallback(
      (ca: number) => {
        let sum = 0;
        for (const v of Object.values(detailMap)) {
          sum += ca === 1 ? v.ca1 : ca === 2 ? v.ca2 : v.ca3;
        }
        return sum;
      },
      [detailMap],
    );

    const grandTotal = useMemo(() => {
      let sum = 0;
      for (const v of Object.values(detailMap)) {
        sum += v.ca1 + v.ca2 + v.ca3;
      }
      return sum;
    }, [detailMap]);

    const makeCommit = useCallback(
      (day: number, ca: number) => (val: number) =>
        setShiftValue(assetIdx, day, ca, val),
      [assetIdx, setShiftValue],
    );

    const { warningDays, milestoneDays } = useMemo(() => {
      const warning = new Set<number>();
      const milestone = new Set<number>();
      const cycle = asset.chuKySuaChua;
      const bao = thoiGianBaoSuaChua;
      const trangThai = asset.trangThaiSuaChua ?? 4;

      if (!cycle || cycle <= 0 || !bao || bao <= 0 || maxEnteredDay <= 0) {
        return { warningDays: warning, milestoneDays: milestone };
      }

      // Đã bảo dưỡng (4) => tắt mọi highlight ngay lập tức, bất kể lũy kế đang ở đâu.
      // Đây là thay đổi chính: không còn phụ thuộc "prevDayCum < threshold + bao" nữa.
      if (trangThai === 4) {
        return { warningDays: warning, milestoneDays: milestone };
      }

      const finalCum = getCumulativeDayTotal(maxEnteredDay);
      if (finalCum <= 0) {
        return { warningDays: warning, milestoneDays: milestone };
      }

      const nearestK = Math.round(finalCum / cycle);
      if (nearestK <= 0) {
        return { warningDays: warning, milestoneDays: milestone };
      }

      const threshold = nearestK * cycle;
      const warningFloor = threshold - bao;

      // Chỉ cần đã vào vùng cảnh báo là highlight, không còn "đóng cửa sổ" theo giờ nữa.
      // Việc tắt highlight giờ hoàn toàn phụ thuộc trạng thái (đã check ở trên).
      if (finalCum < warningFloor) {
        return { warningDays: warning, milestoneDays: milestone };
      }

      if (finalCum < threshold) {
        warning.add(maxEnteredDay);
      } else {
        let prevCum = asset.luyKeTruoc || 0;
        let crossDay = -1;
        for (const d of days) {
          if (d > maxEnteredDay) break;
          const cum = getCumulativeDayTotal(d);
          if (cum >= threshold && prevCum < threshold) {
            crossDay = d;
            break;
          }
          prevCum = cum;
        }
        if (crossDay > 0) milestone.add(crossDay);
      }

      return { warningDays: warning, milestoneDays: milestone };
    }, [
      days,
      maxEnteredDay,
      getCumulativeDayTotal,
      asset.chuKySuaChua,
      asset.luyKeTruoc,
      thoiGianBaoSuaChua,
      asset.trangThaiSuaChua, // 👈 thêm dependency mới
    ]);

    return (
      <>
        {[1, 2, 3, "cong"].map((caVal, rowIdx) => {
          const isCong = caVal === "cong";
          const ca = typeof caVal === "number" ? caVal : 0;
          return (
            <TableRow
              key={`${asset.idTaiSan}-${caVal}`}
              sx={{
                backgroundColor: isCong ? colors.sumBg : "#ffffff",
                borderBottom: isCong
                  ? `2px solid ${colors.borderDark}`
                  : `1px dashed ${colors.borderLight}`,
                "&:hover": {
                  backgroundColor: isCong
                    ? "rgba(4,180,110,0.12)"
                    : colors.rowHover,
                },
              }}
            >
              {/* STT — chỉ rowIdx=0 */}
              {rowIdx === 0 && (
                <TableCell
                  rowSpan={ROWS_PER_ASSET}
                  sx={{
                    ...dataCellSx,
                    fontWeight: 700,
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                    verticalAlign: "middle",
                    color: colors.textMuted,
                  }}
                >
                  {assetIdx + 1}
                </TableCell>
              )}
              {/* Mã thiết bị */}
              {rowIdx === 0 && (
                <TableCell
                  rowSpan={ROWS_PER_ASSET}
                  sx={{
                    ...dataCellSx,
                    fontWeight: 600,
                    fontSize: "11px",
                    backgroundColor: "#ffffff",
                    verticalAlign: "middle",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {asset.soThe}
                </TableCell>
              )}
              {/* Tên */}
              {rowIdx === 0 && (
                <TableCell
                  rowSpan={ROWS_PER_ASSET}
                  sx={{
                    ...dataCellSx,
                    textAlign: "left",
                    padding: "8px 12px",
                    verticalAlign: "middle",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: colors.textMain,
                      lineHeight: 1.35,
                    }}
                  >
                    {asset.tenTaiSan}
                  </Typography>
                </TableCell>
              )}

              {/* Ca label */}
              <TableCell
                sx={{
                  ...dataCellSx,
                  fontWeight: 700,
                  fontSize: isCong ? "11px" : "12px",
                  backgroundColor: isCong ? colors.sumBg : "#f8fafc",
                  color: isCong ? colors.sumText : colors.headerBg,
                  borderRight: `2px solid ${colors.cellBorder}`,
                }}
              >
                {isCong ? "Cộng" : ca}
              </TableCell>

              {/* Ô nhập liệu theo ngày — dùng native input */}
              {days.map((d) => {
                if (isCong) {
                  if (d > maxEnteredDay) {
                    return <TableCell key={d} sx={sumCellSx}></TableCell>;
                  }
                  const total = getCumulativeDayTotal(d);
                  const warn = total > 0 && warningDays.has(d);
                  const crossed = total > 0 && milestoneDays.has(d);
                  return (
                    <TableCell
                      key={d}
                      sx={{
                        ...sumCellSx,
                        ...(warn
                          ? {
                              backgroundColor: "rgba(239,68,68,0.15)",
                              color: "#dc2626",
                              fontWeight: 900,
                              boxShadow: "inset 0 0 0 2px rgba(239,68,68,0.6)",
                            }
                          : crossed
                            ? {
                                backgroundColor: "rgba(245,158,11,0.15)",
                                color: "#b45309",
                                fontWeight: 900,
                                boxShadow:
                                  "inset 0 0 0 2px rgba(245,158,11,0.7)",
                              }
                            : {}),
                      }}
                    >
                      {total > 0 ? total : ""}
                    </TableCell>
                  );
                }
                return (
                  <ShiftCell
                    key={d}
                    value={getVal(d, ca)}
                    onCommit={makeCommit(d, ca)}
                  />
                );
              })}

              {/* Tổng tháng */}
              <TableCell
                sx={
                  isCong
                    ? {
                        ...sumCellSx,
                        backgroundColor: "rgba(4,180,110,0.15)",
                        fontSize: "13px",
                        fontWeight: 800,
                        borderLeft: `2px solid ${colors.cellBorder}`,
                      }
                    : {
                        ...dataCellSx,
                        fontWeight: 700,
                        backgroundColor: "#f8fafc",
                        fontFamily: '"JetBrains Mono", monospace',
                        borderLeft: `2px solid ${colors.cellBorder}`,
                      }
                }
              >
                {isCong
                  ? (asset.luyKeTruoc || 0) + grandTotal || ""
                  : getCaMonthTotal(ca) || ""}
              </TableCell>

              {/* Ghi chú */}
              {rowIdx === 0 && (
                <TableCell
                  rowSpan={ROWS_PER_ASSET}
                  sx={{
                    ...dataCellSx,
                    padding: 0,
                    position: "relative",
                    backgroundColor: "#fffdf9",
                    borderLeft: cellBorderCss,
                  }}
                >
                  <textarea
                    value={asset.ghiChu}
                    onChange={(e) =>
                      setAssetField(assetIdx, "ghiChu", e.target.value)
                    }
                    placeholder="Nhập tình trạng hư hỏng, sự cố..."
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      resize: "none",
                      fontSize: "11px",
                      lineHeight: 1.45,
                      fontFamily: '"Inter", sans-serif',
                      color: colors.textMain,
                      padding: "6px 8px",
                      boxSizing: "border-box",
                    }}
                  />
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </>
    );
  }
);

// ============================================================
// LichTrinhTable
// ============================================================
interface LichTrinhTableProps {
  assetsData: AssetScheduleData[];
  days: number[];
  daysInMonth: number;
  thoiGianBaoSuaChua: number;
  setShiftValue: (
    assetIdx: number,
    day: number,
    ca: number,
    val: number,
  ) => void;
  setAssetField: (
    assetIdx: number,
    field: keyof AssetScheduleData,
    val: any,
  ) => void;
}

export default function LichTrinhTable({
  assetsData,
  days,
  daysInMonth,
  thoiGianBaoSuaChua,
  setShiftValue,
  setAssetField,
}: LichTrinhTableProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: 3,
      }}
    >
      <Fade in timeout={300}>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            border: `1px solid ${colors.cellBorder}`,
            borderRadius: "12px",
            overflow: "auto",
            maxWidth: "100%",
            maxHeight: "100%",
            "&::-webkit-scrollbar": { height: 10, width: 10 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#cbd5e1",
              borderRadius: 5,
              border: "2px solid transparent",
              backgroundClip: "content-box",
            },
            "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#94a3b8" },
          }}
        >
          <Table
            stickyHeader
            size="small"
            sx={{
              borderCollapse: "collapse",
              tableLayout: "fixed",
              minWidth: 678 + daysInMonth * 42,
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, width: 44 }}>STT</TableCell>
                <TableCell sx={{ ...headerCellSx, width: 100 }}>
                  Mã thiết bị
                </TableCell>
                <TableCell
                  sx={{
                    ...headerCellSx,
                    width: 180,
                    textAlign: "left",
                    pl: 2,
                  }}
                >
                  Tên phương tiện / Số đăng ký
                </TableCell>
                <TableCell sx={{ ...headerCellSx, width: 50 }}>Ca</TableCell>
                {days.map((d) => (
                  <TableCell
                    key={d}
                    sx={{
                      ...headerCellSx,
                      width: 42,
                      padding: "6px 0",
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    {d}
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    ...headerCellSx,
                    width: 90,
                    backgroundColor: currentBrandConfig.primaryColor,
                    color: "#ffffff",
                  }}
                >
                  Tổng tháng
                </TableCell>
                <TableCell sx={{ ...headerCellSx, width: 220 }}>
                  GHI CHÚ
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {assetsData.map((asset, assetIdx) => (
                <AssetRow
                  key={asset.idTaiSan}
                  asset={asset}
                  assetIdx={assetIdx}
                  days={days}
                  thoiGianBaoSuaChua={thoiGianBaoSuaChua}
                  setShiftValue={setShiftValue}
                  setAssetField={setAssetField}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Fade>
    </Box>
  );
}
