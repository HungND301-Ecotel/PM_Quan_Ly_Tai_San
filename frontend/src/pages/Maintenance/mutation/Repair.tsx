// API sửa chữa

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MaintenanceRepairData, PlanSigner } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import api from "../../../config/api.config";
import { useSelector } from "react-redux";
import { RepairAdapter } from "../Adapter";
import { CongTy, MessageTypeFunctions } from "../../../utils/const";
import dayjs from "dayjs";
import { listNguoiKy } from "../config";
import socketService from "../../../services/socketService";

export const useMaintenanceRepairPageQuery = (
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
      "repairPage",
      page,
      pageSize,
      searchValue,
      trangThai,
      idDonViGiao,
      userid,
      isSign,
      dateFrom,
      idTaiSan,
      dateTo,
      idTaiSan,
    ],
    queryFn: async () => {
      const res = await api.get("/suachua/paged", {
        params: {
          page: page,
          size: pageSize,
          idCongTy: CongTy.CT001,
          search: searchValue,
          trangThai: trangThai,
          userid: userid,
          isSign: isSign,
          dateFrom: dateFrom,
          idTaiSan: idTaiSan,
          dateTo: dateTo,
        },
      });
      return res.data.data || res.data;
    },
    placeholderData: (previousData) => previousData,
    enabled,
  });
};
export const useMaintenanceRepairByInspectionQuery = (idGiamDinh?: string) => {
  return useQuery({
    queryKey: ["repairByInspection", idGiamDinh],
    queryFn: async () => {
      const res = await api.get(`/suachua/giamdinh/${idGiamDinh}`);
      return (res.data.data || res.data || []).map((item: any) =>
        RepairAdapter(item),
      );
    },
    placeholderData: (previousData) => previousData,
    enabled: !!idGiamDinh,
  });
};
export const useMaintenanceRepairMutation = () => {
  const queryClient = useQueryClient();
  const now = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const { user } = useSelector((state: any) => state.user);

  const handleUpdate = async (data?: MaintenanceRepairData) => {
    queryClient.invalidateQueries({ queryKey: ["inspectionByBaoCao"] });
    queryClient.invalidateQueries({ queryKey: ["repairByInspection"] });
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

  // --- API SỬA CHỮA ---
  const createMutation = useMutation({
    mutationFn: async (data: MaintenanceRepairData) => {
      return (
        await api.post("/suachua", {
          ...data,
          nguoiTao: user?.taiKhoan?.tenDangNhap,
          ngayTao: now,
        })
      ).data;
    },
    onSuccess: async (response, variables) => {
      handleUpdate(variables)
      showSuccessAlert("Tạo giấy đề nghị sửa chữa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Tạo giấy đề nghị sửa chữa thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MaintenanceRepairData) => {
      return (
        await api.put(`/suachua/${data.id}`, {
          ...data,
          ngayCapNhat: now,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
        })
      ).data;
    },
    onSuccess: async (response, variables) => {
      handleUpdate(variables);

      showSuccessAlert("Cập nhật giấy đề nghị thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Cập nhật giấy đề nghị thất bại",
      );
    },
  });

  const updateManyMutation = useMutation({
    mutationFn: async (data: MaintenanceRepairData[]) => {
      const res = await api.put(
        `/suachua/batch`,
        data.map((i) => ({
          ...i,
          ngayCapNhat: now,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
        })),
      );
      return res.data;
    },
    onSuccess: (response, data) => {
      handleUpdate();
      console.log("Sửa giấy đề nghị thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message ||
          error.message ||
          "Sửa giấy đề nghị thất bại",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: MaintenanceRepairData) => {
      return (await api.delete(`/suachua/${data.id}`)).data;
    },
    onSuccess: () => {
      handleUpdate();
      showSuccessAlert("Xóa giấy đề nghị thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Xóa giấy đề nghị thất bại",
      );
    },
  });

  // người kí
  const updateSignerMutation = useMutation({
    mutationFn: async ({
      idTaiLieu,
      data,
    }: {
      idTaiLieu: string;
      data: PlanSigner[];
    }) => {
      const res = await api.put(`/chuky/nguoi-ky/update/${idTaiLieu}`, data);
      return res.data;
    },
    onSuccess: (response, data) => {
      queryClient.invalidateQueries({
        queryKey: ["repairPage"],
      });

      console.log("Cập nhật người ký thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message ||
          error.message ||
          "Cập nhật người ký thất bại",
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    updateManyMutation,
    updateSignerMutation,
  };
};
