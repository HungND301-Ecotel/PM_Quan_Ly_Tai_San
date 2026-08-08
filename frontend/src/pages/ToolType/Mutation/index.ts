import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { ToolTypeType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import * as XLSX from "xlsx";
import { s } from "../../../utils/helpers";
import { useAllToolGroupQuery } from "../../ToolGroup/Mutation";
import { CongTy } from "../../../utils/const";

export const useToolTypeMutation = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: ToolTypeType) => {
      const res = await api.post("/loaiccdccon", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["toolTypesPage"] });
      showSuccessAlert("Tạo loại ccdc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo loại ccdc thất bại",
      );
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: ToolTypeType[]) => {
      const res = await api.post("/loaiccdccon/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allToolTypes"] });
      queryClient.invalidateQueries({ queryKey: ["toolTypesPage"] });
      showSuccessAlert("Tạo hàng loạt loại CCDC thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo hàng loạt loại CCDC thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ToolTypeType) => {
      const res = await api.put(`/loaiccdccon/${data.id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["toolTypesPage"] });
      showSuccessAlert("Sửa loại ccdc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa loại ccdc thất bại",
      );
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: async (data: ToolTypeType[]) => {
      const res = await api.put("/loaiccdccon/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allToolTypes"] });
      queryClient.invalidateQueries({ queryKey: ["toolTypesPage"] });
      showSuccessAlert("Sửa hàng loạt loại CCDC thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa hàng loạt loại CCDC thất bại",
      );
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/loaiccdccon/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["toolTypesPage"] });
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
      const res = await api.delete(`/loaiccdccon/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["toolTypesPage"] });
      showSuccessAlert(data || "Xóa loại ccdc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa loại ccdc thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/loaiccdccon/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["toolTypesPage"] });
      showSuccessAlert(data || "Xóa loại ccdc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa loại ccdc thất bại",
      );
    },
  });

  const { data: ccdcGroups = [] } = useAllToolGroupQuery();

  const exportMutation = useMutation({
    mutationFn: async () => {
      const listRes = await api.get("/loaiccdccon", {
        params: { idcongty: CongTy.CT001 },
      });
      const dataToExport = listRes.data;
      const payload = dataToExport.map((item: ToolTypeType) => ({
        "Mã loại CCDC": item.id || "",
        "Mã loại CCDC cha": item.idLoaiCCDC || "",
        "Tên loại CCDC": item.tenLoai || "",
      }));

      const response = await api.post("/upload/export", payload, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "danh_sach_loai_ccdc.xlsx");
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => showSuccessAlert("Xuất file loại CCDC thành công"),
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

            const listImport: ToolTypeType[] = [];
            const errorMessages: string[] = [];

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];

              if (!row[0] && !row[1] && !row[2]) continue;

              const id = s(row[0]);
              const idLoaiCCDC = s(row[1]);
              const tenLoai = s(row[2]);

              const rowErrors: string[] = [];

              if (!id) {
                rowErrors.push("Mã loại CCDC không được để trống");
              }

              if (!idLoaiCCDC) {
                rowErrors.push("Mã loại CCDC cha không được để trống");
              } else {
                const parentExists = ccdcGroups.some(
                  (g: any) => g.id === idLoaiCCDC,
                );
                if (!parentExists) {
                  rowErrors.push(
                    `Mã loại CCDC cha không tồn tại ${idLoaiCCDC}`,
                  );
                }
              }

              if (!tenLoai) {
                rowErrors.push("Tên loại CCDC không được để trống");
              }

              if (rowErrors.length > 0) {
                errorMessages.push(`Dòng ${i + 1}: ${rowErrors.join(", ")}`);
              } else {
                listImport.push({ id, idLoaiCCDC, tenLoai });
              }
            }

            if (errorMessages.length > 0) {
              reject(new Error(errorMessages.join("\n")));
            } else if (listImport.length > 0) {
              const res = await api.post("/loaiccdccon/batch", listImport);
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
      queryClient.invalidateQueries({ queryKey: ["allToolTypes"] });
      queryClient.invalidateQueries({ queryKey: ["toolTypesPage"] });
      showSuccessAlert("Import loại CCDC thành công");
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

export const useAllToolTypeQuery = () => {
  return useQuery({
    queryKey: ["allToolTypes"],
    queryFn: async () => {
      const res = await api.get("/loaiccdccon");
      return res.data;
    },
    placeholderData: (placeholderData) => placeholderData,
  });
};
export const useToolTypePageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  return useQuery({
    queryKey: ["toolTypesPage", page, pageSize, searchValue], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/loaiccdccon/paged", {
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
