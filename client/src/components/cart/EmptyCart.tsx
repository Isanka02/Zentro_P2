import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

const EmptyCart = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShoppingCart size={48} className="text-gray-300 mb-3" />
      <h2 className="text-lg font-medium text-gray-900">Your cart is empty</h2>
      <p className="text-gray-500 text-sm mt-1 mb-5">Looks like you haven't added anything yet.</p>
      <Link
        to="/"
        className="bg-blue-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-blue-700"
      >
        Start shopping
      </Link>
    </div>
  );
};

export default EmptyCart;