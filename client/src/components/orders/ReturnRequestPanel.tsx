import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { createMyReturnRequest, getMyReturnRequest } from "../../api/orders";
import { getErrorMessage } from "../../lib/errorMessage";

const ReturnRequestPanel = ({ orderId, status }: { orderId: string; status: string }) => {
  const queryClient = useQueryClient();
  const queryKey = ["return-request", orderId] as const;
  const query = useQuery({ queryKey, queryFn: () => getMyReturnRequest(orderId), enabled: status === "delivered", retry: false });
  const [reason, setReason] = useState("damaged");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: () => createMyReturnRequest(orderId, { reason, details: details.trim() || undefined }),
    onSuccess: (request) => { queryClient.setQueryData(queryKey, request); setError(""); },
    onError: (err: unknown) => setError(getErrorMessage(err, "Could not submit the return request.")),
  });
  if (status !== "delivered") return null;
  if (query.isLoading) return <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">Loading return options…</div>;
  if (query.isError) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{getErrorMessage(query.error, "Could not load return details.")}</div>;

  const request = query.data;
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs" aria-labelledby="return-heading">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"><RotateCcw size={19} /></span>
        <div className="min-w-0 flex-1">
          <h2 id="return-heading" className="font-semibold text-gray-900">Returns & refunds</h2>
          <p className="mt-1 text-sm text-gray-600">Request a return for a delivered order. Zentro will review it and arrange any approved refund manually.</p>
          {request ? (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium text-gray-800">Request status</span><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-800">{request.status}</span></div>
              <p className="mt-2 text-sm text-gray-700">Reason: {request.reason.replaceAll("_", " ")}</p>
              {request.details && <p className="mt-1 text-sm text-gray-600">{request.details}</p>}
              {request.adminNote && <p className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-700"><span className="font-medium">Zentro’s note:</span> {request.adminNote}</p>}
              {(request.returnCarrier || request.returnTrackingNumber || request.returnEstimatedPickup) && <div className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-700"><p className="font-medium">Return pickup</p>{request.returnCarrier && <p>Courier: {request.returnCarrier}</p>}{request.returnTrackingNumber && <p>Tracking: <span className="font-mono">{request.returnTrackingNumber}</span></p>}{request.returnEstimatedPickup && <p>Estimated pickup: {new Date(request.returnEstimatedPickup).toLocaleDateString()}</p>}{request.returnTrackingUrl && <a href={request.returnTrackingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex font-semibold text-blue-700 underline">Track return parcel</a>}</div>}
              {request.status === "refunded" && <p className="mt-3 text-sm font-medium text-emerald-700">Manual refund recorded: LKR {(request.refundAmount ?? 0).toLocaleString()} by {request.refundMethod === "bank_transfer" ? "bank transfer" : "cash"}{request.refundReference ? ` (reference ${request.refundReference})` : ""}.</p>}
            </div>
          ) : (
            <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
              <label className="block text-sm font-medium text-gray-700">Why are you requesting a return?
                <select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="damaged">Item arrived damaged</option><option value="wrong_item">Wrong item received</option><option value="not_as_described">Item differs from description</option><option value="other">Other</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">Details <span className="font-normal text-gray-500">(optional)</span>
                <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1000} rows={3} placeholder="Tell us what happened so we can review your request." className="mt-1.5 block w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </label>
              {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={mutation.isPending} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{mutation.isPending ? "Submitting…" : "Submit return request"}</button>
              <p className="text-xs text-gray-500">Submitting a request does not guarantee approval. A member of the Zentro team will review it.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReturnRequestPanel;
