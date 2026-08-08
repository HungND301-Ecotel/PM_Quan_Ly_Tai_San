import { useState, useEffect } from "react";
import { SignaturesData } from "../types";
import {
  canUserSign,
  generateBangKePdf,
  mergeBangKeWithOriginalPdf,
} from "../config";
import { showErrorAlert } from "../../../components/Alert";
import S3Service from "../../../services/S3Service";
import SharedSignDocumentForm from "../../../components/SignDocument/SharedSignDocumentForm";
import { useAllCurrentStatusQuery } from "../../CurrentStatus/Mutation";
import { useAllUnitsQuery } from "../../Unit/Mutation";

interface SignDocumentFormProps {
  selectedIds: string[];
  document?: File | string | any;
  onCancel: () => void;
  onSign: (data: SignaturesData[]) => void;
  fullscreen?: boolean;
  showSignerSidebar?: boolean;
  assetTransferDetail?: any[];
  staffs?: any[];
  handleSignatureList?: (idTaiLieu: string) => Promise<any>;
  isEdit?: boolean;
  title?: string;
}

export default function SignDocumentForm({
  selectedIds,
  document: documentUrl,
  onCancel,
  onSign,
  fullscreen = true,
  showSignerSidebar = true,
  assetTransferDetail = [],
  staffs = [],
  isEdit = false,
  title,
}: SignDocumentFormProps) {
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [bangKeBytes, setBangKeBytes] = useState<Uint8Array | null>(null);

  const { data: allCurrentStatus = [] } = useAllCurrentStatusQuery();
  const { data: allUnits = [] } = useAllUnitsQuery();

  // 1. Rebuild Bảng kê khi dữ liệu thay đổi
  useEffect(() => {
    const rebuildBangKe = async () => {
      try {
        const bytes = await generateBangKePdf(
          assetTransferDetail,
          allUnits,
          allCurrentStatus,
        );
        setBangKeBytes(bytes);
      } catch (err) {
        console.error("Lỗi build lại Bảng kê:", err);
      }
    };
    rebuildBangKe();
  }, [assetTransferDetail, allUnits, allCurrentStatus]);

  // 2. Chuẩn bị PDF (fetch từ S3 hoặc build động)
  useEffect(() => {
    let activeUrl: string | null = null;

    const fetchOriginal = async () => {
      if (isEdit) return; // chỉ chạy khi KHÔNG edit
      try {
        setLoading(true);
        if (!documentUrl) return showErrorAlert("Không tìm thấy tài liệu");
        const blob = await S3Service.preview(documentUrl);
        activeUrl = URL.createObjectURL(blob);
        setPdfUrl(activeUrl);
      } catch (error) {
        console.error("Lỗi hiển thị tài liệu:", error);
        showErrorAlert("Không thể tải tài liệu, vui lòng kiểm tra lại!");
      } finally {
        setLoading(false);
      }
    };

    fetchOriginal();
    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [isEdit, documentUrl]); // ✅ bỏ bangKeBytes

  useEffect(() => {
    if (!isEdit) return; // chỉ chạy khi đang edit
    let activeUrl: string | null = null;

    const mergeAndPrepare = async () => {
      try {
        setLoading(true);
        const mergedFile = await mergeBangKeWithOriginalPdf(
          documentUrl,
          bangKeBytes,
        );
        if (mergedFile) {
          activeUrl = URL.createObjectURL(mergedFile);
          setPdfUrl(activeUrl);
        }
      } catch (error) {
        console.error("Lỗi hiển thị tài liệu:", error);
        showErrorAlert("Không thể tải tài liệu, vui lòng kiểm tra lại!");
      } finally {
        setLoading(false);
      }
    };

    mergeAndPrepare();
    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [isEdit, documentUrl, bangKeBytes]); // ✅ chỉ chạy khi edit

  const handleSignComplete = async (
    newSignatures: SignaturesData[],
    pdfBlob: Blob,
  ) => {
    try {
      // Step 2: Save signature metadata and update file on S3
      await onSign(newSignatures);
      await S3Service.updatePresignedPutUrl(documentUrl, pdfBlob);
      onCancel();
    } catch (error: any) {
      console.error("Lỗi khi lưu chữ ký:", error);
      showErrorAlert(
        `Có lỗi xảy ra: ${error.message || "Không thể lưu chữ ký."}`,
      );
    }
  };

  return (
    <SharedSignDocumentForm
      idTaiLieu={selectedIds[0]}
      pdfUrl={pdfUrl}
      onSign={handleSignComplete}
      onCancel={onCancel}
      title={title}
      staffs={staffs || []}
      canUserSign={canUserSign}
      fullscreen={fullscreen}
      showSignerSidebar={showSignerSidebar}
    />
  );
}
