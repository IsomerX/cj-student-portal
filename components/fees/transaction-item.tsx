import { CheckCircle, Receipt } from "lucide-react";
import type { TransactionHistoryItem } from "@/lib/api/fees";

interface TransactionItemProps {
  transaction: TransactionHistoryItem;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  return (
    <div className="bg-white border-2 border-gray-900 rounded-lg p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">
            {transaction.feeTitle}
          </h4>
          <p className="text-sm text-gray-600">
            {new Date(transaction.paidAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-green-600 mb-1">
            ₹{transaction.amount.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 justify-end">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span className="text-xs font-semibold text-green-600">Paid</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <Receipt className="h-4 w-4 text-gray-500" />
        <span className="text-xs text-gray-600">
          {transaction.paymentMethod?.toUpperCase() || "ONLINE"} •{" "}
          {transaction.transactionId || "N/A"}
        </span>
      </div>
    </div>
  );
}
