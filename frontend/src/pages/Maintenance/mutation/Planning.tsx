// API Kế hoạch sửa chữa
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "../../../config/api.config";
import { CongTy, MessageTypeFunctions } from "../../../utils/const";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { MaintenancePlanData } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import { listNguoiKy } from "../config";
import socketService from "../../../services/socketService";

export const useMaintenancePlanningPageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
  trangThai?: number,
  idDonViGiao?: string,
  userid?: string,
  isSign?: boolean,
  dateFrom?: string,
  dateTo?: string,
  idTaiSan?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: [
      "maintenancePlanningPage",
      page,
      pageSize,
      searchValue,
      trangThai,
      idDonViGiao,
      userid,
      isSign,
      dateFrom,
      dateTo,
      idTaiSan,
    ],
    queryFn: async () => {
      const res = await api.get("/kehoach-suachua/paged", {
        params: {
          page: page,
          size: pageSize,
          idCongTy: CongTy.CT001,
          search: searchValue,
          trangThai: trangThai,
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

export const useMaintenancePlanningGroupedQuery = (
  idCongTy: string,
  trangThai?: number,
  search?: string,
  userid?: string,
  idDonViGiao?: string,
  dateFrom?: string,
  dateTo?: string,
) => {
  return useQuery({
    queryKey: [
      "maintenancePlanningGrouped",
      idCongTy,
      trangThai,
      search,
      userid,
      idDonViGiao,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      const res = await api.get("/kehoach-suachua/grouped-by-year", {
        params: {
          idCongTy,
          trangThai,
          search,
          userid,
          idDonViGiao,
          dateFrom,
          dateTo,
        },
      });
      return res.data;
    },
  });
};

// kế hoạch chi tiết theo tháng
export const useMaintenancePlanningDetailsByMonthQuery = (
  idKeHoach: string,
  selectMonths: number[],
) => {
  return useQueries({
    queries: selectMonths.map((thang) => ({
      queryKey: ["maintenancePlanningDetailsByMonth", idKeHoach, thang],
      queryFn: async () => {
        const res = await api.get(
          `kehoachsuachua-chitiet-taisan/kehoach/${idKeHoach}/thang/${thang}`,
        );
        return res.data.data || res.data || [];
      },
      enabled: !!idKeHoach && !!thang,
    })),
  });
};

// Hook lấy chi tiết Tài Sản theo Kế Hoạch
export const useChiTietTaiSanByKeHoachQuery = (
  idKeHoach: string | undefined,
) => {
  return useQuery({
    queryKey: ["chiTietTaiSan", idKeHoach],
    queryFn: async () => {
      const res = await api.get(
        `/kehoachsuachua-chitiet-taisan/kehoach/${idKeHoach}`,
      );
      return res.data;
    },
    enabled: !!idKeHoach,
  });
};

export const useMaintenancePlanningMutation = () => {
  const queryClient = useQueryClient();
  const now = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const { user } = useSelector((state: any) => state.user);

  const handleUpdate = async (
    response?: MaintenancePlanData | any,
    variables?: MaintenancePlanData,
  ) => {
    queryClient.invalidateQueries({ queryKey: ["maintenancePlanningPage"] });
    queryClient.invalidateQueries({
      queryKey: ["maintenancePlanningGrouped"],
    });
    if (variables) {
      const list = await listNguoiKy([variables]);
      socketService.send({
        type: MessageTypeFunctions.PLAN,
        recieve: list,
      });
    }
  };

  // --- API KẾ HOẠCH ---
  const createMutation = useMutation({
    mutationFn: async (data: MaintenancePlanData) => {
      return (
        await api.post("/kehoach-suachua", {
          ...data,
          nguoiTao: user?.taiKhoan?.tenDangNhap,
          ngayTao: now,
        })
      ).data;
    },
    onSuccess: async (response, variables) => {
      handleUpdate(response, variables);
      showSuccessAlert("Tạo kế hoạch sửa chữa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Tạo kế hoạch sửa chữa thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MaintenancePlanData) => {
      return (
        await api.put(`/kehoach-suachua/${data.id}`, {
          ...data,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
          ngayCapNhat: now,
        })
      ).data;
    },
    onSuccess: async (response, variables) => {
      handleUpdate(response, variables);
      showSuccessAlert("Cập nhật kế hoạch bảo trì thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Cập nhật kế hoạch bảo trì thất bại",
      );
    },
  });

  const updateManyMutation = useMutation({
    mutationFn: async (data: MaintenancePlanData[]) => {
      const res = await api.put(
        `/kehoach-suachua/batch`,
        data.map((i) => ({
          ...i,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
          ngayCapNhat: now,
        })),
      );
      return res.data;
    },
    onSuccess: (response, data) => {
      handleUpdate();
      console.log("Sửa kế hoạch thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message ||
          error.message ||
          "Sửa kế hoạch thất bại",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: MaintenancePlanData) => {
      return (await api.delete(`/kehoach-suachua/${data.id}`)).data;
    },
    onSuccess: (response, variables) => {
      handleUpdate(response, variables);
      showSuccessAlert("Xóa kế hoạch bảo trì thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Xóa kế hoạch bảo trì thất bại",
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    updateManyMutation,
  };
};
