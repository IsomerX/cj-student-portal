import { CheckCircle, Receipt } from "lucide-react";
import type { TransactionHistoryItem } from "@/lib/api/fees";

interface TransactionItemProps {
  transaction: TransactionHistoryItem;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  return (
    <div className="flex w-full flex-col rounded-[24px] bg-white p-4 sm:p-5 shadow-sm ring-1 ring-[#ece5c8]">
      <div className="flex w-full flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="truncate font-bold text-[#212121] text-base mb-1">
            {transaction.feeTitle}
          </h4>
          <p className="text-xs text-[#737373]">
            {new Date(transaction.paidAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xl sm:text-2xl font-extrabold text-[#059669] mb-1">
            ₹{transaction.amount.toLocaleString()}
          </p>
          <div className="inline-flex items-center gap-1 rounded-full bg-[#d1fae5] px-2 py-0.5">
            <CheckCircle className="h-3 w-3 text-[#059669]" />
            <span className="text-[10px] font-bold text-[#059669] uppercase tracking-[0.1em]">
              Paid
            </span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#f3f4f6]">
        <Receipt className="h-3.5 w-3.5 text-[#a3a3a3]" />
        <span className="text-xs text-[#737373] truncate">
          {transaction.paymentMethod?.toUpperCase() || "ONLINE"} •{" "}
          {transaction.transactionId || "N/A"}
        </span>
      </div>
    </div>
  );
}
