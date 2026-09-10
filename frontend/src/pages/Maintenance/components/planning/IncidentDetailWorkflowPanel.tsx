import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Tabs,
  Tab,
  Dialog,
} from "@mui/material";
import { currentBrandConfig } from "../../../../config/brandConfig";

import {
  MaintenancePlanData,
  IncidenData,
  IncidentInspectionData,
} from "../../types";
import {
  useMaintenanceIncidentInspectionBySuCoQuery,
  useMaintenanceIncidentInspectionMutation,
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
  generateKiemTraSuCoPdf,
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

import IncidentInspectionDialog from "../dialog/Incidentinspectiondialog";
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
  WorkflowTreeStepper,
  StepDetailCard,
} from "./workflowTree";

interface Props {
  incident: IncidenData;
  plan?: MaintenancePlanData | null;
  onClose?: () => void;
  hideHeader?: boolean;
}

export const IncidentDetailWorkflowPanel: React.FC<Props> = ({
  incident,
  plan,
  onClose = () => {},
  hideHeader = false,
}) => {
  const [selectedInspectionIndex, setSelectedInspectionIndex] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(1);

  // PDF Preview Dialog State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStepData, setPreviewStepData] = useState<WorkflowStepData | null>(null);

  // Dialog States
  const [isEditMode, setIsEditMode] = useState(false);
  const [openIncidentInspectionDialog, setOpenIncidentInspectionDialog] = useState(false);
  const [openInspectionDialog, setOpenInspectionDialog] = useState(false);
  const [openBienPhapDialog, setOpenBienPhapDialog] = useState(false);
  const [openMaterialDialog, setOpenMaterialDialog] = useState(false);
  const [openAcceptanceDialog, setOpenAcceptanceDialog] = useState(false);

  // Data for PDF Generators
  const { data: staffs = [] } = useAllStaffsQuery();
  const { data: departments = [] } = useAllDepartmentsQuery();
  const { data: positions = [] } = useAllPositionsQuery();

  // Is this asset a machine or vehicle?
  const isMachine = incident?.nhomTaiSan !== AssetGroup.PHUONGTIEN;

  // Reset index on incident change
  useEffect(() => {
    setSelectedInspectionIndex(0);
    setActiveStep(1);
  }, [incident?.id]);

  // 1. Level 1: Biên bản kiểm tra sự cố (IncidentInspectionData)
  const { data: incidentInspections = [] } =
    useMaintenanceIncidentInspectionBySuCoQuery(incident?.id || "");

  const currentIncidentInspection: IncidentInspectionData | undefined =
    incidentInspections[selectedInspectionIndex] || incidentInspections[0];

  // 2. Level 2: Biên bản giám định (InspectionRecordData / VehicleInspectionData)
  const { data: inspectionMachine = [] } = useMaintenanceInspectionByBienBanQuery(
    isMachine && currentIncidentInspection?.id ? currentIncidentInspection.id : "",
    isMachine
  );
  const { data: inspectionVehicle = [] } =
    useMaintenanceVehicleInspectionByBienBanQuery(
      !isMachine && currentIncidentInspection?.id ? currentIncidentInspection.id : "",
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

  // Helper: Extract real attachments
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
    // Step 1: Biên bản kiểm tra sự cố
    const step1Info = getStatusInfo(currentIncidentInspection, true);
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
        name: "BB Kiểm tra sự cố",
        subTitle: "Kiểm tra sự cố",
        code: currentIncidentInspection?.soPhieu || "",
        status: step1Info.status,
        statusText: step1Info.statusText,
        date: currentIncidentInspection?.ngayKiemTra || currentIncidentInspection?.ngayTao || "",
        creator: getCreatorName(currentIncidentInspection),
        content:
          currentIncidentInspection?.nhanXetKetLuan ||
          currentIncidentInspection?.bienPhapXuLy ||
          (currentIncidentInspection
            ? "Biên bản kiểm tra, xác định nguyên nhân và sơ bộ mức độ sự cố."
            : "Chưa tạo biên bản kiểm tra sự cố."),
        isLocked: false,
        canCreateNext: step1Approved && !currentInspection,
        nextStepName: "BB Giám định",
        description:
          "Biên bản kiểm tra hiện trường sự cố thiết bị, xác định nguyên nhân và phạm vi hỏng hóc.",
        nextStepInfo:
          "Sau khi Biên bản kiểm tra sự cố được duyệt, hệ thống cho phép tạo Biên bản giám định.",
        attachments: extractAttachments(currentIncidentInspection),
        rawData: currentIncidentInspection,
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
          "Biên bản giám định tình trạng kỹ thuật và mức độ hư hại linh kiện sau sự cố.",
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
            : "Chưa lập biện pháp khắc phục sự cố."),
        isLocked: step3Info.isLocked,
        canCreateNext: step3Approved && !currentAcceptance,
        nextStepName: "BB Nghiệm thu",
        description:
          "Phương án thi công, biện pháp kỹ thuật xử lý và khắc phục sự cố thiết bị.",
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
            ? "Nghiệm thu kỹ thuật và xác nhận thiết bị sau sự cố đã đủ điều kiện vận hành trở lại."
            : "Chưa lập biên bản nghiệm thu."),
        isLocked: step4Info.isLocked,
        canCreateNext: step4Approved && !currentMaterial,
        nextStepName: "BB Đánh giá Vật tư",
        description:
          "Đánh giá chất lượng sau khắc phục sự cố và xác nhận bàn giao đưa thiết bị vào hoạt động.",
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
            ? "Tổng hợp danh mục phụ tùng thay thế và vật tư thu hồi sau xử lý sự cố."
            : "Chưa lập biên bản đánh giá vật tư."),
        isLocked: step5Info.isLocked,
        canCreateNext: false,
        description:
          "Biên bản tổng hợp số lượng, tình trạng phụ tùng và vật tư thu hồi sau khắc phục sự cố.",
        nextStepInfo:
          "Hoàn tất toàn bộ quy trình 5 bước biên bản xử lý sự cố thiết bị.",
        attachments: extractAttachments(currentMaterial),
        rawData: currentMaterial,
      },
    ];
  }, [
    currentIncidentInspection,
    currentInspection,
    currentBienPhap,
    currentAcceptance,
    currentMaterial,
    staffs,
    isMachine,
  ]);

  // Selected Step Data
  const selectedStepData = useMemo(() => {
    return steps.find((s) => s.stepNumber === activeStep) || steps[0];
  }, [steps, activeStep]);

  // Function to determine which PDF generator to call
  const getGeneratePdfFunc = (stepData: WorkflowStepData) => {
    if (!stepData.rawData) return null;
    switch (stepData.stepNumber) {
      case 1:
        return generateKiemTraSuCoPdf(
          stepData.rawData,
          staffs || [],
          departments || [],
          positions || []
        );
      case 2:
        return isMachine
          ? generateGiamDinhPdf(
              stepData.rawData,
              staffs || [],
              departments || [],
              positions || []
            )
          : generateGiamDinhPhuongTienPdf(
              stepData.rawData,
              staffs || [],
              departments || [],
              positions || []
            );
      case 3:
        return isMachine
          ? generateBienPhapMayMocPdf(
              stepData.rawData,
              staffs || [],
              departments || [],
              positions || []
            )
          : generateBienPhapPhuongTienPdf(
              stepData.rawData,
              staffs || [],
              departments || [],
              positions || []
            );
      case 4:
        return isMachine
          ? generateNghiemThuPdf(
              stepData.rawData,
              staffs || [],
              departments || [],
              positions || []
            )
          : generateNghiemThuPhuongTienPdf(
              stepData.rawData,
              staffs || [],
              departments || [],
              positions || []
            );
      case 5:
        return generateDanhGiaVatTuPdf(
          stepData.rawData,
          staffs || [],
          departments || [],
          positions || []
        );
      default:
        return null;
    }
  };

  // Action: Tải file đính kèm trực tiếp từ S3
  const handleDownloadAttachment = async (file: AttachmentItem) => {
    if (!file.url) {
      showErrorAlert("Không tìm thấy đường dẫn file");
      return;
    }
    try {
      await S3Service.download(file.url);
      showSuccessAlert(`Đang tải xuống: ${file.name}`);
    } catch (error: any) {
      console.error("Lỗi khi tải file:", error);
      showErrorAlert(error?.message || "Lỗi khi tải file từ S3");
    }
  };

  // Action: Tải biên bản PDF
  const handleDownloadPdf = async (stepData: WorkflowStepData) => {
    if (stepData.status === "not_created" || !stepData.rawData) {
      showErrorAlert("Biên bản này chưa được lập!");
      return;
    }

    if (stepData.rawData?.duongDanFile) {
      try {
        await S3Service.download(stepData.rawData.duongDanFile);
        showSuccessAlert("Đang tải file biên bản...");
        return;
      } catch (error) {
        console.log("Thử sinh PDF theo mẫu...");
      }
    }

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
        setOpenIncidentInspectionDialog(true);
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
        // Từ Kiểm tra sự cố -> Lập BB Giám định
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
      {/* Selector nếu sự cố có nhiều Biên bản kiểm tra */}
      {incidentInspections.length > 1 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: "#ffffff",
            p: 1.5,
            borderRadius: 2,
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
            BB Kiểm tra sự cố:
          </Typography>
          <Tabs
            value={selectedInspectionIndex}
            onChange={(_, val) => {
              setSelectedInspectionIndex(val);
              setActiveStep(1);
            }}
            sx={{
              minHeight: 36,
              "& .MuiTab-root": {
                minHeight: 36,
                py: 0.5,
                px: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
              },
            }}
          >
            {incidentInspections.map((insp: any, idx: number) => (
              <Tab
                key={insp.id || idx}
                label={insp.soPhieu || `Phiếu #${idx + 1}`}
              />
            ))}
          </Tabs>
        </Box>
      )}

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

      {/* ── Dialog 1: Biên bản kiểm tra sự cố (khi chỉnh sửa) ── */}
      {openIncidentInspectionDialog && (
        <IncidentInspectionDialog
          open={openIncidentInspectionDialog}
          onClose={() => setOpenIncidentInspectionDialog(false)}
          incidentReport={incident}
          selectedDeviceIds={[]}
          initData={isEditMode ? currentIncidentInspection || null : null}
        />
      )}

      {/* ── Dialog 2: Biên bản giám định (Máy móc hoặc Phương tiện) ── */}
      {openInspectionDialog &&
        (isMachine ? (
          <InspectionRecordDialog
            open={openInspectionDialog}
            onClose={() => setOpenInspectionDialog(false)}
            repairRequest={null}
            incidentInspection={currentIncidentInspection}
            initData={isEditMode ? currentInspection || null : null}
            plan={plan}
          />
        ) : (
          <InspectionRecordVehicleDialog
            open={openInspectionDialog}
            onClose={() => setOpenInspectionDialog(false)}
            repairRequest={null}
            incidentInspection={currentIncidentInspection}
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
            repairRequest={undefined}
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
          repairRequest={({} as any)}
          acceptanceRecord={currentAcceptance || null}
          initData={isEditMode ? currentMaterial || null : null}
          plan={plan}
        />
      )}
    </Box>
  );
};

export default IncidentDetailWorkflowPanel;
