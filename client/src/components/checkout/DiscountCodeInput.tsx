import { useState } from "react";
import { Tag, X } from "lucide-react";
import { validateDiscountCode } from "../../api/discounts";
import type { DiscountValidation } from "../../api/discounts";

interface DiscountCodeInputProps {
  subtotal: number;
  appliedDiscount: DiscountValidation | null;
  onApply: (discount: DiscountValidation) => void;
  onRemove: () => void;
}

const DiscountCodeInput = ({ subtotal, appliedDiscount, onApply, onRemove }: DiscountCodeInputProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    setError("");
    setIsChecking(true);
    try {
      const result = await validateDiscountCode(code.trim(), subtotal);
      onApply(result);
      setCode("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not apply this code");
    } finally {
      setIsChecking(false);
    }
  };

  if (appliedDiscount) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm">
        <span className="flex items-center gap-1.5 text-green-700 font-medium">
          <Tag size={14} />
          {appliedDiscount.code} applied
        </span>
        <button onClick={onRemove} className="text-green-700 hover:text-green-900">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Discount code"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleApply}
          disabled={isChecking || !code.trim()}
          className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-40"
        >
          {isChecking ? "Checking..." : "Apply"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default DiscountCodeInput;