import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Truck, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { fetchBankTransferInstructions, type BankTransferInstructions } from "../../api/payments";

interface ChatPaymentHelpProps {
  onBackToMenu: () => void;
  onContactSupport: () => void;
}

export const ChatPaymentHelp = ({ onBackToMenu, onContactSupport }: ChatPaymentHelpProps) => {
  const navigate = useNavigate();
  const [bankDetails, setBankDetails] = useState<BankTransferInstructions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchBankTransferInstructions()
      .then((data) => {
        if (active) setBankDetails(data);
      })
      .catch(() => {
        if (active) setBankDetails(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-3.5 text-sm">
      {/* Bot Prompt */}
      <div className="rounded-xl rounded-tl-sm bg-blue-50 border border-blue-100 p-3 text-gray-800">
        <p className="font-semibold text-blue-950 flex items-center gap-1.5">
          <Landmark size={16} className="text-blue-700" /> Accepted Payment Methods
        </p>
        <p className="mt-1 text-xs text-gray-700 leading-relaxed">
          Zentro offers secure local payment methods for customers across Sri Lanka.
        </p>
      </div>

      {/* Methods List */}
      <div className="space-y-2.5">
        {/* Cash on Delivery */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-900">
              <Truck size={16} className="text-blue-600" />
              <span>Cash on Delivery (COD)</span>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Pay in cash directly to the delivery courier when your parcel arrives at your address. Available nationwide.
          </p>
        </div>

        {/* Bank Transfer */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-900">
              <Landmark size={16} className="text-indigo-600" />
              <span>Direct Bank Transfer</span>
            </div>
            {loading ? (
              <Loader2 size={13} className="animate-spin text-gray-400" />
            ) : bankDetails?.configured ? (
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                Active
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                Unavailable
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-xs text-gray-500">Checking bank transfer availability...</p>
          ) : bankDetails?.configured ? (
            <div className="space-y-1.5 text-xs text-gray-700">
              <p className="leading-relaxed">
                Transfer funds directly to Zentro’s account. Always include your <span className="font-semibold text-gray-900">Order Number</span> as the payment reference.
              </p>
              <div className="rounded-lg bg-gray-50 p-2 text-[11px] font-mono space-y-0.5 border border-gray-200">
                <p><span className="text-gray-500 font-sans">Bank:</span> {bankDetails.bankName}</p>
                <p><span className="text-gray-500 font-sans">Account:</span> {bankDetails.accountName}</p>
                <p><span className="text-gray-500 font-sans">Account No:</span> {bankDetails.accountNumber}</p>
                {bankDetails.branch && <p><span className="text-gray-500 font-sans">Branch:</span> {bankDetails.branch}</p>}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900 space-y-1">
              <p className="font-medium flex items-center gap-1">
                <AlertCircle size={13} className="text-amber-700" /> Temporarily Unavailable
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Bank transfer instructions are currently being configured by store management. Please select Cash on Delivery during checkout.
              </p>
            </div>
          )}
        </div>

        {/* Online Cards Disclaimer */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <CreditCard size={15} className="text-gray-500" />
            <span>Online Card Payments</span>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-600">
            Online credit/debit card gateways and digital wallets are not yet supported. All transactions are handled securely through Cash on Delivery or Bank Transfer.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-center"
        >
          View My Cart & Proceed to Checkout
        </button>
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
