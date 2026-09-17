import { CheckCircle, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface OrderInfo {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: "cod" | "bank_transfer";
  createdAt: string;
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderInfo | null>(null);

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("zentro_last_order");

    if (storedOrder) {
      try {
        setOrder(JSON.parse(storedOrder));
      } catch {
        setOrder(null);
      }
    }
  }, []);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Order information not found
        </h1>

        <p className="text-sm text-gray-500 mt-2 mb-6">
          We couldn't find the details of your recent order.
        </p>

        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-blue-700"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const paymentLabel =
    order.paymentMethod === "cod"
      ? "Cash on Delivery"
      : "Bank Transfer";

  const orderDate = new Date(order.createdAt).toLocaleDateString();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center">
        <CheckCircle
          size={56}
          className="mx-auto text-green-500"
        />

        <h1 className="text-2xl font-semibold text-gray-900 mt-4">
          Order Confirmed!
        </h1>

        <p className="text-gray-500 mt-2">
          Thank you for your order. Your order has been placed successfully.
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg mt-8 overflow-hidden">
        <div className="bg-gray-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-gray-600" />

            <h2 className="font-semibold text-gray-900">
              Order Details
            </h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order Number</span>
            <span className="font-medium text-gray-900">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order Date</span>
            <span className="text-gray-900">
              {orderDate}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment Method</span>
            <span className="text-gray-900">
              {paymentLabel}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="capitalize font-medium text-yellow-600">
              {order.status}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-4 flex justify-between">
            <span className="font-semibold text-gray-900">
              Total
            </span>

            <span className="font-semibold text-gray-900">
              LKR {order.total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={() => navigate("/")}
          className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-5 py-3 rounded-md font-medium hover:bg-gray-50"
        >
          <ShoppingBag size={18} />
          Continue Shopping
        </button>

        <button
          onClick={() => navigate("/orders")}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-md font-medium hover:bg-blue-700"
        >
          <Package size={18} />
          View My Orders
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;