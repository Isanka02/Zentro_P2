import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  X,
  Package,
  Truck,
  Bell,
} from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../hooks/useLogout";
import { useWishlistStore } from "../../store/wishlistStore";
import { useCartStore } from "../../store/cartStore";
import { useNotificationStore } from "../../store/notificationStore";

import zentroLogo from "../../assets/zentro-logo.png";

const Header = () => {
  const cartCount = useCartStore((s) => s.totalItems());
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const unreadNotifications = useNotificationStore((s) => s.unreadCount);
  const loadNotifications = useNotificationStore((s) => s.load);

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const logout = useLogout();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 60_000);
    return () => window.clearInterval(timer);
  }, [userId, loadNotifications]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    const query = searchInput.trim();

    if (query) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate("/products");
    }

    setMobileOpen(false);
  };

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center"
          aria-label="Zentro Home"
        >
          <img
            src={zentroLogo}
            alt="Zentro"
            className="h-14 w-auto object-contain"
          />
        </Link>

        {/* Desktop Search */}
        <form
          onSubmit={handleSearch}
          className="mx-6 hidden max-w-md flex-1 md:flex"
        >
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-5 md:flex">
          {user ? (
            <>
              {/* Track Order */}
              <Link to="/notifications" className="relative text-gray-600 transition hover:text-blue-600" title="Notifications" aria-label="Notifications">
                <Bell size={20} />
                {unreadNotifications > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
              </Link>
              <Link
                to="/track"
                className="text-gray-600 transition hover:text-blue-600"
                title="Track Order"
              >
                <Truck size={20} />
              </Link>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative text-gray-600 transition hover:text-blue-600"
                title="Wishlist"
              >
                <Heart size={20} />

                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative text-gray-600 transition hover:text-blue-600"
                title="Cart"
              >
                <ShoppingCart size={20} />

                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Orders */}
              <Link
                to="/orders"
                className="text-gray-600 transition hover:text-blue-600"
                title="My Orders"
              >
                <Package size={20} />
              </Link>

              {/* Profile */}
              <Link
                to="/profile"
                className="flex items-center text-gray-600 transition hover:text-blue-600"
                title="Profile"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-6 w-6 rounded-full border border-gray-300 object-cover"
                  />
                ) : (
                  <User size={20} />
                )}
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 transition hover:text-blue-600"
              >
                Logout
              </button>
            </>
          ) : (
            /* Logged Out */
            <div className="flex items-center gap-3 text-sm">
              <Link
                to="/login"
                className="text-gray-600 transition hover:text-blue-600"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="text-gray-600 md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="space-y-3 border-t border-gray-200 px-4 py-4 md:hidden">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {user ? (
            <>
              <Link to="/notifications" className="block text-gray-700" onClick={() => setMobileOpen(false)}>
                Notifications{unreadNotifications > 0 ? ` (${unreadNotifications})` : ""}
              </Link>
              <Link
                to="/track"
                className="block text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                Track Order
              </Link>

              <Link
                to="/wishlist"
                className="block text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                Wishlist
              </Link>

              <Link
                to="/cart"
                className="block text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                Cart
              </Link>

              <Link
                to="/orders"
                className="block text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                My Orders
              </Link>

              <Link
                to="/profile"
                className="block text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="block w-full text-left text-gray-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>

              <Link
                to="/register"
                className="block text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
