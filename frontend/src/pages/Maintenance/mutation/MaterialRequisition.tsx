import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import api from "../../../config/api.config";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { MaterialRequisitionAdapter } from "../Adapter";

export const useMaterialRequisitionByJobAssignmentQuery = (
  idPhieuGiaoViec?: string,
) => {
  return useQuery({
    queryKey: ["materialRequisitionByJob", idPhieuGiaoViec],
    queryFn: async () => {
      const res = await api.get(
        `/phieulinhvattu/phieugiaoviec/${idPhieuGiaoViec}`,
      );
      return (res.data.data || res.data || []).map((item: any) =>
        MaterialRequisitionAdapter(item),
      );
    },
    placeholderData: (previousData) => previousData,
    enabled: !!idPhieuGiaoViec,
  });
};

export const useMaterialRequisitionPageQuery = (
  page?: number,
  pageSize?: number,
  searchValue?: string,
  trangThai?: number,
  idPhieuGiaoViec?: string,
  userid?: string,
  isSign?: boolean,
  dateFrom?: string,
  dateTo?: string,
  idTaiSan?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: [
      "materialRequisitionPage",
      page,
      pageSize,
      searchValue,
      trangThai,
      idPhieuGiaoViec,
      userid,
      isSign,
      dateFrom,
      dateTo,
      idTaiSan,
    ],
    queryFn: async () => {
      const res = await api.get("/phieulinhvattu/paged", {
        params: {
          page: page,
          size: pageSize,
          search: searchValue,
          trangThai: trangThai,
          idPhieuGiaoViec: idPhieuGiaoViec,
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

export const useMaterialRequisitionMutation = () => {
  const queryClient = useQueryClient();
  const now = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const { user } = useSelector((state: any) => state.user);

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["jobAssignmentByRepair"] });
    queryClient.invalidateQueries({ queryKey: ["materialRequisitionByJob"] });

  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return (
        await api.post("/phieulinhvattu", {
          ...data,
          nguoiTao: user?.taiKhoan?.tenDangNhap,
          ngayTao: now,
        })
      ).data;
    },
    onSuccess: async () => {
      handleUpdate()
      showSuccessAlert("Tạo phiếu lĩnh vật tư thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || "Tạo phiếu lĩnh vật tư thất bại",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return (
        await api.put(`/phieulinhvattu/${data.id}`, {
          ...data,
          ngayCapNhat: now,
          nguoiCapNhat: user?.taiKhoan?.tenDangNhap,
        })
      ).data;
    },
    onSuccess: async () => {
      handleUpdate();
      showSuccessAlert("Cập nhật phiếu lĩnh vật tư thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Cập nhật thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/phieulinhvattu/${id}`)).data;
    },
    onSuccess: async () => {
     handleUpdate();
      showSuccessAlert("Xóa phiếu lĩnh vật tư thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Xóa thất bại");
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};
