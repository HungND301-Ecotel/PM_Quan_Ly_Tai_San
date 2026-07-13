import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import { TechnicalReportData } from "../types";
import { TechnicalReportAdapter } from "../Adapter";
import { CongTy } from "../../../utils/const";

export const useTechnicalReportByPlanQuery = (
  idKeHoach: string | undefined,
) => {
  return useQuery({
    queryKey: ["technicalReportByPlan", idKeHoach],
    queryFn: async () => {
      const res = await api.get(`/baocaokythuat/kehoach/${idKeHoach}`);
      return (res.data.data || res.data || []).map(TechnicalReportAdapter);
    },
    enabled: !!idKeHoach,
  });
};

export const useMaintenanceTechnicalReportPageQuery = (
  page: number,
  size: number,
  search?: string,
  trangThai?: number,
  userid?: string,
  isSign?: boolean,
  dateFrom?: string,
  dateTo?: string,
  idTaiSan?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: [
      "maintenanceTechnicalReportPage",
      page,
      size,
      search,
      trangThai,
      userid,
      isSign,
      dateFrom,
      dateTo,
      idTaiSan,
    ],
    queryFn: async () => {
      const res = await api.get("/baocaokythuat/paged", {
        params: {
          idCongTy: CongTy.CT001,
          page: page,
          size: size,
          search: search,
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
    enabled: enabled,
  });
};

export const useTechnicalReportMutation = () => {
  const queryClient = useQueryClient();
  const now = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const { user } = useSelector((state: any) => state.user);

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["maintenancePlanningDetailsByMonth"] });
    queryClient.invalidateQueries({ queryKey: ["technicalReportByPlan"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: TechnicalReportData) => {
      return (
        await api.post("/baocaokythuat", {
          ...data,
          nguoiTao: user?.taiKhoan?.tenDangNhap,
          ngayTao: now,
        })
      ).data;
    },
    onSuccess: () => {
      handleUpdate();
      showSuccessAlert("Tạo Báo cáo kỹ thuật thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Tạo Báo cáo kỹ thuật thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TechnicalReportData) => {
      return (
        await api.put(`/baocaokythuat/${data.id}`, {
          ...data,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
          ngayCapNhat: now,
        })
      ).data;
    },
    onSuccess: () => {
      handleUpdate();
      showSuccessAlert("Cập nhật Báo cáo kỹ thuật thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Cập nhật Báo cáo kỹ thuật thất bại",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/baocaokythuat/${id}`)).data;
    },
    onSuccess: () => {
      handleUpdate();
      showSuccessAlert("Xóa Báo cáo kỹ thuật thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Xóa Báo cáo kỹ thuật thất bại",
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
};
