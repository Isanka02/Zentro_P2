import { useState } from "react";
import { Menu, Bell, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

interface AdminHeaderProps {
  onMobileMenuOpen: () => void;
  pageTitle: string;
}

const AdminHeader = ({ onMobileMenuOpen, pageTitle }: AdminHeaderProps) => {
  const { user } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0">
      {/* Left: Mobile menu + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* View store */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition"
        >
          <ExternalLink size={14} />
          View Store
        </Link>

        {/* Notifications bell placeholder */}
        <button className="relative p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition">
          <Bell size={20} />
        </button>

        {/* Admin avatar */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "A"
              )}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-900">{user?.name}</p>
                <p className="text-[11px] text-gray-400">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowDropdown(false)}
                className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                My Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
