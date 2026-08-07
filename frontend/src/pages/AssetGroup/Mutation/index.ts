import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { AssetGroupType, LyLichType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import * as XLSX from "xlsx";
import { b, formatDateTime, s } from "../../../utils/helpers";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import dayjs from "dayjs";
import { CongTy } from "../../../utils/const";

export const useAssetGroupMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.user);
  const now = dayjs(new Date()).format("YYYY-MM-DDTHH:mm:ss");

  const createMutation = useMutation({
    mutationFn: async (data: AssetGroupType) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";
      const res = await api.post("/nhomtaisan", {
        ...data,
        ngayTao: now,
        nguoiTao: currentUser,
        ngayCapNhat: now,
        nguoiCapNhat: currentUser,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetGroups"] });
      queryClient.invalidateQueries({ queryKey: ["assetGroupsPage"] });
      showSuccessAlert("Tạo nhóm tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo nhóm tài sản thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AssetGroupType) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";
      const res = await api.put(`/nhomtaisan/${data.id}`, {
        ...data,
        ngayCapNhat: now,
        nguoiCapNhat: currentUser,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetGroups"] });
      queryClient.invalidateQueries({ queryKey: ["assetGroupsPage"] });
      showSuccessAlert("Sửa nhóm tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa nhóm tài sản thất bại",
      );
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/nhomtaisan/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetGroups"] });
      queryClient.invalidateQueries({ queryKey: ["assetGroupsPage"] });
      showSuccessAlert("Xóa nhóm tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa nhóm tài sản thất bại",
      );
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/nhomtaisan/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetGroups"] });
      queryClient.invalidateQueries({ queryKey: ["assetGroupsPage"] });
      showSuccessAlert(data || "Xóa nhóm tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa nhóm tài sản thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/nhomtaisan/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assetGroupsPage"] });
      showSuccessAlert(data || "Xóa nhóm tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa nhóm tài sản thất bại",
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const listRes = await api.get("/nhomtaisan", {
        params: { idcongty: CongTy.CT001 },
      });
      const dataToExport = listRes.data;
      const payload = dataToExport.map((item: AssetGroupType) => ({
        "Mã nhóm tài sản": item.id || "",
        "Tên nhóm tài sản": item.tenNhom || "",
        "Tên lý lịch": item.lyLich?.tenLyLich || "N/A",
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
      link.setAttribute("download", "danh_sach_nhom_tai_san.xlsx");
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => showSuccessAlert("Xuất file nhóm tài sản thành công"),
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

            const listImport: AssetGroupType[] = [];
            const errorMessages: string[] = [];
            const currentUser = "admin";

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];

              if (!row[0] && !row[1]) continue;

              const id = s(row[0]);
              const tenNhom = s(row[1]);
              const hieuLuc = b(row[2]);
              const ngayTao = formatDateTime(row[3]);
              const ngayCapNhat = formatDateTime(row[4]);

              const rowErrors: string[] = [];
              if (!id) rowErrors.push("Mã nhóm tài sản không được để trống");
              if (!tenNhom)
                rowErrors.push("Tên nhóm tài sản không được để trống");

              if (rowErrors.length > 0) {
                errorMessages.push(`Dòng ${i + 1}: ${rowErrors.join(", ")}`);
              } else {
                listImport.push({
                  id,
                  tenNhom,
                  hieuLuc,
                  idCongTy: CongTy.CT001,
                  ngayTao,
                  ngayCapNhat,
                  nguoiTao: currentUser,
                  nguoiCapNhat: currentUser,
                });
              }
            }

            if (errorMessages.length > 0) {
              reject(new Error(errorMessages.join("\n")));
            } else if (listImport.length > 0) {
              const res = await api.post("/nhomtaisan/batch", listImport);
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
      queryClient.invalidateQueries({ queryKey: ["assetGroups"] });
      queryClient.invalidateQueries({ queryKey: ["assetGroupsPage"] });
      showSuccessAlert("Import nhóm tài sản thành công");
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
  };
};

export const useAssetGroupPageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  return useQuery({
    queryKey: ["assetGroupsPage", page, pageSize, searchValue],
    queryFn: async () => {
      const res = await api.get("/nhomtaisan/paged", {
        params: {
          idCongTy: CongTy.CT001,
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

export const useAllAssetGroupQuery = () => {
  return useQuery({
    queryKey: ["allAssetGroups"],
    queryFn: async () => {
      const res = await api.get("/nhomtaisan", {
        params: {
          idcongty: CongTy.CT001,
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useLyLichQuery = () => {
  return useQuery({
    queryKey: ["lyLich"],
    queryFn: async () => {
      const res = await api.get("/ly-lich", {
        params: {
          page: 0,
          size: 1000,
        },
      });
      return res.data?.items || [];
    },
    placeholderData: (previousData) => previousData,
  });
};
