import { useEffect, useState } from "react";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserRound,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  getAdminUsers,
  updateAdminUserRole,
  type AdminUser,
} from "../../api/adminUsers";
import { useAuthStore } from "../../store/authStore";

const AdminUsers = () => {
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminUsers({
        page,
        limit: 10,
        search,
      });

      setUsers(data.users);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleRoleChange = async (
    selectedUser: AdminUser,
    newRole: "customer" | "admin"
  ) => {
    if (selectedUser._id === currentUser?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Change ${selectedUser.name}'s role to ${newRole}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(selectedUser._id);

      const updatedUser = await updateAdminUserRole(
        selectedUser._id,
        newRole
      );

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item._id === updatedUser._id
            ? { ...item, role: updatedUser.role }
            : item
        )
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Failed to update user role"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Users
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage registered Zentro accounts and their roles.
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="bg-white border border-gray-200 rounded-xl p-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Search
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle
            size={20}
            className="text-red-500 shrink-0"
          />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* User table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2
              size={28}
              className="mx-auto text-blue-600 animate-spin"
            />
            <p className="text-sm text-gray-500 mt-3">
              Loading users...
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users
              size={40}
              className="mx-auto text-gray-300 mb-3"
            />
            <p className="text-sm font-medium text-gray-700">
              No users found
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try changing your search.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                      User
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                      Role
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                      Joined
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((item) => {
                    const isCurrentUser =
                      item._id === currentUser?.id;

                    return (
                      <tr
                        key={item._id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-semibold">
                              {item.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-medium text-gray-900">
                                {item.name}

                                {isCurrentUser && (
                                  <span className="ml-2 text-[10px] text-blue-600">
                                    You
                                  </span>
                                )}
                              </p>

                              {item.phone && (
                                <p className="text-xs text-gray-400">
                                  {item.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {item.email}
                        </td>

                        <td className="px-5 py-4">
                          {item.role === "admin" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                              <Shield size={13} />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                              <UserRound size={13} />
                              Customer
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-gray-500">
                          {new Date(
                            item.createdAt
                          ).toLocaleDateString("en-LK", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        <td className="px-5 py-4">
                          {isCurrentUser ? (
                            <span className="text-xs text-gray-400">
                              Current account
                            </span>
                          ) : (
                            <select
                              value={item.role}
                              disabled={updatingId === item._id}
                              onChange={(event) =>
                                handleRoleChange(
                                  item,
                                  event.target.value as
                                    | "customer"
                                    | "admin"
                                )
                              }
                              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                              <option value="customer">
                                Customer
                              </option>
                              <option value="admin">
                                Admin
                              </option>
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing {users.length} of {total} users
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-xs text-gray-600 px-2">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  disabled={page >= totalPages}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;