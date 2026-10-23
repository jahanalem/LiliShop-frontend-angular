export interface CustomerProcessing {
  orderId: number; paymentReceived: boolean; processing: 'Pending'|'ReviewRequired'|'Complete';
  completedLines: number; totalLines: number; invoiceId: number|null;
  email: 'Pending'|'Accepted'|'UnknownDelivery'|'ReviewRequired';
}
export interface WorkProgress {
  state: string; stage: string; revision: number; attempts: number; cycleAttempts: number;
  leaseUntil: string|null; nextAttemptAt: string; reason: string|null; updatedAt: string;
  completedAt: string|null; invoiceId: number|null;
}
export interface MailProgress extends Omit<WorkProgress, 'stage'|'completedAt'> {
  id: string; sendStartedAt: string|null; acceptedAt: string|null;
}
export interface FulfillmentRow {
  id: string; orderId: number; attemptId: string; createdAt: string; state: string; stage: string;
  revision: number; attempts: number; reason: string|null; nextAttemptAt: string; invoiceId: number|null; emailState: string;
}
export interface FulfillmentDetail {
  id: string; orderId: number; attemptId: string; createdAt: string; execution: WorkProgress|null;
  totalLines: number; email: MailProgress|null;
  lines: { orderItemId: number; productVariantId: number; quantity: number; reservationId: number; deductionId: number; completedAt: string }[];
  audit: { id: number; action: string; actor: string; reason: string; createdAt: string }[];
}
export interface FulfillmentPage { page: number; pageSize: number; count: number; data: FulfillmentRow[]; }
export interface WorkerControl { enabled: boolean; revision: number; }
