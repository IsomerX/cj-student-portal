import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPendingFees,
  getFeeStatistics,
  getTransactionHistory,
  createFeePayment,
  initiateFeePayment,
  verifyFeePayment,
  type FeeItem,
  type FeeStats,
  type TransactionHistoryItem,
} from "@/lib/api/fees";

/**
 * Hook to fetch pending fees for a student
 */
export function usePendingFees(studentId: string | null) {
  return useQuery<FeeItem[]>({
    queryKey: ["fees", "pending", studentId],
    queryFn: () => getPendingFees(studentId!),
    enabled: !!studentId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch fee statistics
 */
export function useFeeStatistics(studentId: string | null) {
  return useQuery<FeeStats>({
    queryKey: ["fees", "statistics", studentId],
    queryFn: () => getFeeStatistics(studentId!),
    enabled: !!studentId,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch transaction history
 */
export function useTransactionHistory(
  studentId: string | null,
  limit: number = 10,
  offset: number = 0,
) {
  return useQuery<{ transactions: TransactionHistoryItem[]; total: number }>({
    queryKey: ["fees", "transactions", studentId, limit, offset],
    queryFn: () => getTransactionHistory(studentId!, limit, offset),
    enabled: !!studentId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to create payment order
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      feeReminderId,
      amount,
      preferredProvider,
    }: {
      feeReminderId: string;
      amount?: number;
      preferredProvider?: string;
    }) => createFeePayment(feeReminderId, amount, preferredProvider),
    onSuccess: () => {
      // Invalidate fee queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["fees"] });
    },
  });
}

/**
 * Hook to initiate payment
 */
export function useInitiatePayment() {
  return useMutation({
    mutationFn: ({
      feeReminderId,
      paymentOrderId,
      paymentMethod,
      returnUrl,
      upiVpa,
    }: {
      feeReminderId: string;
      paymentOrderId: string;
      paymentMethod: string;
      returnUrl: string;
      upiVpa?: string;
    }) =>
      initiateFeePayment(
        feeReminderId,
        paymentOrderId,
        paymentMethod,
        returnUrl,
        upiVpa,
      ),
  });
}

/**
 * Hook to verify payment
 */
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feeReminderId: string) => verifyFeePayment(feeReminderId),
    onSuccess: () => {
      // Invalidate all fee queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["fees"] });
    },
  });
}
