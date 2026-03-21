import { AlertCircle, CheckCircle } from "lucide-react";
import type { FeeStats } from "@/lib/api/fees";

interface FeeStatsProps {
  stats: FeeStats;
}

export function FeeStatsCards({ stats }: FeeStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Pending Fees */}
      <div className="bg-yellow-50 border-2 border-gray-900 rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-yellow-100 rounded-lg border-2 border-gray-900">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">
            Pending Fees
          </h3>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          ₹{(stats.totalPending / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {stats.nextDueDate && (
          <p className="text-xs text-gray-600 mt-2">
            Next due: {new Date(stats.nextDueDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Paid Fees */}
      <div className="bg-green-50 border-2 border-gray-900 rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 rounded-lg border-2 border-gray-900">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">Total Paid</h3>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          ₹{(stats.totalPaid / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}
