export type ExecutionStatus =
  | 'draft' // 작성중
  | 'submitted' // 제출됨 (승인대기)
  | 'approved' // 승인됨
  | 'rejected' // 반려됨
  | 'cancelled'; // 취소됨

export type ApprovalStep = 'manager' | 'team_lead' | 'rm_team' | 'cfo';

export interface Execution {
  id: string;
  executionNumber: string; // 품의번호 (e.g., "EXE-2024-0001")
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  budgetItemId: string;
  budgetItem?: {
    id: string;
    name: string;
    code: string;
    remainingAmount: number;
  };
  amount: number; // 집행 금액
  executionDate: string; // 집행 예정일
  justification: string; // 집행 사유
  status: ExecutionStatus;
  currentStep?: ApprovalStep; // 현재 결재 단계
  attachments: Attachment[];
  createdBy: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface ExecutionListResponse {
  executions: Execution[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateExecutionDto {
  projectId: string;
  budgetItemId: string;
  amount: number;
  executionDate: string;
  justification: string;
  attachments?: File[];
}

export interface UpdateExecutionDto extends Partial<CreateExecutionDto> {}

export interface ApprovalAction {
  executionId: string;
  action: 'approve' | 'reject';
  comment?: string;
  reason?: string; // Required for rejection
}

export interface ApprovalHistory {
  id: string;
  executionId: string;
  step: ApprovalStep;
  approver: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: 'approved' | 'rejected';
  comment?: string;
  timestamp: string;
}

export interface ApprovalFlow {
  executionId: string;
  steps: {
    step: ApprovalStep;
    approver: {
      id: string;
      name: string;
      role: string;
    };
    status: 'pending' | 'approved' | 'rejected' | 'skipped';
    approvedAt?: string;
    comment?: string;
  }[];
}
