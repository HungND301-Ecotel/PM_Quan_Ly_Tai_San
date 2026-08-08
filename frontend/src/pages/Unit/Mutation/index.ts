import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { UnitType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import * as XLSX from "xlsx";
import { s } from "../../../utils/helpers";

export const useUnitMutation = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: UnitType) => {
      const res = await api.post("/donvitinh", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["unitsPage"] });
      showSuccessAlert("Tạo đơn vị tính thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo đơn vị tính thất bại",
      );
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: UnitType[]) => {
      const res = await api.post("/donvitinh/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unitsPage"] });
      showSuccessAlert("Tạo hàng loạt đơn vị tính thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Tạo hàng loạt thất bại");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UnitType) => {
      const res = await api.put(`/donvitinh/${data.id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["unitsPage"] });
      showSuccessAlert("Sửa đơn vị tính thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa đơn vị tính thất bại",
      );
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: async (data: UnitType[]) => {
      const res = await api.put("/donvitinh/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unitsPage"] });
      showSuccessAlert("Sửa hàng loạt đơn vị tính thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Sửa hàng loạt thất bại");
    },
  });
  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/donvitinh/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["unitsPage"] });
      showSuccessAlert("Xóa đơn vị tính thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa đơn vị tính thất bại",
      );
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/donvitinh/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["unitsPage"] });
      showSuccessAlert(data || "Xóa đơn vị tính thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa đơn vị tính thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/donvitinh/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["unitsPage"] });
      showSuccessAlert(data || "Xóa đơn vị tính thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa đơn vị tính thất bại",
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const listRes = await api.get("/donvitinh");
      const dataToExport = listRes.data.data || listRes.data || [];
      const payload = dataToExport.map((item: UnitType) => ({
        "Mã đơn vị": item.id || "",
        "Tên đơn vị": item.tenDonVi || "",
        "Ghi chú": item.note || "",
      }));

      const response = await api.post("/upload/export", payload, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "danh_sach_don_vi_tinh.xlsx");
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => showSuccessAlert("Xuất file thành công"),
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

            const listImport: UnitType[] = [];
            const errorMessages: string[] = [];

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];

              const id = s(row[0]);
              const tenDonVi = s(row[1]);
              const note = s(row[2]);

              if (!id && !tenDonVi && !note) continue;

              const rowErrors: string[] = [];
              if (!id) rowErrors.push("Mã đơn vị không được để trống");
              if (!tenDonVi) rowErrors.push("Tên đơn vị không được để trống");

              if (rowErrors.length > 0) {
                errorMessages.push(`Dòng ${i + 1}: ${rowErrors.join(", ")}`);
              } else {
                listImport.push({ id, tenDonVi, note });
              }
            }

            if (errorMessages.length > 0) {
              // Ném lỗi về onError để hiển thị thông báo tổng hợp
              reject(new Error(errorMessages.join("\n")));
            } else if (listImport.length > 0) {
              // Gọi API lưu vào DB
              const res = await api.post("/donvitinh/batch", listImport);
              resolve(res.data);
            } else {
              reject(new Error("File không có dữ liệu hợp lệ"));
            }
          } catch (err) {
            reject(new Error("Lỗi khi đọc file Excel hoặc kết nối API"));
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unitsPage"] });
      showSuccessAlert("Import đơn vị tính thành công");
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

export const useUnitPagesQuery = (
  page?: number,
  pageSize?: number,
  search?: string,
) => {
  return useQuery({
    queryKey: ["unitsPage", page, pageSize, search],
    queryFn: async () => {
      const res = await api.get("/donvitinh/paged", {
        params: {
          page,
          size: pageSize,
          search,
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useAllUnitsQuery = () => {
  return useQuery({
    queryKey: ["allUnits"],
    queryFn: async () => {
      const res = await api.get("/donvitinh");
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};
