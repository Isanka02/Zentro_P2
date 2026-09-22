import { Link } from "react-router-dom";
import { Package, Truck, ShieldCheck } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
        <div className="space-y-3">
          <p className="text-white font-bold text-xl tracking-tight">Zentro</p>
          <p className="text-gray-400 text-xs leading-relaxed max-w-sm">
            Your premier online marketplace for quality products with reliable shipping across Sri Lanka.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
            <ShieldCheck size={16} />
            <span>100% Verified Marketplace</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-white font-semibold text-sm">Customer Care & Services</p>
          <ul className="space-y-1.5 text-xs text-gray-400">
            <li>
              <Link to="/track" className="hover:text-blue-400 transition flex items-center gap-1.5">
                <Truck size={14} /> Track Your Package
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-blue-400 transition flex items-center gap-1.5">
                <Package size={14} /> My Orders
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-blue-400 transition">Shopping Cart</Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-white font-semibold text-sm">Information</p>
          <p className="text-xs text-gray-400">Cash on Delivery & Bank Transfer Accepted</p>
          <p className="text-xs text-gray-400 pt-2">© {new Date().getFullYear()} Zentro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;