export type TrangThaiSuaChua = 1 | 2 | 3 | 4;

export const TRANG_THAI_SUA_CHUA_OPTIONS = [
  { id: 1, ten: "Chuẩn bị cần bảo dưỡng" },
  { id: 2, ten: "Cần bảo dưỡng" },
  { id: 3, ten: "Trong kỳ bảo dưỡng" },
  { id: 4, ten: "Đã bảo dưỡng" },
];

/**
 * Tính trạng thái bảo dưỡng mới dựa theo lũy kế giờ hoạt động.
 * Chỉ auto-update 2 mốc: 4 -> 1 (chuẩn bị cần bảo dưỡng) và (4|1) -> 2 (cần bảo dưỡng).
 * Không bao giờ tự set 3, 4 hoặc lùi trạng thái.
 * Trả về null nếu không cần thay đổi.
 */
export function computeAutoTrangThai(
  cumulativeHours: number,
  chuKySuaChua: number,
  thoiGianBaoSuaChua: number,
  currentStatus: TrangThaiSuaChua | undefined | null,
): TrangThaiSuaChua | null {
  const status = currentStatus ?? 4;

  // Auto logic chỉ tác động khi đang ở 4 (mới/đã bảo dưỡng) hoặc 1 (đang chuẩn bị)
  if (status !== 4 && status !== 1) return null;

  if (
    !chuKySuaChua ||
    chuKySuaChua <= 0 ||
    !thoiGianBaoSuaChua ||
    thoiGianBaoSuaChua <= 0
  ) {
    return null;
  }

  const nearestK = Math.round(cumulativeHours / chuKySuaChua);
  if (nearestK <= 0) return null;

  const threshold = nearestK * chuKySuaChua;
  const warningFloor = threshold - thoiGianBaoSuaChua;

  if (cumulativeHours >= threshold) {
    // Đạt/vượt mốc -> set 2 (dù đang là 4 hay 1, đều lên thẳng 2)
    return 2;
  }
  if (cumulativeHours >= warningFloor) {
    // Vào vùng cảnh báo -> chỉ set 1 nếu đang là 4 (chưa từng lên 1)
    return status === 1 ? null : 1;
  }
  return null;
}
