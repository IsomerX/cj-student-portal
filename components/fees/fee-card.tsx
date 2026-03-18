"use client";

import { CreditCard, Loader2 } from "lucide-react";
import type { FeeItem } from "@/lib/api/fees";

interface FeeCardProps {
  fee: FeeItem;
  onPayment: (fee: FeeItem) => void;
  isProcessing: boolean;
}

export function FeeCard({ fee, onPayment, isProcessing }: FeeCardProps) {
  const getStatusColor = () => {
    if (fee.status === "paid") {
      return {
        label: "PAID",
        bgColor: "#d1fae5",
        textColor: "#065f46",
      };
    }
    if (fee.isOverdue) {
      return {
        label: "OVERDUE",
        bgColor: "#fef2f2",
        textColor: "#dc2626",
      };
    }
    return {
      label: "PENDING",
      bgColor: "#fef3c7",
      textColor: "#92400e",
    };
  };

  const statusInfo = getStatusColor();

  return (
    <div
      className="group flex w-full flex-col rounded-[24px] bg-white p-4 sm:p-5 shadow-sm ring-1 ring-[#ece5c8] transition-all hover:ring-[#cadab2] hover:shadow-md"
    >
      {/* Header */}
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="truncate font-bold text-[#212121] text-base mb-1">
            {fee.title}
          </h3>
          {fee.lateFee && fee.lateFee > 0 && (
            <p className="text-xs text-[#dc2626] font-medium">
              Includes late fee: ₹{fee.lateFee.toLocaleString()}
            </p>
          )}
        </div>
        <span
          className="inline-flex items-center self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] shrink-0"
          style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.textColor }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Amount and Action */}
      <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-[#f3f4f6]">
        <div>
          <p className="text-xs text-[#737373] mb-1">Amount Due</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#212121]">
            ₹{fee.remainingAmount.toLocaleString()}
          </p>
          <p className={`text-xs ${fee.isOverdue ? "text-[#dc2626]" : "text-[#737373]"} mt-1 font-medium`}>
            Due: {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {fee.status !== "paid" && (
          <button
            onClick={() => onPayment(fee)}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-[14px] bg-[#283618] px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1f2912] hover:shadow-md active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Pay Now
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
