import { useEffect } from "react";
import { Bell, CheckCheck, MessageCircle, PackageCheck, CreditCard, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../store/notificationStore";
import type { UserNotification } from "../api/notifications";

const notificationIcon = (type: UserNotification["type"]) => {
  if (type === "payment") return CreditCard;
  if (type === "support") return MessageCircle;
  return PackageCheck;
};

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, load, markRead, markAllRead } = useNotificationStore();

  useEffect(() => { void load(); }, [load]);

  const openNotification = async (notification: UserNotification) => {
    await markRead(notification._id);
    if (notification.link.startsWith("/")) navigate(notification.link);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Bell size={23} /></div><div><h1 className="text-2xl font-bold text-gray-900">Notifications</h1><p className="text-sm text-gray-500">{unreadCount} unread updates for your account.</p></div></div>
        {unreadCount > 0 && <button onClick={() => void markAllRead()} className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><CheckCheck size={16} />Mark all as read</button>}
      </header>
      {error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17} />{error}</div>}
      {loading ? <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Loading notifications...</div> : notifications.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center"><Bell className="mx-auto mb-3 text-gray-300" size={34} /><h2 className="font-semibold text-gray-800">You’re all caught up</h2><p className="mt-1 text-sm text-gray-500">Order and support updates will appear here.</p></div>
      ) : <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">{notifications.map((notification) => {
        const Icon = notificationIcon(notification.type);
        return <button key={notification._id} onClick={() => void openNotification(notification)} className={`flex w-full gap-4 border-b border-gray-100 p-5 text-left transition last:border-b-0 hover:bg-gray-50 ${notification.readAt ? "" : "bg-blue-50/50"}`}>
          <span className={`mt-0.5 rounded-lg p-2 ${notification.readAt ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700"}`}><Icon size={18} /></span>
          <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="font-semibold text-gray-900">{notification.title}</span>{!notification.readAt && <span className="h-2 w-2 rounded-full bg-blue-600" />}</span><span className="mt-1 block text-sm text-gray-600">{notification.message}</span><span className="mt-2 block text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString()}</span></span>
        </button>;
      })}</div>}
    </div>
  );
};

export default Notifications;
