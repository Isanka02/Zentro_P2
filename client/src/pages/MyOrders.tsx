import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ChevronRight, ShoppingBag, Clock, CheckCircle2, Truck, AlertCircle, XCircle } from "lucide-react";
import { getMyOrders, type Order } from "../api/orders";

const statusConfig: Record<Order["status"], { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  shipped: { label: "Shipped", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = filter === "all"
    ? orders
    : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded-full w-24"></div>
              </div>
              <div className="h-16 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Failed to Load Orders</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">{error}</p>
        <button
          onClick={fetchOrders}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            View and track your previous purchases
          </p>
        </div>

        {orders.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-full capitalize font-medium transition ${
                  filter === st
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {filter === "all" ? "No orders found" : `No ${filter} orders`}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {filter === "all"
              ? "You haven't placed any orders yet. Explore our products and discover something great!"
              : `You don't have any orders with status "${filter}".`}
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <ShoppingBag size={18} />
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const StatusIcon = statusConfig[order.status]?.icon || Clock;

            return (
              <div
                key={order._id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition shadow-xs"
              >
                {/* Header */}
                <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 text-sm">
                      {order.orderNumber}
                    </span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      statusConfig[order.status]?.color
                    }`}
                  >
                    <StatusIcon size={14} />
                    {statusConfig[order.status]?.label || order.status}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Items Preview */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 overflow-x-auto py-1">
                      {order.items.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="relative flex-shrink-0">
                          <img
                            src={item.image || "https://placehold.co/100x100?text=Product"}
                            alt={item.name}
                            className="w-14 h-14 object-cover rounded-md border border-gray-200"
                          />
                          {item.quantity > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-14 h-14 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                          +{order.items.length - 4} more
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>

                  {/* Summary & Details CTA */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-gray-500 block">Total Amount</span>
                      <span className="text-base font-bold text-gray-900">
                        LKR {order.total.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <Link
                        to={`/track/${encodeURIComponent(order.orderNumber)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-md transition"
                      >
                        <Truck size={13} />
                        Track
                      </Link>

                      <Link
                        to={`/orders/${order._id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        View Details
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
