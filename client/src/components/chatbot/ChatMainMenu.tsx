import { Package, Truck, RotateCcw, Landmark, ShoppingBag, LifeBuoy, ChevronRight } from "lucide-react";

export type ChatTopic =
  | "menu"
  | "orders"
  | "delivery"
  | "returns"
  | "payment"
  | "products"
  | "support";

interface ChatMainMenuProps {
  onSelectTopic: (topic: ChatTopic) => void;
  userName?: string;
}

const MENU_OPTIONS: {
  id: ChatTopic;
  title: string;
  description: string;
  icon: typeof Package;
  badge?: string;
}[] = [
  {
    id: "orders",
    title: "Track my order",
    description: "Check current fulfillment, courier & tracking details",
    icon: Package,
  },
  {
    id: "delivery",
    title: "Delivery information",
    description: "Shipping rates, delivery areas & free shipping threshold",
    icon: Truck,
  },
  {
    id: "returns",
    title: "Returns and refunds",
    description: "Delivered order return process & cancellation rules",
    icon: RotateCcw,
  },
  {
    id: "payment",
    title: "Payment help",
    description: "Cash on Delivery & Bank Transfer availability",
    icon: Landmark,
  },
  {
    id: "products",
    title: "Product questions",
    description: "Search live products, categories & featured items",
    icon: ShoppingBag,
  },
  {
    id: "support",
    title: "Contact support",
    description: "Connect with the Zentro team for personalized help",
    icon: LifeBuoy,
  },
];

export const ChatMainMenu = ({ onSelectTopic, userName }: ChatMainMenuProps) => {
  return (
    <div className="space-y-4">
      {/* Bot Greeting Bubble */}
      <div className="rounded-2xl rounded-tl-sm bg-blue-50 border border-blue-100 p-3.5 text-sm text-gray-800 shadow-xs">
        <p className="font-semibold text-blue-950">
          Hello{userName ? `, ${userName}` : ""}! 👋
        </p>
        <p className="mt-1 text-gray-700 leading-relaxed">
          Welcome to Zentro shopping help. What do you need help with today?
        </p>
      </div>

      {/* Clickable Topics */}
      <div className="space-y-2" role="menu" aria-label="Help topics">
        {MENU_OPTIONS.map(({ id, title, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="menuitem"
            onClick={() => onSelectTopic(id)}
            className="w-full flex items-center justify-between gap-3 p-3 text-left rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 hover:shadow-xs transition group focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition truncate">
                  {title}
                </p>
                <p className="text-xs text-gray-500 group-hover:text-gray-600 transition truncate">
                  {description}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 shrink-0 transition" />
          </button>
        ))}
      </div>
    </div>
  );
};
