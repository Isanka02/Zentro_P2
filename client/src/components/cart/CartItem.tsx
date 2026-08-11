import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { formatPrice } from "../../lib/formatPrice";
import type { CartItem as CartItemType } from "../../store/cartStore";

const FALLBACK = "https://placehold.co/100x100?text=No+Image";

const CartItem = ({ item }: { item: CartItemType }) => {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-4 py-4 border-b border-gray-200">
      <Link to={`/products/${item.productId}`} className="shrink-0">
        <img
          src={item.image || FALLBACK}
          alt={item.name}
          className="w-20 h-20 rounded-md object-cover border border-gray-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK;
          }}
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/products/${item.productId}`}>
          <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2">
            {item.name}
          </h3>
        </Link>
        {item.sellerName && <p className="text-xs text-gray-500 mt-0.5">{item.sellerName}</p>}
        <p className="text-sm font-semibold text-gray-900 mt-1">{formatPrice(item.price)}</p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className="p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            onClick={() => removeItem(item.productId)}
            className="text-gray-400 hover:text-red-500 p-1"
            aria-label="Remove item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;