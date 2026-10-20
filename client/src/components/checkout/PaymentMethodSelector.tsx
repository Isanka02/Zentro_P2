import { useEffect, useState } from "react";
import { Truck, Landmark } from "lucide-react";
import type { PaymentMethod } from "../../store/checkoutStore";
import { fetchBankTransferInstructions } from "../../api/payments";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const PaymentMethodSelector = ({ value, onChange }: PaymentMethodSelectorProps) => {
  const [bankTransferAvailable, setBankTransferAvailable] = useState(false);
  const [checkingBankTransfer, setCheckingBankTransfer] = useState(true);

  useEffect(() => {
    let active = true;
    fetchBankTransferInstructions()
      .then((details) => {
        if (active) setBankTransferAvailable(details.configured);
      })
      .catch(() => {
        if (active) setBankTransferAvailable(false);
      })
      .finally(() => {
        if (active) setCheckingBankTransfer(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!checkingBankTransfer && !bankTransferAvailable && value === "bank_transfer") {
      onChange("cod");
    }
  }, [bankTransferAvailable, checkingBankTransfer, onChange, value]);

  const options: { id: PaymentMethod; label: string; description: string; icon: typeof Truck; disabled?: boolean }[] = [
    {
      id: "cod",
      label: "Cash on Delivery",
      description: "Pay in cash when your order arrives",
      icon: Truck,
    },
    {
      id: "bank_transfer",
      label: "Bank Transfer",
      description: checkingBankTransfer
        ? "Checking availability..."
        : bankTransferAvailable
          ? "Transfer to the Zentro account; use your order number as the reference"
          : "Temporarily unavailable",
      icon: Landmark,
      disabled: checkingBankTransfer || !bankTransferAvailable,
    },
  ];

  return (
    <div>
      <h2 className="mb-3 font-semibold text-gray-900">Payment Method</h2>
      <div className="space-y-2">
        {options.map(({ id, label, description, icon: Icon, disabled }) => (
          <label
            key={id}
            className={`flex items-start gap-3 rounded-md border p-3 ${
              disabled
                ? "cursor-not-allowed border-gray-200 opacity-50"
                : value === id
                  ? "cursor-pointer border-blue-600 bg-blue-50"
                  : "cursor-pointer border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={value === id}
              disabled={disabled}
              onChange={() => onChange(id)}
              className="mt-1"
            />
            <Icon size={18} className="mt-0.5 shrink-0 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;