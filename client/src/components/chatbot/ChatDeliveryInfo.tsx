import { useEffect, useState } from "react";
import { Truck, Gift, MapPin, CheckCircle2, ChevronDown } from "lucide-react";
import { fetchShippingOptions, type ShippingOptions } from "../../api/shipping";
import { DISTRICTS_BY_PROVINCE } from "../../lib/shippingData";

interface ChatDeliveryInfoProps {
  onBackToMenu: () => void;
  onTrackOrder: () => void;
  onContactSupport: () => void;
}

// Fallback rates if API is unavailable
const DEFAULT_RATES: Record<string, number> = {
  Western: 300,
  Central: 450,
  Southern: 450,
  Northern: 600,
  Eastern: 600,
  "North Western": 450,
  "North Central": 600,
  Uva: 600,
  Sabaragamuwa: 450,
};

export const ChatDeliveryInfo = ({
  onBackToMenu,
  onTrackOrder,
  onContactSupport,
}: ChatDeliveryInfoProps) => {
  const [shippingOptions, setShippingOptions] = useState<ShippingOptions | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>("Western");

  useEffect(() => {
    let active = true;
    fetchShippingOptions()
      .then((opts) => {
        if (active) setShippingOptions(opts);
      })
      .catch(() => {
        // Fallback to static data
      });

    return () => {
      active = false;
    };
  }, []);

  const rates = shippingOptions?.ratesByProvince ?? DEFAULT_RATES;
  const freeThreshold = shippingOptions?.freeShippingThreshold ?? 5000;
  const provinces = shippingOptions?.provinces ?? Object.keys(DEFAULT_RATES);
  const districts = DISTRICTS_BY_PROVINCE[selectedProvince] || [];

  return (
    <div className="space-y-3.5 text-sm">
      {/* Bot Prompt */}
      <div className="rounded-xl rounded-tl-sm bg-blue-50 border border-blue-100 p-3 text-gray-800">
        <p className="font-semibold text-blue-950 flex items-center gap-1.5">
          <Truck size={16} className="text-blue-700" /> Delivery & Shipping
        </p>
        <p className="mt-1 text-xs text-gray-700 leading-relaxed">
          Zentro delivers island-wide across all 9 provinces and 25 districts in Sri Lanka.
        </p>
      </div>

      {/* Free Shipping Banner */}
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-900">
        <Gift size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold">Free Delivery on Orders over LKR {freeThreshold.toLocaleString()}!</p>
          <p className="mt-0.5 text-emerald-700">
            Applicable automatically to all addresses across Sri Lanka at checkout.
          </p>
        </div>
      </div>

      {/* Interactive Province Rate Checker */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <label htmlFor="province-select" className="text-xs font-semibold text-gray-800 flex items-center gap-1">
            <MapPin size={13} className="text-gray-500" /> Check Rates by Province
          </label>
        </div>

        <div className="relative">
          <select
            id="province-select"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {provinces.map((prov) => (
              <option key={prov} value={prov}>
                {prov} Province — LKR {(rates[prov] ?? 0).toLocaleString()}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-2.5 text-gray-400" />
        </div>

        <div className="rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600 space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-gray-700">Standard Delivery Fee:</span>
            <span className="font-bold text-gray-900">LKR {(rates[selectedProvince] ?? 0).toLocaleString()}</span>
          </div>
          <div className="pt-1 border-t border-gray-200/60 text-[11px]">
            <span className="text-gray-500 block mb-0.5">Districts covered:</span>
            <div className="flex flex-wrap gap-1">
              {districts.map((d) => (
                <span key={d} className="rounded-md bg-white border border-gray-200 px-1.5 py-0.5 text-gray-700">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Delivery Facts */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs space-y-2">
        <div className="flex items-start gap-2">
          <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-gray-700">
            <strong className="text-gray-900">Courier Tracking:</strong> Once dispatched, a tracking number and courier tracking link are added to your order.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-gray-700">
            <strong className="text-gray-900">Doorstep Handover:</strong> Pay by cash or show bank confirmation upon courier delivery.
          </p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-col gap-1.5 pt-1">
        <button
          type="button"
          onClick={onTrackOrder}
          className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-center"
        >
          Track an existing package
        </button>
      </div>

      {/* Footer Navigation */}
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
          Contact support
        </button>
      </div>
    </div>
  );
};
