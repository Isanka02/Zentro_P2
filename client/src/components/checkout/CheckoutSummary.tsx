import { formatPrice } from "../../lib/formatPrice";
import { calculateShipping, FREE_SHIPPING_THRESHOLD } from "../../lib/shippingData";
import type { Province } from "../../lib/shippingData";
import type { CartItem } from "../../store/cartStore";
import type { DiscountValidation } from "../../api/discounts";
import DiscountCodeInput from "./DiscountCodeInput";

interface CheckoutSummaryProps {
  items: CartItem[];
  subtotal: number;
  province: Province | "";
  discount: DiscountValidation | null;
  onApplyDiscount: (discount: DiscountValidation) => void;
  onRemoveDiscount: () => void;
}

const CheckoutSummary = ({
  items,
  subtotal,
  province,
  discount,
  onApplyDiscount,
  onRemoveDiscount,
}: CheckoutSummaryProps) => {
  const shipping = calculateShipping(province, subtotal);
  const discountAmount = discount?.discountAmount ?? 0;
  const tax = 0;
  const total = Math.max(0, subtotal + shipping + tax - discountAmount);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 h-fit">
      <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>

      <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span className="text-gray-600 truncate pr-2">
              {item.name} <span className="text-gray-400">× {item.quantity}</span>
            </span>
            <span className="text-gray-900 shrink-0">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <DiscountCodeInput
          subtotal={subtotal}
          appliedDiscount={discount}
          onApply={onApplyDiscount}
          onRemove={onRemoveDiscount}
        />
      </div>

      <div className="border-t border-gray-300 pt-3 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span>{!province ? "Select province" : shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>{formatPrice(tax)}</span>
        </div>
      </div>

      {subtotal < FREE_SHIPPING_THRESHOLD && (
        <p className="text-xs text-blue-600 mt-2">
          Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
        </p>
      )}

      <div className="border-t border-gray-300 mt-3 pt-3 flex justify-between font-semibold text-gray-900">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      <button
        type="submit"
        form="shipping-form"
        className="w-full mt-5 bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
      >
        Place order
      </button>
    </div>
  );
};

export default CheckoutSummary;