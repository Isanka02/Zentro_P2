import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useProduct } from "../hooks/useProduct";
import { formatPrice } from "../lib/formatPrice";
import { useCartStore } from "../store/cartStore";
import { useWishlistStore } from "../store/wishlistStore";
import Breadcrumb from "../components/product/Breadcrumb";
import ImageGallery from "../components/product/ImageGallery";
import QuantitySelector from "../components/product/QuantitySelector";
import ShareButtons from "../components/product/ShareButtons";
import TrustInfo from "../components/product/TrustInfo";
import RelatedProducts from "../components/product/RelatedProducts";
import RatingSummary from "../components/product/RatingSummary";
import ReviewSection from "../components/product/ReviewSection";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => (product ? s.isWishlisted(product._id) : false));

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-lg" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-lg font-medium text-gray-900">Product not found</h2>
        <p className="text-gray-500 text-sm mt-1 mb-4">
          This product may have been removed or the link is incorrect.
        </p>
        <Link to="/" className="text-blue-600 hover:underline text-sm">
          Back to shopping
        </Link>
      </div>
    );
  }

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice! : product.price;

  const handleAddToCart = () => {
    addItem(
      {
        productId: product._id,
        name: product.name,
        image: product.images[0] || "",
        price: displayPrice,
        stock: product.stock,
      },
      quantity
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Breadcrumb category={product.category} productName={product.name} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImageGallery images={product.images} productName={product.name} />

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>

          <div className="mt-2">
            <RatingSummary rating={product.rating} numReviews={product.numReviews} />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <span className="text-2xl font-bold text-gray-900">{formatPrice(displayPrice)}</span>
            {hasDiscount && (
              <span className="text-base text-gray-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          <p className="text-gray-600 text-sm mt-4 leading-relaxed">{product.description}</p>

          <p className="text-sm mt-4">
            {product.stock > 0 ? (
              <span className="text-green-600">In stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-500">Out of stock</span>
            )}
          </p>

          {product.stock > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Quantity</p>
              <QuantitySelector quantity={quantity} onChange={setQuantity} max={product.stock} />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {justAdded ? "Added!" : "Add to cart"}
            </button>
            <Link
              to="/cart"
              onClick={handleAddToCart}
              className={`flex-1 flex items-center justify-center border border-blue-600 text-blue-600 py-3 rounded-md font-medium hover:bg-blue-50 transition-colors ${
                product.stock === 0 ? "pointer-events-none opacity-40" : ""
              }`}
            >
              Buy now
            </Link>
            <button
              onClick={() => toggleWishlist(product._id)}
              aria-label="Toggle wishlist"
              className={`p-3 border rounded-md ${
                isWishlisted
                  ? "border-red-300 text-red-500"
                  : "border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-300"
              }`}
            >
              <Heart size={20} className={isWishlisted ? "fill-red-500" : ""} />
            </button>
          </div>

          <ShareButtons productName={product.name} />
          <TrustInfo />
        </div>
      </div>

      <ReviewSection
        productId={product._id}
        rating={product.rating}
        numReviews={product.numReviews}
      />

      <RelatedProducts categoryId={product.category._id} excludeProductId={product._id} />
    </div>
  );
};

export default ProductDetail;