"use client";

import { X, DollarSign, ArrowRight, Info } from "lucide-react";
import type { FeeItem } from "@/lib/api/fees";

interface FeeBreakdownModalProps {
  fee: FeeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function FeeBreakdownModal({
  fee,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: FeeBreakdownModalProps) {
  if (!isOpen || !fee) return null;

  // Convert amounts from paise to rupees for display
  const tuitionFee = fee.subtotal / 100;
  const platformFee = fee.platformFee / 100;
  const processingFee = fee.processingFee / 100;
  const totalAmount = fee.remainingAmount / 100;
  const processingFeePercent = fee.subtotal > 0
    ? ((fee.processingFee / (fee.subtotal + fee.platformFee)) * 100).toFixed(1)
    : '3.0';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl ring-1 ring-black/5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative rounded-t-[24px] bg-gradient-to-br from-[#283618] to-[#1f2912] p-6 pb-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/10 text-white backdrop-blur-sm ring-1 ring-white/20">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Payment Breakdown
                </p>
                <p className="text-lg font-extrabold text-white">
                  Fee Details
                </p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white truncate">
              {fee.title}
            </h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Info Banner */}
            <div className="flex gap-3 rounded-[16px] bg-blue-50 p-4 ring-1 ring-blue-100">
              <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Fee Breakdown
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Includes tuition fee, platform fee, and {processingFeePercent}% processing fee.
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#737373] font-medium">Tuition Fee</span>
                <span className="font-bold text-[#212121]">
                  ₹{tuitionFee.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#737373] font-medium">Platform Fee</span>
                <span className="font-bold text-[#737373]">
                  ₹{platformFee.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#737373] font-medium flex items-center gap-1.5">
                  Processing Fee ({processingFeePercent}%)
                  <span className="group relative">
                    <Info className="h-3.5 w-3.5 text-[#737373]/60 cursor-help" />
                    <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-900 rounded-lg whitespace-nowrap z-50 shadow-lg">
                      Not applicable when paid through cash
                    </span>
                  </span>
                </span>
                <span className="font-bold text-[#737373]">
                  ₹{processingFee.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="h-px bg-[#ece5c8]" />

              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-bold text-[#212121]">
                  Total Amount Payable
                </span>
                <span className="text-2xl font-extrabold text-[#283618]">
                  ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Due Date Warning */}
            {fee.isOverdue && (
              <div className="rounded-[16px] bg-red-50 p-4 ring-1 ring-red-100">
                <p className="text-sm font-medium text-red-900">
                  ⚠️ Payment Overdue
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Due date was {new Date(fee.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {fee.lateFee && fee.lateFee > 0 && (
                    <span className="block mt-1">
                      Late fee of ₹{(fee.lateFee / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })} is included.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 rounded-[14px] border border-[#ece5c8] bg-white px-5 py-3 text-sm font-bold text-[#212121] shadow-sm transition-all hover:bg-[#f9fafb] hover:border-[#cadab2] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#283618] px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1f2912] hover:shadow-md active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  "Processing..."
                ) : (
                  <>
                    Proceed to Pay
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-center text-[#737373]">
              You will be redirected to Razorpay secure payment gateway
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
