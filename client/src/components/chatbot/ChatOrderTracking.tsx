import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Truck, Search, Loader2, AlertCircle, ExternalLink, Calendar, MapPin } from "lucide-react";
import { getMyOrders, trackOrder, type Order, type TrackableOrder } from "../../api/orders";
import { useAuthStore } from "../../store/authStore";
import { getErrorMessage } from "../../lib/errorMessage";

interface ChatOrderTrackingProps {
  onBackToMenu: () => void;
  onContactSupport: () => void;
}

export const ChatOrderTracking = ({ onBackToMenu, onContactSupport }: ChatOrderTrackingProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isLoggedIn = Boolean(user);

  // Logged-in state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(isLoggedIn);
  const [ordersError, setOrdersError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Manual tracking state (for guests or direct lookup)
  const [searchOrderNumber, setSearchOrderNumber] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackableOrder | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [mode, setMode] = useState<"list" | "search">(isLoggedIn ? "list" : "search");

  useEffect(() => {
    if (!isLoggedIn) return;

    let active = true;

    getMyOrders()
      .then((data) => {
        if (active) {
          setOrders(data);
          if (data.length === 0) {
            setMode("search");
          }
        }
      })
      .catch((err) => {
        if (active) {
          setOrdersError(getErrorMessage(err, "Could not load your orders."));
        }
      })
      .finally(() => {
        if (active) setLoadingOrders(false);
      });

    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  const handleManualTrack = async (e: FormEvent) => {
    e.preventDefault();
    const query = searchOrderNumber.trim();
    if (!query) return;

    setTrackingLoading(true);
    setTrackingError("");
    setTrackingResult(null);

    try {
      const result = await trackOrder(query);
      setTrackingResult(result);
    } catch (err) {
      setTrackingError(getErrorMessage(err, "No order found matching that number. Please check the spelling or format."));
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "confirmed":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-3.5 text-sm">
      {/* Bot Prompt */}
      <div className="rounded-xl rounded-tl-sm bg-blue-50 border border-blue-100 p-3 text-gray-800">
        <p className="font-semibold text-blue-950 flex items-center gap-1.5">
          <Package size={16} className="text-blue-700" /> Order Tracking
        </p>
        <p className="mt-1 text-xs text-gray-700">
          {isLoggedIn
            ? "Select one of your recent orders or search by order number to see live fulfillment and courier details."
            : "Enter your Zentro order number below to check its live delivery status, or sign in to view all your past orders."}
        </p>
      </div>

      {/* Mode Switcher for Logged In Users */}
      {isLoggedIn && orders.length > 0 && (
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => {
              setMode("list");
              setSelectedOrder(null);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              mode === "list" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            My Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setMode("search")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              mode === "search" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Search by Number
          </button>
        </div>
      )}

      {/* Logged-in Orders List View */}
      {isLoggedIn && mode === "list" && (
        <div className="space-y-2">
          {loadingOrders ? (
            <div className="flex items-center justify-center p-6 text-gray-500">
              <Loader2 className="animate-spin text-blue-600 mr-2" size={18} />
              <span className="text-xs">Loading your orders...</span>
            </div>
          ) : ordersError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <p className="font-medium flex items-center gap-1">
                <AlertCircle size={14} /> {ordersError}
              </p>
              <button
                type="button"
                onClick={onContactSupport}
                className="mt-2 text-blue-700 font-semibold underline block"
              >
                Contact support for help
              </button>
            </div>
          ) : selectedOrder ? (
            /* Selected Order Details */
            <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                <div>
                  <span className="text-[11px] text-gray-500">Order Number</span>
                  <p className="font-mono text-xs font-bold text-gray-900">{selectedOrder.orderNumber}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="text-gray-400 block text-[10px]">Total Amount</span>
                  <span className="font-semibold text-gray-900">LKR {selectedOrder.total.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Payment</span>
                  <span className="font-medium text-gray-800 capitalize">
                    {selectedOrder.paymentMethod.replace("_", " ")} ({selectedOrder.isPaid ? "Paid" : "Unpaid"})
                  </span>
                </div>
              </div>

              {/* Shipping info */}
              <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg space-y-1">
                <p className="font-medium text-gray-800 flex items-center gap-1">
                  <MapPin size={12} className="text-gray-400" /> Delivery To:
                </p>
                <p className="text-gray-600 text-[11px]">
                  {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.province} Province
                </p>
              </div>

              {/* Courier and tracking if available */}
              {(selectedOrder.carrier || selectedOrder.trackingNumber || selectedOrder.estimatedDelivery) ? (
                <div className="text-xs bg-blue-50/70 border border-blue-100 p-2.5 rounded-lg space-y-1.5">
                  <p className="font-semibold text-blue-900 flex items-center gap-1">
                    <Truck size={13} className="text-blue-700" /> Courier Shipment
                  </p>
                  {selectedOrder.carrier && (
                    <p className="text-[11px] text-gray-700">Carrier: <span className="font-medium">{selectedOrder.carrier}</span></p>
                  )}
                  {selectedOrder.trackingNumber && (
                    <p className="text-[11px] text-gray-700">
                      Tracking No: <span className="font-mono font-medium">{selectedOrder.trackingNumber}</span>
                    </p>
                  )}
                  {selectedOrder.estimatedDelivery && (
                    <p className="text-[11px] text-gray-700 flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" />
                      Estimated delivery: {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}
                    </p>
                  )}
                  {selectedOrder.trackingUrl && (
                    <a
                      href={selectedOrder.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline pt-0.5"
                    >
                      Open tracking link <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 italic">
                  {selectedOrder.status === "pending"
                    ? "Your order is pending confirmation. Courier tracking details will appear once dispatched."
                    : selectedOrder.status === "confirmed"
                    ? "Order confirmed! Package is being prepared for dispatch."
                    : "No external courier details recorded for this order."}
                </p>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${selectedOrder._id}`)}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-1"
                >
                  View Full Order Page
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-1.5 px-3 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  ← Select a different order
                </button>
              </div>
            </div>
          ) : (
            /* List of orders to pick from */
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {orders.slice(0, 5).map((order) => (
                <button
                  key={order._id}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left p-2.5 rounded-lg border border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-semibold text-gray-900 group-hover:text-blue-700 truncate">
                      {order.orderNumber}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span className="font-medium text-gray-800">LKR {order.total.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual / Guest Search View */}
      {(!isLoggedIn || mode === "search") && (
        <div className="space-y-3">
          {!isLoggedIn && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-900">
              <span>Have an account with Zentro?</span>
              <Link
                to="/login"
                className="font-semibold text-blue-700 underline hover:text-blue-900 shrink-0 ml-2"
              >
                Sign in here
              </Link>
            </div>
          )}

          <form onSubmit={handleManualTrack} className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Track by Order Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchOrderNumber}
                onChange={(e) => setSearchOrderNumber(e.target.value)}
                placeholder="e.g. ZNT-..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={trackingLoading || !searchOrderNumber.trim()}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1 shrink-0"
              >
                {trackingLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Track</span>
              </button>
            </div>
          </form>

          {/* Tracking result */}
          {trackingError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <p className="font-medium flex items-center gap-1">
                <AlertCircle size={14} /> {trackingError}
              </p>
            </div>
          ) : trackingResult ? (
            <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between gap-1 border-b border-gray-100 pb-2">
                <span className="font-mono text-xs font-bold text-gray-900">{trackingResult.orderNumber}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${getStatusBadge(trackingResult.status)}`}>
                  {trackingResult.status}
                </span>
              </div>

              {trackingResult.carrier && (
                <p className="text-xs text-gray-700">Courier: <span className="font-medium">{trackingResult.carrier}</span></p>
              )}
              {trackingResult.trackingNumber && (
                <p className="text-xs text-gray-700">
                  Tracking Number: <span className="font-mono font-medium">{trackingResult.trackingNumber}</span>
                </p>
              )}
              {trackingResult.estimatedDelivery && (
                <p className="text-xs text-gray-700">
                  Estimated Delivery: <span className="font-medium">{new Date(trackingResult.estimatedDelivery).toLocaleDateString()}</span>
                </p>
              )}
              {trackingResult.trackingUrl && (
                <a
                  href={trackingResult.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline pt-1"
                >
                  Carrier tracking link <ExternalLink size={12} />
                </a>
              )}
              <Link
                to={`/track/${encodeURIComponent(trackingResult.orderNumber)}`}
                className="mt-2 block w-full text-center py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800 transition"
              >
                Open Full Tracking Timeline
              </Link>
            </div>
          ) : null}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToMenu}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to help topics
        </button>
        <button
          type="button"
          onClick={onContactSupport}
          className="text-xs text-gray-500 hover:text-gray-800 transition"
        >
          Need human support?
        </button>
      </div>
    </div>
  );
};
