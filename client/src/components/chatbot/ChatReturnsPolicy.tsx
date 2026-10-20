import { Link, useNavigate } from "react-router-dom";
import { RotateCcw, CheckCircle2, PackageCheck, Ban } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

interface ChatReturnsPolicyProps {
  onBackToMenu: () => void;
  onContactSupport: () => void;
}

export const ChatReturnsPolicy = ({ onBackToMenu, onContactSupport }: ChatReturnsPolicyProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isLoggedIn = Boolean(user);

  return (
    <div className="space-y-3.5 text-sm">
      {/* Bot Prompt */}
      <div className="rounded-xl rounded-tl-sm bg-blue-50 border border-blue-100 p-3 text-gray-800">
        <p className="font-semibold text-blue-950 flex items-center gap-1.5">
          <RotateCcw size={16} className="text-blue-700" /> Returns & Refunds Policy
        </p>
        <p className="mt-1 text-xs text-gray-700 leading-relaxed">
          Here is how returns, refunds, and order cancellations work in Zentro.
        </p>
      </div>

      {/* Rules Accordion / Cards */}
      <div className="space-y-2.5">
        {/* Delivered Orders Return */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-900">
            <PackageCheck size={16} className="text-emerald-600" />
            <span>Returns on Delivered Orders</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            You can request a return on any order once its status is <span className="font-semibold text-gray-800">Delivered</span>. Open the order in your account and submit the return form.
          </p>
          <div className="bg-gray-50 rounded-lg p-2 text-[11px] text-gray-600 space-y-1">
            <p className="font-medium text-gray-700">Accepted Return Reasons:</p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-600">
              <li>Item arrived damaged</li>
              <li>Wrong item received</li>
              <li>Item differs from description</li>
              <li>Other valid reason with explanation</li>
            </ul>
          </div>
        </div>

        {/* Pickup & Refund Process */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-900">
            <CheckCircle2 size={16} className="text-blue-600" />
            <span>Courier Pickup & Refund</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            After Zentro approves your request, a return courier pickup will be scheduled. Once the item is received and inspected at our warehouse, an administrator records your refund via cash or bank transfer.
          </p>
        </div>

        {/* Cancellation Notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-1.5 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <Ban size={15} className="text-amber-700" />
            <span>Order Cancellation Policy</span>
          </div>
          <p className="leading-relaxed">
            Orders can be cancelled directly from your order page while still in <span className="font-semibold">Pending</span> status (before shipment). Once shipped, orders cannot be cancelled and must go through the return process after delivery.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-center"
          >
            Go to My Orders to Request a Return
          </button>
        ) : (
          <div className="rounded-lg bg-gray-50 p-2.5 text-center space-y-1.5 border border-gray-200">
            <p className="text-xs text-gray-600">Sign in to your Zentro account to request a return on a delivered order.</p>
            <Link
              to="/login"
              className="inline-block py-1.5 px-3 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Sign In to View Orders
            </Link>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToMenu}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to help topics
        </button>
        <button
          type="button"
          onClick={onContactSupport}
          className="text-xs text-gray-500 hover:text-gray-800 transition"
        >
          Contact support
        </button>
      </div>
    </div>
  );
};
