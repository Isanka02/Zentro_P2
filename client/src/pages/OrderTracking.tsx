import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Package, MapPin, AlertCircle, ShoppingBag } from "lucide-react";
import { trackOrder, type Order } from "../api/orders";
import TrackingTimeline from "../components/orders/TrackingTimeline";

const OrderTracking = () => {
  const { orderNumber: urlOrderNumber } = useParams<{ orderNumber?: string }>();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(urlOrderNumber || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleTrack = async (num: string) => {
    const trimmed = num.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const data = await trackOrder(trimmed);
      setOrder(data);
    } catch (err: any) {
      setOrder(null);
      setError(err?.response?.data?.message || `No order found with number "${trimmed}".`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlOrderNumber) {
      setSearchInput(urlOrderNumber);
      handleTrack(urlOrderNumber);
    }
  }, [urlOrderNumber]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/track/${encodeURIComponent(searchInput.trim())}`);
      handleTrack(searchInput.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header & Search Bar */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg text-center space-y-4">
        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto">
          <Package size={30} className="text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Track Your Package</h1>
        <p className="text-blue-100 text-sm max-w-md mx-auto">
          Enter your Zentro Order Number (e.g. ZNT-17267598-4821) to check live shipping progress.
        </p>

        {/* Search Form */}
        <form onSubmit={onSubmit} className="max-w-xl mx-auto pt-2 flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Order Number (e.g. ZNT-...)"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchInput.trim()}
            className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Searching..." : "Track"}
          </button>
        </form>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center space-y-3">
          <AlertCircle size={44} className="mx-auto text-red-500" />
          <h3 className="font-semibold text-gray-900 text-lg">Order Not Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">{error}</p>
          <p className="text-xs text-gray-400">
            Please make sure you entered the complete Order Number as displayed on your receipt.
          </p>
        </div>
      )}

      {/* Tracked Order View */}
      {!loading && order && (
        <div className="space-y-6">
          {/* Tracking Timeline Visual */}
          <TrackingTimeline
            status={order.status}
            carrier={order.carrier}
            trackingNumber={order.trackingNumber}
            estimatedDelivery={order.estimatedDelivery}
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
          />

          {/* Shipping & Delivery Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm border-b border-gray-100 pb-3">
                <MapPin size={18} className="text-blue-600" />
                Delivery Destination
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
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm border-b border-gray-100 pb-3">
                <Package size={18} className="text-blue-600" />
                Package Summary
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Items Count</span>
                  <span className="font-semibold text-gray-900">{order.items.length} item(s)</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Payment Method</span>
                  <span className="capitalize font-medium text-gray-900">{order.paymentMethod.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-900 text-sm">Total Paid</span>
                  <span className="font-bold text-blue-600 text-sm">LKR {order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Preview */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-xs">
            <h3 className="font-semibold text-gray-900 text-sm">Items in this Package</h3>
            <div className="divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || "https://placehold.co/100x100?text=Product"}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{item.name}</p>
                      <p className="text-[11px] text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">
                    LKR {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Initial Empty Search Prompt */}
      {!loading && !searched && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Ready to Track</h2>
          <p className="text-xs text-gray-500">
            Enter your order number above to get up-to-date tracking and courier status details.
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
