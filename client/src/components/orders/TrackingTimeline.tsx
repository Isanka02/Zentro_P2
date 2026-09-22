import { CheckCircle2, Clock, Truck, Home, XCircle, Tag, Calendar } from "lucide-react";
import type { Order } from "../../api/orders";

interface TrackingTimelineProps {
  status: Order["status"];
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt?: string;
}

const steps = [
  { key: "pending", label: "Order Placed", description: "Order received & pending confirmation", icon: Clock },
  { key: "confirmed", label: "Confirmed", description: "Order processed and being packed", icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", description: "In transit with courier", icon: Truck },
  { key: "delivered", label: "Delivered", description: "Delivered to destination", icon: Home },
];

const statusIndexMap: Record<Order["status"], number> = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

export const TrackingTimeline = ({
  status,
  carrier,
  trackingNumber,
  estimatedDelivery,
  createdAt,
}: TrackingTimelineProps) => {
  if (status === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-2">
        <XCircle size={40} className="mx-auto text-red-500" />
        <h3 className="font-bold text-red-900 text-lg">Order Cancelled</h3>
        <p className="text-sm text-red-700 max-w-md mx-auto">
          This order has been cancelled. If you have any questions or require assistance, please contact Zentro Support.
        </p>
      </div>
    );
  }

  const currentStepIndex = statusIndexMap[status] ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-xs">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Order Progress</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Placed on {new Date(createdAt).toLocaleDateString(undefined, { dateStyle: "long" })}
          </p>
        </div>

        {(carrier || trackingNumber || estimatedDelivery) && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            {carrier && (
              <span className="flex items-center gap-1 font-medium text-gray-800">
                <Truck size={14} className="text-blue-600" />
                {carrier}
              </span>
            )}
            {trackingNumber && (
              <span className="flex items-center gap-1">
                <Tag size={14} className="text-gray-400" />
                <span className="font-mono">{trackingNumber}</span>
              </span>
            )}
            {estimatedDelivery && (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Calendar size={14} />
                Est. Delivery: {new Date(estimatedDelivery).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress Timeline Stepper */}
      <div className="relative py-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex md:flex-col items-center md:items-center text-left md:text-center gap-4 md:gap-2 relative z-10">
                {/* Step Connector Line (Desktop) */}
                {idx < steps.length - 1 && (
                  <div
                    className={`hidden md:block absolute top-5 left-1/2 w-full h-1 -z-10 transition-colors ${
                      idx < currentStepIndex ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  />
                )}

                {/* Step Icon Badge */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-md"
                      : "bg-gray-100 text-gray-400 border border-gray-300"
                  }`}
                >
                  <Icon size={18} />
                </div>

                {/* Step Label & Details */}
                <div className="space-y-0.5">
                  <h4
                    className={`text-sm font-semibold transition ${
                      isCurrent
                        ? "text-blue-600"
                        : isCompleted
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-[180px]">
                    {step.description}
                  </p>
                  {isCurrent && (
                    <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      CURRENT STATUS
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-block mt-1 text-emerald-600 text-[10px] font-semibold">
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrackingTimeline;
