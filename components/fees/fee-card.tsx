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
        label: "Paid",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200",
      };
    }
    if (fee.isOverdue) {
      return {
        label: "Overdue",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200",
      };
    }
    return {
      label: "Pending",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
    };
  };

  const statusInfo = getStatusColor();

  return (
    <div
      className={`bg-white border-2 ${fee.isOverdue ? "border-red-600" : "border-gray-900"} rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{fee.title}</h3>
          {fee.lateFee && fee.lateFee > 0 && (
            <p className="text-sm text-red-600">
              Includes late fee: ₹{fee.lateFee.toLocaleString()}
            </p>
          )}
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Amount and Action */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            ₹{fee.remainingAmount.toLocaleString()}
          </p>
          <p
            className={`text-sm ${fee.isOverdue ? "text-red-600" : "text-gray-600"} mt-1`}
          >
            Due: {new Date(fee.dueDate).toLocaleDateString()}
          </p>
        </div>

        {fee.status !== "paid" && (
          <button
            onClick={() => onPayment(fee)}
            disabled={isProcessing}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
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
