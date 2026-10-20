import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Package, AlertCircle, ShoppingBag } from "lucide-react";
import { trackOrder, type TrackableOrder } from "../api/orders";
import TrackingTimeline from "../components/orders/TrackingTimeline";
import { getErrorMessage } from "../lib/errorMessage";

const OrderTracking = () => {
  const { orderNumber: urlOrderNumber } = useParams<{ orderNumber?: string }>();
  return <OrderTrackingView key={urlOrderNumber ?? "manual-search"} routeOrderNumber={urlOrderNumber ?? ""} />;
};

const OrderTrackingView = ({ routeOrderNumber }: { routeOrderNumber: string }) => {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(routeOrderNumber);
  const orderQuery = useQuery({
    queryKey: ["order-tracking", routeOrderNumber],
    queryFn: () => trackOrder(routeOrderNumber),
    enabled: Boolean(routeOrderNumber),
    retry: false,
  });
  const order = orderQuery.data as TrackableOrder | undefined;
  const loading = orderQuery.isFetching;
  const searched = Boolean(routeOrderNumber);
  const error = orderQuery.isError
    ? getErrorMessage(orderQuery.error, `No order found with number "${routeOrderNumber}".`)
    : "";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/track/${encodeURIComponent(searchInput.trim())}`);
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

          {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">Open courier tracking page</a>}

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <h2 className="font-semibold text-gray-900">Order {order.orderNumber}</h2>
            <p className="mt-2 text-sm text-gray-600">
              Status: <span className="font-medium capitalize">{order.status}</span>
            </p>
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
