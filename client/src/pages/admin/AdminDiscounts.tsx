import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CirclePercent, Edit2, Plus, Ticket, Trash2, X } from "lucide-react";
import {
  createAdminDiscount,
  deleteAdminDiscount,
  getAdminDiscounts,
  updateAdminDiscount,
  type AdminDiscount,
  type DiscountInput,
} from "../../api/discounts";
import { getErrorMessage } from "../../lib/errorMessage";

const PAGE_RENDERED_AT = Date.now();

interface DiscountForm {
  code: string;
  type: "percentage" | "fixed";
  value: string;
  minPurchase: string;
  maxUses: string;
  expiresAt: string;
  isActive: boolean;
}

const emptyForm: DiscountForm = {
  code: "",
  type: "percentage",
  value: "",
  minPurchase: "0",
  maxUses: "100",
  expiresAt: "",
  isActive: true,
};

const currency = (amount: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(amount);

const AdminDiscounts = () => {
  const queryClient = useQueryClient();
  const discountsQuery = useQuery({ queryKey: ["admin-discounts"], queryFn: getAdminDiscounts });
  const discounts = discountsQuery.data ?? [];
  const [form, setForm] = useState<DiscountForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const loading = discountsQuery.isLoading;
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const editDiscount = (discount: AdminDiscount) => {
    setEditingId(discount._id);
    setForm({
      code: discount.code,
      type: discount.type,
      value: String(discount.value),
      minPurchase: String(discount.minPurchase),
      maxUses: String(discount.maxUses),
      expiresAt: discount.expiresAt.slice(0, 10),
      isActive: discount.isActive,
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const value = Number(form.value);
    const minPurchase = Number(form.minPurchase);
    const maxUses = Number(form.maxUses);
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(form.code.trim())) {
      setError("Use 3 to 32 letters, numbers, hyphens, or underscores for the code.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0 || (form.type === "percentage" && value > 100)) {
      setError(form.type === "percentage" ? "Enter a percentage from 0.01 to 100." : "Enter a discount amount greater than zero.");
      return;
    }
    if (!Number.isFinite(minPurchase) || minPurchase < 0 || !Number.isSafeInteger(maxUses) || maxUses < 1) {
      setError("Enter a non-negative minimum purchase and a positive whole-number usage limit.");
      return;
    }
    if (!form.expiresAt || new Date(`${form.expiresAt}T23:59:59`).getTime() <= Date.now()) {
      setError("Choose an expiry date in the future.");
      return;
    }

    const input: DiscountInput = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      minPurchase,
      maxUses,
      expiresAt: new Date(`${form.expiresAt}T23:59:59`).toISOString(),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateAdminDiscount(editingId, input);
        setSuccess("Discount updated.");
      } else {
        await createAdminDiscount(input);
        setSuccess("Discount created.");
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-discounts"] });
      setForm(emptyForm);
      setEditingId(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not save this discount."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (discount: AdminDiscount) => {
    if (!window.confirm(`Delete discount ${discount.code}?`)) return;
    setDeletingId(discount._id);
    setError("");
    setSuccess("");
    try {
      await deleteAdminDiscount(discount._id);
      await queryClient.invalidateQueries({ queryKey: ["admin-discounts"] });
      if (editingId === discount._id) resetForm();
      setSuccess(`${discount.code} deleted.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not delete this discount."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Discounts</h1>
        <p className="mt-1 text-sm text-gray-500">Create and manage checkout codes for Zentro customers.</p>
      </header>

      {(error || discountsQuery.isError) && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || getErrorMessage(discountsQuery.error, "Could not load discount codes.")}</div>}
      {success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Ticket size={19} /></div>
            <div>
              <h2 className="font-semibold text-gray-900">{editingId ? "Edit discount" : "Create discount"}</h2>
              <p className="text-xs text-gray-500">Usage is consumed only when an order is placed.</p>
            </div>
          </div>
          {editingId && <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"><X size={16} /> Cancel</button>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-sm font-medium text-gray-700">Code
            <input required maxLength={32} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono uppercase outline-none focus:border-blue-500" />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">Discount type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DiscountForm["type"] })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500">
              <option value="percentage">Percentage</option><option value="fixed">Fixed LKR amount</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">{form.type === "percentage" ? "Percentage" : "Amount (LKR)"}
            <div className="relative"><CirclePercent size={16} className="absolute left-3 top-3 text-gray-400" /><input required type="number" min="0.01" max={form.type === "percentage" ? 100 : undefined} step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 outline-none focus:border-blue-500" /></div>
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">Minimum purchase (LKR)
            <input required type="number" min="0" step="0.01" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500" />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">Maximum uses
            <input required type="number" min={Math.max(1, discounts.find((item) => item._id === editingId)?.usedCount ?? 1)} step="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500" />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">Expiry date
            <div className="relative"><CalendarDays size={16} className="absolute left-3 top-3 text-gray-400" /><input required type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 outline-none focus:border-blue-500" /></div>
          </label>
        </div>

        {editingId && <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-blue-600" />Active at checkout</label>}
        <div className="mt-5"><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Plus size={17} />{saving ? "Saving..." : editingId ? "Save changes" : "Create discount"}</button></div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4"><h2 className="font-semibold text-gray-900">Discount codes <span className="ml-1 text-sm font-normal text-gray-500">{discounts.length}</span></h2></div>
        {loading ? <div className="p-8 text-center text-sm text-gray-500">Loading discount codes...</div> : discounts.length === 0 ? (
          <div className="p-10 text-center"><Ticket className="mx-auto mb-3 text-gray-300" size={32} /><p className="font-medium text-gray-700">No discounts yet</p><p className="mt-1 text-sm text-gray-500">Create a code above to offer customers a checkout discount.</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Code</th><th className="px-5 py-3">Offer</th><th className="px-5 py-3">Usage</th><th className="px-5 py-3">Expires</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {discounts.map((discount) => {
                const expired = new Date(discount.expiresAt).getTime() <= PAGE_RENDERED_AT;
                const exhausted = discount.usedCount >= discount.maxUses;
                const active = discount.isActive && !expired && !exhausted;
                return <tr key={discount._id} className="hover:bg-gray-50/70">
                  <td className="px-5 py-4"><span className="rounded-md bg-gray-100 px-2 py-1 font-mono font-semibold text-gray-800">{discount.code}</span><p className="mt-1 text-xs text-gray-500">Min. {currency(discount.minPurchase)}</p></td>
                  <td className="px-5 py-4 font-medium text-gray-800">{discount.type === "percentage" ? `${discount.value}% off` : `${currency(discount.value)} off`}</td>
                  <td className="px-5 py-4 text-gray-600">{discount.usedCount} / {discount.maxUses}</td>
                  <td className="px-5 py-4 text-gray-600">{new Date(discount.expiresAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{active ? "Active" : expired ? "Expired" : exhausted ? "Used up" : "Inactive"}</span></td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => editDiscount(discount)} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100" aria-label={`Edit ${discount.code}`}><Edit2 size={16} /></button><button type="button" onClick={() => void handleDelete(discount)} disabled={deletingId === discount._id} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${discount.code}`}><Trash2 size={16} /></button></div></td>
                </tr>;
              })}
            </tbody>
          </table></div>
        )}
      </section>
    </div>
  );
};

export default AdminDiscounts;
