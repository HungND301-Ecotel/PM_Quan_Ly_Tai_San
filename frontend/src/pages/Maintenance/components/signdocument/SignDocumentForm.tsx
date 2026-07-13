import { useState, useEffect, useCallback } from "react";
import SharedSignDocumentForm from "../../../../components/SignDocument/SharedSignDocumentForm";
import api from "../../../../config/api.config";
import { canUserSign } from "../../config";
import { SignaturesData } from "../../../../components/SignDocument/types";

interface SignDocumentFormProps {
  selectedIds: string[];
  onCancel: () => void;
  onSign: (data: any[], item: any) => void;
  fullscreen?: boolean;
  showSignerSidebar?: boolean;
  data: any;
  allUnits?: any[];
  staffs?: any[];
  departments?: any[];
  positions?: any[];
  document?: File | string | any;
  bangKe?: File | string | any;
  previewDocument?: boolean;
  isEdit?: boolean;
  title?: string;
  showHeader?: boolean;
  onSaveNote?: (note: string) => Promise<void>;
  onReject?: () => Promise<void>;
  generatePdf?: () => Promise<{
    pdf: Uint8Array;
    coordinates: Record<
      string,
      { xRatio: number; yRatio: number; page?: number }
    >;
  }>;
}

export default function SignDocumentForm({
  selectedIds,
  onCancel,
  onSign,
  fullscreen = true,
  showSignerSidebar = true,
  data,
  allUnits = [],
  staffs = [],
  departments = [],
  positions = [],
  document: documentUrl,
  bangKe,
  previewDocument = false,
  isEdit,
  title,
  showHeader = true,
  onSaveNote,
  onReject,
  generatePdf,
}: SignDocumentFormProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [sourcePdfBytes, setSourcePdfBytes] = useState<Uint8Array | null>(null);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [coordinates, setCoordinates] = useState<any>(null);

  const handleSignatureList = useCallback(async (idTaiLieu: string) => {
    if (!idTaiLieu) return;
    try {
      const response = await api.get(`/chuky/${idTaiLieu}`);
      return response.data;
    } catch (error) {
      console.log("Không thể tải chữ ký");
      return null;
    }
  }, []);

  const fetchSignatures = useCallback(async () => {
    if (selectedIds[0] && handleSignatureList) {
      try {
        const data = await handleSignatureList(selectedIds[0]);
        if (data) {
          const initialSigs = data.map((item: any) => ({
            ...item,
            isLocked: true,
          }));
          setSignatures(initialSigs);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách chữ ký:", err);
      }
    }
  }, [selectedIds, handleSignatureList]);

  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

  useEffect(() => {
    const preparePdf = async () => {
      try {
        if (!generatePdf) {
          setSourcePdfBytes(null);
          setPdfUrl(null);
          return;
        }
        let finalBytes: Uint8Array | null = null;

        const res = await generatePdf();
        finalBytes = res.pdf;
        if (res.coordinates) {
          setCoordinates(res.coordinates);
        }

        if (finalBytes) {
          setSourcePdfBytes(finalBytes);
          const newBlob = new Blob([finalBytes.buffer as ArrayBuffer], {
            type: "application/pdf",
          });
          setPdfUrl(URL.createObjectURL(newBlob));
        }
      } catch (err) {
        console.error("Lỗi chuẩn bị PDF:", err);
      }
    };

    preparePdf();
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [data, generatePdf]);

  const handleSignComplete = async (
    newSignatures: SignaturesData[],
    pdfBlob: Blob,
  ) => {
    await onSign(newSignatures, data);
    onCancel();
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
      sourcePdfBytes={sourcePdfBytes}
      showHeader={showHeader}
      initialSignatures={signatures}
      trangThai={data?.trangThai}
      initialNote={data?.ghiChuBienBan || ""}
      onSaveNote={onSaveNote}
      onReject={onReject}
      coordinates={coordinates}
    />
  );
}
