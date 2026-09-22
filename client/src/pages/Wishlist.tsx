import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, ShoppingCart, Star, ArrowLeft } from "lucide-react";
import { useWishlistStore } from "../store/wishlistStore";
import { useCartStore } from "../store/cartStore";
import { fetchProductById, type Product } from "../api/products";
import { formatPrice } from "../lib/formatPrice";

const Wishlist = () => {
  const navigate = useNavigate();
  const { productIds, toggleWishlist } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlistProducts = async () => {
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetched = await Promise.all(
          productIds.map(async (id) => {
            try {
              return await fetchProductById(id);
            } catch {
              return null;
            }
          })
        );
        setProducts(fetched.filter((p): p is Product => p !== null));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadWishlistProducts();
  }, [productIds]);

  const handleAddToCart = (product: Product) => {
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const finalPrice = hasDiscount ? product.discountPrice! : product.price;

    addItem(
      {
        productId: product._id,
        name: product.name,
        image: product.images[0] || "",
        price: finalPrice,
        stock: product.stock,
      },
      1
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart size={26} className="text-red-500 fill-red-500" />
            My Saved Wishlist
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {products.length} {products.length === 1 ? "saved item" : "saved items"}
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Continue Shopping
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-lg mx-auto my-8 space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Heart size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Your wishlist is empty</h2>
          <p className="text-xs text-gray-500">
            Explore our collection and click the heart icon on any product to save your favorites!
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-semibold transition"
          >
            <ShoppingBag size={18} />
            Explore Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const hasDiscount = product.discountPrice && product.discountPrice < product.price;
            const displayPrice = hasDiscount ? product.discountPrice! : product.price;

            return (
              <div
                key={product._id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition shadow-2xs flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={product.images[0] || "https://placehold.co/300x300?text=Product"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <button
                      onClick={() => toggleWishlist(product._id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition shadow-xs"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <Link
                      to={`/products/${product._id}`}
                      className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition line-clamp-2 block"
                    >
                      {product.name}
                    </Link>

                    <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                      <Star size={14} fill="currentColor" />
                      <span className="font-semibold text-gray-800">{product.rating.toFixed(1)}</span>
                      <span className="text-gray-400">({product.numReviews})</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-base font-bold text-gray-900">
                        {formatPrice(displayPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={15} />
                    {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
