import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { ToolGroupType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import * as XLSX from "xlsx";
import { b, formatDateTime, s } from "../../../utils/helpers";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import dayjs from "dayjs";
import { CongTy } from "../../../utils/const";

export const useToolGroupMutation = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.user);
  const currentUser = user?.taiKhoan?.tenDangNhap || "admin";
  const now = dayjs(new Date()).format("YYYY-MM-DDTHH:mm:ss");
  const createMutation = useMutation({
    mutationFn: async (data: ToolGroupType) => {
      const res = await api.post("/nhomccdc", {
        ...data,
        ngayTao: now,
        nguoiTao: currentUser,
        ngayCapNhat: now,
        nguoiCapNhat: currentUser,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["toolGroups"] });
      queryClient.invalidateQueries({ queryKey: ["toolGroupsPage"] });
      showSuccessAlert("Tạo nhóm ccdc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo nhóm ccdc thất bại",
      );
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: ToolGroupType[]) => {
      const res = await api.post(
        "/nhomccdc/batch",
        data.map((item) => ({
          ...item,
          ngayTao: now,
          nguoiTao: currentUser,
          ngayCapNhat: now,
          nguoiCapNhat: currentUser,
        })),
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["toolGroups"] });
      queryClient.invalidateQueries({ queryKey: ["toolGroupsPage"] });
      showSuccessAlert("Tạo hàng loạt nhóm CCDC thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo hàng loạt nhóm CCDC thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ToolGroupType) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";
      const res = await api.put(`/nhomccdc/${data.id}`, {
        ...data,
        ngayCapNhat: now,
        nguoiCapNhat: currentUser,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["toolGroups"] });
      queryClient.invalidateQueries({ queryKey: ["toolGroupsPage"] });
      showSuccessAlert("Sửa nhóm ccdc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa nhóm ccdc thất bại",
      );
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: async (data: ToolGroupType[]) => {
      const res = await api.put(
        "/nhomccdc/batch",
        data.map((item) => ({
          ...item,
          ngayCapNhat: now,
          nguoiCapNhat: currentUser,
        })),
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["toolGroups"] });
      queryClient.invalidateQueries({ queryKey: ["toolGroupsPage"] });
      showSuccessAlert("Sửa hàng loạt nhóm CCDC thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa hàng loạt nhóm CCDC thất bại",
      );
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/nhomccdc/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["toolGroups"] });
      queryClient.invalidateQueries({ queryKey: ["toolGroupsPage"] });
      showSuccessAlert("Xóa nhóm ccdc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa nhóm ccdc thất bại",
      );
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/nhomccdc/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["toolGroups"] });
      queryClient.invalidateQueries({ queryKey: ["toolGroupsPage"] });
      showSuccessAlert(data || "Xóa nhóm ccdc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa nhóm ccdc thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/nhomccdc/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["toolGroupsPage"] });
      showSuccessAlert(data || "Xóa nhóm ccdc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa nhóm ccdc thất bại",
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const listRes = await api.get("/nhomccdc", {
        params: { idcongty: CongTy.CT001 },
      });
      const dataToExport = listRes.data;
      const payload = dataToExport.map((item: ToolGroupType) => ({
        "Mã nhóm CCDC": item.id || "",
        "Tên nhóm CCDC": item.ten || "",
        "Là CCDC": item.hieuLuc ?? false,
        "Là Vậttư": item.laCCDC ?? false,
        "Hiệu lực": item.laVatTu ?? false,
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
      link.setAttribute("download", "danh_sach_nhom_ccdc.xlsx");
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => showSuccessAlert("Xuất file nhóm CCDC thành công"),
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

            const listImport: ToolGroupType[] = [];
            const errorMessages: string[] = [];
            const currentUser = "admin";

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];

              if (!row[0] && !row[1]) continue;

              const id = s(row[0]);
              const ten = s(row[1]);
              const laCCDC = b(row[2]);
              const laVatTu = b(row[3]);
              const hieuLuc = b(row[4]);
              const ngayTao = formatDateTime(row[5]);
              const ngayCapNhat = formatDateTime(row[6]);

              const rowErrors: string[] = [];
              if (!id) rowErrors.push("Mã nhóm CCDC không được để trống");
              if (!ten) rowErrors.push("Tên nhóm CCDC không được để trống");

              if (rowErrors.length > 0) {
                errorMessages.push(`Dòng ${i + 1}: ${rowErrors.join(", ")}`);
              } else {
                listImport.push({
                  id,
                  ten,
                  laCCDC: laCCDC ?? false,
                  laVatTu: laVatTu ?? false,
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
              const res = await api.post("/nhomccdc/batch", listImport);
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
      queryClient.invalidateQueries({ queryKey: ["toolGroups"] });
      queryClient.invalidateQueries({ queryKey: ["toolGroupsPage"] });
      showSuccessAlert("Import nhóm CCDC thành công");
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

export const useToolGroupPageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  return useQuery({
    queryKey: ["toolGroupsPage", page, pageSize, searchValue], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/nhomccdc/paged", {
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
export const useAllToolGroupQuery = () => {
  return useQuery({
    queryKey: ["allToolGroups"], // Key để cache dữ liệu
    queryFn: async () => {
      const res = await api.get("/nhomccdc", {
        params: {
          idcongty: CongTy.CT001,
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};
