import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { TypeAssetType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import * as XLSX from "xlsx";
import { s } from "../../../utils/helpers";
import { CongTy } from "../../../utils/const";

export const useTypeAssetMutation = () => {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async (data: TypeAssetType) => {
      const res = await api.post("/loaitaisancon", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["allTypeAssets"] });
      queryClient.invalidateQueries({ queryKey: ["typeAssetsPage"] });
      showSuccessAlert("Tạo loại tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo loại tài sản thất bại",
      );
    },
  });
  const createBatchMutation = useMutation({
    mutationFn: async (data: TypeAssetType[]) => {
      const res = await api.post("/loaitaisancon/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allTypeAssets"] });
      queryClient.invalidateQueries({ queryKey: ["typeAssetsPage"] });
      showSuccessAlert("Tạo hàng loạt loại tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo hàng loạt loại tài sản thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TypeAssetType) => {
      const res = await api.put(`/loaitaisancon/${data.id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["allTypeAssets"] });
      queryClient.invalidateQueries({ queryKey: ["typeAssetsPage"] });
      showSuccessAlert("Sửa loại tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa loại tài sản thất bại",
      );
    },
  });
  const updateBatchMutation = useMutation({
    mutationFn: async (data: TypeAssetType[]) => {
      const res = await api.put("/loaitaisancon/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allTypeAssets"] });
      queryClient.invalidateQueries({ queryKey: ["typeAssetsPage"] });
      showSuccessAlert("Sửa hàng loạt loại tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa hàng loạt loại tài sản thất bại",
      );
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/loaitaisancon/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["allTypeAssets"] });
      queryClient.invalidateQueries({ queryKey: ["typeAssetsPage"] });
      showSuccessAlert("Xóa loại ccdc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa loại ccdc thất bại",
      );
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/loaitaisancon/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["allTypeAssets"] });
      queryClient.invalidateQueries({ queryKey: ["typeAssetsPage"] });
      showSuccessAlert(data || "Xóa loại tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa loại tài sản thất bại",
      );
    },
  });
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/loaitaisancon/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["allTypeAssets"] });
      queryClient.invalidateQueries({ queryKey: ["typeAssetsPage"] });
      showSuccessAlert(data || "Xóa loại tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa loại tài sản thất bại",
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const listRes = await api.get("/loaitaisancon", {
        params: { idcongty: CongTy.CT001 },
      });
      const dataToExport = listRes.data;
      const payload = dataToExport.map((item: TypeAssetType) => ({
        "Mã loại tài sản": item.id || "",
        "Mã loại tài sản cha": item.idLoaiTs || "",
        "Tên loại tài sản con": item.tenLoai || "",
      }));

      const response = await api.post("/upload/export", payload, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "danh_sach_loai_tai_san_con.xlsx");
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => showSuccessAlert("Xuất file loại tài sản thành công"),
    onError: () => showErrorAlert("Lỗi khi kết nối server để xuất file"),
  });

  const importExcelMutation = useMutation({
    mutationFn: async (file: File) => {
      const assetGroups =
        (await queryClient.ensureQueryData({
          queryKey: ["allTypeAssetsGroup"],
          queryFn: async () => {
            const res = await api.get("/nhomtaisan", {
              params: { idcongty: CongTy.CT001 },
            });
            return res.data;
          },
        })) || [];
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

            const listImport: TypeAssetType[] = [];
            const errorMessages: string[] = [];

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];

              if (!row[0] && !row[1] && !row[2]) continue;

              const id = s(row[0]);
              const idLoaiTs = s(row[1]);
              const tenLoai = s(row[2]);

              const rowErrors: string[] = [];

              if (!id) {
                rowErrors.push("Mã loại tài sản không được để trống");
              }

              if (!idLoaiTs) {
                rowErrors.push("Mã loại tài sản cha không được để trống");
              } else {
                const parentExists = assetGroups.some(
                  (g: any) => g.id === idLoaiTs,
                );
                if (!parentExists) {
                  rowErrors.push(
                    `Mã loại tài sản cha không tồn tại ${idLoaiTs}`,
                  );
                }
              }

              if (!tenLoai) {
                rowErrors.push("Tên loại tài sản không được để trống");
              }

              if (rowErrors.length > 0) {
                errorMessages.push(`Dòng ${i + 1}: ${rowErrors.join(", ")}`);
              } else {
                listImport.push({ id, idLoaiTs, tenLoai });
              }
            }

            if (errorMessages.length > 0) {
              reject(new Error(errorMessages.join("\n")));
            } else if (listImport.length > 0) {
              const res = await api.post("/loaitaisancon/batch", listImport);
              queryClient.invalidateQueries({ queryKey: ["allTypeAssets"] });
              resolve(res.data);
            } else {
              reject(new Error("File không có dữ liệu hợp lệ"));
            }
          } catch (err) {
            reject(new Error("Lỗi định dạng file hoặc lỗi hệ thống"));
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["typeAssetsByAssetGroup"] });
      queryClient.invalidateQueries({ queryKey: ["allTypeAssets"] });
      showSuccessAlert("Import loại tài sản thành công");
    },
    onError: (error: any) => {
      if (!error.message.includes("\n")) {
        showErrorAlert(error.message || "Lỗi khi import dữ liệu");
      }
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteOneMutation,
    deleteManyMutation,
    importExcelMutation,
    exportMutation,
    deleteAllMutation,
    createBatchMutation,
    updateBatchMutation,
  };
};

export const useAllTypeAssetQuery = () => {
  return useQuery({
    queryKey: ["allTypeAssets"],
    queryFn: async () => {
      const res = await api.get("/loaitaisancon");
      return res.data;
    },
    placeholderData: (placeholderData) => placeholderData,
  });
};

export const useAllTypeAssetByGroupQuery = (assetGroup: string) => {
  return useQuery({
    queryKey: ["typeAssetsByAssetGroup", assetGroup],
    queryFn: async () => {
      const res = await api.get(`/loaitaisancon/byloaitaisan/${assetGroup}`);
      return res.data || [];
    },
    placeholderData: (placeholderData) => placeholderData,
    enabled: !!assetGroup,
  });
};

export const useAllAssetGroupQuery = () => {
  return useQuery({
    queryKey: ["allTypeAssetsGroup"],
    queryFn: async () => {
      const res = await api.get(`/nhomtaisan`, {
        params: {
          idcongty: CongTy.CT001,
        },
      });
      return res.data;
    },
    placeholderData: (placeholderData) => placeholderData,
  });
};

export const useTypeAssetPageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  return useQuery({
    queryKey: ["typeAssetsPage", page, pageSize, searchValue], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/loaitaisancon/paged", {
        params: {
          idcongty: CongTy.CT001,
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
