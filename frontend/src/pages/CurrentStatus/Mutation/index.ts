import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { CurrentStatusType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import { s } from "../../../utils/helpers";
import * as XLSX from "xlsx";
import { CongTy } from "../../../utils/const";

export const useCurrentStatusMutation = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async (data: CurrentStatusType) => {
      const res = await api.post("/hientrangkythuat", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentStatusPage"] });
      showSuccessAlert("Tạo hiện trạng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo hiện trạng thất bại",
      );
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: CurrentStatusType[]) => {
      const res = await api.post("/hientrangkythuat/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentStatusPage"] });
      showSuccessAlert("Tạo hàng loạt hiện trạng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Tạo hàng loạt thất bại");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CurrentStatusType) => {
      const res = await api.put(`/hientrangkythuat/${data.id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentStatusPage"] });
      showSuccessAlert("Sửa hiện trạng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa hiện trạng thất bại",
      );
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: async (data: CurrentStatusType[]) => {
      const res = await api.put("/hientrangkythuat/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentStatusPage"] });
      showSuccessAlert("Sửa hàng loạt hiện trạng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Sửa hàng loạt thất bại");
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hientrangkythuat/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentStatusPage"] });
      showSuccessAlert("Xóa hiện trạng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa hiện trạng thất bại",
      );
    },
  });
  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/hientrangkythuat/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentStatusPage"] });
      showSuccessAlert(data || "Xóa hiện trạng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa hiện trạng thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/hientrangkythuat/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentStatusPage"] });
      showSuccessAlert(data || "Xóa hiện trạng thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa hiện trạng thất bại",
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const listRes = await api.get("/hientrangkythuat", {
        params: { idcongty: CongTy.CT001 },
      });
      const dataToExport = listRes.data.data || listRes.data || [];
      const payload = dataToExport.map((item: CurrentStatusType) => ({
        "Mã trạng thái": item.id,
        "Tên trạng thái": item.tenHTKT || "",
        "Mô tả": item.moTa || "",
        "Ngày tạo": item.ngayTao || "",
        "Ngày cập nhật": item.ngayCapNhat || "",
        "Người tạo": item.nguoiTao || "",
        "Người cập nhật": item.nguoiCapNhat || "",
        "Trạng thái": item.isActive ? "Hoạt động" : "Không hoạt động",
      }));

      const response = await api.post("/upload/export", payload, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "danh_sach_hien_trang.xlsx");
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => showSuccessAlert("Xuất file hiện trạng thành công"),
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

            const listImport = [];
            const errorMessages = [];

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];

              if (!row[0] && !row[1]) continue;

              const idRaw = s(row[0]);
              const tenHTKT = s(row[1]);

              const rowErrors = [];

              if (!idRaw) {
                rowErrors.push("Mã trạng thái không được để trống");
              }

              if (!tenHTKT) {
                rowErrors.push("Tên trạng thái không được để trống");
              }

              if (rowErrors.length > 0) {
                errorMessages.push(`Dòng ${i + 1}: ${rowErrors.join(", ")}`);
              } else {
                const idNumber = Number(idRaw);

                listImport.push({
                  id: isNaN(idNumber) ? 0 : idNumber,
                  tenHTKT: tenHTKT,
                  moTa: "",
                  isActive: true,
                  ngayTao: new Date().toISOString(),
                  ngayCapNhat: new Date().toISOString(),
                  nguoiTao: "admin",
                  nguoiCapNhat: "admin",
                });
              }
            }

            if (errorMessages.length > 0) {
              reject(new Error(errorMessages.join("\n")));
            } else if (listImport.length > 0) {
              const res = await api.post("/hientrangkythuat/batch", listImport);
              queryClient.invalidateQueries({
                queryKey: ["currentStatusPage"],
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
      queryClient.invalidateQueries({ queryKey: ["currentStatusPage"] });
      showSuccessAlert("Import hiện trạng thành công");
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

export const useCurrentStatusPageQuery = (
  page: number,
  pageSize: number,
  searchValue: string,
) => {
  return useQuery({
    queryKey: ["currentStatusPage", page, pageSize, searchValue], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/hientrangkythuat/paged", {
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

export const useAllCurrentStatusQuery = () => {
  return useQuery({
    queryKey: ["allCurrentStatus"],
    queryFn: async () => {
      const res = await api.get("/hientrangkythuat");
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};
