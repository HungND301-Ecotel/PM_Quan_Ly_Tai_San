import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Tabs,
  Tab,
  Dialog,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { currentBrandConfig } from "../../../../config/brandConfig";

import {
  MaintenancePlanData,
  TechnicalReportData,
  InspectionRecordData,
  MaintenanceRepairData,
  JobAssignmentData,
  AcceptanceTestRecordData,
  DanhGiaVatTuData,
  QuyetToanData,
} from "../../types";

import { useTechnicalReportByPlanQuery } from "../../mutation/TechnicalReport";
import { useMaintenanceInspectionByBaoCaoQuery } from "../../mutation/Inspection";
import { useMaintenanceRepairByInspectionQuery } from "../../mutation/Repair";
import { useJobAssignmentByRepairQuery } from "../../mutation/JobAssignment";
import { useMaterialRequisitionByJobAssignmentQuery } from "../../mutation/MaterialRequisition";
import { useAcceptanceByBienBanQuery } from "../../mutation/Acceptance";
import { useMaintenanceMaterialAssessmentByAcceptanceQuery } from "../../mutation/MaterialAssessment";
import { useQuyetToanByDanhGiaQuery } from "../../mutation/QuyetToan";

import { useAllStaffsQuery } from "../../../Staff/Mutation";
import { useAllDepartmentsQuery } from "../../../Department/Mutation";
import { useAllPositionsQuery } from "../../../Position/Mutation";

import {
  generateTechnicalReportPdf,
  generateGiamDinhPdf,
  generateSuaChuaPdf,
  generatePhieuGiaoViecPdf,
  generatePhieuLinhVatTuPdf,
  generateNghiemThuPdf,
  generateDanhGiaVatTuPdf,
  generateQuyetToanPdf,
} from "../../config";

import SignDocumentForm from "../signdocument/SignDocumentForm";
import S3Service from "../../../../services/S3Service";
import { showSuccessAlert, showErrorAlert } from "../../../../components/Alert";

import TechnicalReportDialog from "../dialog/TechnicalReportDialog";
import InspectionRecordDialog from "../dialog/InspectionRecordDialog";
import RepairRequestDialog from "../dialog/RepairRequestDialog";
import JobAssignmentDialog from "../dialog/JobAssignmentDialog";
import MaterialRequisitionDialog from "../dialog/MaterialRequisitionDialog";
import AcceptanceTestDialog from "../dialog/AcceptanceTestDialog";
import MaterialDialog from "../dialog/MaterialDialog";
import QuyetToanDialog from "../dialog/QuyetToanDialog";

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
  const [selectedReportIndex, setSelectedReportIndex] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(1);

  // Mặc định chọn tháng hiện tại khi mở kế hoạch
  useEffect(() => {
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedReportIndex(0);
    setActiveStep(1);
  }, [plan?.id]);

  // PDF Preview Dialog State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStepData, setPreviewStepData] =
    useState<WorkflowStepData | null>(null);

  // Dialog States
  const [isEditMode, setIsEditMode] = useState(false);
  const [openTechnicalReportDialog, setOpenTechnicalReportDialog] =
    useState(false);
  const [openInspectionDialog, setOpenInspectionDialog] = useState(false);
  const [openRepairDialog, setOpenRepairDialog] = useState(false);
  const [openJobAssignmentDialog, setOpenJobAssignmentDialog] = useState(false);
  const [openMaterialRequisitionDialog, setOpenMaterialRequisitionDialog] =
    useState(false);
  const [openAcceptanceDialog, setOpenAcceptanceDialog] = useState(false);
  const [openMaterialDialog, setOpenMaterialDialog] = useState(false);
  const [openQuyetToanDialog, setOpenQuyetToanDialog] = useState(false);

  // Data for PDF Generators
  const { data: staffs = [] } = useAllStaffsQuery();
  const { data: departments = [] } = useAllDepartmentsQuery();
  const { data: positions = [] } = useAllPositionsQuery();

  // 1. Level 1: Báo cáo kỹ thuật (TechnicalReportData)
  const { data: technicalReports = [] } = useTechnicalReportByPlanQuery(
    plan?.id || "",
  );

  // Thống kê số lượng báo cáo kỹ thuật theo từng tháng
  const monthsWithReports = useMemo(() => {
    const map = new Map<number, number>();
    technicalReports.forEach((r: any) => {
      const m = Number(r.thang);
      if (m >= 1 && m <= 12) {
        map.set(m, (map.get(m) || 0) + 1);
      }
    });
    return map;
  }, [technicalReports]);

  // Lọc danh sách Báo cáo kỹ thuật theo tháng đang chọn
  const reportsInMonth = useMemo(() => {
    return technicalReports.filter(
      (r: any) => Number(r.thang) === selectedMonth,
    );
  }, [technicalReports, selectedMonth]);

  // Reset index khi đổi tháng
  useEffect(() => {
    setSelectedReportIndex(0);
    setActiveStep(1);
  }, [selectedMonth]);

  const currentReport: TechnicalReportData | undefined =
    reportsInMonth[selectedReportIndex] || reportsInMonth[0];

  // 2. Level 2: BB Giám định (InspectionRecordData)
  const { data: inspections = [] } = useMaintenanceInspectionByBaoCaoQuery(
    currentReport?.id ? currentReport.id : "",
  );
  const currentInspection: InspectionRecordData | undefined = inspections[0];

  // 3. Level 3: Lệnh sửa chữa (MaintenanceRepairData)
  const { data: repairs = [] } = useMaintenanceRepairByInspectionQuery(
    currentInspection?.id ? currentInspection.id : "",
  );
  const currentRepair: MaintenanceRepairData | undefined = repairs[0];

  // 4. Level 4: Phiếu giao việc (JobAssignmentData)
  const { data: jobAssignments = [] } = useJobAssignmentByRepairQuery(
    currentRepair?.id ? currentRepair.id : "",
  );
  const currentJobAssignment: JobAssignmentData | undefined = jobAssignments[0];

  // 5. Level 5: Phiếu lĩnh vật tư
  const { data: materialRequisitions = [] } =
    useMaterialRequisitionByJobAssignmentQuery(
      currentJobAssignment?.id ? currentJobAssignment.id : undefined,
    );
  const currentMaterialRequisition: any = materialRequisitions[0];

  // 6. Level 6: Biên bản nghiệm thu (AcceptanceTestRecordData)
  const { data: acceptances = [] } = useAcceptanceByBienBanQuery(
    currentMaterialRequisition?.id ? currentMaterialRequisition.id : undefined,
  );
  const currentAcceptance: AcceptanceTestRecordData | undefined =
    acceptances[0];

  // 7. Level 7: Biên bản đánh giá vật tư (DanhGiaVatTuData)
  const { data: materials = [] } =
    useMaintenanceMaterialAssessmentByAcceptanceQuery(
      currentAcceptance?.id ? currentAcceptance.id : "",
    );
  const currentMaterial: DanhGiaVatTuData | undefined = materials[0];

  // 8. Level 8: Quyết toán (QuyetToanData)
  const { data: quyetToanList = [] } = useQuyetToanByDanhGiaQuery(
    currentMaterial?.id ? currentMaterial.id : undefined,
  );
  const currentQuyetToan: QuyetToanData | undefined = quyetToanList[0];

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
          st.taiKhoan?.tenDangNhap === item.idNguoiLap,
      );
      if (found?.hoVaTen) return found.hoVaTen;
    }
    if (item.nguoiTao && staffs?.length) {
      const found = staffs.find(
        (st: any) =>
          st.id === item.nguoiTao || st.taiKhoan?.tenDangNhap === item.nguoiTao,
      );
      if (found?.hoVaTen) return found.hoVaTen;
    }
    return item.tenNguoiTao || item.nguoiTao || "";
  };

  // Helper: Extract real attachments
  const extractAttachments = (item: any): AttachmentItem[] => {
    if (!item) return [];
    const atts: AttachmentItem[] = [];

    if (item.duongDanFile) {
      const fileName =
        item.tenFile ||
        item.duongDanFile.split("/").pop() ||
        `${item.soPhieu || item.id || "Tai_lieu"}.pdf`;
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

  // Build the 8 workflow steps dynamically from the real tree queries
  const steps: WorkflowStepData[] = useMemo(() => {
    // Step 1: Báo cáo kỹ thuật
    const step1Info = getStatusInfo(currentReport, true);
    const step1Approved = isStepApproved(step1Info);

    // Step 2: Biên bản giám định
    const step2Info = getStatusInfo(currentInspection, step1Approved);
    const step2Approved = isStepApproved(step2Info);

    // Step 3: Lệnh sửa chữa
    const step3Info = getStatusInfo(currentRepair, step2Approved);
    const step3Approved = isStepApproved(step3Info);

    // Step 4: Phiếu giao việc
    const step4Info = getStatusInfo(currentJobAssignment, step3Approved);
    const step4Approved = isStepApproved(step4Info);

    // Step 5: Phiếu lĩnh vật tư
    const step5Info = getStatusInfo(currentMaterialRequisition, step4Approved);
    const step5Approved = isStepApproved(step5Info);

    // Step 6: Biên bản nghiệm thu
    const step6Info = getStatusInfo(currentAcceptance, step5Approved);
    const step6Approved = isStepApproved(step6Info);

    // Step 7: Biên bản đánh giá vật tư
    const step7Info = getStatusInfo(currentMaterial, step6Approved);
    const step7Approved = isStepApproved(step7Info);

    // Step 8: Quyết toán
    const step8Info = getStatusInfo(currentQuyetToan, step7Approved);

    return [
      {
        id: 1,
        stepNumber: 1,
        title: "Bước 1",
        name: "Báo cáo kỹ thuật",
        subTitle: "Báo cáo kỹ thuật",
        code: currentReport?.id || currentReport?.soPhieu || "",
        status: step1Info.status,
        statusText: step1Info.statusText,
        date: currentReport?.ngayTao || "",
        creator: getCreatorName(currentReport),
        content:
          currentReport?.noiDungSuaChua ||
          currentReport?.tinhTrang ||
          currentReport?.ghiChu ||
          currentReport?.ghiChuBienBan ||
          (currentReport
            ? "Báo cáo kỹ thuật tình trạng thiết bị theo kế hoạch."
            : "Chưa tạo báo cáo kỹ thuật. Vui lòng chọn thiết bị ở Tab 'Xem theo thiết bị' để lập báo cáo."),
        isLocked: false,
        canCreateNext: step1Approved && !currentInspection,
        nextStepName: "BB Giám định",
        description:
          "Báo cáo kỹ thuật xác định tình trạng thiết bị. Sau khi duyệt, hệ thống cho phép tạo Biên bản giám định.",
        nextStepInfo:
          "Sau khi Báo cáo kỹ thuật được phê duyệt, tiến hành tạo Biên bản giám định kỹ thuật.",
        attachments: extractAttachments(currentReport),
        rawData: currentReport,
      },
      {
        id: 2,
        stepNumber: 2,
        title: "Bước 2",
        name: "BB Giám định",
        subTitle: "Giám định kỹ thuật",
        code: currentInspection?.id || currentInspection?.soPhieuBienBan || "",
        status: step2Info.status,
        statusText: step2Info.statusText,
        date:
          currentInspection?.ngayGiamDinh || currentInspection?.ngayTao || "",
        creator: getCreatorName(currentInspection),
        content:
          currentInspection?.noiDung ||
          currentInspection?.ghiChuBienBan ||
          (currentInspection
            ? "Giám định kỹ thuật, phân tích nguyên nhân và giải pháp sửa chữa."
            : "Chưa tạo biên bản giám định."),
        isLocked: step2Info.isLocked,
        canCreateNext: step2Approved && !currentRepair,
        nextStepName: "Lệnh sửa chữa",
        description:
          "Biên bản giám định tình trạng kỹ thuật và mức độ hao mòn thiết bị.",
        nextStepInfo:
          "Sau khi Biên bản giám định được duyệt, tiến hành lập Lệnh sửa chữa.",
        attachments: extractAttachments(currentInspection),
        rawData: currentInspection,
      },
      {
        id: 3,
        stepNumber: 3,
        title: "Bước 3",
        name: "Lệnh sửa chữa",
        subTitle: "Lệnh sửa chữa",
        code: currentRepair?.id || "",
        status: step3Info.status,
        statusText: step3Info.statusText,
        date: currentRepair?.ngayTao || "",
        creator: getCreatorName(currentRepair),
        content:
          currentRepair?.tinhTrang ||
          currentRepair?.ghiChuBienBan ||
          (currentRepair
            ? "Lệnh sửa chữa phân công đơn vị và yêu cầu kỹ thuật bảo dưỡng."
            : "Chưa tạo lệnh sửa chữa."),
        isLocked: step3Info.isLocked,
        canCreateNext: step3Approved && !currentJobAssignment,
        nextStepName: "Phiếu giao việc",
        description:
          "Lệnh sửa chữa phê duyệt nội dung công việc và thời gian thực hiện.",
        nextStepInfo:
          "Sau khi Lệnh sửa chữa được duyệt, tiến hành lập Phiếu giao việc cho nhân sự/tổ bảo dưỡng.",
        attachments: extractAttachments(currentRepair),
        rawData: currentRepair,
      },
      {
        id: 4,
        stepNumber: 4,
        title: "Bước 4",
        name: "Phiếu giao việc",
        subTitle: "Giao việc sửa chữa",
        code: currentJobAssignment?.id || currentJobAssignment?.soPhieu || "",
        status: step4Info.status,
        statusText: step4Info.statusText,
        date: currentJobAssignment?.ngayTao || "",
        creator: getCreatorName(currentJobAssignment),
        content:
          currentJobAssignment?.ghiChuBienBan ||
          currentJobAssignment?.danhSachTaiSan?.[0]?.noiDung ||
          (currentJobAssignment
            ? "Phân công chi tiết người thực hiện và nội dung công việc cụ thể."
            : "Chưa tạo phiếu giao việc."),
        isLocked: step4Info.isLocked,
        canCreateNext: step4Approved && !currentMaterialRequisition,
        nextStepName: "Phiếu lĩnh vật tư",
        description:
          "Phiếu phân công nhân sự và thời hạn hoàn thành các hạng mục sửa chữa.",
        nextStepInfo:
          "Sau khi Phiếu giao việc được duyệt, nhân sự tiến hành tạo Phiếu lĩnh vật tư phục vụ thi công.",
        attachments: extractAttachments(currentJobAssignment),
        rawData: currentJobAssignment,
      },
      {
        id: 5,
        stepNumber: 5,
        title: "Bước 5",
        name: "Phiếu lĩnh vật tư",
        subTitle: "Lĩnh vật tư phụ tùng",
        code:
          (currentMaterialRequisition as any)?.id ||
          (currentMaterialRequisition as any)?.soPhieu ||
          "",
        status: step5Info.status,
        statusText: step5Info.statusText,
        date: (currentMaterialRequisition as any)?.ngayTao || "",
        creator: getCreatorName(currentMaterialRequisition),
        content:
          (currentMaterialRequisition as any)?.mucDichSuDung ||
          (currentMaterialRequisition as any)?.ghiChu ||
          (currentMaterialRequisition
            ? "Danh mục và số lượng vật tư phụ tùng xuất kho phục vụ bảo dưỡng."
            : "Chưa tạo phiếu lĩnh vật tư."),
        isLocked: step5Info.isLocked,
        canCreateNext: step5Approved && !currentAcceptance,
        nextStepName: "BB Nghiệm thu",
        description:
          "Phiếu xuất kho lĩnh vật tư, linh kiện phục vụ sửa chữa bảo dưỡng.",
        nextStepInfo:
          "Sau khi thi công xong với vật tư đã lĩnh, tiến hành lập Biên bản nghiệm thu kỹ thuật.",
        attachments: extractAttachments(currentMaterialRequisition),
        rawData: currentMaterialRequisition,
      },
      {
        id: 6,
        stepNumber: 6,
        title: "Bước 6",
        name: "BB Nghiệm thu",
        subTitle: "Nghiệm thu bảo dưỡng",
        code: currentAcceptance?.id || currentAcceptance?.soPhieu || "",
        status: step6Info.status,
        statusText: step6Info.statusText,
        date:
          currentAcceptance?.ngayNghiemThu || currentAcceptance?.ngayTao || "",
        creator: getCreatorName(currentAcceptance),
        content:
          currentAcceptance?.ketQua ||
          currentAcceptance?.noiDung ||
          (currentAcceptance
            ? "Nghiệm thu kỹ thuật và xác nhận thiết bị đủ điều kiện bàn giao vận hành."
            : "Chưa lập biên bản nghiệm thu."),
        isLocked: step6Info.isLocked,
        canCreateNext: step6Approved && !currentMaterial,
        nextStepName: "BB Đánh giá vật tư",
        description:
          "Đánh giá chất lượng vận hành sau sửa chữa và xác nhận bàn giao đưa thiết bị vào sản xuất.",
        nextStepInfo:
          "Sau khi Nghiệm thu hoàn tất, tiến hành lập Biên bản đánh giá và thu hồi vật tư cũ/hỏng.",
        attachments: extractAttachments(currentAcceptance),
        rawData: currentAcceptance,
      },
      {
        id: 7,
        stepNumber: 7,
        title: "Bước 7",
        name: "BB Đánh giá vật tư",
        subTitle: "Đánh giá thu hồi vật tư",
        code: currentMaterial?.id || currentMaterial?.quyetDinhSo || "",
        status: step7Info.status,
        statusText: step7Info.statusText,
        date: currentMaterial?.ngayDanhGia || currentMaterial?.ngayTao || "",
        creator: getCreatorName(currentMaterial),
        content:
          currentMaterial?.canCuHoSo ||
          currentMaterial?.diaDiem ||
          (currentMaterial
            ? "Tổng hợp danh mục phụ tùng thay thế và vật tư thu hồi sau bảo dưỡng."
            : "Chưa lập biên bản đánh giá vật tư."),
        isLocked: step7Info.isLocked,
        canCreateNext: step7Approved && !currentQuyetToan,
        nextStepName: "Quyết toán",
        description:
          "Biên bản tổng hợp số lượng, tình trạng phụ tùng và vật tư thu hồi sau sửa chữa.",
        nextStepInfo:
          "Sau khi Đánh giá vật tư hoàn tất, tiến hành lập hồ sơ Quyết toán chi phí bảo dưỡng.",
        attachments: extractAttachments(currentMaterial),
        rawData: currentMaterial,
      },
      {
        id: 8,
        stepNumber: 8,
        title: "Bước 8",
        name: "Quyết toán",
        subTitle: "Quyết toán chi phí",
        code: currentQuyetToan?.id || currentQuyetToan?.soPhieuGiaoViec || "",
        status: step8Info.status,
        statusText: step8Info.statusText,
        date: currentQuyetToan?.ngayTao || "",
        creator: getCreatorName(currentQuyetToan),
        content:
          currentQuyetToan?.ghiChuBienBan ||
          currentQuyetToan?.diaDiemSuaChua ||
          (currentQuyetToan
            ? "Tổng hợp chi phí thực tế và quyết toán kinh phí bảo dưỡng sửa chữa."
            : "Chưa lập hồ sơ quyết toán."),
        isLocked: step8Info.isLocked,
        canCreateNext: false,
        description:
          "Hồ sơ quyết toán toàn bộ chi phí vật tư, nhân công và nghiệm thu của kế hoạch bảo dưỡng.",
        nextStepInfo:
          "Hoàn tất toàn bộ quy trình 8 bước biên bản bảo dưỡng sửa chữa theo kế hoạch.",
        attachments: extractAttachments(currentQuyetToan),
        rawData: currentQuyetToan,
      },
    ];
  }, [
    currentReport,
    currentInspection,
    currentRepair,
    currentJobAssignment,
    currentMaterialRequisition,
    currentAcceptance,
    currentMaterial,
    currentQuyetToan,
    staffs,
  ]);

  const selectedStepData =
    steps.find((s) => s.stepNumber === activeStep) || steps[0];

  // Helper: Get PDF generator function for given step
  const getGeneratePdfFunc = (stepData: WorkflowStepData) => {
    const raw = stepData.rawData;
    if (!raw) return null;
    switch (stepData.stepNumber) {
      case 1:
        return generateTechnicalReportPdf(
          raw,
          staffs || [],
          departments || [],
          positions || [],
        );
      case 2:
        return generateGiamDinhPdf(
          raw,
          staffs || [],
          departments || [],
          positions || [],
        );
      case 3:
        return generateSuaChuaPdf(
          raw,
          staffs || [],
          departments || [],
          positions || [],
        );
      case 4:
        return generatePhieuGiaoViecPdf(
          raw,
          staffs || [],
          departments || [],
          positions || [],
        );
      case 5:
        return generatePhieuLinhVatTuPdf(
          raw,
          staffs || [],
          departments || [],
          positions || [],
        );
      case 6:
        return generateNghiemThuPdf(
          raw,
          staffs || [],
          departments || [],
          positions || [],
        );
      case 7:
        return generateDanhGiaVatTuPdf(
          raw,
          staffs || [],
          departments || [],
          positions || [],
        );
      case 8:
        return generateQuyetToanPdf(
          raw,
          staffs || [],
          departments || [],
          positions || [],
        );
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
      showErrorAlert(
        "Biên bản này chưa được tạo hoặc chưa có dữ liệu để tải về!",
      );
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
        setOpenTechnicalReportDialog(true);
        break;
      case 2:
        setOpenInspectionDialog(true);
        break;
      case 3:
        setOpenRepairDialog(true);
        break;
      case 4:
        setOpenJobAssignmentDialog(true);
        break;
      case 5:
        setOpenMaterialRequisitionDialog(true);
        break;
      case 6:
        setOpenAcceptanceDialog(true);
        break;
      case 7:
        setOpenMaterialDialog(true);
        break;
      case 8:
        setOpenQuyetToanDialog(true);
        break;
      default:
        break;
    }
  };

  const handleActionCreateNext = () => {
    setIsEditMode(false);
    switch (activeStep) {
      case 1:
        // Từ Báo cáo kỹ thuật -> Lập BB Giám định
        setOpenInspectionDialog(true);
        break;
      case 2:
        // Từ BB Giám định -> Lập Lệnh sửa chữa
        setOpenRepairDialog(true);
        break;
      case 3:
        // Từ Lệnh sửa chữa -> Lập Phiếu giao việc
        setOpenJobAssignmentDialog(true);
        break;
      case 4:
        // Từ Phiếu giao việc -> Lập Phiếu lĩnh vật tư
        setOpenMaterialRequisitionDialog(true);
        break;
      case 5:
        // Từ Phiếu lĩnh vật tư -> Lập BB Nghiệm thu
        setOpenAcceptanceDialog(true);
        break;
      case 6:
        // Từ BB Nghiệm thu -> Lập BB Đánh giá vật tư
        setOpenMaterialDialog(true);
        break;
      case 7:
        // Từ BB Đánh giá vật tư -> Lập Quyết toán
        setOpenQuyetToanDialog(true);
        break;
      default:
        break;
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

      {/* ── CARD: Bộ chọn 12 Tháng & Báo cáo kỹ thuật của tháng ── */}
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
        {/* Row 1: Chọn Tháng SCBD qua Select */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 800, color: "#0f172a" }}
            >
              Tháng SCBD:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                sx={{
                  borderRadius: 2,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  bgcolor: "#f8fafc",
                  "& .MuiSelect-select": {
                    py: 0.8,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  },
                }}
              >
                {months.map((m) => {
                  const count = monthsWithReports.get(m) || 0;
                  return (
                    <MenuItem key={m} value={m} sx={{ fontSize: "0.875rem" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          gap: 2,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            fontWeight: count > 0 ? 700 : 500,
                            color: count > 0 ? "#0f172a" : "#64748b",
                          }}
                        >
                          Tháng {m}
                        </Typography>
                        {count > 0 && (
                          <Chip
                            label={`${count} báo cáo`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              bgcolor: "#ecfdf5",
                              color: "#059669",
                              border: "1px solid #a7f3d0",
                            }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          {reportsInMonth.length > 0 && (
            <Chip
              label={`${reportsInMonth.length} báo cáo kỹ thuật trong Tháng ${selectedMonth}`}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: "#f1f5f9",
                color: "#334155",
                border: "1px solid #e2e8f0",
              }}
            />
          )}
        </Box>

        {/* Row 2: Danh sách Báo cáo kỹ thuật trong tháng đã chọn (nếu có nhiều báo cáo) */}
        {reportsInMonth.length > 1 && (
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
              Báo cáo (T{selectedMonth}):
            </Typography>
            <Tabs
              value={selectedReportIndex}
              onChange={(_, val) => {
                setSelectedReportIndex(val);
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
              {reportsInMonth.map((rep: TechnicalReportData, idx: number) => (
                <Tab
                  key={rep.id || idx}
                  label={rep.id || `Báo cáo #${idx + 1}`}
                />
              ))}
            </Tabs>
          </Box>
        )}
      </Box>

      {/* ── CARD 2: Workflow Stepper (8 Bước) ── */}
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
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
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

      {/* ── Dialog 1: Báo cáo kỹ thuật (Chỉnh sửa) ── */}
      {openTechnicalReportDialog && (
        <TechnicalReportDialog
          open={openTechnicalReportDialog}
          onClose={() => setOpenTechnicalReportDialog(false)}
          plan={plan}
          initialData={isEditMode ? currentReport || null : null}
          selectedDeviceIds={[]}
          selectedMonth={selectedMonth}
        />
      )}

      {/* ── Dialog 2: Biên bản giám định ── */}
      {openInspectionDialog && (
        <InspectionRecordDialog
          open={openInspectionDialog}
          onClose={() => setOpenInspectionDialog(false)}
          technicalReport={currentReport || null}
          initData={isEditMode ? currentInspection || null : null}
        />
      )}

      {/* ── Dialog 3: Lệnh sửa chữa ── */}
      {openRepairDialog && (
        <RepairRequestDialog
          open={openRepairDialog}
          onClose={() => setOpenRepairDialog(false)}
          inspection={currentInspection}
          initialData={
            isEditMode
              ? currentRepair || null
              : ({ idGiamDinh: currentInspection?.id } as any)
          }
        />
      )}

      {/* ── Dialog 4: Phiếu giao việc ── */}
      {openJobAssignmentDialog && (
        <JobAssignmentDialog
          open={openJobAssignmentDialog}
          onClose={() => setOpenJobAssignmentDialog(false)}
          repairRequest={currentRepair}
          inspection={currentInspection}
          initialData={isEditMode ? currentJobAssignment || null : null}
        />
      )}

      {/* ── Dialog 5: Phiếu lĩnh vật tư ── */}
      {openMaterialRequisitionDialog && (
        <MaterialRequisitionDialog
          open={openMaterialRequisitionDialog}
          onClose={() => setOpenMaterialRequisitionDialog(false)}
          jobAssignment={currentJobAssignment}
          inspection={currentInspection}
          initialData={isEditMode ? currentMaterialRequisition || null : null}
        />
      )}

      {/* ── Dialog 6: Biên bản nghiệm thu ── */}
      {openAcceptanceDialog && (
        <AcceptanceTestDialog
          open={openAcceptanceDialog}
          onClose={() => setOpenAcceptanceDialog(false)}
          jobAssignment={currentJobAssignment}
          materialRequisition={currentMaterialRequisition}
          inspection={currentInspection}
          initialData={isEditMode ? currentAcceptance || null : null}
        />
      )}

      {/* ── Dialog 7: Biên bản đánh giá vật tư ── */}
      {openMaterialDialog && (
        <MaterialDialog
          open={openMaterialDialog}
          onClose={() => setOpenMaterialDialog(false)}
          plan={plan}
          repairRequest={currentRepair as any}
          acceptanceRecord={currentAcceptance}
          initData={isEditMode ? currentMaterial || null : null}
        />
      )}

      {/* ── Dialog 8: Quyết toán ── */}
      {openQuyetToanDialog && currentMaterial && (
        <QuyetToanDialog
          open={openQuyetToanDialog}
          onClose={() => setOpenQuyetToanDialog(false)}
          materialAssessment={currentMaterial}
          acceptanceRecord={currentAcceptance}
          jobAssignment={currentJobAssignment}
          materialRequisition={currentMaterialRequisition}
          repairRequest={currentRepair}
          initData={isEditMode ? currentQuyetToan || null : null}
        />
      )}
    </Box>
  );
};

export default PlanDetailWorkflowPanel;
