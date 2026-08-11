import { Link } from "react-router-dom";
import { formatPrice } from "../../lib/formatPrice";

interface OrderSummaryProps {
  subtotal: number;
}

const SHIPPING_FLAT = 350;
const FREE_SHIPPING_THRESHOLD = 5000;
const TAX_RATE = 0.0; // no tax logic yet — deferred to checkout day

const OrderSummary = ({ subtotal }: OrderSummaryProps) => {
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FLAT;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 h-fit">
      <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>{formatPrice(tax)}</span>
        </div>
      </div>

      <div className="border-t border-gray-300 mt-3 pt-3 flex justify-between font-semibold text-gray-900">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      <Link
        to="/checkout"
        className={`block text-center w-full mt-5 bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors ${
          subtotal === 0 ? "pointer-events-none opacity-40" : ""
        }`}
      >
        Proceed to checkout
      </Link>

      <Link
        to="/"
        className="block text-center w-full mt-2 text-sm text-blue-600 hover:underline"
      >
        Continue shopping
      </Link>
    </div>
  );
};

export default OrderSummary;