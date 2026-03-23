import { apiClient } from "./config";

// Types
export interface FeeItem {
  feeReminderId: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  dueDate: string;
  isOverdue: boolean;
  lateFee: number | null;
  // Fee breakdown (all amounts in paise)
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  platformFee: number;
  processingFee: number;
}

export interface FeeStats {
  totalPending: number;
  totalPaid: number;
  overdueFees: number;
  upcomingFees: number;
  nextDueDate: string | null;
  nextDueAmount: number;
}

export interface TransactionHistoryItem {
  id: string;
  feeReminderId: string;
  feeTitle: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId: string | null;
  providerTxnId: string | null;
  paidAt: string;
  source: "payment_gateway" | "legacy";
}

export interface PaymentOrderInfo {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  providerOrderId?: string;
  expiresAt?: Date;
}

export interface FeePaymentResponse {
  paymentOrder?: PaymentOrderInfo;
  feeReminder?: any;
}

export interface InitiatePaymentResponse {
  transactionId?: string;
  redirectUrl?: string;
  upiIntentUrl?: string;
  qrCodeData?: string;
}

export interface VerifyPaymentResponse {
  status: string;
  paidAmount: number;
  verified: boolean;
}

/**
 * Get pending fees for a student
 */
export async function getPendingFees(studentId: string): Promise<FeeItem[]> {
  const response = await apiClient.get("/fees/pending", {
    params: { studentId },
  });
  return response.data || [];
}

/**
 * Get fee statistics for a student
 */
export async function getFeeStatistics(studentId: string): Promise<FeeStats> {
  const response = await apiClient.get("/fees/summary", {
    params: { studentId },
  });
  return response.data;
}

/**
 * Get transaction history for a student
 */
export async function getTransactionHistory(
  studentId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<{ transactions: TransactionHistoryItem[]; total: number }> {
  const response = await apiClient.get("/fees/transactions", {
    params: { studentId, limit, offset },
  });
  return {
    transactions: response.data || [],
    total: response.data.total || 0,
  };
}

/**
 * Create a fee payment order
 */
export async function createFeePayment(
  feeReminderId: string,
  amount?: number,
  preferredProvider?: string,
): Promise<FeePaymentResponse> {
  const response = await apiClient.post(`/fees/${feeReminderId}/pay`, {
    amount,
    preferredProvider,
  });
  return response.data;
}

/**
 * Initiate payment for an order
 */
export async function initiateFeePayment(
  feeReminderId: string,
  paymentOrderId: string,
  paymentMethod: string,
  returnUrl: string,
  upiVpa?: string,
): Promise<InitiatePaymentResponse> {
  const response = await apiClient.post(
    `/fees/${feeReminderId}/initiate-payment`,
    {
      paymentOrderId,
      paymentMethod,
      returnUrl,
      upiVpa,
    },
  );
  return response.data;
}

/**
 * Verify payment after completion
 */
export async function verifyFeePayment(
  feeReminderId: string,
): Promise<VerifyPaymentResponse> {
  const response = await apiClient.post(
    `/fees/${feeReminderId}/verify-payment`,
  );
  return response.data;
}
