import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { CongTy, MessageTypeFunctions } from "../../../utils/const";
import { IncidentAdapter } from "../Adapter";
import { useSelector } from "react-redux";
import { IncidenData } from "../types";
import dayjs from "dayjs";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import { listNguoiKy } from "../config";
import socketService from "../../../services/socketService";

// Api sự cố thiết bị
export const useMaintenanceIncidentPageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
  trangThai?: number,
  idDonViGiao?: string,
  userid?: string,
  isSign?: boolean,
  dateFrom?: string,
  dateTo?: string,
  nhomTaiSan?: string,
  idTaiSan?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: [
      "incidentPage",
      page,
      pageSize,
      searchValue,
      trangThai,
      idDonViGiao,
      userid,
      isSign,
      dateFrom,
      dateTo,
      nhomTaiSan,
      idTaiSan,
    ],
    queryFn: async () => {
      const res = await api.get("/suco-thietbi/paged", {
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
          nhomTaiSan: nhomTaiSan,
          idTaiSan: idTaiSan,
        },
      });
      return res.data.data || res.data;
    },
    placeholderData: (previousData) => previousData,
    enabled,
  });
};

// Hook lấy chi tiết Tài Sản theo sự cố
export const useMaintenanceIncidentDetailByIncidentQuery = (
  idSuCo: string | undefined,
) => {
  return useQuery({
    queryKey: ["incidentDetailByIncident", idSuCo],
    queryFn: async () => {
      const res = await api.get(`/suco-thietbi-chitiet/by-suco/${idSuCo}`);
      return res.data.data || res.data || [];
    },
    enabled: !!idSuCo,
  });
};

export const useMaintenanceIncidentByPlanQuery = (
  idKeHoach: string | undefined,
) => {
  return useQuery({
    queryKey: ["incidentByPlan", idKeHoach],
    queryFn: async () => {
      const res = await api.get(`/suco-thietbi/by-kehoach/${idKeHoach}`);
      return (res.data.data || res.data || []).map((item: any) =>
        IncidentAdapter(item),
      );
    },
    enabled: !!idKeHoach,
  });
};

export const useMaintenanceIncidenMutation = () => {
  const queryClient = useQueryClient();
  const now = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const { user } = useSelector((state: any) => state.user);

  const handleUpdate = async (
    response: IncidenData | any,
    variables: IncidenData,
  ) => {
    queryClient.invalidateQueries({ queryKey: ["incidentPage"] });
    queryClient.invalidateQueries({ queryKey: ["incidentByPlan"] });
    if (variables) {
      const dataSend = {
        ...variables,
        idTrinhDuyetGiamDoc: variables?.idGiamDoc,
        tenTrinhDuyetGiamDoc: variables?.tenGiamDoc,
        trinhDuyetGiamDocXacNhan: variables?.giamDocXacNhan,
        idNguoiLapBieu: variables?.idNguoiLap,
        tenNguoiLapBieu: variables?.tenNguoiLap,
        nguoiLapBieuXacNhan: variables?.nguoiLapXacNhan,
      };
      const list = await listNguoiKy([dataSend]);
      socketService.send({
        type: MessageTypeFunctions.INCIDENT,
        recieve: list,
      });
    }
  };

  // --- API sự cố ---
  const createMutation = useMutation({
    mutationFn: async (data: IncidenData) => {
      return (
        await api.post("/suco-thietbi", {
          ...data,
          nguoiTao: user?.taiKhoan?.tenDangNhap,
          ngayTao: now,
        })
      ).data;
    },
    onSuccess: async (response, variables) => {
      handleUpdate(response, variables);
      queryClient.invalidateQueries({
        queryKey: ["maintenancePlanningGrouped"],
      });
      queryClient.invalidateQueries({ queryKey: ["incidentByPlan"] });
      showSuccessAlert("Tạo sự cố thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Tạo sự cố thất bại");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: IncidenData) => {
      return (
        await api.put(`/suco-thietbi/${data.id}`, {
          ...data,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
          ngayCapNhat: now,
        })
      ).data;
    },
    onSuccess: async (response, variables) => {
      handleUpdate(response, variables);
      queryClient.invalidateQueries({ queryKey: ["incidentPage"] });

      showSuccessAlert("Cập nhật sự cố thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Cập nhật sự cố thất bại",
      );
    },
  });

  const updateManyMutation = useMutation({
    mutationFn: async (data: IncidenData[]) => {
      const res = await api.put(
        `/suco-thietbi/batch`,
        data.map((i) => ({
          ...i,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
          ngayCapNhat: now,
        })),
      );
      return res.data;
    },
    onSuccess: (response, data) => {
      queryClient.invalidateQueries({ queryKey: ["incidentPage"] });
      console.log("Sửa sự cố thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message || error.message || "Sửa sự cố thất bại",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: IncidenData) => {
      return (await api.delete(`/suco-thietbi/${data.id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["maintenancePlanningGrouped"],
      });
      queryClient.invalidateQueries({ queryKey: ["incidentByPlan"] });
      showSuccessAlert("Xóa sự cố thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Xóa sự cố thất bại");
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    updateManyMutation,
  };
};
