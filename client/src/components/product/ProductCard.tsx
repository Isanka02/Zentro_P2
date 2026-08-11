import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import type { Product } from "../../api/products";
import { formatPrice } from "../../lib/formatPrice";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product._id));

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const isNew = Date.now() - new Date(product.createdAt).getTime() < 14 * 24 * 60 * 60 * 1000;
  const isTopRated = product.rating >= 4.5 && product.numReviews > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product._id,
      name: product.name,
      image: product.images[0] || "",
      price: hasDiscount ? product.discountPrice! : product.price,
      stock: product.stock,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product._id);
  };

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={handleWishlistToggle}
        className={`absolute top-2 right-2 z-10 bg-white rounded-full p-1.5 shadow-sm ${
          isWishlisted ? "text-red-500" : "hover:text-red-500"
        }`}
        aria-label="Toggle wishlist"
      >
        <Heart size={16} className={isWishlisted ? "fill-red-500" : ""} />
      </button>

      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {hasDiscount && (
          <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded">
            {Math.round(100 - (product.discountPrice! / product.price) * 100)}% OFF
          </span>
        )}
        {isNew && (
          <span className="bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded">NEW</span>
        )}
        {isTopRated && (
          <span className="bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded">TOP RATED</span>
        )}
      </div>

      <Link to={`/products/${product._id}`}>
        <div className="aspect-square bg-gray-100 overflow-hidden">
          <img
            src={product.images[0] || "https://placehold.co/400x400?text=No+Image"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image";
            }}
          />
        </div>
      </Link>

      <div className="p-3">
        <Link to={`/products/${product._id}`}>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600">
            {product.name}
          </h3>
        </Link>

        {product.numReviews > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-xs text-gray-500">
              {product.rating.toFixed(1)} ({product.numReviews})
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="font-semibold text-gray-900">
            {formatPrice(hasDiscount ? product.discountPrice! : product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        <p className="text-xs mt-1">
          {product.stock > 0 ? (
            <span className="text-green-600">In stock</span>
          ) : (
            <span className="text-red-500">Out of stock</span>
          )}
        </p>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full mt-2 bg-blue-600 text-white text-sm py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;