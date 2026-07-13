import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { JobAssignmentData, PlanSigner } from "../types";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import api from "../../../config/api.config";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { JobAssignmentAdapter } from "../Adapter";

export const useJobAssignmentByRepairQuery = (idSuaChua?: string) => {
  return useQuery({
    queryKey: ["jobAssignmentByRepair", idSuaChua],
    queryFn: async () => {
      const res = await api.get(`/phieugiaoviec/suachua/${idSuaChua}`);
      return (res.data.data || res.data || []).map((item: any) =>
        JobAssignmentAdapter(item),
      );
    },
    placeholderData: (previousData) => previousData,
    enabled: !!idSuaChua,
  });
};

export const useMaintenanceJobAssignmentPageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
  trangThai?: number,
  idSuaChua?: string,
  userid?: string,
  isSign?: boolean,
  dateFrom?: string,
  dateTo?: string,
  idTaiSan?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: [
      "jobAssignmentPage",
      page,
      pageSize,
      searchValue,
      trangThai,
      idSuaChua,
      userid,
      isSign,
      dateFrom,
      dateTo,
      idTaiSan,
    ],
    queryFn: async () => {
      const res = await api.get("/phieugiaoviec/paged", {
        params: {
          page: page,
          size: pageSize,
          search: searchValue,
          trangThai: trangThai,
          idSuaChua: idSuaChua,
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

export const useJobAssignmentMutation = () => {
  const queryClient = useQueryClient();
  const now = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const { user } = useSelector((state: any) => state.user);

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["repairByInspection"] });
    queryClient.invalidateQueries({ queryKey: ["jobAssignmentByRepair"] });

  };

  const createMutation = useMutation({
    mutationFn: async (data: JobAssignmentData) => {
      return (
        await api.post("/phieugiaoviec", {
          ...data,
          nguoiTao: user?.taiKhoan?.tenDangNhap,
          ngayTao: now,
        })
      ).data;
    },
    onSuccess: async () => {
      handleUpdate();
      showSuccessAlert("Tạo phiếu giao việc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Tạo phiếu giao việc thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: JobAssignmentData) => {
      return (
        await api.put(`/phieugiaoviec/${data.id}`, {
          ...data,
          ngayCapNhat: now,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
        })
      ).data;
    },
    onSuccess: async () => {
      handleUpdate();
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Cập nhật phiếu giao việc thất bại",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: JobAssignmentData) => {
      return (await api.delete(`/phieugiaoviec/${data.id}`)).data;
    },
    onSuccess: () => {
      handleUpdate();
      showSuccessAlert("Xóa phiếu giao việc thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Xóa phiếu giao việc thất bại",
      );
    },
  });

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
    onSuccess: () => {
      handleUpdate();
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
    updateSignerMutation,
  };
};
