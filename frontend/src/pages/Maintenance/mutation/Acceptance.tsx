import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import api from "../../../config/api.config";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { AcceptanceTestAdapter } from "../Adapter";

export const useAcceptanceByBienBanQuery = (idBienBan?: string) => {
  return useQuery({
    queryKey: ["nghiemThuByBienBan", idBienBan],
    queryFn: async () => {
      const res = await api.get(`/nghiemthu/bienban/${idBienBan}`);
      return (res.data.data || res.data || []).map((item: any) =>
        AcceptanceTestAdapter(item),
      );
    },
    placeholderData: (previousData) => previousData,
    enabled: !!idBienBan,
  });
};

export const useAcceptancePageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
  trangThai?: number,
  idBienBan?: string,
  userid?: string,
  isSign?: boolean,
  dateFrom?: string,
  dateTo?: string,
  idTaiSan?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: [
      "nghiemThuPage",
      page,
      pageSize,
      searchValue,
      trangThai,
      idBienBan,
      userid,
      isSign,
      dateFrom,
      dateTo,
      idTaiSan,
    ],
    queryFn: async () => {
      const res = await api.get("/nghiemthu/paged", {
        params: {
          page: page,
          size: pageSize,
          search: searchValue,
          trangThai: trangThai,
          idBienBan: idBienBan,
          userid: userid,
          isSign: isSign,
          dateFrom: dateFrom,
          dateTo: dateTo,
          idTaiSan: idTaiSan,
        },
      });
      return res.data.data || res.data;
    },
    placeholderData: (previousData) => previousData,
    enabled,
  });
};

export const useAcceptanceMutation = () => {
  const queryClient = useQueryClient();
  const now = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const { user } = useSelector((state: any) => state.user);

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["materialRequisitionByJob"] });
    queryClient.invalidateQueries({ queryKey: ["nghiemThuByBienBan"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return (
        await api.post("/nghiemthu", {
          ...data,
          nguoiTao: user?.taiKhoan?.tenDangNhap,
          ngayTao: now,
        })
      ).data;
    },
    onSuccess: async () => {
     handleUpdate();
      showSuccessAlert("Tạo biên bản nghiệm thu thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Tạo biên bản nghiệm thu thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return (
        await api.put(`/nghiemthu/${data.id}`, {
          ...data,
          ngayCapNhat: now,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
        })
      ).data;
    },
    onSuccess: async () => {
      handleUpdate();
      showSuccessAlert("Cập nhật biên bản nghiệm thu thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Cập nhật thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/nghiemthu/${id}`)).data;
    },
    onSuccess: async () => {
     handleUpdate();
      showSuccessAlert("Xóa biên bản nghiệm thu thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Xóa thất bại");
    },
  });

  const updateTrangThaiMutation = useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const formData = new URLSearchParams();
      formData.append("id", id);
      formData.append("userId", userId);
      return (
        await api.post("/nghiemthu/capnhattrangthai", formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })
      ).data;
    },
    onSuccess: async () => {
      handleUpdate();
      showSuccessAlert("Cập nhật trạng thái thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Cập nhật trạng thái thất bại",
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    updateTrangThaiMutation,
  };
};
