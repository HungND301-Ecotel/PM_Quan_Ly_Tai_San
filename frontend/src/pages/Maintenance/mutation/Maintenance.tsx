import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { listNguoiKy } from "../config";
import socketService from "../../../services/socketService";
import { MessageTypeFunctions } from "../../../utils/const";
import { showErrorAlert, showSuccessAlert } from "../../../components/Alert";
import { SignaturesData } from "../../../components/SignDocument/types";

// mutation chung cho luồng sửa chữa
export const useMaintenanceMutation = (
  key: string,
  apiUri: string,
  activeTab?: number,
) => {
  const queryClient = useQueryClient();

  // ky tai lieu
  const signMutation = useMutation({
    mutationFn: async ({
      SignaturesData,
      asset,
    }: {
      SignaturesData: SignaturesData[];
      asset: any;
      suppressAlert?: boolean;
    }) => {
      const res = await api.post("/chuky", SignaturesData);
      return res.data;
    },
    onSuccess: async (response, data) => {
      queryClient.invalidateQueries({ queryKey: [key] });
      data.SignaturesData.forEach((item) => {
        signStatusMutation.mutate({
          idTaiLieu: item.idTaiLieu,
          userId: item.idNguoiKy,
        });
      });
      console.log("data", data.asset);
      const list = await listNguoiKy(
        Array.isArray(data.asset) ? data.asset : [data.asset],
      );
      socketService.send({
        type:
          activeTab === 0
            ? MessageTypeFunctions.PLAN
            : activeTab === 1
              ? MessageTypeFunctions.REPAIR
              : activeTab === 2
                ? MessageTypeFunctions.INSPECTION
                : activeTab === 3
                  ? MessageTypeFunctions.MEASURE
                  : activeTab === 4
                    ? MessageTypeFunctions.ACCEPTANCE_TEST
                    : activeTab === 5
                      ? MessageTypeFunctions.MATERIAL
                      : activeTab === 6
                        ? MessageTypeFunctions.INCIDENT
                        : activeTab === 7
                          ? MessageTypeFunctions.INCIDENT_INSPECTION
                          : "",
        recieve: list,
      });
      if (!data.suppressAlert) {
        showSuccessAlert("Ký thành công");
      }
    },
    onError: (error: any, variables) => {
      if (!variables?.suppressAlert) {
        showErrorAlert(
          error.response?.data?.message || error.message || "Ký thất bại",
        );
      }
    },
  });

  // cap nhat trang thai ky
  const signStatusMutation = useMutation({
    mutationFn: async ({
      idTaiLieu,
      userId,
    }: {
      idTaiLieu: string;
      userId: string;
    }) => {
      const res = await api.post(
        `/${apiUri}/capnhattrangthai?id=${idTaiLieu}&userId=${userId}`,
      );
      return res.data;
    },
    onSuccess: (response, data) => {
      queryClient.invalidateQueries({ queryKey: [key] });

      console.log("Cập nhật trạng thái ký thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message ||
          error.message ||
          "Cập nhật trạng thái ký thất bại",
      );
    },
  });

  // trình duyệt biên bản (chỉ cập nhật Share = true, không gửi full data)
  const updateManyMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const ids = data.map((item) => item.id);
      const res = await api.post(`/batch-share/${apiUri}`, ids);
      return res.data;
    },
    onSuccess: async (response, data) => {
      queryClient.invalidateQueries({ queryKey: [key] });
      const list = await listNguoiKy(data);
      socketService.send({
        type:
          activeTab === 0
            ? MessageTypeFunctions.PLAN
            : activeTab === 1
              ? MessageTypeFunctions.REPAIR
              : activeTab === 2
                ? MessageTypeFunctions.INSPECTION
                : activeTab === 3
                  ? MessageTypeFunctions.ACCEPTANCE_TEST
                  : activeTab === 4
                    ? MessageTypeFunctions.MATERIAL
                    : activeTab === 5
                      ? MessageTypeFunctions.INCIDENT
                      : activeTab === 6
                        ? MessageTypeFunctions.ACCEPTANCE_TEST
                        : "",
        recieve: list,
      });
      console.log("Trình duyệt thành công");
    },
    onError: (error: any) => {
      console.log(
        error.response?.data?.message ||
          error.message ||
          "Trình duyệt thất bại",
      );
    },
  });

  // hủy biên bản
  const cancelMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await api.post(`/${apiUri}/huy?id=${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
      showSuccessAlert("Từ chối biên bản thành công");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response?.data?.message || error.message || "Từ chối thất bại",
      );
    },
  });
  // thêm ghi chú biên bản
  const saveNoteMutation = useMutation({
    mutationFn: async ({
      id,
      ghiChuBienBan,
    }: {
      id: string;
      ghiChuBienBan: string;
    }) => {
      const res = await api.patch(`/${apiUri}/${id}/ghi-chu`, {
        ghiChuBienBan,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Lưu ghi chú thất bại");
    },
  });
  return {
    signMutation,
    updateManyMutation,
    cancelMutation,
    saveNoteMutation,
  };
};

// quy trình luồng sửa chữa của 1 tài sản
export const useMaintenanceMaterialConsumptionQuery = (
  idTaiSan?: string,
  dateFrom?: string,
  dateTo?: string,
  nhomTaiSan?: string,
) => {
  return useQuery({
    queryKey: [
      "maintenanceMaterialConsumption",
      idTaiSan,
      dateFrom,
      dateTo,
      nhomTaiSan,
    ],
    queryFn: async () => {
      const res = await api.get("/quy-trinh/material-consumption", {
        params: {
          idTaiSan: idTaiSan,
          dateFrom: dateFrom,
          dateTo: dateTo,
          nhomTaiSan: nhomTaiSan,
        },
      });
      return res.data.data || res.data || [];
    },
    enabled: !!idTaiSan && !!nhomTaiSan,
  });
};

// lịch sử hoạt động thiết bị
export const useDeviceActivityHistoryQuery = (
  idTaiSan?: string,
  dateFrom?: string,
  dateTo?: string
) => {
  return useQuery({
    queryKey: ["deviceActivityHistory", idTaiSan, dateFrom, dateTo],
    queryFn: async () => {
      const res = await api.get("/quy-trinh/lich-su-hoat-dong", {
        params: {
          idTaiSan,
          dateFrom,
          dateTo,
        },
      });
      return res.data.data || res.data || [];
    },
    enabled: !!idTaiSan,
  });
};

// thồn tin tài sản theo id, dateFrom, dateTo
export const useGetTaiSanByIdQuery = (
  id: string | undefined,
  dateFrom?: string,
  dateTo?: string
) => {
  return useQuery({
    queryKey: ["taiSanById", id, dateFrom, dateTo],
    queryFn: async () => {
      const res = await api.get(`/taisan/${id}`, {
        params: { dateFrom, dateTo },
      });
      return res.data.data || res.data;
    },
    enabled: !!id,
  });
};
