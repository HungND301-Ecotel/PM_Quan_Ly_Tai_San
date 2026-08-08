import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { AssetProfileType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import * as XLSX from "xlsx";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { s } from "../../../utils/helpers";
import dayjs from "dayjs";

export const useAssetProfileMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.user);
  const now = dayjs(new Date()).format("YYYY-MM-DDTHH:mm:ss");

  const createMutation = useMutation({
    mutationFn: async (data: AssetProfileType) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";
      const res = await api.post("/ly-lich", {
        maLyLich: data.maLyLich,
        tenLyLich: data.tenLyLich,
        moTa: data.moTa,
        idLyLichTemplate: data.idLyLichTemplate || null,
        idCongTy: data.idCongTy ?? "CT001",
        ngayTao: now,
        nguoiTao: currentUser,
        ngayCapNhat: now,
        nguoiCapNhat: currentUser,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["assetProfilesPage"] });
      showSuccessAlert("Tạo lý lịch thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo lý lịch thất bại",
      );
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: AssetProfileType[]) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";
      const payload = data.map((item) => ({
        maLyLich: item.maLyLich,
        tenLyLich: item.tenLyLich,
        moTa: item.moTa,
        idLyLichTemplate: item.idLyLichTemplate || null,
        idCongTy: item.idCongTy || null,
        ngayTao: now,
        nguoiTao: currentUser,
        ngayCapNhat: now,
        nguoiCapNhat: currentUser,
      }));
      const res = await api.post("/ly-lich/create-batch", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assetProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["assetProfilesPage"] });
      showSuccessAlert("Tạo hàng loạt lý lịch thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo hàng loạt lý lịch thất bại",
      );
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: async (data: AssetProfileType[]) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";
      const payload = data.map((item) => ({
        id: item.id,
        maLyLich: item.maLyLich,
        tenLyLich: item.tenLyLich,
        moTa: item.moTa,
        idLyLichTemplate: item.idLyLichTemplate || null,
        idCongTy: item.idCongTy || null,
        ngayCapNhat: now,
        nguoiCapNhat: currentUser,
      }));
      const res = await api.put("/ly-lich/update-batch", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assetProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["assetProfilesPage"] });
      showSuccessAlert("Sửa hàng loạt lý lịch thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa hàng loạt lý lịch thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AssetProfileType) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";

      const res = await api.put(`/ly-lich/${data.id}`, {
        id: data.id,
        maLyLich: data.maLyLich,
        tenLyLich: data.tenLyLich,
        moTa: data.moTa,
        idLyLichTemplate: data.idLyLichTemplate || null,
        idCongTy: data.idCongTy || null,
        ngayTao: now,
        nguoiTao: currentUser,
        ngayCapNhat: now,
        nguoiCapNhat: currentUser,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["assetProfilesPage"] });
      showSuccessAlert("Sửa lý lịch thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa lý lịch thất bại",
      );
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/ly-lich/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["assetProfilesPage"] });
      showSuccessAlert("Xóa lý lịch thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa lý lịch thất bại",
      );
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/ly-lich/delete-batch`, {
        data: ids,
      });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["assetProfilesPage"] });
      showSuccessAlert(data || "Xóa lý lịch thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa lý lịch thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/ly-lich/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetProfilesPage"] });
      showSuccessAlert(data || "Xóa lý lịch thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa lý lịch thất bại",
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const listRes = await api.get("/ly-lich");
      const dataToExport = listRes.data;
      const payload = dataToExport.map((item: AssetProfileType) => ({
        "Mã lý lịch": item.maLyLich || "",
        "Tên lý lịch": item.tenLyLich || "",
        "Mô tả": item.moTa || "",
        "Hiệu lực": item.hieuLuc ?? false,
        "Ngày tạo": item.ngayTao
          ? item.ngayTao.replace("T", " ").split(".")[0]
          : "",
        "Ngày cập nhật": item.ngayCapNhat
          ? item.ngayCapNhat.replace("T", " ").split(".")[0]
          : "",
      }));

      const response = await api.post("/upload/export", payload, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "danh_sach_ly_lich.xlsx");
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => showSuccessAlert("Xuất file lý lịch thành công"),
    onError: () => showErrorAlert("Lỗi khi kết nối server để xuất file"),
  });

  const importExcelMutation = useMutation({
    mutationFn: (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: "",
            });

            const listImport: any[] = [];
            const errorMessages: string[] = [];

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];

              if (!row[0] && !row[1]) continue;

              const maLyLich = s(row[0]);
              const tenLyLich = s(row[1]);
              const moTa = s(row[2]);

              const rowErrors: string[] = [];
              if (!maLyLich) rowErrors.push("Mã lý lịch không được để trống");
              if (!tenLyLich) rowErrors.push("Tên lý lịch không được để trống");

              if (rowErrors.length > 0) {
                errorMessages.push(`Dòng ${i + 1}: ${rowErrors.join(", ")}`);
              } else {
                listImport.push({
                  maLyLich,
                  tenLyLich,
                  moTa,
                });
              }
            }

            if (errorMessages.length > 0) {
              reject(new Error(errorMessages.join("\n")));
            } else if (listImport.length > 0) {
              const res = await api.post("/ly-lich/batch", listImport);
              resolve(res.data);
            } else {
              reject(new Error("File không có dữ liệu hợp lệ"));
            }
          } catch (err) {
            reject(new Error("Lỗi đọc file hoặc lỗi hệ thống"));
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assetProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["assetProfilesPage"] });
      showSuccessAlert("Import lý lịch thành công");
    },
    onError: (error: any) => {
      showErrorAlert(`Import dữ liệu thất bại: \n${error.message}`);
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteOneMutation,
    deleteManyMutation,
    exportMutation,
    importExcelMutation,
    deleteAllMutation,
    createBatchMutation,
    updateBatchMutation,
  };
};

export const useAssetProfilePageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  return useQuery({
    queryKey: ["assetProfilesPage", page, pageSize, searchValue],
    queryFn: async () => {
      const res = await api.get("/ly-lich", {
        params: {
          page: page,
          size: pageSize,
          search: searchValue,
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useAllAssetProfileQuery = () => {
  return useQuery({
    queryKey: ["allAssetProfiles"],
    queryFn: async () => {
      const res = await api.get("/ly-lich");
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useLyLichTemplateQuery = () => {
  return useQuery({
    queryKey: ["lyLichTemplate"],
    queryFn: async () => {
      const res = await api.get("/ly-lich-template");
      return res.data.data; // extract the nested data array
    },
  });
};
