import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { ReasonIncreaseType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import { s } from "../../../utils/helpers";
import * as XLSX from "xlsx";

export const useReasonIncreaseMutation = () => {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async (data: ReasonIncreaseType) => {
      const res = await api.post("/lydotang", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reasonIncreasesPage"] });
      showSuccessAlert("Tạo lý do tăng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo lý do tăng thất bại",
      );
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: ReasonIncreaseType[]) => {
      const res = await api.post("/lydotang/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reasonIncreasesPage"] });
      showSuccessAlert("Tạo hàng loạt lý do tăng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo hàng loạt lý do tăng thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ReasonIncreaseType) => {
      const res = await api.put(`/lydotang/${data.id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reasonIncreasesPage"] });
      showSuccessAlert("Sửa lý do tăng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa lý do tăng thất bại",
      );
    },
  });
  const updateBatchMutation = useMutation({
    mutationFn: async (data: ReasonIncreaseType[]) => {
      const res = await api.put("/lydotang/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reasonIncreasesPage"] });
      showSuccessAlert("Sửa hàng loạt lý do tăng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa hàng loạt lý do tăng thất bại",
      );
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/lydotang/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reasonIncreasesPage"] });
      showSuccessAlert("Xóa lý do tăng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa lý do tăng thất bại",
      );
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/lydotang/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reasonIncreasesPage"] });
      showSuccessAlert(data || "Xóa lý do tăng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa lý do tăng thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/lydotang/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reasonIncreasesPage"] });
      showSuccessAlert(data || "Xóa lý do tăng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa lý do tăng thất bại",
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const listRes = await api.get("/lydotang");
      const dataToExport = listRes.data.data || listRes.data || [];
      const payload = dataToExport.map((item: ReasonIncreaseType) => ({
        "Mã lý do tăng": item.id || "",
        "Tên lý do tăng": item.ten || "",
        "Tăng giảm":
          item.tangGiam !== undefined ? item.tangGiam.toString() : "",
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
      link.setAttribute("download", "danh_sach_ly_do_tang.xlsx");
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => showSuccessAlert("Xuất file lý do tăng thành công"),
    onError: () => showErrorAlert("Lỗi khi kết nối server để xuất file"),
  });

  const importExcelMutation = useMutation({
    mutationFn: async (file: File) => {
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
            const listImport: ReasonIncreaseType[] = [];
            const errorMessages: string[] = [];
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row[0] && !row[1] && !row[2]) continue;
              const id = s(row[0]);
              const ten = s(row[1]);
              const tangGiamRaw = s(row[2]);
              const rowErrors: string[] = [];
              if (!id) rowErrors.push("Mã lý do tăng không được để trống");
              if (!ten) rowErrors.push("Tên lý do tăng không được để trống");
              let tangGiamValue: number | null = null;
              if (!tangGiamRaw) {
                rowErrors.push("Tăng giảm không được để trống");
              } else {
                const parsed = parseInt(tangGiamRaw);
                if (isNaN(parsed)) {
                  rowErrors.push(
                    `Tăng giảm không hợp lệ ${tangGiamRaw} phải là số 0 hoặc 1`,
                  );
                } else {
                  tangGiamValue = parsed;
                }
              }
              if (rowErrors.length > 0) {
                errorMessages.push(`Dòng ${i + 1}: ${rowErrors.join(", ")}`);
              } else {
                listImport.push({
                  id,
                  ten,
                  tangGiam: tangGiamValue as number,
                });
              }
            }
            if (errorMessages.length > 0) {
              reject(new Error(errorMessages.join("\n")));
            } else if (listImport.length > 0) {
              const res = await api.post("/lydotang/batch", listImport);
              queryClient.invalidateQueries({
                queryKey: ["reasonIncreasesPage"],
              });
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
      queryClient.invalidateQueries({ queryKey: ["reasonIncreases"] });
      showSuccessAlert("Import lý do tăng thành công");
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

export const useReasonIncreasePageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  return useQuery({
    queryKey: ["reasonIncreasesPage", page, pageSize, searchValue],
    queryFn: async () => {
      const res = await api.get("/lydotang/paged", {
        params: {
          page,
          size: pageSize,
          search: searchValue,
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useAllReasonIncreaseQuery = () => {
  return useQuery({
    queryKey: ["allReasonIncreases"],
    queryFn: async () => {
      const res = await api.get("/lydotang");

      return res.data.data || [];
    },
    placeholderData: (previousData) => previousData,
  });
};
