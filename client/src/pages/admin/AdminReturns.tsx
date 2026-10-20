import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, PackageCheck, RotateCcw, X } from "lucide-react";
import { getAdminReturnRequests, updateAdminReturnRequest, type AdminReturnRequest } from "../../api/admin";
import { getErrorMessage } from "../../lib/errorMessage";

const steps: Record<AdminReturnRequest["status"], string> = { requested: "Awaiting review", approved: "Approved · awaiting item", rejected: "Rejected", received: "Item received · refund due", refunded: "Refund recorded" };
type ReturnAdminFields = { amount: string; method: "cash" | "bank_transfer"; reference: string; returnCarrier: string; returnTrackingNumber: string; returnTrackingUrl: string; returnEstimatedPickup: string };
const AdminReturns = () => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [refunds, setRefunds] = useState<Record<string, ReturnAdminFields>>({});
  const [error, setError] = useState("");
  const query = useQuery({ queryKey: ["admin-return-requests"], queryFn: getAdminReturnRequests });
  const mutation = useMutation({
    mutationFn: ({ request, status }: { request: AdminReturnRequest; status: AdminReturnRequest["status"] }) => {
      const refund = refunds[request._id];
      const pickup = refunds[request._id];
      return updateAdminReturnRequest(request._id, {
        status,
        adminNote: notes[request._id]?.trim() || undefined,
        returnCarrier: pickup?.returnCarrier || undefined,
        returnTrackingNumber: pickup?.returnTrackingNumber || undefined,
        returnTrackingUrl: pickup?.returnTrackingUrl || undefined,
        returnEstimatedPickup: pickup?.returnEstimatedPickup || undefined,
        ...(status === "refunded" ? { refundAmount: Number(refund?.amount), refundMethod: refund?.method ?? "bank_transfer", refundReference: refund?.reference.trim() || undefined } : {}),
      });
    },
    onSuccess: () => { setError(""); void queryClient.invalidateQueries({ queryKey: ["admin-return-requests"] }); },
    onError: (err: unknown) => setError(getErrorMessage(err, "Could not update the return request.")),
  });
  const setRefundField = (id: string, field: keyof ReturnAdminFields, value: string) => setRefunds((current) => ({ ...current, [id]: { amount: "", method: "bank_transfer", reference: "", returnCarrier: "", returnTrackingNumber: "", returnTrackingUrl: "", returnEstimatedPickup: "", ...current[id], [field]: value } }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm font-medium text-blue-700">Customer care</p><h1 className="mt-1 text-2xl font-bold text-gray-900">Returns & refunds</h1><p className="mt-1 max-w-2xl text-sm text-gray-600">Review return requests, coordinate the return shipment, then record approved refunds after receiving the item.</p></div>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">Manual review</span>
      </header>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {query.isLoading ? <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Loading return requests…</div> : query.isError ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{getErrorMessage(query.error, "Could not load return requests.")}</div> : !query.data?.length ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center"><RotateCcw size={30} className="mx-auto text-gray-400" /><h2 className="mt-3 font-semibold text-gray-900">No return requests yet</h2><p className="mt-1 text-sm text-gray-500">New customer requests will appear here.</p></div>
      ) : (
        <div className="space-y-4">{query.data.map((request) => {
          const busy = mutation.isPending && mutation.variables?.request._id === request._id;
          const act = (status: AdminReturnRequest["status"]) => mutation.mutate({ request, status });
          return <article key={request._id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
              <div><p className="text-xs text-gray-500">Order</p><h2 className="font-semibold text-gray-900">{request.order?.orderNumber ?? "Order unavailable"}</h2><p className="mt-0.5 text-xs text-gray-500">{request.user?.name} · {request.user?.email} · {new Date(request.createdAt).toLocaleDateString()}</p></div>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">{steps[request.status]}</span>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Reason</p><p className="mt-1 text-sm font-medium capitalize text-gray-900">{request.reason.replaceAll("_", " ")}</p>{request.details && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{request.details}</p>}</div><div><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Order total</p><p className="mt-1 text-sm font-semibold text-gray-900">LKR {request.order?.total?.toLocaleString() ?? "—"}</p>{request.refundAmount !== undefined && <p className="mt-1 text-sm text-emerald-700">Refund recorded: LKR {request.refundAmount.toLocaleString()} · {request.refundMethod === "cash" ? "Cash" : "Bank transfer"}{request.refundReference ? ` · ${request.refundReference}` : ""}</p>}</div></div>
              {request.status !== "refunded" && request.status !== "rejected" && <label className="block text-sm font-medium text-gray-700">Message to customer<textarea value={notes[request._id] ?? request.adminNote ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [request._id]: event.target.value }))} maxLength={1000} rows={2} placeholder="Add a decision note or return instructions" className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" /></label>}
              {request.status === "approved" && <div className="grid gap-3 rounded-lg bg-blue-50 p-4 sm:grid-cols-2"><div className="sm:col-span-2"><p className="text-sm font-semibold text-gray-800">Return courier pickup <span className="font-normal text-gray-500">(optional)</span></p><p className="mt-0.5 text-xs text-gray-600">Assign a courier and share pickup details for this return.</p></div><label className="text-sm font-medium text-gray-700">Courier<input value={refunds[request._id]?.returnCarrier ?? request.returnCarrier ?? ""} onChange={(event) => setRefundField(request._id, "returnCarrier", event.target.value)} maxLength={80} placeholder="Courier company" className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm" /></label><label className="text-sm font-medium text-gray-700">Tracking number<input value={refunds[request._id]?.returnTrackingNumber ?? request.returnTrackingNumber ?? ""} onChange={(event) => setRefundField(request._id, "returnTrackingNumber", event.target.value)} maxLength={100} className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm" /></label><label className="text-sm font-medium text-gray-700">Courier tracking page<input type="url" value={refunds[request._id]?.returnTrackingUrl ?? request.returnTrackingUrl ?? ""} onChange={(event) => setRefundField(request._id, "returnTrackingUrl", event.target.value)} placeholder="https://..." className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm" /></label><label className="text-sm font-medium text-gray-700">Estimated pickup<input type="date" value={refunds[request._id]?.returnEstimatedPickup ?? (request.returnEstimatedPickup ? request.returnEstimatedPickup.slice(0, 10) : "")} onChange={(event) => setRefundField(request._id, "returnEstimatedPickup", event.target.value)} className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm" /></label></div>}
              {request.status === "received" && <div className="grid gap-3 rounded-lg bg-emerald-50 p-4 sm:grid-cols-3"><label className="text-sm font-medium text-gray-700">Refund amount (LKR)<input type="number" min="0" max={request.order?.total} step="0.01" value={refunds[request._id]?.amount ?? ""} onChange={(event) => setRefundField(request._id, "amount", event.target.value)} placeholder="0.00" className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm" /></label><label className="text-sm font-medium text-gray-700">Paid back by<select value={refunds[request._id]?.method ?? "bank_transfer"} onChange={(event) => setRefundField(request._id, "method", event.target.value)} className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option></select></label><label className="text-sm font-medium text-gray-700">Transfer reference <span className="font-normal text-gray-500">(optional)</span><input value={refunds[request._id]?.reference ?? ""} onChange={(event) => setRefundField(request._id, "reference", event.target.value)} maxLength={100} className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm" /></label></div>}
              <div className="flex flex-wrap gap-2">{request.status === "requested" && <><button disabled={busy} onClick={() => act("approved")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Check size={16} />Approve</button><button disabled={busy || !(notes[request._id] ?? request.adminNote ?? "").trim()} onClick={() => act("rejected")} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><X size={16} />Reject</button></>}{request.status === "approved" && <><button disabled={busy} onClick={() => act("approved")} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"><Check size={16} />Save pickup details</button><button disabled={busy} onClick={() => act("received")} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><PackageCheck size={16} />Mark item received</button></>}{request.status === "received" && <button disabled={busy || !refunds[request._id]?.amount} onClick={() => act("refunded")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Clock3 size={16} />{busy ? "Saving…" : "Record completed refund"}</button>}</div>
            </div>
          </article>;
        })}</div>
      )}
    </div>
  );
};

export default AdminReturns;
