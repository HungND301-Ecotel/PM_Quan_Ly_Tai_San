// --- GIÁM ĐỊNH ---

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { CongTy, MessageTypeFunctions } from "../../../utils/const";
import { InspectionAdapter } from "../Adapter";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { InspectionRecordData } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import { listNguoiKy } from "../config";
import socketService from "../../../services/socketService";

export const useMaintenanceInspectionPageQuery = (
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
      "inspectionPage",
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
      const res = await api.get("/giamdinh/paged", {
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

export const useMaintenanceInspectionByBienBanQuery = (
  idBienBan?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["inspectionByBienBan", idBienBan],
    queryFn: async () => {
      const res = await api.get(`/giamdinh/bienban/${idBienBan}`);
      return (res.data.data || res.data || []).map((item: any) =>
        InspectionAdapter(item),
      );
    },
    enabled: !!idBienBan && enabled,
  });
};

export const useMaintenanceInspectionByBaoCaoQuery = (
  idBaoCao?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["inspectionByBaoCao", idBaoCao],
    queryFn: async () => {
      const res = await api.get(`/giamdinh/baocaokythuat/${idBaoCao}`);
      return (res.data.data || res.data || []).map((item: any) =>
        InspectionAdapter(item),
      );
    },
    enabled: !!idBaoCao && enabled,
  });
};

export const useMaintenanceInspectionMutation = () => {
  const queryClient = useQueryClient();
  const now = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const { user } = useSelector((state: any) => state.user);

  const handleUpdate = async (data?: any) => {
    queryClient.invalidateQueries({ queryKey: ["technicalReportByPlan"] });
    queryClient.invalidateQueries({ queryKey: ["inspectionByBaoCao"] });
    if (data) {
      const dataSend = {
        ...data,
        idTrinhDuyetGiamDoc: data?.idGiamDoc,
        tenTrinhDuyetGiamDoc: data?.tenGiamDoc,
        trinhDuyetGiamDocXacNhan: data?.giamDocXacNhan,
        idNguoiLapBieu: data?.idNguoiLap,
        tenNguoiLapBieu: data?.tenNguoiLap,
        nguoiLapBieuXacNhan: data?.nguoiLapXacNhan,
      };
      const list = await listNguoiKy([dataSend]);
      socketService.send({
        type: MessageTypeFunctions.INCIDENT,
        recieve: list,
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: InspectionRecordData) => {
      return (
        await api.post("/giamdinh", {
          ...data,
          nguoiTao: user?.taiKhoan?.tenDangNhap,
          ngayTao: now,
        })
      ).data;
    },
    onSuccess: async (response, variables) => {
      if (response.success || response.id || response.data?.id) {
        handleUpdate(variables);
        showSuccessAlert("Tạo biên bản giám định phương tiện thành công");
      } else {
        showErrorAlert(
          response.message || "Tạo biên bản giám định phương tiện thất bại",
        );
      }
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          "Tạo biên bản giám định phương tiện thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InspectionRecordData) => {
      return (
        await api.put(`/giamdinh/${data.id}`, {
          ...data,
          ngayCapNhat: now,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
        })
      ).data;
    },
    onSuccess: async (response, variables) => {
      if (response.success || response.id || response.data?.id) {
        handleUpdate(variables);
        showSuccessAlert("Cập nhật biên bản giám định phương tiện thành công");
      } else {
        showErrorAlert(
          response.message ||
            "Cập nhật biên bản giám định phương tiện thất bại",
        );
      }
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          "Cập nhật biên bản giám định phương tiện thất bại",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/giamdinh/${id}`)).data;
    },
    onSuccess: (res: any) => {
      if (res.success || res.id || res > 0) {
        handleUpdate();
        showSuccessAlert("Xóa biên bản giám định phương tiện thành công");
      } else {
        showErrorAlert(
          res.message || "Xóa biên bản giám định phương tiện thất bại",
        );
      }
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          "Xóa biên bản giám định phương tiện thất bại",
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      return (
        await api.post(`/giamdinh/capnhattrangthai?id=${id}&userId=${userId}`)
      ).data;
    },
    onSuccess: (res: any) => {
      if (res.success || res.id || res > 0) {
        handleUpdate();
        showSuccessAlert("Cập nhật trạng thái thành công");
      } else {
        showErrorAlert(res.message || "Cập nhật trạng thái thất bại");
      }
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Cập nhật trạng thái thất bại",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.post(`/giamdinh/huy?id=${id}`)).data;
    },
    onSuccess: (res: any) => {
      if (res.success || res.id || res > 0) {
        handleUpdate();
        showSuccessAlert("Hủy biên bản thành công");
      } else {
        showErrorAlert(res.message || "Hủy biên bản thất bại");
      }
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Hủy biên bản thất bại");
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    updateStatusMutation,
    cancelMutation,
  };
};
