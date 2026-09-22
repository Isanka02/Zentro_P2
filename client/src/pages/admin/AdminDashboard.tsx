import { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
} from "lucide-react";
import {
  getAdminDashboardStats,
  type AdminDashboardStats,
} from "../../api/admin";

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  sub?: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}
    >
      <Icon size={22} />
    </div>

    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-gray-400 mt-0.5">
          {sub}
        </p>
      )}
    </div>
  </div>
);

const formatCurrency = (amount: number) => {
  return `LKR ${amount.toLocaleString("en-LK")}`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminDashboardStats();
        setStats(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-7 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
        <AlertTriangle
          size={36}
          className="mx-auto text-red-500 mb-3"
        />

        <h2 className="font-semibold text-gray-900">
          Failed to load dashboard
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {error || "No dashboard data available."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          sub="All non-cancelled orders"
        />

        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="bg-blue-50 text-blue-600"
          sub="All orders"
        />

        <StatCard
          label="Pending Orders"
          value={stats.ordersByStatus.pending}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
          sub="Awaiting confirmation"
        />

        <StatCard
          label="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="bg-purple-50 text-purple-600"
          sub="Products in catalog"
        />

        <StatCard
          label="Low Stock"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color="bg-red-50 text-red-500"
          sub="5 units or fewer"
        />

        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-slate-100 text-slate-600"
          sub="Registered accounts"
        />
      </div>

      {/* Order status summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Order Status Overview
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Current order distribution
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-gray-100">
          <div className="p-4 text-center">
            <Clock className="mx-auto text-amber-500 mb-2" size={20} />
            <p className="text-xl font-bold text-gray-900">
              {stats.ordersByStatus.pending}
            </p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>

          <div className="p-4 text-center">
            <CheckCircle className="mx-auto text-blue-500 mb-2" size={20} />
            <p className="text-xl font-bold text-gray-900">
              {stats.ordersByStatus.confirmed}
            </p>
            <p className="text-xs text-gray-500">Confirmed</p>
          </div>

          <div className="p-4 text-center">
            <Truck className="mx-auto text-purple-500 mb-2" size={20} />
            <p className="text-xl font-bold text-gray-900">
              {stats.ordersByStatus.shipped}
            </p>
            <p className="text-xs text-gray-500">Shipped</p>
          </div>

          <div className="p-4 text-center">
            <CheckCircle className="mx-auto text-emerald-500 mb-2" size={20} />
            <p className="text-xl font-bold text-gray-900">
              {stats.ordersByStatus.delivered}
            </p>
            <p className="text-xs text-gray-500">Delivered</p>
          </div>

          <div className="p-4 text-center">
            <XCircle className="mx-auto text-red-500 mb-2" size={20} />
            <p className="text-xl font-bold text-gray-900">
              {stats.ordersByStatus.cancelled}
            </p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Recent Orders
          </h2>

          <p className="text-xs text-gray-500 mt-0.5">
            Latest customer orders
          </p>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingBag
              size={36}
              className="mx-auto text-gray-300 mb-3"
            />

            <p className="text-sm text-gray-500">
              No orders have been placed yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                    Order
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                    Total
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {order.orderNumber}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {order.shippingAddress?.fullName || "Guest"}
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusStyles[order.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;