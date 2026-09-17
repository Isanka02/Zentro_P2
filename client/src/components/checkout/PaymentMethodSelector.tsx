import { Truck, Landmark } from "lucide-react";
import type { PaymentMethod } from "../../store/checkoutStore";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const OPTIONS: { id: PaymentMethod; label: string; description: string; icon: typeof Truck }[] = [
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay in cash when your order arrives",
    icon: Truck,
  },
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    description: "Transfer to our account, order ships once confirmed",
    icon: Landmark,
  },
];

const PaymentMethodSelector = ({ value, onChange }: PaymentMethodSelectorProps) => {
  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-3">Payment Method</h2>
      <div className="space-y-2">
        {OPTIONS.map(({ id, label, description, icon: Icon }) => (
          <label
            key={id}
            className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer ${
              value === id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={value === id}
              onChange={() => onChange(id)}
              className="mt-1"
            />
            <Icon size={18} className="text-gray-500 mt-0.5 shrink-0" />
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