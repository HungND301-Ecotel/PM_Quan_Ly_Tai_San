// đánh giá vật tư thu hồi

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import api from "../../../config/api.config";
import { DanhGiaVatTuData } from "../types";
import dayjs from "dayjs";
import { CongTy, MessageTypeFunctions } from "../../../utils/const";
import { useSelector } from "react-redux";
import { MaterialAssessmentAdapter } from "../Adapter";
import { listNguoiKy } from "../config";
import socketService from "../../../services/socketService";

export const useMaintenanceMaterialAssessmentPageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
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
      "materialAssessmentPage",
      page,
      pageSize,
      searchValue,
      trangThai,
      userid,
      isSign,
      dateFrom,
      dateTo,
      idTaiSan,
    ],
    queryFn: async () => {
      const res = await api.get("/danhgia-vattu/paged", {
        params: {
          page: page,
          size: pageSize,
          idcongty: CongTy.CT001,
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

export const useMaintenanceMaterialAssessmentByAcceptanceQuery = (
  idNghiemThu?: string,
) => {
  return useQuery({
    queryKey: ["materialAssessmentByAcceptance", idNghiemThu],
    queryFn: async () => {
      const res = await api.get(`/danhgia-vattu/nghiemthu/${idNghiemThu}`);
      return (res.data.data || res.data || []).map((item: any) =>
        MaterialAssessmentAdapter(item),
      );
    },
    enabled: !!idNghiemThu,
  });
};
export const useMaintenanceMaterialAssessmentMutation = () => {
  const queryClient = useQueryClient();
  const now = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const { user } = useSelector((state: any) => state.user);

  const handleUpdate = async (data?: any) => {
    queryClient.invalidateQueries({ queryKey: ["nghiemThuByBienBan"] });
    queryClient.invalidateQueries({
      queryKey: ["materialAssessmentByAcceptance"],
    });
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
            type: MessageTypeFunctions.MATERIAL,
            recieve: list,
          });
        }
  };

  const createMutation = useMutation({
    mutationFn: async (data: DanhGiaVatTuData) => {
      return (
        await api.post("/danhgia-vattu", {
          ...data,
          idCongTy: CongTy.CT001,
          nguoiTao: user?.taiKhoan?.tenDangNhap,
          ngayTao: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        })
      ).data;
    },
    onSuccess: async (response, variables) => {
      const id = response?.id || response?.data?.id;
      // Backend now handles nguoiky list natively
      handleUpdate(variables);
      showSuccessAlert("Tạo biên bản đánh giá vật tư thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          "Tạo biên bản đánh giá vật tư thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: DanhGiaVatTuData) => {
      return (
        await api.put(`/danhgia-vattu/${data.id}`, {
          ...data,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
          ngayCapNhat: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        })
      ).data;
    },
    onSuccess: async (response, variables) => {
      const id = variables.id;
      // Backend now handles nguoiky list natively
      handleUpdate(variables);
      showSuccessAlert("Cập nhật biên bản đánh giá vật tư thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message ||
          "Cập nhật biên bản đánh giá vật tư thất bại",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/danhgia-vattu/${id}`)).data;
    },
    onSuccess: () => {
      handleUpdate();
      showSuccessAlert("Xóa biên bản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Xóa biên bản thất bại");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.post(`/danhgia-vattu/huy?id=${id}`)).data;
    },
    onSuccess: () => {
      handleUpdate();
      showSuccessAlert("Hủy biên bản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Hủy biên bản thất bại");
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    cancelMutation,
  };
};
