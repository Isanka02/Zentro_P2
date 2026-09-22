import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
} from "lucide-react";
import { getOrderById, type Order } from "../api/orders";
import TrackingTimeline from "../components/orders/TrackingTimeline";

const statusConfig: Record<
  Order["status"],
  { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  shipped: { label: "Shipped", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getOrderById(id);
        setOrder(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="h-40 bg-gray-100 rounded animate-pulse"></div>
          <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">{error || "We couldn't find the requested order."}</p>
        <button
          onClick={() => navigate("/orders")}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Back to My Orders
        </button>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const paymentMethodLabel =
    order.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition"
      >
        <ArrowLeft size={16} />
        Back to My Orders
      </Link>

      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                statusConfig[order.status]?.color
              }`}
            >
              <StatusIcon size={14} />
              {statusConfig[order.status]?.label || order.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
            <span className="text-xs text-gray-500 block">Total Paid / Payable</span>
            <span className="text-xl font-bold text-blue-600">
              LKR {order.total.toLocaleString()}
            </span>
          </div>

          <Link
            to={`/track/${encodeURIComponent(order.orderNumber)}`}
            className="hidden sm:inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg text-xs font-semibold transition"
          >
            <Truck size={15} />
            Track Package
          </Link>
        </div>
      </div>

      {/* Visual Tracking Progress Timeline */}
      <TrackingTimeline
        status={order.status}
        carrier={order.carrier}
        trackingNumber={order.trackingNumber}
        estimatedDelivery={order.estimatedDelivery}
        createdAt={order.createdAt}
        updatedAt={order.updatedAt}
      />

      {/* Tracking Info if available */}
      {(order.trackingNumber || order.carrier) && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 flex items-start gap-4">
          <Truck size={24} className="text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900 text-sm">Tracking Information</h3>
            <p className="text-xs text-purple-700 mt-1">
              Carrier: <span className="font-medium">{order.carrier || "Standard Courier"}</span>
              {order.trackingNumber && (
                <>
                  {" "}
                  | Tracking #: <span className="font-mono font-medium">{order.trackingNumber}</span>
                </>
              )}
            </p>
            {order.estimatedDelivery && (
              <p className="text-xs text-purple-700 mt-0.5">
                Estimated Delivery:{" "}
                <span className="font-medium">
                  {new Date(order.estimatedDelivery).toLocaleDateString()}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Items Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Package size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">Order Items</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {order.items.map((item, idx) => (
            <div key={idx} className="p-5 flex items-center gap-4">
              <img
                src={item.image || "https://placehold.co/100x100?text=Product"}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm truncate">{item.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  LKR {item.price.toLocaleString()} x {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900 text-sm">
                  LKR {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid for Address, Payment & Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-3">
            <MapPin size={18} className="text-blue-600" />
            Shipping Address
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-900 text-sm">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.address}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.district}
            </p>
            <p>
              {order.shippingAddress.province}, {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
            <div className="pt-2 border-t border-gray-100 space-y-0.5 text-gray-500">
              <p>Phone: {order.shippingAddress.phone}</p>
              <p>Email: {order.shippingAddress.email}</p>
            </div>
          </div>
        </div>

        {/* Payment & Breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-3">
            <CreditCard size={18} className="text-blue-600" />
            Payment & Summary
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Payment Method</span>
              <span className="font-medium text-gray-900">{paymentMethodLabel}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Payment Status</span>
              <span
                className={`font-medium ${
                  order.isPaid ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {order.isPaid ? "Paid" : "Payment Pending"}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-2 flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>LKR {order.subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Shipping Fee</span>
              <span>
                {order.shippingCost === 0
                  ? "FREE"
                  : `LKR ${order.shippingCost.toLocaleString()}`}
              </span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  Discount ({order.discountCode || "Promo"})
                </span>
                <span>- LKR {order.discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-sm font-bold text-gray-900">
              <span>Total</span>
              <span className="text-blue-600 text-base">
                LKR {order.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
