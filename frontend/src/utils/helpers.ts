import { sha256 } from "js-sha256";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { AssetTransferData } from "../pages/AssetTransfer/types";
import { ToolTransferData } from "../pages/ToolTransfer/types";
import { AssetHandoverData } from "../pages/AssetHandover/types";
import { ToolHandoverData } from "../pages/ToolHandover/types";

dayjs.extend(customParseFormat);

export const findById = (array: any[], id: any) => {
  return array.find((item) => item.id?.toString() === id?.toString());
};
export const generateCode = (prefix: string) => {
  const now = new Date();

  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const random = Math.random().toString(36).substring(2, 4).toUpperCase();

  return `${prefix}${yyyy}${MM}${dd}-${HH}${mm}${ss}-${random}`;
};

export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

export const formattedPrice = (price?: number | null) => {
  if (!price) return "";

  return new Intl.NumberFormat("de-DE").format(Math.round(price));
};

export const formatDecimal = (decimal?: number) => {
  if (!decimal) return "";
  return new Intl.NumberFormat("en-de", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(decimal);
};
export const s = (v: any, fallback: string = ""): string => {
  const str = v?.toString().trim();
  return str || fallback;
};

export const b = (v: any, fallback: boolean = false): boolean => {
  if (v === null || v === undefined) return fallback;

  if (typeof v === "boolean") return v;

  if (typeof v === "number") return v !== 0;

  const str = v.toString().trim().toLowerCase();
  if (str.length === 0) return fallback;

  return str === "true" || str === "1" || str === "yes" || str === "y";
};

export const formatDateTime = (v: any) => {
  const dateStr = v ? v.toString() : new Date().toISOString();
  return dateStr.replace("T", " ").replace("Z", "").split(".")[0];
};
export const generateSha256 = (value: string) => {
  return sha256(value);
};
export function formatted(date?: string | null): string {
  if (!date || date.trim() === "") {
    console.debug("formatted", "Empty date string");
    return "ngày ... tháng ... năm ...";
  }

  // Định dạng mới
  let d = dayjs(date, "YYYY-MM-DD HH:mm:ss", true);
  if (d.isValid()) {
    return d.format("[ngày] DD [tháng] MM [năm] YYYY");
  }

  // Fallback định dạng cũ
  d = dayjs(date, "YYYY-MM-DDTHH:mm:ss.SSSZ", true);
  if (d.isValid()) {
    return d.format("[ngày] DD [tháng] MM [năm] YYYY");
  }

  // Thử parse mặc định không dùng strict mode (cho các format như YYYY-MM-DD)
  d = dayjs(date);
  if (d.isValid()) {
    return d.format("[ngày] DD [tháng] MM [năm] YYYY");
  }

  console.debug("formatted", `Failed to parse date: ${date}`);
  return "ngày ... tháng ... năm ...";
}

export function getAssetTransferCount(
  type: number,
  userTenDangNhap: string,
  assetTransferList: AssetTransferData[],
  isBanHanh?: boolean,
) {
  if (!assetTransferList || assetTransferList.length === 0) return 0;

  if (isBanHanh) {
    return assetTransferList.filter((item) => {
      if (item.loai !== type) return false;
      return item.trangThai === 3;
    }).length;
  }
  return assetTransferList.filter((item) => {
    // ===== Filter 1: share hoặc người tạo =====
    if (item.trangThai === 2) return false;

    if (item.share !== true && item.nguoiTao !== userTenDangNhap) {
      return false;
    }

    // ===== Filter 2: loại =====
    if (item.loai !== type) {
      return false;
    }

    // ===== Build signature group =====
    const idSignatureGroup = [];

    // 1. Người lập phiếu ký nhảy
    if (item.nguoiLapPhieuKyNhay === true) {
      idSignatureGroup.push({
        id: item.idNguoiKyNhay,
        signed: item.trangThaiKyNhay === true,
      });
    }

    // 2. Trình duyệt cấp phòng
    idSignatureGroup.push({
      id: item.idTrinhDuyetCapPhong,
      signed: item.trinhDuyetCapPhongXacNhan === true,
    });

    // 3. Danh sách người ký (sort theo id)
    if (Array.isArray(item.nguoiKyList) && item.nguoiKyList.length > 0) {
      const sortedSignatories = [...item.nguoiKyList].sort((a, b) =>
        (a.id ?? "").localeCompare(b.id ?? ""),
      );

      sortedSignatories.forEach((signatory) => {
        idSignatureGroup.push({
          id: signatory.idNguoiKy,
          signed: signatory.trangThai === 1,
        });
      });
    }

    // 4. Trình duyệt giám đốc
    idSignatureGroup.push({
      id: item.idTrinhDuyetGiamDoc,
      signed: item.trinhDuyetGiamDocXacNhan === true,
    });

    // ===== Check user =====
    const userIndex = idSignatureGroup.findIndex(
      (e) => e.id === userTenDangNhap,
    );

    // Không có trong danh sách ký
    if (userIndex === -1) return false;

    // User đã ký rồi
    if (idSignatureGroup[userIndex].signed === true) return false;

    // Tất cả người ký trước user phải đã ký
    for (let i = 0; i < userIndex; i++) {
      if (idSignatureGroup[i].signed !== true) {
        return false;
      }
    }

    return true;
  }).length;
}

export const getToolTransferCount = (
  type: number,
  userTenDangNhap: string,
  toolAndMaterialList?: ToolTransferData[],
  isBanHanh?: boolean,
): number => {
  if (!toolAndMaterialList || toolAndMaterialList.length === 0) return 0;
  if (isBanHanh) {
    return toolAndMaterialList.filter((item) => {
      if (item.loai !== type) return false;
      return item.trangThai === 3;
    }).length;
  }

  return toolAndMaterialList.filter((item) => {
    // ===== Filter 1: loại =====
    if (item.loai !== type) return false;

    if (item.trangThai === 2) return false;

    // ===== Filter 2: share hoặc người tạo =====
    if (item.share !== true && item.nguoiTao !== userTenDangNhap) {
      return false;
    }

    // ===== Build signature group =====
    const idSignatureGroup: { id?: string; signed: boolean }[] = [];

    // 1. Người lập phiếu ký nhảy
    if (item.nguoiLapPhieuKyNhay === true) {
      idSignatureGroup.push({
        id: item.idNguoiKyNhay,
        signed: item.trangThaiKyNhay === true,
      });
    }

    // 2. Trình duyệt cấp phòng
    idSignatureGroup.push({
      id: item.idTrinhDuyetCapPhong,
      signed: item.trinhDuyetCapPhongXacNhan === true,
    });

    // 3. Danh sách người ký (sort theo id)
    console.log(item);
    if (item.nguoiKyList && item.nguoiKyList.length > 0) {
      const sortedSignatories = [...item.nguoiKyList].sort((a, b) =>
        (a.id ?? "").localeCompare(b.id ?? ""),
      );

      sortedSignatories.forEach((signatory) => {
        idSignatureGroup.push({
          id: signatory.idNguoiKy,
          signed: signatory.trangThai === 1,
        });
      });
      console.log(sortedSignatories);
    }

    // 4. Trình duyệt giám đốc
    idSignatureGroup.push({
      id: item.idTrinhDuyetGiamDoc,
      signed: item.trinhDuyetGiamDocXacNhan === true,
    });

    // ===== Check user =====
    const userIndex = idSignatureGroup.findIndex(
      (e) => e.id === userTenDangNhap,
    );

    // User không có trong danh sách ký
    if (userIndex === -1) return false;

    // User đã ký
    if (idSignatureGroup[userIndex].signed) return false;

    // Tất cả người ký trước user phải đã ký
    for (let i = 0; i < userIndex; i++) {
      if (idSignatureGroup[i].signed !== true) {
        return false;
      }
    }

    return true;
  }).length;
};

const isUserPendingSignatureHandover = (
  signatureFlow: any[],
  userTenDangNhap: string,
): boolean => {
  const userIndex = signatureFlow.findIndex((e) => e.id === userTenDangNhap);

  // User không nằm trong flow
  if (userIndex === -1) return false;

  // User đã ký rồi
  if (signatureFlow[userIndex].signed) return false;

  // Tất cả người trước user phải đã ký
  for (let i = 0; i < userIndex; i++) {
    if (signatureFlow[i].signed !== true) {
      return false;
    }
  }

  return true;
};
export const getAssetHandoverCount = (
  userTenDangNhap: string,
  assetHandoverList?: AssetHandoverData[],
): number => {
  if (!assetHandoverList || assetHandoverList.length === 0) return 0;

  return assetHandoverList.filter((item) => {
    if (item.share !== true && item.nguoiTao !== userTenDangNhap) {
      return false;
    }

    if (item.trangThai === 2) return false;

    const signatureFlow: any[] = [];

    if (item.idDaiDienBenGiao) {
      signatureFlow.push({
        id: item.idDaiDienBenGiao,
        signed: item.daiDienBenGiaoXacNhan === true,
      });
    }

    if (item.idDaiDienBenNhan) {
      signatureFlow.push({
        id: item.idDaiDienBenNhan,
        signed: item.daiDienBenNhanXacNhan === true,
      });
    }

    if (item.nguoiKyList?.length) {
      item.nguoiKyList.forEach((s) => {
        if (s.idNguoiKy) {
          signatureFlow.push({
            id: s.idNguoiKy,
            signed: s.trangThai === 1,
          });
        }
      });
    }

    if (item.idGiamDoc) {
      signatureFlow.push({
        id: item.idGiamDoc,
        signed: item.giamDocKy === true,
      });
    }

    return isUserPendingSignatureHandover(signatureFlow, userTenDangNhap);
  }).length;
};

export const getToolHandoverCount = (
  userTenDangNhap: string,
  handoverList?: ToolHandoverData[],
): number => {
  if (!handoverList || handoverList.length === 0) return 0;

  return handoverList.filter((item) => {
    // Filter 1: share hoặc người tạo
    if (item.share !== true && item.nguoiTao !== userTenDangNhap) {
      return false;
    }

    if (item.trangThai === 2) return false;

    const signatureFlow: any[] = [];

    // 1. Đại diện đơn vị giao
    if (item.idDaiDienBenGiao) {
      signatureFlow.push({
        id: item.idDaiDienBenGiao,
        signed: item.daiDienBenGiaoXacNhan === true,
      });
    }

    // 2. Đại diện đơn vị nhận
    if (item.idDaiDienBenNhan) {
      signatureFlow.push({
        id: item.idDaiDienBenNhan,
        signed: item.daiDienBenNhanXacNhan === true,
      });
    }

    // 3. Danh sách người ký (GIỮ NGUYÊN THỨ TỰ)
    if (item.nguoiKyList?.length) {
      item.nguoiKyList.forEach((s) => {
        if (s.idNguoiKy) {
          signatureFlow.push({
            id: s.idNguoiKy,
            signed: s.trangThai === 1,
          });
        }
      });
    }

    // 4. Giám đốc
    if (item.idGiamDoc) {
      signatureFlow.push({
        id: item.idGiamDoc,
        signed: item.giamDocKy === true,
      });
    }

    return isUserPendingSignatureHandover(signatureFlow, userTenDangNhap);
  }).length;
};
