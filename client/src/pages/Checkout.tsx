import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCartStore } from "../store/cartStore";
import { useCheckoutStore } from "../store/checkoutStore";

import type { ShippingInfo } from "../store/checkoutStore";

import ShippingForm from "../components/checkout/ShippingForm";
import CheckoutSummary from "../components/checkout/CheckoutSummary";
import PaymentMethodSelector from "../components/checkout/PaymentMethodSelector";

import { createOrder } from "../api/orders";

const Checkout = () => {
  const navigate = useNavigate();

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);

  const {
    shippingInfo,
    setShippingInfo,
    discount,
    setDiscount,
    paymentMethod,
    setPaymentMethod,
  } = useCheckoutStore();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-lg font-medium text-gray-900">
          Your cart is empty
        </h2>

        <p className="text-gray-500 text-sm mt-1 mb-4">
          Add something to your cart before checking out.
        </p>

        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-blue-700"
        >
          Start shopping
        </button>
      </div>
    );
  }

  const handleShippingChange = (info: ShippingInfo) => {
    setShippingInfo(info);
    setOrderError("");
  };

  const handlePlaceOrder = async (info: ShippingInfo) => {
    setShippingInfo(info);
    setOrderError("");
    setIsPlacingOrder(true);

    try {
      const result = await createOrder(
        items,
        info,
        paymentMethod,
        discount?.code
      );

      // Clear cart only after successful order creation
      clearCart();

      // Temporarily save order information
      // for the confirmation page.
      sessionStorage.setItem(
        "zentro_last_order",
        JSON.stringify(result.order)
      );

      navigate("/order-confirmation");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Something went wrong while placing your order.";

      setOrderError(message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Checkout
      </h1>

      {orderError && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {orderError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <ShippingForm
            initialValues={shippingInfo}
            onChange={handleShippingChange}
            onSubmit={handlePlaceOrder}
          />

          <PaymentMethodSelector
            value={paymentMethod}
            onChange={setPaymentMethod}
          />

          {isPlacingOrder && (
            <p className="text-sm text-gray-500">
              Placing your order...
            </p>
          )}
        </div>

        <CheckoutSummary
          items={items}
          subtotal={subtotal}
          province={shippingInfo.province}
          discount={discount}
          onApplyDiscount={setDiscount}
          onRemoveDiscount={() => setDiscount(null)}
        />
      </div>
    </div>
  );
};

export default Checkout;