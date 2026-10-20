import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, MessageCircle, RefreshCw, Send } from "lucide-react";
import {
  getMyConversations,
  getSupportMessages,
  sendSupportMessage,
  startSupportConversation,
  type SupportConversation,
  type SupportMessage,
} from "../api/support";
import { getErrorMessage } from "../lib/errorMessage";
import { useAuthStore } from "../store/authStore";

const formatDate = (value: string) => new Date(value).toLocaleString();

const Support = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const conversationsKey = ["my-support-conversations", userId] as const;
  const conversationsQuery = useQuery({
    queryKey: conversationsKey,
    queryFn: getMyConversations,
    enabled: Boolean(userId),
  });
  const conversations = conversationsQuery.data ?? [];
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const selectedId = selectedRequestId || conversations[0]?._id || "";
  const messagesKey = ["support-messages", userId, selectedId] as const;
  const messagesQuery = useQuery({
    queryKey: messagesKey,
    queryFn: () => getSupportMessages(selectedId),
    enabled: Boolean(userId && selectedId),
  });
  const messages = messagesQuery.data ?? [];
  const loading = conversationsQuery.isLoading;
  const messagesLoading = messagesQuery.isLoading;
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [reply, setReply] = useState("");

  const handleStart = async (event: FormEvent) => {
    event.preventDefault();
    if (!firstMessage.trim()) return;
    setSending(true);
    setError("");
    try {
      const result = await startSupportConversation(subject.trim(), firstMessage.trim());
      queryClient.setQueryData<SupportConversation[]>(conversationsKey, (current = []) => [result.conversation, ...current]);
      setSelectedRequestId(result.conversation._id);
      queryClient.setQueryData<SupportMessage[]>(["support-messages", userId, result.conversation._id], [result.message]);
      setSubject("");
      setFirstMessage("");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not start a support request."));
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    setError("");
    try {
      const message = await sendSupportMessage(selectedId, reply.trim());
      queryClient.setQueryData<SupportMessage[]>(messagesKey, (current = []) => [...current, message]);
      setReply("");
      await queryClient.invalidateQueries({ queryKey: conversationsKey });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not send your message."));
    } finally {
      setSending(false);
    }
  };

  const selected = conversations.find((item) => item._id === selectedId);
  const queryError = conversationsQuery.isError
    ? getErrorMessage(conversationsQuery.error, "Could not load your support requests.")
    : messagesQuery.isError
      ? getErrorMessage(messagesQuery.error, "Could not load messages.")
      : "";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><LifeBuoy size={24} /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Customer support</h1><p className="text-sm text-gray-500">Send us a message and our team will get back to you.</p></div>
      </header>

      {(error || queryError) && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || queryError}</div>}

      <form onSubmit={handleStart} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Start a support request</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} placeholder="Subject (optional)" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          <input required value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} maxLength={4000} placeholder="How can we help?" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          <button disabled={sending || !firstMessage.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Send size={16} />Send</button>
        </div>
      </form>

      <div className="grid min-h-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:grid-cols-[300px_1fr]">
        <aside className="border-b border-gray-200 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3"><h2 className="text-sm font-semibold text-gray-800">Your requests</h2><button onClick={() => void conversationsQuery.refetch()} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Refresh requests"><RefreshCw size={15} /></button></div>
          {loading ? <p className="p-4 text-sm text-gray-500">Loading requests...</p> : conversations.length === 0 ? <p className="p-4 text-sm text-gray-500">Your support requests will appear here.</p> : conversations.map((item) => (
            <button key={item._id} onClick={() => setSelectedRequestId(item._id)} className={`block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${selectedId === item._id ? "bg-blue-50" : ""}`}>
              <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-gray-800">{item.subject}</span>{item.unreadCountUser > 0 && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] text-white">{item.unreadCountUser}</span>}</span>
              <span className="mt-1 flex items-center justify-between text-xs text-gray-500"><span>{new Date(item.lastMessageAt).toLocaleDateString()}</span><span className={item.status === "open" ? "text-emerald-700" : "text-gray-400"}>{item.status}</span></span>
            </button>
          ))}
        </aside>

        <section className="flex min-h-[520px] flex-col">
          {selected ? <>
            <div className="border-b border-gray-100 px-5 py-4"><h2 className="font-semibold text-gray-900">{selected.subject}</h2><p className="mt-1 text-xs capitalize text-gray-500">Request {selected.status}</p></div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/50 p-5">
              {messagesLoading ? <p className="text-sm text-gray-500">Loading messages...</p> : messages.map((message) => (
                <div key={message._id} className={`flex ${message.senderRole === "customer" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.senderRole === "customer" ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-800"}`}>
                    <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p><p className={`mt-1 text-[10px] ${message.senderRole === "customer" ? "text-blue-100" : "text-gray-400"}`}>{message.senderRole === "admin" ? "Zentro Support · " : "You · "}{formatDate(message.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
            {selected.status === "open" ? <form onSubmit={handleReply} className="flex gap-2 border-t border-gray-100 p-4"><input value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000} placeholder="Write a message..." className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /><button disabled={sending || !reply.trim()} className="rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700 disabled:opacity-50" aria-label="Send message"><Send size={17} /></button></form> : <p className="border-t border-gray-100 p-4 text-center text-sm text-gray-500">This request is closed. Start a new request if you need more help.</p>}
          </> : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-gray-500"><MessageCircle size={38} className="mb-3 text-gray-300" /><p className="font-medium">Select a support request</p><p className="mt-1 text-sm">Or start one above and our team can help.</p></div>}
        </section>
      </div>
    </div>
  );
};

export default Support;
