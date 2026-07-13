import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ROUTES } from "./utils/routes";
import Login from "./pages/Auth/Login";
import Main from "./layout/Main";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "./redux/userSlice";
import { isTokenValid } from "./utils/auth";
import Staff from "./pages/Staff/Staff";
import DashBoard from "./pages/Dashboard/DashBoard";
import Department from "./pages/Department/Department";
import Project from "./pages/Project/Project";
import CapitalSource from "./pages/CapitalSource/CapitalSource";
import Position from "./pages/Position/Position";
import TypeAsset from "./pages/TypeAsset/TypeAsset";
import ModelAsset from "./pages/ModelAsset/ModelAsset";
import AssetGroup from "./pages/AssetGroup/AssetGroup";
import ToolGroup from "./pages/ToolGroup/ToolGroup";
import AssetManager from "./pages/AssetManager/AssetManager";
import AssetTransfer from "./pages/AssetTransfer/AssetTransfer";
import AssetDepreciation from "./pages/AssetManager/AssetDepreciation";
import ToolType from "./pages/ToolType/ToolType";
import MaintenanceRepairType from "./pages/MaintenanceRepairType/MaintenanceRepairType";
import Unit from "./pages/Unit/Unit";
import ReasonIncrease from "./pages/ReasonIncrease/ResonIncrease";
import CurrentStatus from "./pages/CurrentStatus/CurrentStatus";
import ToolManager from "./pages/ToolManager/ToolManager";
import ToolCategory from "./pages/ToolCategory/ToolCategory";
import AssetHandover from "./pages/AssetHandover/AssetHandover";
import Report from "./pages/Report/Report";
import ToolTransfer from "./pages/ToolTransfer/ToolTransfer";
import ToolHandover from "./pages/ToolHandover/ToolHandover";
import Account from "./pages/Account/Account";
import NotFound from "./pages/Notfound/Notfound";
import { useEffect } from "react";
import socketService, { SocketMessage } from "./services/socketService";
import { RootState } from "./redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { MessageTypeFunctions } from "./utils/const";
import MaintenancePlanRepair from "./pages/Maintenance/MaintenancePlanRepair";
import PlanType from "./pages/PlanType/PlanType";
import HuongDanSuDung from "./pages/HuongDanSuDung/HuongDanSuDung";
import RepairLevel from "./pages/RepairLevel/RepairLevel";

import RepairNorm from "./pages/RepairNorm/RepairNorm";
import MaintenanceManagerPage from "./pages/Maintenance/MaintenancePage";
import MaintenanceCyclePage from "./pages/Maintenance/MaintenanceCycle";
import MaintenanceApprovalPage from "./pages/Maintenance/MaintenanceApproval";
import MaintenanceRecordPage from "./pages/Maintenance/MaintenanceRecord";
import { CmmsProvider } from "./hooks/CmmsContext";
import HandoverApproval from "./pages/HandoverApproval/HandoverApproval";
import HandoverRecord from "./pages/HandoverRecord/HandoverRecord";
import TransferApproval from "./pages/TransferApproval/TransferApproval";
import TransferRecord from "./pages/TransferRecord/TransferRecord";
import { MenuDataProvider } from "./context/MenuDataContext";
import AssetProfile from "./pages/AssetProfile/AssetProfile";
import RepairReport from "./pages/RepairReport/RepairReport";

const ProtectedRoute = ({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: any;
}) => {
  const { user } = useSelector((state: RootState) => state.user);

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} />;
  }
  const listRole = user?.role?.map((item: any) => item.permissionCode) || [];
  if (!allowedRoles.some((r: any) => listRole.includes(r))) {
    return <Navigate to={ROUTES.NOT_FOUND} />;
  }

  return typeof children === "function" ? children(user.role) : children;
};
function App() {
  const { user } = useSelector((state: RootState) => state.user);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  useEffect(() => {
    if (user?.token && !isTokenValid(user.token)) {
      dispatch(logout());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (user?.taiKhoan?.tenDangNhap) {
      socketService.connect(user.taiKhoan.tenDangNhap);
    }
    // Lắng nghe notification từ socket
    socketService.onNotification((data: SocketMessage) => {
      if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.ASSET_TRANSFER
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({ queryKey: ["assetTranferPage"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      } else if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.TOOL_TRANSFER
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({ queryKey: ["toolTransferPage"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      } else if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.ASSET_HANDOVER
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({ queryKey: ["assetHandoverPage"] });
        queryClient.invalidateQueries({
          queryKey: ["assetTranferPage"],
        });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      } else if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.TOOL_HANDOVER
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({ queryKey: ["toolHandoverPage"] });
        queryClient.invalidateQueries({ queryKey: ["toolTransferPage"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      } else if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.REPAIR
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({ queryKey: ["repairPage"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      } else if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.PLAN
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({
          queryKey: ["maintenancePlanningPage"],
        });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      } else if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.MATERIAL
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({
          queryKey: ["materialAssessmentPage"],
        });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      } else if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.INCIDENT
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({
          queryKey: ["incidentPage"],
        });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      } else if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.INCIDENT_INSPECTION
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({
          queryKey: ["incidentInspectionPage"],
        });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      } else if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.ACCEPTANCE_TEST
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({
          queryKey: ["nghiemThuMayMocPage"],
        });
        queryClient.invalidateQueries({
          queryKey: ["nghiemThuPhuongTienPage"],
        });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      } else if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.INSPECTION
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({
          queryKey: ["inspectionPage"],
        });
        queryClient.invalidateQueries({
          queryKey: ["inspectionByBienBan"],
        });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      } else if (
        (data.recieve.includes(user?.taiKhoan?.tenDangNhap || "") ||
          user?.taiKhoan?.tenDangNhap === "admin") &&
        data.type === MessageTypeFunctions.MEASURE
      ) {
        console.log("Handling socket message in App.tsx:", data);
        queryClient.invalidateQueries({
          queryKey: ["bienPhapMayMocPage"],
        });
        queryClient.invalidateQueries({
          queryKey: ["bienPhapPhuongTienPage"],
        });
        queryClient.invalidateQueries({ queryKey: ["maintenanceShareCounts"] });
        queryClient.invalidateQueries({ queryKey: ["maintenanceSignCounts"] });
      }
    });

    // Cleanup khi component unmount
    return () => {
      socketService.disconnect();
    };
  }, [user]);
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={ROUTES.LOGIN}
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        <Route
          path={ROUTES.MAIN}
          element={
            user ? (
              <MenuDataProvider>
                <Main />
              </MenuDataProvider>
            ) : (
              <Navigate to={ROUTES.LOGIN} />
            )
          }
        >
          <Route index element={<DashBoard />} />
          <Route
            path={ROUTES.STAFF}
            element={
              <ProtectedRoute allowedRoles={["NHANVIEN"]}>
                <Staff />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DEPARTMENT}
            element={
              <ProtectedRoute allowedRoles={["PHONGBAN"]}>
                <Department />
              </ProtectedRoute>
            }
          />
          <Route path={ROUTES.POSITION} element={<Position />} />
          <Route
            path={ROUTES.PROJECT}
            element={
              <ProtectedRoute allowedRoles={["DUAN"]}>
                <Project />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.CAPITALSOURCE}
            element={
              <ProtectedRoute allowedRoles={["NGUONVON"]}>
                <CapitalSource />
              </ProtectedRoute>
            }
          />
          <Route path={ROUTES.ASSETGROUP} element={<AssetGroup />} />
          <Route path={ROUTES.MODELASSET} element={<ModelAsset />} />
          <Route path={ROUTES.TYPEASSET} element={<TypeAsset />} />
          <Route path={ROUTES.TOOLGROUP} element={<ToolGroup />} />
          <Route path={ROUTES.TOOLTYPE} element={<ToolType />} />
          <Route path={ROUTES.PlanType} element={<PlanType />} />
          <Route
            path={ROUTES.MAINTENANCEREPAIRTYPE}
            element={<MaintenanceRepairType />}
          />
          <Route path={ROUTES.UNIT} element={<Unit />} />
          <Route path={ROUTES.REASONINCREASE} element={<ReasonIncrease />} />
          <Route path={ROUTES.CURRENTSTATUS} element={<CurrentStatus />} />
          <Route
            path={ROUTES.REPAIRREPORTTEMPLATE}
            element={<RepairReport />}
          />
          <Route path={ROUTES.ASSETPROFILE} element={<AssetProfile />} />
          <Route
            path={ROUTES.ASSETMANAGER}
            element={
              <ProtectedRoute allowedRoles={["TAISAN"]}>
                <AssetManager />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ASSETHANDOVER}
            element={
              <ProtectedRoute allowedRoles={["BANGIAO_TAISAN"]}>
                <AssetHandover />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ASSETTRANSFER}
            element={
              <ProtectedRoute allowedRoles={["DIEUDONG_TAISAN"]}>
                <AssetTransfer />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ASSETDEPRECIATION}
            element={<AssetDepreciation />}
          />
          <Route
            path={ROUTES.TOOLMANAGER}
            element={
              <ProtectedRoute allowedRoles={["CCDCVT"]}>
                <ToolManager />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.TOOLCATEGORY}
            element={
              <ProtectedRoute allowedRoles={["CCDCVT"]}>
                <ToolCategory />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.TOOLTRANSFER}
            element={
              <ProtectedRoute allowedRoles={["DIEUDONG_CCDC"]}>
                <ToolTransfer />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.TOOLHANDOVER}
            element={
              <ProtectedRoute allowedRoles={["BANGIAO_CCDC"]}>
                <ToolHandover />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.HANDOVER_APPROVAL}
            element={<HandoverApproval />}
          />
          <Route path={ROUTES.HANDOVER_RECORD} element={<HandoverRecord />} />
          <Route
            path={ROUTES.TRANSFER_APPROVAL}
            element={<TransferApproval />}
          />
          <Route path={ROUTES.TRANSFER_RECORD} element={<TransferRecord />} />
          <Route
            path={ROUTES.MAINTENANCEPLANREPAIR}
            element={
              <CmmsProvider>
                <MaintenancePlanRepair />
              </CmmsProvider>
            }
          />
          <Route path={ROUTES.REPAIRLEVEL} element={<RepairLevel />} />
          <Route path={ROUTES.REPAIRNORM} element={<RepairNorm />} />
          <Route
            path={ROUTES.REPORT}
            element={
              <ProtectedRoute allowedRoles={["BAOCAO"]}>
                <Report />
              </ProtectedRoute>
            }
          />
          <Route path={ROUTES.HUONGDAN} element={<HuongDanSuDung />} />
          <Route path={ROUTES.ACCOUNT} element={<Account />} />

          <Route
            path={ROUTES.MAINTENANCE_MANAGER}
            element={<MaintenanceManagerPage />}
          />
          <Route
            path={ROUTES.MAINTENANCE_CYCLE}
            element={<MaintenanceCyclePage />}
          />
          <Route
            path={ROUTES.MAINTENANCE_APPROVAL}
            element={
              <CmmsProvider>
                <MaintenanceApprovalPage />
              </CmmsProvider>
            }
          />
          <Route
            path={ROUTES.MAINTENANCE_RECORD}
            element={
              <CmmsProvider>
                <MaintenanceRecordPage />
              </CmmsProvider>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
