import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, RefreshCw, Send, ShieldCheck } from "lucide-react";
import {
  getAdminConversations,
  getAdminSupportMessages,
  sendAdminSupportMessage,
  setAdminSupportStatus,
  type SupportConversation,
  type SupportMessage,
} from "../../api/support";
import { getErrorMessage } from "../../lib/errorMessage";

const AdminSupport = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"open" | "closed" | "all">("open");
  const conversationsKey = ["admin-support-conversations", statusFilter] as const;
  const conversationsQuery = useQuery({
    queryKey: conversationsKey,
    queryFn: () => getAdminConversations(statusFilter),
  });
  const conversations = conversationsQuery.data ?? [];
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const selectedId = selectedRequestId || conversations[0]?._id || "";
  const messagesKey = ["admin-support-messages", selectedId] as const;
  const messagesQuery = useQuery({
    queryKey: messagesKey,
    queryFn: () => getAdminSupportMessages(selectedId),
    enabled: Boolean(selectedId),
  });
  const messages = messagesQuery.data ?? [];
  const [reply, setReply] = useState("");
  const loading = conversationsQuery.isLoading;
  const messagesLoading = messagesQuery.isLoading;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selected = conversations.find((conversation) => conversation._id === selectedId);
  const customer = selected && typeof selected.user === "object" ? selected.user : null;

  const handleReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setSaving(true);
    setError("");
    try {
      const message = await sendAdminSupportMessage(selected._id, reply.trim());
      queryClient.setQueryData<SupportMessage[]>(messagesKey, (current = []) => [...current, message]);
      setReply("");
      await queryClient.invalidateQueries({ queryKey: conversationsKey });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not send the reply."));
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await setAdminSupportStatus(selected._id, selected.status === "open" ? "closed" : "open");
      queryClient.setQueryData<SupportConversation[]>(conversationsKey, (current = []) => current.map((item) => item._id === updated._id ? updated : item));
      await queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not update this request."));
    } finally {
      setSaving(false);
    }
  };

  const queryError = conversationsQuery.isError
    ? getErrorMessage(conversationsQuery.error, "Could not load support inbox.")
    : messagesQuery.isError
      ? getErrorMessage(messagesQuery.error, "Could not load messages.")
      : "";

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><LifeBuoy size={23} /></div><div><h1 className="text-2xl font-bold text-gray-900">Customer support</h1><p className="text-sm text-gray-500">Review customer requests and reply from the Zentro team.</p></div></header>
      {(error || queryError) && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || queryError}</div>}

      <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-gray-200 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 border-b border-gray-100 p-4">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="open">Open requests</option><option value="closed">Closed requests</option><option value="all">All requests</option></select>
            <button onClick={() => void conversationsQuery.refetch()} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50" aria-label="Refresh inbox"><RefreshCw size={16} /></button>
          </div>
          {loading ? <p className="p-4 text-sm text-gray-500">Loading inbox...</p> : conversations.length === 0 ? <p className="p-5 text-sm text-gray-500">No {statusFilter === "all" ? "support" : statusFilter} requests.</p> : conversations.map((conversation) => {
            const user = typeof conversation.user === "object" ? conversation.user : null;
            return <button key={conversation._id} onClick={() => setSelectedRequestId(conversation._id)} className={`block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${selectedId === conversation._id ? "bg-blue-50" : ""}`}>
              <span className="flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold text-gray-800">{conversation.subject}</span>{conversation.unreadCountAdmin > 0 && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] text-white">{conversation.unreadCountAdmin}</span>}</span>
              <span className="mt-1 block truncate text-xs text-gray-500">{user?.name || "Customer"} · {user?.email || ""}</span>
              <span className="mt-1 block text-[11px] text-gray-400">{new Date(conversation.lastMessageAt).toLocaleString()}</span>
            </button>;
          })}
        </aside>

        <section className="flex min-h-[620px] flex-col">
          {selected ? <>
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4"><div className="min-w-0"><h2 className="truncate font-semibold text-gray-900">{selected.subject}</h2><p className="mt-1 truncate text-xs text-gray-500">{customer?.name || "Customer"} {customer?.email ? `· ${customer.email}` : ""}</p></div><button onClick={() => void handleStatus()} disabled={saving} className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${selected.status === "open" ? "border-gray-200 text-gray-700 hover:bg-gray-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>{selected.status === "open" ? "Close request" : "Reopen request"}</button></div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/50 p-5">
              {messagesLoading ? <p className="text-sm text-gray-500">Loading messages...</p> : messages.map((message) => <div key={message._id} className={`flex ${message.senderRole === "admin" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.senderRole === "admin" ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-800"}`}><p className="whitespace-pre-wrap break-words text-sm">{message.content}</p><p className={`mt-1 text-[10px] ${message.senderRole === "admin" ? "text-blue-100" : "text-gray-400"}`}>{message.senderRole === "admin" ? "You · " : `${customer?.name || "Customer"} · `}{new Date(message.createdAt).toLocaleString()}</p></div></div>)}
            </div>
            {selected.status === "open" ? <form onSubmit={handleReply} className="flex gap-2 border-t border-gray-100 p-4"><input value={reply} onChange={(event) => setReply(event.target.value)} maxLength={4000} placeholder="Write a helpful reply..." className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /><button disabled={saving || !reply.trim()} aria-label="Send reply" className="rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700 disabled:opacity-50"><Send size={17} /></button></form> : <p className="border-t border-gray-100 p-4 text-center text-sm text-gray-500"><ShieldCheck className="mr-1 inline" size={15} />Reopen this request to reply.</p>}
          </> : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-gray-500"><LifeBuoy size={38} className="mb-3 text-gray-300" /><p className="font-medium">Select a customer request</p><p className="mt-1 text-sm">New conversations will appear in this inbox.</p></div>}
        </section>
      </div>
    </div>
  );
};

export default AdminSupport;
