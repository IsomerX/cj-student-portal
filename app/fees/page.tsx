"use client";

import { useState, useEffect } from "react";
import { DollarSign, History, Loader2, AlertCircle } from "lucide-react";
import {
  usePendingFees,
  useFeeStatistics,
  useTransactionHistory,
  useCreatePayment,
  useInitiatePayment,
  useVerifyPayment,
} from "@/hooks/use-fees";
import { FeeStatsCards } from "@/components/fees/fee-stats";
import { FeeCard } from "@/components/fees/fee-card";
import { TransactionItem } from "@/components/fees/transaction-item";
import type { FeeItem } from "@/lib/api/fees";

export default function FeesPage() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [processingFeeId, setProcessingFeeId] = useState<string | null>(null);

  // Get student ID from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setStudentId(user.id);
        } catch (error) {
          console.error("Failed to parse user data:", error);
        }
      }
    }
  }, []);

  // Fetch data
  const {
    data: pendingFees = [],
    isLoading: feesLoading,
    error: feesError,
    refetch: refetchFees,
  } = usePendingFees(studentId);
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useFeeStatistics(studentId);
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useTransactionHistory(studentId, 10, 0);

  // Mutations
  const createPayment = useCreatePayment();
  const initiatePayment = useInitiatePayment();
  const verifyPayment = useVerifyPayment();

  const handlePayment = async (fee: FeeItem) => {
    if (processingFeeId) return;

    setProcessingFeeId(fee.feeReminderId);

    try {
      // Step 1: Create payment order
      const paymentOrderResponse = await createPayment.mutateAsync({
        feeReminderId: fee.feeReminderId,
        amount: fee.remainingAmount,
      });

      if (!paymentOrderResponse.paymentOrder) {
        throw new Error("Failed to create payment order");
      }

      const { id: paymentOrderId } = paymentOrderResponse.paymentOrder;

      // Step 2: Initiate payment (get Razorpay redirect URL)
      const returnUrl = `${window.location.origin}/fees?payment=success&feeId=${fee.feeReminderId}`;

      const initiateResponse = await initiatePayment.mutateAsync({
        feeReminderId: fee.feeReminderId,
        paymentOrderId,
        paymentMethod: "OTHER",
        returnUrl,
      });

      if (!initiateResponse.redirectUrl) {
        throw new Error("Failed to get payment URL");
      }

      // Step 3: Open payment page in new tab
      const paymentWindow = window.open(
        initiateResponse.redirectUrl,
        "_blank",
        "width=800,height=600",
      );

      // Listen for payment completion
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === "payment-complete") {
          // Verify payment
          await verifyPayment.mutateAsync(fee.feeReminderId);
          await refetchFees();
          setProcessingFeeId(null);

          // Close payment window if still open
          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.close();
          }
        }
      };

      window.addEventListener("message", handleMessage);

      // Cleanup
      const checkInterval = setInterval(() => {
        if (paymentWindow && paymentWindow.closed) {
          clearInterval(checkInterval);
          window.removeEventListener("message", handleMessage);
          setProcessingFeeId(null);
          // Refresh fees when window closes
          refetchFees();
        }
      }, 1000);
    } catch (error) {
      console.error("Payment error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to initiate payment. Please try again.",
      );
      setProcessingFeeId(null);
    }
  };

  // Handle payment verification on return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const feeId = params.get("feeId");

    if (payment === "success" && feeId) {
      // Verify and refresh
      verifyPayment.mutate(feeId);
      // Clean up URL
      window.history.replaceState({}, "", "/fees");
    }
  }, []);

  const isLoading = feesLoading || statsLoading || transactionsLoading;
  const hasError = feesError || statsError || transactionsError;

  if (isLoading && !pendingFees.length) {
    return (
      <div className="min-h-screen bg-[#fffbe7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading fees...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-[#fffbe7] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to load fees
          </h2>
          <p className="text-gray-600 mb-4">
            There was an error loading your fee information. Please try again.
          </p>
          <button
            onClick={() => refetchFees()}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffbe7]">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fee Payment
          </h1>
          <p className="text-gray-600">Manage your fees and payments</p>
        </div>

        {/* Statistics */}
        {stats && <FeeStatsCards stats={stats} />}

        {/* Pending Fees */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-6 w-6 text-gray-900" strokeWidth={2.5} />
            <h2 className="text-xl font-bold text-gray-900">Payable Fees</h2>
          </div>

          {pendingFees.length > 0 ? (
            <div className="space-y-4">
              {pendingFees.map((fee) => (
                <FeeCard
                  key={fee.feeReminderId}
                  fee={fee}
                  onPayment={handlePayment}
                  isProcessing={processingFeeId === fee.feeReminderId}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Pending Fees
              </h3>
              <p className="text-gray-600">
                You have no pending fees at this time.
              </p>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History className="h-6 w-6 text-gray-900" strokeWidth={2.5} />
            <h2 className="text-xl font-bold text-gray-900">
              Transaction History
            </h2>
          </div>

          {transactionsData && transactionsData.transactions.length > 0 ? (
            <div className="space-y-3">
              {transactionsData.transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-12 text-center">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Transactions Yet
              </h3>
              <p className="text-gray-600">
                Your payment history will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
