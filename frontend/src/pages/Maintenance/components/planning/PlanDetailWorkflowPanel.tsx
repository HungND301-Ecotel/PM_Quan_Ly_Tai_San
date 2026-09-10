import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Tabs,
  Tab,
  Button,
  Dialog,
} from "@mui/material";
import PostAddIcon from "@mui/icons-material/PostAdd";
import { currentBrandConfig } from "../../../../config/brandConfig";

import {
  MaintenancePlanData,
  MaintenanceRepairData,
} from "../../types";
import {
  useMaintenanceRepairByPlanQuery,
  useMaintenanceRepairMutation,
  useMaintenanceInspectionByBienBanQuery,
  useMaintenanceVehicleInspectionByBienBanQuery,
  useMaintenanceAcceptanceByBienPhapQuery,
  useMaintenanceAcceptanceByGiamDinhQuery,
  useMaintenanceAcceptanceVehicleByBienPhapQuery,
  useMaintenanceAcceptanceVehicleByGiamDinhQuery,
  useMaintenanceMaterialAssessmentByInspectionQuery,
} from "../../mutation";
import {
  useBienPhapMayMocByGiamDinhQuery,
} from "../../mutation/MachineMeasure";
import {
  useBienPhapPhuongTienByGiamDinhQuery,
} from "../../mutation/VehicleMeasure";
import { AssetGroup } from "../../../../utils/const";

import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllPositionsQuery } from "../../../Position/Mutation";

import {
  generateSuaChuaPdf,
  generateGiamDinhPdf,
  generateGiamDinhPhuongTienPdf,
  generateBienPhapMayMocPdf,
  generateBienPhapPhuongTienPdf,
  generateNghiemThuPdf,
  generateNghiemThuPhuongTienPdf,
  generateDanhGiaVatTuPdf,
} from "../../config";

import SignDocumentForm from "../signdocument/SignDocumentForm";
import S3Service from "../../../../services/S3Service";
import { showSuccessAlert, showErrorAlert } from "../../../../components/Alert";

import RepairRequestDialog from "../dialog/RepairRequestDialog";
import InspectionRecordDialog from "../dialog/InspectionRecordDialog";
import InspectionRecordVehicleDialog from "../dialog/InspectionRecordVehicleDialog";
import BienPhapMayMocDialog from "../dialog/BienPhapMayMocDialog";
import BienPhapPhuongTienDialog from "../dialog/BienPhapPhuongTienDialog";
import AcceptanceTestDialog from "../dialog/AcceptanceTestDialog";
import NghiemThuPhuongTienDialog from "../dialog/NghiemThuPhuongTienDialog";
import MaterialDialog from "../dialog/MaterialDialog";

// Modular workflow components from workflowTree
import {
  WorkflowStepData,
  AttachmentItem,
  StepWorkflowHeader,
  WorkflowTreeStepper,
  StepDetailCard,
} from "./workflowTree";

const months = Array.from({ length: 12 }, (_, i) => i + 1);

interface Props {
  plan: MaintenancePlanData;
  onClose?: () => void;
  hideHeader?: boolean;
}

export const PlanDetailWorkflowPanel: React.FC<Props> = ({
  plan,
  onClose = () => {},
  hideHeader = false,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    return new Date().getMonth() + 1;
  });
  const [selectedRepairIndex, setSelectedRepairIndex] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(1);

  // Mặc định chọn tháng hiện tại khi mở kế hoạch
  useEffect(() => {
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedRepairIndex(0);
    setActiveStep(1);
  }, [plan?.id]);

  // PDF Preview Dialog State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStepData, setPreviewStepData] = useState<WorkflowStepData | null>(null);

  // Dialog States
  const [isEditMode, setIsEditMode] = useState(false);
  const [openRepairDialog, setOpenRepairDialog] = useState(false);
  const [openInspectionDialog, setOpenInspectionDialog] = useState(false);
  const [openBienPhapDialog, setOpenBienPhapDialog] = useState(false);
  const [openMaterialDialog, setOpenMaterialDialog] = useState(false);
  const [openAcceptanceDialog, setOpenAcceptanceDialog] = useState(false);

  // Data for PDF Generators
  const { data: staffs = [] } = useAllStaffsQuery();
  const { data: departments = [] } = useAllDepartmentsQuery();
  const { data: positions = [] } = useAllPositionsQuery();

  // Is this asset a machine or vehicle?
  const isMachine = plan?.nhomTaiSan !== AssetGroup.PHUONGTIEN;

  // Mutations
  const {
    createMutation: createRepairMutation,
    updateMutation: updateRepairMutation,
  } = useMaintenanceRepairMutation();

  // Lấy toàn bộ ID tài sản trong kế hoạch để tự động chọn tất cả khi tạo đề nghị
  const allPlanDeviceIds = useMemo(() => {
    if (!plan?.danhSachTaiSan || !Array.isArray(plan.danhSachTaiSan)) return [];
    return plan.danhSachTaiSan
      .map((item: any) => item.id || item.idTaiSan || "")
      .filter(Boolean);
  }, [plan?.danhSachTaiSan]);

  // 1. Level 1: Giấy đề nghị sửa chữa (MaintenanceRepairData)
  const { data: maintenanceRepairs = [] } = useMaintenanceRepairByPlanQuery(
    plan?.id || ""
  );

  // Thống kê số lượng đề nghị theo từng tháng
  const monthsWithRepairs = useMemo(() => {
    const map = new Map<number, number>();
    maintenanceRepairs.forEach((r: any) => {
      const m = Number(r.thang);
      if (m >= 1 && m <= 12) {
        map.set(m, (map.get(m) || 0) + 1);
      }
    });
    return map;
  }, [maintenanceRepairs]);

  // Lọc danh sách Giấy đề nghị SC theo tháng đang chọn
  const repairsInMonth = useMemo(() => {
    return maintenanceRepairs.filter((r: any) => Number(r.thang) === selectedMonth);
  }, [maintenanceRepairs, selectedMonth]);

  // Reset index khi đổi tháng
  useEffect(() => {
    setSelectedRepairIndex(0);
    setActiveStep(1);
  }, [selectedMonth]);

  const currentRepair: MaintenanceRepairData | undefined =
    repairsInMonth[selectedRepairIndex] || repairsInMonth[0];

  // 2. Level 2: Biên bản giám định (InspectionRecordData / VehicleInspectionData)
  const { data: inspectionMachine = [] } = useMaintenanceInspectionByBienBanQuery(
    isMachine && currentRepair?.id ? currentRepair.id : "",
    isMachine
  );
  const { data: inspectionVehicle = [] } =
    useMaintenanceVehicleInspectionByBienBanQuery(
      !isMachine && currentRepair?.id ? currentRepair.id : "",
      !isMachine
    );
  const currentInspection = isMachine ? inspectionMachine[0] : inspectionVehicle[0];

  // 3. Level 3: Biện pháp sửa chữa (BienPhapMayMocData / BienPhapPhuongTienData)
  const { data: bienPhapMachine = [] } = useBienPhapMayMocByGiamDinhQuery(
    isMachine && currentInspection?.id ? currentInspection.id : ""
  );
  const { data: bienPhapVehicle = [] } = useBienPhapPhuongTienByGiamDinhQuery(
    !isMachine && currentInspection?.id ? currentInspection.id : ""
  );
  const currentBienPhap = isMachine ? bienPhapMachine[0] : bienPhapVehicle[0];

  // 4. Level 4: Biên bản nghiệm thu (AcceptanceTestRecordData / NghiemThuPhuongTienData)
  const { data: acceptanceMachineBP = [] } =
    useMaintenanceAcceptanceByBienPhapQuery(
      isMachine && currentBienPhap?.id ? currentBienPhap.id : ""
    );
  const { data: acceptanceMachineGD = [] } =
    useMaintenanceAcceptanceByGiamDinhQuery(
      isMachine && !currentBienPhap?.id && currentInspection?.id
        ? currentInspection.id
        : ""
    );
  const { data: acceptanceVehicleBP = [] } =
    useMaintenanceAcceptanceVehicleByBienPhapQuery(
      !isMachine && currentBienPhap?.id ? currentBienPhap.id : ""
    );
  const { data: acceptanceVehicleGD = [] } =
    useMaintenanceAcceptanceVehicleByGiamDinhQuery(
      !isMachine && !currentBienPhap?.id && currentInspection?.id
        ? currentInspection.id
        : ""
    );

  const currentAcceptance = isMachine
    ? acceptanceMachineBP[0] || acceptanceMachineGD[0]
    : acceptanceVehicleBP[0] || acceptanceVehicleGD[0];

  // 5. Level 5: Biên bản đánh giá vật tư (DanhGiaVatTuData)
  const { data: materials = [] } =
    useMaintenanceMaterialAssessmentByInspectionQuery(
      currentAcceptance?.id ? currentAcceptance.id : ""
    );
  const currentMaterial = materials[0];

  // Helper: Format status string (0: Nháp, 1: Đã duyệt, 2: Đã hủy, 3: Hoàn thành)
  const getStatusInfo = (data: any, isPreviousApproved: boolean) => {
    if (!data) {
      return {
        status: "not_created" as const,
        statusText: "Chưa tạo",
        isLocked: !isPreviousApproved,
      };
    }
    const statusVal = Number(data.trangThai);
    if (statusVal === 0) {
      return {
        status: "draft" as const,
        statusText: "Bản nháp",
        isLocked: false,
      };
    }
    if (statusVal === 1) {
      return {
        status: "approved" as const,
        statusText: "Đã duyệt",
        isLocked: false,
      };
    }
    if (statusVal === 2) {
      return {
        status: "cancelled" as const,
        statusText: "Đã hủy",
        isLocked: false,
      };
    }
    if (statusVal === 3) {
      return {
        status: "completed" as const,
        statusText: "Hoàn thành",
        isLocked: false,
      };
    }
    return {
      status: "draft" as const,
      statusText: "Bản nháp",
      isLocked: false,
    };
  };

  // Helper: Check if step is approved or completed to unlock next step
  const isStepApproved = (info: { status: string }) =>
    info.status === "approved" || info.status === "completed";

  // Helper: Get Creator full name
  const getCreatorName = (item: any) => {
    if (!item) return "";
    if (item.tenNguoiLapBieu) return item.tenNguoiLapBieu;
    if (item.tenNguoiLap) return item.tenNguoiLap;
    if (item.idNguoiLap && staffs?.length) {
      const found = staffs.find(
        (st: any) =>
          st.id === item.idNguoiLap ||
          st.idNhanVien === item.idNguoiLap ||
          st.taiKhoan?.tenDangNhap === item.idNguoiLap
      );
      if (found?.hoVaTen) return found.hoVaTen;
    }
    if (item.nguoiTao && staffs?.length) {
      const found = staffs.find(
        (st: any) =>
          st.id === item.nguoiTao ||
          st.taiKhoan?.tenDangNhap === item.nguoiTao
      );
      if (found?.hoVaTen) return found.hoVaTen;
    }
    return item.tenNguoiTao || item.nguoiTao || "";
  };

  // Helper: Extract real attachments from item.duongDanFile / tenFile
  const extractAttachments = (item: any): AttachmentItem[] => {
    if (!item) return [];
    const atts: AttachmentItem[] = [];

    if (item.duongDanFile) {
      const fileName =
        item.tenFile ||
        item.duongDanFile.split("/").pop() ||
        `${item.soPhieu || "Tai_lieu"}.pdf`;
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      let fileType: AttachmentItem["type"] = "other";
      if (ext === "pdf") fileType = "pdf";
      else if (["xlsx", "xls", "csv"].includes(ext)) fileType = "xls";
      else if (["docx", "doc"].includes(ext)) fileType = "doc";
      else if (["jpg", "jpeg", "png", "webp"].includes(ext)) fileType = "img";

      atts.push({
        id: "main-file",
        name: fileName,
        size: item.dungLuongFile || "—",
        type: fileType,
        url: item.duongDanFile,
      });
    }

    if (item.fileDinhKem && Array.isArray(item.fileDinhKem)) {
      item.fileDinhKem.forEach((f: any, idx: number) => {
        const fPath = typeof f === "string" ? f : f.duongDan || f.url || "";
        const fName =
          (typeof f === "object" ? f.tenFile || f.name : "") ||
          fPath.split("/").pop() ||
          `Tep_${idx + 1}`;
        const ext = fName.split(".").pop()?.toLowerCase() || "";
        let fileType: AttachmentItem["type"] = "other";
        if (ext === "pdf") fileType = "pdf";
        else if (["xlsx", "xls", "csv"].includes(ext)) fileType = "xls";
        else if (["docx", "doc"].includes(ext)) fileType = "doc";
        else if (["jpg", "jpeg", "png", "webp"].includes(ext)) fileType = "img";

        atts.push({
          id: `attach-${idx}`,
          name: fName,
          size: (typeof f === "object" ? f.dungLuong : "") || "—",
          type: fileType,
          url: fPath,
        });
      });
    }

    return atts;
  };

  // Build the 5 workflow steps dynamically from the real tree queries
  const steps: WorkflowStepData[] = useMemo(() => {
    // Step 1: Giấy đề nghị sửa chữa
    const step1Info = getStatusInfo(currentRepair, true);
    const step1Approved = isStepApproved(step1Info);

    // Step 2: Biên bản giám định
    const step2Info = getStatusInfo(currentInspection, step1Approved);
    const step2Approved = isStepApproved(step2Info);

    // Step 3: Biện pháp sửa chữa
    const step3Info = getStatusInfo(currentBienPhap, step2Approved);
    const step3Approved = isStepApproved(step3Info);

    // Step 4: Biên bản nghiệm thu
    const prevForAcceptance = currentBienPhap ? step3Approved : step2Approved;
    const step4Info = getStatusInfo(currentAcceptance, prevForAcceptance);
    const step4Approved = isStepApproved(step4Info);

    // Step 5: Biên bản đánh giá vật tư
    const step5Info = getStatusInfo(currentMaterial, step4Approved);

    return [
      {
        id: 1,
        stepNumber: 1,
        title: "Biên bản 1",
        name: "Giấy đề nghị SC",
        subTitle: "Giấy đề nghị sửa chữa",
        code: currentRepair?.soPhieu || "",
        status: step1Info.status,
        statusText: step1Info.statusText,
        date: currentRepair?.ngayTao || "",
        creator: getCreatorName(currentRepair),
        content:
          currentRepair?.ghiChu ||
          (currentRepair?.danhSachTaiSan?.length
            ? `Bao gồm ${currentRepair.danhSachTaiSan.length} thiết bị cần sửa chữa/bảo dưỡng.`
            : "Chưa có nội dung mô tả"),
        isLocked: false,
        canCreateNext: step1Approved && !currentInspection,
        nextStepName: "BB Giám định",
        description:
          "Giấy đề nghị sửa chữa theo kế hoạch năm. Sau khi duyệt, hệ thống cho phép tạo Biên bản giám định.",
        nextStepInfo:
          "Hệ thống cho phép tạo Biên bản 2 (Biên bản giám định) sau khi Giấy đề nghị sửa chữa được phê duyệt.",
        attachments: extractAttachments(currentRepair),
        rawData: currentRepair,
      },
      {
        id: 2,
        stepNumber: 2,
        title: "Biên bản 2",
        name: "BB Giám định",
        subTitle: isMachine ? "Giám định máy móc" : "Giám định phương tiện",
        code: currentInspection?.soPhieu || "",
        status: step2Info.status,
        statusText: step2Info.statusText,
        date: currentInspection?.ngayGiamDinh || currentInspection?.ngayTao || "",
        creator: getCreatorName(currentInspection),
        content:
          currentInspection?.moTa ||
          currentInspection?.tinhTrangTruocSuaChua ||
          (currentInspection
            ? "Giám định kỹ thuật, phân tích nguyên nhân và giải pháp sửa chữa."
            : "Chưa tạo biên bản giám định."),
        isLocked: step2Info.isLocked,
        canCreateNext: step2Approved && !currentBienPhap && !currentAcceptance,
        nextStepName: "Biện pháp SC",
        canCreateAlternativeNext: step2Approved && !currentBienPhap && !currentAcceptance,
        alternativeNextStepName: "BB Nghiệm thu",
        description:
          "Biên bản giám định tình trạng kỹ thuật và mức độ hao mòn linh kiện của thiết bị.",
        nextStepInfo:
          "Sau khi Biên bản giám định được duyệt, có thể lập Biện pháp sửa chữa hoặc nghiệm thu trực tiếp.",
        attachments: extractAttachments(currentInspection),
        rawData: currentInspection,
      },
      {
        id: 3,
        stepNumber: 3,
        title: "Biên bản 3",
        name: "Biện pháp SC",
        subTitle: "Biện pháp sửa chữa",
        code: currentBienPhap?.soPhieu || "",
        status: step3Info.status,
        statusText: step3Info.statusText,
        date: currentBienPhap?.thoiGianBatDau || currentBienPhap?.ngayTao || "",
        creator: getCreatorName(currentBienPhap),
        content:
          currentBienPhap?.moTa ||
          currentBienPhap?.ghiChu ||
          (currentBienPhap
            ? `Đơn vị thực hiện: ${currentBienPhap.donViSuaChua || "Nội bộ"}`
            : "Chưa lập biện pháp thi công."),
        isLocked: step3Info.isLocked,
        canCreateNext: step3Approved && !currentAcceptance,
        nextStepName: "BB Nghiệm thu",
        description:
          "Phương án thi công, phân công nhiệm vụ và giải pháp kỹ thuật sửa chữa.",
        nextStepInfo:
          "Sau khi Biện pháp sửa chữa được duyệt, hoàn tất sửa chữa và tiến hành lập Biên bản nghiệm thu.",
        attachments: extractAttachments(currentBienPhap),
        rawData: currentBienPhap,
      },
      {
        id: 4,
        stepNumber: 4,
        title: "Biên bản 4",
        name: "BB Nghiệm thu",
        subTitle: "Biên bản nghiệm thu",
        code: currentAcceptance?.soPhieu || "",
        status: step4Info.status,
        statusText: step4Info.statusText,
        date: currentAcceptance?.ngayNghiemThu || currentAcceptance?.ngayTao || "",
        creator: getCreatorName(currentAcceptance),
        content:
          currentAcceptance?.ketLuan ||
          currentAcceptance?.ghiChu ||
          (currentAcceptance
            ? "Nghiệm thu kỹ thuật và xác nhận thiết bị đủ điều kiện bàn giao vận hành."
            : "Chưa lập biên bản nghiệm thu."),
        isLocked: step4Info.isLocked,
        canCreateNext: step4Approved && !currentMaterial,
        nextStepName: "BB Đánh giá Vật tư",
        description:
          "Đánh giá chất lượng vận hành sau sửa chữa và xác nhận bàn giao đưa thiết bị vào sản xuất.",
        nextStepInfo:
          "Sau khi Nghiệm thu hoàn tất, tiến hành lập Biên bản đánh giá và thu hồi vật tư (nếu có).",
        attachments: extractAttachments(currentAcceptance),
        rawData: currentAcceptance,
      },
      {
        id: 5,
        stepNumber: 5,
        title: "Biên bản 5",
        name: "BB Vật tư",
        subTitle: "Đánh giá vật tư",
        code: currentMaterial?.soPhieu || "",
        status: step5Info.status,
        statusText: step5Info.statusText,
        date: (currentMaterial as any)?.ngayDanhGia || currentMaterial?.ngayTao || "",
        creator: getCreatorName(currentMaterial),
        content:
          currentMaterial?.ghiChu ||
          (currentMaterial
            ? "Tổng hợp danh mục phụ tùng thay thế và vật tư thu hồi sau bảo dưỡng."
            : "Chưa lập biên bản đánh giá vật tư."),
        isLocked: step5Info.isLocked,
        canCreateNext: false,
        description:
          "Biên bản tổng hợp số lượng, tình trạng phụ tùng và vật tư thu hồi sau sửa chữa.",
        nextStepInfo:
          "Hoàn tất toàn bộ quy trình 5 bước biên bản bảo dưỡng sửa chữa cho kế hoạch.",
        attachments: extractAttachments(currentMaterial),
        rawData: currentMaterial,
      },
    ];
  }, [
    currentRepair,
    currentInspection,
    currentBienPhap,
    currentAcceptance,
    currentMaterial,
    staffs,
    isMachine,
  ]);

  const selectedStepData =
    steps.find((s) => s.stepNumber === activeStep) || steps[0];

  // Helper: Get PDF generator function for given step
  const getGeneratePdfFunc = (stepData: WorkflowStepData) => {
    const raw = stepData.rawData;
    if (!raw) return null;
    switch (stepData.stepNumber) {
      case 1:
        return generateSuaChuaPdf(raw, staffs || [], departments || [], positions || []);
      case 2:
        return isMachine
          ? generateGiamDinhPdf(raw, staffs || [], departments || [], positions || [])
          : generateGiamDinhPhuongTienPdf(raw, staffs || [], departments || [], positions || []);
      case 3:
        return isMachine
          ? generateBienPhapMayMocPdf(raw, staffs || [], departments || [], positions || [])
          : generateBienPhapPhuongTienPdf(raw, staffs || [], departments || [], positions || []);
      case 4:
        return isMachine
          ? generateNghiemThuPdf(raw, staffs || [], departments || [], positions || [])
          : generateNghiemThuPhuongTienPdf(raw, staffs || [], departments || [], positions || []);
      case 5:
        return generateDanhGiaVatTuPdf(raw, staffs || [], departments || [], positions || []);
      default:
        return null;
    }
  };

  // Action: Tải file đính kèm trực tiếp từ S3
  const handleDownloadAttachment = async (file: any) => {
    if (file?.url) {
      try {
        await S3Service.download(file.url);
        showSuccessAlert(`Đang tải file ${file.name || ""}...`);
      } catch (error: any) {
        console.error("Lỗi khi tải file từ S3:", error);
        showErrorAlert(error?.message || "Lỗi khi tải file");
      }
    } else {
      handleDownloadPdf(selectedStepData);
    }
  };

  // Action: Tải file PDF biên bản về máy
  const handleDownloadPdf = async (stepData: WorkflowStepData) => {
    if (!stepData?.rawData) {
      showErrorAlert("Biên bản này chưa được tạo hoặc chưa có dữ liệu để tải về!");
      return;
    }

    // Nếu có file S3 sẵn thì ưu tiên tải trực tiếp
    if (stepData.rawData?.duongDanFile) {
      try {
        await S3Service.download(stepData.rawData.duongDanFile);
        showSuccessAlert("Đang tải file biên bản...");
        return;
      } catch (error) {
        console.log("Thử sinh PDF theo mẫu...");
      }
    }

    // Fallback: sinh PDF động
    try {
      const pdfPromise = getGeneratePdfFunc(stepData);
      if (pdfPromise) {
        const res = await pdfPromise;
        if (res?.pdf) {
          const blob = new Blob([res.pdf.buffer as ArrayBuffer], {
            type: "application/pdf",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const fileName = `${stepData.code || stepData.subTitle || "Bien_ban"}_${Date.now()}.pdf`;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);
          showSuccessAlert("Tải biên bản PDF thành công!");
          return;
        }
      }

      showErrorAlert("Không thể tạo file PDF cho biên bản này");
    } catch (error: any) {
      console.error("Lỗi khi tải biên bản PDF:", error);
      showErrorAlert(error?.message || "Lỗi khi tải biên bản PDF");
    }
  };

  // Action: Xem chi tiết PDF biên bản
  const handleActionViewDetail = (stepData: WorkflowStepData) => {
    if (stepData.status === "not_created" || !stepData.rawData) {
      showErrorAlert("Biên bản này chưa được lập trong hệ thống!");
      return;
    }
    setPreviewStepData(stepData);
    setPreviewOpen(true);
  };

  // Action Triggers
  const handleActionEdit = () => {
    setIsEditMode(true);
    switch (activeStep) {
      case 1:
        setOpenRepairDialog(true);
        break;
      case 2:
        setOpenInspectionDialog(true);
        break;
      case 3:
        setOpenBienPhapDialog(true);
        break;
      case 4:
        setOpenAcceptanceDialog(true);
        break;
      case 5:
        setOpenMaterialDialog(true);
        break;
      default:
        break;
    }
  };

  const handleActionCreateNext = () => {
    setIsEditMode(false);
    switch (activeStep) {
      case 1:
        // Từ Đề nghị SC -> Lập BB Giám định
        setOpenInspectionDialog(true);
        break;
      case 2:
        // Từ Giám định -> Lập Biện pháp SC
        setOpenBienPhapDialog(true);
        break;
      case 3:
        // Từ Biện pháp -> Lập BB Nghiệm thu
        setOpenAcceptanceDialog(true);
        break;
      case 4:
        // Từ Nghiệm thu -> Lập BB Đánh giá vật tư
        setOpenMaterialDialog(true);
        break;
      default:
        break;
    }
  };

  const handleActionCreateAlternativeNext = () => {
    setIsEditMode(false);
    // Từ Giám định lập trực tiếp Nghiệm thu (không qua Biện pháp SC)
    if (activeStep === 2) {
      setOpenAcceptanceDialog(true);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: hideHeader ? "transparent" : "#f8fafc",
        p: hideHeader ? 0 : { xs: 1.5, md: 2.5 },
        gap: 2.5,
        fontFamily: "Inter, Roboto, sans-serif",
      }}
    >
      {/* ── CARD 1: Header & Thông tin chung kế hoạch ── */}
      {!hideHeader && <StepWorkflowHeader plan={plan} onClose={onClose} />}

      {/* ── CARD: Bộ chọn 12 Tháng & Giấy đề nghị SC của tháng ── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          bgcolor: "#ffffff",
          p: 2,
          borderRadius: 2.5,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Row 1: 12 Tháng */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 800, color: "#0f172a", minWidth: 90 }}
          >
            Tháng SCBD:
          </Typography>
          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", flex: 1 }}>
            {months.map((m) => {
              const isSelected = selectedMonth === m;
              const count = monthsWithRepairs.get(m) || 0;
              return (
                <Chip
                  key={m}
                  label={count > 0 ? `Tháng ${m} (${count})` : `Tháng ${m}`}
                  onClick={() => setSelectedMonth(m)}
                  color={isSelected ? "primary" : "default"}
                  variant={isSelected ? "filled" : "outlined"}
                  sx={{
                    fontWeight: isSelected ? 800 : 600,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    bgcolor: isSelected
                      ? currentBrandConfig.primaryColor
                      : count > 0
                      ? "#ecfdf5"
                      : "#ffffff",
                    color: isSelected
                      ? "#ffffff"
                      : count > 0
                      ? "#059669"
                      : "#64748b",
                    borderColor: isSelected
                      ? currentBrandConfig.primaryColor
                      : count > 0
                      ? "#a7f3d0"
                      : "#e2e8f0",
                    "&:hover": {
                      bgcolor: isSelected
                        ? currentBrandConfig.primaryColor
                        : "#f1f5f9",
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Row 2: Danh sách Giấy đề nghị SC trong tháng đã chọn (nếu có nhiều đề nghị) */}
        {repairsInMonth.length > 1 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              pt: 1.5,
              borderTop: "1px dashed #e2e8f0",
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: "#0f172a", minWidth: 90 }}
            >
              Đề nghị (T{selectedMonth}):
            </Typography>
            <Tabs
              value={selectedRepairIndex}
              onChange={(_, val) => {
                setSelectedRepairIndex(val);
                setActiveStep(1);
              }}
              sx={{
                minHeight: 32,
                "& .MuiTab-root": {
                  minHeight: 32,
                  py: 0.5,
                  px: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  borderRadius: 1.5,
                  mr: 1,
                  bgcolor: "#f8fafc",
                  "&.Mui-selected": {
                    bgcolor: "#e0f2fe",
                    color: "#0284c7",
                    fontWeight: 700,
                  },
                },
                "& .MuiTabs-indicator": {
                  display: "none",
                },
              }}
            >
              {repairsInMonth.map((rep: MaintenanceRepairData, idx: number) => (
                <Tab
                  key={rep.id || idx}
                  label={rep.soPhieu || `Phiếu #${idx + 1}`}
                />
              ))}
            </Tabs>
          </Box>
        )}
      </Box>

      {/* ── CARD 2: Workflow 5 Steps Stepper ── */}
      <WorkflowTreeStepper
        steps={steps}
        activeStep={activeStep}
        onSelectStep={(stepNum) => setActiveStep(stepNum)}
      />

      {/* ── CARD 3: Chi tiết Biên bản đang chọn ── */}
      <StepDetailCard
        step={selectedStepData}
        onViewDetail={() => handleActionViewDetail(selectedStepData)}
        onEdit={handleActionEdit}
        onCreateNext={handleActionCreateNext}
        onCreateAlternativeNext={handleActionCreateAlternativeNext}
        onDownload={() => handleDownloadPdf(selectedStepData)}
        onDownloadAttachment={handleDownloadAttachment}
      />

      {/* ── MODAL: Xem chi tiết PDF Biên bản chuẩn (giống bên Approval) ── */}
      {previewOpen && previewStepData?.rawData && (
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              height: "90vh",
              borderRadius: 3,
              overflow: "hidden",
            },
          }}
        >
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <SignDocumentForm
              selectedIds={[previewStepData.rawData?.id || ""]}
              onCancel={() => setPreviewOpen(false)}
              onSign={() => {}}
              data={previewStepData.rawData}
              staffs={staffs || []}
              departments={departments || []}
              positions={positions || []}
              fullscreen={false}
              showSignerSidebar={false}
              showHeader={true}
              title={`${previewStepData.title} - ${previewStepData.subTitle}`}
              generatePdf={() => {
                const p = getGeneratePdfFunc(previewStepData);
                if (!p) return Promise.reject("Không có mẫu pdf");
                return p;
              }}
            />
          </Box>
        </Dialog>
      )}

      {/* ── Dialog 1: Giấy đề nghị sửa chữa ── */}
      {openRepairDialog && (
        <RepairRequestDialog
          open={openRepairDialog}
          onClose={() => setOpenRepairDialog(false)}
          plan={plan}
          initialData={isEditMode ? currentRepair || null : null}
          selectedDeviceIds={allPlanDeviceIds}
          selectedMonth={currentRepair?.thang || new Date().getMonth() + 1}
          onSubmit={async (req) => {
            if (isEditMode && currentRepair?.id) {
              await updateRepairMutation.mutateAsync(req);
            } else {
              await createRepairMutation.mutateAsync(req);
            }
            setOpenRepairDialog(false);
          }}
        />
      )}

      {/* ── Dialog 2: Biên bản giám định (Máy móc hoặc Phương tiện) ── */}
      {openInspectionDialog &&
        (isMachine ? (
          <InspectionRecordDialog
            open={openInspectionDialog}
            onClose={() => setOpenInspectionDialog(false)}
            repairRequest={currentRepair || null}
            initData={isEditMode ? currentInspection || null : null}
            plan={plan}
          />
        ) : (
          <InspectionRecordVehicleDialog
            open={openInspectionDialog}
            onClose={() => setOpenInspectionDialog(false)}
            repairRequest={currentRepair || null}
            initData={isEditMode ? currentInspection || null : null}
            plan={plan}
          />
        ))}

      {/* ── Dialog 3: Biện pháp sửa chữa (Máy móc hoặc Phương tiện) ── */}
      {openBienPhapDialog &&
        (isMachine ? (
          <BienPhapMayMocDialog
            open={openBienPhapDialog}
            onClose={() => setOpenBienPhapDialog(false)}
            inspectionRecord={currentInspection || null}
            initData={isEditMode ? currentBienPhap || null : null}
          />
        ) : (
          <BienPhapPhuongTienDialog
            open={openBienPhapDialog}
            onClose={() => setOpenBienPhapDialog(false)}
            inspectionRecord={currentInspection || null}
            initData={isEditMode ? currentBienPhap || null : null}
          />
        ))}

      {/* ── Dialog 4: Biên bản nghiệm thu (Máy móc hoặc Phương tiện) ── */}
      {openAcceptanceDialog &&
        (isMachine ? (
          <AcceptanceTestDialog
            open={openAcceptanceDialog}
            onClose={() => setOpenAcceptanceDialog(false)}
            repairRequest={currentRepair}
            inspectionRecord={currentInspection || ({} as any)}
            bienPhap={currentBienPhap || null}
            initData={isEditMode ? currentAcceptance || null : null}
          />
        ) : (
          <NghiemThuPhuongTienDialog
            open={openAcceptanceDialog}
            onClose={() => setOpenAcceptanceDialog(false)}
            bienPhap={currentBienPhap}
            inspectionRecord={currentInspection}
            initData={isEditMode ? currentAcceptance || null : null}
          />
        ))}

      {/* ── Dialog 5: Biên bản đánh giá vật tư ── */}
      {openMaterialDialog && (
        <MaterialDialog
          open={openMaterialDialog}
          onClose={() => setOpenMaterialDialog(false)}
          repairRequest={currentRepair || ({} as any)}
          acceptanceRecord={currentAcceptance || null}
          initData={isEditMode ? currentMaterial || null : null}
          plan={plan}
        />
      )}
    </Box>
  );
};

export default PlanDetailWorkflowPanel;
