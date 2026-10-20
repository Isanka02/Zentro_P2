import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  X,
  Save,
} from "lucide-react";
import {
  getAdminOrders,
  updateAdminOrderStatus,
  confirmBankTransferPayment,
  type AdminOrder,
  type AdminOrdersResponse,
} from "../../api/admin";
import { getErrorMessage } from "../../lib/errorMessage";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const availableStatuses = (order: AdminOrder): OrderStatus[] => {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ["pending", "confirmed", "cancelled"],
    confirmed: ["confirmed", "shipped", "cancelled"],
    shipped: ["shipped", "delivered"],
    delivered: ["delivered"],
    cancelled: ["cancelled"],
  };
  const statuses = transitions[order.status as OrderStatus] ?? [order.status as OrderStatus];
  return statuses.filter((status) => {
    if (status === order.status) return true;
    if (order.isPaid && status === "cancelled") return false;
    if (order.paymentMethod === "bank_transfer" && !order.isPaid) {
      return status !== "shipped" && status !== "delivered";
    }
    return true;
  });
};
const formatStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const AdminOrders = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const ordersQueryKey = ["admin-orders", appliedSearch, statusFilter, page] as const;
  const ordersQuery = useQuery({
    queryKey: ordersQueryKey,
    queryFn: () => getAdminOrders({ search: appliedSearch || undefined, status: statusFilter, page, limit: 10 }),
  });
  const orders = ordersQuery.data?.orders ?? [];
  const loading = ordersQuery.isLoading;
  const totalPages = ordersQuery.data?.pagination.totalPages ?? 1;
  const totalOrders = ordersQuery.data?.pagination.total ?? 0;

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(
    null
  );

  const [editingStatus, setEditingStatus] = useState<OrderStatus>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const openOrderDetails = (order: AdminOrder) => {
    setSelectedOrder(order);

    setEditingStatus(
      ORDER_STATUSES.includes(order.status as OrderStatus)
        ? (order.status as OrderStatus)
        : "pending"
    );

    setTrackingNumber(order.trackingNumber || "");
    setCarrier(order.carrier || "");
    setTrackingUrl(order.trackingUrl || "");

    setEstimatedDelivery(
      order.estimatedDelivery
        ? new Date(order.estimatedDelivery).toISOString().split("T")[0]
        : ""
    );

    setSaveError("");
  };

  const closeOrderDetails = () => {
    if (saving) return;

    setSelectedOrder(null);
    setSaveError("");
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    if (editingStatus === "shipped" && !carrier.trim() && !selectedOrder.carrier) {
      setSaveError("Assign a courier before marking this order as shipped.");
      return;
    }

    try {
      setSaving(true);
      setSaveError("");

      const updatedOrder = await updateAdminOrderStatus(selectedOrder._id, {
        status: editingStatus,
        trackingNumber: trackingNumber.trim() || undefined,
        carrier: carrier.trim() || undefined,
        trackingUrl: trackingUrl.trim() || undefined,
        estimatedDelivery: estimatedDelivery || undefined,
      });

      queryClient.setQueryData<AdminOrdersResponse>(ordersQueryKey, (current) => current && ({
        ...current,
        orders: current.orders.map((order) => order._id === updatedOrder._id ? updatedOrder : order),
      }));

      setSelectedOrder(updatedOrder);
    } catch (err: unknown) {
      setSaveError(getErrorMessage(err, "Failed to update order."));
    } finally {
      setSaving(false);
    }
  };


  const handleConfirmBankTransfer = async () => {
    if (!selectedOrder) return;
    try {
      setSaving(true);
      setSaveError("");
      const updatedOrder = await confirmBankTransferPayment(selectedOrder._id);
      queryClient.setQueryData<AdminOrdersResponse>(ordersQueryKey, (current) => current && ({
        ...current,
        orders: current.orders.map((order) => order._id === updatedOrder._id ? updatedOrder : order),
      }));
      setSelectedOrder(updatedOrder);
    } catch (err: unknown) {
      setSaveError(getErrorMessage(err, "Failed to confirm the bank transfer."));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage customer orders, payment status, and delivery information.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={handleSearch}
            className="flex w-full gap-2 lg:max-w-xl"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order number or customer..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {ordersQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getErrorMessage(ordersQuery.error, "Failed to load orders.")}
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-sm text-gray-500">Loading orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <Package size={42} className="mb-3 text-gray-300" />

            <h3 className="text-lg font-semibold text-gray-700">
              No orders found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Order
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Payment
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Total
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const status = ORDER_STATUSES.includes(
                      order.status as OrderStatus
                    )
                      ? (order.status as OrderStatus)
                      : "pending";

                    return (
                      <tr
                        key={order._id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {order.orderNumber}
                          </div>

                          <div className="text-xs text-gray-500">
                            {order.items?.length || 0} item
                            {(order.items?.length || 0) !== 1 ? "s" : ""}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">
                            {order.shippingAddress?.fullName || "Unknown"}
                          </div>

                          <div className="text-xs text-gray-500">
                            {order.shippingAddress?.email || "No email"}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm capitalize text-gray-700">
                            {order.paymentMethod}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(order.total)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
                          >
                            {formatStatus(status)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openOrderDetails(order)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing {orders.length} of {totalOrders} orders
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="px-2 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Order {selectedOrder.orderNumber}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Placed on {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeOrderDetails}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Customer Information */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Customer & Shipping
                </h3>

                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.shippingAddress?.fullName ||
                      "Unknown customer"}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {selectedOrder.shippingAddress?.email || "No email"}
                  </p>

                  <div className="mt-3 text-sm leading-6 text-gray-600">
                    {selectedOrder.shippingAddress?.address && (
                      <p>{selectedOrder.shippingAddress.address}</p>
                    )}

                    <p>
                      {[
                        selectedOrder.shippingAddress?.city,
                        selectedOrder.shippingAddress?.district,
                        selectedOrder.shippingAddress?.province,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    {selectedOrder.shippingAddress?.postalCode && (
                      <p>{selectedOrder.shippingAddress.postalCode}</p>
                    )}

                    {selectedOrder.shippingAddress?.phone && (
                      <p className="mt-2">
                        Phone: {selectedOrder.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Items */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Order Items
                </h3>

                <div className="divide-y divide-gray-200 rounded-xl border border-gray-200">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={`${item.product}-${index}`}
                      className="flex items-center gap-4 p-4"
                    >
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package
                              size={24}
                              className="text-gray-300"
                            />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">
                          {item.name}
                        </p>
                        {item.variantLabel && <p className="mt-0.5 text-xs text-gray-500">Option: {item.variantLabel}</p>}

                        <p className="mt-1 text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Order Summary */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Payment Summary
                </h3>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment method</span>
                      <span className="font-medium capitalize text-gray-900">
                        {selectedOrder.paymentMethod}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment status</span>
                      <span
                        className={`font-medium ${
                          selectedOrder.isPaid
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {selectedOrder.isPaid ? "Paid" : "Pending"}
                      </span>
                    </div>

                    {selectedOrder.paymentMethod === "bank_transfer" && !selectedOrder.isPaid && selectedOrder.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={handleConfirmBankTransfer}
                        disabled={saving}
                        className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Confirm transfer received"}
                      </button>
                    )}
                    <div className="border-t border-gray-100 pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span>
                          {formatCurrency(selectedOrder.subtotal || 0)}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between">
                        <span className="text-gray-500">Shipping</span>
                        <span>
                          {formatCurrency(selectedOrder.shippingCost || 0)}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between">
                        <span className="text-gray-500">Tax</span>
                        <span>
                          {formatCurrency(selectedOrder.tax || 0)}
                        </span>
                      </div>

                      {(selectedOrder.discountAmount || 0) > 0 && (
                        <div className="mt-2 flex justify-between text-green-600">
                          <span>
                            Discount
                            {selectedOrder.discountCode
                              ? ` (${selectedOrder.discountCode})`
                              : ""}
                          </span>

                          <span>
                            -{formatCurrency(selectedOrder.discountAmount || 0)}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-base font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Delivery Management */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Delivery Management
                </h3>

                <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Order Status
                    </label>

                    <select
                      value={editingStatus}
                      onChange={(e) =>
                        setEditingStatus(e.target.value as OrderStatus)
                      }
                      disabled={saving}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {availableStatuses(selectedOrder).map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Tracking Number
                      </label>

                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        disabled={saving}
                        placeholder="e.g. TRK123456"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Carrier
                      </label>

                      <input
                        type="text"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        disabled={saving}
                        placeholder="e.g. DHL"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Courier tracking page</label>
                    <input type="url" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} disabled={saving} placeholder="https://courier.lk/track/..." className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    <p className="mt-1 text-xs text-gray-500">Assign the courier, then add its HTTPS tracking link so the customer can follow the parcel.</p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Estimated Delivery
                    </label>

                    <input
                      type="date"
                      value={estimatedDelivery}
                      onChange={(e) =>
                        setEstimatedDelivery(e.target.value)
                      }
                      disabled={saving}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {saveError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {saveError}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleStatusUpdate}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={16} />

                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
