import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  onChange: (qty: number) => void;
  max: number;
}

const QuantitySelector = ({ quantity, onChange, max }: QuantitySelectorProps) => {
  return (
    <div className="flex items-center border border-gray-300 rounded-md w-fit">
      <button
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
      >
        <Minus size={16} />
      </button>
      <span className="w-10 text-center text-sm font-medium">{quantity}</span>
      <button
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default QuantitySelector;