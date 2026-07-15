import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import api from "../../../config/api.config";
import { QuyetToanData } from "../types";
import dayjs from "dayjs";
import { CongTy, MessageTypeFunctions } from "../../../utils/const";
import { useSelector } from "react-redux";
import { MaterialAssessmentAdapter } from "../Adapter";
import { listNguoiKy } from "../config";
import socketService from "../../../services/socketService";

export const useQuyetToanPageQuery = (
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
      "quyetToanPage",
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
      const res = await api.get("/quyettoan/paged", {
        params: {
          page: page,
          size: pageSize,
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

export const useQuyetToanByDanhGiaQuery = (idDanhGia?: string) => {
  return useQuery({
    queryKey: ["quyetToanByDanhGia", idDanhGia],
    queryFn: async () => {
      const res = await api.get(`/quyettoan/danh-gia/${idDanhGia}`);
      return (res.data.data || res.data || []).map(MaterialAssessmentAdapter);
    },
    enabled: !!idDanhGia,
  });
};

export const useQuyetToanMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: any) => state.user);

  const handleUpdate = async (data?: QuyetToanData) => {
    queryClient.invalidateQueries({ queryKey: ["quyetToanPage"] });
    queryClient.invalidateQueries({ queryKey: ["quyetToanByDanhGia"] });
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
    mutationFn: async (data: QuyetToanData) => {
      return (
        await api.post("/quyettoan", {
          ...data,
          congTy: CongTy.CT001,
          nguoiTao: user?.taiKhoan?.tenDangNhap,
          ngayTao: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        })
      ).data;
    },
    onSuccess: async (_, variables) => {
      handleUpdate(variables);
      showSuccessAlert("Tạo quyết toán thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Tạo quyết toán thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: QuyetToanData) => {
      return (
        await api.put(`/quyettoan/${data.id}`, {
          ...data,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
          ngayCapNhat: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        })
      ).data;
    },
    onSuccess: async (response, variables) => {
      handleUpdate(variables);
      showSuccessAlert("Cập nhật quyết toán thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Cập nhật quyết toán thất bại",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/quyettoan/${id}`)).data;
    },
    onSuccess: () => {
      handleUpdate();
      showSuccessAlert("Xóa quyết toán thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Xóa quyết toán thất bại",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.post(`/quyettoan/huy?id=${id}`)).data;
    },
    onSuccess: () => {
      handleUpdate();
      showSuccessAlert("Hủy quyết toán thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Hủy quyết toán thất bại",
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    cancelMutation,
  };
};
