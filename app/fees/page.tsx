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
import { FeeBreakdownModal } from "@/components/fees/fee-breakdown-modal";
import type { FeeItem } from "@/lib/api/fees";
import { getMyCoachingEnrollments, type MyCoachingEnrollment } from "@/lib/api/coachingEnrollment";

export default function FeesPage() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [coachingEnrollments, setCoachingEnrollments] = useState<MyCoachingEnrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [processingFeeId, setProcessingFeeId] = useState<string | null>(null);
  const [selectedFee, setSelectedFee] = useState<FeeItem | null>(null);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

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

  useEffect(() => {
    if (!studentId) return;
    setEnrollmentsLoading(true);
    getMyCoachingEnrollments()
      .then(setCoachingEnrollments)
      .catch(() => {/* silent */})
      .finally(() => setEnrollmentsLoading(false));
  }, [studentId]);

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

  // Show fee breakdown modal when "Pay Now" is clicked
  const handlePayment = (fee: FeeItem) => {
    if (processingFeeId) return;
    setSelectedFee(fee);
    setShowBreakdownModal(true);
  };

  // Process payment after user confirms in modal
  const handleConfirmPayment = async () => {
    if (!selectedFee || processingFeeId) return;

    setProcessingFeeId(selectedFee.feeReminderId);

    try {
      // Step 1: Create payment order
      const paymentOrderResponse = await createPayment.mutateAsync({
        feeReminderId: selectedFee.feeReminderId,
        amount: selectedFee.remainingAmount,
      });

      if (!paymentOrderResponse.paymentOrder) {
        throw new Error("Failed to create payment order");
      }

      const { id: paymentOrderId } = paymentOrderResponse.paymentOrder;

      // Step 2: Initiate payment (get Razorpay redirect URL)
      const returnUrl = `${window.location.origin}/fees?payment=success&feeId=${selectedFee.feeReminderId}`;

      const initiateResponse = await initiatePayment.mutateAsync({
        feeReminderId: selectedFee.feeReminderId,
        paymentOrderId,
        paymentMethod: "UPI",
        returnUrl,
      });

      if (!initiateResponse.redirectUrl) {
        throw new Error("Failed to get payment URL");
      }

      // Close modal before redirect
      setShowBreakdownModal(false);

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
          await verifyPayment.mutateAsync(selectedFee.feeReminderId);
          await refetchFees();
          setProcessingFeeId(null);
          setSelectedFee(null);

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
          setSelectedFee(null);
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
      setShowBreakdownModal(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    if (!processingFeeId) {
      setShowBreakdownModal(false);
      setSelectedFee(null);
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
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#283618] mx-auto mb-4" />
          <p className="text-[#737373] font-medium">Loading fees...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#fef2f2] text-[#dc2626] ring-1 ring-[#fecaca] mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[#212121] mb-2">
            Failed to load fees
          </h2>
          <p className="text-[#737373] mb-6">
            There was an error loading your fee information. Please try again.
          </p>
          <button
            onClick={() => refetchFees()}
            className="inline-flex items-center gap-2 rounded-[14px] bg-[#283618] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1f2912] hover:shadow-md active:scale-[0.97]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f0f2f5] pb-36 sm:pb-12">
      {/* Modern Gradient Header */}
      <section
        className="relative rounded-b-[32px] bg-[#283618] px-3 pb-8 pt-5 shadow-lg sm:rounded-b-[40px] sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 overflow-hidden"
        style={{ paddingTop: "max(1.25rem, calc(env(safe-area-inset-top) + 0.25rem))" }}
      >
        <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-0 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#cadab2]/10 blur-3xl lg:translate-x-1/4" />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-[14px] sm:rounded-[16px] bg-white text-[#283618] shadow-sm ring-2 ring-white/10">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Student Portal
                </p>
                <p className="text-lg sm:text-xl font-extrabold tracking-tight text-white lg:text-2xl">
                  Fee Payment
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 max-w-2xl space-y-4">
            <h1 className="text-[1.75rem] sm:text-[2.25rem] font-extrabold leading-tight tracking-tight text-white lg:text-[2.75rem]">
              Fees & Payments
            </h1>
            <p className="text-sm sm:text-base font-medium leading-relaxed text-white/80">
              View your fee details, make payments, and track transaction history.
            </p>
          </div>

          {/* Statistics Cards in Header */}
          {stats && (
            <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-[16px] bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-300" />
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/80">
                    Pending
                  </p>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">
                  ₹{(stats.totalPending / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-[16px] bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-300" />
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/80">
                    Paid
                  </p>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">
                  ₹{(stats.totalPaid / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Content Area */}
      <div className="relative z-10 mx-auto mt-4 sm:mt-6 max-w-4xl px-3 sm:px-6 lg:px-8">
        {/* Coaching Enrollments Section */}
        {(enrollmentsLoading || coachingEnrollments.length > 0) && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#737373] mb-4 pl-1">My Coaching Enrollments</h2>
            {enrollmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {coachingEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {enrollment.school?.name ?? 'Coaching Center'}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Batch: {enrollment.batch?.name ?? '—'} · {enrollment.billingFrequency.charAt(0) + enrollment.billingFrequency.slice(1).toLowerCase()}
                      </p>
                      {enrollment.nextBillingDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Next billing:{' '}
                          {new Date(enrollment.nextBillingDate).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      enrollment.accessStatus === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : enrollment.accessStatus === 'SUSPENDED'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {enrollment.accessStatus === 'ACTIVE' ? 'Active'
                        : enrollment.accessStatus === 'SUSPENDED' ? 'Suspended'
                        : 'Deactivated'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Pending Fees */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#737373] mb-4 pl-1">
            Pending Fees
          </h2>

          {pendingFees.length > 0 ? (
            <div className="grid gap-3 sm:gap-4">
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
            <div className="rounded-[24px] border border-[#ece5c8] bg-white px-5 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#f6fbf2] text-[#2d8c53] ring-1 ring-[#d9ead0]">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#212121]">
                No Pending Fees
              </h3>
              <p className="mt-2 text-sm text-[#737373]">
                You have no pending fees at this time.
              </p>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#737373] mb-4 pl-1">
            Transaction History
          </h2>

          {transactionsData && transactionsData.transactions.length > 0 ? (
            <div className="grid gap-3 sm:gap-4">
              {transactionsData.transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-[#ece5c8] bg-white px-5 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#f6fbf2] text-[#737373] ring-1 ring-[#ece5c8]">
                <History className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#212121]">
                No Transactions Yet
              </h3>
              <p className="mt-2 text-sm text-[#737373]">
                Your payment history will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fee Breakdown Modal */}
      <FeeBreakdownModal
        fee={selectedFee}
        isOpen={showBreakdownModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPayment}
        isProcessing={!!processingFeeId}
      />
    </main>
  );
}
