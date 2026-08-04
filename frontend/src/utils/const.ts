export const MessageTypeFunctions = {
  ASSET_TRANSFER: "ASSET_TRANSFER",
  ASSET_HANDOVER: "ASSET_HANDOVER",
  TOOL_TRANSFER: "TOOL_TRANSFER",
  TOOL_HANDOVER: "TOOL_HANDOVER",
  ALL_FUNCTION: "ALL_FUNCTION",
  REPAIR: "REPAIR",
  PLAN: "PLAN",
  INCIDENT: "INCIDENT",
  INCIDENT_INSPECTION: "INCIDENT_INSPECTION",
  INSPECTION: "INSPECTION",
  MATERIAL: "MATERIAL",
  ACCEPTANCE_TEST: "ACCEPTANCE_TEST",
  MEASURE: "MEASURE",
};
export const MessageTypeActions = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
};

export const Devicetype = {
  ASSET: "TAI_SAN",
  TOOL: "CCDC",
};
export const PlanType = {
  DEVICE: "THIET_BI",
  WORK: "CHU_KY",
  TIME: "GIO_MAY",
};

export const CongTy = {
  CT001: "CT001",
};

export const Action = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
};

export type ActionType = (typeof Action)[keyof typeof Action];

export const StatusPlan = {
  PENDING: "CHUA_THUC_HIEN",
  PROGRESS: "DANG_THUC_HIEN",
  COMPLETED: "DA_HOAN_THANH",
};
export type StatusPlanType = (typeof StatusPlan)[keyof typeof StatusPlan];

export const TypeBienBan = {
  SUA_CHUA: "sua_chua",
  SU_CO: "su_co",
};
export type TypeBienBanType = (typeof TypeBienBan)[keyof typeof TypeBienBan];

export const AssetGroup = {
  MAYMOC: "MAY_MOC",
  PHUONGTIEN: "PHUONG_TIEN",
};
export type AssetGroupType = (typeof AssetGroup)[keyof typeof AssetGroup];

export const BIEN_PHAP_XU_LY = {
  PHUC_HOI: "Phục hồi",
  PHE_LIEU: "Phế liệu",
  HUY: "Hủy",
} as const;

export const LOAI_BIEN_BAN_TYPE = {
  KE_HOACH: "KE_HOACH",
  SUA_CHUA: "SUA_CHUA",
  PHIEU_SU_CO: "PHIEU_SU_CO",
  KIEM_TRA_SU_CO: "KIEM_TRA_SU_CO",
  GIAM_DINH_MAY_MOC: "GIAM_DINH_MAY_MOC",
  GIAM_DINH_PHUONG_TIEN: "GIAM_DINH_PHUONG_TIEN",
  BIEN_PHAP_MAY_MOC: "BIEN_PHAP_MAY_MOC",
  BIEN_PHAP_PHUONG_TIEN: "BIEN_PHAP_PHUONG_TIEN",
  NGHIEM_THU_MAY_MOC: "NGHIEM_THU_MAY_MOC",
  NGHIEM_THU_PHUONG_TIEN: "NGHIEM_THU_PHUONG_TIEN",
  DANH_GIA_VAT_TU: "DANH_GIA_VAT_TU",
} as const;
export const LOAI_BIEN_BAN_OPTIONS = [
  { id: LOAI_BIEN_BAN_TYPE.KE_HOACH, label: "Kế hoạch sửa chữa bảo dưỡng" },
  { id: LOAI_BIEN_BAN_TYPE.SUA_CHUA, label: "Đề nghị sửa chữa, bảo dưỡng" },
  { id: LOAI_BIEN_BAN_TYPE.PHIEU_SU_CO, label: "Phiếu báo sự cố thiết bị" },
  { id: LOAI_BIEN_BAN_TYPE.KIEM_TRA_SU_CO, label: "Biên bản kiểm tra sự cố" },
  {
    id: LOAI_BIEN_BAN_TYPE.GIAM_DINH_MAY_MOC,
    label: "Biên bản giám định kỹ thuật máy móc",
  },
  {
    id: LOAI_BIEN_BAN_TYPE.GIAM_DINH_PHUONG_TIEN,
    label: "Biên bản giám định phương tiện",
  },
  {
    id: LOAI_BIEN_BAN_TYPE.BIEN_PHAP_MAY_MOC,
    label: "Biện pháp sửa chữa máy móc",
  },
  {
    id: LOAI_BIEN_BAN_TYPE.BIEN_PHAP_PHUONG_TIEN,
    label: "Biện pháp sửa chữa phương tiện",
  },
  {
    id: LOAI_BIEN_BAN_TYPE.NGHIEM_THU_MAY_MOC,
    label: "Biên bản nghiệm thu máy móc",
  },
  {
    id: LOAI_BIEN_BAN_TYPE.NGHIEM_THU_PHUONG_TIEN,
    label: "Nghiệm thu sản phẩm phương tiện",
  },
  { id: LOAI_BIEN_BAN_TYPE.DANH_GIA_VAT_TU, label: "Biên bản đánh giá vật tư" },
];

