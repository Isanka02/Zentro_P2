import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingCart, MessageCircle, User, Menu, X } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { logoutUser } from "../../api/auth";

const Header = () => {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    clearUser();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="text-xl font-bold text-blue-600">
          Zentro
        </Link>

        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/wishlist" className="text-gray-600 hover:text-blue-600">
            <Heart size={20} />
          </Link>
          <Link to="/cart" className="text-gray-600 hover:text-blue-600">
            <ShoppingCart size={20} />
          </Link>
          {user && (
            <Link to="/messages" className="text-gray-600 hover:text-blue-600">
              <MessageCircle size={20} />
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="text-gray-600 hover:text-blue-600">
                <User size={20} />
              </Link>
              <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-blue-600">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <Link to="/login" className="text-gray-600 hover:text-blue-600">
                Login
              </Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Sign up
              </Link>
            </div>
          )}
        </div>

        <button className="md:hidden text-gray-600" onClick={() => setMobileOpen((o) => !o)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 px-4 py-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <Link to="/wishlist" className="block text-gray-700">Wishlist</Link>
          <Link to="/cart" className="block text-gray-700">Cart</Link>
          {user ? (
            <>
              <Link to="/messages" className="block text-gray-700">Messages</Link>
              <Link to="/profile" className="block text-gray-700">Profile</Link>
              <button onClick={handleLogout} className="block text-left w-full text-gray-700">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-gray-700">Login</Link>
              <Link to="/register" className="block text-gray-700">Sign up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;