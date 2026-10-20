import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCartStore } from "../store/cartStore";
import { useCheckoutStore } from "../store/checkoutStore";

import type { ShippingInfo } from "../store/checkoutStore";

import ShippingForm from "../components/checkout/ShippingForm";
import CheckoutSummary from "../components/checkout/CheckoutSummary";
import PaymentMethodSelector from "../components/checkout/PaymentMethodSelector";

import { createOrder } from "../api/orders";
import { getErrorMessage } from "../lib/errorMessage";
import { useAuthStore } from "../store/authStore";

const Checkout = () => {
  const navigate = useNavigate();
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const checkoutOwnerId = useAuthStore((state) => state.user?.id ?? "guest");

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
  const requestInFlight = useRef(false);
  const attemptRef = useRef<{ identity: string; key: string } | null>(null);

  const getCheckoutRequestKey = async (identity: string) => {
    const inMemoryAttempt = attemptRef.current;
    if (inMemoryAttempt?.identity === identity) return inMemoryAttempt.key;

    let identityDigest: string | null = null;
    if (globalThis.crypto?.subtle) {
      try {
        const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
        identityDigest = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      } catch {
        // Continue with an in-memory request key if Web Crypto is unavailable.
      }
    }

    if (identityDigest) {
      try {
        const stored = JSON.parse(sessionStorage.getItem("zentro_checkout_attempt") ?? "null") as { identityDigest?: string; key?: string } | null;
        if (stored?.identityDigest === identityDigest && typeof stored.key === "string" && /^[A-Za-z0-9_-]{16,100}$/.test(stored.key)) {
          attemptRef.current = { identity, key: stored.key };
          return stored.key;
        }
      } catch {
        // Session storage can be unavailable; the in-memory attempt still protects retries on this page.
      }
    }

    const key = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    attemptRef.current = { identity, key };
    if (identityDigest) {
      try {
        sessionStorage.setItem("zentro_checkout_attempt", JSON.stringify({ identityDigest, key }));
      } catch {
        // Keep the request key in memory when browser storage is unavailable.
      }
    }
    return key;
  };

  if (isAuthLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-sm text-gray-500">Checking your account...</div>;
  }

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
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setShippingInfo(info);
    setOrderError("");
    setIsPlacingOrder(true);

    try {
      const checkoutIdentity = JSON.stringify({
        ownerId: checkoutOwnerId,
        items: items.map(({ productId, variantId, quantity, price }) => ({ productId, variantId, quantity, expectedPrice: price })).sort((left, right) => `${left.productId}:${left.variantId ?? ""}`.localeCompare(`${right.productId}:${right.variantId ?? ""}`)),
        shippingAddress: info,
        paymentMethod,
        discountCode: discount?.code ?? "",
      });
      const idempotencyKey = await getCheckoutRequestKey(checkoutIdentity);
      const result = await createOrder(
        items,
        info,
        paymentMethod,
        discount?.code,
        idempotencyKey
      );

      // Clear cart only after successful order creation
      clearCart();
      attemptRef.current = null;
      try {
        sessionStorage.removeItem("zentro_checkout_attempt");
      } catch {
        // The completed order is already stored by the server.
      }

      // Router state carries the confirmation through even when browser storage is blocked.
      try {
        sessionStorage.setItem("zentro_last_order", JSON.stringify({ order: result.order, ownerId: result.order.ownerId }));
      } catch {
        // The order is already saved by the API; storage is only a reload fallback.
      }
      navigate("/order-confirmation", { state: { order: result.order, ownerId: result.order.ownerId } });
    } catch (error: unknown) {
      setOrderError(getErrorMessage(error, "Something went wrong while placing your order."));
    } finally {
      setIsPlacingOrder(false);
      requestInFlight.current = false;
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
          isSubmitting={isPlacingOrder}
        />
      </div>
    </div>
  );
};

export default Checkout;
