import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { CapitalSourceType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import * as XLSX from "xlsx";
import { b, formatDateTime, s } from "../../../utils/helpers";
import { CongTy } from "../../../utils/const";

export const useCapitalSourceMutation = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async (data: CapitalSourceType) => {
      const res = await api.post("/nguonvon", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["capitalSourcesPage"] });
      showSuccessAlert("Tạo nguồn vốn thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo nguồn vốn thất bại",
      );
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: CapitalSourceType[]) => {
      const res = await api.post("/nguonvon/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capitalSourcesPage"] });
      showSuccessAlert("Tạo hàng loạt nguồn vốn thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo hàng loạt nguồn vốn thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CapitalSourceType) => {
      const res = await api.put(`/nguonvon/${data.id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["capitalSourcesPage"] });
      showSuccessAlert("Sửa nguồn vốn thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa nguồn vốn thất bại",
      );
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: async (data: CapitalSourceType[]) => {
      const res = await api.put("/nguonvon/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capitalSourcesPage"] });
      showSuccessAlert("Sửa hàng loạt nguồn vốn thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa hàng loạt nguồn vốn thất bại",
      );
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/nguonvon/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["capitalSourcesPage"] });
      showSuccessAlert("Xóa nguồn vốn thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa nguồn vốn thất bại",
      );
    },
  });
  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/nguonvon/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["capitalSourcesPage"] });
      showSuccessAlert(data || "Xóa nguồn vốn thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa nguồn vốn thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/nguonvon/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["capitalSourcesPage"] });
      showSuccessAlert(data || "Xóa nguồn vốn thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa nguồn vốn thất bại",
      );
    },
  });
  const exportMutation = useMutation({
    mutationFn: async () => {
      const listRes = await api.get("/nguonvon", {
        params: { idcongty: CongTy.CT001 },
      });
      const dataToExport = listRes.data;
      const payload = dataToExport.map((item: CapitalSourceType) => ({
        Id: item.id || "null",
        "Tên nguồn kinh phí": item.tenNguonKinhPhi || "null",
        "Ghi chú": item.ghiChu || "null",
        "Hiệu lực": item.hieuLuc ?? false,
        "Ngày tạo": item.ngayTao
          ? item.ngayTao.replace("T", " ").split(".")[0]
          : "null",
        "Ngày cập nhật": item.ngayCapNhat
          ? item.ngayCapNhat.replace("T", " ").split(".")[0]
          : "null",
      }));

      const response = await api.post("/upload/export", payload, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "danh_sach_nguon_von.xlsx");
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => showSuccessAlert("Xuất file nguồn vốn thành công"),
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

            const listImport: CapitalSourceType[] = [];
            const errorMessages: string[] = [];
            const currentUser = "admin";

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];

              if (!row[0] && !row[1]) continue;

              const id = s(row[0]);
              const tenNguonKinhPhi = s(row[1]);
              const ghiChu = s(row[2]);
              const hieuLuc = b(row[3], true);

              const ngayTao = formatDateTime(row[5]);
              const ngayCapNhat = formatDateTime(row[6]);

              const rowErrors: string[] = [];
              if (!id) rowErrors.push("Mã nguồn kinh phí không được để trống");
              if (!tenNguonKinhPhi)
                rowErrors.push("Tên nguồn kinh phí không được để trống");

              if (rowErrors.length > 0) {
                errorMessages.push(`Dòng ${i + 1}: ${rowErrors.join(", ")}`);
              } else {
                listImport.push({
                  id,
                  tenNguonKinhPhi,
                  ghiChu,
                  hieuLuc,
                  idCongTy: CongTy.CT001,
                  isActive: true,
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
              const res = await api.post("/nguonvon/batch", listImport);
              queryClient.invalidateQueries({
                queryKey: ["capitalSourcesPage"],
              });
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
      queryClient.invalidateQueries({ queryKey: ["capitalSources"] });
      showSuccessAlert("Import dữ liệu nguồn vốn thành công");
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
    exportMutation,
    importExcelMutation,
    deleteAllMutation,
    createBatchMutation,
    updateBatchMutation,
  };
};

export const useCapitalSourcePageQuery = (
  page: number,
  pageSize: number,
  searchValue: string,
) => {
  return useQuery({
    queryKey: ["capitalSourcesPage", page, pageSize, searchValue], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/nguonvon/paged", {
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

export const useAllCapitalSourceQuery = () => {
  return useQuery({
    queryKey: ["capitalSources"],
    queryFn: async () => {
      const res = await api.get("/nguonvon", {
        params: {
          idcongty: CongTy.CT001,
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};
