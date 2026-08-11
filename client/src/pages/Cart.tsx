import { useCartStore } from "../store/cartStore";
import CartItem from "../components/cart/CartItem";
import OrderSummary from "../components/cart/OrderSummary";
import EmptyCart from "../components/cart/EmptyCart";

const Cart = () => {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Shopping Cart <span className="text-gray-400 font-normal">({items.length})</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
        </div>

        <OrderSummary subtotal={subtotal} />
      </div>
    </div>
  );
};

export default Cart;