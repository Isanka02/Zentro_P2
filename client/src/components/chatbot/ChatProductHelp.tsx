import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Tag, Star, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { fetchProducts, type Product } from "../../api/products";
import { fetchCategories, type Category } from "../../api/categories";
import { getErrorMessage } from "../../lib/errorMessage";

interface ChatProductHelpProps {
  onBackToMenu: () => void;
  onContactSupport: () => void;
}

export const ChatProductHelp = ({ onBackToMenu, onContactSupport }: ChatProductHelpProps) => {
  const navigate = useNavigate();
  const [subView, setSubView] = useState<"options" | "search" | "categories" | "featured">("options");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Featured products state
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);

  const openCategories = () => {
    setSubView("categories");
    if (categories.length === 0) {
      setLoadingCategories(true);
      fetchCategories()
        .then((res) => setCategories(res))
        .catch(() => setCategories([]))
        .finally(() => setLoadingCategories(false));
    }
  };

  const openFeatured = () => {
    setSubView("featured");
    if (featuredProducts.length === 0) {
      setLoadingFeatured(true);
      fetchProducts({ featuredOnly: true, limit: 4 })
        .then((res) => setFeaturedProducts(res.products))
        .catch(() => setFeaturedProducts([]))
        .finally(() => setLoadingFeatured(false));
    }
  };

  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    setSearchError("");
    setSearchPerformed(true);

    try {
      const res = await fetchProducts({ keyword: query, limit: 4 });
      setSearchResults(res.products);
    } catch (err) {
      setSearchError(getErrorMessage(err, "Could not search products."));
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const renderProductItem = (product: Product) => {
    const displayPrice = product.discountPrice ?? product.price;
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const inStock = product.stock > 0;

    return (
      <div
        key={product._id}
        className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 bg-white hover:border-blue-300 transition"
      >
        <div className="h-12 w-12 shrink-0 rounded-md bg-gray-100 overflow-hidden border border-gray-100">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              <ShoppingBag size={18} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 text-xs">
          <p className="font-semibold text-gray-900 truncate">{product.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-bold text-gray-900">LKR {displayPrice.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-[10px] text-gray-400 line-through">
                LKR {product.price.toLocaleString()}
              </span>
            )}
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ml-auto ${
              inStock ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
            }`}>
              {inStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/products/${product._id}`)}
          className="p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition shrink-0"
          aria-label={`View ${product.name}`}
        >
          <ArrowRight size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-3.5 text-sm">
      {/* Bot Prompt */}
      <div className="rounded-xl rounded-tl-sm bg-blue-50 border border-blue-100 p-3 text-gray-800">
        <p className="font-semibold text-blue-950 flex items-center gap-1.5">
          <ShoppingBag size={16} className="text-blue-700" /> Product Questions & Browsing
        </p>
        <p className="mt-1 text-xs text-gray-700 leading-relaxed">
          How would you like to explore our catalog?
        </p>
      </div>

      {/* Main Options */}
      {subView === "options" && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSubView("search")}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-200 text-left transition"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Search size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900">Search Products</p>
              <p className="text-[11px] text-gray-500">Search by item name or keyword</p>
            </div>
            <ArrowRight size={14} className="text-gray-400" />
          </button>

          <button
            type="button"
onClick={openCategories}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-200 text-left transition"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Tag size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900">Browse by Category</p>
              <p className="text-[11px] text-gray-500">Explore store departments</p>
            </div>
            <ArrowRight size={14} className="text-gray-400" />
          </button>

          <button
            type="button"
onClick={openFeatured}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-200 text-left transition"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Star size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900">Featured Products</p>
              <p className="text-[11px] text-gray-500">Highlighted store picks</p>
            </div>
            <ArrowRight size={14} className="text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/products")}
            className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-center"
          >
            Open Full Products Catalog
          </button>
        </div>
      )}

      {/* Sub-View: Search */}
      {subView === "search" && (
        <div className="space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1 shrink-0"
            >
              {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              <span>Search</span>
            </button>
          </form>

          {searchError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-center gap-1">
              <AlertCircle size={13} /> {searchError}
            </div>
          )}

          {searching ? (
            <div className="flex items-center justify-center p-6 text-xs text-gray-500">
              <Loader2 className="animate-spin text-blue-600 mr-2" size={16} /> Searching catalog...
            </div>
          ) : searchPerformed && searchResults.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-4 text-center text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">No products found for “{searchQuery}”</p>
              <p className="text-[11px]">Try searching with a broader keyword or browse all items.</p>
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="mt-2 text-blue-600 font-semibold underline block mx-auto"
              >
                Browse all catalog items
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {searchResults.map(renderProductItem)}
            </div>
          )}

          <button
            type="button"
            onClick={() => setSubView("options")}
            className="text-xs text-gray-500 hover:text-gray-800 transition"
          >
            ← Back to product options
          </button>
        </div>
      )}

      {/* Sub-View: Categories */}
      {subView === "categories" && (
        <div className="space-y-3">
          {loadingCategories ? (
            <div className="flex items-center justify-center p-6 text-xs text-gray-500">
              <Loader2 className="animate-spin text-blue-600 mr-2" size={16} /> Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <p className="text-xs text-gray-500 p-3 text-center">No categories configured yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => navigate(`/products?category=${cat._id}`)}
                  className="p-2.5 rounded-lg border border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 text-left transition group"
                >
                  <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-700 truncate">
                    {cat.name}
                  </p>
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                    View items <ArrowRight size={10} />
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setSubView("options")}
            className="text-xs text-gray-500 hover:text-gray-800 transition"
          >
            ← Back to product options
          </button>
        </div>
      )}

      {/* Sub-View: Featured */}
      {subView === "featured" && (
        <div className="space-y-3">
          {loadingFeatured ? (
            <div className="flex items-center justify-center p-6 text-xs text-gray-500">
              <Loader2 className="animate-spin text-blue-600 mr-2" size={16} /> Loading featured items...
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-4 text-center text-xs text-gray-500">
              <p>No featured products currently highlighted.</p>
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="mt-2 text-blue-600 font-semibold underline"
              >
                Browse our full catalog
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {featuredProducts.map(renderProductItem)}
            </div>
          )}

          <button
            type="button"
            onClick={() => setSubView("options")}
            className="text-xs text-gray-500 hover:text-gray-800 transition"
          >
            ← Back to product options
          </button>
        </div>
      )}

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
