import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { ModelAssetType } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import * as XLSX from "xlsx";
import { b, formatDateTime, s } from "../../../utils/helpers";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import dayjs from "dayjs";
import { CongTy } from "../../../utils/const";

export const useModelAssetMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.user);
  const now = dayjs(new Date()).format("YYYY-MM-DDTHH:mm:ss");

  const createMutation = useMutation({
    mutationFn: async (data: ModelAssetType) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";
      const res = await api.post("/mohinhtaisan", {
        ...data,
        idCongTy: CongTy.CT001,
        ngayTao: now,
        nguoiTao: currentUser,
        ngayCapNhat: now,
        nguoiCapNhat: currentUser,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["modelAssets"] });
      queryClient.invalidateQueries({ queryKey: ["modelAssetsPage"] });
      showSuccessAlert("Tạo mô hình tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo mô hình tài sản thất bại",
      );
    },
  });
  const createBatchMutation = useMutation({
    mutationFn: async (data: ModelAssetType[]) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";
      const res = await api.post(
        "/mohinhtaisan/batch",
        data.map((item) => ({
          ...item,
          idCongTy: CongTy.CT001,
          ngayTao: now,
          nguoiTao: currentUser,
          ngayCapNhat: now,
          nguoiCapNhat: currentUser,
        })),
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelAssets"] });
      queryClient.invalidateQueries({ queryKey: ["modelAssetsPage"] });
      showSuccessAlert("Tạo mô hình tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Tạo mô hình tài sản thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ModelAssetType) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";
      const res = await api.put(`/mohinhtaisan/${data.id}`, {
        ...data,
        ngayCapNhat: now,
        nguoiCapNhat: currentUser,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["modelAssets"] });
      queryClient.invalidateQueries({ queryKey: ["modelAssetsPage"] });
      showSuccessAlert("Sửa mô hình tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa mô hình tài sản thất bại",
      );
    },
  });
  const updateBatchMutation = useMutation({
    mutationFn: async (data: ModelAssetType[]) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";
      const res = await api.put(
        "/mohinhtaisan/batch",
        data.map((item) => ({
          ...item,
          ngayCapNhat: now,
          nguoiCapNhat: currentUser,
        })),
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelAssets"] });
      queryClient.invalidateQueries({ queryKey: ["modelAssetsPage"] });
      showSuccessAlert("Sửa mô hình tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Sửa mô hình tài sản thất bại",
      );
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/mohinhtaisan/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["modelAssets"] });
      queryClient.invalidateQueries({ queryKey: ["modelAssetsPage"] });
      showSuccessAlert("Xóa mô hình tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa mô hình tài sản thất bại",
      );
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.delete(`/mohinhtaisan/batch`, { data: ids });
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["modelAssets"] });
      queryClient.invalidateQueries({ queryKey: ["modelAssetsPage"] });
      showSuccessAlert(data || "Xóa mô hình tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa mô hình tài sản thất bại",
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/mohinhtaisan/delete-all`);
      return res.data.message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["modelAssetsPage"] });
      showSuccessAlert(data || "Xóa mô hình tài sản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "Xóa mô hình tài sản thất bại",
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get("/mohinhtaisan", {
        params: { idcongty: CongTy.CT001 },
      });

      const rawData = res.data || [];
      if (rawData.length === 0) {
        throw new Error("Không có dữ liệu để xuất file");
      }

      // 2. Mapping dữ liệu sang tiêu đề Tiếng Việt cho Excel
      const payload = rawData.map((item: any) => ({
        "Mã mô hình": s(item.id),
        "Tên mô hình": s(item.tenMoHinh),
        "Phương pháp khấu hao":
          item.phuongPhapKhauHao === 1 ? "Đường thẳng" : "Khác",
        "Kỳ khấu hao": Number(item.kyKhauHao || 0),
        "Tài khoản tài sản": s(item.taiKhoanTaiSan),
        "Tài khoản khấu hao": s(item.taiKhoanKhauHao),
        "Tài khoản chi phí": s(item.taiKhoanChiPhi),
        "Ngày tạo": formatDateTime(item.ngayTao),
        "Ngày cập nhật": formatDateTime(item.ngayCapNhat),
      }));

      // 3. Đẩy dữ liệu qua cổng Export dùng chung của hệ thống
      const response = await api.post("/upload/export", payload, {
        params: { sheetName: "Mô hình tài sản" },
        responseType: "blob",
      });

      // 4. Xử lý tải file về máy
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Danh_sach_mo_hinh_tai_san_${dayjs().format("YYYYMMDD")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => showSuccessAlert("Xuất file thành công"),
    onError: (error: any) => {
      // Hiện thông báo lỗi cụ thể (ví dụ: Không có dữ liệu)
      showErrorAlert(error.message || "Lỗi khi kết nối server để xuất file");
    },
  });

  const importExcelMutation = useMutation({
    mutationFn: async (file: File) => {
      const currentUser = user?.taiKhoan?.tenDangNhap || "admin";

      return new Promise(async (resolve, reject) => {
        try {
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

              const listImport: any[] = [];
              const errorMessages: string[] = [];

              // Duyệt từ dòng 2 (index = 1)
              for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];

                // Bỏ qua dòng trống hoàn toàn
                if (row.every((cell) => s(cell) === "")) continue;

                const id = s(row[0]); // Cột A
                const tenMoHinh = s(row[1]); // Cột B

                // ---- Phương pháp khấu hao (Cột C) ----
                const rawPPKH = s(row[2]).trim().toLowerCase();
                let phuongPhapKhauHao = 0; // 0 = Khác (default)

                if (rawPPKH === "1" || rawPPKH.includes("đường thẳng")) {
                  phuongPhapKhauHao = 1;
                } else if (rawPPKH === "0" || rawPPKH.includes("khác")) {
                  phuongPhapKhauHao = 0;
                }

                // ---- Validate ----
                const rowErrors: string[] = [];
                if (!id) rowErrors.push("Mã mô hình không được để trống");
                if (!tenMoHinh)
                  rowErrors.push("Tên mô hình không được để trống");

                if (rowErrors.length > 0) {
                  errorMessages.push(`Dòng ${i + 1}: ${rowErrors.join(", ")}`);
                  continue;
                }

                // ---- Mapping dữ liệu ----
                listImport.push({
                  id,
                  tenMoHinh,
                  phuongPhapKhauHao,
                  kyKhauHao: Number(s(row[3]) || 0), // Cột D
                  loaiKyKhauHao: "1",
                  taiKhoanTaiSan: s(row[4]), // Cột E
                  taiKhoanKhauHao: s(row[5]), // Cột F
                  taiKhoanChiPhi: s(row[6]), // Cột G
                  idCongTy: CongTy.CT001,
                  ngayTao: formatDateTime(row[7]), // Cột H
                  ngayCapNhat: formatDateTime(row[8]), // Cột I
                  nguoiTao: s(row[9]) || currentUser, // Cột J
                  nguoiCapNhat: s(row[10]) || currentUser, // Cột K
                  isActive: true,
                });
              }

              // ---- Kết thúc ----
              if (errorMessages.length > 0) {
                reject(new Error(errorMessages.join("\n")));
                return;
              }

              if (listImport.length === 0) {
                reject(new Error("File không có dữ liệu hợp lệ để import"));
                return;
              }

              const res = await api.post("/mohinhtaisan/batch", listImport);
              resolve(res.data);
            } catch (err) {
              reject(new Error("Lỗi hệ thống khi đọc file Excel"));
            }
          };

          reader.readAsArrayBuffer(file);
        } catch (err) {
          reject(new Error("Không thể đọc file"));
        }
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelAssetsPage"] });
      showSuccessAlert("Import mô hình tài sản thành công");
    },

    // onError đã được handle ở component cha
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

export const useModelAssetPageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
) => {
  return useQuery({
    queryKey: ["modelAssetsPage", page, pageSize, searchValue],
    queryFn: async () => {
      const res = await api.get("/mohinhtaisan/paged", {
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

export const useAllModelAssetQuery = () => {
  return useQuery({
    queryKey: ["allModelAssets"],
    queryFn: async () => {
      const res = await api.get("/mohinhtaisan", {
        params: {
          idcongty: CongTy.CT001,
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });
};
