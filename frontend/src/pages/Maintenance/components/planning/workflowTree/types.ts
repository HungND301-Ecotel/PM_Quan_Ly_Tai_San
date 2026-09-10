export type StepStatus =
  | "draft"
  | "approved"
  | "cancelled"
  | "completed"
  | "not_created";

export interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  type: "pdf" | "xls" | "doc" | "img" | "other";
  url?: string;
}

export interface WorkflowStepData {
  id: number;
  stepNumber: number;
  title: string; // vd: "Biên bản 1", "Biên bản 2"...
  name: string;  // vd: "Giấy đề nghị SC", "BB Giám định", "Biện pháp SC", "BB Nghiệm thu", "BB Vật tư"
  subTitle: string; // Tên chi tiết
  code: string;  // soPhieu
  status: StepStatus;
  statusText: string;
  date?: string;
  creator?: string;
  content?: string;
  isLocked: boolean;
  canCreateNext?: boolean;
  nextStepName?: string;
  canCreateAlternativeNext?: boolean;
  alternativeNextStepName?: string;
  description: string;
  nextStepInfo: string;
  attachments: AttachmentItem[];
  rawData?: any;
}
