import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { ProjectType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import * as XLSX from "xlsx";
import { b, s } from "../../../utils/helpers";
import { CongTy } from "../../../utils/const";

export const useProjectMutation = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async (data: ProjectType) => {
      const res = await api.post("/duan", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projectsPage"] });
      showSuccessAlert("Tạo dự án thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || error.message || "Tạo dự án thất bại",
      );
    },
  });
  const createBatchMutation = useMutation({
    mutationFn: async (data: ProjectType[]) => {
      const res = await api.post("/duan/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectsPage"] });
      showSuccessAlert("Tạo hàng loạt dự án thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo hàng loạt dự án thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProjectType) => {
      const res = await api.put(`/duan/${data.id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projectsPage"] });
      showSuccessAlert("Sửa dự án thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || error.message || "Sửa dự án thất bại",
      );
    },
  });
  const updateBatchMutation = useMutation({
    mutationFn: async (data: ProjectType[]) => {
      const res = await api.put("/duan/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectsPage"] });
      showSuccessAlert("Sửa hàng loạt dự án thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa hàng loạt dự án thất bại",
      );
    },
  });
  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/duan/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projectsPage"] });
      showSuccessAlert("Xóa dự án thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || error.message || "Xóa dự án thất bại",
      );
    },
  });
  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/duan/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projectsPage"] });
      showSuccessAlert(data || "Xóa dự án thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || error.message || "Xóa dự án thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/duan/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projectsPage"] });
      showSuccessAlert(data || "Xóa dự án thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || error.message || "Xóa dự án thất bại",
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const listRes = await api.get("/duan", {
        params: { idcongty: CongTy.CT001 },
      });
      const dataToExport = listRes.data;
      const payload = dataToExport.map((item: ProjectType) => ({
        "Mã dự án": item.id || "",
        "Tên dự án": item.tenDuAn || "",
        "Ghi chú": item.ghiChu || "",
        "Hiệu lực": item.hieuLuc ?? true,
      }));

      const response = await api.post("/upload/export", payload, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "danh_sach_du_an.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => showSuccessAlert("Xuất file dự án thành công"),
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

            const listImport: ProjectType[] = [];
            const errorMessages: string[] = [];

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row[0] && !row[1]) continue;

              const id = s(row[0]);
              const tenDuAn = s(row[1]);
              const ghiChu = s(row[2]);
              const hieuLuc = b(row[3], true);

              const rowErrors: string[] = [];
              if (!id) rowErrors.push("Mã dự án không được để trống");
              if (!tenDuAn) rowErrors.push("Tên dự án không được để trống");

              if (rowErrors.length > 0) {
                errorMessages.push(`Dòng ${i + 1}: ${rowErrors.join(", ")}`);
              } else {
                listImport.push({
                  id,
                  tenDuAn,
                  ghiChu,
                  hieuLuc,
                  idCongTy: CongTy.CT001,
                  isActive: true,
                  nguoiTao: "admin",
                  nguoiCapNhat: "admin",
                  ngayTao: new Date().toISOString(),
                  ngayCapNhat: new Date().toISOString(),
                });
              }
            }

            if (errorMessages.length > 0) {
              reject(new Error(errorMessages.join("\n")));
            } else if (listImport.length > 0) {
              const res = await api.post("/duan/batch", listImport);
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
      queryClient.invalidateQueries({ queryKey: ["projectsPage"] });
      showSuccessAlert("Import dự án thành công");
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

export const useProjectsPageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  return useQuery({
    queryKey: ["projectsPage", page, pageSize, searchValue], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/duan/paged", {
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

export const useAllProjectsQuery = () => {
  return useQuery({
    queryKey: ["allProjects"], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/duan", {
        params: {
          idcongty: CongTy.CT001,
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};
