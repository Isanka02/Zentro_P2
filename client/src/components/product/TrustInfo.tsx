import { Truck, Headphones, ShieldCheck } from "lucide-react";
import { formatPrice } from "../../lib/formatPrice";
import { useShippingOptions } from "../../hooks/useShippingOptions";

const TrustInfo = () => {
  const { data: shippingOptions } = useShippingOptions();
  const items = [
    {
      icon: Truck,
      title: "Free delivery",
      desc: shippingOptions
        ? `On orders of ${formatPrice(shippingOptions.freeShippingThreshold)} or more`
        : "Delivery fees shown at checkout",
    },
    { icon: Headphones, title: "Customer support", desc: "Get help with orders and products" },
    { icon: ShieldCheck, title: "Secure checkout", desc: "Your payment is protected" },
  ];

  return (
    <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
      {items.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex items-center gap-3">
          <Icon size={20} className="text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrustInfo;
