import React, { createContext, useContext, ReactNode } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { useAssetTransferPageQuery } from "../pages/AssetTransfer/Mutation";
import { useToolTransferPageQuery } from "../pages/ToolTransfer/Mutation";
import { useAllPositionsQuery } from "../pages/Position/Mutation";
import { useConfig } from "../hooks/useContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../config/api.config";

import { showErrorAlert } from "../components/Alert";
import { setMaxTabLimit } from "../redux/tabsSlice";

interface MenuDataContextType {
  config: any;
  updateConfig: (newConfig: any) => void;
  isUpdatingConfig: boolean;
  counts: {
    assetTransfer: {
      total: number;
      c1: number;
      c2: number;
      c3: number;
      banHanhTotal: number;
      banHanh1: number;
      banHanh2: number;
      banHanh3: number;
    };
    toolTransfer: {
      total: number;
      c1: number;
      c2: number;
      c3: number;
      banHanhTotal: number;
      banHanh1: number;
      banHanh2: number;
      banHanh3: number;
    };
    transferAssetPageItems: number;
    transferToolPageItems: number;
    shareCounts: {
      totalPlan: number;
      totalIncident: number;
      totalRepair: number;
      totalIncidentInspection: number;
      totalMaterialAssessment: number;
      totalInspectionMachine: number;
      totalInspectionVehicle: number;
      totalMachineInspection: number;
      totalVehicleAcceptance: number;
      totalMeasureMachine: number;
      totalMeasureVehicle: number;
      totalAssetTransfer1: number;
      totalAssetTransfer2: number;
      totalAssetTransfer3: number;
      totalToolTransfer1: number;
      totalToolTransfer2: number;
      totalToolTransfer3: number;
      totalAssetTransfer: number;
      totalToolTransfer: number;
      totalAssetHandover: number;
      totalToolHandover: number;
      totalTransfer: number;
      totalHandover: number;
      totalMaintance: number;
    };
    signCounts: {
      totalPlan: number;
      totalIncident: number;
      totalRepair: number;
      totalIncidentInspection: number;
      totalMaterialAssessment: number;
      totalInspectionMachine: number;
      totalInspectionVehicle: number;
      totalMachineInspection: number;
      totalVehicleAcceptance: number;
      totalMeasureMachine: number;
      totalMeasureVehicle: number;
      totalAssetTransfer1: number;
      totalAssetTransfer2: number;
      totalAssetTransfer3: number;
      totalToolTransfer1: number;
      totalToolTransfer2: number;
      totalToolTransfer3: number;
      totalAssetTransfer: number;
      totalToolTransfer: number;
      totalAssetHandover: number;
      totalToolHandover: number;
      totalMaintance: number;
    };
  };
}

const MenuDataContext = createContext<MenuDataContextType | undefined>(
  undefined,
);

export const MenuDataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useSelector((state: any) => state.user);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { config, setConfig } = useConfig();

  // 1. Lấy dữ liệu cấu hình
  useQuery({
    queryKey: ["expirationConfig", user?.taiKhoan?.tenDangNhap],
    queryFn: async () => {
      const res = await api.get(`/config/${user?.taiKhoan?.tenDangNhap}`);
      setConfig(res.data);
      if (res.data?.soTabToiDa) {
        dispatch(setMaxTabLimit(res.data.soTabToiDa));
      }
      return res.data;
    },
    enabled: !!user?.taiKhoan?.tenDangNhap,
  });

  // 2. Mutation để lưu dữ liệu
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: {
      thoiHanTaiLieu: number;
      ngayBaoHetHan: number;
      ngayBaoDangKiem: number;
      soTabToiDa: number;
    }) =>
      await api.post("/config", {
        idAccount: user?.taiKhoan?.tenDangNhap,
        ...newConfig,
      }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["expirationConfig", user?.taiKhoan?.tenDangNhap],
      });
      setConfig({
        idAccount: user?.taiKhoan?.tenDangNhap || "",
        ...variables,
      });
      if (variables.soTabToiDa) {
        dispatch(setMaxTabLimit(variables.soTabToiDa));
      }
    },
    onError: (error: any) => {
      showErrorAlert(
        `Lỗi cấu hình: ${error.response?.data?.message || error.message}`,
      );
    },
  });

  // điều chuyển tài sản
  const { data: transferAssetPage = { items: [], totalItems: 0 } } =
    useAssetTransferPageQuery(
      0,
      999999,
      "",
      undefined,
      undefined,
      4,
      user?.taiKhoan?.phongBanId,
      true,
    );

  // điều chuyển công cụ
  const { data: transferToolPage = { items: [], totalItems: 0 } } =
    useToolTransferPageQuery(
      0,
      999999,
      "",
      undefined,
      undefined,
      4,
      true,
      user?.taiKhoan?.phongBanId,
    );

  const tenDangNhap = user?.taiKhoan?.tenDangNhap;

  // share counts
  const { data: shareCountsData = { total: 0 } } = useQuery({
    queryKey: ["maintenanceShareCounts", tenDangNhap],
    queryFn: async () => {
      const res = await api.get(`/maintenance/share-counts`, {
        params: { userid: tenDangNhap },
      });
      return res.data?.data || { total: 0 };
    },
    enabled: !!tenDangNhap,
  });

  // sign counts
  const { data: signCountsData = { total: 0 } } = useQuery({
    queryKey: ["maintenanceSignCounts", tenDangNhap],
    queryFn: async () => {
      const res = await api.get(`/maintenance/sign-counts`, {
        params: { userid: tenDangNhap },
      });
      return res.data?.data || { total: 0 };
    },
    enabled: !!tenDangNhap,
  });

  const value = {
    config,
    updateConfig: updateConfigMutation.mutate,
    isUpdatingConfig: updateConfigMutation.isPending,
    counts: {
      assetTransfer: {
        total: signCountsData.totalAssetTransfer || 0,
        c1: signCountsData.totalAssetTransfer1 || 0,
        c2: signCountsData.totalAssetTransfer2 || 0,
        c3: signCountsData.totalAssetTransfer3 || 0,
        banHanhTotal:
          (signCountsData.totalAssetTransferBanHanh1 || 0) +
          (signCountsData.totalAssetTransferBanHanh2 || 0) +
          (signCountsData.totalAssetTransferBanHanh3 || 0),
        banHanh1: signCountsData.totalAssetTransferBanHanh1 || 0,
        banHanh2: signCountsData.totalAssetTransferBanHanh2 || 0,
        banHanh3: signCountsData.totalAssetTransferBanHanh3 || 0,
      },
      toolTransfer: {
        total: signCountsData.totalToolTransfer || 0,
        c1: signCountsData.totalToolTransfer1 || 0,
        c2: signCountsData.totalToolTransfer2 || 0,
        c3: signCountsData.totalToolTransfer3 || 0,
        banHanhTotal:
          (signCountsData.totalToolTransferBanHanh1 || 0) +
          (signCountsData.totalToolTransferBanHanh2 || 0) +
          (signCountsData.totalToolTransferBanHanh3 || 0),
        banHanh1: signCountsData.totalToolTransferBanHanh1 || 0,
        banHanh2: signCountsData.totalToolTransferBanHanh2 || 0,
        banHanh3: signCountsData.totalToolTransferBanHanh3 || 0,
      },
      transferAssetPageItems: transferAssetPage.totalItems,
      transferToolPageItems: transferToolPage.totalItems,
      shareCounts: {
        totalPlan: shareCountsData.totalPlan || 0,
        totalIncident: shareCountsData.totalIncident || 0,
        totalRepair: shareCountsData.totalRepair || 0,
        totalIncidentInspection: shareCountsData.totalIncidentInspection || 0,
        totalMaterialAssessment: shareCountsData.totalMaterialAssessment || 0,
        totalInspectionMachine: shareCountsData.totalInspectionMachine || 0,
        totalInspectionVehicle: shareCountsData.totalInspectionVehicle || 0,
        totalMachineInspection: shareCountsData.totalMachineInspection || 0,
        totalVehicleAcceptance: shareCountsData.totalVehicleAcceptance || 0,
        totalMeasureMachine: shareCountsData.totalMeasureMachine || 0,
        totalMeasureVehicle: shareCountsData.totalMeasureVehicle || 0,
        totalAssetTransfer1: shareCountsData.totalAssetTransfer1 || 0,
        totalAssetTransfer2: shareCountsData.totalAssetTransfer2 || 0,
        totalAssetTransfer3: shareCountsData.totalAssetTransfer3 || 0,
        totalToolTransfer1: shareCountsData.totalToolTransfer1 || 0,
        totalToolTransfer2: shareCountsData.totalToolTransfer2 || 0,
        totalToolTransfer3: shareCountsData.totalToolTransfer3 || 0,
        totalAssetTransfer: shareCountsData.totalAssetTransfer || 0,
        totalToolTransfer: shareCountsData.totalToolTransfer || 0,
        totalAssetHandover: shareCountsData.totalAssetHandover || 0,
        totalToolHandover: shareCountsData.totalToolHandover || 0,
        totalTransfer: shareCountsData.totalTransfer || 0,
        totalHandover: shareCountsData.totalHandover || 0,
        totalMaintance: shareCountsData.totalMaintance || 0,
      },
      signCounts: {
        totalPlan: signCountsData.totalPlan || 0,
        totalIncident: signCountsData.totalIncident || 0,
        totalRepair: signCountsData.totalRepair || 0,
        totalIncidentInspection: signCountsData.totalIncidentInspection || 0,
        totalMaterialAssessment: signCountsData.totalMaterialAssessment || 0,
        totalInspectionMachine: signCountsData.totalInspectionMachine || 0,
        totalInspectionVehicle: signCountsData.totalInspectionVehicle || 0,
        totalMachineInspection: signCountsData.totalMachineInspection || 0,
        totalVehicleAcceptance: signCountsData.totalVehicleAcceptance || 0,
        totalMeasureMachine: signCountsData.totalMeasureMachine || 0,
        totalMeasureVehicle: signCountsData.totalMeasureVehicle || 0,
        totalAssetTransfer1: signCountsData.totalAssetTransfer1 || 0,
        totalAssetTransfer2: signCountsData.totalAssetTransfer2 || 0,
        totalAssetTransfer3: signCountsData.totalAssetTransfer3 || 0,
        totalToolTransfer1: signCountsData.totalToolTransfer1 || 0,
        totalToolTransfer2: signCountsData.totalToolTransfer2 || 0,
        totalToolTransfer3: signCountsData.totalToolTransfer3 || 0,
        totalAssetTransfer: signCountsData.totalAssetTransfer || 0,
        totalToolTransfer: signCountsData.totalToolTransfer || 0,
        totalAssetHandover: signCountsData.totalAssetHandover || 0,
        totalToolHandover: signCountsData.totalToolHandover || 0,
        totalMaintance: signCountsData.totalMaintance || 0,
      },
    },
  };

  return (
    <MenuDataContext.Provider value={value}>
      {children}
    </MenuDataContext.Provider>
  );
};

export const useMenuDataContext = () => {
  const context = useContext(MenuDataContext);
  if (context === undefined) {
    throw new Error(
      "useMenuDataContext must be used within a MenuDataProvider",
    );
  }
  return context;
};
