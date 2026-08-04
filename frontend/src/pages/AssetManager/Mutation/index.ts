import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import {
  AssetChildType,
  AssetFileType,
  AssetHoursType,
  AssetType,
  HistoryAssetType,
  SuaChuaMayThangType,
} from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import axios from "axios";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { generateCode } from "../../../utils/helpers";
import { Action, CongTy } from "../../../utils/const";

const getColumnLetter = (colIndex: number): string => {
  let letter = "";
  while (colIndex >= 0) {
    letter = String.fromCharCode((colIndex % 26) + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
};

export const useAssetManagerMutation = (
  onValidationError?: (messages: string[]) => void,
  onErrorImport?: (messages: string[]) => void,
) => {
  const queryClient = useQueryClient();
  const idCongTy = CongTy.CT001;
  const { user } = useSelector((state: RootState) => state.user);
  const now = dayjs().format("YYYY-MM-DDTHH:mm:ss");

  //taisan
  const createMutation = useMutation({
    mutationFn: async (data: AssetType) => {
      const listIdTaiSanCon = (data.taiSanConList || [])
        .filter((i: any) => !i.isDeleted)
        .map((i: any) => i.idTaiSanCon || i.id);
      const res = await api.post("/taisan", {
        ...data,
        listIdTaiSanCon,
        nguoiTao: user?.taiKhoan?.tenDangNhap || "",
        ngayTao: now,
      });
      return res.data;
    },
    onSuccess: (data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["assetsPage"], exact: false });
      showSuccessAlert("Tạo tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo tài sản thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AssetType) => {
      const listIdTaiSanCon = (data.taiSanConList || [])
        .filter((i: any) => !i.isDeleted)
        .map((i: any) => i.idTaiSanCon || i.id);
      const res = await api.put(`/taisan/${data.id}`, {
        ...data,
        listIdTaiSanCon,
        nguoiCapNhat: user?.taiKhoan?.tenDangNhap || "",
        ngayCapNhat: now,
      });
      return res.data;
    },
    onSuccess: (data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["assetsPage"], exact: false });
      showSuccessAlert("Sửa tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa tài sản thất bại",
      );
    },
  });
  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/taisan/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetsPage"] });
      showSuccessAlert("Xóa tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa tài sản thất bại",
      );
    },
  });
  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/taisan/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetsPage"] });
      showSuccessAlert(data || "Xóa tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa tài sản thất bại",
      );
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: AssetType[]) => {
      const formattedData = data.map((item) => ({
        ...item,
        nguoiTao: user?.taiKhoan?.tenDangNhap || "",
        ngayTao: now,
      }));
      const res = await api.post("/taisan/batch", formattedData);
      return { res: res.data, payload: data };
    },
    onSuccess: (data) => {
      // For each asset in the batch, we might need to create child assets
      queryClient.invalidateQueries({ queryKey: ["assetsPage"], exact: false });
      showSuccessAlert("Tạo danh sách tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Tạo danh sách tài sản thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/taisan/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetsPage"] });
      showSuccessAlert(data || "Xóa tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa tài sản thất bại",
      );
    },
  });

  // taisancon
  const createChildAssetBulkMutation = useMutation({
    mutationFn: async (data: AssetChildType[]) => {
      const res = await api.post("/taisan/taisancon/bulk", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetsChild"] });
      console.log("Tạo tài sản con thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message ||
          error.message ||
          "Tạo tài sản con thất bại",
      );
    },
  });

  const deleteOneChildAsssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/taisan/taisancon/`, {
        params: { idTaiSanCon: id },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetsChild"] });
      console.log("Xóa tài sản thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message ||
          error.message ||
          "Xóa tài sản thất bại",
      );
    },
  });

  const createManyHistoryAssetMutation = useMutation({
    mutationFn: async (data: HistoryAssetType[]) => {
      const res = await api.post(`/lichsudieuchuyentaisan/batch`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["historyAssetHandover"] });
      showSuccessAlert("Tạo lịch sử điều chuyển thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo lịch sử điều chuyển thất bại",
      );
    },
  });

  const updateHistoryAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/lichsudieuchuyentaisan/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historyAssetHandover"] });
      showSuccessAlert("Cập nhật lịch sử điều chuyển thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Cập nhật thất bại");
    },
  });
  const updateHistoryAssetManyMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const res = await api.put(`/lichsudieuchuyentaisan/batch`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historyAssetHandover"] });
      showSuccessAlert("Cập nhật lịch sử điều chuyển thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Cập nhật thất bại");
    },
  });

  const deleteHistoryAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/lichsudieuchuyentaisan/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historyAssetHandover"] });
      showSuccessAlert("Xóa lịch sử điều chuyển thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Xóa thất bại");
    },
  });

  const updateAssetOwnershipMutation = useMutation({
    mutationFn: async (data: { id: string; idDonVi: string }[]) => {
      const res = await api.put(`/taisan/updatedonvi`, data);
      return res.data;
    },
    onSuccess: (response, data) => {
      queryClient.invalidateQueries({ queryKey: ["assetsPage"] });

      console.log("Cập nhật tài sản theo đơn vị thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message ||
          error.message ||
          "Cập nhật tài sản theo đơn vị thất bại",
      );
    },
  });

  // --- 1. Mutation Xuất Excel ---
  const exportAssetMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get("/taisan/export/excel", {
        params: { idcongty: idCongTy },
        responseType: "blob",
      });
      return res.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Danh_Sach_Tai_San_${dayjs().format("YYYYMMDD")}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccessAlert("Xuất file Excel thành công");
    },
    onError: () => showErrorAlert("Xuất file thất bại"),
  });

  // --- 2. Mutation Nhập Excel (Mapping 37 trường) ---
  const importAssetMutation = useMutation({
    mutationFn: async (file: File) => {
      // Gọi API gác cổng lấy nhóm tài sản
      const responseGroups = await api.get("/nhomtaisan", {
        params: { idcongty: idCongTy },
      });
      const currentAssetGroups = responseGroups.data || [];

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            const errorMessages: string[] = [];
            const maxErrorsBeforeExit = 500;

            // --- GIAI ĐOẠN 1: VALIDATE TOÀN BỘ FILE ---
            for (let index = 0; index < jsonData.length; index++) {
              const item: any = jsonData[index];
              const rowIndex = index + 2;

              // 1. Kiểm tra mã nhóm tài sản
              const maNhomExcel = String(item["Mã nhóm tài sản"] || "").trim();
              const groupExists = currentAssetGroups.some(
                (g: any) => g.id === maNhomExcel,
              );

              if (!maNhomExcel) {
                errorMessages.push(
                  `Cột H - Hàng ${rowIndex}: Mã nhóm tài sản đang bỏ trống`,
                );
              } else if (!groupExists) {
                errorMessages.push(
                  `Cột H - Hàng ${rowIndex}: Mã nhóm [${maNhomExcel}] không tồn tại`,
                );
              }

              // 2. Kiểm tra các trường bắt buộc khác
              if (!item["Mã tài sản"]) {
                errorMessages.push(
                  `Cột B - Hàng ${rowIndex}: ID tài sản đang bỏ trống`,
                );
              }
              if (!item["Số thẻ tài sản"]) {
                errorMessages.push(
                  `Cột C - Hàng ${rowIndex}: Số thẻ tài sản đang bỏ trống`,
                );
              }
              if (!item["Tên tài sản"]) {
                errorMessages.push(
                  `Cột D - Hàng ${rowIndex}: Tên tài sản đang bỏ trống`,
                );
              }
              // if (!item["Mã đơn vị hiện thời"]) {
              //   errorMessages.push(
              //     `Cột AF - Hàng ${rowIndex}: Mã đơn vị hiện thời đang bỏ trống`,
              //   );
              // }

              // 3. Kiểm tra định dạng số cho các nguồn vốn
              const fieldsToCheck = [
                "Vốn NS",
                "Vốn vay",
                "Vốn khác",
                "Năm sản xuất",
              ];
              fieldsToCheck.forEach((field) => {
                const val = String(item[field] || "").trim();
                if (val && isNaN(Number(val.replace(/[^0-9.]/g, "")))) {
                  errorMessages.push(
                    `Hàng ${rowIndex}: Cột ${field} phải là số, không được là chữ: "${val}"`,
                  );
                }
              });

              // Kiểm tra giới hạn lỗi
              if (errorMessages.length >= maxErrorsBeforeExit) {
                errorMessages.push(
                  `... Đã dừng kiểm tra sớm do quá nhiều lỗi (>${maxErrorsBeforeExit} lỗi).`,
                );
                break;
              }
            }

            // --- GIAI ĐOẠN 2: KIỂM TRA LỖI TỔNG THỂ ---
            if (errorMessages.length > 0) {
              // Nếu có bất kỳ lỗi nào, reject ngay lập tức và không thực hiện mapping/batching
              return reject({
                isValidationError: true,
                messages: errorMessages,
              });
            }

            // --- GIAI ĐOẠN 3: MAPPING DỮ LIỆU (Chỉ chạy khi 0 lỗi) ---
            const allAssets: AssetType[] = [];
            jsonData.forEach((item: any) => {
              const vonNS =
                Number(String(item["Vốn NS"] || "0").replace(/[^0-9.]/g, "")) ||
                0;
              const vonVay =
                Number(
                  String(item["Vốn vay"] || "0").replace(/[^0-9.]/g, ""),
                ) || 0;
              const vonKhac =
                Number(
                  String(item["Vốn khác"] || "0").replace(/[^0-9.]/g, ""),
                ) || 0;

              allAssets.push({
                id: String(item["Mã tài sản"] || ""),
                soThe: String(item["Số thẻ tài sản"] || ""),
                tenTaiSan: String(item["Tên tài sản"] || ""),
                idLoaiTaiSan: String(item["Mã loại tài sản"] || ""),
                idLoaiTaiSanCon: String(item["Mã loại tài sản"] || ""),
                idNhomTaiSan: String(item["Mã nhóm tài sản"] || ""),
                idDuDan: String(item["Mã dự án"] || ""),
                idNguonVon: String(item["Mã nguồn vốn"] || ""),
                nvNS: vonNS,
                vonVay: vonVay,
                vonKhac: vonKhac,
                nguyenGia: vonNS + vonVay + vonKhac,
                giaTriKhauHaoBanDau:
                  Number(item["Giá trị khấu hao ban đầu"]) || 0,
                kyKhauHaoBanDau: Number(item["Kỳ khấu hao ban đầu"]) || 0,
                giaTriThanhLy: Number(item["Giá trị thanh lý"]) || 0,
                idMoHinhTaiSan: String(item["Mã mô hình tài sản"] || ""),
                phuongPhapKhauHao: Number(item["Phương pháp khấu hao"]) || 0,
                soKyKhauHao: Number(item["Số kỳ khấu hao"]) || 0,
                taiKhoanTaiSan: Number(item["TK tài sản"]) || 0,
                taiKhoanKhauHao: Number(item["TK khấu hao"]) || 0,
                taiKhoanChiPhi: Number(item["TK chi phí"]) || 0,
                ngayVaoSo: item["Ngày vào sổ"]
                  ? dayjs(item["Ngày vào sổ"]).format("YYYY-MM-DDTHH:mm:ss")
                  : now,
                ngaySuDung: item["Ngày sử dụng"]
                  ? dayjs(item["Ngày sử dụng"]).format("YYYY-MM-DDTHH:mm:ss")
                  : now,
                kyHieu: String(item["Ký hiệu"] || ""),
                soKyHieu: String(item["Số ký hiệu"] || ""),
                congSuat: String(item["Công suất"] || ""),
                nuocSanXuat: String(item["Nước sản xuất"] || ""),
                namSanXuat: Number(item["Năm sản xuất"]) || 0,
                lyDoTang: String(item["Lý do tăng"] || ""),
                hienTrang: Number(item["Hiện trạng"]) || 0,
                soLuong: 1,
                donViTinh: String(item["Đơn vị tính"] || ""),
                ghiChu: String(item["Ghi chú"] || ""),
                idDonViBanDau: String(item["Mã đơn vị ban đầu"] || "Kty"),
                idDonViHienThoi: String(item["Mã đơn vị hiện thời"] || ""),
                idDonViQuanlyKiThuat: String(
                  item["Mã đơn vị quản lý kỹ thuật"] || "",
                ),
                moTa: String(item["Mô tả"] || ""),
                idCongTy: idCongTy,
                ngayTao: now,
                ngayCapNhat: now,
                nguoiTao: user?.taikhoan?.tenDangNhap || "",
                nguoiCapNhat: user?.taikhoan?.tenDangNhap || "",
                isActive: true,
                isTaiSanCon: false,
              });
            });

            // --- GIAI ĐOẠN 4: GỬI BATCH (100 item/lần) ---
            const batchSize = 100;
            for (let i = 0; i < allAssets.length; i += batchSize) {
              const batch = allAssets.slice(i, i + batchSize);
              await api.post("/taisan/batch", batch);
            }

            resolve(true);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsBinaryString(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assetsPage"] });
      showSuccessAlert("Import tài sản thành công!");
    },
    onError: (error: any) => {
      if (error.isValidationError) {
        // Gọi callback để mở Modal từ UI thay vì Alert
        if (onValidationError) {
          onValidationError(error.messages);
        }
      } else {
        showErrorAlert(
          error.response?.data?.message || "Lỗi khi gửi dữ liệu lên máy chủ",
        );
      }
    },
  });

  // ---3. Thêm tệp đính kèm
  const createFileMutation = useMutation({
    mutationFn: async (data: AssetFileType[]) => {
      const res = await api.post(
        "/taisan-file/batch",
        data.map((i) => {
          return {
            ...i,
            idTaiSan: i.idTaiSan,
            nguoiTao: user?.taiKhoan?.tenDangNhap || "",
            ngayTao: now,
          };
        }),
      );
      return res.data;
    },
    onSuccess: (data, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["assetsPage"],
        exact: false,
      });
      console.log("Tạo file đính kèm thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message ||
          error.message ||
          "Tạo file đính kèm thất bại",
      );
    },
  });
  const deleteFileManyMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await api.delete(`/taisan-file/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetsPage"] });
      console.log(data || "Xóa tệp đính kèm thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message ||
          error.message ||
          "Xóa tệp đính kèm thất bại",
      );
    },
  });

  const syncTaiSanMutation = useMutation({
    mutationFn: async (dbConfigId: string) => {
      const res = await api.post(`/migration/sync-tai-san/${dbConfigId}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetsPage"] });
      showSuccessAlert(data || "Đồng bộ dữ liệu SQL Server thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data || error.message || "Quá trình đồng bộ thất bại",
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteOneMutation,
    deleteManyMutation,
    exportAssetMutation,
    importAssetMutation,
    updateHistoryAssetMutation,
    updateHistoryAssetManyMutation,
    deleteHistoryAssetMutation,
    createChildAssetBulkMutation,
    deleteOneChildAsssetMutation,
    createManyHistoryAssetMutation,
    updateAssetOwnershipMutation,
    deleteAllMutation,
    createBatchMutation,
    syncTaiSanMutation,
  };
};

export const useGioHoatDongMutation = () => {
  const queryClient = useQueryClient();
  const idCongTy = CongTy.CT001;
  const { user } = useSelector((state: RootState) => state.user);
  const now = dayjs().format("YYYY-MM-DDTHH:mm:ss");

  const createMutation = useMutation({
    mutationFn: async (data: AssetHoursType[]) => {
      const res = await api.post("/giohoatdong/batch", data);
      return res.data;
    },
    onSuccess: (data, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["assetHoursGroup"],
        exact: false,
      });
      showSuccessAlert("Tạo giờ hoạt động thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo giờ hoạt động thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AssetHoursType[]) => {
      const res = await api.put(
        `/giohoatdong/batch`,
        data.map((i) => ({
          ...i,
          ngayCapNhat: now,
        })),
      );
      return res.data;
    },
    onSuccess: (data, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["assetHoursGroup"],
        exact: false,
      });
      showSuccessAlert("Sửa giờ hoạt động thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa giờ hoạt động thất bại",
      );
    },
  });
  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/giohoatdong/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetHoursGroup"] });
      showSuccessAlert(data || "Xóa giờ hoạt động thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa giờ hoạt động thất bại",
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteManyMutation,
  };
};

export const useAssetHoursPageQuery = (
  page?: number,
  pageSize?: number,
  idTaiSan?: string,
  nam?: number,
  thang?: number,
) => {
  return useQuery({
    queryKey: ["assetHoursPage", page, pageSize, idTaiSan, nam, thang], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("giohoatdong", {
        params: {
          page: page,
          size: pageSize,
          idTaiSan,
          nam,
          thang,
        },
      });
      return res.data.data || res.data;
    },
    enabled: !!idTaiSan,
    placeholderData: (previousData) => previousData,
  });
};

export const useAssetInspectionPageQuery = (
  page?: number,
  pageSize?: number,
  soNgayThongBaoKiemDinh?: number,
) => {
  return useQuery({
    queryKey: ["assetInspectionPage", page, pageSize, soNgayThongBaoKiemDinh], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("taisan/sap-het-han-kiem-dinh", {
        params: {
          idcongty: CongTy.CT001,
          page: page,
          size: pageSize,
          soNgayThongBaoKiemDinh,
        },
      });
      return res.data.data || res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};
// tài sản đến kỳ sửa chữa
export const useAssetRepairTimePageQuery = (
  page?: number,
  pageSize?: number,
  userId?: string,
) => {
  return useQuery({
    queryKey: ["assetRepairTimePage", page, pageSize, userId],
    queryFn: async () => {
      const res = await api.get("taisan/sap-den-ky-sua-chua", {
        params: {
          idCongTy: CongTy.CT001,
          page: page,
          size: pageSize,
          userId,
        },
      });
      return res.data.data || res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};
export const useAssetHoursByGroupPageQuery = (idTaiSan?: string) => {
  return useQuery({
    queryKey: ["assetHoursGroup", idTaiSan], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("giohoatdong/group_year", {
        params: {
          idTaiSan,
        },
      });
      return res.data.data || res.data || [];
    },
    enabled: !!idTaiSan,
    placeholderData: (previousData) => previousData,
  });
};

export const useAssetPageQuery = (
  tab?: number,
  page?: number,
  pageSize?: number,
  searchValue?: string,
  idNhomTaiSan?: string,
  idDonViHienThoi?: string,
  soNgayThongBaoKiemDinh?: number,
  idDonViBanDau?: string,
  trangThaiKiemDinh?: string,
  isPhatSinh?: boolean,
) => {
  return useQuery({
    queryKey: [
      "assetsPage",
      page,
      pageSize,
      searchValue,
      idNhomTaiSan,
      tab,
      idDonViHienThoi,
      soNgayThongBaoKiemDinh,
      trangThaiKiemDinh,
      isPhatSinh,
    ], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get(
        tab === 0
          ? "/taisan/by-donvi-thuhoi/paged"
          : tab === 1
            ? "/taisan/paged-da-ban-giao"
            : tab === 2
              ? "/taisan/by-donvi-bandau/paged"
              : "/taisan/by-donvi-thuhoi/paged",
        {
          params: {
            idcongty: CongTy.CT001,
            page: page,
            size: pageSize,
            search: searchValue,
            idNhomTaiSan: idNhomTaiSan,
            iddonvihienthoi: tab === 0 ? "kth" : idDonViHienThoi,
            soNgayThongBaoKiemDinh: soNgayThongBaoKiemDinh,
            iddonvibandau: idDonViBanDau,
            trangThaiKiemDinh: trangThaiKiemDinh,
            isPhatSinh: isPhatSinh ? true : undefined,
          },
        },
      );
      return res.data.data || res.data;
    },
    enabled: tab !== undefined && tab >= 0,
    placeholderData: (previousData) => previousData,
  });
};

export const useAllAssetsByDepartmentQuery = (idDepartment?: string) => {
  return useQuery({
    queryKey: ["allAssetsByDepartment", idDepartment], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/taisan", {
        params: {
          idcongty: CongTy.CT001,
          idDonViQuanLy: idDepartment,
        },
      });
      return res.data.data || res.data;
    },
    enabled: !!idDepartment,
  });
};

export const useAllAssetsQuery = (
  idDepartment?: string,
  isHeThong?: boolean,
) => {
  return useQuery({
    queryKey: ["allAssets", isHeThong, idDepartment], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/taisan", {
        params: {
          idcongty: CongTy.CT001,
          ...(isHeThong !== undefined && { isHeThong }),
          ...(idDepartment && { idDonViQuanLy: idDepartment }),
        },
      });
      return res.data.data || res.data;
    },
  });
};

export const useAssetByTypeQuery = (idloaitaisan?: string) => {
  return useQuery({
    queryKey: ["assetsByType", idloaitaisan], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/taisan/loaitaisan/", {
        params: {
          idloataisan: idloaitaisan,
        },
      });
      return res.data.data || res.data || [];
    },
    placeholderData: (placeholderData) => placeholderData,
    enabled: !!idloaitaisan,
  });
};

export const useAssetDepreciationsQuery = (
  date?: string,
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  return useQuery({
    queryKey: ["assetDepreciationsPage", date, page, pageSize, searchValue], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/taisan/khauhaotaisan", {
        params: {
          idcongty: CongTy.CT001,
          ngay: date ? new Date(date).getDate() : undefined,
          thang: date ? new Date(date).getMonth() + 1 : undefined,
          nam: date ? new Date(date).getFullYear() : undefined,
          page,
          size: pageSize,
          search: searchValue,
        },
      });
      return res.data.data || res.data;
    },
    enabled: !!date,
    placeholderData: (previousData) => previousData,
  });
};

export const useHistoryAssethandoverQuery = (
  page?: number,
  pageSize?: number,
  fromDate?: string,
  toDate?: string,
  idTaiSan?: string,
) => {
  return useQuery({
    queryKey: [
      "historyAssetHandover",
      page,
      pageSize,
      fromDate,
      toDate,
      idTaiSan,
    ], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/lichsudieuchuyentaisan", {
        params: {
          page,
          size: pageSize,
          fromDate,
          toDate,
          idTaiSan,
        },
      });
      return res.data;
    },
    placeholderData: (placeholderData) => placeholderData,
    enabled: !!idTaiSan,
  });
};

export const useChuKySuaChuaMutation = () => {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const res = await api.post(`/chukysuachua/sync`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chuKySuaChua"] });
      // Thong bao se duoc hien thi ow component cha neu can
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Đồng bộ chu kỳ sửa chữa thất bại",
      );
    },
  });

  return {
    syncMutation,
  };
};

export const useChuKySuaChuaQuery = (idTaiSan?: string) => {
  return useQuery({
    queryKey: ["chuKySuaChua", idTaiSan],
    queryFn: async () => {
      const res = await api.get(`/chukysuachua/${idTaiSan}`);
      return res.data.data || res.data || [];
    },
    enabled: !!idTaiSan,
    placeholderData: (previousData) => previousData,
  });
};

export const useLichTrinhQuery = (
  idTaiSan?: string,
  nam?: number,
  thang?: number,
) => {
  return useQuery({
    queryKey: ["lichtrinh", idTaiSan, nam, thang],
    queryFn: async () => {
      const res = await api.get(`/lichtrinh`, {
        params: { idTaiSan, nam, thang },
      });
      const list = res.data.data || res.data || [];
      return list[0] ?? null; // chỉ cần 1 record theo tài sản
    },
    enabled: !!idTaiSan && !!nam && !!thang,
    staleTime: 30_000,
  });
};

export const useLuyKeQuery = (
  idTaiSan?: string,
  nam?: number,
  thang?: number,
) => {
  return useQuery({
    queryKey: ["luyKe", idTaiSan, nam, thang],
    queryFn: async () => {
      const res = await api.get(`/lichtrinh/luy-ke`, {
        params: { idTaiSan, nam, thang },
      });
      return res.data.data;
    },
    enabled: !!idTaiSan && !!nam && !!thang,
    staleTime: 30_000,
  });
};

export const useLichTrinhYearQuery = (idTaiSan?: string, nam?: number) => {
  return useQuery({
    queryKey: ["lichtrinhYear", idTaiSan, nam],
    queryFn: async () => {
      const res = await api.get(`/lichtrinh`, { params: { idTaiSan, nam } });
      return res.data.data || res.data || [];
    },
    enabled: !!idTaiSan && !!nam,
    staleTime: 30_000,
  });
};

export const useCreateLichTrinhBatchMutation = () => {
  return useMutation({
    mutationFn: async (data: any[]) => {
      const res = await api.post("/lichtrinh/batch", data);
      return res.data;
    },
  });
};

export const useUpdateLichTrinhBatchMutation = () => {
  return useMutation({
    mutationFn: async (data: any[]) => {
      const res = await api.put("/lichtrinh/batch", data);
      return res.data;
    },
  });
};

// Query lấy danh sách tài sản con theo idTaiSanCha (bao gồm cả đã điều chuyển)
export const useTaiSanConQuery = (idTaiSanCha?: string) => {
  return useQuery({
    queryKey: ["taiSanCon", idTaiSanCha],
    queryFn: async () => {
      const res = await api.get(`/taisan/taisancon/${idTaiSanCha}`);
      return res.data.data || res.data || [];
    },
    enabled: !!idTaiSanCha,
  });
};

// Hooks cho Bảng kê phụ tùng tài sản (phu_tung_tai_san)
export const usePhuTungTaiSanQuery = (idTaiSan?: string) => {
  return useQuery({
    queryKey: ["phuTungTaiSan", idTaiSan],
    queryFn: async () => {
      if (!idTaiSan) return [];
      const res = await api.get(`/phu-tung-tai-san/by-taisan/${idTaiSan}`);
      return res.data.data || res.data || [];
    },
    enabled: !!idTaiSan,
  });
};

export const useCreateBatchPhuTungMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (list: any[]) => {
      const res = await api.post("/phu-tung-tai-san/batch", list);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phuTungTaiSan"] });
    },
  });
};

export const useUpdateBatchPhuTungMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (list: any[]) => {
      const res = await api.put("/phu-tung-tai-san/batch", list);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phuTungTaiSan"] });
    },
  });
};

export const useDeleteBatchPhuTungMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete("/phu-tung-tai-san/batch", { data: ids });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phuTungTaiSan"] });
    },
  });
};

// Hooks cho Theo dõi sự cố tài sản (su_co_tai_san)
export const useSuCoTaiSanQuery = (idTaiSan?: string) => {
  return useQuery({
    queryKey: ["suCoTaiSan", idTaiSan],
    queryFn: async () => {
      if (!idTaiSan) return [];
      const res = await api.get(`/su-co-tai-san/by-taisan/${idTaiSan}`);
      return res.data.data || res.data || [];
    },
    enabled: !!idTaiSan,
  });
};

export const useCreateBatchSuCoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (list: any[]) => {
      const res = await api.post("/su-co-tai-san/batch", list);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suCoTaiSan"] });
    },
  });
};

export const useUpdateBatchSuCoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (list: any[]) => {
      const res = await api.put("/su-co-tai-san/batch", list);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suCoTaiSan"] });
    },
  });
};

export const useDeleteBatchSuCoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete("/su-co-tai-san/batch", { data: ids });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suCoTaiSan"] });
    },
  });
};

// ===== THEO DÕI SỬA CHỮA MÁY TỪNG THÁNG =====

export const useSuaChuaMayThangQuery = (idTaiSan?: string) => {
  return useQuery({
    queryKey: ["sua-chua-may-thang", idTaiSan],
    queryFn: async () => {
      const res = await api.get(
        `/sua-chua-may-thang/by-taisan/${idTaiSan}`,
      );
      return res.data?.data;
    },
    enabled: !!idTaiSan,
  });
};

export const useCreateBatchSuaChuaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SuaChuaMayThangType>[]) => {
      const res = await api.post(
        "/sua-chua-may-thang/batch",
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sua-chua-may-thang"] });
    },
  });
};

export const useUpdateBatchSuaChuaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SuaChuaMayThangType>[]) => {
      const res = await api.put(
        "/sua-chua-may-thang/batch",
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sua-chua-may-thang"] });
    },
  });
};

export const useDeleteBatchSuaChuaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete("/sua-chua-may-thang/batch", {
        data: ids,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sua-chua-may-thang"] });
    },
  });
};
