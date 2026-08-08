import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { PositionType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import * as XLSX from "xlsx";
import { CongTy } from "../../../utils/const";

export const usePositionMutation = () => {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async (data: PositionType) => {
      const res = await api.post("/chucvu", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["positionsPage"] });
      showSuccessAlert("Tạo chức vụ thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo chức vụ thất bại",
      );
    },
  });
  const createBatchMutation = useMutation({
    mutationFn: async (data: PositionType[]) => {
      const res = await api.post("/chucvu/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positionsPage"] });
      showSuccessAlert("Tạo chức vụ thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Tạo chức vụ thất bại");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PositionType) => {
      const res = await api.put(`/chucvu/${data.id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["positionsPage"] });
      showSuccessAlert("Sửa chức vụ thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa chức vụ thất bại",
      );
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: async (data: PositionType[]) => {
      const res = await api.put("/chucvu/batch", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positionsPage"] });
      showSuccessAlert("Sửa chức vụ thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Sửa chức vụ thất bại");
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/chucvu/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["positionsPage"] });
      showSuccessAlert("Xóa chức vụ thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa chức vụ thất bại",
      );
    },
  });
  const getByIdMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.get(`/chucvu/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Lấy chức vụ thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message ||
          error.message ||
          "Lấy chức vụ thất bại",
      );
      return null;
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/chucvu/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["positionsPage"] });
      showSuccessAlert(data || "Xóa chức vụ thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa chức vụ thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/chucvu/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["positionsPage"] });
      showSuccessAlert(data || "Xóa chức vụ thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa chức vụ thất bại",
      );
    },
  });

  // 1. Chuyển EXPORT thành Mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const listRes = await api.get("/chucvu", {
        params: { idcongty: CongTy.CT001 },
      });
      const dataToExport = listRes.data;
      return new Promise((resolve) => {
        // Giữ nguyên logic map dữ liệu của bạn
        const worksheetData = dataToExport.map((item: PositionType) => ({
          "Mã chức vụ": item.id || "",
          "Tên chức vụ": item.tenChucVu || "",
          "Quản lý Nhân viên": item.quanLyNhanVien ? "TRUE" : "FALSE",
          "Quản lý Phòng ban": item.quanLyPhongBan ? "TRUE" : "FALSE",
          "Quản lý Dự án": item.quanLyDuAn ? "TRUE" : "FALSE",
          "Quản lý Nguồn vốn": item.quanLyNguonVon ? "TRUE" : "FALSE",
          "Quản lý Mô hình tài sản": item.quanLyMoHinhTaiSan ? "TRUE" : "FALSE",
          "Quản lý Nhóm tài sản": item.quanLyNhomTaiSan ? "TRUE" : "FALSE",
          "Quản lý Tài sản": item.quanLyTaiSan ? "TRUE" : "FALSE",
          "Quản lý CCDC - Vật tư": item.quanLyCCDCVatTu ? "TRUE" : "FALSE",
          "Có quyền Điều động tài sản": item.dieuDongTaiSan ? "TRUE" : "FALSE",
          "Có quyền Điều động CCDC": item.dieuDongCCDCVatTu ? "TRUE" : "FALSE",
          "Có quyền Bàn giao tài sản": item.banGiaoTaiSan ? "TRUE" : "FALSE",
          "Có quyền Bàn giao CCDC": item.banGiaoCCDCVatTu ? "TRUE" : "FALSE",
          "Quản lý Báo cáo": item.baoCao ? "TRUE" : "FALSE",
          "Ban hành quyết định": item.banHanhQuyetDinh ? "TRUE" : "FALSE",
          "Ngày tạo": item.ngayTao || "",
          "Ngày cập nhật": item.ngayCapNhat || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "ChucVu");
        XLSX.writeFile(workbook, "danh_sach_chuc_vu.xlsx");
        resolve(true);
      });
    },
    onSuccess: () => showSuccessAlert("Xuất file chức vụ thành công"),
    onError: () => showErrorAlert("Lỗi khi xuất file Excel"),
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
            });

            const listChucVu: PositionType[] = [];
            // Giữ nguyên helper b của bạn
            const b = (val: any) =>
              val === true || val?.toString().toUpperCase() === "TRUE";

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row[1]) continue;

              listChucVu.push({
                id: row[0]?.toString() || "",
                tenChucVu: row[1]?.toString() || "",
                quanLyNhanVien: b(row[2]),
                quanLyPhongBan: b(row[3]),
                quanLyDuAn: b(row[4]),
                quanLyNguonVon: b(row[5]),
                quanLyMoHinhTaiSan: b(row[6]),
                quanLyNhomTaiSan: b(row[7]),
                quanLyTaiSan: b(row[8]),
                quanLyCCDCVatTu: b(row[9]),
                dieuDongTaiSan: b(row[10]),
                dieuDongCCDCVatTu: b(row[11]),
                banGiaoTaiSan: b(row[12]),
                banGiaoCCDCVatTu: b(row[13]),
                baoCao: b(row[14]),
                banHanhQuyetDinh: b(row[15]),
                idCongTy: CongTy.CT001,
                ngayTao: row[15]?.toString() || new Date().toISOString(),
                ngayCapNhat: row[16]?.toString() || new Date().toISOString(),
                nguoiTao: "admin",
                nguoiCapNhat: "admin",
              });
            }

            if (listChucVu.length > 0) {
              const res = await api.post("/chucvu/batch", listChucVu);
              resolve(res.data);
            } else {
              reject(new Error("Không tìm thấy dữ liệu hợp lệ trong file"));
            }
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positionsPage"] });
      showSuccessAlert("Import danh sách chức vụ thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Lỗi khi import chức vụ");
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteOneMutation,
    deleteManyMutation,
    importExcelMutation,
    exportMutation,
    getByIdMutation,
    deleteAllMutation,
    createBatchMutation,
    updateBatchMutation,
  };
};

export const usePositionsPageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  return useQuery({
    queryKey: ["positionsPage", page, pageSize, searchValue],
    queryFn: async () => {
      const res = await api.get("/chucvu/congty/ct001/paged", {
        params: {
          idcongty: CongTy.CT001,
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

export const useAllPositionsQuery = () => {
  return useQuery({
    queryKey: ["allPositions"],
    queryFn: async () => {
      const res = await api.get("/chucvu/congty/ct001", {
        params: {
          idcongty: CongTy.CT001,
        },
      });
      return res.data.data || [];
    },
    placeholderData: (previousData) => previousData,
  });
};
