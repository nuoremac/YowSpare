export type WorkflowEvent = {
  at: string;
  action: string;
  note?: string;
};

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED";

export type InternalRequest = {
  id: string;
  agencyId: string;
  department: string;
  productId: string;
  productLabel: string;
  quantity: number;
  reason: string;
  neededFrom?: string;
  neededTo?: string;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  events: WorkflowEvent[];
};

export type PurchaseOrderLine = {
  id: string;
  productId: string;
  productLabel: string;
  quantity: number;
  unitPrice: number;
  receivedQty: number;
};

export type PurchaseOrderStatus = "DRAFT" | "SENT" | "PARTIAL" | "RECEIVED" | "CLOSED";

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  supplierLabel: string;
  agencyId?: string;
  expectedAt?: string;
  note?: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  updatedAt: string;
  lines: PurchaseOrderLine[];
  events: WorkflowEvent[];
};

export type IssueReturnRecord = {
  id: string;
  kind: "ISSUE" | "RETURN";
  agencyId: string;
  department: string;
  productId: string;
  productLabel: string;
  quantity: number;
  reason: string;
  dueAt?: string;
  status: "OPEN" | "RETURNED";
  createdAt: string;
};

export type CycleCountTask = {
  id: string;
  agencyId: string;
  productId: string;
  productLabel: string;
  binCode: string;
  expectedQty: number;
  countedQty?: number;
  delta?: number;
  status: "PLANNED" | "COUNTED" | "ADJUSTED";
  createdAt: string;
  updatedAt: string;
};

export type WorkOrderLine = {
  id: string;
  productId: string;
  productLabel: string;
  quantity: number;
};

export type WorkOrder = {
  id: string;
  title: string;
  department: string;
  agencyId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "DONE";
  startsAt?: string;
  endsAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  lines: WorkOrderLine[];
  events: WorkflowEvent[];
};

export type ExceptionTicket = {
  id: string;
  title: string;
  description: string;
  type: "STOCKOUT" | "SUBSTITUTION" | "SUPPLIER_DELAY" | "QUALITY" | "OTHER";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
};

export type ExceptionStatus = ExceptionTicket["status"];

export type WorkflowState = {
  internalRequests: InternalRequest[];
  purchaseOrders: PurchaseOrder[];
  issuesReturns: IssueReturnRecord[];
  cycleCounts: CycleCountTask[];
  workOrders: WorkOrder[];
  exceptions: ExceptionTicket[];
};

const STORAGE_KEY = "yowspare-workflow-state-v1";

const emptyState = (): WorkflowState => ({
  internalRequests: [],
  purchaseOrders: [],
  issuesReturns: [],
  cycleCounts: [],
  workOrders: [],
  exceptions: [],
});

const isBrowser = () => typeof window !== "undefined";

const normalizeState = (input: Partial<WorkflowState> | null | undefined): WorkflowState => ({
  internalRequests: Array.isArray(input?.internalRequests) ? input!.internalRequests : [],
  purchaseOrders: Array.isArray(input?.purchaseOrders) ? input!.purchaseOrders : [],
  issuesReturns: Array.isArray(input?.issuesReturns) ? input!.issuesReturns : [],
  cycleCounts: Array.isArray(input?.cycleCounts) ? input!.cycleCounts : [],
  workOrders: Array.isArray(input?.workOrders) ? input!.workOrders : [],
  exceptions: Array.isArray(input?.exceptions) ? input!.exceptions : [],
});

const writeState = (state: WorkflowState): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const readWorkflowState = (): WorkflowState => {
  if (!isBrowser()) return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<WorkflowState>;
    return normalizeState(parsed);
  } catch {
    return emptyState();
  }
};

export const updateWorkflowState = (updater: (current: WorkflowState) => WorkflowState): WorkflowState => {
  const current = readWorkflowState();
  const next = normalizeState(updater(current));
  writeState(next);
  return next;
};

export const nowIso = (): string => new Date().toISOString();

const fallbackId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const makeId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return fallbackId();
};
